import type { Surface, Vec3 } from '../astro/astro';

export type ClockMode = 'local' | 'home' | 'utc' | 'sundial';

export type PlaceKind =
  | 'city'
  | 'hill'
  | 'cabin'
  | 'gate'
  | 'stones'
  | 'island'
  | 'beach'
  | 'dome'
  | 'pad'
  | 'snow'
  | 'lava'
  | 'field'
  | 'roof'
  | 'causeway-end'
  | 'fuji'
  | 'walls';

export interface Place {
  id: string;
  name: string;
  lat: number;
  lon: number;
  kind: PlaceKind;
  /** Radius of the zone in degrees of arc. */
  radius: number;
  surface?: Surface;
  airTemp?: number;
  /** Tide half-range at spring tide (m), for coasts. */
  tide?: number;
}

/** Everything a shot check can look at. Pure data computed by the sim each tick. */
export interface ShotCtx {
  lat: number;
  lon: number;
  utc: number;
  L: number;
  moonAge: number;
  spin: 1 | -1;
  localTime: number;
  /** Local calendar day index (0 = the level's day 0 at Greenwich; date line at 180°). */
  localDay: number;
  facing: number;
  sun: { elevation: number; azimuth: number };
  moon: { elevation: number; azimuth: number };
  place: Place | null;
  battery: number;
  /** Shots already taken in this level, with the context at the time. */
  taken: Record<string, ShotRecord>;
  viaTripod: boolean;
}

export interface ShotRecord {
  utc: number;
  L: number;
  moonAge: number;
  localDay: number;
  value?: number;
}

export type ShotResult =
  | { ok: true; quality: number; value?: number; note?: string }
  | { ok: false; why: string; consequence?: Consequence; /** How relevant this failure is when several open shots fail (higher wins). */ rel?: number };

export type Consequence = 'dark' | 'bear' | 'wave' | 'sulk' | 'shadow' | 'miss';

export interface ShotSpec {
  id: string;
  /** Short Hebrew label for the photo order card. */
  label: string;
  /** Lower-priority shots are tried later when several are open. */
  check: (c: ShotCtx) => ShotResult;
  /** If true, this shot can only be taken with the tripod (plant + wait). */
  tripod?: boolean;
  /** For tripod shots: the moment the tripod fires. */
  trigger?: (c: ShotCtx) => boolean;
}

export interface DialSpec {
  turns: number;
  /** Hide month/phase names (transfer levels). */
  unlabeled?: boolean;
}

export type HintOverlay =
  | { kind: 'terminator' }
  | { kind: 'meridian'; lon: number }
  | { kind: 'latitude'; lat: number }
  | { kind: 'subsolar' }
  | { kind: 'nodes' }
  | { kind: 'tide' };

export interface LevelDef {
  id: number;
  world: 1 | 2 | 3 | 4;
  title: string;
  /** One or two Hebrew lines on the photo order card. */
  brief: string;
  /** Short rule line shown in the replay card on failure. */
  rule: string;
  start: { lat: number; lon: number; heading: number; utc: number; L: number; moonAge?: number; battery: number };
  spin?: 1 | -1;
  /** Game-hours per real second. */
  rate: number;
  /** Fast-forward multiplier while T is held. */
  ffMult?: number;
  budgetHours: number;
  film: number;
  clock: ClockMode;
  homeLon?: number;
  homeName?: string;
  orbitDial?: DialSpec;
  moonDial?: DialSpec;
  places: Place[];
  shots: ShotSpec[];
  /** Grind rails along these latitudes. */
  rails?: number[];
  /** Night drain multiplier (1 = normal). */
  nightDrain?: number;
  cloud?: number;
  hint: string | null;
  hintOverlay?: HintOverlay;
  /** Short tutorial lines shown at the start (level 1 etc.). */
  tutorial?: string[];
  /** Level-specific mechanic. */
  special?: SpecialSpec;
  /** Explain a failure in one Hebrew line. */
  explain: (f: FailInfo) => string;
  /** Par dial turns for the third star. */
  parTurns?: number;
}

export type SpecialSpec =
  | { kind: 'tokens'; lat: number; lons: number[] }
  | { kind: 'dream'; afterShots: string[]; localTime: number }
  | { kind: 'greenhouse'; dome: string; band: [number, number]; hours: number; maxOutHours: number; outsideDay: number; outsideNight: number }
  | { kind: 'stations'; cards: { id: string; label: string; lat: number }[]; tolerance: number }
  | { kind: 'causeway'; from: { lat: number; lon: number }; to: { lat: number; lon: number }; tideAmp: number; openBelow: number; width: number }
  | { kind: 'bear'; place: string }
  | { kind: 'impossible'; shotId: string };

export interface FailInfo {
  kind: 'battery' | 'time' | 'film' | 'bear' | 'wave' | 'tripod' | 'greenhouse' | 'stations';
  lat: number;
  lon: number;
  utc: number;
  L: number;
  moonAge: number;
  localTime: number;
  lastWhy?: string;
}

export interface Input {
  /** −1..1, + = forward. */
  forward: number;
  /** −1..1, + = turn right (clockwise seen from above). */
  turn: number;
  jump: boolean;
  fastForward: boolean;
  shoot: boolean;
  orbitStep: -1 | 0 | 1;
  moonStep: -1 | 0 | 1;
  plant: boolean;
  hint: boolean;
  /** Greenhouse: toggle the sun shade. */
  toggleA: boolean;
  /** Greenhouse: toggle the heat-trap (vents closed). */
  toggleB: boolean;
  declareImpossible: boolean;
}

export const NO_INPUT: Input = {
  forward: 0,
  turn: 0,
  jump: false,
  fastForward: false,
  shoot: false,
  orbitStep: 0,
  moonStep: 0,
  plant: false,
  hint: false,
  toggleA: false,
  toggleB: false,
  declareImpossible: false,
};

export type { Vec3 };
