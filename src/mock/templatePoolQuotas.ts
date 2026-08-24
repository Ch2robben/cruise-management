import { dealers, products, voyageInventories } from '@/mock/data'
import { inventoryPools } from '@/mock/inventoryPools'
import { getTemplateSellRoomTypes, type TemplateSellRoomType } from '@/mock/sellRoomTypeConfig'
import type { InventoryPool, ProductSegment, VoyageTemplate } from '@/types'

/** 航段 key；可售配额统一走命名库存池（旧区域/全域/私有模型已移除） */
export const segmentKey = (segment: ProductSegment) => `${segment.startPort}-${segment.endPort}`

export function getTemplateSegmentKeys(template: VoyageTemplate) {
  const segments = products.find((item) => item.id === template.productId)?.segments || []
  if (segments.length === 0) return ['全程']
  return segments.map(segmentKey)
}

function resolvePhysicalCapacity(template: VoyageTemplate, sellRoom: TemplateSellRoomType) {
  const shipInventories = voyageInventories.filter((item) => item.shipName === template.shipName)
  const mappedNames = sellRoom.config?.mappings.map((item) => item.physicalCabinName) || []
  if (mappedNames.length > 0) {
    const matched = shipInventories.filter((item) =>
      mappedNames.some(
        (name) => item.cabinTypeName === name || name.includes(item.cabinTypeName),
      ),
    )
    if (matched.length > 0) {
      return matched.reduce((sum, item) => sum + item.physicalCapacity, 0)
    }
  }
  const direct = shipInventories.find((item) => item.cabinTypeName === sellRoom.name)
  return direct?.physicalCapacity ?? 0
}

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

const STORAGE_KEY = 'cruise-pool-quota-demo-v1'
const CHANGE_EVENT = 'cruise-pool-quota-changed'
const STORAGE_VERSION = 1

type PoolSoldStore = Record<string, Record<string, Record<string, Record<string, number>>>>

interface PersistedPoolState {
  version: number
  quotas: Record<string, TemplatePoolQuotaRules>
  dealerQuotas: Record<string, TemplatePoolDealerRules>
  savedTemplateIds: string[]
  sold: PoolSoldStore
}

let quotaStore: Record<string, TemplatePoolQuotaRules> = {}
let dealerQuotaStore: Record<string, TemplatePoolDealerRules> = {}
let userSavedTemplateIds = new Set<string>()
/** templateId → sellRoom → segment → poolId → sold */
let poolSoldStore: PoolSoldStore = {}

function canUseStorage() {
  try {
    return (
      typeof window !== 'undefined'
      && typeof window.localStorage?.getItem === 'function'
      && typeof window.localStorage?.setItem === 'function'
    )
  } catch {
    return false
  }
}

function snapshotState(): PersistedPoolState {
  return {
    version: STORAGE_VERSION,
    quotas: quotaStore,
    dealerQuotas: dealerQuotaStore,
    savedTemplateIds: Array.from(userSavedTemplateIds),
    sold: poolSoldStore,
  }
}

function applySnapshot(parsed: PersistedPoolState) {
  quotaStore = parsed.quotas && typeof parsed.quotas === 'object' ? parsed.quotas : {}
  dealerQuotaStore = parsed.dealerQuotas && typeof parsed.dealerQuotas === 'object' ? parsed.dealerQuotas : {}
  userSavedTemplateIds = new Set(Array.isArray(parsed.savedTemplateIds) ? parsed.savedTemplateIds : [])
  poolSoldStore = parsed.sold && typeof parsed.sold === 'object' ? parsed.sold : {}
}

function persistPoolState() {
  if (!canUseStorage()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshotState()))
  } catch {
    /* quota exceeded / private mode */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function hydratePoolState() {
  if (!canUseStorage()) return
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as PersistedPoolState
    if (!parsed || parsed.version !== STORAGE_VERSION) return
    applySnapshot(parsed)
  } catch {
    /* ignore corrupt payload */
  }
}

hydratePoolState()

/** 配额/已售变更后通知当前页（及跨 Tab 的 storage 事件） */
export function subscribePoolQuotaStore(listener: () => void) {
  if (typeof window === 'undefined') return () => {}
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return
    hydratePoolState()
    listener()
  }
  window.addEventListener(CHANGE_EVENT, listener)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** 清空本机演示配额与已售，下次读取会重新按物理容量种子 */
export function resetPoolDemoState() {
  quotaStore = {}
  dealerQuotaStore = {}
  userSavedTemplateIds = new Set()
  poolSoldStore = {}
  if (canUseStorage()) {
    window.localStorage.removeItem(STORAGE_KEY)
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }
}

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
  persistPoolState()
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

/**
 * 按物理容量直接种子命名池配额（不再经过旧公私有结构）。
 * 演示模板 vt01/vt04：同业共享约 35%、OTA 约 28%、直销约 12%、大客户锁配额约 25%。
 */
function seedPoolQuotas(template: VoyageTemplate): TemplatePoolQuotaRules {
  const shouldSeed = ['vt01', 'vt04'].includes(template.id)
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
    const physicalCapacity = resolvePhysicalCapacity(template, room)
    segmentKeys.forEach((segKey, segmentIndex) => {
      const poolQty: Record<string, number> = {}
      pools.forEach((pool) => {
        poolQty[pool.id] = 0
      })
      if (shouldSeed && physicalCapacity > 0) {
        const base = Math.max(0, physicalCapacity - segmentIndex * 2)
        const trade = Math.floor(base * 0.35)
        const ota = Math.floor(base * 0.28)
        const direct = Math.floor(base * 0.12)
        const key = Math.max(0, base - trade - ota - direct)
        if (tradePool) poolQty[tradePool.id] = trade
        if (otaPool) poolQty[otaPool.id] = (poolQty[otaPool.id] || 0) + ota
        if (directPool) poolQty[directPool.id] = (poolQty[directPool.id] || 0) + direct
        if (keyPool) poolQty[keyPool.id] = key
      }
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
    quotaStore[template.id] = seedPoolQuotas(template)
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
  persistPoolState()
}

export function saveTemplatePoolDealerRules(templateId: string, rules: TemplatePoolDealerRules) {
  dealerQuotaStore[templateId] = cloneDealerRules(rules)
  userSavedTemplateIds.add(templateId)
  persistPoolState()
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

export function getProductSegments(template: VoyageTemplate) {
  return products.find((item) => item.id === template.productId)?.segments || []
}
