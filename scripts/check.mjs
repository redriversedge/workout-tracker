// Pre-build guards. Fails the build (and therefore the Netlify deploy) on:
// - any non-ASCII byte in shipped source (the iOS smart-quote failure mode)
// - any JS that is not valid ES5 (app code) or valid modern JS (functions, scripts)
// - load-order.json and src/js drifting apart (a file added but never loaded, or listed but missing)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as acorn from 'acorn';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

function walk(dir) {
  return readdirSync(dir).flatMap(function (f) {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const textExt = /\.(js|mjs|mts|css|html|json|toml|svg|md)$/;
const shipped = walk(join(root, 'src')).concat(walk(join(root, 'netlify')), [join(root, 'netlify.toml')])
  .filter(function (f) { return textExt.test(f); });

shipped.forEach(function (f) {
  const buf = readFileSync(f);
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] > 127) {
      const line = buf.subarray(0, i).toString('latin1').split('\n').length;
      errors.push('non-ASCII byte in ' + relative(root, f) + ':' + line + ' (use a \\uXXXX escape)');
      return;
    }
  }
});

const jsDir = join(root, 'src/js');
const order = JSON.parse(readFileSync(join(jsDir, 'load-order.json'), 'utf8'));
const onDisk = walk(jsDir).filter(function (f) { return f.endsWith('.js'); }).map(function (f) { return relative(jsDir, f); });
order.forEach(function (f) { if (!existsSync(join(jsDir, f))) errors.push('load-order.json lists missing file: ' + f); });
onDisk.forEach(function (f) { if (order.indexOf(f) === -1) errors.push('src/js/' + f + ' is not in load-order.json'); });
if (new Set(order).size !== order.length) errors.push('load-order.json has duplicates');

order.forEach(function (f) {
  const p = join(jsDir, f);
  if (!existsSync(p)) return;
  try { acorn.parse(readFileSync(p, 'utf8'), { ecmaVersion: 5, sourceType: 'script' }); }
  catch (e) { errors.push('src/js/' + f + ' is not valid ES5: ' + e.message); }
});

[join(root, 'src/sw.template.js')].forEach(function (p) {
  try { acorn.parse(readFileSync(p, 'utf8'), { ecmaVersion: 5, sourceType: 'script' }); }
  catch (e) { errors.push(relative(root, p) + ' is not valid ES5: ' + e.message); }
});

walk(join(root, 'netlify/functions')).filter(function (f) { return /\.m?js$/.test(f); }).forEach(function (p) {
  try { acorn.parse(readFileSync(p, 'utf8'), { ecmaVersion: 'latest', sourceType: 'module' }); }
  catch (e) { errors.push(relative(root, p) + ' does not parse: ' + e.message); }
});

if (errors.length) {
  console.error('check failed:\n  ' + errors.join('\n  '));
  process.exit(1);
}
console.log('check ok: ' + shipped.length + ' files ASCII, ' + order.length + ' ES5 modules, load order matches disk');
