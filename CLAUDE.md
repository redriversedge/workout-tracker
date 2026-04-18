# CLAUDE.md — RedRiversEdgeFitness

AI-coached fitness PWA. Programs + workout logging + Red (Claude coach). Deployed on Netlify.

## Architecture

```
index.html          App shell (~30 lines). Loads modules in order, boots the app.
css/rre.css         All styling.
js/
  themes.js         Dark/light theme toggle. FOUC guard.
  core.js           S state object, load/sv, autosave, utils (h, toast, lk, etc.), R/safeRender/showFatalError, rest timer.
  programs.js       PROGRAMS library, exercise descriptions, warmup/cooldown, scheduling, weight adjustments.
  logging.js        curLog mutations, loadCL, PR detection, est1RM, exercise history, supersets.
  analytics.js      Pure functions: buildSessionSummary, buildRecentHistory. Testable.
  red.js            Claude prompts (COACH_PROMPTS), callClaude wrapper with rate-limit + retry, chat send.
  onboarding.js     OBQ flow, auto-enroll.
  tabs.js           All tab and modal renderers (Home, Programs, Track, Progress, Chat, Profile).
  backup.js         JSON export/import. Accepts v18c backup shape for one-way migration.
netlify/functions/
  chat.js           Claude API proxy. Reads ANTHROPIC_API_KEY env var.
sw.js               Service worker. Bump CACHE_VERSION on every deploy.
netlify.toml        publish=".", functions dir, security headers.
manifest.json       PWA manifest.
tests/              Browser-runnable smoke tests (open tests/smoke.html).
docs/
  BUGS.md           Known issues and fix log.
  SCHEMA.md         S object + rre2_* localStorage key reference.
  plans/            Archived implementation plans.
Version Archive/    Old snapshots (including 2.19_pre-split/ with the v18c monolith).
```

## State

Single global `S` object persisted to `localStorage`. Keys are prefixed `rre2_`. Full list in [docs/SCHEMA.md](docs/SCHEMA.md).

Autosave is debounced 400ms via `autosaveCL()` for in-progress workouts; other writes call `sv()` directly.

## Red (AI coach)

Three prompt families in `red.js`:
- **Intro** — pre-workout briefing.
- **Exercise cues** — form reminders per exercise.
- **Post-workout** — summary + feedback. MUST receive the live workout log (`S.logs[lk(...)]`), never a snapshot. The v18c bug was passing a stale pre-Save copy — see [docs/BUGS.md](docs/BUGS.md).

All Claude calls go through `Red.callClaude()` which enforces a 1500ms rate limit and returns proper errors for UI retry buttons.

## Code conventions

- **ES5 only.** `var` (not `let`/`const`). No arrow functions. No template literals. No destructuring. Matches Larry.
- **IIFE modules.** Each `js/*.js` exposes an object via `var Name = (function(){ ... return { ... }; })()`. Globals on `window`: `S`, `h`, `toast`, `gAP`, `gPD`, `lk`, `svg`, `localDateStr`, `load`, `sv`, `autosaveCL`, `R`, `safeRender`, `showFatalError`, `REDWOLF_SVG`.
- **Try/catch render boundaries.** `safeRender` wraps every tab render. On throw, show a diagnostic error card. Never blank-screen.
- **Emojis in user-facing strings are fine** as Unicode escapes (`'\u{1F3C6}'`). Do not paste raw bytes into JS source.
- **No em dashes.** Use commas, periods, or parens.

## Dev workflow

```bash
# Syntax check all modules before pushing
node --check js/themes.js js/core.js js/programs.js js/logging.js js/analytics.js js/red.js js/onboarding.js js/tabs.js js/backup.js

# ES5 lint (zero hits expected)
grep -rE '(^|\s)(let |const |=>)' js/        # no let/const/arrow
grep -rF '`' js/                              # no template literals

# Local preview (no Netlify functions — Red API calls will 404 locally)
npx serve .

# Smoke tests: open tests/smoke.html in a browser, all rows green
```

Branch model: `dev` for work, merge to `main` for Netlify auto-deploy. Bump `CACHE_VERSION` in `sw.js` on every merge to `main`.

## Design tokens

- `--accent: #c8102e` (light) / `#e8233a` (dark)
- `--success: #10b981`, `--warn: #f59e0b`, `--danger: #ef4444`
- Hero gradient: `linear-gradient(135deg, var(--accent), #8b0000)`

## Do NOT

- Pass stale workout snapshots into Red prompts.
- Use `let`/`const`/arrow functions/template literals.
- Commit directly to `main`.
- Commit `.env`, API keys, or credentials.
- Skip bumping `CACHE_VERSION` — it'll leave users on stale cached JS.
