import { useState, useEffect, useCallback } from 'react'
import { Plus, ChevronDown, ChevronRight, RotateCcw, X } from 'lucide-react'
import { productApi } from '@/mock/api'
import { routes, ships } from '@/mock/data'
import { productInventories } from '@/mock/data'
import type { Product, ProductSegment, PricingRow, PaginatedResult, SearchParams, ProductInventory } from '@/types'
import { formatDateTime } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'

// ========== 常量 ==========
const shipLevels = [...new Set(ships.map((s) => s.level))]
const routeOptions = routes.slice(0, 5) // 选5条航线做下拉

type ProductForm = {
  name: string
  routeId: string
  shipId: string
  icon: string
  images: string[]
  description: string
}

const emptyForm: ProductForm = {
  name: '', routeId: '', shipId: '', icon: '', images: [], description: '',
}

// ========== 工具函数 ==========
interface StopInfo { name: string; day: number; dist: number }

function generateSegments(stops: StopInfo[]): Omit<ProductSegment, 'id'>[] {
  const segs: Omit<ProductSegment, 'id'>[] = []
  for (let i = 0; i < stops.length; i++) {
    for (let j = i + 1; j < stops.length; j++) {
      let mileage = 0
      for (let k = i + 1; k <= j; k++) mileage += stops[k].dist
      segs.push({
        startPort: stops[i].name,
        endPort: stops[j].name,
        days: stops[j].day - stops[i].day,
        mileage,
        status: 'enabled' as const,
      })
    }
  }
  return segs
}

function calcTotalMileage(stops: StopInfo[]): number {
  return stops.reduce((sum, s) => sum + s.dist, 0)
}

function calcTotalDays(stops: StopInfo[]): number {
  if (stops.length === 0) return 0
  return stops[stops.length - 1].day - stops[0].day
}

// ========== 页面组件 ==========
export default function ProductPage() {
  // 列表状态
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<Product>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [shipLevel, setShipLevel] = useState('all')
  const [routeId, setRouteId] = useState('all')
  const [routeType, setRouteType] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [minMileage, setMinMileage] = useState('')
  const [maxMileage, setMaxMileage] = useState('')

  // 展开行
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // 表单状态
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [segments, setSegments] = useState<Omit<ProductSegment, 'id'>[]>([])
  const [formLoading, setFormLoading] = useState(false)

  // 详情抽屉
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<Product | null>(null)

  // 确认弹窗
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string }>({ type: '', id: '' })

  // 定价弹窗
  const [pricingOpen, setPricingOpen] = useState(false)
  const [pricingProduct, setPricingProduct] = useState<Product | null>(null)
  const [pricingRows, setPricingRows] = useState<PricingRow[]>([])

  // 图片预览弹窗
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const shipLevelOptions = ['all', ...shipLevels]
  const shipLevelLabels: Record<string, string> = { all: '全部', ...Object.fromEntries(shipLevels.map((l) => [l, l])) }

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    if (keyword.trim()) params.keyword = keyword.trim()
    if (shipLevel !== 'all') params.shipLevel = shipLevel
    if (routeId !== 'all') params.routeId = routeId
    if (routeType !== 'all') params.routeType = routeType
    if (statusFilter !== 'all') params.status = statusFilter
    if (minMileage.trim()) params.minMileage = minMileage
    if (maxMileage.trim()) params.maxMileage = maxMileage
    const result = await productApi.list(params)
    setData(result)
    setLoading(false)
  }, [keyword, shipLevel, routeId, routeType, statusFilter, minMileage, maxMileage])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSearch = () => fetchData(1)
  const handleReset = () => {
    setKeyword(''); setShipLevel('all'); setRouteId('all'); setRouteType('all')
    setStatusFilter('all'); setMinMileage(''); setMaxMileage('')
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ========== 表单逻辑 ==========
  const onRouteChange = (routeIdVal: string) => {
    setForm((prev) => ({ ...prev, routeId: routeIdVal }))
    if (!routeIdVal) {
      setSegments([])
      return
    }
    const route = routes.find((r) => r.id === routeIdVal)
    if (!route) return
    const stops: StopInfo[] = route.stops.map((s) => ({
      name: s.portName,
      day: s.day,
      dist: s.distance,
    }))
    setSegments(generateSegments(stops))
  }

  const getRouteAutoFill = (routeIdVal: string) => {
    const route = routes.find((r) => r.id === routeIdVal)
    if (!route) return null
    const stops: StopInfo[] = route.stops.map((s) => ({
      name: s.portName,
      day: s.day,
      dist: s.distance,
    }))
    return {
      routeType: route.type,
      startPort: stops[0]?.name || '',
      endPort: stops[stops.length - 1]?.name || '',
      days: calcTotalDays(stops),
      nights: Math.max(0, calcTotalDays(stops) - 1),
      mileage: calcTotalMileage(stops),
      duration: route.duration,
    }
  }

  const removeSegment = (idx: number) => {
    setSegments((prev) => prev.filter((_, i) => i !== idx))
  }

  const resetSegments = () => {
    if (!form.routeId) return
    onRouteChange(form.routeId)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setSegments([])
    setFormOpen(true)
  }

  const openEdit = (record: Product) => {
    setEditingId(record.id)
    setForm({
      name: record.name,
      routeId: record.routeId,
      shipId: record.shipId,
      icon: record.icon,
      images: record.images,
      description: record.description,
    })
    setSegments(record.segments.map((s) => ({ ...s })))
    setFormOpen(true)
  }

  const openDetail = async (record: Product) => {
    const r = await productApi.getById(record.id)
    setDetail(r || null)
    setDetailOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.routeId || !form.shipId) return
    setFormLoading(true)
    const route = routes.find((r) => r.id === form.routeId)
    const ship = ships.find((s) => s.id === form.shipId)
    const autoFill = getRouteAutoFill(form.routeId)
    if (!route || !ship || !autoFill) { setFormLoading(false); return }

    // Generate fresh pricing based on current segments and ship cabin types
    const newPricing: PricingRow[] = []
    for (const seg of segments) {
      for (const ct of ship.cabinTypes) {
        const cabinLabel = { suite: '套房', balcony: '阳台房', window: '海景房', inside: '内舱房' }[ct] || ct
        const base = 500 + seg.mileage * 3 + (ct === 'suite' ? 2000 : ct === 'balcony' ? 800 : ct === 'window' ? 300 : 0)
        newPricing.push({
          segmentKey: `${seg.startPort}-${seg.endPort}`,
          startPort: seg.startPort,
          endPort: seg.endPort,
          cabinType: cabinLabel,
          costPrice: Math.round(base * 0.6),
          basePrice: base,
        })
      }
    }

    const now = new Date().toISOString()
    const productData = {
      name: form.name,
      routeId: form.routeId,
      routeName: route.name,
      routeType: autoFill.routeType,
      shipId: form.shipId,
      shipName: ship.name,
      shipLevel: ship.level,
      startPort: autoFill.startPort,
      endPort: autoFill.endPort,
      days: autoFill.days,
      nights: autoFill.nights,
      mileage: autoFill.mileage,
      duration: autoFill.duration,
      icon: form.icon,
      images: form.images,
      description: form.description,
      segments: segments.map((s, i) => ({ ...s, id: `seg_${i}` })) as ProductSegment[],
      pricing: newPricing,
      status: 'enabled' as const,
      updatedBy: '当前用户',
      updatedAt: now,
      createdAt: now,
    }

    if (editingId) {
      await productApi.update(editingId, productData)
    } else {
      await productApi.create(productData as Omit<Product, 'id'>)
    }
    setFormLoading(false)
    setFormOpen(false)
    fetchData(data.page)
  }

  const handleToggleStatus = async (id: string) => {
    await productApi.toggleStatus(id)
    fetchData(data.page)
  }

  const handleDelete = (id: string) => {
    setConfirmAction({ type: 'delete', id })
    setConfirmOpen(true)
  }

  const confirmDelete = async () => {
    await productApi.remove(confirmAction.id)
    setConfirmOpen(false)
    fetchData(data.page)
  }

  // 审批时间轴
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [approvalTimeline, setApprovalTimeline] = useState<import('@/types').ApprovalStep[]>([])

  // ========== 库存设置 ==========
  const [invOpen, setInvOpen] = useState(false)
  const [invProduct, setInvProduct] = useState<Product | null>(null)
  const [invSegment, setInvSegment] = useState('')
  const [invData, setInvData] = useState<ProductInventory[]>([])

  const openInventory = (record: Product) => {
    setInvProduct(record)
    const seg = record.segments[0]
    setInvSegment(seg ? `${seg.startPort}-${seg.endPort}` : '')
    // 从 mock 加载该产品的库存数据
    const data = productInventories.filter((i) => i.productId === record.id)
    setInvData(data.length > 0 ? data : record.segments.flatMap((s) => {
      const segKey = `${s.startPort}-${s.endPort}`
      return ['套房', '阳台房', '海景房'].map((ct) => ({
        id: `${record.id}_${segKey}_${ct}`, productId: record.id, segmentKey: segKey,
        cabinTypeName: ct, physicalCapacity: 20, totalAvailable: 20, locked: 0, emergencyStock: 0,
        updatedBy: '', updatedAt: '', createdAt: '',
      } as ProductInventory))
    }))
    setInvOpen(true)
  }

  const updateInv = (idx: number, field: string, value: number) => {
    setInvData((prev) => { const n = [...prev]; n[idx] = { ...n[idx], [field]: value }; return n })
  }

  const saveInventory = () => {
    for (const item of invData) {
      const existing = productInventories.findIndex((i) => i.id === item.id)
      if (existing >= 0) productInventories[existing] = { ...item, updatedBy: '当前用户', updatedAt: new Date().toISOString() }
      else productInventories.unshift({ ...item, updatedBy: '当前用户', updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() })
    }
    setInvOpen(false)
  }

  const filteredInv = invData.filter((i) => i.segmentKey === invSegment)
  const invSegments = [...new Set(invData.map((i) => i.segmentKey))]

  // ========== 定价逻辑 ==========
  const openPricing = (record: Product) => {
    setPricingProduct(record)
    setPricingRows(record.pricing.map((r) => ({ ...r })))
    setPricingOpen(true)
  }

  const updatePricingRow = (index: number, field: 'costPrice' | 'basePrice', value: number) => {
    setPricingRows((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const savePricing = async () => {
    if (!pricingProduct) return
    await productApi.updatePricing(pricingProduct.id, pricingRows)
    setPricingOpen(false)
    setPricingProduct(null)
    fetchData(data.page)
  }

  // ========== 毛利率计算 ==========
  const calcProfitMargin = (pricing: PricingRow[]) => {
    if (pricing.length === 0) return 0
    const totalCost = pricing.reduce((s, r) => s + r.costPrice, 0)
    const totalBase = pricing.reduce((s, r) => s + r.basePrice, 0)
    return totalBase > 0 ? (((totalBase - totalCost) / totalBase) * 100).toFixed(1) : '0.0'
  }

  // ========== 图标/图片处理 ==========
  const getIconPreview = (icon: string) => {
    if (!icon) return null
    if (icon.startsWith('data:') || icon.startsWith('http')) return icon
    return null
  }

  const handleIconUpload = () => {
    const url = prompt('请输入产品图标 URL：')
    if (url) setForm({ ...form, icon: url })
  }

  const handleImageUpload = () => {
    const url = prompt('请输入产品图片 URL（最多5张）：')
    if (url && form.images.length < 5) {
      setForm({ ...form, images: [...form.images, url] })
    }
  }

  const removeImage = (idx: number) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== idx) })
  }

  // ========== 树形表格列定义（父子行共用） ==========
  const treeColumns = [
    { key: 'id', title: '产品ID', parent: (r: Product) => r.id, child: () => '' },
    { key: 'name', title: '产品名称', parent: (r: Product) => r.name, child: () => '' },
    { key: 'routeName', title: '航线', parent: (r: Product) => r.routeName, child: () => '' },
    { key: 'routeType', title: '上下水', parent: (r: Product) => (
      <span className={r.routeType === 'upstream' ? 'text-blue-600' : 'text-green-600'}>
        {r.routeType === 'upstream' ? '上水' : '下水'}
      </span>
    ), child: () => '' },
    { key: 'shipName', title: '游轮', parent: (r: Product) => r.shipName, child: () => '' },
    { key: 'startPort', title: '起港', parent: (r: Product) => r.startPort, child: (s: ProductSegment) => s.startPort },
    { key: 'endPort', title: '止港', parent: (r: Product) => r.endPort, child: (s: ProductSegment) => s.endPort },
    { key: 'duration', title: '航行时长', parent: (r: Product) => r.duration, child: (s: ProductSegment) => `${s.days}天` },
    { key: 'mileage', title: '航行里程', parent: (r: Product) => `${r.mileage} nmi`, child: (s: ProductSegment) => `${s.mileage} nmi` },
    { key: 'approval', title: '审批状态', parent: (r: Product) => (
      <button onClick={() => { setApprovalTimeline(r.approvalTimeline || []); setApprovalOpen(true) }} className={`text-xs hover:underline ${(r.approvalStatus || '已审批') === '已审批' ? 'text-green-600' : 'text-yellow-600'}`}>{r.approvalStatus || '-'}</button>
    ), child: () => '' },
    { key: 'publish', title: '发布状态', parent: (r: Product) => (
      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${r.publishStatus === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.publishStatus === 'published' ? '已发布' : '未发布'}</span>
    ), child: () => '' },
    { key: 'status', title: '状态', parent: (r: Product) => <StatusBadge status={r.status} />, child: (s: ProductSegment) => <StatusBadge status={s.status} /> },
    { key: 'updatedBy', title: '操作人', parent: (r: Product) => r.updatedBy, child: (_s: ProductSegment, p: Product) => p.updatedBy },
    { key: 'updatedAt', title: '操作时间', parent: (r: Product) => formatDateTime(r.updatedAt), child: (_s: ProductSegment, p: Product) => formatDateTime(p.updatedAt) },
    { key: 'actions', title: '操作', width: '240px', parent: (r: Product) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openDetail(r)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">详情</button>
        <button onClick={() => openEdit(r)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">编辑</button>
        <button onClick={() => openInventory(r)} className="hidden px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">库存</button>
        <button onClick={() => openPricing(r)} className="px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded">定价</button>
        <button onClick={() => handleToggleStatus(r.id)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
          {r.status === 'enabled' ? '禁用' : '启用'}
        </button>
        <button onClick={() => handleDelete(r.id)} className="px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded">删除</button>
      </div>
    ), child: () => '' },
  ]

  // ========== 渲染 ==========
  const routeFill = getRouteAutoFill(form.routeId)
  const selectedShip = ships.find((s) => s.id === form.shipId)

  return (
    <div>
      <PageHeader title="产品管理" description="管理游轮产品信息、航段配置及基准价策略">
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">
          <Plus className="w-4 h-4" />新增产品
        </button>
      </PageHeader>

      <SearchPanel onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">执航游轮</label>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="游轮名称"
            className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">游轮等级</label>
          <select value={shipLevel} onChange={(e) => setShipLevel(e.target.value)}
            className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
            {shipLevelOptions.map((l) => <option key={l} value={l}>{shipLevelLabels[l]}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">航线</label>
          <select value={routeId} onChange={(e) => setRouteId(e.target.value)}
            className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
            <option value="all">全部</option>
            {routeOptions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">上下水</label>
          <select value={routeType} onChange={(e) => setRouteType(e.target.value)}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
            <option value="all">全部</option>
            <option value="upstream">上水</option>
            <option value="downstream">下水</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">状态</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
            <option value="all">全部</option>
            <option value="enabled">有效</option>
            <option value="disabled">停用</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500">航行里程(nmi)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number" value={minMileage} onChange={(e) => setMinMileage(e.target.value)}
                placeholder="最低" className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <span className="text-gray-400 text-sm">-</span>
              <input
                type="number" value={maxMileage} onChange={(e) => setMaxMileage(e.target.value)}
                placeholder="最高" className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </SearchPanel>

      {/* 树形表格（父子行共用列头） */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-10 px-2 py-3" />
                {treeColumns.map((col) => (
                  <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider" style={col.width ? { width: col.width } : undefined}>{col.title}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={treeColumns.length + 1} className="px-4 py-16 text-center text-sm text-gray-400">加载中...</td></tr>
              ) : data.data.length === 0 ? (
                <tr><td colSpan={treeColumns.length + 1} className="px-4 py-16 text-center text-sm text-gray-400">暂无数据</td></tr>
              ) : (
                data.data.map((record) => (
                  <>
                    {/* 父行 */}
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 py-2.5">
                        <button onClick={() => toggleExpand(record.id)} className="p-1 text-gray-400 hover:text-gray-600">
                          {expanded.has(record.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </td>
                      {treeColumns.map((col) => (
                        <td key={col.key} className="px-4 py-2.5 text-sm text-gray-700 whitespace-nowrap">
                          {col.parent(record)}
                        </td>
                      ))}
                    </tr>
                    {/* 子行（展开时显示，与父行共用列头） */}
                    {expanded.has(record.id) && record.segments.map((seg) => (
                      <tr key={`${record.id}-${seg.id}`} className="bg-blue-50/30">
                        <td className="px-2 py-2">
                          <span className="block w-4 ml-2 border-l-2 border-b-2 border-blue-300 h-3" />
                        </td>
                        {treeColumns.map((col) => (
                          <td key={col.key} className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">
                            {col.child(seg, record)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* 分页 */}
        {data.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-500">共 {data.total} 条，第 {data.page}/{Math.ceil(data.total / data.pageSize)} 页</span>
            <div className="flex items-center gap-1">
              <button onClick={() => fetchData(data.page - 1)} disabled={data.page <= 1}
                className="px-3 py-1.5 text-sm rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">上一页</button>
              <button onClick={() => fetchData(data.page + 1)} disabled={data.page >= Math.ceil(data.total / data.pageSize)}
                className="px-3 py-1.5 text-sm rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">下一页</button>
            </div>
          </div>
        )}
      </div>

      {/* 新增/编辑弹窗 */}
      <FormDialog open={formOpen} title={editingId ? '编辑产品' : '新增产品'} width="max-w-3xl"
        loading={formLoading} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* 基本信息 */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基本信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">产品名称 <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">航线 <span className="text-red-500">*</span></label>
                <select value={form.routeId} onChange={(e) => onRouteChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
                  <option value="">请选择航线</option>
                  {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">上下水类型</label>
                <input value={routeFill ? (routeFill.routeType === 'upstream' ? '上水' : '下水') : '-'} disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">游轮 <span className="text-red-500">*</span></label>
                <select value={form.shipId} onChange={(e) => setForm({ ...form, shipId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
                  <option value="">请选择游轮</option>
                  {ships.map((s) => <option key={s.id} value={s.id}>{s.name}（{s.level}）</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">航行时长</label>
                <input value={routeFill?.duration || '-'} disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">航行里程(nmi)</label>
                <input value={routeFill ? `${routeFill.mileage} nmi` : '-'} disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-700 mb-1">产品图标</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleIconUpload}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">选择图标</button>
                  {form.icon && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{form.icon.length > 40 ? form.icon.slice(0, 40) + '...' : form.icon}</span>
                      <button onClick={() => setForm({ ...form, icon: '' })} className="text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-700 mb-1">产品图片（最多5张）</label>
                <div className="flex flex-wrap gap-2">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 border border-gray-200 rounded overflow-hidden group">
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">图{idx + 1}</div>
                      <button onClick={() => removeImage(idx)}
                        className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-bl text-xs flex items-center justify-center opacity-0 group-hover:opacity-100">×</button>
                    </div>
                  ))}
                  {form.images.length < 5 && (
                    <button type="button" onClick={handleImageUpload}
                      className="w-16 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 hover:border-gray-500 hover:text-gray-600">
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-700 mb-1">产品介绍</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3} placeholder="请输入产品介绍..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none" />
              </div>
            </div>
          </div>

          {/* 航段信息 */}
          {segments.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">航段信息（C(n,2)单向航段）</h4>
                <button type="button" onClick={resetSegments}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                  <RotateCcw className="w-3 h-3" />复原
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">起港</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">止港</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">航行时长</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">航行里程</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">状态</th>
                      <th className="px-3 py-2 text-center text-gray-500 font-medium w-16">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {segments.map((seg, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-1.5 text-gray-700">{seg.startPort}</td>
                        <td className="px-3 py-1.5 text-gray-700">{seg.endPort}</td>
                        <td className="px-3 py-1.5 text-gray-700">{seg.days}天</td>
                        <td className="px-3 py-1.5 text-gray-700">{seg.mileage} nmi</td>
                        <td className="px-3 py-1.5"><StatusBadge status={seg.status} /></td>
                        <td className="px-3 py-1.5 text-center">
                          <button type="button" onClick={() => removeSegment(idx)}
                            className="px-2 py-0.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded">删除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-1">共 {segments.length} 个航段，点击"复原"可重新生成所有 C(n,2) 航段</p>
            </div>
          )}
        </div>
      </FormDialog>

      {/* 详情抽屉 */}
      <DetailDrawer open={detailOpen} title="产品详情" onClose={() => setDetailOpen(false)}>
        {detail && (
          <>
            <DetailCard title="基本信息">
              <DetailRow label="产品名称" value={detail.name} />
              <DetailRow label="产品ID" value={detail.id} mono />
              <DetailRow label="航线" value={detail.routeName} />
              <DetailRow label="上下水" value={<span className={detail.routeType === 'upstream' ? 'text-blue-600' : 'text-green-600'}>{detail.routeType === 'upstream' ? '上水' : '下水'}</span>} />
              <DetailRow label="游轮" value={`${detail.shipName}（${detail.shipLevel}）`} />
              <DetailRow label="起港" value={detail.startPort} />
              <DetailRow label="止港" value={detail.endPort} />
              <DetailRow label="航行时长" value={detail.duration} />
              <DetailRow label="航行里程" value={`${detail.mileage} nmi`} />
              <DetailRow label="状态" value={<StatusBadge status={detail.status} />} />
              <DetailRow label="产品介绍" value={detail.description || '-'} />
            </DetailCard>
            <DetailCard title="毛利率">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-gray-900">{calcProfitMargin(detail.pricing)}%</span>
                <span className="text-xs text-gray-500">
                  （总成本 ¥{detail.pricing.reduce((s, r) => s + r.costPrice, 0).toLocaleString()} /
                  总基准价 ¥{detail.pricing.reduce((s, r) => s + r.basePrice, 0).toLocaleString()}）
                </span>
              </div>
            </DetailCard>
            <DetailCard title={`航段明细（${detail.segments.length}个航段）`}>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200">
                  <th className="px-2 py-1.5 text-left text-gray-500 font-medium text-xs">起港</th>
                  <th className="px-2 py-1.5 text-left text-gray-500 font-medium text-xs">止港</th>
                  <th className="px-2 py-1.5 text-left text-gray-500 font-medium text-xs">时长</th>
                  <th className="px-2 py-1.5 text-left text-gray-500 font-medium text-xs">里程</th>
                  <th className="px-2 py-1.5 text-left text-gray-500 font-medium text-xs">状态</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {detail.segments.map((seg) => (
                    <tr key={seg.id}>
                      <td className="px-2 py-1 text-gray-700">{seg.startPort}</td>
                      <td className="px-2 py-1 text-gray-700">{seg.endPort}</td>
                      <td className="px-2 py-1 text-gray-700">{seg.days}天</td>
                      <td className="px-2 py-1 text-gray-700">{seg.mileage} nmi</td>
                      <td className="px-2 py-1"><StatusBadge status={seg.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DetailCard>
            <DetailCard title="操作信息">
              <DetailRow label="修改人" value={detail.updatedBy} />
              <DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} />
              <DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} />
            </DetailCard>
          </>
        )}
      </DetailDrawer>

      {/* 定价配置弹窗 */}
      {pricingOpen && pricingProduct && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPricingOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <h3 className="text-base font-semibold text-gray-900">
                基准价配置 - {pricingProduct.name}
                <span className="ml-2 text-xs font-normal text-gray-500">
                  ({pricingProduct.segments.length}航段 × {ships.find((s) => s.id === pricingProduct.shipId)?.cabinTypes.length || 0}舱房类型 = {pricingRows.length}行)
                </span>
              </h3>
              <button onClick={() => setPricingOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">起止港</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">舱房类型</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">成本价(¥)</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">基准价(¥)</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">毛利率</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(() => {
                    // 按 segmentKey 分组，计算 rowSpan 用于合并起止港单元格
                    const rows: { row: PricingRow; idx: number; isFirst: boolean; rowSpan: number }[] = []
                    let i = 0
                    while (i < pricingRows.length) {
                      const key = pricingRows[i].segmentKey
                      let j = i
                      while (j < pricingRows.length && pricingRows[j].segmentKey === key) j++
                      const span = j - i
                      for (let k = i; k < j; k++) {
                        rows.push({ row: pricingRows[k], idx: k, isFirst: k === i, rowSpan: span })
                      }
                      i = j
                    }
                    return rows.map(({ row, idx, isFirst, rowSpan }) => {
                      const margin = row.basePrice > 0 ? ((row.basePrice - row.costPrice) / row.basePrice * 100).toFixed(1) : '0.0'
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          {isFirst && (
                            <td className="px-3 py-2 text-gray-700 border-r border-gray-100" rowSpan={rowSpan}>
                              {row.startPort} - {row.endPort}
                            </td>
                          )}
                          <td className="px-3 py-2 text-gray-700">{row.cabinType}</td>
                          <td className="px-3 py-2">
                            <input type="number" value={row.costPrice}
                              onChange={(e) => updatePricingRow(idx, 'costPrice', Number(e.target.value))}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" value={row.basePrice}
                              onChange={(e) => updatePricingRow(idx, 'basePrice', Number(e.target.value))}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className={`text-xs font-medium ${Number(margin) >= 30 ? 'text-green-600' : Number(margin) >= 15 ? 'text-yellow-600' : 'text-red-500'}`}>
                              {margin}%
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  })()}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
              <button onClick={() => setPricingOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">取消</button>
              <button onClick={savePricing}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">保存定价</button>
            </div>
          </div>
        </div>
      )}

      {/* 图片预览弹窗 */}
      {imagePreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={() => setImagePreview(null)}>
          <div className="max-w-3xl max-h-[80vh] p-4">
            <button onClick={() => setImagePreview(null)}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* 确认弹窗 */}
      {/* 库存设置弹窗 */}
      {invOpen && invProduct && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh]"><div className="absolute inset-0 bg-black/40" onClick={() => setInvOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
              <h3 className="text-base font-semibold text-gray-900">库存设置 · {invProduct.name}</h3>
              <div className="flex items-center gap-3">
                <select value={invSegment} onChange={(e) => setInvSegment(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                  {invSegments.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => setInvOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-left text-xs text-gray-500">舱房类型</th>
                <th className="px-3 py-2 text-center text-xs text-gray-500 w-20">物理容量</th>
                <th className="px-3 py-2 text-center text-xs text-gray-500 w-20">总可售</th>
                <th className="px-3 py-2 text-center text-xs text-gray-500 w-18">锁定</th>
                <th className="px-3 py-2 text-center text-xs text-gray-500 w-20">应急库存</th>
              </tr></thead><tbody className="divide-y divide-gray-100">
                {filteredInv.map((item, idx) => {
                  const realIdx = invData.findIndex((i) => i.id === item.id)
                  return (
                  <tr key={item.id}>
                    <td className="px-3 py-2"><span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">{item.cabinTypeName}</span></td>
                    <td className="px-3 py-2 text-center text-sm text-gray-400">{item.physicalCapacity}</td>
                    <td className="px-2 py-2 w-20"><input type="number" value={item.totalAvailable} onChange={(e) => updateInv(realIdx, 'totalAvailable', Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-center" /></td>
                    <td className="px-2 py-2 w-16"><input type="number" value={item.locked} onChange={(e) => updateInv(realIdx, 'locked', Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-center" /></td>
                    <td className="px-2 py-2 w-18"><input type="number" value={item.emergencyStock} onChange={(e) => updateInv(realIdx, 'emergencyStock', Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-center" /></td>
                  </tr>)
                })}
              </tbody></table>
            </div>
            <div className="flex justify-between items-center px-6 py-3 border-t shrink-0">
              <span className="text-xs text-gray-400">物理容量不可编辑 · 总可售 = 物理容量 − 锁定 − 应急库存</span>
              <div className="flex gap-3">
                <button onClick={() => setInvOpen(false)} className="px-4 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50">取消</button>
                <button onClick={saveInventory} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 审批时间轴弹窗 */}
      {approvalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"><div className="absolute inset-0 bg-black/40" onClick={() => setApprovalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-base font-semibold text-gray-900">审批时间轴</h3><button onClick={() => setApprovalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button></div>
            <div className="space-y-4">{approvalTimeline.map((step, i) => (
              <div key={i} className="flex gap-3"><div className="flex flex-col items-center"><div className={`w-3 h-3 rounded-full ${step.status === 'approved' ? 'bg-green-500' : step.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-400'}`} /><div className="w-px flex-1 bg-gray-200" /></div>
              <div className="flex-1 pb-4"><p className="text-sm font-medium text-gray-900">{step.nodeName}</p><p className="text-xs text-gray-500">{step.approver} · {step.duration || '-'}</p><p className="text-xs text-gray-400">{step.plan}</p>{step.time && <p className="text-xs text-gray-400 mt-0.5">{step.time}</p>}</div></div>
            ))}</div>
          </div>
        </div>
      )}
      <ConfirmDialog open={confirmOpen} title="删除产品"
        message="确定要删除该产品吗？此操作不可恢复，关联的定价和航段数据将被一并删除。"
        danger onConfirm={confirmDelete} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}
