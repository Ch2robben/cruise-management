import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import { voyageApi, priceApi } from '@/mock/api'
import { dealers, products, voyageTemplates, voyages, routes, ships } from '@/mock/data'
import type { Voyage, PaginatedResult, SearchParams, ApprovalStep, VoyagePrice, TemplateItinerary } from '@/types'
import { formatDateTime } from '@/utils/format'
import { resolveTemplateItinerary } from '@/utils/productVoyageConfig'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'
import ItineraryEditor from '@/components/voyage/ItineraryEditor'

const statusLabels: Record<string, string> = { ticketing: '售票', suspended: '停航', chartered: '包租', deadhead: '空放', pending: '待定', transfer: '转船' }
const statusColors: Record<string, string> = { ticketing: 'bg-green-100 text-green-700', suspended: 'bg-red-100 text-red-600', chartered: 'bg-purple-100 text-purple-700', deadhead: 'bg-gray-100 text-gray-500', pending: 'bg-yellow-100 text-yellow-700', transfer: 'bg-blue-100 text-blue-700' }
const approvalColors: Record<string, string> = { '已审批': 'text-green-600', '审批中': 'text-yellow-600', '已驳回': 'text-red-600' }
const statusOptions = ['all', 'ticketing', 'suspended', 'chartered', 'deadhead', 'pending', 'transfer']
export default function VoyagePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<Voyage>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [routeFilter, setRouteFilter] = useState('all')
  const [shipFilter, setShipFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [directionFilter, setDirectionFilter] = useState('all')
  const [templateFilter, setTemplateFilter] = useState('all')
  const [approvalFilter, setApprovalFilter] = useState('all')

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchStatus, setBatchStatus] = useState('ticketing')
  const [listBatchPriceOpen, setListBatchPriceOpen] = useState(false)
  const [docOpen, setDocOpen] = useState<'boarding' | 'receipt' | null>(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<Voyage | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  // 生成航次
  const [genOpen, setGenOpen] = useState(false)
  const [genProductId, setGenProductId] = useState('')
  const [genTemplateId, setGenTemplateId] = useState('')
  const [genStartDate, setGenStartDate] = useState('')
  const [genEndDate, setGenEndDate] = useState('')
  const [genConflict, setGenConflict] = useState<string[]>([])

  // 审批时间轴
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [timeline, setTimeline] = useState<ApprovalStep[]>([])

  // 航次行程
  const [itineraryOpen, setItineraryOpen] = useState(false)
  const [itineraryVoyage, setItineraryVoyage] = useState<Voyage | null>(null)
  const [itineraryDraft, setItineraryDraft] = useState<TemplateItinerary[]>([])

  // 价格日历
  const [priceOpen, setPriceOpen] = useState(false)
  const [priceVoyage, setPriceVoyage] = useState<Voyage | null>(null)
  const [priceData, setPriceData] = useState<VoyagePrice[]>([])
  const [priceView, setPriceView] = useState<'base' | 'adult' | 'child' | 'baby'>('adult')
  const openPrice = async (r: Voyage) => {
    const result = await priceApi.list({ voyageId: r.id, pageSize: 100 })
    setPriceData(result.data)
    setPriceVoyage(r)
    setPriceOpen(true)
  }

  const getPrice = (cabin: string, date: string, field: string) => {
    const p = priceData.find((p) => p.cabinTypeName === cabin && p.date === date)
    return p ? (p as any)[field] : ''
  }

  const setPrice = (cabin: string, date: string, field: string, value: number) => {
    setPriceData((prev) => {
      const idx = prev.findIndex((p) => p.cabinTypeName === cabin && p.date === date)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], [field]: value }
        return next
      }
      return prev
    })
  }

  const savePrices = async () => {
    for (const p of priceData) { await priceApi.update(p.id, p) }
    setPriceOpen(false)
  }

  // 价格格子编辑弹窗
  const [cellEditOpen, setCellEditOpen] = useState(false)
  const [cellEditDate, setCellEditDate] = useState('')
  const [cellEditData, setCellEditData] = useState<{ cabin: string; adult: number; child: number; baby: number; base: number }[]>([])

  const openCellEdit = (date: string) => {
    const cabins = [...new Set(priceData.filter((p) => p.date === date).map((p) => p.cabinTypeName))]
    setCellEditData(cabins.map((c) => {
      const row = priceData.find((p) => p.cabinTypeName === c && p.date === date)
      return { cabin: c, adult: row?.adultPrice || 0, child: row?.childPrice || 0, baby: row?.babyPrice || 0, base: row?.basePrice || 0 }
    }))
    setCellEditDate(date)
    setCellEditOpen(true)
  }

  const updateCellEdit = (idx: number, field: string, value: number) => {
    setCellEditData((prev) => { const n = [...prev]; n[idx] = { ...n[idx], [field]: value }; return n })
  }

  const saveCellEdit = () => {
    for (const row of cellEditData) {
      setPrice(cellEditData[0]?.cabin || '', cellEditDate, 'adultPrice', row.adult)
      const idx = priceData.findIndex((p) => p.cabinTypeName === row.cabin && p.date === cellEditDate)
      if (idx >= 0) {
        setPriceData((prev) => { const n = [...prev]; n[idx] = { ...n[idx], adultPrice: row.adult, childPrice: row.child, babyPrice: row.baby, basePrice: row.base }; return n })
      }
    }
    setCellEditOpen(false)
  }

  // 批量设置弹窗（价格日历内）
  const [batchPriceOpen, setBatchPriceOpen] = useState(false)
  const [batchPStart, setBatchPStart] = useState('')
  const [batchPEnd, setBatchPEnd] = useState('')
  const [batchPDays, setBatchPDays] = useState<string[]>([])
  const [batchPValue, setBatchPValue] = useState(0)

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    if (keyword.trim()) params.keyword = keyword.trim()
    if (dateFrom) params.dateFrom = dateFrom; if (dateTo) params.dateTo = dateTo
    if (routeFilter !== 'all') params.routeId = routeFilter
    if (shipFilter !== 'all') params.shipId = shipFilter
    if (statusFilter !== 'all') params.status = statusFilter
    if (directionFilter !== 'all') params.direction = directionFilter
    if (templateFilter !== 'all') params.templateId = templateFilter
    const result = await voyageApi.list(params)
    setData(result); setLoading(false); setSelected(new Set())
  }, [keyword, dateFrom, dateTo, routeFilter, shipFilter, statusFilter, directionFilter, templateFilter])

  useEffect(() => { fetchData() }, [fetchData])
  const handleSearch = () => fetchData(1)
  const handleReset = () => { setKeyword(''); setDateFrom(''); setDateTo(''); setRouteFilter('all'); setShipFilter('all'); setStatusFilter('all'); setDirectionFilter('all'); setTemplateFilter('all'); setApprovalFilter('all') }

  const toggleSelect = (id: string) => setSelected((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const toggleSelectAll = () => { if (selected.size === data.data.length && data.data.length > 0) setSelected(new Set()); else setSelected(new Set(data.data.map((v) => v.id))) }

  const openDetail = async (r: Voyage) => { const v = await voyageApi.getById(r.id); setDetail(v || null); setDetailOpen(true) }
  const handleDelete = (id: string) => { setConfirmId(id); setConfirmOpen(true) }
  const confirmDelete = async () => { await voyageApi.remove(confirmId); setConfirmOpen(false); fetchData(data.page) }
  const handleBatchStatus = async () => { if (selected.size === 0) return; await voyageApi.batchUpdateStatus([...selected], batchStatus); setBatchOpen(false); fetchData(data.page) }

  const openTimeline = (v: Voyage) => { setTimeline(v.approvalTimeline || []); setTimelineOpen(true) }
  const openItinerary = (voyage: Voyage) => {
    const template = voyageTemplates.find(item => item.id === voyage.templateId)
      || voyageTemplates.find(item => item.name === voyage.templateName)
      || voyageTemplates.find(item => item.productId === voyage.productId)
      || null
    const product = products.find((item) => item.id === voyage.productId)
    const baseItinerary = template ? resolveTemplateItinerary(template, product) : []
    setItineraryVoyage(voyage)
    setItineraryDraft(
      Array.isArray(voyage.itinerary) && voyage.itinerary.length
        ? voyage.itinerary.map((item) => ({ ...item }))
        : baseItinerary.map((item) => ({ ...item })),
    )
    setItineraryOpen(true)
  }

  const closeItinerary = () => {
    setItineraryOpen(false)
    setItineraryVoyage(null)
    setItineraryDraft([])
  }

  const saveItinerary = async () => {
    if (!itineraryVoyage) return
    await voyageApi.update(itineraryVoyage.id, {
      itinerary: itineraryDraft,
      updatedBy: '当前用户',
      updatedAt: new Date().toISOString(),
    })
    setItineraryOpen(false)
    fetchData(data.page)
  }

  const genTemplates = voyageTemplates.filter((t) => t.productId === genProductId)

  const handleGenerate = () => {
    const tpl = genTemplates.find((t) => t.id === genTemplateId)
    if (!tpl || !genStartDate || !genEndDate) return
    const conflicts: string[] = []
    voyages.filter((v) => v.startDate <= genEndDate && v.endDate >= genStartDate).forEach((v) => { conflicts.push(v.startDate) })
    setGenConflict(conflicts)
    if (conflicts.length === 0) {
      const days = Math.ceil((new Date(genEndDate).getTime() - new Date(genStartDate).getTime()) / 86400000)
      const newV: Omit<Voyage, 'id'> = {
        voyageNo: `CJ${genStartDate.replace(/-/g, '')}-${tpl.shipName?.slice(0, 2) || 'XX'}`, shipName: tpl.shipName || '',
        routeName: '', productName: tpl.productName || '', templateName: tpl.name, templateId: tpl.id,
        days, startDate: genStartDate, endDate: genEndDate,
        status: 'pending', approvalStatus: '审批中', approvalTimeline: [
          { nodeName: '提交申请', approver: '运营经理', status: 'pending', duration: '', plan: '待审批', time: new Date().toISOString() },
        ],
        direction: 'downstream', totalCabins: 0, soldCabins: 0, availableCabins: 0,
        shipId: '', routeId: '', productId: tpl.productId,
        updatedBy: '当前用户', updatedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
      }
      voyageApi.list().then(() => {
        const vs = [...voyages]
        vs.unshift({ ...newV, id: `v${Date.now()}` } as Voyage)
      })
      setGenOpen(false); fetchData(data.page)
    }
  }

  const columns = [
    { key: 'cb', title: '', width: '40px', render: (r: Voyage) => <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer" /> },
    { key: 'index', title: '序号', render: (_: Voyage, idx: number) => <span className="text-gray-400">{idx + 1}</span>, width: '50px' },
    { key: 'voyageNo', title: '航次号', render: (r: Voyage) => <span className="font-mono text-xs">{r.voyageNo}</span> },
    { key: 'shipName', title: '游轮', dataIndex: 'shipName' as keyof Voyage },
    { key: 'routeName', title: '线路', dataIndex: 'routeName' as keyof Voyage },
    { key: 'productName', title: '产品名称', dataIndex: 'productName' as keyof Voyage },
    { key: 'templateName', title: '模板名称', render: (r: Voyage) => r.templateName ? (
      <button onClick={() => navigate(`/voyage/templates?keyword=${encodeURIComponent(r.templateName)}`)} className="text-blue-600 hover:text-blue-800 hover:underline text-xs">{r.templateName}</button>
    ) : '-' },
    { key: 'days', title: '天数', render: (r: Voyage) => `${r.days}天` },
    { key: 'startDate', title: '开航日期', dataIndex: 'startDate' as keyof Voyage },
    { key: 'endDate', title: '终到日期', dataIndex: 'endDate' as keyof Voyage },
    { key: 'status', title: '状态', render: (r: Voyage) => <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColors[r.status]}`}>{statusLabels[r.status]}</span> },
    { key: 'direction', title: '上下水', render: (r: Voyage) => <span className={r.direction === 'upstream' ? 'text-blue-600' : 'text-green-600'}>{r.direction === 'upstream' ? '上水' : '下水'}</span> },
    { key: 'totalCabins', title: '已投放', render: (r: Voyage) => `${r.totalCabins}间` },
    { key: 'soldCabins', title: '已售', render: (r: Voyage) => `${r.soldCabins}间` },
    { key: 'availableCabins', title: '可售', render: (r: Voyage) => <span className="font-medium">{r.availableCabins}间</span> },
    { key: 'approval', title: '审批状态', render: (r: Voyage) => (
      <button onClick={() => openTimeline(r)} className={`text-xs hover:underline ${approvalColors[r.approvalStatus] || 'text-gray-500'}`}>{r.approvalStatus || '-'}</button>
    )},
    { key: 'updatedBy', title: '修改人', render: (r: Voyage) => (r as any).updatedBy || '-' },
    { key: 'updatedAt', title: '修改时间', render: (r: Voyage) => (r as any).updatedAt ? formatDateTime((r as any).updatedAt) : '-' },
    { key: 'actions', title: '操作', width: '220px', render: (r: Voyage) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openDetail(r)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">详情</button>
        <button onClick={() => openItinerary(r)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">行程</button>
        <button onClick={() => handleDelete(r.id)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">删除</button>
      </div>
    )},
  ]

  const timelineStepColors: Record<string, string> = { approved: 'bg-green-500', pending: 'bg-yellow-400', rejected: 'bg-red-500' }

  const openVoyageDoc = (type: 'boarding' | 'receipt') => {
    if (selected.size === 0) {
      window.alert('请先勾选航次')
      return
    }
    setDocOpen(type)
  }

  const selectedVoyages = data.data.filter((v) => selected.has(v.id))

  return (
    <div>
      <PageHeader title="航次列表" description="管理所有游轮航次信息" />

      <SearchPanel onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">航期</label><div className="flex items-center gap-1.5"><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36 px-2 py-2 border border-gray-300 rounded-lg text-sm" /><span className="text-gray-400">-</span><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36 px-2 py-2 border border-gray-300 rounded-lg text-sm" /></div></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">航线</label><select value={routeFilter} onChange={(e) => setRouteFilter(e.target.value)} className="w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option>{routes.slice(0, 6).map((r) => <option key={r.id} value={r.id}>{r.name.slice(0, 8)}</option>)}</select></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">游轮</label><select value={shipFilter} onChange={(e) => setShipFilter(e.target.value)} className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option>{ships.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">状态</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm">{statusOptions.map((s) => <option key={s} value={s}>{s === 'all' ? '全部' : statusLabels[s]}</option>)}</select></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">上下水</label><select value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value)} className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option><option value="upstream">上水</option><option value="downstream">下水</option></select></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">模版</label><select value={templateFilter} onChange={(e) => setTemplateFilter(e.target.value)} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option>{voyageTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
      </SearchPanel>
      <div className="bg-white px-9 py-6">
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <button onClick={() => setBatchOpen(true)} className="inline-flex h-11 items-center rounded-md bg-blue-600 px-6 text-base font-medium text-white transition hover:bg-blue-700">设置状态（{selected.size}）</button>
          )}
          <button onClick={() => { setGenProductId(''); setGenTemplateId(''); setGenStartDate(''); setGenEndDate(''); setGenConflict([]); setGenOpen(true) }} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700"><Plus className="w-4 h-4" />添加</button>
          <button onClick={() => openVoyageDoc('boarding')} className="inline-flex h-11 items-center rounded-md border border-gray-300 bg-white px-6 text-base text-gray-700 transition hover:bg-gray-50">乘船通知书</button>
          <button onClick={() => openVoyageDoc('receipt')} className="inline-flex h-11 items-center rounded-md border border-gray-300 bg-white px-6 text-base text-gray-700 transition hover:bg-gray-50">宾客回执单</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden"><div className="overflow-x-auto"><table className="w-full">
        <thead><tr className="border-b border-gray-200 bg-gray-50">{columns.map((c) => <th key={c.key} className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider" style={c.width ? { width: c.width } : undefined}>{c.key === 'cb' ? <input type="checkbox" checked={selected.size === data.data.length && data.data.length > 0} onChange={toggleSelectAll} className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer" /> : c.title}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-100">{loading ? <tr><td colSpan={columns.length} className="px-4 py-16 text-center text-sm text-gray-400">加载中...</td></tr> : data.data.length === 0 ? <tr><td colSpan={columns.length} className="px-4 py-16 text-center text-sm text-gray-400">暂无数据</td></tr> : data.data.map((r, idx) => <tr key={r.id} className="hover:bg-gray-50 transition-colors">{columns.map((c) => <td key={c.key} className="px-4 py-2.5 text-sm text-gray-700 whitespace-nowrap">{c.render ? c.render(r, idx) : c.dataIndex ? String(r[c.dataIndex as keyof Voyage] ?? '-') : '-'}</td>)}</tr>)}</tbody>
      </table></div>
      {data.total > 0 && <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50"><span className="text-sm text-gray-500">共 {data.total} 条</span><div className="flex items-center gap-1"><button onClick={() => fetchData(data.page - 1)} disabled={data.page <= 1} className="px-3 py-1.5 text-sm rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30">上一页</button><button onClick={() => fetchData(data.page + 1)} disabled={data.page >= Math.ceil(data.total / data.pageSize)} className="px-3 py-1.5 text-sm rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30">下一页</button></div></div>}
      </div>

      {/* Detail */}
      <DetailDrawer open={detailOpen} title="航次详情" onClose={() => setDetailOpen(false)}>{detail && (<>
        <DetailCard title="基本信息"><DetailRow label="航次号" value={detail.voyageNo} mono /><DetailRow label="游轮" value={detail.shipName} /><DetailRow label="线路" value={detail.routeName} /><DetailRow label="产品" value={detail.productName} /><DetailRow label="模板" value={detail.templateName || '-'} /><DetailRow label="天数" value={`${detail.days}天`} /></DetailCard>
        <DetailCard title="时间"><DetailRow label="开航" value={detail.startDate} /><DetailRow label="终到" value={detail.endDate} /></DetailCard>
        <DetailCard title="数据"><DetailRow label="已投放" value={`${detail.totalCabins}间`} /><DetailRow label="已售" value={`${detail.soldCabins}间`} /><DetailRow label="可售" value={<span className="font-medium text-lg">{detail.availableCabins}间</span>} /></DetailCard>
        <DetailCard title="状态"><DetailRow label="航次状态" value={<span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColors[detail.status]}`}>{statusLabels[detail.status]}</span>} /><DetailRow label="审批状态" value={detail.approvalStatus || '-'} /></DetailCard>
      </>)}</DetailDrawer>

      {itineraryOpen && itineraryVoyage && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh]">
          <div className="absolute inset-0 bg-black/40" onClick={closeItinerary} />
          <div className="relative mx-4 flex max-h-[82vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">编辑航次行程 · {itineraryVoyage.voyageNo}</h3>
                <p className="mt-1 text-xs text-gray-500">
                  {itineraryVoyage.productName} · 基础行程在资源管理 → 行程管理中维护；此处保存为当前航次专属覆盖。
                </p>
              </div>
              <button onClick={closeItinerary} className="rounded p-1 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-5">
              <ItineraryEditor
                value={itineraryDraft}
                onChange={setItineraryDraft}
                compact
                emptyText="暂无行程配置，请先在行程管理中维护关联产品的行程方案"
              />
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button onClick={closeItinerary} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
              <button onClick={saveItinerary} className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800">保存</button>
            </div>
          </div>
        </div>
      )}


      {/* 生成航次 */}
      {genOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"><div className="absolute inset-0 bg-black/40" onClick={() => setGenOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">生成航次</h3>
            <div className="space-y-3 mb-4">
              <div><label className="block text-sm text-gray-700 mb-1">选择产品</label><select value={genProductId} onChange={(e) => { setGenProductId(e.target.value); setGenTemplateId(''); setGenConflict([]) }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="">请选择</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">选择模板</label><select value={genTemplateId} onChange={(e) => setGenTemplateId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="">请选择</option>{genTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-gray-700 mb-1">开始时间</label><input type="date" value={genStartDate} onChange={(e) => setGenStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                <div><label className="block text-sm text-gray-700 mb-1">结束时间</label><input type="date" value={genEndDate} onChange={(e) => setGenEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              </div>
              {genConflict.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3"><p className="text-sm text-red-700 font-medium mb-1">排期冲突</p>
                  {genConflict.map((d) => <p key={d} className="text-xs text-red-600">{d} 已有航次</p>)}
                  <div className="flex gap-2 mt-2"><button onClick={() => setGenConflict([])} className="px-3 py-1 text-xs bg-red-600 text-white rounded">覆盖提交</button><button onClick={() => setGenOpen(false)} className="px-3 py-1 text-xs border border-gray-300 rounded">取消</button></div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3"><button onClick={() => setGenOpen(false)} className="px-4 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50">取消</button><button onClick={handleGenerate} disabled={!genProductId || !genTemplateId || !genStartDate || !genEndDate || genConflict.length > 0} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-40">提交</button></div>
          </div>
        </div>
      )}

      {/* 价格格子编辑弹窗 */}
      {cellEditOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center"><div className="absolute inset-0 bg-black/40" onClick={() => setCellEditOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">编辑价格 · {cellEditDate}</h3>
            <table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b border-gray-200"><th className="px-3 py-2 text-left text-xs text-gray-500">舱房</th><th className="px-3 py-2 text-right text-xs text-gray-500">成人价</th><th className="px-3 py-2 text-right text-xs text-gray-500">儿童价</th><th className="px-3 py-2 text-right text-xs text-gray-500">婴儿价</th><th className="px-3 py-2 text-right text-xs text-gray-500">基准价</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {cellEditData.map((row, idx) => (<tr key={row.cabin}><td className="px-3 py-2 font-medium text-gray-700">{row.cabin}</td>
                <td className="px-3 py-2"><input type="number" value={row.adult} onChange={(e) => updateCellEdit(idx, 'adult', Number(e.target.value))} className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right" /></td>
                <td className="px-3 py-2"><input type="number" value={row.child} onChange={(e) => updateCellEdit(idx, 'child', Number(e.target.value))} className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right" /></td>
                <td className="px-3 py-2"><input type="number" value={row.baby} onChange={(e) => updateCellEdit(idx, 'baby', Number(e.target.value))} className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right" /></td>
                <td className="px-3 py-2"><input type="number" value={row.base} onChange={(e) => updateCellEdit(idx, 'base', Number(e.target.value))} className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right" /></td></tr>))}
            </tbody></table>
            <div className="flex justify-end gap-3 mt-6"><button onClick={() => setCellEditOpen(false)} className="px-4 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50">取消</button><button onClick={saveCellEdit} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">保存</button></div>
          </div>
        </div>
      )}
      {/* 批量价格弹窗 */}
      {batchPriceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"><div className="absolute inset-0 bg-black/40" onClick={() => setBatchPriceOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6"><h3 className="text-base font-semibold text-gray-900 mb-4">批量调价</h3>
            <div className="space-y-3"><div className="grid grid-cols-2 gap-3"><div><label className="block text-sm text-gray-700 mb-1">生效日期起</label><input type="date" value={batchPStart} onChange={(e) => setBatchPStart(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div><div><label className="block text-sm text-gray-700 mb-1">生效日期止</label><input type="date" value={batchPEnd} onChange={(e) => setBatchPEnd(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div></div>
            <div><label className="block text-sm text-gray-700 mb-1">生效星期</label><div className="flex gap-2">{['周一','周二','周三','周四','周五','周六','周日'].map((d) => (<label key={d} className={`px-2 py-1 border rounded text-xs cursor-pointer ${batchPDays.includes(d) ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600'}`}><input type="checkbox" checked={batchPDays.includes(d)} onChange={() => setBatchPDays((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p, d])} className="sr-only" />{d}</label>))}</div></div>
            <div><label className="block text-sm text-gray-700 mb-1">调价金额(¥)</label><input type="number" value={batchPValue} onChange={(e) => setBatchPValue(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div></div>
            <div className="flex justify-end gap-3 mt-6"><button onClick={() => setBatchPriceOpen(false)} className="px-4 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50">取消</button><button onClick={() => setBatchPriceOpen(false)} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">应用</button></div>
          </div>
        </div>
      )}
      {/* 审批时间轴 */}
      {timelineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"><div className="absolute inset-0 bg-black/40" onClick={() => setTimelineOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-base font-semibold text-gray-900">审批时间轴</h3><button onClick={() => setTimelineOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button></div>
            <div className="space-y-4">
              {timeline.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center"><div className={`w-3 h-3 rounded-full ${timelineStepColors[step.status]}`} /><div className="w-px flex-1 bg-gray-200" /></div>
                  <div className="flex-1 pb-4"><p className="text-sm font-medium text-gray-900">{step.nodeName}</p><p className="text-xs text-gray-500">{step.approver} · {step.duration || '-'}</p><p className="text-xs text-gray-400">{step.plan}</p>{step.time && <p className="text-xs text-gray-400 mt-0.5">{step.time}</p>}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Batch Status */}
      {docOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDocOpen(null)} />
          <div className="relative mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">{docOpen === 'boarding' ? '乘船通知书' : '宾客回执单'}</h3>
              <button onClick={() => setDocOpen(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <p className="mb-3 text-sm text-gray-500">已选择 {selectedVoyages.length} 个航次</p>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
              {selectedVoyages.map((v) => (
                <div key={v.id} className="text-sm text-gray-700">
                  {v.voyageNo} · {v.shipName} · {v.startDate}
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setDocOpen(null)} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">关闭</button>
              <button onClick={() => setDocOpen(null)} className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800">生成并下载</button>
            </div>
          </div>
        </div>
      )}

      {batchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"><div className="absolute inset-0 bg-black/40" onClick={() => setBatchOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6"><h3 className="text-base font-semibold text-gray-900 mb-1">设置航次状态</h3><p className="text-sm text-gray-500 mb-4">已选择 {selected.size} 个</p>
            <select value={batchStatus} onChange={(e) => setBatchStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4">{statusOptions.filter((s) => s !== 'all').map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}</select>
            <div className="flex justify-end gap-3"><button onClick={() => setBatchOpen(false)} className="px-4 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50">取消</button><button onClick={handleBatchStatus} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">确认</button></div>
          </div>
        </div>
      )}

      {/* 列表批量定价弹窗 */}
      {listBatchPriceOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setListBatchPriceOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">批量定价</h3>
            <p className="text-sm text-gray-500 mb-4">已选择 {selected.size} 个航次，此操作将统一调整这些航次的所有舱房价格。</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-gray-700 mb-1">成人价</label><input type="number" placeholder="请输入" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                <div><label className="block text-sm text-gray-700 mb-1">儿童价</label><input type="number" placeholder="请输入" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setListBatchPriceOpen(false)} className="px-4 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50">取消</button>
              <button onClick={() => {
                setListBatchPriceOpen(false);
                setSelected(new Set());
                fetchData(data.page);
              }} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">确认调价</button>
            </div>
          </div>
        </div>
      )}
      {/* 价格日历 */}
      {priceOpen && priceVoyage && (() => {
        const cabins = [...new Set(priceData.map(p => p.cabinTypeName))]
        const vs2 = new Date(priceVoyage.startDate); const ms = new Date(vs2.getFullYear(), vs2.getMonth(), 1); const me = new Date(vs2.getFullYear(), vs2.getMonth() + 1, 0)
        const dates: string[] = []; const voyageDates = new Set<string>()
        for (let d = new Date(ms); d <= me; d.setDate(d.getDate() + 1)) dates.push(d.toISOString().slice(0, 10))
        const ve = new Date(priceVoyage.endDate)
        for (let d = new Date(priceVoyage.startDate); d <= ve; d.setDate(d.getDate() + 1)) voyageDates.add(d.toISOString().slice(0, 10))
        const monthLabel2 = `${vs2.getFullYear()}年${vs2.getMonth() + 1}月`
        const fields = [{ key: 'adultPrice', label: '成人价' }, { key: 'childPrice', label: '儿童价' }, { key: 'babyPrice', label: '婴儿价' }, { key: 'basePrice', label: '基准价' }]
        return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[6vh]"><div className="absolute inset-0 bg-black/40" onClick={() => setPriceOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-3 border-b shrink-0"><h3 className="text-base font-semibold text-gray-900">价格日历 · {priceVoyage.voyageNo} · {monthLabel2}</h3><div className="flex items-center gap-3"><div className="flex bg-gray-100 rounded-lg p-0.5">{fields.map(f => <button key={f.key} onClick={() => setPriceView(f.key as any)} className={`px-3 py-1 text-xs rounded-md ${priceView === f.key ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>{f.label}</button>)}</div><button onClick={() => setPriceOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded"><X className="w-4 h-4" /></button></div></div>
            <div className="flex-1 overflow-auto px-6 py-4">
              <table className="w-max min-w-full text-sm"><thead><tr className="bg-gray-50 border-b border-gray-200"><th className="sticky left-0 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-500 w-20 z-10">舱房</th>{dates.map(d => <th key={d} className={`px-2 py-2 text-center text-xs font-medium w-18 ${voyageDates.has(d) ? "text-gray-700" : "text-gray-300"}`}>{d.slice(5)}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-100">{cabins.map(cabin => <tr key={cabin}><td className="sticky left-0 bg-white px-3 py-2 text-xs font-medium text-gray-700 z-10">{cabin}</td>{dates.map(date => <td key={date} className="px-0.5 py-0.5"><input type="number" value={getPrice(cabin, date, priceView)} onChange={e => setPrice(cabin, date, priceView, Number(e.target.value))} className="w-full px-1 py-1.5 border border-gray-200 rounded text-xs text-center hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900" /></td>)}</tr>)}</tbody>
              </table>
            </div>
            <div className="flex justify-between items-center px-6 py-3 border-t shrink-0"><span className="text-xs text-gray-400">{cabins.length}种舱房 × 全月{dates.length}天（绿色为航次日期） · 顶部切换价格类型</span><div className="flex gap-3"><button onClick={() => setPriceOpen(false)} className="px-4 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50">取消</button><button onClick={() => setBatchPriceOpen(true)} className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">批量设置</button>
                <button onClick={savePrices} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">保存定价</button></div></div>
          </div>
        </div>)})()}

      <ConfirmDialog open={confirmOpen} title="删除航次" message="确定要删除该航次吗？" danger onConfirm={confirmDelete} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}
