import type { ReactNode } from 'react'
import {
  aggregateDealerQuantity,
  aggregateDealerStockPool,
  getDealerQuantity,
  sumDealerAllocations,
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
    quantity: number,
  ) => void
  onUpdateAggregatedDealerAllocation?: (
    sellRoomTypeCode: string,
    dealerId: string,
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
      onlineChannel: 0,
      publicStock: 0,
      dealerStockPool: 0,
    }
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
  const renderSegmentRows = (
    renderCells: (segKey: string, sellRoomTypeCode: string, segment: ProductSegment | null) => ReactNode,
  ) =>
    segmentEntries.map(({ key, segment }) =>
      sellRoomTypes.map((sellRoom, roomIndex) => (
        <tr key={`${key}-${sellRoom.code}`}>
          {showSegments && roomIndex === 0 && (
            <td rowSpan={sellRoomTypes.length} className="border-r border-b bg-gray-50/40 px-3 py-2 align-top">
              <div className="font-medium text-gray-900">{key}</div>
              {segment && (
                <div className="mt-0.5 text-xs text-gray-400">
                  {segment.days}天 · {segment.mileage}km
                </div>
              )}
            </td>
          )}
          <td className="border-r border-b px-3 py-2 font-medium text-gray-800">{sellRoom.name}</td>
          {renderCells(key, sellRoom.code, segment)}
        </tr>
      )),
    )

  const renderAggregatedRows = (
    renderCells: (sellRoomTypeCode: string, sellRoomName: string) => ReactNode,
  ) =>
    sellRoomTypes.map((sellRoom) => (
      <tr key={sellRoom.code}>
        <td className="border-r border-b px-3 py-2 font-medium text-gray-800">{sellRoom.name}</td>
        {renderCells(sellRoom.code, sellRoom.name)}
      </tr>
    ))

  if (selectedDealers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center text-sm text-gray-400">
        {editMode ? '请先选择经销商' : '暂无经销商分配'}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 text-sm">
        <thead>
          <tr className="bg-gray-50">
            {showSegments && (
              <th className="border-b border-r px-3 py-2 text-left text-xs font-medium text-gray-500">航段</th>
            )}
            <th className="border-b border-r px-3 py-2 text-left text-xs font-medium text-gray-500">销售房型</th>
            <th className="border-b border-r px-3 py-2 text-right text-xs font-medium text-gray-500">库存池</th>
            {selectedDealers.map((dealerId) => (
              <th
                key={dealerId}
                className="border-b border-r px-3 py-2 text-right text-xs font-medium text-gray-500"
              >
                {activeDealers.find((d) => d.id === dealerId)?.name || dealerId}
              </th>
            ))}
            <th className="border-b border-r px-3 py-2 text-right text-xs font-medium text-gray-500">已分配</th>
            <th className="border-b px-3 py-2 text-right text-xs font-medium text-gray-500">剩余</th>
          </tr>
        </thead>
        <tbody>
          {showSegments
            ? renderSegmentRows((segKey, sellRoomTypeCode) => {
                const cell = getCell(inventoryRules, sellRoomTypeCode, segKey)
                const allocations = dealerRules[sellRoomTypeCode]?.[segKey] || []
                const allocated = sumDealerAllocations(
                  allocations.filter((item) => selectedDealers.includes(item.dealerId)),
                )
                const remaining = cell.dealerStockPool - allocated
                const poolZero = cell.dealerStockPool === 0

                return (
                  <>
                    <td className={`border-r border-b px-3 py-2 text-right ${poolZero ? 'text-gray-400' : ''}`}>
                      {cell.dealerStockPool}
                    </td>
                    {selectedDealers.map((dealerId) => {
                      const quantity = getDealerQuantity(allocations, dealerId)
                      return (
                        <td key={dealerId} className="border-r border-b px-3 py-2 text-right">
                          {editMode && !poolZero ? (
                            <input
                              type="number"
                              min={0}
                              value={quantity}
                              onChange={(e) =>
                                onUpdateDealerAllocation(
                                  sellRoomTypeCode,
                                  segKey,
                                  dealerId,
                                  Math.max(0, Number(e.target.value) || 0),
                                )
                              }
                              className="w-16 rounded border border-gray-300 px-1 py-1 text-right text-sm"
                            />
                          ) : (
                            quantity
                          )}
                        </td>
                      )
                    })}
                    <td className="border-r border-b px-3 py-2 text-right">{allocated}</td>
                    <td
                      className={`border-b px-3 py-2 text-right font-medium ${
                        remaining < 0 ? 'text-red-600' : remaining === 0 ? 'text-emerald-600' : 'text-gray-500'
                      }`}
                    >
                      {remaining}
                    </td>
                  </>
                )
              })
            : renderAggregatedRows((sellRoomTypeCode) => {
                const pool = aggregateDealerStockPool(inventoryRules, sellRoomTypeCode)
                const allocated = sumDealerAllocations(
                  selectedDealers.map((dealerId) => ({
                    dealerId,
                    quantity: aggregateDealerQuantity(dealerRules, sellRoomTypeCode, dealerId),
                  })),
                )
                const remaining = pool - allocated
                const poolZero = pool === 0

                return (
                  <>
                    <td className={`border-r border-b px-3 py-2 text-right ${poolZero ? 'text-gray-400' : ''}`}>
                      {pool}
                    </td>
                    {selectedDealers.map((dealerId) => {
                      const quantity = aggregateDealerQuantity(dealerRules, sellRoomTypeCode, dealerId)
                      return (
                        <td key={dealerId} className="border-r border-b px-3 py-2 text-right">
                          {editMode && !poolZero ? (
                            <input
                              type="number"
                              min={0}
                              value={quantity}
                              onChange={(e) =>
                                onUpdateAggregatedDealerAllocation?.(
                                  sellRoomTypeCode,
                                  dealerId,
                                  Math.max(0, Number(e.target.value) || 0),
                                )
                              }
                              className="w-16 rounded border border-gray-300 px-1 py-1 text-right text-sm"
                            />
                          ) : (
                            quantity
                          )}
                        </td>
                      )
                    })}
                    <td className="border-r border-b px-3 py-2 text-right">{allocated}</td>
                    <td
                      className={`border-b px-3 py-2 text-right font-medium ${
                        remaining < 0 ? 'text-red-600' : remaining === 0 ? 'text-emerald-600' : 'text-gray-500'
                      }`}
                    >
                      {remaining}
                    </td>
                  </>
                )
              })}
        </tbody>
      </table>
    </div>
  )
}
