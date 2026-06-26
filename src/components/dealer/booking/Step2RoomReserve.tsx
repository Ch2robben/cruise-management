import { useMemo, useState } from 'react'
import { bookingSegmentOptions, defaultRoomReserveData } from '@/mock/data'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/utils/format'

interface RoomCatalogItem {
  maxRooms: number
  deposit: number
  price: number
  bedType: string
  canAddBed: boolean
}

interface CartLine {
  id: string
  segmentId: string
  segmentLabel: string
  roomType: string
  bedType: string
  count: number
  price: number
  deposit: number
  maxRooms: number
}

const voyageSummary = {
  ship: '长江叁号',
  route: '重庆 → 宜昌',
  sailDate: '2026-06-15',
  duration: '4天3晚',
}

const roomCatalog = defaultRoomReserveData as Record<string, RoomCatalogItem>

function formatRoomStock(count: number) {
  return count > 20 ? '充足' : `${count}间`
}

function cartLineDeposit(line: CartLine) {
  if (line.roomType === '标准间') return line.deposit * 2 * line.count
  return line.deposit * line.count
}

function cartLinePax(line: CartLine) {
  return line.roomType === '标准间' ? line.count * 2 : line.count
}

const defaultWholeSegmentId = bookingSegmentOptions.find((segment) => segment.isWhole)?.id
  ?? bookingSegmentOptions[0]?.id
  ?? null

export default function Step2RoomReserve({ onNext, onPrev }: { onNext: (data: any) => void; onPrev: () => void }) {
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(defaultWholeSegmentId)
  const [cart, setCart] = useState<CartLine[]>([])
  const [pendingQty, setPendingQty] = useState<Record<string, number>>({})
  const [stockTip, setStockTip] = useState('')

  const selectedSegment = useMemo(
    () => bookingSegmentOptions.find((segment) => segment.id === selectedSegmentId) ?? null,
    [selectedSegmentId],
  )

  const cartCountInSegment = (segmentId: string, roomType: string) =>
    cart.filter((line) => line.segmentId === segmentId && line.roomType === roomType).reduce((sum, line) => sum + line.count, 0)

  const getAvailableStock = (segmentId: string, roomType: string) => {
    const catalog = roomCatalog[roomType]
    if (!catalog) return 0
    return Math.max(0, catalog.maxRooms - cartCountInSegment(segmentId, roomType))
  }

  const totalRooms = useMemo(() => cart.reduce((sum, line) => sum + line.count, 0), [cart])
  const totalPax = useMemo(() => cart.reduce((sum, line) => sum + cartLinePax(line), 0), [cart])
  const totalDeposit = useMemo(() => cart.reduce((sum, line) => sum + cartLineDeposit(line), 0), [cart])

  const selectSegment = (segmentId: string) => {
    setSelectedSegmentId(segmentId)
    setPendingQty({})
    setStockTip('')
  }

  const setPendingCount = (roomType: string, count: number) => {
    setPendingQty((prev) => ({ ...prev, [roomType]: Math.max(0, count) }))
  }

  const addAllToCart = () => {
    if (!selectedSegment) return

    const entries = Object.entries(pendingQty).filter(([, qty]) => qty > 0)
    if (entries.length === 0) {
      setStockTip('请先设置占舱数量')
      return
    }

    for (const [roomType, qty] of entries) {
      const available = getAvailableStock(selectedSegment.id, roomType)
      if (qty > available) {
        setStockTip(`${roomType} 可售库存不足，最多还可占 ${available} 间`)
        return
      }
    }

    setStockTip('')
    const segmentLabel = `${selectedSegment.startPort} → ${selectedSegment.endPort}`

    setCart((prev) => {
      let next = [...prev]
      entries.forEach(([roomType, qty]) => {
        const catalog = roomCatalog[roomType]
        if (!catalog) return

        const lineId = `${selectedSegment.id}-${roomType}`
        const existing = next.find((line) => line.id === lineId)
        if (existing) {
          next = next.map((line) => (line.id === lineId ? { ...line, count: line.count + qty } : line))
        } else {
          next.push({
            id: lineId,
            segmentId: selectedSegment.id,
            segmentLabel,
            roomType,
            bedType: catalog.bedType,
            count: qty,
            price: catalog.price,
            deposit: catalog.deposit,
            maxRooms: catalog.maxRooms,
          })
        }
      })
      return next
    })
    setPendingQty({})
  }

  const hasPendingQty = useMemo(
    () => Object.values(pendingQty).some((qty) => qty > 0),
    [pendingQty],
  )

  const updateCartCount = (lineId: string, nextCount: number) => {
    const line = cart.find((item) => item.id === lineId)
    if (!line) return

    let newVal = Math.max(0, nextCount)
    const otherInCart = cartCountInSegment(line.segmentId, line.roomType) - line.count
    const maxAllowed = line.maxRooms - otherInCart

    if (newVal > maxAllowed) {
      setStockTip(`${line.roomType} 可售库存不足，最多可占 ${maxAllowed} 间`)
      newVal = maxAllowed
    } else {
      setStockTip('')
    }

    if (newVal === 0) {
      setCart((prev) => prev.filter((item) => item.id !== lineId))
      return
    }

    setCart((prev) => prev.map((item) => (item.id === lineId ? { ...item, count: newVal } : item)))
  }

  const removeCartLine = (lineId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== lineId))
    setStockTip('')
  }

  const handleNext = () => {
    if (cart.length === 0) {
      if (!window.confirm('您尚未占舱，确定跳过占舱直接分配吗？')) {
        return
      }
    }

    const aggregatedRooms = JSON.parse(JSON.stringify(defaultRoomReserveData))
    Object.keys(aggregatedRooms).forEach((key) => {
      aggregatedRooms[key].count = 0
    })
    cart.forEach((line) => {
      if (aggregatedRooms[line.roomType]) {
        aggregatedRooms[line.roomType].count += line.count
      }
    })

    const primarySegment = cart[0]
      ? bookingSegmentOptions.find((s) => s.id === cart[0].segmentId) ?? bookingSegmentOptions[0]
      : selectedSegment ?? bookingSegmentOptions[0]

    onNext({
      rooms: aggregatedRooms,
      cart,
      selectedSegment: primarySegment,
      segmentKey: `${primarySegment.startPort}-${primarySegment.endPort}`,
    })
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-800">航次信息</h3>
        </div>
        <div className="grid gap-x-8 gap-y-2 px-5 py-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex gap-2">
            <span className="text-gray-500">游轮</span>
            <span className="text-gray-900">{voyageSummary.ship}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500">航线</span>
            <span className="text-gray-900">{voyageSummary.route}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500">开航日期</span>
            <span className="text-gray-900">{voyageSummary.sailDate}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500">行程</span>
            <span className="text-gray-900">{voyageSummary.duration}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <div className="min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">① 选择航段</h3>
              <p className="mt-0.5 text-xs text-gray-500">左侧选航段，右侧配置房型</p>
            </div>
            {selectedSegment && (
              <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
                当前：{selectedSegment.startPort} → {selectedSegment.endPort}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-white">
                  {['航段', '天数', '类型', ''].map((col) => (
                    <th key={col} className="px-3 py-3 text-left text-xs font-medium text-gray-500">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookingSegmentOptions.map((segment) => {
                  const active = segment.id === selectedSegmentId
                  const segmentCartCount = cart.filter((line) => line.segmentId === segment.id).reduce((sum, line) => sum + line.count, 0)
                  return (
                    <tr key={segment.id} className={active ? 'bg-blue-50/60' : 'hover:bg-gray-50'}>
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-900">
                          {segment.startPort} → {segment.endPort}
                        </div>
                        {segmentCartCount > 0 && (
                          <div className="mt-0.5 text-xs text-blue-600">已选 {segmentCartCount} 间</div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                        {segment.days}天{segment.nights}晚
                      </td>
                      <td className="px-3 py-3 text-gray-700">{segment.isWhole ? '全航段' : '分段'}</td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => selectSegment(segment.id)}
                          className={`rounded px-3 py-1 text-xs transition ${
                            active
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {active ? '已选' : '选择'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {selectedSegment ? (
          <div className="min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">② 选择房型</h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  {selectedSegment.startPort} → {selectedSegment.endPort} · 设置数量后点击「加入」
                </p>
              </div>
            </div>

            {stockTip && (
              <div className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-700">{stockTip}</div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-white">
                  {['房型', '床型', '可售库存', '定金单价', '占舱数量'].map((col) => (
                    <th
                      key={col}
                      className={`px-4 py-3 text-xs font-medium text-gray-500 ${
                        ['定金单价', '占舱数量'].includes(col) ? 'text-right' : 'text-left'
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(roomCatalog).map(([roomType, room]) => {
                  const available = getAvailableStock(selectedSegment.id, roomType)
                  const qty = pendingQty[roomType] || 0
                  return (
                    <tr key={roomType} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{roomType}</td>
                      <td className="px-4 py-3 text-gray-700">{room.bedType}</td>
                      <td className="px-4 py-3 text-gray-700">{formatRoomStock(available)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                        {formatCurrency(room.deposit)}
                        <span className="text-xs text-gray-400">{roomType === '标准间' ? '/床' : '/间'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="ml-auto flex w-fit items-center">
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-l border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40"
                            disabled={available === 0}
                            onClick={() => setPendingCount(roomType, qty - 1)}
                          >
                            <Minus className="h-3.5 w-3.5 text-gray-600" />
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={available}
                            className="h-8 w-12 border-y border-gray-300 text-center text-sm tabular-nums outline-none focus:border-blue-500"
                            value={qty}
                            disabled={available === 0}
                            onChange={(e) => setPendingCount(roomType, parseInt(e.target.value, 10) || 0)}
                          />
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-r border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40"
                            disabled={available === 0}
                            onClick={() => setPendingCount(roomType, qty + 1)}
                          >
                            <Plus className="h-3.5 w-3.5 text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
            <div className="flex justify-end border-t border-gray-100 px-4 py-3">
              <button
                type="button"
                disabled={!hasPendingQty}
                onClick={addAllToCart}
                className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                加入
              </button>
            </div>
        </div>
        ) : (
          <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center text-sm text-gray-500">
            请先在左侧选择航段，再配置该航段下的房型
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-800">占舱清单</h3>
            {cart.length > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{totalRooms} 间</span>
            )}
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">暂无占舱，选择航段并加入房型后将显示在此处</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-white">
                    {['航段', '房型', '床型', '数量', '定金小计', '操作'].map((col) => (
                      <th
                        key={col}
                        className={`px-4 py-3 text-xs font-medium text-gray-500 ${
                          ['数量', '定金小计', '操作'].includes(col) ? 'text-right' : 'text-left'
                        }`}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cart.map((line) => (
                    <tr key={line.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800">{line.segmentLabel}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{line.roomType}</td>
                      <td className="px-4 py-3 text-gray-700">{line.bedType}</td>
                      <td className="px-4 py-3">
                        <div className="ml-auto flex w-fit items-center">
                          <button
                            type="button"
                            className="flex h-7 w-7 items-center justify-center rounded-l border border-gray-300 bg-white hover:bg-gray-50"
                            onClick={() => updateCartCount(line.id, line.count - 1)}
                          >
                            <Minus className="h-3 w-3 text-gray-600" />
                          </button>
                          <span className="flex h-7 w-10 items-center justify-center border-y border-gray-300 text-center text-sm tabular-nums">
                            {line.count}
                          </span>
                          <button
                            type="button"
                            className="flex h-7 w-7 items-center justify-center rounded-r border border-gray-300 bg-white hover:bg-gray-50"
                            onClick={() => updateCartCount(line.id, line.count + 1)}
                          >
                            <Plus className="h-3 w-3 text-gray-600" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                        {formatCurrency(cartLineDeposit(line))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeCartLine(line.id)}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                  <span>
                    已占 <strong className="text-gray-900">{totalRooms}</strong> 间
                  </span>
                  <span>
                    预计 <strong className="text-gray-900">{totalPax}</strong> 人
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">定金合计 </span>
                  <span className="text-lg font-semibold tabular-nums text-gray-900">{formatCurrency(totalDeposit)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
        <button
          type="button"
          className="rounded-md border border-gray-300 px-6 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          onClick={onPrev}
        >
          上一步
        </button>
        <button
          type="button"
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          onClick={handleNext}
        >
          下一步：分配游客
        </button>
      </div>
    </div>
  )
}
