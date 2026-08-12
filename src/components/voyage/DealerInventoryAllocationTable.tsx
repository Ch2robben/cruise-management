import { Info } from 'lucide-react'
import {
  DEALER_PRIVATE_STOCK_KINDS,
  aggregateDealerQuantity,
  aggregateDealerStockPool,
  getDealerQuantity,
  getDealerStockPool,
  sumDealerAllocations,
  type DealerPrivateStockKind,
  type TemplateDealerInventoryRules,
  type TemplateInventoryCell,
  type TemplateInventoryRules,
} from '@/mock/templateInventoryRules'
import type { TemplateSellRoomType } from '@/mock/sellRoomTypeConfig'
import type { Dealer, ProductSegment } from '@/types'

export interface SegmentEntry {
  key: string
  segment: ProductSegment | null
}

interface DealerInventoryAllocationTableProps {
  sellRoomTypes: TemplateSellRoomType[]
  segmentEntries: SegmentEntry[]
  inventoryRules: TemplateInventoryRules
  dealerRules: TemplateDealerInventoryRules
  selectedDealers: string[]
  activeDealers: Dealer[]
  editMode: boolean
  showSegments?: boolean
  onUpdateDealerAllocation: (
    sellRoomTypeCode: string,
    segmentKey: string,
    dealerId: string,
    stockKind: DealerPrivateStockKind,
    quantity: number,
  ) => void
  onUpdateAggregatedDealerAllocation?: (
    sellRoomTypeCode: string,
    dealerId: string,
    stockKind: DealerPrivateStockKind,
    quantity: number,
  ) => void
}

function getCell(
  rules: TemplateInventoryRules,
  sellRoomTypeCode: string,
  segKey: string,
): TemplateInventoryCell {
  return (
    rules[sellRoomTypeCode]?.[segKey] || {
      physicalCapacity: 0,
      regionalPublicStock: 0,
      globalPublicStock: 0,
    }
  )
}

function dealerName(activeDealers: Dealer[], dealerId: string) {
  return activeDealers.find((d) => d.id === dealerId)?.name || dealerId
}

function shortDealerName(name: string) {
  return name
    .replace(/旅行邮轮事业部$/, '')
    .replace(/度假邮轮频道$/, '')
    .replace(/旅游三峡专线$/, '')
    .replace(/邮轮旗舰店$/, '')
    .trim() || name
}

function QtyCell({
  value,
  editMode,
  disabled,
  onChange,
}: {
  value: number
  editMode: boolean
  disabled?: boolean
  onChange: (next: number) => void
}) {
  if (editMode && !disabled) {
    return (
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="h-9 w-full min-w-[4.5rem] rounded-md border border-gray-300 bg-white px-2 text-center text-sm font-semibold tabular-nums text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    )
  }
  return (
    <span className={`inline-flex h-9 min-w-[4.5rem] items-center justify-center rounded-md bg-gray-50 px-2 text-sm font-semibold tabular-nums ${
      disabled ? 'text-gray-300' : 'text-gray-800'
    }`}
    >
      {value}
    </span>
  )
}

function StockKindLabel({
  kind,
}: {
  kind: (typeof DEALER_PRIVATE_STOCK_KINDS)[number]
}) {
  const isRegional = kind.value === 'regionalPrivate'
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-xs font-semibold ${isRegional ? 'text-purple-700' : 'text-blue-700'}`}>
        {kind.label}
      </span>
      <span className="group relative inline-flex">
        <Info className={`h-3.5 w-3.5 cursor-help ${isRegional ? 'text-purple-400' : 'text-blue-400'}`} />
        <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden w-44 -translate-x-1/2 rounded-md bg-gray-900 px-2 py-1.5 text-center text-[11px] leading-snug text-white shadow-lg group-hover:block">
          {kind.hint}
        </span>
      </span>
    </div>
  )
}

function SegmentOverviewBar({
  sellRoomTypes,
  getPool,
  getAllocated,
}: {
  sellRoomTypes: TemplateSellRoomType[]
  getPool: (code: string) => number
  getAllocated: (code: string) => number
}) {
  return (
    <div className="rounded-md border border-sky-100 bg-sky-50/80 px-3 py-2 text-xs text-sky-900">
      <span className="mr-1">📊</span>
      <span className="font-medium">库存概览：</span>
      {sellRoomTypes.map((sellRoom, index) => {
        const pool = getPool(sellRoom.code)
        const allocated = getAllocated(sellRoom.code)
        const unallocated = Math.max(0, pool - allocated)
        return (
          <span key={sellRoom.code}>
            {index > 0 && <span className="mx-1.5 text-sky-300">|</span>}
            <span className="font-medium text-sky-950">{sellRoom.name}</span>
            <span className="text-sky-700">
              {' '}
              (池{pool}·已分{allocated}·未分{unallocated})
            </span>
          </span>
        )
      })}
    </div>
  )
}

function AllocationTable({
  sellRoomTypes,
  selectedDealers,
  activeDealers,
  editMode,
  getQty,
  getPoolZero,
  onChangeQty,
}: {
  sellRoomTypes: TemplateSellRoomType[]
  selectedDealers: string[]
  activeDealers: Dealer[]
  editMode: boolean
  getQty: (dealerId: string, stockKind: DealerPrivateStockKind, roomCode: string) => number
  getPoolZero: (roomCode: string) => boolean
  onChangeQty: (
    dealerId: string,
    stockKind: DealerPrivateStockKind,
    roomCode: string,
    quantity: number,
  ) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/80">
            <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">库存类型</th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">经销商</th>
            {sellRoomTypes.map((sellRoom) => (
              <th key={sellRoom.code} className="px-3 py-2.5 text-center text-xs font-medium text-gray-500">
                {sellRoom.name}
              </th>
            ))}
            <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500">行合计</th>
          </tr>
        </thead>
        <tbody>
          {DEALER_PRIVATE_STOCK_KINDS.flatMap((stockKind) =>
            selectedDealers.map((dealerId, dealerIndex) => {
              const isFirstOfKind = dealerIndex === 0
              let rowTotal = 0
              const qtyByRoom = sellRoomTypes.map((sellRoom) => {
                const qty = getQty(dealerId, stockKind.value, sellRoom.code)
                rowTotal += qty
                return { code: sellRoom.code, qty }
              })

              return (
                <tr
                  key={`${stockKind.value}-${dealerId}`}
                  className={`border-b border-gray-100 last:border-b-0 ${
                    stockKind.value === 'regionalPrivate' ? 'bg-purple-50/20' : 'bg-white'
                  }`}
                >
                  {isFirstOfKind ? (
                    <td
                      rowSpan={selectedDealers.length}
                      className={`border-r border-gray-100 px-3 py-3 align-middle ${
                        stockKind.value === 'regionalPrivate' ? 'bg-purple-50/60' : 'bg-blue-50/50'
                      }`}
                    >
                      <StockKindLabel kind={stockKind} />
                    </td>
                  ) : null}
                  <td className="px-3 py-2.5 text-gray-800">
                    <div className="font-medium" title={dealerName(activeDealers, dealerId)}>
                      {shortDealerName(dealerName(activeDealers, dealerId))}
                    </div>
                  </td>
                  {qtyByRoom.map(({ code, qty }) => (
                    <td key={code} className="px-3 py-2 text-center">
                      <QtyCell
                        value={qty}
                        editMode={editMode}
                        disabled={getPoolZero(code)}
                        onChange={(next) => onChangeQty(dealerId, stockKind.value, code, next)}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-right text-sm font-semibold tabular-nums text-gray-800">
                    {rowTotal}
                  </td>
                </tr>
              )
            }),
          )}
        </tbody>
      </table>
    </div>
  )
}

export default function DealerInventoryAllocationTable({
  sellRoomTypes,
  segmentEntries,
  inventoryRules,
  dealerRules,
  selectedDealers,
  activeDealers,
  editMode,
  showSegments = true,
  onUpdateDealerAllocation,
  onUpdateAggregatedDealerAllocation,
}: DealerInventoryAllocationTableProps) {
  if (selectedDealers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center text-sm text-gray-400">
        {editMode ? '请先选择经销商' : '暂无经销商分配'}
      </div>
    )
  }

  if (!showSegments) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="space-y-3 border-b border-gray-100 px-4 py-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">全航段汇总</h4>
            <p className="mt-0.5 text-xs text-gray-500">不区分航段，按销售房型汇总分配</p>
          </div>
          <SegmentOverviewBar
            sellRoomTypes={sellRoomTypes}
            getPool={(code) => aggregateDealerStockPool(inventoryRules, code)}
            getAllocated={(code) => {
              const segmentMap = dealerRules[code] || {}
              return Object.values(segmentMap).reduce(
                (sum, allocations) =>
                  sum
                  + sumDealerAllocations(
                    allocations.filter((item) => selectedDealers.includes(item.dealerId)),
                  ),
                0,
              )
            }}
          />
        </div>
        <AllocationTable
          sellRoomTypes={sellRoomTypes}
          selectedDealers={selectedDealers}
          activeDealers={activeDealers}
          editMode={editMode}
          getQty={(dealerId, stockKind, roomCode) =>
            aggregateDealerQuantity(dealerRules, roomCode, dealerId, stockKind)
          }
          getPoolZero={(roomCode) => aggregateDealerStockPool(inventoryRules, roomCode) === 0}
          onChangeQty={(dealerId, stockKind, roomCode, quantity) =>
            onUpdateAggregatedDealerAllocation?.(roomCode, dealerId, stockKind, quantity)
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {segmentEntries.map(({ key, segment }, cardIndex) => (
        <section
          key={key}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="space-y-3 border-b border-gray-100 px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded bg-gray-900 px-1.5 text-[10px] font-semibold text-white">
                    {cardIndex + 1}
                  </span>
                  <h4 className="text-sm font-semibold text-gray-900">{key}</h4>
                </div>
                {segment && (
                  <p className="mt-1 text-xs text-gray-500">
                    {segment.days}天 · {segment.mileage}km
                  </p>
                )}
              </div>
            </div>

            <SegmentOverviewBar
              sellRoomTypes={sellRoomTypes}
              getPool={(code) => getDealerStockPool(getCell(inventoryRules, code, key))}
              getAllocated={(code) => {
                const allocations = dealerRules[code]?.[key] || []
                return sumDealerAllocations(
                  allocations.filter((item) => selectedDealers.includes(item.dealerId)),
                )
              }}
            />
          </div>

          <AllocationTable
            sellRoomTypes={sellRoomTypes}
            selectedDealers={selectedDealers}
            activeDealers={activeDealers}
            editMode={editMode}
            getQty={(dealerId, stockKind, roomCode) =>
              getDealerQuantity(dealerRules[roomCode]?.[key] || [], dealerId, stockKind)
            }
            getPoolZero={(roomCode) => getDealerStockPool(getCell(inventoryRules, roomCode, key)) === 0}
            onChangeQty={(dealerId, stockKind, roomCode, quantity) =>
              onUpdateDealerAllocation(roomCode, key, dealerId, stockKind, quantity)
            }
          />
        </section>
      ))}
    </div>
  )
}
