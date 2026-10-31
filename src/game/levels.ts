// The 18 authored levels. All rule values come from the astronomy module.
import {
  ALBEDO,
  TOTALITY_RADIUS,
  angularDistance,
  dateLabel,
  dayKind,
  dayLength,
  declination,
  lunarEclipse,
  moonEclipticLatitude,
  monthlyTemperature,
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
const hhmm = (h: number) => {
  const w = wrap24(h);
  const m = Math.round(w * 60) % (24 * 60);
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

const DEFAULT_FAIL: Record<FailInfo['kind'], string> = {
  battery: 'הסוללה נגמרה בחושך. בלילה הפאנלים לא נטענים — צריך להגיע לאור בזמן.',
  time: 'אור הסרט נגמר. התכנון חשוב יותר מהריצה: איפה ומתי זה קורה?',
  film: 'נגמר הסרט. כל תמונה עולה פריים — צלמי רק כשהתנאים נכונים.',
  bear: 'דב הקוטב גנב את החצובה בחושך.',
  wave: 'הגאות כיסתה את הדרך וגל סחף אותך.',
  tripod: 'החצובה צילמה — אבל השמש לא הייתה בפריים.',
  greenhouse: 'הצמחים בכיפה לא שרדו את הטמפרטורה.',
  stations: 'נגמרו תחנות מזג האוויר.',
};

const explainWith =
  (custom: Partial<Record<FailInfo['kind'], (f: FailInfo) => string>>, rule: string) =>
  (f: FailInfo): string => {
    const c = custom[f.kind];
    const base = c ? c(f) : DEFAULT_FAIL[f.kind];
    return f.lastWhy && f.kind === 'film' ? `${f.lastWhy} ${rule}` : `${base}`;
  };

// ------------------------------------------------------------------ places

const JERUSALEM = place('jerusalem', 'ירושלים', 31.78, 35.22, 'walls', 1.6, { surface: 'city' });
const HERMON = place('hermon', 'החרמון', 33.4, 35.8, 'snow', 1.4, { surface: 'snow', airTemp: -2 });
const DHAKA = place('dhaka', 'דאקה', 23.8, 90, 'city', 3, { surface: 'city' });
const ACCRA = place('accra', 'אקרה', 5.6, 0, 'city', 2.5, { surface: 'city' });

// ------------------------------------------------------------------ World 1: rotation

const L1: LevelDef = {
  id: 1,
  world: 1,
  title: 'הזריחה הראשונה',
  brief: 'צלמי את הזריחה הראשונה של הבוקר. השחר מתקרב — אבל הסוללה כמעט ריקה.',
  rule: 'כדור הארץ מסתובב ממערב למזרח, 15° בשעה. מי שרץ מזרחה פוגש את הזריחה מוקדם יותר.',
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
  explain: explainWith(
    {
      battery: () => 'חיכית לשחר במקום: הוא זז רק 15° בשעה, והסוללה נגמרה לפני שהגיע. ריצה מזרחה מקדימה את הזריחה.',
      time: () => 'השחר זז רק 15° בשעה. ריצה מזרחה לקראתו מקצרת את ההמתנה.',
    },
    '',
  ),
  parTurns: 0,
};

const L2: LevelDef = {
  id: 2,
  world: 1,
  title: 'השמש "זזה"',
  brief: 'מאותה גבעה: צלמי את הזריחה ואת השקיעה. לאן פונה השמש בכל אחת?',
  rule: 'השמש לא זזה: כדור הארץ מסתובב ממערב למזרח, ולכן השמש נראית עולה במזרח ושוקעת במערב (תנועה מדומה).',
  start: { lat: 31.78, lon: 35.22, heading: 0, utc: utcAt(5.2, 35.22), L: 0, battery: 90 },
  rate: 0.25,
  ffMult: 10,
  budgetHours: 40,
  film: 5,
  clock: 'local',
  nightDrain: 1,
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
  special: { kind: 'dream', afterShots: ['east', 'west'], localTime: 1 },
  hint: 'עקבי אחרי הקו הכתום: הוא תמיד מגיע מהצד שאליו כדור הארץ מסתובב.',
  hintOverlay: { kind: 'terminator' },
  tutorial: ['T — הריצי את הזמן קדימה.', 'החליפי כיוון עם A/D, וצלמי עם E.'],
  explain: explainWith(
    {
      tripod: (f) => `${f.lastWhy ?? ''} אם כדור הארץ מסתובב הפוך — ממזרח למערב — השמש נראית עולה במערב.`,
    },
    '',
  ),
  parTurns: 0,
};

const L3: LevelDef = {
  id: 3,
  world: 1,
  title: 'גלישה על הדמדומים',
  brief: 'אספי 8 פריימים של "שעת זהב" לאורך קו רוחב 50°. כל פריים מתפתח רק באור הדמדומים.',
  rule: 'אזור הדמדומים נע מערבה 15° בשעה. כדי להישאר בו צריך לנוע מערבה באותה מהירות.',
  start: { lat: 50, lon: 2, heading: 270, utc: utcAt(5.5, 2), L: 0, battery: 55 },
  rate: 1.5,
  ffMult: 1,
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
  explain: explainWith(
    {
      battery: () => 'גלשת אל הלילה: מערבה מהדמדומים עוד חושך. הקו זז 15° בשעה — חכי לו, אל תברחי ממנו.',
      time: () => 'הדמדומים התרחקו ממך. הם זזים מערבה 15° בשעה — צריך לשמור על הקצב.',
    },
    '',
  ),
};

const L4: LevelDef = {
  id: 4,
  world: 1,
  title: '15° לשעה',
  brief: 'חבר מדאקה (90° מזרחה) מבקש: "צלמי אותי בשוק ב-14:00 שלי!" בשעון שלך — שעון אקרה.',
  rule: 'כל 15° מזרחה השעה מאוחרת בשעה. 90° = 6 שעות. (בעולם הזה כל אזור זמן הוא 15° בדיוק.)',
  start: { lat: 5.6, lon: 0, heading: 70, utc: utcAt(6, 0), L: 0, battery: 70 },
  rate: 0.2,
  ffMult: 8,
  budgetHours: 16,
  film: 3,
  clock: 'home',
  nightDrain: 3,
  homeLon: 0,
  homeName: 'אקרה',
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
  explain: explainWith(
    {
      battery: (f) =>
        `דאקה נמצאת 90° מזרחה ממך: השעה שם מאוחרת ב-6 שעות. כשבשעון שלך ${hhmm(f.utc)}, בדאקה כבר ${hhmm(f.utc + 6)} — ${
          Math.abs(wrap24(f.utc + 6) - 12) > 6 ? 'לילה' : 'יום'
        }.`,
      time: () => 'דאקה נמצאת 90° מזרחה: 14:00 בדאקה = 08:00 בשעון שלך.',
      film: () => 'דאקה 90° מזרחה = 6 שעות קדימה. 14:00 שם = 08:00 בשעון אקרה.',
    },
    '',
  ),
};

const FIJI = place('fiji', "פיג'י", -17, 178.5, 'island', 2.2, { surface: 'sand' });
const SAMOA = place('samoa', 'סמואה האמריקנית', -14.3, -170.7, 'island', 2.2, { surface: 'sand' });
const L5: LevelDef = {
  id: 5,
  world: 1,
  title: 'יום הולדת פעמיים',
  brief: "יום ההולדת שלך: 31 באוקטובר. צלמי את הזיקוקים של 20:00 בפיג'י — ואז חגגי שוב, באי אחר, באותו תאריך.",
  rule: 'קו התאריך הבין-לאומי (כאן: קו אורך 180°) עובר באוקיינוס. מי שחוצה אותו מזרחה חוזר יום אחד בתאריך — אבל לא בזמן.',
  start: { lat: -17, lon: 178.5, heading: 90, utc: utcAt(19, 178.5), L: 220.7, battery: 100 },
  rate: 0.25,
  ffMult: 12,
  budgetHours: 28,
  film: 4,
  clock: 'local',
  places: [FIJI, SAMOA],
  shots: [
    {
      id: 'fiji',
      label: "זיקוקים בפיג'י, 31.10, 20:00",
      check: (c) => fireworks(c, 'fiji'),
    },
    {
      id: 'samoa',
      label: 'עוד חגיגה: סמואה האמריקנית, 31.10, 20:00',
      check: (c) => fireworks(c, 'samoa'),
    },
  ],
  hint: 'קו התאריך מסומן. מה קורה לתאריך כשחוצים אותו מזרחה?',
  hintOverlay: { kind: 'meridian', lon: 180 },
  explain: explainWith(
    {
      time: () => 'חציית קו התאריך מזרחה מחזירה את התאריך ביום — אבל את לא חוזרת בזמן. צריך לחכות שהערב של 31 באוקטובר יגיע לסמואה.',
    },
    '',
  ),
};

function fireworks(c: ShotCtx, id: string): ShotResult {
  if (!at(c, id)) return away('זיקוקים יש רק בשני האיים.');
  const day = c.localDay;
  if (day < 0) return no('כאן עכשיו 30 באוקטובר — יום לפני יום ההולדת. עברת את קו התאריך מזרחה, אז התאריך ירד ביום. החגיגה תגיע — צריך לחכות לה.');
  if (day > 0) return no('כאן כבר 1 בנובמבר — יום ההולדת נגמר.');
  if (Math.abs(c.localTime - 20) > 0.5) return no(`השעה כאן ${hhmm(c.localTime)}. הזיקוקים ב-20:00.`);
  return ok(1);
}

// ------------------------------------------------------------------ World 2: revolution and tilt

const SYDNEY = place('sydney', 'החוף בסידני', -33.9, 151.2, 'beach', 2.4, { surface: 'sand' });
const L6: LevelDef = {
  id: 6,
  world: 2,
  title: 'זה לא המרחק',
  brief: 'צלמי שלג על החרמון וחוף קיצי בסידני — באותו תאריך. חוגת ההקפה פתוחה.',
  rule: 'העונות נובעות מנטיית הציר, לא מהמרחק: בינואר כדור הארץ הכי קרוב לשמש — וזה חורף בחצי הצפוני וקיץ בחצי הדרומי.',
  start: { lat: 31.78, lon: 35.22, heading: 0, utc: utcAt(9, 35.22), L: 180, battery: 85 },
  rate: 0.25,
  ffMult: 8,
  budgetHours: 18,
  film: 4,
  clock: 'local',
  orbitDial: { turns: 4 },
  parTurns: 3,
  places: [HERMON, SYDNEY, JERUSALEM],
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
  explain: explainWith({}, ''),
};

export const hermonSnow = (L: number) => monthlyTemperature(33.4, L) < 10;
export const sydneySummer = (L: number) => monthlyTemperature(-33.9, L) > 21;

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
  brief: 'המיסי שני שערי קרח בקרן שמש אנכית (בלי צל): השער במשווה והשער בחוג הסרטן.',
  rule: 'השמש עומדת בזנית רק בין חוג הסרטן לחוג הגדי: ביום השוויון מעל קו המשווה, ב-21 ביוני מעל חוג הסרטן (23.5° צפון).',
  start: { lat: 12, lon: 33, heading: 180, utc: utcAt(8, 33), L: 0, battery: 90 },
  rate: 0.25,
  ffMult: 10,
  budgetHours: 36,
  film: 4,
  clock: 'local',
  orbitDial: { turns: 4 },
  parTurns: 3,
  places: [GATE_EQ, GATE_TROPIC, GATE_NORTH],
  shots: [
    { id: 'gate-eq', label: 'שער המשווה: שמש אנכית', check: (c) => gateCheck(c, 'gate-eq') },
    { id: 'gate-tropic', label: 'שער חוג הסרטן: שמש אנכית', check: (c) => gateCheck(c, 'gate-tropic') },
  ],
  hint: 'הנקודה שבה השמש בזנית מסומנת. היא זזה עם התאריך — לא עם השעה.',
  hintOverlay: { kind: 'subsolar' },
  explain: explainWith({}, ''),
};

const CABIN = place('cabin', 'בקתה בלפלנד', 69, 21, 'cabin', 1.6, { surface: 'snow' });
const L8: LevelDef = {
  id: 8,
  world: 2,
  title: 'שמש חצות',
  brief: 'צלמי בבקתה בלפלנד (69° צפון) בחצות — כשהשמש מעל האופק. בחרי תאריך.',
  rule: 'ביוני הקוטב הצפוני נוטה אל השמש: מצפון לחוג הקוטב (66.5°) השמש לא שוקעת. בדצמבר יש שם לילה קוטבי.',
  start: { lat: 60, lon: 25, heading: 0, utc: utcAt(20, 25), L: 0, battery: 90 },
  rate: 0.25,
  ffMult: 10,
  budgetHours: 30,
  film: 3,
  clock: 'local',
  orbitDial: { turns: 4 },
  parTurns: 3,
  places: [CABIN],
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
  explain: explainWith(
    {
      bear: (f) =>
        dayKind(69, f.L) === 'polar-night'
          ? `ב-${dateLabel(f.L)} יש בלפלנד לילה קוטבי: השמש לא עולה כלל. בחושך, דב הקוטב גנב את החצובה.`
          : `ב-${dateLabel(f.L)} השמש שוקעת בלפלנד והחצות חשוכה. דב הקוטב ניצל את החושך וגנב את החצובה.`,
      battery: (f) => (dayKind(69, f.L) === 'polar-night' ? 'לילה קוטבי: הקוטב הצפוני נוטה הרחק מהשמש, והפאנלים לא נטענו.' : DEFAULT_FAIL.battery),
    },
    '',
  ),
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
    const otherSouth = (o.value ?? 0) < 0;
    if (otherSouth === c.lat < 0) return no('הצילום השני צריך להיות בחצי הכדור השני.');
  }
  return ok(quality(c), c.lat);
}
const L9: LevelDef = {
  id: 9,
  world: 2,
  title: 'יום שוויון',
  brief: 'הדליקי מעגל אבנים בזריחה בחצי כדור אחד, ומעגל אבנים בשקיעה בחצי השני — באותו יום.',
  rule: 'ביום השוויון (21 במרץ, 23 בספטמבר) קו הדמדומים עובר דרך שני הקטבים: 12 שעות אור ו-12 שעות חושך בכל מקום.',
  start: { lat: 10, lon: 20, heading: 0, utc: utcAt(12, 20), L: 270, battery: 90 },
  rate: 0.25,
  ffMult: 10,
  budgetHours: 40,
  film: 5,
  clock: 'local',
  orbitDial: { turns: 4 },
  parTurns: 3,
  places: [STONES_N, STONES_S],
  shots: [
    { id: 'sunrise', label: 'זריחה במעגל אבנים', check: (c) => stoneCheck(c, 'rise', 'sunset') },
    { id: 'sunset', label: 'שקיעה במעגל השני', check: (c) => stoneCheck(c, 'set', 'sunrise') },
  ],
  hint: 'הסתכלי על קו הדמדומים מהחלל: מתי הוא עובר בדיוק דרך שני הקטבים?',
  hintOverlay: { kind: 'terminator' },
  explain: explainWith({}, ''),
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
  if (Math.abs(wrap180(c.L - KEY_DATES[key].L)) > 4) return no(`צל הצהריים באורך ${fmt(shadow, 2)} — זה לא אחד מארבעת הימים המיוחדים.`);
  return ok(1, shadow);
}
const L10: LevelDef = {
  id: 10,
  world: 2,
  title: 'שנה על גבעה אחת',
  brief: 'בלי לעזוב את הגבעה: צלמי את צל הצהריים בשני ימי ההיפוך ובשני ימי השוויון. אין שעון ואין שמות חודשים — רק הצל.',
  rule: 'צל הצהריים הכי קצר ביום ההיפוך של יוני והכי ארוך ביום ההיפוך של דצמבר. בימי השוויון הוא באמצע.',
  start: { lat: 31.78, lon: 35.22, heading: 180, utc: utcAt(10, 35.22), L: 120, battery: 90 },
  rate: 0.2,
  ffMult: 10,
  budgetHours: 30,
  film: 6,
  clock: 'sundial',
  orbitDial: { turns: 11, unlabeled: true },
  parTurns: 10,
  places: [SUNDIAL],
  shots: (['jun', 'dec', 'mar', 'sep'] as const).map((k) => ({
    id: k,
    label: `צל הצהריים: ${KEY_DATES[k].label}`,
    check: (c: ShotCtx) => sundialCheck(c, k),
  })),
  hint: 'בתמונה מהחלל: מתי הציר נוטה אל השמש, מתי הרחק ממנה, ומתי הצידה?',
  hintOverlay: { kind: 'subsolar' },
  explain: explainWith({}, ''),
};

// ------------------------------------------------------------------ World 3: the Sun as engine

const PADS = [
  place('pad-fin', 'חוות סוללות בפינלנד', 60, 25, 'pad', 1.6),
  place('pad-n', 'חווה בחוג הסרטן', 23.5, 25, 'pad', 1.6, { surface: 'sand' }),
  place('pad-eq', 'חווה במשווה', 0, 25, 'pad', 1.6, { surface: 'forest' }),
  place('pad-s', 'חווה בחוג הגדי', -23.5, 25, 'pad', 1.6, { surface: 'sand' }),
];
const L11: LevelDef = {
  id: 11,
  world: 3,
  title: 'פנס',
  brief: '21 בדצמבר. טעני את הסוללה עד הסוף וצלמי את כתם האור שלך כשהוא עיגול מושלם — קרן אנכית.',
  rule: 'קרן אנכית מתרכזת בשטח קטן ומחממת חזק. קרן אלכסונית מתפזרת על שטח גדול. ב-21 בדצמבר השמש אנכית מעל חוג הגדי.',
  start: { lat: 60, lon: 25, heading: 180, utc: utcAt(10, 25), L: 270, battery: 25 },
  rate: 0.25,
  ffMult: 8,
  budgetHours: 6,
  film: 4,
  clock: 'local',
  places: PADS,
  shots: [
    {
      id: 'circle',
      label: 'כתם אור עגול (קרן אנכית)',
      check: (c) => {
        if (c.sun.elevation <= 0) return no('אין שמש — אין כתם אור.');
        if (c.sun.elevation < 86) return no(`הקרניים פוגעות כאן בזווית ${fmt(c.sun.elevation)}° — הכתם מתמרח לאליפסה ארוכה פי ${fmt(1 / Math.sin((c.sun.elevation * Math.PI) / 180), 1)}.`);
        return ok(1);
      },
    },
    {
      id: 'full',
      label: 'מד סוללה מלא',
      check: (c) => (c.battery >= 98 ? ok(1) : no(`הסוללה רק ב-${fmt(c.battery)}%.`)),
    },
  ],
  hint: 'הנקודה שבה השמש אנכית מסומנת.',
  hintOverlay: { kind: 'subsolar' },
  explain: explainWith(
    {
      time: () => 'בפינלנד בדצמבר השמש נמוכה: האור מתפזר והטעינה איטית. ב-21 בדצמבר הקרניים אנכיות מעל חוג הגדי.',
    },
    '',
  ),
};

const TLV = place('tlv', 'תל אביב: אספלט', 32.08, 34.78, 'city', 0.8, { surface: 'asphalt', airTemp: 18 });
const FIELDS = place('fields', 'שדות מחוץ לעיר', 31.1, 35.5, 'field', 0.8, { surface: 'field', airTemp: 16 });
const LAVA = place('lava', 'שדה לבה באיסלנד', 64, -19, 'lava', 2, { surface: 'lava', airTemp: 0 });
const SNOWFIELD = place('snowfield', 'שלג על החרמון', 33.4, 35.8, 'snow', 0.6, { surface: 'snow', airTemp: -2 });
export function thermal(c: ShotCtx): number | null {
  if (!c.place?.surface || c.place.airTemp === undefined) return null;
  return surfaceTemperature({ elevation: c.sun.elevation, surface: c.place.surface as Surface, airTemp: c.place.airTemp });
}
const L12: LevelDef = {
  id: 12,
  world: 3,
  title: 'אלבדו',
  brief: 'מצלמה תרמית, דצמבר: (1) משטח חם מ-28°C. (2) אי החום העירוני: העיר חמה מהשדות ב-6°C לפחות, באותה שעה. (3) משטח כהה שנשאר קר.',
  rule: 'משטח בהיר מחזיר אור (אלבדו גבוה) ומשטח כהה בולע. אבל הטמפרטורה תלויה גם בזווית הקרינה: לבה כהה תחת שמש נמוכה נשארת קרה.',
  start: { lat: 32.08, lon: 34.78, heading: 90, utc: utcAt(8, 34.78), L: 270, battery: 85 },
  rate: 0.2,
  ffMult: 8,
  budgetHours: 30,
  film: 6,
  clock: 'local',
  places: [TLV, FIELDS, LAVA, SNOWFIELD],
  shots: [
    {
      id: 'hot',
      label: 'משטח חם מ-28°C',
      check: (c) => {
        const t = thermal(c);
        if (t === null) return away('המצלמה התרמית צריכה משטח מסומן.');
        if (t < 28) return no(`המצלמה התרמית: ${fmt(t)}°C. לא מספיק חם.`);
        return ok(1, t, `${fmt(t)}°C`);
      },
    },
    {
      id: 'island',
      label: 'אי חום: שדות קרים מהעיר ב-6°C',
      check: (c) => {
        const t = thermal(c);
        if (!at(c, 'fields')) return away('לצילום ההשוואה צריך את השדות מחוץ לעיר.');
        if (t === null) return away('המצלמה התרמית צריכה משטח מסומן.');
        const hot = c.taken.hot;
        if (!hot) return no('קודם צלמי את העיר החמה.', undefined, 0.5);
        if (Math.abs(c.utc - hot.utc) > 1.5) return no(`עבר יותר מדי זמן מאז צילום העיר — השמש כבר במקום אחר. (${fmt(t)}°C)`);
        const diff = (hot.value ?? 0) - t;
        if (diff < 6) return no(`השדות ${fmt(t)}°C — רק ${fmt(diff)}° פחות מהעיר.`);
        return ok(1, t, `${fmt(t)}°C — קר מהעיר ב-${fmt(diff)}°`);
      },
    },
    {
      id: 'dark-cold',
      label: 'משטח כהה וקר (מתחת ל-5°C)',
      check: (c) => {
        const t = thermal(c);
        if (t === null) return away('המצלמה התרמית צריכה משטח מסומן.');
        if (ALBEDO[c.place!.surface!] > 0.15) return no('המשטח הזה בהיר — צריך משטח כהה.', undefined, 0.5);
        if (c.sun.elevation <= 0) return no('בלילה כל משטח מתקרר. צריך משטח כהה וקר כשהשמש עליו.');
        if (t > 5) return no(`המשטח הכהה כאן ${fmt(t)}°C — השמש מחממת אותו.`);
        return ok(1, t, `${fmt(t)}°C: כהה, אבל השמש נמוכה מאוד`);
      },
    },
  ],
  hint: 'השוואה: באיזה מקום השמש הכי גבוהה בדצמבר, ואיזה משטח בולע הכי הרבה?',
  hintOverlay: { kind: 'subsolar' },
  explain: explainWith({}, ''),
};

const DOME = place('dome', 'כיפת החממה בנגב', 30.6, 34.8, 'dome', 1.6, { surface: 'sand' });
const L13: LevelDef = {
  id: 13,
  world: 3,
  title: 'מאזן קרינה',
  brief: 'שמרי על הכיפה בין 18°C ל-28°C במשך יממה שלמה. 1 — הצללה (פחות קרינה נכנסת), 2 — מלכודת חום (פחות קרינה יוצאת).',
  rule: 'מאזן קרינה: אם נבלעת יותר קרינה קצרת גל ממה שנפלטת קרינה ארוכת גל — הטמפרטורה עולה. אם נפלט יותר — היא יורדת.',
  start: { lat: 30.6, lon: 34.8, heading: 0, utc: utcAt(7, 34.8), L: 270, battery: 100 },
  rate: 0.5,
  ffMult: 3,
  budgetHours: 26,
  film: 0,
  clock: 'local',
  nightDrain: 0,
  places: [DOME],
  shots: [],
  special: { kind: 'greenhouse', dome: 'dome', band: [18, 28], hours: 24, maxOutHours: 2, outsideDay: 20, outsideNight: 6 },
  hint: 'ביום נכנסת הרבה קרינה — הצלילי. בלילה רק נפלטת — סגרי את מלכודת החום.',
  explain: explainWith(
    {
      greenhouse: () => 'הנבלע והנפלט לא היו מאוזנים: ביום יותר מדי קרינה נכנסה, או בלילה יותר מדי חום ברח.',
    },
    '',
  ),
};

const L14: LevelDef = {
  id: 14,
  world: 3,
  title: 'המשווה לא מתקרר',
  brief: 'הציבי שלוש תחנות מזג אוויר (P) כך שהעקומות השנתיות שלהן יתאימו לשלושת הכרטיסים.',
  rule: 'ליד המשווה השמש גבוהה כל השנה — חם תמיד. ככל שמתרחקים מהמשווה, הקרינה אלכסונית יותר וההבדל בין העונות גדל. בחצי הכדור הדרומי העונות הפוכות.',
  start: { lat: 15, lon: 20, heading: 0, utc: utcAt(12, 20), L: 0, battery: 100 },
  rate: 0.25,
  ffMult: 4,
  budgetHours: 10,
  film: 0,
  clock: 'local',
  nightDrain: 0,
  places: [],
  shots: [],
  special: {
    kind: 'stations',
    cards: [
      { id: 'a', label: 'כרטיס א', lat: 0 },
      { id: 'b', label: 'כרטיס ב', lat: 31.8 },
      { id: 'c', label: 'כרטיס ג', lat: -66.5 },
    ],
    tolerance: 3,
  },
  hint: 'קווי הרוחב החשובים מסומנים. שימי לב באיזה חודש כל עקומה מגיעה לשיא.',
  hintOverlay: { kind: 'latitude', lat: 0 },
  explain: explainWith({ stations: () => 'נגמרו התחנות. התאימי את צורת העקומה: שטוחה = ליד המשווה; גלים גדולים = רחוק ממנו; שיא בינואר = חצי הכדור הדרומי.' }, ''),
};

// ------------------------------------------------------------------ World 4: the Moon

const ROOF = place('roof', 'גג בירושלים', 31.78, 35.22, 'roof', 1.6);
const PHASE_SHOTS = [1, 2, 3, 4, 5, 6, 7].map((k) => ({
  id: `p${k}`,
  label: ['', 'סהר מתמלא', 'רבע ראשון', 'ירח מתמלא', 'ירח מלא', 'ירח מתמעט', 'רבע אחרון', 'סהר מתמעט'][k],
  check: (c: ShotCtx): ShotResult => {
    if (!at(c, 'roof')) return away('כל הצילומים מאותו גג בירושלים.');
    const idx = phaseIndex(c.moonAge);
    if (idx !== k) return no('זה לא המופע הזה.', undefined, 0.5);
    if (k === 4 && c.sun.elevation > 5) return no('הירח המלא נמצא מול השמש: כשהשמש בשמיים, הוא מתחת לאופק. צילה מתבאסת.', 'sulk');
    if (c.moon.elevation < 4) return no('הירח מתחת לאופק עכשיו.');
    if (c.sun.elevation > -2) return no('השמיים בהירים מדי — חכי לחושך.');
    if (!facingMoon(c)) return no('הירח לא בפריים.');
    return ok(1);
  },
}));
const L15: LevelDef = {
  id: 15,
  world: 4,
  title: 'מופעי הירח',
  brief: 'מגג אחד בירושלים: צלמי את 7 המופעים הנראים של הירח (חוגת הירח פתוחה). ובקשה אחרונה: "ירח מלא בצהריים".',
  rule: 'הירח מואר תמיד מצד השמש. מופעי הירח נובעים מהזווית שבה אנחנו רואים את חצי הירח המואר — לא מצל כדור הארץ. ירח מלא נמצא מול השמש ולכן עולה בשקיעה.',
  start: { lat: 31.78, lon: 35.22, heading: 270, utc: utcAt(17, 35.22), L: 0, moonAge: 0.5, battery: 100 },
  rate: 0.25,
  ffMult: 16,
  budgetHours: 130,
  film: 11,
  clock: 'local',
  nightDrain: 0.3,
  moonDial: { turns: 10 },
  parTurns: 8,
  places: [ROOF],
  shots: PHASE_SHOTS,
  special: { kind: 'impossible', shotId: 'noon-full' },
  hint: 'הירח מואר מצד השמש. רבע ראשון: 90° משמאל לשמש. מלא: מולה.',
  explain: explainWith({}, ''),
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
  rate: 0.25,
  ffMult: 10,
  budgetHours: 40,
  film: 6,
  clock: 'local',
  moonDial: { turns: 3 },
  parTurns: 2,
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
  hint: 'השביל נפתח רק בשפל עמוק. מתי השפל הכי עמוק בחודש — ברבע או במולד ובירח מלא?',
  hintOverlay: { kind: 'tide' },
  explain: explainWith(
    {
      wave: () => 'הגאות כיסתה את השביל. בחוף אוקיינוס המים עולים ויורדים מטרים, פעמיים ביום. בשפל של ירח מלא או מולד המים יורדים הכי נמוך.',
    },
    '',
  ),
};

const L17: LevelDef = {
  id: 17,
  world: 4,
  title: 'ליקוי חמה',
  brief: 'צלמי ליקוי חמה מלא. בחרי תאריך ומופע — ואז רוצי אל הצל.',
  rule: 'ליקוי חמה קורה במולד, כשהירח בין השמש לכדור הארץ. מסלול הירח נטוי 5°, ולכן ברוב החודשים הירח עובר מעל השמש או מתחתיה ואין ליקוי.',
  start: { lat: 0, lon: 0, heading: 90, utc: utcAt(9, 0), L: 0, moonAge: 4, battery: 90 },
  rate: 0.25,
  ffMult: 8,
  budgetHours: 30,
  film: 5,
  clock: 'local',
  orbitDial: { turns: 3 },
  moonDial: { turns: 3 },
  parTurns: 2,
  places: [],
  shots: [
    {
      id: 'totality',
      label: 'ליקוי חמה מלא',
      check: (c) => {
        const idx = phaseIndex(c.moonAge);
        if (idx !== 0) return no('הירח לא בין השמש לכדור הארץ — ליקוי חמה קורה רק במולד.');
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
  hint: 'קו הצמתים — המקום שבו מסלול הירח חוצה את מסלול כדור הארץ — מסומן.',
  hintOverlay: { kind: 'nodes' },
  explain: explainWith({}, ''),
};

const L18: LevelDef = {
  id: 18,
  world: 4,
  title: 'לוח השמיים',
  brief: 'ליל הסדר: (1) הירח המלא של האביב מעל ירושלים, (2) זריחה בירושלים, (3) ליקוי — איפשהו על הכדור. בלי רמזים ובלי שמות על החוגות.',
  rule: 'הלוח העברי משלב ירח ושמש: פסח חל בירח המלא (ט"ו בניסן) של האביב. ליקוי לבנה קורה בירח מלא, כשכדור הארץ בין השמש לירח — ונראה מכל מקום שבו הירח בשמיים.',
  start: { lat: 31.78, lon: 35.22, heading: 90, utc: utcAt(14, 35.22), L: 270, moonAge: 7.38, battery: 90 },
  rate: 0.25,
  ffMult: 10,
  budgetHours: 34,
  film: 5,
  clock: 'local',
  orbitDial: { turns: 4, unlabeled: true },
  moonDial: { turns: 3, unlabeled: true },
  parTurns: 6,
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
        const fm = c.taken.fullmoon;
        if (fm && Math.abs(wrap180(fm.L - c.L)) > 2) return no('הזריחה צריכה להיות סמוך לליל הירח המלא.');
        if (!(wrap180(c.L) >= 0 && wrap180(c.L) < 90)) return no('זו לא זריחה של אביב.');
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
  explain: explainWith({}, ''),
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

export { declination };
