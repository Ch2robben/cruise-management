export type AllocationInventoryStatus = 'normal' | 'oversold_pending' | 'auto_upgraded' | 'swapped'
export type RoomAssignmentStatus = '待排房' | '已排房'

export interface FloorInventoryPool {
  id: string
  floorLabel: string
  tier: 'basic' | 'premium'
  cabinType: string
  release: number
  sold: number
  oversellLimit: number
  upgradeTargets: string[]
}

export interface AllocationOrderRoom {
  id: string
  orderNo: string
  groupName: string
  roomSeq: number
  guestName: string
  soldFloor: string
  soldCabinType: string
  soldPrice: number
  allocatedFloor: string
  allocatedCabinType: string
  inventoryStatus: AllocationInventoryStatus
  upgradeFee: number
  roomAssignmentStatus: RoomAssignmentStatus
}

export interface AllocationLog {
  id: string
  actionType: 'auto_upgrade' | 'manual_change_cabin' | 'order_swap'
  actionLabel: string
  summary: string
  operator: string
  operatedAt: string
}

export const demoVoyage = {
  voyageNo: 'V20260615',
  shipName: '长江叁号',
  route: '重庆 → 宜昌',
  sailDate: '2026-06-15',
}

export const initialFloorPools: FloorInventoryPool[] = [
  { id: '2f-std', floorLabel: '2F', tier: 'basic', cabinType: '豪华阳台标准间', release: 80, sold: 80, oversellLimit: 10, upgradeTargets: ['4f-std', '5f-std'] },
  { id: '3f-std', floorLabel: '3F', tier: 'basic', cabinType: '豪华阳台标准间', release: 72, sold: 72, oversellLimit: 8, upgradeTargets: ['4f-std', '5f-std'] },
  { id: '4f-std', floorLabel: '4F', tier: 'premium', cabinType: '豪华阳台标准间', release: 64, sold: 46, oversellLimit: 0, upgradeTargets: [] },
  { id: '5f-std', floorLabel: '5F', tier: 'premium', cabinType: '豪华阳台标准间', release: 48, sold: 28, oversellLimit: 0, upgradeTargets: [] },
]

export const initialAllocationRooms: AllocationOrderRoom[] = [
  {
    id: 'r1',
    orderNo: '00000001',
    groupName: '重庆云阳一团',
    roomSeq: 1,
    guestName: '张明',
    soldFloor: '2F',
    soldCabinType: '标准间',
    soldPrice: 2980,
    allocatedFloor: '4F',
    allocatedCabinType: '标准间',
    inventoryStatus: 'oversold_pending',
    upgradeFee: 0,
    roomAssignmentStatus: '待排房',
  },
  {
    id: 'r2',
    orderNo: '00000001',
    groupName: '重庆云阳一团',
    roomSeq: 2,
    guestName: '李红',
    soldFloor: '2F',
    soldCabinType: '标准间',
    soldPrice: 2980,
    allocatedFloor: '4F',
    allocatedCabinType: '标准间',
    inventoryStatus: 'oversold_pending',
    upgradeFee: 0,
    roomAssignmentStatus: '待排房',
  },
  {
    id: 'r3',
    orderNo: '00000088',
    groupName: '神州散客团',
    roomSeq: 1,
    guestName: '王强',
    soldFloor: '4F',
    soldCabinType: '标准间',
    soldPrice: 3680,
    allocatedFloor: '2F',
    allocatedCabinType: '标准间',
    inventoryStatus: 'normal',
    upgradeFee: 700,
    roomAssignmentStatus: '待排房',
  },
  {
    id: 'r4',
    orderNo: '00000092',
    groupName: '华东旅行社一团',
    roomSeq: 1,
    guestName: '赵丽',
    soldFloor: '3F',
    soldCabinType: '标准间',
    soldPrice: 2980,
    allocatedFloor: '5F',
    allocatedCabinType: '标准间',
    inventoryStatus: 'auto_upgraded',
    upgradeFee: 0,
    roomAssignmentStatus: '待排房',
  },
]

export const initialAllocationLogs: AllocationLog[] = [
  {
    id: 'log-1',
    actionType: 'auto_upgrade',
    actionLabel: '自动升舱',
    summary: '订单 00000092 房间1：3F 库存不足，自动占用 5F，结算仍按 3F ¥2,980',
    operator: '系统',
    operatedAt: '2026-06-08 10:15:22',
  },
]

export function poolAvailable(pool: FloorInventoryPool) {
  return Math.max(0, pool.release + pool.oversellLimit - pool.sold)
}

export function statusLabel(status: AllocationInventoryStatus) {
  const map: Record<AllocationInventoryStatus, string> = {
    normal: '正常',
    oversold_pending: '超售待调配',
    auto_upgraded: '已自动升舱',
    swapped: '已对调',
  }
  return map[status]
}

export function statusClass(status: AllocationInventoryStatus) {
  const map: Record<AllocationInventoryStatus, string> = {
    normal: 'bg-gray-100 text-gray-600',
    oversold_pending: 'bg-orange-100 text-orange-700',
    auto_upgraded: 'bg-blue-100 text-blue-700',
    swapped: 'bg-green-100 text-green-700',
  }
  return map[status]
}
