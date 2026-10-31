// Build: src/ -> dist/
// - Concatenates src/js/** in src/js/load-order.json order into one fingerprinted bundle.
// - Fingerprints the CSS.
// - Generates dist/index.html and dist/sw.js (cache version = content hash, so it can never go stale).
// - Copies manifest, icons, and the PWA assets.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const dist = join(root, 'dist');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

function hash(s) { return createHash('sha256').update(s).digest('hex').slice(0, 10); }

export function bundleJs() {
  const order = JSON.parse(readFileSync(join(src, 'js/load-order.json'), 'utf8'));
  const header = '/* RedRiversEdgeFitness v' + pkg.version + ' - built from src/js, do not edit */\n';
  return header + order.map(function (f) {
    return '/* ---- ' + f + ' ---- */\n' + readFileSync(join(src, 'js', f), 'utf8');
  }).join('\n');
}

export function build() {
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(join(dist, 'assets'), { recursive: true });

  const js = bundleJs();
  const css = readFileSync(join(src, 'css/app.css'), 'utf8');
  const jsFile = 'app.' + hash(js) + '.js';
  const cssFile = 'app.' + hash(css) + '.css';
  writeFileSync(join(dist, 'assets', jsFile), js);
  writeFileSync(join(dist, 'assets', cssFile), css);

  const staticAssets = readdirSync(join(src, 'assets'));
  staticAssets.forEach(function (f) { copyFileSync(join(src, 'assets', f), join(dist, 'assets', f)); });
  copyFileSync(join(src, 'manifest.json'), join(dist, 'manifest.json'));

  const version = pkg.version + '+' + hash(js + css);
  const html = readFileSync(join(src, 'index.html'), 'utf8')
    .replace('__JS_FILE__', jsFile)
    .replace('__CSS_FILE__', cssFile)
    .replace('__APP_VERSION__', version);
  writeFileSync(join(dist, 'index.html'), html);

  const precache = ['/', '/index.html', '/manifest.json', '/assets/' + jsFile, '/assets/' + cssFile]
    .concat(staticAssets.map(function (f) { return '/assets/' + f; }));
  const sw = readFileSync(join(src, 'sw.template.js'), 'utf8')
    .replace('__CACHE_VERSION__', 'rre-' + hash(js + css + html))
    .replace('__PRECACHE__', JSON.stringify(precache));
  writeFileSync(join(dist, 'sw.js'), sw);

  return { jsFile, cssFile, version, jsBytes: js.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const r = build();
  console.log('built v' + r.version + ' -> dist/assets/' + r.jsFile + ' (' + Math.round(r.jsBytes / 1024) + ' KB), ' + r.cssFile);
}
