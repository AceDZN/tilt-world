// DOM HUD in Hebrew, right to left. Numbers sit in LTR <bdi>. Every state is shown with an icon or
// a word as well as color.
import { dateLabel, declination, wrap24 } from '../astro/astro';
import type { LevelDef } from '../game/types';
import { GEAR_NAMES } from '../game/types';
import type { TicketChoice } from '../game/sim';
import { WORLDS, LEVELS } from '../game/levels';

export type HudAction =
  | 'pause'
  | 'resume'
  | 'mute'
  | 'restart'
  | 'menu'
  | 'next'
  | 'shoot'
  | 'sleep-open'
  | 'sleep-commit'
  | 'sleep-cancel'
  | 'train-open'
  | 'train-cancel'
  | 'ticket'
  | 'plant'
  | 'hint'
  | 'gear'
  | 'impossible'
  | 'level'
  | 'reduced'
  | 'camera'
  | 'fullscreen'
  | 'start'
  | 'quest';

const b = (n: number | string) => `<bdi dir="ltr">${n}</bdi>`;
export const hhmm = (h: number) => {
  const m = Math.round(wrap24(h) * 60) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
// Hebrew letters for unlabeled tickets, skipping the final forms (ך ם ן ף ץ)
const TICKET_LETTERS = 'אבגדהוזחטיכלמנסעפצקרשת'.split('');
const escRaw = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
// Numbers with a sign, a range, a degree or a percent flip in RTL ("°15", "179+", "40–20"): keep each one LTR.
// (a hyphen right after a Hebrew letter is a prefix, as in "ב-6°C", not a minus sign)
const NUM = /(?:(?<![\u0590-\u05FF])[+\-−])?\d+(?:[.,:]\d+)*(?:\s?[–-]\s?\d+(?:[.,:]\d+)*)?(?:°C?|%)?(?:\+)?/g;
/** The same for ready-made HTML: wrap numbers in text, never inside tags or existing bdi. */
const ltrNums = (html: string) =>
  html
    .split(/(<bdi[^>]*>.*?<\/bdi>|<[^>]+>)/)
    .map((part) => (part.startsWith('<') ? part : part.replace(NUM, (m) => `<bdi dir="ltr">${m}</bdi>`)))
    .join('');
const esc = (s: string) => {
  let out = '';
  let last = 0;
  for (const m of s.matchAll(NUM)) {
    const num = `<bdi dir="ltr">${escRaw(m[0])}</bdi>`;
    // keep a prefix like "ב-" on the same line as its number
    const pre = /[\u0590-\u05FF]-$/.test(s.slice(last, m.index)) ? 2 : 0;
    out += escRaw(s.slice(last, m.index! - pre)) + (pre ? `<span style="white-space:nowrap">${escRaw(s.slice(m.index! - pre, m.index))}${num}</span>` : num);
    last = m.index! + m[0].length;
  }
  return out + escRaw(s.slice(last));
};
const stars = (n: number, of = 3) =>
  Array.from({ length: of }, (_, i) => `<span class="star ${i < n ? 'on' : ''}" aria-hidden="true">${i < n ? '★' : '☆'}</span>`).join('');

/** A small Sun–Earth picture for a ticket: the axis tilt relative to the Sun at orbit position L. */
export function seasonIcon(L: number): string {
  const d = declination(L);
  const lean = (d / 23.5) * 23.5; // + = north pole toward the Sun (Sun on the right)
  // northern seasons by orbit quadrant: spring around L 0, summer 90, autumn 180, winter 270
  const q = Math.floor((((L + 45) % 360) + 360) % 360 / 90);
  const sym = ['✿', '☀︎', '🍂', '❄︎'][q];
  return `<svg viewBox="0 0 120 70" class="season" aria-hidden="true">
    <circle cx="96" cy="35" r="13" fill="#ffd25a"/><circle cx="96" cy="35" r="19" fill="#ffb02e" opacity=".25"/>
    <line x1="58" y1="35" x2="80" y2="35" stroke="#ffd25a" stroke-width="2" stroke-dasharray="3 3"/>
    <g transform="translate(36 35) rotate(${lean.toFixed(1)})">
      <circle r="16" fill="#2c6fd6"/><path d="M-16 0a16 16 0 0 1 32 0z" fill="#3c8f4a" opacity=".55"/>
      <line y1="-24" y2="24" stroke="#fff" stroke-width="2"/><circle cy="-24" r="3" fill="#ff7a7a"/>
    </g>
    <text x="12" y="64" font-size="14" fill="#ffe7a8">${sym}</text>
  </svg>`;
}

/** The Moon's node line (fixed) and the Sun's direction at L: an eclipse needs them lined up. */
export function nodeIcon(L: number): string {
  const ang = (deg: number) => ((-deg + 90) * Math.PI) / 180;
  const nx = Math.cos(ang(30)) * 26;
  const ny = Math.sin(ang(30)) * 26;
  const sx = 35 + Math.cos(ang(L)) * 26;
  const sy = 35 - Math.sin(ang(L)) * 26;
  return `<svg viewBox="0 0 70 70" class="nodeico" aria-hidden="true">
    <circle cx="35" cy="35" r="26" fill="none" stroke="#8aa4e8" stroke-width="1.5"/>
    <line x1="${35 - nx}" y1="${35 + ny}" x2="${35 + nx}" y2="${35 - ny}" stroke="#ffe070" stroke-width="2" stroke-dasharray="4 3"/>
    <circle cx="35" cy="35" r="5" fill="#2c6fd6"/>
    <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="5" fill="#ffd25a"/>
  </svg>`;
}

export function moonIcon(age: number): string {
  // terminator ellipse: lit fraction from the age
  const k = Math.cos((age / 29.53) * 2 * Math.PI); // 1 new, -1 full
  const waxing = age < 29.53 / 2;
  const rx = Math.abs(k) * 16;
  const litSide = waxing ? 1 : -1;
  const d = `M24 8 A16 16 0 0 ${litSide > 0 ? 1 : 0} 24 40 A${rx.toFixed(1)} 16 0 0 ${(k > 0) === litSide > 0 ? 0 : 1} 24 8z`;
  return `<svg viewBox="0 0 48 48" class="moonico" aria-hidden="true"><circle cx="24" cy="24" r="16" fill="#1d2440"/><path d="${d}" fill="#f3efe0"/></svg>`;
}

export class Hud {
  root: HTMLElement;
  private els: Record<string, HTMLElement> = {};
  private markerKey = '';
  private trainOrder: number[] = [];
  private onAction: (a: HudAction, arg?: number) => void;
  private sleepHours = 6;
  private sleepDays = false;
  /** Extra hours on top of whole days (days mode), so "3 days and 5 hours" is one commitment. */
  private sleepExtra = 0;
  private toastTimer = 0;
  private level: LevelDef | null = null;
  private trainChoices: TicketChoice[] = [];
  private trainPage = 0;

  constructor(root: HTMLElement, onAction: (a: HudAction, arg?: number) => void) {
    this.root = root;
    this.onAction = onAction;
    root.innerHTML = `
      <div class="hud" id="hud" hidden>
        <div class="tl">
          <button class="round" data-a="pause" aria-label="השהיה (Esc)">❚❚</button>
          <button class="round" data-a="mute" aria-label="השתקה (M)" id="muteBtn">🔊</button>
        </div>
        <div class="inset-frame" id="insetFrame" aria-label="מבט מהחלל (לקריאה בלבד)"><span class="inset-tag">מבט מהחלל</span><span class="inset-date" id="insetDate"></span></div>
        <div class="status" id="status">
          <div class="compass" id="compass" aria-label="מצפן: צפון למעלה">
            <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" class="cring"/><text x="50" y="17" text-anchor="middle" class="cn">N</text>
            <g id="needle"><path d="M50 22 L58 54 L50 48 L42 54Z" class="needle"/></g></svg>
            <span class="east">מזרח <bdi dir="ltr">→</bdi></span>
          </div>
          <div class="pill" id="battery"><span class="bat"><span class="batfill" id="batfill"></span></span><span id="battxt"></span></div>
          <div class="pill" id="clock"></div>
          <div class="pill small" id="film"></div>
          <div class="pill small" id="tickets"></div>
        </div>
        <div class="tr">
          <div class="levelpill"><span id="lvltitle"></span><span id="lvlstars" class="stars"></span></div>
          <div class="order" id="order"></div>
        </div>
        <div class="markers" id="markers" aria-hidden="true"></div>
        <div class="bubble" id="bubble" hidden><span class="bubble-face">◉</span><span id="bubbletxt"></span></div>
        <div class="toast" id="toast" role="status" aria-live="polite" hidden></div>
        <div class="sight" id="sight" hidden></div>
        <div class="actions" id="actions"></div>
        <button class="shutter" data-a="shoot" aria-label="צילום (E)" id="shutter"><svg viewBox="0 0 48 48"><path d="M17 12l3-4h8l3 4h7a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z" fill="#fff"/><circle cx="24" cy="25" r="8" fill="#1b2140"/><circle cx="24" cy="25" r="4.5" fill="#fff"/></svg></button>
        <div class="touch" id="touch" hidden>
          <div class="stick" id="stick"><div class="knob" id="knob"></div></div>
          <button class="tbtn" id="tjump" aria-label="קפיצה">⤒</button>
        </div>
      </div>
      <div class="modal" id="sleepPanel" hidden></div>
      <div class="modal" id="trainPanel" hidden></div>
      <div class="modal" id="result" hidden></div>
      <div class="modal" id="pauseMenu" hidden></div>
      <div class="menu" id="menu" hidden></div>
      <div class="fade" id="fade"></div>
    `;
    root.querySelectorAll<HTMLElement>('[id]').forEach((e) => (this.els[e.id] = e));
    root.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-a]');
      if (!t) return;
      // Keep the keyboard on the game: Space/Enter must not re-press a clicked button.
      if (t.dataset.a !== 'sleep-open' && t.dataset.a !== 'train-open') t.blur();
      const a = t.dataset.a as HudAction;
      const arg = t.dataset.arg !== undefined ? Number(t.dataset.arg) : undefined;
      if (a === 'sleep-commit') arg === undefined ? this.commitSleep() : null;
      else this.onAction(a, arg);
    });
  }

  el(id: string) {
    return this.els[id];
  }

  // ---------------------------------------------------------------- menu

  showMenu(progress: Record<number, number>, unlocked: (id: number) => boolean) {
    this.els.hud.hidden = true;
    const worlds = WORLDS.map((w) => {
      const levels = LEVELS.filter((l) => l.world === w.id)
        .map((l) => {
          const s = progress[l.id] ?? 0;
          const open = unlocked(l.id);
          return `<button class="lvl ${open ? '' : 'locked'}" ${open ? `data-a="level" data-arg="${l.id}"` : 'disabled'} aria-label="שלב ${l.id}: ${escRaw(l.title)}${open ? '' : ' (נעול)'}">
            <span class="num">${b(l.id)}</span><span class="lt">${esc(l.title)}</span><span class="stars">${open ? stars(s) : '🔒'}</span></button>`;
        })
        .join('');
      return `<section class="world w${w.id}"><h2>${esc(w.title)}</h2>${levels}</section>`;
    }).join('');
    const total = Object.values(progress).reduce((a, c) => a + c, 0);
    this.els.menu.innerHTML = `
      <header><h1>עולם נטוי</h1><p class="sub">צילה, רובוטית צילום סולארית, אוספת תמונות מכל העולם. היא לא יכולה לסובב את כדור הארץ — רק לרוץ, לישון, ולקנות כרטיס לכיוון אחד.</p>
      <p class="sub small">כוכבים: ${b(`${total} / ${LEVELS.length * 3}`)} · צפון תמיד למעלה, מזרח מימין במפה</p></header>
      <div class="worlds">${worlds}</div>
      <div class="questrow"><button class="go" data-a="quest">🎲 משימת צילום אקראית</button><span class="small sub">משימות חדשות בכל פעם — כל אחת נבדקה שיש לה פתרון</span></div>
      <footer><button class="ghost" data-a="reduced" id="reducedBtn">תנועה מופחתת</button><button class="ghost" data-a="mute">צליל</button><button class="ghost" data-a="fullscreen">מסך מלא</button></footer>`;
    this.els.menu.hidden = false;
  }

  hideMenu() {
    this.els.menu.hidden = true;
  }

  setReduced(on: boolean) {
    const btn = this.root.querySelector('#reducedBtn');
    if (btn) btn.textContent = on ? 'תנועה מופחתת: פועלת' : 'תנועה מופחתת';
  }

  setMuted(m: boolean) {
    this.els.muteBtn.textContent = m ? '🔇' : '🔊';
    this.els.muteBtn.setAttribute('aria-pressed', String(m));
  }

  // ---------------------------------------------------------------- level

  setLevel(level: LevelDef, best: number) {
    this.level = level;
    this.els.hud.hidden = false;
    this.els.lvltitle.innerHTML = level.id >= 100 ? esc(level.title) : `שלב ${b(level.id)}: ${esc(level.title)}`;
    this.els.lvlstars.innerHTML = stars(best);
    this.closeModals();
    this.els.insetFrame.hidden = level.world === 1;
    const acts: string[] = [];
    if (level.sleep) acts.push(`<button class="act" data-a="sleep-open"><span class="k">${b('Z')}</span>תא שינה</button>`);
    if (level.tickets) acts.push(`<button class="act" data-a="train-open" id="trainBtn"><span class="k">${b('C')}</span>רכבת הלוח</button>`);
    if (level.shots.some((s) => s.tripod)) acts.push(`<button class="act" data-a="plant"><span class="k">${b('P')}</span>חצובה</button>`);
    if (level.special?.kind === 'whereami')
      GEAR_NAMES.forEach((g, i) => acts.push(`<button class="act gear" data-a="gear" data-arg="${i}"><span class="k">${b(i + 1)}</span>${g}</button>`));
    if (level.special?.kind === 'impossible') acts.push(`<button class="act" data-a="impossible" id="impBtn"><span class="k">${b('X')}</span>"ירח מלא בצהריים"? בלתי אפשרי!</button>`);
    if (level.hint) acts.push(`<button class="act ghosty" data-a="hint"><span class="k">${b('H')}</span>רמז</button>`);
    acts.push(`<button class="act ghosty" data-a="camera"><span class="k">${b('V')}</span>מבט</button>`);
    this.els.actions.innerHTML = acts.join('');
  }

  /** Waypoint chips around the screen edge: rel = bearing relative to Tzila's facing (0 = straight ahead). */
  markers(list: { name: string; rel: number; km: number; kind?: 'shadow' }[]) {
    const key = list.map((m) => `${m.name}${Math.round(m.rel / 3)}${Math.round(m.km / 100)}`).join('|');
    if (key === this.markerKey) return;
    this.markerKey = key;
    // on an ellipse around Tzila, below the HUD corners; then nudge apart any that would overlap
    const W = window.innerWidth;
    const H = window.innerHeight;
    const pos = list.map((m) => {
      const r = (m.rel * Math.PI) / 180;
      const half = W < 700 ? 95 : 130; // keep the whole chip on screen
      const x = Math.min(W - half, Math.max(half, W * (0.5 + Math.sin(r) * 0.36)));
      return { x, y: H * (0.6 - Math.cos(r) * 0.2) };
    });
    const order = pos.map((_p, i) => i).sort((a, c) => pos[a].y - pos[c].y);
    for (let k = 1; k < order.length; k++)
      for (let j = 0; j < k; j++) {
        const p = pos[order[k]];
        const q = pos[order[j]];
        if (Math.abs(p.x - q.x) < 190 && Math.abs(p.y - q.y) < 30) p.y = q.y + 30;
      }
    this.els.markers.innerHTML = list
      .map((m, i) => {
        const x = (pos[i].x / W) * 100;
        const y = (pos[i].y / H) * 100;
        const km = m.km >= 1000 ? `${(m.km / 1000).toFixed(1)} אלף ק"מ` : `${Math.round(m.km / 10) * 10} ק"מ`;
        return `<div class="marker ${m.kind ?? ''}" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%"><svg class="marrow" viewBox="0 0 10 10" style="transform:rotate(${m.rel.toFixed(0)}deg)"><path d="M5 0L10 10L5 7.5L0 10Z" fill="currentColor"/></svg>${esc(m.name)} <small>${km.replace(/[\d.]+/, (d) => b(d))}</small></div>`;
      })
      .join('');
  }

  setTutorial(line: string | null) {
    // never over an open panel, where it would cover Tzila
    this.els.bubble.hidden = !line || this.modalOpen();
    if (line) this.els.bubbletxt.innerHTML = line.replace(/\(([^)]*[A-Za-z↑][^)]*)\)/g, (_m, k) => `(${b(k)})`);
  }

  update(info: {
    facing: number;
    battery: number;
    clock: string;
    clockIcon: string;
    film: number | null;
    ticketsLeft: number | null;
    atStation: boolean;
    shots: { label: string; done: boolean; value?: string }[];
    tokens?: { got: number; of: number };
    rounds?: { got: number; of: number };
    impossible?: boolean;
    insetDate: string;
  }) {
    (this.els.needle as unknown as SVGGElement).setAttribute('transform', `rotate(${info.facing.toFixed(1)} 50 50)`);
    const bat = Math.max(0, Math.min(100, info.battery));
    this.els.batfill.style.width = `${bat}%`;
    this.els.battery.classList.toggle('low', bat < 20);
    this.els.battxt.innerHTML = `${b(Math.round(bat) + '%')}${bat < 20 ? ' חלשה!' : ''}`;
    this.els.clock.innerHTML = `<span aria-hidden="true">${info.clockIcon}</span> ${info.clock}`;
    this.els.clock.hidden = !info.clock;
    this.els.film.hidden = info.film === null;
    if (info.film !== null) this.els.film.innerHTML = `🎞️ סרט: ${b(info.film)}`;
    this.els.tickets.hidden = info.ticketsLeft === null;
    if (info.ticketsLeft !== null) this.els.tickets.innerHTML = `🎫 כרטיסים: ${b(info.ticketsLeft)}${info.atStation ? ' · בתחנה' : ''}`;
    const tb = this.root.querySelector<HTMLButtonElement>('#trainBtn');
    if (tb) tb.disabled = !info.atStation || !info.ticketsLeft;
    let order = `<div class="ohead"><span class="cam">📷</span> ${this.level ? esc(this.level.brief) : ''}</div><ul>`;
    for (const s of info.shots) order += `<li class="${s.done ? 'done' : ''}"><span class="chk" aria-hidden="true">${s.done ? '✔' : '○'}</span>${esc(s.label)}${s.value ? ` <em>${b(s.value)}</em>` : ''}${s.done ? '<span class="sr"> (צולם)</span>' : ''}</li>`;
    if (info.tokens) order += `<li class="${info.tokens.got === info.tokens.of ? 'done' : ''}"><span class="chk">🎞️</span>פריימים של שעת זהב: ${b(`${info.tokens.got}/${info.tokens.of}`)}</li>`;
    if (info.rounds) order += `<li class="${info.rounds.got === info.rounds.of ? 'done' : ''}"><span class="chk">🧭</span>ציוד נכון: ${b(`${info.rounds.got}/${info.rounds.of}`)}</li>`;
    if (info.impossible !== undefined) order += `<li class="${info.impossible ? 'done' : ''}"><span class="chk">${info.impossible ? '✔' : '○'}</span>"ירח מלא בצהריים" — אפשר או אי אפשר?</li>`;
    order += '</ul>';
    if (this.els.order.innerHTML !== order) this.els.order.innerHTML = order;
    this.els.insetDate.innerHTML = info.insetDate;
  }

  toast(html: string, kind: 'ok' | 'miss' | 'info' = 'info', ms = 2600) {
    const t = this.els.toast;
    t.className = `toast ${kind}`;
    const icon = kind === 'ok' ? '✔ ' : kind === 'miss' ? '✖ ' : '';
    t.innerHTML = icon + ltrNums(html);
    t.hidden = false;
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => (t.hidden = true), ms);
  }

  sight(html: string | null) {
    this.els.sight.hidden = !html;
    if (html) this.els.sight.innerHTML = html;
  }

  flash() {
    const f = this.els.fade;
    f.classList.remove('flash');
    void f.offsetWidth;
    f.classList.add('flash');
  }

  fade(amount: number) {
    this.els.fade.style.opacity = String(amount);
  }

  // ---------------------------------------------------------------- sleep pod

  modalOpen() {
    return !this.els.sleepPanel.hidden || !this.els.trainPanel.hidden || !this.els.result.hidden || !this.els.pauseMenu.hidden;
  }

  closeModals() {
    for (const id of ['sleepPanel', 'trainPanel', 'result', 'pauseMenu']) this.els[id].hidden = true;
  }

  openSleep() {
    const lvl = this.level;
    if (!lvl?.sleep) return;
    this.renderSleep();
    this.els.sleepPanel.hidden = false;
    this.els.sleepPanel.querySelector<HTMLElement>('.go')?.focus();
  }

  private renderSleep() {
    const lvl = this.level!;
    const max = this.sleepDays ? 30 : lvl.sleep!.maxHours;
    this.sleepHours = Math.max(1, Math.min(max, this.sleepHours));
    const unit = this.sleepDays ? 'ימים' : 'שעות';
    this.els.sleepPanel.innerHTML = `
      <div class="panel">
        <h3>🛏️ תא שינה</h3>
        <p>בחרי לכמה זמן לישון — הזמן בעולם ימשיך קדימה.</p>
        <div class="row">
          <button class="step small" id="sMinus6" dir="ltr" aria-label="פחות 6">−6</button>
          <button class="step" id="sMinus" aria-label="פחות">−</button>
          <output class="num" id="sNum">${b(this.sleepHours)}</output>
          <button class="step" id="sPlus" aria-label="יותר">+</button>
          <button class="step small" id="sPlus6" dir="ltr" aria-label="יותר 6">+6</button>
          ${
            lvl.sleep!.allowDays
              ? `<div class="toggle" role="group" aria-label="יחידות"><button id="uH" class="${this.sleepDays ? '' : 'on'}" aria-pressed="${!this.sleepDays}">שעות</button><button id="uD" class="${this.sleepDays ? 'on' : ''}" aria-pressed="${this.sleepDays}">ימים</button></div>`
              : `<span class="unit">${unit}</span>`
          }
        </div>
        ${
          this.sleepDays
            ? `<div class="row extra"><span>ועוד</span><button class="step" id="xMinus" aria-label="פחות שעות">−</button><output class="num small" id="xNum">${b(this.sleepExtra)}</output><button class="step" id="xPlus" aria-label="יותר שעות">+</button><span>שעות</span></div>`
            : ''
        }
        <button class="go" data-a="sleep-commit">🛏️ לישון!</button>
        <p class="warn">⚠ אי אפשר לבטל</p>
        <button class="ghost close" data-a="sleep-cancel">חזרה</button>
      </div>`;
    const q = (id: string) => this.els.sleepPanel.querySelector<HTMLElement>('#' + id);
    q('sMinus')!.onclick = () => this.bumpSleep(-1);
    q('sPlus')!.onclick = () => this.bumpSleep(1);
    q('sMinus6')!.onclick = () => this.bumpSleep(-6);
    q('sPlus6')!.onclick = () => this.bumpSleep(6);
    if (q('xMinus')) {
      q('xMinus')!.onclick = () => ((this.sleepExtra = Math.max(0, this.sleepExtra - 1)), this.renderSleep());
      q('xPlus')!.onclick = () => ((this.sleepExtra = Math.min(23, this.sleepExtra + 1)), this.renderSleep());
    }
    if (q('uH')) {
      q('uH')!.onclick = () => ((this.sleepDays = false), this.renderSleep());
      q('uD')!.onclick = () => ((this.sleepDays = true), (this.sleepHours = Math.min(this.sleepHours, 7)), this.renderSleep());
    }
  }

  bumpSleep(d: number) {
    if (this.els.sleepPanel.hidden) return;
    this.sleepHours += d;
    this.renderSleep();
  }

  commitSleep() {
    if (this.els.sleepPanel.hidden) return;
    const hours = this.sleepDays ? this.sleepHours * 24 + this.sleepExtra : this.sleepHours;
    this.els.sleepPanel.hidden = true;
    this.onAction('sleep-commit', hours);
  }

  // ---------------------------------------------------------------- calendar train

  /** Option index of the n-th card on screen (number keys follow the card order). */
  trainIndex(n: number): number | undefined {
    return this.trainOrder[n];
  }

  openTrain(choices: TicketChoice[], left: number) {
    this.trainChoices = choices;
    this.trainPage = 0;
    this.renderTrain(left);
    this.els.trainPanel.hidden = false;
  }

  private renderTrain(left: number) {
    // as many cards as fit on one row next to the page arrows (2x2 on a phone)
    const w = window.innerWidth;
    const per = w < 700 ? 4 : Math.max(3, Math.min(6, Math.floor((w * 0.92 - 170) / 142)));
    const pages = Math.ceil(this.trainChoices.length / per);
    // cards in date order (soonest first); each keeps its option index for the sim
    this.trainOrder = this.trainChoices.map((_c, i) => i).sort((a, b2) => this.trainChoices[a].days - this.trainChoices[b2].days);
    const slice = this.trainOrder.slice(this.trainPage * per, this.trainPage * per + per).map((i) => ({ c: this.trainChoices[i], i }));
    const moon = this.level?.tickets?.options.some((o) => o.kind !== 'date');
    const newMoon = this.level?.tickets?.options.some((o) => o.kind === 'newmoon');
    const cards = slice
      .map(({ c, i }, k) => {
        const n = this.trainPage * per + k;
        const label = c.label || `כרטיס ${TICKET_LETTERS[n] ?? n + 1}`;
        return `<button class="ticket" data-a="ticket" data-arg="${i}"><span class="tl2">${esc(label)}</span>${moon ? moonIcon(c.moonAge) : ''}${newMoon ? nodeIcon(c.L) : seasonIcon(c.L)}<span class="days">${b('+' + c.days)} ימים</span></button>`;
      })
      .join('');
    this.els.trainPanel.innerHTML = `
      <div class="panel train">
        <h3>🚂 רכבת הלוח</h3>
        <p>בחרי תאריך: הרכבת נוסעת קדימה בזמן עד אליו, ושומרת על השעה ביום.</p>
        <div class="tickets">
          ${pages > 1 ? `<button class="step" id="tPrev" dir="ltr" aria-label="הקודמים" ${this.trainPage === 0 ? 'disabled' : ''}>›</button>` : ''}
          ${cards}
          ${pages > 1 ? `<button class="step" id="tNext" dir="ltr" aria-label="הבאים" ${this.trainPage >= pages - 1 ? 'disabled' : ''}>‹</button>` : ''}
        </div>
        <div class="row foot"><span class="pill">🎫 כרטיסים: ${b(left)}</span><span class="note">כרטיס לכיוון אחד</span></div>
        <button class="ghost close" data-a="train-cancel">חזרה</button>
      </div>`;
    const prev = this.els.trainPanel.querySelector<HTMLElement>('#tPrev');
    const next = this.els.trainPanel.querySelector<HTMLElement>('#tNext');
    if (prev) prev.onclick = () => ((this.trainPage = Math.max(0, this.trainPage - 1)), this.renderTrain(left));
    if (next) next.onclick = () => ((this.trainPage = Math.min(pages - 1, this.trainPage + 1)), this.renderTrain(left));
  }

  // ---------------------------------------------------------------- results and pause

  showFail(title: string, why: string, rule: string, extra = '') {
    this.els.result.innerHTML = `
      <div class="panel result fail">
        <h3>💤 ${esc(title)}</h3>
        <p class="why">${esc(why)}</p>
        ${extra}
        <p class="rule"><strong>הכלל:</strong> ${esc(rule)}</p>
        <div class="row"><button class="go" data-a="restart">↻ נסי שוב <span class="k">${b('R')}</span></button><button class="ghost" data-a="menu">לתפריט</button></div>
      </div>`;
    this.els.result.hidden = false;
    this.els.result.querySelector<HTMLElement>('.go')?.focus();
  }

  showWin(level: LevelDef, nStars: number, lines: string[], hasNext: boolean) {
    this.els.result.innerHTML = `
      <div class="panel result win">
        <div class="polaroid"><div class="photo" id="winPhoto"></div><div class="cap">${level.id >= 100 ? esc(level.title) : `שלב ${b(level.id)}: ${esc(level.title)}`}</div></div>
        <div class="bigstars">${stars(nStars)}</div>
        <ul class="why">${lines.map((l) => `<li>${l}</li>`).join('')}</ul>
        <p class="rule"><strong>הכלל:</strong> ${esc(level.rule)}</p>
        <div class="row">${hasNext ? `<button class="go" data-a="next">${level.id >= 100 ? 'משימה חדשה' : 'לשלב הבא'} ←</button>` : ''}<button class="ghost" data-a="restart">שוב</button><button class="ghost" data-a="menu">לתפריט</button></div>
      </div>`;
    this.els.result.hidden = false;
    this.els.result.querySelector<HTMLElement>('.go')?.focus();
  }

  showIntro(level: LevelDef) {
    const extra: string[] = [];
    const touch = window.matchMedia?.('(pointer: coarse)').matches;
    if (level.id === 1 || level.id >= 100)
      extra.push(touch ? '🕹️ ג׳ויסטיק משמאל: ריצה ופנייה · כפתור המצלמה: צילום' : `⌨️ ריצה: ${b('W')} או ${b('↑')} · פנייה: ${b('A/D')} · צילום: ${b('E')} · קפיצה: ${b('Space')}`);
    if (level.sleep) extra.push(`🛏️ תא שינה (${b('Z')}): בוחרים מראש כמה לישון — אי אפשר לבטל.`);
    if (level.tickets) extra.push(`🚂 רכבת הלוח (${b('C')}, בתחנה): ${level.tickets.count === 1 ? 'כרטיס אחד' : `${b(level.tickets.count)} כרטיסים`} לכיוון אחד.`);
    if (level.rails?.length) extra.push(`🧲 מגפיים מגנטיות: קפיצה (${b('Space')}) על קו רוחב מסומן = גלישה מהירה.`);
    this.els.result.innerHTML = `
      <div class="panel intro">
        <div class="kicker">${level.id >= 100 ? 'משימה אקראית' : `שלב ${b(level.id)}`} · ${esc(WORLDS[level.world - 1].title)}</div>
        <h3>${esc(level.title)}</h3>
        <p class="why">${esc(level.brief)}</p>
        ${extra.length ? `<ul class="tips">${extra.map((e) => `<li>${e}</li>`).join('')}</ul>` : ''}
        <p class="tips">צפון תמיד למעלה במצפן, ומזרח מימין.</p>
        <div class="row"><button class="go" data-a="start">יאללה! <span class="k">${b('Enter')}</span></button><button class="ghost" data-a="menu">לתפריט</button></div>
      </div>`;
    this.els.result.hidden = false;
    this.els.result.querySelector<HTMLElement>('.go')?.focus();
  }

  showPause(reduced: boolean, muted: boolean) {
    this.els.pauseMenu.innerHTML = `
      <div class="panel">
        <h3>❚❚ הפסקה</h3>
        <div class="col">
          <button class="go" data-a="resume">המשך</button>
          <button class="ghost" data-a="restart">התחלה מחדש</button>
          <button class="ghost" data-a="reduced">תנועה מופחתת: ${reduced ? 'פועלת' : 'כבויה'}</button>
          <button class="ghost" data-a="mute">צליל: ${muted ? 'כבוי' : 'פועל'}</button>
          <button class="ghost" data-a="menu">לתפריט השלבים</button>
        </div>
        <p class="keys">מקשים: ${b('W/S ↑/↓')} ריצה · ${b('A/D')} פנייה · ${b('Space')} קפיצה · ${b('E')} צילום · ${b('Z')} שינה · ${b('C')} רכבת · ${b('P')} חצובה · ${b('Q')} כוונת שמש · ${b('G')} רשת · ${b('H')} רמז · ${b('V')} מבט · ${b('F')} מסך מלא</p>
      </div>`;
    this.els.pauseMenu.hidden = false;
  }

  hidePause() {
    this.els.pauseMenu.hidden = true;
  }

  dateText(L: number) {
    return dateLabel(L);
  }
}
