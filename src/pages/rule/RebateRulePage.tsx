import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'
import ApplicableScopeTransfer, {
  createDefaultApplicableScope,
  formatApplicableScope,
  formatApplicableScopeDetail,
  type ApplicableScope,
} from '@/components/rule/ApplicableScopeTransfer'
import { formatDate, formatDateTime, generateId } from '@/utils/format'
import type {
  RebatePolicy,
  RebatePolicyForm,
  RebatePolicyStatus,
  RebatePolicyType,
  RebateSalesBase,
  RebateSettlementCycle,
  RebateTier,
} from '@/types'

const policyTypeOptions: { value: RebatePolicyType; label: string }[] = [
  { value: 'rebate_point', label: '返利点' },
  { value: 'sales_rebate', label: '销售额返利' },
  { value: 'penalty_refund', label: '违约金返还' },
]

const settlementCycleOptions: { value: RebateSettlementCycle; label: string }[] = [
  { value: 'voyage', label: '按航次' },
  { value: 'monthly', label: '按月' },
  { value: 'yearly', label: '按年度' },
]

const salesBaseOptions: { value: RebateSalesBase; label: string }[] = [
  { value: 'settlement_price', label: '订单结算价' },
  { value: 'order_amount', label: '订单金额' },
]

const statusOptions: { value: RebatePolicyStatus; label: string }[] = [
  { value: 'draft', label: '草稿' },
  { value: 'enabled', label: '已生效' },
  { value: 'disabled', label: '已失效' },
]

const emptyTier = (): RebateTier => ({
  id: generateId(),
  minValue: 0,
  maxValue: null,
  rebateValue: 0,
})

const emptyForm: RebatePolicyForm = {
  code: 'REB-NEW',
  name: '',
  policyType: 'rebate_point',
  settlementCycle: 'voyage',
  applyScope: createDefaultApplicableScope(),
  effectiveStart: '2026-01-01',
  effectiveEnd: '2026-12-31',
  priority: 10,
  baseRebatePoint: 0,
  bonusRebatePoint: 0,
  salesBase: 'settlement_price',
  tiers: [emptyTier()],
  confirmationRateThreshold: 50,
  makeupDaysBeforeSail: 3,
  remindLowConfirmRate: true,
  remindBeforeMakeupDeadline: true,
  remindGuaranteeOnSettlement: true,
  allowFallback: true,
  quotaLimit: null,
  remark: '',
  status: 'draft',
}

function createPolicy(form: RebatePolicyForm, status: RebatePolicyStatus = form.status): RebatePolicy {
  const now = new Date().toISOString()
  return {
    ...form,
    id: generateId(),
    status,
    updatedBy: '当前用户',
    updatedAt: now,
    createdAt: now,
  }
}

const initialPolicies: RebatePolicy[] = [
  createPolicy({
    ...emptyForm,
    code: 'REB-001',
    name: '差航次临时提高返利点',
    policyType: 'rebate_point',
    settlementCycle: 'voyage',
    priority: 5,
    baseRebatePoint: 2,
    bonusRebatePoint: 1.5,
    status: 'enabled',
    remark: '航次销售不佳时临时提高返利点，与价格直减政策并存，成交后按航次结算。',
  }),
  createPolicy({
    ...emptyForm,
    code: 'REB-002',
    name: '季度销售额阶梯返利',
    policyType: 'sales_rebate',
    settlementCycle: 'monthly',
    priority: 20,
    salesBase: 'settlement_price',
    tiers: [
      { id: generateId(), minValue: 0, maxValue: 100, rebateValue: 1 },
      { id: generateId(), minValue: 100, maxValue: 300, rebateValue: 1.5 },
      { id: generateId(), minValue: 300, maxValue: null, rebateValue: 2 },
    ],
    status: 'enabled',
    remark: '按季度结算销售额返利；保证金未付清仅结算前提醒，不自动剔除订单。',
  }),
  createPolicy({
    ...emptyForm,
    code: 'REB-003',
    name: '年度违约金按完成率返还',
    policyType: 'penalty_refund',
    settlementCycle: 'yearly',
    priority: 30,
    confirmationRateThreshold: 50,
    makeupDaysBeforeSail: 3,
    tiers: [
      { id: generateId(), minValue: 50, maxValue: 70, rebateValue: 50 },
      { id: generateId(), minValue: 70, maxValue: null, rebateValue: 100 },
    ],
    status: 'enabled',
    remark: '航次级违约金开航后一次性结算；T-3 内补齐确定人数则不计违约；年度按任务完成率返还已扣违约金。',
  }),
]

function getPolicyTypeLabel(type: RebatePolicyType) {
  return policyTypeOptions.find((item) => item.value === type)?.label || type
}

function getSettlementCycleLabel(cycle: RebateSettlementCycle) {
  return settlementCycleOptions.find((item) => item.value === cycle)?.label || cycle
}

function getSalesBaseLabel(base: RebateSalesBase) {
  return salesBaseOptions.find((item) => item.value === base)?.label || base
}

function formatTierRange(tier: RebateTier, policyType: RebatePolicyType) {
  const unit = policyType === 'penalty_refund' ? '%' : '万元'
  const suffix = policyType === 'penalty_refund' ? '完成率' : '销售额'
  return `${tier.minValue}${unit} - ${tier.maxValue !== null ? `${tier.maxValue}${unit}` : '不限'}（${suffix}）`
}

function formatTierValue(tier: RebateTier, policyType: RebatePolicyType) {
  if (policyType === 'rebate_point') return `${tier.rebateValue} 点`
  if (policyType === 'sales_rebate') return `返利 ${tier.rebateValue}%`
  return `返还 ${tier.rebateValue}%`
}

function formatRuleSummary(policy: RebatePolicy) {
  if (policy.policyType === 'rebate_point') {
    return `基础 ${policy.baseRebatePoint} 点 + 临时加成 ${policy.bonusRebatePoint} 点`
  }
  if (policy.policyType === 'sales_rebate') {
    const first = policy.tiers[0]
    return first ? `${getSalesBaseLabel(policy.salesBase)}，${formatTierRange(first, policy.policyType)} ${formatTierValue(first, policy.policyType)}` : '-'
  }
  return `确认率阈值 ${policy.confirmationRateThreshold}%，T-${policy.makeupDaysBeforeSail} 补齐不计违约`
}

function sanitizeTiers(tiers: RebateTier[]) {
  return tiers.map((tier) => ({
    ...tier,
    minValue: Math.max(0, Number(tier.minValue) || 0),
    maxValue: tier.maxValue === null ? null : Math.max(0, Number(tier.maxValue) || 0),
    rebateValue: Math.max(0, Number(tier.rebateValue) || 0),
  }))
}

export default function RebateRulePage() {
  const [records, setRecords] = useState<RebatePolicy[]>(initialPolicies)
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<RebatePolicyForm>(emptyForm)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<RebatePolicy | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const filteredRecords = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return records.filter((item) => {
      const matchedKeyword = !kw || [item.code, item.name, item.remark].some((value) => value.toLowerCase().includes(kw))
      const matchedType = typeFilter === 'all' || item.policyType === typeFilter
      const matchedStatus = statusFilter === 'all' || item.status === statusFilter
      return matchedKeyword && matchedType && matchedStatus
    })
  }, [records, keyword, typeFilter, statusFilter])

  const pageSize = 10
  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize)

  const resetFilters = () => {
    setKeyword('')
    setTypeFilter('all')
    setStatusFilter('all')
    setPage(1)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, applyScope: createDefaultApplicableScope(), tiers: [emptyTier()] })
    setFormOpen(true)
  }

  const openEdit = (record: RebatePolicy) => {
    const { id: _id, updatedBy: _updatedBy, updatedAt: _updatedAt, createdAt: _createdAt, ...nextForm } = record
    setEditingId(record.id)
    setForm({
      ...nextForm,
      applyScope: { ...nextForm.applyScope, productIds: [...nextForm.applyScope.productIds], voyageIds: [...nextForm.applyScope.voyageIds] },
      tiers: nextForm.tiers.map((tier) => ({ ...tier })),
    })
    setFormOpen(true)
  }

  const updateTier = <K extends keyof RebateTier>(id: string, key: K, value: RebateTier[K]) => {
    setForm((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier) => (tier.id === id ? { ...tier, [key]: value } : tier)),
    }))
  }

  const addTier = () => {
    setForm((prev) => {
      const lastTier = prev.tiers[prev.tiers.length - 1]
      const nextMin = lastTier?.maxValue ?? (lastTier ? lastTier.minValue + 100 : 0)
      return {
        ...prev,
        tiers: [...prev.tiers, { ...emptyTier(), minValue: nextMin }],
      }
    })
  }

  const removeTier = (id: string) => {
    setForm((prev) => ({
      ...prev,
      tiers: prev.tiers.length > 1 ? prev.tiers.filter((tier) => tier.id !== id) : prev.tiers,
    }))
  }

  const handlePolicyTypeChange = (policyType: RebatePolicyType) => {
    setForm((prev) => ({
      ...prev,
      policyType,
      settlementCycle: policyType === 'penalty_refund' ? 'yearly' : policyType === 'sales_rebate' ? 'monthly' : 'voyage',
      tiers: policyType === 'rebate_point'
        ? []
        : policyType === 'penalty_refund'
          ? [
            { id: generateId(), minValue: 50, maxValue: 70, rebateValue: 50 },
            { id: generateId(), minValue: 70, maxValue: null, rebateValue: 100 },
          ]
          : [{ id: generateId(), minValue: 0, maxValue: 100, rebateValue: 1 }],
    }))
  }

  const submit = () => {
    if (!form.code.trim() || !form.name.trim()) return
    if (form.policyType !== 'rebate_point' && form.tiers.length === 0) return
    const now = new Date().toISOString()
    const normalizedForm: RebatePolicyForm = {
      ...form,
      tiers: form.policyType === 'rebate_point' ? [] : sanitizeTiers(form.tiers),
      quotaLimit: form.quotaLimit === null || form.quotaLimit === undefined ? null : Math.max(0, Number(form.quotaLimit) || 0),
    }
    if (editingId) {
      setRecords((prev) => prev.map((item) => item.id === editingId
        ? { ...item, ...normalizedForm, updatedBy: '当前用户', updatedAt: now }
        : item))
    } else {
      setRecords((prev) => [createPolicy(normalizedForm), ...prev])
      setPage(1)
    }
    setFormOpen(false)
  }

  const toggleStatus = (id: string) => {
    const now = new Date().toISOString()
    setRecords((prev) => prev.map((item) => {
      if (item.id !== id) return item
      const nextStatus: RebatePolicyStatus = item.status === 'enabled' ? 'disabled' : 'enabled'
      return { ...item, status: nextStatus, updatedBy: '当前用户', updatedAt: now }
    }))
  }

  const confirmDelete = () => {
    setRecords((prev) => prev.filter((item) => item.id !== confirmId))
    setConfirmOpen(false)
  }

  const tierMinLabel = form.policyType === 'penalty_refund' ? '完成率下限(%)' : '销售额下限(万元)'
  const tierMaxLabel = form.policyType === 'penalty_refund' ? '完成率上限(%)' : '销售额上限(万元)'
  const tierValueLabel = form.policyType === 'penalty_refund' ? '返还比例(%)' : '返利比例(%)'

  const columns = [
    { key: 'code', title: '政策编码', render: (r: RebatePolicy) => <span className="font-mono text-xs">{r.code}</span> },
    { key: 'name', title: '政策名称', dataIndex: 'name' as keyof RebatePolicy },
    { key: 'policyType', title: '政策类型', render: (r: RebatePolicy) => getPolicyTypeLabel(r.policyType) },
    { key: 'settlementCycle', title: '结算周期', render: (r: RebatePolicy) => getSettlementCycleLabel(r.settlementCycle) },
    { key: 'applyScope', title: '适用范围', render: (r: RebatePolicy) => formatApplicableScope(r.applyScope) },
    { key: 'rule', title: '返利规则', render: (r: RebatePolicy) => <span className="text-xs text-gray-600">{formatRuleSummary(r)}</span> },
    { key: 'priority', title: '优先级', dataIndex: 'priority' as keyof RebatePolicy },
    { key: 'effective', title: '有效期', render: (r: RebatePolicy) => `${formatDate(r.effectiveStart)} 至 ${formatDate(r.effectiveEnd)}` },
    { key: 'status', title: '状态', render: (r: RebatePolicy) => <StatusBadge status={r.status} /> },
    { key: 'updatedAt', title: '修改时间', render: (r: RebatePolicy) => formatDateTime(r.updatedAt) },
    { key: 'actions', title: '操作', width: '190px', render: (r: RebatePolicy) => (
      <div className="flex items-center gap-1">
        <button onClick={() => { setDetail(r); setDetailOpen(true) }} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">详情</button>
        <button onClick={() => openEdit(r)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">编辑</button>
        <button onClick={() => toggleStatus(r.id)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">{r.status === 'enabled' ? '失效' : '生效'}</button>
        <button onClick={() => { setConfirmId(r.id); setConfirmOpen(true) }} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">删除</button>
      </div>
    ) },
  ]

  return (
    <div>
      <PageHeader
        title="返利政策管理"
        description="配置成交后结算的返利规则：返利点、销售额返利、违约金返还。保证金仅提醒不拦截；航次违约金开航后一次性结算。"
      />

      <SearchPanel onSearch={() => setPage(1)} onReset={resetFilters}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">关键词</label>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="编码/名称/备注" className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">政策类型</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">全部</option>
            {policyTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">状态</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">全部</option>
            {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
      </SearchPanel>

      <div className="bg-white px-9 py-6">
        <button onClick={openCreate} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700">
          <Plus className="w-4 h-4" />添加返利政策
        </button>
      </div>

      <DataTable
        columns={columns}
        dataSource={pagedRecords}
        rowKey="id"
        pagination={{ current: page, pageSize, total: filteredRecords.length, onChange: setPage }}
      />

      <FormDialog open={formOpen} title={editingId ? '编辑返利政策' : '添加返利政策'} width="max-w-5xl" onCancel={() => setFormOpen(false)} onSubmit={submit}>
        <div className="space-y-6">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基本信息</h4>
            <div className="grid grid-cols-4 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">政策编码 <span className="text-red-500">*</span></label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">政策名称 <span className="text-red-500">*</span></label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">政策类型</label>
                <select value={form.policyType} onChange={(e) => handlePolicyTypeChange(e.target.value as RebatePolicyType)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {policyTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">结算周期</label>
                <select value={form.settlementCycle} onChange={(e) => setForm({ ...form, settlementCycle: e.target.value as RebateSettlementCycle })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {settlementCycleOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <div><label className="block text-sm text-gray-700 mb-1">优先级</label><input type="number" min={1} value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">生效开始</label><input type="date" value={form.effectiveStart} onChange={(e) => setForm({ ...form, effectiveStart: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">生效结束</label><input type="date" value={form.effectiveEnd} onChange={(e) => setForm({ ...form, effectiveEnd: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">状态</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as RebatePolicyStatus })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <ApplicableScopeTransfer value={form.applyScope as ApplicableScope} onChange={(applyScope) => setForm({ ...form, applyScope })} />

          {form.policyType === 'rebate_point' && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">返利点规则</h4>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-700 mb-1">基础返利点</label><input type="number" min={0} step={0.1} value={form.baseRebatePoint} onChange={(e) => setForm({ ...form, baseRebatePoint: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                <div><label className="block text-sm text-gray-700 mb-1">临时加成返利点</label><input type="number" min={0} step={0.1} value={form.bonusRebatePoint} onChange={(e) => setForm({ ...form, bonusRebatePoint: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              </div>
              <p className="mt-2 text-xs text-gray-500">成交后按航次结算，不改变下单结算价。</p>
            </div>
          )}

          {form.policyType === 'sales_rebate' && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">销售额返利阶梯</h4>
                <button type="button" onClick={addTier} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700">
                  <Plus className="w-4 h-4" />添加阶梯
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-1">销售额口径</label>
                <select value={form.salesBase} onChange={(e) => setForm({ ...form, salesBase: e.target.value as RebateSalesBase })} className="w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {salesBaseOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <TierTable tiers={form.tiers} minLabel={tierMinLabel} maxLabel={tierMaxLabel} valueLabel={tierValueLabel} onUpdate={updateTier} onRemove={removeTier} canRemove={form.tiers.length > 1} />
            </div>
          )}

          {form.policyType === 'penalty_refund' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">航次违约金（开航后结算）</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm text-gray-700 mb-1">定金确认率阈值(%)</label><input type="number" min={0} max={100} value={form.confirmationRateThreshold} onChange={(e) => setForm({ ...form, confirmationRateThreshold: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                  <div><label className="block text-sm text-gray-700 mb-1">补齐窗口（开航前N天）</label><input type="number" min={1} value={form.makeupDaysBeforeSail} onChange={(e) => setForm({ ...form, makeupDaysBeforeSail: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                </div>
                <p className="mt-2 text-xs text-gray-500">开航前仅提醒；开航后结算时，T-{form.makeupDaysBeforeSail} 内已补齐确定人数则违约金为 0。</p>
              </div>
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">年度违约金返还阶梯</h4>
                  <button type="button" onClick={addTier} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700">
                    <Plus className="w-4 h-4" />添加阶梯
                  </button>
                </div>
                <TierTable tiers={form.tiers} minLabel={tierMinLabel} maxLabel={tierMaxLabel} valueLabel={tierValueLabel} onUpdate={updateTier} onRemove={removeTier} canRemove={form.tiers.length > 1} />
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">提醒与高级配置</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.remindLowConfirmRate} onChange={(e) => setForm({ ...form, remindLowConfirmRate: e.target.checked })} />低确认率提醒</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.remindBeforeMakeupDeadline} onChange={(e) => setForm({ ...form, remindBeforeMakeupDeadline: e.target.checked })} />临近补齐截止提醒</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.remindGuaranteeOnSettlement} onChange={(e) => setForm({ ...form, remindGuaranteeOnSettlement: e.target.checked })} />结算前保证金核对提醒</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.allowFallback} onChange={(e) => setForm({ ...form, allowFallback: e.target.checked })} />允许多政策命中后回退</label>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">政策名额（可选）</label>
                <input type="number" min={0} value={form.quotaLimit ?? ''} onChange={(e) => setForm({ ...form, quotaLimit: e.target.value === '' ? null : Number(e.target.value) })} placeholder="不限制" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">备注</label>
            <textarea value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="返利政策详情" onClose={() => setDetailOpen(false)}>
        {detail && (
          <>
            <DetailCard title="基本信息">
              <DetailRow label="政策编码" value={detail.code} mono />
              <DetailRow label="政策名称" value={detail.name} />
              <DetailRow label="政策类型" value={getPolicyTypeLabel(detail.policyType)} />
              <DetailRow label="结算周期" value={getSettlementCycleLabel(detail.settlementCycle)} />
              <DetailRow label="优先级" value={String(detail.priority)} />
              <DetailRow label="适用范围" value={formatApplicableScope(detail.applyScope)} />
              <DetailRow label="有效期" value={`${formatDate(detail.effectiveStart)} 至 ${formatDate(detail.effectiveEnd)}`} />
              <DetailRow label="状态" value={<StatusBadge status={detail.status} />} />
            </DetailCard>
            <DetailCard title="适用范围">
              <DetailRow label="适用产品" value={<span className="whitespace-pre-line">{formatApplicableScopeDetail(detail.applyScope)}</span>} />
            </DetailCard>
            <DetailCard title="返利规则">
              {detail.policyType === 'rebate_point' && (
                <>
                  <DetailRow label="基础返利点" value={`${detail.baseRebatePoint} 点`} />
                  <DetailRow label="临时加成返利点" value={`${detail.bonusRebatePoint} 点`} />
                </>
              )}
              {detail.policyType === 'sales_rebate' && (
                <>
                  <DetailRow label="销售额口径" value={getSalesBaseLabel(detail.salesBase)} />
                  <div className="space-y-2 mt-2">
                    {detail.tiers.map((tier) => (
                      <div key={tier.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600">
                        {formatTierRange(tier, detail.policyType)} → {formatTierValue(tier, detail.policyType)}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {detail.policyType === 'penalty_refund' && (
                <>
                  <DetailRow label="确认率阈值" value={`${detail.confirmationRateThreshold}%`} />
                  <DetailRow label="补齐窗口" value={`开航前 ${detail.makeupDaysBeforeSail} 天`} />
                  <DetailRow label="结算时点" value="开航后一次性结算" />
                  <div className="space-y-2 mt-2">
                    {detail.tiers.map((tier) => (
                      <div key={tier.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600">
                        年度完成率 {formatTierRange(tier, detail.policyType)} → {formatTierValue(tier, detail.policyType)}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </DetailCard>
            <DetailCard title="提醒与高级配置">
              <DetailRow label="低确认率提醒" value={detail.remindLowConfirmRate ? '开启' : '关闭'} />
              <DetailRow label="临近补齐截止提醒" value={detail.remindBeforeMakeupDeadline ? '开启' : '关闭'} />
              <DetailRow label="结算前保证金核对" value={detail.remindGuaranteeOnSettlement ? '开启' : '关闭'} />
              <DetailRow label="允许回退" value={detail.allowFallback ? '是' : '否'} />
              <DetailRow label="政策名额" value={detail.quotaLimit !== null ? String(detail.quotaLimit) : '不限制'} />
            </DetailCard>
            <DetailCard title="操作信息">
              <DetailRow label="备注" value={detail.remark || '-'} />
              <DetailRow label="修改人" value={detail.updatedBy} />
              <DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} />
              <DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} />
            </DetailCard>
          </>
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={confirmOpen}
        title="删除返利政策"
        message="确定要删除该返利政策吗？删除后相关结算将无法引用此政策。"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}

function TierTable({
  tiers,
  minLabel,
  maxLabel,
  valueLabel,
  onUpdate,
  onRemove,
  canRemove,
}: {
  tiers: RebateTier[]
  minLabel: string
  maxLabel: string
  valueLabel: string
  onUpdate: <K extends keyof RebateTier>(id: string, key: K, value: RebateTier[K]) => void
  onRemove: (id: string) => void
  canRemove: boolean
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500">
          <tr>
            <th className="px-3 py-3">{minLabel}</th>
            <th className="px-3 py-3">{maxLabel}</th>
            <th className="px-3 py-3">{valueLabel}</th>
            <th className="px-3 py-3 text-center">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {tiers.map((tier) => (
            <tr key={tier.id}>
              <td className="px-3 py-3"><input type="number" min={0} value={tier.minValue} onChange={(e) => onUpdate(tier.id, 'minValue', Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></td>
              <td className="px-3 py-3"><input type="number" min={0} value={tier.maxValue ?? ''} onChange={(e) => onUpdate(tier.id, 'maxValue', e.target.value === '' ? null : Number(e.target.value))} placeholder="不限" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></td>
              <td className="px-3 py-3"><input type="number" min={0} step={0.1} value={tier.rebateValue} onChange={(e) => onUpdate(tier.id, 'rebateValue', Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></td>
              <td className="px-3 py-3 text-center">
                <button type="button" onClick={() => onRemove(tier.id)} disabled={!canRemove} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-300">
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
