// Red's proxy to the Anthropic Messages API. Serves at /.netlify/functions/chat
//
// The model is chosen here, never by the browser. Override with the RED_MODEL env var
// (Netlify > Site configuration > Environment variables) when Anthropic retires a model.
// GET returns 405: use it as a health check that the function loaded.

export const DEFAULT_MODEL = 'claude-sonnet-5-5';
const API_URL = 'https://api.anthropic.com/v1/messages';
const MAX_TOKENS_CAP = 1024;
const MAX_SYSTEM_CHARS = 30000;
const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 20000;
const TIMEOUT_MS = 25000;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
  });
}

function fail(status, type, message) {
  return json(status, { error: { type: type, message: message } });
}

function env(name) {
  if (typeof Netlify !== 'undefined' && Netlify.env) return Netlify.env.get(name);
  return process.env[name];
}

export function validate(body) {
  if (!body || typeof body !== 'object') return 'Request body must be a JSON object.';
  const msgs = body.messages;
  if (!Array.isArray(msgs) || msgs.length === 0) return 'messages must be a non-empty array.';
  if (msgs.length > MAX_MESSAGES) return 'Too many messages (max ' + MAX_MESSAGES + ').';
  for (const m of msgs) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) return 'Each message needs role user or assistant.';
    if (typeof m.content !== 'string' || m.content.length === 0) return 'Each message needs text content.';
    if (m.content.length > MAX_MESSAGE_CHARS) return 'A message is too long.';
  }
  if (msgs[0].role !== 'user') return 'The first message must be from the user.';
  if (body.system !== undefined && typeof body.system !== 'string') return 'system must be a string.';
  if (body.system && body.system.length > MAX_SYSTEM_CHARS) return 'system prompt is too long.';
  return null;
}

export function buildPayload(body, model) {
  const requested = parseInt(body.max_tokens, 10);
  const payload = {
    model: model,
    max_tokens: Math.min(MAX_TOKENS_CAP, requested > 0 ? requested : 500),
    messages: body.messages.map(function (m) { return { role: m.role, content: m.content }; })
  };
  if (body.system) payload.system = body.system;
  return payload;
}

export default async function handler(req) {
  if (req.method !== 'POST') return fail(405, 'method_not_allowed', 'Use POST.');

  const apiKey = env('ANTHROPIC_API_KEY');
  if (!apiKey) return fail(500, 'config_error', 'ANTHROPIC_API_KEY is not set for this deploy.');

  let body;
  try { body = await req.json(); } catch (e) { return fail(400, 'invalid_request', 'Body is not valid JSON.'); }
  const problem = validate(body);
  if (problem) return fail(400, 'invalid_request', problem);

  const model = env('RED_MODEL') || DEFAULT_MODEL;
  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);

  try {
    const upstream = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(buildPayload(body, model)),
      signal: controller.signal
    });
    let data;
    try { data = await upstream.json(); } catch (e) { return fail(502, 'upstream_error', 'Anthropic returned an unreadable response.'); }
    if (!upstream.ok) {
      const msg = (data && data.error && data.error.message) || ('Anthropic API error ' + upstream.status);
      const type = (data && data.error && data.error.type) || 'upstream_error';
      return fail(upstream.status === 429 || upstream.status === 529 ? 503 : 502, type, msg);
    }
    return json(200, data);
  } catch (e) {
    if (e && e.name === 'AbortError') return fail(504, 'timeout', 'Red took too long to respond. Try again.');
    return fail(502, 'network_error', 'Could not reach Anthropic: ' + (e && e.message ? e.message : String(e)));
  } finally {
    clearTimeout(timer);
  }
}
