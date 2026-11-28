// Puts the browser demo (the real shell) on the marketing site: /demo and its /w/* routes.
import { cpSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function addDemo(demo, www) {
  // The site keeps its own index.html, _headers and _redirects; shared brand files are identical.
  for (const dir of ['assets', 'apps', 'tc']) cpSync(`${demo}/${dir}`, `${www}/${dir}`, { recursive: true });
  cpSync(`${demo}/index.html`, `${www}/demo.html`);
  if (!existsSync(`${www}/index.html`)) throw new Error(`${www} has no index.html; build the site first`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) addDemo('site-output/demo', 'site-output/www');
