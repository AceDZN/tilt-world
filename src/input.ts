// Keyboard and touch to held axes plus queued one-shot presses.
export class Controls {
  private keys = new Set<string>();
  private pressed: string[] = [];
  stick = { x: 0, y: 0, active: false };
  touchJump = false;

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
        return;
      }
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      this.keys.add(k);
      this.pressed.push(k);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      this.keys.delete(k);
    });
    window.addEventListener('blur', () => this.keys.clear());
  }

  held(...ks: string[]) {
    return ks.some((k) => this.keys.has(k));
  }

  /** Consume queued presses. */
  drain(): string[] {
    const p = this.pressed;
    this.pressed = [];
    return p;
  }

  axes() {
    let forward = 0;
    let turn = 0;
    // Hebrew keyboard layout letters on the same keys: ' (w), ד (s), ש (a), ג (d)
    if (this.held('w', 'ArrowUp', "'")) forward += 1;
    if (this.held('s', 'ArrowDown', 'ד')) forward -= 1;
    if (this.held('a', 'ArrowLeft', 'ש')) turn -= 1;
    if (this.held('d', 'ArrowRight', 'ג')) turn += 1;
    if (this.stick.active) {
      forward = Math.max(-1, Math.min(1, -this.stick.y * 1.4));
      turn = Math.max(-1, Math.min(1, this.stick.x * 1.4));
      if (Math.abs(forward) < 0.2) forward = 0;
      if (Math.abs(turn) < 0.15) turn = 0;
    }
    return { forward, turn };
  }

  bindTouch(stickEl: HTMLElement, knob: HTMLElement, jumpBtn: HTMLElement) {
    let id: number | null = null;
    const r = () => stickEl.getBoundingClientRect();
    const move = (x: number, y: number) => {
      const b = r();
      const cx = b.left + b.width / 2;
      const cy = b.top + b.height / 2;
      let dx = (x - cx) / (b.width / 2);
      let dy = (y - cy) / (b.height / 2);
      const l = Math.hypot(dx, dy);
      if (l > 1) {
        dx /= l;
        dy /= l;
      }
      this.stick = { x: dx, y: dy, active: true };
      knob.style.transform = `translate(${dx * 40}px, ${dy * 40}px)`;
    };
    stickEl.addEventListener('pointerdown', (e) => {
      id = e.pointerId;
      stickEl.setPointerCapture(e.pointerId);
      move(e.clientX, e.clientY);
    });
    stickEl.addEventListener('pointermove', (e) => e.pointerId === id && move(e.clientX, e.clientY));
    const end = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = null;
      this.stick = { x: 0, y: 0, active: false };
      knob.style.transform = '';
    };
    stickEl.addEventListener('pointerup', end);
    stickEl.addEventListener('pointercancel', end);
    jumpBtn.addEventListener('pointerdown', () => this.pressed.push(' '));
  }
}
