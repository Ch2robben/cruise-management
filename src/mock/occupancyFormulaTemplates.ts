import type { FormulaRuleKey } from '@/utils/cabinPriceCoefficient'

export type GuestPriceCoefficient = {
  p: number
  s: number
  x: number
}

export type OccupancyFormulaTemplate = {
  id: string
  name: string
  scenario: FormulaRuleKey
  ticketClassId: string
  guestCoefficients: GuestPriceCoefficient[]
  description?: string
}

/** 入住组合价格公式模板：系数按入住人配置，第一人 = XP + XS + X */
export const occupancyFormulaTemplates: OccupancyFormulaTemplate[] = [
  {
    id: 'tpl-standard-2adult',
    name: '标准（2成人）',
    scenario: 'standard',
    ticketClassId: 'tc-2adult',
    guestCoefficients: [
      { p: 1, s: 0, x: 0 },
      { p: 1, s: 0, x: 0 },
    ],
    description: '双成人同价，按人累加 P/S/X 系数',
  },
  {
    id: 'tpl-single',
    name: '单间',
    scenario: 'singleRoom',
    ticketClassId: 'tc-single',
    guestCoefficients: [{ p: 1.75, s: 0, x: 0 }],
  },
  {
    id: 'tpl-1adult-1child',
    name: '一大一小（儿童占床）',
    scenario: 'oneAdultOneChild',
    ticketClassId: 'tc-1adult-1child',
    guestCoefficients: [
      { p: 1, s: 0, x: 0 },
      { p: 0.7, s: 0, x: 0 },
    ],
  },
  {
    id: 'tpl-2adult-baby',
    name: '两大一婴儿',
    scenario: 'twoAdultsOneBaby',
    ticketClassId: 'tc-2adult-baby',
    guestCoefficients: [
      { p: 1, s: 0, x: 0 },
      { p: 1, s: 0, x: 0 },
      { p: 0.1, s: 0, x: 0 },
    ],
  },
  {
    id: 'tpl-third-child-nobed',
    name: '第三人儿童不占床',
    scenario: 'thirdChildNoBed',
    ticketClassId: 'tc-third-child-nobed',
    guestCoefficients: [
      { p: 1, s: 0, x: 0 },
      { p: 1, s: 0, x: 0 },
      { p: 0.5, s: 0, x: 0 },
    ],
  },
  {
    id: 'tpl-third-child-bed',
    name: '第三人儿童加床',
    scenario: 'thirdChildExtraBed',
    ticketClassId: 'tc-third-child-bed',
    guestCoefficients: [
      { p: 1, s: 0, x: 0 },
      { p: 1, s: 0, x: 0 },
      { p: 0.6, s: 0, x: 0 },
    ],
  },
  {
    id: 'tpl-third-adult',
    name: '三大成人加床',
    scenario: 'thirdAdultExtraBed',
    ticketClassId: 'tc-3adult',
    guestCoefficients: [
      { p: 1, s: 0, x: 0 },
      { p: 1, s: 0, x: 0 },
      { p: 1, s: 0, x: 0 },
    ],
  },
]

export function getOccupancyFormulaTemplate(id: string) {
  return occupancyFormulaTemplates.find((item) => item.id === id)
}

export function getOccupancyFormulaTemplateByScenario(scenario: FormulaRuleKey) {
  return occupancyFormulaTemplates.find((item) => item.scenario === scenario)
}

/** 将楼层费系数叠加到第一入住人 */
export function applyFloorSurchargeToTemplate(
  template: OccupancyFormulaTemplate,
  floorS: number,
): GuestPriceCoefficient[] {
  return template.guestCoefficients.map((coeff, index) => ({
    ...coeff,
    s: index === 0 ? coeff.s + floorS : coeff.s,
  }))
}

export function formatGuestCoefficientFormula(coeff: GuestPriceCoefficient): string {
  const parts: string[] = []
  if (coeff.p !== 0) parts.push(coeff.p === 1 ? 'P' : `${coeff.p}P`)
  if (coeff.s !== 0) parts.push(coeff.s === 1 ? 'S' : `${coeff.s}S`)
  if (coeff.x !== 0) parts.push(coeff.x === 1 ? 'X' : `${coeff.x}X`)
  return parts.length > 0 ? parts.join(' + ') : '0'
}

export function formatGuestCoefficientsSummary(coefficients: GuestPriceCoefficient[]): string {
  const labels = ['第一人', '第二人', '第三人', '第四人']
  return coefficients
    .map((coeff, index) => `${labels[index] || `第${index + 1}人`}=${formatGuestCoefficientFormula(coeff)}`)
    .join('；')
}
