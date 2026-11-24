import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { post } from './api';
import { I } from './icons';
import { PAGES, useShell } from './shell';
import { AppIcon } from './util';
import { isModifiedClick } from './navclick';

type Item = { g: string; l: string; h: string; ico: any; to?: string; run?: () => void };

export function Palette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { apps, me, ws, can, theme, setThemePref, path, isFavorite, toggleFavorite, newApp, appChrome } = useShell();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const cur = location.pathname.split('/');
  const currentApp = cur[3] === 'apps' ? apps.find((a) => a.slug === cur[4]) : null;
  const inFocus = cur.includes('focus');
  const chrome = currentApp && appChrome?.slug === currentApp.slug ? appChrome : null;

  useEffect(() => {
    if (open) {
      setQ('');
      setSel(0);
      setTimeout(() => input.current?.focus(), 0);
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const it: Item[] = [];
    apps.forEach((a) =>
      it.push({
        g: 'Apps',
        l: a.name,
        h: a.kind === 'dataset' ? 'Dataset' : a.category || a.owner_name,
        ico: <AppIcon app={a} size={20} radius={6} font={9.5} />,
        to: a.kind === 'app' ? path('apps/' + a.slug) : path('catalog/' + a.slug),
      }),
    );
    const pages: [string, string][] = [['home', 'Home'], ['catalog', 'Catalog'], ['data', 'Data'], ['users', 'Users'], ['groups', 'Groups'], ['roles', 'Roles & permissions'], ['settings', 'Settings']];
    pages.forEach(([k, l]) => {
      const p = PAGES[k];
      if (!p.perm || can(p.perm)) it.push({ g: 'Pages', l, h: 'Go to', ico: <I n={p.icon} />, to: path(k) });
    });
    it.push({ g: 'Actions', l: theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode', h: 'Theme', ico: <I n={theme === 'dark' ? 'sun' : 'moon'} />, run: () => setThemePref(theme === 'dark' ? 'light' : 'dark') });
    if (currentApp)
      it.push({
        g: 'Actions', l: (isFavorite('app', currentApp.slug) ? 'Unpin ' : 'Pin ') + currentApp.name, h: 'Sidebar', ico: <I n="pin" />,
        run: () => toggleFavorite('app', currentApp.slug),
      });
    if (chrome) {
      it.push({ g: 'Actions', l: 'Reload ' + chrome.name, h: `v${chrome.version}`, ico: <I n="sync" />, run: () => chrome.reload() });
      it.push({ g: 'Actions', l: 'Manifest · ' + chrome.name, h: 'App', ico: <I n="code" />, run: () => chrome.openManifest() });
      if (inFocus)
        it.push({ g: 'Actions', l: 'Exit focus mode', h: chrome.name, ico: <I n="arrow" />, to: chrome.shellHref });
      else
        it.push({ g: 'Actions', l: 'Open ' + chrome.name + ' in focus mode', h: 'New tab', ico: <I n="ext" />, to: chrome.focusHref });
    }
    if (can('apps:create')) it.push({ g: 'Actions', l: 'New app', h: 'Create', ico: <I n="plus" />, run: newApp });
    it.push({ g: 'Actions', l: 'Create API token', h: 'Settings', ico: <I n="key" />, to: path('settings/tokens') });
    if (can('workspaces:update')) it.push({ g: 'Actions', l: 'Configure SSO & SCIM', h: 'Settings', ico: <I n="shield" />, to: path('settings/sso') });
    me.workspaces
      .filter((w) => w.slug !== ws.slug)
      .forEach((w) => it.push({ g: 'Actions', l: 'Switch to ' + w.name, h: 'Workspace', ico: <I n="updown" />, to: `/w/${w.slug}/home` }));
    it.push({
      g: 'Actions', l: 'Sign out', h: 'Account', ico: <I n="logout" />,
      run: async () => {
        await post('/auth/logout').catch(() => {});
        location.href = '/login';
      },
    });
    return it;
  }, [apps, me, ws, can, theme, setThemePref, path, currentApp, inFocus, chrome, isFavorite, toggleFavorite, newApp]);

  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const shown = items.filter((x) => words.every((w) => (x.l + ' ' + x.g + ' ' + x.h).toLowerCase().includes(w)));
  const s = Math.min(sel, Math.max(0, shown.length - 1));

  useEffect(() => {
    list.current?.querySelector('.pal-it.on')?.scrollIntoView({ block: 'nearest' });
  }, [s, q]);

  const activate = (x?: Item, newTab = false) => {
    if (!x) return;
    onClose();
    if (x.to) {
      if (newTab) window.open(x.to, '_blank', 'noopener');
      else nav(x.to);
    } else x.run?.();
  };

  const openSelected = (newTab: boolean) => {
    const x = shown[s];
    if (!x) return;
    if (newTab && x.to) {
      onClose();
      window.open(x.to, '_blank', 'noopener');
      return;
    }
    if (x.to && !newTab) {
      activate(x, false);
      return;
    }
    activate(x, false);
  };

  let g = '';
  return (
    <div className={'ov' + (open ? ' open' : '')} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pal" role="dialog" aria-label="Command palette">
        <div className="pal-in">
          <I n="search" />
          <input
            ref={input}
            placeholder="Search apps, pages and actions…"
            autoComplete="off"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSel(Math.min(s + 1, shown.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSel(Math.max(s - 1, 0));
              } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                openSelected(true);
              } else if (e.key === 'Enter') {
                e.preventDefault();
                openSelected(false);
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="pal-l" ref={list}>
          {shown.length === 0 ? (
            <div className="pal-empty">No results for “{q}”</div>
          ) : (
            shown.map((x, i) => {
              const head = x.g !== g ? (g = x.g) : null;
              const inner = (
                <>
                  {x.ico}
                  <span>{x.l}</span>
                  <span className="hint">{x.h}</span>
                </>
              );
              return (
                <div key={x.g + x.l}>
                  {head && <div className="pal-g">{head}</div>}
                  {x.to ? (
                    <a
                      href={x.to}
                      className={'pal-it' + (i === s ? ' on' : '')}
                      onMouseMove={() => i !== s && setSel(i)}
                      onClick={(e) => {
                        if (isModifiedClick(e)) return;
                        e.preventDefault();
                        activate(x, false);
                      }}
                    >
                      {inner}
                    </a>
                  ) : (
                    <div className={'pal-it' + (i === s ? ' on' : '')} onMouseMove={() => i !== s && setSel(i)} onClick={() => activate(x, false)}>
                      {inner}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className="pal-f">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span>
            <kbd>{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}</kbd> <kbd>↵</kbd> new tab
          </span>
          <span>
            <kbd>Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
