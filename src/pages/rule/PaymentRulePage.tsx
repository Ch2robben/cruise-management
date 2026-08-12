import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'
import { products } from '@/mock/data'
import { formatDate, formatDateTime, generateId } from '@/utils/format'

type RuleStatus = 'enabled' | 'disabled'
type PaymentFeeScope = 'cruiseFare' | 'orderTotal'
type LateBookingPolicy = 'immediateFull' | 'withinHours' | 'manualReview'
type PaymentOverdueAction = 'triggerPenalty' | 'manualReview' | 'cancelOrder'

interface PaymentConfigFields {
  sailingStart: string
  sailingEnd: string
  collectionStartDaysBeforeSail: number
  paymentDeadlineDaysBeforeSail: number
  feeScope: PaymentFeeScope
  deductDeposit: boolean
  lateBookingPolicy: LateBookingPolicy
  lateBookingHours: number
  overdueAction: PaymentOverdueAction
}

interface PaymentScopeItem {
  id: string
  productId: string
  productName: string
  routeId: string
  routeName: string
  roomTypes: string[]
}

interface DefaultPaymentRule extends PaymentConfigFields {
  id: 'default'
  status: RuleStatus
  approvalStatus: 'pending' | 'approved' | 'rejected'
  updatedBy: string
  updatedAt: string
}

interface PaymentRule {
  id: string
  name: string
  approvalStatus: 'pending' | 'approved' | 'rejected'
  status: RuleStatus
  scopeItems: PaymentScopeItem[]
  config: PaymentConfigFields
  updatedBy: string
  updatedAt: string
  createdAt: string
}

type PaymentRuleForm = Omit<PaymentRule, 'id' | 'approvalStatus' | 'updatedBy' | 'updatedAt' | 'createdAt'>
type DefaultPaymentRuleForm = Omit<DefaultPaymentRule, 'id' | 'approvalStatus' | 'updatedBy' | 'updatedAt'>

const statusOptions: { value: RuleStatus; label: string }[] = [
  { value: 'enabled', label: '启用' },
  { value: 'disabled', label: '关闭' },
]

const feeScopeOptions: { value: PaymentFeeScope; label: string }[] = [
  { value: 'cruiseFare', label: '仅船票金额' },
  { value: 'orderTotal', label: '订单总额（含附加产品）' },
]

const lateBookingPolicyOptions: { value: LateBookingPolicy; label: string }[] = [
  { value: 'immediateFull', label: '立即支付全款' },
  { value: 'withinHours', label: '下单后限时付清' },
  { value: 'manualReview', label: '转人工审核' },
]

const overdueActionOptions: { value: PaymentOverdueAction; label: string }[] = [
  { value: 'triggerPenalty', label: '进入罚金处理' },
  { value: 'manualReview', label: '转人工审核' },
  { value: 'cancelOrder', label: '取消订单并释放库存' },
]

const defaultConfigFields: PaymentConfigFields = {
  sailingStart: '2025-06-01',
  sailingEnd: '2026-12-31',
  collectionStartDaysBeforeSail: 30,
  paymentDeadlineDaysBeforeSail: 7,
  feeScope: 'cruiseFare',
  deductDeposit: true,
  lateBookingPolicy: 'withinHours',
  lateBookingHours: 2,
  overdueAction: 'triggerPenalty',
}

const initialDefaultRule: DefaultPaymentRule = {
  id: 'default',
  status: 'enabled',
  approvalStatus: 'approved',
  updatedBy: '系统管理员',
  updatedAt: '2026-03-01T10:00:00.000Z',
  ...defaultConfigFields,
}

const emptyForm: PaymentRuleForm = {
  name: '',
  status: 'enabled',
  scopeItems: [],
  config: { ...defaultConfigFields },
}

function getProductRoomTypes(productId: string) {
  const product = products.find((item) => item.id === productId)
  if (!product) return []
  return Array.from(new Set(product.pricing.map((item) => item.cabinType).filter(Boolean)))
}

function createPaymentScopeItem(productId: string, roomTypes: string[]): PaymentScopeItem | null {
  const product = products.find((item) => item.id === productId)
  if (!product) return null
  const validRoomTypes = roomTypes.filter((roomType) => getProductRoomTypes(productId).includes(roomType))
  if (validRoomTypes.length === 0) return null
  return {
    id: productId,
    productId: product.id,
    productName: product.name,
    routeId: product.routeId,
    routeName: product.routeName,
    roomTypes: validRoomTypes,
  }
}

function mergeScopeItems(existing: PaymentScopeItem[], incoming: PaymentScopeItem[]): PaymentScopeItem[] {
  const map = new Map(existing.map((item) => [item.productId, { ...item, roomTypes: [...item.roomTypes] }]))
  incoming.forEach((item) => {
    const current = map.get(item.productId)
    if (current) {
      current.roomTypes = Array.from(new Set([...current.roomTypes, ...item.roomTypes]))
    } else {
      map.set(item.productId, { ...item, roomTypes: [...item.roomTypes] })
    }
  })
  return Array.from(map.values())
}

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

const initialSpecialRules: PaymentRule[] = [
  createPaymentRule({
    name: '内宾巫山特殊船款',
    status: 'enabled',
    scopeItems: [
      createPaymentScopeItem('prod01', ['套房', '阳台房'])!,
    ],
    config: {
      ...defaultConfigFields,
      collectionStartDaysBeforeSail: 45,
      paymentDeadlineDaysBeforeSail: 10,
    },
  }),
  createPaymentRule({
    name: '外宾日本旺季船款',
    status: 'enabled',
    scopeItems: [
      createPaymentScopeItem('prod02', ['套房'])!,
    ],
    config: {
      ...defaultConfigFields,
      sailingStart: '2025-07-01',
      collectionStartDaysBeforeSail: 60,
      paymentDeadlineDaysBeforeSail: 15,
    },
  }),
  createPaymentRule({
    name: '外宾美国长线船款',
    status: 'enabled',
    scopeItems: [
      createPaymentScopeItem('prod03', ['内舱房'])!,
    ],
    config: {
      ...defaultConfigFields,
      collectionStartDaysBeforeSail: 90,
      paymentDeadlineDaysBeforeSail: 30,
    },
  }),
]

function formatScopeSummary(scopeItems: PaymentScopeItem[]) {
  if (scopeItems.length === 0) return '未配置'
  const roomTypeCount = scopeItems.reduce((sum, item) => sum + item.roomTypes.length, 0)
  return `${scopeItems.length}个产品 / ${roomTypeCount}个房型`
}

function formatSailingPeriod(fields: PaymentConfigFields) {
  return `${formatDate(fields.sailingStart)} 至 ${formatDate(fields.sailingEnd)}`
}

function getOptionLabel<T extends string>(options: { value: T; label: string }[], value: T) {
  return options.find((item) => item.value === value)?.label || value
}

function formatCollectionStart(fields: PaymentConfigFields) {
  return `开船前 ${fields.collectionStartDaysBeforeSail} 天`
}

function formatPaymentDeadline(fields: PaymentConfigFields) {
  return `开船前 ${fields.paymentDeadlineDaysBeforeSail} 天`
}

function formatLateBookingPolicy(fields: PaymentConfigFields) {
  if (fields.lateBookingPolicy === 'withinHours') return `下单后 ${fields.lateBookingHours} 小时内付清`
  return getOptionLabel(lateBookingPolicyOptions, fields.lateBookingPolicy)
}

function PaymentConfigFieldsEditor({
  fields,
  onChange,
}: {
  fields: PaymentConfigFields
  onChange: <K extends keyof PaymentConfigFields>(field: K, value: PaymentConfigFields[K]) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div>
        <label className="mb-1 block text-sm text-gray-700">船期开始 <span className="text-red-500">*</span></label>
        <input type="date" value={fields.sailingStart} onChange={(e) => onChange('sailingStart', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-700">船期结束 <span className="text-red-500">*</span></label>
        <input type="date" value={fields.sailingEnd} onChange={(e) => onChange('sailingEnd', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-700">开始收取船款 <span className="text-red-500">*</span></label>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm text-gray-600">开船前</span>
          <input
            type="number"
            min={fields.paymentDeadlineDaysBeforeSail}
            value={fields.collectionStartDaysBeforeSail}
            onChange={(e) => onChange('collectionStartDaysBeforeSail', Math.max(fields.paymentDeadlineDaysBeforeSail, Number(e.target.value) || 0))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <span className="shrink-0 text-sm text-gray-600">天</span>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-700">最晚付清船款 <span className="text-red-500">*</span></label>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm text-gray-600">开船前</span>
          <input
            type="number"
            min={0}
            max={fields.collectionStartDaysBeforeSail}
            value={fields.paymentDeadlineDaysBeforeSail}
            onChange={(e) => onChange('paymentDeadlineDaysBeforeSail', Math.min(fields.collectionStartDaysBeforeSail, Math.max(0, Number(e.target.value) || 0)))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <span className="shrink-0 text-sm text-gray-600">天</span>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-700">船款计价范围</label>
        <select value={fields.feeScope} onChange={(e) => onChange('feeScope', e.target.value as PaymentFeeScope)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
          {feeScopeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-700">是否扣除已付定金</label>
        <select value={fields.deductDeposit ? 'yes' : 'no'} onChange={(e) => onChange('deductDeposit', e.target.value === 'yes')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="yes">是</option>
          <option value="no">否</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-700">临近开航下单处理</label>
        <select value={fields.lateBookingPolicy} onChange={(e) => onChange('lateBookingPolicy', e.target.value as LateBookingPolicy)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
          {lateBookingPolicyOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-700">限时付清时长（小时）</label>
        <input
          type="number"
          min={1}
          disabled={fields.lateBookingPolicy !== 'withinHours'}
          value={fields.lateBookingHours}
          onChange={(e) => onChange('lateBookingHours', Math.max(1, Number(e.target.value) || 1))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-700">逾期未付处理</label>
        <select value={fields.overdueAction} onChange={(e) => onChange('overdueAction', e.target.value as PaymentOverdueAction)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
          {overdueActionOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>
    </div>
  )
}

function ScopeCartList({
  items,
  onRemove,
}: {
  items: PaymentScopeItem[]
  onRemove?: (productId: string) => void
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <div className="min-w-0 text-sm text-gray-700">
            <span className="font-medium text-gray-900">{item.productName}</span>
            <span className="mx-2 text-gray-300">/</span>
            <span>{item.routeName}</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {item.roomTypes.map((roomType) => (
                <span key={roomType} className="rounded bg-white px-2 py-0.5 text-xs text-gray-600 ring-1 ring-gray-200">{roomType}</span>
              ))}
            </div>
          </div>
          {onRemove && (
            <button type="button" onClick={() => onRemove(item.productId)} className="inline-flex shrink-0 items-center gap-1 text-xs text-red-500 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" />移除
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

function ConfigSummaryGrid({ config }: { config: PaymentConfigFields }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      <div className="rounded-lg bg-gray-50 px-4 py-3">
        <div className="text-xs text-gray-500">船期</div>
        <div className="mt-1 text-sm font-medium text-gray-900">{formatSailingPeriod(config)}</div>
      </div>
      <div className="rounded-lg bg-gray-50 px-4 py-3">
        <div className="text-xs text-gray-500">开始收取</div>
        <div className="mt-1 text-sm font-medium text-gray-900">{formatCollectionStart(config)}</div>
      </div>
      <div className="rounded-lg bg-gray-50 px-4 py-3">
        <div className="text-xs text-gray-500">最晚付清</div>
        <div className="mt-1 text-sm font-medium text-gray-900">{formatPaymentDeadline(config)}</div>
      </div>
      <div className="rounded-lg bg-gray-50 px-4 py-3">
        <div className="text-xs text-gray-500">船款口径</div>
        <div className="mt-1 text-sm font-medium text-gray-900">{getOptionLabel(feeScopeOptions, config.feeScope)}</div>
      </div>
      <div className="rounded-lg bg-gray-50 px-4 py-3">
        <div className="text-xs text-gray-500">扣除已付定金</div>
        <div className="mt-1 text-sm font-medium text-gray-900">{config.deductDeposit ? '是' : '否'}</div>
      </div>
      <div className="rounded-lg bg-gray-50 px-4 py-3">
        <div className="text-xs text-gray-500">临近开航处理</div>
        <div className="mt-1 text-sm font-medium text-gray-900">{formatLateBookingPolicy(config)}</div>
      </div>
      <div className="rounded-lg bg-gray-50 px-4 py-3">
        <div className="text-xs text-gray-500">逾期处理</div>
        <div className="mt-1 text-sm font-medium text-gray-900">{getOptionLabel(overdueActionOptions, config.overdueAction)}</div>
      </div>
    </div>
  )
}

export default function PaymentRulePage() {
  const [defaultRule, setDefaultRule] = useState<DefaultPaymentRule>(initialDefaultRule)
  const [defaultFormOpen, setDefaultFormOpen] = useState(false)
  const [defaultForm, setDefaultForm] = useState<DefaultPaymentRuleForm>({ status: 'enabled', ...defaultConfigFields })

  const [records, setRecords] = useState<PaymentRule[]>(initialSpecialRules)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PaymentRuleForm>(emptyForm)

  const [scopeProductIds, setScopeProductIds] = useState<string[]>([])
  const [scopeRoomTypes, setScopeRoomTypes] = useState<string[]>([])

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<PaymentRule | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const scopeRoomTypeOptions = useMemo(() => {
    if (scopeProductIds.length === 0) return []
    return Array.from(new Set(scopeProductIds.flatMap((productId) => getProductRoomTypes(productId))))
  }, [scopeProductIds])

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

  const resetScopeSelector = () => {
    setScopeProductIds([])
    setScopeRoomTypes([])
  }

  const openDefaultEdit = () => {
    const { id: _id, approvalStatus: _approvalStatus, updatedBy: _updatedBy, updatedAt: _updatedAt, ...nextForm } = defaultRule
    setDefaultForm(nextForm)
    setDefaultFormOpen(true)
  }

  const handleDefaultSubmit = () => {
    const now = new Date().toISOString()
    setDefaultRule((prev) => ({
      ...prev,
      ...defaultForm,
      updatedBy: '当前用户',
      updatedAt: now,
    }))
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
    setForm(emptyForm)
    resetScopeSelector()
    setFormOpen(true)
  }

  const openEdit = (record: PaymentRule) => {
    const { id: _id, approvalStatus: _approvalStatus, updatedBy: _updatedBy, updatedAt: _updatedAt, createdAt: _createdAt, ...nextForm } = record
    setEditingId(record.id)
    setForm(nextForm)
    resetScopeSelector()
    setFormOpen(true)
  }

  const handleSubmit = () => {
    if (!form.name.trim() || form.scopeItems.length === 0) return
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
      status: item.status === 'enabled' ? 'disabled' : 'enabled',
      updatedBy: '当前用户',
      updatedAt: now,
    } : item))
  }

  const confirmDelete = () => {
    setRecords((prev) => prev.filter((item) => item.id !== confirmId))
    setConfirmOpen(false)
  }

  const toggleScopeProduct = (productId: string) => {
    setScopeProductIds((prev) => {
      const next = prev.includes(productId) ? prev.filter((item) => item !== productId) : [...prev, productId]
      if (next.length === 0) setScopeRoomTypes([])
      else {
        const validRoomTypes = new Set(next.flatMap((id) => getProductRoomTypes(id)))
        setScopeRoomTypes((current) => current.filter((roomType) => validRoomTypes.has(roomType)))
      }
      return next
    })
  }

  const toggleScopeRoomType = (roomType: string) => {
    setScopeRoomTypes((prev) => prev.includes(roomType) ? prev.filter((item) => item !== roomType) : [...prev, roomType])
  }

  const addScopeToConfig = () => {
    if (scopeProductIds.length === 0 || scopeRoomTypes.length === 0) return
    const incoming = scopeProductIds
      .map((productId) => createPaymentScopeItem(productId, scopeRoomTypes))
      .filter(Boolean) as PaymentScopeItem[]
    if (incoming.length === 0) return
    setForm({ ...form, scopeItems: mergeScopeItems(form.scopeItems, incoming) })
    setScopeRoomTypes([])
  }

  const removeScopeItem = (productId: string) => {
    setForm({ ...form, scopeItems: form.scopeItems.filter((item) => item.productId !== productId) })
  }

  const updateConfigField = <K extends keyof PaymentConfigFields>(field: K, value: PaymentConfigFields[K]) => {
    setForm({ ...form, config: { ...form.config, [field]: value } })
  }

  const updateDefaultField = <K extends keyof DefaultPaymentRuleForm>(field: K, value: DefaultPaymentRuleForm[K]) => {
    setDefaultForm({ ...defaultForm, [field]: value })
  }

  const updateDefaultConfigField = <K extends keyof PaymentConfigFields>(field: K, value: PaymentConfigFields[K]) => {
    setDefaultForm({ ...defaultForm, [field]: value })
  }

  const columns = [
    { key: 'name', title: '规则名称', dataIndex: 'name' as keyof PaymentRule },
    { key: 'scope', title: '适用范围', render: (r: PaymentRule) => formatScopeSummary(r.scopeItems) },
    {
      key: 'configSummary',
      title: '规则配置',
      render: (r: PaymentRule) => (
        <div className="text-xs text-gray-600">
          <div>{formatCollectionStart(r.config)} · {formatPaymentDeadline(r.config)}</div>
          <div className="mt-0.5">{formatSailingPeriod(r.config)}</div>
        </div>
      ),
    },
    { key: 'approvalStatus', title: '审批状态', render: (r: PaymentRule) => <StatusBadge status={r.approvalStatus} /> },
    { key: 'status', title: '状态', render: (r: PaymentRule) => (
      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${r.status === 'enabled' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
        {r.status === 'enabled' ? '启用' : '关闭'}
      </span>
    ) },
    { key: 'updatedAt', title: '修改时间', render: (r: PaymentRule) => formatDateTime(r.updatedAt) },
    { key: 'actions', title: '操作', width: '190px', render: (r: PaymentRule) => (
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
      <PageHeader title="船款规则管理" description="维护船款收取窗口、金额口径及逾期处理；默认规则兜底，特殊规则按产品-航线-房型覆盖" />

      <div className="mx-9 mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">默认船款规则</h3>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700">全局生效</span>
              <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${defaultRule.status === 'enabled' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {defaultRule.status === 'enabled' ? '启用' : '关闭'}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">对所有产品、航线、房型生效；未命中特殊规则时使用此配置</p>
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
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <div className="text-xs text-gray-500">船期</div>
            <div className="mt-1 text-sm font-medium text-gray-900">{formatSailingPeriod(defaultRule)}</div>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <div className="text-xs text-gray-500">开始收取</div>
            <div className="mt-1 text-sm font-medium text-gray-900">{formatCollectionStart(defaultRule)}</div>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <div className="text-xs text-gray-500">最晚付清</div>
            <div className="mt-1 text-sm font-medium text-gray-900">{formatPaymentDeadline(defaultRule)}</div>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <div className="text-xs text-gray-500">船款口径</div>
            <div className="mt-1 text-sm font-medium text-gray-900">{getOptionLabel(feeScopeOptions, defaultRule.feeScope)}</div>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <div className="text-xs text-gray-500">扣除已付定金</div>
            <div className="mt-1 text-sm font-medium text-gray-900">{defaultRule.deductDeposit ? '是' : '否'}</div>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <div className="text-xs text-gray-500">临近开航处理</div>
            <div className="mt-1 text-sm font-medium text-gray-900">{formatLateBookingPolicy(defaultRule)}</div>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <div className="text-xs text-gray-500">逾期处理</div>
            <div className="mt-1 text-sm font-medium text-gray-900">{getOptionLabel(overdueActionOptions, defaultRule.overdueAction)}</div>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <div className="text-xs text-gray-500">审批状态</div>
            <div className="mt-1"><StatusBadge status={defaultRule.approvalStatus} /></div>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <div className="text-xs text-gray-500">最近修改</div>
            <div className="mt-1 text-sm font-medium text-gray-900">{formatDateTime(defaultRule.updatedAt)}</div>
          </div>
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

      <FormDialog open={defaultFormOpen} title="编辑默认船款规则" width="max-w-3xl" onCancel={() => setDefaultFormOpen(false)} onSubmit={handleDefaultSubmit}>
        <div className="space-y-5">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            默认船款规则全局唯一，对所有产品、航线、房型生效，无需选择适用范围。
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">状态</label>
            <select value={defaultForm.status} onChange={(e) => updateDefaultField('status', e.target.value as RuleStatus)} className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
          <PaymentConfigFieldsEditor fields={defaultForm} onChange={updateDefaultConfigField} />
        </div>
      </FormDialog>

      <FormDialog open={formOpen} title={editingId ? '编辑特殊规则' : '新增特殊规则'} width="max-w-6xl" onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">基本信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-gray-700">规则名称 <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">状态</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as RuleStatus })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">适用范围</h4>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-gray-700">产品（可多选）</label>
                  <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3">
                    {products.map((item) => (
                      <label key={item.id} className="flex items-start gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={scopeProductIds.includes(item.id)}
                          onChange={() => toggleScopeProduct(item.id)}
                        />
                        <span>
                          <span className="font-medium text-gray-900">{item.name}</span>
                          <span className="ml-2 text-xs text-gray-500">{item.routeName}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">房型（可多选）</label>
                  <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3">
                    {scopeProductIds.length === 0 ? (
                      <p className="text-xs text-gray-400">请先选择产品</p>
                    ) : scopeRoomTypeOptions.length === 0 ? (
                      <p className="text-xs text-gray-400">所选产品暂无房型</p>
                    ) : scopeRoomTypeOptions.map((roomType) => (
                      <label key={roomType} className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={scopeRoomTypes.includes(roomType)} onChange={() => toggleScopeRoomType(roomType)} />
                        <span>{roomType}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500">特殊规则仅对所选产品-航线-房型生效，优先级高于默认船款规则。</p>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={addScopeToConfig}
                  disabled={scopeProductIds.length === 0 || scopeRoomTypes.length === 0}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  添加至配置区
                </button>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">配置区</h4>
            {form.scopeItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400">
                请先选择产品与房型并添加至配置区
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h5 className="mb-2 text-sm font-medium text-gray-700">已选范围</h5>
                  <ScopeCartList items={form.scopeItems} onRemove={removeScopeItem} />
                </div>
                <div>
                  <h5 className="mb-3 text-sm font-medium text-gray-700">规则配置（共用一套）</h5>
                  <PaymentConfigFieldsEditor fields={form.config} onChange={updateConfigField} />
                </div>
              </div>
            )}
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="特殊规则详情" onClose={() => setDetailOpen(false)}>
        {detail && (<>
          <DetailCard title="基本信息">
            <DetailRow label="规则名称" value={detail.name} />
            <DetailRow label="适用范围" value={formatScopeSummary(detail.scopeItems)} />
            <DetailRow label="审批状态" value={<StatusBadge status={detail.approvalStatus} />} />
            <DetailRow label="状态" value={detail.status === 'enabled' ? '启用' : '关闭'} />
          </DetailCard>
          <DetailCard title="已选范围">
            <ScopeCartList items={detail.scopeItems} />
          </DetailCard>
          <DetailCard title="规则配置">
            <ConfigSummaryGrid config={detail.config} />
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
