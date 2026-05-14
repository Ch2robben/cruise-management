import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { inventoryApi } from '@/mock/api'
import { voyages, ships, products, routes } from '@/mock/data'
import type { VoyageInventory, PaginatedResult, SearchParams, Voyage } from '@/types'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

const remaining = (r: VoyageInventory) => Math.max(0, r.totalRooms - r.sold - r.locked - r.emergencyStock)

export default function InventoryPage() {
  const [sp] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<VoyageInventory[]>([])
  const [keyword, setKeyword] = useState(sp.get('keyword') || '')
  const [voyageFilter, setVoyageFilter] = useState('all')
  const [selVoyage, setSelVoyage] = useState<Voyage | null>(null)

  // 航段切换
  const [segmentIdx, setSegmentIdx] = useState(0)
  const [selectedDate, setSelectedDate] = useState('')

  // 批量设置
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchStart, setBatchStart] = useState('')
  const [batchEnd, setBatchEnd] = useState('')
  const [batchDays, setBatchDays] = useState<string[]>([])
  const [batchLocked, setBatchLocked] = useState(0)
  const [batchEmergency, setBatchEmergency] = useState(0)

  // 从航次列表跳转
  useEffect(() => {
    const kw = sp.get('keyword')
    if (kw) {
      setKeyword(kw)
      const v = voyages.find((v) => v.voyageNo === kw)
      if (v) { setVoyageFilter(v.id); setSelVoyage(v) }
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params: SearchParams = { page: 1, pageSize: 50 }
    if (voyageFilter !== 'all') params.voyageId = voyageFilter
    const result = await inventoryApi.list(params)
    setData(result.data)
    setLoading(false)
    if (voyageFilter !== 'all') setSelVoyage(voyages.find((v) => v.id === voyageFilter) || null)
  }, [voyageFilter])

  useEffect(() => { fetchData() }, [fetchData])
  const handleSearch = () => {
    const v = voyages.find((v) => v.voyageNo.includes(keyword.trim()))
    if (v) { setVoyageFilter(v.id); setSelVoyage(v) }
    else { setVoyageFilter('all'); setSelVoyage(null) }
  }
  const handleReset = () => { setKeyword(''); setVoyageFilter('all'); setSelVoyage(null); setSegmentIdx(0); setSelectedDate('') }

  // 航段列表（从产品关联的航线取停靠港）
  const product = selVoyage ? products.find((p) => p.id === selVoyage.productId) : null
  const route = product ? routes.find((r) => r.id === product.routeId) : null
  const stopNames = route?.stops.map((s) => s.portName) || []
  const segments = stopNames.length > 1 ? ['全程', ...stopNames.slice(0, -1).map((s, i) => `${s}-${stopNames[i + 1] || stopNames[stopNames.length - 1]}`)] : ['全程']

  // 日历日期
  // 日历月视图状态
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  useEffect(() => {
    if (selVoyage) { const d = new Date(selVoyage.startDate); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()) }
  }, [selVoyage])

  // 生成完整月历网格
  const today = new Date().toISOString().slice(0, 10)
  const voyageDateSet = selVoyage ? new Set((() => {
    const dates: string[] = []
    const s = new Date(selVoyage.startDate); const e = new Date(selVoyage.endDate)
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) dates.push(d.toISOString().slice(0, 10))
    return dates
  })()) : new Set<string>()

  const buildMonthGrid = () => {
    const firstDay = new Date(calYear, calMonth, 1).getDay()
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
    const grid: (string | null)[] = []
    for (let i = 0; i < firstDay; i++) grid.push(null)
    for (let d = 1; d <= daysInMonth; d++) grid.push(`${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    while (grid.length % 7 !== 0) grid.push(null)
    return grid
  }
  const monthGrid = buildMonthGrid()
  const monthLabel = `${calYear}年${calMonth + 1}月`

  const prevMonth = () => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) } else setCalMonth(m => m - 1) }
  const nextMonth = () => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) } else setCalMonth(m => m + 1) }

  // 释放应急库存
  const releaseEmergency = async (id: string) => {
    const item = data.find((i) => i.id === id)
    if (!item || item.emergencyStock <= 0) return
    const rel = item.emergencyStock
    await inventoryApi.batchUpdate([id], { emergencyStock: 0, totalRooms: item.totalRooms + rel } as Partial<VoyageInventory>)
    fetchData()
  }

  // 批量设置
  const applyBatch = async () => {
    const ids = data.map((d) => d.id)
    await inventoryApi.batchUpdate(ids, { locked: batchLocked, emergencyStock: batchEmergency } as Partial<VoyageInventory>)
    setBatchOpen(false)
    fetchData()
  }

  return (
    <div>
      <PageHeader title={`库存看板${selVoyage ? ' · ' + selVoyage.voyageNo + ' · ' + (selVoyage.productName || '') : ''}`} description="" />
      <SearchPanel onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">航次号</label><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索航次号" className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">航次</label><select value={voyageFilter} onChange={(e) => { setVoyageFilter(e.target.value); setSelectedDate('') }} className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option>{voyages.map((v) => <option key={v.id} value={v.id}>{v.voyageNo}</option>)}</select></div>
      </SearchPanel>

      {/* 航段切换按钮组 */}
      {selVoyage && segments.length > 1 && (
        <div className="flex items-center gap-1 mb-4 bg-gray-100 rounded-lg p-0.5 w-fit">
          {segments.map((s, i) => (
            <button key={s} onClick={() => { setSegmentIdx(i); setSelectedDate('') }}
              className={`px-4 py-1.5 text-xs rounded-md transition-colors ${segmentIdx === i ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>{s}</button>
          ))}
        </div>
      )}

      <div className="flex gap-4">
        {/* 左侧日历 */}
        {selVoyage && (
          <div className="w-72 shrink-0 bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900 mb-1">{selVoyage.voyageNo}</p>
            <p className="text-xs text-gray-500 mb-3">{selVoyage.startDate} → {selVoyage.endDate} · {selVoyage.days}天</p>
            {/* 月导航 */}
            <div className="flex items-center justify-between mb-2">
              <button onClick={prevMonth} className="p-0.5 text-gray-500 hover:text-gray-900"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm font-medium text-gray-700">{monthLabel}</span>
              <button onClick={nextMonth} className="p-0.5 text-gray-500 hover:text-gray-900"><ChevronRight className="w-4 h-4" /></button>
            </div>
            {/* 月历网格 */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['日','一','二','三','四','五','六'].map((d) => <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>)}
              {monthGrid.map((d, i) => {
                if (!d) return <div key={`e${i}`} className="text-center py-1.5 rounded text-xs" />
                const isVoyage = voyageDateSet.has(d)
                const isToday = d === today
                const isSel = d === selectedDate
                return (
                  <div key={d} onClick={() => setSelectedDate(isSel ? '' : d)}
                    className={`text-center py-1.5 rounded text-xs font-medium transition-colors ${
                      isVoyage ? 'cursor-pointer border' : 'text-gray-300 cursor-default'
                    } ${
                      isSel ? 'bg-gray-900 text-white border-gray-900' :
                      isToday && isVoyage ? 'bg-blue-100 border-blue-300 text-blue-700' :
                      isVoyage ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' :
                      ''
                    }`}>{d.slice(8)}</div>
                )
              })}
            </div>
            {selectedDate && <p className="text-xs text-gray-500 mt-2 text-center">已选: {selectedDate}</p>}
            <button onClick={() => setBatchOpen(true)} className="w-full mt-3 px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50">批量设置</button>
          </div>
        )}

        {/* 右侧表格 */}
        <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 w-24">舱房类型</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 w-18">物理容量</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 w-18">总可售</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 w-16">已售</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 w-18">剩余可售</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 w-16">锁定</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 w-24">应急库存</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan={7} className="px-4 py-16 text-center text-sm text-gray-400">加载中...</td></tr>
              : !selVoyage ? <tr><td colSpan={7} className="px-4 py-16 text-center text-sm text-gray-400">选择航次查看库存</td></tr>
              : data.length === 0 ? <tr><td colSpan={7} className="px-4 py-16 text-center text-sm text-gray-400">暂无库存数据</td></tr>
              : data.map((r) => (
                <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${selectedDate ? 'opacity-100' : ''}`}>
                  <td className="px-4 py-2.5"><span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-medium">{r.cabinTypeName}</span></td>
                  <td className="px-3 py-2.5 text-center text-sm text-gray-400">{r.physicalCapacity || r.totalRooms}</td>
                  <td className="px-3 py-2.5 text-center text-sm text-gray-400">{r.totalRooms}</td>
                  <td className="px-3 py-2.5 text-center text-sm text-green-600 font-medium">{r.sold}</td>
                  <td className="px-3 py-2.5 text-center text-sm font-semibold">{remaining(r)}</td>
                  <td className="px-3 py-2.5 text-center text-sm">{r.locked > 0 ? <span className="text-red-600 font-medium">{r.locked}</span> : <span className="text-gray-300">0</span>}</td>
                  <td className="px-3 py-2.5 text-center text-sm">
                    {r.emergencyStock > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="text-orange-600 font-medium">{r.emergencyStock}</span>
                        <button onClick={() => releaseEmergency(r.id)} className="px-1.5 py-0.5 text-xs text-blue-600 hover:bg-blue-50 rounded border border-blue-200">释放</button>
                      </span>
                    ) : <span className="text-gray-300">0</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </div>

      {/* 批量设置弹窗 */}
      {batchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[6vh]"><div className="absolute inset-0 bg-black/40" onClick={() => setBatchOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-3 border-b shrink-0"><h3 className="text-base font-semibold text-gray-900">批量设置库存</h3><button onClick={() => setBatchOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-gray-700 mb-1">生效日期起</label><input type="date" value={batchStart} onChange={(e) => setBatchStart(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                <div><label className="block text-sm text-gray-700 mb-1">生效日期止</label><input type="date" value={batchEnd} onChange={(e) => setBatchEnd(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              </div>
              <div><label className="block text-sm text-gray-700 mb-1">生效星期</label><div className="flex gap-2">{['周一','周二','周三','周四','周五','周六','周日'].map((d) => (
                <label key={d} className={`px-2 py-1 border rounded text-xs cursor-pointer ${batchDays.includes(d) ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600'}`}><input type="checkbox" checked={batchDays.includes(d)} onChange={() => setBatchDays((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p, d])} className="sr-only" />{d}</label>
              ))}</div></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-gray-700 mb-1">锁定数量</label><input type="number" value={batchLocked} onChange={(e) => setBatchLocked(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                <div><label className="block text-sm text-gray-700 mb-1">应急库存</label><input type="number" value={batchEmergency} onChange={(e) => setBatchEmergency(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-3 border-t shrink-0"><button onClick={() => setBatchOpen(false)} className="px-4 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50">取消</button><button onClick={applyBatch} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">应用</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
