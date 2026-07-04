import { products, ships } from '@/mock/data'
import type { VoyageTemplate } from '@/types'

export type TemplatePricingVariableKey = 'P' | 'Q' | 'K' | 'S1F' | 'S2F' | 'S3F'

export type TemplateFloorPricingRule = {
  floor: number
  label: string
  formulaPrefix: string
  floorLevel: number
}

export type TemplateFormulaRuleKey =
  | 'standard'
  | 'singleRoom'
  | 'oneAdultOneChild'
  | 'twoAdultsOneBaby'
  | 'thirdChildNoBed'
  | 'thirdChildExtraBed'
  | 'thirdAdultExtraBed'
  | 'custom'

export type TemplateFormulaPricingRule = {
  id: string
  floor: string
  scenario: TemplateFormulaRuleKey
  scenarioName: string
  formula: string
  enabled: boolean
}

export type TemplateCabinPricingRule = {
  variables: Record<TemplatePricingVariableKey, number[]>
  floorRules: TemplateFloorPricingRule[]
  formulaRules: TemplateFormulaPricingRule[]
}

export const templateVariableLabels: Record<TemplatePricingVariableKey, string> = {
  P: '公式基数(口岸)',
  Q: '公式基数(区域)',
  K: '公式基数(标准)',
  S1F: '楼层费(1F)',
  S2F: '楼层费(2F)',
  S3F: '楼层费(3F)',
}

export const templateDeckOptions = ['全部', '1F', '2F', '3F']

export const defaultTemplateFormulaRules: TemplateFormulaPricingRule[] = [
  { id: 'f-2-standard', floor: '1F', scenario: 'standard', scenarioName: '标准（2成人）', formula: '2(P + S1F)', enabled: true },
  { id: 'f-3-standard', floor: '2F', scenario: 'standard', scenarioName: '标准（2成人）', formula: '2(P + S2F)', enabled: true },
  { id: 'f-4-standard', floor: '3F', scenario: 'standard', scenarioName: '标准（2成人）', formula: '2(P + S3F)', enabled: true },
  { id: 'f-2-single', floor: '1F', scenario: 'singleRoom', scenarioName: '单间', formula: '1.75P', enabled: true },
  { id: 'f-3-single', floor: '2F', scenario: 'singleRoom', scenarioName: '单间', formula: '1.75(P + S2F)', enabled: true },
  { id: 'f-4-single', floor: '3F', scenario: 'singleRoom', scenarioName: '单间', formula: '1.75(P + S3F)', enabled: true },
  { id: 'f-child-bed', floor: '全部', scenario: 'oneAdultOneChild', scenarioName: '一大一小（儿童占床）', formula: '1.7P + S2F', enabled: true },
  { id: 'f-baby', floor: '全部', scenario: 'twoAdultsOneBaby', scenarioName: '两大一婴儿', formula: '2.1P + S2F', enabled: true },
  { id: 'f-third-nobed', floor: '全部', scenario: 'thirdChildNoBed', scenarioName: '第三人儿童不占床', formula: '1.5P', enabled: true },
  { id: 'f-third-bed', floor: '全部', scenario: 'thirdChildExtraBed', scenarioName: '第三人儿童加床', formula: '1.6P', enabled: true },
  { id: 'f-third-adult', floor: '全部', scenario: 'thirdAdultExtraBed', scenarioName: '三大成人加床', formula: '2P', enabled: true },
]

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
      Q: Array(segmentsCount).fill(1.0),
      K: Array(segmentsCount).fill(1.0),
      S1F: Array(segmentsCount).fill(0),
      S2F: Array(segmentsCount).fill(180),
      S3F: Array(segmentsCount).fill(360),
    },
    floorRules: [
      { floor: 1, label: '1F', formulaPrefix: 'P + S1F', floorLevel: 0 },
      { floor: 2, label: '2F', formulaPrefix: 'P + S2F', floorLevel: 1 },
      { floor: 3, label: '3F', formulaPrefix: 'P + S3F', floorLevel: 2 },
    ],
    formulaRules: defaultTemplateFormulaRules.map((item) => ({ ...item })),
  }
}

export function getTemplatePriceRuleKey(templateId: string, cabinType: string) {
  return `${templateId}_${cabinType}`
}

export function loadTemplatePriceRules(template: VoyageTemplate) {
  const segmentsCount = getTemplateSegmentsCount(template)
  const rules: Record<string, TemplateCabinPricingRule> = {}
  getTemplateCabinTypes(template).forEach((cabin) => {
    rules[cabin] =
      mockRulesStore[getTemplatePriceRuleKey(template.id, cabin)] ||
      createDefaultTemplatePricingRule(segmentsCount)
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

export function evaluateTemplateFormula(formula: string, variables: Partial<Record<TemplatePricingVariableKey | 'S', number>>): number {
  if (!formula) return 0
  try {
    let expr = formula.replace(/([\d.]+)([\w(])/g, '$1*$2')
    const replaceOrder = ['S1F', 'S2F', 'S3F', 'P', 'Q', 'K', 'S'] as const
    replaceOrder.forEach((key) => {
      const value =
        key === 'S'
          ? variables.S ?? variables.S2F ?? 0
          : variables[key] ?? 0
      expr = expr.replace(new RegExp(key, 'g'), String(value))
    })
    // eslint-disable-next-line no-new-func
    const result = new Function('return ' + expr)()
    return Number.isFinite(result) ? Math.round(result) : 0
  } catch {
    return 0
  }
}
