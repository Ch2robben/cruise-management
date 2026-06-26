import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'
import { dealers, routes, ships } from '@/mock/data'
import { formatCurrency, formatDate, formatDateTime, generateId } from '@/utils/format'
import type {
  RebateTargetAdjustment,
  RebateTargetIndicator,
  RebateTargetIndicatorForm,
  RebateTargetIndicatorType,
  RebateTargetMetricBase,
  RebateTargetPeriod,
  RebateTargetStatus,
} from '@/types'

const indicatorTypeOptions: { value: RebateTargetIndicatorType; label: string; desc: string }[] = [
  { value: 'annual_sales', label: '年度销售任务', desc: '用于销售额返利、年度违约金返还完成率' },
  { value: 'voyage_planned', label: '航次计划位', desc: '用于定金确认率、航次违约金分母' },
  { value: 'guarantee', label: '应缴保证金', desc: 'V1 仅提醒核对，不拦截返利计算' },
  { value: 'regional_task', label: '区域任务分解', desc: '按区域拆分年度任务，支持超额收客考核' },
]

const periodOptions: { value: RebateTargetPeriod; label: string }[] = [
  { value: 'yearly', label: '按年度' },
  { value: 'voyage', label: '按航次' },
  { value: 'contract', label: '按合同周期' },
]

const metricBaseOptions: { value: RebateTargetMetricBase; label: string; unit: string }[] = [
  { value: 'sales_amount', label: '销售额', unit: '元' },
  { value: 'passenger_count', label: '收客人数', unit: '人' },
  { value: 'cabin_count', label: '舱位/房间数', unit: '间' },
]

const statusOptions: { value: RebateTargetStatus; label: string }[] = [
  { value: 'draft', label: '草稿' },
  { value: 'enabled', label: '已生效' },
  { value: 'disabled', label: '已失效' },
]

const dealerOptions = dealers.slice(0, 8).map((item) => ({ id: item.id, name: item.name, region: item.region }))
const shipOptions = ships.slice(0, 10).map((item) => ({ id: item.id, name: item.name }))
const routeOptions = routes.slice(0, 8).map((item) => ({ id: item.id, name: item.name }))
const roomTypeOptions = ['标准间', '豪华套房', '总统套房', '行政房', '家庭房', '阳台房', '海景房', '内舱房']

function toggleArrayItem<T extends string>(values: T[], item: T): T[] {
  return values.includes(item) ? values.filter((value) => value !== item) : [...values, item]
}

function formatBindScopeLabel(
  shipIds: string[],
  routeIds: string[],
  roomTypes: string[],
  compact = false,
) {
  const shipLabels = shipIds.length === 0
    ? '全部船只'
    : shipIds.map((id) => shipOptions.find((item) => item.id === id)?.name ?? id).join('、')
  const routeLabels = routeIds.length === 0
    ? '全部航线'
    : routeIds.map((id) => routeOptions.find((item) => item.id === id)?.name ?? id).join('、')
  const roomLabels = roomTypes.length === 0 ? '全部房型' : roomTypes.join('、')
  if (compact) {
    const parts = [
      shipIds.length === 0 ? null : `船 ${shipIds.length}`,
      routeIds.length === 0 ? null : `线 ${routeIds.length}`,
      roomTypes.length === 0 ? null : `房 ${roomTypes.length}`,
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(' / ') : '不限绑定'
  }
  return `船只：${shipLabels}；航线：${routeLabels}；房型：${roomLabels}`
}

function MultiBindSection({
  shipIds,
  routeIds,
  roomTypes,
  onChange,
}: {
  shipIds: string[]
  routeIds: string[]
  roomTypes: string[]
  onChange: (next: { shipIds: string[]; routeIds: string[]; roomTypes: string[] }) => void
}) {
  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-800">绑定范围</h4>
        <span className="text-xs text-gray-500">不选表示该维度不限，统计时匹配全部</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div>
          <div className="mb-2 text-xs font-medium text-gray-600">船只</div>
          <div className="max-h-36 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3">
            {shipOptions.map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={shipIds.includes(item.id)}
                  onChange={() => onChange({ shipIds: toggleArrayItem(shipIds, item.id), routeIds, roomTypes })}
                />
                <span>{item.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs font-medium text-gray-600">航线</div>
          <div className="max-h-36 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3">
            {routeOptions.map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={routeIds.includes(item.id)}
                  onChange={() => onChange({ shipIds, routeIds: toggleArrayItem(routeIds, item.id), roomTypes })}
                />
                <span className="line-clamp-2">{item.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs font-medium text-gray-600">房型</div>
          <div className="max-h-36 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3">
            {roomTypeOptions.map((item) => (
              <label key={item} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={roomTypes.includes(item)}
                  onChange={() => onChange({ shipIds, routeIds, roomTypes: toggleArrayItem(roomTypes, item) })}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500">{formatBindScopeLabel(shipIds, routeIds, roomTypes)}</p>
    </div>
  )
}

function getIndicatorTypeLabel(type: RebateTargetIndicatorType) {
  return indicatorTypeOptions.find((item) => item.value === type)?.label || type
}

function getMetricBaseLabel(base: RebateTargetMetricBase) {
  return metricBaseOptions.find((item) => item.value === base)?.label || base
}

function getPeriodLabel(period: RebateTargetPeriod) {
  return periodOptions.find((item) => item.value === period)?.label || period
}

function formatTargetValue(value: number, metricBase: RebateTargetMetricBase, unit: string) {
  if (metricBase === 'sales_amount') return formatCurrency(value)
  return `${value.toLocaleString('zh-CN')} ${unit}`
}

function calcCompletionRate(actual: number, target: number) {
  if (target <= 0) return 0
  return Math.round((actual / target) * 1000) / 10
}

function defaultUnit(metricBase: RebateTargetMetricBase) {
  return metricBaseOptions.find((item) => item.value === metricBase)?.unit || ''
}

function resolvePeriod(indicatorType: RebateTargetIndicatorType): RebateTargetPeriod {
  if (indicatorType === 'voyage_planned') return 'voyage'
  if (indicatorType === 'guarantee') return 'contract'
  return 'yearly'
}

function resolveMetricBase(indicatorType: RebateTargetIndicatorType): RebateTargetMetricBase {
  if (indicatorType === 'voyage_planned') return 'passenger_count'
  if (indicatorType === 'guarantee') return 'sales_amount'
  if (indicatorType === 'regional_task') return 'cabin_count'
  return 'sales_amount'
}

const emptyForm: RebateTargetIndicatorForm = {
  code: 'TGT-NEW',
  name: '',
  indicatorType: 'annual_sales',
  period: 'yearly',
  metricBase: 'sales_amount',
  dealerId: dealerOptions[0]?.id ?? '',
  dealerName: dealerOptions[0]?.name ?? '',
  contractNo: '',
  region: dealerOptions[0]?.region ?? '',
  year: 2026,
  voyageNo: '',
  sailDate: '',
  shipIds: [],
  routeIds: [],
  roomTypes: [],
  targetValue: 0,
  unit: '元',
  depositDeadlineDays: 20,
  effectiveStart: '2026-01-01',
  effectiveEnd: '2026-12-31',
  remark: '',
  status: 'draft',
}

function createIndicator(
  form: RebateTargetIndicatorForm,
  actualValue: number,
  adjustments: RebateTargetAdjustment[] = [],
  status: RebateTargetStatus = form.status,
): RebateTargetIndicator {
  const now = new Date().toISOString()
  return {
    ...form,
    id: generateId(),
    actualValue,
    adjustments,
    status,
    updatedBy: '当前用户',
    updatedAt: now,
    createdAt: now,
  }
}

const initialIndicators: RebateTargetIndicator[] = [
  createIndicator(
    {
      ...emptyForm,
      code: 'TGT-2026-001',
      name: '春秋旅游三峡专线 2026 年度销售任务',
      indicatorType: 'annual_sales',
      dealerId: 'dealer04',
      dealerName: '春秋旅游三峡专线',
      contractNo: 'HT-CQ-2026-004',
      region: '重庆/渝中',
      year: 2026,
      shipIds: ['s01'],
      routeIds: ['r01', 'r02'],
      roomTypes: ['标准间', '豪华套房'],
      targetValue: 3200000,
      unit: '元',
      status: 'enabled',
      remark: '对应合同年度任务；完成率用于年度违约金返还与销售额返利结算。',
    },
    2180000,
    [
      {
        id: generateId(),
        adjustedAt: '2026-03-15T10:00:00.000Z',
        adjustedBy: '运营经理-周岚',
        reason: '甲方调整舱位后，同比下调年度任务 10%',
        beforeValue: 3600000,
        afterValue: 3200000,
      },
    ],
  ),
  createIndicator(
    {
      ...emptyForm,
      code: 'TGT-V260701',
      name: 'VC260701 航次计划收客',
      indicatorType: 'voyage_planned',
      period: 'voyage',
      metricBase: 'passenger_count',
      dealerId: 'dealer05',
      dealerName: '上海锦江游轮分销中心',
      voyageNo: 'VC260701',
      sailDate: '2026-07-01',
      shipIds: ['s02'],
      routeIds: ['r01'],
      roomTypes: ['标准间'],
      targetValue: 120,
      unit: '人',
      depositDeadlineDays: 20,
      status: 'enabled',
      remark: '航次计划位；定金确认率 = 已确认人数 / 计划收客数。',
    },
    86,
  ),
  createIndicator(
    {
      ...emptyForm,
      code: 'TGT-GUA-2026',
      name: '同程旅行邮轮事业部 2026 应缴保证金',
      indicatorType: 'guarantee',
      period: 'contract',
      metricBase: 'sales_amount',
      dealerId: 'dealer02',
      dealerName: '同程旅行邮轮事业部',
      contractNo: 'HT-HY-2026-002',
      shipIds: [],
      routeIds: [],
      roomTypes: [],
      targetValue: 200000,
      unit: '元',
      status: 'enabled',
      remark: 'V1 仅用于结算前提醒核对，不自动剔除返利销售额。',
    },
    150000,
  ),
  createIndicator(
    {
      ...emptyForm,
      code: 'TGT-REG-SH',
      name: '上海锦江游轮分销中心 上海区域 2026 舱位任务',
      indicatorType: 'regional_task',
      period: 'yearly',
      metricBase: 'cabin_count',
      dealerId: 'dealer05',
      dealerName: '上海锦江游轮分销中心',
      region: '上海/浦东',
      year: 2026,
      shipIds: ['s01', 's02'],
      routeIds: ['r01'],
      roomTypes: ['标准间', '行政房'],
      targetValue: 480,
      unit: '间',
      status: 'enabled',
      remark: '区域任务分解；支持超额收客仍享区域价的考核参考。',
    },
    312,
  ),
]

export default function RebateTargetIndicatorPage() {
  const [records, setRecords] = useState<RebateTargetIndicator[]>(initialIndicators)
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dealerFilter, setDealerFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<RebateTargetIndicatorForm>(emptyForm)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<RebateTargetIndicator | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const filteredRecords = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return records.filter((item) => {
      const matchedKeyword = !kw || [item.code, item.name, item.dealerName, item.voyageNo, item.contractNo]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(kw))
      const matchedType = typeFilter === 'all' || item.indicatorType === typeFilter
      const matchedDealer = dealerFilter === 'all' || item.dealerId === dealerFilter
      const matchedStatus = statusFilter === 'all' || item.status === statusFilter
      return matchedKeyword && matchedType && matchedDealer && matchedStatus
    })
  }, [records, keyword, typeFilter, dealerFilter, statusFilter])

  const pageSize = 10
  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize)

  const resetFilters = () => {
    setKeyword('')
    setTypeFilter('all')
    setDealerFilter('all')
    setStatusFilter('all')
    setPage(1)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, dealerId: dealerOptions[0]?.id ?? '', dealerName: dealerOptions[0]?.name ?? '' })
    setFormOpen(true)
  }

  const openEdit = (record: RebateTargetIndicator) => {
    const { id: _id, actualValue: _actual, adjustments: _adj, updatedBy: _u, updatedAt: _ua, createdAt: _ca, ...nextForm } = record
    setEditingId(record.id)
    setForm(nextForm)
    setFormOpen(true)
  }

  const handleIndicatorTypeChange = (indicatorType: RebateTargetIndicatorType) => {
    const metricBase = resolveMetricBase(indicatorType)
    setForm((prev) => ({
      ...prev,
      indicatorType,
      period: resolvePeriod(indicatorType),
      metricBase,
      unit: defaultUnit(metricBase),
      voyageNo: indicatorType === 'voyage_planned' ? prev.voyageNo : '',
      sailDate: indicatorType === 'voyage_planned' ? prev.sailDate : '',
      year: indicatorType === 'annual_sales' || indicatorType === 'regional_task' ? prev.year ?? 2026 : undefined,
      depositDeadlineDays: indicatorType === 'voyage_planned' ? prev.depositDeadlineDays ?? 20 : undefined,
    }))
  }

  const handleDealerChange = (dealerId: string) => {
    const dealer = dealerOptions.find((item) => item.id === dealerId)
    setForm((prev) => ({
      ...prev,
      dealerId,
      dealerName: dealer?.name ?? '',
      region: dealer?.region ?? prev.region,
    }))
  }

  const handleMetricBaseChange = (metricBase: RebateTargetMetricBase) => {
    setForm((prev) => ({ ...prev, metricBase, unit: defaultUnit(metricBase) }))
  }

  const submit = () => {
    if (!form.code.trim() || !form.name.trim() || !form.dealerId || form.targetValue <= 0) return
    const now = new Date().toISOString()
    const normalized: RebateTargetIndicatorForm = {
      ...form,
      targetValue: Math.max(0, Number(form.targetValue) || 0),
      year: form.year ? Number(form.year) : undefined,
      depositDeadlineDays: form.depositDeadlineDays ? Number(form.depositDeadlineDays) : undefined,
    }
    if (editingId) {
      setRecords((prev) => prev.map((item) => item.id === editingId
        ? { ...item, ...normalized, updatedBy: '当前用户', updatedAt: now }
        : item))
    } else {
      setRecords((prev) => [createIndicator(normalized, 0), ...prev])
      setPage(1)
    }
    setFormOpen(false)
  }

  const toggleStatus = (id: string) => {
    const now = new Date().toISOString()
    setRecords((prev) => prev.map((item) => {
      if (item.id !== id) return item
      const nextStatus: RebateTargetStatus = item.status === 'enabled' ? 'disabled' : 'enabled'
      return { ...item, status: nextStatus, updatedBy: '当前用户', updatedAt: now }
    }))
  }

  const confirmDelete = () => {
    setRecords((prev) => prev.filter((item) => item.id !== confirmId))
    setConfirmOpen(false)
  }

  const columns = [
    { key: 'code', title: '指标编码', render: (r: RebateTargetIndicator) => <span className="font-mono text-xs">{r.code}</span> },
    { key: 'name', title: '指标名称', dataIndex: 'name' as keyof RebateTargetIndicator },
    { key: 'indicatorType', title: '指标类型', render: (r: RebateTargetIndicator) => getIndicatorTypeLabel(r.indicatorType) },
    { key: 'dealerName', title: '经销商', dataIndex: 'dealerName' as keyof RebateTargetIndicator },
    { key: 'bindScope', title: '绑定范围', render: (r: RebateTargetIndicator) => (
      <span className="text-xs text-gray-600" title={formatBindScopeLabel(r.shipIds, r.routeIds, r.roomTypes)}>
        {formatBindScopeLabel(r.shipIds, r.routeIds, r.roomTypes, true)}
      </span>
    ) },
    { key: 'scope', title: '考核周期', render: (r: RebateTargetIndicator) => (
      <span className="text-xs text-gray-600">
        {r.voyageNo ? `航次 ${r.voyageNo}` : r.year ? `${r.year} 年` : r.contractNo || r.region || '-'}
      </span>
    ) },
    { key: 'target', title: '目标值', render: (r: RebateTargetIndicator) => formatTargetValue(r.targetValue, r.metricBase, r.unit) },
    { key: 'actual', title: '当前实际', render: (r: RebateTargetIndicator) => formatTargetValue(r.actualValue, r.metricBase, r.unit) },
    { key: 'completion', title: '完成率', render: (r: RebateTargetIndicator) => {
      const rate = calcCompletionRate(r.actualValue, r.targetValue)
      const color = rate >= 70 ? 'text-green-700' : rate >= 50 ? 'text-amber-700' : 'text-red-600'
      return <span className={`text-sm font-medium tabular-nums ${color}`}>{rate}%</span>
    } },
    { key: 'status', title: '状态', render: (r: RebateTargetIndicator) => <StatusBadge status={r.status} /> },
    { key: 'updatedAt', title: '修改时间', render: (r: RebateTargetIndicator) => formatDateTime(r.updatedAt) },
    { key: 'actions', title: '操作', width: '190px', render: (r: RebateTargetIndicator) => (
      <div className="flex items-center gap-1">
        <button onClick={() => { setDetail(r); setDetailOpen(true) }} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">详情</button>
        <button onClick={() => openEdit(r)} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">编辑</button>
        <button onClick={() => toggleStatus(r.id)} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">{r.status === 'enabled' ? '失效' : '生效'}</button>
        <button onClick={() => { setConfirmId(r.id); setConfirmOpen(true) }} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">删除</button>
      </div>
    ) },
  ]

  const previewRate = calcCompletionRate(
    editingId ? (records.find((item) => item.id === editingId)?.actualValue ?? 0) : 0,
    form.targetValue,
  )

  return (
    <div>
      <PageHeader
        title="返利任务指标"
        description="配置返利结算的考核目标，可绑定船只、航线与房型；完成率 = 实际值 / 目标值，供返利政策结算引用。"
      />

      <SearchPanel onSearch={() => setPage(1)} onReset={resetFilters}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">关键词</label>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="编码/名称/航次/合同" className="w-44 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">指标类型</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="all">全部</option>
            {indicatorTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">经销商</label>
          <select value={dealerFilter} onChange={(e) => setDealerFilter(e.target.value)} className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="all">全部</option>
            {dealerOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">状态</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="all">全部</option>
            {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
      </SearchPanel>

      <div className="bg-white px-9 py-6">
        <button onClick={openCreate} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700">
          <Plus className="h-4 w-4" />添加任务指标
        </button>
      </div>

      <DataTable
        columns={columns}
        dataSource={pagedRecords}
        rowKey="id"
        pagination={{ current: page, pageSize, total: filteredRecords.length, onChange: setPage }}
      />

      <FormDialog open={formOpen} title={editingId ? '编辑任务指标' : '添加任务指标'} width="max-w-4xl" onCancel={() => setFormOpen(false)} onSubmit={submit}>
        <div className="space-y-6">
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">基本信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-gray-700">指标编码</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">指标名称</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">指标类型</label>
                <select value={form.indicatorType} onChange={(e) => handleIndicatorTypeChange(e.target.value as RebateTargetIndicatorType)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {indicatorTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">经销商</label>
                <select value={form.dealerId} onChange={(e) => handleDealerChange(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {dealerOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">统计周期</label>
                <select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value as RebateTargetPeriod })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {periodOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">统计口径</label>
                <select value={form.metricBase} onChange={(e) => handleMetricBaseChange(e.target.value as RebateTargetMetricBase)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {metricBaseOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {indicatorTypeOptions.find((item) => item.value === form.indicatorType)?.desc}
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">目标配置</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-gray-700">目标值</label>
                <input type="number" min={0} value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: Number(e.target.value) })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">单位</label>
                <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              {(form.indicatorType === 'annual_sales' || form.indicatorType === 'regional_task') && (
                <div>
                  <label className="mb-1 block text-sm text-gray-700">考核年度</label>
                  <input type="number" value={form.year ?? ''} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
              )}
              {form.indicatorType === 'voyage_planned' && (
                <>
                  <div>
                    <label className="mb-1 block text-sm text-gray-700">航次号</label>
                    <input value={form.voyageNo ?? ''} onChange={(e) => setForm({ ...form, voyageNo: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-700">开航日期</label>
                    <input type="date" value={form.sailDate ?? ''} onChange={(e) => setForm({ ...form, sailDate: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-700">定金节点（开航前N天）</label>
                    <input type="number" min={1} value={form.depositDeadlineDays ?? 20} onChange={(e) => setForm({ ...form, depositDeadlineDays: Number(e.target.value) })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                </>
              )}
              <div>
                <label className="mb-1 block text-sm text-gray-700">合同编号</label>
                <input value={form.contractNo ?? ''} onChange={(e) => setForm({ ...form, contractNo: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">区域</label>
                <input value={form.region ?? ''} onChange={(e) => setForm({ ...form, region: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">生效开始</label>
                <input type="date" value={form.effectiveStart} onChange={(e) => setForm({ ...form, effectiveStart: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">生效结束</label>
                <input type="date" value={form.effectiveEnd} onChange={(e) => setForm({ ...form, effectiveEnd: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">状态</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as RebateTargetStatus })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
            </div>
            {editingId && (
              <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                当前完成率预览：{previewRate}%（实际值由订单汇总，编辑时仅调整目标）
              </div>
            )}
          </div>

          <MultiBindSection
            shipIds={form.shipIds}
            routeIds={form.routeIds}
            roomTypes={form.roomTypes}
            onChange={(next) => setForm((prev) => ({ ...prev, ...next }))}
          />

          <div>
            <label className="mb-1 block text-sm text-gray-700">备注</label>
            <textarea value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="任务指标详情" onClose={() => setDetailOpen(false)}>
        {detail && (
          <>
            <DetailCard title="基本信息">
              <DetailRow label="指标编码" value={detail.code} mono />
              <DetailRow label="指标名称" value={detail.name} />
              <DetailRow label="指标类型" value={getIndicatorTypeLabel(detail.indicatorType)} />
              <DetailRow label="经销商" value={detail.dealerName} />
              <DetailRow label="统计周期" value={getPeriodLabel(detail.period)} />
              <DetailRow label="统计口径" value={getMetricBaseLabel(detail.metricBase)} />
              <DetailRow label="状态" value={<StatusBadge status={detail.status} />} />
            </DetailCard>
            <DetailCard title="目标与完成">
              <DetailRow label="目标值" value={formatTargetValue(detail.targetValue, detail.metricBase, detail.unit)} />
              <DetailRow label="当前实际" value={formatTargetValue(detail.actualValue, detail.metricBase, detail.unit)} />
              <DetailRow label="完成率" value={`${calcCompletionRate(detail.actualValue, detail.targetValue)}%`} />
              {detail.voyageNo && <DetailRow label="航次号" value={detail.voyageNo} mono />}
              {detail.sailDate && <DetailRow label="开航日期" value={detail.sailDate} />}
              {detail.year && <DetailRow label="考核年度" value={String(detail.year)} />}
              {detail.contractNo && <DetailRow label="合同编号" value={detail.contractNo} mono />}
              {detail.region && <DetailRow label="区域" value={detail.region} />}
              <DetailRow label="有效期" value={`${formatDate(detail.effectiveStart)} 至 ${formatDate(detail.effectiveEnd)}`} />
            </DetailCard>
            <DetailCard title="绑定范围">
              <DetailRow label="船只" value={
                detail.shipIds.length === 0
                  ? '全部船只'
                  : detail.shipIds.map((id) => shipOptions.find((item) => item.id === id)?.name ?? id).join('、')
              } />
              <DetailRow label="航线" value={
                detail.routeIds.length === 0
                  ? '全部航线'
                  : detail.routeIds.map((id) => routeOptions.find((item) => item.id === id)?.name ?? id).join('、')
              } />
              <DetailRow label="房型" value={detail.roomTypes.length === 0 ? '全部房型' : detail.roomTypes.join('、')} />
            </DetailCard>
            {detail.adjustments.length > 0 && (
              <DetailCard title="目标调整记录">
                <div className="space-y-3">
                  {detail.adjustments.map((item) => (
                    <div key={item.id} className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{formatDateTime(item.adjustedAt)} · {item.adjustedBy}</div>
                      <div className="mt-1 text-gray-600">{item.reason}</div>
                      <div className="mt-2 tabular-nums text-gray-700">
                        {formatTargetValue(item.beforeValue, detail.metricBase, detail.unit)}
                        {' → '}
                        {formatTargetValue(item.afterValue, detail.metricBase, detail.unit)}
                      </div>
                    </div>
                  ))}
                </div>
              </DetailCard>
            )}
            <DetailCard title="关联说明">
              <DetailRow label="返利引用" value="完成率供「返利政策管理」中销售额返利、违约金返还规则结算时读取" />
              <DetailRow label="备注" value={detail.remark || '-'} />
            </DetailCard>
          </>
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={confirmOpen}
        title="删除任务指标"
        message="删除后返利结算将无法引用该目标，确认删除？"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
