// Real-browser check at iPhone size: serves dist/, seeds a mid-program user, visits every
// screen, fails on page errors or horizontal overflow, and saves screenshots to test-results/.
// Needs Chrome: set CHROME_PATH or install google-chrome.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { userStorage } from '../helpers/app.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const dist = join(root, 'dist');
const out = join(root, 'test-results');
const chromePath = process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

function serve() {
  return new Promise(function (resolve) {
    const srv = createServer(function (req, res) {
      const url = decodeURIComponent(req.url.split('?')[0]);
      if (url.indexOf('/.netlify/functions/chat') === 0) {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ content: [{ type: 'text', text: "Good session. Your bench is moving well, so next time add 5 lbs on the top set and keep the bar path tight.\n\nGet 30-40g of protein in the next hour." }] }));
        return;
      }
      const f = join(dist, url === '/' ? 'index.html' : url);
      if (!f.startsWith(dist) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' });
      res.end(readFileSync(f));
    });
    srv.listen(0, '127.0.0.1', function () { resolve(srv); });
  });
}

const SCREENS = [
  ['home', "S.tab='home';S.drill=null;R();"],
  ['program', "S.tab='program';R();"],
  ['track', "S.tab='track';R();"],
  ['progress', "S.tab='progress';R();"],
  ['chat', "S.tab='chat';R();"],
  ['profile', "S.tab='profile';R();"],
  ['programs', "S.tab='programs';R();"],
  ['drill-exdb', "S.tab='home';S.drill='exdb';R();"],
  ['drill-volume', "S.tab='home';S.drill='volume';R();"]
];

test('every screen renders cleanly on an iPhone-sized viewport', { skip: !chromePath && 'no Chrome found' }, async function () {
  mkdirSync(out, { recursive: true });
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: chromePath, args: ['--no-sandbox'] });
  const problems = [];
  try {
    for (const scheme of ['dark', 'light']) {
      const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: scheme });
      const page = await ctx.newPage();
      page.on('pageerror', function (e) { problems.push(scheme + ' pageerror: ' + e.message); });
      const st = userStorage(['str_int_bb', 'run_5k'], 0.35);
      st.rre2_dark = scheme === 'dark';
      await page.addInitScript(function (s) {
        if (localStorage.getItem('__seeded')) return;
        Object.keys(s).forEach(function (k) { localStorage.setItem(k, JSON.stringify(s[k])); });
        localStorage.setItem('__seeded', '1');
      }, st);
      await page.goto(base + '/');
      await page.waitForSelector('.top-bar');
      for (const s of SCREENS) {
        await page.evaluate(s[1]);
        await page.waitForTimeout(500);
        const overflow = await page.evaluate(function () { return document.documentElement.scrollWidth - window.innerWidth; });
        if (overflow > 1) problems.push(scheme + ' ' + s[0] + ': horizontal overflow ' + overflow + 'px');
        const cards = await page.evaluate(function () { return Array.prototype.filter.call(document.querySelectorAll('h3'), function (h) { return /failed to load/.test(h.textContent); }).length; });
        if (cards) problems.push(scheme + ' ' + s[0] + ': error card');
        await page.screenshot({ path: join(out, scheme + '-' + s[0] + '.png'), fullPage: true });
      }
      // Finish a workout in the real browser to exercise the celebration modal.
      await page.evaluate("S.tab='track';R();");
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: 'Save', exact: true }).first().click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: join(out, scheme + '-celebration.png') });
      await page.locator('button', { hasText: /^\S*8$/ }).first().click();
      await page.waitForSelector("text=Red's Take", { timeout: 5000 });
      await page.screenshot({ path: join(out, scheme + '-celebration-red.png') });
      await ctx.close();
    }
  } finally {
    await browser.close();
    srv.close();
  }
  assert.deepEqual(problems, []);
});
