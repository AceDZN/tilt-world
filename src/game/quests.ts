// Replay: generated photo quests. Each quest is checked by playing it through the real sim:
// a planner that reads the rule wins, while "always take the June ticket" and "run east forever"
// both fail. Quests that don't pass all three checks are thrown away and the next seed is tried.
import { angularDistance, dateLabel, dayLength, declination, noonElevation, wrap180, wrap360 } from '../astro/astro';
import { createSim, facingAzimuth, latLon, shotCtx, step, ticketChoices, type SimState } from './sim';
import { NO_INPUT, type Input, type LevelDef, type Place, type ShotCtx, type ShotResult } from './types';

interface Spot {
  name: string;
  lat: number;
  lon: number;
}

const SOUTH: Spot[] = [
  { name: 'כף התקווה הטובה', lat: -34.4, lon: 18.5 },
  { name: 'ולינגטון', lat: -41.3, lon: 174.8 },
  { name: 'פטגוניה', lat: -50.0, lon: -72.0 },
  { name: 'טסמניה', lat: -42.0, lon: 146.5 },
  { name: 'בואנוס איירס', lat: -34.6, lon: -58.4 },
  { name: 'מלבורן', lat: -37.8, lon: 145.0 },
];
const TROPICS: Spot[] = [
  { name: "ריו דה ז'ניירו", lat: -22.9, lon: -43.2 },
  { name: 'לימה', lat: -12.0, lon: -77.0 },
  { name: 'מדגסקר', lat: -18.9, lon: 47.5 },
  { name: 'דרווין', lat: -12.5, lon: 130.8 },
  { name: 'ברבדוס', lat: 13.1, lon: -59.6 },
  { name: "צ'נאי", lat: 13.1, lon: 80.3 },
  { name: 'דקר', lat: 14.7, lon: -17.4 },
  { name: 'הוואי', lat: 19.9, lon: -155.6 },
  { name: 'טהיטי', lat: -17.6, lon: -149.4 },
];
const STATIONS: Spot[] = [
  { name: 'תחנת ירושלים', lat: 31.6, lon: 35.0 },
  { name: 'תחנת המשווה', lat: 0, lon: 20 },
  { name: 'תחנת האוקיינוס ההודי', lat: -10, lon: 75 },
  { name: 'תחנת האיים הקריביים', lat: 15, lon: -70 },
];

function rng(seed: number) {
  let s = (seed * 2654435761) % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
const pick = <T>(r: () => number, a: T[]) => a[Math.floor(r() * a.length)];
const utcAt = (local: number, lon: number) => (((local - lon / 15) % 24) + 24) % 24;
const ok = (q = 1): ShotResult => ({ ok: true, quality: q });
const no = (why: string, rel = 1): ShotResult => ({ ok: false, why, rel });

export type QuestKind = 'long-day' | 'overhead';

/** Both dates where the Sun is overhead at latitude lat (|lat| ≤ 23.5), as orbit longitudes. */
function overheadL(lat: number): [number, number] {
  const a = (Math.asin(Math.sin((lat * Math.PI) / 180) / Math.sin((23.5 * Math.PI) / 180)) * 180) / Math.PI;
  return [wrap360(a), wrap360(180 - a)];
}

export function makeQuest(seed: number): LevelDef {
  const r = rng(seed);
  const kind: QuestKind = r() < 0.5 ? 'long-day' : 'overhead';
  const st = pick(r, STATIONS);
  const station: Place = { id: 'station', name: 'תחנת רכבת הלוח', lat: st.lat, lon: st.lon, kind: 'station', radius: 1.2 };
  let target: Spot;
  let options: number[];
  let label: string;
  let check: (c: ShotCtx) => ShotResult;
  let rule: string;
  let brief: string;
  let startL: number;

  if (kind === 'long-day') {
    target = pick(r, SOUTH);
    const need = Math.round(dayLength(target.lat, 270) - 0.6 - r() * 0.8);
    label = `שקיעה ב${target.name} ביום של ${need} שעות אור לפחות`;
    brief = `המגזין רוצה שקיעה ארוכה: צלמי ב${target.name} ביום שבו האור נמשך ${need} שעות לפחות. יש כרטיס אחד.`;
    rule = 'בחצי הכדור הדרומי הימים הארוכים ביותר הם בדצמבר: אז הקוטב הדרומי נוטה אל השמש. ביוני שם חורף.';
    // Options: June always, December (the answer), one equinox, one wrong in-between date.
    options = [90, 270, pick(r, [0, 180]), pick(r, [45, 135, 315])];
    startL = pick(r, [120, 150, 200]);
    check = (c) => {
      if (angularDistance(c.lat, c.lon, target.lat, target.lon) > 2) return no(`הצילום צריך להיות ב${target.name}.`, 0);
      const len = dayLength(c.lat, c.L);
      if (len < need) return no(`ב-${dateLabel(c.L)} האור נמשך כאן רק ${len.toFixed(1)} שעות.`, 2);
      if (c.sun.elevation < -0.5 || c.sun.elevation > 5 || c.localTime < 12) return no('זה לא רגע השקיעה.');
      if (Math.abs(wrap180(c.facing - c.sun.azimuth)) > 45) return no('השמש לא בפריים.');
      return ok();
    };
  } else {
    target = pick(r, TROPICS);
    const [a, b] = overheadL(target.lat);
    const answer = pick(r, [a, b]);
    label = `${target.name}: השמש בדיוק מעל הראש (בלי צל)`;
    brief = `צלמי ב${target.name} רגע בלי צל — השמש בזנית. יש כרטיס אחד; התאריכים על הלוח.`;
    rule = 'השמש עומדת בזנית רק בין החוגים, ובכל קו רוחב כזה רק בשני תאריכים בשנה. ב-21 ביוני היא מעל חוג הסרטן בלבד.';
    const decoys = [90, 270, 0, 180].filter((L) => Math.abs(declination(L) - target.lat) > 3);
    options = [answer, ...decoys.slice(0, 3)].sort((x, y) => x - y);
    if (!options.includes(90)) options[options.length - 1] = 90;
    startL = wrap360(answer + 60 + r() * 60);
    check = (c) => {
      if (angularDistance(c.lat, c.lon, target.lat, target.lon) > 2) return no(`הצילום צריך להיות ב${target.name}.`, 0);
      if (c.sun.elevation >= 87) return ok();
      const noon = noonElevation(c.lat, c.L);
      return no(
        noon < 87
          ? `ב-${dateLabel(c.L)} השמש מגיעה כאן בצהריים רק ל-${noon.toFixed(0)}° — יש צל.`
          : `השמש כאן ${c.sun.elevation.toFixed(0)}° — עוד לא צהריים.`,
        noon < 87 ? 2 : 1,
      );
    };
  }

  // Shuffle the timetable so the answer is not always in the same slot.
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return {
    id: 100 + (seed % 900),
    world: 2,
    title: `משימה #${seed}`,
    brief,
    rule,
    start: { lat: st.lat, lon: st.lon, heading: 0, utc: utcAt(9, st.lon), L: startL, battery: 100 },
    rate: 0.1,
    budgetHours: 60,
    film: 3,
    clock: 'local',
    nightDrain: 0.5,
    sleep: { maxHours: 24 },
    tickets: { count: 1, station: 'station', options: options.map((L) => ({ kind: 'date' as const, L })) },
    parCommits: 2,
    places: [station, { id: 'target', name: target.name, lat: target.lat, lon: target.lon, kind: kind === 'long-day' ? 'beach' : 'island', radius: 2 }],
    shots: [{ id: 'quest', label, check }],
    hint: 'בתמונה מהחלל: לאיזה כיוון נוטה הציר בכל תאריך על הלוח?',
    hintOverlay: { kind: 'subsolar' },
    explain: (f) => (f.lastWhy ? `${f.lastWhy} ${rule}` : rule),
  };
}

// ---------------------------------------------------------------- verification by playing

const DT = 1 / 30;
function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
const alive = (st: SimState) => st.mode === 'play';
const tick = (st: SimState, i: Partial<Input> = {}) => step(st, { ...NO_INPUT, ...i }, DT);
function goTo(st: SimState, lat: number, lon: number, tol = 0.8) {
  for (let i = 0; i < 4000 && alive(st); i++) {
    const h = latLon(st);
    const d = angularDistance(h.lat, h.lon, lat, lon);
    if (d <= tol) return true;
    const diff = wrap180(bearing(h.lat, h.lon, lat, lon) - facingAzimuth(st));
    tick(st, { turn: Math.max(-1, Math.min(1, diff / 15)), forward: Math.abs(diff) < 20 ? Math.min(1, Math.max(0.05, d / 1.5)) : 0 });
  }
  return false;
}
function faceSun(st: SimState) {
  for (let i = 0; i < 200 && alive(st); i++) {
    const diff = wrap180(shotCtx(st).sun.azimuth - facingAzimuth(st));
    if (Math.abs(diff) < 2) return;
    tick(st, { turn: Math.max(-1, Math.min(1, diff / 10)) });
  }
}
function waitUntil(st: SimState, pred: (c: ShotCtx) => boolean, maxTicks = 3000) {
  for (let i = 0; i < maxTicks && alive(st); i++) {
    if (pred(shotCtx(st))) return true;
    tick(st);
  }
  return false;
}

/** Play the quest taking ticket option `choice`, then wait for the right moment and shoot. */
export function playWithTicket(level: LevelDef, choice: number): SimState {
  const st = createSim(level);
  tick(st, { ticket: choice });
  const t = level.places.find((p) => p.id === 'target')!;
  goTo(st, t.lat, t.lon, 0.8);
  const sunset = level.shots[0].label.startsWith('שקיעה');
  const target = sunset ? 17.5 : 11.8;
  const local = shotCtx(st).localTime;
  const h = Math.floor((((target - local) % 24) + 24) % 24 * 4) / 4;
  if (h > 0.25) tick(st, { sleep: h });
  if (sunset) {
    waitUntil(st, (c) => c.localTime > 12 && c.sun.elevation < 4);
    // a long southern summer day sets late: keep waiting until it is low
  } else waitUntil(st, (c) => c.sun.elevation >= 88 || c.localTime > 12.3);
  faceSun(st);
  tick(st, { shoot: true });
  return st;
}

/** The answer key: the option a rule-reader picks. */
export function plannedChoice(level: LevelDef): number {
  const winners: number[] = [];
  for (let i = 0; i < level.tickets!.options.length; i++) if (playWithTicket(level, i).mode === 'won') winners.push(i);
  // Exactly one ticket must work, so the quest is a real choice.
  return winners.length === 1 ? winners[0] : -1;
}

export interface QuestVerdict {
  solvable: boolean;
  answer: number;
  juneFails: boolean;
  eastFails: boolean;
}

export function verifyQuest(level: LevelDef): QuestVerdict {
  const answer = plannedChoice(level);
  const choices = ticketChoices(createSim(level));
  const june = choices.findIndex((c) => Math.abs(wrap180(c.L - 90)) < 2);
  const juneFails = june >= 0 && playWithTicket(level, june).mode !== 'won';
  // Run east forever, shooting whenever the target is underfoot.
  const east = createSim(level);
  for (let i = 0; i < 30 * 90 && alive(east); i++) {
    const c = shotCtx(east);
    tick(east, { forward: 1, turn: wrap180(90 - facingAzimuth(east)) / 30, shoot: c.place?.id === 'target' && i % 15 === 0 });
  }
  const eastFails = east.mode !== 'won';
  return { solvable: answer >= 0, answer, juneFails, eastFails };
}

/** First seed ≥ `seed` whose quest passes all three checks. */
export function verifiedQuest(seed: number): { level: LevelDef; seed: number; verdict: QuestVerdict } {
  for (let s = seed; s < seed + 50; s++) {
    const level = makeQuest(s);
    const verdict = verifyQuest(level);
    if (verdict.solvable && verdict.juneFails && verdict.eastFails) return { level, seed: s, verdict };
  }
  throw new Error(`no verified quest near seed ${seed}`);
}
