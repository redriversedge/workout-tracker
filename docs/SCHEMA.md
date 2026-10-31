# State Schema

Source of truth for the `S` object and the `localStorage` keys that back it. Reference when adding new fields, migrating data, or debugging backup import/export.

## localStorage keys

All keys prefixed `rre2_`. Read in `load()`, written in `sv()` (and debounced `autosaveCL()` for curLog).

| Key | S field | Shape | Notes |
|---|---|---|---|
| `rre2_dark` | `S.dark` | `boolean` | Dark mode preference. |
| `rre2_profile` | `S.profile` | `{ name, level, goals, ... }` | Onboarding output. |
| `rre2_enrolled` | `S.enrolled` | `[{ id, days }]` | Programs user is enrolled in. |
| `rre2_active` | `S.active` | `string` | ID of currently active program. |
| `rre2_logs` | `S.logs` | `{ [lk]: logEntry }` | Completed workout logs keyed by `lk(progId, week, day)`. |
| `rre2_body` | `S.bodyLogs` | `[{ date, weight, ... }]` | Body measurements. |
| `rre2_chat` | `S.chatMsgs` | `[{ role: 'user'\|'bot', text, isAction?, action?, isError?, retryText? }]` | Red chat history. `isAction`/`isError` entries are never sent to the API. |
| `rre2_coachcache` | `S.coachCache` | `{ [key]: string }` | Cached Red coaching responses. |
| `rre2_prs` | `S.prs` | `{ [exerciseName]: maxWeight }` | Personal records. |
| `rre2_restdays` | `S.restDayLogs` | `{ [date]: restLog }` | Rest day activity logs. |
| `rre2_customwks` | `S.customWks` | `[{ id, name, exercises }]` | User-defined workouts. |
| `rre2_startdate` | `S.startDate` | `string (YYYY-MM-DD)` | Program start date. |
| `rre2_curlog` | `{ key, data }` -> `S._curLogKey` + `S.curLog` | `{ key, data }` | Autosave of in-progress workout. |
| `rre2_sesstimer` | `{ key, startAt, running }` -> `S._sessStartAt` + `S.sessRun` | `{ key, startAt, running }` | Session timer state (timestamp-based so it survives reload). |
| `rre2_dismissed` | `S._dismissedAlerts` | `[string]` | Dismissed alert IDs. |
| `rre2_schema` | - | `string` number | Storage schema version (currently `2`). Missing means v18/v19 data (= 1). Migrations in `core/state.js`. |
| `rre2_backup_pre_v2` | - | `{ savedAt, schema, data: { key: rawString } }` | One-time snapshot of all raw `rre2_*` values taken before the v1->v2 migration. Never overwritten. |
| `rre2_lastbackup` | - | `string` (local ISO) | When the user last saved a backup. Drives the reminder on Profile. |

## Workout log entry shape

```js
S.logs[lk(progId, week, day)] = {
  date: '2026-04-17',       // ISO when saved
  feeling: 7,                // 1-10 rating
  dur: 1800,                 // seconds
  warmupDone: true,
  cooldownDone: true,
  e0: {                      // exercise index 0
    _name: 'Back Squat',
    s1: { w: 185, r: 5, done: true },
    s2: { w: 185, r: 5, done: true },
    s3: { w: 185, r: 3, done: false },
    notes: 'Felt strong'
  },
  e1: { ... }
};
```

## Migrations

`load()` calls `migrateStorage()` first. It reads `rre2_schema`, snapshots raw data once, then runs `MIGRATIONS[n]` for each missing version and writes the new schema number. v2 normalizes chat to `{role:'user'|'bot', text}`, drops outage error bubbles, and clears empty coach-cache entries. Workout logs are never modified.

## Backup format (v20)

Produced by `Backup.exportJSON()`, filename `redge-fitness-backup-YYYY-MM-DD.json`:

```js
{
  version: 'rre-v20',
  schema: 2,
  exportedAt: '2026-04-17T12:34:56.789Z',
  profile, enrolled, active, logs, body, prs, customWks, restDayLogs,
  chatMsgs, coachCache, startDate, dark, dismissedAlerts
}
```

## Backup format (legacy v18c - accepted by import)

Produced by the old monolith's Export Data button, filename `redge-fitness-backup.json`. No version field. Seven keys:

```js
{
  profile, enrolled, logs, body, prs, customWks, restDayLogs
}
```

Import also accepts v19 files (`version: 'rre-v19.0'`). `Backup.applyPayload()` guards every field with `if (data.x) S.x = data.x`, so v18c backups import cleanly (unseen fields just aren't touched). This is the one-way migration path for existing users.
