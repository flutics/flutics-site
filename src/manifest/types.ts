export type ColumnType = 'text' | 'email' | 'number' | 'enum';

export type ManifestColumn = {
  key: string;
  label: string;
  type: ColumnType;
  required?: boolean;
  values?: string[];
};

export type ManifestAction = {
  id: string;
  label: string;
  kind: 'bulk_update' | 'export_csv';
  field?: string;
  value?: string | number;
  filter?: { field: string; equals: string };
};

export type DemoManifest = {
  manifest: number;
  name: string;
  description?: string;
  table: {
    id: string;
    label: string;
    columns: ManifestColumn[];
  };
  actions: ManifestAction[];
};

export type DemoRow = Record<string, string | number>;