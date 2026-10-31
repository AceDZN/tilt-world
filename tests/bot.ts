// A scripted player that drives the sim only through Input, like the keyboard does.
import { angularDistance, localSolarTime, moonPosition, sunPosition, wrap180, wrap24 } from '../src/astro/astro';
import { createSim, facingAzimuth, latLon, moonAgeAt, orbitL, shotCtx, step, ticketChoices, type SimState } from '../src/game/sim';
import { getLevel } from '../src/game/levels';
import { NO_INPUT, type Input, type ShotCtx } from '../src/game/types';

export const DT = 1 / 30;

export function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export class Bot {
  st: SimState;
  constructor(levelId: number) {
    this.st = createSim(getLevel(levelId));
  }
  get alive() {
    return this.st.mode === 'play' || this.st.mode === 'tripod';
  }
  tick(input: Partial<Input> = {}) {
    step(this.st, { ...NO_INPUT, ...input }, DT);
  }
  ctx(): ShotCtx {
    return shotCtx(this.st);
  }
  here() {
    return latLon(this.st);
  }
  /** Run to a place along the great circle. Returns false if the run failed (death, timeout). */
  goTo(lat: number, lon: number, tol = 0.6, maxSec = 120, extra: Partial<Input> = {}): boolean {
    for (let i = 0; i < maxSec / DT; i++) {
      if (!this.alive) return false;
      const h = this.here();
      if (angularDistance(h.lat, h.lon, lat, lon) <= tol) return true;
      const d = angularDistance(h.lat, h.lon, lat, lon);
      const b = bearing(h.lat, h.lon, lat, lon);
      const diff = wrap180(b - facingAzimuth(this.st));
      const slow = Math.min(1, Math.max(0.05, d / 1.5));
      this.tick({ turn: Math.max(-1, Math.min(1, diff / 15)), forward: Math.abs(diff) < 20 ? slow : 0, ...extra });
    }
    return false;
  }
  face(az: number, maxSec = 5): boolean {
    for (let i = 0; i < maxSec / DT; i++) {
      if (!this.alive) return false;
      const diff = wrap180(az - facingAzimuth(this.st));
      if (Math.abs(diff) < 2) return true;
      this.tick({ turn: Math.max(-1, Math.min(1, diff / 10)) });
    }
    return false;
  }
  faceSun() {
    return this.face(this.ctx().sun.azimuth);
  }
  faceMoon() {
    return this.face(this.ctx().moon.azimuth);
  }
  /** Wait at the clock's own pace until pred is true. */
  waitUntil(pred: (c: ShotCtx, st: SimState) => boolean, maxSec = 300): boolean {
    for (let i = 0; i < maxSec / DT; i++) {
      if (!this.alive) return false;
      if (pred(this.ctx(), this.st)) return true;
      this.tick();
    }
    return false;
  }
  /** Commit a sleep of this many hours. */
  sleep(hours: number) {
    this.tick({ sleep: hours });
  }
  /** Sleep until shortly before a local solar time here (whole quarter hours), then let the clock run. */
  sleepToLocal(local: number, early = 0.25) {
    const h = Math.floor((wrap24(local - this.ctx().localTime) - early) * 4) / 4;
    if (h > 0) this.sleep(h);
  }
  /** Sky at this spot `dh` hours from now (prediction only; the sim is not touched). */
  skyIn(dh: number) {
    const { lat, lon } = this.here();
    const utc = this.st.utc + dh;
    const L = orbitL(this.st.level, utc);
    const age = moonAgeAt(this.st.level, utc);
    return {
      utc,
      L,
      age,
      local: localSolarTime(utc, lon),
      sun: sunPosition(lat, lon, utc, L, this.st.spin),
      moon: moonPosition(lat, lon, utc, L, age),
    };
  }
  /** First whole-hour offset (≥ from) at which pred holds, or -1. */
  findHour(pred: (s: ReturnType<Bot['skyIn']>) => boolean, from = 1, to = 24 * 40, stepH = 1): number {
    for (let h = from; h <= to; h += stepH) if (pred(this.skyIn(h))) return h;
    return -1;
  }
  tickets() {
    return ticketChoices(this.st);
  }
  ticket(i: number) {
    this.tick({ ticket: i });
  }
  shoot() {
    this.tick({ shoot: true });
    return this.st.events.at(-1);
  }
  press(input: Partial<Input>) {
    this.tick(input);
  }
}
