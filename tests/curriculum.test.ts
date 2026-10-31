// Level-content checks: Hebrew text, world order, budgets, places, the transfer levels' changed
// environments, the final level's missing scaffolds, and the acceptance item "no control can
// rotate or move the Earth, Sun or Moon". Reviewed against docs/curriculum/REVIEW.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SYNODIC_DAYS, dayKind, latLonToVec, sunDirection, wrap180 } from '../src/astro/astro';
import { LEVELS, WORLDS } from '../src/game/levels';
import { createSim, moonAgeAt, orbitL, step, sunDir, ticketChoices, type SimState } from '../src/game/sim';
import { NO_INPUT, type Input, type LevelDef, type ShotCtx } from '../src/game/types';

const HEBREW = /[א-ת]/;
const lvl = (id: number) => LEVELS.find((l) => l.id === id)!;
const nonTripodShots = (l: LevelDef) => l.shots.filter((s) => !s.tripod).length;

test('every level has Hebrew title, brief, rule, shot labels, hints and tutorial lines', () => {
  for (const l of LEVELS) {
    for (const [field, text] of [
      ['title', l.title],
      ['brief', l.brief],
      ['rule', l.rule],
    ] as const) {
      assert.ok(text.trim().length > 0, `L${l.id} ${field} empty`);
      assert.match(text, HEBREW, `L${l.id} ${field} has no Hebrew letters`);
    }
    assert.ok(l.brief.length >= 30 && l.rule.length >= 30, `L${l.id}: brief and rule are real sentences`);
    for (const s of l.shots) assert.match(s.label, HEBREW, `L${l.id} shot ${s.id} label`);
    if (l.hint !== null) assert.match(l.hint, HEBREW, `L${l.id} hint`);
    for (const t of l.tutorial ?? []) assert.match(t, HEBREW, `L${l.id} tutorial`);
    for (const p of l.places) assert.match(p.name, HEBREW, `L${l.id} place ${p.id} name`);
  }
});

test('18 levels in four worlds, in order, each world with its own module and a transfer level at the end', () => {
  assert.equal(LEVELS.length, 18);
  LEVELS.forEach((l, i) => assert.equal(l.id, i + 1));
  for (let i = 1; i < LEVELS.length; i++) assert.ok(LEVELS[i].world >= LEVELS[i - 1].world, 'worlds never go backwards');
  assert.ok(LEVELS.every((l) => [1, 2, 3, 4].includes(l.world)));
  const lastOfWorld = [1, 2, 3, 4].map((w) => Math.max(...LEVELS.filter((l) => l.world === w).map((l) => l.id)));
  assert.deepEqual(lastOfWorld, [5, 10, 14, 18], 'transfer levels 5, 10, 14, 18 close their worlds');
  assert.deepEqual(
    WORLDS.map((w) => w.module),
    ['earth-rotation', 'earth-revolution', 'sun-energy', 'moon-and-tides'],
  );
});

test('budgets, film and commitments are consistent with each level’s shots', () => {
  for (const l of LEVELS) {
    const n = nonTripodShots(l);
    assert.ok(l.budgetHours > 0 && Number.isFinite(l.budgetHours), `L${l.id} budget`);
    assert.ok(l.rate > 0 && l.rate <= 2, `L${l.id} clock pace`);
    if (n === 0) {
      assert.equal(l.film, 0, `L${l.id}: no camera shots, no film`);
      assert.ok(l.shots.length > 0 || ['tokens', 'whereami'].includes(l.special?.kind ?? ''), `L${l.id}: something to win`);
    } else {
      assert.ok(l.film >= n, `L${l.id}: film ${l.film} covers ${n} shots`);
      assert.ok(l.film <= 2 * n + 4, `L${l.id}: film ${l.film} too generous for ${n} shots (brute force)`);
    }
    assert.equal(new Set(l.shots.map((s) => s.id)).size, l.shots.length, `L${l.id} shot ids unique`);
    if (l.tickets) {
      assert.ok(l.tickets.count >= 1 && l.tickets.options.length >= 1, `L${l.id} tickets`);
      assert.ok(l.places.some((p) => p.id === l.tickets!.station), `L${l.id}: ticket station ${l.tickets.station} is a place`);
      // Every ticket on the timetable goes forward in time.
      for (const c of ticketChoices(createSim(l))) assert.ok(c.days >= 1, `L${l.id}: ticket ${c.label} goes forward`);
    }
    if (l.sleep) assert.ok(l.sleep.maxHours > 0 && l.sleep.maxHours <= 24, `L${l.id} sleep pod`);
    if (l.parCommits !== undefined) {
      const max = (l.tickets?.count ?? 0) + (l.sleep ? 99 : 0);
      assert.ok(l.parCommits >= 0 && l.parCommits <= max, `L${l.id}: par ${l.parCommits} reachable`);
    }
  }
});

test('every place, start point and special coordinate is a valid latitude/longitude', () => {
  const valid = (lat: number, lon: number, what: string) => {
    assert.ok(Number.isFinite(lat) && lat >= -90 && lat <= 90, `${what}: lat ${lat}`);
    assert.ok(Number.isFinite(lon) && lon > -180 && lon <= 180, `${what}: lon ${lon}`);
  };
  for (const l of LEVELS) {
    valid(l.start.lat, l.start.lon, `L${l.id} start`);
    assert.ok(l.start.L >= 0 && l.start.L < 360, `L${l.id} start date`);
    if (l.start.moonAge !== undefined) assert.ok(l.start.moonAge >= 0 && l.start.moonAge < SYNODIC_DAYS, `L${l.id} moon age`);
    assert.ok(l.start.battery > 0 && l.start.battery <= 100, `L${l.id} battery`);
    assert.equal(new Set(l.places.map((p) => p.id)).size, l.places.length, `L${l.id} place ids unique`);
    for (const p of l.places) {
      valid(p.lat, p.lon, `L${l.id} ${p.id}`);
      assert.ok(p.radius > 0 && p.radius < 10, `L${l.id} ${p.id} radius`);
    }
    const sp = l.special;
    if (sp?.kind === 'tokens') sp.lons.forEach((lon) => valid(sp.lat, lon, `L${l.id} token`));
    if (sp?.kind === 'whereami') sp.rounds.forEach((r) => valid(r.lat, r.lon, `L${l.id} round`));
    if (sp?.kind === 'causeway') {
      valid(sp.from.lat, sp.from.lon, `L${l.id} causeway from`);
      valid(sp.to.lat, sp.to.lon, `L${l.id} causeway to`);
    }
    for (const r of l.rails ?? []) assert.ok(Math.abs(r) < 90, `L${l.id} rail`);
  }
  // Real places sit where they are (rounded): spot-check the ones the rules depend on.
  const find = (id: string) => LEVELS.flatMap((l) => l.places).find((p) => p.id === id)!;
  assert.ok(Math.abs(find('jerusalem').lat - 31.78) < 0.1);
  assert.ok(find('fiji').lon > 170 && find('samoa').lon < -165, 'Fiji west of the date line, American Samoa east of it');
  assert.ok(find('gate-tropic').lat === 23.5 && find('gate-eq').lat === 0);
  assert.ok(find('cabin').lat > 66.5, 'the Lapland cabin is north of the Arctic Circle');
  assert.ok(find('sydney').lat < 0 && find('hermon').lat > 0, 'opposite hemispheres');
});

test('transfer levels change the environment, not just the numbers', () => {
  // L5: the date line. Its places straddle 180°, and no earlier level comes near it.
  const l5 = lvl(5);
  assert.ok(l5.places.some((p) => p.lon > 170) && l5.places.some((p) => p.lon < -170), 'L5 straddles the date line');
  for (const l of LEVELS.filter((x) => x.world === 1 && x.id < 5)) {
    assert.ok(l.places.every((p) => Math.abs(p.lon) < 150) && Math.abs(l.start.lon) < 150, `L${l.id} stays away from 180°`);
  }
  // L10: no clock, only the sundial, and unlabelled tickets, while earlier World 2 levels have both.
  const l10 = lvl(10);
  assert.equal(l10.clock, 'sundial');
  assert.equal(l10.tickets?.unlabeled, true);
  assert.ok(ticketChoices(createSim(l10)).every((c) => c.label === ''), 'no date names on the L10 timetable');
  for (const l of LEVELS.filter((x) => x.world === 2 && x.id < 10)) {
    assert.equal(l.clock, 'local', `L${l.id} has a clock`);
    assert.ok(!l.tickets?.unlabeled, `L${l.id} tickets are labelled`);
    assert.ok(ticketChoices(createSim(l)).every((c) => c.label !== ''), `L${l.id} timetable has date names`);
  }
  // L14: polar night at the start and deep snow off the rails, unlike every earlier World 3 level.
  const l14 = lvl(14);
  assert.equal(dayKind(l14.start.lat, l14.start.L), 'polar-night');
  assert.ok((l14.groundSpeed ?? 1) < 1, 'deep snow');
  for (const l of LEVELS.filter((x) => x.world === 3 && x.id < 14)) {
    assert.notEqual(dayKind(l.start.lat, l.start.L), 'polar-night', `L${l.id} starts with a sunrise`);
    assert.ok((l.groundSpeed ?? 1) >= 1, `L${l.id} normal ground`);
  }
  // L18: no hint, unlabelled timetable, and shots that need the Sun and the Moon.
  const l18 = lvl(18);
  assert.equal(l18.hint, null);
  assert.equal(l18.hintOverlay, undefined);
  assert.equal(l18.tickets?.unlabeled, true);
  assert.ok(ticketChoices(createSim(l18)).every((c) => c.label === ''), 'nothing labelled on the final timetable');
  for (const l of LEVELS.filter((x) => x.id < 18)) assert.notEqual(l.hint, null, `L${l.id} still has a hint`);
  assert.ok(l18.shots.length >= 3, 'the final mixes several events');
});

test('the final level 18 has no hint and unlabelled instruments', () => {
  const l18 = lvl(18);
  assert.equal(l18.hint, null);
  assert.equal(l18.tickets?.unlabeled, true);
  // The hint key does nothing in the final.
  const st = createSim(l18);
  step(st, { ...NO_INPUT, hint: true }, 1 / 30);
  assert.equal(st.hintsUsed, 0);
  assert.equal(st.hintOn, false);
});

test('real-city time levels state the zone rule on screen (the DST caveat)', () => {
  const l4 = lvl(4);
  assert.equal(l4.clock, 'home', 'the player sees only the home clock');
  assert.match(l4.rule, /15°/);
  assert.match(l4.rule, /6 שעות/);
  assert.match(l4.rule, /UTC\+0/, 'real offsets stated');
});

test('spring/neap tides are not in the Workbook module: the L16 hint labels them העשרה', () => {
  assert.match(lvl(16).hint ?? '', /העשרה/);
});

test('spring/neap tides in the L16 failure line are labelled העשרה', () => {
  const l16 = lvl(16);
  const f = { kind: 'wave' as const, lat: 49.6, lon: -1.5, utc: 0, L: 0, moonAge: 0, localTime: 0 };
  const text = l16.explain(f);
  if (/מולד|ירח מלא/.test(text)) assert.match(text, /העשרה/, `L16 wave explanation uses spring tides: ${text}`);
});

// ------------------------------------------------------------------ known text bugs (REVIEW.md E)
// Fixed in levels.ts; kept as regression tests.

const ctx = (over: Partial<ShotCtx>): ShotCtx => ({
  lat: 0,
  lon: 0,
  utc: 12,
  L: 90,
  moonAge: 0,
  spin: 1,
  localTime: 12,
  localDay: 0,
  facing: 180,
  sun: { elevation: 60, azimuth: 180 },
  moon: { elevation: 60, azimuth: 180 },
  place: null,
  battery: 50,
  taken: {},
  viaTripod: false,
  ...over,
});

test('L17 off-node message is grammatical in both directions', () => {
  const check = lvl(17).shots[0].check;
  for (const L of [100, 300]) {
    const r = check(ctx({ L, moonAge: 0 }));
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.why, /נטוי 5°/);
      assert.doesNotMatch(r.why, /מעלשמש/, r.why);
    }
  }
});

test('L8 midnight message never says "-0° below the horizon"', () => {
  const check = lvl(8).shots[0].check;
  const cabin = lvl(8).places.find((p) => p.id === 'cabin')!;
  for (const elevation of [0.2, 0, -0.3]) {
    const r = check(ctx({ place: cabin, lat: cabin.lat, lon: cabin.lon, localTime: 0, sun: { elevation, azimuth: 0 }, facing: 0 }));
    if (!r.ok) assert.doesNotMatch(r.why, /-0°|\b0° מתחת/, r.why);
  }
});

test('L16 brief does not read as "half the path"', () => {
  assert.doesNotMatch(lvl(16).brief, /^חצי את/);
});

// ------------------------------------------------------------------ acceptance: no control moves the sky

/** Small deterministic PRNG (mulberry32) so the fuzz is reproducible. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('Input has no control for the Earth, the Sun, the Moon or the clock’s direction', () => {
  const keys = Object.keys(NO_INPUT).sort();
  assert.deepEqual(keys, ['declareImpossible', 'forward', 'gear', 'hint', 'jump', 'plant', 'shoot', 'sleep', 'ticket', 'turn']);
  for (const k of keys) assert.doesNotMatch(k, /orbit|moon|spin|rotate|dial|scrub|rewind|fast|ff|date|season|tilt/i, k);
});

test('no control can rotate or move the Earth, Sun or Moon: the sky is always a function of the forward-only clock', () => {
  for (const level of LEVELS) {
    const rand = rng(level.id * 7919);
    const st: SimState = createSim(level);
    // Stand at the ticket station so the fuzz also buys tickets (a test shortcut, not a control).
    const stationPlace = level.places.find((p) => p.id === level.tickets?.station);
    if (stationPlace) st.pos = latLonToVec(stationPlace.lat, stationPlace.lon);
    let prevUtc = st.utc;
    for (let i = 0; i < 900 && (st.mode === 'play' || st.mode === 'tripod'); i++) {
      const input: Input = {
        ...NO_INPUT,
        forward: rand() < 0.5 ? rand() * 2 - 1 : 0,
        turn: rand() < 0.3 ? rand() * 2 - 1 : 0,
        jump: rand() < 0.03,
        shoot: rand() < 0.02,
        sleep: rand() < 0.02 ? Math.round(rand() * 80 - 20) : 0, // includes negative and over-long requests
        ticket: rand() < 0.03 ? Math.floor(rand() * 16) - 2 : -1, // includes -2 and out-of-range indices
        plant: rand() < 0.01,
        hint: rand() < 0.01,
        gear: rand() < 0.005 ? Math.floor(rand() * 4) - 1 : -1,
        declareImpossible: rand() < 0.005,
      };
      step(st, input, 1 / 30);
      assert.ok(st.utc >= prevUtc - 1e-12, `L${level.id}: the clock never goes back (${prevUtc} → ${st.utc})`);
      prevUtc = st.utc;
      assert.ok(Math.abs(wrap180(st.L - orbitL(level, st.utc))) < 1e-9, `L${level.id}: the date follows the clock`);
      assert.ok(Math.abs(st.moonAge - moonAgeAt(level, st.utc)) < 1e-9, `L${level.id}: the Moon follows the clock`);
      const dreaming = level.special?.kind === 'dream' && st.dream;
      assert.equal(st.spin, dreaming ? -1 : level.spin ?? 1, `L${level.id}: only the scripted dream reverses the spin`);
      const s = sunDir(st);
      const expect = sunDirection(st.utc, orbitL(level, st.utc), st.spin);
      assert.ok(Math.abs(s.x - expect.x) + Math.abs(s.y - expect.y) + Math.abs(s.z - expect.z) < 1e-9, `L${level.id}: Sun from the clock alone`);
    }
  }
});

test('a negative sleep or an invalid ticket does nothing', () => {
  for (const level of LEVELS.filter((l) => l.sleep || l.tickets)) {
    const a = createSim(level);
    const b = createSim(level);
    const station = level.places.find((p) => p.id === level.tickets?.station);
    if (station) a.pos = b.pos = latLonToVec(station.lat, station.lon);
    step(a, { ...NO_INPUT, sleep: -12, ticket: 999 }, 1 / 30);
    step(b, NO_INPUT, 1 / 30);
    assert.equal(a.utc, b.utc, `L${level.id}`);
    assert.equal(a.ticketsUsed, 0);
  }
});
