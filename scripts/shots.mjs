// Captures real gameplay frames for docs/VISUAL_REVIEW.md, one per visual target.
// Needs the dev server: npm run dev (port 5242). Usage: npm run shots
// The scripted player is tests/bot.ts, loaded through Vite, so each frame is a reachable game state.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:5242/';
const OUT = 'docs/visual-review';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1672, height: 941 } });
page.on('pageerror', (e) => console.error('pageerror', e.message));

async function fresh(level) {
  await page.goto(BASE + (level ? `?level=${level}` : ''));
  await page.waitForFunction(() => !!window.render_game_to_text && JSON.parse(window.render_game_to_text()).screen !== 'loading', null, { timeout: 60000 });
  await page.waitForTimeout(500);
}

async function setup(level) {
  await fresh();
  await page.evaluate((id) => window.tilt.startLevel(id), level);
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await page.evaluate(() => {
    window.advanceTime(50);
    window.tilt.world().snapCamera(window.tilt.state());
    window.advanceTime(17);
  });
}

/** Run a scripted bot against the live sim state, then render one frame. */
async function bot(level, body) {
  await setup(level);
  await page.evaluate(
    async ({ level, body }) => {
      const { Bot } = await import('/tests/bot.ts');
      const sim = await import('/src/game/sim.ts');
      const astro = await import('/src/astro/astro.ts');
      const b = new Bot(level);
      b.st = window.tilt.state();
      // eslint-disable-next-line no-new-func
      const AsyncFunction = (async () => {}).constructor;
      await new AsyncFunction('b', 'sim', 'astro', body)(b, sim, astro);
      // let sleep/ticket transitions finish so the sky shows the sim clock
      for (let i = 0; i < 40 && JSON.parse(window.render_game_to_text()).transition; i++) window.advanceTime(250);
      window.tilt.world().snapCamera(window.tilt.state());
      window.advanceTime(17);
      window.tilt.world().snapCamera(window.tilt.state());
      window.advanceTime(17);
    },
    { level, body: body.toString().replace(/^[^{]*{|}$/g, '') },
  );
  await page.waitForTimeout(200);
}

async function shot(name, keepToast = false) {
  // the scripted run leaves stale toasts (e.g. "slept 3 h") that a player would have seen fade long ago
  if (!keepToast) await page.evaluate(() => document.querySelectorAll('.toast').forEach((t) => (t.hidden = true)));
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('captured', name, await page.evaluate(() => window.render_game_to_text().slice(0, 160)));
}

// 01 first sunrise: run east until the dawn line is just ahead.
await bot(1, (b) => {
  for (let i = 0; i < 30 * 120 && b.ctx().sun.elevation < -1.2; i++) b.tick({ forward: 1 });
});
await shot('01-first-sunrise');

// 02 midnight sun at Lapland on the June ticket, just before the shutter.
await bot(8, (b) => {
  const opts = b.tickets();
  b.ticket(opts.findIndex((t) => Math.abs(astro.wrap180(t.L - 90)) < 3));
  b.goTo(69, 21, 0.6);
  b.sleepToLocal(23.6);
  b.waitUntil((c) => c.localTime >= 23.95 || c.localTime < 0.3, 60);
  b.faceSun();
});
await shot('02-midnight-sun');

// 03 wrong offset: sleep 8 h on the home clock, run to Dhaka, shoot into the night.
await bot(4, (b) => {
  b.sleep(8);
  b.goTo(23.8, 90, 1);
  b.shoot();
});
await page.evaluate(() => window.advanceTime(400));
await shot('03-wrong-offset', true);
// ...and when the battery runs out: Tzila lies down snoring, with the one-line reason
await page.evaluate(() => {
  for (let i = 0; i < 240 && JSON.parse(window.render_game_to_text()).mode === 'play'; i++) window.advanceTime(500);
  window.advanceTime(3000);
});
await shot('03b-wrong-offset-fail', true);

// 04 eclipse: the node new moon, then chase the shadow until it is overhead.
await bot(17, async (b) => {
  const { solarEclipseCenter } = await import('/src/astro/astro.ts');
  const opts = b.tickets();
  const i = opts.findIndex((t) => Math.abs(astro.wrap180(t.L - 30)) < 12 || Math.abs(astro.wrap180(t.L - 210)) < 12);
  b.ticket(i);
  const h = b.findHour((s) => solarEclipseCenter(s.utc, s.L, s.age) !== null, 0, 36, 0.25);
  if (h > 0) b.sleep(h);
  for (let k = 0; k < 30 * 60 && b.alive; k++) {
    const c = solarEclipseCenter(b.st.utc, b.st.L, b.st.moonAge);
    if (!c) { b.tick(); continue; }
    const here = b.here();
    if (astro.angularDistance(here.lat, here.lon, c.lat, c.lon) < 3 && b.ctx().sun.elevation > 5) break;
    b.goTo(c.lat, c.lon, 2, (1 / 30) * 3);
  }
  b.faceSun();
});
await shot('04-eclipse');

// 05 world map: the level menu.
await fresh();
await page.evaluate(() => localStorage.setItem('tiltworld.v1', JSON.stringify({ stars: { 1: 3, 2: 2, 3: 3, 4: 1 } })));
await fresh();
await page.waitForTimeout(800);
await shot('05-world-map');

// 06 sleep pod panel on the phases rooftop.
await setup(15);
await page.keyboard.press('z');
await page.evaluate(() => window.advanceTime(2000));
await page.waitForTimeout(200);
await shot('06-sleep-pod');

// 07 calendar train at the station on L6.
await setup(6);
await page.keyboard.press('c');
await page.evaluate(() => window.advanceTime(2000));
await page.waitForTimeout(200);
await shot('07-calendar-train');

// 08 phone: L12 HUD at 390×844 with touch (order card, chips, joystick, waypoint markers)
const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
for (const [p, lvl, name] of [[phone, 12, '08-phone-l12'], [phone, 15, '09-phone-l15']]) {
  await p.goto(BASE);
  await p.waitForFunction(() => !!window.render_game_to_text && JSON.parse(window.render_game_to_text()).screen !== 'loading', null, { timeout: 60000 });
  await p.evaluate((id) => window.tilt.startLevel(id), lvl);
  await p.waitForTimeout(300);
  await p.keyboard.press('Enter');
  await p.evaluate(() => {
    window.advanceTime(300);
    window.tilt.world().snapCamera(window.tilt.state());
    window.advanceTime(17);
  });
  await p.waitForTimeout(200);
  await p.screenshot({ path: `${OUT}/${name}.png` });
  console.log('captured', name);
}

await browser.close();
