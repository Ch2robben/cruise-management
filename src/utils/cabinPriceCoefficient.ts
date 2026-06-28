import type { SellRoomTypeConfig } from '@/mock/sellRoomTypeConfig'
import {
  applyFloorSurchargeToTemplate,
  getOccupancyFormulaTemplate,
  getOccupancyFormulaTemplateByScenario,
  occupancyFormulaTemplates,
  type GuestPriceCoefficient,
} from '@/mock/occupancyFormulaTemplates'
import {
  getDefaultPCoefficients,
  getTicketClassTypeCount,
  scenarioTicketClassMap,
} from '@/mock/ticketClasses'

export type { GuestPriceCoefficient } from '@/mock/occupancyFormulaTemplates'

export type PricingRuleContext = Pick<SellRoomTypeConfig, 'id' | 'shipName' | 'sellRoomTypeName'>

export type ExcludePeriod = {
  id: string
  start: string
  end: string
}

export type FloorPricingRule = {
  floor: number
  label: string
  formulaPrefix: string
  floorLevel: number
}

export type FormulaRuleKey =
  | 'standard'
  | 'singleRoom'
  | 'oneAdultOneChild'
  | 'twoAdultsOneBaby'
  | 'thirdChildNoBed'
  | 'thirdChildExtraBed'
  | 'thirdAdultExtraBed'
  | 'custom'

export type FormulaPricingRule = {
  id: string
  floor: string
  scenario: FormulaRuleKey
  scenarioName: string
  ticketClassId: string
  templateId?: string
  guestCoefficients: GuestPriceCoefficient[]
  /** @deprecated 兼容旧数据，读取时迁移到 guestCoefficients */
  pCoefficients?: number[]
  /** @deprecated 兼容旧数据 */
  sCoefficient?: number
  formula: string
  enabled: boolean
}

function formatCoeff(n: number): string {
  if (Number.isInteger(n)) return String(n)
  return String(parseFloat(n.toFixed(4)))
}

function formatPLabel(index: number, total: number) {
  return total > 1 ? `P${index + 1}` : 'P'
}

export function formatGuestCoefficientFormula(coeff: GuestPriceCoefficient): string {
  const parts: string[] = []
  if (coeff.p !== 0) parts.push(`${formatCoeff(coeff.p)}P`)
  if (coeff.s !== 0) parts.push(`${formatCoeff(coeff.s)}S`)
  if (coeff.x !== 0) parts.push(`${formatCoeff(coeff.x)}X`)
  return parts.length > 0 ? parts.join(' + ') : '0'
}

export function formatFormulaFromGuestCoefficients(coefficients: GuestPriceCoefficient[]): string {
  const labels = ['第一人', '第二人', '第三人', '第四人']
  return coefficients
    .map((coeff, index) => `${labels[index] || `第${index + 1}人`}=${formatGuestCoefficientFormula(coeff)}`)
    .join('；')
}

export function formatFormulaFromCoefficients(pCoeffs: number[], s: number): string {
  const guestCoefficients = legacyCoefficientsToGuest(pCoeffs, s)
  return formatFormulaFromGuestCoefficients(guestCoefficients)
}

function legacyCoefficientsToGuest(pCoeffs: number[], s: number): GuestPriceCoefficient[] {
  if (pCoeffs.length === 0) return [{ p: 1, s: 0, x: 0 }]
  return pCoeffs.map((p, index) => ({
    p,
    s: index === 0 ? s : 0,
    x: 0,
  }))
}

export function parseLegacyFormulaToCoefficients(formula: string): { pCoeffs: number[]; s: number } {
  const trimmed = formula.trim()

  const nestedMatch = trimmed.match(/^([\d.]+)\(P\s*\+\s*S(?:\s*\*\s*([\d.]+))?\)$/)
  if (nestedMatch) {
    const mult = parseFloat(nestedMatch[1])
    const sMult = nestedMatch[2] ? parseFloat(nestedMatch[2]) : 1
    return { pCoeffs: [mult], s: mult * sMult }
  }

  const psMatch = trimmed.match(/^([\d.]+)P\s*\+\s*(?:(\d[\d.]*)S|S)$/)
  if (psMatch) {
    return {
      pCoeffs: [parseFloat(psMatch[1])],
      s: psMatch[2] ? parseFloat(psMatch[2]) : 1,
    }
  }

  const pOnlyMatch = trimmed.match(/^([\d.]+)P$/)
  if (pOnlyMatch) return { pCoeffs: [parseFloat(pOnlyMatch[1])], s: 0 }

  if (trimmed === 'P') return { pCoeffs: [1], s: 0 }
  if (trimmed === 'S') return { pCoeffs: [0], s: 1 }

  return { pCoeffs: [1], s: 0 }
}

function resizeGuestCoefficients(coefficients: GuestPriceCoefficient[], ticketClassId: string) {
  const target = getTicketClassTypeCount(ticketClassId)
  if (coefficients.length === target) return coefficients.map((item) => ({ ...item }))
  if (coefficients.length > target) return coefficients.slice(0, target).map((item) => ({ ...item }))
  return [
    ...coefficients.map((item) => ({ ...item })),
    ...Array.from({ length: target - coefficients.length }, () => ({ p: 1, s: 0, x: 0 })),
  ]
}

export function normalizeFormulaRule(rule: FormulaPricingRule): FormulaPricingRule {
  const ticketClassId = rule.ticketClassId || scenarioTicketClassMap[rule.scenario] || 'tc-2adult'
  const template = rule.templateId
    ? getOccupancyFormulaTemplate(rule.templateId)
    : getOccupancyFormulaTemplateByScenario(rule.scenario)

  let guestCoefficients = Array.isArray(rule.guestCoefficients) ? rule.guestCoefficients.map((item) => ({ ...item })) : []

  if (guestCoefficients.length === 0) {
    const legacyP = Array.isArray(rule.pCoefficients) ? rule.pCoefficients : []
    const legacyS = typeof rule.sCoefficient === 'number' ? rule.sCoefficient : 0
    if (legacyP.length > 0) {
      guestCoefficients = legacyCoefficientsToGuest(legacyP, legacyS)
    } else if (rule.formula) {
      const legacy = parseLegacyFormulaToCoefficients(rule.formula)
      guestCoefficients = legacyCoefficientsToGuest(legacy.pCoeffs, legacy.s)
    } else if (template) {
      guestCoefficients = template.guestCoefficients.map((item) => ({ ...item }))
    }
  }

  guestCoefficients = resizeGuestCoefficients(guestCoefficients, ticketClassId)

  return {
    ...rule,
    ticketClassId,
    templateId: rule.templateId || template?.id,
    guestCoefficients,
    formula: formatFormulaFromGuestCoefficients(guestCoefficients),
  }
}

function createFormulaRule(
  rule: Omit<FormulaPricingRule, 'formula'> & {
    guestCoefficients: GuestPriceCoefficient[]
  },
): FormulaPricingRule {
  return normalizeFormulaRule({
    ...rule,
    formula: formatFormulaFromGuestCoefficients(rule.guestCoefficients),
  })
}

function buildFloorFormulaRule(
  id: string,
  floor: string,
  scenario: FormulaRuleKey,
  floorS: number,
): FormulaPricingRule {
  const template = getOccupancyFormulaTemplateByScenario(scenario)
  if (!template) {
    return createEmptyFormulaRule()
  }
  return createFormulaRule({
    id,
    floor,
    scenario,
    scenarioName: template.name,
    ticketClassId: template.ticketClassId,
    templateId: template.id,
    guestCoefficients: applyFloorSurchargeToTemplate(template, floorS),
    enabled: true,
  })
}

export const defaultFormulaRules: FormulaPricingRule[] = [
  buildFloorFormulaRule('f-2-standard', '1F', 'standard', 0),
  buildFloorFormulaRule('f-3-standard', '2F', 'standard', 2),
  buildFloorFormulaRule('f-4-standard', '3F', 'standard', 4),
  buildFloorFormulaRule('f-2-single', '1F', 'singleRoom', 0),
  buildFloorFormulaRule('f-3-single', '2F', 'singleRoom', 1.75),
  buildFloorFormulaRule('f-4-single', '3F', 'singleRoom', 3.5),
  buildFloorFormulaRule('f-child-bed', '全部', 'oneAdultOneChild', 1),
  buildFloorFormulaRule('f-baby', '全部', 'twoAdultsOneBaby', 1),
  buildFloorFormulaRule('f-third-nobed', '全部', 'thirdChildNoBed', 0),
  buildFloorFormulaRule('f-third-bed', '全部', 'thirdChildExtraBed', 0),
  buildFloorFormulaRule('f-third-adult', '全部', 'thirdAdultExtraBed', 0),
]

export type CabinPricingRule = {
  id: string
  name: string
  effectiveStart: string
  effectiveEnd: string
  excludePeriods: ExcludePeriod[]
  floorRules: FloorPricingRule[]
  formulaRules: FormulaPricingRule[]
}

export const deckOptions = ['全部', '1F', '2F', '3F']

function formatDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function formatEffectiveRange(rule: Pick<CabinPricingRule, 'effectiveStart' | 'effectiveEnd'>) {
  return `${rule.effectiveStart} ~ ${rule.effectiveEnd}`
}

export function formatExcludePeriod(period: ExcludePeriod) {
  return `${period.start} ~ ${period.end}`
}

export function sortPricingRules(rules: CabinPricingRule[]) {
  return [...rules].sort((a, b) => a.effectiveStart.localeCompare(b.effectiveStart))
}

export function createDefaultPricingRule(
  record: PricingRuleContext,
  options?: { name?: string; effectiveStart?: string; effectiveEnd?: string },
): CabinPricingRule {
  const now = new Date()
  const year = now.getFullYear()
  return {
    id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: options?.name || '默认规则',
    effectiveStart: options?.effectiveStart || formatDateInput(now),
    effectiveEnd: options?.effectiveEnd || formatDateInput(new Date(year, 11, 31)),
    excludePeriods: [],
    floorRules: [
      { floor: 1, label: '1F', formulaPrefix: 'P', floorLevel: 0 },
      { floor: 2, label: '2F', formulaPrefix: 'P + S', floorLevel: 1 },
      { floor: 3, label: '3F', formulaPrefix: 'P + S * 2', floorLevel: 2 },
    ],
    formulaRules: defaultFormulaRules.map((item) => normalizeFormulaRule({ ...item })),
  }
}

export function createSupplementPricingRule(record: PricingRuleContext, existingRules: CabinPricingRule[]): CabinPricingRule {
  const sorted = sortPricingRules(existingRules)
  const last = sorted[sorted.length - 1]
  if (!last) return createDefaultPricingRule(record)

  const nextStart = new Date(last.effectiveEnd)
  nextStart.setDate(nextStart.getDate() + 1)
  const nextEnd = new Date(nextStart)
  nextEnd.setMonth(nextEnd.getMonth() + 5)

  return createDefaultPricingRule(record, {
    name: `规则${existingRules.length + 1}`,
    effectiveStart: formatDateInput(nextStart),
    effectiveEnd: formatDateInput(nextEnd),
  })
}

export function createEmptyExcludePeriod(): ExcludePeriod {
  return { id: `exclude-${Date.now()}`, start: '', end: '' }
}

export function createEmptyFormulaRule(ticketClassId = 'tc-2adult'): FormulaPricingRule {
  const template = occupancyFormulaTemplates.find((item) => item.ticketClassId === ticketClassId)
    || getOccupancyFormulaTemplateByScenario('standard')
  return normalizeFormulaRule({
    id: 'custom-' + Date.now(),
    floor: '全部',
    scenario: template?.scenario || 'custom',
    scenarioName: template?.name || '新规则',
    ticketClassId,
    templateId: template?.id,
    guestCoefficients: template?.guestCoefficients.map((item) => ({ ...item })) || getDefaultPCoefficients(ticketClassId).map((p) => ({ p, s: 0, x: 0 })),
    formula: '',
    enabled: true,
  })
}
