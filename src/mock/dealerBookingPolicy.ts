import { listDistPricePolicies } from '@/mock/pricePolicies'
import { getPricePolicyTypeById } from '@/mock/pricePolicyTypes'
import { inventoryPools } from '@/mock/inventoryPools'
import {
  deductPoolSold,
  getEnabledInventoryPools,
  getPoolRemaining,
  getPoolSold,
  getTemplateSegmentKeys,
  loadTemplatePoolQuotas,
} from '@/mock/templatePoolQuotas'
import { voyageTemplates } from '@/mock/data'
import { getTemplateSellRoomTypes } from '@/mock/sellRoomTypeConfig'

export interface MatchedPricePolicy {
  id: string
  segmentLabel: string
  roomType: string
  policyCode: string
  policyName: string
  policyType: '分销商政策' | '临时促销' | '团队价' | '口岸价'
  priority: number
  basePrice: number
  discountAmount: number
  settlementPrice: number
  quotaLabel: string
  validPeriod: string
  fallbackPolicy?: string
  /** 扣减库存池 */
  inventoryPoolId?: string
  inventoryPoolName?: string
  poolQuota?: number
  poolSold?: number
  poolRemaining?: number
  deductQty?: number
  poolOk?: boolean
  poolHint?: string
}

interface CartLineLike {
  segmentLabel: string
  roomType: string
  price: number
  count: number
}

const policyCatalog: Record<string, Omit<MatchedPricePolicy, 'id' | 'segmentLabel' | 'roomType' | 'basePrice' | 'discountAmount' | 'settlementPrice'>> = {
  '标准间|重庆-宜昌': {
    policyCode: 'DLR-SHARED-2026Q2',
    policyName: '内宾共享结算政策',
    policyType: '分销商政策',
    priority: 2,
    quotaLabel: '已用 3 / 配额 20',
    validPeriod: '2026-06-01 至 2026-06-30',
    fallbackPolicy: '标准结算价',
  },
  '标准间|丰都-宜昌': {
    policyCode: 'DLR-PORT-YZ-01',
    policyName: '宜昌口岸分销价',
    policyType: '口岸价',
    priority: 3,
    quotaLabel: '已用 1 / 配额 8',
    validPeriod: '2026-06-01 至 2026-06-30',
  },
  '豪华套房|丰都-奉节': {
    policyCode: 'DLR-TEAM-VIP',
    policyName: '内宾团队价（豪华房）',
    policyType: '团队价',
    priority: 1,
    quotaLabel: '已用 1 / 配额 5',
    validPeriod: '2026-06-10 至 2026-06-20',
    fallbackPolicy: '内宾共享结算政策',
  },
  '豪华套房|重庆-宜昌': {
    policyCode: 'PROMO-618',
    policyName: '618 临时促销',
    policyType: '临时促销',
    priority: 1,
    quotaLabel: '已用 2 / 配额 10',
    validPeriod: '2026-06-15 至 2026-06-18',
    fallbackPolicy: '外宾协议价',
  },
}

function normalizeSegment(segmentLabel: string) {
  return segmentLabel.replace(/\s*→\s*/g, '-').replace(/\s+/g, '')
}

function resolvePolicyMeta(segmentLabel: string, roomType: string) {
  const segmentKey = normalizeSegment(segmentLabel)
  const key = `${roomType}|${segmentKey}`
  if (policyCatalog[key]) return policyCatalog[key]

  if (roomType.includes('套房')) {
    return {
      policyCode: 'DLR-PROTOCOL-INT',
      policyName: '外宾协议价',
      policyType: '分销商政策' as const,
      priority: 2,
      quotaLabel: '已用 1 / 配额 12',
      validPeriod: '2026-06-01 至 2026-06-30',
    }
  }

  return {
    policyCode: 'DLR-SHARED-2026Q2',
    policyName: '内宾共享结算政策',
    policyType: '分销商政策' as const,
    priority: 2,
    quotaLabel: '已用 2 / 配额 20',
    validPeriod: '2026-06-01 至 2026-06-30',
    fallbackPolicy: '标准结算价',
  }
}

function pickDistPolicy(index: number) {
  const list = listDistPricePolicies().filter((item) => item.status === '已发布' || item.status === '审批中')
  if (list.length === 0) return listDistPricePolicies()[0]
  return list[index % list.length]
}

function resolveSellRoomCode(templateId: string, roomType: string) {
  const template = voyageTemplates.find((item) => item.id === templateId)
  if (!template) return ''
  const rooms = getTemplateSellRoomTypes(template)
  const exact = rooms.find((item) => item.name === roomType)
  if (exact) return exact.code
  const fuzzy = rooms.find(
    (item) => roomType.includes(item.name) || item.name.includes(roomType.replace('豪华', '')),
  )
  return fuzzy?.code || rooms[0]?.code || ''
}

function resolveSegmentKey(templateId: string, segmentLabel: string) {
  const template = voyageTemplates.find((item) => item.id === templateId)
  if (!template) return '全程'
  const keys = getTemplateSegmentKeys(template)
  const normalized = normalizeSegment(segmentLabel)
  const hit = keys.find((key) => normalizeSegment(key) === normalized || key.includes(normalized.split('-').pop() || ''))
  return hit || keys[keys.length - 1] || '全程'
}

function attachPoolInfo(
  meta: ReturnType<typeof resolvePolicyMeta>,
  line: CartLineLike,
  index: number,
  templateId = 'vt01',
): Pick<
  MatchedPricePolicy,
  | 'inventoryPoolId'
  | 'inventoryPoolName'
  | 'poolQuota'
  | 'poolSold'
  | 'poolRemaining'
  | 'deductQty'
  | 'poolOk'
  | 'poolHint'
  | 'quotaLabel'
> {
  const distPolicy = pickDistPolicy(index)
  const pools = getEnabledInventoryPools()
  const type = distPolicy?.pricePolicyTypeId ? getPricePolicyTypeById(distPolicy.pricePolicyTypeId) : undefined
  const poolId = type?.inventoryPoolId || distPolicy?.inventoryPoolId || pools[0]?.id || ''
  const poolName = type?.inventoryPoolName || distPolicy?.inventoryPoolName || pools.find((p) => p.id === poolId)?.name || '未绑定库存池'

  const template = voyageTemplates.find((item) => item.id === templateId)
  const quotas = template ? loadTemplatePoolQuotas(template) : undefined
  const sellRoomCode = resolveSellRoomCode(templateId, line.roomType)
  const segKey = resolveSegmentKey(templateId, line.segmentLabel)
  const poolQuota = quotas?.[sellRoomCode]?.[segKey]?.poolQty[poolId] ?? 0
  const poolSold = getPoolSold(templateId, sellRoomCode, segKey, poolId)
  const poolRemaining = getPoolRemaining(templateId, sellRoomCode, segKey, poolId, poolQuota)
  const deductQty = Math.max(1, line.count)
  const poolOk = Boolean(poolId) && poolRemaining >= deductQty
  const poolHint = !poolId
    ? '未绑定扣减池'
    : poolOk
      ? `将扣减「${poolName}」${deductQty} 间`
      : `「${poolName}」剩余 ${poolRemaining}，不足扣减 ${deductQty}`

  return {
    inventoryPoolId: poolId,
    inventoryPoolName: poolName,
    poolQuota,
    poolSold,
    poolRemaining,
    deductQty,
    poolOk,
    poolHint,
    quotaLabel: poolId ? `池余 ${poolRemaining} / 配额 ${poolQuota}` : meta.quotaLabel,
  }
}

export function buildMatchedPricePolicies(
  cart: CartLineLike[],
  options?: { templateId?: string; dealerGroupId?: string },
): MatchedPricePolicy[] {
  if (cart.length === 0) {
    return defaultMatchedPolicies(options)
  }

  const templateId = options?.templateId ?? 'vt01'

  return cart.map((line, index) => {
    const meta = resolvePolicyMeta(line.segmentLabel, line.roomType)
    const basePrice = Math.round(line.price * 1.08)
    const discountAmount = Math.max(0, basePrice - line.price)
    const poolInfo = attachPoolInfo(meta, line, index, templateId)
    return {
      id: `policy-${index}-${line.segmentLabel}-${line.roomType}`,
      segmentLabel: line.segmentLabel,
      roomType: line.roomType,
      basePrice,
      discountAmount,
      settlementPrice: line.price,
      ...meta,
      ...poolInfo,
    }
  })
}

export function defaultMatchedPolicies(options?: { templateId?: string; dealerGroupId?: string }): MatchedPricePolicy[] {
  return buildMatchedPricePolicies(
    [
      { segmentLabel: '重庆 → 宜昌', roomType: '标准间', price: 2980, count: 2 },
      { segmentLabel: '重庆 → 宜昌', roomType: '标准间', price: 2980, count: 2 },
      { segmentLabel: '丰都 → 奉节', roomType: '豪华套房', price: 6880, count: 1 },
    ],
    options,
  )
}

/** 确认下单时扣减命中政策绑定的库存池 */
export function deductMatchedPolicyPools(
  policies: MatchedPricePolicy[],
  options?: { templateId?: string },
) {
  const templateId = options?.templateId ?? 'vt01'
  const results: { policyId: string; poolName: string; qty: number; ok: boolean; remaining: number }[] = []

  policies.forEach((policy) => {
    if (!policy.inventoryPoolId || !policy.deductQty) {
      results.push({
        policyId: policy.id,
        poolName: policy.inventoryPoolName || '-',
        qty: 0,
        ok: false,
        remaining: policy.poolRemaining ?? 0,
      })
      return
    }
    const sellRoomCode = resolveSellRoomCode(templateId, policy.roomType)
    const segKey = resolveSegmentKey(templateId, policy.segmentLabel)
    const template = voyageTemplates.find((item) => item.id === templateId)
    const quotas = template ? loadTemplatePoolQuotas(template) : undefined
    const poolQuota = quotas?.[sellRoomCode]?.[segKey]?.poolQty[policy.inventoryPoolId] ?? 0
    const remainingBefore = getPoolRemaining(templateId, sellRoomCode, segKey, policy.inventoryPoolId, poolQuota)
    const ok = remainingBefore >= policy.deductQty
    if (ok) {
      deductPoolSold({
        templateId,
        sellRoomTypeCode: sellRoomCode,
        segmentKey: segKey,
        poolId: policy.inventoryPoolId,
        qty: policy.deductQty,
      })
    }
    const remaining = getPoolRemaining(templateId, sellRoomCode, segKey, policy.inventoryPoolId, poolQuota)
    results.push({
      policyId: policy.id,
      poolName: policy.inventoryPoolName || inventoryPools.find((p) => p.id === policy.inventoryPoolId)?.name || '-',
      qty: ok ? policy.deductQty : 0,
      ok,
      remaining,
    })
  })

  return results
}

export const policyTypeClass: Record<MatchedPricePolicy['policyType'], string> = {
  分销商政策: 'bg-blue-50 text-blue-700',
  临时促销: 'bg-orange-50 text-orange-700',
  团队价: 'bg-purple-50 text-purple-700',
  口岸价: 'bg-teal-50 text-teal-700',
}
