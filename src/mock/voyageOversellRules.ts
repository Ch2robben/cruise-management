import { voyageInventories } from '@/mock/data'
import type { VoyageInventory } from '@/types'
import type { AllocationOrderRoom, FloorInventoryPool } from '@/mock/inventoryAllocation'

export interface VoyageOversellRule {
  id: string
  sellCabinType: string
  targetCabinTypes: string[]
  oversellLimit: number
}

const premiumCabinTypes = new Set(['套房', '行政房', '总统套房', '豪华套房'])

export function cabinPoolId(cabinTypeName: string) {
  return cabinTypeName.replace(/\s+/g, '-').toLowerCase()
}

function inferTier(cabinTypeName: string): FloorInventoryPool['tier'] {
  return premiumCabinTypes.has(cabinTypeName) ? 'premium' : 'basic'
}

const defaultRulesByVoyage: Record<string, VoyageOversellRule[]> = {
  v01: [
    { id: 'os-v01-1', sellCabinType: '海景房', targetCabinTypes: ['阳台房', '套房'], oversellLimit: 10 },
    { id: 'os-v01-2', sellCabinType: '阳台房', targetCabinTypes: ['套房'], oversellLimit: 5 },
  ],
  v17: [
    { id: 'os-v17-1', sellCabinType: '海景房', targetCabinTypes: ['阳台房', '套房'], oversellLimit: 8 },
  ],
  v18: [
    { id: 'os-v18-1', sellCabinType: '海景房', targetCabinTypes: ['阳台房'], oversellLimit: 6 },
    { id: 'os-v18-2', sellCabinType: '阳台房', targetCabinTypes: ['套房'], oversellLimit: 4 },
  ],
}

const rulesStore: Record<string, VoyageOversellRule[]> = JSON.parse(JSON.stringify(defaultRulesByVoyage))

export function getVoyageOversellRules(voyageId: string): VoyageOversellRule[] {
  return (rulesStore[voyageId] || []).map((rule) => ({
    ...rule,
    targetCabinTypes: [...rule.targetCabinTypes],
  }))
}

export function saveVoyageOversellRules(voyageId: string, rules: VoyageOversellRule[]) {
  rulesStore[voyageId] = rules.map((rule) => ({
    ...rule,
    targetCabinTypes: [...rule.targetCabinTypes],
  }))
}

export function getVoyageInventoryRows(voyageId: string): VoyageInventory[] {
  return voyageInventories.filter((item) => item.voyageId === voyageId)
}

export function buildPoolsFromVoyage(
  voyageId: string,
  rules: VoyageOversellRule[],
): FloorInventoryPool[] {
  const inventories = getVoyageInventoryRows(voyageId)
  const ruleMap = new Map(rules.map((rule) => [rule.sellCabinType, rule]))

  return inventories.map((item) => {
    const rule = ruleMap.get(item.cabinTypeName)
    const occupied = item.sold + item.locked + item.maintenance
    return {
      id: cabinPoolId(item.cabinTypeName),
      floorLabel: item.cabinTypeName,
      tier: inferTier(item.cabinTypeName),
      cabinType: item.cabinTypeName,
      release: item.totalRooms,
      sold: occupied,
      oversellLimit: rule?.oversellLimit ?? 0,
      upgradeTargets: (rule?.targetCabinTypes || []).map(cabinPoolId),
    }
  })
}

export function createEmptyOversellRule(cabinTypes: string[]): VoyageOversellRule {
  const sellCabinType = cabinTypes[0] || ''
  const targetCabinTypes = cabinTypes.filter((name) => name !== sellCabinType).slice(0, 1)
  return {
    id: `os-${Date.now()}`,
    sellCabinType,
    targetCabinTypes,
    oversellLimit: 5,
  }
}

const demoRoomsByVoyage: Record<string, AllocationOrderRoom[]> = {
  v01: [
    {
      id: 'v01-r1',
      orderNo: '00000001',
      groupName: '重庆云阳一团',
      roomSeq: 1,
      guestName: '张明',
      soldFloor: '海景房',
      soldCabinType: '海景房',
      soldPrice: 300,
      allocatedFloor: '阳台房',
      allocatedCabinType: '阳台房',
      inventoryStatus: 'oversold_pending',
      upgradeFee: 0,
      roomAssignmentStatus: '待排房',
    },
    {
      id: 'v01-r2',
      orderNo: '00000001',
      groupName: '重庆云阳一团',
      roomSeq: 2,
      guestName: '李红',
      soldFloor: '海景房',
      soldCabinType: '海景房',
      soldPrice: 300,
      allocatedFloor: '阳台房',
      allocatedCabinType: '阳台房',
      inventoryStatus: 'oversold_pending',
      upgradeFee: 0,
      roomAssignmentStatus: '待排房',
    },
    {
      id: 'v01-r3',
      orderNo: '00000088',
      groupName: '神州散客团',
      roomSeq: 1,
      guestName: '王强',
      soldFloor: '阳台房',
      soldCabinType: '阳台房',
      soldPrice: 500,
      allocatedFloor: '海景房',
      allocatedCabinType: '海景房',
      inventoryStatus: 'normal',
      upgradeFee: 200,
      roomAssignmentStatus: '待排房',
    },
    {
      id: 'v01-r4',
      orderNo: '00000092',
      groupName: '华东旅行社一团',
      roomSeq: 1,
      guestName: '赵丽',
      soldFloor: '海景房',
      soldCabinType: '海景房',
      soldPrice: 300,
      allocatedFloor: '套房',
      allocatedCabinType: '套房',
      inventoryStatus: 'auto_upgraded',
      upgradeFee: 0,
      roomAssignmentStatus: '待排房',
    },
  ],
}

export function getDemoAllocationRooms(voyageId: string): AllocationOrderRoom[] {
  const rooms = demoRoomsByVoyage[voyageId]
  if (!rooms) return []
  return rooms.map((room) => ({ ...room }))
}

export function prepareVoyageWorkbenchState(voyageId: string) {
  const rules = getVoyageOversellRules(voyageId)
  let pools = buildPoolsFromVoyage(voyageId, rules)
  const rooms = getDemoAllocationRooms(voyageId)

  if (voyageId === 'v01' && rooms.length > 0) {
    pools = pools.map((pool) => {
      if (pool.cabinType === '海景房') {
        return { ...pool, sold: pool.release }
      }
      const allocatedCount = rooms.filter((room) => room.allocatedCabinType === pool.cabinType).length
      if (allocatedCount > 0) {
        return { ...pool, sold: Math.min(pool.release, pool.sold + allocatedCount) }
      }
      return pool
    })
  }

  return {
    rules,
    pools: pools.length > 0 ? pools : [],
    rooms,
    logs: voyageId === 'v01'
      ? [
          {
            id: 'log-1',
            actionType: 'auto_upgrade' as const,
            actionLabel: '自动升舱',
            summary: '订单 00000092 房间1：海景房 库存不足，自动占用 套房，结算仍按 海景房 ¥300',
            operator: '系统',
            operatedAt: '2026-06-08 10:15:22',
          },
        ]
      : [],
  }
}
