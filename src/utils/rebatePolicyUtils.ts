import type {
  RebateAdjustmentDirection,
  RebatePolicy,
  RebatePolicyTargetBinding,
  RebatePolicyType,
  RebateTargetIndicator,
  RebateTargetIndicatorType,
  RebateTier,
  RebateTierBasis,
} from '@/types'
import { calcIndicatorCompletionRate } from '@/mock/rebateTargetIndicators'

export function formatAdjustmentDirection(direction: RebateAdjustmentDirection) {
  return direction === 'rebate' ? '返点' : '扣点'
}

export function formatSignedPoint(value: number, direction: RebateAdjustmentDirection, unit = '点') {
  const sign = direction === 'deduction' ? '-' : '+'
  return `${sign}${Math.abs(value)} ${unit}`
}

export function signedTierValue(tier: RebateTier) {
  const magnitude = Math.abs(tier.rebateValue)
  return tier.adjustmentDirection === 'deduction' ? -magnitude : magnitude
}

export function formatTierEffect(tier: RebateTier, policyType: RebatePolicyType, tierBasis?: RebateTierBasis) {
  const direction = formatAdjustmentDirection(tier.adjustmentDirection)
  if (policyType === 'rebate_point') {
    return `${direction} ${tier.rebateValue} 点`
  }
  if (policyType === 'sales_rebate') {
    const basis = tierBasis === 'target_completion_rate' ? '完成率返利' : '销售额返利'
    return `${direction} ${tier.rebateValue}%（${basis}）`
  }
  return `${direction} ${tier.rebateValue}%`
}

export function requiredIndicatorTypes(policyType: RebatePolicyType): RebateTargetIndicatorType[] {
  if (policyType === 'rebate_point') return ['annual_sales', 'regional_task', 'voyage_planned']
  if (policyType === 'sales_rebate') return ['annual_sales', 'regional_task']
  if (policyType === 'penalty_refund') return ['voyage_planned', 'annual_sales']
  return []
}

export function bindingUsageLabel(usage: RebatePolicyTargetBinding['usage']) {
  const map: Record<RebatePolicyTargetBinding['usage'], string> = {
    completion_rate: '任务完成率',
    penalty_denominator: '航次计划分母',
    guarantee_reminder: '保证金提醒',
    scope_reference: '范围对齐',
  }
  return map[usage]
}

export function matchTier(tiers: RebateTier[], value: number) {
  const sorted = [...tiers].sort((a, b) => a.minValue - b.minValue)
  return sorted.find((tier) => value >= tier.minValue && (tier.maxValue === null || value < tier.maxValue)) ?? null
}

export function buildRebatePreview(policy: RebatePolicy, indicators: RebateTargetIndicator[]) {
  const warnings: string[] = []
  const lines: string[] = []
  const indicatorMap = new Map(indicators.map((item) => [item.id, item]))

  policy.targetBindings.forEach((binding) => {
    const indicator = indicatorMap.get(binding.indicatorId)
    if (!indicator) return
    const rate = calcIndicatorCompletionRate(indicator)
    lines.push(`${indicator.name}：目标 ${indicator.targetValue}，实际 ${indicator.actualValue}，完成率 ${rate}%`)
  })

  if (policy.policyType === 'rebate_point') {
    const completionIndicator = policy.targetBindings
      .map((binding) => indicatorMap.get(binding.indicatorId))
      .find((item) => item && (item.indicatorType === 'annual_sales' || item.indicatorType === 'regional_task' || item.indicatorType === 'voyage_planned'))
    const completionRate = completionIndicator ? calcIndicatorCompletionRate(completionIndicator) : 0
    const tier = matchTier(policy.tiers, completionRate)
    if (tier) {
      lines.push(`命中阶梯：${tier.minValue}% - ${tier.maxValue ?? '不限'} → ${formatTierEffect(tier, policy.policyType)}`)
      lines.push(`按任务完成率 ${completionRate}% 结算`)
    } else {
      lines.push('未命中任何阶梯')
    }
  }

  if (policy.policyType === 'sales_rebate') {
    const completionIndicator = policy.targetBindings
      .map((binding) => indicatorMap.get(binding.indicatorId))
      .find((item) => item && (item.indicatorType === 'annual_sales' || item.indicatorType === 'regional_task'))
    const basisValue = completionIndicator
      ? calcIndicatorCompletionRate(completionIndicator)
      : 0
    const tier = matchTier(policy.tiers, basisValue)
    if (tier) {
      lines.push(`命中阶梯：${tier.minValue} - ${tier.maxValue ?? '不限'} → ${formatTierEffect(tier, policy.policyType, policy.tierBasis)}`)
      lines.push(`按任务完成率 ${basisValue}% 结算`)
    } else {
      lines.push('未命中任何阶梯')
    }
  }

  if (policy.policyType === 'penalty_refund') {
    const voyageIndicator = policy.targetBindings
      .map((binding) => indicatorMap.get(binding.indicatorId))
      .find((item) => item?.indicatorType === 'voyage_planned')
    const annualIndicator = policy.targetBindings
      .map((binding) => indicatorMap.get(binding.indicatorId))
      .find((item) => item?.indicatorType === 'annual_sales')

    if (voyageIndicator) {
      const confirmRate = calcIndicatorCompletionRate(voyageIndicator)
      lines.push(`航次确认率 ${confirmRate}%（阈值 ${policy.confirmationRateThreshold}%）`)
      if (confirmRate < policy.confirmationRateThreshold) {
        lines.push(`航次违约金试算：确认率不足，开航后按规则扣减（T-${policy.makeupDaysBeforeSail} 补齐可不计）`)
      } else {
        lines.push('航次违约金试算：0（确认率达标）')
      }
    }

    if (annualIndicator) {
      const annualRate = calcIndicatorCompletionRate(annualIndicator)
      const tier = matchTier(policy.tiers, annualRate)
      if (tier) {
        lines.push(`年度完成率 ${annualRate}% → ${formatTierEffect(tier, policy.policyType)}`)
      }
    }
  }

  if (policy.remindGuaranteeOnSettlement) {
    const guarantee = policy.targetBindings
      .map((binding) => indicatorMap.get(binding.indicatorId))
      .find((item) => item?.indicatorType === 'guarantee')
    if (guarantee && guarantee.actualValue < guarantee.targetValue) {
      warnings.push('结算前保证金核对提醒已开启')
    }
  }

  return { lines, warnings }
}
