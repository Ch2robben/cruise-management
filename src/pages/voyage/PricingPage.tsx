import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { priceApi } from '@/mock/api'
import { voyages, products, routes, ships } from '@/mock/data'
import type { VoyagePrice, Voyage } from '@/types'
import { formatDateTime } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'

export default function PricingPage() {
  const [sp] = useSearchParams()
  const [voyageId, setVoyageId] = useState(sp.get('id') || '')
  const [priceData, setPriceData] = useState<VoyagePrice[]>([])
  const [segment, setSegment] = useState(0)
  const [selDate, setSelDate] = useState('')

  // 月历
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())

  const voyage = voyages.find((v) => v.id === voyageId) || null
  const product = voyage ? products.find((p) => p.id === voyage.productId) : null
  const route = product ? routes.find((r) => r.id === product.routeId) : null
  const stopNames = route?.stops.map((s) => s.portName) || []
  const segments = stopNames.length > 1 ? ['全程', ...stopNames.slice(0, -1).map((s, i) => `${s}-${stopNames[i + 1]}`)] : ['全程']
  const cabins = [...new Set(priceData.map((p) => p.cabinTypeName))]
  const ticketTypes = ['成人票', '儿童票', '婴儿票', '基准价']
  const ticketFields = ['adultPrice', 'childPrice', 'babyPrice', 'basePrice']

  useEffect(() => {
    if (voyageId) {
      priceApi.list({ voyageId, pageSize: 100 }).then((r) => setPriceData(r.data))
      const v = voyages.find((v) => v.id === voyageId)
      if (v) { const d = new Date(v.startDate); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); setSelDate(v.startDate) }
    }
  }, [voyageId])

  // 月历
  const today = new Date().toISOString().slice(0, 10)
  const voyageDates = voyage ? new Set((() => {
    const d: string[] = []; const s = new Date(voyage.startDate); const e = new Date(voyage.endDate)
    for (let c = new Date(s); c <= e; c.setDate(c.getDate() + 1)) d.push(c.toISOString().slice(0, 10)); return d
  })()) : new Set<string>()
  const buildGrid = () => {
    const fd = new Date(calYear, calMonth, 1).getDay()
    const dim = new Date(calYear, calMonth + 1, 0).getDate()
    const g: (string | null)[] = []
    for (let i = 0; i < fd; i++) g.push(null)
    for (let d = 1; d <= dim; d++) g.push(`${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    while (g.length % 7 !== 0) g.push(null)
    return g
  }
  const pm = () => { if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11) } else setCalMonth((m) => m - 1) }
  const nm = () => { if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0) } else setCalMonth((m) => m + 1) }

  // 获取价格
  const gp = (cabin: string, field: string) => {
    const p = priceData.find((p) => p.cabinTypeName === cabin && p.date === selDate)
    return p ? (p as any)[field] || '-' : '-'
  }

  // 更新价格
  const setPrice = (cabin: string, field: string, val: number) => {
    setPriceData((prev) => prev.map((p) => p.cabinTypeName === cabin && p.date === selDate ? { ...p, [field]: val } : p))
  }

  const saveAll = async () => { for (const p of priceData) await priceApi.update(p.id, p) }

  // 批量
  const [batchOpen, setBatchOpen] = useState(false)
  const [bStart, setBStart] = useState('')
  const [bEnd, setBEnd] = useState('')
  const [bSegment, setBSegment] = useState(0)
  const [bDays, setBDays] = useState<string[]>([])
  const [bValues, setBValues] = useState<Record<string, number>>({ adultPrice: 0, childPrice: 0, babyPrice: 0, basePrice: 0 })

  // 价格日志
  const [logOpen, setLogOpen] = useState(false)
  const logEntries = priceData.slice(0, 5).map((p) => ({ obj: `${p.cabinTypeName} ${p.date}`, time: p.updatedAt, user: p.updatedBy }))

  return (
    <div>
      <PageHeader title={`价格日历${voyage ? ' · ' + voyage.voyageNo + ' · ' + (voyage.productName || '') : ''}`} description="" />
      {!voyageId ? (
        <div className="bg-white border rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">请从航次列表点击「定价」进入此页面</p>
          <select value={voyageId} onChange={(e) => setVoyageId(e.target.value)} className="px-4 py-2 border rounded-lg text-sm">
            <option value="">选择航次</option>
            {voyages.map((v) => <option key={v.id} value={v.id}>{v.voyageNo}</option>)}
          </select>
        </div>
      ) : (
        <>
          {/* 航段切换 */}
          <div className="flex items-center gap-1 mb-4 bg-gray-100 rounded-lg p-0.5 w-fit">
            {segments.map((s, i) => (
              <button key={s} onClick={() => setSegment(i)} className={`px-4 py-1.5 text-xs rounded-md ${segment === i ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>{s}</button>
            ))}
          </div>

          <div className="flex gap-4">
            {/* 左：月历 */}
            <div className="w-72 shrink-0 bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <button onClick={pm} className="p-0.5 text-gray-500 hover:text-gray-900"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm font-medium">{calYear}年{calMonth + 1}月</span>
                <button onClick={nm} className="p-0.5 text-gray-500 hover:text-gray-900"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['日','一','二','三','四','五','六'].map((d) => <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>)}
                {buildGrid().map((d, i) => {
                  if (!d) return <div key={`e${i}`} />
                  const isV = voyageDates.has(d); const isT = d === today; const isS = d === selDate
                  return <div key={d} onClick={() => isV && setSelDate(d)}
                    className={`text-center py-1.5 rounded text-xs font-medium transition-colors ${isV ? 'cursor-pointer' : 'text-gray-300 cursor-default'} ${isS ? 'bg-gray-900 text-white' : isT && isV ? 'bg-blue-100 text-blue-700' : isV ? 'bg-green-50 text-green-700 hover:bg-green-100' : ''}`}>{d.slice(8)}</div>
                })}
              </div>
              <div className="flex gap-4 text-xs text-gray-400 mt-3"><span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-50 border border-green-200" /> 航次</span><span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200" /> 非航次</span></div>
              {selDate && <p className="text-xs text-gray-500 mt-2">已选: {selDate}</p>}
            </div>

            {/* 右：价格表格 */}
            <div className="flex-1 bg-white border rounded-lg overflow-hidden">
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b"><th className="px-3 py-2 text-left text-xs text-gray-500">舱房</th>{ticketTypes.map((t) => <th key={t} className="px-3 py-2 text-right text-xs text-gray-500">{t}</th>)}</tr></thead>
                <tbody className="divide-y">
                  {cabins.map((c) => (
                    <tr key={c}>
                      <td className="px-3 py-2 font-medium text-gray-700 text-xs">{c}</td>
                      {ticketFields.map((f, fi) => (
                        <td key={f} className="px-3 py-2">
                          <input type="number" value={gp(c, f)} onChange={(e) => setPrice(c, f, Number(e.target.value))} disabled={!selDate} className="w-full px-2 py-1.5 border rounded text-xs text-center disabled:bg-gray-50 disabled:text-gray-300" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          </div>

          {/* 底部：价格日志 + 操作 */}
          <div className="flex items-center justify-between mt-4">
            <button onClick={() => setLogOpen(true)} className="text-xs text-gray-500 hover:text-gray-700 underline">查看价格日志</button>
            <div className="flex gap-3">
              <button onClick={() => setBatchOpen(true)} className="px-4 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50">批量设置</button>
              <button onClick={saveAll} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">保存定价</button>
            </div>
          </div>

          {/* 批量设置弹窗 */}
          {batchOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center"><div className="absolute inset-0 bg-black/40" onClick={() => setBatchOpen(false)} />
              <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6"><h3 className="text-base font-semibold mb-4">批量调价</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm mb-1">生效日期起</label><input type="date" value={bStart} onChange={(e) => setBStart(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div><div><label className="block text-sm mb-1">生效日期止</label><input type="date" value={bEnd} onChange={(e) => setBEnd(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div></div>
                  <div><label className="block text-sm mb-1">生效航段</label><select value={bSegment} onChange={(e) => setBSegment(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm">{segments.map((s, i) => <option key={s} value={i}>{s}</option>)}</select></div>
                  <div><label className="block text-sm mb-1">生效星期</label><div className="flex gap-2">{['周一','周二','周三','周四','周五','周六','周日'].map((d) => <label key={d} className={`px-2 py-1 border rounded text-xs cursor-pointer ${bDays.includes(d) ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600'}`}><input type="checkbox" checked={bDays.includes(d)} onChange={() => setBDays((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p, d])} className="sr-only" />{d}</label>)}</div></div>
                  <table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b"><th className="px-3 py-2 text-left text-xs text-gray-500">舱房</th>{ticketTypes.map((t) => <th key={t} className="px-3 py-2 text-right text-xs text-gray-500">{t}</th>)}</tr></thead><tbody>{cabins.map((c) => <tr key={c}><td className="px-3 py-2 text-xs">{c}</td>{ticketFields.map((f) => <td key={f} className="px-3 py-2"><input type="number" value={bValues[f] || 0} onChange={(e) => setBValues({ ...bValues, [f]: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-xs text-center" /></td>)}</tr>)}</tbody></table>
                </div>
                <div className="flex justify-end gap-3 mt-6"><button onClick={() => setBatchOpen(false)} className="px-4 py-2 text-sm border rounded-lg text-gray-700">取消</button><button onClick={() => setBatchOpen(false)} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg">应用</button></div>
              </div>
            </div>
          )}

          {/* 价格日志弹窗 */}
          {logOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center"><div className="absolute inset-0 bg-black/40" onClick={() => setLogOpen(false)} />
              <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6"><h3 className="text-base font-semibold mb-4">价格日志</h3>
                <table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b"><th className="px-3 py-2 text-left text-xs text-gray-500">操作对象</th><th className="px-3 py-2 text-left text-xs text-gray-500">操作时间</th><th className="px-3 py-2 text-left text-xs text-gray-500">操作人</th></tr></thead><tbody className="divide-y">{logEntries.map((l, i) => <tr key={i}><td className="px-3 py-2 text-xs">{l.obj}</td><td className="px-3 py-2 text-xs text-gray-500">{formatDateTime(l.time)}</td><td className="px-3 py-2 text-xs">{l.user}</td></tr>)}</tbody></table>
                <button onClick={() => setLogOpen(false)} className="mt-4 w-full px-4 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50">关闭</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
