import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Brand } from '../brand/Logo';
import { LOGIN_URL } from '../config';
import {
  applyBulkUpdate,
  coerceRow,
  emptyRow,
  rowsToCsv,
  validateRow,
} from '../manifest/actions';
import { DEFAULT_MANIFEST_YAML, DEFAULT_SEED_ROWS } from '../manifest/defaultYaml';
import { parseManifestYaml } from '../manifest/parse';
import type { DemoRow } from '../manifest/types';
import '../demo/live-demo.css';

const YAML_KEY = 'flutics-live-demo-yaml';
const ROWS_KEY = 'flutics-live-demo-rows';

function loadYaml(): string {
  try {
    const s = localStorage.getItem(YAML_KEY);
    return s?.trim() ? s : DEFAULT_MANIFEST_YAML;
  } catch {
    return DEFAULT_MANIFEST_YAML;
  }
}

function loadRows(): DemoRow[] {
  try {
    const s = localStorage.getItem(ROWS_KEY);
    if (!s) return [...DEFAULT_SEED_ROWS];
    const parsed = JSON.parse(s) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_SEED_ROWS];
    return parsed as DemoRow[];
  } catch {
    return [...DEFAULT_SEED_ROWS];
  }
}

function persistYaml(text: string) {
  try {
    localStorage.setItem(YAML_KEY, text);
  } catch {
    /* quota / private mode */
  }
}

function persistRows(rows: DemoRow[]) {
  try {
    localStorage.setItem(ROWS_KEY, JSON.stringify(rows));
  } catch {
    /* quota / private mode */
  }
}

export function LiveDemoPage() {
  const [yaml, setYaml] = useState(loadYaml);
  const [rows, setRows] = useState<DemoRow[]>(loadRows);
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [draft, setDraft] = useState<DemoRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const parsed = useMemo(() => parseManifestYaml(yaml), [yaml]);
  const manifest = parsed.ok ? parsed.manifest : null;

  const onYamlChange = (text: string) => {
    setYaml(text);
    persistYaml(text);
  };

  const resetAll = () => {
    setYaml(DEFAULT_MANIFEST_YAML);
    setRows([...DEFAULT_SEED_ROWS]);
    setEditing(null);
    setDraft(null);
    setFormError(null);
    persistYaml(DEFAULT_MANIFEST_YAML);
    persistRows(DEFAULT_SEED_ROWS);
  };

  const updateRows = useCallback(
    (next: DemoRow[]) => {
      setRows(next);
      persistRows(next);
    },
    [],
  );

  const runAction = (actionId: string) => {
    if (!manifest) return;
    const action = manifest.actions.find((a) => a.id === actionId);
    if (!action) return;
    if (action.kind === 'export_csv') {
      const blob = new Blob([rowsToCsv(manifest, rows)], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${manifest.table.id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    updateRows(applyBulkUpdate(action, rows));
  };

  const startEdit = (index: number) => {
    if (!manifest) return;
    setEditing(index);
    setDraft(coerceRow(manifest, rows[index]));
    setFormError(null);
  };

  const startAdd = () => {
    if (!manifest) return;
    setEditing('new');
    setDraft(emptyRow(manifest));
    setFormError(null);
  };

  const cancelForm = () => {
    setEditing(null);
    setDraft(null);
    setFormError(null);
  };

  const saveForm = () => {
    if (!manifest || draft == null || editing == null) return;
    const coerced = coerceRow(manifest, draft);
    const err = validateRow(manifest, coerced);
    if (err) {
      setFormError(err);
      return;
    }
    if (editing === 'new') {
      updateRows([...rows, coerced]);
    } else {
      const next = [...rows];
      next[editing] = coerced;
      updateRows(next);
    }
    cancelForm();
  };

  const deleteRow = (index: number) => {
    updateRows(rows.filter((_, i) => i !== index));
    if (editing === index) cancelForm();
  };

  return (
    <div className="ld-page">
      <header className="ld-head">
        <div className="wrap ld-head-inner">
          <Link className="brand" to="/" aria-label="Flutics home">
            <Brand />
          </Link>
          <div className="ld-head-actions">
            <button type="button" className="btn ghost" onClick={resetAll}>
              Reset sample data
            </button>
            <a className="btn primary" href={LOGIN_URL}>
              Get started
            </a>
          </div>
        </div>
      </header>

      <main className="ld-main wrap">
        <header className="ld-intro">
          <p className="eyebrow">Live demo</p>
          <h1>{manifest?.name ?? 'Manifest app'}</h1>
          <p className="lead">
            {manifest?.description ??
              'Edit the YAML on the left. The table and actions on the right update with no server and no account.'}
          </p>
        </header>

        <div className="ld-split">
          <section className="ld-panel ld-editor" aria-labelledby="yaml-title">
            <div className="ld-panel-head">
              <h2 id="yaml-title">App manifest (YAML)</h2>
            </div>
            <textarea
              className="ld-yaml"
              value={yaml}
              onChange={(e) => onYamlChange(e.target.value)}
              spellCheck={false}
              aria-invalid={!parsed.ok}
              aria-describedby={!parsed.ok ? 'yaml-error' : undefined}
            />
            {!parsed.ok && (
              <p id="yaml-error" className="ld-error" role="alert">
                {parsed.error}
              </p>
            )}
          </section>

          <section className="ld-panel ld-preview" aria-labelledby="preview-title">
            <div className="ld-panel-head">
              <h2 id="preview-title">{manifest?.table.label ?? 'Preview'}</h2>
              {manifest && (
                <div className="ld-action-bar">
                  {manifest.actions.map((a) => (
                    <button key={a.id} type="button" className="btn ghost sm" onClick={() => runAction(a.id)}>
                      {a.label}
                    </button>
                  ))}
                  <button type="button" className="btn primary sm" onClick={startAdd} disabled={!parsed.ok}>
                    Add row
                  </button>
                </div>
              )}
            </div>

            {!parsed.ok ? (
              <p className="ld-muted">Fix manifest errors to render the app UI.</p>
            ) : (
              <>
                <div className="ld-table-wrap">
                  <table className="ld-table">
                    <thead>
                      <tr>
                        {parsed.manifest.table.columns.map((c) => (
                          <th key={c.key} scope="col">
                            {c.label}
                          </th>
                        ))}
                        <th scope="col">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={parsed.manifest.table.columns.length + 1} className="ld-muted">
                            No rows yet — add one or reset sample data.
                          </td>
                        </tr>
                      ) : (
                        rows.map((row, i) => (
                          <tr key={i}>
                            {parsed.manifest.table.columns.map((c) => (
                              <td key={c.key} data-label={c.label}>
                                {String(row[c.key] ?? '')}
                              </td>
                            ))}
                            <td className="ld-row-actions" data-label="Actions">
                              <button type="button" className="linkish" onClick={() => startEdit(i)}>
                                Edit
                              </button>
                              <button type="button" className="linkish danger" onClick={() => deleteRow(i)}>
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {editing != null && draft && (
                  <form
                    className="ld-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveForm();
                    }}
                  >
                    <h3>{editing === 'new' ? 'Add row' : 'Edit row'}</h3>
                    {formError && (
                      <p className="ld-error" role="alert">
                        {formError}
                      </p>
                    )}
                    <div className="ld-form-grid">
                      {parsed.manifest.table.columns.map((c) => (
                        <label key={c.key}>
                          <span>{c.label}</span>
                          {c.type === 'enum' && c.values ? (
                            <select
                              value={String(draft[c.key] ?? '')}
                              onChange={(e) => setDraft({ ...draft, [c.key]: e.target.value })}
                            >
                              {c.values.map((v) => (
                                <option key={v} value={v}>
                                  {v}
                                </option>
                              ))}
                            </select>
                          ) : c.type === 'number' ? (
                            <input
                              type="number"
                              value={Number(draft[c.key] ?? 0)}
                              onChange={(e) => setDraft({ ...draft, [c.key]: Number(e.target.value) })}
                            />
                          ) : (
                            <input
                              type={c.type === 'email' ? 'email' : 'text'}
                              value={String(draft[c.key] ?? '')}
                              required={c.required}
                              onChange={(e) => setDraft({ ...draft, [c.key]: e.target.value })}
                            />
                          )}
                        </label>
                      ))}
                    </div>
                    <div className="ld-form-actions">
                      <button type="button" className="btn ghost sm" onClick={cancelForm}>
                        Cancel
                      </button>
                      <button type="submit" className="btn primary sm">
                        Save
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </section>
        </div>

        <p className="ld-footnote">
          Runs entirely in your browser. Data stays in this tab (localStorage). Works offline after the page loads.
        </p>
      </main>
    </div>
  );
}