import type { Surface, Vec3 } from '../astro/astro';

export type ClockMode = 'local' | 'home' | 'sundial' | 'hidden';

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
  | 'forest'
  | 'field'
  | 'roof'
  | 'causeway-end'
  | 'station'
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
  | { ok: false; why: string; consequence?: Consequence; /** Higher wins when several open shots fail. */ rel?: number };

export type Consequence = 'dark' | 'bear' | 'wave' | 'sulk' | 'shadow' | 'miss' | 'melt' | 'freeze';

export interface ShotSpec {
  id: string;
  /** Short Hebrew label for the photo order card. */
  label: string;
  check: (c: ShotCtx) => ShotResult;
  /** If true, this shot can only be taken with the tripod (plant + wait). */
  tripod?: boolean;
  /** For tripod shots: the moment the tripod fires. */
  trigger?: (c: ShotCtx) => boolean;
}

/** A calendar-train destination. Tickets only go forward in time and keep the time of day. */
export type TicketOption = { kind: 'date'; L: number } | { kind: 'newmoon' } | { kind: 'fullmoon' };

export interface TicketSpec {
  count: number;
  /** Station place id where tickets are sold. */
  station: string;
  /** Static date options; a moon option expands to the next `upcoming` new/full moons. */
  options: TicketOption[];
  upcoming?: number;
  /** Hide date names (transfer levels). */
  unlabeled?: boolean;
}

export interface SleepSpec {
  maxHours: number;
  /** World 4: the pod also offers whole days. */
  allowDays?: boolean;
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
  /** Clock state at level start: utc, and the date/moon age at that moment. */
  start: { lat: number; lon: number; heading: number; utc: number; L: number; moonAge?: number; battery: number };
  spin?: 1 | -1;
  /** Game-hours per real second (the clock's own, unchangeable pace). */
  rate: number;
  budgetHours: number;
  film: number;
  clock: ClockMode;
  homeLon?: number;
  homeName?: string;
  sleep?: SleepSpec;
  tickets?: TicketSpec;
  places: Place[];
  shots: ShotSpec[];
  /** Grind rails along these latitudes. */
  rails?: number[];
  /** Running speed multiplier off the rails (deep snow < 1). */
  groundSpeed?: number;
  /** Night drain multiplier (1 = normal). */
  nightDrain?: number;
  cloud?: number;
  /** Cloud deck hides the continents (Where am I?). */
  fogged?: boolean;
  hint: string | null;
  hintOverlay?: HintOverlay;
  /** Short tutorial lines shown at the start. */
  tutorial?: string[];
  special?: SpecialSpec;
  /** Explain a failure in one Hebrew line. */
  explain: (f: FailInfo) => string;
  /** Par tickets + sleeps for the third star. */
  parCommits?: number;
}

export type SpecialSpec =
  | { kind: 'tokens'; lat: number; lons: number[] }
  | { kind: 'dream'; afterShots: string[] }
  | { kind: 'causeway'; from: { lat: number; lon: number }; to: { lat: number; lon: number }; tideAmp: number; openBelow: number; width: number }
  | { kind: 'bear'; place: string }
  | { kind: 'impossible'; shotId: string; /** Declaring counts only after this shot is in the album. */ after?: string }
  | { kind: 'whereami'; rounds: { lat: number; lon: number }[] };

export const GEAR_NAMES = ['כובע שמש', 'מעיל', 'פרקה'];
export const ZONE_NAMES = ['האזור הטרופי', 'האזור הממוזג', 'האזור הקוטבי'];

export interface FailInfo {
  kind: 'battery' | 'time' | 'film' | 'bear' | 'wave' | 'tripod' | 'gear';
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
  shoot: boolean;
  /** Commit a sleep of this many game-hours (days = 24 × n). 0 = none. */
  sleep: number;
  /** Buy the ticket with this option index (−1 = none). Only at the station. */
  ticket: number;
  plant: boolean;
  hint: boolean;
  /** Where am I?: choose gear 0..2 (−1 = none). */
  gear: number;
  declareImpossible: boolean;
}

export const NO_INPUT: Input = {
  forward: 0,
  turn: 0,
  jump: false,
  shoot: false,
  sleep: 0,
  ticket: -1,
  plant: false,
  hint: false,
  gear: -1,
  declareImpossible: false,
};

export type { Vec3 };
