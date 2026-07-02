import type { Product, ProductSegment, TemplateDeposit, TemplateItinerary, TemplateTip, VoyageTemplate } from '@/types'
import type { ProductVoyageConfigValue } from '@/components/resources/ProductVoyageConfigPanel'
import { emptyProductVoyageConfig } from '@/components/resources/ProductVoyageConfigPanel'
import { resolveProductItinerarySchedule } from '@/utils/itinerarySchedule'

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
  product: Pick<Product, 'deposits' | 'tips' | 'configuredRoomTypes' | 'privileges' | 'presaleDays' | 'cutoffDays' | 'refundPolicy' | 'materialReq' | 'segments'>,
): ProductVoyageConfigValue {
  const defaultSegmentKey = product.segments?.[0] ? getSegmentKey(product.segments[0]) : ''
  return {
    deposits: (product.deposits || []).map((item) => normalizeDeposit(item, defaultSegmentKey)),
    tips: (product.tips || []).map((item) => normalizeTip(item, defaultSegmentKey)),
    configuredRoomTypes: [...(product.configuredRoomTypes || [])],
    privileges: (product.privileges || []).map((item) => ({ ...item })),
    presaleDays: product.presaleDays || 0,
    cutoffDays: product.cutoffDays || 0,
    refundPolicy: product.refundPolicy || '',
    materialReq: [...(product.materialReq || [])],
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

export function resolveTemplateItinerary(template: VoyageTemplate, product?: Product | null): TemplateItinerary[] {
  const fromPlan = resolveProductItinerarySchedule(product?.itineraryPlanId)
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
