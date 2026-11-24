import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function Tag({ tone = '', children }: { tone?: string; children: ReactNode }) {
  return <span className={`tag ${tone}`.trim()}>{children}</span>;
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="stat">
      <div className="lbl">{label}</div>
      <div className="val">{value}</div>
      {sub ? <div className="sub">{sub}</div> : null}
    </div>
  );
}

export function PageHead({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="ph">
      <h1>{title}</h1>
      {actions}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="muted" style={{ padding: 24 }}>{children}</p>;
}

export function Err({ children }: { children: ReactNode }) {
  return <p className="err">{children}</p>;
}

export function Back({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="muted" style={{ display: 'inline-block', marginBottom: 12 }}>
      ← {label}
    </Link>
  );
}
