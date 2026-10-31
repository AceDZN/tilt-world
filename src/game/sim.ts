// Deterministic game simulation. Reads the pure astronomy module; never touches rendering.
//
// Time has one source: `utc`. It only increases: by the clock's own pace, by a committed sleep,
// or by a one-way calendar-train ticket. The date (orbit longitude L) and the Moon's age are
// derived from it, so no input can move the Earth, the Sun or the Moon.
import {
  ALBEDO,
  SYNODIC_DAYS,
  YEAR_DAYS,
  angularDistance,
  batteryRate,
  dateLabel,
  dayOfYearFromL,
  horizonCoords,
  lFromDayOfYear,
  latLonToVec,
  lightAt,
  localDayIndex,
  localSolarTime,
  moonPosition,
  sunDirection,
  sunPosition,
  tideHeight,
  utcForLocalTime,
  vecToLatLon,
  wrap180,
  wrap360,
  type Vec3,
} from '../astro/astro';
import { GEAR_NAMES, ZONE_NAMES, type FailInfo, type Input, type LevelDef, type Place, type ShotCtx, type ShotRecord } from './types';

export const RUN_DEG_PER_SEC = 12;
export const BOOST = 1.35;
export const RAIL_BOOST = 1.7;
export const TURN_DEG_PER_SEC = 150;
export const JUMP_V = 7;
export const GRAVITY = 20;
/** Game-hours per real second while the tripod waits for its event (the robot naps). */
export const TRIPOD_WAIT_RATE = 3;
/** Sleep is simulated in steps of this many game-hours so night drain and hazards still apply. */
export const SLEEP_STEP = 0.25;
export const SLEEP_NIGHT_DRAIN = 0.5;
export const SLEEP_CHARGE = 0.6;

export type Mode = 'play' | 'tripod' | 'won' | 'failed';

export interface SimEvent {
  t: number;
  kind:
    | 'shot-ok'
    | 'shot-miss'
    | 'sleep'
    | 'ticket'
    | 'token'
    | 'token-dark'
    | 'rail'
    | 'jump'
    | 'hint'
    | 'tripod'
    | 'dream'
    | 'gear-ok'
    | 'impossible-ok'
    | 'fail'
    | 'win';
  text?: string;
  id?: string;
  hours?: number;
}

export interface TicketChoice {
  label: string;
  days: number;
  /** Orbit longitude and moon age on arrival (for the timetable pictures). */
  L: number;
  moonAge: number;
}

export interface SimState {
  level: LevelDef;
  mode: Mode;
  pos: Vec3;
  heading: Vec3;
  height: number;
  vh: number;
  grinding: number | null;
  utc: number;
  /** Derived from utc every tick. */
  L: number;
  /** Derived from utc every tick. */
  moonAge: number;
  spin: 1 | -1;
  battery: number;
  hoursUsed: number;
  realTime: number;
  ticketsUsed: number;
  sleeps: number;
  film: number;
  misses: number;
  hintsUsed: number;
  hintOn: boolean;
  taken: Record<string, ShotRecord>;
  tokens: boolean[];
  dream: boolean;
  tripod: { lat: number; lon: number; facing: number } | null;
  round: number;
  impossibleDeclared: boolean;
  boosted: boolean;
  fail: FailInfo | null;
  lastWhy: string | null;
  events: SimEvent[];
  stars: number;
}

const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const add = (a: Vec3, b: Vec3, s = 1) => v(a.x + b.x * s, a.y + b.y * s, a.z + b.z * s);
const scale = (a: Vec3, s: number) => v(a.x * s, a.y * s, a.z * s);
const cross = (a: Vec3, b: Vec3) => v(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const norm = (a: Vec3) => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return v(a.x / l, a.y / l, a.z / l);
};
const dotv = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const D2R = Math.PI / 180;

/** Unit tangent vector pointing toward azimuth `az` (degrees clockwise from north) at a place. */
export function headingVector(lat: number, lon: number, az: number): Vec3 {
  const p = lat * D2R;
  const l = lon * D2R;
  const east = v(Math.cos(l), 0, -Math.sin(l));
  const north = v(-Math.sin(p) * Math.sin(l), Math.cos(p), -Math.sin(p) * Math.cos(l));
  return norm(add(scale(north, Math.cos(az * D2R)), east, Math.sin(az * D2R)));
}

/** Orbit longitude for a clock reading (the date follows the clock). */
export function orbitL(level: LevelDef, utc: number): number {
  return lFromDayOfYear(dayOfYearFromL(level.start.L) + (utc - level.start.utc) / 24);
}
/** Days since the new moon for a clock reading. */
export function moonAgeAt(level: LevelDef, utc: number): number {
  const a = ((level.start.moonAge ?? 10) + (utc - level.start.utc) / 24) % SYNODIC_DAYS;
  return a < 0 ? a + SYNODIC_DAYS : a;
}

function syncDerived(st: SimState) {
  st.L = orbitL(st.level, st.utc);
  st.moonAge = moonAgeAt(st.level, st.utc);
}

export function createSim(level: LevelDef): SimState {
  const s = level.start;
  const st: SimState = {
    level,
    mode: 'play',
    pos: latLonToVec(s.lat, s.lon),
    heading: headingVector(s.lat, s.lon, s.heading),
    height: 0,
    vh: 0,
    grinding: null,
    utc: s.utc,
    L: s.L,
    moonAge: s.moonAge ?? 10,
    spin: level.spin ?? 1,
    battery: s.battery,
    hoursUsed: 0,
    realTime: 0,
    ticketsUsed: 0,
    sleeps: 0,
    film: level.film,
    misses: 0,
    hintsUsed: 0,
    hintOn: false,
    taken: {},
    tokens: level.special?.kind === 'tokens' ? level.special.lons.map(() => false) : [],
    dream: false,
    tripod: null,
    round: 0,
    impossibleDeclared: false,
    boosted: false,
    fail: null,
    lastWhy: null,
    events: [],
    stars: 0,
  };
  syncDerived(st);
  return st;
}

export function latLon(st: SimState): { lat: number; lon: number } {
  return vecToLatLon(st.pos);
}

export function facingAzimuth(st: SimState): number {
  const { lat, lon } = latLon(st);
  return horizonCoords(lat, lon, st.heading).azimuth;
}

export function placeAt(level: LevelDef, lat: number, lon: number): Place | null {
  let best: Place | null = null;
  let bestD = Infinity;
  for (const p of level.places) {
    const d = angularDistance(lat, lon, p.lat, p.lon);
    if (d <= p.radius && d < bestD) {
      best = p;
      bestD = d;
    }
  }
  return best;
}

export function shotCtx(st: SimState, viaTripod = false): ShotCtx {
  const here = st.tripod && viaTripod ? { lat: st.tripod.lat, lon: st.tripod.lon } : latLon(st);
  const sun = sunPosition(here.lat, here.lon, st.utc, st.L, st.spin);
  const moon = moonPosition(here.lat, here.lon, st.utc, st.L, st.moonAge);
  return {
    lat: here.lat,
    lon: here.lon,
    utc: st.utc,
    L: st.L,
    moonAge: st.moonAge,
    spin: st.spin,
    localTime: localSolarTime(st.utc, here.lon),
    localDay: localDayIndex(st.utc, wrap180(here.lon)),
    facing: st.tripod && viaTripod ? st.tripod.facing : facingAzimuth(st),
    sun,
    moon,
    place: placeAt(st.level, here.lat, here.lon),
    battery: st.battery,
    taken: st.taken,
    viaTripod,
  };
}

export function allShotsDone(st: SimState): boolean {
  return st.level.shots.every((s) => st.taken[s.id]);
}

function failInfo(st: SimState, kind: FailInfo['kind']): FailInfo {
  const { lat, lon } = latLon(st);
  return { kind, lat, lon, utc: st.utc, L: st.L, moonAge: st.moonAge, localTime: localSolarTime(st.utc, lon), lastWhy: st.lastWhy ?? undefined };
}

function doFail(st: SimState, kind: FailInfo['kind']) {
  if (st.mode === 'won' || st.mode === 'failed') return;
  st.mode = 'failed';
  st.fail = failInfo(st, kind);
  st.events.push({ t: st.realTime, kind: 'fail', text: st.level.explain(st.fail) });
}

export function computeStars(st: SimState): number {
  let stars = 1;
  if (st.hintsUsed === 0) stars++;
  const par = st.level.parCommits ?? 99;
  if (st.misses <= 1 && st.ticketsUsed + st.sleeps <= par) stars++;
  return stars;
}

function checkWin(st: SimState) {
  if (st.mode === 'won' || st.mode === 'failed') return;
  const sp = st.level.special;
  if (sp?.kind === 'tokens' && !st.tokens.every(Boolean)) return;
  if (sp?.kind === 'impossible' && !st.impossibleDeclared) return;
  if (sp?.kind === 'whereami' && st.round < sp.rounds.length) return;
  if (!allShotsDone(st)) return;
  st.mode = 'won';
  st.stars = computeStars(st);
  st.events.push({ t: st.realTime, kind: 'win' });
}

function takeShot(st: SimState, viaTripod: boolean) {
  const c = shotCtx(st, viaTripod);
  const open = st.level.shots.filter((s) => !st.taken[s.id] && (viaTripod ? s.tripod : !s.tripod));
  if (!open.length) return;
  let why: string | null = null;
  let bestRel = -1;
  for (const spec of open) {
    const r = spec.check(c);
    if (r.ok) {
      st.taken[spec.id] = { utc: st.utc, L: st.L, moonAge: st.moonAge, localDay: c.localDay, value: r.value };
      st.events.push({ t: st.realTime, kind: 'shot-ok', id: spec.id, text: r.note });
      st.lastWhy = null;
      afterShot(st);
      checkWin(st);
      return;
    }
    const rel = r.rel ?? 1;
    if (rel > bestRel) {
      bestRel = rel;
      why = r.why;
    }
  }
  st.misses++;
  st.lastWhy = why;
  st.events.push({ t: st.realTime, kind: 'shot-miss', text: why ?? '' });
  if (viaTripod) doFail(st, 'tripod');
}

function afterShot(st: SimState) {
  const sp = st.level.special;
  if (sp?.kind === 'dream' && !st.dream && sp.afterShots.every((id) => st.taken[id])) {
    st.dream = true;
    st.spin = -1;
    // The dream begins in the middle of the night: the subsolar point on the far side.
    const { lon } = latLon(st);
    let utc = 12 + wrap360(lon + 180) / 15;
    while (utc < st.utc) utc += 24;
    advanceClock(st, utc - st.utc, 'sleep');
    st.events.push({ t: st.realTime, kind: 'dream' });
  }
}

/** Move along the surface by `deg` degrees of arc in the heading direction. */
function moveForward(st: SimState, deg: number) {
  const a = deg * D2R;
  const p = st.pos;
  const h = st.heading;
  st.pos = norm(add(scale(p, Math.cos(a)), h, Math.sin(a)));
  st.heading = norm(add(scale(h, Math.cos(a)), p, -Math.sin(a)));
}

function turn(st: SimState, deg: number) {
  const b = deg * D2R;
  const right = cross(st.heading, st.pos);
  st.heading = norm(add(scale(st.heading, Math.cos(b)), right, Math.sin(b)));
}

function snapToRail(st: SimState, railLat: number) {
  const { lon } = latLon(st);
  const eastward = dotv(st.heading, headingVector(railLat, lon, 90)) >= 0;
  st.pos = latLonToVec(railLat, lon);
  st.heading = headingVector(railLat, lon, eastward ? 90 : 270);
}

function surfaceAlbedo(st: SimState): number {
  const { lat, lon } = latLon(st);
  const place = placeAt(st.level, lat, lon);
  return place?.surface ? ALBEDO[place.surface] : 0.15;
}

/**
 * Advance the clock by dg game-hours, applying the battery and time-based hazards in small steps.
 * mode 'awake' = the clock's own pace; 'sleep' = in the pod (or napping by the tripod).
 */
function advanceClock(st: SimState, dg: number, mode: 'awake' | 'sleep', running = false) {
  let left = dg;
  while (left > 1e-9 && (st.mode === 'play' || st.mode === 'tripod')) {
    const d = Math.min(left, mode === 'sleep' ? SLEEP_STEP : left);
    left -= d;
    const { lat, lon } = latLon(st);
    const elev = sunPosition(lat, lon, st.utc, st.L, st.spin).elevation;
    let rate = batteryRate({ elevation: elev, albedo: surfaceAlbedo(st), cloud: st.level.cloud, running });
    if (rate < 0 && elev < -6) rate *= (st.level.nightDrain ?? 1) * (mode === 'sleep' ? SLEEP_NIGHT_DRAIN : 1);
    if (rate > 0 && mode === 'sleep') rate *= SLEEP_CHARGE;
    st.battery = Math.min(100, st.battery + rate * d);
    st.utc += d;
    st.hoursUsed += d;
    syncDerived(st);
    if (st.battery <= 0) {
      st.battery = 0;
      doFail(st, 'battery');
      return;
    }
    timeHazards(st);
    if (st.hoursUsed >= st.level.budgetHours && (st.mode === 'play' || st.mode === 'tripod')) doFail(st, 'time');
  }
}

/** Calendar-train timetable for the current moment. */
export function ticketChoices(st: SimState): TicketChoice[] {
  const spec = st.level.tickets;
  if (!spec) return [];
  const out: TicketChoice[] = [];
  const choice = (days: number, label: string) => {
    const utc = st.utc + days * 24;
    const L = orbitL(st.level, utc);
    const moonAge = moonAgeAt(st.level, utc);
    out.push({ label: spec.unlabeled ? '' : label || dateLabel(L), days, L, moonAge });
  };
  for (const o of spec.options) {
    if (o.kind === 'date') {
      let days = Math.round((((dayOfYearFromL(o.L) - dayOfYearFromL(st.L)) % 365) + 365) % 365);
      if (days < 1) days += 365;
      choice(days, '');
    } else {
      const target = o.kind === 'newmoon' ? 0 : SYNODIC_DAYS / 2;
      let first = (target - st.moonAge + SYNODIC_DAYS) % SYNODIC_DAYS;
      for (let j = 0; j < (spec.upcoming ?? 6); j++) {
        // Arrive on the morning-side of the event (0–24 h before it); the pod does the rest.
        let days = Math.floor(first + j * SYNODIC_DAYS);
        if (days < 1) days += Math.floor(SYNODIC_DAYS);
        const name = o.kind === 'newmoon' ? 'מולד' : 'ירח מלא';
        const L = orbitL(st.level, st.utc + days * 24);
        choice(days, `${name}, ${dateLabel(L)}`);
      }
      first = 0;
    }
  }
  return out;
}

export function atStation(st: SimState): boolean {
  const spec = st.level.tickets;
  if (!spec) return false;
  const { lat, lon } = latLon(st);
  return placeAt(st.level, lat, lon)?.id === spec.station;
}

/** Climate zone by latitude: 0 tropical, 1 temperate, 2 polar (the tropics and polar circles). */
export const zoneOf = (lat: number) => (Math.abs(lat) < 23.5 ? 0 : Math.abs(lat) < 66.5 ? 1 : 2);

function chooseGear(st: SimState, gear: number) {
  const sp = st.level.special;
  if (sp?.kind !== 'whereami' || st.round >= sp.rounds.length) return;
  const { lat } = latLon(st);
  const zone = zoneOf(lat);
  if (gear !== zone) {
    st.lastWhy =
      gear < zone
        ? `לבשת ${GEAR_NAMES[gear]} — אבל זה ${ZONE_NAMES[zone]}. צילה קפאה.`
        : `לבשת ${GEAR_NAMES[gear]} — אבל זה ${ZONE_NAMES[zone]}. צילה נמסה מחום.`;
    doFail(st, 'gear');
    return;
  }
  st.events.push({ t: st.realTime, kind: 'gear-ok', id: String(st.round), text: ZONE_NAMES[zone] });
  st.round++;
  if (st.round < sp.rounds.length) {
    // Fall asleep and wake somewhere new at 09:00 local time.
    const next = sp.rounds[st.round];
    st.pos = latLonToVec(next.lat, next.lon);
    st.heading = headingVector(next.lat, next.lon, 0);
    const wake = utcForLocalTime(9, next.lon, st.utc + 1);
    advanceClock(st, wake - st.utc, 'sleep');
  }
}

export function step(st: SimState, input: Input, dt: number) {
  if (st.mode === 'won' || st.mode === 'failed') return;
  const lvl = st.level;
  st.realTime += dt;

  if (input.hint && lvl.hint) {
    if (!st.hintOn) st.events.push({ t: st.realTime, kind: 'hint' });
    st.hintOn = !st.hintOn;
    if (st.hintOn) st.hintsUsed = Math.max(st.hintsUsed, 1);
  }

  // Commitments: a sleep or a ticket. Both only move the clock forward.
  if (st.mode === 'play' && input.sleep > 0 && lvl.sleep) {
    const hours = Math.min(lvl.sleep.allowDays ? 24 * 30 : lvl.sleep.maxHours, Math.max(0, input.sleep));
    st.sleeps++;
    st.events.push({ t: st.realTime, kind: 'sleep', hours });
    advanceClock(st, hours, 'sleep');
    if (st.mode !== 'play') return;
  }
  if (st.mode === 'play' && input.ticket >= 0 && lvl.tickets && st.ticketsUsed < lvl.tickets.count && atStation(st)) {
    const c = ticketChoices(st)[input.ticket];
    if (c) {
      st.ticketsUsed++;
      st.events.push({ t: st.realTime, kind: 'ticket', hours: c.days * 24, text: c.label });
      // The train has its own power and does not spend the level's light budget.
      st.utc += c.days * 24;
      syncDerived(st);
      if (st.mode !== 'play') return;
    }
  }
  if (st.mode === 'play' && input.gear >= 0) {
    chooseGear(st, input.gear);
    if (st.mode !== 'play') return;
  }
  if (input.declareImpossible && lvl.special?.kind === 'impossible' && !st.impossibleDeclared) {
    st.impossibleDeclared = true;
    st.events.push({ t: st.realTime, kind: 'impossible-ok' });
  }

  // Movement
  let { lat, lon } = latLon(st);
  const canMove = st.mode === 'play' && !st.dream;
  const sunNow = sunPosition(lat, lon, st.utc, st.L, st.spin);
  const rising = sunPosition(lat, lon, st.utc + 0.05, st.L, st.spin).elevation > sunNow.elevation;
  st.boosted = lightAt(sunNow.elevation) === 'twilight' && rising;
  let running = false;
  if (st.mode === 'play') {
    // Standing still and turning steps off the rail; while riding, the rail holds the heading.
    if (input.turn && st.grinding !== null && !input.forward) st.grinding = null;
    if (input.turn && st.grinding === null) turn(st, input.turn * TURN_DEG_PER_SEC * dt);
    if (canMove && input.forward) {
      const speed =
        RUN_DEG_PER_SEC * (st.boosted ? BOOST : 1) * (st.grinding !== null ? RAIL_BOOST : lvl.groundSpeed ?? 1);
      moveForward(st, input.forward * speed * dt);
      running = true;
      if (st.grinding !== null) snapToRail(st, st.grinding);
    }
    if (input.jump && st.height <= 0 && canMove) {
      st.vh = JUMP_V;
      st.height = 0.001;
      st.grinding = null;
      st.events.push({ t: st.realTime, kind: 'jump' });
    }
    if (st.height > 0) {
      st.vh -= GRAVITY * dt;
      st.height += st.vh * dt;
      if (st.height <= 0) {
        st.height = 0;
        st.vh = 0;
        const here = latLon(st);
        const rail = (lvl.rails ?? []).find((r) => Math.abs(here.lat - r) < 1.2);
        if (rail !== undefined) {
          st.grinding = rail;
          snapToRail(st, rail);
          st.events.push({ t: st.realTime, kind: 'rail' });
        }
      }
    }
  }
  ({ lat, lon } = latLon(st));

  if (input.plant && st.mode === 'play' && lvl.shots.some((s) => s.tripod && !st.taken[s.id])) {
    st.tripod = { lat, lon, facing: facingAzimuth(st) };
    st.mode = 'tripod';
    st.events.push({ t: st.realTime, kind: 'tripod' });
  }

  // The clock's own pace (faster while the tripod waits and Tzila naps beside it).
  advanceClock(st, dt * (st.mode === 'tripod' ? TRIPOD_WAIT_RATE : lvl.rate), st.mode === 'tripod' ? 'sleep' : 'awake', running);
  if ((st.mode as Mode) === 'failed') return;
  positionHazards(st, lat, lon);
  if ((st.mode as Mode) === 'failed') return;

  if (input.shoot && st.mode === 'play' && lvl.shots.some((x) => !x.tripod)) {
    if (st.film <= 0) {
      doFail(st, 'film');
      return;
    }
    st.film--;
    takeShot(st, false);
    if (st.mode === 'play' && st.film <= 0 && !allShotsDone(st)) {
      doFail(st, 'film');
      return;
    }
  }
  if (st.mode === 'tripod') {
    const spec = lvl.shots.find((s) => s.tripod && !st.taken[s.id]);
    if (spec?.trigger?.(shotCtx(st, true))) {
      takeShot(st, true);
      st.tripod = null;
      if (st.mode === 'tripod') st.mode = 'play';
    }
  }
  checkWin(st);
}

/**
 * The tidal flat around the island: every point closer to the island end of the causeway than the
 * causeway is long, except the island itself and the mainland end. You cannot walk around it.
 */
export function onTidalFlat(st: SimState, lat: number, lon: number): boolean {
  const sp = st.level.special;
  if (sp?.kind !== 'causeway') return false;
  const ab = angularDistance(sp.from.lat, sp.from.lon, sp.to.lat, sp.to.lon);
  if (angularDistance(lat, lon, sp.to.lat, sp.to.lon) >= ab) return false;
  if (angularDistance(lat, lon, sp.from.lat, sp.from.lon) < sp.width * 0.5) return false;
  return placeAt(st.level, lat, lon)?.kind !== 'island';
}

export function causewayTide(st: SimState): number {
  const sp = st.level.special;
  if (sp?.kind !== 'causeway') return 0;
  return tideHeight(sp.from.lat, sp.from.lon, st.utc, st.L, st.moonAge, sp.tideAmp);
}

/** Hazards that depend on time at the robot's position (checked during sleep too). */
function timeHazards(st: SimState) {
  const sp = st.level.special;
  if (!sp) return;
  const { lat, lon } = latLon(st);
  if (sp.kind === 'causeway') {
    if (onTidalFlat(st, lat, lon) && causewayTide(st) > sp.openBelow) doFail(st, 'wave');
  } else if (sp.kind === 'bear') {
    const cabin = st.level.places.find((p) => p.id === sp.place);
    if (cabin && angularDistance(lat, lon, cabin.lat, cabin.lon) <= cabin.radius) {
      const local = localSolarTime(st.utc, lon);
      const elev = sunPosition(lat, lon, st.utc, st.L).elevation;
      if ((local >= 23 || local <= 1) && elev < -3) doFail(st, 'bear');
    }
  }
}

function positionHazards(st: SimState, lat: number, lon: number) {
  const sp = st.level.special;
  if (sp?.kind === 'tokens') {
    const light = lightAt(sunPosition(lat, lon, st.utc, st.L, st.spin).elevation);
    sp.lons.forEach((tl, i) => {
      if (st.tokens[i]) return;
      if (angularDistance(lat, lon, sp.lat, tl) < 1.6) {
        if (light === 'twilight') {
          st.tokens[i] = true;
          st.events.push({ t: st.realTime, kind: 'token', id: String(i) });
        } else if (!st.events.some((e) => e.kind === 'token-dark' && e.id === String(i) && st.realTime - e.t < 1)) {
          st.events.push({ t: st.realTime, kind: 'token-dark', id: String(i) });
        }
      }
    });
  }
  timeHazards(st);
}

/** Sun direction in the planet frame for rendering. */
export function sunDir(st: SimState): Vec3 {
  return sunDirection(st.utc, st.L, st.spin);
}

export { dayOfYearFromL };
