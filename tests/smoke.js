(function () {
  var results = document.getElementById('results');
  var summary = document.getElementById('summary');
  var passed = 0, failed = 0, skipped = 0;

  function row(cls, name, detail) {
    var d = document.createElement('div');
    d.className = 'row ' + cls;
    d.textContent = name;
    if (detail) {
      var p = document.createElement('pre');
      p.textContent = detail;
      d.appendChild(p);
    }
    results.appendChild(d);
  }

  function test(name, fn) {
    try {
      var r = fn();
      if (r === 'skip') { skipped++; row('skip', 'SKIP  ' + name); return; }
      passed++; row('pass', 'PASS  ' + name);
    } catch (e) {
      failed++; row('fail', 'FAIL  ' + name, (e && e.message) || String(e));
    }
  }

  function assert(cond, msg) {
    if (!cond) throw new Error(msg || 'assertion failed');
  }

  test('Analytics.buildSessionSummary: empty log reports "not completed"', function () {
    var dy = { ex: [{ n: 'Back Squat', s: 3, r: 5 }] };
    var out = Analytics.buildSessionSummary(dy, {});
    assert(out.indexOf('not completed') > -1, 'expected "not completed" in: ' + out);
  });

  test('Analytics.buildSessionSummary: logged set does NOT report "not completed"', function () {
    var dy = { ex: [{ n: 'Back Squat', s: 3, r: 5 }] };
    var log = { e0: { _name: 'Back Squat', s1: { w: 185, r: 5, done: true } } };
    var out = Analytics.buildSessionSummary(dy, log);
    assert(out.indexOf('not completed') === -1, 'should not say not completed: ' + out);
  });

  test('Analytics.buildSessionSummary: skips dynamic warm-up/stretches', function () {
    var dy = { ex: [{ n: 'Dynamic Warm-Up' }, { n: 'Back Squat', s: 3, r: 5 }] };
    var out = Analytics.buildSessionSummary(dy, {});
    assert(out.indexOf('Dynamic Warm-Up') === -1, 'warm-up should be filtered: ' + out);
  });

  test('Logging.est1RM: Epley formula sanity', function () {
    var v = Logging.est1RM(185, 5);
    assert(v > 200 && v < 230, '185lbs x 5 reps should estimate ~215, got ' + v);
  });

  test('Logging.est1RM: zero reps returns 0', function () {
    assert(Logging.est1RM(185, 0) === 0, 'zero reps should return 0');
  });

  test('Backup.buildPayload: includes version + exportedAt', function () {
    var p = Backup.buildPayload({ profile: { name: 'Test' } });
    assert(p.version === 'rre-v19.0', 'version mismatch: ' + p.version);
    assert(typeof p.exportedAt === 'string' && p.exportedAt.length > 0, 'exportedAt missing');
  });

  test('Backup.applyPayload: accepts v18c legacy shape (no version field)', function () {
    window.S = {};
    window.sv = function () {};
    window.toast = function () {};
    window.R = function () {};
    Backup.applyPayload({
      profile: { name: 'Legacy' },
      enrolled: [{ id: 'strength', days: 3 }],
      logs: { 'strength_w1d1': { date: '2026-04-01' } },
      body: [], prs: { 'Squat': 225 }, customWks: [], restDayLogs: {}
    });
    assert(window.S.profile.name === 'Legacy', 'legacy profile not restored');
    assert(window.S.prs.Squat === 225, 'legacy PR not restored');
  });

  test('Backup.applyPayload: accepts v19 shape (with version)', function () {
    window.S = {};
    Backup.applyPayload({
      version: 'rre-v19.0',
      exportedAt: new Date().toISOString(),
      profile: { name: 'V19' },
      chatMsgs: [{ role: 'user', content: 'hi' }],
      dark: true
    });
    assert(window.S.profile.name === 'V19', 'v19 profile not restored');
    assert(window.S.dark === true, 'dark mode not restored');
    assert(window.S.chatMsgs.length === 1, 'chat not restored');
  });

  test('Backup.applyPayload: rejects non-object input', function () {
    var threw = false;
    try { Backup.applyPayload(null); } catch (e) { threw = true; }
    assert(threw, 'should throw on null input');
  });

  summary.textContent = passed + ' passed, ' + failed + ' failed' + (skipped ? ', ' + skipped + ' skipped' : '');
  summary.style.background = failed > 0 ? '#ef444466' : '#10b98166';
})();
