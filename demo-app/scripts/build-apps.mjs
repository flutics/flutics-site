import { build } from 'esbuild';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const demoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const slugs = ['sales-crm', 'inventory', 'billing'];
const ids = {
  'sales-crm': '11111111-1111-4111-8111-111111111111',
  inventory: '22222222-2222-4222-8222-222222222222',
  billing: '33333333-3333-4333-8333-333333333333',
};

const imports = {
  react: '/tc/2026.10/react.js',
  'react/jsx-runtime': '/tc/2026.10/react-jsx-runtime.js',
  'react-dom': '/tc/2026.10/react-dom.js',
  'react-dom/client': '/tc/2026.10/react-dom-client.js',
  antd: 'antd/antd.js'.replace('antd/antd', '/tc/2026.10/antd'),
  '@ant-design/icons': '/tc/2026.10/icons.js',
  dayjs: '/tc/2026.10/dayjs.js',
  '@meadow/sdk': '/tc/2026.10/sdk.js',
};
// fix antd typo above - rewrite cleanly
imports.antd = '/tc/2026.10/antd.js';

for (const slug of slugs) {
  const yamlPath = join(demoRoot, 'apps', slug, 'meadow.yaml');
  const manifest = parseYaml(readFileSync(yamlPath, 'utf8'));
  const version = manifest.version || '1.0.0';
  const outDir = join(demoRoot, 'public/apps', slug, 'v', version);
  rmSync(join(demoRoot, 'public/apps', slug), { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  await build({
    entryPoints: [join(demoRoot, 'apps', slug, 'src/main.tsx')],
    bundle: true,
    format: 'esm',
    outfile: join(outDir, 'app.js'),
    minify: true,
    target: 'es2020',
    jsx: 'automatic',
    external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', 'antd', '@ant-design/icons', 'dayjs', '@meadow/sdk'],
    define: { 'process.env.NODE_ENV': '"production"' },
    legalComments: 'none',
    logLevel: 'info',
  });
  const cfg = {
    app: slug,
    app_id: ids[slug],
    name: manifest.name,
    version,
    toolchain: '2026.10',
    bundle: `/apps/${slug}/v/${version}/app.js`,
    api: `/api/v1/rt/apps/${ids[slug]}`,
    shell: 'http://localhost',
  };
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${manifest.name}</title>
<link rel="stylesheet" href="/tc/2026.10/host.css">
<script type="importmap">${JSON.stringify({ imports })}</script>
<script type="application/json" id="meadow-config">${JSON.stringify(cfg).replace(/</g, '\\u003c')}</script>
<script>
(function () {
  var el = document.getElementById('meadow-config');
  var cfg = JSON.parse(el.textContent);
  cfg.shell = location.origin;
  if (cfg.api && cfg.api.charAt(0) === '/') cfg.api = location.origin + cfg.api;
  el.textContent = JSON.stringify(cfg);
  var orig = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (String(url).indexOf('/api/v1/') !== -1 && window.parent && window.parent !== window && window.parent.__demoFetch) {
      return window.parent.__demoFetch(input, init);
    }
    return orig(input, init);
  };
})();
</script>
<script type="module" src="/tc/2026.10/host.js"></script>
</head>
<body><div id="root"></div></body>
</html>
`;
  writeFileSync(join(demoRoot, 'public/apps', slug, 'index.html'), html);
  console.log(`app ${slug} ${version}`);
}
