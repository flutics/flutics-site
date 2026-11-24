import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dropdown, Input, Modal, Select } from 'antd';
import { del, get, patch, post, put } from '../api';
import { I } from '../icons';
import { useShell } from '../shell';
import { ShellLink } from '../shelllink';
import { AppIcon, PageH, Seg, STATUS_TAG, VIS_TAG, useToast } from '../util';

export function SharingTags({ app, max = 3 }: { app: any; max?: number }) {
  const tags: JSX.Element[] = [];
  for (const e of app.exports || []) {
    tags.push(
      <span key={'e' + e.name} className={'tg ' + (VIS_TAG[e.visibility] ?? '')} title={`Exports ${e.name} (${e.kind}, ${e.visibility})`}>
        ↗ {e.name}
      </span>,
    );
  }
  for (const i of app.imports || []) {
    tags.push(
      <span key={'i' + i.ref} className={'tg ' + (i.status === 'approved' ? 'b' : STATUS_TAG[i.status] ?? '')} title={`Imports ${i.ref} (${i.status})`}>
        ↙ {i.ref}
      </span>,
    );
  }
  if (!tags.length) return null;
  return (
    <div className="tags">
      {tags.slice(0, max)}
      {tags.length > max && <span className="tg">+{tags.length - max}</span>}
    </div>
  );
}

type Folder = { id: string; parent_id?: string | null; name: string; created_by?: string | null; subfolders?: number; apps?: number };
type FolderOption = { id: string; label: string };
type Share = { id: string; subject_type: string; subject_id?: string | null; subject_name?: string; level?: string | null; created_at?: string };
type Target = { type: 'folder' | 'app'; id: string; slug?: string; name: string };

/** Full "A / B / C" labels for the move menu; drag & drop already shows the tree. */
function folderOptions(list: Folder[]): FolderOption[] {
  const byID = new Map(list.map((f) => [f.id, f]));
  const label = (f: Folder, seen: Set<string>): string => {
    if (!f.parent_id || seen.has(f.id)) return f.name;
    seen.add(f.id);
    const parent = byID.get(f.parent_id);
    return parent ? `${label(parent, seen)} / ${f.name}` : f.name;
  };
  return list
    .map((f) => ({ id: f.id, label: label(f, new Set()) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function AppCard({
  app,
  canMove,
  moveTargets,
  onMove,
  onShare,
  onDragStart,
}: {
  app: any;
  canMove?: boolean;
  moveTargets?: FolderOption[];
  onMove?: (folderID: string | null) => void;
  onShare?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
}) {
  const { isFavorite, toggleFavorite, path } = useShell();
  const fav = isFavorite('app', app.slug);
  const detailTo = path('catalog/' + app.slug);
  const openTo = path('apps/' + app.slug);
  const moveItems = [
    { key: 'root', label: 'Workspace root' },
    ...(moveTargets || []).filter((f) => f.id !== app.folder_id).map((f) => ({ key: f.id, label: f.label })),
  ];
  // Apps open the runner, datasets open their detail page. The title link
  // stretches over the whole card (CSS ::after) so a click anywhere opens it.
  const openTarget = app.kind === 'app' ? openTo : detailTo;
  return (
    <div className="ac clk withpin" draggable={!!onDragStart} onDragStart={onDragStart}>
      <button
        type="button"
        className={'pinb' + (fav ? ' on' : '')}
        title={fav ? 'Unpin from sidebar' : 'Pin to sidebar'}
        aria-label={fav ? 'Unpin from sidebar' : 'Pin to sidebar'}
        aria-pressed={fav}
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite('app', app.slug);
        }}
      >
        <I n="pin" />
      </button>
      <div className="row1">
        <AppIcon app={app} />
        <div style={{ minWidth: 0 }}>
          <div className="t">
            <ShellLink to={openTarget} draggable={false}>
              {app.name}
            </ShellLink>
          </div>
          <div className="o">
            {app.category || app.owner_name} · {app.kind === 'dataset' ? 'Dataset' : 'Postgres'}
            {app.folder_path ? ` · ${app.folder_path}` : ''}
          </div>
        </div>
      </div>
      <div className="d">{app.description}</div>
      <SharingTags app={app} />
      <div className="f" onClick={(e) => e.stopPropagation()}>
        <span className="v">v{app.version}</span>
        {canMove && (
          <Dropdown
            trigger={['click']}
            menu={{
              items: moveItems,
              onClick: ({ key }) => onMove?.(key === 'root' ? null : key),
            }}
          >
            <button className="btn sm gh ic" title="Move to folder" aria-label="Move to folder">
              <I n="folder" />
            </button>
          </Dropdown>
        )}
        {onShare && (
          <button className="btn sm gh ic" title="Share" aria-label="Share" onClick={onShare}>
            <I n="share" />
          </button>
        )}
      </div>
    </div>
  );
}

function FolderCard({
  folder,
  onOpen,
  onShare,
  canManage,
  canMove,
  moveTargets,
  onMove,
  onDropApp,
  onDropFolder,
  onDragStart,
}: {
  folder: Folder;
  onOpen: () => void;
  onShare: () => void;
  canManage: boolean;
  canMove?: boolean;
  moveTargets?: FolderOption[];
  onMove?: (folderID: string | null) => void;
  onDropApp: (slug: string) => void;
  onDropFolder?: (id: string) => void;
  onDragStart?: (e: React.DragEvent) => void;
}) {
  const [over, setOver] = useState(false);
  // A folder cannot move into itself or into its own parent (a no-op).
  const moveItems = [
    { key: 'root', label: 'Workspace root' },
    ...(moveTargets || []).filter((f) => f.id !== folder.id && f.id !== folder.parent_id).map((f) => ({ key: f.id, label: f.label })),
  ];
  return (
    <div
      className="ac clk"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen()}
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragOver={(e) => {
        const t = e.dataTransfer.types;
        if (!t.includes('application/x-meadow-app') && !t.includes('application/x-meadow-folder')) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const slug = e.dataTransfer.getData('application/x-meadow-app');
        if (slug) return onDropApp(slug);
        const fid = e.dataTransfer.getData('application/x-meadow-folder');
        if (fid && fid !== folder.id) onDropFolder?.(fid);
      }}
      style={over ? { outline: '2px solid var(--brand, #059669)', outlineOffset: 2 } : undefined}
    >
      <div className="row1">
        <span className="ai" style={{ background: '#f59e0b' }}>
          <I n="folder" style={{ color: '#fff' }} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div className="t">{folder.name}</div>
          <div className="o">
            {(folder.subfolders || 0) + (folder.apps || 0)} item{(folder.subfolders || 0) + (folder.apps || 0) === 1 ? '' : 's'}
          </div>
        </div>
      </div>
      <div className="d" />
      <div className="f" onClick={(e) => e.stopPropagation()}>
        {canMove && (
          <Dropdown
            trigger={['click']}
            menu={{ items: moveItems, onClick: ({ key }) => onMove?.(key === 'root' ? null : key) }}
          >
            <button className="btn sm gh ic" title="Move folder" aria-label="Move folder">
              <I n="folder" />
            </button>
          </Dropdown>
        )}
        {canManage && (
          <button className="btn sm gh ic" title="Share" aria-label="Share" onClick={onShare}>
            <I n="share" />
          </button>
        )}
      </div>
    </div>
  );
}

function ShareDialog({ open, onClose, ws, target }: { open: boolean; onClose: () => void; ws: any; target: Target | null }) {
  const toast = useToast();
  const [shares, setShares] = useState<Share[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [kind, setKind] = useState('user');
  const [subject, setSubject] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const base = target
    ? target.type === 'folder'
      ? `/workspaces/${ws.slug}/folders/${target.id}/shares`
      : `/workspaces/${ws.slug}/apps/${target.slug}/shares`
    : '';

  const reload = useCallback(() => {
    if (!base) return;
    get(base).then(setShares).catch(() => setShares([]));
  }, [base]);

  useEffect(() => {
    if (!open || !target) return;
    reload();
    setSubject(undefined);
    setKind('user');
    Promise.all([
      get(`/workspaces/${ws.slug}/users`).catch(() => []),
      get('/workspaces').catch(() => []),
      get(`/workspaces/${ws.slug}/groups`).catch(() => []),
    ]).then(([u, w, g]) => {
      setUsers(u || []);
      setWorkspaces((w || []).filter((x: any) => x.id !== ws.id));
      setGroups(g || []);
    });
  }, [open, target, reload, ws.id, ws.slug]);

  const subjectOptions = useMemo(() => {
    const list = kind === 'user' ? users : kind === 'workspace' ? workspaces : groups;
    return list.map((x: any) => ({ value: x.id, label: x.name || x.slug || x.email }));
  }, [kind, users, workspaces, groups]);

  const grant = async () => {
    if (!base || (kind !== 'public' && !subject)) return;
    setBusy(true);
    try {
      await post(base, { subject_type: kind, subject_id: kind === 'public' ? undefined : subject });
      toast('Access granted');
      setSubject(undefined);
      reload();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  const revoke = async (sid: string) => {
    try {
      await del(base + '/' + sid);
      toast('Access revoked');
      reload();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  const label = kind === 'public' ? 'Anyone with the public link' : subjectOptions.find((o) => o.value === subject)?.label || 'the recipient';

  return (
    <Modal open={open} onCancel={onClose} footer={null} title={target ? `Share ${target.name}` : 'Share'} destroyOnClose>
      <div style={{ display: 'grid', gap: 10 }}>
        <div className="mini">
          Access level <b>operate</b>: they can open and run this {target?.type === 'folder' ? "folder's apps" : 'app'}, bounded by each app's own RLS.
          They cannot publish, delete, move or manage shares.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Select
            value={kind}
            onChange={(v) => {
              setKind(v);
              setSubject(undefined);
            }}
            style={{ width: 140 }}
            options={[
              { value: 'user', label: 'User' },
              { value: 'workspace', label: 'Workspace' },
              { value: 'group', label: 'Group' },
              { value: 'public', label: 'Public link' },
            ]}
          />
          {kind !== 'public' && (
            <Select
              showSearch
              value={subject}
              onChange={setSubject}
              style={{ flex: 1 }}
              placeholder={kind === 'group' ? 'Group in this workspace' : `Pick a ${kind}`}
              optionFilterProp="label"
              options={subjectOptions}
            />
          )}
          <button className="btn p" disabled={busy || (kind !== 'public' && !subject)} onClick={grant}>
            Grant
          </button>
        </div>
        <div className="mini">
          <b>Change preview:</b> {label} will gain operate access. Existing workspace roles are unchanged; a share never narrows or widens workspace permissions.
        </div>
        <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Current access</div>
          {shares.length ? (
            shares.map((s) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                <I n={s.subject_type === 'public' ? 'share' : s.subject_type === 'workspace' ? 'grid' : s.subject_type === 'group' ? 'users' : 'user'} />
                <span style={{ flex: 1 }}>{s.subject_name || (s.subject_type === 'public' ? 'Public link' : s.subject_type)}</span>
                <span className="tg">{s.level || 'link'}</span>
                <button className="btn sm gh" onClick={() => revoke(s.id)}>
                  Revoke
                </button>
              </div>
            ))
          ) : (
            <div className="mini">No one else has access through a share.</div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function Catalog() {
  const { ws, apps, isFavorite, me, can, newApp, reloadApps } = useShell();
  const toast = useToast();
  const [seg, setSeg] = useState<'all' | 'pinned' | 'mine' | 'datasets'>('all');
  const [q, setQ] = useState('');
  const [folderID, setFolderID] = useState<string | null>(null);
  const [trail, setTrail] = useState<{ id: string; name: string }[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const [shareTarget, setShareTarget] = useState<Target | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState('');

  const load = useCallback(async () => {
    const suffix = folderID ? `?parent=${encodeURIComponent(folderID)}` : '';
    const [kids, all] = await Promise.all([
      get(`/workspaces/${ws.slug}/folders${suffix}`),
      get(`/workspaces/${ws.slug}/folders?flat=1`),
    ]);
    setFolders(kids || []);
    setAllFolders(all || []);
  }, [ws.slug, folderID]);

  useEffect(() => {
    load().catch(() => {
      setFolders([]);
      setAllFolders([]);
    });
  }, [load]);

  const enter = (f: Folder) => {
    setTrail((t) => [...t, { id: f.id, name: f.name }]);
    setFolderID(f.id);
  };
  const goRoot = () => {
    setTrail([]);
    setFolderID(null);
  };
  const goCrumb = (i: number) => {
    const next = trail.slice(0, i + 1);
    setTrail(next);
    setFolderID(i < 0 ? null : (next[i]?.id ?? null));
  };
  const canManageFolder = (f: Folder) =>
    can('workspaces:update') || (can('apps:update') && !!f.created_by && f.created_by === me.user.id);

  const moveApp = async (slug: string, target: string | null) => {
    try {
      await put(`/workspaces/${ws.slug}/apps/${slug}/folder`, { folder_id: target });
      toast(target ? 'Moved to folder' : 'Moved to workspace root');
      await reloadApps().catch(() => {});
      await load();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  // Moving a folder re-parents it; the API rejects cycles and depth > 5.
  const moveFolder = async (id: string, target: string | null) => {
    try {
      await patch(`/workspaces/${ws.slug}/folders/${id}`, { parent_id: target });
      toast(target ? 'Folder moved' : 'Folder moved to workspace root');
      await load();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const createFolder = async () => {
    const name = folderName.trim();
    if (!name) return;
    try {
      await post(`/workspaces/${ws.slug}/folders`, { name, parent_id: folderID });
      setNewFolderOpen(false);
      setFolderName('');
      toast('Folder created');
      await load();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const ql = q.toLowerCase();
  const search = (a: any) => !ql || `${a.name} ${a.category} ${a.description} ${a.owner_name} ${a.folder_path || ''}`.toLowerCase().includes(ql);
  const list = apps.filter(
    (a) =>
      (seg === 'all' ? true : seg === 'pinned' ? isFavorite('app', a.slug) : seg === 'mine' ? a.created_by === me.user.id : a.kind === 'dataset') &&
      search(a) &&
      (ql ? true : folderID ? a.folder_id === folderID : !a.folder_id),
  );
  const visibleFolders = ql ? [] : folders;
  const moveFolders = useMemo(() => folderOptions(allFolders), [allFolders]);
  const manageApp = (a: any) => can('workspaces:update') || (can('apps:update') && a.created_by === me.user.id);

  return (
    <div className="pg">
      <PageH
        title="Catalog"
        sub={`Apps published in ${ws.name}`}
        right={
          <>
            {can('apps:create') && (
              <button className="btn" onClick={() => setNewFolderOpen(true)}>
                <I n="folder" />
                New folder
              </button>
            )}
            {can('apps:create') && (
              <button className="btn p" onClick={newApp}>
                <I n="plus" />
                New app
              </button>
            )}
          </>
        }
      />
      <div className="toolbar">
        <input className="inp" placeholder="Search apps" value={q} onChange={(e) => setQ(e.target.value)} />
        <Seg
          value={seg}
          onChange={(v) => setSeg(v as typeof seg)}
          options={[
            ['all', 'All'],
            ['pinned', 'Pinned'],
            ['mine', 'Mine'],
            ['datasets', 'Datasets'],
          ]}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 13 }}>
        <button className="btn sm gh" onClick={goRoot} onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
          e.preventDefault();
          const slug = e.dataTransfer.getData('application/x-meadow-app');
          if (slug) moveApp(slug, null);
        }}>
          <I n="home" />
          Workspace root
        </button>
        {trail.map((t, i) => (
          <span key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--tx3)' }}>/</span>
            <button
              className="btn sm gh"
              onClick={() => goCrumb(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const slug = e.dataTransfer.getData('application/x-meadow-app');
                if (slug) moveApp(slug, t.id);
              }}
            >
              {t.name}
            </button>
          </span>
        ))}
      </div>
      <div className="cards">
        {visibleFolders.map((f) => (
          <FolderCard
            key={f.id}
            folder={f}
            onOpen={() => enter(f)}
            onShare={() => setShareTarget({ type: 'folder', id: f.id, name: f.name })}
            canManage={canManageFolder(f)}
            canMove={can('apps:update')}
            moveTargets={moveFolders}
            onMove={(target) => moveFolder(f.id, target)}
            onDropApp={(slug) => moveApp(slug, f.id)}
            onDropFolder={(id) => moveFolder(id, f.id)}
            onDragStart={
              can('apps:update')
                ? (e) => {
                    e.dataTransfer.setData('application/x-meadow-folder', f.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }
                : undefined
            }
          />
        ))}
        {list.map((a) => (
          <AppCard
            key={a.slug}
            app={a}
            canMove={can('apps:update')}
            moveTargets={moveFolders}
            onMove={(target) => moveApp(a.slug, target)}
            onShare={manageApp(a) ? () => setShareTarget({ type: 'app', id: a.id, slug: a.slug, name: a.name }) : undefined}
            onDragStart={
              can('apps:update')
                ? (e) => {
                    e.dataTransfer.setData('application/x-meadow-app', a.slug);
                    e.dataTransfer.effectAllowed = 'move';
                  }
                : undefined
            }
          />
        ))}
        {!visibleFolders.length && !list.length && (
          <div className="empty" style={{ gridColumn: '1/-1' }}>
            {q ? `No apps match “${q}”` : folderID ? 'This folder is empty' : 'Nothing here yet'}
          </div>
        )}
      </div>
      <ShareDialog open={!!shareTarget} onClose={() => setShareTarget(null)} ws={ws} target={shareTarget} />
      <Modal
        open={newFolderOpen}
        onCancel={() => setNewFolderOpen(false)}
        onOk={createFolder}
        okText="Create"
        title={folderID ? 'New subfolder' : 'New folder'}
      >
        <Input autoFocus placeholder="Folder name" value={folderName} onChange={(e) => setFolderName(e.target.value)} onPressEnter={createFolder} />
      </Modal>
    </div>
  );
}
