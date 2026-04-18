# Bugs and Fixes

## Fixed

### Red reads stale workout snapshot (post-workout feedback)
**Fixed:** 2026-04-17. Verified in consolidated `js/core.js`.

The post-workout handler now passes the live log (`S.logs[_lk]`) into `COACH_PROMPTS.postWorkout` instead of the stale `S.modal.curLog` snapshot. `buildSessionSummary` guard tightened so "not completed" only appears when the set grid is truly empty (checks `done===true`, `w>0`, `r>0`). Audit `console.log('[RRE] post-workout log passed to Red:', _liveLog)` retained for future debugging.

### Red API errors were silent
**Fixed:** 2026-04-18.

Post-workout celebration now parses `d.error` from the Claude proxy response and re-throws with the real message. The catch block surfaces the error message to the user ("I had trouble loading my full analysis (reason)...") and logs full detail to console.

### Weight input accepted non-numeric values
**Fixed:** 2026-04-18.

Set-grid weight inputs now reject NaN and negative values (shows "Invalid weight" toast) and clamp above 9999. Applied to both `rTrack` and `rMergedTrack` set grids.

### Favicon was a dog emoji while Red is a wolf everywhere else
**Fixed:** 2026-04-18.

Favicon now points to `/assets/red-wolf.svg`. The in-code `DOG_SVG` constant was renamed to `REDWOLF_SVG`.

### Export/Import wired into proper module
**Done:** 2026-04-18.

Profile tab Export/Import buttons now use the `Backup` module ([js/backup.js](../js/backup.js)). Export writes the new `redge-fitness-backup-YYYY-MM-DD.json` format (superset of v18c's 7-field format). Import accepts either shape, so existing v18c backup files carry forward into the new app. Reset button behavior preserved.

---

## Deferred — next session

### Full module split
**Status:** Not critical for shipping. App currently runs with the monolith JS consolidated into `js/core.js`. Module shells (`programs.js`, `logging.js`, `analytics.js`, `red.js`, `onboarding.js`, `tabs.js`) exist with placeholder IIFEs and are loaded alongside core.js — ready to be filled in by extracting sections from core.js over subsequent sessions without app-visible changes.

### Rate-limit Red API calls
**Status:** `Red.callClaude()` helper exists in `js/red.js` with a 1500ms floor, but none of the four current fetch call sites (`generateCoaching`, celebration modal, chat `sendC`, etc. in core.js) are routed through it yet. Low risk in practice because UX naturally paces calls.

### State-store namespaced migration
**Status:** `State.set('logs.'+lk, entry)` pattern is designed in the plan but not implemented. Current code mutates `S.*` directly. Defer until the module split has happened so the state-store boundary is cleaner to introduce.

### Retry button on Red failures
**Status:** Error message now shows the real reason, but the celebration modal doesn't offer a one-click retry — user would need to dismiss and rate feeling again. Wire a `[Retry]` button in the celebration card on next pass.

---

## Backlog — post-migration

- Undo toast when a workout is accidentally cleared.
- CSV/print-friendly export of workout history.
- Week-over-week progress view for body measurements.
- Consolidate duplicate fetch bodies in core.js (four near-identical Claude calls).
