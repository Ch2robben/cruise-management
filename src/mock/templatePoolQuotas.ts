import { dealers, products } from '@/mock/data'
import { inventoryPools } from '@/mock/inventoryPools'
import {
  getTemplateSegmentKeys,
  getTemplateSellRoomTypes,
  loadTemplateInventoryRules,
  segmentKey,
} from '@/mock/templateInventoryRules'
import type { InventoryPool, VoyageTemplate } from '@/types'

/** 航段 × 销售房型 上的池配额单元格 */
export interface TemplatePoolQuotaCell {
  physicalCapacity: number
  /** poolId → 可下单总量 */
  poolQty: Record<string, number>
}

/** sellRoomTypeCode → segmentKey → cell */
export type TemplatePoolQuotaRules = Record<string, Record<string, TemplatePoolQuotaCell>>

export interface PoolDealerAllocation {
  dealerId: string
  qty: number
}

/** sellRoomTypeCode → segmentKey → poolId → dealer allocations */
export type TemplatePoolDealerRules = Record<string, Record<string, Record<string, PoolDealerAllocation[]>>>

const quotaStore: Record<string, TemplatePoolQuotaRules> = {}
const dealerQuotaStore: Record<string, TemplatePoolDealerRules> = {}
const userSavedTemplateIds = new Set<string>()
/** templateId → sellRoom → segment → poolId → sold */
const poolSoldStore: Record<string, Record<string, Record<string, Record<string, number>>>> = {}

export function getPoolSold(
  templateId: string,
  sellRoomTypeCode: string,
  segKey: string,
  poolId: string,
) {
  return poolSoldStore[templateId]?.[sellRoomTypeCode]?.[segKey]?.[poolId] ?? 0
}

export function getPoolRemaining(
  templateId: string,
  sellRoomTypeCode: string,
  segKey: string,
  poolId: string,
  quotaTotal: number,
) {
  return Math.max(0, quotaTotal - getPoolSold(templateId, sellRoomTypeCode, segKey, poolId))
}

export function deductPoolSold(params: {
  templateId: string
  sellRoomTypeCode: string
  segmentKey: string
  poolId: string
  qty: number
}) {
  const { templateId, sellRoomTypeCode, segmentKey: segKey, poolId, qty } = params
  if (!poolSoldStore[templateId]) poolSoldStore[templateId] = {}
  if (!poolSoldStore[templateId][sellRoomTypeCode]) poolSoldStore[templateId][sellRoomTypeCode] = {}
  if (!poolSoldStore[templateId][sellRoomTypeCode][segKey]) {
    poolSoldStore[templateId][sellRoomTypeCode][segKey] = {}
  }
  const current = poolSoldStore[templateId][sellRoomTypeCode][segKey][poolId] ?? 0
  poolSoldStore[templateId][sellRoomTypeCode][segKey][poolId] = current + Math.max(0, qty)
  return poolSoldStore[templateId][sellRoomTypeCode][segKey][poolId]
}

export function aggregatePoolField(
  rules: TemplatePoolQuotaRules,
  sellRoomTypeCode: string,
  poolId: string,
) {
  const segmentMap = rules[sellRoomTypeCode] || {}
  return Object.values(segmentMap).reduce((sum, cell) => sum + (Number(cell.poolQty[poolId]) || 0), 0)
}

export function aggregatePoolPhysical(rules: TemplatePoolQuotaRules, sellRoomTypeCode: string) {
  const segmentMap = rules[sellRoomTypeCode] || {}
  return Object.values(segmentMap).reduce((sum, cell) => sum + (Number(cell.physicalCapacity) || 0), 0)
}

export function setAggregatedPoolQty(
  rules: TemplatePoolQuotaRules,
  sellRoomTypeCode: string,
  poolId: string,
  totalQuantity: number,
): TemplatePoolQuotaRules {
  const segmentMap = rules[sellRoomTypeCode] || {}
  const keys = Object.keys(segmentMap)
  if (keys.length === 0) return rules
  const safeTotal = Math.max(0, Math.floor(totalQuantity))
  const base = Math.floor(safeTotal / keys.length)
  let remain = safeTotal - base * keys.length
  const nextSeg: Record<string, TemplatePoolQuotaCell> = {}
  keys.forEach((key) => {
    const cell = segmentMap[key]
    const extra = remain > 0 ? 1 : 0
    if (remain > 0) remain -= 1
    nextSeg[key] = {
      ...cell,
      poolQty: { ...cell.poolQty, [poolId]: base + extra },
    }
  })
  return {
    ...rules,
    [sellRoomTypeCode]: nextSeg,
  }
}

function cloneQuotas(rules: TemplatePoolQuotaRules): TemplatePoolQuotaRules {
  return JSON.parse(JSON.stringify(rules)) as TemplatePoolQuotaRules
}

function cloneDealerRules(rules: TemplatePoolDealerRules): TemplatePoolDealerRules {
  return JSON.parse(JSON.stringify(rules)) as TemplatePoolDealerRules
}

export function getEnabledInventoryPools(): InventoryPool[] {
  return inventoryPools
    .filter((item) => item.status === 'enabled')
    .sort((a, b) => a.sort - b.sort || a.code.localeCompare(b.code))
}

export function getByDealerPools(): InventoryPool[] {
  return getEnabledInventoryPools().filter((item) => item.quotaMode === 'byDealer')
}

export function getPoolAllocatedTotal(cell: TemplatePoolQuotaCell) {
  return Object.values(cell.poolQty).reduce((sum, qty) => sum + (Number(qty) || 0), 0)
}

export function getPoolUnallocated(cell: TemplatePoolQuotaCell) {
  return Math.max(0, cell.physicalCapacity - getPoolAllocatedTotal(cell))
}

function defaultDealerIds() {
  const preferredNames = ['同程旅行邮轮事业部', '飞猪度假邮轮频道', '春秋旅游三峡专线']
  const preferred = preferredNames
    .map((name) => dealers.find((dealer) => dealer.name === name && dealer.status === 'cooperating')?.id)
    .filter((id): id is string => Boolean(id))
  if (preferred.length > 0) return preferred
  return dealers.filter((dealer) => dealer.status === 'cooperating').slice(0, 3).map((dealer) => dealer.id)
}

/** 从旧区域/全域/私有结构种子迁移到库存池配额（仅首次） */
function seedFromLegacy(template: VoyageTemplate): TemplatePoolQuotaRules {
  const legacy = loadTemplateInventoryRules(template)
  const rooms = getTemplateSellRoomTypes(template)
  const segmentKeys = getTemplateSegmentKeys(template)
  const pools = getEnabledInventoryPools()
  const sharedPools = pools.filter((p) => p.quotaMode === 'shared')
  const lockPools = pools.filter((p) => p.quotaMode === 'byDealer')
  const tradePool = sharedPools.find((p) => p.id === 'pool-1') ?? sharedPools[0]
  const otaPool = sharedPools.find((p) => p.id === 'pool-3') ?? sharedPools[1] ?? sharedPools[0]
  const directPool = sharedPools.find((p) => p.id === 'pool-4')
  const keyPool = lockPools.find((p) => p.id === 'pool-2') ?? lockPools[0]

  const rules: TemplatePoolQuotaRules = {}
  rooms.forEach((room) => {
    rules[room.code] = {}
    segmentKeys.forEach((segKey) => {
      const legacyCell = legacy[room.code]?.[segKey]
      const physicalCapacity = legacyCell?.physicalCapacity ?? 0
      const regional = legacyCell?.regionalPublicStock ?? 0
      const global = legacyCell?.globalPublicStock ?? 0
      const privatePool = Math.max(0, physicalCapacity - regional - global)
      const poolQty: Record<string, number> = {}
      pools.forEach((pool) => {
        poolQty[pool.id] = 0
      })
      if (tradePool) poolQty[tradePool.id] = regional
      if (otaPool && otaPool.id !== tradePool?.id) {
        poolQty[otaPool.id] = Math.floor(global * 0.7)
      } else if (otaPool) {
        poolQty[otaPool.id] += Math.floor(global * 0.7)
      }
      if (directPool && directPool.id !== tradePool?.id && directPool.id !== otaPool?.id) {
        poolQty[directPool.id] = global - Math.floor(global * 0.7)
      }
      if (keyPool) poolQty[keyPool.id] = privatePool
      rules[room.code][segKey] = { physicalCapacity, poolQty }
    })
  })
  return rules
}

function seedDealerFromQuotas(template: VoyageTemplate, quotas: TemplatePoolQuotaRules): TemplatePoolDealerRules {
  const dealerIds = defaultDealerIds()
  const byDealerPools = getByDealerPools()
  const rooms = getTemplateSellRoomTypes(template)
  const segmentKeys = getTemplateSegmentKeys(template)
  const rules: TemplatePoolDealerRules = {}

  rooms.forEach((room) => {
    rules[room.code] = {}
    segmentKeys.forEach((segKey) => {
      rules[room.code][segKey] = {}
      byDealerPools.forEach((pool) => {
        const total = quotas[room.code]?.[segKey]?.poolQty[pool.id] ?? 0
        if (total <= 0 || dealerIds.length === 0) {
          rules[room.code][segKey][pool.id] = dealerIds.map((dealerId) => ({ dealerId, qty: 0 }))
          return
        }
        const base = Math.floor(total / dealerIds.length)
        let remain = total - base * dealerIds.length
        rules[room.code][segKey][pool.id] = dealerIds.map((dealerId) => {
          const extra = remain > 0 ? 1 : 0
          if (remain > 0) remain -= 1
          return { dealerId, qty: base + extra }
        })
      })
    })
  })
  return rules
}

export function loadTemplatePoolQuotas(template: VoyageTemplate): TemplatePoolQuotaRules {
  if (!quotaStore[template.id]) {
    quotaStore[template.id] = seedFromLegacy(template)
  }
  // 确保新增启用池有列
  const pools = getEnabledInventoryPools()
  const current = cloneQuotas(quotaStore[template.id])
  Object.values(current).forEach((segmentMap) => {
    Object.values(segmentMap).forEach((cell) => {
      pools.forEach((pool) => {
        if (cell.poolQty[pool.id] == null) cell.poolQty[pool.id] = 0
      })
    })
  })
  return current
}

export function loadTemplatePoolDealerRules(
  template: VoyageTemplate,
  quotas?: TemplatePoolQuotaRules,
): TemplatePoolDealerRules {
  const q = quotas ?? loadTemplatePoolQuotas(template)
  if (!dealerQuotaStore[template.id]) {
    dealerQuotaStore[template.id] = seedDealerFromQuotas(template, q)
  }
  return cloneDealerRules(dealerQuotaStore[template.id])
}

export function saveTemplatePoolQuotas(templateId: string, rules: TemplatePoolQuotaRules) {
  quotaStore[templateId] = cloneQuotas(rules)
  userSavedTemplateIds.add(templateId)
}

export function saveTemplatePoolDealerRules(templateId: string, rules: TemplatePoolDealerRules) {
  dealerQuotaStore[templateId] = cloneDealerRules(rules)
  userSavedTemplateIds.add(templateId)
}

export function hasConfiguredTemplatePoolQuotas(templateId: string) {
  return userSavedTemplateIds.has(templateId)
}

export function summarizeTemplatePoolQuotas(rules?: TemplatePoolQuotaRules) {
  if (!rules) return null
  let physicalCapacity = 0
  let allocated = 0
  const byPool: Record<string, number> = {}
  Object.values(rules).forEach((segmentMap) => {
    Object.values(segmentMap).forEach((cell) => {
      physicalCapacity += cell.physicalCapacity
      Object.entries(cell.poolQty).forEach(([poolId, qty]) => {
        const n = Number(qty) || 0
        allocated += n
        byPool[poolId] = (byPool[poolId] || 0) + n
      })
    })
  })
  return {
    physicalCapacity,
    allocated,
    unallocated: Math.max(0, physicalCapacity - allocated),
    byPool,
    totalAvailable: allocated,
  }
}

export function findPoolOverAllocations(rules: TemplatePoolQuotaRules) {
  const overs: { sellRoomTypeCode: string; segmentKey: string; allocated: number; physicalCapacity: number }[] = []
  Object.entries(rules).forEach(([sellRoomTypeCode, segmentMap]) => {
    Object.entries(segmentMap).forEach(([segKey, cell]) => {
      const allocated = getPoolAllocatedTotal(cell)
      if (allocated > cell.physicalCapacity) {
        overs.push({
          sellRoomTypeCode,
          segmentKey: segKey,
          allocated,
          physicalCapacity: cell.physicalCapacity,
        })
      }
    })
  })
  return overs
}

export function findDealerOverAllocations(
  quotas: TemplatePoolQuotaRules,
  dealerRules: TemplatePoolDealerRules,
) {
  const overs: { sellRoomTypeCode: string; segmentKey: string; poolId: string; dealerSum: number; poolQty: number }[] = []
  Object.entries(dealerRules).forEach(([sellRoomTypeCode, segmentMap]) => {
    Object.entries(segmentMap).forEach(([segKey, poolMap]) => {
      Object.entries(poolMap).forEach(([poolId, allocations]) => {
        const poolQty = quotas[sellRoomTypeCode]?.[segKey]?.poolQty[poolId] ?? 0
        const dealerSum = allocations.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
        if (dealerSum > poolQty) {
          overs.push({ sellRoomTypeCode, segmentKey: segKey, poolId, dealerSum, poolQty })
        }
      })
    })
  })
  return overs
}

export function collectPoolDealerIds(rules: TemplatePoolDealerRules) {
  const ids = new Set<string>()
  Object.values(rules).forEach((segmentMap) => {
    Object.values(segmentMap).forEach((poolMap) => {
      Object.values(poolMap).forEach((allocations) => {
        allocations.forEach((item) => ids.add(item.dealerId))
      })
    })
  })
  return Array.from(ids)
}

export function setPoolDealerQuantity(
  allocations: PoolDealerAllocation[],
  dealerId: string,
  qty: number,
): PoolDealerAllocation[] {
  const next = allocations.map((item) => ({ ...item }))
  const idx = next.findIndex((item) => item.dealerId === dealerId)
  if (idx === -1) next.push({ dealerId, qty })
  else next[idx] = { ...next[idx], qty }
  return next
}

export { segmentKey, getTemplateSegmentKeys }

export function getProductSegments(template: VoyageTemplate) {
  return products.find((item) => item.id === template.productId)?.segments || []
}
