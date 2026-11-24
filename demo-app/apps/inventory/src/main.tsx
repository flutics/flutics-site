import { useMemo, useState } from 'react';
import { App, Button, Descriptions, Space, Table, Tabs, Tag, Typography } from 'antd';
import { useAction, useQuery, toast } from '@meadow/sdk';

const money = (n: number | null | undefined) =>
  n == null ? '—' : Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const sitColor: Record<string, string> = { ok: 'green', below_min: 'gold', short: 'red', out: 'red' };
const sitLabel: Record<string, string> = { ok: 'OK', below_min: 'Below minimum', short: 'Short for orders', out: 'Out of stock' };
const poColor: Record<string, string> = { draft: 'default', approved: 'blue', sent: 'gold', received: 'green', cancelled: 'red' };

function StockTab() {
  const stock = useQuery('list_stock');
  const rows = (stock.rows || []) as any[];
  return (
    <Table
      rowKey="id"
      loading={stock.loading}
      dataSource={rows}
      size="small"
      pagination={false}
      columns={[
        { title: 'Item', render: (_, r) => (<div><div>{r.name}</div><Typography.Text type="secondary">{r.sku}</Typography.Text></div>) },
        { title: 'Type', dataIndex: 'kind', width: 120 },
        { title: 'On hand', dataIndex: 'on_hand', align: 'right', width: 90 },
        { title: 'Reserved', dataIndex: 'reserved', align: 'right', width: 90 },
        { title: 'Available', dataIndex: 'available', align: 'right', width: 90 },
        { title: 'Minimum', render: (_, r) => `${r.min_qty} ${r.uom}`, width: 110 },
        { title: 'Incoming', dataIndex: 'incoming', align: 'right', width: 90 },
        { title: 'Situation', render: (_, r) => <Tag color={sitColor[r.situation]}>{sitLabel[r.situation] || r.situation}</Tag>, width: 140 },
      ]}
    />
  );
}

function PurchaseOrdersTab() {
  const { message } = App.useApp();
  const list = useQuery('list_purchase_orders');
  const [id, setId] = useState<string | null>(null);
  const po = useQuery('get_purchase_order', { id }, { enabled: !!id });
  const lines = useQuery('list_purchase_order_lines', { id }, { enabled: !!id });
  const receive = useAction('receive_purchase_order');
  const header = (po.rows?.[0] || null) as any;
  const receiving = header && header.status !== 'received';

  if (id) {
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Button type="link" onClick={() => setId(null)} style={{ padding: 0 }}>← Purchase orders</Button>
        {header && (
          <>
            <Space align="center">
              <Typography.Title level={4} style={{ margin: 0 }}>{header.number}</Typography.Title>
              <Tag color={poColor[header.status]}>{header.status}</Tag>
              {receiving && (
                <Button
                  type="primary"
                  onClick={async () => {
                    try {
                      await receive.run({ id });
                      toast('Goods received');
                      await Promise.all([po.refetch(), lines.refetch(), list.refetch()]);
                    } catch (e: any) {
                      message.error(e.message);
                    }
                  }}
                >
                  Receive goods
                </Button>
              )}
            </Space>
            <Descriptions size="small" column={3}>
              <Descriptions.Item label="Supplier">{header.supplier}</Descriptions.Item>
              <Descriptions.Item label="Location">{[header.city, header.state].filter(Boolean).join(', ')}</Descriptions.Item>
              <Descriptions.Item label="Total">{money(header.total)}</Descriptions.Item>
            </Descriptions>
            <Table
              rowKey="line_no"
              loading={lines.loading}
              dataSource={(lines.rows || []) as any[]}
              size="small"
              pagination={false}
              columns={[
                { title: '#', dataIndex: 'line_no', width: 48 },
                { title: 'Item', render: (_, r) => (<div><div>{r.item}</div><Typography.Text type="secondary">{r.sku}</Typography.Text></div>) },
                { title: 'Qty', dataIndex: 'qty', align: 'right' },
                { title: 'Unit', dataIndex: 'uom' },
                { title: 'Unit price', render: (_, r) => money(r.unit_price), align: 'right' },
                { title: 'Received', dataIndex: 'received_qty', align: 'right' },
              ]}
            />
          </>
        )}
      </Space>
    );
  }

  return (
    <Table
      rowKey="id"
      loading={list.loading}
      dataSource={(list.rows || []) as any[]}
      size="small"
      pagination={false}
      onRow={(r) => ({ onClick: () => setId(r.id), style: { cursor: 'pointer' } })}
      columns={[
        { title: 'PO', dataIndex: 'number', render: (v, r) => <Button type="link" onClick={() => setId(r.id)}>{v}</Button> },
        { title: 'Supplier', dataIndex: 'supplier' },
        { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={poColor[s]}>{s}</Tag> },
        { title: 'Lines', dataIndex: 'line_count', align: 'right' },
        { title: 'Total', render: (_, r) => money(r.total), align: 'right' },
      ]}
    />
  );
}

export default function InventoryApp() {
  const tab = useMemo(() => new URLSearchParams(location.search).get('tab') || 'stock', []);
  return (
    <div style={{ padding: 20 }}>
      <Typography.Title level={4} style={{ marginTop: 0 }}>Inventory</Typography.Title>
      <Tabs
        defaultActiveKey={tab}
        items={[
          { key: 'stock', label: 'Stock', children: <StockTab /> },
          { key: 'purchase-orders', label: 'Purchase orders', children: <PurchaseOrdersTab /> },
        ]}
      />
    </div>
  );
}
