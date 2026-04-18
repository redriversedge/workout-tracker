// tabs.js — All tab and modal rendering.
//
// During Phase 2 migration, cut/paste from rre-v18c-deploy/index.html:
//   - rHome, rCalStrip, rDashWidgets, rDrill* (~2232-2796)
//   - rProg (program tab) (~2797-2895)
//   - rTrack, rMergedTrack, rCWBtn, rCWList, rCWModal, rRestDay (~2979-3503)
//   - rProgress (~3504-3754)
//   - rChat, autoGrow, visualViewport keyboard handling (~3756-3901)
//   - rProfile (~3902-3971)
//   - rPP (program picker), rAD (adjust days) (~2200-2231)
//   - Modal renderers: adjustDays, customWk, confirm, celebration, exHistory (~4080-4260)
//
// Phase 3 fix lands here:
//   - Celebration modal feeling-click handler (currently reads S.modal.curLog — a stale snapshot).
//     Change to read State.get('logs.' + lk(...)) or S.logs[lk(...)] — see docs/BUGS.md entry for
//     "Red reads stale workout snapshot".

var Tabs = (function () {
  // TODO(phase-2): populate.
  return {};
})();
