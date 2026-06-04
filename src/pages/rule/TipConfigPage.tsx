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
import { tickets } from '@/mock/data'

type TipStatus = 'enabled' | 'disabled'
type TipApprovalStatus = 'pending' | 'approved' | 'rejected'
type TipChargeType = 'none' | 'perDay' | 'perPerson' | 'perRoom'

interface TipTicketAmount {
  ticketId: string
  ticketName: string
  guestType: string
  amount: number
}

interface TipStandard {
  id: string
  code: string
  name: string
  marketCategory: string
  applyScope: ApplicableScope
  chargeType: TipChargeType
  ticketAmounts: TipTicketAmount[]
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

const chargeTypes: { value: TipChargeType; label: string }[] = [
  { value: 'none', label: '不收取' },
  { value: 'perDay', label: '按天收取' },
  { value: 'perPerson', label: '按人收取' },
  { value: 'perRoom', label: '按房收取' },
]

const guestTypeLabels: Record<string, string> = { adult: '成人', child: '儿童', baby: '婴儿' }
const activeTickets = tickets.filter((ticket) => ticket.status === 'enabled')

function createDefaultTicketAmounts(baseAmount = 50): TipTicketAmount[] {
  return activeTickets.map((ticket) => ({
    ticketId: ticket.id,
    ticketName: ticket.name,
    guestType: ticket.guestType,
    amount: ticket.guestType === 'adult' ? baseAmount : 0,
  }))
}

const emptyForm: TipStandardForm = {
  code: 'TIP-NEW',
  name: '',
  marketCategory: DEFAULT_MARKET_CATEGORY,
  applyScope: createDefaultApplicableScope(),
  chargeType: 'perDay',
  ticketAmounts: createDefaultTicketAmounts(50),
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

function formatTicketAmountSummary(type: TipChargeType, ticketAmounts: TipTicketAmount[]) {
  if (type === 'none') return '不收取'
  const enabledAmounts = ticketAmounts.filter((item) => item.amount > 0)
  if (enabledAmounts.length === 0) return '全部票类不收取'
  return enabledAmounts.slice(0, 3).map((item) => `${item.ticketName} ${formatTipAmount(type, item.amount)}`).join('；') + (enabledAmounts.length > 3 ? ` 等${enabledAmounts.length}类` : '')
}

function normalizeTicketAmounts(type: TipChargeType, ticketAmounts: TipTicketAmount[]) {
  return activeTickets.map((ticket) => {
    const existing = ticketAmounts.find((item) => item.ticketId === ticket.id)
    return {
      ticketId: ticket.id,
      ticketName: ticket.name,
      guestType: ticket.guestType,
      amount: type === 'none' ? 0 : Math.max(0, Number(existing?.amount ?? (ticket.guestType === 'adult' ? 50 : 0)) || 0),
    }
  })
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
  createTipStandard({ ...emptyForm, code: 'TIP-001', name: '内宾巫山标准小费', marketCategory: 'domestic_wushan', chargeType: 'perDay', ticketAmounts: createDefaultTicketAmounts(50), remark: '内宾巫山县标准航线按天收取小费，儿童和婴儿默认不收。' }, 'approved'),
  createTipStandard({ ...emptyForm, code: 'TIP-002', name: '外宾日本标准小费', marketCategory: 'foreign_japan', chargeType: 'perPerson', ticketAmounts: createDefaultTicketAmounts(100).map((item) => ({ ...item, amount: item.guestType === 'adult' ? 100 : item.guestType === 'child' ? 50 : 0 })), remark: '外宾日本市场按游客人数收取小费，儿童半额，婴儿不收。' }, 'pending'),
  createTipStandard({ ...emptyForm, code: 'TIP-003', name: '外宾美国包船小费标准', marketCategory: 'foreign_usa', chargeType: 'perRoom', ticketAmounts: createDefaultTicketAmounts(200).map((item) => ({ ...item, amount: item.guestType === 'adult' ? 200 : item.guestType === 'child' ? 100 : 0 })), remark: '外宾美国包船订单按房间收取小费，按票类区分收取金额。' }, 'approved'),
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
    setForm({ ...emptyForm, ticketAmounts: createDefaultTicketAmounts(50) })
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
    const normalizedForm = { ...form, ticketAmounts: normalizeTicketAmounts(form.chargeType, form.ticketAmounts) }
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

  const updateTicketAmount = (ticketId: string, amount: number) => {
    setForm((prev) => ({
      ...prev,
      ticketAmounts: normalizeTicketAmounts(prev.chargeType, prev.ticketAmounts).map((item) => item.ticketId === ticketId ? { ...item, amount: Math.max(0, amount) } : item),
    }))
  }

  const confirmDelete = () => {
    setRecords((prev) => prev.filter((item) => item.id !== confirmId))
    setConfirmOpen(false)
  }

  const columns = [
    { key: 'code', title: '标准编码', render: (r: TipStandard) => <span className="font-mono text-xs">{r.code}</span> },
    { key: 'name', title: '小费标准名称', dataIndex: 'name' as keyof TipStandard },
    { key: 'marketCategory', title: '市场类别', render: (r: TipStandard) => getMarketCategoryLabel(r.marketCategory) },
    { key: 'applyScope', title: '适用范围', render: (r: TipStandard) => formatApplicableScope(r.applyScope) },
    { key: 'chargeType', title: '收取方式', render: (r: TipStandard) => getChargeTypeLabel(r.chargeType) },
    { key: 'amount', title: '票类小费标准', render: (r: TipStandard) => (
      <div className="max-w-[320px] whitespace-normal leading-5">{formatTicketAmountSummary(r.chargeType, r.ticketAmounts)}</div>
    ) },
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
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">市场类别</label><select value={marketFilter} onChange={(e) => setMarketFilter(e.target.value)} className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option>{MARKET_CATEGORY_GROUPS.map((group) => <optgroup key={group} label={group}>{MARKET_CATEGORY_OPTIONS.filter((item) => item.parent === group).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</optgroup>)}</select></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">状态</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option><option value="enabled">启用</option><option value="disabled">禁用</option></select></div>
      </SearchPanel>

      <div className="bg-white px-9 py-6">
        <button onClick={openCreate} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700"><Plus className="w-4 h-4" />新增小费标准</button>
      </div>

      <DataTable columns={columns} dataSource={pagedRecords} rowKey="id" pagination={{ current: page, pageSize, total: filteredRecords.length, onChange: setPage }} />

      <FormDialog open={formOpen} title={editingId ? '编辑小费标准' : '新增小费标准'} width="max-w-5xl" onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基本信息</h4>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">标准编码 <span className="text-red-500">*</span></label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">小费标准名称 <span className="text-red-500">*</span></label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">市场类别</label><select value={form.marketCategory} onChange={(e) => setForm({ ...form, marketCategory: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{MARKET_CATEGORY_GROUPS.map((group) => <optgroup key={group} label={group}>{MARKET_CATEGORY_OPTIONS.filter((item) => item.parent === group).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</optgroup>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">收取方式</label><select value={form.chargeType} onChange={(e) => { const chargeType = e.target.value as TipChargeType; setForm({ ...form, chargeType, ticketAmounts: normalizeTicketAmounts(chargeType, form.ticketAmounts) }) }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{chargeTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">票类小费金额</h4>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500">票类</th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500">游客类型</th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500">收取方式</th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500">小费金额</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {normalizeTicketAmounts(form.chargeType, form.ticketAmounts).map((item) => (
                    <tr key={item.ticketId}>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.ticketName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{guestTypeLabels[item.guestType] || item.guestType}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{getChargeTypeLabel(form.chargeType)}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          disabled={form.chargeType === 'none'}
                          value={item.amount}
                          onChange={(e) => updateTicketAmount(item.ticketId, Number(e.target.value))}
                          className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-gray-500">同一小费规则下可按票类设置不同金额，例如成人票收取、儿童票减免、婴儿票不收取。</p>
          </div>

          <ApplicableScopeTransfer value={form.applyScope} onChange={(applyScope) => setForm({ ...form, applyScope })} />

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
          <DetailCard title="基本信息"><DetailRow label="标准编码" value={detail.code} mono /><DetailRow label="标准名称" value={detail.name} /><DetailRow label="市场类别" value={getMarketCategoryLabel(detail.marketCategory)} /><DetailRow label="适用范围" value={formatApplicableScope(detail.applyScope)} /><DetailRow label="审批状态" value={<StatusBadge status={detail.approvalStatus} />} /><DetailRow label="状态" value={<StatusBadge status={detail.status} />} /></DetailCard>
          <DetailCard title="小费标准"><DetailRow label="收取方式" value={getChargeTypeLabel(detail.chargeType)} /><DetailRow label="有效期" value={`${formatDate(detail.effectiveStart)} 至 ${formatDate(detail.effectiveEnd)}`} /><DetailRow label="规则说明" value={detail.remark || '-'} /></DetailCard>
          <DetailCard title="票类金额">
            <div className="space-y-2">
              {normalizeTicketAmounts(detail.chargeType, detail.ticketAmounts).map((item) => (
                <div key={item.ticketId} className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm">
                  <span className="text-gray-700">{item.ticketName} <span className="ml-1 text-xs text-gray-400">{guestTypeLabels[item.guestType] || item.guestType}</span></span>
                  <span className="font-medium text-gray-900">{formatTipAmount(detail.chargeType, item.amount)}</span>
                </div>
              ))}
            </div>
          </DetailCard>
          <DetailCard title="适用范围"><DetailRow label="产品/航次" value={<span className="whitespace-pre-line">{formatApplicableScopeDetail(detail.applyScope)}</span>} /></DetailCard>
          <DetailCard title="操作信息"><DetailRow label="修改人" value={detail.updatedBy} /><DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} /><DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} /></DetailCard>
        </>)}
      </DetailDrawer>

      <ConfirmDialog open={confirmOpen} title="删除小费标准" message="确定要删除该小费标准吗？此操作不可恢复。" danger onConfirm={confirmDelete} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}
