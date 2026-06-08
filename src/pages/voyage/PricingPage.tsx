import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { priceApi } from '@/mock/api'
import { voyages, products, routes, ships } from '@/mock/data'
import type { VoyagePrice } from '@/types'
import { formatDateTime } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'

type TicketPriceField = 'adultPrice' | 'childPrice' | 'babyPrice'
type PriceDetailField = 'retailPrice' | 'contractPrice' | 'settlementPrice' | 'portPrice'
type PriceDetailValues = Record<PriceDetailField, number>

export default function PricingPage() {
  const [sp] = useSearchParams()
  const initialVoyageId = sp.get('id') || ''
  const initialVoyage = voyages.find((v) => v.id === initialVoyageId)
  const [voyageId, setVoyageId] = useState(initialVoyageId)
  const [productFilter, setProductFilter] = useState(initialVoyage?.productId || 'all')
  const [routeFilter, setRouteFilter] = useState(initialVoyage?.routeId || 'all')
  const [shipFilter, setShipFilter] = useState(initialVoyage?.shipId || 'all')
  const [directionFilter, setDirectionFilter] = useState<'all' | 'upstream' | 'downstream'>(initialVoyage?.direction || 'all')
  const [keyword, setKeyword] = useState('')
  const [priceData, setPriceData] = useState<VoyagePrice[]>([])
  const [selDate, setSelDate] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // 月历
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())

  const filteredVoyages = useMemo(() => voyages.filter((v) => {
    const matchedProduct = productFilter === 'all' || v.productId === productFilter
    const matchedRoute = routeFilter === 'all' || v.routeId === routeFilter
    const matchedShip = shipFilter === 'all' || v.shipId === shipFilter
    const matchedDirection = directionFilter === 'all' || v.direction === directionFilter
    const kw = keyword.trim().toLowerCase()
    const matchedKeyword = !kw || [v.voyageNo, v.productName, v.routeName, v.shipName].some((text) => text.toLowerCase().includes(kw))
    return matchedProduct && matchedRoute && matchedShip && matchedDirection && matchedKeyword
  }), [directionFilter, keyword, productFilter, routeFilter, shipFilter])

  const voyageDatesByDate = useMemo(() => filteredVoyages.reduce<Record<string, typeof filteredVoyages>>((acc, v) => {
    acc[v.startDate] = [...(acc[v.startDate] || []), v]
    return acc
  }, {}), [filteredVoyages])

  const voyage = filteredVoyages.find((v) => v.id === voyageId) || filteredVoyages.find((v) => v.startDate === selDate) || filteredVoyages[0] || null
  const product = voyage ? products.find((p) => p.id === voyage.productId) : null
  const route = product ? routes.find((r) => r.id === product.routeId) : null
  const stopNames = route?.stops.map((s) => s.portName) || []
  const segments = stopNames.length > 1 ? ['全程', ...stopNames.slice(0, -1).map((s, i) => `${s}-${stopNames[i + 1]}`)] : ['全程']
  const cabins = [...new Set(priceData.map((p) => p.cabinTypeName))]
  const visibleTicketField: TicketPriceField = 'adultPrice'
  const priceTypes: { field: PriceDetailField; label: string }[] = [
    { field: 'retailPrice', label: '零售价' },
    { field: 'contractPrice', label: '签约价' },
    { field: 'settlementPrice', label: '结算价' },
    { field: 'portPrice', label: '口岸价' },
  ]

  useEffect(() => {
    const next = filteredVoyages.find((v) => v.id === voyageId) || filteredVoyages[0]
    if (!next) {
      setVoyageId('')
      setSelDate('')
      setPriceData([])
      return
    }
    if (next.id !== voyageId) setVoyageId(next.id)
    setSelDate(next.startDate)
    const d = new Date(next.startDate)
    setCalYear(d.getFullYear())
    setCalMonth(d.getMonth())
  }, [directionFilter, keyword, productFilter, routeFilter, shipFilter])

  useEffect(() => {
    if (!voyage?.id) {
      setPriceData([])
      return
    }
    priceApi.list({ voyageId: voyage.id, pageSize: 100 }).then((r) => setPriceData(r.data))
  }, [voyage?.id])

  // 月历
  const today = new Date().toISOString().slice(0, 10)
  const voyageDates = new Set(Object.keys(voyageDatesByDate))
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

  const selectDate = (date: string) => {
    const next = voyageDatesByDate[date]?.[0]
    if (!next) return
    setVoyageId(next.id)
    setSelDate(date)
    setIsEditing(false)
  }

  const defaultPriceDetails = (base: number): PriceDetailValues => ({
    retailPrice: Math.round(base * 1.15),
    contractPrice: Math.round(base * 1.05),
    settlementPrice: base,
    portPrice: Math.round(base * 1.08),
  })

  // 获取价格
  const gp = (segmentName: string, cabin: string, ticketField: TicketPriceField, priceField: PriceDetailField) => {
    const p = priceData.find((p) => p.cabinTypeName === cabin && p.date === selDate)
    if (!p) return '-'
    const base = p[ticketField] || 0
    const segmentDetails = segmentName === '全程' ? undefined : p.segmentPriceDetails?.[segmentName]?.[ticketField]
    return segmentDetails?.[priceField] ?? p.priceDetails?.[ticketField]?.[priceField] ?? defaultPriceDetails(base)[priceField]
  }

  const formatPrice = (value: string | number) => value === '-' ? '-' : `¥${Number(value).toLocaleString()}`

  // 更新价格
  const setPrice = (segmentName: string, cabin: string, ticketField: TicketPriceField, priceField: PriceDetailField, val: number) => {
    setPriceData((prev) => prev.map((p) => {
      if (p.cabinTypeName !== cabin || p.date !== selDate) return p
      const baseDetails = defaultPriceDetails(p[ticketField] || 0)
      if (segmentName !== '全程') {
        return {
          ...p,
          segmentPriceDetails: {
            ...p.segmentPriceDetails,
            [segmentName]: {
              ...p.segmentPriceDetails?.[segmentName],
              [ticketField]: {
                ...baseDetails,
                ...p.priceDetails?.[ticketField],
                ...p.segmentPriceDetails?.[segmentName]?.[ticketField],
                [priceField]: val,
              },
            },
          },
        }
      }
      return {
        ...p,
        priceDetails: {
          ...p.priceDetails,
          [ticketField]: {
            ...baseDetails,
            ...p.priceDetails?.[ticketField],
            [priceField]: val,
          },
        },
      }
    }))
  }

  const saveAll = async () => {
    for (const p of priceData) await priceApi.update(p.id, p)
    setIsEditing(false)
  }

  // 批量
  const [batchOpen, setBatchOpen] = useState(false)
  const [bStart, setBStart] = useState('')
  const [bEnd, setBEnd] = useState('')
  const [bSegment, setBSegment] = useState('all')
  const [bDays, setBDays] = useState<string[]>([])
  const [bValues, setBValues] = useState<Record<string, string>>({})

  const applyBatch = () => {
    const dayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    setPriceData((prev) => prev.map((row) => {
      const inRange = (!bStart || row.date >= bStart) && (!bEnd || row.date <= bEnd)
      const weekdayMatched = bDays.length === 0 || bDays.includes(dayLabels[new Date(row.date).getDay()])
      if (!inRange || !weekdayMatched) return row

      let nextRow = row
      let changed = false
      const targetSegments = bSegment === 'all' ? segments : [segments[Number(bSegment)]]

      targetSegments.forEach((segmentName) => {
        if (segmentName === '全程') {
          const nextDetails = { ...nextRow.priceDetails }
          let ticketChanged = false
          const baseDetails = defaultPriceDetails(nextRow[visibleTicketField] || 0)
          const nextTicketDetails = { ...baseDetails, ...nextDetails[visibleTicketField] }
          priceTypes.forEach((priceType) => {
            const key = `${row.cabinTypeName}.${priceType.field}`
            if (bValues[key] === undefined || bValues[key] === '') return
            nextTicketDetails[priceType.field] = Number(bValues[key])
            changed = true
            ticketChanged = true
          })
          if (ticketChanged) nextDetails[visibleTicketField] = nextTicketDetails
          nextRow = { ...nextRow, priceDetails: nextDetails }
          return
        }

        const nextSegmentPriceDetails = { ...nextRow.segmentPriceDetails }
        const nextSegmentDetails = { ...nextSegmentPriceDetails[segmentName] }
        let ticketChanged = false
        const baseDetails = defaultPriceDetails(nextRow[visibleTicketField] || 0)
        const nextTicketDetails = { ...baseDetails, ...nextRow.priceDetails?.[visibleTicketField], ...nextSegmentDetails[visibleTicketField] }
        priceTypes.forEach((priceType) => {
          const key = `${row.cabinTypeName}.${priceType.field}`
          if (bValues[key] === undefined || bValues[key] === '') return
          nextTicketDetails[priceType.field] = Number(bValues[key])
          changed = true
          ticketChanged = true
        })
        if (ticketChanged) nextSegmentDetails[visibleTicketField] = nextTicketDetails
        nextSegmentPriceDetails[segmentName] = nextSegmentDetails
        nextRow = { ...nextRow, segmentPriceDetails: nextSegmentPriceDetails }
      })

      return changed ? nextRow : row
    }))
    setBatchOpen(false)
  }

  const logEntries = priceData.slice(0, 5).map((p) => ({ obj: `${p.cabinTypeName} ${p.date}`, time: p.updatedAt, user: p.updatedBy }))

  return (
    <div>
      <PageHeader title="价格日历" description="" />

      <div className="bg-white border rounded-lg p-4 mb-4">
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">产品</label>
            <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="all">全部产品</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">航线</label>
            <select value={routeFilter} onChange={(e) => setRouteFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="all">全部航线</option>
              {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">游轮</label>
            <select value={shipFilter} onChange={(e) => setShipFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="all">全部游轮</option>
              {ships.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">上下水</label>
            <select value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value as 'all' | 'upstream' | 'downstream')} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="all">全部</option>
              <option value="downstream">下水</option>
              <option value="upstream">上水</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">关键词</label>
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="航次号/产品/航线/游轮" className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <span>共匹配 {filteredVoyages.length} 个航次，日历绿色日期为开航日期</span>
          {voyage && <span>当前航次：<b className="text-gray-900">{voyage.voyageNo}</b> · {voyage.productName} · {voyage.startDate}</span>}
        </div>
      </div>

      {!voyage ? (
        <div className="bg-white border rounded-lg p-10 text-center text-sm text-gray-500">
          当前筛选条件下暂无航次，请调整产品、航线或游轮条件。
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            {isEditing ? (
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50">退出编辑</button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">编辑定价</button>
            )}
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
                  return <div key={d} onClick={() => isV && selectDate(d)}
                    className={`relative text-center py-1.5 rounded text-xs font-medium transition-colors ${isV ? 'cursor-pointer' : 'text-gray-300 cursor-default'} ${isS ? 'bg-gray-900 text-white' : isT && isV ? 'bg-blue-100 text-blue-700' : isV ? 'bg-green-50 text-green-700 hover:bg-green-100' : ''}`}>
                    {d.slice(8)}
                    {voyageDatesByDate[d]?.length > 1 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-blue-600 text-[10px] leading-4 text-white">{voyageDatesByDate[d].length}</span>}
                  </div>
                })}
              </div>
              <div className="flex gap-4 text-xs text-gray-400 mt-3"><span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-50 border border-green-200" /> 航次</span><span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200" /> 非航次</span></div>
              {selDate && <p className="text-xs text-gray-500 mt-2">已选: {selDate} · {voyage.voyageNo}</p>}
            </div>

            {/* 右：价格表格 */}
            <div className="flex-1 bg-white border rounded-lg overflow-hidden">
              <div className="overflow-x-auto"><table className="w-full min-w-[1600px] text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th rowSpan={2} className="w-36 px-3 py-2 text-left text-xs text-gray-500">舱房</th>
                    {segments.map((segmentName) => (
                      <th key={segmentName} colSpan={priceTypes.length} className="border-l border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-600">{segmentName}</th>
                    ))}
                  </tr>
                  <tr className="bg-gray-50 border-b">
                    {segments.flatMap((segmentName) => priceTypes.map((priceType) => (
                      <th key={`${segmentName}-${priceType.field}`} className="border-l border-gray-200 px-3 py-2 text-right text-xs font-medium text-gray-500">{priceType.label}</th>
                    )))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cabins.map((c) => (
                    <tr key={c}>
                      <td className="px-3 py-2 font-medium text-gray-700 text-xs">{c}</td>
                      {segments.flatMap((segmentName) => priceTypes.map((priceType) => {
                        const price = gp(segmentName, c, visibleTicketField, priceType.field)
                        return (
                          <td key={`${segmentName}-${priceType.field}`} className="border-l border-gray-100 px-3 py-2">
                            {isEditing ? (
                              <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(segmentName, c, visibleTicketField, priceType.field, Number(e.target.value))}
                                disabled={!selDate}
                                className="w-full min-w-[96px] px-2 py-1.5 border rounded text-sm text-right tabular-nums text-gray-900 disabled:bg-gray-50 disabled:text-gray-400"
                              />
                            ) : (
                              <div className="min-w-[96px] text-right text-sm font-semibold text-gray-900 tabular-nums">
                                {formatPrice(price)}
                              </div>
                            )}
                          </td>
                        )
                      }))}
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          </div>

          <div className="mt-4 bg-white border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h3 className="text-sm font-semibold text-gray-900">价格日志</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">操作对象</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">操作时间</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">操作人</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logEntries.map((l, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 text-xs text-gray-700">{l.obj}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">{formatDateTime(l.time)}</td>
                    <td className="px-4 py-2 text-xs text-gray-700">{l.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isEditing && (
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setBatchOpen(true)} className="px-4 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50">批量设置</button>
              <button onClick={saveAll} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">保存定价</button>
            </div>
          )}

          {/* 批量设置弹窗 */}
          {batchOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center"><div className="absolute inset-0 bg-black/40" onClick={() => setBatchOpen(false)} />
              <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 p-6 max-h-[86vh] overflow-y-auto"><h3 className="text-base font-semibold mb-4">批量调价</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm mb-1">生效日期起</label><input type="date" value={bStart} onChange={(e) => setBStart(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div><div><label className="block text-sm mb-1">生效日期止</label><input type="date" value={bEnd} onChange={(e) => setBEnd(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div></div>
                  <div>
                    <label className="block text-sm mb-1">生效航段</label>
                    <select value={bSegment} onChange={(e) => setBSegment(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                      <option value="all">全部航段</option>
                      {segments.map((s, i) => <option key={s} value={i}>{s}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm mb-1">生效星期</label><div className="flex gap-2">{['周一','周二','周三','周四','周五','周六','周日'].map((d) => <label key={d} className={`px-2 py-1 border rounded text-xs cursor-pointer ${bDays.includes(d) ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600'}`}><input type="checkbox" checked={bDays.includes(d)} onChange={() => setBDays((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p, d])} className="sr-only" />{d}</label>)}</div></div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-3 py-2 text-left text-xs text-gray-500">舱房</th>
                          {priceTypes.map((priceType) => <th key={priceType.field} className="border-l border-gray-200 px-3 py-2 text-right text-xs text-gray-500">{priceType.label}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {cabins.map((c) => (
                          <tr key={c}>
                            <td className="px-3 py-2 text-xs">{c}</td>
                            {priceTypes.map((priceType) => {
                              const key = `${c}.${priceType.field}`
                              return (
                                <td key={key} className="border-l border-gray-100 px-2 py-2">
                                  <input
                                    type="number"
                                    value={bValues[key] ?? ''}
                                    onChange={(e) => setBValues({ ...bValues, [key]: e.target.value })}
                                    placeholder="-"
                                    className="w-full min-w-[76px] px-2 py-1 border rounded text-xs text-right tabular-nums"
                                  />
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6"><button onClick={() => setBatchOpen(false)} className="px-4 py-2 text-sm border rounded-lg text-gray-700">取消</button><button onClick={applyBatch} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg">应用</button></div>
              </div>
            </div>
          )}

        </>
      )}
    </div>
  )
}
