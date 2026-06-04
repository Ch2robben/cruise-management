import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, ChevronLeft, Warehouse } from 'lucide-react'
import { productApi, templateApi } from '@/mock/api'
import { products, ships, routes } from '@/mock/data'
import type { VoyageTemplate, TemplateInventory, TemplateItinerary, TemplateDeposit, PaginatedResult, PricingRow, Product, SearchParams } from '@/types'
import { formatDateTime, generateId } from '@/utils/format'
import { MARKET_CATEGORY_GROUPS, MARKET_CATEGORY_OPTIONS, getMarketCategoryLabel } from '@/utils/constants'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import ItineraryEditor, { createTemplateItineraryItem } from '@/components/voyage/ItineraryEditor'




const statusLabels: Record<string, string> = { draft: '草稿', enabled: '已启用', disabled: '已停用' }
const statusColors: Record<string, string> = { draft: 'bg-gray-100 text-gray-600', enabled: 'bg-green-100 text-green-700', disabled: 'bg-red-100 text-red-600' }

const TABS = ['航次库存', '航次行程', '航次定金', '计价配置', '销售规则']
const settlementRules = ['月结30天', '预付款50%', '全额预付']
const refundPolicies = ['标准退改', '严格退改', '灵活退改']
const materialOptions = ['宣传册', '行程单', '保险单', '签证指南']

type TemplateForm = Omit<VoyageTemplate, 'id' | 'updatedBy' | 'updatedAt' | 'createdAt'>

const emptyInv = (): TemplateInventory => ({ id: generateId(), cabinName: '', totalBeds: 0, released: 0, status: 'closed' })
const emptyDep = (): TemplateDeposit => ({ id: generateId(), marketCategory: '', deposit: 0 })

const emptyForm: TemplateForm = {
  code: '', name: '', productId: '', productName: '', shipName: '',
  voyageEndTime: '', voyageStartTime: '', sailType: '周内固定', sailDay: '', sailTime: '', totalDays: 0,
  inventory: [], itinerary: [], deposits: [],
  basePriceRef: 0, surchargeStrategy: [], settlementRule: '', earlyBirdDiscount: 0,
  presaleDays: 0, cutoffDays: 0, refundPolicy: '', materialReq: [],
  status: 'draft',
}

export default function TemplatePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<VoyageTemplate>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [keyword, setKeyword] = useState('')
  const [shipFilter, setShipFilter] = useState('all')
  const [directionFilter, setDirectionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Form
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tab, setTab] = useState(0)
  const [form, setForm] = useState<TemplateForm>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)

  // Detail / Confirm
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

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setTab(0); setFormOpen(true) }
  const openEdit = (r: VoyageTemplate) => {
    setEditingId(r.id)
    setForm({ code: r.code, name: r.name, productId: r.productId, productName: r.productName, shipName: r.shipName, voyageEndTime: r.voyageEndTime, voyageStartTime: r.voyageStartTime, sailType: r.sailType, sailDay: r.sailDay, sailTime: r.sailTime, totalDays: r.totalDays, inventory: r.inventory.map((i) => ({ ...i })), itinerary: r.itinerary.map((i) => ({ ...i })), deposits: r.deposits.map((d) => ({ ...d })), basePriceRef: r.basePriceRef, surchargeStrategy: [...r.surchargeStrategy], settlementRule: r.settlementRule, earlyBirdDiscount: r.earlyBirdDiscount, presaleDays: r.presaleDays, cutoffDays: r.cutoffDays, refundPolicy: r.refundPolicy, materialReq: [...r.materialReq], status: r.status })
    setTab(0); setFormOpen(true)
  }
  const openDetail = async (r: VoyageTemplate) => { const t = await templateApi.getById(r.id); setDetail(t || null); setDetailOpen(true) }
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


  const openPriceRule = (template: VoyageTemplate) => {
    navigate(`/voyage/templates/${template.id}/price`)
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

  const cabinLabels: Record<string, string> = { suite: '套房', balcony: '阳台房', window: '海景房', inside: '内舱房' }
  const directionLabels: Record<string, string> = { upstream: '上水', downstream: '下水' }
  const getTemplateDirection = (r: VoyageTemplate) => directionLabels[products.find((p) => p.id === r.productId)?.routeType || ''] || '-'


  // Product auto-fill: 初始化库存(船舶舱房) + 行程(航线停靠港)
  const onProductChange = (pid: string) => {
    const p = products.find((p) => p.id === pid)
    if (!p) return
    // 查找关联船舶和航线
    const ship = ships.find((s) => s.id === p.shipId)
    const route = routes.find((r) => r.id === p.routeId)
    // 库存：根据船舶舱房类型生成
    const inventory: TemplateInventory[] = (ship?.cabinTypes || []).map((ct) => ({
      id: generateId(), cabinName: cabinLabels[ct] || ct, totalBeds: 2, released: 0, status: 'closed' as const,
    }))
    // 行程：根据航线停靠港生成（每港一行，留空活动字段）
    const itinerary: TemplateItinerary[] = (route?.stops || []).map((stop) => createTemplateItineraryItem({
      portName: stop.portName,
      day: stop.day,
      arrivalTime: stop.type === 'start' ? '' : stop.sailTime,
      departureTime: stop.type === 'end' ? '' : stop.sailTime,
    }))
    setForm((f) => ({
      ...f, productId: pid, productName: p.name, shipName: p.shipName || '',
      totalDays: p.days, inventory, itinerary,
    }))
  }

  // Handle submit
  const handleSubmit = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.productId) return
    setFormLoading(true)
    const now = new Date().toISOString()
    const item: Omit<VoyageTemplate, 'id'> = {
      ...form,
      inventory: form.inventory, itinerary: form.itinerary, deposits: form.deposits,
      updatedBy: '当前用户', updatedAt: now, createdAt: editingId ? undefined! : now,
    }
    if (editingId) await templateApi.update(editingId, item as Partial<VoyageTemplate>)
    else await templateApi.create(item)
    setFormLoading(false); setFormOpen(false); fetchData(data.page)
  }

  // Inventory helpers
  const updateInv = (idx: number, f: keyof TemplateInventory, v: string | number) => {
    setForm((prev) => { const inv = [...prev.inventory]; inv[idx] = { ...inv[idx], [f]: v }; return { ...prev, inventory: inv } })
  }
  const addInv = () => setForm((f) => ({ ...f, inventory: [...f.inventory, emptyInv()] }))
  const removeInv = (idx: number) => setForm((f) => ({ ...f, inventory: f.inventory.filter((_, i) => i !== idx) }))

  // Deposit helpers
  const updateDep = (idx: number, f: keyof TemplateDeposit, v: string | number) => {
    setForm((prev) => { const deps = [...prev.deposits]; deps[idx] = { ...deps[idx], [f]: v }; return { ...prev, deposits: deps } })
  }
  const addDep = () => setForm((f) => ({ ...f, deposits: [...f.deposits, emptyDep()] }))
  const removeDep = (idx: number) => setForm((f) => ({ ...f, deposits: f.deposits.filter((_, i) => i !== idx) }))



  // Toggle multi-select
  const toggleArray = (arr: string[], val: string): string[] => arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]

  const columns = [
    {
      key: 'select',
      title: '',
      width: '48px',
      render: (r: VoyageTemplate) => (
        <input
          type="checkbox"
          checked={selectedIds.has(r.id)}
          onChange={() => toggleSelect(r.id)}
          className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
        />
      ),
    },
    { key: 'code', title: '模板编码', render: (r: VoyageTemplate) => <span className="font-mono text-xs">{r.code}</span> },
    { key: 'name', title: '名称', dataIndex: 'name' as keyof VoyageTemplate },
    { key: 'inventoryManage', title: '库存管理', width: '120px', render: (r: VoyageTemplate) => (
      <button onClick={() => navigate(`/voyage/template-inventory?templateId=${r.id}`)} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded"><Warehouse className="w-3 h-3" />库存管理</button>
    ) },
    { key: 'productName', title: '关联产品', dataIndex: 'productName' as keyof VoyageTemplate },
    { key: 'shipName', title: '适用游轮', dataIndex: 'shipName' as keyof VoyageTemplate },
    { key: 'direction', title: '航行类型', render: (r: VoyageTemplate) => getTemplateDirection(r) },
    { key: 'voyageStartTime', title: '开始时间', dataIndex: 'voyageStartTime' as keyof VoyageTemplate },
    { key: 'voyageEndTime', title: '结束时间', dataIndex: 'voyageEndTime' as keyof VoyageTemplate },
    { key: 'sailType', title: '开航类型', render: (r: VoyageTemplate) => r.sailType === '周内固定' ? `每周${r.sailDay}` : `每${r.sailDay}天` },
    { key: 'sailTime', title: '开航时间', dataIndex: 'sailTime' as keyof VoyageTemplate },
    { key: 'totalDays', title: '总时长', render: (r: VoyageTemplate) => `${r.totalDays}天` },
    { key: 'status', title: '状态', render: (r: VoyageTemplate) => <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColors[r.status]}`}>{statusLabels[r.status]}</span> },
    { key: 'updatedBy', title: '修改人', dataIndex: 'updatedBy' as keyof VoyageTemplate },
    { key: 'updatedAt', title: '修改时间', render: (r: VoyageTemplate) => formatDateTime(r.updatedAt) },
    { key: 'actions', title: '操作', width: '320px', render: (r: VoyageTemplate) => (
      <div className="flex items-center gap-1">

        <button onClick={() => openPriceRule(r)} className="px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded">定价管理</button>
        <button onClick={() => openDetail(r)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">详情</button>
        <button onClick={() => openEdit(r)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">编辑</button>
        <button onClick={() => handleToggleStatus(r.id)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">{r.status === 'enabled' ? '停用' : '启用'}</button>
        <button onClick={() => handleDelete(r.id)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">删除</button>
      </div>
    )},
  ]

  const renderTab = () => {
    switch (tab) {
      case 0: return (
        <div>
          <div className="flex justify-between items-center mb-3"><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">航次库存</h4>
            <button type="button" onClick={addInv} className="px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50 rounded">+ 添加舱房</button></div>
          <table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-3 py-2 text-left text-xs text-gray-500">船舱名称</th><th className="px-3 py-2 text-left text-xs text-gray-500">床位数</th><th className="px-3 py-2 text-left text-xs text-gray-500">投放</th><th className="px-3 py-2 text-left text-xs text-gray-500">状态</th><th className="px-3 py-2 text-xs text-gray-500 w-16">操作</th>
          </tr></thead><tbody className="divide-y divide-gray-100">
            {form.inventory.map((inv, idx) => (
              <tr key={idx}>
                <td className="px-3 py-2"><input value={inv.cabinName} onChange={(e) => updateInv(idx, 'cabinName', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" /></td>
                <td className="px-3 py-2"><input type="number" value={inv.totalBeds || ''} onChange={(e) => updateInv(idx, 'totalBeds', Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center" /></td>
                <td className="px-3 py-2"><input type="number" value={inv.released || ''} onChange={(e) => updateInv(idx, 'released', Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center" /></td>
                <td className="px-3 py-2"><select value={inv.status} onChange={(e) => updateInv(idx, 'status', e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm"><option value="open">开启</option><option value="closed">关闭</option></select></td>
                <td className="px-3 py-2"><button onClick={() => removeInv(idx)} className="text-xs text-red-500 hover:bg-red-50 rounded px-2 py-0.5">删除</button></td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )
      case 1: return (
        <ItineraryEditor
          value={form.itinerary}
          onChange={(itinerary) => setForm((prev) => ({ ...prev, itinerary }))}
        />
      )
      case 2: return (
        <div>
          <div className="flex justify-between items-center mb-3"><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">航次定金</h4>
            <button type="button" onClick={addDep} className="px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50 rounded">+ 添加规则</button></div>
          <table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-3 py-2 text-left text-xs text-gray-500">市场类别</th><th className="px-3 py-2 text-left text-xs text-gray-500">定金(元/人)</th><th className="px-3 py-2 text-xs text-gray-500 w-16">操作</th>
          </tr></thead><tbody className="divide-y divide-gray-100">
            {form.deposits.map((d, idx) => (
              <tr key={idx}>
                <td className="px-3 py-2"><select value={d.marketCategory} onChange={(e) => updateDep(idx, 'marketCategory', e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm"><option value="">选择</option>{MARKET_CATEGORY_GROUPS.map((group) => <optgroup key={group} label={group}>{MARKET_CATEGORY_OPTIONS.filter((item) => item.parent === group).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</optgroup>)}</select></td>
                <td className="px-3 py-2"><input type="number" value={d.deposit || ''} onChange={(e) => updateDep(idx, 'deposit', Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center" /></td>
                <td className="px-3 py-2"><button onClick={() => removeDep(idx)} className="text-xs text-red-500 hover:bg-red-50 rounded px-2 py-0.5">删除</button></td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )
      case 3: return (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">计价配置</h4>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-gray-700 mb-1">基准价参考</label><input type="number" value={form.basePriceRef || ''} onChange={(e) => setForm({ ...form, basePriceRef: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            <div><label className="block text-sm text-gray-700 mb-1">结算规则</label><select value={form.settlementRule} onChange={(e) => setForm({ ...form, settlementRule: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="">选择</option>{settlementRules.map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
            <div><label className="block text-sm text-gray-700 mb-1">提前购优惠</label><input type="number" value={form.earlyBirdDiscount || ''} onChange={(e) => setForm({ ...form, earlyBirdDiscount: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            <div><label className="block text-sm text-gray-700 mb-1">附加费策略</label><div className="flex flex-wrap gap-1.5 mt-1">{['节假日加价', '旺季加价', '单房差'].map((s) => (
              <label key={s} className={`px-2 py-1 border rounded text-xs cursor-pointer ${form.surchargeStrategy.includes(s) ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600'}`}><input type="checkbox" checked={form.surchargeStrategy.includes(s)} onChange={() => setForm({ ...form, surchargeStrategy: toggleArray(form.surchargeStrategy, s) })} className="sr-only" />{s}</label>
            ))}</div></div>
          </div>
        </div>
      )
      case 4: return (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">销售规则</h4>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-gray-700 mb-1">预售期规则(天)</label><input type="number" value={form.presaleDays || ''} onChange={(e) => setForm({ ...form, presaleDays: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            <div><label className="block text-sm text-gray-700 mb-1">截止售卖点(天)</label><input type="number" value={form.cutoffDays || ''} onChange={(e) => setForm({ ...form, cutoffDays: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            <div><label className="block text-sm text-gray-700 mb-1">退改策略模板</label><select value={form.refundPolicy} onChange={(e) => setForm({ ...form, refundPolicy: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="">选择</option>{refundPolicies.map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
            <div><label className="block text-sm text-gray-700 mb-1">物料需求清单</label><div className="flex flex-wrap gap-1.5 mt-1">{materialOptions.map((m) => (
              <label key={m} className={`px-2 py-1 border rounded text-xs cursor-pointer ${form.materialReq.includes(m) ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600'}`}><input type="checkbox" checked={form.materialReq.includes(m)} onChange={() => setForm({ ...form, materialReq: toggleArray(form.materialReq, m) })} className="sr-only" />{m}</label>
            ))}</div></div>
          </div>
        </div>
      )
      default: return null
    }
  }

  return (
    <div>
      <PageHeader title="航次模板" description="管理航次模板的库存、行程、定价及销售规则">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBatchPublishPlan}
            disabled={selectedIds.size === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            发布计划
          </button>
          <button
            onClick={handleBatchEditPlan}
            disabled={selectedIds.size !== 1}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-emerald-600 text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-300 disabled:hover:bg-white"
          >
            修改计划
          </button>
          <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"><Plus className="w-4 h-4" />新增模板</button>
        </div>
      </PageHeader>
      <SearchPanel onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">所属游轮</label><select value={shipFilter} onChange={(e) => setShipFilter(e.target.value)} className="w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option>{ships.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">航行类型</label><select value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value)} className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option><option value="upstream">上水</option><option value="downstream">下水</option></select></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">状态</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option><option value="draft">草稿</option><option value="enabled">已启用</option><option value="disabled">已停用</option></select></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">模糊搜索</label><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="模板编码/名称" className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
      </SearchPanel>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden"><div className="overflow-x-auto"><table className="w-full">
        <thead><tr className="border-b border-gray-200 bg-gray-50">{columns.map((c) => <th key={c.key} className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider" style={c.width ? { width: c.width } : undefined}>{c.key === 'select' ? <input type="checkbox" checked={data.data.length > 0 && selectedIds.size === data.data.length} onChange={toggleSelectAll} className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" /> : c.title}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-100">{loading ? <tr><td colSpan={columns.length} className="px-4 py-16 text-center text-sm text-gray-400">加载中...</td></tr> : data.data.length === 0 ? <tr><td colSpan={columns.length} className="px-4 py-16 text-center text-sm text-gray-400">暂无数据</td></tr> : data.data.map((r) => <tr key={r.id} className="hover:bg-gray-50 transition-colors">{columns.map((c) => <td key={c.key} className="px-4 py-2.5 text-sm text-gray-700 whitespace-nowrap">{c.render ? c.render(r) : c.dataIndex ? String(r[c.dataIndex as keyof VoyageTemplate] ?? '-') : '-'}</td>)}</tr>)}</tbody>
      </table></div>
      {data.total > 0 && <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50"><span className="text-sm text-gray-500">共 {data.total} 条</span><div className="flex items-center gap-1"><button onClick={() => fetchData(data.page - 1)} disabled={data.page <= 1} className="px-3 py-1.5 text-sm rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30">上一页</button><button onClick={() => fetchData(data.page + 1)} disabled={data.page >= Math.ceil(data.total / data.pageSize)} className="px-3 py-1.5 text-sm rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30">下一页</button></div></div>}
      </div>

      {/* Multi-tab form dialog */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[4vh]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFormOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-3 border-b shrink-0"><h3 className="text-base font-semibold text-gray-900">{editingId ? '编辑模板' : '新增模板'}</h3><button onClick={() => setFormOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded"><X className="w-4 h-4" /></button></div>
            {/* Basic info */}
            <div className="px-6 py-3 border-b shrink-0 bg-gray-50/50">
              <div className="grid grid-cols-4 gap-3">
                <div><label className="block text-xs text-gray-500 mb-0.5">模板编码 <span className="text-red-500">*</span></label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm font-mono" /></div>
                <div><label className="block text-xs text-gray-500 mb-0.5">名称 <span className="text-red-500">*</span></label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-0.5">关联产品 <span className="text-red-500">*</span></label><select value={form.productId} onChange={(e) => onProductChange(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"><option value="">选择</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div><label className="block text-xs text-gray-500 mb-0.5">适用游轮</label><input value={form.shipName} disabled className="w-full px-2 py-1.5 border border-gray-200 bg-gray-50 rounded text-sm text-gray-500" /></div>
                <div><label className="block text-xs text-gray-500 mb-0.5">开始时间</label><input type="date" value={form.voyageStartTime} onChange={(e) => setForm({ ...form, voyageStartTime: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-0.5">结束时间</label><input type="date" value={form.voyageEndTime} onChange={(e) => setForm({ ...form, voyageEndTime: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-0.5">开航类型</label><select value={form.sailType} onChange={(e) => setForm({ ...form, sailType: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"><option value="周内固定">周内固定</option><option value="周期循环">周期循环</option></select></div>
                <div>
                  {form.sailType === '周内固定' ? (<><label className="block text-xs text-gray-500 mb-0.5">开航日</label><select value={form.sailDay} onChange={(e) => setForm({ ...form, sailDay: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"><option value="">选择</option>{['周一','周二','周三','周四','周五','周六','周日'].map((d) => <option key={d} value={d}>{d}</option>)}</select></>)
                  : (<><label className="block text-xs text-gray-500 mb-0.5">周期(天)</label><input type="number" value={form.sailDay} onChange={(e) => setForm({ ...form, sailDay: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" /></>)}
                </div>
                <div><label className="block text-xs text-gray-500 mb-0.5">开航时间</label><input type="time" value={form.sailTime} onChange={(e) => setForm({ ...form, sailTime: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-0.5">总时长(天)</label><input type="number" value={form.totalDays || ''} onChange={(e) => setForm({ ...form, totalDays: Number(e.target.value) })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" /></div>
              </div>
            </div>
            {/* Tabs */}
            <div className="flex border-b shrink-0"><div className="flex px-6">{TABS.map((t, i) => <button key={i} onClick={() => setTab(i)} className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${tab === i ? 'border-gray-900 text-gray-900 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>)}</div></div>
            <div className="flex-1 overflow-y-auto px-6 py-4">{renderTab()}</div>
            <div className="flex justify-end gap-3 px-6 py-3 border-t shrink-0"><button onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50">取消</button><button onClick={handleSubmit} disabled={formLoading} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">{formLoading ? '保存中...' : '保存'}</button></div>
          </div>
        </div>
      )}

      <DetailDrawer open={detailOpen} title="模板详情" onClose={() => setDetailOpen(false)}>
        {detail && (<>
          <DetailCard title="基本信息"><DetailRow label="模板编码" value={detail.code} mono /><DetailRow label="名称" value={detail.name} /><DetailRow label="关联产品" value={detail.productName} /><DetailRow label="适用游轮" value={detail.shipName} /><DetailRow label="开始时间" value={detail.voyageStartTime} /><DetailRow label="结束时间" value={detail.voyageEndTime} /><DetailRow label="开航类型" value={detail.sailType === '周内固定' ? `每周${detail.sailDay}` : `每${detail.sailDay}天`} /><DetailRow label="开航时间" value={detail.sailTime} /><DetailRow label="总时长" value={`${detail.totalDays}天`} /><DetailRow label="状态" value={<span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColors[detail.status]}`}>{statusLabels[detail.status]}</span>} /></DetailCard>
          <DetailCard title={`库存（${detail.inventory.length}项）`}>{detail.inventory.map((inv) => <div key={inv.id} className="flex gap-3 text-sm py-0.5"><span className="text-gray-700 font-medium">{inv.cabinName}</span><span className="text-gray-500">床位{inv.totalBeds} 投放{inv.released}</span><span className={inv.status === 'open' ? 'text-green-600' : 'text-gray-400'}>{inv.status === 'open' ? '开启' : '关闭'}</span></div>)}</DetailCard>
          <DetailCard title={`行程（${detail.itinerary.length}项）`}>{detail.itinerary.map((itin) => <div key={itin.id} className="flex gap-2 text-sm py-0.5"><span className="text-gray-700">{itin.portName} 第{itin.day}天</span><span className="text-gray-500">{itin.theme && `${itin.theme} ${itin.description}`}</span></div>)}</DetailCard>
          <DetailCard title={`定金（${detail.deposits.length}项）`}>{detail.deposits.map((d) => <div key={d.id} className="flex gap-3 text-sm py-0.5"><span className="text-gray-700">{getMarketCategoryLabel(d.marketCategory)}</span><span className="text-gray-500">¥{d.deposit}/人</span></div>)}</DetailCard>
          <DetailCard title="计价配置"><DetailRow label="基准价参考" value={`¥${detail.basePriceRef}`} /><DetailRow label="结算规则" value={detail.settlementRule} /><DetailRow label="提前购优惠" value={`¥${detail.earlyBirdDiscount}`} /><DetailRow label="附加费策略" value={detail.surchargeStrategy.join('、') || '-'} /></DetailCard>
          <DetailCard title="销售规则"><DetailRow label="预售期" value={`${detail.presaleDays}天`} /><DetailRow label="截止售卖" value={`${detail.cutoffDays}天前`} /><DetailRow label="退改策略" value={detail.refundPolicy} /><DetailRow label="物料需求" value={detail.materialReq.join('、') || '-'} /></DetailCard>
          <DetailCard title="操作信息"><DetailRow label="修改人" value={detail.updatedBy} /><DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} /><DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} /></DetailCard>
        </>)}
      </DetailDrawer>

      <ConfirmDialog open={confirmOpen} title="删除模板" message="确定要删除该模板吗？此操作不可恢复。" danger onConfirm={confirmDelete} onCancel={() => setConfirmOpen(false)} />



    </div>
  )
}
