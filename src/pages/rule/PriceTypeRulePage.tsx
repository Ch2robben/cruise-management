import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'
import { NATIONALITY_OPTIONS } from '@/utils/constants'
import { formatDate, formatDateTime, generateId } from '@/utils/format'
import type { Status } from '@/types'

export type PricePolicyTypeKind = 'port' | 'regional'
export type PortMatchMode = 'default' | 'departure_port'
export type RegionalMatchType = 'id_card_prefix' | 'nationality'

export interface RegionalMatchRule {
  id: string
  matchType: RegionalMatchType
  /** 身份证区划码前缀（matchType = id_card_prefix） */
  prefix: string
  label: string
  /** 国籍列表（matchType = nationality） */
  nationalities: string[]
}

export interface PricePolicyType {
  id: string
  code: string
  name: string
  dealer: string
  policyType: PricePolicyTypeKind
  priority: number
  effectiveStart: string
  effectiveEnd: string
  portMatchMode: PortMatchMode
  departurePorts: string[]
  /** 区域价匹配条件，命中任一条即适用区域价 */
  regionalMatchRules: RegionalMatchRule[]
  status: Status
  remark: string
  updatedBy: string
  updatedAt: string
  createdAt: string
}

type PricePolicyTypeForm = Omit<PricePolicyType, 'id' | 'updatedBy' | 'updatedAt' | 'createdAt'>

const dealerOptions = [
  '重庆海外旅业集团',
  '湖北峡州国旅',
  '宜昌交运旅行社',
  '武汉长江国旅',
  '上海锦江游轮分销中心',
]

const departurePortOptions = ['重庆', '宜昌', '武汉', '南京', '上海', '岳阳']

const policyTypeOptions: { value: PricePolicyTypeKind; label: string }[] = [
  { value: 'port', label: '口岸价' },
  { value: 'regional', label: '区域价' },
]

const portMatchModeOptions: { value: PortMatchMode; label: string }[] = [
  { value: 'default', label: '默认生效（不限出发港）' },
  { value: 'departure_port', label: '按出发港匹配' },
]

const regionalMatchTypeOptions: { value: RegionalMatchType; label: string }[] = [
  { value: 'id_card_prefix', label: '身份证区划码' },
  { value: 'nationality', label: '国籍' },
]

const emptyRegionalMatchRule = (matchType: RegionalMatchType = 'id_card_prefix'): RegionalMatchRule => ({
  id: generateId(),
  matchType,
  prefix: '',
  label: '',
  nationalities: [],
})

const emptyForm: PricePolicyTypeForm = {
  code: 'PPOL-NEW',
  name: '',
  dealer: dealerOptions[0],
  policyType: 'port',
  priority: 10,
  effectiveStart: '2026-01-01',
  effectiveEnd: '2026-12-31',
  portMatchMode: 'default',
  departurePorts: [],
  regionalMatchRules: [],
  status: 'enabled',
  remark: '',
}

function createPolicyType(form: PricePolicyTypeForm): PricePolicyType {
  const now = new Date().toISOString()
  return {
    ...form,
    id: generateId(),
    updatedBy: '当前用户',
    updatedAt: now,
    createdAt: now,
  }
}

function getPolicyTypeLabel(type: PricePolicyTypeKind) {
  return policyTypeOptions.find((item) => item.value === type)?.label || type
}

function getPortMatchModeLabel(mode: PortMatchMode) {
  return portMatchModeOptions.find((item) => item.value === mode)?.label || mode
}

function getRegionalMatchTypeLabel(type: RegionalMatchType) {
  return regionalMatchTypeOptions.find((item) => item.value === type)?.label || type
}

function formatRegionalMatchRule(rule: RegionalMatchRule) {
  if (rule.matchType === 'nationality') {
    return rule.nationalities.length > 0 ? `国籍：${rule.nationalities.join('、')}` : '-'
  }
  if (!rule.prefix) return '-'
  return rule.label ? `${rule.prefix}（${rule.label}）` : rule.prefix
}

function formatRegionalMatchRules(rules: RegionalMatchRule[]) {
  if (rules.length === 0) return '-'
  if (rules.length === 1) return formatRegionalMatchRule(rules[0])
  return `${formatRegionalMatchRule(rules[0])} 等${rules.length}条`
}

function formatEffectiveRule(rule: PricePolicyType) {
  if (rule.policyType === 'port') {
    if (rule.portMatchMode === 'departure_port' && rule.departurePorts.length > 0) {
      return `出发港：${rule.departurePorts.join('、')}`
    }
    return '默认口岸价'
  }
  return formatRegionalMatchRules(rule.regionalMatchRules)
}

function isValidIdCardAreaPrefix(prefix: string) {
  return /^\d{2,6}$/.test(prefix)
}

function normalizeRegionalMatchRules(rules: RegionalMatchRule[]) {
  return rules
    .map((rule) => ({
      ...rule,
      prefix: rule.prefix.trim(),
      label: rule.label.trim(),
      nationalities: rule.nationalities.filter(Boolean),
    }))
    .filter((rule) => (
      rule.matchType === 'nationality'
        ? rule.nationalities.length > 0
        : rule.prefix
    ))
}

const initialRecords: PricePolicyType[] = [
  createPolicyType({
    ...emptyForm,
    code: 'PPOL-PORT-001',
    name: '长航重庆出发默认口岸价',
    dealer: '重庆海外旅业集团',
    policyType: 'port',
    portMatchMode: 'departure_port',
    departurePorts: ['重庆'],
    priority: 10,
    remark: '重庆出发航次统一按口岸价计价。',
  }),
  createPolicyType({
    ...emptyForm,
    code: 'PPOL-PORT-002',
    name: '宜昌交运宜昌港口岸价',
    dealer: '宜昌交运旅行社',
    policyType: 'port',
    portMatchMode: 'departure_port',
    departurePorts: ['宜昌'],
    priority: 20,
    remark: '宜昌港出发适用口岸价。',
  }),
  createPolicyType({
    ...emptyForm,
    code: 'PPOL-REG-001',
    name: '巫山区域结算价',
    dealer: '重庆海外旅业集团',
    policyType: 'regional',
    regionalMatchRules: [
      { id: 'r1', matchType: 'id_card_prefix', prefix: '500100', label: '重庆市辖区', nationalities: [] },
      { id: 'r2', matchType: 'id_card_prefix', prefix: '500229', label: '巫山县', nationalities: [] },
    ],
    priority: 15,
    remark: '重庆辖区及巫山籍游客适用区域价。',
  }),
  createPolicyType({
    ...emptyForm,
    code: 'PPOL-REG-002',
    name: '宜昌城区区域价',
    dealer: '宜昌交运旅行社',
    policyType: 'regional',
    regionalMatchRules: [
      { id: 'r3', matchType: 'id_card_prefix', prefix: '420500', label: '宜昌市', nationalities: [] },
      { id: 'r4', matchType: 'id_card_prefix', prefix: '420503', label: '伍家岗区', nationalities: [] },
    ],
    priority: 25,
    remark: '宜昌市及伍家岗区籍游客适用区域价。',
  }),
  createPolicyType({
    ...emptyForm,
    code: 'PPOL-REG-003',
    name: '湖北省区域价',
    dealer: '武汉长江国旅',
    policyType: 'regional',
    regionalMatchRules: [
      { id: 'r5', matchType: 'id_card_prefix', prefix: '42', label: '湖北省', nationalities: [] },
    ],
    priority: 12,
    remark: '身份证号码前2位为42的游客适用区域价。',
  }),
  createPolicyType({
    ...emptyForm,
    code: 'PPOL-REG-004',
    name: '日韩外宾区域价',
    dealer: '上海锦江游轮分销中心',
    policyType: 'regional',
    regionalMatchRules: [
      { id: 'r6', matchType: 'nationality', prefix: '', label: '', nationalities: ['日本', '韩国'] },
    ],
    priority: 18,
    remark: '日本、韩国籍外宾适用区域价。',
  }),
]

export default function PricePolicyTypePage() {
  const [records, setRecords] = useState<PricePolicyType[]>(initialRecords)
  const [keyword, setKeyword] = useState('')
  const [dealerFilter, setDealerFilter] = useState('all')
  const [policyTypeFilter, setPolicyTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PricePolicyTypeForm>(emptyForm)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<PricePolicyType | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const filteredRecords = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return records.filter((item) => {
      const matchedKeyword = !kw || [
        item.code,
        item.name,
        item.dealer,
        item.remark,
        formatRegionalMatchRules(item.regionalMatchRules),
        ...item.regionalMatchRules.flatMap((rule) => [
          rule.prefix,
          rule.label,
          ...rule.nationalities,
        ]),
      ].some((value) => value.toLowerCase().includes(kw))
      const matchedDealer = dealerFilter === 'all' || item.dealer === dealerFilter
      const matchedPolicyType = policyTypeFilter === 'all' || item.policyType === policyTypeFilter
      const matchedStatus = statusFilter === 'all' || item.status === statusFilter
      return matchedKeyword && matchedDealer && matchedPolicyType && matchedStatus
    })
  }, [records, keyword, dealerFilter, policyTypeFilter, statusFilter])

  const pageSize = 10
  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize)

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, regionalMatchRules: [emptyRegionalMatchRule()] })
    setFormOpen(true)
  }

  const openEdit = (record: PricePolicyType) => {
    setEditingId(record.id)
    setForm({
      code: record.code,
      name: record.name,
      dealer: record.dealer,
      policyType: record.policyType,
      priority: record.priority,
      effectiveStart: record.effectiveStart,
      effectiveEnd: record.effectiveEnd,
      portMatchMode: record.portMatchMode,
      departurePorts: [...record.departurePorts],
      regionalMatchRules: record.regionalMatchRules.length > 0
        ? record.regionalMatchRules.map((rule) => ({ ...rule, nationalities: [...rule.nationalities] }))
        : [emptyRegionalMatchRule()],
      status: record.status,
      remark: record.remark,
    })
    setFormOpen(true)
  }

  const openDetail = (record: PricePolicyType) => {
    setDetail(record)
    setDetailOpen(true)
  }

  const handleSubmit = () => {
    if (!form.name.trim()) {
      window.alert('请填写政策类型名称')
      return
    }
    if (form.policyType === 'port' && form.portMatchMode === 'departure_port' && form.departurePorts.length === 0) {
      window.alert('口岸价按出发港匹配时，请至少选择一个出发港')
      return
    }
    if (form.policyType === 'regional') {
      const rules = normalizeRegionalMatchRules(form.regionalMatchRules)
      if (rules.length === 0) {
        window.alert('请至少配置一条区域价匹配条件（身份证区划码或国籍）')
        return
      }
      const invalidPrefix = rules.find(
        (rule) => rule.matchType === 'id_card_prefix' && !isValidIdCardAreaPrefix(rule.prefix),
      )
      if (invalidPrefix) {
        window.alert(`区域码 ${invalidPrefix.prefix || '（空）'} 无效，须为2~6位数字`)
        return
      }
      const prefixes = rules
        .filter((rule) => rule.matchType === 'id_card_prefix')
        .map((rule) => rule.prefix)
      if (new Set(prefixes).size !== prefixes.length) {
        window.alert('存在重复的身份证区域码前缀')
        return
      }
      const nationalities = rules
        .filter((rule) => rule.matchType === 'nationality')
        .flatMap((rule) => rule.nationalities)
      if (new Set(nationalities).size !== nationalities.length) {
        window.alert('存在重复的国籍配置')
        return
      }
    }

    const payload = {
      ...form,
      regionalMatchRules: form.policyType === 'regional' ? normalizeRegionalMatchRules(form.regionalMatchRules) : [],
    }

    if (editingId) {
      setRecords((prev) => prev.map((item) => (
        item.id === editingId
          ? {
            ...item,
            ...payload,
            updatedAt: new Date().toISOString(),
            updatedBy: '当前用户',
          }
          : item
      )))
    } else {
      setRecords((prev) => [createPolicyType(payload), ...prev])
    }
    setFormOpen(false)
    setPage(1)
  }

  const handleDelete = () => {
    setRecords((prev) => prev.filter((item) => item.id !== confirmId))
    setConfirmOpen(false)
    setConfirmId('')
  }

  const toggleDeparturePort = (port: string) => {
    setForm((prev) => ({
      ...prev,
      departurePorts: prev.departurePorts.includes(port)
        ? prev.departurePorts.filter((item) => item !== port)
        : [...prev.departurePorts, port],
    }))
  }

  const addRegionalMatchRule = (matchType: RegionalMatchType = 'id_card_prefix') => {
    setForm((prev) => ({
      ...prev,
      regionalMatchRules: [...prev.regionalMatchRules, emptyRegionalMatchRule(matchType)],
    }))
  }

  const updateRegionalMatchRule = (id: string, patch: Partial<RegionalMatchRule>) => {
    setForm((prev) => ({
      ...prev,
      regionalMatchRules: prev.regionalMatchRules.map((rule) => (
        rule.id === id ? { ...rule, ...patch } : rule
      )),
    }))
  }

  const removeRegionalMatchRule = (id: string) => {
    setForm((prev) => ({
      ...prev,
      regionalMatchRules: prev.regionalMatchRules.filter((rule) => rule.id !== id),
    }))
  }

  const toggleNationality = (ruleId: string, nationality: string) => {
    setForm((prev) => ({
      ...prev,
      regionalMatchRules: prev.regionalMatchRules.map((rule) => {
        if (rule.id !== ruleId) return rule
        const nationalities = rule.nationalities.includes(nationality)
          ? rule.nationalities.filter((item) => item !== nationality)
          : [...rule.nationalities, nationality]
        return { ...rule, nationalities }
      }),
    }))
  }

  return (
    <div>
      <PageHeader
        title="价格政策类型"
        description="按经销商配置口岸价与区域价政策类型；区域价可按身份证区划码或入住人国籍匹配。"
      >
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          新增政策类型
        </button>
      </PageHeader>

      <SearchPanel
        onSearch={() => setPage(1)}
        onReset={() => {
          setKeyword('')
          setDealerFilter('all')
          setPolicyTypeFilter('all')
          setStatusFilter('all')
          setPage(1)
        }}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <label className="block text-sm">
            <span className="mb-1 block text-gray-700">关键词</span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="政策类型编码 / 名称 / 经销商"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-gray-700">经销商</span>
            <select value={dealerFilter} onChange={(event) => setDealerFilter(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="all">全部</option>
              {dealerOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-gray-700">价格政策类型</span>
            <select value={policyTypeFilter} onChange={(event) => setPolicyTypeFilter(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="all">全部</option>
              {policyTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-gray-700">状态</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="all">全部</option>
              <option value="enabled">启用</option>
              <option value="disabled">禁用</option>
            </select>
          </label>
        </div>
      </SearchPanel>

      <DataTable<PricePolicyType>
        dataSource={pagedRecords}
        rowKey="id"
        pagination={{ current: page, pageSize, total: filteredRecords.length, onChange: setPage }}
        columns={[
          { key: 'code', title: '政策类型编码', width: '130px' },
          { key: 'name', title: '政策类型名称', width: '180px' },
          { key: 'dealer', title: '经销商', width: '180px' },
          {
            key: 'policyType',
            title: '价格政策类型',
            width: '110px',
            render: (record) => (
              <span className={`rounded px-2 py-0.5 text-xs ${record.policyType === 'port' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                {getPolicyTypeLabel(record.policyType)}
              </span>
            ),
          },
          {
            key: 'effectiveRule',
            title: '生效规则',
            width: '220px',
            render: (record) => formatEffectiveRule(record),
          },
          { key: 'priority', title: '优先级', width: '80px' },
          {
            key: 'effective',
            title: '有效期',
            width: '190px',
            render: (record) => `${formatDate(record.effectiveStart)} ~ ${formatDate(record.effectiveEnd)}`,
          },
          {
            key: 'status',
            title: '状态',
            width: '80px',
            render: (record) => <StatusBadge status={record.status} />,
          },
          {
            key: 'actions',
            title: '操作',
            width: '160px',
            render: (record) => (
              <div className="flex gap-2">
                <button type="button" onClick={() => openDetail(record)} className="text-blue-600 hover:underline">详情</button>
                <button type="button" onClick={() => openEdit(record)} className="text-gray-600 hover:underline">编辑</button>
                <button
                  type="button"
                  onClick={() => { setConfirmId(record.id); setConfirmOpen(true) }}
                  className="text-red-500 hover:underline"
                >
                  删除
                </button>
              </div>
            ),
          },
        ]}
      />

      <FormDialog
        open={formOpen}
        title={editingId ? '编辑价格政策类型' : '新增价格政策类型'}
        width="max-w-3xl"
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="政策类型编码" value={form.code} onChange={(code) => setForm({ ...form, code })} />
            <Field label="政策类型名称" value={form.name} onChange={(name) => setForm({ ...form, name })} required />
            <label className="block text-sm">
              <span className="mb-1 block text-gray-700">经销商 <span className="text-red-500">*</span></span>
              <select value={form.dealer} onChange={(event) => setForm({ ...form, dealer: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {dealerOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-700">价格政策类型 <span className="text-red-500">*</span></span>
              <select
                value={form.policyType}
                onChange={(event) => {
                  const policyType = event.target.value as PricePolicyTypeKind
                  setForm({
                    ...form,
                    policyType,
                    regionalMatchRules: policyType === 'regional' && form.regionalMatchRules.length === 0
                      ? [emptyRegionalMatchRule()]
                      : form.regionalMatchRules,
                  })
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {policyTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <Field label="优先级" value={String(form.priority)} onChange={(value) => setForm({ ...form, priority: Number(value) || 0 })} />
            <label className="block text-sm">
              <span className="mb-1 block text-gray-700">状态</span>
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Status })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="enabled">启用</option>
                <option value="disabled">禁用</option>
              </select>
            </label>
            <Field label="生效开始" value={form.effectiveStart} onChange={(effectiveStart) => setForm({ ...form, effectiveStart })} type="date" />
            <Field label="生效结束" value={form.effectiveEnd} onChange={(effectiveEnd) => setForm({ ...form, effectiveEnd })} type="date" />
          </div>

          {form.policyType === 'port' ? (
            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 space-y-4">
              <h4 className="text-sm font-semibold text-gray-800">口岸价生效规则</h4>
              <p className="text-xs text-gray-500">配置该经销商在何种条件下使用口岸价（P）计价。</p>
              <label className="block text-sm">
                <span className="mb-1 block text-gray-700">匹配方式</span>
                <select
                  value={form.portMatchMode}
                  onChange={(event) => setForm({ ...form, portMatchMode: event.target.value as PortMatchMode })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                >
                  {portMatchModeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              {form.portMatchMode === 'departure_port' && (
                <div>
                  <div className="mb-2 text-sm text-gray-700">出发港（可多选）</div>
                  <div className="flex flex-wrap gap-2">
                    {departurePortOptions.map((port) => (
                      <button
                        key={port}
                        type="button"
                        onClick={() => toggleDeparturePort(port)}
                        className={`rounded-full border px-3 py-1 text-sm transition ${
                          form.departurePorts.includes(port)
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-300 bg-white text-gray-600 hover:border-blue-300'
                        }`}
                      >
                        {port}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">区域价生效规则</h4>
                  <p className="mt-1 text-xs text-gray-500">
                    可配置多条匹配条件，入住人命中任一条即适用区域价。内宾用身份证区划码，外宾用国籍。
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => addRegionalMatchRule('id_card_prefix')}
                    className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-white px-3 py-1.5 text-xs text-purple-700 hover:bg-purple-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    区划码
                  </button>
                  <button
                    type="button"
                    onClick={() => addRegionalMatchRule('nationality')}
                    className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-white px-3 py-1.5 text-xs text-purple-700 hover:bg-purple-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    国籍
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {form.regionalMatchRules.map((rule, index) => (
                  <div key={rule.id} className="rounded-lg border border-purple-100 bg-white p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-500">条件 {index + 1}</span>
                        <select
                          value={rule.matchType}
                          onChange={(event) => {
                            const matchType = event.target.value as RegionalMatchType
                            updateRegionalMatchRule(rule.id, {
                              matchType,
                              prefix: matchType === 'id_card_prefix' ? rule.prefix : '',
                              label: matchType === 'id_card_prefix' ? rule.label : '',
                              nationalities: matchType === 'nationality' ? rule.nationalities : [],
                            })
                          }}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                        >
                          {regionalMatchTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      {form.regionalMatchRules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRegionalMatchRule(rule.id)}
                          className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          删除
                        </button>
                      )}
                    </div>

                    {rule.matchType === 'id_card_prefix' ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-sm">
                          <span className="mb-1 block text-gray-700">区域码前缀 <span className="text-red-500">*</span></span>
                          <input
                            value={rule.prefix}
                            onChange={(event) => updateRegionalMatchRule(rule.id, { prefix: event.target.value.replace(/\D/g, '').slice(0, 6) })}
                            placeholder="如 42、420500"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
                          />
                        </label>
                        <label className="block text-sm">
                          <span className="mb-1 block text-gray-700">区域说明（选填）</span>
                          <input
                            value={rule.label}
                            onChange={(event) => updateRegionalMatchRule(rule.id, { label: event.target.value })}
                            placeholder="如 湖北省、宜昌市"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </label>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-2 text-sm text-gray-700">
                          国籍 <span className="text-red-500">*</span>
                          <span className="ml-2 text-xs text-gray-400">可多选，命中任一国籍即匹配本条件</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {NATIONALITY_OPTIONS.map((nationality) => (
                            <button
                              key={nationality}
                              type="button"
                              onClick={() => toggleNationality(rule.id, nationality)}
                              className={`rounded-full border px-3 py-1 text-sm transition ${
                                rule.nationalities.includes(nationality)
                                  ? 'border-purple-600 bg-purple-600 text-white'
                                  : 'border-gray-300 bg-white text-gray-600 hover:border-purple-300'
                              }`}
                            >
                              {nationality}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <label className="block text-sm">
            <span className="mb-1 block text-gray-700">备注</span>
            <textarea
              rows={3}
              value={form.remark}
              onChange={(event) => setForm({ ...form, remark: event.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} onClose={() => setDetailOpen(false)} title="价格政策类型详情" width="max-w-xl">
        {detail && (
          <>
            <DetailCard title="基本信息">
              <DetailRow label="政策类型编码" value={detail.code} />
              <DetailRow label="政策类型名称" value={detail.name} />
              <DetailRow label="经销商" value={detail.dealer} />
              <DetailRow label="价格政策类型" value={getPolicyTypeLabel(detail.policyType)} />
              <DetailRow label="优先级" value={String(detail.priority)} />
              <DetailRow label="状态" value={<StatusBadge status={detail.status} />} />
              <DetailRow label="有效期" value={`${formatDate(detail.effectiveStart)} ~ ${formatDate(detail.effectiveEnd)}`} />
            </DetailCard>
            <DetailCard title={detail.policyType === 'port' ? '口岸价生效规则' : '区域价生效规则'}>
              {detail.policyType === 'port' ? (
                <>
                  <DetailRow label="匹配方式" value={getPortMatchModeLabel(detail.portMatchMode)} />
                  <DetailRow label="出发港" value={detail.departurePorts.length > 0 ? detail.departurePorts.join('、') : '不限'} />
                </>
              ) : (
                <div className="space-y-2">
                  {detail.regionalMatchRules.map((rule, index) => (
                    <div key={rule.id} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                      <div className="text-xs text-gray-500">条件 {index + 1} · {getRegionalMatchTypeLabel(rule.matchType)}</div>
                      <div className="mt-1 font-medium text-gray-900">{formatRegionalMatchRule(rule)}</div>
                      {rule.matchType === 'id_card_prefix' && rule.prefix && (
                        <div className="mt-0.5 text-xs text-gray-500">匹配证件号前{rule.prefix.length}位为 {rule.prefix}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </DetailCard>
            <DetailCard title="其他">
              <DetailRow label="备注" value={detail.remark || '-'} />
              <DetailRow label="更新人" value={detail.updatedBy} />
              <DetailRow label="更新时间" value={formatDateTime(detail.updatedAt)} />
            </DetailCard>
          </>
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={confirmOpen}
        title="删除政策类型"
        message="确定删除该价格政策类型？删除后不影响已生成订单的计价快照。"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  type?: string
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
    </label>
  )
}
