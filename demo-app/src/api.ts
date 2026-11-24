import { APPS, ORG_NAME, TOOLCHAIN, USER, WS_NAME, WS_SLUG } from './constants';
import { getDb, notifyDb, resetDb, withUser } from './db';
import { runAction, runQuery } from './exec';
import { manifestFor } from './manifest';

const LAYOUT_KEY = 'flutics-demo-layout-v1';
const PERMS = ['apps:read', 'apps:execute'];

function origin() {
  return location.origin;
}

function defaultLayout() {
  return {
    custom: true,
    sidebar: [
      { type: 'page', ref: 'home' },
      { type: 'page', ref: 'catalog' },
      { type: 'page', ref: 'shared' },
      ...APPS.map((a) => ({ type: 'app' as const, ref: a.slug })),
    ],
    tabs: [] as string[],
  };
}

function readLayout() {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    return raw ? { ...defaultLayout(), ...JSON.parse(raw), custom: true } : defaultLayout();
  } catch {
    return defaultLayout();
  }
}

function writeLayout(patch: Record<string, unknown>) {
  const next = { ...readLayout(), ...patch, custom: true };
  localStorage.setItem(LAYOUT_KEY, JSON.stringify(next));
  return next;
}

function workspace() {
  return {
    id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    slug: WS_SLUG,
    name: WS_NAME,
    org: ORG_NAME,
    members: TEAM_COUNT(),
    groups: 1,
    apps: APPS.length,
    permissions: PERMS,
  };
}

function TEAM_COUNT() {
  return 3;
}

function meRecord() {
  const ws = workspace();
  return {
    user: { id: USER.id, name: USER.name, email: USER.email, kind: USER.kind },
    workspaces: [ws],
    prefs: { theme: localStorage.getItem('meadow-theme') || 'light', default_workspace: WS_SLUG },
    can_create_workspace: false,
    instance_admin: false,
    content_url: origin(),
    toolchain: TOOLCHAIN,
    csrf_token: 'demo-csrf',
    branding: {
      company_name: 'Flutics',
      primary_color: '#0e7c66',
      primary_color_dark: '#22c5a6',
      logo_url: '/brand/logo.svg',
      favicon_url: '/favicon.svg',
    },
  };
}

function appRecord(slug: string) {
  const meta = APPS.find((a) => a.slug === slug);
  if (!meta) return null;
  const manifest = manifestFor(slug);
  return {
    id: meta.id,
    workspace_id: workspace().id,
    workspace: WS_SLUG,
    kind: 'app',
    slug: meta.slug,
    name: meta.name,
    description: meta.description,
    category: meta.category,
    color: meta.color,
    version: meta.version,
    version_id: `${meta.slug}@${meta.version}`,
    toolchain: TOOLCHAIN,
    published_at: '2026-11-18T15:00:00.000Z',
    created_by: USER.id,
    owner_name: USER.name,
    tables: Object.keys(manifest.tables || {}).length,
    queries: manifest.queries?.length || 0,
    actions: manifest.actions?.length || 0,
    exports: [],
    imports: [],
    url: `/w/${WS_SLUG}/apps/${meta.slug}`,
    content_url: `${origin()}/apps/${meta.slug}/`,
    content_path: `/apps/${meta.slug}`,
    folder_id: null,
    folder_path: '',
    manifest_yaml: manifest.raw,
  };
}

function listApps() {
  return APPS.map((a) => appRecord(a.slug));
}

function pathOf(url: string) {
  const u = new URL(url, origin());
  return (u.pathname + (u.search || '')).replace(/\/$/, '') || '/';
}

export async function handleDemoAPI(method: string, url: string, body?: any): Promise<{ status: number; data: any }> {
  const full = pathOf(url);
  const clean = full.split('?')[0].replace(/^\/api\/v1/, '') || '/';
  try {
    const data = await route(method.toUpperCase(), clean, full, body);
    return { status: 200, data };
  } catch (e: any) {
    const status = e.status || 400;
    return { status, data: { error: { message: e.message || String(e), code: e.code || 'demo_error' } } };
  }
}

async function route(method: string, clean: string, full: string, body: any): Promise<any> {
  if (method === 'GET' && clean === '/me') return meRecord();
  if (method === 'GET' && clean === '/workspaces') return [workspace()];
  if (method === 'GET' && clean === '/me/shared') return [];
  if (method === 'GET' && clean === '/me/pins') return [];
  if (method === 'PUT' && clean === '/me/prefs') return { ok: true };
  if (method === 'POST' && clean === '/auth/logout') return { ok: true };
  if (method === 'GET' && clean === '/public/branding') return meRecord().branding;
  if (method === 'POST' && clean === '/demo/reset') {
    await resetDb();
    return { ok: true };
  }

  const rt = clean.match(/^\/rt\/apps\/([^/]+)\/(queries|actions)\/([^/]+)$/);
  if (rt && method === 'POST') {
    const [, appId, kind, id] = rt;
    const meta = APPS.find((a) => a.id === appId);
    if (!meta) {
      const err: any = new Error('Unknown app');
      err.status = 404;
      throw err;
    }
    const manifest = manifestFor(meta.slug);
    return withUser(async (db) => {
      const args = body?.args || body || {};
      const out = kind === 'queries' ? await runQuery(db, manifest, decodeURIComponent(id), args) : await runAction(db, manifest, decodeURIComponent(id), args);
      if (kind === 'actions') notifyDb();
      return out;
    });
  }

  const ws = clean.match(/^\/workspaces\/([^/]+)(.*)$/);
  if (ws) {
    const slug = decodeURIComponent(ws[1]);
    const tail = ws[2] || '';
    if (slug !== WS_SLUG) {
      const err: any = new Error('Workspace not found');
      err.status = 404;
      throw err;
    }
    if (method === 'GET' && tail === '') return workspace();
    if (method === 'GET' && tail === '/apps') return listApps();
    if (method === 'GET' && tail === '/layout') return readLayout();
    if (method === 'PUT' && tail === '/layout') return writeLayout(body || {});
    if (method === 'GET' && tail.startsWith('/folders')) return [];
    if (method === 'GET' && tail === '/grants') return [];
    if (method === 'GET' && tail === '/users') return TEAM_USERS();
    if (method === 'GET' && tail === '/groups') return [{ id: 'group-sales', name: 'sales-ops' }];
    if (method === 'GET' && tail === '/roles') return [];
    if (method === 'GET' && tail === '/audit') return [];
    const token = tail.match(/^\/apps\/([^/]+)\/token$/);
    if (method === 'POST' && token) {
      const app = appRecord(decodeURIComponent(token[1]));
      if (!app) {
        const err: any = new Error('App not found');
        err.status = 404;
        throw err;
      }
      return { token: `demo-${app.slug}`, expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() };
    }
    const one = tail.match(/^\/apps\/([^/]+)$/);
    if (method === 'GET' && one) {
      const app = appRecord(decodeURIComponent(one[1]));
      if (!app) {
        const err: any = new Error('App not found');
        err.status = 404;
        throw err;
      }
      return app;
    }
  }

  if (method === 'GET') return Array.isArray(body) ? [] : {};
  return { ok: true };
}

function TEAM_USERS() {
  return [
    { id: USER.id, name: USER.name, email: USER.email },
    { id: '55555555-5555-4555-8555-555555555556', name: 'Diego Alvarez', email: 'diego@alder-light.example' },
    { id: '55555555-5555-4555-8555-555555555557', name: 'Livia Pratt', email: 'livia@alder-light.example' },
  ];
}

export async function installFetchShim() {
  await getDb();
  const orig = window.fetch.bind(window);
  const patched = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (String(url).includes('/api/v1/')) {
      let body: any = undefined;
      if (init?.body) {
        if (typeof init.body === 'string') {
          try {
            body = JSON.parse(init.body);
          } catch {
            body = init.body;
          }
        }
      }
      const method = (init?.method || (typeof input !== 'string' && !(input instanceof URL) ? input.method : 'GET') || 'GET').toUpperCase();
      const { status, data } = await handleDemoAPI(method, url, body);
      return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
    }
    return orig(input as any, init);
  };
  window.fetch = patched as typeof fetch;
  (window as any).__demoFetch = patched;
}

export { notifyDb, resetDb };
