# Bugs and Fixes

## v20 rebuild (2026-10-31)

Every item below has a regression test (file noted).

| Bug | User-visible effect | Fix | Test |
|---|---|---|---|
| App sent `claude-sonnet-4-20250514`, retired by Anthropic 2026-06-15 | Every Red feature failed since June | App sends no model; `chat.mjs` picks it (`RED_MODEL` env or default) | `unit/chat-function` |
| `buildSessionSummary` loop condition `si<=parseInt(ex.s)\|\|5` never false | App froze when rating a workout that had logged sets | Iterate the logged set keys | `render/flows` finishing a workout |
| Failed Red calls cached `''` and re-rendered | Track briefing and Program breakdown re-requested in a loop while Red was down | `redOnce()` de-dupes in-flight and recently failed keys; retry buttons | `render/flows` no API storm |
| Save set the celebration modal without re-rendering | Nothing happened on Save unless a PR toast fired | `R()` after opening the modal | `render/flows` |
| Track auto-advances on re-render; rating used `S.week/S.day` | Feeling rating saved onto the next workout; Red told the wrong day | Modal carries `logKey`, `w`, `d` captured at the start of Save | `render/flows` |
| Chat history sent with leading Red message / error bubbles | API rejected chats; error text fed back to Red | `redCleanMessages()`; errors marked `isError` | `unit/data`, `render/flows` chat |
| 22 places parsed `YYYY-MM-DD` with `new Date()` (UTC) | Dates off by a day in US evenings | `parseLocalDate()` | `unit/data` dates |
| Inputs under 16px after allowing zoom | iPhone zoomed into fields on tap | 16px inputs on touch devices | e2e |
| Merge engine never matched a template (lookup sorted types alphabetically; templates say `yoga`, programs say `flexibility`) | Multi-program users only ever saw their first program | Order-independent key lookup with type aliases | `render/tabs` combos, `render/flows` merge engine |
| Merged day picker only knew a few words ("leg" but not "lower") | "Lower Body" day listed bench press and dips | Keyword groups per intent, penalty for opposite body region | `render/flows` merge engine |
| Merged Track had no post-workout flow and rated feeling mid-workout | No rating or Red feedback for multi-program users | Same celebration as single-program Track; rating moved after Save | `render/flows` multi-program |
| Body measurement delete had no confirmation | One mis-tap lost an entry | Confirm dialog | - |
| "215 sessions behind" banner after a long break | Discouraging, wrong-sounding message | Friendly welcome-back copy past 12 missed | - |
| Developer error text in chat ("check ANTHROPIC_API_KEY") | Confusing messages for users | Friendly messages + Try again | `render/flows` |

### Found in the independent pre-release review (same day)

| Issue | Fix | Test |
|---|---|---|
| Merged Track auto-advance used the single-program lookup, snapping back to an already-saved merged day and overwriting it on the next Save | `getNextMergedDay()` for merged plans; pill and Home taps set `_trackManual` | `render/review-regressions` |
| A v19 single-program autosave appeared inside the merged workout and got saved there | `loadMergedCL()` only keeps an autosave whose key matches | `render/review-regressions` |
| One failed `localStorage` write (storage full) silently skipped every later key | `sv()` writes each key separately, drops disposable coach cache first, warns once; pre-migration snapshot skipped when large | `render/review-regressions` |
| Restore replaced all data with no warning | Confirm with backup date and workout count; snapshot before restoring; Undo last restore on Profile; type checks | `render/review-regressions` |
| Celebration could not be closed while Red loaded, and a hung request blocked the queue | 35s client timeout; Close button during loading | `render/review-regressions` |
| Merged rest day hid the day pills | Pills render before the rest-day view | `render/review-regressions` |
| Chat stuck on "thinking" if building context threw | try/catch with retry bubble | `render/review-regressions` |

## Earlier fixes (v19, 2026-04)

- Red read a stale workout snapshot for post-workout feedback.
- Weight inputs accepted non-numeric values.
- Favicon was a dog emoji; now the wolf.
- Export/import moved into `backup.js` with v18c compatibility.

## Backlog

- Undo toast when a workout is accidentally cleared.
- CSV export of workout history.
