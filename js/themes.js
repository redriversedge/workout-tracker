var Themes = (function () {
  function applyDark(isDark) {
    if (isDark) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
  }
  function initFromStorage() {
    try {
      var raw = localStorage.getItem('rre2_dark');
      if (raw === 'true' || raw === true) document.body.classList.add('dark');
    } catch (e) {}
  }
  return { applyDark: applyDark, initFromStorage: initFromStorage };
})();

(function () {
  try { Themes.initFromStorage(); } catch (e) {}
})();
