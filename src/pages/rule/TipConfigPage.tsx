import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'
import { formatDate, formatDateTime, generateId } from '@/utils/format'

type TipStatus = 'enabled' | 'disabled'
type TipApprovalStatus = 'pending' | 'approved' | 'rejected'
type TipChargeType = 'none' | 'perDay' | 'perPerson' | 'perRoom'

interface TipStandard {
  id: string
  code: string
  name: string
  marketCategory: string
  applyScope: string
  chargeType: TipChargeType
  amount: number
  effectiveStart: string
  effectiveEnd: string
  approvalStatus: TipApprovalStatus
  status: TipStatus
  remark: string
  updatedBy: string
  updatedAt: string
  createdAt: string
}

type TipStandardForm = Omit<TipStandard, 'id' | 'approvalStatus' | 'updatedBy' | 'updatedAt' | 'createdAt'>

const marketCategories = ['内宾', '外宾', '欧美', '中东', '团队', '包船']
const applyScopes = ['全部订单', '散客订单', '团队订单', '包船订单', '入境订单']
const chargeTypes: { value: TipChargeType; label: string }[] = [
  { value: 'none', label: '不收取' },
  { value: 'perDay', label: '按天收取' },
  { value: 'perPerson', label: '按人收取' },
  { value: 'perRoom', label: '按房收取' },
]

const emptyForm: TipStandardForm = {
  code: 'TIP-NEW',
  name: '',
  marketCategory: '内宾',
  applyScope: '全部订单',
  chargeType: 'perDay',
  amount: 50,
  effectiveStart: '2026-01-01',
  effectiveEnd: '2026-12-31',
  status: 'enabled',
  remark: '',
}

function getChargeTypeLabel(type: TipChargeType) {
  return chargeTypes.find((item) => item.value === type)?.label || type
}

function formatTipAmount(type: TipChargeType, amount: number) {
  if (type === 'none') return '不收取'
  if (type === 'perDay') return `${amount}元/天`
  if (type === 'perPerson') return `${amount}元/人`
  return `${amount}元/房`
}

function createTipStandard(form: TipStandardForm, approvalStatus: TipApprovalStatus = 'pending'): TipStandard {
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

const initialStandards: TipStandard[] = [
  createTipStandard({ ...emptyForm, code: 'TIP-001', name: '内宾标准小费', marketCategory: '内宾', chargeType: 'perDay', amount: 50, remark: '内宾标准航线按天收取小费。' }, 'approved'),
  createTipStandard({ ...emptyForm, code: 'TIP-002', name: '外宾标准小费', marketCategory: '外宾', chargeType: 'perPerson', amount: 100, remark: '外宾按游客人数收取小费。' }, 'pending'),
  createTipStandard({ ...emptyForm, code: 'TIP-003', name: '包船小费标准', marketCategory: '包船', applyScope: '包船订单', chargeType: 'perRoom', amount: 200, remark: '包船订单按房间收取小费。' }, 'approved'),
]

export default function TipConfigPage() {
  const [records, setRecords] = useState<TipStandard[]>(initialStandards)
  const [keyword, setKeyword] = useState('')
  const [marketFilter, setMarketFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TipStandardForm>(emptyForm)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<TipStandard | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const filteredRecords = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return records.filter((item) => {
      const matchedKeyword = !kw || [item.code, item.name, item.remark].some((value) => value.toLowerCase().includes(kw))
      const matchedMarket = marketFilter === 'all' || item.marketCategory === marketFilter
      const matchedStatus = statusFilter === 'all' || item.status === statusFilter
      return matchedKeyword && matchedMarket && matchedStatus
    })
  }, [records, keyword, marketFilter, statusFilter])

  const pageSize = 10
  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize)

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (record: TipStandard) => {
    const { id: _id, approvalStatus: _approvalStatus, updatedBy: _updatedBy, updatedAt: _updatedAt, createdAt: _createdAt, ...nextForm } = record
    setEditingId(record.id)
    setForm(nextForm)
    setFormOpen(true)
  }

  const handleSubmit = () => {
    if (!form.code.trim() || !form.name.trim()) return
    const now = new Date().toISOString()
    const normalizedForm = { ...form, amount: form.chargeType === 'none' ? 0 : form.amount }
    if (editingId) {
      setRecords((prev) => prev.map((item) => item.id === editingId ? { ...item, ...normalizedForm, updatedBy: '当前用户', updatedAt: now } : item))
    } else {
      setRecords((prev) => [createTipStandard(normalizedForm), ...prev])
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
    { key: 'code', title: '标准编码', render: (r: TipStandard) => <span className="font-mono text-xs">{r.code}</span> },
    { key: 'name', title: '小费标准名称', dataIndex: 'name' as keyof TipStandard },
    { key: 'marketCategory', title: '市场类别', dataIndex: 'marketCategory' as keyof TipStandard },
    { key: 'applyScope', title: '适用范围', dataIndex: 'applyScope' as keyof TipStandard },
    { key: 'chargeType', title: '收取方式', render: (r: TipStandard) => getChargeTypeLabel(r.chargeType) },
    { key: 'amount', title: '小费标准', render: (r: TipStandard) => formatTipAmount(r.chargeType, r.amount) },
    { key: 'effective', title: '有效期', render: (r: TipStandard) => `${formatDate(r.effectiveStart)} 至 ${formatDate(r.effectiveEnd)}` },
    { key: 'approvalStatus', title: '审批状态', render: (r: TipStandard) => <StatusBadge status={r.approvalStatus} /> },
    { key: 'status', title: '状态', render: (r: TipStandard) => <StatusBadge status={r.status} /> },
    { key: 'updatedAt', title: '修改时间', render: (r: TipStandard) => formatDateTime(r.updatedAt) },
    { key: 'actions', title: '操作', width: '190px', render: (r: TipStandard) => (
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
      <PageHeader title="小费标准管理" description="维护不同市场类别、订单范围和收取方式下的小费标准" />
      <SearchPanel onSearch={() => setPage(1)} onReset={() => { setKeyword(''); setMarketFilter('all'); setStatusFilter('all'); setPage(1) }}>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">关键词</label><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="编码/名称/备注" className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">市场类别</label><select value={marketFilter} onChange={(e) => setMarketFilter(e.target.value)} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option>{marketCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">状态</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option><option value="enabled">启用</option><option value="disabled">禁用</option></select></div>
      </SearchPanel>

      <div className="bg-white px-9 py-6">
        <button onClick={openCreate} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700"><Plus className="w-4 h-4" />新增小费标准</button>
      </div>

      <DataTable columns={columns} dataSource={pagedRecords} rowKey="id" pagination={{ current: page, pageSize, total: filteredRecords.length, onChange: setPage }} />

      <FormDialog open={formOpen} title={editingId ? '编辑小费标准' : '新增小费标准'} width="max-w-4xl" onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基本信息</h4>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">标准编码 <span className="text-red-500">*</span></label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">小费标准名称 <span className="text-red-500">*</span></label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">市场类别</label><select value={form.marketCategory} onChange={(e) => setForm({ ...form, marketCategory: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{marketCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">适用范围</label><select value={form.applyScope} onChange={(e) => setForm({ ...form, applyScope: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{applyScopes.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">收取方式</label><select value={form.chargeType} onChange={(e) => setForm({ ...form, chargeType: e.target.value as TipChargeType, amount: e.target.value === 'none' ? 0 : form.amount })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{chargeTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">小费金额</label><input type="number" disabled={form.chargeType === 'none'} value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50" /></div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">生效控制</h4>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">生效开始日期</label><input type="date" value={form.effectiveStart} onChange={(e) => setForm({ ...form, effectiveStart: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">生效结束日期</label><input type="date" value={form.effectiveEnd} onChange={(e) => setForm({ ...form, effectiveEnd: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">状态</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TipStatus })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="enabled">启用</option><option value="disabled">禁用</option></select></div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">规则说明</label>
            <textarea value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="小费标准详情" onClose={() => setDetailOpen(false)}>
        {detail && (<>
          <DetailCard title="基本信息"><DetailRow label="标准编码" value={detail.code} mono /><DetailRow label="标准名称" value={detail.name} /><DetailRow label="市场类别" value={detail.marketCategory} /><DetailRow label="适用范围" value={detail.applyScope} /><DetailRow label="审批状态" value={<StatusBadge status={detail.approvalStatus} />} /><DetailRow label="状态" value={<StatusBadge status={detail.status} />} /></DetailCard>
          <DetailCard title="小费标准"><DetailRow label="收取方式" value={getChargeTypeLabel(detail.chargeType)} /><DetailRow label="小费金额" value={formatTipAmount(detail.chargeType, detail.amount)} /><DetailRow label="有效期" value={`${formatDate(detail.effectiveStart)} 至 ${formatDate(detail.effectiveEnd)}`} /><DetailRow label="规则说明" value={detail.remark || '-'} /></DetailCard>
          <DetailCard title="操作信息"><DetailRow label="修改人" value={detail.updatedBy} /><DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} /><DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} /></DetailCard>
        </>)}
      </DetailDrawer>

      <ConfirmDialog open={confirmOpen} title="删除小费标准" message="确定要删除该小费标准吗？此操作不可恢复。" danger onConfirm={confirmDelete} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}
