// Data safety: migration from v18/v19 storage, backups, Red message cleanup, local-time dates.
// npm test runs with TZ=America/Chicago so the late-evening date cases are real.
import test from 'node:test';
import assert from 'node:assert/strict';
import { bootApp, userStorage } from '../helpers/app.mjs';

function dump(app) {
  const out = {};
  const ls = app.window.localStorage;
  for (let i = 0; i < ls.length; i++) { const k = ls.key(i); out[k] = ls.getItem(k); }
  return out;
}

test('runs in America/Chicago', function () {
  assert.equal(Intl.DateTimeFormat().resolvedOptions().timeZone, 'America/Chicago');
});

test('migration: v19 device data upgrades in place with a safety snapshot', function () {
  const st = userStorage(['str_int_bb', 'run_5k'], 0.5, {
    chat: [
      { role: 'bot', text: "Hey! I'm Red." },
      { role: 'user', text: 'Why is Red broken?' },
      { role: 'bot', text: '⚠️ HTTP 502: {"errorType":"Runtime.UserCodeSyntaxError"}\n\nCheck Netlify' },
      { role: 'assistant', content: 'Older shape message' },
      { role: 'bot', text: 'Want me to apply that? Tap below.', isAction: true, action: 'reduce' }
    ]
  });
  st.rre2_coachcache = { intro_a: '', intro_b: 'Real briefing', progOV_x: 'Hey, I had trouble loading that coaching.' };
  const logsBefore = JSON.stringify(st.rre2_logs);
  const app = bootApp(st);
  const ls = dump(app);
  assert.equal(ls.rre2_schema, '2');
  assert.ok(ls.rre2_backup_pre_v2, 'snapshot saved before migrating');
  const snap = JSON.parse(ls.rre2_backup_pre_v2);
  assert.equal(snap.schema, 1);
  assert.equal(snap.data.logs, JSON.stringify(st.rre2_logs), 'snapshot holds the original logs verbatim');
  assert.equal(ls.rre2_logs, logsBefore, 'workout logs untouched');
  const chat = app.S().chatMsgs;
  assert.equal(chat.some(function (m) { return /HTTP 502/.test(m.text); }), false, 'outage error removed');
  assert.ok(chat.some(function (m) { return m.text === 'Older shape message' && m.role === 'bot'; }), 'old message shape normalized');
  assert.ok(chat.some(function (m) { return m.isAction && m.action === 'reduce'; }), 'action prompts kept');
  assert.deepEqual(Object.keys(app.S().coachCache), ['intro_b'], 'empty and failure text cleared from cache');
  assert.equal(app.S().screen, 'app');
  assert.equal(app.S().enrolled.length, 2);
  app.close();
});

test('migration: runs once and never overwrites the first snapshot', function () {
  const app = bootApp(userStorage(['flex_general'], 0.3));
  const first = dump(app);
  app.close();
  const app2 = bootApp(first);
  const second = dump(app2);
  assert.equal(second.rre2_backup_pre_v2, first.rre2_backup_pre_v2);
  assert.equal(second.rre2_schema, '2');
  app2.close();
});

test('migration: fresh install writes the schema and no snapshot', function () {
  const app = bootApp({});
  const ls = dump(app);
  assert.equal(ls.rre2_schema, '2');
  assert.equal(ls.rre2_backup_pre_v2, undefined);
  app.close();
});

test('backup: export then import round-trips every field', function () {
  const app = bootApp(userStorage(['sc_int', 'run_10k'], 0.6));
  const payload = app.run('Backup.buildPayload(S)');
  assert.equal(payload.version, 'rre-v20');
  assert.equal(payload.schema, 2);
  const json = JSON.stringify(payload);
  app.close();
  const fresh = bootApp({});
  fresh.run('Backup.applyPayload(' + json + ');sv();load();');
  const S = fresh.S();
  assert.equal(JSON.stringify(S.logs), JSON.stringify(payload.logs));
  assert.equal(S.profile.name, 'Cliff');
  assert.equal(S.enrolled.length, 2);
  assert.equal(JSON.stringify(S.bodyLogs), JSON.stringify(payload.body));
  fresh.close();
});

test('backup: a v18c-era file (no version field) imports', function () {
  const legacy = { profile: { name: 'Legacy' }, enrolled: [{ id: 'str_beg_bb', days: 4 }], logs: { str_beg_bb_w1d1: { date: '2026-02-10T18:00:00', e0: { _name: 'Back Squat', s1: { w: 135, r: 5, done: true } } } }, body: [], prs: { 'Back Squat': 135 }, customWks: [], restDayLogs: {} };
  const app = bootApp({});
  app.run('Backup.applyPayload(' + JSON.stringify(legacy) + ');S.screen="app";sv();R();');
  assert.equal(app.S().profile.name, 'Legacy');
  assert.equal(app.S().prs['Back Squat'], 135);
  assert.deepEqual(app.errorCards(), []);
  app.close();
});

test('backup: rejects files that are not backups', function () {
  const app = bootApp({});
  assert.throws(function () { app.run('Backup.applyPayload({hello:1})'); }, /not an RRE Fitness backup/);
  assert.throws(function () { app.run('Backup.applyPayload([1,2])'); }, /Invalid backup/);
  app.close();
});

test('Red messages: history is cleaned into a valid alternating user-first list', function () {
  const app = bootApp({});
  const out = app.run("redCleanMessages([{role:'bot',text:'Hi I am Red'},{role:'user',text:'a'},{role:'user',text:'b'},{role:'bot',text:'err',isError:true},{role:'bot',text:'Tap',isAction:true},{role:'bot',text:'  '},{role:'bot',text:'answer'}])");
  assert.deepEqual(JSON.parse(JSON.stringify(out)), [{ role: 'user', content: 'a\n\nb' }, { role: 'assistant', content: 'answer' }]);
  app.close();
});

test('dates: stored day strings are local days, not UTC', function () {
  const app = bootApp({});
  assert.equal(app.run("parseLocalDate('2026-10-31').getDate()"), 31);
  assert.equal(app.run("parseLocalDate('2026-03-08').getDate()"), 8, 'DST start day');
  assert.equal(app.run("parseLocalDate('2026-10-31T23:30:00').getHours()"), 23);
  assert.equal(app.run("parseLocalDate('2026-10-31T23:30:00').getDate()"), 31);
  app.close();
});

test('dates: at 11:30 PM a workout logged tonight counts as today and this week', async function () {
  const now = '2026-10-29T23:30:00-05:00'; // Thursday 11:30 PM in Chicago
  const st = userStorage(['str_int_bb'], 0);
  st.rre2_logs = { str_int_bb_w1d1: { date: '2026-10-29T23:15:00', feeling: 7, dur: 2400, e0: { _name: 'Barbell Bench Press', s1: { w: 185, r: 5, done: true } } } };
  st.rre2_body = [{ date: '2026-10-29', wt: '184' }];
  const app = bootApp(st, { now: now });
  assert.equal(app.run('localDateStr()'), '2026-10-29');
  assert.equal(app.run("getWeekKey(parseLocalDate('2026-10-29'))"), app.run('getWeekKey(new Date())'));
  const wk = app.run('getWeeklyStats()');
  assert.equal(wk.cur.sessions, 1, 'tonight\'s session is in this week');
  app.run("S.tab='home';R();");
  await app.flush();
  assert.deepEqual(app.errorCards(), []);
  app.run("S.tab='progress';R();");
  await app.flush();
  assert.deepEqual(app.errorCards(), []);
  app.close();
});
