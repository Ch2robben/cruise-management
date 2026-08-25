import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { inventoryPoolApi } from '@/mock/api'
import { resetPoolDemoState } from '@/mock/templatePoolQuotas'
import {
  getPricePolicyTypesByPoolId,
  countPricePolicyTypesByPoolId,
  formatPoolTypeBoundSummary,
  type PricePolicyType,
} from '@/mock/pricePolicyTypes'
import type { InventoryPool, InventoryPoolQuotaMode, PaginatedResult, SearchParams } from '@/types'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'

interface InventoryPoolForm {
  name: string
  quotaMode: InventoryPoolQuotaMode
  sort: number
  remark: string
}

const emptyForm: InventoryPoolForm = {
  name: '',
  quotaMode: 'shared',
  sort: 50,
  remark: '',
}

const quotaModeOptions: { value: InventoryPoolQuotaMode; label: string; hint: string }[] = [
  { value: 'shared', label: '共享余量', hint: '命中绑定本池的价格政策后，授权对象先到先得、共用余量' },
  { value: 'byDealer', label: '按经销商拆额度', hint: '航次配额阶段再按经销商填写可下单数' },
]

function quotaModeLabel(mode: InventoryPoolQuotaMode) {
  return quotaModeOptions.find((item) => item.value === mode)?.label ?? mode
}

/** 编码规则：POOL + yyyyMMdd + 3 位流水，如 POOL20260814001 */
function buildPoolCode(existingCodes: string[]) {
  const stamp = new Date()
  const y = stamp.getFullYear()
  const m = String(stamp.getMonth() + 1).padStart(2, '0')
  const d = String(stamp.getDate()).padStart(2, '0')
  const prefix = `POOL${y}${m}${d}`
  let maxSeq = 0
  for (const code of existingCodes) {
    if (!code.startsWith(prefix)) continue
    const seq = Number(code.slice(prefix.length))
    if (Number.isFinite(seq) && seq > maxSeq) maxSeq = seq
  }
  return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`
}

export default function InventoryPoolPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<InventoryPool>>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
  })

  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [quotaModeFilter, setQuotaModeFilter] = useState<'all' | InventoryPoolQuotaMode>('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingCode, setEditingCode] = useState('')
  const [form, setForm] = useState<InventoryPoolForm>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<InventoryPool | null>(null)
  const [linkedPolicies, setLinkedPolicies] = useState<PricePolicyType[]>([])

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')
  const [confirmBoundCount, setConfirmBoundCount] = useState(0)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)

  const [toast, setToast] = useState('')
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const fetchData = useCallback(
    async (page = 1) => {
      setLoading(true)
      const params: SearchParams = { page, pageSize: 10 }
      if (keyword.trim()) params.keyword = keyword.trim()
      if (statusFilter !== 'all') params.status = statusFilter

      try {
        const result = await inventoryPoolApi.list(params)
        let rows = result.data
        if (quotaModeFilter !== 'all') {
          rows = rows.filter((item) => item.quotaMode === quotaModeFilter)
        }
        rows = [...rows].sort((a, b) => a.sort - b.sort || a.code.localeCompare(b.code))
        setData({
          ...result,
          data: rows,
          total: quotaModeFilter === 'all' ? result.total : rows.length,
        })
      } finally {
        setLoading(false)
      }
    },
    [keyword, statusFilter, quotaModeFilter],
  )

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => fetchData(1)

  const handleReset = () => {
    setKeyword('')
    setStatusFilter('all')
    setQuotaModeFilter('all')
  }

  const openCreate = () => {
    setEditingId(null)
    setEditingCode('')
    setForm(emptyForm)
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (row: InventoryPool) => {
    setEditingId(row.id)
    setEditingCode(row.code)
    setForm({
      name: row.name,
      quotaMode: row.quotaMode,
      sort: row.sort,
      remark: row.remark || '',
    })
    setFormError('')
    setFormOpen(true)
  }

  const openDetail = async (row: InventoryPool) => {
    const item = await inventoryPoolApi.getById(row.id)
    setDetail(item || null)
    setLinkedPolicies(getPricePolicyTypesByPoolId(row.id))
    setDetailOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setFormError('请填写池名称')
      return
    }

    setFormLoading(true)
    setFormError('')
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    try {
      const basePayload = {
        name: form.name.trim(),
        quotaMode: form.quotaMode,
        sort: Number(form.sort) || 0,
        remark: form.remark.trim(),
      }
      if (editingId) {
        await inventoryPoolApi.update(editingId, {
          ...basePayload,
          updatedAt: now,
          updatedBy: '当前用户',
        })
        showToast('库存池已更新')
      } else {
        const existing = inventoryPoolApi.getData?.() ?? data.data
        const code = buildPoolCode(existing.map((item) => item.code))
        await inventoryPoolApi.create({
          ...basePayload,
          code,
          status: 'enabled',
          createdAt: now,
          updatedAt: now,
          updatedBy: '当前用户',
        } as InventoryPool)
        showToast(`库存池已创建（${code}）`)
      }
      setFormOpen(false)
      fetchData(data.page)
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggleStatus = async (id: string) => {
    const bound = countPricePolicyTypesByPoolId(id)
    const current = inventoryPoolApi.getData().find((item) => item.id === id)
    if (current?.status === 'enabled' && bound > 0) {
      showToast(`仍有 ${bound} 条价格政策绑定本池，停用后这些政策发布/下单将受阻`)
    }
    await inventoryPoolApi.toggleStatus(id)
    showToast('状态已更新')
    fetchData(data.page)
  }

  const handleDelete = async () => {
    const bound = countPricePolicyTypesByPoolId(confirmId)
    if (bound > 0) {
      showToast(`无法删除：仍有 ${bound} 条价格政策绑定本池，请先到「分销管理 → 价格政策」更换扣减池`)
      setConfirmOpen(false)
      return
    }
    await inventoryPoolApi.remove(confirmId)
    setConfirmOpen(false)
    showToast('库存池已删除')
    fetchData(data.page)
  }

  const columns = [
    {
      key: 'code',
      title: '池编码',
      width: '180px',
      render: (row: InventoryPool) => <span className="font-mono text-sm text-gray-900">{row.code}</span>,
    },
    {
      key: 'name',
      title: '池名称',
      render: (row: InventoryPool) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          {row.remark && (
            <div className="mt-0.5 truncate text-xs text-gray-400" title={row.remark}>
              {row.remark}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'quotaMode',
      title: '配额模式',
      width: '140px',
      render: (row: InventoryPool) => (
        <span
          className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
            row.quotaMode === 'shared' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'
          }`}
        >
          {quotaModeLabel(row.quotaMode)}
        </span>
      ),
    },
    {
      key: 'boundPolicies',
      title: '关联价格政策',
      width: '220px',
      render: (row: InventoryPool) => (
        <span className="text-sm text-gray-700" title={formatPoolTypeBoundSummary(row.id)}>
          {formatPoolTypeBoundSummary(row.id)}
        </span>
      ),
    },
    {
      key: 'sort',
      title: '排序',
      width: '70px',
      render: (row: InventoryPool) => <span className="text-sm text-gray-600">{row.sort}</span>,
    },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (row: InventoryPool) => <StatusBadge status={row.status} />,
    },
    {
      key: 'updatedAt',
      title: '更新时间',
      width: '160px',
      render: (row: InventoryPool) => <span className="text-xs text-gray-500">{row.updatedAt}</span>,
    },
    {
      key: 'actions',
      title: '操作',
      width: '220px',
      render: (row: InventoryPool) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openDetail(row)}
            className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            详情
          </button>
          <button
            onClick={() => openEdit(row)}
            className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            编辑
          </button>
          <button
            onClick={() => handleToggleStatus(row.id)}
            className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            {row.status === 'enabled' ? '停用' : '启用'}
          </button>
          <button
            onClick={() => {
              setConfirmId(row.id)
              setConfirmBoundCount(countPricePolicyTypesByPoolId(row.id))
              setConfirmOpen(true)
            }}
            className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            删除
          </button>
        </div>
      ),
    },
  ]

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900'

  return (
    <div>
      {toast && (
        <div className="fixed left-1/2 top-6 z-[999] -translate-x-1/2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <PageHeader
        title="库存池管理"
        description="维护可售名额容器。谁能使用本池，由价格政策上绑定的扣减库存池决定。"
      />

      <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-800">
        库存池不配置授权范围。请在「分销管理 → 价格政策」选择扣减库存池；列表「关联价格政策」按已绑定政策反查适用范围。
        航次池配额与预订已售保存在本机浏览器，刷新后仍在。
      </div>

      <SearchPanel onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">关键词</label>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="编码/名称/备注"
            className="w-52 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">配额模式</label>
          <select
            value={quotaModeFilter}
            onChange={(e) => setQuotaModeFilter(e.target.value as 'all' | InventoryPoolQuotaMode)}
            className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="all">全部</option>
            {quotaModeOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">状态</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="all">全部</option>
            <option value="enabled">启用</option>
            <option value="disabled">停用</option>
          </select>
        </div>
      </SearchPanel>

      <div className="bg-white px-9 py-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            onClick={openCreate}
            className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            新增库存池
          </button>
          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="inline-flex h-11 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            重置演示库存数据
          </button>
        </div>
        <DataTable
          columns={columns}
          dataSource={data.data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: data.page,
            pageSize: data.pageSize,
            total: data.total,
            onChange: fetchData,
          }}
        />
      </div>

      <FormDialog
        open={formOpen}
        title={editingId ? '编辑库存池' : '新增库存池'}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        loading={formLoading}
        width="max-w-xl"
      >
        <div className="space-y-4">
          {formError && <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600">{formError}</div>}
          <div>
            <label className="mb-1 block text-sm text-gray-700">池编码</label>
            <input
              value={editingId ? editingCode : '保存后自动生成'}
              disabled
              className={`${inputClass} bg-gray-50 text-gray-500`}
            />
            <p className="mt-1 text-xs text-gray-400">
              {editingId ? '编码创建后不可修改' : '规则：POOL + 日期(yyyyMMdd) + 3 位流水，如 POOL20260814001'}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">
              池名称 <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="如同业共享池"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">
              配额模式 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {quotaModeOptions.map((item) => (
                <label
                  key={item.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 ${
                    form.quotaMode === item.value ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="quotaMode"
                    checked={form.quotaMode === item.value}
                    onChange={() => setForm((prev) => ({ ...prev, quotaMode: item.value }))}
                    className="mt-1 accent-blue-600"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-900">{item.label}</span>
                    <span className="mt-0.5 block text-xs text-gray-500">{item.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">排序</label>
            <input
              type="number"
              value={form.sort}
              onChange={(e) => setForm((prev) => ({ ...prev, sort: Number(e.target.value) }))}
              className={`${inputClass} w-32`}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">备注</label>
            <textarea
              value={form.remark}
              onChange={(e) => setForm((prev) => ({ ...prev, remark: e.target.value }))}
              rows={3}
              placeholder="用途说明，便于运营识别"
              className={inputClass}
            />
          </div>
          <p className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
            谁能使用本池：请到「分销管理 → 价格政策」选择本池作为扣减库存池。政策上的分销商分组即本池适用范围。
          </p>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="库存池详情" onClose={() => setDetailOpen(false)}>
        {detail && (
          <div className="space-y-6">
            <DetailCard title="基本信息">
              <DetailRow label="池编码" value={<span className="font-mono">{detail.code}</span>} />
              <DetailRow label="池名称" value={detail.name} />
              <DetailRow label="配额模式" value={quotaModeLabel(detail.quotaMode)} />
              <DetailRow label="排序" value={String(detail.sort)} />
              <DetailRow label="状态" value={<StatusBadge status={detail.status} />} />
              <DetailRow label="备注" value={detail.remark || '-'} />
            </DetailCard>
            <DetailCard title="已绑定价格政策（适用范围）">
              {linkedPolicies.length === 0 ? (
                <p className="text-sm text-gray-400">暂无价格政策绑定本池。绑定后，政策的分销商分组即本池可用范围。</p>
              ) : (
                <div className="space-y-2">
                  {linkedPolicies.map((policy) => (
                    <div key={policy.id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-gray-900">{policy.name}</span>
                        <span className="shrink-0 font-mono text-xs text-gray-500">{policy.code}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {policy.distributorGroup} · {policy.policyType === 'ota' ? 'OTA' : '非OTA'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DetailCard>
            <DetailCard title="系统信息">
              <DetailRow label="创建时间" value={detail.createdAt} />
              <DetailRow label="更新时间" value={detail.updatedAt} />
              <DetailRow label="更新人" value={detail.updatedBy} />
            </DetailCard>
          </div>
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={confirmOpen}
        title="删除库存池"
        message={
          confirmBoundCount > 0
            ? `当前有 ${confirmBoundCount} 条价格政策绑定本池，无法删除。请先在「分销管理 → 价格政策」中更换这些政策的扣减库存池。`
            : '确定删除该库存池？此操作不可恢复。'
        }
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
      <ConfirmDialog
        open={resetConfirmOpen}
        title="重置演示库存数据"
        message="将清空本机已保存的库存池配额、经销商额度和预订已售，并恢复演示种子。不影响库存池主数据。"
        danger
        confirmText="重置"
        onConfirm={() => {
          resetPoolDemoState()
          setResetConfirmOpen(false)
          showToast('演示库存数据已重置')
        }}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </div>
  )
}
