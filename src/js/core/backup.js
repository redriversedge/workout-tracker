// backup.js - JSON export/import for user data portability.
//
// Export (new format): downloads redge-fitness-backup-YYYY-MM-DD.json containing
// version + exportedAt + every rre2_* state field. Superset of v18c's 7-field export.
//
// Import accepts EITHER shape:
//   - v18c (no version field, 7 keys: profile/enrolled/logs/body/prs/customWks/restDayLogs).
//     Needed so users can carry current progress forward into the new version.
//   - v19+ (has version: 'rre-v19.x'). Restores everything present.
//
// Each field guarded with `if (data.x) S.x = data.x` so unknown/missing fields are safe.
//
// Monolith reference: Export button logic lives in rre-v18c-deploy/index.html line 3969,
// Import button on line 3970, Reset button on line 3971. During Phase 4, lift those handlers
// into this module and wire them from the rebuilt Profile tab.

var Backup = (function () {
  var VERSION = 'rre-v19.0';

  function _todayISO() {
    var d = new Date();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  }

  function buildPayload(S) {
    // TODO(phase-4): wire to real S. For now assume S has the full shape.
    S = S || window.S || {};
    return {
      version: VERSION,
      exportedAt: new Date().toISOString(),
      profile: S.profile,
      enrolled: S.enrolled,
      active: S.active,
      logs: S.logs,
      body: S.bodyLogs,
      prs: S.prs,
      customWks: S.customWks,
      restDayLogs: S.restDayLogs,
      chatMsgs: S.chatMsgs,
      coachCache: S.coachCache,
      startDate: S.startDate,
      dark: S.dark,
      dismissedAlerts: S._dismissedAlerts || []
    };
  }

  function exportJSON() {
    var data = JSON.stringify(buildPayload(window.S), null, 2);
    var blob = new Blob([data], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'redge-fitness-backup-' + _todayISO() + '.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function applyPayload(data) {
    if (!data || typeof data !== 'object') throw new Error('Invalid backup file');
    var S = window.S;
    if (!S) throw new Error('State not initialized');
    // v18c's 7 fields
    if (data.profile) S.profile = data.profile;
    if (data.enrolled) S.enrolled = data.enrolled;
    if (data.logs) S.logs = data.logs;
    if (data.body) S.bodyLogs = data.body;
    if (data.prs) S.prs = data.prs;
    if (data.customWks) S.customWks = data.customWks;
    if (data.restDayLogs) S.restDayLogs = data.restDayLogs;
    // v19+ additions (ignored if absent - keeps v18c imports working)
    if (data.active !== undefined) S.active = data.active;
    if (data.chatMsgs) S.chatMsgs = data.chatMsgs;
    if (data.coachCache) S.coachCache = data.coachCache;
    if (data.startDate !== undefined) S.startDate = data.startDate;
    if (data.dark !== undefined) S.dark = data.dark;
    if (data.dismissedAlerts) S._dismissedAlerts = data.dismissedAlerts;
  }

  function importFromFile(file, onDone) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        applyPayload(data);
        if (typeof window.sv === 'function') window.sv();
        if (typeof window.toast === 'function') window.toast('Data imported');
        if (typeof window.R === 'function') window.R();
        if (onDone) onDone(null);
      } catch (e) {
        if (typeof window.toast === 'function') window.toast('Invalid file');
        if (onDone) onDone(e);
      }
    };
    reader.readAsText(file);
  }

  function promptImport(onDone) {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json,application/json';
    inp.onchange = function () {
      var f = inp.files && inp.files[0];
      if (!f) return;
      importFromFile(f, onDone);
    };
    inp.click();
  }

  return {
    VERSION: VERSION,
    buildPayload: buildPayload,
    exportJSON: exportJSON,
    applyPayload: applyPayload,
    importFromFile: importFromFile,
    promptImport: promptImport
  };
})();
