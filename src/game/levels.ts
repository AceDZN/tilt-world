// The 18 authored levels. All rule values come from the astronomy module.
// Time moves only forward: the clock's own pace, a committed sleep, or a one-way ticket.
import {
  TOTALITY_RADIUS,
  angularDistance,
  dateLabel,
  dayKind,
  dayLength,
  lunarEclipse,
  monthlyTemperature,
  moonEclipticLatitude,
  noonElevation,
  phaseIndex,
  shadowLength,
  solarEclipseCenter,
  surfaceTemperature,
  tideHeight,
  wrap180,
  wrap24,
  type Surface,
} from '../astro/astro';
import type { Consequence, FailInfo, LevelDef, Place, ShotCtx, ShotResult } from './types';

/** UTC at which a longitude has a given local solar time (0 ≤ result < 24). */
export const utcAt = (local: number, lon: number) => wrap24(local - lon / 15);

const ok = (quality = 1, value?: number, note?: string): ShotResult => ({ ok: true, quality, value, note });
const no = (why: string, consequence?: Consequence, rel?: number): ShotResult => ({ ok: false, why, consequence, rel: rel ?? (consequence ? 2 : 1) });
/** Wrong place: the least informative failure when several shots are open. */
const away = (why: string): ShotResult => no(why, undefined, 0);

const angDiff = (a: number, b: number) => Math.abs(wrap180(a - b));
const fmt = (n: number, d = 0) => n.toFixed(d);
export const hhmm = (h: number) => {
  const m = Math.round(wrap24(h) * 60) % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
const at = (c: ShotCtx, id: string) => c.place?.id === id;
const facingSun = (c: ShotCtx, tol = 45) => angDiff(c.facing, c.sun.azimuth) <= tol;
const facingMoon = (c: ShotCtx, tol = 45) => angDiff(c.facing, c.moon.azimuth) <= tol;
const quality = (c: ShotCtx, tol = 45) => Math.max(0.3, 1 - angDiff(c.facing, c.sun.azimuth) / (tol * 2));
const morning = (c: ShotCtx) => c.localTime < 12;

const place = (id: string, name: string, lat: number, lon: number, kind: Place['kind'], radius: number, extra: Partial<Place> = {}): Place => ({
  id,
  name,
  lat,
  lon,
  kind,
  radius,
  ...extra,
});
const station = (lat: number, lon: number): Place => place('station', 'תחנת רכבת הלוח', lat, lon, 'station', 1.2);

const DEFAULT_FAIL: Record<FailInfo['kind'], string> = {
  battery: 'הסוללה נגמרה בחושך. בלילה הפאנלים לא נטענים — צריך להגיע לאור בזמן.',
  time: 'אור הסרט נגמר. התכנון חשוב יותר מהריצה: איפה ומתי זה קורה?',
  film: 'נגמר הסרט. כל תמונה עולה פריים — צלמי רק כשהתנאים נכונים.',
  bear: 'דב הקוטב גנב את החצובה בחושך.',
  wave: 'הגאות כיסתה את הדרך וגל סחף אותך.',
  tripod: 'החצובה צילמה — אבל השמש לא הייתה בפריים.',
  gear: 'הציוד לא התאים לאזור האקלים.',
};

const explainWith =
  (custom: Partial<Record<FailInfo['kind'], (f: FailInfo) => string>>) =>
  (f: FailInfo): string => {
    const c = custom[f.kind];
    if (c) return c(f);
    if (f.kind === 'film' && f.lastWhy) return `${f.lastWhy} ${DEFAULT_FAIL.film}`;
    return DEFAULT_FAIL[f.kind];
  };

const SLEEP_HOURS = { maxHours: 24 };
const SLEEP_DAYS = { maxHours: 24, allowDays: true };

// ------------------------------------------------------------------ places

const JERUSALEM = place('jerusalem', 'ירושלים', 31.78, 35.22, 'walls', 1.6, { surface: 'city' });
const HERMON = place('hermon', 'החרמון', 33.4, 35.8, 'snow', 1.0, { surface: 'snow', airTemp: -2 });
const DHAKA = place('dhaka', 'דאקה', 23.8, 90, 'city', 3, { surface: 'city' });
const ACCRA = place('accra', 'אקרה', 5.6, 0, 'city', 2.5, { surface: 'city' });

// ------------------------------------------------------------------ World 1: rotation

const L1: LevelDef = {
  id: 1,
  world: 1,
  title: 'הזריחה הראשונה',
  brief: 'צלמי את הזריחה הראשונה של הבוקר. השחר מתקרב — אבל הסוללה כמעט ריקה.',
  rule: 'כדור הארץ מסתובב ממערב למזרח, 15° בשעה. מי שרצה מזרחה פוגשת את הזריחה מוקדם יותר.',
  start: { lat: 20, lon: 0, heading: 90, utc: utcAt(4 + 40 / 60, 0), L: 0, battery: 18 },
  rate: 0.25,
  budgetHours: 1.3,
  film: 3,
  clock: 'local',
  nightDrain: 3,
  places: [],
  shots: [
    {
      id: 'sunrise',
      label: 'זריחה: השמש מציצה מעל האופק',
      check: (c) => {
        if (c.sun.elevation < -0.5) return no('השמש עוד מתחת לאופק — עוד לא זריחה.');
        if (c.sun.elevation > 6) return no('השמש כבר גבוהה מדי — זה כבר לא רגע הזריחה.');
        if (!morning(c)) return no('זו שקיעה, לא זריחה!');
        if (!facingSun(c)) return no('השמש לא בפריים. הסתובבי אליה.');
        return ok(quality(c));
      },
    },
  ],
  hint: 'האור מגיע מהקו הכתום. הוא זז מערבה — לכיוונך.',
  hintOverlay: { kind: 'terminator' },
  tutorial: ['צפון תמיד למעלה במצפן ובמפה, ומזרח מימין.', 'השחר מגיע ממזרח. רוצי לקראתו! (W או ↑)', 'כשהשמש מציצה — E לצילום.'],
  explain: explainWith({
    battery: () => 'חיכית לשחר במקום: הוא זז רק 15° בשעה, והסוללה נגמרה לפני שהגיע. ריצה מזרחה מקדימה את הזריחה.',
    time: () => 'השחר זז רק 15° בשעה. ריצה מזרחה לקראתו מקצרת את ההמתנה.',
  }),
  parCommits: 0,
};

const L2: LevelDef = {
  id: 2,
  world: 1,
  title: 'השמש "זזה"',
  brief: 'מאותה גבעה: צלמי את הזריחה ואת השקיעה. לאן פונה השמש בכל אחת?',
  rule: 'השמש לא זזה: כדור הארץ מסתובב ממערב למזרח, ולכן השמש נראית עולה במזרח ושוקעת במערב (תנועה מדומה).',
  start: { lat: 31.78, lon: 35.22, heading: 0, utc: utcAt(5.6, 35.22), L: 0, battery: 90 },
  rate: 0.1,
  budgetHours: 40,
  film: 5,
  clock: 'local',
  sleep: SLEEP_HOURS,
  places: [place('hill', 'גבעת המצפה', 31.78, 35.22, 'hill', 2.2)],
  shots: [
    {
      id: 'east',
      label: 'זריחה מהגבעה',
      check: (c) => {
        if (!at(c, 'hill')) return away('הצילומים צריכים להיות מהגבעה.');
        if (c.sun.elevation < -0.5 || c.sun.elevation > 6) return no('זה לא רגע זריחה או שקיעה.');
        if (!morning(c)) return no('זו לא הזריחה.');
        if (!facingSun(c, 40)) return no('השמש לא בפריים — לאן הסתכלת?');
        return ok(quality(c, 40), c.sun.azimuth);
      },
    },
    {
      id: 'west',
      label: 'שקיעה מאותה גבעה',
      check: (c) => {
        if (!at(c, 'hill')) return away('הצילומים צריכים להיות מהגבעה.');
        if (c.sun.elevation < -0.5 || c.sun.elevation > 6) return no('זה לא רגע זריחה או שקיעה.');
        if (morning(c)) return no('זו לא השקיעה.');
        if (!facingSun(c, 40)) return no('השמש לא בפריים — לאן הסתכלת?');
        return ok(quality(c, 40), c.sun.azimuth);
      },
    },
    {
      id: 'mirror',
      label: 'בחלום: לאן תזרח השמש?',
      tripod: true,
      trigger: (c) => c.sun.elevation > 0.5,
      check: (c) => {
        const dir = c.sun.azimuth > 180 ? 'במערב' : 'במזרח';
        if (!facingSun(c, 40)) return no(`בעולם ההפוך השמש זרחה ${dir} — והחצובה הסתכלה לכיוון אחר.`);
        return ok(quality(c, 40), c.sun.azimuth, 'בעולם ההפוך הסיבוב התהפך — והשמש זרחה במערב!');
      },
    },
  ],
  special: { kind: 'dream', afterShots: ['east', 'west'] },
  hint: 'עקבי אחרי הקו הכתום: הוא תמיד מגיע מהצד שאליו כדור הארץ מסתובב.',
  hintOverlay: { kind: 'terminator' },
  tutorial: ['תא השינה (Z): בחרי כמה שעות לישון — ואז אין חרטות.', 'סובבי עם A/D, וצלמי עם E.'],
  explain: explainWith({
    tripod: (f) => `${f.lastWhy ?? ''} אם כדור הארץ מסתובב הפוך — ממזרח למערב — השמש נראית עולה במערב.`,
  }),
  parCommits: 1,
};

const L3: LevelDef = {
  id: 3,
  world: 1,
  title: 'גלישה על הדמדומים',
  brief: 'אספי 8 פריימים של "שעת זהב" לאורך קו רוחב 50°. כל פריים מתפתח רק באור הדמדומים.',
  rule: 'אזור הדמדומים נע מערבה 15° בשעה. כדי להישאר בו צריך לנוע מערבה באותה מהירות.',
  start: { lat: 50, lon: 2, heading: 270, utc: utcAt(5.5, 2), L: 0, battery: 55 },
  rate: 1.5,
  budgetHours: 8,
  film: 0,
  clock: 'local',
  rails: [50],
  nightDrain: 4,
  places: [],
  shots: [],
  special: { kind: 'tokens', lat: 50, lons: [-10, -22, -34, -46, -58, -70, -82, -94] },
  hint: 'הדמדומים זזים 15° בשעה. רוצי מערבה על המסילה — לא מהר מדי ולא לאט מדי.',
  hintOverlay: { kind: 'terminator' },
  tutorial: ['קפצי (רווח) ונחתי על המסילה — קו רוחב 50° — כדי לגלוש מהר.', 'הישארי ברצועה הכתומה: בלילה הסוללה נגמרת.'],
  explain: explainWith({
    battery: () => 'גלשת אל הלילה: מערבה מהדמדומים עוד חושך. הקו זז 15° בשעה — חכי לו, אל תברחי ממנו.',
    time: () => 'הדמדומים התרחקו ממך. הם זזים מערבה 15° בשעה — צריך לשמור על הקצב.',
  }),
};

const L4: LevelDef = {
  id: 4,
  world: 1,
  title: '15° לשעה',
  brief: 'חבר מדאקה (90° מזרחה) מבקש: "צלמי אותי בשוק ב-14:00 שלי!" השעון שלך מראה רק את השעה באקרה.',
  rule: 'כל 15° מזרחה השעה מאוחרת בשעה. 90° = 6 שעות. (בעולם הזה כל אזור זמן הוא 15° בדיוק.)',
  start: { lat: 5.6, lon: 0, heading: 70, utc: utcAt(6, 0), L: 0, battery: 70 },
  rate: 0.2,
  budgetHours: 16,
  film: 3,
  clock: 'home',
  nightDrain: 3,
  homeLon: 0,
  homeName: 'אקרה',
  sleep: SLEEP_HOURS,
  places: [ACCRA, DHAKA],
  shots: [
    {
      id: 'dhaka',
      label: 'דאקה, 14:00 שעון דאקה',
      check: (c) => {
        if (!at(c, 'dhaka')) return away('את לא בדאקה.');
        if (c.sun.elevation < -2) return no('בדאקה עכשיו לילה. השוק סגור והחבר הלך לישון.', 'dark');
        if (Math.abs(c.localTime - 14) > 0.5) return no('השעה בדאקה עכשיו היא לא 14:00. החבר עוד לא בשוק.');
        return ok(1 - Math.abs(c.localTime - 14));
      },
    },
  ],
  hint: 'מצאי את קו האורך של דאקה. כמה שעות הפרש יש בין 0° ל-90°?',
  hintOverlay: { kind: 'meridian', lon: 90 },
  explain: explainWith({
    battery: (f) =>
      `דאקה נמצאת 90° מזרחה ממך: השעה שם מאוחרת ב-6 שעות. כשבשעון שלך ${hhmm(f.utc)}, בדאקה כבר ${hhmm(f.utc + 6)} — ${
        Math.abs(wrap24(f.utc + 6) - 12) > 6 ? 'לילה' : 'יום'
      }.`,
    time: () => 'דאקה נמצאת 90° מזרחה: 14:00 בדאקה = 08:00 בשעון שלך.',
    film: () => 'דאקה 90° מזרחה = 6 שעות קדימה. 14:00 שם = 08:00 בשעון אקרה.',
  }),
  parCommits: 1,
};

const FIJI = place('fiji', "פיג'י", -17, 178.5, 'island', 2.2, { surface: 'sand' });
const SAMOA = place('samoa', 'סמואה האמריקנית', -14.3, -170.7, 'island', 2.2, { surface: 'sand' });
function fireworks(c: ShotCtx, id: string): ShotResult {
  if (!at(c, id)) return away('זיקוקים יש רק בשני האיים.');
  if (c.localDay < 0) return no('כאן עכשיו 30 באוקטובר — יום לפני יום ההולדת. עברת את קו התאריך מזרחה, אז התאריך ירד ביום. החגיגה תגיע — צריך לחכות לה.');
  if (c.localDay > 0) return no('כאן כבר 1 בנובמבר — יום ההולדת נגמר.');
  if (Math.abs(c.localTime - 20) > 0.5) return no(`השעה כאן ${hhmm(c.localTime)}. הזיקוקים ב-20:00.`);
  return ok(1);
}
const L5: LevelDef = {
  id: 5,
  world: 1,
  title: 'יום הולדת פעמיים',
  brief: "יום ההולדת שלך: 31 באוקטובר. צלמי את הזיקוקים של 20:00 בפיג'י — ואז חגגי שוב, באי אחר, באותו תאריך.",
  rule: 'קו התאריך הבין-לאומי (כאן: קו אורך 180°) עובר באוקיינוס. מי שחוצה אותו מזרחה חוזרת יום אחד בתאריך — אבל לא בזמן.',
  start: { lat: -17, lon: 178.5, heading: 90, utc: utcAt(19.6, 178.5), L: 220.7, battery: 100 },
  rate: 0.15,
  budgetHours: 28,
  film: 4,
  clock: 'local',
  sleep: SLEEP_HOURS,
  places: [FIJI, SAMOA],
  shots: [
    { id: 'fiji', label: "זיקוקים בפיג'י, 31.10, 20:00", check: (c) => fireworks(c, 'fiji') },
    { id: 'samoa', label: 'עוד חגיגה: סמואה האמריקנית, 31.10, 20:00', check: (c) => fireworks(c, 'samoa') },
  ],
  hint: 'קו התאריך מסומן. מה קורה לתאריך כשחוצים אותו מזרחה?',
  hintOverlay: { kind: 'meridian', lon: 180 },
  explain: explainWith({
    time: () => 'חציית קו התאריך מזרחה מחזירה את התאריך ביום — אבל את לא חוזרת בזמן. צריך לחכות שהערב של 31 באוקטובר יגיע לסמואה.',
  }),
  parCommits: 1,
};

// ------------------------------------------------------------------ World 2: revolution and tilt

const DATE_TICKETS = [0, 90, 180, 270].map((L) => ({ kind: 'date' as const, L }));

export const hermonSnow = (L: number) => monthlyTemperature(33.4, L) < 10;
export const sydneySummer = (L: number) => monthlyTemperature(-33.9, L) > 21;
const SYDNEY = place('sydney', 'החוף בסידני', -33.9, 151.2, 'beach', 2.4, { surface: 'sand' });
const L6: LevelDef = {
  id: 6,
  world: 2,
  title: 'זה לא המרחק',
  brief: 'צלמי שלג על החרמון וחוף קיצי בסידני — באותו תאריך. בתחנה יש כרטיס אחד לרכבת הלוח.',
  rule: 'העונות נובעות מנטיית הציר, לא מהמרחק: בינואר כדור הארץ הכי קרוב לשמש — וזה חורף בחצי הצפוני וקיץ בחצי הדרומי.',
  start: { lat: 31.6, lon: 35.0, heading: 0, utc: utcAt(9, 35), L: 180, battery: 85 },
  rate: 0.1,
  budgetHours: 30,
  film: 4,
  clock: 'local',
  sleep: SLEEP_HOURS,
  tickets: { count: 1, station: 'station', options: [...DATE_TICKETS, { kind: 'date', L: 300 }] },
  parCommits: 2,
  places: [station(31.6, 35.0), HERMON, SYDNEY],
  shots: [
    {
      id: 'hermon',
      label: 'שלג על החרמון',
      check: (c) => {
        if (!at(c, 'hermon')) return away('צריך להיות על החרמון.');
        if (c.sun.elevation < 5) return no('חשוך מדי לצילום.');
        if (!hermonSnow(c.L)) return no(`ב-${dateLabel(c.L)} אין שלג על החרמון.`);
        if (c.taken.sydney && Math.abs(wrap180(c.taken.sydney.L - c.L)) > 3) return no('שתי התמונות צריכות להיות מאותו תאריך.');
        return ok(1);
      },
    },
    {
      id: 'sydney',
      label: 'חוף קיצי בסידני',
      check: (c) => {
        if (!at(c, 'sydney')) return away('צריך להיות בחוף בסידני.');
        if (c.sun.elevation < 5) return no('חשוך מדי לצילום.');
        if (!sydneySummer(c.L)) return no(`ב-${dateLabel(c.L)} בסידני לא קיץ — החוף ריק וקר.`);
        if (c.taken.hermon && Math.abs(wrap180(c.taken.hermon.L - c.L)) > 3) return no('שתי התמונות צריכות להיות מאותו תאריך.');
        return ok(1);
      },
    },
  ],
  hint: 'הנקודה שבה השמש בדיוק מעל הראש מסומנת. באיזה חצי כדור היא בינואר?',
  hintOverlay: { kind: 'subsolar' },
  tutorial: ['רכבת הלוח (C, בתחנה): כרטיס לכיוון אחד לתאריך. אי אפשר לחזור אחורה.'],
  explain: explainWith({}),
};

const GATE_EQ = place('gate-eq', 'שער הקרח במשווה', 0, 33, 'gate', 1.5);
const GATE_TROPIC = place('gate-tropic', 'שער הקרח בחוג הסרטן', 23.5, 33, 'gate', 1.5);
const GATE_NORTH = place('gate-north', 'שער הקרח ב-40° צפון', 40, 33, 'gate', 1.5);
function gateCheck(c: ShotCtx, id: string): ShotResult {
  if (!at(c, id)) {
    if (at(c, 'gate-north')) return no('ב-40° צפון השמש אף פעם לא מגיעה לזנית — גם לא ב-21 ביוני. הצל נשאר.', 'shadow');
    return away('צריך לעמוד מול שער הקרח.');
  }
  if (c.sun.elevation >= 87) return ok(Math.min(1, (c.sun.elevation - 85) / 5));
  const noonEl = noonElevation(c.lat, c.L);
  return no(
    `השמש כאן ${fmt(c.sun.elevation)}° מעל האופק. ${noonEl < 87 ? `גם בצהריים של ${dateLabel(c.L)} היא תגיע רק ל-${fmt(noonEl)}°` : 'עוד לא צהריים'} — הקרניים אלכסוניות, הצל ארוך והקרח לא נמס.`,
    'shadow',
  );
}
const L7: LevelDef = {
  id: 7,
  world: 2,
  title: 'בדיוק מעל הראש',
  brief: 'המיסי שני שערי קרח בקרן שמש אנכית (בלי צל): השער במשווה והשער בחוג הסרטן. כרטיס אחד.',
  rule: 'השמש עומדת בזנית רק בין חוג הסרטן לחוג הגדי: ביום השוויון מעל קו המשווה, ב-21 ביוני מעל חוג הסרטן (23.5° צפון).',
  start: { lat: 12, lon: 33, heading: 180, utc: utcAt(9, 33), L: 0, battery: 90 },
  rate: 0.1,
  budgetHours: 40,
  film: 4,
  clock: 'local',
  sleep: SLEEP_HOURS,
  tickets: { count: 1, station: 'station', options: DATE_TICKETS.slice(1) },
  parCommits: 2,
  places: [station(12, 33), GATE_EQ, GATE_TROPIC, GATE_NORTH],
  shots: [
    { id: 'gate-eq', label: 'שער המשווה: שמש אנכית', check: (c) => gateCheck(c, 'gate-eq') },
    { id: 'gate-tropic', label: 'שער חוג הסרטן: שמש אנכית', check: (c) => gateCheck(c, 'gate-tropic') },
  ],
  hint: 'הנקודה שבה השמש בזנית מסומנת. היא זזה עם התאריך — לא עם השעה.',
  hintOverlay: { kind: 'subsolar' },
  explain: explainWith({}),
};

const CABIN = place('cabin', 'בקתה בלפלנד', 69, 21, 'cabin', 1.6, { surface: 'snow' });
const L8: LevelDef = {
  id: 8,
  world: 2,
  title: 'שמש חצות',
  brief: 'צלמי בבקתה בלפלנד (69° צפון) בחצות — כשהשמש מעל האופק. בחרי כרטיס אחד.',
  rule: 'ביוני הקוטב הצפוני נוטה אל השמש: מצפון לחוג הקוטב (66.5°) השמש לא שוקעת. בדצמבר יש שם לילה קוטבי.',
  start: { lat: 60.2, lon: 25, heading: 0, utc: utcAt(20, 25), L: 0, battery: 90 },
  rate: 0.1,
  budgetHours: 30,
  film: 3,
  clock: 'local',
  sleep: SLEEP_HOURS,
  tickets: { count: 1, station: 'station', options: DATE_TICKETS.slice(1) },
  parCommits: 2,
  places: [station(60.2, 25), CABIN],
  shots: [
    {
      id: 'midnight',
      label: 'בקתה, 00:00, שמש מעל האופק',
      check: (c) => {
        if (!at(c, 'cabin')) return away('צריך להיות ליד הבקתה.');
        const t = c.localTime;
        if (!(t >= 23.5 || t <= 0.5)) return no(`השעה כאן ${hhmm(t)} — זו לא חצות.`);
        if (c.sun.elevation <= 0.3) return no(`בחצות של ${dateLabel(c.L)} השמש ${fmt(-c.sun.elevation)}° מתחת לאופק.`);
        if (!facingSun(c)) return no('השמש לא בפריים. בחצות היא בצפון.');
        return ok(quality(c));
      },
    },
  ],
  special: { kind: 'bear', place: 'cabin' },
  hint: 'חוג הקוטב הצפוני מסומן. מתי הוא כולו בצד המואר?',
  hintOverlay: { kind: 'latitude', lat: 66.5 },
  explain: explainWith({
    bear: (f) =>
      dayKind(69, f.L) === 'polar-night'
        ? `ב-${dateLabel(f.L)} יש בלפלנד לילה קוטבי: השמש לא עולה כלל. בחושך, דב הקוטב גנב את החצובה.`
        : `ב-${dateLabel(f.L)} השמש שוקעת בלפלנד והחצות חשוכה. דב הקוטב ניצל את החושך וגנב את החצובה.`,
    battery: (f) => (dayKind(69, f.L) === 'polar-night' ? 'לילה קוטבי: הקוטב הצפוני נוטה הרחק מהשמש, והפאנלים לא נטענו.' : DEFAULT_FAIL.battery),
  }),
};

const STONES_N = place('stones-n', 'מעגל אבנים באנגליה', 51.2, -1.8, 'stones', 1.8);
const STONES_S = place('stones-s', 'מעגל אבנים בדרום אפריקה', -25.6, 30.6, 'stones', 1.8);
function stoneCheck(c: ShotCtx, kind: 'rise' | 'set', other: 'sunrise' | 'sunset'): ShotResult {
  if (!at(c, 'stones-n') && !at(c, 'stones-s')) return away('צריך לעמוד במעגל אבנים.');
  const len = dayLength(c.lat, c.L);
  if (Math.abs(len - 12) > 0.25) return no(`האור כאן נמשך היום ${fmt(len, 1)} שעות. האבנים נדלקות רק ביום של 12 שעות אור ו-12 שעות חושך.`);
  if (c.sun.elevation < -0.5 || c.sun.elevation > 5) return no('זה לא רגע הזריחה או השקיעה.');
  if (kind === 'rise' && !morning(c)) return no('זו לא זריחה.');
  if (kind === 'set' && morning(c)) return no('זו לא שקיעה.');
  if (!facingSun(c)) return no('השמש לא בפריים.');
  const o = c.taken[other];
  if (o) {
    if (Math.abs(wrap180(o.L - c.L)) > 1.5) return no('שני הצילומים צריכים להיות באותו יום.');
    if ((o.value ?? 0) < 0 === c.lat < 0) return no('הצילום השני צריך להיות בחצי הכדור השני.');
  }
  return ok(quality(c), c.lat);
}
const L9: LevelDef = {
  id: 9,
  world: 2,
  title: 'יום שוויון',
  brief: 'הדליקי מעגל אבנים בזריחה בחצי כדור אחד, ומעגל אבנים בשקיעה בחצי השני — באותו יום. כרטיס אחד.',
  rule: 'ביום השוויון (21 במרץ, 23 בספטמבר) קו הדמדומים עובר דרך שני הקטבים: 12 שעות אור ו-12 שעות חושך בכל מקום.',
  start: { lat: 10, lon: 20, heading: 0, utc: utcAt(12, 20), L: 270, battery: 90 },
  rate: 0.1,
  budgetHours: 40,
  film: 5,
  clock: 'local',
  sleep: SLEEP_HOURS,
  tickets: { count: 1, station: 'station', options: [0, 90, 180].map((L) => ({ kind: 'date' as const, L })) },
  parCommits: 3,
  places: [station(10, 20), STONES_N, STONES_S],
  shots: [
    { id: 'sunrise', label: 'זריחה במעגל אבנים', check: (c) => stoneCheck(c, 'rise', 'sunset') },
    { id: 'sunset', label: 'שקיעה במעגל השני', check: (c) => stoneCheck(c, 'set', 'sunrise') },
  ],
  hint: 'הסתכלי על קו הדמדומים מהחלל: מתי הוא עובר בדיוק דרך שני הקטבים?',
  hintOverlay: { kind: 'terminator' },
  explain: explainWith({}),
};

const SUNDIAL = place('sundial', 'שעון השמש בגבעה', 31.78, 35.22, 'hill', 2);
const KEY_DATES: Record<string, { L: number; label: string }> = {
  jun: { L: 90, label: 'היפוך הקיץ' },
  dec: { L: 270, label: 'היפוך החורף' },
  mar: { L: 0, label: 'שוויון האביב' },
  sep: { L: 180, label: 'שוויון הסתיו' },
};
function sundialCheck(c: ShotCtx, key: keyof typeof KEY_DATES): ShotResult {
  if (!at(c, 'sundial')) return away('צריך לצלם את שעון השמש בגבעה.');
  if (c.sun.elevation <= 0) return no('אין צל בלילה.');
  const shadow = shadowLength(c.sun.elevation);
  if (Math.abs(c.localTime - 12) > 0.4) return no(`הצל עוד ${c.localTime < 12 ? 'מתקצר' : 'מתארך'} — זה לא הצהריים.`);
  if (Math.abs(wrap180(c.L - KEY_DATES[key].L)) > 4) return no(`צל הצהריים באורך ${fmt(shadow, 2)} — זה לא אחד מארבעת הימים המיוחדים.`, undefined, 0.8);
  return ok(1, shadow);
}
const L10: LevelDef = {
  id: 10,
  world: 2,
  title: 'שנה על גבעה אחת',
  brief: 'בלי לעזוב את הגבעה: צלמי את צל הצהריים בשני ימי ההיפוך ובשני ימי השוויון. 5 כרטיסים, בלי שעון ובלי שמות חודשים — רק הצל.',
  rule: 'צל הצהריים הכי קצר ביום ההיפוך של יוני והכי ארוך ביום ההיפוך של דצמבר. בימי השוויון הוא באמצע.',
  start: { lat: 31.78, lon: 35.22, heading: 180, utc: utcAt(11.4, 35.22), L: 120, battery: 90 },
  rate: 0.1,
  budgetHours: 30 * 24 * 14,
  film: 6,
  clock: 'sundial',
  tickets: { count: 5, station: 'sundial', unlabeled: true, options: Array.from({ length: 12 }, (_, i) => ({ kind: 'date' as const, L: i * 30 })) },
  parCommits: 4,
  places: [SUNDIAL],
  shots: (['jun', 'dec', 'mar', 'sep'] as const).map((k) => ({
    id: k,
    label: `צל הצהריים: ${KEY_DATES[k].label}`,
    check: (c: ShotCtx) => sundialCheck(c, k),
  })),
  hint: 'בתמונה מהחלל: מתי הציר נוטה אל השמש, מתי הרחק ממנה, ומתי הצידה?',
  hintOverlay: { kind: 'subsolar' },
  explain: explainWith({}),
};

// ------------------------------------------------------------------ World 3: the Sun as engine

const L11: LevelDef = {
  id: 11,
  world: 3,
  title: 'פנס',
  brief: '22 בדצמבר, פינלנד. טעני את הסוללה עד הסוף לפני רדת הלילה, וצלמי את כתם האור שלך כשהוא עיגול מושלם — קרן אנכית.',
  rule: 'קרן אנכית מתרכזת בשטח קטן ומחממת חזק. קרן אלכסונית מתפזרת על שטח גדול. ב-22 בדצמבר השמש אנכית מעל חוג הגדי.',
  start: { lat: 60, lon: 25, heading: 180, utc: utcAt(10, 25), L: 270, battery: 25 },
  rate: 0.1,
  budgetHours: 7,
  film: 4,
  clock: 'local',
  sleep: SLEEP_HOURS,
  places: [],
  shots: [
    {
      id: 'circle',
      label: 'כתם אור עגול (קרן אנכית)',
      check: (c) => {
        if (c.sun.elevation <= 0) return no('אין שמש — אין כתם אור.');
        if (c.sun.elevation < 86)
          return no(`הקרניים פוגעות כאן בזווית ${fmt(c.sun.elevation)}° — הכתם מתמרח לאליפסה ארוכה פי ${fmt(1 / Math.sin((c.sun.elevation * Math.PI) / 180), 1)}.`);
        return ok(1);
      },
    },
    { id: 'full', label: 'מד סוללה מלא', check: (c) => (c.battery >= 98 ? ok(1) : no(`הסוללה רק ב-${fmt(c.battery)}%.`)) },
  ],
  hint: 'הנקודה שבה השמש אנכית מסומנת.',
  hintOverlay: { kind: 'subsolar' },
  explain: explainWith({
    time: () => 'בפינלנד בדצמבר השמש נמוכה: האור מתפזר והטעינה איטית. ב-22 בדצמבר הקרניים אנכיות מעל חוג הגדי.',
  }),
};

const TLV = place('tlv', 'תל אביב: אספלט', 32.08, 34.78, 'city', 0.3, { surface: 'asphalt', airTemp: 30 });
const FIELDS = place('fields', 'שדות מחוץ לעיר', 31.55, 34.9, 'field', 0.3, { surface: 'field', airTemp: 29 });
const FOREST = place('forest', 'יער בגליל', 32.97, 35.5, 'forest', 0.35, { surface: 'forest', airTemp: 27 });
const LAVA = place('lava', 'שדה לבה באיסלנד', 64, -19, 'lava', 2, { surface: 'lava', airTemp: 10 });
const GLACIER = place('glacier', 'שדה שלג בהרי האלפים', 46.5, 8, 'snow', 1.5, { surface: 'snow', airTemp: 2 });
const SURFACES = [TLV, FOREST, LAVA, GLACIER];
export function thermal(c: ShotCtx): number | null {
  if (!c.place?.surface || c.place.airTemp === undefined) return null;
  return surfaceTemperature({ elevation: c.sun.elevation, surface: c.place.surface as Surface, airTemp: c.place.airTemp });
}
/** Each surface's temperature at its own local noon on date L (to rank the four). */
export function noonThermal(p: Place, L: number): number {
  return surfaceTemperature({ elevation: noonElevation(p.lat, L), surface: p.surface as Surface, airTemp: p.airTemp ?? 0 });
}
function extremeShot(c: ShotCtx, which: 'hot' | 'cold'): ShotResult {
  const t = thermal(c);
  if (t === null || !SURFACES.some((p) => p.id === c.place?.id)) return away('המצלמה התרמית מכוונת לאחד מארבעת המשטחים.');
  if (Math.abs(c.localTime - 12) > 2) return no(`המגזין רוצה צילום צהריים. (המצלמה התרמית: ${fmt(t)}°C)`);
  const ranked = [...SURFACES].sort((a, b) => noonThermal(b, c.L) - noonThermal(a, c.L));
  const target = which === 'hot' ? ranked[0] : ranked[ranked.length - 1];
  if (c.place!.id !== target.id)
    return no(
      which === 'hot'
        ? `המצלמה התרמית: ${fmt(t)}°C. יש משטח חם יותר.${c.place!.id === 'lava' ? ' הלבה כהה — אבל השמש באיסלנד נמוכה יותר.' : ''}`
        : `המצלמה התרמית: ${fmt(t)}°C. יש משטח קר יותר.`,
      undefined,
      1.2,
    );
  return ok(1, t, `${fmt(t)}°C`);
}
const L12: LevelDef = {
  id: 12,
  world: 3,
  title: 'גיליון תרמי',
  brief: '21 ביוני, צהריים: צלמי את המשטח הכי חם ואת הכי קר מבין ארבעה (שלג, לבה כהה, יער, אספלט). המצלמה התרמית נדלקת רק אחרי הצילום! ואחר כך: אי החום של תל אביב מול השדות.',
  rule: 'משטח בהיר מחזיר אור (אלבדו גבוה) ומשטח כהה בולע. אבל הטמפרטורה תלויה גם בזווית הקרינה: לבה כהה תחת שמש נמוכה מתחממת פחות מאספלט תחת שמש גבוהה.',
  start: { lat: 30.5, lon: 34.8, heading: 0, utc: utcAt(9.5, 34.8), L: 90, battery: 90 },
  rate: 0.1,
  budgetHours: 30,
  film: 5,
  clock: 'local',
  sleep: SLEEP_HOURS,
  places: [TLV, FIELDS, FOREST, LAVA, GLACIER],
  shots: [
    { id: 'hot', label: 'המשטח הכי חם', check: (c) => extremeShot(c, 'hot') },
    { id: 'cold', label: 'המשטח הכי קר', check: (c) => extremeShot(c, 'cold') },
    {
      id: 'island',
      label: 'אי חום: השדות קרים מהעיר ב-6°C',
      check: (c) => {
        if (!at(c, 'fields')) return away('לצילום ההשוואה צריך את השדות מחוץ לעיר.');
        const t = thermal(c)!;
        const hot = c.taken.hot;
        if (!hot || c.taken.hot === undefined) return no('קודם צלמי את העיר החמה.', undefined, 0.5);
        if (Math.abs(c.utc - hot.utc) > 1.5) return no(`עבר יותר מדי זמן מאז צילום העיר — השמש כבר במקום אחר. (${fmt(t)}°C)`);
        const diff = (hot.value ?? 0) - t;
        if (diff < 6) return no(`השדות ${fmt(t)}°C — רק ${fmt(diff)}° פחות מהעיר.`);
        return ok(1, t, `${fmt(t)}°C — קר מהעיר ב-${fmt(diff)}°`);
      },
    },
  ],
  hint: 'שני דברים קובעים: כמה גבוהה השמש במקום, וכמה מהאור המשטח בולע.',
  hintOverlay: { kind: 'subsolar' },
  explain: explainWith({}),
  parCommits: 0,
};

const L13: LevelDef = {
  id: 13,
  world: 3,
  title: 'איפה אני?',
  brief: '21 ביוני. התעוררת במקום לא מוכר מתחת לעננים. מדדי את גובה שמש הצהריים בכוונת השמש (Q), הסיקי באיזה אזור אקלים את — ובחרי ציוד. שלוש פעמים.',
  rule: 'גובה שמש הצהריים = 90° − (המרחק מקו הרוחב שבו השמש אנכית). ב-21 ביוני השמש אנכית מעל 23.5° צפון. בין החוגים — טרופי; מעבר לחוגי הקוטב — קוטבי; ביניהם — ממוזג.',
  start: { lat: 10, lon: 100, heading: 0, utc: utcAt(9, 100), L: 90, battery: 100 },
  rate: 0.1,
  budgetHours: 80,
  film: 0,
  clock: 'local',
  sleep: SLEEP_HOURS,
  nightDrain: 0.3,
  fogged: true,
  places: [],
  shots: [],
  special: { kind: 'whereami', rounds: [{ lat: 10, lon: 100 }, { lat: 72, lon: -40 }, { lat: -34, lon: 19 }] },
  hint: 'בצהריים השמש בגובה המרבי שלה. לאיזה כיוון היא — צפון או דרום?',
  hintOverlay: { kind: 'latitude', lat: 23.5 },
  explain: explainWith({
    gear: (f) => `${f.lastWhy ?? ''} קו הרוחב כאן ${fmt(Math.abs(f.lat))}° ${f.lat >= 0 ? 'צפון' : 'דרום'}.`,
  }),
  parCommits: 3,
};

const L14: LevelDef = {
  id: 14,
  world: 3,
  title: 'בריחה מהלילה הקוטבי',
  brief: '22 בדצמבר, שפיצברגן. לילה קוטבי והסוללה נגמרת. מצאי את הכיוון ואת המסילה שיביאו אותך לאור יום — וצלמי את האור הראשון.',
  rule: 'ב-22 בדצמבר הקוטב הצפוני נוטה הרחק מהשמש: מצפון לחוג הקוטב (66.5°) השמש לא עולה. דרומה ממנו היום מתארך, והצהריים מגיעים קודם למי שבמזרח.',
  start: { lat: 76, lon: 15, heading: 180, utc: utcAt(5, 15), L: 270, battery: 55 },
  rate: 0.25,
  budgetHours: 6,
  film: 3,
  clock: 'local',
  rails: [70, 62],
  groundSpeed: 0.35,
  nightDrain: 3,
  places: [],
  shots: [
    {
      id: 'first-light',
      label: 'האור הראשון',
      check: (c) => {
        if (c.sun.elevation < 0.5) return no('עוד אין שמש מעל האופק.');
        if (!facingSun(c)) return no('השמש לא בפריים.');
        return ok(quality(c));
      },
    },
  ],
  hint: 'המסילות הן קווי רוחב. על איזו מהן השמש עולה היום?',
  hintOverlay: { kind: 'latitude', lat: 66.5 },
  tutorial: ['השלג עמוק — על המסילות גולשים מהר.'],
  explain: explainWith({
    battery: (f) =>
      f.lat > 66.5
        ? `נשארת מצפון לחוג הקוטב (${fmt(f.lat)}°): ב-22 בדצמבר השמש לא עולה שם בכלל.`
        : 'הגעת דרומה מחוג הקוטב, אבל הצהריים — הרגע היחיד של אור כאן בדצמבר — עוד לא הגיעו. המסילה מזרחה מקדימה אותם.',
  }),
};

// ------------------------------------------------------------------ World 4: the Moon

const ROOF = place('roof', 'גג בירושלים', 31.78, 35.22, 'roof', 1.6);
const PHASE_LABELS = ['', 'סהר מתמלא', 'רבע ראשון', 'ירח מתמלא', 'ירח מלא', 'ירח מתמעט', 'רבע אחרון', 'סהר מתמעט'];
const L15: LevelDef = {
  id: 15,
  world: 4,
  title: 'מופעי הירח',
  brief: 'מגג אחד בירושלים: צלמי את 7 המופעים הנראים של הירח. בין הצילומים — תא השינה, עכשיו גם לימים. ובקשה אחרונה: "ירח מלא בצהריים".',
  rule: 'הירח מואר תמיד מצד השמש. מופעי הירח נובעים מהזווית שבה אנחנו רואים את חצי הירח המואר — לא מצל כדור הארץ. מחזור שלם ≈ 29.5 ימים; ירח מלא נמצא מול השמש ולכן עולה בשקיעה.',
  start: { lat: 31.78, lon: 35.22, heading: 270, utc: utcAt(17, 35.22), L: 0, moonAge: 0.5, battery: 100 },
  rate: 0.1,
  budgetHours: 40 * 24,
  film: 11,
  clock: 'local',
  nightDrain: 0.3,
  sleep: SLEEP_DAYS,
  parCommits: 16,
  places: [ROOF],
  shots: [1, 2, 3, 4, 5, 6, 7].map((k) => ({
    id: `p${k}`,
    label: PHASE_LABELS[k],
    check: (c: ShotCtx): ShotResult => {
      if (!at(c, 'roof')) return away('כל הצילומים מאותו גג בירושלים.');
      const idx = phaseIndex(c.moonAge);
      if (k === 4 && idx === 4 && c.sun.elevation > 5) return no('הירח המלא נמצא מול השמש: כשהשמש בשמיים, הוא מתחת לאופק. צילה מתבאסת.', 'sulk');
      if (idx !== k) return no('זה לא המופע הזה.', undefined, 0.5);
      if (c.moon.elevation < 4) return no('הירח מתחת לאופק עכשיו.');
      if (c.sun.elevation > -2) return no('השמיים בהירים מדי — חכי לחושך.');
      if (!facingMoon(c)) return no('הירח לא בפריים.');
      return ok(1);
    },
  })),
  special: { kind: 'impossible', shotId: 'noon-full' },
  hint: 'הירח מואר מצד השמש. רבע ראשון: כשבוע אחרי המולד, נראה בשקיעה. מלא: כשבועיים, עולה בשקיעה.',
  explain: explainWith({}),
};

const CAUSEWAY_FROM = { lat: 49.6, lon: -1.5 };
const CAUSEWAY_TO = { lat: 47.4, lon: -1.5 };
const ISLAND = place('island', 'אי המצודה', 47.0, -1.5, 'island', 0.6);
const MAINLAND = place('mainland', 'החוף', 49.9, -1.5, 'causeway-end', 0.6);
const TLV_BEACH = place('beach', 'החוף בתל אביב', 32.08, 34.76, 'beach', 1.4, { surface: 'sand', tide: 0.15 });
const L16: LevelDef = {
  id: 16,
  world: 4,
  title: 'גאות ושפל',
  brief: 'חצי את שביל הגאות אל אי המצודה וצלמי ממנו. אחר כך: שתי תמונות של החוף בתל אביב, בהפרש 3 שעות לפחות.',
  rule: 'משיכת הירח יוצרת שתי בליטות מים: פעמיים ביום גאות ופעמיים שפל. בחופי האוקיינוס ההפרש מטרים; בים התיכון רק 20–40 ס"מ.',
  start: { lat: 49.9, lon: -1.5, heading: 180, utc: utcAt(8, -1.5), L: 0, moonAge: 7.38, battery: 100 },
  rate: 0.1,
  budgetHours: 20 * 24,
  film: 6,
  clock: 'local',
  nightDrain: 0.3,
  sleep: SLEEP_DAYS,
  parCommits: 3,
  places: [ISLAND, MAINLAND, TLV_BEACH],
  shots: [
    { id: 'island', label: 'צילום מאי המצודה', check: (c) => (at(c, 'island') ? ok(1) : away('צריך להגיע לאי.')) },
    {
      id: 'beach1',
      label: 'החוף בתל אביב',
      check: (c) => {
        if (!at(c, 'beach')) return away('צריך להיות בחוף בתל אביב.');
        if (c.sun.elevation < 2) return no('חשוך מדי.');
        const h = tideHeight(c.lat, c.lon, c.utc, c.L, c.moonAge, 0.15);
        return ok(1, h, `מד הגאות: ${fmt(h * 100)} ס"מ`);
      },
    },
    {
      id: 'beach2',
      label: 'שוב החוף, 3 שעות אחר כך',
      check: (c) => {
        if (!at(c, 'beach')) return away('צריך להיות בחוף בתל אביב.');
        if (!c.taken.beach1) return no('קודם צלמי את החוף בפעם הראשונה.', undefined, 0.5);
        if (c.utc - c.taken.beach1.utc < 3) return no('עוד לא עברו 3 שעות מהצילום הראשון.');
        if (c.sun.elevation < 2) return no('חשוך מדי.');
        const h = tideHeight(c.lat, c.lon, c.utc, c.L, c.moonAge, 0.15);
        const d = Math.abs(h - (c.taken.beach1.value ?? 0));
        return ok(1, h, `מד הגאות: ${fmt(h * 100)} ס"מ — הבדל של ${fmt(d * 100)} ס"מ בלבד`);
      },
    },
  ],
  special: { kind: 'causeway', from: CAUSEWAY_FROM, to: CAUSEWAY_TO, tideAmp: 6, openBelow: -2.5, width: 0.6 },
  hint: 'מד הגאות ליד השביל מראה את גובה המים. השפל העמוק ביותר בחודש מגיע סביב המולד והירח המלא (העשרה: גאות שיא).',
  hintOverlay: { kind: 'tide' },
  explain: explainWith({
    wave: () => 'הגאות כיסתה את השביל. בחוף אוקיינוס המים עולים ויורדים מטרים, פעמיים ביום. בשפל של ירח מלא או מולד המים יורדים הכי נמוך.',
  }),
};

const L17: LevelDef = {
  id: 17,
  world: 4,
  title: 'ליקוי חמה',
  brief: 'צלמי ליקוי חמה מלא. ברכבת הלוח יש כרטיסים ל-6 המולדים הבאים — יש לך שניים. איזה מולד נמצא על הקו?',
  rule: 'ליקוי חמה קורה במולד, כשהירח בין השמש לכדור הארץ. מסלול הירח נטוי 5°, ולכן ברוב החודשים הירח עובר מעל השמש או מתחתיה ואין ליקוי.',
  start: { lat: 0, lon: 0, heading: 90, utc: utcAt(9, 0), L: 68, moonAge: 4, battery: 90 },
  // A slow clock: the Moon's shadow crosses the Earth in about two hours.
  rate: 0.05,
  budgetHours: 400 * 24,
  film: 5,
  clock: 'local',
  sleep: SLEEP_HOURS,
  tickets: { count: 2, station: 'station', options: [{ kind: 'newmoon' }], upcoming: 6 },
  parCommits: 2,
  places: [station(0, 0)],
  shots: [
    {
      id: 'totality',
      label: 'ליקוי חמה מלא',
      check: (c) => {
        if (phaseIndex(c.moonAge) !== 0) return no('הירח לא בין השמש לכדור הארץ — ליקוי חמה קורה רק במולד.');
        if (c.sun.elevation < 3) return no('השמש לא בשמיים כאן.');
        const center = solarEclipseCenter(c.utc, c.L, c.moonAge);
        if (!center) {
          const beta = moonEclipticLatitude(c.L, c.moonAge);
          return no(`מולד — אבל הירח עובר ${beta > 0 ? 'מעל' : 'מתחת ל'}שמש: מסלולו נטוי 5° והצל מפספס את כדור הארץ החודש.`);
        }
        const d = angularDistance(c.lat, c.lon, center.lat, center.lon);
        if (d > TOTALITY_RADIUS) return no('יש ליקוי — אבל הצל נופל במקום אחר על הכדור. רוצי אליו!');
        if (!facingSun(c, 50)) return no('השמש המוסתרת לא בפריים.');
        return ok(1 - d / (TOTALITY_RADIUS * 2));
      },
    },
  ],
  hint: 'בתמונת המסלול מסומן קו הצמתים — שם מסלול הירח חוצה את מסלול כדור הארץ.',
  hintOverlay: { kind: 'nodes' },
  explain: explainWith({}),
};

const L18: LevelDef = {
  id: 18,
  world: 4,
  title: 'לוח השמיים',
  brief: 'ליל הסדר: (1) הירח המלא של האביב מעל ירושלים, (2) זריחה בירושלים, (3) ליקוי — איפשהו על הכדור. בלי רמזים ובלי שמות על הכרטיסים.',
  rule: 'הלוח העברי משלב ירח ושמש: פסח חל בירח המלא (ט"ו בניסן) של האביב. ליקוי לבנה קורה בירח מלא, כשכדור הארץ בין השמש לירח — ונראה מכל מקום שבו הירח בשמיים.',
  start: { lat: 31.78, lon: 35.22, heading: 90, utc: utcAt(14, 35.22), L: 270, moonAge: 17.06, battery: 90 },
  rate: 0.15,
  budgetHours: 200 * 24,
  film: 5,
  clock: 'local',
  sleep: SLEEP_HOURS,
  tickets: { count: 2, station: 'jerusalem', unlabeled: true, options: [{ kind: 'fullmoon' }], upcoming: 6 },
  parCommits: 4,
  places: [JERUSALEM],
  shots: [
    {
      id: 'fullmoon',
      label: 'ירח מלא של אביב מעל ירושלים',
      check: (c) => {
        if (!at(c, 'jerusalem')) return away('הצילום הזה מירושלים.');
        if (!(wrap180(c.L) >= 0 && wrap180(c.L) < 90)) return no(`עכשיו ${dateLabel(c.L)} — זה לא אביב.`);
        if (c.moonAge < 13.3 || c.moonAge > 16.3) return no('הירח לא מלא.');
        if (c.moon.elevation < 5 || c.sun.elevation > -4) return no('הירח לא נראה בשמיים עכשיו.');
        if (!facingMoon(c)) return no('הירח לא בפריים.');
        return ok(1);
      },
    },
    {
      id: 'sunrise',
      label: 'זריחה בירושלים',
      check: (c) => {
        if (!at(c, 'jerusalem')) return away('הצילום הזה מירושלים.');
        if (c.sun.elevation < -0.5 || c.sun.elevation > 5 || !morning(c)) return no('זה לא רגע הזריחה.');
        if (!facingSun(c)) return no('השמש לא בפריים.');
        if (!(wrap180(c.L) >= 0 && wrap180(c.L) < 90)) return no('זו לא זריחה של אביב.');
        const fm = c.taken.fullmoon;
        if (fm && Math.abs(wrap180(fm.L - c.L)) > 2) return no('הזריחה צריכה להיות סמוך לליל הירח המלא.');
        return ok(quality(c));
      },
    },
    {
      id: 'eclipse',
      label: 'ליקוי',
      check: (c) => {
        if (!lunarEclipse(c.L, c.moonAge)) {
          if (phaseIndex(c.moonAge) === 4) return no('ירח מלא — אבל הוא עובר מעל או מתחת לצל של כדור הארץ.');
          return no('אין ליקוי עכשיו.');
        }
        if (c.moon.elevation < 5) return no('הליקוי קורה — אבל כאן הירח מתחת לאופק. הוא נראה מהצד הלילי של הכדור.');
        if (!facingMoon(c)) return no('הירח המוסתר לא בפריים.');
        return ok(1);
      },
    },
  ],
  hint: null,
  explain: explainWith({}),
};

export const LEVELS: LevelDef[] = [L1, L2, L3, L4, L5, L6, L7, L8, L9, L10, L11, L12, L13, L14, L15, L16, L17, L18];

export const WORLDS = [
  { id: 1, title: 'הסיבוב העצמי', module: 'earth-rotation' },
  { id: 2, title: 'ההקפה ונטיית הציר', module: 'earth-revolution' },
  { id: 3, title: 'השמש כמקור אנרגיה', module: 'sun-energy' },
  { id: 4, title: 'הירח', module: 'moon-and-tides' },
];

export function getLevel(id: number): LevelDef {
  const l = LEVELS.find((x) => x.id === id);
  if (!l) throw new Error(`no level ${id}`);
  return l;
}
