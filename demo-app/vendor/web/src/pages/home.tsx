import { useEffect, useState } from 'react';
import { get } from '../api';
import { I } from '../icons';
import { useShell } from '../shell';
import { PageH, ago } from '../util';
import { AppCard } from './catalog';

const ACTION_ICON: Record<string, string> = { app: 'bolt', grant: 'share', scim: 'sync', user: 'user', group: 'users', role: 'shield', sso: 'shield', auth: 'key' };
const ACTION_TEXT: Record<string, string> = {
  'app.publish': 'published', 'app.create': 'created', 'app.delete': 'deleted', 'grant.approved': 'approved a data grant', 'grant.revoked': 'revoked a data grant',
  'group.create': 'created group', 'group.member.add': 'added', 'group.member.remove': 'removed from', 'group.members': 'updated members of', 'group.roles': 'changed roles of', 'role.create': 'created role', 'role.update': 'updated a role',
  'user.add': 'added', 'user.remove': 'removed', 'user.suspended': 'suspended', 'user.active': 'reactivated', 'user.roles': 'changed roles of',
  'scim.user.create': 'provisioned', 'scim.group.create': 'provisioned group', 'scim.group.patch': 'synced group', 'sso.update': 'updated SSO', 'auth.sso': 'signed in with SSO',
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function Home() {
  const { me, ws, apps, sidebar, can, openPalette, newApp } = useShell();
  const [activity, setActivity] = useState<{ icon: string; text: React.ReactNode; who: string; at: string }[]>([]);
  useEffect(() => {
    const fromApps = () =>
      apps
        .slice()
        .sort((a, b) => b.published_at.localeCompare(a.published_at))
        .slice(0, 6)
        .map((a) => ({ icon: 'bolt', text: `${a.name} v${a.version} published`, who: a.owner_name, at: a.published_at }));
    if (!can('workspaces:update')) {
      setActivity(fromApps());
      return;
    }
    get(`/workspaces/${ws.slug}/audit`)
      .then((body: any) => {
        const rows = Array.isArray(body) ? body : body.items ?? [];
        setActivity(
          rows.slice(0, 7).map((r: { action: string; target: string; actor: string; at: string }) => ({
            icon: ACTION_ICON[r.action.split('.')[0]] || 'bolt',
            text: `${ACTION_TEXT[r.action] || r.action} ${r.target}`.trim(),
            who: r.actor,
            at: r.at,
          })),
        );
      })
      .catch(() => setActivity(fromApps()));
  }, [ws.slug, apps, can]);
  const pinned = sidebar.filter((s) => s.type === 'app').map((s) => apps.find((a) => a.slug === s.ref)).filter(Boolean);
  const first = me.user.name.split(' ')[0];
  const role = ws.permissions?.includes('workspaces:delete') ? 'Owner' : ws.permissions?.includes('workspaces:update') ? 'Admin' : ws.permissions?.includes('apps:create') ? 'Builder' : ws.permissions?.includes('apps:execute') ? 'Member' : 'Viewer';
  return (
    <div className="pg">
      <PageH
        title={`${greeting()}, ${first}`}
        sub={`${ws.name} workspace`}
        right={
          <>
            <button className="btn" onClick={openPalette}>
              <I n="search" />
              Jump to…
            </button>
            {can('apps:create') && (
              <button className="btn p" onClick={newApp}>
                <I n="plus" />
                New app
              </button>
            )}
          </>
        }
      />
      <div style={{ fontSize: 12, color: 'var(--tx3)', fontWeight: 550, marginBottom: 8 }}>Pinned</div>
      <div className="cards" style={{ marginBottom: 18 }}>
        {pinned.length ? pinned.map((a: any) => <AppCard key={a.slug} app={a} />) : <div className="empty" style={{ gridColumn: '1/-1' }}>No pinned apps. Pin apps from the catalog to keep them in your sidebar.</div>}
      </div>
      <div className="hgrid">
        <div className="panel">
          <h3>Recent activity</h3>
          <p className="ds">{can('workspaces:update') ? 'Audit log for this workspace' : 'Recently published apps'}</p>
          {activity.length ? (
            activity.map((r, i) => (
              <div className="act" key={i}>
                <I n={r.icon} style={{ color: 'var(--tx3)' }} />
                <span>
                  <span style={{ color: 'var(--tx)' }}>{r.text}</span>
                  {r.who ? ` · ${r.who}` : ''}
                </span>
                <span className="tm">{ago(r.at)}</span>
              </div>
            ))
          ) : (
            <div className="mini">Nothing yet</div>
          )}
        </div>
        <div className="panel">
          <h3>Workspace</h3>
          <p className="ds">{ws.name}</p>
          <dl className="kv">
            <dt>Apps</dt>
            <dd>
              {plural(apps.filter((a) => a.kind === 'app').length, 'app')} · {plural(apps.filter((a) => a.kind === 'dataset').length, 'dataset')}
            </dd>
            <dt>Members</dt>
            <dd>
              {ws.members} · {ws.groups} groups
            </dd>
            <dt>Connections</dt>
            <dd>Flutics Postgres</dd>
            <dt>Your role</dt>
            <dd>
              <span className={'tg' + (role === 'Owner' ? ' g' : '')}>{role}</span>
            </dd>
            <dt>Toolchain</dt>
            <dd className="mono">{me.toolchain} · React 18 · antd 5</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
