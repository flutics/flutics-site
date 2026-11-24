import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Dropdown, Input, Modal } from 'antd';
import { del, get, post, put, setCSRF } from './api';
import { I } from './icons';
import { AppIcon, ToastHost, isMac, useToast } from './util';
import { AppView } from './appview';
import { Palette } from './palette';
import { type Branding, type InstanceBranding, applyInstanceBranding, resolvedPrimary } from './branding';
import { buildAppShellPath, parseAppShellPath } from './approute';
import type { AppChrome } from './appchrome';
import { AppMenuButton, appMenuItems } from './appmenu';
import { ShellLink } from './shelllink';

export type Workspace = { id: string; slug: string; name: string; org: string; members: number; groups: number; apps: number; permissions?: string[]; branding?: Branding; external?: boolean };
export type Me = { user: any; workspaces: Workspace[]; prefs: { theme: string; default_workspace?: string }; can_create_workspace: boolean; instance_admin?: boolean; content_url: string; toolchain: string; csrf_token?: string; branding?: InstanceBranding };
export type SidebarItem = { type: 'app' | 'page'; ref: string; label?: string };

export const PAGES: Record<string, { label: string; icon: string; perm?: string }> = {
  home: { label: 'Home', icon: 'home' },
  catalog: { label: 'Catalog', icon: 'grid', perm: 'apps:read' },
  shared: { label: 'Shared with me', icon: 'share' },
  data: { label: 'Data', icon: 'share', perm: 'workspaces:update' },
  users: { label: 'Users', icon: 'user', perm: 'users:update' },
  'external-users': { label: 'External users', icon: 'user', perm: 'users:update' },
  groups: { label: 'Groups', icon: 'users', perm: 'groups:update' },
  roles: { label: 'Roles', icon: 'shield', perm: 'workspaces:update' },
  events: { label: 'Events', icon: 'bolt', perm: 'workspaces:update' },
  audit: { label: 'Audit', icon: 'doc', perm: 'workspaces:update' },
  settings: { label: 'Settings', icon: 'sliders' },
};
const DEFAULT_SIDEBAR: SidebarItem[] = [
  { type: 'page', ref: 'home' },
  { type: 'page', ref: 'shared' },
  { type: 'page', ref: 'catalog' },
];

type ShellCtx = {
  me: Me;
  ws: Workspace;
  apps: any[];
  reloadApps: () => Promise<void>;
  reloadMe: () => Promise<void>;
  can: (p: string) => boolean;
  sidebar: SidebarItem[];
  setSidebar: (items: SidebarItem[]) => void;
  isFavorite: (type: string, ref: string) => boolean;
  toggleFavorite: (type: 'app' | 'page', ref: string) => void;
  tabs: string[];
  openApp: (slug: string) => void;
  closeTab: (slug: string) => void;
  theme: 'light' | 'dark';
  themePref: string;
  setThemePref: (t: string) => void;
  branding: Branding | undefined;
  brandPrimary: string;
  go: (page: string) => void;
  path: (p: string) => string;
  openPalette: () => void;
  newApp: () => void;
  appChrome: AppChrome | null;
  registerAppChrome: (slug: string, chrome: AppChrome | null) => void;
};

const Ctx = createContext<ShellCtx>(null as any);
export const useShell = () => useContext(Ctx);

const systemDark = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
export const resolveTheme = (pref: string): 'light' | 'dark' => (pref === 'system' ? (systemDark() ? 'dark' : 'light') : pref === 'dark' ? 'dark' : 'light');

export function useThemePref(initial?: string) {
  const [pref, setPref] = useState<string>(initial || localStorage.getItem('meadow-theme') || 'light');
  const [sys, setSys] = useState(systemDark());
  useEffect(() => {
    const m = matchMedia('(prefers-color-scheme: dark)');
    const fn = () => setSys(m.matches);
    m.addEventListener('change', fn);
    return () => m.removeEventListener('change', fn);
  }, []);
  const theme = pref === 'system' ? (sys ? 'dark' : 'light') : (pref as 'light' | 'dark');
  useEffect(() => {
    localStorage.setItem('meadow-theme', pref);
    document.body.classList.toggle('dark', theme === 'dark');
  }, [pref, theme]);
  return [pref, setPref, theme] as const;
}

export function Shell({ me: initialMe, onTheme, onBranding }: { me: Me; onTheme: (t: 'light' | 'dark') => void; onBranding?: (b: Branding | undefined) => void }) {
  const { ws: wsSlug = '' } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const [me, setMe] = useState(initialMe);
  const [ws, setWs] = useState<Workspace | null>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [sidebar, setSidebarState] = useState<SidebarItem[]>(DEFAULT_SIDEBAR);
  const [tabs, setTabs] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [palOpen, setPalOpen] = useState(false);
  const [chromeBySlug, setChromeBySlug] = useState<Record<string, AppChrome>>({});
  const [newAppOpen, setNewAppOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [themePref, setPref, theme] = useThemePref(me.prefs?.theme);

  useEffect(() => onTheme(theme), [theme, onTheme]);
  const instanceBranding = me.branding;
  const themeBranding = useMemo((): Branding | undefined => {
    if (!instanceBranding && !ws?.branding) return undefined;
    return { ...(instanceBranding || {}), ...(ws?.branding || {}) };
  }, [instanceBranding, ws?.branding]);
  const brandPrimary = resolvedPrimary(themeBranding, theme === 'dark');
  const pageTitle = useMemo(() => {
    const seg = loc.pathname.split('/').filter(Boolean);
    const page = seg[2] || 'home';
    if (page === 'settings') return 'Settings';
    return PAGES[page]?.label;
  }, [loc.pathname]);
  useEffect(() => {
    onBranding?.(themeBranding);
    if (ws) applyInstanceBranding(instanceBranding, pageTitle, theme === 'dark');
  }, [instanceBranding, themeBranding, ws, theme, onBranding, pageTitle]);

  const reloadApps = useCallback(async () => {
    setApps(await get(`/workspaces/${wsSlug}/apps`));
  }, [wsSlug]);
  const reloadMe = useCallback(async () => {
    const m = await get('/me');
    setCSRF(m.csrf_token);
    setMe(m);
  }, []);

  // react-router's navigate changes identity on every location change; keep it
  // out of the workspace-load deps so in-workspace navigation doesn't reset
  // `loaded` (which unmounted the whole shell and every app iframe per click).
  const navRef = useRef(nav);
  navRef.current = nav;
  useEffect(() => {
    let live = true;
    setLoaded(false);
    Promise.all([
      get(`/workspaces/${wsSlug}`),
      get(`/workspaces/${wsSlug}/apps`).catch(() => []),
      get(`/workspaces/${wsSlug}/layout`).catch(() => ({ custom: false, sidebar: [], tabs: [] })),
      get('/me/shared').catch(() => []),
    ])
      .then(([w, a, l, shared]: any[]) => {
        if (!live) return;
        setWs(w);
        // Share-only principals have no workspace role: show the apps shared
        // into this workspace instead of the (404) catalog.
        const member = (w.permissions || []).length > 0;
        setApps(member ? a : (shared || []).filter((s: any) => s.workspace === wsSlug).map((s: any) => ({ ...s, id: s.app_id })));
        const stored: SidebarItem[] = l.custom ? l.sidebar : DEFAULT_SIDEBAR;
        // Favorites for removed pages (e.g. the Connections page that moved
        // into Settings) are dropped; unknown refs would also break rendering.
        const items = l.custom ? stored.filter((it) => it.type !== 'page' || PAGES[it.ref]) : stored;
        // Layout saves were rejected while "shared" was missing from the
        // server's page allowlist, so custom sidebars never picked it up.
        // Add it once; users can still remove it now that saving works.
        const withShared =
          l.custom && !items.some((it) => it.type === 'page' && it.ref === 'shared')
            ? [...items, { type: 'page' as const, ref: 'shared' }]
            : items;
        setSidebarState(withShared);
        if (l.custom && (withShared.length !== stored.length || withShared !== items))
          put(`/workspaces/${wsSlug}/layout`, { sidebar: withShared }).catch(() => {});
        setTabs(l.tabs || []);
        setLoaded(true);
      })
      .catch(() => {
        if (live) navRef.current('/', { replace: true });
      });
    return () => {
      live = false;
    };
  }, [wsSlug]);

  const perms = useMemo(() => new Set(ws?.permissions || []), [ws]);
  const can = useCallback((p: string) => perms.has(p), [perms]);
  const path = useCallback((p: string) => `/w/${wsSlug}/${p}`, [wsSlug]);
  const go = useCallback((p: string) => nav(path(p)), [nav, path]);

  const setSidebar = useCallback(
    (items: SidebarItem[]) => {
      setSidebarState(items);
      put(`/workspaces/${wsSlug}/layout`, { sidebar: items }).catch(() => {});
    },
    [wsSlug],
  );
  const isFavorite = useCallback((type: string, ref: string) => sidebar.some((s) => s.type === type && s.ref === ref), [sidebar]);
  const toggleFavorite = useCallback(
    (type: 'app' | 'page', ref: string) => {
      setSidebar(isFavorite(type, ref) ? sidebar.filter((s) => !(s.type === type && s.ref === ref)) : [...sidebar, { type, ref }]);
    },
    [sidebar, isFavorite, setSidebar],
  );

  const saveTabs = useCallback(
    (t: string[]) => {
      setTabs(t);
      put(`/workspaces/${wsSlug}/layout`, { tabs: t }).catch(() => {});
    },
    [wsSlug],
  );
  const openApp = useCallback(
    (slug: string) => {
      if (!tabs.includes(slug)) saveTabs([...tabs, slug]);
      nav(path('apps/' + slug));
    },
    [tabs, saveTabs, nav, path],
  );
  const pathParts = loc.pathname.split('/');
  const appsIdx = pathParts.indexOf('apps');
  const activeApp = appsIdx >= 0 && pathParts[appsIdx + 1] ? decodeURIComponent(pathParts[appsIdx + 1]) : null;
  const appRoute = activeApp ? parseAppShellPath(loc.pathname, wsSlug, activeApp) : null;
  const focusMode = appRoute?.focus ?? false;
  const registerAppChrome = useCallback((slug: string, chrome: AppChrome | null) => {
    setChromeBySlug((prev) => {
      if (!chrome) {
        if (!(slug in prev)) return prev;
        const { [slug]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [slug]: chrome };
    });
  }, []);
  const appChrome = activeApp ? chromeBySlug[activeApp] ?? null : null;
  useEffect(() => {
    setNavOpen(false);
  }, [loc.pathname]);
  const closeTab = useCallback(
    (slug: string) => {
      const i = tabs.indexOf(slug);
      const next = tabs.filter((t) => t !== slug);
      saveTabs(next);
      if (activeApp === slug) {
        const n = next[Math.min(i, next.length - 1)];
        nav(n ? path('apps/' + n) : path('home'));
      }
    },
    [tabs, saveTabs, activeApp, nav, path],
  );
  // Opening an app by URL adds it to the open tabs (not in focus-only mode).
  useEffect(() => {
    if (focusMode) return;
    if (loaded && activeApp && !tabs.includes(activeApp) && apps.some((a) => a.slug === activeApp && a.kind === 'app')) saveTabs([...tabs, activeApp]);
  }, [loaded, activeApp, tabs, apps, saveTabs, focusMode]);

  const setThemePref = useCallback(
    (t: string) => {
      setPref(t);
      put('/me/prefs', { theme: t }).catch(() => {});
    },
    [setPref],
  );

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  // Frames mount on first activation and then stay alive while the tab is open.
  const [visited, setVisited] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (activeApp && !visited.has(activeApp)) setVisited(new Set(visited).add(activeApp));
  }, [activeApp, visited]);

  if (!ws || !loaded) return <div className="mk" data-theme={theme} />;

  const focusApp = focusMode && activeApp ? apps.find((a) => a.slug === activeApp && a.kind === 'app') : null;

  const ctx: ShellCtx = {
    me, ws, apps, reloadApps, reloadMe, can, sidebar, setSidebar, isFavorite, toggleFavorite, tabs, openApp, closeTab,
    theme, themePref, setThemePref, branding: themeBranding, brandPrimary, go, path, openPalette: () => setPalOpen(true), newApp: () => setNewAppOpen(true),
    appChrome, registerAppChrome,
  };
  const tabApps = tabs.map((s) => apps.find((a) => a.slug === s && a.kind === 'app')).filter(Boolean);

  if (focusMode) {
    return (
      <Ctx.Provider value={ctx}>
        <div className="mk focus" data-theme={theme}>
          <ToastHost>
            <FocusChrome app={focusApp} chrome={appChrome} />
            <div className="mk-main">
              <div className="content">
                {focusApp ? <AppView app={focusApp} active focus /> : <div className="pg"><div className="empty">App not found</div></div>}
              </div>
            </div>
            <Palette open={palOpen} onClose={() => setPalOpen(false)} />
          </ToastHost>
        </div>
      </Ctx.Provider>
    );
  }

  return (
    <Ctx.Provider value={ctx}>
      <div className="mk" data-theme={theme}>
        <ToastHost>
          {navOpen && <button type="button" className="mk-nav-backdrop" aria-label="Close menu" onClick={() => setNavOpen(false)} />}
          <MobileBar onMenu={() => setNavOpen(true)} />
          <Sidebar navOpen={navOpen} onNavClose={() => setNavOpen(false)} tabApps={tabApps} activeApp={activeApp} />
          <div className="mk-main">
            <TopBar tabApps={tabApps} active={activeApp} chrome={appChrome} />
            <div className="content">
              <div className="view" style={{ display: activeApp && !focusMode ? 'none' : undefined }}>
                <Outlet />
              </div>
              {tabApps.filter((a: any) => visited.has(a.slug) || activeApp === a.slug).map((a: any) => (
                <div key={a.slug} style={{ display: activeApp === a.slug && !focusMode ? 'block' : 'none', height: '100%' }}>
                  <AppView app={a} active={activeApp === a.slug} />
                </div>
              ))}
              {activeApp && !focusMode && !tabApps.some((a: any) => a.slug === activeApp) && (
                <div className="pg">
                  <div className="empty">{apps.length ? 'App not found' : ''}</div>
                </div>
              )}
            </div>
          </div>
          <Palette open={palOpen} onClose={() => setPalOpen(false)} />
          <NewAppModal open={newAppOpen} onClose={() => setNewAppOpen(false)} />
        </ToastHost>
      </div>
    </Ctx.Provider>
  );
}

function MobileBar({ onMenu }: { onMenu: () => void }) {
  const { ws, openPalette, theme, setThemePref, path } = useShell();
  return (
    <header className="mk-mob-bar">
      <button type="button" className="ib" title="Menu" onClick={onMenu}>
        <I n="menu" />
      </button>
      <Link className="mk-mob-title" to={path('home')}>
        {ws.name}
      </Link>
      <button type="button" className="ib" title="Search" onClick={openPalette}>
        <I n="search" />
      </button>
      <button type="button" className="ib" title="Toggle theme" onClick={() => setThemePref(theme === 'dark' ? 'light' : 'dark')}>
        <I n={theme === 'dark' ? 'sun' : 'moon'} />
      </button>
      <AccountMenu />
    </header>
  );
}

function AppTabList({ tabApps, active, onPick, className }: { tabApps: any[]; active: string | null; onPick?: () => void; className?: string }) {
  const { closeTab, path, apps, tabs, appChrome, isFavorite, toggleFavorite } = useShell();
  const [addOpen, setAddOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAddOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);
  const avail = apps.filter((a) => a.kind === 'app' && !tabs.includes(a.slug));
  return (
    <div className={className || 'tabs'} ref={ref} role="tablist">
      {tabApps.map((a) => {
        const chrome = active === a.slug && appChrome?.slug === a.slug ? appChrome : null;
        const tab = (
          <ShellLink
            key={a.slug}
            to={path('apps/' + a.slug)}
            className={'tab' + (active === a.slug ? ' on' : '')}
            role="tab"
            onPlainClick={() => onPick?.()}
            onAuxClick={(e) => {
              if (e.button !== 1) return;
              e.preventDefault();
              closeTab(a.slug);
            }}
          >
            <span className="ai" style={{ background: a.color }}>
              {a.name[0]}
            </span>
            <span className="lbl">{a.name}</span>
            <span
              className="x"
              title="Close tab"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeTab(a.slug);
              }}
            >
              <I n="x" />
            </span>
          </ShellLink>
        );
        if (!chrome) return tab;
        const fav = isFavorite('app', a.slug);
        return (
          <Dropdown
            key={a.slug}
            trigger={['contextMenu']}
            menu={{ items: appMenuItems(chrome, { fav, onPin: () => toggleFavorite('app', a.slug), inFocus: false }) }}
          >
            {tab}
          </Dropdown>
        );
      })}
      <button className="ib" title="Open app" onClick={() => setAddOpen(!addOpen)}>
        <I n="plus" />
      </button>
      <div className={'pop' + (addOpen ? ' open' : '')} style={{ left: 8, top: '100%', marginTop: 4 }}>
        <div className="pal-g" style={{ padding: '6px 8px 4px' }}>Open an app</div>
        {avail.length ? (
          avail.map((a) => (
            <ShellLink
              key={a.slug}
              to={path('apps/' + a.slug)}
              className="mi"
              onPlainClick={() => {
                setAddOpen(false);
                onPick?.();
              }}
            >
              <AppIcon app={a} size={20} radius={6} font={9.5} />
              {a.name}
            </ShellLink>
          ))
        ) : (
          <div className="mi" style={{ cursor: 'default' }}>All apps are open</div>
        )}
        <div style={{ borderTop: '1px solid var(--bd)', margin: '5px 0' }} />
        <ShellLink className="mi" to={path('catalog')} onPlainClick={() => { setAddOpen(false); onPick?.(); }}>
          <I n="grid" />
          Browse catalog
        </ShellLink>
      </div>
    </div>
  );
}

function NavItem({ item, on, to, edit, dragProps, onRemove, onPlainClick }: { item: any; on: boolean; to?: string; edit?: boolean; dragProps?: any; onRemove?: () => void; onPlainClick?: () => void }) {
  const body = (
    <>
      {edit && (
        <span className="grip">
          <I n="grip" />
        </span>
      )}
      {item.icon}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
      {edit ? (
        <span
          className="rm"
          title="Remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
        >
          <I n="x" />
        </span>
      ) : item.cnt != null ? (
        <span className="cnt">{item.cnt}</span>
      ) : null}
    </>
  );
  if (edit || !to) {
    return (
      <div className={'nv' + (on ? ' on' : '')} {...dragProps}>
        {body}
      </div>
    );
  }
  return (
    <ShellLink className={'nv' + (on ? ' on' : '')} to={to} onPlainClick={onPlainClick} {...dragProps}>
      {body}
    </ShellLink>
  );
}

function Sidebar({ navOpen, onNavClose, tabApps, activeApp }: { navOpen?: boolean; onNavClose?: () => void; tabApps?: any[]; activeApp?: string | null }) {
  const { ws, me, apps, sidebar, setSidebar, can, path } = useShell();
  const loc = useLocation();
  const toast = useToast();
  const [menu, setMenu] = useState(false);
  const [edit, setEdit] = useState(false);
  const [adding, setAdding] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [wsName, setWsName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(false);
        setAdding(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const cur = loc.pathname.split('/').slice(3);
  const isOn = (it: SidebarItem) => (it.type === 'page' ? cur[0] === it.ref : cur[0] === 'apps' && cur[1] === it.ref);
  const counts: Record<string, number | undefined> = { catalog: apps.length, users: ws.members, groups: ws.groups };
  const render = (it: SidebarItem) => {
    if (it.type === 'page') {
      const p = PAGES[it.ref];
      if (!p || (p.perm && !can(p.perm))) return null;
      return { label: p.label, icon: <I n={p.icon} />, cnt: counts[it.ref], to: path(it.ref) };
    }
    const a = apps.find((x) => x.slug === it.ref);
    if (!a) return null;
    return {
      label: a.name,
      icon: <AppIcon app={a} size={16} radius={5} font={9} />,
      to: a.kind === 'app' ? path('apps/' + a.slug) : path('catalog/' + a.slug),
    };
  };
  const drop = (to: number) => {
    if (drag == null || drag === to) return;
    const next = [...sidebar];
    const [m] = next.splice(drag, 1);
    next.splice(to > drag ? to - 1 : to, 0, m);
    setSidebar(next);
  };
  const candidates = [
    ...Object.entries(PAGES)
      .filter(([k, p]) => ['home', 'shared', 'catalog'].includes(k) && !sidebar.some((s) => s.type === 'page' && s.ref === k) && (!p.perm || can(p.perm)))
      .map(([k, p]) => ({ type: 'page' as const, ref: k, label: p.label, icon: <I n={p.icon} /> })),
    ...apps
      .filter((a) => !sidebar.some((s) => s.type === 'app' && s.ref === a.slug))
      .map((a) => ({ type: 'app' as const, ref: a.slug, label: a.name, icon: <AppIcon app={a} size={20} radius={6} font={9.5} /> })),
  ];
  const admin = (['users', 'groups', 'roles', 'data', 'events', 'audit'] as const).filter((k) => !PAGES[k].perm || can(PAGES[k].perm!));
  const logo = (name: string) => (name.split(' ').slice(-1)[0] || name)[0]?.toUpperCase();
  const instLogo = (me.branding?.logo_url || '').trim();
  const wsIcon = (ws.branding?.icon_url || '').trim();
  const switchLogo = wsIcon || instLogo;

  const createWs = async () => {
    try {
      const w = await post('/workspaces', { name: wsName });
      setCreating(false);
      setWsName('');
      location.href = `/w/${w.slug}/home`;
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const closeNav = () => onNavClose?.();

  return (
    <aside className={'mk-side' + (navOpen ? ' nav-open' : '')} ref={menuRef}>
      {tabApps != null && (
        <div className="mob-tabs">
          <div className="sec" style={{ paddingTop: 0 }}>Open apps</div>
          <AppTabList tabApps={tabApps} active={activeApp || null} onPick={closeNav} className="tabs mob-tab-list" />
        </div>
      )}
      <button className="ws" onClick={() => setMenu(!menu)}>
        <span className="logo">{switchLogo ? <img src={switchLogo} alt="" width={22} height={22} style={{ borderRadius: 5, objectFit: 'cover' }} /> : logo(ws.name)}</span>
        <span>
          <div className="nm">{ws.name}</div>
          <div className="sb">
            {ws.org} · {ws.members} members
          </div>
        </span>
        <span className="chev">
          <I n="updown" />
        </span>
      </button>
      <div className={'ws-menu pop' + (menu ? ' open' : '')}>
        <div className="h">Workspaces</div>
        {me.workspaces.map((w) =>
          w.slug === ws.slug ? (
            <button key={w.id} type="button" className="mi" onClick={() => setMenu(false)}>
              <span className="logo" style={{ width: 20, height: 20, borderRadius: 6, background: 'linear-gradient(135deg,#10b981,#047857)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700 }}>
                {logo(w.name)}
              </span>
              {w.name}
              <span className="ck">
                <I n="check" />
              </span>
            </button>
          ) : (
            <ShellLink
              key={w.id}
              className="mi"
              to={`/w/${w.slug}/home`}
              onPlainClick={() => setMenu(false)}
            >
              <span className="logo" style={{ width: 20, height: 20, borderRadius: 6, background: 'linear-gradient(135deg,#10b981,#047857)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700 }}>
                {logo(w.name)}
              </span>
              {w.name}
            </ShellLink>
          ),
        )}
        {me.can_create_workspace && (
          <>
            <div style={{ borderTop: '1px solid var(--bd)', margin: '5px 0' }} />
            <button
              className="mi"
              onClick={() => {
                setMenu(false);
                setCreating(true);
              }}
            >
              <I n="plus" />
              Create workspace
            </button>
          </>
        )}
      </div>
      <nav className="nav">
        <div className="sec" style={{ paddingTop: 4 }}>
          <span>Favorites</span>
          <span style={{ display: 'flex', gap: 2 }}>
            <button className={'ib' + (adding ? ' on' : '')} title="Add to sidebar" onClick={() => setAdding(!adding)}>
              <I n="plus" />
            </button>
            <button className={'ib' + (edit ? ' on' : '')} title={edit ? 'Done' : 'Edit sidebar'} onClick={() => setEdit(!edit)}>
              <I n={edit ? 'check' : 'edit'} />
            </button>
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          {sidebar.map((it, i) => {
            const r = render(it);
            if (!r) return null;
            return (
              <div key={it.type + it.ref} className={over === i && drag != null ? 'over-wrap' : ''}>
                <NavItem
                  item={r}
                  on={!edit && isOn(it)}
                  edit={edit}
                  to={edit ? undefined : r.to}
                  onPlainClick={edit ? undefined : closeNav}
                  onRemove={() => setSidebar(sidebar.filter((_, j) => j !== i))}
                  dragProps={
                    edit
                      ? {
                          draggable: true,
                          onDragStart: (e: any) => {
                            setDrag(i);
                            e.dataTransfer.effectAllowed = 'move';
                          },
                          onDragOver: (e: any) => {
                            e.preventDefault();
                            setOver(i);
                          },
                          onDrop: (e: any) => {
                            e.preventDefault();
                            drop(i);
                            setDrag(null);
                            setOver(null);
                          },
                          onDragEnd: () => {
                            setDrag(null);
                            setOver(null);
                          },
                          style: { boxShadow: over === i && drag != null && drag !== i ? 'inset 0 2px 0 var(--ac)' : undefined, opacity: drag === i ? 0.4 : 1 },
                        }
                      : {}
                  }
                />
              </div>
            );
          })}
          {edit && (
            <div
              className="nv add"
              onDragOver={(e) => {
                e.preventDefault();
                setOver(sidebar.length);
              }}
              onDrop={(e) => {
                e.preventDefault();
                drop(sidebar.length);
                setDrag(null);
                setOver(null);
              }}
              onClick={() => setAdding(true)}
              style={{ boxShadow: over === sidebar.length && drag != null ? 'inset 0 2px 0 var(--ac)' : undefined }}
            >
              <I n="plus" />
              <span>Add</span>
            </div>
          )}
          <div className={'pop' + (adding ? ' open' : '')} style={{ left: 0, right: 0, top: '100%', marginTop: 4, maxHeight: 320, overflow: 'auto' }}>
            {candidates.length ? (
              candidates.map((c) => (
                <button
                  key={c.type + c.ref}
                  className="mi"
                  onClick={() => {
                    setSidebar([...sidebar, { type: c.type, ref: c.ref }]);
                    setAdding(false);
                    toast(`${c.label} added to sidebar`);
                  }}
                >
                  {c.icon}
                  {c.label}
                </button>
              ))
            ) : (
              <div className="mi" style={{ cursor: 'default' }}>
                Everything is in your sidebar
              </div>
            )}
          </div>
        </div>
        {admin.length > 0 && <div className="sec">Admin</div>}
        {admin.map((k) => (
          <NavItem key={k} item={{ label: PAGES[k].label, icon: <I n={PAGES[k].icon} />, cnt: counts[k] }} on={cur[0] === k} to={path(k)} onPlainClick={closeNav} />
        ))}
        <div className="sec">Account</div>
        <NavItem item={{ label: 'Settings', icon: <I n="sliders" /> }} on={cur[0] === 'settings'} to={path('settings')} onPlainClick={closeNav} />
      </nav>
      <div className="side-foot">
        <span className="dot" />
        All systems normal
      </div>
      <Modal title="Create workspace" open={creating} onCancel={() => setCreating(false)} onOk={createWs} okText="Create" okButtonProps={{ disabled: !wsName.trim() }}>
        <Input autoFocus placeholder="e.g. Acme Marketing" value={wsName} onChange={(e) => setWsName(e.target.value)} onPressEnter={createWs} />
      </Modal>
    </aside>
  );
}

// TopBar is the desktop header. At 768px and below it is hidden and MobileBar
// carries the same search, theme toggle and account menu, so each shows once.
function TopBar({ tabApps, active, chrome }: { tabApps: any[]; active: string | null; chrome: AppChrome | null }) {
  const { theme, setThemePref, openPalette, isFavorite, toggleFavorite } = useShell();
  const activeApp = active && chrome?.slug === active ? chrome : null;
  const fav = activeApp ? isFavorite('app', activeApp.slug) : false;
  return (
    <div className="top">
      <AppTabList tabApps={tabApps} active={active} className="tabs top-tabs" />
      {activeApp && (
        <AppMenuButton
          chrome={activeApp}
          fav={fav}
          onPin={() => toggleFavorite('app', activeApp.slug)}
          inFocus={false}
          title={`${activeApp.name} actions`}
        />
      )}
      <button className="search" onClick={openPalette}>
        <I n="search" />
        <span>Search or jump to…</span>
        <kbd>{isMac ? '⌘K' : 'Ctrl K'}</kbd>
      </button>
      <button className="ib" title="Toggle theme" onClick={() => setThemePref(theme === 'dark' ? 'light' : 'dark')}>
        <I n={theme === 'dark' ? 'sun' : 'moon'} />
      </button>
      <AccountMenu />
    </div>
  );
}

function FocusChrome({ app, chrome }: { app: any | null | undefined; chrome: AppChrome | null }) {
  const { ws, path, isFavorite, toggleFavorite } = useShell();
  const nav = useNavigate();
  const exitHref = app && chrome ? chrome.shellHref : app ? buildAppShellPath(ws.slug, app.slug, '/', false) : path('home');
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (document.querySelector('.ov.open')) return;
      if (e.target instanceof HTMLElement && (e.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName))) return;
      nav(exitHref);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [exitHref, nav]);
  if (!app) return null;
  const fav = isFavorite('app', app.slug);
  return (
    <div className="focus-chrome">
      <a className="focus-exit" href={exitHref} title="Exit focus (Esc)">
        <I n="x" />
        <span>Exit focus</span>
      </a>
      {chrome && (
        <AppMenuButton
          chrome={chrome}
          fav={fav}
          onPin={() => toggleFavorite('app', app.slug)}
          inFocus
          className="ib focus-more"
          title={`${chrome.name} actions`}
        />
      )}
    </div>
  );
}

function AccountMenu() {
  const { me, path } = useShell();
  const logout = async () => {
    await post('/auth/logout').catch(() => {});
    location.href = '/login';
  };
  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      menu={{
        items: [
          { key: 'who', label: <div style={{ lineHeight: 1.3 }}><b>{me.user.name}</b><div style={{ fontSize: 12, opacity: 0.6 }}>{me.user.email}</div></div>, disabled: true },
          { type: 'divider' },
          { key: 'settings', label: <Link to={path('settings')}>Settings</Link> },
          { key: 'logout', label: 'Sign out', onClick: logout },
        ],
      }}
    >
      <button className="av" title={me.user.name}>
        {me.user.name
          .split(' ')
          .map((x: string) => x[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()}
      </button>
    </Dropdown>
  );
}

function NewAppModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { ws } = useShell();
  const origin = location.origin;
  return (
    <Modal title="New app" open={open} onCancel={onClose} footer={null} width={520}>
      <p className="mini" style={{ marginTop: 0 }}>
        Scaffold locally or with your coding agent, then publish from git or the CLI.
      </p>
      <div className="fld" style={{ marginBottom: 10 }}>
        <label>CLI</label>
        <CliLine text={`meadow init my-app && cd my-app && meadow publish --workspace ${ws.slug}`} />
      </div>
      <div className="fld" style={{ marginBottom: 10 }}>
        <label>MCP server</label>
        <CliLine text={`meadow mcp --url ${origin}`} />
      </div>
      <div className="fld">
        <label>Git push-to-deploy</label>
        <CliLine text={`${origin}/hooks/git`} />
      </div>
    </Modal>
  );
}

function CliLine({ text }: { text: string }) {
  const toast = useToast();
  return (
    <div className="cli">
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
      <button
        title="Copy"
        onClick={() => {
          navigator.clipboard?.writeText(text);
          toast('Copied to clipboard');
        }}
      >
        <I n="copy" />
      </button>
    </div>
  );
}

export { del };
