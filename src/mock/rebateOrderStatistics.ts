import type { CruiseOrder } from '@/components/order/orderTypes'

export type RebateOrderSettlementStatus = 'pending_review' | 'calculated' | 'settled'
export type RebateStatisticPolicyType = 'rebate_point' | 'sales_rebate'
export type RebateStatisticCycle = 'voyage' | 'monthly'

export interface RebateStatisticTier {
  minRate: number
  maxRate: number | null
  rebateRate: number
  direction: 'rebate' | 'deduction'
}

export interface RebateStatisticPolicy {
  code: string
  name: string
  policyType: RebateStatisticPolicyType
  settlementCycle: RebateStatisticCycle
  priority: number
  tiers: RebateStatisticTier[]
  applicableVoyageNos?: string[]
}

export interface MatchedRebatePolicy {
  policyCode: string
  policyName: string
  policyType: RebateStatisticPolicyType
  settlementCycle: RebateStatisticCycle
  priority: number
  completionRate: number
  tierLabel: string
  rebateRate: number
  direction: 'rebate' | 'deduction'
  rebateBaseAmount: number
  rebateAmount: number
  calculationNote: string
}

export interface RebateOrderGroupStatistic {
  id: string
  groupName: string
  distributor: string
  voyageNo: string
  sailDate: string
  ship: string
  route: string
  orderNos: string[]
  passengers: number
  eligibleOrderAmount: number
  matchedPolicies: MatchedRebatePolicy[]
  rebateAmount: number
  effectiveRebateRate: number
  settlementStatus: RebateOrderSettlementStatus
  calculatedAt: string
}

export const rebateStatisticPolicies: RebateStatisticPolicy[] = [
  {
    code: 'REB-002',
    name: '季度销售额阶梯返利',
    policyType: 'sales_rebate',
    settlementCycle: 'monthly',
    priority: 20,
    tiers: [
      { minRate: 0, maxRate: 50, rebateRate: 0.5, direction: 'deduction' },
      { minRate: 50, maxRate: 70, rebateRate: 1, direction: 'rebate' },
      { minRate: 70, maxRate: null, rebateRate: 2, direction: 'rebate' },
    ],
  },
  {
    code: 'REB-001',
    name: '差航次临时提高返利点',
    policyType: 'rebate_point',
    settlementCycle: 'voyage',
    priority: 5,
    applicableVoyageNos: ['211901', '212102', '212103'],
    tiers: [
      { minRate: 0, maxRate: 50, rebateRate: 0.5, direction: 'deduction' },
      { minRate: 50, maxRate: 80, rebateRate: 2, direction: 'rebate' },
      { minRate: 80, maxRate: null, rebateRate: 3.5, direction: 'rebate' },
    ],
  },
]

const distributorCompletionRates: Record<string, number> = {
  宜昌趸多: 76.4,
  销售二分部: 83.2,
  重庆神州: 68.5,
}

const voyageCompletionRates: Record<string, number> = {
  '211901': 63.8,
  '212102': 86.5,
  '212103': 74.2,
}

function matchTier(policy: RebateStatisticPolicy, completionRate: number) {
  return policy.tiers.find((tier) => completionRate >= tier.minRate && (tier.maxRate === null || completionRate < tier.maxRate))
}

function formatTierLabel(tier: RebateStatisticTier) {
  return `${tier.minRate}% ≤ 完成率${tier.maxRate === null ? '' : ` < ${tier.maxRate}%`}`
}

function resolveSettlementStatus(voyageNo: string): RebateOrderSettlementStatus {
  if (voyageNo === '212101') return 'settled'
  if (voyageNo === '211901') return 'pending_review'
  return 'calculated'
}

export function buildRebateOrderStatistics(orders: CruiseOrder[]): RebateOrderGroupStatistic[] {
  const grouped = new Map<string, Omit<RebateOrderGroupStatistic, 'matchedPolicies' | 'rebateAmount' | 'effectiveRebateRate' | 'settlementStatus' | 'calculatedAt'>>()

  orders
    .filter((order) => order.orderStatus !== '取消' && order.receivableTicket > 0)
    .forEach((order) => {
      const teams = order.teams && order.teams.length > 0
        ? order.teams.map((team) => ({ name: team.name, passengers: team.guestCount }))
        : [{ name: order.groupName || '未命名旅行团', passengers: Math.max(order.totalPeople, 1) }]
      const totalTeamPassengers = teams.reduce((sum, team) => sum + team.passengers, 0) || 1

      teams.forEach((team) => {
        const allocationRate = team.passengers / totalTeamPassengers
        const allocatedAmount = Math.round(order.receivableTicket * allocationRate * 100) / 100
        const key = `${order.dealer}|${order.voyageNo}|${team.name}`
        const existing = grouped.get(key)
        if (existing) {
          existing.orderNos = [...new Set([...existing.orderNos, order.orderNo])]
          existing.passengers += team.passengers
          existing.eligibleOrderAmount = Math.round((existing.eligibleOrderAmount + allocatedAmount) * 100) / 100
          return
        }
        grouped.set(key, {
          id: `rebate-${order.voyageNo}-${team.name}`,
          groupName: team.name,
          distributor: order.dealer,
          voyageNo: order.voyageNo,
          sailDate: order.sailDate,
          ship: order.ship,
          route: order.route,
          orderNos: [order.orderNo],
          passengers: team.passengers,
          eligibleOrderAmount: allocatedAmount,
        })
      })
    })

  return [...grouped.values()].map((group) => {
    const matchedPolicies = rebateStatisticPolicies.flatMap<MatchedRebatePolicy>((policy) => {
      if (policy.applicableVoyageNos && !policy.applicableVoyageNos.includes(group.voyageNo)) return []
      const completionRate = policy.policyType === 'rebate_point'
        ? voyageCompletionRates[group.voyageNo] ?? 0
        : distributorCompletionRates[group.distributor] ?? 0
      const tier = matchTier(policy, completionRate)
      if (!tier) return []
      const rawAmount = group.eligibleOrderAmount * tier.rebateRate / 100
      const rebateAmount = Math.round((tier.direction === 'deduction' ? -rawAmount : rawAmount) * 100) / 100
      return [{
        policyCode: policy.code,
        policyName: policy.name,
        policyType: policy.policyType,
        settlementCycle: policy.settlementCycle,
        priority: policy.priority,
        completionRate,
        tierLabel: formatTierLabel(tier),
        rebateRate: tier.rebateRate,
        direction: tier.direction,
        rebateBaseAmount: group.eligibleOrderAmount,
        rebateAmount,
        calculationNote: policy.policyType === 'rebate_point'
          ? `航次任务完成率 ${completionRate}% 命中加点阶梯`
          : `分销商累计销售任务完成率 ${completionRate}% 命中销售额阶梯`,
      }]
    })
    const rebateAmount = Math.round(matchedPolicies.reduce((sum, policy) => sum + policy.rebateAmount, 0) * 100) / 100
    const effectiveRebateRate = group.eligibleOrderAmount > 0
      ? Math.round((rebateAmount / group.eligibleOrderAmount) * 10000) / 100
      : 0
    return {
      ...group,
      matchedPolicies,
      rebateAmount,
      effectiveRebateRate,
      settlementStatus: resolveSettlementStatus(group.voyageNo),
      calculatedAt: '2026-07-21 15:30:00',
    }
  }).filter((group) => group.matchedPolicies.length > 0)
}
