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

export function buildMatchedPricePolicies(cart: CartLineLike[]): MatchedPricePolicy[] {
  if (cart.length === 0) {
    return defaultMatchedPolicies()
  }

  return cart.map((line, index) => {
    const meta = resolvePolicyMeta(line.segmentLabel, line.roomType)
    const basePrice = Math.round(line.price * 1.08)
    const discountAmount = Math.max(0, basePrice - line.price)
    return {
      id: `policy-${index}-${line.segmentLabel}-${line.roomType}`,
      segmentLabel: line.segmentLabel,
      roomType: line.roomType,
      basePrice,
      discountAmount,
      settlementPrice: line.price,
      ...meta,
    }
  })
}

export function defaultMatchedPolicies(): MatchedPricePolicy[] {
  return buildMatchedPricePolicies([
    { segmentLabel: '重庆 → 宜昌', roomType: '标准间', price: 2980, count: 2 },
    { segmentLabel: '重庆 → 宜昌', roomType: '标准间', price: 2980, count: 2 },
    { segmentLabel: '丰都 → 奉节', roomType: '豪华套房', price: 6880, count: 1 },
  ])
}

export const policyTypeClass: Record<MatchedPricePolicy['policyType'], string> = {
  分销商政策: 'bg-blue-50 text-blue-700',
  临时促销: 'bg-orange-50 text-orange-700',
  团队价: 'bg-purple-50 text-purple-700',
  口岸价: 'bg-teal-50 text-teal-700',
}
