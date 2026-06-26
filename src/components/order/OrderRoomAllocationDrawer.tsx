import { X } from 'lucide-react'
import RoomFulfillmentDisplay from '@/components/order/RoomFulfillmentDisplay'
import RoomAllocationDialogs, { RoomAllocationActionButtons } from '@/components/order/RoomAllocationDialogs'
import { buildOrderRoomLines, getRoomFulfillment, type CruiseOrder } from '@/components/order/orderTypes'
import { listAllocatableRooms, type AllocatableRoomRef } from '@/components/order/roomAllocationUtils'
import { useMemo, useState } from 'react'

interface OrderRoomAllocationDrawerProps {
  order: CruiseOrder
  orders: CruiseOrder[]
  open: boolean
  onClose: () => void
  onOrdersChange: (orders: CruiseOrder[]) => void
}

export default function OrderRoomAllocationDrawer({
  order,
  orders,
  open,
  onClose,
  onOrdersChange,
}: OrderRoomAllocationDrawerProps) {
  const [changeTarget, setChangeTarget] = useState<AllocatableRoomRef | null>(null)
  const [swapSource, setSwapSource] = useState<AllocatableRoomRef | null>(null)
  const [logs, setLogs] = useState<{ id: string; actionLabel: string; summary: string }[]>([])

  const currentOrder = useMemo(
    () => orders.find((item) => item.id === order.id) ?? order,
    [orders, order],
  )
  const roomLines = buildOrderRoomLines(currentOrder)
  const allRooms = useMemo(() => listAllocatableRooms(orders), [orders])
  const orderRooms = useMemo(
    () => allRooms.filter((room) => room.orderId === currentOrder.id),
    [allRooms, currentOrder.id],
  )

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">房间调配</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              订单 {currentOrder.orderNo} · {currentOrder.ship} · {currentOrder.sailDate}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
            排房前可执行改房型、订单对调。结算仍按下单楼层计价，占用楼层为库存调配结果。
          </p>

          <div className="space-y-4">
            {orderRooms.map((room) => (
              <div key={room.lineId} className="overflow-hidden rounded-lg border border-gray-200">
                <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-800">
                      房间 {room.roomSeq} · {room.groupName} · {room.line.occupancyMode}
                    </span>
                    <RoomAllocationActionButtons
                      room={room}
                      onChangeCabin={setChangeTarget}
                      onSwap={setSwapSource}
                    />
                  </div>
                </div>
                <div className="px-4 py-3">
                  <RoomFulfillmentDisplay
                    fulfillment={getRoomFulfillment(room.line, room.line.soldPrice ?? currentOrder.unitPrice)}
                  />
                </div>
              </div>
            ))}
          </div>

          {roomLines.length === 0 && (
            <p className="py-12 text-center text-sm text-gray-400">暂无房间信息</p>
          )}

          {logs.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-gray-800">本次操作记录</h3>
              <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {logs.map((log) => (
                  <div key={log.id} className="px-3 py-2 text-xs text-gray-700">
                    <span className="mr-2 rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600">{log.actionLabel}</span>
                    {log.summary}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      <RoomAllocationDialogs
        orders={orders}
        allRooms={allRooms}
        changeTarget={changeTarget}
        swapSource={swapSource}
        onCloseChange={() => setChangeTarget(null)}
        onCloseSwap={() => setSwapSource(null)}
        onOrdersChange={onOrdersChange}
        onLog={(summary, actionLabel) =>
          setLogs((prev) => [{ id: `log-${Date.now()}`, actionLabel, summary }, ...prev])
        }
      />
    </>
  )
}
