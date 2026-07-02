import { useState, useEffect, useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import { templateApi } from '@/mock/api'
import { products, ships } from '@/mock/data'
import type { VoyageTemplate, PaginatedResult, SearchParams } from '@/types'
import { formatDateTime } from '@/utils/format'
import { applyVoyageConfigToTemplate } from '@/utils/productVoyageConfig'
import { resolveProductItinerarySchedule } from '@/utils/itinerarySchedule'
import { formatItineraryDayLabel } from '@/components/voyage/ItineraryEditor'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'

const statusLabels: Record<string, string> = { draft: '草稿', enabled: '已启用', disabled: '已停用' }
const statusColors: Record<string, string> = { draft: 'bg-gray-100 text-gray-600', enabled: 'bg-green-100 text-green-700', disabled: 'bg-red-100 text-red-600' }

type TemplateForm = Pick<VoyageTemplate,
  | 'code' | 'name' | 'productId' | 'productName' | 'shipName'
  | 'voyageEndTime' | 'voyageStartTime' | 'sailType' | 'sailDay' | 'sailTime' | 'totalDays' | 'status'
>

const emptyForm: TemplateForm = {
  code: '', name: '', productId: '', productName: '', shipName: '',
  voyageEndTime: '', voyageStartTime: '', sailType: '周内固定', sailDay: '', sailTime: '', totalDays: 0,
  status: 'draft',
}

export default function TemplatePage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<VoyageTemplate>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [keyword, setKeyword] = useState('')
  const [shipFilter, setShipFilter] = useState('all')
  const [directionFilter, setDirectionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TemplateForm>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<VoyageTemplate | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    if (keyword.trim()) params.keyword = keyword.trim()
    if (shipFilter !== 'all') params.shipName = shipFilter
    if (directionFilter !== 'all') params.direction = directionFilter
    if (statusFilter !== 'all') params.status = statusFilter
    const result = await templateApi.list(params)
    setData(result)
    setSelectedIds(new Set())
    setLoading(false)
  }, [keyword, shipFilter, directionFilter, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])
  const handleSearch = () => fetchData(1)
  const handleReset = () => { setKeyword(''); setShipFilter('all'); setDirectionFilter('all'); setStatusFilter('all') }

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormOpen(true) }
  const openEdit = (record: VoyageTemplate) => {
    setEditingId(record.id)
    setForm({
      code: record.code,
      name: record.name,
      productId: record.productId,
      productName: record.productName,
      shipName: record.shipName,
      voyageEndTime: record.voyageEndTime,
      voyageStartTime: record.voyageStartTime,
      sailType: record.sailType,
      sailDay: record.sailDay,
      sailTime: record.sailTime,
      totalDays: record.totalDays,
      status: record.status,
    })
    setFormOpen(true)
  }
  const openDetail = async (record: VoyageTemplate) => {
    const item = await templateApi.getById(record.id)
    setDetail(item || null)
    setDetailOpen(true)
  }
  const handleDelete = (id: string) => { setConfirmId(id); setConfirmOpen(true) }
  const confirmDelete = async () => { await templateApi.remove(confirmId); setConfirmOpen(false); fetchData(data.page) }
  const handleToggleStatus = async (id: string) => { await templateApi.toggleStatus(id); fetchData(data.page) }
  const handleBatchPublishPlan = async () => {
    const selectedTemplates = data.data.filter((item) => selectedIds.has(item.id))
    for (const item of selectedTemplates) {
      await templateApi.update(item.id, {
        status: 'enabled',
        updatedBy: '当前用户',
        updatedAt: new Date().toISOString(),
      })
    }
    fetchData(data.page)
  }
  const handleBatchEditPlan = () => {
    const selectedTemplate = data.data.find((item) => selectedIds.has(item.id))
    if (selectedTemplate) openEdit(selectedTemplate)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (data.data.length > 0 && prev.size === data.data.length) return new Set()
      return new Set(data.data.map((item) => item.id))
    })
  }

  const directionLabels: Record<string, string> = { upstream: '上水', downstream: '下水' }
  const getTemplateDirection = (record: VoyageTemplate) => directionLabels[products.find((item) => item.id === record.productId)?.routeType || ''] || '-'

  const onProductChange = (productId: string) => {
    const product = products.find((item) => item.id === productId)
    if (!product) return
    setForm((prev) => ({
      ...prev,
      productId,
      productName: product.name,
      shipName: product.shipName || '',
      totalDays: product.days,
    }))
  }

  const handleSubmit = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.productId) return
    setFormLoading(true)
    const now = new Date().toISOString()
    const product = products.find((item) => item.id === form.productId)
    const inheritedConfig = applyVoyageConfigToTemplate(product)
    const inheritedItinerary = resolveProductItinerarySchedule(product?.itineraryPlanId)
    const existing = editingId ? await templateApi.getById(editingId) : null
    const item: Omit<VoyageTemplate, 'id'> = {
      ...form,
      itinerary: inheritedItinerary.length ? inheritedItinerary : (existing?.itinerary || []),
      inventory: existing?.inventory || [],
      basePriceRef: existing?.basePriceRef || 0,
      surchargeStrategy: existing?.surchargeStrategy || [],
      settlementRule: existing?.settlementRule || '',
      earlyBirdDiscount: existing?.earlyBirdDiscount || 0,
      ...inheritedConfig,
      updatedBy: '当前用户',
      updatedAt: now,
      createdAt: editingId ? existing?.createdAt || now : now,
    }
    if (editingId) await templateApi.update(editingId, item as Partial<VoyageTemplate>)
    else await templateApi.create(item)
    setFormLoading(false)
    setFormOpen(false)
    fetchData(data.page)
  }

  const columns = [
    {
      key: 'select',
      title: '',
      width: '48px',
      render: (record: VoyageTemplate) => (
        <input
          type="checkbox"
          checked={selectedIds.has(record.id)}
          onChange={() => toggleSelect(record.id)}
          className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
        />
      ),
    },
    { key: 'code', title: '模板编码', render: (record: VoyageTemplate) => <span className="font-mono text-xs">{record.code}</span> },
    { key: 'name', title: '名称', dataIndex: 'name' as keyof VoyageTemplate },
    { key: 'productName', title: '关联产品', dataIndex: 'productName' as keyof VoyageTemplate },
    { key: 'shipName', title: '适用游轮', dataIndex: 'shipName' as keyof VoyageTemplate },
    { key: 'direction', title: '航行类型', render: (record: VoyageTemplate) => getTemplateDirection(record) },
    { key: 'voyageStartTime', title: '开始时间', dataIndex: 'voyageStartTime' as keyof VoyageTemplate },
    { key: 'voyageEndTime', title: '结束时间', dataIndex: 'voyageEndTime' as keyof VoyageTemplate },
    { key: 'sailType', title: '开航类型', render: (record: VoyageTemplate) => record.sailType === '周内固定' ? `每周${record.sailDay}` : `每${record.sailDay}天` },
    { key: 'sailTime', title: '开航时间', dataIndex: 'sailTime' as keyof VoyageTemplate },
    { key: 'totalDays', title: '总时长', render: (record: VoyageTemplate) => `${record.totalDays}天` },
    { key: 'status', title: '状态', render: (record: VoyageTemplate) => <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${statusColors[record.status]}`}>{statusLabels[record.status]}</span> },
    { key: 'updatedBy', title: '修改人', dataIndex: 'updatedBy' as keyof VoyageTemplate },
    { key: 'updatedAt', title: '修改时间', render: (record: VoyageTemplate) => formatDateTime(record.updatedAt) },
    { key: 'actions', title: '操作', width: '200px', render: (record: VoyageTemplate) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openDetail(record)} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">详情</button>
        <button onClick={() => openEdit(record)} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">编辑</button>
        <button onClick={() => handleToggleStatus(record.id)} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">{record.status === 'enabled' ? '停用' : '启用'}</button>
        <button onClick={() => handleDelete(record.id)} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">删除</button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="航次模板" description="维护开航计划与航次行程；定金、销售规则与小费请在关联产品的「产品配置」中维护">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBatchPublishPlan}
            disabled={selectedIds.size === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            发布计划
          </button>
          <button
            onClick={handleBatchEditPlan}
            disabled={selectedIds.size !== 1}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-300 disabled:hover:bg-white"
          >
            修改计划
          </button>
          <button onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"><Plus className="h-4 w-4" />新增模板</button>
        </div>
      </PageHeader>
      <SearchPanel onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">所属游轮</label><select value={shipFilter} onChange={(event) => setShipFilter(event.target.value)} className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="all">全部</option>{ships.map((ship) => <option key={ship.id} value={ship.name}>{ship.name}</option>)}</select></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">航行类型</label><select value={directionFilter} onChange={(event) => setDirectionFilter(event.target.value)} className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="all">全部</option><option value="upstream">上水</option><option value="downstream">下水</option></select></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">状态</label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="all">全部</option><option value="draft">草稿</option><option value="enabled">已启用</option><option value="disabled">已停用</option></select></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">模糊搜索</label><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="模板编码/名称" className="w-44 rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
      </SearchPanel>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-200 bg-gray-50">{columns.map((column) => <th key={column.key} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600" style={column.width ? { width: column.width } : undefined}>{column.key === 'select' ? <input type="checkbox" checked={data.data.length > 0 && selectedIds.size === data.data.length} onChange={toggleSelectAll} className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" /> : column.title}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan={columns.length} className="px-4 py-16 text-center text-sm text-gray-400">加载中...</td></tr> : data.data.length === 0 ? <tr><td colSpan={columns.length} className="px-4 py-16 text-center text-sm text-gray-400">暂无数据</td></tr> : data.data.map((record) => <tr key={record.id} className="transition-colors hover:bg-gray-50">{columns.map((column) => <td key={column.key} className="whitespace-nowrap px-4 py-2.5 text-sm text-gray-700">{column.render ? column.render(record) : column.dataIndex ? String(record[column.dataIndex as keyof VoyageTemplate] ?? '-') : '-'}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
        {data.total > 0 && <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3"><span className="text-sm text-gray-500">共 {data.total} 条</span><div className="flex items-center gap-1"><button onClick={() => fetchData(data.page - 1)} disabled={data.page <= 1} className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-30">上一页</button><button onClick={() => fetchData(data.page + 1)} disabled={data.page >= Math.ceil(data.total / data.pageSize)} className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-30">下一页</button></div></div>}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[4vh]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFormOpen(false)} />
          <div className="relative mx-4 flex max-h-[92vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-3">
              <h3 className="text-base font-semibold text-gray-900">{editingId ? '编辑模板' : '新增模板'}</h3>
              <button onClick={() => setFormOpen(false)} className="rounded p-1 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                定金、销售规则、小费已移至产品管理的「产品配置」；航次停靠行程请在资源管理 → 行程管理中维护，保存模板时将自动继承关联产品绑定的行程方案。
              </div>
              <div className="mb-6 grid grid-cols-4 gap-3">
                <div><label className="mb-0.5 block text-xs text-gray-500">模板编码 <span className="text-red-500">*</span></label><input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className="w-full rounded border border-gray-300 px-2 py-1.5 font-mono text-sm" /></div>
                <div><label className="mb-0.5 block text-xs text-gray-500">名称 <span className="text-red-500">*</span></label><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" /></div>
                <div><label className="mb-0.5 block text-xs text-gray-500">关联产品 <span className="text-red-500">*</span></label><select value={form.productId} onChange={(event) => onProductChange(event.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"><option value="">选择</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></div>
                <div><label className="mb-0.5 block text-xs text-gray-500">适用游轮</label><input value={form.shipName} disabled className="w-full rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm text-gray-500" /></div>
                <div><label className="mb-0.5 block text-xs text-gray-500">开始时间</label><input type="date" value={form.voyageStartTime} onChange={(event) => setForm({ ...form, voyageStartTime: event.target.value })} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" /></div>
                <div><label className="mb-0.5 block text-xs text-gray-500">结束时间</label><input type="date" value={form.voyageEndTime} onChange={(event) => setForm({ ...form, voyageEndTime: event.target.value })} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" /></div>
                <div><label className="mb-0.5 block text-xs text-gray-500">开航类型</label><select value={form.sailType} onChange={(event) => setForm({ ...form, sailType: event.target.value })} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"><option value="周内固定">周内固定</option><option value="周期循环">周期循环</option></select></div>
                <div>
                  {form.sailType === '周内固定' ? (<><label className="mb-0.5 block text-xs text-gray-500">开航日</label><select value={form.sailDay} onChange={(event) => setForm({ ...form, sailDay: event.target.value })} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"><option value="">选择</option>{['周一','周二','周三','周四','周五','周六','周日'].map((day) => <option key={day} value={day}>{day}</option>)}</select></>)
                    : (<><label className="mb-0.5 block text-xs text-gray-500">周期(天)</label><input type="number" value={form.sailDay} onChange={(event) => setForm({ ...form, sailDay: event.target.value })} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" /></>)}
                </div>
                <div><label className="mb-0.5 block text-xs text-gray-500">开航时间</label><input type="time" value={form.sailTime} onChange={(event) => setForm({ ...form, sailTime: event.target.value })} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" /></div>
                <div><label className="mb-0.5 block text-xs text-gray-500">总时长(天)</label><input type="number" value={form.totalDays || ''} onChange={(event) => setForm({ ...form, totalDays: Number(event.target.value) })} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" /></div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-3">
              <button onClick={() => setFormOpen(false)} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
              <button onClick={handleSubmit} disabled={formLoading} className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50">{formLoading ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}

      <DetailDrawer open={detailOpen} title="模板详情" onClose={() => setDetailOpen(false)}>
        {detail && (
          <>
            <DetailCard title="基本信息">
              <DetailRow label="模板编码" value={detail.code} mono />
              <DetailRow label="名称" value={detail.name} />
              <DetailRow label="关联产品" value={detail.productName} />
              <DetailRow label="适用游轮" value={detail.shipName} />
              <DetailRow label="开始时间" value={detail.voyageStartTime} />
              <DetailRow label="结束时间" value={detail.voyageEndTime} />
              <DetailRow label="开航类型" value={detail.sailType === '周内固定' ? `每周${detail.sailDay}` : `每${detail.sailDay}天`} />
              <DetailRow label="开航时间" value={detail.sailTime} />
              <DetailRow label="总时长" value={`${detail.totalDays}天`} />
              <DetailRow label="状态" value={<span className={`rounded px-1.5 py-0.5 text-xs font-medium ${statusColors[detail.status]}`}>{statusLabels[detail.status]}</span>} />
            </DetailCard>
            <DetailCard title={`航次行程（继承自行程方案，${detail.itinerary?.length || 0}项）`}>
              {(detail.itinerary || []).length === 0 ? (
                <p className="text-sm text-gray-500">暂无行程，请在行程管理中为关联产品配置行程方案。</p>
              ) : (
                detail.itinerary.map((itin) => (
                  <div key={itin.id} className="flex flex-wrap gap-2 py-0.5 text-sm">
                    <span className="text-gray-700">{itin.portName} · {formatItineraryDayLabel(itin.day)}</span>
                    {(itin.activityCategory || itin.theme || itin.startTime || itin.endTime) && (
                      <span className="text-gray-500">
                        {[itin.activityCategory, itin.theme || (itin.startTime || itin.endTime ? '活动' : '')].filter(Boolean).join(' · ')}
                        {itin.startTime || itin.endTime ? `（${itin.startTime || '--:--'}-${itin.endTime || '--:--'}）` : ''}
                      </span>
                    )}
                  </div>
                ))
              )}
            </DetailCard>
            <DetailCard title="产品配置继承">
              <p className="text-sm text-gray-600">定金、销售规则、小费继承自关联产品「{detail.productName}」，请在产品管理 → 产品配置中维护。</p>
            </DetailCard>
            <DetailCard title="操作信息">
              <DetailRow label="修改人" value={detail.updatedBy} />
              <DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} />
              <DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} />
            </DetailCard>
          </>
        )}
      </DetailDrawer>

      <ConfirmDialog open={confirmOpen} title="删除模板" message="确定要删除该模板吗？此操作不可恢复。" danger onConfirm={confirmDelete} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}
