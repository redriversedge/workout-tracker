// programs.js — Program library, exercise descriptions, scheduling, merging, adjustments.
//
// During Phase 2 migration, cut/paste from rre-v18c-deploy/index.html:
//   - DESC, DESC_EXT, DESC_FINAL, DESC_SC exercise description tables (~271-865)
//   - getDesc(), fmtHeight() helpers
//   - WU / CD / REST warmup/cooldown/rest libraries (~867-898)
//   - PROGRAMS definition (~899+), RPE_PCT, DELOAD_CFG
//   - est1RM lives in logging.js; keep references here aware of that
//   - PREG_SAFETY (~1060-1140)
//   - getNextWorkout, getMissedInfo, schedule-shift helpers (~1141-1252)
//   - getNutritionTip, ADJUST_RULES, checkAdjustments, applyAdjustment, getAdjFactor, useAdjSession (~1427-1540)
//   - REST_ACTIVITIES, MERGE_TEMPLATES, getMergeKey, getMergedSchedule, getMergedDayExercises (~1541-1693)

var Programs = (function () {
  // TODO(phase-2): populate.
  var PROGRAMS = {};
  var DESC = {};
  function getDesc(name) { return DESC[name] || ''; }
  return {
    PROGRAMS: PROGRAMS,
    DESC: DESC,
    getDesc: getDesc
  };
})();
