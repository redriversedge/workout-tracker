// End-to-end flows driven through the real UI (clicks and inputs), against the built bundle.
import test from 'node:test';
import assert from 'node:assert/strict';
import { bootApp, userStorage } from '../helpers/app.mjs';

function click(app, el) { el.dispatchEvent(new app.window.MouseEvent('click', { bubbles: true })); }
function buttons(app) { return Array.prototype.slice.call(app.window.document.querySelectorAll('button')); }
function buttonByText(app, re) { return buttons(app).find(function (b) { return re.test(b.textContent); }); }
async function waitFor(fn, ms) {
  const end = Date.now() + (ms || 4000);
  while (Date.now() < end) { if (fn()) return true; await new Promise(function (r) { setTimeout(r, 50); }); }
  return false;
}

function completeOnboarding(app, answers) {
  const doc = app.window.document;
  for (let step = 0; step < 40 && app.S().screen === 'onboarding'; step++) {
    const inp = doc.getElementById('ob-inp');
    if (inp) {
      inp.value = 'Cliff';
      inp.dispatchEvent(new app.window.Event('input', { bubbles: true }));
    } else {
      const q = app.run('(function(){var a=getActiveOBQ();return a[Math.min(S.obStep,a.length-1)].id;})()');
      const want = answers[q];
      const pills = Array.prototype.slice.call(doc.querySelectorAll('button.pill'));
      if (pills.length && !pills.some(function (p) { return /active/.test(p.className); })) {
        const pick = (want && pills.find(function (p) { return p.textContent.indexOf(want) > -1; })) || pills[0];
        click(app, pick);
      }
    }
    const next = doc.getElementById('ob-nx');
    assert.ok(next, 'onboarding has a next button at step ' + step);
    click(app, next);
  }
}

test('onboarding: a new user can finish setup and land on Home with a program', async function () {
  const app = bootApp({});
  completeOnboarding(app, { sex: 'Male', level: 'Intermediate', goals: 'Strength', days: '4 days', equipment: 'Full Gym', injuries: 'None' });
  await app.flush();
  const S = app.S();
  assert.equal(S.screen, 'app');
  assert.equal(S.profile.name, 'Cliff');
  assert.ok(S.enrolled.length >= 1, 'auto-enrolled in at least one program');
  assert.ok(S.active, 'has an active program');
  assert.deepEqual(app.errorCards(), []);
  assert.deepEqual(app.errors, []);
  assert.ok(app.window.localStorage.getItem('rre2_profile'), 'profile persisted');
  app.close();
});

test('onboarding: female + pregnant path routes to safe programming', async function () {
  const app = bootApp({});
  completeOnboarding(app, { sex: 'Female', pregnant: '2nd trimester', level: 'Beginner', goals: 'Prenatal Fitness', injuries: 'None' });
  await app.flush();
  const S = app.S();
  assert.equal(S.screen, 'app');
  assert.match(S.profile.pregnant, /2nd/);
  assert.deepEqual(app.errorCards(), []);
  assert.deepEqual(app.errors, []);
  app.close();
});

test('finishing a workout saves it, rates it, and gets Red feedback without freezing', async function () {
  const app = bootApp(userStorage(['str_int_bb'], 0.1));
  app.run("S.tab='track';R();");
  await app.flush();
  const w = app.S().week, d = app.S().day;
  // Log real sets on the first two exercises through the set inputs.
  const inputs = Array.prototype.slice.call(app.window.document.querySelectorAll('input[type="number"]'));
  assert.ok(inputs.length >= 4, 'track tab shows set inputs');
  inputs.slice(0, 4).forEach(function (inp, i) {
    inp.value = String(i % 2 === 0 ? 135 : 5);
    inp.dispatchEvent(new app.window.Event('input', { bubbles: true }));
    inp.dispatchEvent(new app.window.Event('change', { bubbles: true }));
  });
  click(app, buttonByText(app, /^Save$/));
  await app.flush();
  const key = 'str_int_bb_w' + w + 'd' + d;
  assert.ok(app.S().logs[key], 'workout saved to logs');
  assert.equal(app.S().modal && app.S().modal.type, 'celebration', 'celebration modal opened');

  // Rate the session 8/10. Before the fix, building Red's summary looped forever here.
  const eight = buttons(app).find(function (b) { return /(^|\D)8$/.test(b.textContent.trim()); });
  assert.ok(eight, 'feeling buttons rendered');
  click(app, eight);
  assert.ok(await waitFor(function () { return /Red's Take/.test(app.text()); }), 'Red feedback shown');
  assert.equal(app.S().logs[key].feeling, 8, 'feeling saved on the live log');
  const call = app.calls[app.calls.length - 1];
  assert.ok(call, 'Red was called');
  assert.equal(call.body.model, undefined, 'app never sends a model id');
  assert.match(call.body.messages[0].content, /TODAY'S SESSION/);
  assert.match(call.body.messages[0].content, /135lbsx5/, 'logged sets reach Red');
  assert.match(app.text(), /Red's Take/);
  assert.deepEqual(app.errors, []);
  app.close();
});

test('Red failure on post-workout shows a friendly message, not a developer error', async function () {
  const app = bootApp(userStorage(['str_beg_db'], 0.1), { fetchReply: function () { return { __status: 502, error: { type: 'upstream_error', message: 'model retired' } }; } });
  app.run("S.tab='track';R();");
  await app.flush();
  click(app, buttonByText(app, /^Save$/));
  await app.flush();
  click(app, buttons(app).find(function (b) { return /(^|\D)7$/.test(b.textContent.trim()); }));
  assert.ok(await waitFor(function () { return app.S().modal && app.S().modal.redFeedback; }), 'fallback feedback shown');
  const txt = app.text();
  assert.doesNotMatch(txt, /ANTHROPIC_API_KEY|HTTP 5\d\d|Netlify/);
  assert.match(txt, /Red couldn't/);
  app.close();
});

test('Track tab does not hammer the API when Red is failing', async function () {
  const app = bootApp(userStorage(['str_int_bb'], 0.2), { fetchReply: function () { return { __status: 502, error: { type: 'x', message: 'down' } }; } });
  for (let i = 0; i < 5; i++) {
    app.run("S.tab='track';R();");
    await new Promise(function (r) { setTimeout(r, 450); });
    app.run("S.tab='program';R();");
    await new Promise(function (r) { setTimeout(r, 450); });
  }
  // One briefing attempt + one program-breakdown attempt, not a request storm.
  assert.ok(app.calls.length <= 3, 'expected at most 3 API calls, saw ' + app.calls.length);
  assert.match(app.text() + '', /retry|Red/i);
  app.close();
});

test('chat: sends clean history, shows reply; on failure offers Try again', async function () {
  let fail = true;
  const st = userStorage(['run_5k'], 0.3, { chat: [{ role: 'bot', text: 'Hey! I am Red.' }, { role: 'bot', text: '⚠️ HTTP 502: {"errorType":"Runtime.UserCodeSyntaxError"}' }] });
  const app = bootApp(st, { fetchReply: function () { return fail ? { __status: 503, error: { type: 'overloaded', message: 'busy' } } : { content: [{ type: 'text', text: 'Run easy today.' }] }; } });
  // Migration removed the outage error message from history.
  assert.equal(app.S().chatMsgs.some(function (m) { return /HTTP 502/.test(m.text); }), false);
  app.run("S.tab='chat';S.chatIn='What should I do today?';sendC();");
  assert.ok(await waitFor(function () { return !app.S().chatLoad; }), 'chat settled');
  const sent = app.calls[app.calls.length - 1].body;
  assert.equal(sent.messages[0].role, 'user', 'history starts with a user turn');
  assert.ok(sent.messages.every(function (m, i, a) { return i === 0 || a[i - 1].role !== m.role; }), 'roles alternate');
  const retry = buttonByText(app, /Try again/);
  assert.ok(retry, 'failure shows Try again');
  assert.doesNotMatch(app.text(), /ANTHROPIC_API_KEY|console\.anthropic/);
  fail = false;
  click(app, retry);
  assert.ok(await waitFor(function () { return !app.S().chatLoad; }), 'retry settled');
  const msgs = app.S().chatMsgs;
  assert.equal(msgs[msgs.length - 1].text, 'Run easy today.');
  assert.equal(msgs.filter(function (m) { return m.role === 'user' && m.text === 'What should I do today?'; }).length, 1, 'retry does not duplicate the question');
  assert.equal(msgs.some(function (m) { return m.isError; }), false, 'error bubble removed after retry');
  app.close();
});

test('autosave: an in-progress workout survives closing the app', async function () {
  const st = userStorage(['str_int_bb'], 0.1);
  const app = bootApp(st);
  app.run("S.tab='track';R();");
  await app.flush();
  const inp = app.window.document.querySelector('input[type="number"]');
  inp.value = '155';
  inp.dispatchEvent(new app.window.Event('input', { bubbles: true }));
  inp.dispatchEvent(new app.window.Event('change', { bubbles: true }));
  await new Promise(function (r) { setTimeout(r, 500); });
  const saved = JSON.parse(app.window.localStorage.getItem('rre2_curlog'));
  const snapshot = {};
  for (let i = 0; i < app.window.localStorage.length; i++) { const k = app.window.localStorage.key(i); snapshot[k] = app.window.localStorage.getItem(k); }
  app.close();
  assert.ok(JSON.stringify(saved.data).indexOf('155') > -1, 'set autosaved');
  const app2 = bootApp(snapshot);
  app2.run("S.tab='track';R();");
  await app2.flush();
  assert.ok(JSON.stringify(app2.S().curLog).indexOf('155') > -1, 'restored after reopening');
  app2.close();
});

test('custom workout and body measurement can be added', async function () {
  const app = bootApp(userStorage(['flex_general'], 0.3));
  const before = app.S().bodyLogs.length;
  app.run("S.bodyLogs.push({date:localDateStr(),wt:'185'});sv();S.tab='progress';R();");
  assert.equal(app.S().bodyLogs.length, before + 1);
  app.run("S.customWks.push({id:'cw1',name:'Pickup basketball',date:localISOStr(),dur:'60',notes:'Fun'});sv();S.tab='home';R();");
  assert.deepEqual(app.errorCards(), []);
  app.run("S.tab='progress';R();");
  assert.deepEqual(app.errorCards(), []);
  assert.deepEqual(app.errors, []);
  app.close();
});

test('multi-program Track: Save opens the celebration, rating saves to the merged log', async function () {
  const app = bootApp(userStorage(['str_int_bb', 'run_5k'], 0.1));
  app.run("S.tab='track';R();");
  await app.flush();
  assert.match(app.text(), /Week \d+ · Day \d+/, 'merged tracker shown');
  assert.equal(app.window.document.querySelectorAll('.feel-row').length, 0, 'no mid-workout feeling row');
  // Find a day with exercises (not a rest day).
  for (let d = 1; d <= 7 && !buttonByText(app, /^Save$/); d++) { app.run('S.day=' + d + ';S.curLog={};R();'); await app.flush(); }
  const w = app.S().week, d = app.S().day;
  click(app, buttonByText(app, /^Save$/));
  await app.flush();
  assert.equal(app.S().modal && app.S().modal.type, 'celebration');
  click(app, buttons(app).find(function (b) { return /(^|\D)9$/.test(b.textContent.trim()); }));
  assert.ok(await waitFor(function () { return /Red's Take/.test(app.text()); }), 'Red feedback shown');
  assert.equal(app.S().logs['merged_w' + w + 'd' + d].feeling, 9);
  assert.deepEqual(app.errors, []);
  app.close();
});

test('merge engine: every merged day pulls exercises that fit its label', function () {
  const combos = [['str_int_bb', 'run_5k'], ['str_beg_db', 'flex_general'], ['str_adv_bb', 'run_half', 'flex_athletic'], ['run_10k', 'flex_pilates'], ['sc_int', 'run_10k']];
  const lowerWords = /squat|deadlift|lunge|leg|hip thrust|rdl|romanian|step-up|calf|swing|glute|split/i;
  const upperOnly = /bench|overhead press|pull-up|row|curl|dip|lateral raise|push-up|chin-up|tricep/i;
  const problems = [];
  combos.forEach(function (combo) {
    const app = bootApp(userStorage(combo, 0));
    const merged = app.run('getMergedSchedule()');
    assert.ok(merged, combo.join('+') + ' should merge');
    merged.schedule.forEach(function (day, i) {
      if (day.isRest) return;
      const exs = app.run('getMergedDayExercises(getMergedSchedule().schedule[' + i + '],1)');
      if (!exs.length) { problems.push(combo.join('+') + ' day ' + (i + 1) + ' (' + day.label + ') has no exercises'); return; }
      const strength = exs.filter(function (e) { return e.source === 'strength'; }).map(function (e) { return e.n; });
      if (/^strength_(lower|legs)$/.test(day.type) && strength.length && !strength.some(function (n) { return lowerWords.test(n); })) problems.push(day.label + ': ' + strength.join(', '));
      if (/^strength_(push|pull|upper)$/.test(day.type) && strength.length && strength.filter(function (n) { return upperOnly.test(n); }).length === 0) problems.push(day.label + ': ' + strength.join(', '));
      day.types.forEach(function (t) {
        const src = t === 'yoga' ? 'flexibility' : t;
        if (combo.some(function (pid) { return pid.indexOf(src === 'flexibility' ? 'flex' : src === 'running' ? 'run' : 's') === 0; }) && !exs.some(function (e) { return e.source === src || (src === 'strength' && e.source === 'hiit'); })) problems.push(combo.join('+') + ' ' + day.label + ' is missing its ' + src + ' part');
      });
    });
    app.close();
  });
  assert.deepEqual(problems, []);
});
