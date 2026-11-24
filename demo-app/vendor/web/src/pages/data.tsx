import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShellLink } from '../shelllink';
import { Modal } from 'antd';
import { api, get, post } from '../api';
import { I } from '../icons';
import { useShell } from '../shell';
import { AppIcon, PageH, Seg, STATUS_TAG, Vis, ago, useToast } from '../util';
import { GrantRow, ShareModal } from './appdetail';

const TEMPLATE = `manifest: 1
kind: dataset
name: Regions
slug: regions
description: Sales regions and their owners.
category: Finance
owners: [group:platform-admins]

tables:
  regions:
    visibility: public          # private | protected | public
    columns:
      code:     { type: text, required: true, unique: true, max_length: 8 }
      name:     { type: text, required: true }
      owner_id: { type: user }
    rls:
      select: "true"
      insert: "has_group('platform-admins')"
      update: "has_group('platform-admins')"
`;

function DatasetEditor({ slug, onClose, onSaved }: { slug: string | 'new'; onClose: () => void; onSaved: () => void }) {
  const { ws } = useShell();
  const toast = useToast();
  const [yaml, setYaml] = useState(slug === 'new' ? TEMPLATE : '');
  const [issues, setIssues] = useState<{ errors: any[]; warnings: any[] } | null>(null);
  const [plan, setPlan] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (slug !== 'new') get(`/workspaces/${ws.slug}/apps/${slug}`).then((a) => setYaml(a.manifest_yaml));
  }, [slug, ws.slug]);
  const validate = async () => {
    const r = await api('POST', `/workspaces/${ws.slug}/apps/validate`, { manifest: yaml });
    setIssues(r);
    return r.ok;
  };
  const publish = async (force = false) => {
    setBusy(true);
    try {
      if (!(await validate())) return;
      const dry = await api('POST', `/workspaces/${ws.slug}/datasets?dry_run=true${force ? '&force=true' : ''}`, { manifest: yaml }).catch((e) => {
        if (e.status === 409 && !force) {
          Modal.confirm({
            title: 'Destructive change',
            content: (e.body?.result?.summary || []).join('\n') || e.message,
            okText: 'Apply anyway',
            okButtonProps: { danger: true },
            onOk: () => publish(true),
          });
          return null;
        }
        throw e;
      });
      if (!dry) return;
      setPlan(dry.summary);
      await api('POST', `/workspaces/${ws.slug}/datasets${force ? '?force=true' : ''}`, { manifest: yaml });
      toast('Dataset published');
      onSaved();
      onClose();
    } catch (e: any) {
      if (e.body?.result?.validation) setIssues(e.body.result.validation);
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={slug === 'new' ? 'New dataset' : `Edit ${slug}`}
      open
      onCancel={onClose}
      width={760}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn" onClick={validate}>
            Validate
          </button>
          <button className="btn p" onClick={() => publish()} disabled={busy}>
            {busy ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      }
    >
      <textarea className="code-edit" spellCheck={false} value={yaml} onChange={(e) => setYaml(e.target.value)} />
      {issues && (
        <ul className="issues">
          {issues.errors.map((e, i) => (
            <li key={'e' + i}>
              {e.path ? <span className="mono">{e.path}: </span> : null}
              {e.message}
            </li>
          ))}
          {issues.warnings.map((e, i) => (
            <li key={'w' + i} className="w">
              {e.path ? <span className="mono">{e.path}: </span> : null}
              {e.message}
            </li>
          ))}
          {issues.errors.length === 0 && issues.warnings.length === 0 && <li style={{ color: 'var(--ac)' }}>Manifest is valid</li>}
        </ul>
      )}
      {plan && plan.length > 0 && <div className="code-view" style={{ marginTop: 8 }}>{plan.join('\n')}</div>}
    </Modal>
  );
}

export function Data() {
  const { ws, apps, can, reloadApps, path } = useShell();
  const [params, setParams] = useSearchParams();
  const [grants, setGrants] = useState<any[]>([]);
  const [seg, setSeg] = useState<'all' | 'pending'>('all');
  const [editing, setEditing] = useState<string | null>(params.get('edit'));
  const [share, setShare] = useState<{ app: any; name: string } | null>(null);
  const load = useCallback(async () => {
    setGrants(await get(`/workspaces/${ws.slug}/grants`));
  }, [ws.slug]);
  useEffect(() => {
    load();
  }, [load]);
  const refresh = () => {
    load();
    reloadApps();
  };
  const datasets = apps.filter((a) => a.kind === 'dataset');
  const exports = apps.flatMap((a) => (a.exports || []).map((e: any) => ({ app: a, e })));
  const shown = grants.filter((g) => seg === 'all' || g.status === 'pending');
  const pending = grants.filter((g) => g.status === 'pending').length;

  return (
    <div className="pg wide" style={{ maxWidth: 1180 }}>
      <PageH
        title="Data"
        sub="Workspace datasets, app exports and the grants between them"
        right={
          can('workspaces:update') && (
            <button className="btn p" onClick={() => setEditing('new')}>
              <I n="plus" />
              New dataset
            </button>
          )
        }
      />
      <div className="sect-h">Datasets</div>
      <table className="tbl click">
        <thead>
          <tr>
            <th>Dataset</th>
            <th>Tables</th>
            <th>Visibility</th>
            <th>Version</th>
            <th>Updated</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {datasets.map((d) => (
            <tr key={d.slug} className="click">
              <td>
                <ShellLink to={path('catalog/' + d.slug)} className="tbl-row-link">
                  <div className="person">
                    <AppIcon app={d} size={22} radius={6} font={9.5} />
                    <b style={{ fontWeight: 550 }}>{d.name}</b>
                  </div>
                </ShellLink>
              </td>
              <td>{d.tables}</td>
              <td>
                {(d.exports || []).length ? (
                  d.exports.map((e: any) => (
                    <span key={e.name} style={{ marginRight: 4 }}>
                      <Vis v={e.visibility} />
                    </span>
                  ))
                ) : (
                  <Vis v="private" />
                )}
              </td>
              <td className="mono">v{d.version}</td>
              <td className="sub">{ago(d.published_at)}</td>
              <td style={{ textAlign: 'right' }}>
                {can('workspaces:update') && (
                  <button
                    className="btn sm gh"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(d.slug);
                    }}
                  >
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
          {datasets.length === 0 && (
            <tr className="empty-row">
              <td colSpan={6}>No datasets yet</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="sect-h">Exports</div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Export</th>
            <th>Owner</th>
            <th>Kind</th>
            <th>Visibility</th>
            <th>Used by</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {exports.map(({ app, e }) => (
            <tr key={app.slug + e.name}>
              <td className="mono">
                {app.slug}.{e.name}
              </td>
              <td>{app.name}</td>
              <td>{e.kind}</td>
              <td>
                <Vis v={e.visibility} />
              </td>
              <td style={{ whiteSpace: 'normal' }}>{e.importers.map((i: any) => i.name).join(', ') || <span className="sub">—</span>}</td>
              <td style={{ textAlign: 'right' }}>
                {e.visibility !== 'private' && app.can_manage && (
                  <button className="btn sm gh" onClick={() => setShare({ app, name: e.name })}>
                    <I n="share" />
                    Share
                  </button>
                )}
              </td>
            </tr>
          ))}
          {exports.length === 0 && (
            <tr className="empty-row">
              <td colSpan={6}>Nothing is exported. Tables are private to their app by default.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="sect-h">
        <span>Grants</span>
        <Seg
          value={seg}
          onChange={(v) => setSeg(v as typeof seg)}
          options={[
            ['all', 'All'],
            ['pending', pending ? `Pending · ${pending}` : 'Pending'],
          ]}
        />
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Export</th>
            <th>Visibility</th>
            <th>Granted to</th>
            <th>Status</th>
            <th>Source</th>
            <th>Requested</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {shown.map((g) => (
            <tr key={g.id}>
              <td className="mono">
                {g.exporter}.{g.export}
              </td>
              <td>{g.visibility ? <Vis v={g.visibility} /> : '—'}</td>
              <td>
                <span className="tg" style={{ marginRight: 6 }}>
                  {g.target_type}
                </span>
                {g.target_name || g.target}
              </td>
              <td>
                <span className={'tg ' + (STATUS_TAG[g.status] ?? '')}>{g.status}</span>
              </td>
              <td className="sub">{g.source === 'manifest' ? 'share_with' : g.source}</td>
              <td className="sub">
                {g.requested_by ? `${g.requested_by} · ` : ''}
                {ago(g.requested_at)}
              </td>
              <td>
                {g.can_decide && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <GrantRowActions g={g} onChange={refresh} />
                  </div>
                )}
              </td>
            </tr>
          ))}
          {shown.length === 0 && (
            <tr className="empty-row">
              <td colSpan={7}>{seg === 'pending' ? 'No pending requests' : 'No grants yet'}</td>
            </tr>
          )}
        </tbody>
      </table>
      {editing && (
        <DatasetEditor
          slug={editing}
          onClose={() => {
            setEditing(null);
            if (params.get('edit')) setParams({});
          }}
          onSaved={refresh}
        />
      )}
      {share && <ShareModal app={share.app} exportName={share.name} open onClose={() => setShare(null)} onDone={refresh} />}
    </div>
  );
}

function GrantRowActions({ g, onChange }: { g: any; onChange: () => void }) {
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
    <span style={{ display: 'flex', gap: 4 }}>
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
  );
}

export { GrantRow };
