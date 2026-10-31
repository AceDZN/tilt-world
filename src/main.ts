// Boot, game loop and glue between the sim, the 3D world and the HUD.
import '@fontsource/rubik/400.css';
import '@fontsource/rubik/500.css';
import '@fontsource/rubik/600.css';
import '@fontsource/rubik/700.css';
import './ui/style.css';
import * as THREE from 'three';
import { angularDistance, bearing, dateLabel, solarEclipseCenter, dayOfYearFromL, lFromDayOfYear, localDayIndex, phaseIndex, PHASE_NAMES, shadowLength, sunPosition, wrap180, wrap24 } from './astro/astro';
import { LEVELS, getLevel } from './game/levels';
import { verifiedQuest } from './game/quests';
import { atStation, causewayTide, orbitL, createSim, facingAzimuth, latLon, shotCtx, step, ticketChoices, type SimEvent, type SimState } from './game/sim';
import { NO_INPUT, type Input, type LevelDef } from './game/types';
import { loadModels } from './scene/models';
import { World } from './scene/world';
import { OrbitInset } from './scene/inset';
import { Hud, hhmm, type HudAction } from './ui/hud';
import { Controls } from './input';
import { Sound } from './audio';

const BASE = import.meta.env.BASE_URL;
const DT = 1 / 60;
const STORE = 'tiltworld.v1';

// ---------------------------------------------------------------- persistent prefs

interface Saved {
  stars: Record<number, number>;
  muted: boolean;
  reduced: boolean;
}
function load(): Saved {
  const def: Saved = { stars: {}, muted: false, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches };
  try {
    return { ...def, ...JSON.parse(localStorage.getItem(STORE) ?? '{}') };
  } catch {
    return def;
  }
}
const saved = load();
function persist() {
  try {
    localStorage.setItem(STORE, JSON.stringify(saved));
  } catch {
    /* private mode */
  }
}
const params = new URLSearchParams(location.search);
const unlockAll = params.has('all');
const unlocked = (id: number) => unlockAll || id === 1 || (saved.stars[id - 1] ?? 0) > 0 || (saved.stars[id] ?? 0) > 0;

// ---------------------------------------------------------------- setup

const app = document.getElementById('app')!;
const uiRoot = document.getElementById('ui')!;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
app.prepend(renderer.domElement);

const sound = new Sound();
sound.setMuted(saved.muted);
const controls = new Controls();
const hud = new Hud(uiRoot, onAction);
hud.setMuted(saved.muted);

let world: World;
let inset: OrbitInset;

type Screen = 'loading' | 'menu' | 'play';
let screen: Screen = 'loading';
let st: SimState | null = null;
let paused = false;
let cameraMode: 'chase' | 'space' = 'chase';
let gridOn = false;
let pending: Partial<Input> = {};
let seenEvents = 0;
let displayUtc = 0;
let transition: { from: number; to: number; t: number; dur: number; kind: 'sleep' | 'ticket' | 'dream' } | null = null;
let resultTimer = -1;
let tutorialT = 0;
let realT = 0;
let notes: Record<string, string> = {};
let captureWin = false;
let winPhoto = '';
let accum = 0;
let menuUtc = 10;
let running = false;
/** The level clock waits until the player is ready. */
let started = false;

const loadingEl = document.createElement('div');
loadingEl.className = 'loading';
loadingEl.textContent = 'טוען את עולם נטוי…';
uiRoot.appendChild(loadingEl);

async function boot() {
  const tl = new THREE.TextureLoader();
  const [day, night, clouds] = await Promise.all(
    ['earth_day.jpg', 'earth_night.jpg', 'earth_clouds.jpg'].map((f) => tl.loadAsync(`${BASE}textures/${f}`)),
  );
  await loadModels(BASE, (d, n) => (loadingEl.textContent = `טוען את עולם נטוי… ${d}/${n}`));
  await document.fonts?.ready;
  world = new World({ day, night, clouds }, innerWidth / innerHeight);
  inset = new OrbitInset(day);
  loadingEl.remove();
  resize();
  const lv = Number(params.get('level'));
  if (lv >= 1 && lv <= LEVELS.length) startLevel(lv);
  else showMenu();
  const touch = hud.el('touch');
  if (matchMedia('(pointer: coarse)').matches) touch.hidden = false;
  controls.bindTouch(hud.el('stick'), hud.el('knob'), hud.el('tjump'));
  requestAnimationFrame(frame);
}

function resize() {
  const w = app.clientWidth || innerWidth;
  const h = app.clientHeight || innerHeight;
  renderer.setSize(w, h, false);
  world?.resize(w / h);
}
new ResizeObserver(resize).observe(app);

document.addEventListener('visibilitychange', () => {
  if (document.hidden && screen === 'play' && started && st && (st.mode === 'play' || st.mode === 'tripod')) pause(true);
});

// ---------------------------------------------------------------- screens

function showMenu() {
  screen = 'menu';
  st = null;
  paused = false;
  hud.closeModals();
  hud.showMenu(saved.stars, unlocked);
  hud.setReduced(saved.reduced);
  world.menuCamera(0, menuUtc, 60, saved.reduced);
}

function startLevel(id: number) {
  startLevelDef(getLevel(id));
}

let questSeed = 0;
function startQuest() {
  questSeed = (questSeed || Math.floor(Math.random() * 90000)) + 1;
  const q = verifiedQuest(questSeed);
  questSeed = q.seed;
  startLevelDef(q.level);
}

function startLevelDef(level: LevelDef) {
  const id = level.id;
  st = createSim(level);
  screen = 'play';
  paused = false;
  pending = {};
  seenEvents = 0;
  displayUtc = st.utc;
  transition = null;
  resultTimer = -1;
  tutorialT = 0;
  notes = {};
  winPhoto = '';
  captureWin = false;
  cameraMode = 'chase';
  gridOn = false;
  hud.hideMenu();
  hud.setLevel(level, saved.stars[id] ?? 0);
  hud.setTutorial(null);
  started = false;
  hud.showIntro(level);
  world.setLevel(level);
  world.showGame();
  world.snapCamera(st);
  inset.showMoon = level.world === 4;
}

function pause(on: boolean) {
  if (screen !== 'play' || !st) return;
  if (st.mode === 'won' || st.mode === 'failed') return;
  paused = on;
  if (on) hud.showPause(saved.reduced, saved.muted);
  else hud.hidePause();
}

function onAction(a: HudAction, arg?: number) {
  sound.unlock();
  switch (a) {
    case 'pause':
      pause(true);
      break;
    case 'resume':
      pause(false);
      break;
    case 'mute':
      saved.muted = !saved.muted;
      sound.setMuted(saved.muted);
      hud.setMuted(saved.muted);
      persist();
      if (paused) hud.showPause(saved.reduced, saved.muted);
      break;
    case 'reduced':
      saved.reduced = !saved.reduced;
      persist();
      hud.setReduced(saved.reduced);
      if (paused) hud.showPause(saved.reduced, saved.muted);
      break;
    case 'fullscreen':
      toggleFullscreen();
      break;
    case 'restart':
      if (st) startLevelDef(st.level);
      break;
    case 'quest':
      startQuest();
      break;
    case 'menu':
      showMenu();
      break;
    case 'next':
      if (st && st.level.id >= 100) startQuest();
      else if (st && st.level.id < LEVELS.length) startLevel(st.level.id + 1);
      else showMenu();
      break;
    case 'level':
      if (arg) startLevel(arg);
      break;
    case 'start':
      begin();
      break;
    case 'shoot':
      pending.shoot = true;
      break;
    case 'sleep-open':
      if (canAct()) hud.openSleep();
      break;
    case 'sleep-commit':
      if (arg && canAct()) pending.sleep = arg;
      break;
    case 'sleep-cancel':
    case 'train-cancel':
      hud.closeModals();
      break;
    case 'train-open':
      openTrain();
      break;
    case 'ticket':
      hud.closeModals();
      if (arg !== undefined && canAct()) pending.ticket = arg;
      break;
    case 'plant':
      pending.plant = true;
      break;
    case 'hint':
      pending.hint = true;
      break;
    case 'gear':
      if (arg !== undefined) pending.gear = arg;
      break;
    case 'impossible':
      pending.declareImpossible = true;
      break;
    case 'camera':
      cameraMode = cameraMode === 'chase' ? 'space' : 'chase';
      break;
  }
}

function canAct() {
  return screen === 'play' && !!st && st.mode === 'play' && !transition && !paused && started;
}

function begin() {
  if (started || !st) return;
  started = true;
  controls.drain();
  pending = {};
  hud.closeModals();
  tutorialT = 0;
}

function openTrain() {
  if (!st || !canAct() || !st.level.tickets) return;
  if (!atStation(st)) {
    hud.toast('רכבת הלוח עוצרת רק בתחנה. רוצי לטבעת הכתומה.', 'info');
    return;
  }
  const left = st.level.tickets.count - st.ticketsUsed;
  if (left <= 0) {
    hud.toast('אין יותר כרטיסים בשלב הזה.', 'info');
    return;
  }
  hud.openTrain(ticketChoices(st), left);
}

function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void app.requestFullscreen?.().catch(() => {});
}

// ---------------------------------------------------------------- keyboard

function handleKeys() {
  for (const k of controls.drain()) {
    sound.unlock();
    if (screen === 'menu') {
      if (k === 'Enter') startLevel(1);
      if (k === 'm') onAction('mute');
      if (k === 'f') toggleFullscreen();
      continue;
    }
    if (screen !== 'play' || !st) continue;
    const sleepOpen = !hud.el('sleepPanel').hidden;
    const trainOpen = !hud.el('trainPanel').hidden;
    const resultOpen = !hud.el('result').hidden;
    if (k === 'Escape') {
      if (sleepOpen || trainOpen) hud.closeModals();
      else if (!resultOpen) pause(!paused);
      continue;
    }
    if (k === 'm') onAction('mute');
    if (k === 'f') toggleFullscreen();
    if (k === 'r') {
      startLevelDef(st.level);
      continue;
    }
    if (!started) {
      if (k === 'Enter' || k === ' ') begin();
      continue;
    }
    if (resultOpen) {
      if ((k === 'n' || k === 'Enter') && st.mode === 'won') onAction('next');
      if (k === 'Enter' && st.mode === 'failed') onAction('restart');
      continue;
    }
    if (paused) continue;
    if (sleepOpen) {
      if (k === 'ArrowUp' || k === 'ArrowLeft' || k === '+') hud.bumpSleep(1);
      if (k === 'ArrowDown' || k === 'ArrowRight' || k === '-') hud.bumpSleep(-1);
      if (k === 'Enter') hud.commitSleep();
      continue;
    }
    if (trainOpen) {
      const n = Number(k);
      if (n >= 1 && n <= 9 && hud.trainIndex(n - 1) !== undefined) onAction('ticket', hud.trainIndex(n - 1));
      continue;
    }
    if (k === 'e' || k === 'ק') pending.shoot = true;
    if (k === ' ') pending.jump = true;
    if (k === 'z' || k === 'ז') onAction('sleep-open');
    if (k === 'c' || k === 'ב') openTrain();
    if (k === 'p' || k === 'פ') pending.plant = true;
    if (k === 'h' || k === 'י') pending.hint = true;
    if (k === 'g' || k === 'ע') gridOn = !gridOn;
    if (k === 'v' || k === 'ה') onAction('camera');
    if (k === 'x' || k === 'ס') pending.declareImpossible = true;
    if (st.level.special?.kind === 'whereami' && ['1', '2', '3'].includes(k)) pending.gear = Number(k) - 1;
  }
}

// ---------------------------------------------------------------- simulation step

function simStep() {
  if (!st || paused || transition || !started) return;
  if (st.mode !== 'play' && st.mode !== 'tripod') return;
  // The world waits while you choose: browsing tickets or sleep hours costs no game time.
  if (!hud.el('sleepPanel').hidden || !hud.el('trainPanel').hidden) return;
  const ax = controls.axes();
  const input: Input = { ...NO_INPUT, ...ax, ...pending };
  pending = {};
  const before = st.utc;
  running = input.forward !== 0;
  step(st, input, DT);
  const jump = st.utc - before;
  const ev = st.events.slice(seenEvents);
  const kind = ev.some((e) => e.kind === 'ticket') ? 'ticket' : ev.some((e) => e.kind === 'dream') ? 'dream' : ev.some((e) => e.kind === 'sleep' || e.kind === 'gear-ok') ? 'sleep' : null;
  if (jump > 0.5 && kind) {
    transition = { from: before, to: st.utc, t: 0, dur: Math.min(2.6, 1.0 + Math.log10(1 + jump) * 0.7), kind };
  } else displayUtc = st.utc;
  handleEvents(ev);
  seenEvents = st.events.length;
}

function shotLabel(id: string) {
  return st?.level.shots.find((s) => s.id === id)?.label ?? '';
}

function handleEvents(evs: SimEvent[]) {
  if (!st) return;
  for (const e of evs) {
    switch (e.kind) {
      case 'hint':
        // the overlay alone is easy to miss: say what it shows
        if (st.level.hint) hud.toast(`💡 ${st.level.hint}`, 'info', 6000);
        break;
      case 'shot-ok':
        sound.shutter();
        sound.ok();
        hud.flash();
        if (e.text && e.id) notes[e.id] = e.text;
        hud.toast(`צולם! ${shotLabel(e.id ?? '')}${e.text ? ` — ${e.text}` : ''}`, 'ok');
        break;
      case 'shot-miss':
        sound.shutter();
        sound.miss();
        hud.flash();
        hud.toast(e.text ?? '', 'miss', 4200);
        break;
      case 'sleep':
        sound.sleep();
        hud.toast(`צילה ישנה ${fmtHours(e.hours ?? 0)}… 💤`, 'info', 2200);
        break;
      case 'ticket':
        sound.train();
        hud.toast(`🚂 רכבת הלוח: ${e.text || 'כרטיס'} — כיוון אחד, קדימה.`, 'info', 2600);
        break;
      case 'token':
        sound.token();
        hud.toast('פריים של שעת זהב! 🎞️', 'ok', 1200);
        break;
      case 'token-dark':
        hud.toast('הפריים לא מתפתח בחושך — רק באור הדמדומים.', 'miss', 1600);
        break;
      case 'rail':
        hud.toast('מגפיים מגנטיות: גלישה על קו הרוחב!', 'info', 1400);
        break;
      case 'jump':
        sound.jump();
        break;
      case 'tripod':
        hud.toast('החצובה מוצבת. צילה נחה לידה עד שהיא תצלם.', 'info');
        break;
      case 'dream':
        hud.toast('חלום: כדור הארץ מסתובב הפוך! הציבי חצובה (P) לכיוון שבו לדעתך תזרח השמש.', 'info', 6000);
        hud.setTutorial('חלום: הציבי חצובה (P) לכיוון הזריחה של העולם ההפוך.');
        break;
      case 'gear-ok':
        sound.ok();
        hud.toast(`נכון: ${e.text}. צילה נרדמת ומתעוררת במקום חדש…`, 'ok', 3000);
        break;
      case 'impossible-ok':
        sound.ok();
        hud.toast('נכון! ירח מלא נמצא מול השמש: כשהשמש בשמיים הוא מתחת לאופק.', 'ok', 4000);
        break;
      case 'impossible-early':
        hud.toast('קודם צלמי את הירח המלא בלילה — ואז תחליטי אם אפשר לצלם אותו בצהריים.', 'info', 3500);
        break;
      case 'fail':
        sound.fail();
        if (st.fail?.kind === 'battery') setTimeout(() => sound.snore(), 700);
        if (st.fail?.kind === 'wave') sound.wave();
        resultTimer = 1.3;
        break;
      case 'win':
        sound.win();
        captureWin = true;
        resultTimer = 1.0;
        break;
    }
  }
}

const FAIL_TITLES: Record<string, string> = {
  battery: 'הסוללה נגמרה',
  time: 'נגמר האור',
  film: 'נגמר הסרט',
  bear: 'הדב לקח את החצובה',
  wave: 'גל!',
  tripod: 'החצובה פספסה',
  gear: 'הציוד לא התאים',
};

function showResult() {
  if (!st) return;
  if (st.mode === 'failed') {
    const why = [...st.events].reverse().find((e) => e.kind === 'fail')?.text ?? '';
    hud.showFail(FAIL_TITLES[st.fail?.kind ?? 'time'], why, st.level.rule);
  } else if (st.mode === 'won') {
    if (captureWin) render();
    const lvl = st.level;
    if (lvl.id < 100) {
      saved.stars[lvl.id] = Math.max(saved.stars[lvl.id] ?? 0, st.stars);
      persist();
    }
    const par = lvl.parCommits ?? 99;
    const commits = st.ticketsUsed + st.sleeps;
    const lines = [
      '★ השלב הושלם',
      st.hintsUsed === 0 ? '★ בלי רמז' : '☆ השתמשת ברמז',
      st.misses <= 1 && commits <= par
        ? `★ תכנון חסכוני (${commits === 0 ? 'בלי שינה וכרטיסים' : count(commits, 'התחייבות', 'התחייבויות')}${st.misses ? ', פספוס אחד' : ''})`
        : `☆ כוכב שלישי: עד פספוס אחד ועד ${par} שינות/כרטיסים. הפעם: ${count(st.misses, 'פספוס', 'פספוסים', false)} ו${count(commits, 'התחייבות', 'התחייבויות')}.`,
    ];
    hud.showWin(lvl, st.stars, lines, lvl.id < LEVELS.length || lvl.id >= 100);
    const photo = document.getElementById('winPhoto');
    if (photo && winPhoto) photo.style.backgroundImage = `url(${winPhoto})`;
  }
}

function fmtHours(h: number) {
  if (h >= 48 && h % 24 === 0) return h === 48 ? 'יומיים' : `${h / 24} ימים`;
  if (h === 24) return 'יממה';
  const r = Math.round(h * 10) / 10;
  return r === 1 ? 'שעה אחת' : r === 2 ? 'שעתיים' : `${r} שעות`;
}

/** Hebrew count phrase: (1, 'שינה', 'שינות') → 'שינה אחת'. */
function count(n: number, one: string, many: string, fem = true) {
  if (n === 1) return `${one} ${fem ? 'אחת' : 'אחד'}`;
  if (n === 0) return `אפס ${many}`;
  return `${n} ${many}`;
}

// ---------------------------------------------------------------- HUD info

function localDateLabel(level: LevelDef, utc: number, lon: number) {
  // The calendar date follows the orbit (as on the train tickets); across the date line it shifts by a day.
  const d = Math.floor(dayOfYearFromL(orbitL(level, utc))) + localDayIndex(utc, wrap180(lon)) - localDayIndex(utc, 0);
  return dateLabel(lFromDayOfYear(d + 0.5));
}

function updateHud() {
  if (!st) return;
  const lvl = st.level;
  const { lat, lon } = latLon(st);
  const L = st.L;
  const sun = sunPosition(lat, lon, displayUtc, L, st.spin);
  const local = wrap24(displayUtc + lon / 15);
  let clock = '';
  let icon = sun.elevation > 0 ? '☀️' : sun.elevation > -6 ? '🌅' : '🌙';
  const b = (s: string) => `<bdi dir="ltr">${s}</bdi>`;
  if (lvl.clock === 'local') clock = `${b(hhmm(local))} · ${localDateLabel(lvl, displayUtc, lon)}`;
  else if (lvl.clock === 'home') clock = `שעון ${lvl.homeName}: ${b(hhmm(displayUtc + (lvl.homeLon ?? 0) / 15))}`;
  else if (lvl.clock === 'sundial') {
    icon = '🕰️';
    clock = sun.elevation > 0.5 ? `צל: ${b(shadowLength(sun.elevation).toFixed(2))} × גובה המוט` : 'אין צל';
  }
  if (lvl.special?.kind === 'causeway') {
    // a tide gauge, so the crossing is a reading, not a guess
    const tide = causewayTide(st);
    const open = tide <= lvl.special.openBelow;
    clock += ` · 🌊 ${b(tide.toFixed(1))} מ' ${open ? '✔ השביל יבש' : `✖ השביל מוצף (נפתח מתחת ל-${b(String(lvl.special.openBelow))})`}`;
  }
  const shots = lvl.shots.map((s) => ({ label: s.label, done: !!st!.taken[s.id], value: notes[s.id] }));
  const sp = lvl.special;
  hud.update({
    facing: facingAzimuth(st),
    battery: st.battery,
    clock,
    clockIcon: icon,
    film: lvl.film > 0 ? st.film : null,
    ticketsLeft: lvl.tickets ? lvl.tickets.count - st.ticketsUsed : null,
    atStation: atStation(st),
    shots,
    tokens: sp?.kind === 'tokens' ? { got: st.tokens.filter(Boolean).length, of: st.tokens.length } : undefined,
    rounds: sp?.kind === 'whereami' ? { got: st.round, of: sp.rounds.length } : undefined,
    impossible: sp?.kind === 'impossible' ? st.impossibleDeclared : undefined,
    // L10 promises no month names: the hill's shadow is the only calendar
    insetDate: lvl.clock === 'sundial' ? '' : lvl.world === 4 ? `${dateLabel(L)} · ${PHASE_NAMES[phaseIndex(st.moonAge)]}` : dateLabel(L),
  });
  // waypoints to every place you are not at, and to the Moon's shadow while it is on the Earth
  const face = facingAzimuth(st);
  const marks: { name: string; rel: number; km: number; kind?: 'shadow' }[] = [];
  if (st.mode === 'play' && lvl.special?.kind !== 'whereami') {
    for (const p of lvl.places) {
      const d = angularDistance(lat, lon, p.lat, p.lon);
      if (d < Math.max(1.5, p.radius)) continue;
      marks.push({ name: p.name, rel: wrap180(bearing(lat, lon, p.lat, p.lon) - face), km: d * 111.2 });
    }
    const ecl = solarEclipseCenter(displayUtc, L, st.moonAge);
    if (ecl) {
      const d = angularDistance(lat, lon, ecl.lat, ecl.lon);
      if (d > 1.5) marks.push({ name: '🌑 צל הירח', rel: wrap180(bearing(lat, lon, ecl.lat, ecl.lon) - face), km: d * 111.2, kind: 'shadow' });
    }
  }
  hud.markers(marks);
  // sun sight (hold Q)
  if (controls.held('q', '/') && st.mode === 'play') {
    const dir = sun.azimuth > 90 && sun.azimuth < 270 ? 'דרום' : 'צפון';
    const side = sun.azimuth < 180 ? 'מזרח' : 'מערב';
    hud.sight(
      sun.elevation > 0
        ? `כוונת שמש<br>גובה: ${b(sun.elevation.toFixed(0) + '°')}<br>כיוון: ${Math.abs(sun.azimuth - 180) < 8 || sun.azimuth < 8 || sun.azimuth > 352 ? dir : `${dir}-${side}`}`
        : 'כוונת שמש<br>השמש מתחת לאופק',
    );
  } else hud.sight(null);
  // tutorial lines rotate
  if (lvl.tutorial && !st.dream && started) {
    const idx = Math.floor(tutorialT / 6);
    hud.setTutorial(idx < lvl.tutorial.length && st.mode === 'play' ? lvl.tutorial[idx] : null);
  }
}

// ---------------------------------------------------------------- frame

function advance(dt: number) {
  realT += dt;
  if (screen === 'menu') {
    menuUtc += dt * 0.15;
    world.menuCamera(realT, menuUtc, 60, saved.reduced);
    return;
  }
  if (screen !== 'play' || !st) return;
  if (!paused && started) tutorialT += dt;
  if (transition && !paused) {
    transition.t += dt;
    const p = Math.min(1, transition.t / transition.dur);
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    displayUtc = transition.from + (transition.to - transition.from) * e;
    hud.fade(transition.kind === 'ticket' ? Math.sin(p * Math.PI) * 0.35 : 0);
    if (p >= 1) {
      displayUtc = transition.to;
      if (transition.kind === 'sleep') sound.wake();
      transition = null;
      hud.fade(0);
    }
  } else if (!paused) {
    accum += dt;
    let n = 0;
    while (accum >= DT && n < 8) {
      simStep();
      accum -= DT;
      n++;
    }
    if (n === 8) accum = 0;
  }
  if (resultTimer > 0 && !paused) {
    resultTimer -= dt;
    if (resultTimer <= 0) showResult();
  }
  sound.setGrind(!!st && st.grinding !== null && running && st.mode === 'play');
  const sleeping = transition && transition.kind !== 'ticket' ? Math.min(0.999, transition.t / transition.dur) : 0;
  const framed = !hud.el('sleepPanel').hidden || !hud.el('trainPanel').hidden;
  world.update(st, { utc: displayUtc, cameraMode, reducedMotion: saved.reduced, sleeping, running: running && st.mode === 'play', framed }, dt, realT);
  if (gridOn) world.planet.uniforms.gridOn.value = 1;
  inset.update(st.L, st.moonAge, saved.reduced ? 0 : dt);
  updateHud();
}

function render() {
  renderer.setViewport(0, 0, renderer.domElement.width / renderer.getPixelRatio(), renderer.domElement.height / renderer.getPixelRatio());
  renderer.render(world.scene, world.camera);
  if (captureWin) {
    captureWin = false;
    try {
      winPhoto = renderer.domElement.toDataURL('image/jpeg', 0.8);
    } catch {
      winPhoto = '';
    }
  }
  if (screen === 'play' && st && st.level.world > 1) {
    const frame = hud.el('insetFrame');
    if (!frame.hidden) {
      const r = frame.getBoundingClientRect();
      const c = renderer.domElement.getBoundingClientRect();
      const h = c.height;
      inset.render(renderer, r.left - c.left, h - (r.bottom - c.top), r.width, r.height);
    }
  }
}

let last = performance.now();
let manual = false;
function frame(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!manual) {
    handleKeys();
    advance(dt);
    render();
  }
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- test hooks

declare global {
  interface Window {
    render_game_to_text: () => string;
    advanceTime: (ms: number) => void;
    tilt: { startLevel: (id: number) => void; press: (input: Partial<Input>) => void; state: () => SimState | null; world: () => World };
  }
}

window.render_game_to_text = () => {
  if (screen !== 'play' || !st) return JSON.stringify({ screen, levels: LEVELS.length, stars: saved.stars });
  const c = shotCtx(st);
  return JSON.stringify({
    screen,
    level: st.level.id,
    title: st.level.title,
    mode: st.mode,
    paused,
    transition: transition?.kind ?? null,
    pos: { lat: +c.lat.toFixed(2), lon: +c.lon.toFixed(2) },
    facing: +c.facing.toFixed(0),
    localTime: hhmm(c.localTime),
    date: dateLabel(st.L),
    sun: { elevation: +c.sun.elevation.toFixed(1), azimuth: +c.sun.azimuth.toFixed(0) },
    moon: { elevation: +c.moon.elevation.toFixed(1), phase: PHASE_NAMES[phaseIndex(st.moonAge)] },
    battery: +st.battery.toFixed(1),
    film: st.film,
    place: c.place?.id ?? null,
    grinding: st.grinding,
    shots: Object.fromEntries(st.level.shots.map((s) => [s.id, !!st!.taken[s.id]])),
    tickets: st.level.tickets ? { used: st.ticketsUsed, of: st.level.tickets.count, atStation: atStation(st) } : null,
    sleeps: st.sleeps,
    lastEvent: st.events.at(-1) ?? null,
    stars: st.stars,
  });
};

window.advanceTime = (ms: number) => {
  manual = true;
  const steps = Math.max(1, Math.round(ms / (1000 * DT)));
  handleKeys();
  for (let i = 0; i < steps; i++) advance(DT);
  render();
};

window.tilt = {
  startLevel,
  press: (input) => Object.assign(pending, input),
  state: () => st,
  world: () => world,
};

boot().catch((e) => {
  console.error(e);
  loadingEl.textContent = 'שגיאה בטעינה: ' + String(e);
});
