import { useMemo, useState } from 'react';
import { App, Avatar, Button, DatePicker, Drawer, Flex, Form, Input, InputNumber, Popconfirm, Segmented, Select, Space, Table, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAction, useQuery, useUser, toast } from '@meadow/sdk';

type Deal = {
  id: string;
  title: string;
  stage: string;
  amount: number | null;
  close_date: string | null;
  company_id: string;
  company: string;
  owner_id: string | null;
  owner_name: string | null;
  updated_at: string;
  total: number;
};

const STAGES = ['lead', 'qualified', 'proposal', 'won', 'lost'];
const STAGE_COLOR: Record<string, string | undefined> = { lead: undefined, qualified: 'blue', proposal: 'purple', won: 'green', lost: 'red' };
const PALETTE = ['#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#64748b'];
const PAGE = 10;

const money = (n: number | null) => (n == null ? '—' : '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 }));
const initials = (n: string) => n.split(/\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase();
const colorFor = (n: string) => PALETTE[n.charCodeAt(0) % PALETTE.length];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function ago(ts: string) {
  const d = dayjs(ts);
  const mins = dayjs().diff(d, 'minute');
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const h = dayjs().diff(d, 'hour');
  if (h < 24) return `${h} h ago`;
  const days = dayjs().startOf('day').diff(d.startOf('day'), 'day');
  if (days <= 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return d.format('MMM D, YYYY');
}

function Person({ name }: { name: string | null }) {
  if (!name) return <Typography.Text type="secondary">—</Typography.Text>;
  return (
    <Space size={8}>
      <Avatar size={22} style={{ background: colorFor(name), fontSize: 9.5, fontWeight: 700 }}>
        {initials(name)}
      </Avatar>
      {name}
    </Space>
  );
}

export default function SalesCRM() {
  const { message } = App.useApp();
  const user = useUser();
  const [stage, setStage] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Deal | 'new' | null>(null);
  const [form] = Form.useForm();

  const args = useMemo(
    () => ({ stage: stage === 'all' ? null : stage, search: search.trim() || null, limit: PAGE, offset: (page - 1) * PAGE }),
    [stage, search, page],
  );
  const deals = useQuery('list_deals', args);
  const companies = useQuery('list_companies');
  const owners = useQuery('list_owners');
  const create = useAction('create_deal');
  const update = useAction('update_deal');
  const remove = useAction('delete_deal');

  const rows = deals.rows as Deal[];
  const total = rows.length ? Number(rows[0].total) : 0;

  const open = (d: Deal | 'new') => {
    setEditing(d);
    form.resetFields();
    if (d === 'new') {
      form.setFieldsValue({ stage: 'lead', owner_id: user?.id });
    } else {
      form.setFieldsValue({ ...d, amount: d.amount == null ? null : Number(d.amount), close_date: d.close_date ? dayjs(d.close_date) : null });
    }
  };

  const save = async () => {
    const v = await form.validateFields();
    const payload = { ...v, close_date: v.close_date ? v.close_date.format('YYYY-MM-DD') : null };
    try {
      if (editing === 'new') {
        await create.run(payload);
        toast('Deal created');
        setStage('all');
        setPage(1);
      } else if (editing) {
        await update.run({ id: editing.id, ...payload });
        toast('Deal updated');
      }
      setEditing(null);
      deals.refetch();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const del = async () => {
    if (!editing || editing === 'new') return;
    try {
      await remove.run({ id: editing.id });
      toast('Deal deleted');
      setEditing(null);
      deals.refetch();
    } catch (e: any) {
      message.error(e.status === 404 || e.status === 403 ? 'Only Sales Ops can delete deals' : e.message);
    }
  };

  const columns = [
    { title: 'Deal', dataIndex: 'title', render: (t: string) => <span style={{ fontWeight: 500 }}>{t}</span> },
    { title: 'Company', dataIndex: 'company' },
    { title: 'Stage', dataIndex: 'stage', render: (s: string) => <Tag color={STAGE_COLOR[s]} bordered={!STAGE_COLOR[s]}>{s}</Tag> },
    { title: 'Amount', dataIndex: 'amount', align: 'right' as const, render: money },
    { title: 'Owner', dataIndex: 'owner_name', render: (n: string | null) => <Person name={n} /> },
    { title: 'Updated', dataIndex: 'updated_at', render: (t: string) => <Typography.Text type="secondary">{ago(t)}</Typography.Text> },
  ];

  return (
    <div>
      <Flex align="center" justify="space-between" style={{ marginBottom: 12 }} gap={8} wrap>
        <Typography.Title level={5} style={{ margin: 0, fontSize: 16 }}>
          Deals
        </Typography.Title>
        <Space size={8} wrap>
          <Input.Search
            allowClear
            placeholder="Search deals"
            style={{ width: 180 }}
            onSearch={(v) => {
              setSearch(v);
              setPage(1);
            }}
          />
          <Segmented
            value={stage}
            onChange={(v) => {
              setStage(String(v));
              setPage(1);
            }}
            options={[{ label: 'All', value: 'all' }, ...STAGES.slice(0, 4).map((s) => ({ label: cap(s), value: s }))]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => open('new')}>
            New deal
          </Button>
        </Space>
      </Flex>
      <Table<Deal>
        rowKey="id"
        size="middle"
        bordered={false}
        loading={deals.loading}
        dataSource={rows}
        columns={columns}
        onRow={(d) => ({ onClick: () => open(d), style: { cursor: 'pointer' } })}
        locale={{ emptyText: deals.error ? deals.error.message : 'No deals in this stage' }}
        pagination={{
          current: page,
          pageSize: PAGE,
          total,
          size: 'small',
          onChange: setPage,
          showTotal: (t) => `${rows.length} of ${t}`,
          hideOnSinglePage: false,
        }}
        style={{ border: '1px solid var(--bd, rgba(128,128,128,.18))', borderRadius: 10, overflow: 'hidden' }}
      />
      <Drawer
        title={editing === 'new' ? 'New deal' : 'Edit deal'}
        open={!!editing}
        width={360}
        onClose={() => setEditing(null)}
        destroyOnClose
        footer={
          <Flex justify="space-between">
            <div>
              {editing && editing !== 'new' && (
                <Popconfirm title="Delete this deal?" okText="Delete" okButtonProps={{ danger: true }} onConfirm={del}>
                  <Button danger type="text">
                    Delete
                  </Button>
                </Popconfirm>
              )}
            </div>
            <Space>
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="primary" loading={create.loading || update.loading} onClick={save}>
                {editing === 'new' ? 'Create deal' : 'Save changes'}
              </Button>
            </Space>
          </Flex>
        }
      >
        <Form form={form} layout="vertical" requiredMark>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }, { max: 200 }]}>
            <Input placeholder="e.g. Annual renewal" autoFocus />
          </Form.Item>
          <Form.Item name="company_id" label="Company" rules={[{ required: true, message: 'Pick a company' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              loading={companies.loading}
              options={companies.rows.map((c: any) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="amount" label="Amount (USD)">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
          <Form.Item name="stage" label="Stage">
            <Select options={STAGES.map((s) => ({ value: s, label: s }))} />
          </Form.Item>
          <Form.Item name="close_date" label="Close date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="owner_id" label="Owner">
            <Select showSearch optionFilterProp="label" options={owners.rows.map((o: any) => ({ value: o.id, label: o.name }))} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
