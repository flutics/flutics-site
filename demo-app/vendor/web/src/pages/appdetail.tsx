import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShellLink } from '../shelllink';
import { Drawer, Modal, Popconfirm, Select } from 'antd';
import { del, get, post } from '../api';
import { I } from '../icons';
import { useShell } from '../shell';
import { AppIcon, STATUS_TAG, Vis, ago, copy, fmtDate, useToast } from '../util';

export function useAppDetail(slug: string | undefined, enabled = true) {
  const { ws } = useShell();
  const [app, setApp] = useState<any>(null);
  const [grants, setGrants] = useState<Record<string, any>>({});
  const [err, setErr] = useState('');
  const load = useCallback(async () => {
    if (!slug) return;
    try {
      const [a, g] = await Promise.all([get(`/workspaces/${ws.slug}/apps/${slug}`), get(`/workspaces/${ws.slug}/grants`).catch(() => [])]);
      setApp(a);
      setGrants(Object.fromEntries(g.map((x: any) => [x.id, x])));
    } catch (e: any) {
      setErr(e.message);
    }
  }, [ws.slug, slug]);
  useEffect(() => {
    if (enabled) load();
  }, [load, enabled]);
  return { app, grants, err, reload: load };
}

export function ShareModal({ app, exportName, open, onClose, onDone }: { app: any; exportName: string; open: boolean; onClose: () => void; onDone: () => void }) {
  const { ws, me, apps } = useShell();
  const toast = useToast();
  const [target, setTarget] = useState<string>();
  const options = [
    { label: 'Apps', options: apps.filter((a) => a.slug !== app.slug && a.kind === 'app').map((a) => ({ value: 'app:' + a.slug, label: a.name })) },
    { label: 'Workspaces', options: me.workspaces.filter((w) => w.slug !== ws.slug).map((w) => ({ value: 'workspace:' + w.slug, label: w.name })) },
  ];
  const share = async () => {
    try {
      await post(`/workspaces/${ws.slug}/grants`, { app: app.slug, export: exportName, target });
      toast(`${exportName} shared`);
      onDone();
      onClose();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  return (
    <Modal title={`Share ${app.slug}.${exportName}`} open={open} onCancel={onClose} onOk={share} okText="Share" okButtonProps={{ disabled: !target }} destroyOnClose>
      <p className="mini" style={{ marginTop: 0 }}>
        The target gets read access through the export contract. End-user row-level security still applies.
      </p>
      <Select style={{ width: '100%' }} placeholder="App or workspace" options={options} value={target} onChange={setTarget} showSearch />
    </Modal>
  );
}

export function GrantRow({ g, canDecide, onChange }: { g: any; canDecide: boolean; onChange: () => void }) {
  const { ws } = useShell();
  const toast = useToast();
  const decide = async (status: string) => {
    try {
      await post(`/workspaces/${ws.slug}/grants/${g.id}`, { status });
      toast(status === 'approved' ? 'Grant approved' : 'Grant revoked');
      onChange();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  return (
    <div className="grant">
      <span className="tg">{g.target_type}</span>
      <span className="who">{g.target_name || g.target}</span>
      <span className={'tg ' + (STATUS_TAG[g.status] ?? '')}>{g.status}</span>
      <span className="mini">{g.source === 'manifest' ? 'share_with' : g.source}</span>
      {canDecide && (
        <span className="acts">
          {g.status !== 'approved' && (
            <button className="btn sm" onClick={() => decide('approved')}>
              Approve
            </button>
          )}
          {g.status !== 'revoked' && (
            <button className="btn sm gh" style={{ color: 'var(--red)' }} onClick={() => decide('revoked')}>
              Revoke
            </button>
          )}
        </span>
      )}
    </div>
  );
}

function Sharing({ app, grants, reload }: { app: any; grants: Record<string, any>; reload: () => void }) {
  const [share, setShare] = useState<string | null>(null);
  return (
    <>
      <div className="sect-h">Exports</div>
      {app.exports.length === 0 ? (
        <div className="mini">This {app.kind} shares nothing. Tables are private unless exported.</div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>Export</th>
              <th>Kind</th>
              <th>Visibility</th>
              <th>Grants</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {app.exports.map((e: any) => (
              <tr key={e.name}>
                <td>
                  <span className="mono">{e.name}</span>
                  {e.description && <div className="mini">{e.description}</div>}
                  {e.columns?.length > 0 && <div className="mini mono">{e.columns.map((c: any) => c.name).join(', ')}</div>}
                </td>
                <td>{e.kind}</td>
                <td>
                  <Vis v={e.visibility} />
                </td>
                <td style={{ whiteSpace: 'normal', minWidth: 260 }}>
                  {e.visibility === 'public' && <div className="mini" style={{ marginBottom: e.grants.length ? 6 : 0 }}>Any app in this workspace</div>}
                  {e.visibility === 'private' && <div className="mini">Owning app only</div>}
                  <div className="grant-list">
                    {e.grants.map((g: any) => (
                      <GrantRow key={g.id} g={grants[g.id] || g} canDecide={!!grants[g.id]?.can_decide} onChange={reload} />
                    ))}
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {e.visibility !== 'private' && app.can_manage && (
                    <button className="btn sm gh" onClick={() => setShare(e.name)}>
                      <I n="share" />
                      Share
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="sect-h">Imports</div>
      {app.imports.length === 0 ? (
        <div className="mini">No imports.</div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>Import</th>
              <th>Kind</th>
              <th>Visibility</th>
              <th>Access</th>
              <th>Via</th>
            </tr>
          </thead>
          <tbody>
            {app.imports.map((i: any) => (
              <tr key={i.ref}>
                <td className="mono">{i.ref}</td>
                <td>{i.kind}</td>
                <td>{i.visibility ? <Vis v={i.visibility} /> : '—'}</td>
                <td>
                  <span className={'tg ' + (STATUS_TAG[i.status] ?? '')}>{i.status}</span>
                </td>
                <td className="sub">{i.via ? (i.via === 'public' ? 'public export' : `${i.via} grant`) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {share && <ShareModal app={app} exportName={share} open onClose={() => setShare(null)} onDone={reload} />}
    </>
  );
}

function Overview({ app }: { app: any }) {
  const m = app.manifest || {};
  return (
    <>
      <dl className="kv" style={{ marginBottom: 16 }}>
        <dt>Kind</dt>
        <dd>{app.kind === 'dataset' ? 'Workspace dataset' : 'App'}</dd>
        <dt>Owner</dt>
        <dd>
          {app.owner_name}
          {(m.owners || []).map((o: string) => (
            <span key={o} className="tg" style={{ marginLeft: 6 }}>
              {o}
            </span>
          ))}
        </dd>
        <dt>Published</dt>
        <dd>
          v{app.version} · {ago(app.published_at)}
        </dd>
        {app.kind === 'app' && (
          <>
            <dt>Toolchain</dt>
            <dd className="mono">{app.toolchain}</dd>
          </>
        )}
        <dt>Schema</dt>
        <dd>
          {app.tables} tables · {app.queries} queries · {app.actions} actions
        </dd>
        {app.repo_url && (
          <>
            <dt>Repository</dt>
            <dd className="mono">{app.repo_url}</dd>
          </>
        )}
      </dl>
      {(m.tables || []).length > 0 && (
        <>
          <div className="sect-h">Tables</div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Table</th>
                <th>Columns</th>
                <th>Visibility</th>
              </tr>
            </thead>
            <tbody>
              {m.tables.map((t: any) => (
                <tr key={t.name}>
                  <td className="mono">{t.name}</td>
                  <td className="mono" style={{ whiteSpace: 'normal' }}>
                    {(t.columns || []).map((c: any) => c.name).join(', ')}
                  </td>
                  <td>
                    <Vis v={t.visibility || 'private'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {(m.queries || []).length + (m.actions || []).length > 0 && (
        <>
          <div className="sect-h">Endpoints</div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Id</th>
                <th>Type</th>
                <th>Arguments</th>
                <th>Rate limit</th>
              </tr>
            </thead>
            <tbody>
              {(m.queries || []).map((q: any) => (
                <tr key={'q' + q.id}>
                  <td className="mono">{q.id}</td>
                  <td>query</td>
                  <td className="mono" style={{ whiteSpace: 'normal' }}>
                    {(q.args || []).filter((a: any) => a.source !== 'session').map((a: any) => a.name + (a.optional ? '?' : '')).join(', ') || '—'}
                  </td>
                  <td className="sub">{q.rate_limit}</td>
                </tr>
              ))}
              {(m.actions || []).map((a: any) => (
                <tr key={'a' + a.id}>
                  <td className="mono">{a.id}</td>
                  <td>{a.kind}</td>
                  <td className="mono" style={{ whiteSpace: 'normal' }}>
                    {(a.args || []).filter((x: any) => x.source !== 'session').map((x: any) => x.name + (x.optional ? '?' : '')).join(', ') || '—'}
                  </td>
                  <td className="sub">{a.rate_limit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}

function ManifestView({ app }: { app: any }) {
  const toast = useToast();
  return (
    <>
      <div className="sect-h">
        <span className="mono">meadow.yaml</span>
        <button className="btn sm gh" onClick={() => copy(app.manifest_yaml).then(() => toast('Copied to clipboard'))}>
          <I n="copy" />
          Copy
        </button>
      </div>
      <div className="code-view">{app.manifest_yaml}</div>
    </>
  );
}

function Versions({ app }: { app: any }) {
  return (
    <table className="tbl">
      <thead>
        <tr>
          <th>Version</th>
          <th>Published</th>
          <th>By</th>
          <th>Trigger</th>
          <th>Commit</th>
        </tr>
      </thead>
      <tbody>
        {app.versions.map((v: any, i: number) => (
          <tr key={i}>
            <td className="mono">v{v.version}</td>
            <td className="sub">{fmtDate(v.published_at)}</td>
            <td>{v.by}</td>
            <td>
              <span className="tg">{v.trigger}</span>
            </td>
            <td className="mono">{v.git_sha ? `${v.git_sha.slice(0, 7)}${v.git_ref ? ' · ' + v.git_ref : ''}` : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const TABS: [string, string][] = [
  ['overview', 'Overview'],
  ['sharing', 'Data sharing'],
  ['manifest', 'Manifest'],
  ['versions', 'Versions'],
];

export function AppDetailBody({ app, grants, reload, initialTab = 'overview' }: { app: any; grants: Record<string, any>; reload: () => void; initialTab?: string }) {
  const [tab, setTab] = useState(initialTab);
  return (
    <>
      <div className="stabs">
        {TABS.map(([k, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            {l}
            {k === 'sharing' && app.exports.length + app.imports.length > 0 && <span className="tg" style={{ marginLeft: 6 }}>{app.exports.length + app.imports.length}</span>}
          </button>
        ))}
      </div>
      {tab === 'overview' && <Overview app={app} />}
      {tab === 'sharing' && <Sharing app={app} grants={grants} reload={reload} />}
      {tab === 'manifest' && <ManifestView app={app} />}
      {tab === 'versions' && <Versions app={app} />}
    </>
  );
}

export function AppDetailPage() {
  const { slug } = useParams();
  const { ws, can, isFavorite, toggleFavorite, reloadApps, go, me } = useShell();
  const toast = useToast();
  const { app, grants, err, reload } = useAppDetail(slug);
  if (err) return <div className="pg"><div className="empty">{err}</div></div>;
  if (!app) return null;
  const fav = isFavorite('app', app.slug);
  const canDelete = can('apps:delete') && (can('workspaces:update') || app.created_by === me.user.id);
  const remove = async () => {
    try {
      await del(`/workspaces/${ws.slug}/apps/${app.slug}`);
      toast(`${app.name} deleted`);
      await reloadApps();
      go('catalog');
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  return (
    <div className="pg">
      <div className="pg-h">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <AppIcon app={app} size={40} radius={10} font={14} />
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {app.name} <span className="tg">v{app.version}</span>
              {app.kind === 'dataset' && <span className="tg b">dataset</span>}
            </h1>
            <p>{app.description}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {canDelete && (
            <Popconfirm title={`Delete ${app.name}?`} description="Drops its schema and data." okText="Delete" okButtonProps={{ danger: true }} onConfirm={remove}>
              <button className="btn gh" style={{ color: 'var(--red)' }}>
                <I n="trash" />
              </button>
            </Popconfirm>
          )}
          <button className="btn" onClick={() => toggleFavorite('app', app.slug)}>
            <I n="pin" />
            {fav ? 'Pinned' : 'Pin'}
          </button>
          {app.kind === 'app' ? (
            <ShellLink className="btn p" to={`/w/${ws.slug}/apps/${app.slug}`}>
              Open
            </ShellLink>
          ) : (
            can('workspaces:update') && (
              <ShellLink className="btn p" to={`/w/${ws.slug}/data?edit=${app.slug}`}>
                <I n="edit" />
                Edit
              </ShellLink>
            )
          )}
        </div>
      </div>
      <AppDetailBody app={app} grants={grants} reload={reload} />
    </div>
  );
}

export function AppDetailDrawer({ slug, open, onClose }: { slug: string; open: boolean; onClose: () => void }) {
  const { app, grants, reload } = useAppDetail(slug, open);
  return (
    <Drawer title={app ? `${app.name} · v${app.version}` : ''} open={open} onClose={onClose} width={720} destroyOnClose>
      {app && <AppDetailBody app={app} grants={grants} reload={reload} initialTab="manifest" />}
    </Drawer>
  );
}
