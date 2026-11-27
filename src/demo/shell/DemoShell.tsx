import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Brand } from '../../brand/Logo';
import { LOGIN_URL } from '../../config';
import './demo-shell.css';

const WORKSPACES = ['Alder Light', 'Alder Wholesale'];
const PAGES = ['Home', 'Catalog', 'Shared with me'];
const APPS = [
  { name: 'Sales CRM', short: 'SC', color: 'var(--fl-blue)' },
  { name: 'Inventory', short: 'IN', color: '#0f6e63' },
  { name: 'Billing', short: 'BI', color: '#8a2f6b' },
];

const isMac = /Mac|iPhone|iPad/.test(navigator.platform);

/** Skeleton of the Flutics workspace shell. `children` is the Sales CRM app; the rest is placeholder. */
export function DemoShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(APPS[0].name);
  const [workspace, setWorkspace] = useState(WORKSPACES[0]);
  const [navOpen, setNavOpen] = useState(false);
  const switcher = useRef<HTMLDetailsElement>(null);

  const side = useRef<HTMLElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLButtonElement>(null);

  const closeSwitcher = () => {
    const el = switcher.current;
    if (el?.contains(document.activeElement)) el.querySelector('summary')?.focus();
    el?.removeAttribute('open');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      closeSwitcher();
      setNavOpen(false);
    };
    // The drawer only exists on narrow screens; widening the window closes it.
    const wide = matchMedia('(min-width: 769px)');
    const onWide = () => wide.matches && setNavOpen(false);
    window.addEventListener('keydown', onKey);
    wide.addEventListener('change', onWide);
    return () => {
      window.removeEventListener('keydown', onKey);
      wide.removeEventListener('change', onWide);
    };
  }, []);

  // While the drawer is open, focus stays in it; closing returns focus to the menu button.
  useEffect(() => {
    if (!navOpen) return;
    const content = body.current!;
    content.inert = true;
    side.current!.querySelector('summary')!.focus();
    return () => {
      content.inert = false;
      menu.current?.focus();
    };
  }, [navOpen]);

  const item = (name: string, icon?: ReactNode) => (
    <button
      key={name}
      type="button"
      className="sh-item"
      aria-current={open === name ? 'page' : undefined}
      onClick={() => {
        setOpen(name);
        setNavOpen(false);
      }}
    >
      {icon}
      {name}
    </button>
  );
  const icon = (a: (typeof APPS)[number]) => (
    <span className="sh-icon" style={{ background: a.color }} aria-hidden="true">
      {a.short}
    </span>
  );
  const app = APPS.find((a) => a.name === open);

  return (
    <div className="sh">
      {navOpen && <button type="button" className="sh-backdrop" aria-label="Close menu" onClick={() => setNavOpen(false)} />}
      <aside id="sh-side" ref={side} className={navOpen ? 'sh-side open' : 'sh-side'}>
        <details className="sh-ws" ref={switcher}>
          <summary>
            <span className="sh-icon ws" aria-hidden="true">
              {workspace[0]}
            </span>
            <span className="sh-ws-name">
              <strong>{workspace}</strong>
              <small>Alder Light Co.</small>
            </span>
          </summary>
          <div className="sh-ws-menu">
            {WORKSPACES.map((w) => (
              <button
                key={w}
                type="button"
                className="sh-item"
                aria-pressed={w === workspace}
                onClick={() => {
                  setWorkspace(w);
                  closeSwitcher();
                }}
              >
                {w}
              </button>
            ))}
          </div>
        </details>
        <nav aria-label="Workspace">
          {PAGES.map((p) => item(p))}
          <h2>Pinned apps</h2>
          {APPS.map((a) => item(a.name, icon(a)))}
        </nav>
        <div className="sh-foot">
          <Link to="/" aria-label="Flutics home">
            <Brand height={24} />
          </Link>
          <a href={LOGIN_URL}>Get started</a>
        </div>
      </aside>

      <div className="sh-body" ref={body}>
        <header className="sh-top">
          <button
            ref={menu}
            type="button"
            className="sh-menu"
            aria-label="Menu"
            aria-expanded={navOpen}
            aria-controls="sh-side"
            onClick={() => setNavOpen(true)}
          >
            <span />
          </button>
          <div className="sh-tab">
            {app && icon(app)}
            {open}
          </div>
          {/* Hint only; the command palette is not part of the skeleton. */}
          <div className="sh-search">
            <span>Search or jump to…</span>
            <kbd>{isMac ? '⌘K' : 'Ctrl K'}</kbd>
          </div>
          <span className="sh-avatar" role="img" aria-label="Signed in as Elena Walsh (fictional)">
            EW
          </span>
        </header>
        <main className="sh-main">
          {/* Hidden, not unmounted, so an unsaved row form survives switching apps. */}
          <div hidden={open !== APPS[0].name}>{children}</div>
          {open !== APPS[0].name && (
            <div className="sh-empty">
              <h1>{open}</h1>
              <p>Placeholder for a later stage.</p>
              {item(APPS[0].name, icon(APPS[0]))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
