// Three-state render test for every program and every screen:
// fresh enrollment, mid-program, and all-workouts-complete. Any diagnostic error card,
// fatal screen, or console.error fails the test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { bootApp, programIds, userStorage } from '../helpers/app.mjs';

const TABS = ['home', 'program', 'track', 'progress', 'chat', 'profile', 'programs'];
const DRILLS = ['volume', 'workouts', 'bestday', 'prs', 'topex', 'exdb'];
const STATES = [['fresh', 0], ['mid', 0.4], ['complete', 1]];

async function renderAll(app, label) {
  const problems = [];
  for (const tab of TABS) {
    app.run("S.tab='" + tab + "';S.drill=null;S.exDB=null;S.modal=null;R();");
    await app.flush();
    app.errorCards().forEach(function (c) { problems.push(label + ' tab=' + tab + ': ' + c); });
    if (app.fatal()) problems.push(label + ' tab=' + tab + ': fatal screen');
  }
  DRILLS.forEach(function (d) {
    app.run("S.tab='home';S.drill='" + d + "';R();");
    app.errorCards().forEach(function (c) { problems.push(label + ' drill=' + d + ': ' + c); });
    if (app.fatal()) problems.push(label + ' drill=' + d + ': fatal screen');
  });
  app.run("S.drill=null;S.tab='home';R();");
  await app.flush();
  app.errors.forEach(function (e) { problems.push(label + ' console.error: ' + e.slice(0, 300)); });
  return problems;
}

test('fresh install shows onboarding without errors', function () {
  const app = bootApp({});
  assert.equal(app.S().screen, 'onboarding');
  assert.ok(app.text().length > 20, 'onboarding rendered text');
  assert.deepEqual(app.errorCards(), []);
  assert.deepEqual(app.errors, []);
  app.close();
});

const ids = programIds();

test('program library is complete and normalized', function () {
  assert.ok(ids.length >= 34, 'expected at least 34 programs, got ' + ids.length);
  const app = bootApp({});
  const bad = app.run("Object.keys(PROGRAMS).filter(function(id){var p=PROGRAMS[id];return !p.data||Object.keys(p.data).some(function(w){var wk=p.data[w];return !wk||!wk.days||Object.keys(wk.days).length===0||Object.keys(wk.days).some(function(d){var dy=wk.days[d];return !dy||!dy.name||!Array.isArray(dy.ex);});});})");
  assert.deepEqual(Array.from(bad), [], 'programs with malformed week/day data');
  app.close();
});

ids.forEach(function (pid) {
  STATES.forEach(function (st) {
    test(pid + ' renders every screen (' + st[0] + ')', async function () {
      const app = bootApp(userStorage([pid], st[1]));
      const problems = await renderAll(app, pid + '/' + st[0]);
      app.close();
      assert.deepEqual(problems, []);
    });
  });
});

const COMBOS = [
  ['str_int_bb', 'run_5k'],
  ['str_beg_db', 'flex_general'],
  ['sc_int', 'run_10k', 'flex_athletic'],
  ['hiit_int', 'flex_pilates']
];
COMBOS.forEach(function (combo) {
  STATES.forEach(function (st) {
    test('multi-program ' + combo.join('+') + ' renders every screen (' + st[0] + ')', async function () {
      const app = bootApp(userStorage(combo, st[1]));
      const problems = await renderAll(app, combo.join('+') + '/' + st[0]);
      app.close();
      assert.deepEqual(problems, []);
    });
  });
});

test('pregnant user on prenatal program renders every screen', async function () {
  const app = bootApp(userStorage(['flex_prenatal'], 0.3, { profile: { sex: 'Female', pregnant: 'Yes \u2014 2nd trimester' } }));
  const problems = await renderAll(app, 'prenatal');
  app.close();
  assert.deepEqual(problems, []);
});

test('enrolled in a program id that no longer exists does not crash', async function () {
  const st = userStorage(['str_int_bb'], 0.2);
  st.rre2_enrolled = [{ id: 'deleted_program', days: 3 }].concat(st.rre2_enrolled);
  st.rre2_active = 'deleted_program';
  const app = bootApp(st);
  const problems = await renderAll(app, 'stale-id');
  app.close();
  assert.deepEqual(problems, []);
});
