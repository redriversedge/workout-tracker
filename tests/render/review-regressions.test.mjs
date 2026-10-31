// Regression tests for the issues found in the independent pre-release review (2026-10-31).
import test from 'node:test';
import assert from 'node:assert/strict';
import { bootApp, userStorage } from '../helpers/app.mjs';

function click(app, el) { el.dispatchEvent(new app.window.MouseEvent('click', { bubbles: true })); }
function buttons(app) { return Array.prototype.slice.call(app.window.document.querySelectorAll('button')); }
function byText(app, re) { return buttons(app).find(function (b) { return re.test(b.textContent.trim()); }); }
async function waitFor(fn, ms) {
  const end = Date.now() + (ms || 4000);
  while (Date.now() < end) { if (fn()) return true; await new Promise(function (r) { setTimeout(r, 50); }); }
  return false;
}
function firstTrainingDay(app) {
  return app.run("(function(){var m=getMergedSchedule();for(var i=0;i<m.schedule.length;i++){if(!m.schedule[i].isRest)return i+1;}return 1;})()");
}
function typeFirstSet(app, value) {
  const inp = app.window.document.querySelector('input[type="number"]');
  inp.value = String(value);
  inp.dispatchEvent(new app.window.Event('input', { bubbles: true }));
  inp.dispatchEvent(new app.window.Event('change', { bubbles: true }));
}

test('merged: a saved workout is never overwritten by the next one', async function () {
  const app = bootApp(userStorage(['str_int_bb', 'run_5k'], 0));
  const d1 = firstTrainingDay(app);
  app.run("S.week=1;S.day=" + d1 + ";S._trackManual=true;S.tab='track';R();");
  await app.flush();
  typeFirstSet(app, 100);
  click(app, byText(app, /^Save$/));
  await app.flush();
  const key1 = 'merged_w1d' + d1;
  assert.match(JSON.stringify(app.S().logs[key1]), /"100"/);
  click(app, byText(app, /^\S*8$/));
  await waitFor(function () { return /Red's Take/.test(app.text()); });
  const saved = JSON.stringify(app.S().logs[key1]);
  assert.match(saved, /"feeling":8/);
  // Leave the celebration via Next, which should land on a different, unlogged day.
  click(app, byText(app, /^Next:/));
  await app.flush();
  assert.notEqual('merged_w' + app.S().week + 'd' + app.S().day, key1, 'moved off the saved day');
  typeFirstSet(app, 225); // triggers re-renders; must not snap back to the saved day
  await app.flush();
  app.run("S.tab='track';R();");
  await app.flush();
  assert.notEqual('merged_w' + app.S().week + 'd' + app.S().day, key1, 'still off the saved day after re-render');
  click(app, byText(app, /^Save$/));
  await app.flush();
  assert.equal(JSON.stringify(app.S().logs[key1]), saved, 'first workout untouched');
  app.close();
});

test('merged: a single-program autosave does not leak into a merged workout', async function () {
  const st = userStorage(['str_int_bb', 'run_5k'], 0);
  st.rre2_curlog = { key: 'str_int_bb_w1d1', data: { e0: { _name: 'Barbell Bench Press', s1: { w: '999', r: '3' } } } };
  const app = bootApp(st);
  app.run("S.tab='track';R();");
  await app.flush();
  assert.equal(JSON.stringify(app.S().curLog).indexOf('999'), -1, 'stale single-program sets not shown');
  assert.match(app.S()._curLogKey, /^merged_w\d+d\d+$/);
  app.close();
});

test('merged: a rest day still shows the day pills', async function () {
  const app = bootApp(userStorage(['str_beg_bb', 'run_5k'], 0.6));
  const rest = app.run("(function(){var m=getMergedSchedule();for(var i=0;i<m.schedule.length;i++){if(m.schedule[i].isRest)return i+1;}return 0;})()");
  assert.ok(rest > 0, 'schedule has a rest day');
  app.run("S.day=" + rest + ";S._trackManual=true;S.tab='track';R();");
  await app.flush();
  assert.ok(app.window.document.querySelectorAll('.pill-row .pill').length >= 2, 'pills visible on rest day');
  assert.deepEqual(app.errorCards(), []);
  app.close();
});

test('storage full: other keys still save and the user is told once', async function () {
  const app = bootApp(userStorage(['str_int_bb'], 0.3));
  const ls = app.window.localStorage;
  const real = ls.setItem.bind(ls);
  let toasts = 0;
  app.run('(function(){var t=toast;window.toast=function(m,c){if(/Storage may be full/.test(m))window.__fullToasts=(window.__fullToasts||0)+1;return t(m,c);};})()');
  app.window.Storage.prototype.setItem = function (k, v) {
    if (k === 'rre2_profile') { const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e; }
    return real(k, v);
  };
  app.run("S.prs['Test Lift']=321;S.bodyLogs.push({date:'2026-10-31',wt:'180'});sv();sv();");
  toasts = app.run('window.__fullToasts||0');
  assert.equal(JSON.parse(ls.getItem('rre2_prs'))['Test Lift'], 321, 'keys after the failed one still saved');
  assert.ok(ls.getItem('rre2_body').indexOf('180') > -1);
  assert.equal(toasts, 1, 'warned exactly once');
  app.close();
});

test('restore: asks first, then can be undone', async function () {
  const app = bootApp(userStorage(['str_int_bb'], 0.5));
  const mine = Object.keys(app.S().logs).length;
  const older = { version: 'rre-v20', exportedAt: '2026-09-01T12:00:00.000Z', profile: { name: 'Cliff' }, enrolled: [{ id: 'str_int_bb', days: 4 }], logs: { str_int_bb_w1d1: { date: '2026-08-30T18:00:00' } } };
  const file = new app.window.File([JSON.stringify(older)], 'old.json', { type: 'application/json' });
  app.run('Backup.importFromFile')(file);
  assert.ok(await waitFor(function () { return app.S().modal && app.S().modal.type === 'confirm'; }), 'confirm shown before replacing');
  assert.equal(Object.keys(app.S().logs).length, mine, 'nothing replaced yet');
  assert.match(app.S().modal.msg, /1 workout\b/);
  click(app, byText(app, /^Restore$/));
  await app.flush();
  assert.equal(Object.keys(app.S().logs).length, 1, 'restored');
  app.run("S.tab='profile';R();");
  const undo = byText(app, /Undo last restore/);
  assert.ok(undo, 'undo offered');
  click(app, undo);
  click(app, byText(app, /^Undo restore$/));
  await app.flush();
  assert.equal(Object.keys(app.S().logs).length, mine, 'original data back');
  app.close();
});

test('restore: rejects damaged files without touching data', function () {
  const app = bootApp(userStorage(['str_int_bb'], 0.5));
  const before = JSON.stringify(app.S().logs);
  assert.throws(function () { app.run("Backup.applyPayload({profile:{name:'x'},logs:[1,2,3]})"); }, /damaged/);
  assert.equal(JSON.stringify(app.S().logs), before);
  app.close();
});

test('celebration can be closed while Red is still loading', async function () {
  const app = bootApp(userStorage(['str_int_bb'], 0.1));
  app.run("S.tab='track';R();");
  await app.flush();
  click(app, byText(app, /^Save$/));
  await app.flush();
  app.run('S.modal.feeling=7;S.modal.redLoading=true;R();');
  const close = byText(app, /^Close/);
  assert.ok(close, 'Close shown during loading');
  click(app, close);
  assert.equal(app.S().modal, null);
  app.close();
});

test('chat never sticks on "thinking" if building context throws', async function () {
  const app = bootApp(userStorage(['run_5k'], 0.3));
  app.run("getExDB=function(){throw new Error('boom');};S.tab='chat';S.chatIn='hi';sendC();");
  await app.flush();
  assert.equal(app.S().chatLoad, false);
  assert.ok(byText(app, /Try again/), 'retry offered');
  app.close();
});
