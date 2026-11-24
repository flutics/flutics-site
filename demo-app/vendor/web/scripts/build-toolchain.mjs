// Builds the shared app toolchain (React, antd, icons, dayjs, @meadow/sdk and the
// iframe host) as ES modules with code splitting, so every app on the content
// origin shares one React instance through the import map.
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(root, 'package.json'));
const version = process.env.MEADOW_TOOLCHAIN || '2026.10';
const out = join(root, 'dist-toolchain', version);
const tmp = join(root, 'node_modules', '.meadow-toolchain');

process.env.NODE_ENV = 'production';
rmSync(out, { recursive: true, force: true });
rmSync(tmp, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
mkdirSync(tmp, { recursive: true });

const ident = /^[A-Za-z_$][\w$]*$/;
// CommonJS packages need explicit named re-exports to be importable as ESM.
const cjs = {
  react: 'react',
  'react-jsx-runtime': 'react/jsx-runtime',
  'react-dom': 'react-dom',
  'react-dom-client': 'react-dom/client',
  dayjs: 'dayjs',
};
const entries = {};
for (const [name, spec] of Object.entries(cjs)) {
  const mod = require(spec);
  const keys = typeof mod === 'function' && name === 'dayjs' ? [] : Object.keys(mod).filter((k) => k !== 'default' && k !== '__esModule' && ident.test(k));
  const src = `import * as M from ${JSON.stringify(spec)};\nconst D = M.default ?? M;\nexport default D;\n` + (keys.length ? `export const { ${keys.join(', ')} } = D;\n` : '');
  const file = join(tmp, `${name}.js`);
  writeFileSync(file, src);
  entries[name] = file;
}
writeFileSync(join(tmp, 'antd.js'), `export * from 'antd';\n`);
writeFileSync(join(tmp, 'icons.js'), `export * from '@ant-design/icons';\n`);
entries.antd = join(tmp, 'antd.js');
entries.icons = join(tmp, 'icons.js');
entries.sdk = join(root, 'toolchain', 'sdk.js');
entries.host = join(root, 'toolchain', 'host.jsx');

await build({
  entryPoints: entries,
  bundle: true,
  splitting: true,
  format: 'esm',
  outdir: out,
  entryNames: '[name]',
  chunkNames: 'c-[hash]',
  minify: true,
  target: 'es2020',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
  nodePaths: [join(root, 'node_modules')],
  legalComments: 'none',
  logLevel: 'info',
});
copyFileSync(join(root, 'toolchain', 'host.css'), join(out, 'host.css'));

const hash = createHash('sha256');
for (const name of readdirSync(out).sort()) {
  if (name === 'manifest.json') continue;
  hash.update(name);
  hash.update(readFileSync(join(out, name)));
}
const build_id = hash.digest('hex').slice(0, 16);
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ build_id, version }, null, 0) + '\n');
console.log(`toolchain ${version} → ${out} (build ${build_id})`);
