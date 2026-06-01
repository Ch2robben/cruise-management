import { useState, useEffect, useCallback } from 'react'
import { Plus, X, ChevronRight, ChevronLeft } from 'lucide-react'
import { roomApi } from '@/mock/api'
import { ships } from '@/mock/data'
import type { Room, RoomForm, PaginatedResult, SearchParams, RoomStatus } from '@/types'
import { formatDateTime, generateId } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'

const statusLabels: Record<string, string> = { available: '可用', maintenance: '维修中', locked: '锁房' }
const statusColors: Record<string, string> = { available: 'bg-green-100 text-green-700', maintenance: 'bg-yellow-100 text-yellow-700', locked: 'bg-red-100 text-red-600' }
const posLabels: Record<string, string> = { bow: '船艏', mid: '船中', stern: '船艉' }

const emptyForm: RoomForm = {
  roomNo: '', shipId: '', cabinTypeId: '', deckId: '', position: 'mid',
  connected: false, connectedRoomNo: '', accessible: false, obstructed: false, obstructedNote: '',
  status: 'available', maintenanceNote: '',
}

// 批量生成预览行
interface GenRow {
  key: string; roomNo: string; cabinTypeName: string; deckName: string; position: string
}

export default function RoomPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<Room>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<RoomForm>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<Room | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  // 批量选择
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [batchStatusOpen, setBatchStatusOpen] = useState(false)
  const [batchStatus, setBatchStatus] = useState<RoomStatus>('available')

  // 批量生成向导
  const [genOpen, setGenOpen] = useState(false)
  const [genStep, setGenStep] = useState(0)
  const [genShipId, setGenShipId] = useState('')
  const [genCabinType, setGenCabinType] = useState('')
  const [genDeck, setGenDeck] = useState('')
  const [genPos, setGenPos] = useState('mid')
  const [genPrefix, setGenPrefix] = useState('')
  const [genStart, setGenStart] = useState(1)
  const [genEnd, setGenEnd] = useState(10)
  const [genPad, setGenPad] = useState(true)
  const [genNumType, setGenNumType] = useState<'all' | 'odd' | 'even'>('all')
  const [genExclude, setGenExclude] = useState('')
  const [genRows, setGenRows] = useState<GenRow[]>([])

  const selShip = ships.find((s) => s.id === genShipId)
  const genDecks = selShip?.decks || []
  const genCabins = selShip?.decks.flatMap((d) => d.cabins) || []

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    if (keyword.trim()) params.keyword = keyword.trim()
    if (statusFilter !== 'all') params.status = statusFilter
    const result = await roomApi.list(params)
    setData(result); setLoading(false); setSelected(new Set())
  }, [keyword, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])
  const handleSearch = () => fetchData(1)
  const handleReset = () => { setKeyword(''); setStatusFilter('all') }

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormOpen(true) }
  const openEdit = (r: Room) => {
    setEditingId(r.id)
    setForm({ roomNo: r.roomNo, shipId: r.shipId, cabinTypeId: r.cabinTypeId, deckId: r.deckId, position: r.position, connected: r.connected, connectedRoomNo: r.connectedRoomNo, accessible: r.accessible, obstructed: r.obstructed, obstructedNote: r.obstructedNote, status: r.status, maintenanceNote: r.maintenanceNote })
    setFormOpen(true)
  }
  const openDetail = async (r: Room) => { const rm = await roomApi.getById(r.id); setDetail(rm || null); setDetailOpen(true) }

  const handleSubmit = async () => {
    if (!form.roomNo.trim() || !form.shipId) return
    setFormLoading(true)
    const now = new Date().toISOString()
    const ship = ships.find((s) => s.id === form.shipId)
    const deck = ship?.decks.find((d) => d.id === form.deckId)
    const cabinTypeName = form.cabinTypeId || ''
    if (editingId) await roomApi.update(editingId, { ...form, shipName: ship?.name || '', cabinTypeName, deckName: deck ? `${deck.floorNum}层-${deck.name}` : '', floorNum: deck?.floorNum || 0, updatedBy: '当前用户', updatedAt: now })
    else await roomApi.create({ ...form, shipName: ship?.name || '', cabinTypeName, deckName: deck ? `${deck.floorNum}层-${deck.name}` : '', floorNum: deck?.floorNum || 0, updatedBy: '当前用户', updatedAt: now, createdAt: now } as Room)
    setFormLoading(false); setFormOpen(false); fetchData(data.page)
  }

  const handleDelete = (id: string) => { setConfirmId(id); setConfirmOpen(true) }
  const confirmDelete = async () => { await roomApi.remove(confirmId); setConfirmOpen(false); fetchData(data.page) }

  const toggleSelect = (id: string) => setSelected((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const toggleAll = () => { if (selected.size === data.data.length && data.data.length > 0) setSelected(new Set()); else setSelected(new Set(data.data.map((r) => r.id))) }
  const batchDelete = async () => { for (const id of selected) await roomApi.remove(id); setSelected(new Set()); fetchData(data.page) }
  const batchUpdateStatus = async () => { for (const id of selected) { const r = await roomApi.getById(id); if (r) await roomApi.update(id, { ...r, status: batchStatus, updatedBy: '当前用户' }) }; setBatchStatusOpen(false); setSelected(new Set()); fetchData(data.page) }

  // 批量生成
  const excludedSet = new Set(genExclude.split(',').map((s) => s.trim()).filter(Boolean))
  const previewGenerate = () => {
    const rows: GenRow[] = []
    const fmtNum = (n: number) => genPad ? String(n).padStart(2, '0') : String(n)
    for (let i = genStart; i <= genEnd; i++) {
      if (genNumType === 'odd' && i % 2 === 0) continue
      if (genNumType === 'even' && i % 2 !== 0) continue
      const numStr = String(i)
      if ([...excludedSet].some((ex) => numStr.includes(ex))) continue
      rows.push({
        key: generateId(), roomNo: genPrefix + fmtNum(i),
        cabinTypeName: genCabinType, deckName: genDeck, position: genPos,
      })
    }
    setGenRows(rows); setGenStep(1)
  }

  const updateGenRow = (idx: number, field: keyof GenRow, val: string) => {
    setGenRows((prev) => { const next = [...prev]; next[idx] = { ...next[idx], [field]: val }; return next })
  }
  const removeGenRow = (idx: number) => setGenRows((prev) => prev.filter((_, i) => i !== idx))

  const confirmGenerate = async () => {
    const now = new Date().toISOString()
    const ship = ships.find((s) => s.id === genShipId)
    const items: Omit<Room, 'id'>[] = genRows.map((r) => ({
      roomNo: r.roomNo, shipId: genShipId, shipName: ship?.name || '',
      cabinTypeId: '', cabinTypeName: r.cabinTypeName, deckId: '', deckName: r.deckName,
      floorNum: 0, position: r.position as Room['position'],
      connected: false, connectedRoomNo: '', accessible: false, obstructed: false, obstructedNote: '',
      status: 'available' as RoomStatus, maintenanceNote: '',
      updatedBy: '当前用户', updatedAt: now, createdAt: now,
    }))
    await roomApi.batchCreate(items)
    setGenOpen(false); setGenStep(0); fetchData(data.page)
  }

  const col = (key: string, title: string, w?: string, render?: (r: Room) => React.ReactNode, di?: keyof Room) => ({ key, title, width: w, render, dataIndex: di })

  const columns = [
    col('cb', '', '40px', (r: Room) => <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer" />),
    col('roomNo', '房间号', undefined, (r: Room) => <span className="font-mono text-sm font-medium">{r.roomNo}</span>),
    col('cabinTypeName', '所属房型', undefined, undefined, 'cabinTypeName' as keyof Room),
    col('deckName', '所在甲板', undefined, undefined, 'deckName' as keyof Room),
    col('position', '空间位置', undefined, (r: Room) => <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">{posLabels[r.position]}</span>),
    col('status', '状态', undefined, (r: Room) => <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColors[r.status]}`}>{statusLabels[r.status]}</span>),
    col('tags', '特殊属性', '100px', (r: Room) => <div className="flex gap-1">{r.connected && <span className="px-1 py-0.5 bg-purple-50 text-purple-600 rounded text-xs">连通</span>}{r.accessible && <span className="px-1 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">无障碍</span>}{r.obstructed && <span className="px-1 py-0.5 bg-orange-50 text-orange-600 rounded text-xs">遮挡</span>}</div>),
    col('updatedBy', '修改人', undefined, undefined, 'updatedBy' as keyof Room),
    col('updatedAt', '修改时间', undefined, (r: Room) => formatDateTime(r.updatedAt)),
    col('actions', '操作', '160px', (r: Room) => <div className="flex items-center gap-1">
      <button onClick={() => openDetail(r)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">详情</button>
      <button onClick={() => openEdit(r)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">编辑</button>
      <button onClick={() => { setSelected(new Set([r.id])); setBatchStatus(r.status === 'available' ? 'maintenance' : r.status === 'maintenance' ? 'locked' : 'available'); setBatchStatusOpen(true) }} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">改状态</button>
      <button onClick={() => handleDelete(r.id)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">删除</button>
    </div>),
  ]

  return (
    <div>
      <PageHeader title="房间管理" description="管理游轮物理房间实例，支持批量生成与状态维护" />

      <SearchPanel onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">关键词</label><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="房间号" className="w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">状态</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option>{Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      </SearchPanel>
      <div className="bg-white px-9 py-6">
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <>
              <button onClick={() => setBatchStatusOpen(true)} className="inline-flex h-11 items-center rounded-md bg-blue-600 px-6 text-base font-medium text-white transition hover:bg-blue-700">批量改状态（{selected.size}）</button>
              <button onClick={batchDelete} className="inline-flex h-11 items-center rounded-md bg-red-600 px-6 text-base font-medium text-white transition hover:bg-red-700">批量删除（{selected.size}）</button>
            </>
          )}
          <button onClick={() => { setGenShipId(''); setGenCabinType(''); setGenDeck(''); setGenRows([]); setGenStep(0); setGenOpen(true) }} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700"><Plus className="w-4 h-4" />添加</button>
          <button onClick={openCreate} className="inline-flex h-11 items-center rounded-md border border-blue-600 px-6 text-base font-medium text-blue-600 transition hover:bg-blue-50">单条新增</button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden"><div className="overflow-x-auto"><table className="w-full">
        <thead><tr className="border-b border-gray-200 bg-gray-50">{columns.map((c) => <th key={c.key} className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider" style={c.width ? { width: c.width } : undefined}>{c.key === 'cb' ? <input type="checkbox" checked={selected.size === data.data.length && data.data.length > 0} onChange={toggleAll} className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer" /> : c.title}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-100">{loading ? <tr><td colSpan={columns.length} className="px-4 py-16 text-center text-sm text-gray-400">加载中...</td></tr> : data.data.length === 0 ? <tr><td colSpan={columns.length} className="px-4 py-16 text-center text-sm text-gray-400">暂无数据</td></tr> : data.data.map((r) => <tr key={r.id} className="hover:bg-gray-50 transition-colors">{columns.map((c) => <td key={c.key} className="px-4 py-2.5 text-sm text-gray-700 whitespace-nowrap">{c.render ? c.render(r) : c.dataIndex ? String(r[c.dataIndex] ?? '-') : '-'}</td>)}</tr>)}</tbody>
      </table></div>
      {data.total > 0 && <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50"><span className="text-sm text-gray-500">共 {data.total} 条</span><div className="flex items-center gap-1"><button onClick={() => fetchData(data.page - 1)} disabled={data.page <= 1} className="px-3 py-1.5 text-sm rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30">上一页</button><button onClick={() => fetchData(data.page + 1)} disabled={data.page >= Math.ceil(data.total / data.pageSize)} className="px-3 py-1.5 text-sm rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30">下一页</button></div></div>}
      </div>

      {/* 单条表单 */}
      <FormDialog open={formOpen} title={editingId ? '编辑房间' : '新增房间'} loading={formLoading} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基本信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">房间号 <span className="text-red-500">*</span></label><input value={form.roomNo} onChange={(e) => setForm({ ...form, roomNo: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">所属游轮 <span className="text-red-500">*</span></label><select value={form.shipId} onChange={(e) => { const sid = e.target.value; setForm({ ...form, shipId: sid, deckId: '', cabinTypeId: '' }) }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="">选择</option>{ships.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">所在甲板 <span className="text-red-500">*</span></label><select value={form.deckId} onChange={(e) => setForm({ ...form, deckId: e.target.value })} disabled={!form.shipId} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50"><option value="">选择</option>{(ships.find((s) => s.id === form.shipId)?.decks || []).map((d) => <option key={d.id} value={d.id}>{d.floorNum}层 - {d.name}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">所属房型</label><select value={form.cabinTypeId} onChange={(e) => setForm({ ...form, cabinTypeId: e.target.value })} disabled={!form.shipId} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50"><option value="">选择</option>{(ships.find((s) => s.id === form.shipId)?.decks.flatMap((d) => d.cabins) || []).map((c, i) => <option key={i} value={c.name}>{c.name || `未命名舱房`}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">空间位置</label><select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value as RoomForm['position'] })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{Object.entries(posLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            </div>
          </div>
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">房间属性</h4>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={form.connected} onChange={(e) => setForm({ ...form, connected: e.target.checked, connectedRoomNo: e.target.checked ? form.connectedRoomNo : '' })} className="w-3.5 h-3.5 rounded border-gray-300" />连通房</label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={form.accessible} onChange={(e) => setForm({ ...form, accessible: e.target.checked })} className="w-3.5 h-3.5 rounded border-gray-300" />无障碍</label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={form.obstructed} onChange={(e) => setForm({ ...form, obstructed: e.target.checked, obstructedNote: e.target.checked ? form.obstructedNote : '' })} className="w-3.5 h-3.5 rounded border-gray-300" />视线遮挡</label>
              {form.connected && <div><label className="block text-sm text-gray-700 mb-1">关联房间号</label><input value={form.connectedRoomNo} onChange={(e) => setForm({ ...form, connectedRoomNo: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>}
              {form.obstructed && <div><label className="block text-sm text-gray-700 mb-1">遮挡说明</label><input value={form.obstructedNote} onChange={(e) => setForm({ ...form, obstructedNote: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>}
            </div>
          </div>
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">状态与维护</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">当前状态</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as RoomForm['status'] })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              {form.status !== 'available' && <div className="col-span-2"><label className="block text-sm text-gray-700 mb-1">维护备注</label><textarea value={form.maintenanceNote} onChange={(e) => setForm({ ...form, maintenanceNote: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" /></div>}
            </div>
          </div>
        </div>
      </FormDialog>

      {/* 详情抽屉 */}
      <DetailDrawer open={detailOpen} title="房间详情" onClose={() => setDetailOpen(false)}>
        {detail && (<>
          <DetailCard title="基本信息"><DetailRow label="房间号" value={detail.roomNo} mono /><DetailRow label="所属游轮" value={detail.shipName} /><DetailRow label="所属房型" value={detail.cabinTypeName || '-'} /><DetailRow label="所在甲板" value={detail.deckName || '-'} /><DetailRow label="空间位置" value={posLabels[detail.position]} /><DetailRow label="状态" value={<span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColors[detail.status]}`}>{statusLabels[detail.status]}</span>} /></DetailCard>
          <DetailCard title="房间属性"><DetailRow label="连通房" value={detail.connected ? `是（关联${detail.connectedRoomNo}）` : '否'} /><DetailRow label="无障碍" value={detail.accessible ? '是' : '否'} /><DetailRow label="视线遮挡" value={detail.obstructed ? `是（${detail.obstructedNote}）` : '否'} /></DetailCard>
          {detail.maintenanceNote && <DetailCard title="维护信息"><p className="text-sm text-gray-700">{detail.maintenanceNote}</p></DetailCard>}
          <DetailCard title="操作信息"><DetailRow label="修改人" value={detail.updatedBy} /><DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} /><DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} /></DetailCard>
        </>)}
      </DetailDrawer>

      {/* 批量生成向导 */}
      {genOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[6vh]"><div className="absolute inset-0 bg-black/40" onClick={() => setGenOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-3 border-b shrink-0"><h3 className="text-base font-semibold text-gray-900">批量生成房间</h3><button onClick={() => setGenOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded"><X className="w-4 h-4" /></button></div>
            <div className="flex items-center px-6 py-3 border-b shrink-0 bg-gray-50/50 gap-3">
              {['配置规则', '预览确认'].map((l, i) => (
                <div key={i} className={`flex items-center gap-1.5 ${i <= genStep ? '' : 'opacity-40'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${i < genStep ? 'bg-gray-900 text-white' : i === genStep ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</div>
                  <span className={`text-xs font-medium ${i <= genStep ? 'text-gray-900' : 'text-gray-400'}`}>{l}</span>
                  {i === 0 && <div className={`w-16 h-px ${genStep > 0 ? 'bg-gray-900' : 'bg-gray-300'}`} />}
                </div>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {genStep === 0 ? (
                <div className="space-y-5">
                  <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基础属性</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div><label className="block text-xs text-gray-500 mb-0.5">所属游轮 <span className="text-red-500">*</span></label><select value={genShipId} onChange={(e) => setGenShipId(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"><option value="">选择</option>{ships.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                      <div><label className="block text-xs text-gray-500 mb-0.5">所属房型</label><select value={genCabinType} onChange={(e) => setGenCabinType(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"><option value="">选择</option>{(selShip?.decks.flatMap((d) => d.cabins) || []).map((c, i) => <option key={i} value={c.name}>{c.name || '未命名'}</option>)}</select></div>
                      <div><label className="block text-xs text-gray-500 mb-0.5">所在甲板</label><select value={genDeck} onChange={(e) => setGenDeck(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"><option value="">选择</option>{(selShip?.decks || []).map((d) => <option key={d.id} value={`${d.floorNum}层-${d.name}`}>{d.floorNum}层 - {d.name}</option>)}</select></div>
                      <div><label className="block text-xs text-gray-500 mb-0.5">空间位置</label><select value={genPos} onChange={(e) => setGenPos(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm">{Object.entries(posLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                    </div>
                  </div>
                  <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">命名规则</h4>
                    <div className="grid grid-cols-4 gap-3">
                      <div><label className="block text-xs text-gray-500 mb-0.5">房间号前缀</label><input value={genPrefix} onChange={(e) => setGenPrefix(e.target.value)} placeholder="如 8" className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" /></div>
                      <div><label className="block text-xs text-gray-500 mb-0.5">起始序号</label><input type="number" value={genStart} onChange={(e) => setGenStart(Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" /></div>
                      <div><label className="block text-xs text-gray-500 mb-0.5">结束序号</label><input type="number" value={genEnd} onChange={(e) => setGenEnd(Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" /></div>
                      <div className="flex items-center pt-5"><label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer"><input type="checkbox" checked={genPad} onChange={(e) => setGenPad(e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-300" />序号补零</label></div>
                    </div>
                  </div>
                  <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">生成策略</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-xs text-gray-500 mb-0.5">编号类型</label><select value={genNumType} onChange={(e) => setGenNumType(e.target.value as 'all' | 'odd' | 'even')} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"><option value="all">全部连号</option><option value="odd">仅单号（左舷）</option><option value="even">仅双号（右舷）</option></select></div>
                      <div><label className="block text-xs text-gray-500 mb-0.5">排除号码（逗号分隔）</label><input value={genExclude} onChange={(e) => setGenExclude(e.target.value)} placeholder="如 4,13,14" className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" /></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-3"><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">预览房间列表（{genRows.length} 间）</h4><span className="text-xs text-gray-400">可手动修改房间号或空间位置，点击 × 移除</span></div>
                  <table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b border-gray-200"><th className="px-3 py-2 text-left text-xs text-gray-500 w-12">序号</th><th className="px-3 py-2 text-left text-xs text-gray-500">房间号</th><th className="px-3 py-2 text-left text-xs text-gray-500">所属房型</th><th className="px-3 py-2 text-left text-xs text-gray-500">甲板</th><th className="px-3 py-2 text-left text-xs text-gray-500">空间位置</th><th className="px-3 py-2 text-center text-xs text-gray-500 w-12">操作</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">{genRows.map((r, i) => (
                      <tr key={r.key}><td className="px-3 py-2 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-3 py-2"><input value={r.roomNo} onChange={(e) => updateGenRow(i, 'roomNo', e.target.value)} className="w-full px-1 py-1 border border-gray-300 rounded text-xs font-mono" /></td>
                        <td className="px-3 py-2 text-gray-700">{r.cabinTypeName || '-'}</td><td className="px-3 py-2 text-gray-700">{r.deckName || '-'}</td>
                        <td className="px-3 py-2"><select value={r.position} onChange={(e) => updateGenRow(i, 'position', e.target.value)} className="px-1 py-1 border border-gray-300 rounded text-xs">{Object.entries(posLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
                        <td className="px-3 py-2 text-center"><button onClick={() => removeGenRow(i)} className="text-xs text-red-500 hover:bg-red-50 rounded px-1 py-0.5">×</button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-6 py-3 border-t shrink-0">
              <button onClick={() => setGenOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">取消</button>
              <div className="flex items-center gap-3">
                {genStep === 1 && <button onClick={() => setGenStep(0)} className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"><ChevronLeft className="w-4 h-4 inline mr-1" />上一步</button>}
                {genStep === 0 ? <button onClick={previewGenerate} disabled={!genShipId} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-40">预览生成</button>
                : <button onClick={confirmGenerate} disabled={genRows.length === 0} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-40">确定生成（{genRows.length}间）</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 批量改状态弹窗 */}
      {batchStatusOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"><div className="absolute inset-0 bg-black/40" onClick={() => setBatchStatusOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6"><h3 className="text-base font-semibold text-gray-900 mb-1">批量修改状态</h3><p className="text-sm text-gray-500 mb-4">已选择 {selected.size} 间</p>
            <select value={batchStatus} onChange={(e) => setBatchStatus(e.target.value as RoomStatus)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4">{Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <div className="flex justify-end gap-3"><button onClick={() => setBatchStatusOpen(false)} className="px-4 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50">取消</button><button onClick={batchUpdateStatus} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">确认</button></div>
          </div>
        </div>
      )}

      <ConfirmDialog open={confirmOpen} title="删除房间" message="确定要删除该房间吗？" danger onConfirm={confirmDelete} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}
