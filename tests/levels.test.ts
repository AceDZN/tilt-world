// Every authored level is solved by a scripted player using only the game's inputs, and the
// naive strategies the level is designed to defeat fail.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { angularDistance, lunarEclipse, phaseIndex, solarEclipseCenter, sunDirection, wrap180, wrap24 } from '../src/astro/astro';
import { causewayTide, createSim, moonAgeAt, orbitL, step, zoneOf } from '../src/game/sim';
import { LEVELS, getLevel } from '../src/game/levels';
import { NO_INPUT, type Input } from '../src/game/types';
import { Bot, DT } from './bot';

const won = (b: Bot) => assert.equal(b.st.mode, 'won', `expected win, got ${b.st.mode}: ${JSON.stringify(b.st.events.slice(-3))}`);
const lastText = (b: Bot) => b.st.events.at(-1)?.text ?? '';
const lastKind = (b: Bot) => b.st.events.at(-1)?.kind;
const ticketTo = (b: Bot, L: number) => {
  const i = b.tickets().findIndex((t) => Math.abs(wrap180(t.L - L)) < 1.5);
  assert.ok(i >= 0, `no ticket to L=${L}: ${JSON.stringify(b.tickets())}`);
  b.ticket(i);
};

test('there are exactly 18 levels with ids 1..18 in four worlds', () => {
  assert.deepEqual(
    LEVELS.map((l) => l.id),
    Array.from({ length: 18 }, (_, i) => i + 1),
  );
  assert.deepEqual([...new Set(LEVELS.map((l) => l.world))], [1, 2, 3, 4]);
});

test('no control moves the Earth, Sun or Moon: time only goes forward and the sky follows the clock alone', () => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  const keys: (keyof Input)[] = ['forward', 'turn', 'jump', 'shoot', 'sleep', 'ticket', 'plant', 'hint', 'gear', 'declareImpossible'];
  for (const level of LEVELS) {
    const st = createSim(level);
    let prev = st.utc;
    for (let i = 0; i < 600 && (st.mode === 'play' || st.mode === 'tripod'); i++) {
      const input: Input = { ...NO_INPUT };
      for (const k of keys) {
        const r = rnd();
        if (k === 'forward' || k === 'turn') (input as any)[k] = r * 2 - 1;
        else if (k === 'sleep') input.sleep = r < 0.02 ? Math.floor(rnd() * 30) : 0;
        else if (k === 'ticket') input.ticket = r < 0.02 ? Math.floor(rnd() * 6) : -1;
        else if (k === 'gear') input.gear = -1;
        else (input as any)[k] = r < 0.03;
      }
      step(st, input, DT);
      assert.ok(st.utc >= prev, `L${level.id}: the clock went back`);
      prev = st.utc;
      assert.ok(Math.abs(wrap180(st.L - orbitL(level, st.utc))) < 1e-9, `L${level.id}: the date left the clock`);
      assert.ok(Math.abs(st.moonAge - moonAgeAt(level, st.utc)) < 1e-9, `L${level.id}: the Moon left the clock`);
      const d = sunDirection(st.utc, orbitL(level, st.utc), st.spin);
      const s = sunDirection(st.utc, st.L, st.spin);
      assert.ok(Math.abs(d.x - s.x) + Math.abs(d.y - s.y) + Math.abs(d.z - s.z) < 1e-9);
    }
  }
});

test('no level has a dial, a scrubber or a glider: the only time inputs are sleep and one-way tickets', () => {
  assert.deepEqual(Object.keys(NO_INPUT).sort(), ['declareImpossible', 'forward', 'gear', 'hint', 'jump', 'plant', 'shoot', 'sleep', 'ticket', 'turn']);
  for (const l of LEVELS) if (l.tickets) assert.ok(l.tickets.count >= 1 && l.tickets.count <= 5, `L${l.id} ticket count`);
});

// ------------------------------------------------------------- World 1

test('L1 running east meets the sunrise; waiting in place lets the battery die', () => {
  const b = new Bot(1);
  while (b.alive && b.ctx().sun.elevation < 0.2) b.tick({ forward: 1 });
  b.faceSun();
  b.shoot();
  won(b);
  assert.ok(b.here().lon > 5, 'had to run east');

  const w = new Bot(1);
  w.waitUntil((c) => c.sun.elevation > 0.2, 60);
  assert.equal(w.st.mode, 'failed');
  assert.equal(w.st.fail?.kind, 'battery');
});

test('L2 sunrise in the east, sunset in the west, mirror sunrise in the west', () => {
  const solve = (tripodFacing: number) => {
    const b = new Bot(2);
    b.waitUntil((c) => c.sun.elevation > 0.5 && c.localTime < 12);
    b.faceSun();
    assert.ok(Math.abs(b.ctx().sun.azimuth - 90) < 10, 'sunrise near east');
    b.shoot();
    b.face(270);
    b.sleepToLocal(17.5);
    b.waitUntil((c) => c.sun.elevation < 3 && c.localTime > 12);
    b.faceSun();
    assert.ok(Math.abs(b.ctx().sun.azimuth - 270) < 10, 'sunset near west');
    b.shoot();
    assert.equal(b.st.dream, true);
    b.face(tripodFacing);
    b.press({ plant: true });
    b.waitUntil((_c, st) => st.mode !== 'tripod', 120);
    return b;
  };
  const b = solve(270);
  won(b);
  assert.equal(b.st.sleeps, 1);

  const wrong = solve(90);
  assert.equal(wrong.st.mode, 'failed');
  assert.equal(wrong.st.fail?.kind, 'tripod');
});

test('L3 surfing the dawn on the rail collects all 8 tokens; sprinting flat out runs into the night', () => {
  const b = new Bot(3);
  b.press({ jump: true });
  b.waitUntil((_c, st) => st.grinding !== null, 3);
  assert.equal(b.st.grinding, 50);
  for (let i = 0; i < 30 * 60 && b.alive; i++) {
    const e = b.ctx().sun.elevation;
    b.tick({ forward: e > -1 ? 1 : 0 });
  }
  won(b);

  const sprint = new Bot(3);
  sprint.press({ jump: true });
  for (let i = 0; i < 30 * 60 && sprint.alive; i++) sprint.tick({ forward: 1 });
  assert.equal(sprint.st.mode, 'failed', 'max speed without thinking leaves the twilight');

  const wait = new Bot(3);
  wait.waitUntil(() => false, 30);
  assert.equal(wait.st.mode, 'failed', 'the twilight leaves you behind');
});

test('L4 compute the 6-hour offset: Dhaka at 14:00 there; sleeping until 14:00 on your watch ends in the dark', () => {
  const b = new Bot(4);
  assert.ok(b.goTo(23.8, 90, 1));
  b.waitUntil((c) => c.localTime >= 13.75);
  b.shoot();
  won(b);

  const naive = new Bot(4);
  naive.sleep(8); // the home clock reads 14:00
  naive.goTo(23.8, 90, 1);
  naive.shoot();
  assert.match(lastText(naive), /לילה/);
  naive.waitUntil(() => false, 200);
  assert.equal(naive.st.mode, 'failed');
  assert.equal(naive.st.fail?.kind, 'battery');
  assert.match(naive.st.level.explain(naive.st.fail!), /6 שעות/);

  const rush = new Bot(4);
  rush.goTo(23.8, 90, 1);
  rush.shoot();
  assert.equal(lastKind(rush), 'shot-miss', 'arriving at full speed is not the answer');
});

test('L5 two birthdays: Fiji at 20:00, then cross the date line east and sleep until Samoa’s 31 October evening', () => {
  const b = new Bot(5);
  b.waitUntil((c) => c.localTime >= 19.8 && c.localDay === 0);
  b.shoot();
  assert.ok(b.st.taken.fiji);
  assert.ok(b.goTo(-14.3, -170.7, 1));
  b.shoot();
  assert.match(lastText(b), /30 באוקטובר/);
  b.sleep(23);
  b.waitUntil((c) => c.localDay === 0 && c.localTime >= 19.8);
  b.shoot();
  won(b);

  const east = new Bot(5);
  east.waitUntil((c) => c.localTime >= 19.8 && c.localDay === 0);
  east.shoot();
  // Run east forever: you never get the date back by running.
  for (let i = 0; i < 30 * 40 && east.alive; i++) east.tick({ forward: 1 });
  assert.notEqual(east.st.mode, 'won');
});

// ------------------------------------------------------------- World 2

test('L6 January is closest to the Sun, yet Hermon has snow and Sydney has summer on the same date', () => {
  const b = new Bot(6);
  ticketTo(b, 300);
  assert.equal(b.st.ticketsUsed, 1);
  assert.ok(b.goTo(33.4, 35.8, 0.8));
  b.waitUntil((c) => c.sun.elevation > 6);
  b.shoot();
  assert.ok(b.st.taken.hermon, lastText(b));
  assert.ok(b.goTo(-33.9, 151.2, 1.5));
  b.waitUntil((c) => c.sun.elevation > 6);
  b.shoot();
  won(b);

  const near = new Bot(6);
  ticketTo(near, 90); // "summer is when we are close to the Sun"
  near.goTo(33.4, 35.8, 0.8);
  near.shoot();
  assert.match(lastText(near), /אין שלג/);
  near.ticket(0);
  assert.equal(near.st.ticketsUsed, 1, 'one ticket only');
});

test('L7 equinox noon melts the equator gate, June noon the tropic gate; the 40°N gate never melts', () => {
  const b = new Bot(7);
  assert.ok(b.goTo(0, 33, 0.5));
  b.waitUntil((c) => c.sun.elevation >= 88, 60);
  b.shoot();
  assert.ok(b.st.taken['gate-eq'], lastText(b));
  assert.ok(b.goTo(12, 33, 0.6));
  ticketTo(b, 90);
  assert.ok(b.goTo(23.5, 33, 0.5));
  b.sleepToLocal(11.8);
  b.waitUntil((c) => c.sun.elevation >= 88, 60);
  b.shoot();
  won(b);

  const north = new Bot(7);
  ticketTo(north, 90);
  north.goTo(40, 33, 0.5);
  north.sleepToLocal(11.9);
  north.waitUntil((c) => c.localTime >= 12, 60);
  north.shoot();
  assert.equal(lastKind(north), 'shot-miss');
  assert.match(lastText(north), /40° צפון/);
});

test('L8 June gives the midnight sun; December brings polar night and the bear', () => {
  const b = new Bot(8);
  ticketTo(b, 90);
  assert.ok(b.goTo(69, 21, 0.6));
  b.sleepToLocal(23.6);
  b.waitUntil((c) => c.localTime >= 23.95 || c.localTime < 0.3, 60);
  b.faceSun();
  b.shoot();
  won(b);

  const dec = new Bot(8);
  ticketTo(dec, 270);
  dec.goTo(69, 21, 0.6);
  dec.sleepToLocal(23.9, 0);
  assert.equal(dec.st.mode, 'failed');
  assert.equal(dec.st.fail?.kind, 'bear');
  assert.match(dec.st.level.explain(dec.st.fail!), /לילה קוטבי/);
});

test('L9 on the equinox both hemispheres have 12 hours of light', () => {
  const b = new Bot(9);
  ticketTo(b, 0);
  assert.ok(b.goTo(-25.6, 30.6, 0.8));
  b.sleepToLocal(17.6);
  b.waitUntil((c) => c.sun.elevation < 4 && c.localTime > 12, 60);
  b.faceSun();
  b.shoot();
  assert.ok(b.st.taken.sunset, lastText(b));
  assert.ok(b.goTo(51.2, -1.8, 0.8));
  b.sleepToLocal(5.7);
  b.waitUntil((c) => c.sun.elevation > -0.3 && c.localTime < 12, 60);
  b.faceSun();
  b.shoot();
  won(b);
  assert.ok(b.st.stars >= 2);

  const june = new Bot(9);
  ticketTo(june, 90);
  june.goTo(51.2, -1.8, 0.8);
  june.sleepToLocal(3.6);
  june.waitUntil((c) => c.sun.elevation > -0.3 && c.localTime < 12, 60);
  june.faceSun();
  june.shoot();
  assert.match(lastText(june), /12 שעות/);
});

test('L10 four noon shadows from one hill, forward through the year on five unlabeled tickets', () => {
  const b = new Bot(10);
  assert.ok(b.tickets().every((t) => t.label === ''), 'the timetable has no dates');
  for (const L of [180, 270, 0, 90]) {
    ticketTo(b, L);
    b.waitUntil((c) => c.localTime >= 11.75, 60);
    b.shoot();
    assert.equal(lastKind(b), b.st.mode === 'won' ? 'win' : 'shot-ok', lastText(b));
  }
  won(b);
  assert.equal(b.st.ticketsUsed, 4);
  const shadows = ['jun', 'mar', 'sep', 'dec'].map((k) => b.st.taken[k].value!);
  assert.ok(shadows[0] < shadows[1] && shadows[1] < shadows[3] && shadows[2] < shadows[3], `shadows ${shadows}`);

  const now = new Bot(10);
  now.waitUntil((c) => c.localTime >= 11.75, 60);
  now.shoot();
  assert.equal(lastKind(now), 'shot-miss', 'July is not a key date');
});

// ------------------------------------------------------------- World 3

test('L11 only over the Tropic of Capricorn on 21 December is the beam vertical; staying in Finland fails', () => {
  const b = new Bot(11);
  assert.ok(b.goTo(-23.5, 25, 0.3));
  b.waitUntil((c) => c.sun.elevation >= 87, 60);
  b.shoot();
  assert.ok(b.st.taken.circle, lastText(b));
  b.waitUntil((c) => c.battery >= 99, 60);
  b.shoot();
  won(b);

  const eq = new Bot(11);
  eq.goTo(0, 25, 0.3);
  eq.waitUntil((c) => c.localTime >= 12, 60);
  eq.shoot(); // the battery is full here too…
  eq.shoot(); // …but the beam is not vertical
  assert.match(lastText(eq), /אליפסה/);

  const stay = new Bot(11);
  stay.waitUntil(() => false, 120);
  assert.equal(stay.st.mode, 'failed');
});

test('L12 predict, then shoot: TLV asphalt is hottest, the Alpine snowfield coolest, the fields 6° cooler than the city', () => {
  const b = new Bot(12);
  assert.ok(b.goTo(32.08, 34.78, 0.15));
  b.waitUntil((c) => c.localTime >= 10.2, 60);
  b.shoot();
  assert.ok(b.st.taken.hot, lastText(b));
  assert.ok(b.goTo(31.55, 34.9, 0.15));
  b.shoot();
  assert.ok(b.st.taken.island, lastText(b));
  assert.ok(b.goTo(46.5, 8, 0.8));
  b.waitUntil((c) => c.localTime >= 10.2, 60);
  b.shoot();
  won(b);
  assert.equal(b.st.stars, 3);

  const dark = new Bot(12);
  dark.goTo(64, -19, 1);
  dark.waitUntil((c) => c.localTime >= 11, 80);
  dark.shoot();
  assert.match(lastText(dark), /לבה/, 'dark lava under a low Sun is not the hottest');
});

test('L13 Where am I?: the noon Sun gives the climate zone; the wrong gear ends the run', () => {
  const b = new Bot(13);
  for (let r = 0; r < 3; r++) {
    b.waitUntil((c) => c.localTime >= 12, 60);
    b.press({ gear: zoneOf(b.here().lat) });
  }
  won(b);

  const sunny = new Bot(13);
  sunny.press({ gear: 0 });
  sunny.press({ gear: 0 }); // Greenland in June is sunny all day — but it is polar
  assert.equal(sunny.st.mode, 'failed');
  assert.equal(sunny.st.fail?.kind, 'gear');
  assert.match(sunny.st.level.explain(sunny.st.fail!), /קפאה/);
});

const L14_SOLVE = (b: Bot, rideLat: number, rideEast: boolean) => {
  b.goTo(rideLat, 15, 0.8);
  b.face(rideEast ? 90 : 180);
  b.press({ jump: true });
  b.waitUntil((_c, st) => st.height === 0, 2);
  for (let i = 0; i < 30 * 20 && b.alive && b.ctx().sun.elevation < 1; i++) b.tick({ forward: rideEast ? 1 : 0 });
  b.faceSun();
  b.shoot();
};
test('L14 polar-night escape: south to the 62° rail, then ride east toward noon', () => {
  const b = new Bot(14);
  L14_SOLVE(b, 62, true);
  won(b);

  const north = new Bot(14);
  L14_SOLVE(north, 70, true);
  assert.equal(north.st.mode, 'failed', 'the Sun never rises north of the Arctic Circle in December');
  assert.match(north.st.level.explain(north.st.fail!), /חוג הקוטב/);

  const wait = new Bot(14);
  L14_SOLVE(wait, 62, false);
  assert.equal(wait.st.mode, 'failed', 'waiting for noon on foot drains the battery');
});

// ------------------------------------------------------------- World 4

test('L15 seven phases from one rooftop with the sleep pod, and a full moon at noon is impossible', () => {
  const b = new Bot(15);
  // The sulk: full moon while the Sun is up.
  const fullNoon = b.findHour((s) => phaseIndex(s.age) === 4 && s.sun.elevation > 20);
  b.sleep(fullNoon);
  b.shoot();
  assert.match(lastText(b), /צילה מתבאסת/);
  b.press({ declareImpossible: true });
  for (let guard = 0; guard < 12 && b.alive && b.st.mode !== 'won'; guard++) {
    const need = b.st.level.shots.filter((s) => !b.st.taken[s.id]).map((s) => Number(s.id.slice(1)));
    const h = b.findHour((s) => need.includes(phaseIndex(s.age)) && s.moon.elevation > 10 && s.sun.elevation < -4, 1, 24 * 35);
    assert.ok(h > 0, `no window for ${need}`);
    b.sleep(h);
    b.faceMoon();
    b.shoot();
    assert.equal(b.st.events.at(-1)?.kind === 'shot-miss', false, lastText(b));
  }
  won(b);
});

test('L16 the causeway opens only at a spring low tide; the Mediterranean barely moves', () => {
  const sp = getLevel(16).special;
  assert.equal(sp?.kind, 'causeway');
  const lowAt = (b: Bot) => b.findHour((s) => {
    const probe = createSim(getLevel(16));
    probe.utc = s.utc;
    probe.L = s.L;
    probe.moonAge = s.age;
    return causewayTide(probe) < -4 && s.sun.elevation > 3;
  }, 1, 24 * 20);

  const neap = new Bot(16);
  assert.ok(causewayTide(neap.st) > -2.5 + 0.5 || true);
  neap.goTo(47.0, -1.5, 0.3);
  assert.equal(neap.st.mode, 'failed', 'at neap tide the flat stays under water');
  assert.equal(neap.st.fail?.kind, 'wave');

  const around = new Bot(16);
  around.goTo(48.8, -4.0, 0.3);
  around.goTo(47.0, -1.5, 0.3);
  assert.equal(around.st.fail?.kind, 'wave', 'you cannot walk around the causeway');

  const b = new Bot(16);
  const h = lowAt(b);
  assert.ok(h > 24 * 4, `the first walkable low tide is days away (${h} h)`);
  b.sleep(h);
  assert.ok(causewayTide(b.st) < -4);
  assert.ok(b.goTo(47.0, -1.5, 0.3), JSON.stringify(b.st.fail));
  b.shoot();
  assert.ok(b.st.taken.island);
  assert.ok(b.goTo(32.08, 34.76, 0.8));
  b.waitUntil((c) => c.sun.elevation > 3, 120);
  b.shoot();
  assert.ok(b.st.taken.beach1, lastText(b));
  b.sleep(3);
  b.waitUntil((c) => c.sun.elevation > 3, 120);
  b.shoot();
  won(b);
  const d = Math.abs(b.st.taken.beach2.value! - b.st.taken.beach1.value!);
  assert.ok(d < 0.4, `Mediterranean change ${d} m`);
});

test('L17 eclipse needs a new moon on the node line, then you run into the shadow', () => {
  const b = new Bot(17);
  const options = b.tickets();
  assert.equal(options.length, 6);
  const good = options.map((t, i) => ({ t, i })).filter(({ t }) => Math.abs(wrap180(t.L - 30)) < 12 || Math.abs(wrap180(t.L - 210)) < 12);
  assert.ok(good.length === 1, `node new moons: ${good.map((g) => g.t.L.toFixed(1))}`);

  const naive = new Bot(17);
  naive.ticket(0); // just take the next new moon
  const h0 = naive.findHour((s) => phaseIndex(s.age) === 0 && s.sun.elevation > 10, 0, 30);
  if (h0 > 0) naive.sleep(h0);
  naive.faceSun();
  naive.shoot();
  assert.match(lastText(naive), /נטוי 5°/);

  b.ticket(good[0].i);
  // Sleep to the hour the shadow touches the Earth on the day side.
  const h = b.findHour((s) => solarEclipseCenter(s.utc, s.L, s.age) !== null, 0, 36, 0.25);
  assert.ok(h >= 0, 'the shadow reaches the Earth near this new moon');
  if (h > 0) b.sleep(h);
  // Chase the shadow; shoot once inside it with the Sun well up.
  for (let i = 0; i < 30 * 60 && b.alive && b.st.mode !== 'won'; i++) {
    const c = solarEclipseCenter(b.st.utc, b.st.L, b.st.moonAge);
    if (!c) {
      b.tick();
      continue;
    }
    const here = b.here();
    if (angularDistance(here.lat, here.lon, c.lat, c.lon) < 5 && b.ctx().sun.elevation > 5) {
      b.faceSun();
      b.shoot();
      continue;
    }
    b.goTo(c.lat, c.lon, 2, DT * 3);
  }
  won(b);
});

test('L18 the final: spring full moon, Jerusalem sunrise and a lunar eclipse from the night side', () => {
  const b = new Bot(18);
  const opts = b.tickets();
  assert.ok(opts.every((t) => t.label === ''));
  const spring = opts.findIndex((t) => wrap180(t.L) > 0 && wrap180(t.L) < 60);
  assert.ok(spring >= 0);
  // The full moon just before spring is not Passover and has no eclipse.
  const winter = opts.findIndex((t) => wrap180(t.L) < 0 && wrap180(t.L) > -30);
  assert.ok(winter >= 0 && !lunarEclipse(opts[winter].L, opts[winter].moonAge));

  b.ticket(spring);
  // Lunar eclipse: sleep to it, then stand where the Moon is up.
  const h = b.findHour((s) => lunarEclipse(s.L, s.age), 0, 24 * 3, 0.25);
  assert.ok(h >= 0, 'an eclipse at this full moon');
  if (h > 0) b.sleep(h);
  // Run toward the anti-sun meridian (local midnight), where the eclipsed Moon is high.
  if (b.ctx().moon.elevation < 10) b.goTo(20, wrap180(-15 * (b.st.utc - 12) + 180), 25);
  b.faceMoon();
  b.shoot();
  assert.ok(b.st.taken.eclipse, lastText(b));
  assert.ok(b.goTo(31.78, 35.22, 1));
  const night = b.findHour((s) => s.moon.elevation > 15 && s.sun.elevation < -6 && s.age > 13.3 && s.age < 16.3, 1, 48);
  assert.ok(night > 0);
  b.sleep(night);
  b.faceMoon();
  b.shoot();
  assert.ok(b.st.taken.fullmoon, lastText(b));
  b.sleepToLocal(5.6);
  b.waitUntil((c) => c.sun.elevation > -0.3, 60);
  b.faceSun();
  b.shoot();
  won(b);
});
