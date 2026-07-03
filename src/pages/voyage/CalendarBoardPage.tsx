import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { inventoryApi, priceApi } from '@/mock/api'
import { products, routes, ships, voyages } from '@/mock/data'
import type { Product, ProductSegment, Voyage, VoyageInventory, VoyagePrice } from '@/types'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'

const voyageStatusLabels: Record<string, string> = {
  ticketing: '售票',
  suspended: '停航',
  chartered: '包租',
  deadhead: '空放',
  pending: '待定',
  transfer: '转船',
}

const inventoryStatusLabels: Record<string, string> = {
  enabled: '开放',
  disabled: '关闭',
}

interface SegmentTab {
  key: string
  label: string
  segment?: ProductSegment
}

interface SegmentPriceView {
  settlement: number
  retail: number
  contract: number
  port: number
}

interface SegmentInventoryView extends VoyageInventory {
  displayTotalRooms: number
  displaySold: number
  displayAvailable: number
}

const segmentKeyOf = (segment: ProductSegment) => `${segment.startPort}-${segment.endPort}`

function getProduct(voyage?: Voyage) {
  if (!voyage) return undefined
  return products.find((item) => item.id === voyage.productId)
}

function createSegmentTabs(product?: Product): SegmentTab[] {
  if (!product) return [{ key: 'whole', label: '全航线' }]
  return [
    { key: 'whole', label: `全航线 ${product.startPort}-${product.endPort}` },
    ...product.segments.map((segment) => ({
      key: segmentKeyOf(segment),
      label: segmentKeyOf(segment),
      segment,
    })),
  ]
}

function getSettlementPrice(row: VoyagePrice) {
  return row.priceDetails?.adultPrice?.settlementPrice ?? row.adultPrice
}

function resolveSegmentPrice(row: VoyagePrice, selectedSegmentKey: string, product?: Product): SegmentPriceView {
  const wholeSettlement = getSettlementPrice(row)
  const wholeDetails = row.priceDetails?.adultPrice
  const wholeView: SegmentPriceView = {
    settlement: wholeSettlement,
    retail: wholeDetails?.retailPrice ?? Math.round(wholeSettlement * 1.15),
    contract: wholeDetails?.contractPrice ?? Math.round(wholeSettlement * 1.05),
    port: wholeDetails?.portPrice ?? Math.round(wholeSettlement * 1.08),
  }
  if (selectedSegmentKey === 'whole') return wholeView

  const segmentDetails = row.segmentPriceDetails?.[selectedSegmentKey]?.adultPrice
  if (segmentDetails?.settlementPrice) {
    return {
      settlement: segmentDetails.settlementPrice,
      retail: segmentDetails.retailPrice ?? Math.round(segmentDetails.settlementPrice * 1.15),
      contract: segmentDetails.contractPrice ?? Math.round(segmentDetails.settlementPrice * 1.05),
      port: segmentDetails.portPrice ?? Math.round(segmentDetails.settlementPrice * 1.08),
    }
  }

  const productPrice = product?.pricing.find(
    (item) => item.segmentKey === selectedSegmentKey && item.cabinType === row.cabinTypeName,
  )
  if (productPrice) {
    const settlement = productPrice.basePrice
    return {
      settlement,
      retail: Math.round(settlement * 1.15),
      contract: Math.round(settlement * 1.05),
      port: Math.round(settlement * 1.08),
    }
  }

  return wholeView
}

function scaleInventoryBySegment(
  row: VoyageInventory,
  tab: SegmentTab,
  index: number,
): SegmentInventoryView {
  if (!tab.segment) {
    return {
      ...row,
      displayTotalRooms: row.totalRooms,
      displaySold: row.sold,
      displayAvailable: getAvailableRooms(row),
    }
  }

  const segmentOffset = Math.max(1, index)
  const releaseQuantity = Math.max(0, row.totalRooms - segmentOffset * 3)
  const sold = Math.min(row.sold, releaseQuantity)
  const locked = Math.min(row.locked, Math.max(0, releaseQuantity - sold))
  const maintenance = Math.min(row.maintenance, Math.max(0, releaseQuantity - sold - locked))
  const scopedRow = { ...row, totalRooms: releaseQuantity, sold, locked, maintenance }

  return {
    ...scopedRow,
    displayTotalRooms: releaseQuantity,
    displaySold: sold,
    displayAvailable: getAvailableRooms(scopedRow),
  }
}

function buildMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const grid: Array<string | null> = []
  for (let index = 0; index < firstDay; index += 1) grid.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) {
    grid.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
  }
  while (grid.length % 7 !== 0) grid.push(null)
  return grid
}

function getAvailableRooms(row: VoyageInventory) {
  return Math.max(0, row.totalRooms - row.sold - row.locked - row.maintenance)
}

export default function CalendarBoardPage() {
  const navigate = useNavigate()
  const [productFilter, setProductFilter] = useState('all')
  const [routeFilter, setRouteFilter] = useState('all')
  const [shipFilter, setShipFilter] = useState('all')
  const [directionFilter, setDirectionFilter] = useState<'all' | 'upstream' | 'downstream'>('all')
  const [keyword, setKeyword] = useState('')
  const [appliedFilters, setAppliedFilters] = useState({
    productFilter: 'all',
    routeFilter: 'all',
    shipFilter: 'all',
    directionFilter: 'all' as 'all' | 'upstream' | 'downstream',
    keyword: '',
  })

  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedVoyageId, setSelectedVoyageId] = useState('')
  const [activeTab, setActiveTab] = useState<'price' | 'inventory'>('price')
  const [selectedSegmentKey, setSelectedSegmentKey] = useState('whole')
  const [priceRows, setPriceRows] = useState<VoyagePrice[]>([])
  const [inventoryRows, setInventoryRows] = useState<VoyageInventory[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)

  const filteredVoyages = useMemo(() => voyages.filter((voyage) => {
    const matchedProduct = appliedFilters.productFilter === 'all' || voyage.productId === appliedFilters.productFilter
    const matchedRoute = appliedFilters.routeFilter === 'all' || voyage.routeId === appliedFilters.routeFilter
    const matchedShip = appliedFilters.shipFilter === 'all' || voyage.shipId === appliedFilters.shipFilter
    const matchedDirection = appliedFilters.directionFilter === 'all' || voyage.direction === appliedFilters.directionFilter
    const kw = appliedFilters.keyword.trim().toLowerCase()
    const matchedKeyword = !kw || [voyage.voyageNo, voyage.productName, voyage.routeName, voyage.shipName]
      .some((text) => text.toLowerCase().includes(kw))
    return matchedProduct && matchedRoute && matchedShip && matchedDirection && matchedKeyword
  }), [appliedFilters])

  const voyagesByDate = useMemo(() => filteredVoyages.reduce<Record<string, Voyage[]>>((acc, voyage) => {
    acc[voyage.startDate] = [...(acc[voyage.startDate] || []), voyage]
    return acc
  }, {}), [filteredVoyages])

  const voyageDates = useMemo(() => new Set(Object.keys(voyagesByDate)), [voyagesByDate])

  const dateVoyages = selectedDate ? voyagesByDate[selectedDate] || [] : []
  const selectedVoyage = dateVoyages.find((item) => item.id === selectedVoyageId) || dateVoyages[0]
  const selectedProduct = useMemo(() => getProduct(selectedVoyage), [selectedVoyage])
  const segmentTabs = useMemo(() => createSegmentTabs(selectedProduct), [selectedProduct])
  const selectedSegmentTab = segmentTabs.find((tab) => tab.key === selectedSegmentKey) || segmentTabs[0]
  const selectedSegmentIndex = Math.max(0, segmentTabs.findIndex((tab) => tab.key === selectedSegmentKey))

  useEffect(() => {
    setSelectedSegmentKey('whole')
  }, [selectedVoyage?.id])

  useEffect(() => {
    if (!selectedDate) return
    const next = voyagesByDate[selectedDate]?.[0]
    if (!next) {
      setSelectedVoyageId('')
      return
    }
    if (!dateVoyages.some((item) => item.id === selectedVoyageId)) {
      setSelectedVoyageId(next.id)
    }
  }, [dateVoyages, selectedDate, selectedVoyageId, voyagesByDate])

  useEffect(() => {
    if (!selectedVoyage?.id) {
      setPriceRows([])
      setInventoryRows([])
      return
    }
    let cancelled = false
    setLoadingDetail(true)
    Promise.all([
      priceApi.list({ voyageId: selectedVoyage.id, pageSize: 100 }),
      inventoryApi.list({ voyageId: selectedVoyage.id, pageSize: 100 }),
    ]).then(([priceResult, inventoryResult]) => {
      if (cancelled) return
      setPriceRows(priceResult.data)
      setInventoryRows(inventoryResult.data)
    }).finally(() => {
      if (!cancelled) setLoadingDetail(false)
    })
    return () => {
      cancelled = true
    }
  }, [selectedVoyage?.id])

  useEffect(() => {
    if (selectedDate) return
    const firstDate = Object.keys(voyagesByDate).sort()[0]
    if (!firstDate) return
    setSelectedDate(firstDate)
    const date = new Date(firstDate)
    setCalYear(date.getFullYear())
    setCalMonth(date.getMonth())
  }, [selectedDate, voyagesByDate])

  const today = new Date().toISOString().slice(0, 10)
  const calendarGrid = buildMonthGrid(calYear, calMonth)

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalYear((year) => year - 1)
      setCalMonth(11)
      return
    }
    setCalMonth((month) => month - 1)
  }

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalYear((year) => year + 1)
      setCalMonth(0)
      return
    }
    setCalMonth((month) => month + 1)
  }

  const selectDate = (date: string) => {
    if (!voyageDates.has(date)) return
    setSelectedDate(date)
    setSelectedVoyageId(voyagesByDate[date]?.[0]?.id || '')
  }

  const displayInventoryRows = useMemo(
    () => inventoryRows.map((row) => scaleInventoryBySegment(row, selectedSegmentTab, selectedSegmentIndex)),
    [inventoryRows, selectedSegmentTab, selectedSegmentIndex],
  )

  const priceSummary = useMemo(() => {
    if (priceRows.length === 0) return { min: 0, max: 0 }
    const values = priceRows.map((row) => resolveSegmentPrice(row, selectedSegmentKey, selectedProduct).settlement)
    return { min: Math.min(...values), max: Math.max(...values) }
  }, [priceRows, selectedSegmentKey, selectedProduct])

  const inventorySummary = useMemo(() => {
    const totalRooms = displayInventoryRows.reduce((sum, row) => sum + row.displayTotalRooms, 0)
    const sold = displayInventoryRows.reduce((sum, row) => sum + row.displaySold, 0)
    const available = displayInventoryRows.reduce((sum, row) => sum + row.displayAvailable, 0)
    return { totalRooms, sold, available }
  }, [displayInventoryRows])

  const getDateSummary = (date: string) => {
    const dayVoyages = voyagesByDate[date] || []
    if (dayVoyages.length === 0) return null
    const availableCabins = dayVoyages.reduce((sum, voyage) => sum + voyage.availableCabins, 0)
    return {
      count: dayVoyages.length,
      availableCabins,
    }
  }

  return (
    <div>
      <PageHeader
        title="日历看板"
        description="按日期查看航次价格与库存概况，快速掌握各开航日的销售资源状态。"
      />

      <SearchPanel
        onSearch={() => setAppliedFilters({
          productFilter,
          routeFilter,
          shipFilter,
          directionFilter,
          keyword,
        })}
        onReset={() => {
          setProductFilter('all')
          setRouteFilter('all')
          setShipFilter('all')
          setDirectionFilter('all')
          setKeyword('')
          setAppliedFilters({
            productFilter: 'all',
            routeFilter: 'all',
            shipFilter: 'all',
            directionFilter: 'all',
            keyword: '',
          })
        }}
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">产品</label>
          <select value={productFilter} onChange={(event) => setProductFilter(event.target.value)} className="w-44 rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="all">全部产品</option>
            {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">航线</label>
          <select value={routeFilter} onChange={(event) => setRouteFilter(event.target.value)} className="w-44 rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="all">全部航线</option>
            {routes.map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">游轮</label>
          <select value={shipFilter} onChange={(event) => setShipFilter(event.target.value)} className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="all">全部游轮</option>
            {ships.map((ship) => <option key={ship.id} value={ship.id}>{ship.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">上下水</label>
          <select
            value={directionFilter}
            onChange={(event) => setDirectionFilter(event.target.value as 'all' | 'upstream' | 'downstream')}
            className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">全部</option>
            <option value="downstream">下水</option>
            <option value="upstream">上水</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">关键词</label>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="航次号/产品/航线"
            className="w-44 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </SearchPanel>

      <div className="grid grid-cols-[300px_minmax(0,1fr)] gap-4">
        <aside className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="p-0.5 text-gray-500 hover:text-gray-900">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-gray-900">{calYear}年{calMonth + 1}月</span>
            <button type="button" onClick={nextMonth} className="p-0.5 text-gray-500 hover:text-gray-900">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {['日', '一', '二', '三', '四', '五', '六'].map((label) => (
              <div key={label} className="py-1 text-center text-xs text-gray-400">{label}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarGrid.map((date, index) => {
              if (!date) return <div key={`empty-${index}`} />
              const summary = getDateSummary(date)
              const hasVoyage = Boolean(summary)
              const isSelected = date === selectedDate
              const isToday = date === today
              return (
                <button
                  key={date}
                  type="button"
                  disabled={!hasVoyage}
                  onClick={() => selectDate(date)}
                  className={`min-h-[58px] rounded border px-1 py-1 text-left transition-colors ${
                    isSelected
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : hasVoyage
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'cursor-default border-transparent text-gray-300'
                  } ${isToday && !isSelected && hasVoyage ? 'ring-1 ring-blue-300' : ''}`}
                >
                  <div className="text-xs font-semibold">{date.slice(8)}</div>
                  {summary && (
                    <div className={`mt-1 space-y-0.5 text-[10px] leading-3 ${isSelected ? 'text-emerald-100' : 'text-emerald-700'}`}>
                      <div>{summary.count} 航次</div>
                      <div>可售 {summary.availableCabins}</div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <div className="mt-4 space-y-1 text-xs text-gray-500">
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-emerald-200 bg-emerald-50" />有开航航次</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-gray-900" />当前选中日期</div>
          </div>
        </aside>

        <section className="space-y-4">
          {!selectedDate || dateVoyages.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-500">
              当前筛选条件下暂无开航日期，请调整筛选或切换月份。
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500">选中日期</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{selectedDate}</p>
                    <p className="mt-1 text-sm text-gray-600">共 {dateVoyages.length} 个航次</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {dateVoyages.map((voyage) => (
                      <button
                        key={voyage.id}
                        type="button"
                        onClick={() => setSelectedVoyageId(voyage.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          selectedVoyage?.id === voyage.id
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {voyage.voyageNo}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedVoyage && (
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    <SummaryCard label="航次编号" value={selectedVoyage.voyageNo} />
                    <SummaryCard label="产品" value={selectedVoyage.productName} />
                    <SummaryCard label="游轮" value={selectedVoyage.shipName} />
                    <SummaryCard label="状态" value={voyageStatusLabels[selectedVoyage.status] || selectedVoyage.status} />
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-200 px-4">
                  <div className="flex">
                    <TabButton active={activeTab === 'price'} onClick={() => setActiveTab('price')}>价格</TabButton>
                    <TabButton active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')}>库存</TabButton>
                  </div>
                  <div className="flex items-center gap-2 py-3">
                    {selectedVoyage?.templateId && (
                      <button
                        type="button"
                        onClick={() => navigate(`/voyage/price-templates/${selectedVoyage.templateId}`)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        价格配置
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate(`/voyage/inventory?voyageId=${selectedVoyage?.id || ''}`)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      库存看板
                    </button>
                  </div>
                </div>

                {selectedVoyage && segmentTabs.length > 1 && (
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="mb-2 text-xs text-gray-500">航段筛选</p>
                    <div className="flex flex-wrap gap-2">
                      {segmentTabs.map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setSelectedSegmentKey(tab.key)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            selectedSegmentKey === tab.key
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {loadingDetail ? (
                  <div className="px-6 py-16 text-center text-sm text-gray-400">加载中...</div>
                ) : activeTab === 'price' ? (
                  <div>
                    <div className="grid grid-cols-2 gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                      <div>
                        <span className="text-gray-500">当前航段：</span>
                        <span className="font-medium text-gray-900">{selectedSegmentTab.label}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">结算价区间：</span>
                        <span className="font-medium text-gray-900">
                          {priceRows.length > 0 ? `¥${priceSummary.min.toLocaleString()} - ¥${priceSummary.max.toLocaleString()}` : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">房型数：</span>
                        <span className="font-medium text-gray-900">{priceRows.length}</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
                            <th className="px-4 py-3 text-left font-medium">房型</th>
                            <th className="px-4 py-3 text-right font-medium">成人结算价</th>
                            <th className="px-4 py-3 text-right font-medium">零售价</th>
                            <th className="px-4 py-3 text-right font-medium">签约价</th>
                            <th className="px-4 py-3 text-right font-medium">口岸价</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {priceRows.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">暂无价格数据</td></tr>
                          ) : priceRows.map((row) => {
                            const prices = resolveSegmentPrice(row, selectedSegmentKey, selectedProduct)
                            return (
                              <tr key={row.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{row.cabinTypeName}</td>
                                <td className="px-4 py-3 text-right font-semibold text-gray-900">¥{prices.settlement.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-gray-700">¥{prices.retail.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-gray-700">¥{prices.contract.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-gray-700">¥{prices.port.toLocaleString()}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-4 gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                      <div><span className="text-gray-500">当前航段：</span><span className="font-medium text-gray-900">{selectedSegmentTab.label}</span></div>
                      <div><span className="text-gray-500">投放合计：</span><span className="font-medium text-gray-900">{inventorySummary.totalRooms} 间</span></div>
                      <div><span className="text-gray-500">已售：</span><span className="font-medium text-emerald-700">{inventorySummary.sold} 间</span></div>
                      <div><span className="text-gray-500">可售：</span><span className="font-medium text-blue-700">{inventorySummary.available} 间</span></div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
                            <th className="px-4 py-3 text-left font-medium">房型</th>
                            <th className="px-4 py-3 text-right font-medium">物理容量</th>
                            <th className="px-4 py-3 text-right font-medium">投放</th>
                            <th className="px-4 py-3 text-right font-medium">已售</th>
                            <th className="px-4 py-3 text-right font-medium">可售</th>
                            <th className="px-4 py-3 text-center font-medium">状态</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {displayInventoryRows.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">暂无库存数据</td></tr>
                          ) : displayInventoryRows.map((row) => (
                              <tr key={row.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{row.cabinTypeName}</td>
                                <td className="px-4 py-3 text-right text-gray-700">{row.physicalCapacity}</td>
                                <td className="px-4 py-3 text-right text-gray-700">{row.displayTotalRooms}</td>
                                <td className="px-4 py-3 text-right text-emerald-700">{row.displaySold}</td>
                                <td className={`px-4 py-3 text-right font-medium ${row.displayAvailable <= 5 ? 'text-rose-600' : 'text-blue-700'}`}>{row.displayAvailable}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                                    row.status === 'enabled' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {inventoryStatusLabels[row.status] || row.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2.5">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-gray-900">{value}</p>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
        active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}
