import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'
import { formatDateTime, generateId } from '@/utils/format'

type OrderType = 'deposit' | 'payment'
type RuleStatus = 'enabled' | 'disabled'
type ApprovalStatus = 'pending' | 'approved' | 'rejected'

interface OrderValidityRule {
  id: string
  code: string
  orderType: OrderType
  validityMinutes: number
  approvalStatus: ApprovalStatus
  status: RuleStatus
  remark: string
  updatedBy: string
  updatedAt: string
  createdAt: string
}

type OrderValidityRuleForm = Omit<OrderValidityRule, 'id' | 'approvalStatus' | 'updatedBy' | 'updatedAt' | 'createdAt'>

const orderTypeOptions: { value: OrderType; label: string }[] = [
  { value: 'deposit', label: '定金订单' },
  { value: 'payment', label: '船款订单' },
]

const emptyForm: OrderValidityRuleForm = {
  code: 'VALID-NEW',
  orderType: 'deposit',
  validityMinutes: 30,
  status: 'enabled',
  remark: '',
}

function getOrderTypeLabel(type: OrderType) {
  return orderTypeOptions.find((item) => item.value === type)?.label || type
}

function createRule(form: OrderValidityRuleForm, approvalStatus: ApprovalStatus = 'pending'): OrderValidityRule {
  const now = new Date().toISOString()
  return {
    ...form,
    id: generateId(),
    approvalStatus,
    updatedBy: '当前用户',
    updatedAt: now,
    createdAt: now,
  }
}

const initialRules: OrderValidityRule[] = [
  createRule({ ...emptyForm, code: 'VALID-DEP-001', orderType: 'deposit', validityMinutes: 30, remark: '定金订单创建后30分钟内有效。' }, 'approved'),
  createRule({ ...emptyForm, code: 'VALID-PAY-001', orderType: 'payment', validityMinutes: 60, remark: '船款订单创建后60分钟内有效。' }, 'approved'),
]

export default function OrderValidityRulePage() {
  const [records, setRecords] = useState<OrderValidityRule[]>(initialRules)
  const [keyword, setKeyword] = useState('')
  const [orderTypeFilter, setOrderTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<OrderValidityRuleForm>(emptyForm)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<OrderValidityRule | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const filteredRecords = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return records.filter((item) => {
      const matchedKeyword = !kw || [item.code, item.remark].some((value) => value.toLowerCase().includes(kw))
      const matchedOrderType = orderTypeFilter === 'all' || item.orderType === orderTypeFilter
      const matchedStatus = statusFilter === 'all' || item.status === statusFilter
      return matchedKeyword && matchedOrderType && matchedStatus
    })
  }, [records, keyword, orderTypeFilter, statusFilter])

  const pageSize = 10
  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize)

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (record: OrderValidityRule) => {
    const { id: _id, approvalStatus: _approvalStatus, updatedBy: _updatedBy, updatedAt: _updatedAt, createdAt: _createdAt, ...nextForm } = record
    setEditingId(record.id)
    setForm(nextForm)
    setFormOpen(true)
  }

  const handleSubmit = () => {
    if (!form.code.trim() || form.validityMinutes <= 0) return
    const now = new Date().toISOString()
    if (editingId) {
      setRecords((prev) => prev.map((item) => item.id === editingId ? { ...item, ...form, updatedBy: '当前用户', updatedAt: now } : item))
    } else {
      setRecords((prev) => [createRule(form), ...prev])
      setPage(1)
    }
    setFormOpen(false)
  }

  const toggleStatus = (id: string) => {
    const now = new Date().toISOString()
    setRecords((prev) => prev.map((item) => item.id === id ? {
      ...item,
      status: item.status === 'enabled' ? 'disabled' : 'enabled',
      updatedBy: '当前用户',
      updatedAt: now,
    } : item))
  }

  const confirmDelete = () => {
    setRecords((prev) => prev.filter((item) => item.id !== confirmId))
    setConfirmOpen(false)
  }

  const columns = [
    { key: 'code', title: '字典编码', render: (r: OrderValidityRule) => <span className="font-mono text-xs">{r.code}</span> },
    { key: 'orderType', title: '订单类型', render: (r: OrderValidityRule) => getOrderTypeLabel(r.orderType) },
    { key: 'validityMinutes', title: '订单有效期', render: (r: OrderValidityRule) => `${r.validityMinutes} min` },
    { key: 'approvalStatus', title: '审批状态', render: (r: OrderValidityRule) => <StatusBadge status={r.approvalStatus} /> },
    { key: 'status', title: '状态', render: (r: OrderValidityRule) => <StatusBadge status={r.status} /> },
    { key: 'updatedBy', title: '修改人', dataIndex: 'updatedBy' as keyof OrderValidityRule },
    { key: 'updatedAt', title: '修改时间', render: (r: OrderValidityRule) => formatDateTime(r.updatedAt) },
    { key: 'actions', title: '操作', width: '190px', render: (r: OrderValidityRule) => (
      <div className="flex items-center gap-1">
        <button onClick={() => { setDetail(r); setDetailOpen(true) }} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">详情</button>
        <button onClick={() => openEdit(r)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">编辑</button>
        <button onClick={() => toggleStatus(r.id)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">{r.status === 'enabled' ? '禁用' : '启用'}</button>
        <button onClick={() => { setConfirmId(r.id); setConfirmOpen(true) }} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">删除</button>
      </div>
    ) },
  ]

  return (
    <div>
      <PageHeader title="订单有效期规则" description="按订单类型配置订单有效期，单位固定为 min" />
      <SearchPanel onSearch={() => setPage(1)} onReset={() => { setKeyword(''); setOrderTypeFilter('all'); setStatusFilter('all'); setPage(1) }}>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">关键词</label><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="编码/备注" className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">订单类型</label><select value={orderTypeFilter} onChange={(e) => setOrderTypeFilter(e.target.value)} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option>{orderTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">状态</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option><option value="enabled">启用</option><option value="disabled">禁用</option></select></div>
      </SearchPanel>

      <div className="bg-white px-9 py-6">
        <button onClick={openCreate} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700"><Plus className="w-4 h-4" />新增有效期规则</button>
      </div>

      <DataTable columns={columns} dataSource={pagedRecords} rowKey="id" pagination={{ current: page, pageSize, total: filteredRecords.length, onChange: setPage }} />

      <FormDialog open={formOpen} title={editingId ? '编辑订单有效期规则' : '新增订单有效期规则'} width="max-w-2xl" onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">字典信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">字典编码 <span className="text-red-500">*</span></label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">订单类型</label><select value={form.orderType} onChange={(e) => setForm({ ...form, orderType: e.target.value as OrderType })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{orderTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">订单有效期 <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2">
                  <input type="number" min={1} value={form.validityMinutes} onChange={(e) => setForm({ ...form, validityMinutes: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <span className="shrink-0 text-sm text-gray-600">min</span>
                </div>
              </div>
              <div><label className="block text-sm text-gray-700 mb-1">状态</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as RuleStatus })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="enabled">启用</option><option value="disabled">禁用</option></select></div>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">备注</label>
            <textarea value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="订单有效期规则详情" onClose={() => setDetailOpen(false)}>
        {detail && (<>
          <DetailCard title="字典信息"><DetailRow label="字典编码" value={detail.code} mono /><DetailRow label="订单类型" value={getOrderTypeLabel(detail.orderType)} /><DetailRow label="订单有效期" value={`${detail.validityMinutes} min`} /><DetailRow label="审批状态" value={<StatusBadge status={detail.approvalStatus} />} /><DetailRow label="状态" value={<StatusBadge status={detail.status} />} /></DetailCard>
          <DetailCard title="说明"><DetailRow label="备注" value={detail.remark || '-'} /></DetailCard>
          <DetailCard title="操作信息"><DetailRow label="修改人" value={detail.updatedBy} /><DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} /><DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} /></DetailCard>
        </>)}
      </DetailDrawer>

      <ConfirmDialog open={confirmOpen} title="删除订单有效期规则" message="确定要删除该有效期规则吗？此操作不可恢复。" danger onConfirm={confirmDelete} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}
