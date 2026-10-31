// Every authored level is solved by a scripted player using only the game's inputs, and the
// naive strategies the level is designed to defeat fail.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { angularDistance, phaseIndex, solarEclipseCenter, tideHeight } from '../src/astro/astro';
import { causewayTide } from '../src/game/sim';
import { LEVELS } from '../src/game/levels';
import { Bot } from './bot';

const won = (b: Bot) => assert.equal(b.st.mode, 'won', `expected win, got ${b.st.mode}: ${JSON.stringify(b.st.events.slice(-3))}`);
const lastText = (b: Bot) => b.st.events.at(-1)?.text ?? '';

test('there are exactly 18 levels with ids 1..18 in four worlds', () => {
  assert.deepEqual(
    LEVELS.map((l) => l.id),
    Array.from({ length: 18 }, (_, i) => i + 1),
  );
  assert.deepEqual([...new Set(LEVELS.map((l) => l.world))], [1, 2, 3, 4]);
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
  w.waitUntil((c) => c.sun.elevation > 0.2, false, 60);
  assert.equal(w.st.mode, 'failed');
  assert.equal(w.st.fail?.kind, 'battery');
});

test('L2 sunrise in the east, sunset in the west, mirror sunrise in the west', () => {
  const b = new Bot(2);
  b.waitUntil((c) => c.sun.elevation > 0.5 && c.localTime < 12);
  b.faceSun();
  assert.ok(Math.abs(b.ctx().sun.azimuth - 90) < 10, 'sunrise near east');
  b.shoot();
  b.face(270);
  b.waitUntil((c) => c.sun.elevation < 3 && c.localTime > 12);
  b.faceSun();
  assert.ok(Math.abs(b.ctx().sun.azimuth - 270) < 10, 'sunset near west');
  b.shoot();
  assert.equal(b.st.dream, true);
  b.face(270);
  b.press({ plant: true });
  b.waitUntil((_c, st) => st.mode !== 'tripod', false, 120);
  won(b);

  const wrong = new Bot(2);
  wrong.waitUntil((c) => c.sun.elevation > 0.5 && c.localTime < 12);
  wrong.faceSun();
  wrong.shoot();
  wrong.face(270);
  wrong.waitUntil((c) => c.sun.elevation < 3 && c.localTime > 12);
  wrong.faceSun();
  wrong.shoot();
  wrong.face(90);
  wrong.press({ plant: true });
  wrong.waitUntil((_c, st) => st.mode !== 'tripod', false, 120);
  assert.equal(wrong.st.mode, 'failed');
  assert.equal(wrong.st.fail?.kind, 'tripod');
});

test('L3 surfing the dawn on the rail collects all 8 tokens; sprinting flat out runs into the night', () => {
  const b = new Bot(3);
  b.press({ jump: true });
  b.waitUntil((_c, st) => st.grinding !== null, false, 3);
  assert.equal(b.st.grinding, 50);
  for (let i = 0; i < 30 * 60 && b.alive; i++) {
    const e = b.ctx().sun.elevation;
    b.tick({ forward: e > -1 ? 1 : 0 });
  }
  won(b);

  const sprint = new Bot(3);
  sprint.press({ jump: true });
  for (let i = 0; i < 30 * 60 && sprint.alive; i++) sprint.tick({ forward: 1 });
  assert.equal(sprint.st.mode, 'failed');

  const wait = new Bot(3);
  wait.waitUntil(() => false, false, 30);
  assert.equal(wait.st.mode, 'failed', 'the twilight leaves you behind');
});

test('L4 compute the 6-hour offset: Dhaka at 14:00 there; waiting for 14:00 on your watch ends in the dark', () => {
  const b = new Bot(4);
  assert.ok(b.goTo(23.8, 90, 1));
  b.waitUntil((c) => c.localTime >= 13.75);
  b.shoot();
  won(b);

  const naive = new Bot(4);
  naive.waitUntil((_c, st) => st.utc >= 14, true);
  naive.goTo(23.8, 90, 1);
  naive.shoot();
  assert.match(lastText(naive), /לילה/);
  naive.waitUntil(() => false, true, 200);
  assert.equal(naive.st.mode, 'failed');
  assert.equal(naive.st.fail?.kind, 'battery');
  assert.match(naive.st.level.explain(naive.st.fail!), /6 שעות/);

  const rush = new Bot(4);
  rush.goTo(23.8, 90, 1);
  rush.shoot();
  assert.equal(rush.st.events.at(-1)?.kind, 'shot-miss', 'arriving at full speed is not the answer');
});

test('L5 two birthdays: Fiji at 20:00, then cross the date line east and wait for Samoa’s 31 October evening', () => {
  const b = new Bot(5);
  b.waitUntil((c) => c.localTime >= 19.8 && c.localDay === 0);
  b.shoot();
  assert.ok(b.st.taken.fiji);
  assert.ok(b.goTo(-14.3, -170.7, 1));
  b.shoot();
  assert.match(lastText(b), /30 באוקטובר/);
  b.waitUntil((c) => c.localDay === 0 && c.localTime >= 19.8);
  b.shoot();
  won(b);

  const west = new Bot(5);
  west.waitUntil((c) => c.localTime >= 19.8 && c.localDay === 0);
  west.shoot();
  // Run east forever: you never get the date back by running.
  for (let i = 0; i < 30 * 40 && west.alive; i++) west.tick({ forward: 1 });
  assert.notEqual(west.st.mode, 'won');
});

// ------------------------------------------------------------- World 2

test('L6 January is closest to the Sun, yet Hermon has snow and Sydney has summer on the same date', () => {
  const b = new Bot(6);
  for (let i = 0; i < 3; i++) b.press({ orbitStep: 1 });
  assert.ok(Math.abs(b.st.L - 270) < 0.5);
  assert.ok(b.goTo(33.4, 35.8, 0.8));
  b.waitUntil((c) => c.sun.elevation > 10 && c.localTime < 12);
  b.shoot();
  assert.ok(b.st.taken.hermon, lastText(b));
  assert.ok(b.goTo(-33.9, 151.2, 1));
  b.waitUntil((c) => c.sun.elevation > 6);
  b.shoot();
  won(b);

  const summer = new Bot(6);
  for (let i = 0; i < 3; i++) summer.press({ orbitStep: -1 });
  summer.goTo(33.4, 35.8, 0.8);
  summer.waitUntil((c) => c.sun.elevation > 10);
  summer.shoot();
  assert.match(lastText(summer), /אין שלג/);
});

test('L7 equinox noon melts the equator gate, June noon the tropic gate; the 40°N gate never melts', () => {
  const b = new Bot(7);
  assert.ok(b.goTo(0, 33, 0.8));
  b.waitUntil((c) => c.sun.elevation >= 87.5, true);
  b.shoot();
  assert.ok(b.st.taken['gate-eq'], lastText(b));
  for (let i = 0; i < 3; i++) b.press({ orbitStep: 1 });
  assert.ok(b.goTo(23.5, 33, 0.8));
  b.shoot();
  assert.equal(b.st.events.at(-1)?.kind, 'shot-miss');
  b.waitUntil((c) => c.sun.elevation >= 87.5, true);
  b.shoot();
  won(b);

  const north = new Bot(7);
  for (let i = 0; i < 3; i++) north.press({ orbitStep: 1 });
  north.goTo(40, 33, 0.8);
  north.waitUntil((c) => c.localTime > 11.95 && c.localTime < 12.2, true);
  north.shoot();
  assert.match(lastText(north), /40°/);
});

test('L8 June gives the midnight sun; December brings polar night and the bear', () => {
  const b = new Bot(8);
  for (let i = 0; i < 3; i++) b.press({ orbitStep: 1 });
  assert.ok(b.goTo(69, 21, 0.8));
  b.waitUntil((c) => c.localTime >= 23.6, true);
  b.faceSun();
  b.shoot();
  won(b);

  const dec = new Bot(8);
  for (let i = 0; i < 3; i++) dec.press({ orbitStep: -1 });
  dec.goTo(69, 21, 0.8);
  dec.waitUntil(() => false, true, 60);
  assert.equal(dec.st.mode, 'failed');
  assert.ok(['bear', 'battery'].includes(dec.st.fail!.kind));
  assert.match(dec.st.level.explain(dec.st.fail!), /לילה קוטבי/);
});

test('L9 on the equinox both hemispheres have 12 hours of light', () => {
  const b = new Bot(9);
  for (let i = 0; i < 3; i++) b.press({ orbitStep: 1 });
  assert.ok(b.goTo(-25.6, 30.6, 0.8));
  b.waitUntil((c) => c.sun.elevation > 0.5 && c.localTime < 12);
  b.faceSun();
  b.shoot();
  assert.ok(b.st.taken.sunrise, lastText(b));
  assert.ok(b.goTo(51.2, -1.8, 0.8));
  b.waitUntil((c) => c.sun.elevation < 3 && c.localTime > 12);
  b.faceSun();
  b.shoot();
  won(b);

  const dec = new Bot(9);
  dec.goTo(-25.6, 30.6, 0.8);
  dec.waitUntil((c) => c.sun.elevation > 0.5 && c.localTime < 12);
  dec.faceSun();
  dec.shoot();
  assert.match(lastText(dec), /12 שעות/);
});

test('L10 four noon shadows from one hill, with an unlabeled dial', () => {
  const b = new Bot(10);
  b.waitUntil((c) => c.localTime >= 11.8);
  const plan: [number, number][] = [[-1, 1], [-1, 3], [-1, 3], [-1, 3]];
  for (const [dir, n] of plan) {
    for (let i = 0; i < n; i++) b.press({ orbitStep: dir as 1 | -1 });
    b.shoot();
  }
  won(b);
  const shadows = ['jun', 'mar', 'sep', 'dec'].map((k) => b.st.taken[k].value!);
  assert.ok(shadows[0] < shadows[1] && shadows[1] < shadows[3], `june < equinox < december: ${shadows}`);
});

// ------------------------------------------------------------- World 3

test('L11 the Tropic of Capricorn charges fastest on 21 December; staying in Finland fails', () => {
  const b = new Bot(11);
  assert.ok(b.goTo(-23.5, 25, 1));
  b.waitUntil((c) => c.sun.elevation >= 86.5, true);
  b.shoot();
  assert.ok(b.st.taken.circle, lastText(b));
  b.waitUntil((_c, st) => st.battery >= 98.5, false, 120);
  b.shoot();
  won(b);

  const stay = new Bot(11);
  stay.waitUntil(() => false, false, 200);
  assert.equal(stay.st.mode, 'failed');
});

test('L12 asphalt is hot, the fields are cooler, and dark lava under a low December Sun stays cold', () => {
  const b = new Bot(12);
  b.waitUntil((c) => c.localTime >= 10.5);
  b.shoot();
  assert.ok(b.st.taken.hot, lastText(b));
  assert.ok(b.goTo(31.1, 35.5, 0.5));
  b.shoot();
  assert.ok(b.st.taken.island, lastText(b));
  assert.ok(b.goTo(64, -19, 1.2));
  b.waitUntil((c) => c.sun.elevation > 0.5, true);
  b.shoot();
  won(b);

  const snow = new Bot(12);
  snow.goTo(33.4, 35.8, 0.4);
  snow.waitUntil((c) => c.localTime >= 11.5);
  snow.shoot();
  assert.match(lastText(snow), /°C/);
  assert.equal(snow.st.events.at(-1)?.kind, 'shot-miss', 'bright snow is not hot');
});

test('L13 shading at midday and trapping heat at night keeps the dome alive for a day; doing nothing fails', () => {
  const b = new Bot(13);
  for (let i = 0; i < 30 * 80 && b.alive; i++) {
    const gh = b.st.gh!;
    const e = b.ctx().sun.elevation;
    const wantShade = e > 0 && gh.temp > 25;
    const wantTrap = gh.temp < 26;
    b.tick({ toggleA: gh.shade !== wantShade, toggleB: gh.trap !== wantTrap });
  }
  won(b);

  const idle = new Bot(13);
  idle.waitUntil(() => false, false, 80);
  assert.equal(idle.st.mode, 'failed');
  assert.equal(idle.st.fail?.kind, 'greenhouse');
});

test('L14 stations at the equator, in Israel and at the southern polar circle match the cards', () => {
  const b = new Bot(14);
  for (const lat of [0, 31.8, -66.5]) {
    assert.ok(b.goTo(lat, 20, 0.5));
    b.press({ plant: true });
  }
  won(b);

  const north = new Bot(14);
  for (const lat of [0, 31.8, 66.5]) {
    north.goTo(lat, 20, 0.5);
    north.press({ plant: true });
  }
  assert.notEqual(north.st.mode, 'won', 'the northern polar circle has the opposite curve');
  assert.equal(north.st.stationMatch.c, null);
});

// ------------------------------------------------------------- World 4

test('L15 seven phases from one rooftop, and a full moon at noon is impossible', () => {
  const b = new Bot(15);
  for (let k = 1; k <= 7; k++) {
    b.press({ moonStep: 1 });
    assert.ok(b.waitUntil((c) => phaseIndex(c.moonAge) === k && c.moon.elevation > 8 && c.sun.elevation < -3), `phase ${k} visible`);
    b.faceMoon();
    b.shoot();
    assert.ok(b.st.taken[`p${k}`], `p${k}: ${lastText(b)}`);
  }
  b.press({ declareImpossible: true });
  won(b);

  const noon = new Bot(15);
  for (let k = 0; k < 4; k++) noon.press({ moonStep: 1 });
  noon.waitUntil((c) => Math.abs(c.localTime - 12) < 0.3);
  noon.shoot();
  assert.match(lastText(noon), /מתבאסת/);
});

test('L16 the causeway opens only at a spring low tide; the Mediterranean barely moves', () => {
  const b = new Bot(16);
  b.press({ moonStep: 1 });
  b.press({ moonStep: 1 });
  assert.equal(phaseIndex(b.st.moonAge + 0.05), 4);
  b.waitUntil((_c, st) => causewayTide(st) < -4.5);
  assert.ok(b.goTo(47.0, -1.5, 0.4), `crossed: ${b.st.mode}`);
  b.shoot();
  assert.ok(b.st.taken.island);
  assert.ok(b.goTo(32.08, 34.76, 1));
  b.waitUntil((c) => c.sun.elevation > 5);
  b.shoot();
  const t0 = b.st.utc;
  b.waitUntil((c, st) => st.utc - t0 > 3.2 && c.sun.elevation > 5);
  b.shoot();
  won(b);
  const d = Math.abs(b.st.taken.beach2.value! - b.st.taken.beach1.value!);
  assert.ok(d <= 0.3, `Mediterranean change ${d} m`);

  const neap = new Bot(16);
  let minTide = Infinity;
  for (let i = 0; i < 30 * 15; i++) {
    neap.tick({ fastForward: true });
    minTide = Math.min(minTide, causewayTide(neap.st));
  }
  assert.ok(minTide > -2.5, `neap low tide ${minTide} never opens the path`);

  const rush = new Bot(16);
  rush.goTo(47.0, -1.5, 0.4);
  assert.equal(rush.st.mode, 'failed');
  assert.equal(rush.st.fail?.kind, 'wave');
  void tideHeight;
});

test('L17 eclipse needs a new moon on the node line, then you run into the shadow', () => {
  const b = new Bot(17);
  b.press({ orbitStep: 1 });
  b.press({ moonStep: -1 });
  assert.equal(phaseIndex(b.st.moonAge + 0.05), 0);
  let shot = false;
  for (let i = 0; i < 30 * 30 && b.alive && !shot; i++) {
    const c = b.ctx();
    const center = solarEclipseCenter(c.utc, c.L, c.moonAge);
    if (center && angularDistance(c.lat, c.lon, center.lat, center.lon) < 5) {
      b.faceSun();
      b.shoot();
      shot = true;
    } else if (center) b.goTo(center.lat, center.lon, 4, DTS(1));
    else b.tick();
  }
  won(b);

  const offNode = new Bot(17);
  offNode.press({ moonStep: -1 });
  offNode.waitUntil((c) => c.sun.elevation > 30, false, 5);
  offNode.faceSun();
  offNode.shoot();
  assert.match(lastText(offNode), /5°/);
});

const DTS = (s: number) => s;

test('L18 the final: spring full moon, Jerusalem sunrise and a lunar eclipse from the night side', () => {
  const b = new Bot(18);
  for (let i = 0; i < 4; i++) b.press({ orbitStep: 1 });
  b.press({ moonStep: 1 });
  b.press({ moonStep: 1 });
  // The eclipse happens in about an hour: run west to the night side where the Moon is up.
  assert.ok(b.goTo(25, 125, 1));
  b.waitUntil((c) => c.moon.elevation > 10, false, 10);
  b.faceMoon();
  b.shoot();
  assert.ok(b.st.taken.eclipse, lastText(b));
  assert.ok(b.goTo(31.78, 35.22, 0.6));
  b.waitUntil((c) => c.moon.elevation > 10 && c.sun.elevation < -5);
  b.faceMoon();
  b.shoot();
  assert.ok(b.st.taken.fullmoon, lastText(b));
  b.waitUntil((c) => c.sun.elevation > 0.5 && c.localTime < 12);
  b.faceSun();
  b.shoot();
  won(b);
});
