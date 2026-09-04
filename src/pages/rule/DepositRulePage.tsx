import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'
import DealerGroupScopeSelector from '@/components/rule/DealerGroupScopeSelector'
import { DEALER_RULE_GROUPS, formatDealerGroupSummary } from '@/mock/dealerRuleGroups'
import { formatDateTime, generateId } from '@/utils/format'

type RuleStatus = 'enabled' | 'disabled'
type DepositDeadlineType = 'beforeSail' | 'afterBooking'
type TimeUnit = 'day' | 'hour'
type DepositDimension = '按人' | '按房' | '按订单'
type DepositCalculationType = 'fixed' | 'percent'
type DepositTrigger = 'orderConfirmed' | 'inventoryLocked' | 'specialPriceApproved' | 'contractConfirmed'
type DepositFeeScope = 'cruiseFare' | 'orderTotal'
type DepositOverdueAction = 'cancelAndRelease' | 'manualReview' | 'keepOrder'

interface DepositConfigFields {
  chargeDeposit: boolean
  calculationType: DepositCalculationType
  dimension: DepositDimension
  amount: number
  feeScope: DepositFeeScope
  paymentTrigger: DepositTrigger
  deadlineType: DepositDeadlineType
  deadlineValue: number
  deadlineTimeUnit: TimeUnit
  offsetPayment: boolean
  overdueAction: DepositOverdueAction
}

interface DefaultDepositRule extends DepositConfigFields {
  id: 'default'
  status: RuleStatus
  approvalStatus: 'pending' | 'approved' | 'rejected'
  updatedBy: string
  updatedAt: string
}

interface DepositRule {
  id: string
  name: string
  approvalStatus: 'pending' | 'approved' | 'rejected'
  status: RuleStatus
  dealerGroupIds: string[]
  config: DepositConfigFields
  updatedBy: string
  updatedAt: string
  createdAt: string
}

type DepositRuleForm = Omit<DepositRule, 'id' | 'approvalStatus' | 'updatedBy' | 'updatedAt' | 'createdAt'>
type DefaultDepositRuleForm = Omit<DefaultDepositRule, 'id' | 'approvalStatus' | 'updatedBy' | 'updatedAt'>

const dimensionOptions: DepositDimension[] = ['按人', '按房', '按订单']

const calculationTypeOptions: { value: DepositCalculationType; label: string }[] = [
  { value: 'fixed', label: '固定金额' },
  { value: 'percent', label: '按金额比例' },
]

const statusOptions: { value: RuleStatus; label: string }[] = [
  { value: 'enabled', label: '启用' },
  { value: 'disabled', label: '关闭' },
]

const triggerOptions: { value: DepositTrigger; label: string }[] = [
  { value: 'orderConfirmed', label: '订单确认后' },
  { value: 'inventoryLocked', label: '库存锁定后' },
  { value: 'specialPriceApproved', label: '特价审批通过后' },
  { value: 'contractConfirmed', label: '合同确认后' },
]

const deadlineTypeOptions: { value: DepositDeadlineType; label: string }[] = [
  { value: 'beforeSail', label: '开航前' },
  { value: 'afterBooking', label: '预定后' },
]

const timeUnitOptions: { value: TimeUnit; label: string }[] = [
  { value: 'day', label: '天' },
  { value: 'hour', label: '小时' },
]

const feeScopeOptions: { value: DepositFeeScope; label: string }[] = [
  { value: 'cruiseFare', label: '仅船票金额' },
  { value: 'orderTotal', label: '订单总额（含附加产品）' },
]

const overdueActionOptions: { value: DepositOverdueAction; label: string }[] = [
  { value: 'cancelAndRelease', label: '取消订单并释放库存' },
  { value: 'manualReview', label: '转人工审核' },
  { value: 'keepOrder', label: '保留订单并提醒' },
]

const defaultConfigFields: DepositConfigFields = {
  chargeDeposit: true,
  calculationType: 'fixed',
  dimension: '按人',
  amount: 300,
  feeScope: 'cruiseFare',
  paymentTrigger: 'inventoryLocked',
  deadlineType: 'afterBooking',
  deadlineValue: 24,
  deadlineTimeUnit: 'hour',
  offsetPayment: true,
  overdueAction: 'cancelAndRelease',
}

const initialDefaultRule: DefaultDepositRule = {
  id: 'default',
  status: 'enabled',
  approvalStatus: 'approved',
  updatedBy: '系统管理员',
  updatedAt: '2026-03-01T10:00:00.000Z',
  ...defaultConfigFields,
}

function getTimeUnitLabel(unit: TimeUnit) {
  return timeUnitOptions.find((item) => item.value === unit)?.label || unit
}

const emptyForm: DepositRuleForm = {
  name: '',
  status: 'enabled',
  dealerGroupIds: [],
  config: { ...defaultConfigFields },
}

function createDepositRule(form: DepositRuleForm): DepositRule {
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

const initialSpecialRules: DepositRule[] = [
  createDepositRule({
    name: 'A组核心分销商优惠定金',
    status: 'enabled',
    dealerGroupIds: ['group_a'],
    config: { ...defaultConfigFields, amount: 200 },
  }),
  createDepositRule({
    name: 'D组与OTA专享全额保障定金',
    status: 'enabled',
    dealerGroupIds: ['group_d', 'group_ota'],
    config: {
      ...defaultConfigFields,
      calculationType: 'percent',
      amount: 30,
      feeScope: 'orderTotal',
      deadlineType: 'afterBooking',
      deadlineValue: 12,
      deadlineTimeUnit: 'hour',
    },
  }),
]

function formatDeadline(fields: DepositConfigFields) {
  const prefix = fields.deadlineType === 'beforeSail' ? '开航前' : '预定后'
  return `${prefix} ${fields.deadlineValue}${getTimeUnitLabel(fields.deadlineTimeUnit)}`
}

function getOptionLabel<T extends string>(options: { value: T; label: string }[], value: T) {
  return options.find((item) => item.value === value)?.label || value
}

function formatAmount(fields: DepositConfigFields) {
  if (!fields.chargeDeposit) return '不收取'
  if (fields.calculationType === 'percent') return `${fields.amount}%`
  const suffix = fields.dimension === '按房' ? '元/房' : fields.dimension === '按订单' ? '元/单' : '元/人'
  return `${fields.amount}${suffix}`
}

function DepositConfigFieldsEditor({
  fields,
  onChange,
}: {
  fields: DepositConfigFields
  onChange: <K extends keyof DepositConfigFields>(field: K, value: DepositConfigFields[K]) => void
}) {
  const disabled = !fields.chargeDeposit
  const fixedAmount = fields.calculationType === 'fixed'

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div>
        <label className="mb-1 block text-xs text-gray-500">是否收取定金</label>
        <select value={fields.chargeDeposit ? 'yes' : 'no'} onChange={(e) => onChange('chargeDeposit', e.target.value === 'yes')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="yes">是</option>
          <option value="no">否，直接进入船款支付</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">计算方式</label>
        <select
          value={fields.calculationType}
          disabled={disabled}
          onChange={(e) => onChange('calculationType', e.target.value as DepositCalculationType)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
        >
          {calculationTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">收取维度</label>
        <select
          value={fields.dimension}
          disabled={disabled || !fixedAmount}
          onChange={(e) => onChange('dimension', e.target.value as DepositDimension)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
        >
          {dimensionOptions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">{fixedAmount ? '定金金额' : '定金比例（%）'}</label>
        <NumberStepper
          value={fields.amount}
          min={0}
          max={fields.calculationType === 'percent' ? 100 : undefined}
          step={fields.calculationType === 'percent' ? 1 : 10}
          disabled={disabled}
          onChange={(value) => onChange('amount', value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">计价范围</label>
        <select
          value={fields.feeScope}
          disabled={disabled || fixedAmount}
          onChange={(e) => onChange('feeScope', e.target.value as DepositFeeScope)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
        >
          {feeScopeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">支付触发点</label>
        <select
          value={fields.paymentTrigger}
          disabled={disabled}
          onChange={(e) => onChange('paymentTrigger', e.target.value as DepositTrigger)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
        >
          {triggerOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">定金支付期限</label>
        <div className="flex flex-wrap items-center gap-1.5">
          <select value={fields.deadlineType} disabled={disabled} onChange={(e) => onChange('deadlineType', e.target.value as DepositDeadlineType)} className="rounded-lg border border-gray-300 px-2 py-2 text-sm disabled:bg-gray-50">
            {deadlineTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <NumberStepper value={fields.deadlineValue} min={0} step={1} disabled={disabled} onChange={(value) => onChange('deadlineValue', value)} compact />
          <select value={fields.deadlineTimeUnit} disabled={disabled} onChange={(e) => onChange('deadlineTimeUnit', e.target.value as TimeUnit)} className="rounded-lg border border-gray-300 px-2 py-2 text-sm disabled:bg-gray-50">
            {timeUnitOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">是否抵扣船款</label>
        <select value={fields.offsetPayment ? 'yes' : 'no'} disabled={disabled} onChange={(e) => onChange('offsetPayment', e.target.value === 'yes')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50">
          <option value="yes">是</option>
          <option value="no">否</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">逾期未付处理</label>
        <select
          value={fields.overdueAction}
          disabled={disabled}
          onChange={(e) => onChange('overdueAction', e.target.value as DepositOverdueAction)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
        >
          {overdueActionOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
      </div>
    </div>
  )
}



function NumberStepper({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  disabled = false,
  compact = false,
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  compact?: boolean
}) {
  const clamp = (nextValue: number) => Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min, nextValue))
  const widthClass = compact ? 'w-14' : 'w-20'
  return (
    <div className={`inline-flex items-center rounded border border-gray-300 bg-white ${disabled ? 'opacity-50' : ''}`}>
      <button type="button" disabled={disabled} onClick={() => onChange(clamp(value - step))} className="px-2 py-1.5 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed">−</button>
      <input type="number" disabled={disabled} value={value} min={min} max={max} step={step} onChange={(e) => onChange(clamp(Number(e.target.value) || 0))} className={`${widthClass} border-x border-gray-300 px-1 py-1.5 text-center text-xs focus:outline-none`} />
      <button type="button" disabled={disabled} onClick={() => onChange(clamp(value + step))} className="px-2 py-1.5 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed">+</button>
    </div>
  )
}

export default function DepositRulePage() {
  const [defaultRule, setDefaultRule] = useState<DefaultDepositRule>(initialDefaultRule)
  const [defaultFormOpen, setDefaultFormOpen] = useState(false)
  const [defaultForm, setDefaultForm] = useState<DefaultDepositRuleForm>({ status: 'enabled', ...defaultConfigFields })

  const [records, setRecords] = useState<DepositRule[]>(initialSpecialRules)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<DepositRuleForm>(emptyForm)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<DepositRule | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const filteredRecords = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return records.filter((item) => {
      const matchedKeyword = !kw || item.name.toLowerCase().includes(kw)
      const matchedStatus = statusFilter === 'all' || item.status === statusFilter
      return matchedKeyword && matchedStatus
    })
  }, [records, keyword, statusFilter])

  const pageSize = 10
  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize)

  const openDefaultEdit = () => {
    const { id: _id, approvalStatus: _approvalStatus, updatedBy: _updatedBy, updatedAt: _updatedAt, ...nextForm } = defaultRule
    setDefaultForm(nextForm)
    setDefaultFormOpen(true)
  }

  const handleDefaultSubmit = () => {
    const now = new Date().toISOString()
    setDefaultRule((prev) => ({ ...prev, ...defaultForm, updatedBy: '当前用户', updatedAt: now }))
    setDefaultFormOpen(false)
  }

  const toggleDefaultStatus = () => {
    const now = new Date().toISOString()
    setDefaultRule((prev) => ({
      ...prev,
      status: prev.status === 'enabled' ? 'disabled' : 'enabled',
      updatedBy: '当前用户',
      updatedAt: now,
    }))
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, config: { ...defaultConfigFields } })
    setFormOpen(true)
  }

  const openEdit = (record: DepositRule) => {
    const { id: _id, approvalStatus: _approvalStatus, updatedBy: _updatedBy, updatedAt: _updatedAt, createdAt: _createdAt, ...nextForm } = record
    setEditingId(record.id)
    setForm({ ...nextForm, config: { ...nextForm.config }, dealerGroupIds: [...nextForm.dealerGroupIds] })
    setFormOpen(true)
  }

  const handleSubmit = () => {
    if (!form.name.trim() || form.dealerGroupIds.length === 0) return
    const now = new Date().toISOString()
    if (editingId) {
      setRecords((prev) => prev.map((item) => item.id === editingId ? { ...item, ...form, updatedBy: '当前用户', updatedAt: now } : item))
    } else {
      setRecords((prev) => [createDepositRule(form), ...prev])
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

  const updateConfigField = <K extends keyof DepositConfigFields>(field: K, value: DepositConfigFields[K]) => {
    setForm({ ...form, config: { ...form.config, [field]: value } })
  }

  const updateDefaultField = <K extends keyof DefaultDepositRuleForm>(field: K, value: DefaultDepositRuleForm[K]) => {
    setDefaultForm({ ...defaultForm, [field]: value })
  }

  const updateDefaultConfigField = <K extends keyof DepositConfigFields>(field: K, value: DepositConfigFields[K]) => {
    setDefaultForm({ ...defaultForm, [field]: value })
  }

  const columns = [
    { key: 'name', title: '规则名称', dataIndex: 'name' as keyof DepositRule },
    { key: 'scope', title: '适用范围', render: (r: DepositRule) => (
      <span className="font-medium text-gray-900">{formatDealerGroupSummary(r.dealerGroupIds)}</span>
    ) },
    { key: 'amount', title: '定金标准', render: (r: DepositRule) => formatAmount(r.config) },
    { key: 'approvalStatus', title: '审批状态', render: (r: DepositRule) => <StatusBadge status={r.approvalStatus} /> },
    { key: 'status', title: '状态', render: (r: DepositRule) => (
      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${r.status === 'enabled' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
        {r.status === 'enabled' ? '启用' : '关闭'}
      </span>
    ) },
    { key: 'updatedAt', title: '修改时间', render: (r: DepositRule) => formatDateTime(r.updatedAt) },
    { key: 'actions', title: '操作', width: '190px', render: (r: DepositRule) => (
      <div className="flex items-center gap-1">
        <button onClick={() => { setDetail(r); setDetailOpen(true) }} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">详情</button>
        <button onClick={() => openEdit(r)} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">编辑</button>
        <button onClick={() => toggleStatus(r.id)} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">{r.status === 'enabled' ? '关闭' : '启用'}</button>
        <button onClick={() => { setConfirmId(r.id); setConfirmOpen(true) }} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">删除</button>
      </div>
    ) },
  ]

  return (
    <div>
      <PageHeader title="定金规则管理" description="维护定金收取方式、支付节点与逾期处理；默认规则全局兜底，特殊规则按分销商分组生效（不关联产品）" />

      <div className="mx-9 mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">默认定金规则</h3>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700">全局生效</span>
              <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${defaultRule.status === 'enabled' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {defaultRule.status === 'enabled' ? '启用' : '关闭'}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">对全部分销商、航线与订单生效；未命中特殊规则时默认执行此配置</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button onClick={toggleDefaultStatus} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              {defaultRule.status === 'enabled' ? '关闭' : '启用'}
            </button>
            <button onClick={openDefaultEdit} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
              <Pencil className="h-3.5 w-3.5" /> 编辑
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <div className="rounded-lg bg-gray-50 px-4 py-3"><div className="text-xs text-gray-500">定金标准</div><div className="mt-1 text-sm font-medium text-gray-900">{formatAmount(defaultRule)}</div></div>
          <div className="rounded-lg bg-gray-50 px-4 py-3"><div className="text-xs text-gray-500">支付触发点</div><div className="mt-1 text-sm font-medium text-gray-900">{getOptionLabel(triggerOptions, defaultRule.paymentTrigger)}</div></div>
          <div className="rounded-lg bg-gray-50 px-4 py-3"><div className="text-xs text-gray-500">支付期限</div><div className="mt-1 text-sm font-medium text-gray-900">{formatDeadline(defaultRule)}</div></div>
          <div className="rounded-lg bg-gray-50 px-4 py-3"><div className="text-xs text-gray-500">抵扣船款</div><div className="mt-1 text-sm font-medium text-gray-900">{defaultRule.offsetPayment ? '是' : '否'}</div></div>
          <div className="rounded-lg bg-gray-50 px-4 py-3"><div className="text-xs text-gray-500">逾期未付处理</div><div className="mt-1 text-sm font-medium text-gray-900">{getOptionLabel(overdueActionOptions, defaultRule.overdueAction)}</div></div>
          <div className="rounded-lg bg-gray-50 px-4 py-3"><div className="text-xs text-gray-500">审批状态</div><div className="mt-1"><StatusBadge status={defaultRule.approvalStatus} /></div></div>
          <div className="rounded-lg bg-gray-50 px-4 py-3"><div className="text-xs text-gray-500">最近修改</div><div className="mt-1 text-sm font-medium text-gray-900">{formatDateTime(defaultRule.updatedAt)}</div></div>
        </div>
      </div>

      <SearchPanel onSearch={() => setPage(1)} onReset={() => { setKeyword(''); setStatusFilter('all'); setPage(1) }}>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">关键词</label><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="特殊规则名称" className="w-44 rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">状态</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="all">全部</option>{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      </SearchPanel>

      <div className="bg-white px-9 py-6">
        <button onClick={openCreate} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700"><Plus className="h-4 w-4" />新增特殊规则</button>
      </div>

      <DataTable columns={columns} dataSource={pagedRecords} rowKey="id" pagination={{ current: page, pageSize, total: filteredRecords.length, onChange: setPage }} />

      <FormDialog open={defaultFormOpen} title="编辑默认定金规则" width="max-w-3xl" onCancel={() => setDefaultFormOpen(false)} onSubmit={handleDefaultSubmit}>
        <div className="space-y-5">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            默认定金规则全局唯一，对所有产品与渠道生效，无需指定分销商分组。
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">状态</label>
            <select value={defaultForm.status} onChange={(e) => updateDefaultField('status', e.target.value as RuleStatus)} className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
          <DepositConfigFieldsEditor fields={defaultForm} onChange={updateDefaultConfigField} />
        </div>
      </FormDialog>

      <FormDialog open={formOpen} title={editingId ? '编辑特殊规则' : '新增特殊规则'} width="max-w-5xl" onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">基本信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-gray-700">规则名称 <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="请输入特殊规则名称" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">状态</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as RuleStatus })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 适用范围（选择分销商分组，不关联产品）与已选范围 */}
          <DealerGroupScopeSelector
            selectedGroupIds={form.dealerGroupIds}
            onChange={(ids) => setForm({ ...form, dealerGroupIds: ids })}
          />

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">规则配置（共用一套）</h4>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <DepositConfigFieldsEditor fields={form.config} onChange={updateConfigField} />
            </div>
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="特殊规则详情" onClose={() => setDetailOpen(false)}>
        {detail && (<>
          <DetailCard title="基本信息">
            <DetailRow label="规则名称" value={detail.name} />
            <DetailRow
              label="适用范围"
              value={
                detail.dealerGroupIds.length === 0 ? '未配置' : (
                  <div className="space-y-1">
                    {detail.dealerGroupIds.map((gid) => {
                      const g = DEALER_RULE_GROUPS.find((item) => item.id === gid)
                      return (
                        <div key={gid} className="text-xs text-gray-700">
                          • <span className="font-medium text-gray-900">{g?.name || gid}</span>
                          {g?.description && <span className="text-gray-500">（{g.description}）</span>}
                        </div>
                      )
                    })}
                  </div>
                )
              }
            />
            <DetailRow label="审批状态" value={<StatusBadge status={detail.approvalStatus} />} />
            <DetailRow label="状态" value={detail.status === 'enabled' ? '启用' : '关闭'} />
          </DetailCard>
          <DetailCard title="规则配置">
            <DetailRow label="定金标准" value={formatAmount(detail.config)} />
            <DetailRow label="支付触发点" value={getOptionLabel(triggerOptions, detail.config.paymentTrigger)} />
            <DetailRow label="支付期限" value={formatDeadline(detail.config)} />
            <DetailRow label="计价范围" value={detail.config.calculationType === 'percent' ? getOptionLabel(feeScopeOptions, detail.config.feeScope) : '-'} />
            <DetailRow label="抵扣船款" value={detail.config.offsetPayment ? '是' : '否'} />
            <DetailRow label="逾期处理" value={getOptionLabel(overdueActionOptions, detail.config.overdueAction)} />
          </DetailCard>
          <DetailCard title="操作信息">
            <DetailRow label="修改人" value={detail.updatedBy} />
            <DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} />
            <DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} />
          </DetailCard>
        </>)}
      </DetailDrawer>

      <ConfirmDialog open={confirmOpen} title="删除特殊规则" message="确定要删除该特殊规则吗？此操作不可恢复。" danger onConfirm={confirmDelete} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}
