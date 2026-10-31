// Browser smoke test: every level (and a random quest) loads, plays and opens its panels with no
// console errors; three levels are played to the win card by the test bot. Needs: npm run dev.
// Usage: npm run smoke   (frames go to git-ignored scratch/smoke/)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:5242/';
const OUT = 'scratch/smoke';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(BASE + '?all');
await page.waitForFunction(() => window.render_game_to_text && JSON.parse(window.render_game_to_text()).screen === 'menu', null, { timeout: 60000 });

const state = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
let bad = 0;
// frames are best-effort: a loaded machine can make SwiftShader screenshots very slow
const shot = (path) => page.screenshot({ path, timeout: 120000 }).catch(() => console.log(`(no frame: ${path})`));
const check = (ok, msg) => {
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`);
};

async function start(id) {
  await page.evaluate((n) => window.tilt.startLevel(n), id);
  await page.waitForTimeout(150);
  await page.keyboard.press('Enter');
  await page.evaluate(() => window.advanceTime(1500));
}

for (let id = 1; id <= 18; id++) {
  const before = errors.length;
  await start(id);
  const s0 = await state();
  check(s0.screen === 'play' && s0.level === id && !s0.paused, `L${id} starts (${s0.title}, ${s0.localTime})`);
  // panels open and freeze the clock
  for (const key of ['z', 'c']) {
    await page.keyboard.press(key);
    const t0 = (await state()).localTime;
    await page.evaluate(() => window.advanceTime(3000));
    const open = await page.evaluate(() => !document.getElementById('sleepPanel').hidden || !document.getElementById('trainPanel').hidden);
    if (open) check((await state()).localTime === t0, `L${id} clock frozen in ${key === 'z' ? 'sleep' : 'train'} panel`);
    // keys are handled on the next game step, so step once after each press
    await page.keyboard.press('Escape');
    await page.evaluate(() => window.advanceTime(100));
    if (await page.evaluate(() => !document.getElementById('pauseMenu').hidden)) {
      await page.keyboard.press('Escape');
      await page.evaluate(() => window.advanceTime(100));
    }
  }
  await page.keyboard.press('h');
  await page.evaluate(() => window.advanceTime(500));
  await shot(`${OUT}/l${id}.png`);
  check(errors.length === before, `L${id} no console errors ${errors.slice(before).join(' | ')}`);
}

// play to the win card: the test bot sets up the shot, a real E key press takes it
const solutions = {
  1: `while (b.alive && b.ctx().sun.elevation < 0.2) b.tick({ forward: 1 }); b.faceSun();`,
  4: `b.goTo(23.8, 90, 1); b.waitUntil((c) => c.localTime >= 13.75);`,
  8: `const o = b.tickets(); b.ticket(o.findIndex((t) => Math.abs(astro.wrap180(t.L - 90)) < 3)); b.goTo(69, 21, 0.6); b.sleepToLocal(23.6); b.waitUntil((c) => c.localTime >= 23.95 || c.localTime < 0.3, 60); b.faceSun();`,
};
for (const [id, body] of Object.entries(solutions)) {
  await start(Number(id));
  await page.evaluate(async ({ id, body }) => {
    const { Bot } = await import('/tests/bot.ts');
    const astro = await import('/src/astro/astro.ts');
    const b = new Bot(id);
    b.st = window.tilt.state();
    new Function('b', 'astro', body)(b, astro);
  }, { id: Number(id), body });
  await page.keyboard.press('e');
  // the win card follows the photo flash a few frames later
  const card = await page
    .waitForFunction(() => (window.advanceTime(100), !!document.querySelector('#result:not([hidden]) .win #winPhoto')), null, { timeout: 30000, polling: 200 })
    .then(() => true, () => false);
  const s = await state();
  check(s.mode === 'won' && card, `L${id} played to the win card (${s.stars}★)`);
  await shot(`${OUT}/win-l${id}.png`);
}

// a random quest from the menu
await page.evaluate(() => document.querySelector('[data-a=menu]')?.click());
await page.waitForTimeout(200);
await page.evaluate(() => document.querySelector('[data-a=quest]').click());
await page.waitForTimeout(200);
await page.keyboard.press('Enter');
await page.evaluate(() => window.advanceTime(1000));
const q = await state();
check(q.screen === 'play' && q.level >= 100, `random quest starts (${q.title})`);
check(errors.length === 0, `no console errors overall`);
await browser.close();
console.log(bad ? `${bad} problem(s)` : 'all good');
process.exit(bad ? 1 : 0);
