import { useEffect, useState } from 'react';
import { get } from '../api';
import { I } from '../icons';
import { PageH, ago } from '../util';

type SharedApp = {
  app_id: string;
  slug: string;
  name: string;
  kind: string;
  color?: string;
  version?: string;
  folder_path?: string;
  level: string;
  via_name: string;
  workspace: string;
  url: string;
};

export function Shared() {
  const [items, setItems] = useState<SharedApp[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    get('/me/shared')
      .then((x) => setItems(x || []))
      .catch((e) => setError(e.message));
  }, []);
  return (
    <div className="pg">
      <PageH title="Shared with me" sub="Apps other people shared with you" />
      {error && <div className="mini">{error}</div>}
      <div className="cards">
        {items.map((s) => (
          <div className="ac" key={s.app_id}>
            <div className="row1">
              <span className="ai" style={{ background: s.color || '#64748b' }}>
                {s.name?.[0]?.toUpperCase()}
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="t">{s.name}</div>
                <div className="o">
                  {s.workspace} · shared by {s.via_name}
                  {s.folder_path ? ` · ${s.folder_path}` : ''}
                </div>
              </div>
            </div>
            <div className="d">
              <span className="tg b">{s.level}</span> Open and run, bounded by the app's own RLS. No publish, delete or move.
            </div>
            <div className="f">
              <span className="v">v{s.version || ''}</span>
              {s.url ? (
                <a className="btn sm" href={s.url}>
                  <I n="ext" />
                  Open
                </a>
              ) : null}
            </div>
          </div>
        ))}
        {!items.length && !error && <div className="empty" style={{ gridColumn: '1/-1' }}>Nothing has been shared with you yet.</div>}
      </div>
      {items.length > 0 && (
        <div className="mini" style={{ marginTop: 12 }}>
          Last checked {ago(new Date().toISOString())}
        </div>
      )}
    </div>
  );
}
