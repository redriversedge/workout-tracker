// logging.js — Workout log mutations, PR detection, 1RM, exercise history, supersets.
//
// During Phase 2 migration, cut/paste from rre-v18c-deploy/index.html:
//   - getExHistory, getLastPerformance, suggestWeight (~1253-1350)
//   - calc1RM, getExercise1RM, est1RM (~1351-1380)
//   - getStreak, getHeatMap, getWeeklyStats (~1381-1415)
//   - INJURY_SUBS, getSubstitution, needsDeload (~1416-1426)
//   - checkPR, getExDB (from core state section)
//   - loadCL() session loader (~2980-2988)
//   - SS_PAIRS + getSupersets + renderSSToggle (inside rTrack — ~3100-3200)

var Logging = (function () {
  // TODO(phase-2): populate.
  function est1RM(w, r) {
    // Epley formula placeholder — real impl migrated from monolith line ~1363.
    w = parseFloat(w) || 0; r = parseInt(r, 10) || 0;
    if (w <= 0 || r <= 0) return 0;
    return Math.round(w * (1 + r / 30));
  }
  function checkPR(name, weight) {
    // TODO(phase-2): migrate from monolith.
    return false;
  }
  return {
    est1RM: est1RM,
    checkPR: checkPR
  };
})();
