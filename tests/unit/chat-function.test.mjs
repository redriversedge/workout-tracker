// Red's Netlify function: method guard, config errors, validation, model pinning, upstream errors.
import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { validate, buildPayload, DEFAULT_MODEL } from '../../netlify/functions/chat.mjs';

function post(body) {
  return new Request('https://x.test/.netlify/functions/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
}

async function withEnv(vars, fn) {
  const saved = {};
  Object.keys(vars).forEach(function (k) { saved[k] = process.env[k]; if (vars[k] === undefined) delete process.env[k]; else process.env[k] = vars[k]; });
  try { return await fn(); } finally {
    Object.keys(saved).forEach(function (k) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; });
  }
}

async function withFetch(impl, fn) {
  const real = globalThis.fetch;
  globalThis.fetch = impl;
  try { return await fn(); } finally { globalThis.fetch = real; }
}

const good = { system: 'You are Red.', messages: [{ role: 'user', content: 'Hi' }], max_tokens: 300 };

test('GET returns 405 (deploy health check)', async function () {
  const r = await handler(new Request('https://x.test/.netlify/functions/chat'));
  assert.equal(r.status, 405);
  assert.equal((await r.json()).error.type, 'method_not_allowed');
});

test('missing API key returns a clear 500', async function () {
  await withEnv({ ANTHROPIC_API_KEY: undefined }, async function () {
    const r = await handler(post(good));
    assert.equal(r.status, 500);
    assert.match((await r.json()).error.message, /ANTHROPIC_API_KEY/);
  });
});

test('validation rejects bad bodies', function () {
  assert.match(validate(null), /object/);
  assert.match(validate({ messages: [] }), /non-empty/);
  assert.match(validate({ messages: [{ role: 'assistant', content: 'x' }] }), /first message/);
  assert.match(validate({ messages: [{ role: 'user', content: '' }] }), /text content/);
  assert.match(validate({ messages: [{ role: 'system', content: 'x' }] }), /role/);
  assert.equal(validate(good), null);
});

test('invalid JSON returns 400', async function () {
  await withEnv({ ANTHROPIC_API_KEY: 'k' }, async function () {
    const r = await handler(post('{nope'));
    assert.equal(r.status, 400);
  });
});

test('server picks the model; client cannot override it; max_tokens is capped', function () {
  const p = buildPayload(Object.assign({}, good, { model: 'claude-sonnet-4-20250514', max_tokens: 99999 }), DEFAULT_MODEL);
  assert.equal(p.model, DEFAULT_MODEL);
  assert.equal(p.max_tokens, 1024);
  assert.equal(p.system, 'You are Red.');
});

test('RED_MODEL env var overrides the default model', async function () {
  let sent = null;
  await withEnv({ ANTHROPIC_API_KEY: 'k', RED_MODEL: 'claude-test-model' }, async function () {
    await withFetch(async function (url, init) {
      sent = JSON.parse(init.body);
      assert.equal(init.headers['x-api-key'], 'k');
      return new Response(JSON.stringify({ content: [{ type: 'text', text: 'ok' }] }), { status: 200 });
    }, async function () {
      const r = await handler(post(good));
      assert.equal(r.status, 200);
      assert.equal((await r.json()).content[0].text, 'ok');
    });
  });
  assert.equal(sent.model, 'claude-test-model');
});

test('upstream errors map to 502/503 with the real reason', async function () {
  await withEnv({ ANTHROPIC_API_KEY: 'k', RED_MODEL: undefined }, async function () {
    await withFetch(async function () {
      return new Response(JSON.stringify({ type: 'error', error: { type: 'not_found_error', message: 'model: claude-x not found' } }), { status: 404 });
    }, async function () {
      const r = await handler(post(good));
      assert.equal(r.status, 502);
      assert.match((await r.json()).error.message, /not found/);
    });
    await withFetch(async function () {
      return new Response(JSON.stringify({ type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } }), { status: 529 });
    }, async function () {
      const r = await handler(post(good));
      assert.equal(r.status, 503);
    });
    await withFetch(async function () { throw new TypeError('fetch failed'); }, async function () {
      const r = await handler(post(good));
      assert.equal(r.status, 502);
      assert.equal((await r.json()).error.type, 'network_error');
    });
  });
});

test('default model is a current model id', function () {
  assert.match(DEFAULT_MODEL, /^claude-/);
  assert.notEqual(DEFAULT_MODEL, 'claude-sonnet-4-20250514', 'that model was retired 2026-06-15');
});
