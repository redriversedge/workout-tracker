# Monolith split — 2026-04-17

Mirror the implementation plan from the Sterling planning session. The original approved plan lives at:

`C:\Users\cbban\.claude\plans\in-redriversedgefitness-i-need-drifting-scroll.md`

Summary:

- Phase 0: Repo setup (own git repo, Sterling `.gitignore`, Netlify publish dir flip).
- Phase 1: Skeleton (folder layout, CSS extraction, module IIFE stubs, configs, docs, archive v18c).
- Phase 2: Verbatim code migration from monolith into modules.
- Phase 3: Red-reads-stale-workout fix (already done in v18c; carry forward).
- Phase 4: Export/import with v18c-backup compatibility.
- Phase 5: Red robustness (error handling, retry, rate limit, weight validation).
- Phase 6: Mascot consistency (wolf favicon, rename DOG_SVG → REDWOLF_SVG).
- Phase 7: State store migration of hot paths.
- Phase 8: Automated smoke tests.

See `docs/BUGS.md` for the fix tracker and `CLAUDE.md` for conventions.
