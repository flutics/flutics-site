import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { I } from './icons';

export const PALETTE = ['#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#64748b'];

export const initials = (n: string) =>
  (n || '?')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .map((x) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const abbr = (name: string) => {
  const w = (name || '').split(/\s+/).filter(Boolean);
  return (w.length > 1 ? w[0][0] + w[1][0] : (w[0] || '?').slice(0, 2)).toUpperCase();
};

export const colorFor = (s: string) => {
  let h = 0;
  for (const c of s || '') h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
};

export function ago(ts?: string | null) {
  if (!ts) return '—';
  const d = new Date(ts).getTime();
  const s = Math.round((Date.now() - d) / 1000);
  if (s < 60) return 'Just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round(h / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return fmtDate(ts);
}

export const fmtDate = (ts?: string | null) =>
  ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export function Person({ name, i = -1 }: { name: string; i?: number }) {
  return (
    <div className="person">
      <span className="pa" style={{ background: i >= 0 ? PALETTE[i % PALETTE.length] : colorFor(name) }}>
        {initials(name)}
      </span>
      <b style={{ fontWeight: 550 }}>{name}</b>
    </div>
  );
}

export function AppIcon({ app, size = 34, radius = 9, font = 13 }: { app: { name: string; color?: string }; size?: number; radius?: number; font?: number }) {
  return (
    <span className="aico" style={{ background: app.color || colorFor(app.name), width: size, height: size, borderRadius: radius, fontSize: font }}>
      {abbr(app.name)}
    </span>
  );
}

export const VIS_TAG: Record<string, string> = { public: 'g', protected: 'a', private: '' };
export const STATUS_TAG: Record<string, string> = { approved: 'g', pending: 'a', revoked: 'r', denied: 'r' };

export function Vis({ v }: { v: string }) {
  return <span className={'tg ' + (VIS_TAG[v] ?? '')}>{v}</span>;
}

/* ---- toast (matches the mockup's pill) ---- */
type ToastCtx = (msg: string, kind?: 'success' | 'error') => void;
const TCtx = createContext<ToastCtx>(() => {});
export const useToast = () => useContext(TCtx);

export function ToastHost({ children }: { children: ReactNode }) {
  const [t, setT] = useState<{ msg: string; kind: string; show: boolean }>({ msg: '', kind: 'success', show: false });
  const h = useRef<any>();
  const show = useCallback<ToastCtx>((msg, kind = 'success') => {
    setT({ msg, kind, show: true });
    clearTimeout(h.current);
    h.current = setTimeout(() => setT((x) => ({ ...x, show: false })), kind === 'error' ? 3800 : 2200);
  }, []);
  return (
    <TCtx.Provider value={show}>
      {children}
      <div className={'toast' + (t.show ? ' show' : '')} role="status">
        {t.kind === 'error' ? <I n="x" style={{ color: '#f87171' }} /> : <I n="check" style={{ color: '#34d399' }} />}
        {t.msg}
      </div>
    </TCtx.Provider>
  );
}

export function copy(text: string) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text);
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  ta.remove();
  return Promise.resolve();
}

export function Cli({ text }: { text: string }) {
  const toast = useToast();
  return (
    <div className="cli">
      <span>{text}</span>
      <button title="Copy" onClick={() => copy(text).then(() => toast('Copied to clipboard'))}>
        <I n="copy" />
      </button>
    </div>
  );
}

export function PageH({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="pg-h">
      <div>
        <h1>{title}</h1>
        {sub ? <p>{sub}</p> : null}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>{right}</div>
    </div>
  );
}

export function Seg<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {options.map(([v, l]) => (
        <button key={v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>
          {l}
        </button>
      ))}
    </div>
  );
}

export function Switch({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return <button className={'sw' + (on ? ' on' : '')} disabled={disabled} onClick={() => onChange(!on)} role="switch" aria-checked={on} />;
}
