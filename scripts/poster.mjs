// The workbook catalog poster: a real 1600×900 gameplay frame (L8, the midnight Sun at the Lapland
// cabin), saved as workbook/poster.jpg at 150–300 KB. It is git-ignored like every capture; pass it
// to the release with --poster. Needs the dev server (npm run dev). Usage: npm run poster
import { chromium } from 'playwright';
import { mkdirSync, statSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:5242/';
const OUT = 'workbook/poster.jpg';
mkdirSync('workbook', { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', (e) => console.error('pageerror', e.message));
await page.goto(BASE + '?level=8');
await page.waitForFunction(() => window.render_game_to_text && JSON.parse(window.render_game_to_text()).screen === 'play', null, { timeout: 120000 });
await page.keyboard.press('Enter');
await page.evaluate(async () => {
  const { Bot } = await import('/tests/bot.ts');
  const astro = await import('/src/astro/astro.ts');
  window.advanceTime(50);
  const b = new Bot(8);
  b.st = window.tilt.state();
  b.ticket(b.tickets().findIndex((t) => Math.abs(astro.wrap180(t.L - 90)) < 3));
  b.goTo(69, 21, 0.6);
  b.sleepToLocal(23.6);
  b.waitUntil((c) => c.localTime >= 23.95 || c.localTime < 0.3, 60);
  b.faceSun();
  for (let i = 0; i < 40 && JSON.parse(window.render_game_to_text()).transition; i++) window.advanceTime(250);
  for (let i = 0; i < 2; i++) {
    window.tilt.world().snapCamera(window.tilt.state());
    window.advanceTime(17);
  }
  // stale toasts from the scripted run would have faded long ago for a player
  document.querySelectorAll('.toast').forEach((t) => (t.hidden = true));
});
await page.waitForTimeout(300);
let size = 0;
for (const quality of [88, 82, 76, 70, 62, 54]) {
  await page.screenshot({ path: OUT, type: 'jpeg', quality, timeout: 180000 });
  size = statSync(OUT).size;
  if (size <= 300 * 1024) break;
}
console.log(OUT, Math.round(size / 1024), 'KB', await page.evaluate(() => window.render_game_to_text().slice(0, 140)));
await browser.close();
