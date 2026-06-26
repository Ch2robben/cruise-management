import { statusClass, statusLabel } from '@/mock/inventoryAllocation'
import type { RoomFulfillmentView } from '@/components/order/orderTypes'
import { formatCurrency } from '@/utils/format'

interface RoomFulfillmentDisplayProps {
  fulfillment: RoomFulfillmentView
  compact?: boolean
}

function FulfillmentStep({
  label,
  floor,
  roomType,
  roomNo,
  highlight,
  muted,
}: {
  label: string
  floor: string
  roomType: string
  roomNo?: string
  highlight?: boolean
  muted?: boolean
}) {
  return (
    <div className={`min-w-0 flex-1 rounded-lg border px-3 py-2 ${highlight ? 'border-orange-200 bg-orange-50' : muted ? 'border-gray-100 bg-gray-50' : 'border-gray-200 bg-white'}`}>
      <div className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{label}</div>
      <div className={`mt-1 text-sm font-medium ${highlight ? 'text-orange-700' : 'text-gray-900'}`}>
        {floor} · {roomType}
      </div>
      {roomNo ? (
        <div className="mt-0.5 font-mono text-xs text-gray-600">{roomNo}</div>
      ) : (
        <div className="mt-0.5 text-xs text-gray-400">{label === '排房' ? '待排房' : ''}</div>
      )}
    </div>
  )
}

export default function RoomFulfillmentDisplay({ fulfillment, compact = false }: RoomFulfillmentDisplayProps) {
  const assigned = fulfillment.roomAssignmentStatus === '已排房' && fulfillment.assignedRoomNo

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-gray-500">下单 {fulfillment.soldFloor} {fulfillment.soldRoomType}</span>
        <span className="text-gray-300">→</span>
        <span className={fulfillment.allocationDiffers ? 'font-medium text-orange-600' : 'text-gray-700'}>
          占用 {fulfillment.allocatedFloor} {fulfillment.allocatedRoomType}
        </span>
        {assigned && (
          <>
            <span className="text-gray-300">→</span>
            <span className="text-gray-700">排房 {fulfillment.assignedRoomNo}</span>
          </>
        )}
        {fulfillment.inventoryStatus !== 'normal' && (
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusClass(fulfillment.inventoryStatus)}`}>
            {statusLabel(fulfillment.inventoryStatus)}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-2 md:grid-cols-3">
        <FulfillmentStep label="下单" floor={fulfillment.soldFloor} roomType={fulfillment.soldRoomType} />
        <FulfillmentStep
          label="占用"
          floor={fulfillment.allocatedFloor}
          roomType={fulfillment.allocatedRoomType}
          highlight={fulfillment.allocationDiffers}
        />
        <FulfillmentStep
          label="排房"
          floor={assigned ? (fulfillment.assignedFloor ?? fulfillment.allocatedFloor) : '—'}
          roomType={assigned ? (fulfillment.assignedRoomType ?? fulfillment.allocatedRoomType) : '—'}
          roomNo={assigned ? fulfillment.assignedRoomNo : undefined}
          muted={!assigned}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span>结算价 {formatCurrency(fulfillment.soldPrice)}</span>
        {fulfillment.upgradeFee > 0 && <span className="text-green-600">升舱补差 +{formatCurrency(fulfillment.upgradeFee)}</span>}
        <span className={`rounded px-1.5 py-0.5 font-medium ${statusClass(fulfillment.inventoryStatus)}`}>
          {statusLabel(fulfillment.inventoryStatus)}
        </span>
        <span>{fulfillment.roomAssignmentStatus}</span>
      </div>
    </div>
  )
}
