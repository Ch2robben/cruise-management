import type { RegionScopeKind } from '@/mock/pricePolicyRegions'

export type DealerChannelKind = 'ota' | 'non_ota'

export interface DealerConfigRegion {
  code: string
  label: string
  pathLabel: string
  scope: RegionScopeKind
  /** 来源区域政策名称 */
  sourcePolicy: string
}

export interface DealerConfig {
  dealerId: string
  dealerName: string
  groupName: string
  channelKind: DealerChannelKind
  policyTypeIds: string[]
  regionCodes: string[]
  updatedAt: string
}

/** 与「分销管理 → 价格政策」对齐 */
export const dealerPolicyTypeOptions = [
  { id: 'pt1', name: '散客预定', group: '预定类型' },
  { id: 'pt2', name: '团队预定', group: '预定类型' },
  { id: 'pt3', name: '大团队预定', group: '预定类型' },
  { id: 'non_ota', name: '非OTA', group: '计价类型' },
  { id: 'ota', name: 'OTA', group: '计价类型' },
]

/**
 * 可选区域 = 「价格政策」中非OTA政策已配置的生效区域并集。
 * 与 PriceTypeRulePage 初始非OTA种子保持一致。
 */
export const regionPolicyEffectiveRegions: DealerConfigRegion[] = [
  { code: '500000', label: '重庆市', pathLabel: '重庆市', scope: 'domestic', sourcePolicy: '渝川区域结算价' },
  { code: '510000', label: '四川省', pathLabel: '四川省', scope: 'domestic', sourcePolicy: '渝川区域结算价' },
  { code: '530000', label: '云南省', pathLabel: '云南省', scope: 'domestic', sourcePolicy: '滇黔区域结算价' },
  { code: '520000', label: '贵州省', pathLabel: '贵州省', scope: 'domestic', sourcePolicy: '滇黔区域结算价' },
  { code: '420500', label: '宜昌市', pathLabel: '湖北省 / 宜昌市', scope: 'domestic', sourcePolicy: '宜昌城区区域价' },
  { code: '420503', label: '伍家岗区', pathLabel: '湖北省 / 宜昌市 / 伍家岗区', scope: 'domestic', sourcePolicy: '宜昌城区区域价' },
  { code: 'JP', label: '日本', pathLabel: '亚洲 / 日本', scope: 'overseas', sourcePolicy: '日韩外宾区域价' },
  { code: 'KR', label: '韩国', pathLabel: '亚洲 / 韩国', scope: 'overseas', sourcePolicy: '日韩外宾区域价' },
]

export const dealerConfigDealers = [
  { id: 'd1', name: '三峡国际旅行社', groupName: '重庆地区' },
  { id: 'd2', name: '重庆中旅国际', groupName: '重庆地区' },
  { id: 'd3', name: '万州国际旅游', groupName: '重庆地区' },
  { id: 'd4', name: '渝东旅游开发', groupName: '重庆地区' },
  { id: 'd5', name: '宜昌蓝天旅行社', groupName: '湖北地区' },
  { id: 'd6', name: '武汉中华旅行社', groupName: '湖北地区' },
  { id: 'd7', name: '荆州楚风旅游', groupName: '湖北地区' },
  { id: 'd8', name: '驴妈妈旅游网', groupName: 'OTA渠道' },
  { id: 'd9', name: '途牛旅游网络', groupName: 'OTA渠道' },
]

const now = () => new Date().toISOString().slice(0, 16).replace('T', ' ')

function seedConfig(partial: Omit<DealerConfig, 'updatedAt'>): DealerConfig {
  return { ...partial, updatedAt: '2026-08-18 10:00' }
}

const store: Record<string, DealerConfig> = {
  d1: seedConfig({
    dealerId: 'd1',
    dealerName: '三峡国际旅行社',
    groupName: '重庆地区',
    channelKind: 'non_ota',
    policyTypeIds: ['pt1', 'pt2', 'non_ota'],
    regionCodes: ['500000', '510000'],
  }),
  d5: seedConfig({
    dealerId: 'd5',
    dealerName: '宜昌蓝天旅行社',
    groupName: '湖北地区',
    channelKind: 'non_ota',
    policyTypeIds: ['pt1', 'pt2', 'pt3', 'non_ota'],
    regionCodes: ['420500', '420503'],
  }),
  d8: seedConfig({
    dealerId: 'd8',
    dealerName: '驴妈妈旅游网',
    groupName: 'OTA渠道',
    channelKind: 'ota',
    policyTypeIds: ['pt1', 'ota'],
    regionCodes: [],
  }),
  d9: seedConfig({
    dealerId: 'd9',
    dealerName: '途牛旅游网络',
    groupName: 'OTA渠道',
    channelKind: 'ota',
    policyTypeIds: ['pt1', 'ota'],
    regionCodes: ['JP', 'KR'],
  }),
}

export function defaultDealerConfig(dealerId: string): DealerConfig {
  const dealer = dealerConfigDealers.find((item) => item.id === dealerId)
  const isOta = dealer?.groupName === 'OTA渠道'
  return {
    dealerId,
    dealerName: dealer?.name ?? dealerId,
    groupName: dealer?.groupName ?? '',
    channelKind: isOta ? 'ota' : 'non_ota',
    policyTypeIds: isOta ? ['pt1', 'ota'] : ['pt1', 'non_ota'],
    regionCodes: isOta ? [] : [],
    updatedAt: now(),
  }
}

export function getDealerConfig(dealerId: string): DealerConfig {
  return store[dealerId] ?? defaultDealerConfig(dealerId)
}

export function saveDealerConfig(config: DealerConfig): DealerConfig {
  const next = { ...config, updatedAt: now() }
  store[config.dealerId] = next
  return next
}

export function formatPolicyTypeNames(ids: string[]) {
  if (ids.length === 0) return '未配置'
  return ids
    .map((id) => dealerPolicyTypeOptions.find((item) => item.id === id)?.name)
    .filter(Boolean)
    .join('、')
}

export function formatRegionNames(codes: string[]) {
  if (codes.length === 0) return '未限制'
  return codes
    .map((code) => regionPolicyEffectiveRegions.find((item) => item.code === code)?.label)
    .filter(Boolean)
    .join('、')
}
