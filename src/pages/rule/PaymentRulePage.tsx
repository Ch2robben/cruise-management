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

export interface PaymentConfigRow {
  id: string
  productId: string
  productName: string
  routeId: string
  routeName: string
  roomType: string
  sailingStart: string
  sailingEnd: string
  deadlineDaysBeforeSail: number
}

interface PaymentConfigFields {
  sailingStart: string
  sailingEnd: string
  deadlineDaysBeforeSail: number
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
  configRows: PaymentConfigRow[]
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

const defaultConfigFields: PaymentConfigFields = {
  sailingStart: '2025-06-01',
  sailingEnd: '2026-12-31',
  deadlineDaysBeforeSail: 7,
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
  configRows: [],
}

function getProductRoomTypes(productId: string) {
  const product = products.find((item) => item.id === productId)
  if (!product) return []
  return Array.from(new Set(product.pricing.map((item) => item.cabinType).filter(Boolean)))
}

function createPaymentConfigRow(productId: string, roomType: string): PaymentConfigRow | null {
  const product = products.find((item) => item.id === productId)
  if (!product) return null
  return {
    id: `${productId}-${product.routeId}-${roomType}`,
    productId: product.id,
    productName: product.name,
    routeId: product.routeId,
    routeName: product.routeName,
    roomType,
    ...defaultConfigFields,
  }
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
    configRows: [
      { ...createPaymentConfigRow('prod01', '套房')!, deadlineDaysBeforeSail: 7 },
      { ...createPaymentConfigRow('prod01', '阳台房')!, deadlineDaysBeforeSail: 7 },
    ].filter(Boolean) as PaymentConfigRow[],
  }),
  createPaymentRule({
    name: '外宾日本旺季船款',
    status: 'enabled',
    configRows: [
      { ...createPaymentConfigRow('prod02', '套房')!, sailingStart: '2025-07-01', deadlineDaysBeforeSail: 15 },
    ].filter(Boolean) as PaymentConfigRow[],
  }),
  createPaymentRule({
    name: '外宾美国长线船款',
    status: 'enabled',
    configRows: [
      { ...createPaymentConfigRow('prod03', '内舱房')!, deadlineDaysBeforeSail: 30 },
    ].filter(Boolean) as PaymentConfigRow[],
  }),
]

function formatScopeSummary(rows: PaymentConfigRow[]) {
  if (rows.length === 0) return '未配置'
  const productsCount = new Set(rows.map((row) => row.productId)).size
  return `${productsCount}个产品 / ${rows.length}个房型`
}

function formatSailingPeriod(fields: PaymentConfigFields) {
  return `${formatDate(fields.sailingStart)} 至 ${formatDate(fields.sailingEnd)}`
}

function formatDeadline(fields: PaymentConfigFields) {
  return `开船前 ${fields.deadlineDaysBeforeSail} 天`
}

function PaymentConfigFieldsEditor({
  fields,
  onChange,
}: {
  fields: PaymentConfigFields
  onChange: <K extends keyof PaymentConfigFields>(field: K, value: PaymentConfigFields[K]) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div>
        <label className="mb-1 block text-sm text-gray-700">船期开始 <span className="text-red-500">*</span></label>
        <input type="date" value={fields.sailingStart} onChange={(e) => onChange('sailingStart', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-700">船期结束 <span className="text-red-500">*</span></label>
        <input type="date" value={fields.sailingEnd} onChange={(e) => onChange('sailingEnd', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-700">船款期限 <span className="text-red-500">*</span></label>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm text-gray-600">开船前</span>
          <input
            type="number"
            min={0}
            value={fields.deadlineDaysBeforeSail}
            onChange={(e) => onChange('deadlineDaysBeforeSail', Math.max(0, Number(e.target.value) || 0))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <span className="shrink-0 text-sm text-gray-600">天</span>
        </div>
      </div>
    </div>
  )
}

function ConfigTable({
  rows,
  onUpdate,
  onRemove,
  showRemove = false,
}: {
  rows: PaymentConfigRow[]
  onUpdate?: <K extends keyof PaymentConfigRow>(rowId: string, field: K, value: PaymentConfigRow[K]) => void
  onRemove?: (rowId: string) => void
  showRemove?: boolean
}) {
  const editable = Boolean(onUpdate)

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-[1000px] w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">产品</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">航线</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">房型</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">船期开始</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">船期结束</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">船款期限</th>
            {showRemove && <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">操作</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50/60">
              <td className="px-3 py-2 text-gray-700">{row.productName}</td>
              <td className="px-3 py-2 text-gray-700">{row.routeName}</td>
              <td className="px-3 py-2 text-gray-700">{row.roomType}</td>
              <td className="px-3 py-2">
                {editable ? (
                  <input type="date" value={row.sailingStart} onChange={(e) => onUpdate!(row.id, 'sailingStart', e.target.value)} className="rounded border border-gray-300 px-2 py-1.5 text-xs" />
                ) : formatDate(row.sailingStart)}
              </td>
              <td className="px-3 py-2">
                {editable ? (
                  <input type="date" value={row.sailingEnd} onChange={(e) => onUpdate!(row.id, 'sailingEnd', e.target.value)} className="rounded border border-gray-300 px-2 py-1.5 text-xs" />
                ) : formatDate(row.sailingEnd)}
              </td>
              <td className="px-3 py-2">
                {editable ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">开船前</span>
                    <input
                      type="number"
                      min={0}
                      value={row.deadlineDaysBeforeSail}
                      onChange={(e) => onUpdate!(row.id, 'deadlineDaysBeforeSail', Math.max(0, Number(e.target.value) || 0))}
                      className="w-16 rounded border border-gray-300 px-2 py-1.5 text-xs"
                    />
                    <span className="text-xs text-gray-500">天</span>
                  </div>
                ) : formatDeadline(row)}
              </td>
              {showRemove && (
                <td className="px-3 py-2 text-center">
                  <button type="button" onClick={() => onRemove?.(row.id)} className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" /> 移除
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
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

  const [scopeProductId, setScopeProductId] = useState(products[0]?.id || '')
  const [scopeRoomTypes, setScopeRoomTypes] = useState<string[]>([])

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<PaymentRule | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const scopeProduct = products.find((item) => item.id === scopeProductId)
  const scopeRoomTypeOptions = useMemo(() => getProductRoomTypes(scopeProductId), [scopeProductId])

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

  const resetScopeSelector = (productId = products[0]?.id || '') => {
    setScopeProductId(productId)
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
    resetScopeSelector(record.configRows[0]?.productId || products[0]?.id || '')
    setFormOpen(true)
  }

  const handleSubmit = () => {
    if (!form.name.trim() || form.configRows.length === 0) return
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

  const toggleScopeRoomType = (roomType: string) => {
    setScopeRoomTypes((prev) => prev.includes(roomType) ? prev.filter((item) => item !== roomType) : [...prev, roomType])
  }

  const addScopeToConfig = () => {
    if (!scopeProductId || scopeRoomTypes.length === 0) return
    const existingIds = new Set(form.configRows.map((row) => row.id))
    const nextRows = [...form.configRows]
    scopeRoomTypes.forEach((roomType) => {
      const row = createPaymentConfigRow(scopeProductId, roomType)
      if (row && !existingIds.has(row.id)) nextRows.push(row)
    })
    setForm({ ...form, configRows: nextRows })
    setScopeRoomTypes([])
  }

  const updateConfigRow = <K extends keyof PaymentConfigRow>(rowId: string, field: K, value: PaymentConfigRow[K]) => {
    setForm({
      ...form,
      configRows: form.configRows.map((row) => row.id === rowId ? { ...row, [field]: value } : row),
    })
  }

  const removeConfigRow = (rowId: string) => {
    setForm({ ...form, configRows: form.configRows.filter((row) => row.id !== rowId) })
  }

  const updateDefaultField = <K extends keyof DefaultPaymentRuleForm>(field: K, value: DefaultPaymentRuleForm[K]) => {
    setDefaultForm({ ...defaultForm, [field]: value })
  }

  const updateDefaultConfigField = <K extends keyof PaymentConfigFields>(field: K, value: PaymentConfigFields[K]) => {
    setDefaultForm({ ...defaultForm, [field]: value })
  }

  const columns = [
    { key: 'name', title: '规则名称', dataIndex: 'name' as keyof PaymentRule },
    { key: 'scope', title: '适用范围', render: (r: PaymentRule) => formatScopeSummary(r.configRows) },
    { key: 'configCount', title: '配置条数', render: (r: PaymentRule) => `${r.configRows.length} 条` },
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
      <PageHeader title="船款规则管理" description="系统仅有一条默认船款规则作为全局兜底；特殊规则按产品-航线-房型覆盖默认规则" />

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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <div className="text-xs text-gray-500">船期</div>
            <div className="mt-1 text-sm font-medium text-gray-900">{formatSailingPeriod(defaultRule)}</div>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <div className="text-xs text-gray-500">船款期限</div>
            <div className="mt-1 text-sm font-medium text-gray-900">{formatDeadline(defaultRule)}</div>
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
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm text-gray-700">产品</label>
                  <select
                    value={scopeProductId}
                    onChange={(e) => {
                      setScopeProductId(e.target.value)
                      setScopeRoomTypes([])
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    {products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">航线</label>
                  <input value={scopeProduct?.routeName || ''} readOnly className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">房型（可多选）</label>
                  <div className="max-h-28 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3">
                    {scopeRoomTypeOptions.length === 0 ? (
                      <p className="text-xs text-gray-400">当前产品暂无房型</p>
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
                  disabled={!scopeProductId || scopeRoomTypes.length === 0}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  添加至配置区
                </button>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">配置区</h4>
            {form.configRows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400">
                请先选择产品-航线-房型并添加至配置区
              </div>
            ) : (
              <ConfigTable
                rows={form.configRows}
                onUpdate={updateConfigRow}
                onRemove={removeConfigRow}
                showRemove
              />
            )}
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="特殊规则详情" onClose={() => setDetailOpen(false)}>
        {detail && (<>
          <DetailCard title="基本信息">
            <DetailRow label="规则名称" value={detail.name} />
            <DetailRow label="适用范围" value={formatScopeSummary(detail.configRows)} />
            <DetailRow label="审批状态" value={<StatusBadge status={detail.approvalStatus} />} />
            <DetailRow label="状态" value={detail.status === 'enabled' ? '启用' : '关闭'} />
          </DetailCard>
          <DetailCard title={`配置明细（${detail.configRows.length}条）`}>
            <ConfigTable rows={detail.configRows} />
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
