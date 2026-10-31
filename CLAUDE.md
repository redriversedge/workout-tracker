# CLAUDE.md - RedRiversEdgeFitness

AI-coached fitness PWA: 34 training programs, workout logging, and Red (Claude) as coach.
Vanilla JS, no framework. Source in `src/`, built to `dist/`, deployed by Netlify.
Live: https://redriversedgefitness.netlify.app

## Layout

```
src/
  index.html            Shell. Build injects the fingerprinted JS/CSS file names.
  sw.template.js        Service worker template. Build sets the cache version.
  manifest.json         PWA manifest.
  assets/               Icons and the wolf logo.
  css/app.css           All styles.
  js/load-order.json    THE list of JS files, in load order. Build and tests read it.
  js/ui/                theme.js (runs first), icons.js, rest-timer.js
  js/data/              PROGRAMS, exercise descriptions, warmups, S&C programs, normalization
  js/training/          schedule, exercise history/streaks, adjustments, merge engine, supersets
  js/core/              state.js (S, load/sv, migrations), helpers.js, render.js (R, safeRender,
                        modals), navigation.js, backup.js, boot.js (runs last)
  js/red/               api.js (every Red call), coaching.js (prompts, session summary)
  js/views/             one file per screen: home, program, track, progress, chat, profile,
                        onboarding, program-picker, custom-workout
netlify/functions/chat.mjs  Red's proxy to Anthropic. Picks the model.
scripts/check.mjs       Guards: ES5 only, ASCII only, load order matches disk.
scripts/build.mjs       src -> dist (fingerprinted bundle, generated sw.js).
tests/                  unit/, render/ (jsdom), e2e/ (real Chrome at iPhone size)
docs/                   SCHEMA.md (data), BUGS.md (fix log)
```

All JS files share one global scope (the build concatenates them). Function declarations
are hoisted across files; top-level statements run in load-order.json order.

## Commands

```bash
npm install
npm test          # check + build + 140+ unit/render/flow tests (TZ=America/Chicago)
npm run test:e2e  # real Chrome at 393x852, both themes, screenshots in test-results/
npm run build     # just build dist/
npm run serve     # preview dist/ locally (Red calls 404 without netlify dev)
```

Netlify runs `npm test` as the build command. A failing test blocks the deploy.
GitHub Actions runs `npm test` and the browser check on every PR.

## Rules

- **ES5 only** in `src/js` and `src/sw.template.js`: `var`, `function`, no arrows, template
  literals, `let/const`, spread, or `\u{...}` escapes. `check.mjs` parses every file as ES5.
- **ASCII only** in everything shipped. Write emoji and dashes as `\uXXXX` escapes
  (surrogate pairs for emoji, e.g. `'🔥'`). This is what stopped the iOS
  smart-quote 502s for good.
- **New JS file?** Add it to `src/js/load-order.json` or the check fails.
- **Every Red call goes through `redRequest()` / `redOnce()`** in `red/api.js`. Never call
  `fetch` for Red directly and never send a `model`. The function picks it.
- **Use `parseLocalDate()`** for any stored date string. `new Date('2026-10-31')` is UTC
  midnight, which is the previous evening in the US.
- **Changing stored data shape?** Bump `STORAGE_SCHEMA` in `core/state.js`, add a
  `MIGRATIONS[n]` step, add a test in `tests/unit/data.test.mjs`, update docs/SCHEMA.md.
- **Post-workout feedback must use the saved log**: the celebration modal carries
  `logKey`, `w`, `d` captured at Save. Track auto-advances on re-render, so `S.week/S.day`
  already point at the next workout by the time the user rates the session.
- No cache-version bumping needed: the build fingerprints assets and versions sw.js.

## Red

- Model: `RED_MODEL` env var on Netlify, else `DEFAULT_MODEL` in `chat.mjs`. When Anthropic
  retires a model, change the env var (or the default) and redeploy. No app change needed.
- Health check: `GET /.netlify/functions/chat` returns 405 when the function is loaded.
- `ANTHROPIC_API_KEY` lives in Netlify env vars (production, deploy-preview, branch-deploy).

## Git

Work on a branch, open a PR (Netlify posts a deploy preview), merge to `main` to ship.
`main` auto-deploys to production. Roll back from Netlify Deploys or by reverting the merge.
The last pre-rebuild commit is `9cda7c1` (v19).

## Design

Dark-first. `--accent: #c8102e` (light) / `#e8233a` (dark), background `#0a0a0a`.
Mobile-first: test at 393px wide. Inputs are 16px on touch devices so iOS does not zoom.
