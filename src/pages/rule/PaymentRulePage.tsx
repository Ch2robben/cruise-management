import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'
import ApplicableScopeTransfer, { createDefaultApplicableScope, formatApplicableScope, formatApplicableScopeDetail, type ApplicableScope } from '@/components/rule/ApplicableScopeTransfer'
import { formatDate, formatDateTime, generateId } from '@/utils/format'
import { DEFAULT_MARKET_CATEGORY, MARKET_CATEGORY_GROUPS, MARKET_CATEGORY_OPTIONS, getMarketCategoryLabel } from '@/utils/constants'

type PaymentStatus = 'effective' | 'disabled'

interface PaymentRule {
  id: string
  name: string
  approvalStatus: 'pending' | 'approved' | 'rejected'
  applyScope: ApplicableScope
  marketCategory: string
  sailingStart: string
  sailingEnd: string
  deadlineDaysBeforeSail: number
  status: PaymentStatus
  updatedBy: string
  updatedAt: string
  createdAt: string
}

type PaymentRuleForm = Omit<PaymentRule, 'id' | 'approvalStatus' | 'updatedBy' | 'updatedAt' | 'createdAt'>

const emptyForm: PaymentRuleForm = {
  name: '',
  applyScope: createDefaultApplicableScope(),
  marketCategory: DEFAULT_MARKET_CATEGORY,
  sailingStart: '2025-06-01',
  sailingEnd: '2026-12-31',
  deadlineDaysBeforeSail: 7,
  status: 'effective',
}

const statusOptions: { value: PaymentStatus; label: string }[] = [
  { value: 'effective', label: '有效' },
  { value: 'disabled', label: '无效' },
]

function createPaymentRule(form: PaymentRuleForm): PaymentRule {
  const now = new Date().toISOString()
  return {
    ...form,
    id: generateId(),
    approvalStatus: 'pending',
    updatedBy: '当前用户',
    updatedAt: now,
    createdAt: now,
  }
}

const initialRules: PaymentRule[] = [
  createPaymentRule({ ...emptyForm, name: '内宾巫山船款', marketCategory: 'domestic_wushan', deadlineDaysBeforeSail: 7 }),
  createPaymentRule({ ...emptyForm, name: '外宾日本船款', marketCategory: 'foreign_japan', sailingStart: '2025-07-01', deadlineDaysBeforeSail: 15 }),
  createPaymentRule({ ...emptyForm, name: '外宾美国船款', marketCategory: 'foreign_usa', sailingStart: '2025-06-01', sailingEnd: '2026-12-31', deadlineDaysBeforeSail: 30 }),
]

export default function PaymentRulePage() {
  const [records, setRecords] = useState<PaymentRule[]>(initialRules)
  const [keyword, setKeyword] = useState('')
  const [marketFilter, setMarketFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PaymentRuleForm>(emptyForm)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<PaymentRule | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const filteredRecords = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return records.filter((item) => {
      const matchedKeyword = !kw || item.name.toLowerCase().includes(kw)
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

  const openEdit = (record: PaymentRule) => {
    const { id: _id, approvalStatus: _approvalStatus, updatedBy: _updatedBy, updatedAt: _updatedAt, createdAt: _createdAt, ...nextForm } = record
    setEditingId(record.id)
    setForm(nextForm)
    setFormOpen(true)
  }

  const handleSubmit = () => {
    if (!form.name.trim()) return
    const now = new Date().toISOString()
    if (editingId) {
      setRecords((prev) => prev.map((item) => item.id === editingId ? { ...item, ...form, updatedBy: '当前用户', updatedAt: now } : item))
    } else {
      setRecords((prev) => [createPaymentRule(form), ...prev])
      setPage(1)
    }
    setFormOpen(false)
  }

  const toggleStatus = (id: string) => {
    const now = new Date().toISOString()
    setRecords((prev) => prev.map((item) => item.id === id ? {
      ...item,
      status: item.status === 'effective' ? 'disabled' : 'effective',
      updatedBy: '当前用户',
      updatedAt: now,
    } : item))
  }

  const confirmDelete = () => {
    setRecords((prev) => prev.filter((item) => item.id !== confirmId))
    setConfirmOpen(false)
  }

  const columns = [
    { key: 'name', title: '船款规则名称', dataIndex: 'name' as keyof PaymentRule },
    { key: 'applyScope', title: '适用范围', render: (r: PaymentRule) => formatApplicableScope(r.applyScope) },
    { key: 'marketCategory', title: '市场类别', render: (r: PaymentRule) => getMarketCategoryLabel(r.marketCategory) },
    { key: 'sailingPeriod', title: '船期', render: (r: PaymentRule) => `${formatDate(r.sailingStart)} 至 ${formatDate(r.sailingEnd)}` },
    { key: 'deadline', title: '船款期限', render: (r: PaymentRule) => `开船前 ${r.deadlineDaysBeforeSail} 天` },
    { key: 'approvalStatus', title: '审批状态', render: (r: PaymentRule) => <StatusBadge status={r.approvalStatus} /> },
    { key: 'status', title: '状态', render: (r: PaymentRule) => <StatusBadge status={r.status} /> },
    { key: 'updatedAt', title: '修改时间', render: (r: PaymentRule) => formatDateTime(r.updatedAt) },
    { key: 'actions', title: '操作', width: '190px', render: (r: PaymentRule) => (
      <div className="flex items-center gap-1">
        <button onClick={() => { setDetail(r); setDetailOpen(true) }} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">详情</button>
        <button onClick={() => openEdit(r)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">编辑</button>
        <button onClick={() => toggleStatus(r.id)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">{r.status === 'effective' ? '禁用' : '启用'}</button>
        <button onClick={() => { setConfirmId(r.id); setConfirmOpen(true) }} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">删除</button>
      </div>
    ) },
  ]

  return (
    <div>
      <PageHeader title="船款规则管理" description="维护船款规则名称、市场类别、船期与开船前付款期限" />
      <SearchPanel onSearch={() => setPage(1)} onReset={() => { setKeyword(''); setMarketFilter('all'); setStatusFilter('all'); setPage(1) }}>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">关键词</label><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="船款规则名称" className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">市场类别</label><select value={marketFilter} onChange={(e) => setMarketFilter(e.target.value)} className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option>{MARKET_CATEGORY_GROUPS.map((group) => <optgroup key={group} label={group}>{MARKET_CATEGORY_OPTIONS.filter((item) => item.parent === group).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</optgroup>)}</select></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">状态</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option>{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      </SearchPanel>

      <div className="bg-white px-9 py-6">
        <button onClick={openCreate} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700"><Plus className="w-4 h-4" />新增船款规则</button>
      </div>

      <DataTable columns={columns} dataSource={pagedRecords} rowKey="id" pagination={{ current: page, pageSize, total: filteredRecords.length, onChange: setPage }} />

      <FormDialog open={formOpen} title={editingId ? '编辑船款规则信息' : '新增船款规则信息'} width="max-w-5xl" onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基本信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">船款规则名称 <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">市场类别</label>
                <select value={form.marketCategory} onChange={(e) => setForm({ ...form, marketCategory: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{MARKET_CATEGORY_GROUPS.map((group) => <optgroup key={group} label={group}>{MARKET_CATEGORY_OPTIONS.filter((item) => item.parent === group).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</optgroup>)}</select>
              </div>
            </div>
          </div>

          <ApplicableScopeTransfer value={form.applyScope} onChange={(applyScope) => setForm({ ...form, applyScope })} />

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">船期与期限</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">船期开始 <span className="text-red-500">*</span></label>
                <input type="date" value={form.sailingStart} onChange={(e) => setForm({ ...form, sailingStart: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">船期结束 <span className="text-red-500">*</span></label>
                <input type="date" value={form.sailingEnd} onChange={(e) => setForm({ ...form, sailingEnd: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">船款期限 <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-sm text-gray-600">开船前</span>
                  <input type="number" value={form.deadlineDaysBeforeSail} onChange={(e) => setForm({ ...form, deadlineDaysBeforeSail: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <span className="shrink-0 text-sm text-gray-600">天</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">状态</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PaymentStatus })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
              </div>
            </div>
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="船款规则详情" onClose={() => setDetailOpen(false)}>
        {detail && (<>
          <DetailCard title="基本信息"><DetailRow label="规则名称" value={detail.name} /><DetailRow label="适用范围" value={formatApplicableScope(detail.applyScope)} /><DetailRow label="市场类别" value={getMarketCategoryLabel(detail.marketCategory)} /><DetailRow label="审批状态" value={<StatusBadge status={detail.approvalStatus} />} /><DetailRow label="状态" value={<StatusBadge status={detail.status} />} /></DetailCard>
          <DetailCard title="船款规则"><DetailRow label="船期" value={`${formatDate(detail.sailingStart)} 至 ${formatDate(detail.sailingEnd)}`} /><DetailRow label="船款期限" value={`开船前 ${detail.deadlineDaysBeforeSail} 天`} /></DetailCard>
          <DetailCard title="适用范围"><DetailRow label="适用产品" value={<span className="whitespace-pre-line">{formatApplicableScopeDetail(detail.applyScope)}</span>} /></DetailCard>
          <DetailCard title="操作信息"><DetailRow label="修改人" value={detail.updatedBy} /><DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} /><DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} /></DetailCard>
        </>)}
      </DetailDrawer>

      <ConfirmDialog open={confirmOpen} title="删除船款规则" message="确定要删除该船款规则吗？此操作不可恢复。" danger onConfirm={confirmDelete} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}
