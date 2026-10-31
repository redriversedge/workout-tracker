// === RED API ===
// Every call to Red goes through redRequest(). It owns:
// - the endpoint (the server picks the model; the app never sends one)
// - message cleanup (Anthropic requires user-first, alternating roles, non-empty text)
// - one-at-a-time sequencing so auto-generated briefings and cues don't stampede the API
// - turning failures into a friendly message (err.userMessage) plus console detail
// redOnce() adds per-key de-duplication so a re-render can never re-fire a request
// that is already in flight or that just failed.
var RED_API_URL = '/.netlify/functions/chat';
var RED_MIN_GAP_MS = 400;
var _redQueue = null;
var _redLastAt = 0;
var _redInFlight = {};
var _redFailedAt = {};
var RED_RETRY_AFTER_MS = 60000;

// Converts app chat history ({role:'user'|'bot', text}) or API-shaped messages
// ({role:'user'|'assistant', content}) into a list the API accepts.
function redCleanMessages(list) {
  var out = [];
  (list || []).forEach(function (m) {
    if (!m || m.isAction || m.isError) return;
    var text = typeof m.content === 'string' ? m.content : (typeof m.text === 'string' ? m.text : '');
    text = text.replace(/^\s+|\s+$/g, '');
    if (!text) return;
    var role = m.role === 'user' ? 'user' : 'assistant';
    if (out.length === 0 && role !== 'user') return;
    var last = out[out.length - 1];
    if (last && last.role === role) { last.content += '\n\n' + text; return; }
    out.push({ role: role, content: text });
  });
  return out;
}

function redFriendlyError(err) {
  var status = err && err.status;
  var offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  if (offline || (err && err.network)) return "You're offline right now. Red will be back as soon as you reconnect.";
  if (status === 503) return 'Red is getting a lot of questions right now. Give it a minute and try again.';
  if (status === 504) return 'Red took too long to answer. Try again.';
  if (status === 400) return "Red couldn't read that request. Try rephrasing, or start a fresh chat.";
  return "Red couldn't respond just now. Try again in a moment.";
}

var RED_CLIENT_TIMEOUT_MS = 35000;
function _redSend(payload) {
  var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, RED_CLIENT_TIMEOUT_MS);
  var timedOut = new Promise(function (res, rej) {
    setTimeout(function () { var e = new Error('Timed out'); e.status = 504; rej(e); }, RED_CLIENT_TIMEOUT_MS + 500);
  });
  var req = fetch(RED_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: ctrl ? ctrl.signal : undefined
  }).then(function (r) {
    return r.json().catch(function () { return {}; }).then(function (d) {
      if (!r.ok || (d && d.error)) {
        var e = new Error((d && d.error && d.error.message) || ('HTTP ' + r.status));
        e.status = r.ok ? 502 : r.status;
        throw e;
      }
      var txt = '';
      (d.content || []).forEach(function (b) { if (b && b.type === 'text' && b.text) txt += b.text; });
      txt = txt.replace(/^\s+|\s+$/g, '');
      if (!txt) { var e2 = new Error('Empty response'); e2.status = 502; throw e2; }
      return txt;
    });
  }, function (netErr) {
    var e = new Error((netErr && netErr.message) || 'Network error');
    if (netErr && netErr.name === 'AbortError') e.status = 504; else e.network = true;
    throw e;
  });
  return Promise.race([req, timedOut]).then(function (v) { clearTimeout(timer); return v; }, function (err) { clearTimeout(timer); throw err; });
}

// opts: { system, user } or { system, messages }, optional maxTokens
// Resolves with Red's text. Rejects with an Error carrying .userMessage.
function redRequest(opts) {
  opts = opts || {};
  var messages = opts.messages ? redCleanMessages(opts.messages) : redCleanMessages([{ role: 'user', content: opts.user }]);
  if (messages.length === 0) {
    var bad = new Error('Nothing to send');
    bad.userMessage = 'Type a message for Red first.';
    return Promise.reject(bad);
  }
  var payload = { max_tokens: opts.maxTokens || 500, messages: messages };
  if (opts.system) payload.system = opts.system;

  var run = function () {
    var wait = Math.max(0, RED_MIN_GAP_MS - (Date.now() - _redLastAt));
    return new Promise(function (res) { setTimeout(res, wait); }).then(function () {
      _redLastAt = Date.now();
      return _redSend(payload);
    });
  };
  var p = (_redQueue || Promise.resolve()).then(run, run);
  _redQueue = p.then(function () {}, function () {});
  return p.then(null, function (err) {
    if (window.console) console.error('[RRE] Red request failed:', err && err.message, err);
    err.userMessage = redFriendlyError(err);
    throw err;
  });
}

// Fires redRequest once per key. While a request for the key is in flight, or for a minute
// after it failed, further calls return null instead of a promise (the caller shows its
// loading or retry state). redRetry(key) clears a failure so the next render tries again.
function redOnce(key, opts) {
  if (_redInFlight[key]) return null;
  if (_redFailedAt[key] && Date.now() - _redFailedAt[key] < RED_RETRY_AFTER_MS) return null;
  var p = redRequest(opts);
  _redInFlight[key] = p;
  return p.then(function (txt) {
    delete _redInFlight[key];
    delete _redFailedAt[key];
    return txt;
  }, function (err) {
    delete _redInFlight[key];
    _redFailedAt[key] = Date.now();
    throw err;
  });
}

function redIsLoading(key) { return !!_redInFlight[key]; }
function redHasFailed(key) { return !!_redFailedAt[key] && Date.now() - _redFailedAt[key] < RED_RETRY_AFTER_MS; }
function redRetry(key) { delete _redFailedAt[key]; }
