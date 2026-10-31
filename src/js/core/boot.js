// === BOOT ===
// Last module in load-order.json. Loads saved state, renders, registers the service worker.
(function () {
  try {
    load();
    R();
  } catch (e) {
    if (window.console) console.error('[RRE] boot failed:', e);
    try { showFatalError(e); } catch (e2) {
      var app = document.getElementById('app');
      if (app) app.innerHTML = '<div style="padding:24px;font-family:system-ui;color:#e8233a"><h2>App Error</h2><p>' +
        String(e && e.message ? e.message : e).replace(/</g, '&lt;') + '</p></div>';
    }
  }
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  }
})();
