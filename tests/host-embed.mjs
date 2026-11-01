// The workbook bridge in a real embed: a localhost parent page iframes the built game at ?level=1.
// Checks ready → level-start L1 → level-complete L1 (after a scripted win through the game's own
// input hooks), the message envelope, and that a standalone page posts nothing and throws nothing.
// Builds nothing: run `npm run build` first. Usage: npm run test:embed
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { connect } from 'node:net';

const GAME = 'http://localhost:4242/';
// run vite itself (not through npx) so killing it really stops the server
const preview = spawn(new URL('../node_modules/.bin/vite', import.meta.url).pathname, ['preview'], { stdio: 'ignore' });
const stop = () => preview.kill();
const listening = () => new Promise((r) => connect(4242, '127.0.0.1').on('connect', function () { this.end(); r(true); }).on('error', () => r(false)));
for (let i = 0; i < 60 && !(await listening()); i++) await new Promise((r) => setTimeout(r, 500));
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const parent = createServer((_, res) => {
  res.setHeader('content-type', 'text/html');
  res.end(`<body style="margin:0"><script>window.msgs=[];addEventListener('message',e=>msgs.push({origin:e.origin,...e.data}))</script><iframe id="g" src="${GAME}?level=1" style="width:100vw;height:100vh;border:0"></iframe></body>`);
}).listen(4999);

let ok = false;
const errs = [];
try {
  await page.goto('http://localhost:4999/');
  const frame = await (await page.waitForSelector('#g')).contentFrame();
  frame.page().on('pageerror', (e) => errs.push(String(e)));
  await page.waitForFunction(() => window.msgs.some((m) => m.type === 'level-start'), null, { timeout: 120000 });
  const opened = JSON.parse(await frame.evaluate(() => window.render_game_to_text()));
  // L1's solution through the game's input hook: run east until the Sun is up, then shoot
  await frame.evaluate(() => {
    document.querySelector('[data-a=start]')?.click();
    const sun = () => JSON.parse(window.render_game_to_text()).sun.elevation;
    for (let i = 0; i < 20000 && sun() < 0.5; i++) {
      window.tilt.press({ forward: 1 });
      window.advanceTime(1000 / 60);
    }
    window.tilt.press({ shoot: true });
    window.advanceTime(4000);
  });
  await page.waitForFunction(() => window.msgs.some((m) => m.type === 'level-complete'), null, { timeout: 30000 }).catch(() => {});
  const msgs = await page.evaluate(() => window.msgs);
  console.log('opened on level', opened.level, '| screen', opened.screen);
  console.log(msgs.map((m) => `${m.type}${m.level ? ' L' + m.level : ''}${m.stars ? ' ★' + m.stars : ''}${m.durationMs ? ' ' + m.durationMs + 'ms' : ''}`).join(', '));
  const types = msgs.map((m) => m.type);
  ok =
    opened.level === 1 &&
    msgs.every((m) => m.source === 'workbook-game' && m.slug === 'tilt-world' && m.version === 1 && m.origin === 'http://localhost:4242') &&
    types[0] === 'ready' &&
    types[1] === 'level-start' && msgs[1].level === 1 &&
    msgs.some((m, i) => i > 1 && m.type === 'level-complete' && m.level === 1 && m.stars >= 1 && m.durationMs > 0) &&
    !types.includes('error');

  // standalone: no parent, so nothing is posted, and the deep link still opens the level
  const solo = await browser.newPage();
  solo.on('pageerror', (e) => errs.push(String(e)));
  await solo.addInitScript(() => {
    window.__posted = 0;
    const orig = window.postMessage.bind(window);
    window.parent.postMessage = (...a) => (window.__posted++, orig(...a));
  });
  await solo.goto(GAME + '?level=12');
  await solo.waitForFunction(() => window.render_game_to_text && JSON.parse(window.render_game_to_text()).screen === 'play', null, { timeout: 120000 });
  const soloLevel = JSON.parse(await solo.evaluate(() => window.render_game_to_text())).level;
  const posted = await solo.evaluate(() => window.__posted);
  console.log('standalone ?level=12 opened level', soloLevel, '| posted', posted);
  ok = ok && soloLevel === 12 && posted === 0;
} finally {
  console.log(ok && !errs.length ? 'bridge OK' : 'bridge FAILED', errs);
  await browser.close();
  parent.close();
  stop();
}
process.exit(ok && !errs.length ? 0 : 1);
