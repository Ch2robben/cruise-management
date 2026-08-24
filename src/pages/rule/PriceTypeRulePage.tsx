import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'
import PolicyRegionPicker, { type SelectedPolicyRegion } from '@/components/rule/PolicyRegionPicker'
import { formatDate, formatDateTime } from '@/utils/format'
import { inventoryPoolApi } from '@/mock/api'
import {
  listPricePolicyTypes,
  upsertPricePolicyType,
  removePricePolicyType,
  type PricePolicyType,
  type PricePolicyTypeForm,
  type PricePolicyTypeKind,
  type PricePolicyCategory,
} from '@/mock/pricePolicyTypes'
import { syncDistPoliciesPoolFromType } from '@/mock/pricePolicies'
import type { Status } from '@/types'
import type { RegionScopeKind } from '@/mock/pricePolicyRegions'

export type { PricePolicyType, PricePolicyTypeKind, PricePolicyCategory } from '@/mock/pricePolicyTypes'

const distributorGroupOptions = ['A组', 'B组', 'C组', 'D组']

const otaChannelOptions = ['美团', '携程', '抖音', '同程', '飞猪', '抖音团购', '抖音预售']

const categoryOptions: { value: PricePolicyCategory; label: string }[] = [
  { value: 'regular', label: '正价' },
  { value: 'special', label: '特价' },
]

const policyTypeOptions: { value: PricePolicyTypeKind; label: string }[] = [
  { value: 'regional', label: '区域价' },
  { value: 'global', label: '全域价' },
  { value: 'ota', label: 'OTA价' },
]

const scopeOptions: { value: RegionScopeKind; label: string; hint: string }[] = [
  { value: 'domestic', label: '境内', hint: '身份证前六位区划' },
  { value: 'overseas', label: '境外', hint: '证件属地（含港澳台）' },
]

function getEnabledInventoryPools() {
  return inventoryPoolApi
    .getData()
    .filter((item) => item.status === 'enabled')
    .sort((a, b) => a.sort - b.sort || a.code.localeCompare(b.code))
}

function defaultPool() {
  const pool = getEnabledInventoryPools()[0]
  return { inventoryPoolId: pool?.id ?? '', inventoryPoolName: pool?.name ?? '' }
}

const emptyForm: PricePolicyTypeForm = {
  code: 'PPOL-NEW',
  name: '',
  distributorGroup: distributorGroupOptions[0],
  category: 'regular',
  policyType: 'regional',
  ...defaultPool(),
  priority: 10,
  effectiveStart: '2026-01-01',
  effectiveEnd: '2026-12-31',
  scopes: ['domestic'],
  domesticRegions: [],
  overseasRegions: [],
  otaChannels: [],
  retailEqualsSettlement: false,
  status: 'enabled',
  remark: '',
}

function getCategoryLabel(category: PricePolicyCategory) {
  return categoryOptions.find((item) => item.value === category)?.label || category
}

function getPolicyTypeLabel(type: PricePolicyTypeKind) {
  return policyTypeOptions.find((item) => item.value === type)?.label || type
}

function getScopeLabel(scope: RegionScopeKind) {
  return scopeOptions.find((item) => item.value === scope)?.label || scope
}

function formatRegions(regions: SelectedPolicyRegion[]) {
  if (regions.length === 0) return '-'
  if (regions.length <= 2) return regions.map((item) => item.pathLabel).join('、')
  return `${regions.slice(0, 2).map((item) => item.pathLabel).join('、')} 等${regions.length}项`
}

function formatEffectiveRule(rule: PricePolicyType) {
  if (rule.policyType === 'ota') {
    const channels = rule.otaChannels.length > 0 ? rule.otaChannels.join('、') : '未选渠道'
    const priceRule = rule.retailEqualsSettlement ? '零售价=结算价' : '零售价/结算价分设'
    return `OTA · ${channels} · ${priceRule}`
  }

  const scopeText = rule.scopes.length > 0
    ? rule.scopes.map(getScopeLabel).join('+')
    : '未选范围'

  if (rule.policyType === 'global') {
    return `全域 · ${scopeText}`
  }

  const parts: string[] = []
  if (rule.scopes.includes('domestic')) {
    parts.push(`境内：${formatRegions(rule.domesticRegions)}`)
  }
  if (rule.scopes.includes('overseas')) {
    parts.push(`境外：${formatRegions(rule.overseasRegions)}`)
  }
  return parts.length > 0 ? parts.join('；') : `区域 · ${scopeText}`
}

function getCategoryBadgeClass(category: PricePolicyCategory) {
  if (category === 'special') return 'bg-rose-50 text-rose-700'
  return 'bg-emerald-50 text-emerald-700'
}

function getPolicyTypeBadgeClass(type: PricePolicyTypeKind) {
  if (type === 'global') return 'bg-blue-50 text-blue-700'
  if (type === 'ota') return 'bg-amber-50 text-amber-700'
  return 'bg-purple-50 text-purple-700'
}

function regionsOverlap(a: SelectedPolicyRegion[], b: SelectedPolicyRegion[]) {
  const codes = new Set(a.map((item) => item.code))
  return b.filter((item) => codes.has(item.code))
}

export default function PricePolicyTypePage({ embedded = false }: { embedded?: boolean }) {
  const [records, setRecords] = useState<PricePolicyType[]>(() => listPricePolicyTypes())
  const [keyword, setKeyword] = useState('')
  const [distributorGroupFilter, setDistributorGroupFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
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

  const enabledPools = getEnabledInventoryPools()
  const poolOptionsForSelect = (() => {
    if (!form.inventoryPoolId) return enabledPools
    const current = inventoryPoolApi.getData().find((p) => p.id === form.inventoryPoolId)
    if (current && current.status !== 'enabled' && !enabledPools.some((p) => p.id === current.id)) {
      return [current, ...enabledPools]
    }
    return enabledPools
  })()
  const selectedPool = enabledPools.find((p) => p.id === form.inventoryPoolId)
    ?? inventoryPoolApi.getData().find((p) => p.id === form.inventoryPoolId)

  const filteredRecords = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return records.filter((item) => {
      const regionText = [
        ...item.domesticRegions.flatMap((r) => [r.code, r.label, r.pathLabel]),
        ...item.overseasRegions.flatMap((r) => [r.code, r.label, r.pathLabel]),
      ]
      const matchedKeyword = !kw || [
        item.code,
        item.name,
        item.distributorGroup,
        item.inventoryPoolName,
        item.remark,
        formatEffectiveRule(item),
        ...regionText,
      ].some((value) => value.toLowerCase().includes(kw))
      const matchedDistributorGroup = distributorGroupFilter === 'all' || item.distributorGroup === distributorGroupFilter
      const matchedCategory = categoryFilter === 'all' || item.category === categoryFilter
      const matchedPolicyType = policyTypeFilter === 'all' || item.policyType === policyTypeFilter
      const matchedStatus = statusFilter === 'all' || item.status === statusFilter
      return matchedKeyword && matchedDistributorGroup && matchedCategory && matchedPolicyType && matchedStatus
    })
  }, [records, keyword, distributorGroupFilter, categoryFilter, policyTypeFilter, statusFilter])

  const pageSize = 10
  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize)

  const openCreate = () => {
    setEditingId(null)
    setForm({
      ...emptyForm,
      ...defaultPool(),
      domesticRegions: [],
      overseasRegions: [],
      scopes: ['domestic'],
      otaChannels: [],
      retailEqualsSettlement: false,
    })
    setFormOpen(true)
  }

  const openEdit = (record: PricePolicyType) => {
    setEditingId(record.id)
    setForm({
      code: record.code,
      name: record.name,
      distributorGroup: record.distributorGroup,
      category: record.category,
      policyType: record.policyType,
      inventoryPoolId: record.inventoryPoolId,
      inventoryPoolName: record.inventoryPoolName,
      priority: record.priority,
      effectiveStart: record.effectiveStart,
      effectiveEnd: record.effectiveEnd,
      scopes: [...record.scopes],
      domesticRegions: record.domesticRegions.map((item) => ({ ...item, path: [...item.path] })),
      overseasRegions: record.overseasRegions.map((item) => ({ ...item, path: [...item.path] })),
      otaChannels: [...(record.otaChannels || [])],
      retailEqualsSettlement: Boolean(record.retailEqualsSettlement),
      status: record.status,
      remark: record.remark,
    })
    setFormOpen(true)
  }

  const openDetail = (record: PricePolicyType) => {
    setDetail(record)
    setDetailOpen(true)
  }

  const applyRegionSelection = (next: SelectedPolicyRegion[]) => {
    const domesticRegions = next.filter((item) => item.scope === 'domestic')
    const overseasRegions = next.filter((item) => item.scope === 'overseas')
    const scopes: RegionScopeKind[] = []
    if (domesticRegions.length > 0) scopes.push('domestic')
    if (overseasRegions.length > 0) scopes.push('overseas')
    setForm((prev) => ({
      ...prev,
      domesticRegions,
      overseasRegions,
      scopes,
    }))
  }

  const applyScopeSelection = (next: SelectedPolicyRegion[]) => {
    const scopes = next.map((item) => item.scope)
    setForm((prev) => ({
      ...prev,
      scopes,
      domesticRegions: [],
      overseasRegions: [],
    }))
  }

  const handleSubmit = () => {
    if (!form.name.trim()) {
      window.alert('请填写政策名称')
      return
    }
    if (!form.inventoryPoolId) {
      window.alert('请选择扣减库存池')
      return
    }
    const pool = inventoryPoolApi.getData().find((item) => item.id === form.inventoryPoolId)
    if (!pool || pool.status !== 'enabled') {
      window.alert('所选库存池不存在或已停用，请重新选择')
      return
    }

    if (form.policyType === 'ota') {
      if (form.otaChannels.length === 0) {
        window.alert('请至少选择一个 OTA 渠道')
        return
      }
    } else {
      if (form.scopes.length === 0) {
        window.alert('请至少选择一个生效范围（境内或境外）')
        return
      }

      if (form.policyType === 'regional') {
        if (form.domesticRegions.length + form.overseasRegions.length === 0) {
          window.alert('请至少在生效范围树中勾选一个区域')
          return
        }

        const peerRegional = records.filter(
          (item) =>
            item.id !== editingId
            && item.policyType === 'regional'
            && item.distributorGroup === form.distributorGroup,
        )

        if (form.scopes.includes('domestic')) {
          for (const peer of peerRegional) {
            const overlap = regionsOverlap(form.domesticRegions, peer.domesticRegions)
            if (overlap.length > 0) {
              window.alert(
                `境内区域与「${peer.name}」重复：${overlap.map((item) => item.pathLabel).join('、')}。同一经销商分组的境内区域结算政策区域合集不可重复。`,
              )
              return
            }
          }
        }

        if (form.scopes.includes('overseas')) {
          for (const peer of peerRegional) {
            const overlap = regionsOverlap(form.overseasRegions, peer.overseasRegions)
            if (overlap.length > 0) {
              window.alert(
                `境外区域与「${peer.name}」重复：${overlap.map((item) => item.pathLabel).join('、')}。同一经销商分组的境外区域结算政策区域合集不可重复。`,
              )
              return
            }
          }
        }
      }
    }

    const payload: PricePolicyTypeForm = {
      ...form,
      inventoryPoolId: pool.id,
      inventoryPoolName: pool.name,
      scopes: form.policyType === 'ota' ? [] : form.scopes,
      domesticRegions: form.policyType === 'regional' && form.scopes.includes('domestic')
        ? form.domesticRegions
        : [],
      overseasRegions: form.policyType === 'regional' && form.scopes.includes('overseas')
        ? form.overseasRegions
        : [],
      otaChannels: form.policyType === 'ota' ? form.otaChannels : [],
      retailEqualsSettlement: form.policyType === 'ota' ? form.retailEqualsSettlement : false,
    }

    const saved = upsertPricePolicyType(payload, editingId)
    if (saved.inventoryPoolId) {
      syncDistPoliciesPoolFromType(saved.id, saved.inventoryPoolId, saved.inventoryPoolName)
    }
    setRecords(listPricePolicyTypes())
    setFormOpen(false)
    setPage(1)
  }

  const handleDelete = () => {
    removePricePolicyType(confirmId)
    setRecords(listPricePolicyTypes())
    setConfirmOpen(false)
    setConfirmId('')
  }

  return (
    <div>
      {!embedded && (
        <PageHeader
          title="政策列表"
          description="按分销商分组配置区域价、全域价与 OTA 价；每条政策指定唯一扣减库存池，下单命中后从该池扣减可售名额。"
        >
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            新增政策
          </button>
        </PageHeader>
      )}
      {embedded && (
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900">政策列表</h3>
            <p className="mt-1 text-xs text-gray-500">
              按分销商分组配置区域价、全域价与 OTA 价；每条政策指定唯一扣减库存池，下单命中后从该池扣减可售名额。
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            新增政策
          </button>
        </div>
      )}

      <SearchPanel
        onSearch={() => setPage(1)}
        onReset={() => {
          setKeyword('')
          setDistributorGroupFilter('all')
          setCategoryFilter('all')
          setPolicyTypeFilter('all')
          setStatusFilter('all')
          setPage(1)
        }}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <label className="block text-sm">
            <span className="mb-1 block text-gray-700">关键词</span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="政策编码 / 名称 / 渠道 / 区域"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-gray-700">分销商分组</span>
            <select value={distributorGroupFilter} onChange={(event) => setDistributorGroupFilter(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="all">全部</option>
              {distributorGroupOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-gray-700">分类</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="all">全部</option>
              {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-gray-700">计价类型</span>
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
          { key: 'code', title: '政策编码', width: '130px' },
          { key: 'name', title: '政策名称', width: '180px' },
          { key: 'distributorGroup', title: '分销商分组', width: '120px' },
          {
            key: 'inventoryPool',
            title: '扣减库存池',
            width: '160px',
            render: (record) => {
              const poolAlive = inventoryPoolApi.getData().find((item) => item.id === record.inventoryPoolId)
              const poolWarn = !poolAlive || poolAlive.status !== 'enabled'
              return (
                <div>
                  <div className="text-sm text-gray-900">{record.inventoryPoolName || '-'}</div>
                  {poolWarn && <div className="mt-0.5 text-xs text-rose-500">池已停用/缺失</div>}
                </div>
              )
            },
          },
          {
            key: 'category',
            title: '分类',
            width: '90px',
            render: (record) => (
              <span className={`rounded px-2 py-0.5 text-xs ${getCategoryBadgeClass(record.category)}`}>
                {getCategoryLabel(record.category)}
              </span>
            ),
          },
          {
            key: 'policyType',
            title: '计价类型',
            width: '110px',
            render: (record) => (
              <span className={`rounded px-2 py-0.5 text-xs ${getPolicyTypeBadgeClass(record.policyType)}`}>
                {getPolicyTypeLabel(record.policyType)}
              </span>
            ),
          },
          {
            key: 'effectiveRule',
            title: '生效规则',
            width: '260px',
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
        title={editingId ? '编辑价格政策' : '新增价格政策'}
        width="max-w-3xl"
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="政策编码" value={form.code} onChange={(code) => setForm({ ...form, code })} />
            <Field label="政策名称" value={form.name} onChange={(name) => setForm({ ...form, name })} required />
            <label className="block text-sm">
              <span className="mb-1 block text-gray-700">分销商分组 <span className="text-red-500">*</span></span>
              <select value={form.distributorGroup} onChange={(event) => setForm({ ...form, distributorGroup: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {distributorGroupOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-700">分类 <span className="text-red-500">*</span></span>
              <select
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value as PricePolicyCategory })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-700">计价类型 <span className="text-red-500">*</span></span>
              <select
                value={form.policyType}
                onChange={(event) => {
                  const policyType = event.target.value as PricePolicyTypeKind
                  setForm({
                    ...form,
                    policyType,
                    scopes: policyType === 'ota' ? [] : (form.scopes.length > 0 ? form.scopes : ['domestic']),
                    domesticRegions: policyType === 'regional' ? form.domesticRegions : [],
                    overseasRegions: policyType === 'regional' ? form.overseasRegions : [],
                    otaChannels: policyType === 'ota' ? form.otaChannels : [],
                    retailEqualsSettlement: policyType === 'ota' ? form.retailEqualsSettlement : false,
                  })
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {policyTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-gray-700">扣减库存池 <span className="text-red-500">*</span></span>
              <select
                value={form.inventoryPoolId}
                onChange={(event) => {
                  const pool = inventoryPoolApi.getData().find((item) => item.id === event.target.value)
                  setForm({
                    ...form,
                    inventoryPoolId: event.target.value,
                    inventoryPoolName: pool?.name ?? '',
                  })
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {poolOptionsForSelect.length === 0 && <option value="">暂无启用中的库存池</option>}
                {poolOptionsForSelect.map((pool) => (
                  <option key={pool.id} value={pool.id}>
                    {pool.name}（{pool.quotaMode === 'shared' ? '共享' : '按经销商'}）
                    {pool.status !== 'enabled' ? ' · 已停用' : ''}
                  </option>
                ))}
              </select>
              {selectedPool && (
                <p className="mt-1.5 text-xs leading-5 text-gray-500">
                  下单命中本政策时，从「{selectedPool.name}」扣减可售名额（{selectedPool.quotaMode === 'shared' ? '共享余量' : '按经销商拆额度'}）。适用范围即本政策的分销商分组。
                </p>
              )}
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

          {form.policyType === 'ota' ? (
            <div className="space-y-4 rounded-lg border border-amber-100 bg-amber-50/50 p-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">OTA价生效规则</h4>
                <p className="mt-1 text-xs text-gray-500">面向指定 OTA 渠道的结算政策；可勾选零售价与结算价相同。</p>
              </div>
              <div>
                <div className="mb-2 text-sm text-gray-700">
                  关联 OTA 渠道 <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs text-gray-400">可多选</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {otaChannelOptions.map((channel) => {
                    const active = form.otaChannels.includes(channel)
                    return (
                      <button
                        key={channel}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            otaChannels: active
                              ? prev.otaChannels.filter((item) => item !== channel)
                              : [...prev.otaChannels, channel],
                          }))
                        }}
                        className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                          active
                            ? 'border-amber-600 bg-amber-600 text-white'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {channel}
                      </button>
                    )
                  })}
                </div>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.retailEqualsSettlement}
                  onChange={(event) => setForm({ ...form, retailEqualsSettlement: event.target.checked })}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                零售价与结算价相同
              </label>
            </div>
          ) : (
            <div className={`rounded-lg border p-4 space-y-4 ${
              form.policyType === 'regional'
                ? 'border-purple-100 bg-purple-50/50'
                : 'border-blue-100 bg-blue-50/50'
            }`}
            >
              <div>
                <h4 className="text-sm font-semibold text-gray-800">
                  {form.policyType === 'regional' ? '区域价生效规则' : '全域价生效规则'}
                </h4>
                <p className="mt-1 text-xs text-gray-500">
                  {form.policyType === 'regional'
                    ? '面向指定区域游客的优惠结算价；在下方树中勾选境内省市区或境外国家/港澳台。'
                    : '保底结算价；勾选境内/境外即可覆盖对应属地全部游客。'}
                </p>
              </div>

              <div>
                <div className="mb-2 text-sm text-gray-700">
                  生效范围 <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs text-gray-400">树状多选</span>
                </div>
                {form.policyType === 'regional' ? (
                  <PolicyRegionPicker
                    variant="regions"
                    value={[...form.domesticRegions, ...form.overseasRegions]}
                    onChange={applyRegionSelection}
                  />
                ) : (
                  <PolicyRegionPicker
                    variant="scopes"
                    value={form.scopes.map((scope) => ({
                      code: scope,
                      label: scope === 'domestic' ? '境内' : '境外',
                      pathLabel: scope === 'domestic' ? '境内' : '境外',
                      path: [scope === 'domestic' ? '境内' : '境外'],
                      scope,
                    }))}
                    onChange={applyScopeSelection}
                  />
                )}
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

      <DetailDrawer open={detailOpen} onClose={() => setDetailOpen(false)} title="价格政策详情" width="max-w-xl">
        {detail && (
          <>
            <DetailCard title="基本信息">
              <DetailRow label="政策编码" value={detail.code} />
              <DetailRow label="政策名称" value={detail.name} />
              <DetailRow label="分销商分组" value={detail.distributorGroup} />
              <DetailRow label="分类" value={getCategoryLabel(detail.category)} />
              <DetailRow label="计价类型" value={getPolicyTypeLabel(detail.policyType)} />
              <DetailRow label="扣减库存池" value={detail.inventoryPoolName || '-'} />
              <DetailRow label="优先级" value={String(detail.priority)} />
              <DetailRow label="状态" value={<StatusBadge status={detail.status} />} />
              <DetailRow label="有效期" value={`${formatDate(detail.effectiveStart)} ~ ${formatDate(detail.effectiveEnd)}`} />
            </DetailCard>
            {detail.policyType === 'ota' ? (
              <DetailCard title="OTA价生效规则">
                <DetailRow
                  label="关联 OTA 渠道"
                  value={detail.otaChannels.length > 0 ? detail.otaChannels.join('、') : '-'}
                />
                <DetailRow
                  label="零售价与结算价"
                  value={detail.retailEqualsSettlement ? '相同' : '分设'}
                />
              </DetailCard>
            ) : (
              <DetailCard title={detail.policyType === 'regional' ? '区域价生效规则' : '全域价生效规则'}>
                <DetailRow
                  label="生效范围"
                  value={detail.scopes.length > 0 ? detail.scopes.map(getScopeLabel).join('、') : '-'}
                />
                {detail.policyType === 'regional' && (
                  <div className="mt-3">
                    <div className="mb-1 text-xs text-gray-500">已选区域</div>
                    <div className="flex flex-wrap gap-1.5">
                      {[...detail.domesticRegions, ...detail.overseasRegions].length === 0 ? (
                        <span className="text-xs text-gray-400">-</span>
                      ) : (
                        [...detail.domesticRegions, ...detail.overseasRegions].map((item) => (
                          <span key={`${item.scope}-${item.code}`} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                            <span className="mr-1 text-gray-400">{item.scope === 'domestic' ? '境内' : '境外'}</span>
                            <span className="mr-1 font-mono text-gray-400">{item.code}</span>
                            {item.pathLabel}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </DetailCard>
            )}
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
        title="删除政策"
        message="确定删除该价格政策？删除后不影响已生成订单的计价快照。"
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
