// A scripted player that drives the sim only through Input, like the keyboard does.
import { angularDistance, wrap180 } from '../src/astro/astro';
import { createSim, facingAzimuth, latLon, shotCtx, step, type SimState } from '../src/game/sim';
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
      const b = bearing(h.lat, h.lon, lat, lon);
      const diff = wrap180(b - facingAzimuth(this.st));
      this.tick({ turn: Math.max(-1, Math.min(1, diff / 15)), forward: Math.abs(diff) < 70 ? 1 : 0.1, ...extra });
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
  /** Wait (optionally fast-forwarding) until pred is true. */
  waitUntil(pred: (c: ShotCtx, st: SimState) => boolean, ff = true, maxSec = 300): boolean {
    for (let i = 0; i < maxSec / DT; i++) {
      if (!this.alive) return false;
      if (pred(this.ctx(), this.st)) return true;
      this.tick({ fastForward: ff });
    }
    return false;
  }
  shoot() {
    this.tick({ shoot: true });
    return this.st.events.at(-1);
  }
  press(input: Partial<Input>) {
    this.tick(input);
  }
}
