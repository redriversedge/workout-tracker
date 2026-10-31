// Test harness: boots the BUILT app (dist/) in jsdom with a seeded localStorage.
// Every test runs against exactly what ships to Netlify.
import { JSDOM, VirtualConsole } from 'jsdom';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

export function bundlePath() {
  const html = readFileSync(join(root, 'dist/index.html'), 'utf8');
  const m = html.match(/\/assets\/(app\.[0-9a-f]+\.js)/);
  if (!m) throw new Error('dist/index.html has no app bundle. Run npm run build first.');
  return join(root, 'dist/assets', m[1]);
}

const BUNDLE_CACHE = {};
function bundle() {
  const p = bundlePath();
  if (!BUNDLE_CACHE[p]) BUNDLE_CACHE[p] = readFileSync(p, 'utf8');
  return BUNDLE_CACHE[p];
}

// storage: { key: value } where value is already a string, or an object to JSON-encode
// opts.fetchReply: function(body) -> response object (default: canned Red reply)
export function bootApp(storage, opts) {
  opts = opts || {};
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('error', function () { errors.push(Array.prototype.map.call(arguments, String).join(' ')); });
  vc.on('jsdomError', function (e) { errors.push('jsdomError: ' + (e && e.message)); });
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body class="dark"><div id="app"></div></body></html>', {
    url: 'https://redriversedgefitness.netlify.app/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole: vc
  });
  const w = dom.window;
  Object.keys(storage || {}).forEach(function (k) {
    const v = storage[k];
    w.localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
  });
  const calls = [];
  w.fetch = function (url, init) {
    const body = init && init.body ? JSON.parse(init.body) : null;
    calls.push({ url: url, body: body });
    const reply = opts.fetchReply ? opts.fetchReply(body) : { content: [{ type: 'text', text: 'Solid work today. Keep your bracing tight.' }] };
    const status = reply && reply.__status ? reply.__status : 200;
    return Promise.resolve({ ok: status < 400, status: status, json: function () { return Promise.resolve(reply); }, text: function () { return Promise.resolve(JSON.stringify(reply)); } });
  };
  w.CSS = { supports: function () { return true; } };
  w.scrollTo = function () {};
  w.Element.prototype.scrollIntoView = function () {};
  w.HTMLElement.prototype.scrollTo = function () {};
  w.URL.createObjectURL = function () { return 'blob:test'; };
  w.URL.revokeObjectURL = function () {};
  w.alert = function () {};
  w.confirm = function () { return true; };
  if (opts.now) {
    const RealDate = w.Date;
    const fixed = new RealDate(opts.now).getTime();
    const FakeDate = function () {
      if (!(this instanceof FakeDate)) return new RealDate(fixed).toString();
      const args = Array.prototype.slice.call(arguments);
      return args.length ? new (Function.prototype.bind.apply(RealDate, [null].concat(args)))() : new RealDate(fixed);
    };
    FakeDate.prototype = RealDate.prototype;
    FakeDate.now = function () { return fixed; };
    FakeDate.parse = RealDate.parse;
    FakeDate.UTC = RealDate.UTC;
    w.Date = FakeDate;
  }
  w.eval(bundle());
  return {
    window: w,
    S: function () { return w.eval('S'); },
    run: function (code) { return w.eval(code); },
    text: function () { return w.document.getElementById('app').textContent; },
    errorCards: function () {
      return Array.prototype.filter.call(w.document.querySelectorAll('h3'), function (el) {
        return /failed to load/.test(el.textContent);
      }).map(function (el) { return el.parentNode.textContent.slice(0, 400); });
    },
    fatal: function () { return /App Error/.test(w.document.getElementById('app').textContent); },
    errors: errors,
    calls: calls,
    flush: function () { return new Promise(function (r) { setTimeout(r, 0); }).then(function () { return new Promise(function (r) { setTimeout(r, 0); }); }); },
    close: function () { w.close(); }
  };
}

// --- Fixture builders -------------------------------------------------------

export function programIds() {
  const app = bootApp({});
  const ids = app.run('Object.keys(PROGRAMS)');
  app.close();
  return ids;
}

function pad(n) { return n < 10 ? '0' + n : String(n); }
function isoDaysAgo(days, hour) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour || 18, 0, 0, 0);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':00:00';
}

// Builds a localStorage snapshot for a user enrolled in programIds, with a fraction of
// each program's sessions logged (0 = fresh enrollment, 1 = every workout complete).
export function userStorage(programIdsList, fraction, extra) {
  extra = extra || {};
  const app = bootApp({});
  const P = app.run('PROGRAMS');
  const logs = {};
  const prs = {};
  let daysAgo = 400;
  programIdsList.forEach(function (pid) {
    const p = P[pid];
    const weeks = Object.keys(p.data).map(Number).sort(function (a, b) { return a - b; });
    const all = [];
    weeks.forEach(function (w) {
      Object.keys(p.data[w].days || {}).map(Number).sort(function (a, b) { return a - b; }).forEach(function (d) { all.push([w, d]); });
    });
    const n = Math.round(all.length * fraction);
    all.slice(0, n).forEach(function (wd, i) {
      const day = p.data[wd[0]].days[wd[1]];
      const log = { date: isoDaysAgo(Math.max(1, daysAgo--), 18), feeling: 5 + (i % 5), dur: 1800 + i * 10, warmupDone: true, cooldownDone: i % 2 === 0, notes: i % 3 ? '' : 'Felt good' };
      (day.ex || []).forEach(function (ex, ei) {
        const e = { _name: ex.n };
        const sets = parseInt(ex.s, 10) || 3;
        for (let s = 1; s <= sets; s++) e['s' + s] = { w: 95 + i * 2.5, r: 5 + (s % 3), done: true };
        if (ei === 0) e.notes = 'Smooth';
        log['e' + ei] = e;
        if (!prs[ex.n] || prs[ex.n] < 95 + i * 2.5) prs[ex.n] = 95 + i * 2.5;
      });
      logs[pid + '_w' + wd[0] + 'd' + wd[1]] = log;
    });
  });
  app.close();
  const enrolled = programIdsList.map(function (pid) { return { id: pid, days: P[pid].daysPerWeek }; });
  const storage = {
    rre2_dark: true,
    rre2_profile: Object.assign({ name: 'Cliff', level: 'Intermediate', goals: ['Strength', 'Muscle Building'], equipment: ['Full Gym'], time: '60 min', days: '4 days', injuries: ['None'], sex: 'Male' }, extra.profile || {}),
    rre2_enrolled: enrolled,
    rre2_active: programIdsList[0],
    rre2_logs: logs,
    rre2_body: extra.body || [{ date: isoDaysAgo(30).slice(0, 10), weight: 190, waist: 34 }, { date: isoDaysAgo(2).slice(0, 10), weight: 186, waist: 33.5 }],
    rre2_chat: extra.chat || [{ role: 'assistant', content: 'Welcome back.' }, { role: 'user', content: 'How am I doing?' }, { role: 'assistant', content: 'Strong week.' }],
    rre2_prs: prs,
    rre2_restdays: {},
    rre2_customwks: extra.customWks || [],
    rre2_coachcache: {},
    rre2_startdate: isoDaysAgo(400)
  };
  return storage;
}
