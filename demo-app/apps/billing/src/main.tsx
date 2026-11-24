import { useState } from 'react';
import { App, Button, Descriptions, Space, Table, Tag, Typography } from 'antd';
import { useAction, useQuery, toast } from '@meadow/sdk';

const money = (n: number | null | undefined) =>
  n == null ? '—' : Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const dDate = (v: string | null) => {
  if (!v) return '—';
  const s = String(v).slice(0, 10);
  const [y, m, d] = s.split('-');
  return y && m && d ? `${m}/${d}/${y}` : s;
};
const stColor: Record<string, string> = { open: 'gold', paid: 'green', draft: 'default', void: 'red' };

export default function BillingApp() {
  const { message } = App.useApp();
  const list = useQuery('list_invoices');
  const [id, setId] = useState<string | null>(null);
  const inv = useQuery('get_invoice', { id }, { enabled: !!id });
  const lines = useQuery('list_invoice_lines', { id }, { enabled: !!id });
  const inst = useQuery('list_installments', { id }, { enabled: !!id });
  const pay = useAction('record_payment');
  const header = (inv.rows?.[0] || null) as any;

  if (id && header) {
    return (
      <div style={{ padding: 20 }}>
        <Button type="link" onClick={() => setId(null)} style={{ padding: 0 }}>← Invoices</Button>
        <Space align="center" style={{ margin: '8px 0 16px' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>{header.number}</Typography.Title>
          <Tag color={stColor[header.status]}>{header.status}</Tag>
        </Space>
        <Descriptions size="small" column={4} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Customer">{header.account_name}</Descriptions.Item>
          <Descriptions.Item label="Issued">{dDate(header.issue_date)}</Descriptions.Item>
          <Descriptions.Item label="Total">{money(header.total)}</Descriptions.Item>
          <Descriptions.Item label="Outstanding">{money(header.outstanding)}</Descriptions.Item>
        </Descriptions>
        <Typography.Title level={5}>Lines</Typography.Title>
        <Table
          rowKey="line_no"
          loading={lines.loading}
          dataSource={(lines.rows || []) as any[]}
          size="small"
          pagination={false}
          style={{ marginBottom: 20 }}
          columns={[
            { title: 'Product', dataIndex: 'description' },
            { title: 'Qty', render: (_, r) => `${r.qty} ${r.uom}`, width: 90 },
            { title: 'Unit', render: (_, r) => money(r.unit_price), align: 'right', width: 110 },
            { title: 'Total', render: (_, r) => money(r.line_total), align: 'right', width: 110 },
          ]}
        />
        <Typography.Title level={5}>Installments</Typography.Title>
        <Table
          rowKey="id"
          loading={inst.loading}
          dataSource={(inst.rows || []) as any[]}
          size="small"
          pagination={false}
          columns={[
            { title: '#', dataIndex: 'seq', width: 48 },
            { title: 'Due', render: (_, r) => dDate(r.due_date) },
            { title: 'Amount', render: (_, r) => money(r.amount), align: 'right' },
            { title: 'Status', render: (_, r) => <Tag color={stColor[r.status]}>{r.status}</Tag> },
            { title: 'Reference', dataIndex: 'reference', render: (v) => v || '—' },
            {
              title: '',
              width: 140,
              render: (_, r) =>
                r.status === 'open' ? (
                  <Button
                    size="small"
                    onClick={async () => {
                      try {
                        await pay.run({ id: r.id, reference: `ACH: DEMO-${Date.now().toString().slice(-6)}` });
                        toast('Payment recorded');
                        await Promise.all([inv.refetch(), inst.refetch(), list.refetch()]);
                      } catch (e: any) {
                        message.error(e.message);
                      }
                    }}
                  >
                    Record payment
                  </Button>
                ) : null,
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <Typography.Title level={4} style={{ marginTop: 0 }}>Invoices</Typography.Title>
      <Table
        rowKey="id"
        loading={list.loading}
        dataSource={(list.rows || []) as any[]}
        size="small"
        pagination={false}
        onRow={(r) => ({ onClick: () => setId(r.id), style: { cursor: 'pointer' } })}
        columns={[
          { title: 'Invoice', dataIndex: 'number', render: (v, r) => <Button type="link" onClick={() => setId(r.id)}>{v}</Button> },
          { title: 'Customer', dataIndex: 'account_name' },
          { title: 'Issued', render: (_, r) => dDate(r.issue_date) },
          { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={stColor[s]}>{s}</Tag> },
          { title: 'Total', render: (_, r) => money(r.total), align: 'right' },
          { title: 'Paid', render: (_, r) => money(r.paid), align: 'right' },
        ]}
      />
    </div>
  );
}
