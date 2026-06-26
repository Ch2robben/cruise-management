import type { CruiseOrder, OrderRoomLine, RoomInventoryStatus } from '@/components/order/orderTypes'
import { buildOrderRoomLines } from '@/components/order/orderTypes'
import { initialFloorPools, poolAvailable, type FloorInventoryPool } from '@/mock/inventoryAllocation'

export interface AllocatableRoomRef {
  orderId: string
  orderNo: string
  lineId: string
  roomSeq: number
  groupName: string
  line: OrderRoomLine
}

export function listAllocatableRooms(orders: CruiseOrder[]): AllocatableRoomRef[] {
  return orders.flatMap((order) =>
    buildOrderRoomLines(order).map((line) => ({
      orderId: order.id,
      orderNo: order.orderNo,
      lineId: line.id,
      roomSeq: line.roomSeq,
      groupName: line.teamName || order.groupName,
      line,
    })),
  )
}

export function updateOrderRoomLine(
  orders: CruiseOrder[],
  orderId: string,
  lineId: string,
  patch: Partial<OrderRoomLine>,
): CruiseOrder[] {
  return orders.map((order) => {
    if (order.id !== orderId) return order
    const roomLines = buildOrderRoomLines(order).map((line) =>
      line.id === lineId ? { ...line, ...patch } : line,
    )
    return { ...order, roomLines }
  })
}

export function applyChangeCabin(
  orders: CruiseOrder[],
  target: AllocatableRoomRef,
  newFloor: string,
): CruiseOrder[] {
  const beforeAlloc = target.line.allocatedFloor ?? target.line.soldFloor ?? '2F'
  const inventoryStatus: RoomInventoryStatus =
    (target.line.soldFloor ?? '2F') === newFloor ? 'normal' : 'auto_upgraded'

  return updateOrderRoomLine(orders, target.orderId, target.lineId, {
    allocatedFloor: newFloor,
    inventoryStatus,
  })
}

export function applyOrderSwap(
  orders: CruiseOrder[],
  source: AllocatableRoomRef,
  swapTarget: AllocatableRoomRef,
): CruiseOrder[] {
  const sourceAllocFloor = source.line.allocatedFloor ?? source.line.soldFloor ?? '2F'
  const sourceAllocType = source.line.allocatedRoomType ?? source.line.soldRoomType ?? source.line.roomType
  const targetAllocFloor = swapTarget.line.allocatedFloor ?? swapTarget.line.soldFloor ?? '2F'
  const targetAllocType = swapTarget.line.allocatedRoomType ?? swapTarget.line.soldRoomType ?? swapTarget.line.roomType

  let next = updateOrderRoomLine(orders, source.orderId, source.lineId, {
    allocatedFloor: targetAllocFloor,
    allocatedRoomType: targetAllocType,
    inventoryStatus: 'swapped',
    upgradeFee: 0,
  })
  next = updateOrderRoomLine(next, swapTarget.orderId, swapTarget.lineId, {
    allocatedFloor: sourceAllocFloor,
    allocatedRoomType: sourceAllocType,
    inventoryStatus: 'swapped',
  })
  return next
}

export function getChangeFloorOptions(
  target: AllocatableRoomRef,
  pools: FloorInventoryPool[] = initialFloorPools,
): FloorInventoryPool[] {
  const sourcePool = pools.find((pool) => pool.floorLabel === (target.line.soldFloor ?? '2F'))
  const targetIds = sourcePool?.upgradeTargets ?? pools.filter((pool) => pool.tier === 'premium').map((pool) => pool.id)
  return pools.filter((pool) => targetIds.includes(pool.id) && poolAvailable(pool) > 0)
}

export function getSwapCandidates(rooms: AllocatableRoomRef[], source: AllocatableRoomRef) {
  return rooms.filter(
    (room) =>
      room.lineId !== source.lineId &&
      (room.line.roomAssignmentStatus ?? '待排房') === '待排房',
  )
}
