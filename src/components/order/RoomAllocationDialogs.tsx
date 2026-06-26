import { ArrowLeftRight, Shuffle, SlidersHorizontal } from 'lucide-react'
import FormDialog from '@/components/common/FormDialog'
import RoomFulfillmentDisplay from '@/components/order/RoomFulfillmentDisplay'
import {
  applyChangeCabin,
  applyOrderSwap,
  getChangeFloorOptions,
  getSwapCandidates,
  type AllocatableRoomRef,
} from '@/components/order/roomAllocationUtils'
import type { CruiseOrder } from '@/components/order/orderTypes'
import { getRoomFulfillment } from '@/components/order/orderTypes'
import { poolAvailable } from '@/mock/inventoryAllocation'
import { formatCurrency } from '@/utils/format'
import { useMemo, useState } from 'react'

interface RoomAllocationDialogsProps {
  orders: CruiseOrder[]
  allRooms: AllocatableRoomRef[]
  changeTarget: AllocatableRoomRef | null
  swapSource: AllocatableRoomRef | null
  onCloseChange: () => void
  onCloseSwap: () => void
  onOrdersChange: (orders: CruiseOrder[]) => void
  onLog?: (summary: string, actionLabel: string) => void
}

export default function RoomAllocationDialogs({
  orders,
  allRooms,
  changeTarget,
  swapSource,
  onCloseChange,
  onCloseSwap,
  onOrdersChange,
  onLog,
}: RoomAllocationDialogsProps) {
  const changeFloorOptions = useMemo(
    () => (changeTarget ? getChangeFloorOptions(changeTarget) : []),
    [changeTarget],
  )
  const [changeFloor, setChangeFloor] = useState('')
  const [swapTargetId, setSwapTargetId] = useState('')

  const effectiveChangeFloor = changeFloor || changeFloorOptions[0]?.floorLabel || ''
  const swapCandidates = useMemo(
    () => (swapSource ? getSwapCandidates(allRooms, swapSource) : []),
    [allRooms, swapSource],
  )
  const swapTarget = useMemo(
    () => swapCandidates.find((room) => room.lineId === swapTargetId) ?? swapCandidates[0],
    [swapCandidates, swapTargetId],
  )

  const confirmChangeCabin = () => {
    if (!changeTarget || !effectiveChangeFloor) return
    const beforeAlloc = changeTarget.line.allocatedFloor ?? changeTarget.line.soldFloor
    onOrdersChange(applyChangeCabin(orders, changeTarget, effectiveChangeFloor))
    onLog?.(
      `订单 ${changeTarget.orderNo} 房间${changeTarget.roomSeq}：占用 ${beforeAlloc} → ${effectiveChangeFloor}，结算仍按 ${changeTarget.line.soldFloor} ${formatCurrency(changeTarget.line.soldPrice ?? 0)}`,
      '改房型',
    )
    onCloseChange()
    setChangeFloor('')
  }

  const confirmSwap = () => {
    if (!swapSource || !swapTarget) return
    if ((swapSource.line.roomAssignmentStatus ?? '待排房') !== '待排房') return
    if ((swapTarget.line.roomAssignmentStatus ?? '待排房') !== '待排房') return
    onOrdersChange(applyOrderSwap(orders, swapSource, swapTarget))
    onLog?.(
      `对调 ${swapSource.orderNo}-房${swapSource.roomSeq}（${swapSource.line.soldFloor}价占${swapSource.line.allocatedFloor}）与 ${swapTarget.orderNo}-房${swapTarget.roomSeq}（${swapTarget.line.soldFloor}价占${swapTarget.line.allocatedFloor}），回收升舱补差 ¥${swapTarget.line.upgradeFee ?? 0}`,
      '订单对调',
    )
    onCloseSwap()
    setSwapTargetId('')
  }

  return (
    <>
      <FormDialog
        open={!!changeTarget}
        title="改房型 / 释放基础库存"
        width="max-w-lg"
        onCancel={() => {
          onCloseChange()
          setChangeFloor('')
        }}
        onSubmit={confirmChangeCabin}
      >
        {changeTarget && (
          <div className="space-y-4 text-sm">
            <p className="text-gray-600">
              将订单 <strong>{changeTarget.orderNo}</strong> 房间{changeTarget.roomSeq} 的<strong>实际占用</strong>调整到高档楼层，
              结算仍按 <strong>{changeTarget.line.soldFloor}</strong> 计价。
            </p>
            <RoomFulfillmentDisplay fulfillment={getRoomFulfillment(changeTarget.line, changeTarget.line.soldPrice ?? 0)} />
            <label className="block">
              <span className="mb-1 block text-gray-700">调整到占用楼层</span>
              <select
                value={effectiveChangeFloor}
                onChange={(e) => setChangeFloor(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              >
                {changeFloorOptions.map((pool) => (
                  <option key={pool.id} value={pool.floorLabel}>
                    {pool.floorLabel} · {pool.cabinType}（可售 {poolAvailable(pool)}）
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </FormDialog>

      <FormDialog
        open={!!swapSource}
        title="升舱补差 · 订单对调"
        width="max-w-2xl"
        onCancel={() => {
          onCloseSwap()
          setSwapTargetId('')
        }}
        onSubmit={confirmSwap}
      >
        {swapSource && (
          <div className="space-y-4 text-sm">
            <p className="text-gray-600">
              将<strong>超售单</strong>（低价占高档房）与<strong>升舱单</strong>（愿付补差）对调占用楼层，回收升舱差价。须在排房前完成。
            </p>
            <div className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-xs text-orange-800">
              源订单：{swapSource.orderNo} 房{swapSource.roomSeq}
            </div>
            <RoomFulfillmentDisplay fulfillment={getRoomFulfillment(swapSource.line, swapSource.line.soldPrice ?? 0)} compact />
            <label className="block">
              <span className="mb-1 block text-gray-700">选择对调目标订单</span>
              <select
                value={swapTarget?.lineId ?? ''}
                onChange={(e) => setSwapTargetId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="">请选择</option>
                {swapCandidates.map((room) => (
                  <option key={room.lineId} value={room.lineId}>
                    {room.orderNo} 房{room.roomSeq} · 卖{room.line.soldFloor} 占{room.line.allocatedFloor}
                    {(room.line.upgradeFee ?? 0) > 0 ? ` · 补差¥${room.line.upgradeFee}` : ''}
                  </option>
                ))}
              </select>
            </label>
            {swapTarget && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                <div className="mb-2 flex items-center gap-2 font-medium text-gray-900">
                  <ArrowLeftRight className="h-4 w-4" /> 对调预览
                </div>
                <div>A：占 {swapSource.line.allocatedFloor} → {swapTarget.line.allocatedFloor}（仍按 {swapSource.line.soldFloor} 结算）</div>
                <div>B：占 {swapTarget.line.allocatedFloor} → {swapSource.line.allocatedFloor}（仍按 {swapTarget.line.soldFloor} 结算，补差 ¥{swapTarget.line.upgradeFee ?? 0}）</div>
              </div>
            )}
          </div>
        )}
      </FormDialog>
    </>
  )
}

export function RoomAllocationActionButtons({
  room,
  onChangeCabin,
  onSwap,
}: {
  room: AllocatableRoomRef
  onChangeCabin: (room: AllocatableRoomRef) => void
  onSwap: (room: AllocatableRoomRef) => void
}) {
  const pending = (room.line.roomAssignmentStatus ?? '待排房') === '待排房'
  return (
    <div className="flex flex-wrap gap-1">
      <button
        type="button"
        disabled={!pending}
        onClick={() => onChangeCabin(room)}
        className="inline-flex items-center gap-0.5 rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40"
      >
        <SlidersHorizontal className="h-3 w-3" /> 改房型
      </button>
      <button
        type="button"
        disabled={!pending}
        onClick={() => onSwap(room)}
        className="inline-flex items-center gap-0.5 rounded border border-blue-200 px-2 py-1 text-xs text-blue-700 hover:bg-blue-50 disabled:opacity-40"
      >
        <Shuffle className="h-3 w-3" /> 对调
      </button>
    </div>
  )
}
