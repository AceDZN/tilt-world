// Rule tests for the pure astronomy/energy module. Each test states the curriculum fact it
// protects (Workbook grade 8, ch. 2 earth-rotation / earth-revolution / moon-and-tides,
// ch. 3 sun-energy / climate-zones) and would fail if the model drifted from it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALBEDO,
  angularDistance,
  batteryRate,
  beamSpread,
  civilTimeDifference,
  civilZone,
  dailyInsolation,
  dateLabel,
  dayKind,
  dayLength,
  declination,
  dot,
  eclipsePossibleAtNewMoon,
  greenhouseStep,
  illumination,
  insolationFactor,
  lFromDayOfYear,
  localDayIndex,
  localSolarTime,
  lunarEclipse,
  moonDirection,
  moonEclipticLatitude,
  moonPosition,
  noonElevation,
  phaseAge,
  phaseIndex,
  shadowLength,
  solarEclipseCenter,
  solarTimeDifference,
  subsolarPoint,
  sunDirection,
  sunDistanceAU,
  sunPosition,
  sunriseSunset,
  surfaceTemperature,
  tideHeight,
  utcForLocalTime,
  wrap180,
  wrap24,
  yearlyCurve,
  SYNODIC_DAYS,
} from '../src/astro/astro';

const near = (actual: number, expected: number, tol: number, msg = '') =>
  assert.ok(Math.abs(actual - expected) <= tol, `${msg} expected ${expected} ± ${tol}, got ${actual}`);

// Key dates as orbit longitude L (the Sun's ecliptic longitude).
const MAR = 0;
const JUN = 90;
const SEP = 180;
const DEC = 270;

const JERUSALEM = { lat: 31.78, lon: 35.22 };
const OSLO = { lat: 59.91, lon: 10.75 };
const TOKYO_LON = 139.69;

/** Scan a day (UTC hours) and return the first rise and set of a body above the horizon. */
function riseSet(elev: (utc: number) => number, from: number, hours = 30, step = 1 / 60) {
  let prev = elev(from);
  let rise: number | null = null;
  let set: number | null = null;
  for (let u = from + step; u <= from + hours; u += step) {
    const e = elev(u);
    if (rise === null && prev < 0 && e >= 0) rise = u;
    if (set === null && prev > 0 && e <= 0) set = u;
    prev = e;
  }
  return { rise, set };
}

const angleBetween = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) =>
  (Math.acos(Math.max(-1, Math.min(1, dot(a, b)))) * 180) / Math.PI;

// ------------------------------------------------------------------ rotation (earth-rotation)

test('rotation: 15° of longitude = 1 hour of local solar time, east is later', () => {
  for (const utc of [0, 5.5, 13.25, 23.9]) {
    for (const lon of [-150, -30, 0, 35.22, 120]) {
      const here = localSolarTime(utc, lon);
      near(wrap24(localSolarTime(utc, lon + 15) - here), 1, 1e-9, 'one zone east');
      near(wrap24(localSolarTime(utc, lon + 90) - here), 6, 1e-9, '90° east');
      near(wrap24(here - localSolarTime(utc, lon - 15)), 1, 1e-9, 'one zone west is earlier');
    }
  }
  near(localSolarTime(12, 0), 12, 1e-9, 'Greenwich at UTC noon');
  near(solarTimeDifference(0, 90), 6, 1e-9, 'Accra → Dhaka');
  // The subsolar point moves west 15° every hour (the Earth turns east under it).
  for (const utc of [0, 7, 15.5]) {
    near(wrap180(subsolarPoint(utc + 1, MAR).lon - subsolarPoint(utc, MAR).lon), -15, 1e-9, 'subsolar point drift');
  }
});

test('rotation: utcForLocalTime inverts localSolarTime and never returns a past moment', () => {
  for (const lon of [-170.7, -1.5, 0, 35.22, 90, 178.5]) {
    for (const local of [0, 6, 14, 20]) {
      const u = utcForLocalTime(local, lon, 10);
      assert.ok(u >= 10 - 1e-9 && u < 34, `after 10 h: ${u}`);
      near(localSolarTime(u, lon), local % 24, 1e-9, `local time at lon ${lon}`);
    }
  }
});

test('rotation: the Sun is highest at local solar noon, due south from Israel', () => {
  const { lat, lon } = JERUSALEM;
  const noon = utcForLocalTime(12, lon);
  const at = (h: number) => sunPosition(lat, lon, noon + h, MAR).elevation;
  assert.ok(at(0) > at(-1) && at(0) > at(1), 'noon is the daily maximum');
  near(sunPosition(lat, lon, noon, MAR).azimuth, 180, 0.5, 'noon azimuth');
});

test('apparent motion: the Sun rises in the east and sets in the west (and the reverse when the spin is reversed)', () => {
  for (const L of [MAR, JUN, SEP, DEC]) {
    for (const p of [JERUSALEM, { lat: -33.9, lon: 151.2 }, { lat: 5.6, lon: 0 }]) {
      const start = utcForLocalTime(0, p.lon); // local midnight: the Sun is down
      const real = riseSet((u) => sunPosition(p.lat, p.lon, u, L, 1).elevation, start);
      assert.ok(real.rise !== null && real.set !== null, 'rises and sets');
      const riseAz = sunPosition(p.lat, p.lon, real.rise!, L, 1).azimuth;
      const setAz = sunPosition(p.lat, p.lon, real.set!, L, 1).azimuth;
      assert.ok(riseAz > 0 && riseAz < 180, `real spin rises in the eastern half, got ${riseAz}`);
      assert.ok(setAz > 180 && setAz < 360, `real spin sets in the western half, got ${setAz}`);
      near(localSolarTime(real.rise!, p.lon), 12 - dayLength(p.lat, L) / 2, 0.05, 'sunrise in the morning');

      const mirror = riseSet((u) => sunPosition(p.lat, p.lon, u, L, -1).elevation, start);
      const mRise = sunPosition(p.lat, p.lon, mirror.rise!, L, -1).azimuth;
      const mSet = sunPosition(p.lat, p.lon, mirror.set!, L, -1).azimuth;
      assert.ok(mRise > 180 && mRise < 360, `mirror world rises in the west, got ${mRise}`);
      assert.ok(mSet > 0 && mSet < 180, `mirror world sets in the east, got ${mSet}`);
    }
  }
  // On the equinox the rise and set are due east and due west.
  const r = riseSet((u) => sunPosition(JERUSALEM.lat, JERUSALEM.lon, u, MAR).elevation, utcForLocalTime(0, JERUSALEM.lon));
  near(sunPosition(JERUSALEM.lat, JERUSALEM.lon, r.rise!, MAR).azimuth, 90, 0.5, 'equinox sunrise');
  near(sunPosition(JERUSALEM.lat, JERUSALEM.lon, r.set!, MAR).azimuth, 270, 0.5, 'equinox sunset');
});

// ------------------------------------------------------------------ time zones, DST, date line

test('DST rule: Israel–Japan is 7 hours in standard time and 6 in Israeli summer time', () => {
  const israel = civilZone(JERUSALEM.lon);
  const japan = civilZone(TOKYO_LON);
  assert.equal(israel, 2, 'Israel UTC+2 in the simplified 15° bands');
  assert.equal(japan, 9, 'Japan UTC+9');
  assert.equal(civilTimeDifference(israel, japan), 7, 'standard time');
  assert.equal(civilTimeDifference(israel, japan, 1, 0), 6, 'Israeli summer time (Workbook’s "about 6 hours")');
  // Workbook's example, done with the season stated: 08:00 in Tel Aviv in summer = 14:00 in Tokyo.
  assert.equal(8 + civilTimeDifference(israel, japan, 1, 0), 14);
  assert.equal(8 + civilTimeDifference(israel, japan), 15, 'in winter it would be 15:00');
  // Solar time ignores DST: the longitude gap stays ~7 h.
  near(solarTimeDifference(JERUSALEM.lon, TOKYO_LON), 6.96, 0.01);
  assert.equal(civilZone(-0.2) + 0, 0, 'Accra (civilZone returns -0 here; see REVIEW.md A3)');
  assert.equal(civilZone(90.4), 6, 'Dhaka');
});

test('date line: crossing 180° eastward gives the same clock time one calendar day earlier', () => {
  for (let utc = 0; utc < 48; utc += 0.5) {
    const west = { t: localSolarTime(utc, 179.9), d: localDayIndex(utc, 179.9) };
    const east = { t: localSolarTime(utc, -179.9), d: localDayIndex(utc, -179.9) };
    near(wrap180((west.t - east.t) * 15) / 15, 0, 0.02, 'same clock time across the line');
    const atMidnight = Math.min(west.t, 24 - west.t) < 0.05;
    if (!atMidnight) assert.equal(west.d - east.d, 1, `west of the line is one day ahead at utc ${utc}`);
  }
  // Away from the line the date changes only at local midnight: no jump between 170° and 175° E.
  for (let utc = 0.25; utc < 24; utc += 0.5) {
    const a = localDayIndex(utc, 170);
    const b = localDayIndex(utc, 175);
    const crossesMidnight = localSolarTime(utc, 170) > localSolarTime(utc, 175);
    assert.equal(b - a, crossesMidnight ? 1 : 0);
  }
  // The level 5 scenario: 20:00 on the same date in Fiji and then American Samoa ~23 h later.
  const fiji = utcForLocalTime(20, 178.5);
  let samoa = utcForLocalTime(20, -170.7);
  while (localDayIndex(samoa, -170.7) < localDayIndex(fiji, 178.5)) samoa += 24;
  assert.equal(localDayIndex(samoa, -170.7), localDayIndex(fiji, 178.5), 'same calendar date');
  assert.ok(samoa - fiji > 22 && samoa - fiji < 24, `Samoa's evening is ~23 h later, got ${samoa - fiji}`);
});

// ------------------------------------------------------------------ revolution and tilt (earth-revolution)

test('tilt: declination is +23.5 on the June solstice, −23.5 in December, 0 on the equinoxes', () => {
  near(declination(JUN), 23.5, 1e-9);
  near(declination(DEC), -23.5, 1e-9);
  near(declination(MAR), 0, 1e-9);
  near(declination(SEP), 0, 1e-9);
  for (let L = 0; L < 360; L += 5) assert.ok(Math.abs(declination(L)) <= 23.5 + 1e-9, 'never beyond the tropics');
  assert.ok(declination(45) > 0 && declination(225) < 0, 'north in northern spring/summer');
  assert.equal(dateLabel(MAR), '21 במרץ');
});

// REVIEW.md A1 (fixed): the calendar is piecewise-linear through Workbook's key dates.
test('calendar labels match Workbook’s key dates (21.6, 23.9, 22.12)', () => {
  assert.equal(dateLabel(JUN), '21 ביוני');
  assert.equal(dateLabel(SEP), '23 בספטמבר');
  assert.equal(dateLabel(DEC), '22 בדצמבר');
});

test('equinox: 12 hours of light everywhere, both hemispheres, both equinoxes', () => {
  for (const L of [MAR, SEP]) {
    for (const lat of [-80, -60, -33.9, -10, 0, 10, 31.78, 51.2, 60, 80]) {
      near(dayLength(lat, L), 12, 2 / 60, `lat ${lat} at L ${L}`);
      const rs = sunriseSunset(lat, L)!;
      near(rs.rise, 6, 0.02, 'rises at 06:00 solar time');
      near(rs.set, 18, 0.02, 'sets at 18:00 solar time');
    }
  }
  // …but not on other days: the 12:12 day is special to the equinox.
  assert.ok(Math.abs(dayLength(51.2, MAR + 30) - 12) > 1, 'a month later England has > 13 h');
});

test('solstices: polar day north of the Arctic Circle in June, polar night in December, reversed in the south', () => {
  for (const lat of [67, 70, 80, 89]) {
    assert.equal(dayKind(lat, JUN), 'polar-day', `${lat}N June`);
    assert.equal(dayLength(lat, JUN), 24);
    assert.equal(dayKind(lat, DEC), 'polar-night', `${lat}N December`);
    assert.equal(dayLength(lat, DEC), 0);
    assert.equal(dayKind(-lat, JUN), 'polar-night', `${lat}S June`);
    assert.equal(dayKind(-lat, DEC), 'polar-day', `${lat}S December`);
  }
  // The Arctic Circle (90 − 23.5 = 66.5°) is the boundary.
  assert.equal(dayKind(66, JUN), 'normal');
  assert.equal(dayKind(60, JUN), 'normal', 'Scandinavia south of the circle: long day, but the Sun sets');
  assert.equal(dayKind(69, JUN), 'polar-day', 'Lapland at 69°N');
});

test('day length: Israel ≈ 14 h and Oslo ≈ 18 h on 21 June; Israel ≈ 10 h in December', () => {
  near(dayLength(JERUSALEM.lat, JUN), 14, 0.35, 'Israel June');
  near(dayLength(OSLO.lat, JUN), 18, 0.75, 'Oslo June');
  near(dayLength(JERUSALEM.lat, DEC), 10, 0.35, 'Israel December');
  // Longer days the farther north in June; the equator stays 12 h all year.
  assert.ok(dayLength(0, JUN) < dayLength(JERUSALEM.lat, JUN) && dayLength(JERUSALEM.lat, JUN) < dayLength(OSLO.lat, JUN));
  for (let L = 0; L < 360; L += 30) near(dayLength(0, L), 12, 1e-6, 'equator');
});

test('noon Sun: elevation = 90 − |φ − δ|, vertical over the Tropic of Cancer on 21 June, never vertical at 40°N', () => {
  // The closed formula agrees with the full 3D geometry.
  for (const L of [MAR, 40, JUN, 150, SEP, DEC]) {
    for (const lat of [-50, -23.5, 0, 23.5, 31.78, 40, 60]) {
      const lon = 33;
      const geo = sunPosition(lat, lon, utcForLocalTime(12, lon), L).elevation;
      near(geo, noonElevation(lat, L), 0.05, `lat ${lat}, L ${L}`);
    }
  }
  near(noonElevation(23.5, JUN), 90, 1e-9, 'Tropic of Cancer, 21 June');
  near(noonElevation(0, JUN), 66.5, 1e-9, 'equator, 21 June: not vertical');
  near(noonElevation(-23.5, DEC), 90, 1e-9, 'Tropic of Capricorn, December');
  near(noonElevation(0, MAR), 90, 1e-9, 'equator, equinox');
  // The equinox doesn't put the Sun overhead everywhere.
  near(noonElevation(JERUSALEM.lat, MAR), 58.2, 0.1, 'Israel on the equinox');
  let best = -Infinity;
  for (let L = 0; L < 360; L += 1) best = Math.max(best, noonElevation(40, L));
  near(best, 73.5, 0.01, 'highest noon Sun at 40°N');
  assert.ok(best < 87, 'never near the zenith at 40°N');
  // Shadows: none under a vertical Sun, longest in winter.
  assert.ok(shadowLength(noonElevation(23.5, JUN)) < 0.01);
  assert.ok(shadowLength(noonElevation(JERUSALEM.lat, JUN)) < shadowLength(noonElevation(JERUSALEM.lat, MAR)));
  assert.ok(shadowLength(noonElevation(JERUSALEM.lat, MAR)) < shadowLength(noonElevation(JERUSALEM.lat, DEC)));
  assert.equal(shadowLength(-3), Infinity, 'no shadow at night');
});

test('seasons are not from distance: Earth is closest to the Sun in January, while the north has short days', () => {
  const jan3 = lFromDayOfYear(2);
  const jul4 = lFromDayOfYear(184);
  let minL = 0;
  for (let L = 0; L < 360; L += 0.5) if (sunDistanceAU(L) < sunDistanceAU(minL)) minL = L;
  const { month } = (() => {
    const label = dateLabel(minL);
    return { month: label.split(' ')[1] };
  })();
  assert.equal(month, 'בינואר', `closest approach falls in January (${dateLabel(minL)})`);
  assert.ok(sunDistanceAU(jan3) < 0.99 && sunDistanceAU(jul4) > 1.01, 'perihelion ~0.983 AU, aphelion ~1.017 AU');
  // Closest to the Sun, yet winter in the north and summer in the south.
  assert.ok(dayLength(JERUSALEM.lat, jan3) < 11, 'short days in Israel');
  assert.ok(dayLength(-33.9, jan3) > 13.5, 'long days in Sydney');
  assert.ok(noonElevation(JERUSALEM.lat, jan3) < noonElevation(JERUSALEM.lat, jul4), 'low winter Sun');
  assert.ok(dailyInsolation(JERUSALEM.lat, jan3) < dailyInsolation(JERUSALEM.lat, jul4) * 0.6, 'Israel gets far less energy in January');
  const israel = yearlyCurve(JERUSALEM.lat);
  assert.ok(israel[0] < israel[6] - 12, 'January much colder than July in Israel');
});

test('hemispheres: the seasons are opposite at the same moment', () => {
  for (let L = 0; L < 360; L += 15) {
    for (const lat of [10, 31.78, 50, 60]) {
      near(dayLength(lat, L) + dayLength(-lat, L), 24, 1e-6, `day lengths mirror at L ${L}, lat ±${lat}`);
    }
  }
  const north = yearlyCurve(33.9);
  const south = yearlyCurve(-33.9);
  const warmest = (c: number[]) => c.indexOf(Math.max(...c));
  assert.ok([5, 6, 7].includes(warmest(north)), `north warmest in Jun–Aug, got month ${warmest(north) + 1}`);
  assert.ok([11, 0, 1].includes(warmest(south)), `south warmest in Dec–Feb, got month ${warmest(south) + 1}`);
});

// ------------------------------------------------------------------ the Sun as engine (sun-energy)

test('flashlight rule: an oblique beam spreads over more ground and delivers less per square metre', () => {
  near(insolationFactor(90), 1, 1e-9);
  near(insolationFactor(30), 0.5, 1e-9);
  near(beamSpread(90), 1, 1e-9);
  near(beamSpread(30), 2, 1e-9, 'twice the area at 30°');
  assert.equal(insolationFactor(-5), 0, 'nothing at night');
  assert.equal(beamSpread(0), Infinity);
  let prevSpread = Infinity;
  let prevI = -1;
  for (let h = 5; h <= 90; h += 5) {
    assert.ok(beamSpread(h) < prevSpread, 'patch shrinks as the Sun climbs');
    assert.ok(insolationFactor(h) > prevI, 'energy per area grows');
    near(beamSpread(h) * insolationFactor(h), 1, 1e-9, 'same beam, spread × concentration = 1');
    prevSpread = beamSpread(h);
    prevI = insolationFactor(h);
  }
  // On 21 December the Tropic of Capricorn charges panels faster than Finland.
  const rate = (lat: number) => batteryRate({ elevation: noonElevation(lat, DEC), albedo: 0.15 });
  assert.ok(rate(-23.5) > rate(0) && rate(0) > rate(23.5) && rate(23.5) > rate(60));
});

test('albedo: bright snow charges the panels more by reflection but its own surface stays cooler than asphalt', () => {
  assert.ok(ALBEDO.snow > ALBEDO.field && ALBEDO.field > ALBEDO.asphalt, 'snow reflects, asphalt absorbs');
  for (const h of [20, 45, 70]) {
    assert.ok(batteryRate({ elevation: h, albedo: ALBEDO.snow }) > batteryRate({ elevation: h, albedo: ALBEDO.asphalt }), 'reflected light helps the panels');
    const snow = surfaceTemperature({ elevation: h, surface: 'snow', airTemp: 10 });
    const asphalt = surfaceTemperature({ elevation: h, surface: 'asphalt', airTemp: 10 });
    assert.ok(snow < asphalt - 5, `same Sun, same air: snow ${snow} vs asphalt ${asphalt}`);
  }
  // Urban heat island: asphalt in the city is warmer than the fields outside it at the same time.
  const city = surfaceTemperature({ elevation: 35, surface: 'asphalt', airTemp: 18 });
  const fields = surfaceTemperature({ elevation: 35, surface: 'field', airTemp: 16 });
  assert.ok(city - fields >= 6, `heat island ${city - fields}`);
});

test('albedo alone does not decide temperature: dark lava under a low Sun stays cold', () => {
  const lowLava = surfaceTemperature({ elevation: noonElevation(64, DEC), surface: 'lava', airTemp: 0 });
  const highLava = surfaceTemperature({ elevation: 70, surface: 'lava', airTemp: 0 });
  const highSnow = surfaceTemperature({ elevation: 70, surface: 'snow', airTemp: 0 });
  assert.ok(lowLava < 5, `Iceland lava in December noon: ${lowLava}`);
  assert.ok(highLava > lowLava + 20, 'the same dark surface under a high Sun is hot');
  assert.ok(highSnow > lowLava, 'bright snow under a high Sun can be warmer than dark lava under a low Sun');
  assert.equal(surfaceTemperature({ elevation: -10, surface: 'lava', airTemp: 0 }), 0, 'no sunlight, no solar heating');
});

test('radiation balance: absorbed > emitted warms, emitted > absorbed cools, equal stays steady', () => {
  const day = greenhouseStep(22, { elevation: 60, shade: 0, trap: 0, outsideC: 20 }, 0.5);
  assert.ok(day.absorbed > day.emitted && day.temp > 22, 'more short-wave in than long-wave out: warmer');
  const night = greenhouseStep(22, { elevation: -10, shade: 0, trap: 0, outsideC: 6 }, 0.5);
  assert.ok(night.emitted > night.absorbed && night.temp < 22, 'night: emits, absorbs nothing: cooler');
  const trapped = greenhouseStep(22, { elevation: -10, shade: 0, trap: 0.97, outsideC: 6 }, 0.5);
  assert.ok(trapped.temp > night.temp, 'trapping long-wave slows the cooling');
  const shaded = greenhouseStep(22, { elevation: 60, shade: 0.7, trap: 0, outsideC: 20 }, 0.5);
  assert.ok(shaded.absorbed < day.absorbed && shaded.temp < day.temp, 'shading cuts what is absorbed');
  // Run to equilibrium: the temperature settles where absorbed = emitted.
  let t = 22;
  let last = { temp: t, absorbed: 0, emitted: 0 };
  for (let i = 0; i < 2000; i++) {
    last = greenhouseStep(t, { elevation: 45, shade: 0.3, trap: 0.5, outsideC: 15 }, 0.05);
    t = last.temp;
  }
  near(last.absorbed, last.emitted, 1e-3, 'balanced');
  near(greenhouseStep(t, { elevation: 45, shade: 0.3, trap: 0.5, outsideC: 15 }, 1).temp, t, 1e-3, 'steady');
});

// ------------------------------------------------------------------ climate zones (climate-zones)

test('climate curves: the equator is flat and warm, mid-latitudes are seasonal, the polar circle is cold', () => {
  const range = (c: number[]) => Math.max(...c) - Math.min(...c);
  const mean = (c: number[]) => c.reduce((a, b) => a + b, 0) / c.length;
  const eq = yearlyCurve(0);
  const israel = yearlyCurve(31.8);
  const polar = yearlyCurve(66.5);
  assert.ok(range(eq) < 5, `equator range ${range(eq)}`);
  assert.ok(Math.min(...eq) > 22, 'equator warm every month');
  near(mean(eq), 25.5, 2, 'equator mean (Workbook: about 27 all year)');
  assert.ok(range(israel) > 12, `Israel has clear seasons, range ${range(israel)}`);
  assert.ok(range(polar) > range(israel), 'the seasonal gap grows toward the poles');
  assert.ok(mean(polar) < mean(israel) && mean(israel) < mean(eq), 'colder away from the equator');
  // Southern hemisphere: the same shape, inverted in time.
  const s = yearlyCurve(-31.8);
  for (let m = 0; m < 12; m++) near(s[m], israel[(m + 6) % 12], 3.5, `month ${m + 1} mirrored six months later`);
});

// ------------------------------------------------------------------ the Moon (moon-and-tides)

test('Moon phases: new moon is dark, full moon fully lit, quarters half lit, cycle 29.5 days', () => {
  near(illumination(0), 0, 1e-9, 'new moon (מולד)');
  near(illumination(SYNODIC_DAYS / 2), 1, 1e-9, 'full moon');
  near(illumination(SYNODIC_DAYS / 4), 0.5, 1e-9, 'first quarter');
  near(illumination((3 * SYNODIC_DAYS) / 4), 0.5, 1e-9, 'last quarter');
  near(illumination(SYNODIC_DAYS), 0, 1e-9, 'back to new after one synodic month');
  near(SYNODIC_DAYS, 29.5, 0.05);
  for (let k = 0; k < 8; k++) assert.equal(phaseIndex(phaseAge(k)), k);
  assert.equal(phaseIndex(7.38), 2, '≈ 7 days after the new moon: first quarter');
  assert.equal(phaseIndex(14.8), 4, '≈ 15 days: full');
});

test('Moon phases are geometry, not Earth’s shadow: a quarter moon is 90° from the Sun with no eclipse', () => {
  for (const L of [0, 30, 100, 210, 300]) {
    for (const utc of [3, 15]) {
      const q1 = angleBetween(sunDirection(utc, L), moonDirection(utc, L, SYNODIC_DAYS / 4));
      near(q1, 90, 6, 'first quarter ~90° from the Sun');
      const full = angleBetween(sunDirection(utc, L), moonDirection(utc, L, SYNODIC_DAYS / 2));
      assert.ok(full > 174, `full moon opposite the Sun (${full}°)`);
      const fresh = angleBetween(sunDirection(utc, L), moonDirection(utc, L, 0));
      assert.ok(fresh < 6, `new moon next to the Sun (${fresh}°)`);
    }
    // Half lit, yet nowhere near Earth's shadow (which points away from the Sun).
    assert.equal(lunarEclipse(L, SYNODIC_DAYS / 4), false);
    assert.equal(lunarEclipse(L, (3 * SYNODIC_DAYS) / 4), false);
  }
});

test('Moon rise times: the full moon rises near sunset and is down at noon; the new moon rises with the Sun', () => {
  const { lat, lon } = JERUSALEM;
  const start = utcForLocalTime(12, lon); // the full moon is below the horizon at noon
  const full = riseSet((u) => moonPosition(lat, lon, u, MAR, SYNODIC_DAYS / 2).elevation, start);
  near(localSolarTime(full.rise!, lon), 18, 1.25, 'full moon rises around sunset');
  assert.ok(moonPosition(lat, lon, utcForLocalTime(12, lon), MAR, SYNODIC_DAYS / 2).elevation < -20, 'full moon at noon is well below the horizon');
  assert.ok(moonPosition(lat, lon, utcForLocalTime(0, lon), MAR, SYNODIC_DAYS / 2).elevation > 30, 'and high at midnight');
  const fresh = riseSet((u) => moonPosition(lat, lon, u, MAR, 0).elevation, utcForLocalTime(0, lon));
  near(localSolarTime(fresh.rise!, lon), 6, 1, 'new moon rises with the Sun');
  const q1 = riseSet((u) => moonPosition(lat, lon, u, MAR, SYNODIC_DAYS / 4).elevation, utcForLocalTime(0, lon));
  near(localSolarTime(q1.rise!, lon), 12, 2, 'first quarter rises around noon');
});

test('the 5° eclipse condition: a solar eclipse is possible only at new moons near the nodes', () => {
  const possible: number[] = [];
  for (let L = 0; L < 360; L += 1) if (eclipsePossibleAtNewMoon(L)) possible.push(L);
  assert.ok(possible.length > 0, 'eclipse seasons exist');
  for (const L of possible) {
    const fromNode = Math.min(Math.abs(wrap180(L - 30)), Math.abs(wrap180(L - 210)));
    assert.ok(fromNode < 12, `only near a node: L ${L}`);
  }
  assert.ok(possible.some((L) => Math.abs(L - 30) < 2) && possible.some((L) => Math.abs(L - 210) < 2), 'both nodes');
  // Most new moons pass above or below the Sun: at most 2 of any 12 consecutive new moons.
  const step = (SYNODIC_DAYS / 365.25) * 360;
  for (let L0 = 0; L0 < 360; L0 += 7) {
    let n = 0;
    for (let k = 0; k < 12; k++) if (eclipsePossibleAtNewMoon(L0 + k * step)) n++;
    assert.ok(n <= 2, `no eclipse every month: ${n} of 12 from L ${L0}`);
  }
  // The Moon is up to 5° from the ecliptic in mid-month between nodes.
  near(Math.abs(moonEclipticLatitude(120, 0)), 5, 1e-9);
  // Off-node new moon: the shadow axis misses the Earth all day.
  for (const L of [0, 60, 90, 150, 270]) {
    for (let utc = 0; utc < 24; utc += 0.25) assert.equal(solarEclipseCenter(utc, L, 0), null, `no eclipse at L ${L}`);
  }
  // On the node the shadow lands on the day side, near the subsolar point.
  const c = solarEclipseCenter(9, 30, 0);
  assert.ok(c, 'eclipse at the node');
  const sub = subsolarPoint(9, 30);
  assert.ok(angularDistance(c!.lat, c!.lon, sub.lat, sub.lon) < 30, 'shadow on the side facing the Sun');
  assert.equal(solarEclipseCenter(9, 30, SYNODIC_DAYS / 2), null, 'never at full moon');
});

test('lunar eclipse: only at a full moon near a node', () => {
  assert.equal(lunarEclipse(30, SYNODIC_DAYS / 2), true);
  assert.equal(lunarEclipse(210, SYNODIC_DAYS / 2), true);
  for (const L of [0, 90, 120, 180, 270]) assert.equal(lunarEclipse(L, SYNODIC_DAYS / 2), false, `full moon off-node L ${L}`);
  for (const age of [0, 3, SYNODIC_DAYS / 4, 11, 18, (3 * SYNODIC_DAYS) / 4]) assert.equal(lunarEclipse(30, age), false, `age ${age} is not full`);
});

// ------------------------------------------------------------------ tides (moon-and-tides)

/** Tide samples over one lunar day (~24 h 50 min) with the Moon moving as the hours pass. */
function tideDay(lat: number, lon: number, age0: number, amp: number) {
  const out: number[] = [];
  const lunarDay = 24 * (1 + 1 / (SYNODIC_DAYS - 1));
  for (let t = 0; t <= lunarDay; t += 0.05) out.push(tideHeight(lat, lon, 3 + t, MAR, age0 + t / 24, amp));
  return out;
}
const extremes = (h: number[]) => {
  let highs = 0;
  let lows = 0;
  for (let i = 1; i < h.length - 1; i++) {
    if (h[i] > h[i - 1] && h[i] >= h[i + 1]) highs++;
    if (h[i] < h[i - 1] && h[i] <= h[i + 1]) lows++;
  }
  return { highs, lows, range: Math.max(...h) - Math.min(...h) };
};

test('tides: two highs and two lows per lunar day', () => {
  for (const age of [0, 4, 7.4, 14.8]) {
    const e = extremes(tideDay(49.6, -1.5, age, 6));
    assert.equal(e.highs, 2, `highs at age ${age}`);
    assert.equal(e.lows, 2, `lows at age ${age}`);
  }
  // High tide under the Moon and on the opposite side; low tide 90° away.
  const utc = 10;
  const subLon = (() => {
    let best = -180;
    for (let lon = -180; lon < 180; lon += 0.5) if (tideHeight(0, lon, utc, MAR, 3, 1) > tideHeight(0, best, utc, MAR, 3, 1)) best = lon;
    return best;
  })();
  near(tideHeight(0, subLon + 180, utc, MAR, 3, 1), tideHeight(0, subLon, utc, MAR, 3, 1), 1e-6, 'second bulge opposite');
  assert.ok(tideHeight(0, subLon + 90, utc, MAR, 3, 1) < 0, 'low tide a quarter of the way round');
});

test('tides (enrichment): spring tides at new and full moon are bigger than neap tides at the quarters', () => {
  const spring = extremes(tideDay(49.6, -1.5, 0, 6)).range;
  const full = extremes(tideDay(49.6, -1.5, SYNODIC_DAYS / 2, 6)).range;
  const neap = extremes(tideDay(49.6, -1.5, SYNODIC_DAYS / 4, 6)).range;
  assert.ok(spring > 2 * neap && full > 2 * neap, `spring ${spring} / full ${full} vs neap ${neap}`);
  assert.ok(spring > 8, `ocean funnel coast: metres of tide (${spring} m)`);
});

test('tides: the Mediterranean range is only 20–40 cm, so timing barely matters there', () => {
  const tlv = extremes(tideDay(32.08, 34.76, 0, 0.15));
  assert.ok(tlv.range >= 0.2 && tlv.range <= 0.4, `Tel Aviv spring range ${tlv.range} m`);
  const ocean = extremes(tideDay(49.6, -1.5, 0, 6));
  assert.ok(ocean.range > 20 * tlv.range, 'an open-ocean coast moves tens of times more');
});
