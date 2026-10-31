// Deterministic game simulation. Reads the pure astronomy module; never touches rendering.
import {
  ALBEDO,
  DIAL_STEP,
  YEAR_DAYS,
  angularDistance,
  batteryRate,
  dayOfYearFromL,
  greenhouseStep,
  horizonCoords,
  latLonToVec,
  lightAt,
  localDayIndex,
  localSolarTime,
  moonPosition,
  phaseAge,
  phaseIndex,
  snapDial,
  sunDirection,
  sunPosition,
  tideHeight,
  vecToLatLon,
  wrap180,
  wrap360,
  yearlyCurve,
  type Vec3,
} from '../astro/astro';
import type { FailInfo, Input, LevelDef, Place, ShotCtx, ShotRecord } from './types';

export const RUN_DEG_PER_SEC = 12;
export const BOOST = 1.35;
export const RAIL_BOOST = 1.7;
export const TURN_DEG_PER_SEC = 150;
export const JUMP_V = 7;
export const GRAVITY = 20;
export const GLIDE_FALL = 1.6;
export const DEFAULT_FF = 8;
/** The Moon dial sets the phase this many days before it's exact, so the event is still ahead. */
export const MOON_DIAL_LEAD_DAYS = 1 / 24;

export type Mode = 'play' | 'tripod' | 'won' | 'failed';

export interface Station {
  lat: number;
  lon: number;
}

export interface SimEvent {
  t: number;
  kind:
    | 'shot-ok'
    | 'shot-miss'
    | 'dial'
    | 'moon-dial'
    | 'token'
    | 'token-dark'
    | 'boost'
    | 'rail'
    | 'jump'
    | 'hint'
    | 'tripod'
    | 'dream'
    | 'station'
    | 'lever'
    | 'impossible-ok'
    | 'impossible-wrong'
    | 'fail'
    | 'win';
  text?: string;
  id?: string;
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
  L: number;
  moonAge: number;
  spin: 1 | -1;
  battery: number;
  hoursUsed: number;
  realTime: number;
  orbitTurns: number;
  moonTurns: number;
  film: number;
  misses: number;
  hintsUsed: number;
  hintOn: boolean;
  taken: Record<string, ShotRecord>;
  tokens: boolean[];
  dream: boolean;
  tripod: { lat: number; lon: number; facing: number } | null;
  stations: Station[];
  stationPlants: number;
  stationMatch: Record<string, number | null>;
  impossibleDeclared: boolean;
  gh: { temp: number; shade: boolean; trap: boolean; outHours: number; elapsed: number } | null;
  dayOfYear0: number;
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

export function createSim(level: LevelDef): SimState {
  const s = level.start;
  const pos = latLonToVec(s.lat, s.lon);
  const st: SimState = {
    level,
    mode: 'play',
    pos,
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
    orbitTurns: 0,
    moonTurns: 0,
    film: level.film,
    misses: 0,
    hintsUsed: 0,
    hintOn: false,
    taken: {},
    tokens: level.special?.kind === 'tokens' ? level.special.lons.map(() => false) : [],
    dream: false,
    tripod: null,
    stations: [],
    stationPlants: 0,
    stationMatch: {},
    impossibleDeclared: false,
    gh: null,
    dayOfYear0: Math.round(dayOfYearFromL(s.L) - s.utc / 24),
    boosted: false,
    fail: null,
    lastWhy: null,
    events: [],
    stars: 0,
  };
  if (level.special?.kind === 'greenhouse') st.gh = { temp: 22, shade: false, trap: false, outHours: 0, elapsed: 0 };
  if (level.special?.kind === 'stations') for (const c of level.special.cards) st.stationMatch[c.id] = null;
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
  const par = st.level.parTurns ?? 99;
  if (st.misses <= 1 && st.orbitTurns + st.moonTurns <= par) stars++;
  return stars;
}

function checkWin(st: SimState) {
  if (st.mode === 'won' || st.mode === 'failed') return;
  const sp = st.level.special;
  if (sp?.kind === 'tokens' && !st.tokens.every(Boolean)) return;
  if (sp?.kind === 'stations' && !Object.values(st.stationMatch).every((x) => x !== null)) return;
  if (sp?.kind === 'impossible' && !st.impossibleDeclared) return;
  if (sp?.kind === 'greenhouse' && (!st.gh || st.gh.elapsed < sp.hours)) return;
  if (!allShotsDone(st)) return;
  st.mode = 'won';
  st.stars = computeStars(st);
  st.events.push({ t: st.realTime, kind: 'win' });
}

function takeShot(st: SimState, viaTripod: boolean) {
  const c = shotCtx(st, viaTripod);
  const open = st.level.shots.filter((s) => !st.taken[s.id] && (viaTripod ? s.tripod : !s.tripod));
  if (!open.length) return;
  let firstWhy: string | null = null;
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
      firstWhy = r.why;
    }
  }
  st.misses++;
  st.lastWhy = firstWhy;
  st.events.push({ t: st.realTime, kind: 'shot-miss', text: firstWhy ?? '' });
  if (viaTripod) doFail(st, 'tripod');
}

function afterShot(st: SimState) {
  const sp = st.level.special;
  if (sp?.kind === 'dream' && !st.dream && sp.afterShots.every((id) => st.taken[id])) {
    st.dream = true;
    st.spin = -1;
    // Jump to the middle of the dream night: the subsolar point on the far side.
    const { lon } = latLon(st);
    let utc = 12 + wrap360(lon + 180) / 15;
    while (utc < st.utc) utc += 24;
    st.utc = utc;
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

export function step(st: SimState, input: Input, dt: number) {
  if (st.mode === 'won' || st.mode === 'failed') return;
  const lvl = st.level;
  st.realTime += dt;

  if (input.hint && lvl.hint) {
    if (!st.hintOn) st.events.push({ t: st.realTime, kind: 'hint' });
    st.hintOn = !st.hintOn;
    if (st.hintOn) st.hintsUsed = Math.max(st.hintsUsed, 1);
  }

  // Dials
  if (input.orbitStep && lvl.orbitDial && st.orbitTurns < lvl.orbitDial.turns && st.mode === 'play') {
    const before = st.L;
    st.L = nextDialPosition(st.L, input.orbitStep > 0 ? 1 : -1);
    if (st.L !== before) {
      st.orbitTurns++;
      st.dayOfYear0 = Math.round(dayOfYearFromL(st.L) - st.utc / 24);
      st.events.push({ t: st.realTime, kind: 'dial' });
    }
  }
  if (input.moonStep && lvl.moonDial && st.moonTurns < lvl.moonDial.turns && st.mode === 'play') {
    const idx = phaseIndex(st.moonAge + MOON_DIAL_LEAD_DAYS);
    st.moonAge = phaseAge(idx + input.moonStep) - MOON_DIAL_LEAD_DAYS;
    if (st.moonAge < 0) st.moonAge += 29.53;
    st.moonTurns++;
    st.events.push({ t: st.realTime, kind: 'moon-dial' });
  }

  if (input.declareImpossible && lvl.special?.kind === 'impossible' && !st.impossibleDeclared) {
    st.impossibleDeclared = true;
    st.events.push({ t: st.realTime, kind: 'impossible-ok' });
  }

  // Movement (not while the tripod is waiting, not in the dream)
  let { lat, lon } = latLon(st);
  const canMove = st.mode === 'play' && !st.dream;
  const sunNow = sunPosition(lat, lon, st.utc, st.L, st.spin);
  const light = lightAt(sunNow.elevation);
  const rising = sunPosition(lat, lon, st.utc + 0.05, st.L, st.spin).elevation > sunNow.elevation;
  st.boosted = light === 'twilight' && rising;
  let running = false;
  if (st.mode === 'play') {
    if (input.turn && st.grinding === null) turn(st, input.turn * TURN_DEG_PER_SEC * dt);
    if (canMove && input.forward) {
      const speed = RUN_DEG_PER_SEC * (st.boosted ? BOOST : 1) * (st.grinding !== null ? RAIL_BOOST : 1);
      moveForward(st, input.forward * speed * dt);
      running = true;
      if (st.grinding !== null) snapToRail(st, st.grinding);
    }
    // Jump / glide
    if (input.jump && st.height <= 0 && canMove) {
      st.vh = JUMP_V;
      st.height = 0.001;
      if (st.grinding !== null) st.grinding = null;
      st.events.push({ t: st.realTime, kind: 'jump' });
    }
    if (st.height > 0) {
      st.vh -= GRAVITY * dt;
      if (input.jump && st.vh < -GLIDE_FALL) st.vh = -GLIDE_FALL;
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

  // Plant (tripod or station)
  if (input.plant && st.mode === 'play') {
    if (lvl.special?.kind === 'stations') plantStation(st, lat, lon);
    else if (lvl.shots.some((s) => s.tripod && !st.taken[s.id])) {
      st.tripod = { lat, lon, facing: facingAzimuth(st) };
      st.mode = 'tripod';
      st.events.push({ t: st.realTime, kind: 'tripod' });
    }
  }

  // Greenhouse levers
  if (st.gh && lvl.special?.kind === 'greenhouse') {
    const dome = lvl.places.find((p) => p.id === (lvl.special as { dome: string }).dome);
    const atDome = dome ? angularDistance(lat, lon, dome.lat, dome.lon) <= dome.radius : true;
    if (atDome && input.toggleA) {
      st.gh.shade = !st.gh.shade;
      st.events.push({ t: st.realTime, kind: 'lever', id: 'shade' });
    }
    if (atDome && input.toggleB) {
      st.gh.trap = !st.gh.trap;
      st.events.push({ t: st.realTime, kind: 'lever', id: 'trap' });
    }
  }

  // Time
  const ff = st.mode === 'tripod' ? (lvl.ffMult ?? DEFAULT_FF) * 2 : input.fastForward ? lvl.ffMult ?? DEFAULT_FF : 1;
  const dg = dt * lvl.rate * ff;
  st.utc += dg;
  st.hoursUsed += dg;
  st.L = wrap360(st.L + (dg / 24) * (360 / YEAR_DAYS));
  st.moonAge = (st.moonAge + dg / 24) % 29.53;

  // Battery
  const place = placeAt(lvl, lat, lon);
  const albedo = place?.surface ? ALBEDO[place.surface] : 0.15;
  let rate = batteryRate({ elevation: sunNow.elevation, albedo, cloud: lvl.cloud, running });
  if (rate < 0 && sunNow.elevation < -6) rate *= lvl.nightDrain ?? 1;
  st.battery = Math.min(100, st.battery + rate * dg);
  if (st.battery <= 0) {
    st.battery = 0;
    doFail(st, 'battery');
    return;
  }

  // Specials
  specials(st, lat, lon, dg);
  if ((st.mode as Mode) === 'failed') return;

  // Shots
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
    const c = shotCtx(st, true);
    const spec = lvl.shots.find((s) => s.tripod && !st.taken[s.id]);
    if (spec?.trigger?.(c)) {
      takeShot(st, true);
      st.tripod = null;
      if (st.mode === 'tripod') st.mode = 'play';
    }
  }

  checkWin(st);
  if (st.mode === 'play' || st.mode === 'tripod') {
    if (st.hoursUsed >= lvl.budgetHours) doFail(st, 'time');
  }
}

/** Orbit dial step: from a dial position move one step; from between positions snap to the next one. */
export function nextDialPosition(L: number, dir: 1 | -1): number {
  const base = snapDial(L);
  const off = wrap180(L - base);
  if (Math.abs(off) < 2) return wrap360(base + dir * DIAL_STEP);
  if (dir > 0) return wrap360(off > 0 ? base + DIAL_STEP : base);
  return wrap360(off < 0 ? base - DIAL_STEP : base);
}

function plantStation(st: SimState, lat: number, lon: number) {
  const sp = st.level.special;
  if (sp?.kind !== 'stations') return;
  st.stationPlants++;
  st.stations.push({ lat, lon });
  if (st.stations.length > sp.cards.length) st.stations.shift();
  st.events.push({ t: st.realTime, kind: 'station' });
  matchStations(st);
  if (st.stationPlants >= sp.cards.length + 3 && !Object.values(st.stationMatch).every((x) => x !== null)) doFail(st, 'stations');
}

export function curveRms(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s / a.length);
}

/** Greedy matching of stations to climate cards by yearly-curve RMS. */
export function matchStations(st: SimState) {
  const sp = st.level.special;
  if (sp?.kind !== 'stations') return;
  const used = new Set<number>();
  for (const card of sp.cards) {
    st.stationMatch[card.id] = null;
    const target = yearlyCurve(card.lat);
    let best = -1;
    let bestE = Infinity;
    st.stations.forEach((s, i) => {
      if (used.has(i)) return;
      const e = curveRms(yearlyCurve(s.lat), target);
      if (e < bestE) {
        bestE = e;
        best = i;
      }
    });
    if (best >= 0 && bestE <= sp.tolerance) {
      st.stationMatch[card.id] = best;
      used.add(best);
    }
  }
}

function onSegment(lat: number, lon: number, a: { lat: number; lon: number }, b: { lat: number; lon: number }, width: number): boolean {
  const ab = angularDistance(a.lat, a.lon, b.lat, b.lon);
  const pa = angularDistance(lat, lon, a.lat, a.lon);
  const pb = angularDistance(lat, lon, b.lat, b.lon);
  return pa + pb - ab < width * 0.35 && pa > width && pb > width;
}

export function causewayTide(st: SimState): number {
  const sp = st.level.special;
  if (sp?.kind !== 'causeway') return 0;
  return tideHeight(sp.from.lat, sp.from.lon, st.utc, st.L, st.moonAge, sp.tideAmp);
}

function specials(st: SimState, lat: number, lon: number, dg: number) {
  const sp = st.level.special;
  if (!sp) return;
  if (sp.kind === 'tokens') {
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
  } else if (sp.kind === 'causeway') {
    if (onSegment(lat, lon, sp.from, sp.to, sp.width) && causewayTide(st) > sp.openBelow) doFail(st, 'wave');
  } else if (sp.kind === 'bear') {
    const cabin = st.level.places.find((p) => p.id === sp.place);
    if (cabin && angularDistance(lat, lon, cabin.lat, cabin.lon) <= cabin.radius) {
      const local = localSolarTime(st.utc, lon);
      const elev = sunPosition(lat, lon, st.utc, st.L).elevation;
      const nearMidnight = local >= 23 || local <= 1;
      if (nearMidnight && elev < -3) doFail(st, 'bear');
    }
  } else if (sp.kind === 'greenhouse' && st.gh) {
    const dome = st.level.places.find((p) => p.id === sp.dome)!;
    const elev = sunPosition(dome.lat, dome.lon, st.utc, st.L).elevation;
    const s = Math.max(0, Math.sin(elev * D2R));
    const outside = sp.outsideNight + (sp.outsideDay - sp.outsideNight) * s;
    const r = greenhouseStep(st.gh.temp, { elevation: elev, shade: st.gh.shade ? 0.7 : 0, trap: st.gh.trap ? 0.97 : 0, outsideC: outside }, dg);
    st.gh.temp = r.temp;
    st.gh.elapsed += dg;
    if (st.gh.temp < sp.band[0] || st.gh.temp > sp.band[1]) st.gh.outHours += dg;
    if (st.gh.outHours > sp.maxOutHours) doFail(st, 'greenhouse');
  }
}

/** Sun direction in the planet frame for rendering. */
export function sunDir(st: SimState): Vec3 {
  return sunDirection(st.utc, st.L, st.spin);
}
