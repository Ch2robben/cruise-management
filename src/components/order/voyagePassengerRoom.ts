import {
  buildOrderRoomLines,
  getRoomFulfillment,
  type CruiseOrder,
  type RoomAssignmentStatus,
  type RoomInventoryStatus,
} from '@/components/order/orderTypes'

export interface VoyageSummary {
  voyageNo: string
  ship: string
  sailDate: string
  route: string
  voyageStatus: string
  guestCount: number
  orderCount: number
  pendingAssignmentCount: number
  allocationMismatchCount: number
}

export interface VoyagePassengerRoomRow {
  id: string
  orderId: string
  lineId: string
  /** 房间内首位旅客，用于展示房间级操作 */
  isRoomLeader: boolean
  voyageNo: string
  ship: string
  sailDate: string
  route: string
  orderNo: string
  orderStatus: string
  groupName: string
  roomSeq: number
  guestName: string
  slotIndex: number
  ageGroup: string
  occupancyType: string
  soldLabel: string
  allocatedLabel: string
  assignedLabel: string
  roomAssignmentStatus: RoomAssignmentStatus
  inventoryStatus: RoomInventoryStatus
  allocationDiffers: boolean
}

export function formatRoomTypeLabel(floor?: string, roomType?: string) {
  if (!floor && !roomType) return '-'
  if (!floor || floor === '-') return roomType || '-'
  return `${floor} ${roomType || ''}`.trim()
}

export function formatAssignedLabel(
  roomAssignmentStatus: RoomAssignmentStatus,
  roomNo?: string,
  floor?: string,
  roomType?: string,
) {
  if (roomAssignmentStatus !== '已排房' || !roomNo) return '待排房'
  return `${roomNo} · ${formatRoomTypeLabel(floor, roomType)}`
}

export function buildVoyagePassengerRoomRows(orders: CruiseOrder[]): VoyagePassengerRoomRow[] {
  return orders.flatMap((order) =>
    buildOrderRoomLines(order).flatMap((line) => {
      const fulfillment = getRoomFulfillment(line, line.soldPrice ?? order.unitPrice)
      return line.guests.map((guest) => ({
        id: guest.id,
        orderId: order.id,
        lineId: line.id,
        isRoomLeader: guest.slotIndex === 1,
        voyageNo: order.voyageNo,
        ship: order.ship,
        sailDate: order.sailDate,
        route: order.route,
        orderNo: order.orderNo,
        orderStatus: order.orderStatus,
        groupName: line.teamName || order.groupName,
        roomSeq: line.roomSeq,
        guestName: guest.name,
        slotIndex: guest.slotIndex,
        ageGroup: guest.ageGroup,
        occupancyType: guest.occupancyType,
        soldLabel: formatRoomTypeLabel(fulfillment.soldFloor, fulfillment.soldRoomType),
        allocatedLabel: formatRoomTypeLabel(fulfillment.allocatedFloor, fulfillment.allocatedRoomType),
        assignedLabel: formatAssignedLabel(
          fulfillment.roomAssignmentStatus,
          fulfillment.assignedRoomNo,
          fulfillment.assignedFloor,
          fulfillment.assignedRoomType,
        ),
        roomAssignmentStatus: fulfillment.roomAssignmentStatus,
        inventoryStatus: fulfillment.inventoryStatus,
        allocationDiffers: fulfillment.allocationDiffers,
      }))
    }),
  )
}

export function buildVoyageSummaries(orders: CruiseOrder[]): VoyageSummary[] {
  const rows = buildVoyagePassengerRoomRows(orders)
  const map = new Map<string, VoyageSummary>()

  rows.forEach((row) => {
    const existing = map.get(row.voyageNo)
    if (!existing) {
      map.set(row.voyageNo, {
        voyageNo: row.voyageNo,
        ship: row.ship,
        sailDate: row.sailDate,
        route: row.route,
        voyageStatus: orders.find((order) => order.voyageNo === row.voyageNo)?.voyageStatus ?? '开放',
        guestCount: 1,
        orderCount: 0,
        pendingAssignmentCount: row.roomAssignmentStatus === '待排房' ? 1 : 0,
        allocationMismatchCount: row.allocationDiffers ? 1 : 0,
      })
      return
    }
    existing.guestCount += 1
    if (row.roomAssignmentStatus === '待排房') existing.pendingAssignmentCount += 1
    if (row.allocationDiffers) existing.allocationMismatchCount += 1
  })

  const orderNosByVoyage = new Map<string, Set<string>>()
  rows.forEach((row) => {
    const set = orderNosByVoyage.get(row.voyageNo) ?? new Set<string>()
    set.add(row.orderNo)
    orderNosByVoyage.set(row.voyageNo, set)
  })

  return Array.from(map.values())
    .map((summary) => ({
      ...summary,
      orderCount: orderNosByVoyage.get(summary.voyageNo)?.size ?? 0,
    }))
    .sort((a, b) => b.sailDate.localeCompare(a.sailDate) || a.voyageNo.localeCompare(b.voyageNo))
}

export function filterPassengerRows(
  rows: VoyagePassengerRoomRow[],
  voyageNo = '',
  keyword = '',
) {
  const normalizedKeyword = keyword.trim().toLowerCase()
  return rows.filter((row) => {
    if (voyageNo && voyageNo !== '全部' && row.voyageNo !== voyageNo) return false
    if (!normalizedKeyword) return true
    return (
      row.guestName.toLowerCase().includes(normalizedKeyword)
      || row.orderNo.toLowerCase().includes(normalizedKeyword)
      || row.groupName.toLowerCase().includes(normalizedKeyword)
      || row.voyageNo.toLowerCase().includes(normalizedKeyword)
      || row.ship.toLowerCase().includes(normalizedKeyword)
    )
  })
}
