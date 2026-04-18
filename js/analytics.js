// analytics.js — Pure aggregation functions. Testable in isolation.
//
// During Phase 2 migration, cut/paste from rre-v18c-deploy/index.html:
//   - buildSessionSummary (~2923-2951)
//   - buildRecentHistory (~2954-2963)
// Plus exercise-history aggregates that are display-only (moved from logging.js if it simplifies).
//
// IMPORTANT: buildSessionSummary must accept the LIVE workout log object (S.logs[lk(...)]),
// never a stale snapshot. The v18c bug came from passing a pre-Save snapshot that had no set data.
// See docs/BUGS.md. The already-fixed v18c monolith has the tightened "not completed" guard —
// when migrating, carry that guard forward.

var Analytics = (function () {
  // TODO(phase-2): populate.
  function buildSessionSummary(dy, log) {
    if (!dy || !dy.ex) return 'No exercise data.';
    log = log || {};
    var lines = [];
    dy.ex.forEach(function (ex, ei) {
      if (ex.n && (ex.n.indexOf('Dynamic Warm-Up') > -1 || ex.n.indexOf('Dynamic Stretches') > -1)) return;
      var eLog = log['e' + ei];
      var hasAny = false;
      if (eLog) {
        for (var k in eLog) {
          if (k.charAt(0) === 's') {
            var s = eLog[k];
            if (s && (s.done === true || parseFloat(s.w) > 0 || parseInt(s.r, 10) > 0)) { hasAny = true; break; }
          }
        }
      }
      if (!hasAny) { lines.push(ex.n + ': not completed'); return; }
      lines.push(ex.n + ': (Phase 2 will migrate the full set-summary logic from v18c ~line 2939-2948)');
    });
    return lines.join('\n');
  }
  function buildRecentHistory(progId, logs) {
    // TODO(phase-2): populate.
    return '';
  }
  return {
    buildSessionSummary: buildSessionSummary,
    buildRecentHistory: buildRecentHistory
  };
})();
