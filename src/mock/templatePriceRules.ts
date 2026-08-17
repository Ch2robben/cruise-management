import { products, ships } from '@/mock/data'
import type { VoyageTemplate } from '@/types'
import {
  defaultFormulaRules,
  normalizeFormulaRule,
  type FormulaPricingRule,
} from '@/utils/cabinPriceCoefficient'

export type TemplatePricingVariableKey =
  | 'P'
  | 'P_AREA'
  | 'K'
  | 'Q'
  | 'Q_AREA'
  | 'Q_K'
  | 'S'
  | 'S1F'
  | 'S2F'
  | 'S3F'

export type TemplateFloorPricingRule = {
  floor: number
  label: string
  formulaPrefix: string
  floorLevel: number
}

export type TemplateFormulaPricingRule = FormulaPricingRule

export type TemplateCabinPricingRule = {
  variables: Record<TemplatePricingVariableKey, number[]>
  floorRules: TemplateFloorPricingRule[]
  formulaRules: TemplateFormulaPricingRule[]
}

export const templateVariableLabels: Record<TemplatePricingVariableKey, string> = {
  P: '公式基数(口岸)',
  P_AREA: '公式基数(区域)',
  K: '公式基数(标准)',
  Q: '定价常数(口岸)',
  Q_AREA: '定价常数(区域)',
  Q_K: '定价常数(标准)',
  S: '楼层费',
  S1F: '楼层费(1F)',
  S2F: '楼层费(2F)',
  S3F: '楼层费(3F)',
}

export const templateDeckOptions = ['全部', '1F', '2F', '3F']

export const defaultTemplateFormulaRules: TemplateFormulaPricingRule[] = defaultFormulaRules.map((item) =>
  normalizeFormulaRule({
    ...item,
    guestCoefficients: item.guestCoefficients.map((coefficient) => ({ ...coefficient })),
  }),
)

const mockRulesStore: Record<string, TemplateCabinPricingRule> = {}

export function getTemplateSegmentsCount(template: VoyageTemplate) {
  const product = products.find((item) => item.id === template.productId)
  return Math.max(1, product?.segments?.length || 1)
}

export function getTemplateCabinTypes(template: VoyageTemplate) {
  const shipObj = ships.find((item) => item.name === template.shipName)
  return shipObj?.cabinTypes || ['standard']
}

export function createDefaultTemplatePricingRule(segmentsCount = 1): TemplateCabinPricingRule {
  return {
    variables: {
      P: Array(segmentsCount).fill(1200),
      P_AREA: Array(segmentsCount).fill(1.0),
      K: Array(segmentsCount).fill(1.0),
      Q: Array(segmentsCount).fill(500),
      Q_AREA: Array(segmentsCount).fill(500),
      Q_K: Array(segmentsCount).fill(500),
      S: Array(segmentsCount).fill(180),
      S1F: Array(segmentsCount).fill(0),
      S2F: Array(segmentsCount).fill(180),
      S3F: Array(segmentsCount).fill(360),
    },
    floorRules: [
      { floor: 1, label: '1F', formulaPrefix: 'P + S', floorLevel: 0 },
      { floor: 2, label: '2F', formulaPrefix: 'P + S', floorLevel: 1 },
      { floor: 3, label: '3F', formulaPrefix: 'P + S', floorLevel: 2 },
    ],
    formulaRules: defaultTemplateFormulaRules.map((item) =>
      normalizeFormulaRule({
        ...item,
        guestCoefficients: item.guestCoefficients.map((coefficient) => ({ ...coefficient })),
      }),
    ),
  }
}

export function getTemplatePriceRuleKey(templateId: string, cabinType: string) {
  return `${templateId}_${cabinType}`
}

export function loadTemplatePriceRules(template: VoyageTemplate) {
  const segmentsCount = getTemplateSegmentsCount(template)
  const rules: Record<string, TemplateCabinPricingRule> = {}
  getTemplateCabinTypes(template).forEach((cabin) => {
    const existing = mockRulesStore[getTemplatePriceRuleKey(template.id, cabin)]
    if (existing) {
      const defaultVars = createDefaultTemplatePricingRule(segmentsCount).variables
      rules[cabin] = {
        ...existing,
        variables: {
          ...defaultVars,
          ...existing.variables,
        },
      }
    } else {
      rules[cabin] = createDefaultTemplatePricingRule(segmentsCount)
    }
  })
  return rules
}

export function saveTemplatePriceRules(templateId: string, rules: Record<string, TemplateCabinPricingRule>) {
  Object.entries(rules).forEach(([cabin, rule]) => {
    mockRulesStore[getTemplatePriceRuleKey(templateId, cabin)] = rule
  })
}

export function hasConfiguredTemplatePrice(templateId: string, cabinTypes: string[]) {
  return cabinTypes.some((cabin) => Boolean(mockRulesStore[getTemplatePriceRuleKey(templateId, cabin)]))
}

export function evaluateTemplateFormula(formula: string, variables: Partial<Record<TemplatePricingVariableKey, number>>): number {
  if (!formula) return 0
  try {
    let expr = formula.replace(/(\d+(?:\.\d+)?)\s*(?=[PQS(])/g, '$1*')
    const replaceOrder = ['P_AREA', 'Q_AREA', 'Q_K', 'S1F', 'S2F', 'S3F', 'P', 'Q', 'K', 'S'] as const
    replaceOrder.forEach((key) => {
      const value = variables[key] ?? 0
      expr = expr.replace(new RegExp(key, 'g'), String(value))
    })
    // eslint-disable-next-line no-new-func
    const result = new Function('return ' + expr)()
    return Number.isFinite(result) ? Math.round(result) : 0
  } catch {
    return 0
  }
}
