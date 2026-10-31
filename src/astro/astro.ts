// Pure astronomy and energy model for Tilt World. No rendering, no DOM.
//
// Frames and units
// - Planet frame is Earth-fixed: +Y is the north pole, longitude 0 is +Z, east (longitude
//   increasing) is +X at longitude 0. Unit vector for (lat, lon): (cos φ sin λ, sin φ, cos φ cos λ).
// - Angles in degrees unless a name ends in Rad. Times in hours.
// - The date is the orbit longitude L: the Sun's ecliptic longitude, 0 at the March equinox,
//   90 at the June solstice, 180 at the September equinox, 270 at the December solstice.
// - Time is UTC hours (continuous, may exceed 24). Local solar time = UTC + lon / 15.
//
// Simplifications (stated in CURRICULUM.md): circular-ish orbit with small eccentricity for the
// distance readout only, no equation of time, no refraction, the Moon's nodes are fixed in the
// game year (at L = 30° and 210°), tides are a two-bulge cosine scaled by a spring/neap factor.

export const TILT = 23.5;
export const DEG_PER_HOUR = 15;
export const SYNODIC_DAYS = 29.53;
export const MOON_INCLINATION = 5;
export const MOON_NODE_L = 30;
export const MOON_DISTANCE_RADII = 60;
export const YEAR_DAYS = 365.25;
export const ECCENTRICITY = 0.0167;
/** Day of year (0 = 1 January) of the March equinox in the game calendar. */
export const EQUINOX_DAY = 79;
/** Day of year of perihelion (closest to the Sun), about 3 January. */
export const PERIHELION_DAY = 2;

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

export type Vec3 = { x: number; y: number; z: number };

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const wrap360 = (a: number) => ((a % 360) + 360) % 360;
/** Wrap to (-180, 180]. */
export const wrap180 = (a: number) => {
  const w = wrap360(a);
  return w > 180 ? w - 360 : w;
};
export const wrap24 = (h: number) => ((h % 24) + 24) % 24;

export function latLonToVec(lat: number, lon: number): Vec3 {
  const p = lat * D2R;
  const l = lon * D2R;
  return { x: Math.cos(p) * Math.sin(l), y: Math.sin(p), z: Math.cos(p) * Math.cos(l) };
}

export function vecToLatLon(v: Vec3): { lat: number; lon: number } {
  const len = Math.hypot(v.x, v.y, v.z) || 1;
  return { lat: Math.asin(clamp(v.y / len, -1, 1)) * R2D, lon: Math.atan2(v.x, v.z) * R2D };
}

export const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;

/** Great-circle angle between two places, degrees. */
export function angularDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return Math.acos(clamp(dot(latLonToVec(lat1, lon1), latLonToVec(lat2, lon2)), -1, 1)) * R2D;
}

// ---------------------------------------------------------------- date and orbit

/** Solar declination for orbit longitude L. +23.5 at the June solstice, 0 at equinoxes. */
export function declination(L: number): number {
  return Math.asin(Math.sin(TILT * D2R) * Math.sin(L * D2R)) * R2D;
}

/**
 * Calendar anchors (day of year, 0 = 1 January) for L = 0, 90, 180, 270, 360: Workbook's key dates
 * 21 March, 21 June, 23 September, 22 December. The seasons are unequal, so the map is
 * piecewise-linear inside each quarter.
 */
const L_ANCHORS = [79, 171, 265, 355, 444];

export function dayOfYearFromL(L: number): number {
  const l = wrap360(L);
  const q = Math.min(3, Math.floor(l / 90));
  const a = L_ANCHORS[q];
  const b = L_ANCHORS[q + 1];
  return (a + ((l - q * 90) / 90) * (b - a)) % 365;
}

export function lFromDayOfYear(day: number): number {
  let d = ((day % 365) + 365) % 365;
  if (d < L_ANCHORS[0]) d += 365;
  for (let q = 0; q < 4; q++) {
    const a = L_ANCHORS[q];
    const b = L_ANCHORS[q + 1];
    if (d >= a && d < b) return wrap360(q * 90 + ((d - a) / (b - a)) * 90);
  }
  return 0;
}

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const HEBREW_MONTHS = ['בינואר', 'בפברואר', 'במרץ', 'באפריל', 'במאי', 'ביוני', 'ביולי', 'באוגוסט', 'בספטמבר', 'באוקטובר', 'בנובמבר', 'בדצמבר'];

export function calendarDate(L: number): { month: number; day: number } {
  let d = Math.floor(dayOfYearFromL(L));
  let m = 0;
  while (d >= MONTH_DAYS[m]) {
    d -= MONTH_DAYS[m];
    m = (m + 1) % 12;
  }
  return { month: m, day: d + 1 };
}

/** Hebrew date label, e.g. "21 ביוני". */
export function dateLabel(L: number): string {
  const { month, day } = calendarDate(L);
  return `${day} ${HEBREW_MONTHS[month]}`;
}

/** Orbit dial positions: 12 steps of 30°, starting at the March equinox (21 March). */
export const DIAL_STEP = 30;
export const snapDial = (L: number) => wrap360(Math.round(L / DIAL_STEP) * DIAL_STEP);

/** Earth–Sun distance in AU. Smallest in early January, largest in early July. */
export function sunDistanceAU(L: number): number {
  const day = dayOfYearFromL(L);
  return 1 - ECCENTRICITY * Math.cos((2 * Math.PI * (day - PERIHELION_DAY)) / YEAR_DAYS);
}

// ---------------------------------------------------------------- rotation and time

/** Local solar time at a longitude. */
export function localSolarTime(utc: number, lon: number): number {
  return wrap24(utc + lon / DEG_PER_HOUR);
}

/** UTC at which a longitude reaches a local solar time (the next one at or after `afterUtc`). */
export function utcForLocalTime(local: number, lon: number, afterUtc = 0): number {
  let utc = local - lon / DEG_PER_HOUR;
  while (utc < afterUtc - 1e-9) utc += 24;
  while (utc - 24 >= afterUtc - 1e-9) utc -= 24;
  return utc;
}

/** Local solar time difference B − A in hours, from longitudes (east positive). */
export function solarTimeDifference(lonA: number, lonB: number): number {
  return (lonB - lonA) / DEG_PER_HOUR;
}

/** Simplified civil time zone: 15° bands centred on multiples of 15°. */
export function civilZone(lon: number): number {
  return Math.round(wrap180(lon) / DEG_PER_HOUR) || 0;
}

/**
 * Civil time difference B − A in hours with optional daylight-saving hours. Workbook's rotation
 * module says Tel Aviv–Tokyo is "about 6 hours": that holds in Israeli summer time (Israel +3,
 * Japan +9). In standard time it is 7. Levels that use real cities pass the season explicitly.
 */
export function civilTimeDifference(zoneA: number, zoneB: number, dstA = 0, dstB = 0): number {
  return zoneB + dstB - (zoneA + dstA);
}

/**
 * Calendar date offset caused by the international date line, for the simplified model in which
 * the line is the 180° meridian: west of it (east longitudes) is one calendar day ahead of the
 * east side. Returns the local calendar day index for a UTC day index.
 */
export function localDayIndex(utc: number, lon: number): number {
  return Math.floor((utc + lon / DEG_PER_HOUR) / 24);
}

// ---------------------------------------------------------------- the Sun

/**
 * Subsolar point. spin = +1 is Earth's real west→east rotation (the Sun appears to move east→west
 * and rises in the east). spin = −1 is the mirror world: the Sun rises in the west.
 */
export function subsolarPoint(utc: number, L: number, spin: 1 | -1 = 1): { lat: number; lon: number } {
  return { lat: declination(L), lon: wrap180(-spin * DEG_PER_HOUR * (utc - 12)) };
}

export function sunDirection(utc: number, L: number, spin: 1 | -1 = 1): Vec3 {
  const s = subsolarPoint(utc, L, spin);
  return latLonToVec(s.lat, s.lon);
}

/** Local east/north/up basis at a place. */
export function enuBasis(lat: number, lon: number): { east: Vec3; north: Vec3; up: Vec3 } {
  const p = lat * D2R;
  const l = lon * D2R;
  return {
    east: { x: Math.cos(l), y: 0, z: -Math.sin(l) },
    north: { x: -Math.sin(p) * Math.sin(l), y: Math.cos(p), z: -Math.sin(p) * Math.cos(l) },
    up: latLonToVec(lat, lon),
  };
}

/** Elevation (degrees above horizon) and azimuth (degrees clockwise from north) of a direction. */
export function horizonCoords(lat: number, lon: number, dir: Vec3): { elevation: number; azimuth: number } {
  const b = enuBasis(lat, lon);
  const e = dot(dir, b.east);
  const n = dot(dir, b.north);
  const u = dot(dir, b.up);
  return { elevation: Math.asin(clamp(u, -1, 1)) * R2D, azimuth: wrap360(Math.atan2(e, n) * R2D) };
}

export function sunPosition(lat: number, lon: number, utc: number, L: number, spin: 1 | -1 = 1) {
  return horizonCoords(lat, lon, sunDirection(utc, L, spin));
}

export function sunElevation(lat: number, lon: number, utc: number, L: number, spin: 1 | -1 = 1): number {
  return sunPosition(lat, lon, utc, L, spin).elevation;
}

/** Noon Sun elevation: 90° − |φ − δ| (can exceed reality's 90 only at φ = δ). */
export function noonElevation(lat: number, L: number): number {
  return 90 - Math.abs(lat - declination(L));
}

/** Half-day hour angle H0 in degrees from cos H0 = −tan φ · tan δ, clamped for polar day/night. */
export function sunsetHourAngle(lat: number, L: number): number {
  const c = -Math.tan(lat * D2R) * Math.tan(declination(L) * D2R);
  if (c <= -1) return 180; // polar day: the Sun never sets
  if (c >= 1) return 0; // polar night: the Sun never rises
  return Math.acos(c) * R2D;
}

/** Hours of daylight (Sun centre above the horizon). 24 = polar day, 0 = polar night. */
export function dayLength(lat: number, L: number): number {
  return (2 * sunsetHourAngle(lat, L)) / DEG_PER_HOUR;
}

export type DayKind = 'normal' | 'polar-day' | 'polar-night';
export function dayKind(lat: number, L: number): DayKind {
  const h = sunsetHourAngle(lat, L);
  return h >= 180 ? 'polar-day' : h <= 0 ? 'polar-night' : 'normal';
}

/** Local solar times of sunrise and sunset (null in polar day/night). */
export function sunriseSunset(lat: number, L: number): { rise: number; set: number } | null {
  const h = sunsetHourAngle(lat, L);
  if (h <= 0 || h >= 180) return null;
  return { rise: 12 - h / DEG_PER_HOUR, set: 12 + h / DEG_PER_HOUR };
}

/** Twilight band used by the game: Sun between −6° and +6° (civil twilight to golden hour). */
export const TWILIGHT_LOW = -6;
export const TWILIGHT_HIGH = 6;
export type Light = 'day' | 'twilight' | 'night';
export function lightAt(elevation: number): Light {
  if (elevation > TWILIGHT_HIGH) return 'day';
  if (elevation >= TWILIGHT_LOW) return 'twilight';
  return 'night';
}

/** Shadow length of a vertical stick of height 1 (Infinity when the Sun is down). */
export function shadowLength(elevation: number): number {
  if (elevation <= 0.01) return Infinity;
  return 1 / Math.tan(elevation * D2R);
}

// ---------------------------------------------------------------- radiation and energy

/**
 * The flashlight rule: a beam of fixed width hitting the ground at elevation h spreads over
 * 1 / sin h times the area of a vertical beam, so each square metre gets sin h of the energy.
 */
export function beamSpread(elevation: number): number {
  return elevation <= 0.5 ? Infinity : 1 / Math.sin(elevation * D2R);
}
export function insolationFactor(elevation: number): number {
  return Math.max(0, Math.sin(elevation * D2R));
}

/** Albedo (share reflected) of the surfaces in the game. */
export const ALBEDO = {
  snow: 0.85,
  ice: 0.6,
  sand: 0.4,
  field: 0.22,
  forest: 0.12,
  ocean: 0.08,
  asphalt: 0.07,
  lava: 0.08,
  city: 0.12,
} as const;
export type Surface = keyof typeof ALBEDO;

export const BATTERY_DRAIN_NIGHT = 7; // % per game-hour with the Sun below the twilight band (a 12-hour night costs 84%)
export const BATTERY_DRAIN_RUN = 4; // extra % per game-hour while running
export const CHARGE_K = 60; // % per game-hour for a vertical Sun on a dark surface, clear sky

/**
 * Battery change in % per game-hour. Panels catch the direct beam (sin h, dimmed by cloud) plus
 * light reflected up from the ground (albedo × sin h × 0.5). A bright surface helps the panels,
 * though the surface itself absorbs less and stays cooler.
 */
export function batteryRate(opts: { elevation: number; albedo: number; cloud?: number; running?: boolean }): number {
  const cloud = opts.cloud ?? 0;
  const s = insolationFactor(opts.elevation);
  const charge = CHARGE_K * s * (1 - 0.7 * cloud) * (1 + 0.5 * opts.albedo);
  const drain = (opts.elevation < TWILIGHT_LOW ? BATTERY_DRAIN_NIGHT : 0) + (opts.running ? BATTERY_DRAIN_RUN : 0);
  return charge - drain;
}

/** Evaporative cooling (°C) of wet or green surfaces under full sun. Dry surfaces get none. */
export const EVAPORATION: Record<Surface, number> = {
  snow: 0,
  ice: 0,
  sand: 0,
  field: 10,
  forest: 12,
  ocean: 15,
  asphalt: 0,
  lava: 0,
  city: 2,
};

/**
 * Surface temperature (°C) for the thermal-camera shots: air temperature plus warming from
 * absorbed sunlight (1 − albedo) × sin h, minus evaporative cooling. Albedo alone doesn't decide
 * the result: dark lava under a low Sun stays cold.
 */
export function surfaceTemperature(opts: { elevation: number; surface: Surface; airTemp: number }): number {
  const s = insolationFactor(opts.elevation);
  return opts.airTemp + 30 * (1 - ALBEDO[opts.surface]) * s - EVAPORATION[opts.surface] * s;
}

/** Daily mean insolation at the top of the atmosphere, relative to the equator at equinox (=1). */
export function dailyInsolation(lat: number, L: number): number {
  const p = lat * D2R;
  const d = declination(L) * D2R;
  const h0 = sunsetHourAngle(lat, L) * D2R;
  const q = h0 * Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.sin(h0);
  return (q / Math.PI) * (sunDistanceAU(0) / sunDistanceAU(L)) ** 2 * Math.PI;
}

/**
 * Monthly mean temperature (°C), schematic climate model for the climograph level: tracks daily
 * insolation with a one-month lag. Equator ≈ 25–28 all year, Israel ≈ 10–27, polar circle ≈ −20..+12.
 */
export function monthlyTemperature(lat: number, L: number): number {
  const q = dailyInsolation(lat, wrap360(L - 30));
  const mean = annualInsolation(lat);
  return -46.7 + 76 * mean + 32 * (q - mean);
}

const annualCache = new Map<number, number>();
/** Year-mean daily insolation at a latitude (relative units). */
export function annualInsolation(lat: number): number {
  const key = Math.round(lat * 10);
  const hit = annualCache.get(key);
  if (hit !== undefined) return hit;
  let sum = 0;
  for (let i = 0; i < 72; i++) sum += dailyInsolation(lat, i * 5);
  const v = sum / 72;
  annualCache.set(key, v);
  return v;
}

/** Twelve monthly temperatures starting January. */
export function yearlyCurve(lat: number): number[] {
  const out: number[] = [];
  for (let m = 0; m < 12; m++) out.push(monthlyTemperature(lat, lFromDayOfYear(m * 30.44 + 15)));
  return out;
}

/**
 * Radiation balance step for the greenhouse dome. Absorbed short-wave minus emitted long-wave
 * changes the temperature: T' = T + (absorbed − emitted) · dt / C.
 */
export function greenhouseStep(
  tempC: number,
  opts: { elevation: number; shade: number; trap: number; outsideC: number },
  dtHours: number,
): { temp: number; absorbed: number; emitted: number } {
  const absorbed = 30 * insolationFactor(opts.elevation) * (1 - opts.shade);
  const emitted = 0.9 * (1 - opts.trap) * (tempC - opts.outsideC) + 0.03 * (tempC - opts.outsideC);
  const temp = tempC + (absorbed - emitted) * dtHours * 0.5;
  return { temp, absorbed, emitted };
}

// ---------------------------------------------------------------- the Moon

export function moonElongation(ageDays: number): number {
  return wrap360((ageDays / SYNODIC_DAYS) * 360);
}

export const PHASE_NAMES = ['מולד', 'סהר מתמלא', 'רבע ראשון', 'ירח מתמלא', 'ירח מלא', 'ירח מתמעט', 'רבע אחרון', 'סהר מתמעט'];

/** Phase index 0..7 (0 new moon, 4 full moon). */
export function phaseIndex(ageDays: number): number {
  return Math.round(moonElongation(ageDays) / 45) % 8;
}

/** Age in days at which a phase index is exact. */
export const phaseAge = (index: number) => (((index % 8) + 8) % 8) * (SYNODIC_DAYS / 8);

/** Lit share of the disk seen from Earth, 0 (new) to 1 (full). */
export function illumination(ageDays: number): number {
  return (1 - Math.cos(moonElongation(ageDays) * D2R)) / 2;
}

/** Moon's ecliptic latitude (degrees). The orbit is tilted 5° and crosses the ecliptic at the nodes. */
export function moonEclipticLatitude(L: number, ageDays: number): number {
  const lambdaMoon = L + moonElongation(ageDays);
  return MOON_INCLINATION * Math.sin((lambdaMoon - MOON_NODE_L) * D2R);
}

function eclipticToEquatorial(lambda: number, beta: number): { ra: number; dec: number } {
  const e = TILT * D2R;
  const l = lambda * D2R;
  const b = beta * D2R;
  const dec = Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
  const ra = Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
  return { ra: ra * R2D, dec: dec * R2D };
}

/** Sub-lunar point (where the Moon is overhead) in the Earth-fixed frame. */
export function sublunarPoint(utc: number, L: number, ageDays: number, spin: 1 | -1 = 1): { lat: number; lon: number } {
  const sun = eclipticToEquatorial(L, 0);
  const moon = eclipticToEquatorial(L + moonElongation(ageDays), moonEclipticLatitude(L, ageDays));
  const sub = subsolarPoint(utc, L, spin);
  return { lat: moon.dec, lon: wrap180(sub.lon + spin * (moon.ra - sun.ra)) };
}

export function moonDirection(utc: number, L: number, ageDays: number, spin: 1 | -1 = 1): Vec3 {
  const s = sublunarPoint(utc, L, ageDays, spin);
  return latLonToVec(s.lat, s.lon);
}

export function moonPosition(lat: number, lon: number, utc: number, L: number, ageDays: number) {
  return horizonCoords(lat, lon, moonDirection(utc, L, ageDays));
}

/**
 * Solar eclipse geometry: where the shadow axis (from the Sun through the Moon) meets the Earth.
 * Returns null if the axis misses (the usual case: at most new moons the Moon passes above or
 * below the Sun because of the 5° tilt). Earth radius = 1, Moon at 60 radii.
 */
export function solarEclipseCenter(utc: number, L: number, ageDays: number): { lat: number; lon: number; miss: number } | null {
  const d = sunDirection(utc, L);
  const mDir = moonDirection(utc, L, ageDays);
  const m = { x: mDir.x * MOON_DISTANCE_RADII, y: mDir.y * MOON_DISTANCE_RADII, z: mDir.z * MOON_DISTANCE_RADII };
  const md = dot(m, d);
  if (md <= 0) return null; // Moon is on the far side
  const mm = dot(m, m);
  const miss = Math.sqrt(Math.max(0, mm - md * md)); // axis distance from Earth's centre
  if (miss >= 1) return null;
  const s = md - Math.sqrt(md * md - mm + 1);
  const p = { x: m.x - s * d.x, y: m.y - s * d.y, z: m.z - s * d.z };
  return { ...vecToLatLon(p), miss };
}

/** Totality zone radius on the toy planet, degrees of arc (schematic, much larger than real). */
export const TOTALITY_RADIUS = 9;

/** Lunar eclipse: the full Moon passes through Earth's shadow. True when the Moon is within ~1° of the anti-Sun point. */
export function lunarEclipse(L: number, ageDays: number): boolean {
  const elong = moonElongation(ageDays);
  const beta = moonEclipticLatitude(L, ageDays);
  const sep = Math.hypot(wrap180(elong - 180), beta);
  return sep < 1.0;
}

/** Solar eclipse is possible this new moon only if the Moon is within ~0.95° of the ecliptic. */
export function eclipsePossibleAtNewMoon(L: number): boolean {
  return Math.abs(moonEclipticLatitude(L, 0)) < Math.asin(1 / MOON_DISTANCE_RADII) * R2D;
}

// ---------------------------------------------------------------- tides

/**
 * Tide height (m) at a coast: two bulges (under the Moon and opposite), so two highs and two lows
 * a day. Spring tides (Sun–Moon aligned: new and full moon) are larger, neap tides (quarters)
 * smaller. `amplitude` is the coast's half-range at spring tide: ~0.15 m on the Mediterranean,
 * metres on open-ocean funnel coasts.
 */
export function tideHeight(lat: number, lon: number, utc: number, L: number, ageDays: number, amplitude: number): number {
  const sub = sublunarPoint(utc, L, ageDays);
  const hourAngle = (lon - sub.lon) * D2R;
  const spring = 0.65 + 0.35 * Math.cos(2 * moonElongation(ageDays) * D2R);
  return amplitude * spring * Math.cos(2 * hourAngle) * Math.cos(lat * D2R * 0.5);
}
