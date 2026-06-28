import { products, ships } from '@/mock/data'
import type { VoyageTemplate } from '@/types'

export type TemplatePricingVariableKey = 'P' | 'Q' | 'K' | 'S'

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
  S: '楼层费',
}

export const templateDeckOptions = ['全部', '1F', '2F', '3F']

export const defaultTemplateFormulaRules: TemplateFormulaPricingRule[] = [
  { id: 'f-2-standard', floor: '1F', scenario: 'standard', scenarioName: '标准（2成人）', formula: '2P', enabled: true },
  { id: 'f-3-standard', floor: '2F', scenario: 'standard', scenarioName: '标准（2成人）', formula: '2(P + S)', enabled: true },
  { id: 'f-4-standard', floor: '3F', scenario: 'standard', scenarioName: '标准（2成人）', formula: '2(P + S * 2)', enabled: true },
  { id: 'f-2-single', floor: '1F', scenario: 'singleRoom', scenarioName: '单间', formula: '1.75P', enabled: true },
  { id: 'f-3-single', floor: '2F', scenario: 'singleRoom', scenarioName: '单间', formula: '1.75(P + S)', enabled: true },
  { id: 'f-4-single', floor: '3F', scenario: 'singleRoom', scenarioName: '单间', formula: '1.75(P + S * 2)', enabled: true },
  { id: 'f-child-bed', floor: '全部', scenario: 'oneAdultOneChild', scenarioName: '一大一小（儿童占床）', formula: '1.7P + S', enabled: true },
  { id: 'f-baby', floor: '全部', scenario: 'twoAdultsOneBaby', scenarioName: '两大一婴儿', formula: '2.1P + S', enabled: true },
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
      S: Array(segmentsCount).fill(180),
    },
    floorRules: [
      { floor: 1, label: '1F', formulaPrefix: 'P', floorLevel: 0 },
      { floor: 2, label: '2F', formulaPrefix: 'P + S', floorLevel: 1 },
      { floor: 3, label: '3F', formulaPrefix: 'P + S * 2', floorLevel: 2 },
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

export function evaluateTemplateFormula(formula: string, p: number, s: number): number {
  if (!formula) return 0
  try {
    let expr = formula.replace(/([\d.]+)([\w(])/g, '$1*$2')
    expr = expr.replace(/P/g, String(p)).replace(/S/g, String(s))
    // eslint-disable-next-line no-new-func
    const result = new Function('return ' + expr)()
    return Number.isFinite(result) ? Math.round(result) : 0
  } catch {
    return 0
  }
}
