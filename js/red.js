// red.js — Red the AI coach. Claude prompts, API calls, rate-limited fetch, chat send.
//
// During Phase 2 migration, cut/paste from rre-v18c-deploy/index.html:
//   - RED_COMMENTARY (~1060-1140 section)
//   - COACH_PROMPTS (intro, exercise cues, postWorkout) (~2896-2920)
//   - generateCoaching (~2965-2976)
//   - chat send logic sendC (~3863-3901)
//
// Phase 5 work that lands here:
//   - callClaude wrapper with 1500ms rate-limit floor
//   - Error handling: surface real API error + Retry button (not silent generic fallback)
//   - Route all three invocation points (intro / exercise / postWorkout) + chat through callClaude.
//
// Critical invariant: postWorkoutCoaching MUST accept the live log object.
// The v18c bug passed S.modal.curLog (a stale snapshot). Always pass S.logs[lk(...)].

var Red = (function () {
  var _lastCallAt = 0;
  var RATE_LIMIT_MS = 1500;

  function _delayUntilAllowed() {
    var now = Date.now();
    var wait = Math.max(0, RATE_LIMIT_MS - (now - _lastCallAt));
    _lastCallAt = now + wait;
    return wait;
  }

  function callClaude(prompt, opts) {
    opts = opts || {};
    var wait = _delayUntilAllowed();
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        fetch('/.netlify/functions/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: opts.max_tokens || 500,
            system: prompt.system,
            messages: [{ role: 'user', content: prompt.user }]
          })
        }).then(function (r) { return r.json(); }).then(function (d) {
          if (d && d.error) { reject(new Error(d.error.message || d.error.type || 'API error')); return; }
          var txt = (d && d.content && d.content[0] && d.content[0].text) || '';
          resolve(txt);
        }).catch(reject);
      }, wait);
    });
  }

  // TODO(phase-2): populate the rest.
  return {
    callClaude: callClaude
  };
})();
