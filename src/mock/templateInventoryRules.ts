import { dealers, products, voyageInventories } from '@/mock/data'
import {
  getTemplateSellRoomTypes,
  type TemplateSellRoomType,
} from '@/mock/sellRoomTypeConfig'
import { getTemplateSegmentsCount } from '@/mock/templatePriceRules'
import type { ProductSegment, VoyageTemplate } from '@/types'

export interface TemplateInventoryCell {
  physicalCapacity: number
  /** 区域公共库存（区域结算价专用，全经销商共享） */
  regionalPublicStock: number
  /** 全域公共库存（全域结算价专用，全经销商共享） */
  globalPublicStock: number
}

export type TemplateSegmentInventory = Record<string, TemplateInventoryCell>
export type TemplateCabinInventoryRule = TemplateSegmentInventory
export type TemplateInventoryRules = Record<string, TemplateCabinInventoryRule>

export type DealerPrivateStockKind = 'regionalPrivate' | 'private'

export const DEALER_PRIVATE_STOCK_KINDS: { value: DealerPrivateStockKind; label: string; hint: string }[] = [
  { value: 'regionalPrivate', label: '区域私有库存', hint: '仅区域结算价可用' },
  { value: 'private', label: '私有库存', hint: '区域/全域结算价均可用' },
]

export interface DealerStockAllocation {
  dealerId: string
  /** 区域私有库存 */
  regionalPrivateQty: number
  /** 私有库存 */
  privateQty: number
}

/** sellRoomTypeCode -> segmentKey -> dealer allocations */
export type TemplateDealerInventoryRules = Record<string, Record<string, DealerStockAllocation[]>>

const inventoryRulesStore: Record<string, TemplateCabinInventoryRule> = {}
const dealerInventoryStore: Record<string, TemplateDealerInventoryRules> = {}

export const segmentKey = (segment: ProductSegment) => `${segment.startPort}-${segment.endPort}`

/** 经销商私有库存池上限 = 物理容量 − 区域公共 − 全域公共（区域私有+私有共用此池） */
export function getDealerStockPool(cell: TemplateInventoryCell) {
  return Math.max(0, cell.physicalCapacity - cell.regionalPublicStock - cell.globalPublicStock)
}

export function getSellableTotal(cell: TemplateInventoryCell) {
  return cell.regionalPublicStock + cell.globalPublicStock + getDealerStockPool(cell)
}

export function normalizeDealerAllocation(
  raw: Partial<DealerStockAllocation> & { quantity?: number; dealerId: string },
): DealerStockAllocation {
  const legacyQty = Number(raw.quantity) || 0
  const hasNewFields = raw.regionalPrivateQty != null || raw.privateQty != null
  return {
    dealerId: raw.dealerId,
    regionalPrivateQty: Number(raw.regionalPrivateQty) || (hasNewFields ? 0 : Math.floor(legacyQty * 0.4)),
    privateQty: Number(raw.privateQty) || (hasNewFields ? 0 : legacyQty - Math.floor(legacyQty * 0.4)),
  }
}

export function getDealerStockQty(allocation: DealerStockAllocation | undefined, kind: DealerPrivateStockKind) {
  if (!allocation) return 0
  return kind === 'regionalPrivate' ? allocation.regionalPrivateQty : allocation.privateQty
}

export function getDealerTotalQty(allocation: DealerStockAllocation | undefined) {
  if (!allocation) return 0
  return allocation.regionalPrivateQty + allocation.privateQty
}

function normalizeCell(cell: Partial<TemplateInventoryCell> & Record<string, unknown>): TemplateInventoryCell {
  const physicalCapacity = Number(cell.physicalCapacity) || 0
  const regionalPublicStock = Number(
    cell.regionalPublicStock ?? cell.publicStock ?? cell.sharedStock,
  ) || 0
  const globalPublicStock = Number(
    cell.globalPublicStock ?? cell.onlineChannel ?? cell.onlineRetail,
  ) || 0
  return {
    physicalCapacity,
    regionalPublicStock,
    globalPublicStock,
  }
}

function getProduct(template: VoyageTemplate) {
  return products.find((item) => item.id === template.productId)
}

function getPhysicalCapacity(template: VoyageTemplate, sellRoom: TemplateSellRoomType) {
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

export function getTemplateSegmentKeys(template: VoyageTemplate) {
  const product = getProduct(template)
  const segments = product?.segments || []
  if (segments.length === 0) return ['全程']
  return segments.map(segmentKey)
}

function getDefaultDealerIds() {
  const preferredNames = ['同程旅行邮轮事业部', '飞猪度假邮轮频道', '春秋旅游三峡专线']
  const preferred = preferredNames
    .map((name) => dealers.find((dealer) => dealer.name === name && dealer.status === 'cooperating')?.id)
    .filter((id): id is string => Boolean(id))
  if (preferred.length > 0) return preferred
  return dealers.filter((dealer) => dealer.status === 'cooperating').slice(0, 3).map((dealer) => dealer.id)
}

/**
 * 三峡下水模板演示数据（与配置库存 Step2 原型一致）
 * 顺序：套房 / 阳台房 / 海景房；经销商：同程 / 飞猪 / 春秋
 */
const DEMO_SEGMENT_ALLOCATION: Record<
  string,
  {
    pools: [number, number, number]
    regional: [number, number, number][]
    private: [number, number, number][]
  }
> = {
  '重庆港-丰都': {
    pools: [15, 7, 10],
    regional: [
      [2, 1, 2],
      [2, 1, 1],
      [2, 0, 1],
    ],
    private: [
      [3, 2, 2],
      [3, 2, 2],
      [3, 1, 2],
    ],
  },
  '重庆港-奉节': {
    pools: [17, 9, 12],
    regional: [
      [2, 1, 2],
      [2, 1, 1],
      [2, 1, 1],
    ],
    private: [
      [4, 2, 3],
      [4, 2, 3],
      [3, 2, 2],
    ],
  },
  '重庆港-宜昌港': {
    pools: [19, 11, 14],
    regional: [
      [3, 2, 2],
      [2, 1, 2],
      [2, 1, 1],
    ],
    private: [
      [4, 3, 3],
      [4, 2, 3],
      [4, 2, 3],
    ],
  },
}

function applyDemoInventoryPools(template: VoyageTemplate, rules: TemplateInventoryRules): TemplateInventoryRules {
  if (template.id !== 'vt01') return rules
  const sellRooms = getTemplateSellRoomTypes(template)
  const ordered = ['套房', '阳台房', '海景房']
    .map((name) => sellRooms.find((item) => item.name === name))
    .filter((item): item is TemplateSellRoomType => Boolean(item))
  if (ordered.length < 3) return rules

  const next: TemplateInventoryRules = { ...rules }
  Object.entries(DEMO_SEGMENT_ALLOCATION).forEach(([segKey, demo]) => {
    ordered.forEach((room, roomIndex) => {
      const cabinRule = { ...(next[room.code] || {}) }
      const cell = cabinRule[segKey]
      if (!cell) return
      const pool = demo.pools[roomIndex]
      const publicUsed = Math.max(0, cell.physicalCapacity - pool)
      const regionalPublicStock = Math.floor(publicUsed * 0.45)
      cabinRule[segKey] = {
        ...cell,
        regionalPublicStock,
        globalPublicStock: publicUsed - regionalPublicStock,
      }
      next[room.code] = cabinRule
    })
  })
  return next
}

function createDemoDealerInventoryRules(
  template: VoyageTemplate,
  inventoryRules: TemplateInventoryRules,
): TemplateDealerInventoryRules {
  const dealerIds = getDefaultDealerIds()
  const sellRooms = getTemplateSellRoomTypes(template)
  const ordered = ['套房', '阳台房', '海景房']
    .map((name) => sellRooms.find((item) => item.name === name))
    .filter((item): item is TemplateSellRoomType => Boolean(item))
  const result: TemplateDealerInventoryRules = {}

  sellRooms.forEach((sellRoom) => {
    result[sellRoom.code] = {}
    const cabinRule = inventoryRules[sellRoom.code] || {}
    Object.entries(cabinRule).forEach(([segKey, cell]) => {
      const demo = DEMO_SEGMENT_ALLOCATION[segKey]
      const roomIndex = ordered.findIndex((item) => item.code === sellRoom.code)
      if (demo && roomIndex >= 0 && dealerIds.length >= 3) {
        result[sellRoom.code][segKey] = dealerIds.slice(0, 3).map((dealerId, dealerIndex) => ({
          dealerId,
          regionalPrivateQty: demo.regional[dealerIndex][roomIndex],
          privateQty: demo.private[dealerIndex][roomIndex],
        }))
      } else {
        result[sellRoom.code][segKey] = splitPoolAmongDealers(getDealerStockPool(cell), dealerIds)
      }
    })
  })
  return result
}

function splitPoolAmongDealers(pool: number, dealerIds: string[]): DealerStockAllocation[] {
  if (pool <= 0 || dealerIds.length === 0) return []
  const regionalPool = Math.floor(pool * 0.4)
  const privatePool = pool - regionalPool

  const split = (total: number) => {
    const base = Math.floor(total / dealerIds.length)
    const remainder = total % dealerIds.length
    return dealerIds.map((_, index) => base + (index < remainder ? 1 : 0))
  }

  const regionalParts = split(regionalPool)
  const privateParts = split(privatePool)
  return dealerIds.map((dealerId, index) => ({
    dealerId,
    regionalPrivateQty: regionalParts[index],
    privateQty: privateParts[index],
  }))
}

export function createDefaultCabinInventoryRule(
  template: VoyageTemplate,
  sellRoom: TemplateSellRoomType,
  seed = false,
): TemplateCabinInventoryRule {
  const product = getProduct(template)
  const segments = product?.segments || []
  const physicalCapacity = getPhysicalCapacity(template, sellRoom)
  const rule: TemplateCabinInventoryRule = {}

  if (segments.length === 0) {
    const base = seed ? Math.max(0, physicalCapacity - 2) : 0
    const regionalPublicStock = seed ? Math.floor(base * 0.35) : 0
    const globalPublicStock = seed ? Math.floor(base * 0.4) : 0
    rule['全程'] = {
      physicalCapacity,
      regionalPublicStock,
      globalPublicStock,
    }
    return rule
  }

  segments.forEach((segment, segmentIndex) => {
    const key = segmentKey(segment)
    const base = seed ? Math.max(0, physicalCapacity - segmentIndex * 2) : 0
    const regionalPublicStock = seed ? Math.floor(base * 0.35) : 0
    const globalPublicStock = seed ? Math.floor(base * 0.4) : 0
    rule[key] = {
      physicalCapacity,
      regionalPublicStock,
      globalPublicStock,
    }
  })
  return rule
}

function getInventoryRuleKey(templateId: string, sellRoomTypeCode: string) {
  return `${templateId}_${sellRoomTypeCode}`
}

export function loadTemplateInventoryRules(template: VoyageTemplate, seedTemplateIds: string[] = ['vt01', 'vt04']) {
  const shouldSeed = seedTemplateIds.includes(template.id)
  const rules: TemplateInventoryRules = {}
  getTemplateSellRoomTypes(template).forEach((sellRoom) => {
    const raw =
      inventoryRulesStore[getInventoryRuleKey(template.id, sellRoom.code)] ||
      createDefaultCabinInventoryRule(template, sellRoom, shouldSeed)
    const normalized: TemplateCabinInventoryRule = {}
    Object.entries(raw).forEach(([key, cell]) => {
      normalized[key] = normalizeCell(cell as TemplateInventoryCell & Record<string, unknown>)
    })
    rules[sellRoom.code] = normalized
  })
  return shouldSeed ? applyDemoInventoryPools(template, rules) : rules
}

export function saveTemplateInventoryRules(templateId: string, rules: TemplateInventoryRules) {
  Object.entries(rules).forEach(([sellRoomTypeCode, rule]) => {
    inventoryRulesStore[getInventoryRuleKey(templateId, sellRoomTypeCode)] = rule
  })
}

export function createDefaultDealerInventoryRules(
  template: VoyageTemplate,
  inventoryRules: TemplateInventoryRules,
  seed = false,
): TemplateDealerInventoryRules {
  const dealerIds = getDefaultDealerIds()
  const result: TemplateDealerInventoryRules = {}

  getTemplateSellRoomTypes(template).forEach((sellRoom) => {
    result[sellRoom.code] = {}
    const cabinRule = inventoryRules[sellRoom.code] || {}
    Object.entries(cabinRule).forEach(([segKey, cell]) => {
      result[sellRoom.code][segKey] = seed
        ? splitPoolAmongDealers(getDealerStockPool(cell), dealerIds)
        : []
    })
  })
  return result
}

export function loadDealerInventoryRules(
  template: VoyageTemplate,
  inventoryRules: TemplateInventoryRules,
  seedTemplateIds: string[] = ['vt01', 'vt04'],
) {
  const shouldSeed = seedTemplateIds.includes(template.id)
  if (dealerInventoryStore[template.id]) return dealerInventoryStore[template.id]
  if (shouldSeed && template.id === 'vt01') {
    return createDemoDealerInventoryRules(template, inventoryRules)
  }
  return createDefaultDealerInventoryRules(template, inventoryRules, shouldSeed)
}

export function saveDealerInventoryRules(templateId: string, rules: TemplateDealerInventoryRules) {
  dealerInventoryStore[templateId] = rules
}

export function hasConfiguredTemplateInventory(templateId: string, sellRoomTypeCodes: string[]) {
  const hasChannelConfig = sellRoomTypeCodes.some((code) =>
    Boolean(inventoryRulesStore[getInventoryRuleKey(templateId, code)]),
  )
  const hasDealerConfig = Boolean(dealerInventoryStore[templateId])
  return hasChannelConfig || hasDealerConfig
}

export function summarizeTemplateInventory(rules?: TemplateInventoryRules) {
  if (!rules) return null
  let regionalPublicStock = 0
  let globalPublicStock = 0
  let dealerStockPool = 0
  Object.values(rules).forEach((segmentRule) => {
    Object.values(segmentRule).forEach((cell) => {
      regionalPublicStock += cell.regionalPublicStock
      globalPublicStock += cell.globalPublicStock
      dealerStockPool += getDealerStockPool(cell)
    })
  })
  return {
    totalAvailable: regionalPublicStock + globalPublicStock + dealerStockPool,
    regionalPublicStock,
    globalPublicStock,
    dealerStockPool,
    /** @deprecated 兼容旧字段名 */
    publicStock: regionalPublicStock,
    onlineChannel: globalPublicStock,
  }
}

export function sumDealerAllocations(allocations: DealerStockAllocation[]) {
  return allocations.reduce((sum, item) => sum + getDealerTotalQty(normalizeDealerAllocation(item)), 0)
}

export function sumDealerAllocationsByKind(
  allocations: DealerStockAllocation[],
  kind: DealerPrivateStockKind,
) {
  return allocations.reduce(
    (sum, item) => sum + getDealerStockQty(normalizeDealerAllocation(item), kind),
    0,
  )
}

export function getDealerQuantity(
  allocations: DealerStockAllocation[],
  dealerId: string,
  kind: DealerPrivateStockKind = 'private',
) {
  const found = allocations.find((item) => item.dealerId === dealerId)
  return getDealerStockQty(found ? normalizeDealerAllocation(found) : undefined, kind)
}

export function setDealerQuantity(
  allocations: DealerStockAllocation[],
  dealerId: string,
  quantity: number,
  kind: DealerPrivateStockKind = 'private',
): DealerStockAllocation[] {
  const normalized = allocations.map((item) => normalizeDealerAllocation(item))
  const exists = normalized.some((item) => item.dealerId === dealerId)
  if (!exists) {
    return [
      ...normalized,
      normalizeDealerAllocation({
        dealerId,
        regionalPrivateQty: kind === 'regionalPrivate' ? quantity : 0,
        privateQty: kind === 'private' ? quantity : 0,
      }),
    ]
  }
  return normalized.map((item) => {
    if (item.dealerId !== dealerId) return item
    return kind === 'regionalPrivate'
      ? { ...item, regionalPrivateQty: quantity }
      : { ...item, privateQty: quantity }
  })
}

export function collectSelectedDealerIds(rules: TemplateDealerInventoryRules) {
  const ids = new Set<string>()
  Object.values(rules).forEach((segmentMap) => {
    Object.values(segmentMap).forEach((allocations) => {
      allocations.forEach((item) => {
        const normalized = normalizeDealerAllocation(item)
        if (getDealerTotalQty(normalized) > 0 || ids.has(item.dealerId)) ids.add(item.dealerId)
      })
    })
  })
  return Array.from(ids)
}

export interface AllocationWarning {
  sellRoomTypeCode: string
  segmentKey: string
  pool: number
  allocated: number
}

export function findOverAllocations(
  inventoryRules: TemplateInventoryRules,
  dealerRules: TemplateDealerInventoryRules,
): AllocationWarning[] {
  const warnings: AllocationWarning[] = []
  Object.entries(inventoryRules).forEach(([sellRoomTypeCode, segmentRule]) => {
    Object.entries(segmentRule).forEach(([segKey, cell]) => {
      const allocations = dealerRules[sellRoomTypeCode]?.[segKey] || []
      const allocated = sumDealerAllocations(allocations)
      const pool = getDealerStockPool(cell)
      if (allocated > pool) {
        warnings.push({ sellRoomTypeCode, segmentKey: segKey, pool, allocated })
      }
    })
  })
  return warnings
}

export function getTemplateSegmentsCountSafe(template: VoyageTemplate) {
  return getTemplateSegmentsCount(template)
}

export function aggregateDealerStockPool(
  inventoryRules: TemplateInventoryRules,
  sellRoomTypeCode: string,
): number {
  const segmentRule = inventoryRules[sellRoomTypeCode] || {}
  return Object.values(segmentRule).reduce((sum, cell) => sum + getDealerStockPool(cell), 0)
}

export function aggregatePublicStock(
  inventoryRules: TemplateInventoryRules,
  sellRoomTypeCode: string,
): number {
  return aggregateInventoryField(inventoryRules, sellRoomTypeCode, 'regionalPublicStock')
}

export function aggregatePhysicalCapacity(
  inventoryRules: TemplateInventoryRules,
  sellRoomTypeCode: string,
): number {
  return aggregateInventoryField(inventoryRules, sellRoomTypeCode, 'physicalCapacity')
}

export function aggregateInventoryField(
  inventoryRules: TemplateInventoryRules,
  sellRoomTypeCode: string,
  field: keyof TemplateInventoryCell,
): number {
  const segmentRule = inventoryRules[sellRoomTypeCode] || {}
  return Object.values(segmentRule).reduce((sum, cell) => sum + Number(cell[field] || 0), 0)
}

export function setAggregatedInventoryField(
  inventoryRules: TemplateInventoryRules,
  sellRoomTypeCode: string,
  field: 'regionalPublicStock' | 'globalPublicStock' | 'publicStock',
  totalQuantity: number,
): TemplateInventoryRules {
  const resolvedField: keyof TemplateInventoryCell =
    field === 'publicStock' ? 'regionalPublicStock' : field
  const segmentRule = { ...(inventoryRules[sellRoomTypeCode] || {}) }
  const segmentKeys = Object.keys(segmentRule)
  if (segmentKeys.length === 0) {
    return {
      ...inventoryRules,
      [sellRoomTypeCode]: {
        __whole: {
          physicalCapacity: 0,
          regionalPublicStock: resolvedField === 'regionalPublicStock' ? totalQuantity : 0,
          globalPublicStock: resolvedField === 'globalPublicStock' ? totalQuantity : 0,
        },
      },
    }
  }

  const base = Math.floor(totalQuantity / segmentKeys.length)
  const remainder = totalQuantity % segmentKeys.length
  const nextSegmentRule = { ...segmentRule }
  segmentKeys.forEach((segKey, index) => {
    const qty = base + (index < remainder ? 1 : 0)
    nextSegmentRule[segKey] = { ...nextSegmentRule[segKey], [resolvedField]: qty }
  })
  return { ...inventoryRules, [sellRoomTypeCode]: nextSegmentRule }
}

export function aggregateDealerQuantity(
  dealerRules: TemplateDealerInventoryRules,
  sellRoomTypeCode: string,
  dealerId: string,
  kind: DealerPrivateStockKind = 'private',
): number {
  const segmentMap = dealerRules[sellRoomTypeCode] || {}
  return Object.values(segmentMap).reduce(
    (sum, allocations) => sum + getDealerQuantity(allocations, dealerId, kind),
    0,
  )
}

export function setAggregatedDealerAllocation(
  dealerRules: TemplateDealerInventoryRules,
  sellRoomTypeCode: string,
  dealerId: string,
  totalQuantity: number,
  kind: DealerPrivateStockKind = 'private',
): TemplateDealerInventoryRules {
  const segmentMap = dealerRules[sellRoomTypeCode] || {}
  const segmentKeys = Object.keys(segmentMap)
  if (segmentKeys.length === 0) {
    return {
      ...dealerRules,
      [sellRoomTypeCode]: {
        __whole: setDealerQuantity([], dealerId, totalQuantity, kind),
      },
    }
  }

  const base = Math.floor(totalQuantity / segmentKeys.length)
  const remainder = totalQuantity % segmentKeys.length
  const nextSegmentMap = { ...segmentMap }
  segmentKeys.forEach((segKey, index) => {
    const qty = base + (index < remainder ? 1 : 0)
    nextSegmentMap[segKey] = setDealerQuantity(nextSegmentMap[segKey] || [], dealerId, qty, kind)
  })
  return {
    ...dealerRules,
    [sellRoomTypeCode]: nextSegmentMap,
  }
}

export function findAggregatedOverAllocations(
  inventoryRules: TemplateInventoryRules,
  dealerRules: TemplateDealerInventoryRules,
  sellRoomTypeCodes: string[],
): { sellRoomTypeCode: string; pool: number; allocated: number }[] {
  const warnings: { sellRoomTypeCode: string; pool: number; allocated: number }[] = []
  sellRoomTypeCodes.forEach((sellRoomTypeCode) => {
    const pool = aggregateDealerStockPool(inventoryRules, sellRoomTypeCode)
    const segmentMap = dealerRules[sellRoomTypeCode] || {}
    const dealerIds = new Set<string>()
    Object.values(segmentMap).forEach((allocations) => {
      allocations.forEach((item) => dealerIds.add(item.dealerId))
    })
    let allocated = 0
    dealerIds.forEach((dealerId) => {
      allocated +=
        aggregateDealerQuantity(dealerRules, sellRoomTypeCode, dealerId, 'regionalPrivate')
        + aggregateDealerQuantity(dealerRules, sellRoomTypeCode, dealerId, 'private')
    })
    if (allocated > pool) {
      warnings.push({ sellRoomTypeCode, pool, allocated })
    }
  })
  return warnings
}

export { getTemplateSellRoomTypes } from '@/mock/sellRoomTypeConfig'
