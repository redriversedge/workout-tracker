// backup.js - JSON export/import so user data can be backed up and moved between devices.
//
// Export writes redge-fitness-backup-YYYY-MM-DD.json (version, schema, exportedAt, all state).
// On iPhone it opens the share sheet (Save to Files, AirDrop, Mail); elsewhere it downloads.
// Import accepts v18c backups (no version field, 7 keys) and v19/v20 backups.
// Every field is guarded, so missing fields in older files are left untouched.

var Backup = (function () {
  var VERSION = 'rre-v20';

  function _todayISO() {
    var d = new Date();
    return localDateStr(d);
  }

  function buildPayload(S) {
    // TODO(phase-4): wire to real S. For now assume S has the full shape.
    S = S || window.S || {};
    return {
      version: VERSION,
      schema: typeof STORAGE_SCHEMA !== 'undefined' ? STORAGE_SCHEMA : 2,
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

  function _markBackedUp() {
    try { localStorage.setItem('rre2_lastbackup', JSON.stringify(localISOStr())); } catch (e) {}
  }

  function lastBackup() {
    try { var v = localStorage.getItem('rre2_lastbackup'); return v ? JSON.parse(v) : null; } catch (e) { return null; }
  }

  // Returns a promise that resolves when the file has been handed to the user.
  function exportJSON() {
    var data = JSON.stringify(buildPayload(window.S), null, 2);
    var name = 'redge-fitness-backup-' + _todayISO() + '.json';
    var file = null;
    try { file = new File([data], name, { type: 'application/json' }); } catch (e) { file = null; }
    if (file && navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) {
      return navigator.share({ files: [file], title: 'RRE Fitness backup' }).then(function () {
        _markBackedUp();
      }, function (err) {
        if (err && err.name === 'AbortError') throw err;
        _download(data, name);
      });
    }
    _download(data, name);
    return Promise.resolve();
  }

  function _download(data, name) {
    var blob = new Blob([data], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); if (a.parentNode) a.parentNode.removeChild(a); }, 1000);
    _markBackedUp();
  }

  function applyPayload(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid backup file');
    if (!data.profile && !data.logs && !data.enrolled) throw new Error('This file is not an RRE Fitness backup');
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
    if (data.chatMsgs) S.chatMsgs = typeof normalizeChat === 'function' ? normalizeChat(data.chatMsgs) : data.chatMsgs;
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
        if (typeof window.toast === 'function') window.toast('Backup restored');
        if (typeof window.R === 'function') window.R();
        if (onDone) onDone(null);
      } catch (e) {
        if (typeof window.toast === 'function') window.toast((e && e.message) || 'Could not read that file');
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
    lastBackup: lastBackup,
    applyPayload: applyPayload,
    importFromFile: importFromFile,
    promptImport: promptImport
  };
})();
