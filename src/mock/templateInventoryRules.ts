import { dealers, products, voyageInventories } from '@/mock/data'
import {
  getTemplateSellRoomTypes,
  type TemplateSellRoomType,
} from '@/mock/sellRoomTypeConfig'
import { getTemplateSegmentsCount } from '@/mock/templatePriceRules'
import type { ProductSegment, VoyageTemplate } from '@/types'

export interface TemplateInventoryCell {
  physicalCapacity: number
  onlineChannel: number
  publicStock: number
  dealerStockPool: number
}

export type TemplateSegmentInventory = Record<string, TemplateInventoryCell>
export type TemplateCabinInventoryRule = TemplateSegmentInventory
export type TemplateInventoryRules = Record<string, TemplateCabinInventoryRule>

export interface DealerStockAllocation {
  dealerId: string
  quantity: number
}

/** sellRoomTypeCode -> segmentKey -> dealer allocations */
export type TemplateDealerInventoryRules = Record<string, Record<string, DealerStockAllocation[]>>

const inventoryRulesStore: Record<string, TemplateCabinInventoryRule> = {}
const dealerInventoryStore: Record<string, TemplateDealerInventoryRules> = {}

export const segmentKey = (segment: ProductSegment) => `${segment.startPort}-${segment.endPort}`

function normalizeCell(cell: Partial<TemplateInventoryCell> & Record<string, unknown>): TemplateInventoryCell {
  return {
    physicalCapacity: Number(cell.physicalCapacity) || 0,
    onlineChannel: Number(cell.onlineChannel ?? cell.onlineRetail) || 0,
    publicStock: Number(cell.publicStock ?? cell.sharedStock) || 0,
    dealerStockPool: Number(cell.dealerStockPool ?? cell.dedicatedStock) || 0,
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
  return dealers.filter((dealer) => dealer.status === 'cooperating').slice(0, 3).map((dealer) => dealer.id)
}

function splitPoolAmongDealers(pool: number, dealerIds: string[]): DealerStockAllocation[] {
  if (pool <= 0 || dealerIds.length === 0) return []
  const base = Math.floor(pool / dealerIds.length)
  const remainder = pool % dealerIds.length
  return dealerIds.map((dealerId, index) => ({
    dealerId,
    quantity: base + (index < remainder ? 1 : 0),
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
    rule['全程'] = {
      physicalCapacity,
      onlineChannel: seed ? Math.floor(base * 0.45) : 0,
      publicStock: seed ? Math.floor(base * 0.35) : 0,
      dealerStockPool: seed ? Math.max(0, base - Math.floor(base * 0.45) - Math.floor(base * 0.35)) : 0,
    }
    return rule
  }

  segments.forEach((segment, segmentIndex) => {
    const key = segmentKey(segment)
    const base = seed ? Math.max(0, physicalCapacity - segmentIndex * 2) : 0
    rule[key] = {
      physicalCapacity,
      onlineChannel: seed ? Math.floor(base * 0.45) : 0,
      publicStock: seed ? Math.floor(base * 0.35) : 0,
      dealerStockPool: seed ? Math.max(0, base - Math.floor(base * 0.45) - Math.floor(base * 0.35)) : 0,
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
  return rules
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
        ? splitPoolAmongDealers(cell.dealerStockPool, dealerIds)
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
  let onlineChannel = 0
  let publicStock = 0
  let dealerStockPool = 0
  Object.values(rules).forEach((segmentRule) => {
    Object.values(segmentRule).forEach((cell) => {
      onlineChannel += cell.onlineChannel
      publicStock += cell.publicStock
      dealerStockPool += cell.dealerStockPool
    })
  })
  return {
    totalAvailable: onlineChannel + publicStock + dealerStockPool,
    onlineChannel,
    publicStock,
    dealerStockPool,
  }
}

export function sumDealerAllocations(allocations: DealerStockAllocation[]) {
  return allocations.reduce((sum, item) => sum + item.quantity, 0)
}

export function getDealerQuantity(allocations: DealerStockAllocation[], dealerId: string) {
  return allocations.find((item) => item.dealerId === dealerId)?.quantity ?? 0
}

export function setDealerQuantity(
  allocations: DealerStockAllocation[],
  dealerId: string,
  quantity: number,
): DealerStockAllocation[] {
  const exists = allocations.some((item) => item.dealerId === dealerId)
  if (!exists) return [...allocations, { dealerId, quantity }]
  return allocations.map((item) => (item.dealerId === dealerId ? { ...item, quantity } : item))
}

export function collectSelectedDealerIds(rules: TemplateDealerInventoryRules) {
  const ids = new Set<string>()
  Object.values(rules).forEach((segmentMap) => {
    Object.values(segmentMap).forEach((allocations) => {
      allocations.forEach((item) => {
        if (item.quantity > 0 || ids.has(item.dealerId)) ids.add(item.dealerId)
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
      if (allocated > cell.dealerStockPool) {
        warnings.push({ sellRoomTypeCode, segmentKey: segKey, pool: cell.dealerStockPool, allocated })
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
  return aggregateInventoryField(inventoryRules, sellRoomTypeCode, 'dealerStockPool')
}

export function aggregatePublicStock(
  inventoryRules: TemplateInventoryRules,
  sellRoomTypeCode: string,
): number {
  return aggregateInventoryField(inventoryRules, sellRoomTypeCode, 'publicStock')
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
  field: 'publicStock' | 'onlineChannel' | 'dealerStockPool',
  totalQuantity: number,
): TemplateInventoryRules {
  const segmentRule = { ...(inventoryRules[sellRoomTypeCode] || {}) }
  const segmentKeys = Object.keys(segmentRule)
  if (segmentKeys.length === 0) {
    return {
      ...inventoryRules,
      [sellRoomTypeCode]: {
        __whole: {
          physicalCapacity: 0,
          onlineChannel: 0,
          publicStock: field === 'publicStock' ? totalQuantity : 0,
          dealerStockPool: field === 'dealerStockPool' ? totalQuantity : 0,
        },
      },
    }
  }

  const base = Math.floor(totalQuantity / segmentKeys.length)
  const remainder = totalQuantity % segmentKeys.length
  const nextSegmentRule = { ...segmentRule }
  segmentKeys.forEach((segKey, index) => {
    const qty = base + (index < remainder ? 1 : 0)
    nextSegmentRule[segKey] = { ...nextSegmentRule[segKey], [field]: qty }
  })
  return { ...inventoryRules, [sellRoomTypeCode]: nextSegmentRule }
}

export function aggregateDealerQuantity(
  dealerRules: TemplateDealerInventoryRules,
  sellRoomTypeCode: string,
  dealerId: string,
): number {
  const segmentMap = dealerRules[sellRoomTypeCode] || {}
  return Object.values(segmentMap).reduce(
    (sum, allocations) => sum + getDealerQuantity(allocations, dealerId),
    0,
  )
}

export function setAggregatedDealerAllocation(
  dealerRules: TemplateDealerInventoryRules,
  sellRoomTypeCode: string,
  dealerId: string,
  totalQuantity: number,
): TemplateDealerInventoryRules {
  const segmentMap = dealerRules[sellRoomTypeCode] || {}
  const segmentKeys = Object.keys(segmentMap)
  if (segmentKeys.length === 0) {
    return {
      ...dealerRules,
      [sellRoomTypeCode]: {
        __whole: setDealerQuantity([], dealerId, totalQuantity),
      },
    }
  }

  const base = Math.floor(totalQuantity / segmentKeys.length)
  const remainder = totalQuantity % segmentKeys.length
  const nextSegmentMap = { ...segmentMap }
  segmentKeys.forEach((segKey, index) => {
    const qty = base + (index < remainder ? 1 : 0)
    nextSegmentMap[segKey] = setDealerQuantity(nextSegmentMap[segKey] || [], dealerId, qty)
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
      allocated += aggregateDealerQuantity(dealerRules, sellRoomTypeCode, dealerId)
    })
    if (allocated > pool) {
      warnings.push({ sellRoomTypeCode, pool, allocated })
    }
  })
  return warnings
}

export { getTemplateSellRoomTypes } from '@/mock/sellRoomTypeConfig'
