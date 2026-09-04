import type { Product, ProductSegment, TemplateDeposit, TemplateItinerary, TemplateTip, VoyageTemplate } from '@/types'
import type { ProductVoyageConfigValue } from '@/components/resources/ProductVoyageConfigPanel'
import { emptyProductVoyageConfig } from '@/components/resources/ProductVoyageConfigPanel'
import { resolveRouteItinerarySchedule } from '@/utils/itinerarySchedule'

export interface ProductSegmentOption {
  key: string
  label: string
}

export function getSegmentKey(seg: Pick<ProductSegment, 'startPort' | 'endPort'>) {
  return `${seg.startPort}-${seg.endPort}`
}

export function buildProductSegmentOptions(segments: Pick<ProductSegment, 'startPort' | 'endPort'>[]): ProductSegmentOption[] {
  return segments.map((seg) => ({
    key: getSegmentKey(seg),
    label: `${seg.startPort} → ${seg.endPort}`,
  }))
}

export function formatSegmentKeyLabel(segmentKey: string, options?: ProductSegmentOption[]) {
  if (!segmentKey) return '-'
  return options?.find((item) => item.key === segmentKey)?.label || segmentKey.replace('-', ' → ')
}

function normalizeDeposit(item: TemplateDeposit, defaultSegmentKey: string): TemplateDeposit {
  const legacy = item as TemplateDeposit & { marketCategory?: string }
  return {
    ...item,
    segmentKey: item.segmentKey || defaultSegmentKey,
    roomType: item.roomType || legacy.marketCategory || '',
  }
}

function normalizeTip(item: TemplateTip, defaultSegmentKey: string): TemplateTip {
  const legacy = item as TemplateTip & { marketCategory?: string }
  return {
    ...item,
    segmentKey: item.segmentKey || defaultSegmentKey,
    roomType: item.roomType || legacy.marketCategory || '',
    mandatory: item.mandatory ?? false,
  }
}

export function pickProductVoyageConfig(
  product: Pick<
    Product,
    | 'id'
    | 'deposits'
    | 'tips'
    | 'configuredRoomTypes'
    | 'privileges'
    | 'presaleDays'
    | 'cutoffDays'
    | 'refundPolicy'
    | 'materialReq'
    | 'segments'
    | 'additionalProductIds'
    | 'depositRuleId'
    | 'b2bDepositRuleId'
    | 'b2bPaymentRuleId'
    | 'b2bPresaleDays'
    | 'b2bCutoffDays'
    | 'b2bRefundPolicy'
    | 'b2cPaymentRuleId'
    | 'b2cPresaleDays'
    | 'b2cCutoffDays'
    | 'b2cRefundPolicy'
  >,
): ProductVoyageConfigValue {
  const defaultSegmentKey = product.segments?.[0] ? getSegmentKey(product.segments[0]) : ''
  const associatedAps = product.additionalProductIds
    ? product.additionalProductIds
    : ['ap001', 'ap002', 'ap004'] // 默认关联常用附加产品 mock
  return {
    deposits: (product.deposits || []).map((item) => normalizeDeposit(item, defaultSegmentKey)),
    tips: (product.tips || []).map((item) => normalizeTip(item, defaultSegmentKey)),
    configuredRoomTypes: [...(product.configuredRoomTypes || [])],
    privileges: (product.privileges || []).map((item) => ({ ...item })),
    presaleDays: product.presaleDays || 90,
    cutoffDays: product.cutoffDays || 3,
    refundPolicy: product.refundPolicy || '标准退改',
    materialReq: [...(product.materialReq || ['宣传册', '行程单'])],
    additionalProductIds: associatedAps,
    depositRuleId: product.depositRuleId || 'dep_default',
    b2bDepositRuleId: product.b2bDepositRuleId || product.depositRuleId || 'dep_default',
    b2bPaymentRuleId: product.b2bPaymentRuleId || 'pay_default',
    b2bPresaleDays: product.b2bPresaleDays ?? product.presaleDays ?? 90,
    b2bCutoffDays: product.b2bCutoffDays ?? product.cutoffDays ?? 3,
    b2bRefundPolicy: product.b2bRefundPolicy || product.refundPolicy || '标准退改',
    b2cPaymentRuleId: product.b2cPaymentRuleId || 'pay_c_direct',
    b2cPresaleDays: product.b2cPresaleDays ?? 60,
    b2cCutoffDays: product.b2cCutoffDays ?? 1,
    b2cRefundPolicy: product.b2cRefundPolicy || '标准退改',
  }
}

export function applyVoyageConfigToTemplate(product?: Product | null): Pick<VoyageTemplate, 'deposits' | 'tips' | 'presaleDays' | 'cutoffDays' | 'refundPolicy' | 'materialReq'> {
  return product ? pickProductVoyageConfig(product) : emptyProductVoyageConfig()
}

export function enrichProductWithTemplateConfig(
  product: Omit<Product, 'deposits' | 'tips' | 'configuredRoomTypes' | 'privileges' | 'presaleDays' | 'cutoffDays' | 'refundPolicy' | 'materialReq'>,
  template?: Pick<VoyageTemplate, 'deposits' | 'tips' | 'presaleDays' | 'cutoffDays' | 'refundPolicy' | 'materialReq'> | null,
): Product {
  const defaults = emptyProductVoyageConfig()
  if (!template) {
    return {
      ...product,
      deposits: defaults.deposits,
      tips: defaults.tips,
      configuredRoomTypes: defaults.configuredRoomTypes,
      privileges: defaults.privileges,
      presaleDays: defaults.presaleDays,
      cutoffDays: defaults.cutoffDays,
      refundPolicy: defaults.refundPolicy,
      materialReq: defaults.materialReq,
    }
  }
  const defaultSegmentKey = product.segments?.[0] ? getSegmentKey(product.segments[0]) : ''
  return {
    ...product,
    deposits: (template.deposits || []).map((item) => normalizeDeposit(item, defaultSegmentKey)),
    tips: (template.tips || []).map((item) => normalizeTip(item, defaultSegmentKey)),
    configuredRoomTypes: defaults.configuredRoomTypes,
    privileges: defaults.privileges,
    presaleDays: template.presaleDays,
    cutoffDays: template.cutoffDays,
    refundPolicy: template.refundPolicy,
    materialReq: template.materialReq,
  }
}

export function resolveTemplateItinerary(
  template: VoyageTemplate,
  product?: Product | null,
  departureDate?: string,
): TemplateItinerary[] {
  const fromPlan = resolveRouteItinerarySchedule(product?.routeId, departureDate)
  if (fromPlan.length) return fromPlan
  return template.itinerary || []
}

export function resolveTemplateDeposits(template: VoyageTemplate, product?: Product | null): TemplateDeposit[] {
  if (product?.deposits?.length) return product.deposits
  return template.deposits || []
}

export function resolveTemplateTips(template: VoyageTemplate, product?: Product | null): TemplateTip[] {
  if (product?.tips?.length) return product.tips
  return template.tips || []
}
