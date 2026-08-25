/** 分销管理 · 价格政策（含扣减库存池绑定） */
import type { Status } from '@/types'
import type { SelectedPolicyRegion } from '@/components/rule/PolicyRegionPicker'
import type { RegionScopeKind } from '@/mock/pricePolicyRegions'
import { generateId } from '@/utils/format'

export type PricePolicyTypeKind = 'ota' | 'non_ota'
/** 分类：正价 / 特价 */
export type PricePolicyCategory = 'regular' | 'special'

export interface PricePolicyType {
  id: string
  code: string
  name: string
  distributorGroup: string
  /** 分类：正价 / 特价 */
  category: PricePolicyCategory
  /** 计价类型：OTA / 非OTA */
  policyType: PricePolicyTypeKind
  /** 下单命中本类型政策后扣减的库存池 */
  inventoryPoolId: string
  inventoryPoolName: string
  priority: number
  effectiveStart: string
  effectiveEnd: string
  scopes: RegionScopeKind[]
  domesticRegions: SelectedPolicyRegion[]
  overseasRegions: SelectedPolicyRegion[]
  otaChannels: string[]
  retailEqualsSettlement: boolean
  status: Status
  remark: string
  updatedBy: string
  updatedAt: string
  createdAt: string
}

export type PricePolicyTypeForm = Omit<PricePolicyType, 'id' | 'updatedBy' | 'updatedAt' | 'createdAt'>

const stamp = '2026-04-01T08:00:00.000Z'

function seed(partial: Omit<PricePolicyType, 'updatedBy' | 'updatedAt' | 'createdAt'>): PricePolicyType {
  return {
    ...partial,
    updatedBy: '系统管理员',
    updatedAt: stamp,
    createdAt: stamp,
  }
}

const initialTypes: PricePolicyType[] = [
  seed({
    id: 'ppt-reg-001',
    code: 'PPOL-REG-001',
    name: '渝川区域结算价',
    distributorGroup: 'A组',
    category: 'special',
    policyType: 'non_ota',
    inventoryPoolId: 'pool-1',
    inventoryPoolName: '同业共享池',
    scopes: ['domestic'],
    domesticRegions: [
      { code: '500000', label: '重庆市', pathLabel: '重庆市', path: ['重庆市'], scope: 'domestic' },
      { code: '510000', label: '四川省', pathLabel: '四川省', path: ['四川省'], scope: 'domestic' },
    ],
    overseasRegions: [],
    otaChannels: [],
    retailEqualsSettlement: false,
    priority: 10,
    effectiveStart: '2026-01-01',
    effectiveEnd: '2026-12-31',
    status: 'enabled',
    remark: '重庆、四川属地游客适用区域优惠结算价。',
  }),
  seed({
    id: 'ppt-reg-002',
    code: 'PPOL-REG-002',
    name: '滇黔区域结算价',
    distributorGroup: 'A组',
    category: 'special',
    policyType: 'non_ota',
    inventoryPoolId: 'pool-1',
    inventoryPoolName: '同业共享池',
    scopes: ['domestic'],
    domesticRegions: [
      { code: '530000', label: '云南省', pathLabel: '云南省', path: ['云南省'], scope: 'domestic' },
      { code: '520000', label: '贵州省', pathLabel: '贵州省', path: ['贵州省'], scope: 'domestic' },
    ],
    overseasRegions: [],
    otaChannels: [],
    retailEqualsSettlement: false,
    priority: 15,
    effectiveStart: '2026-01-01',
    effectiveEnd: '2026-12-31',
    status: 'enabled',
    remark: '云南、贵州属地游客适用区域优惠结算价。',
  }),
  seed({
    id: 'ppt-reg-003',
    code: 'PPOL-REG-003',
    name: '宜昌城区区域价',
    distributorGroup: 'B组',
    category: 'special',
    policyType: 'non_ota',
    inventoryPoolId: 'pool-2',
    inventoryPoolName: '大客户锁配额池',
    scopes: ['domestic'],
    domesticRegions: [
      { code: '420500', label: '宜昌市', pathLabel: '湖北省 / 宜昌市', path: ['湖北省', '宜昌市'], scope: 'domestic' },
      { code: '420503', label: '伍家岗区', pathLabel: '湖北省 / 宜昌市 / 伍家岗区', path: ['湖北省', '宜昌市', '伍家岗区'], scope: 'domestic' },
    ],
    overseasRegions: [],
    otaChannels: [],
    retailEqualsSettlement: false,
    priority: 25,
    effectiveStart: '2026-01-01',
    effectiveEnd: '2026-12-31',
    status: 'enabled',
    remark: '宜昌市及伍家岗区籍游客适用区域价。',
  }),
  seed({
    id: 'ppt-reg-004',
    code: 'PPOL-REG-004',
    name: '日韩外宾区域价',
    distributorGroup: 'D组',
    category: 'special',
    policyType: 'non_ota',
    inventoryPoolId: 'pool-1',
    inventoryPoolName: '同业共享池',
    scopes: ['overseas'],
    domesticRegions: [],
    overseasRegions: [
      { code: 'JP', label: '日本', pathLabel: '亚洲 / 日本', path: ['亚洲', '日本'], scope: 'overseas' },
      { code: 'KR', label: '韩国', pathLabel: '亚洲 / 韩国', path: ['亚洲', '韩国'], scope: 'overseas' },
    ],
    otaChannels: [],
    retailEqualsSettlement: false,
    priority: 18,
    effectiveStart: '2026-01-01',
    effectiveEnd: '2026-12-31',
    status: 'enabled',
    remark: '日本、韩国籍外宾适用区域价。',
  }),
  seed({
    id: 'ppt-glb-001',
    code: 'PPOL-GLB-001',
    name: '长航默认全域结算价',
    distributorGroup: 'A组',
    category: 'regular',
    policyType: 'non_ota',
    inventoryPoolId: 'pool-4',
    inventoryPoolName: '直销机动池',
    scopes: ['domestic', 'overseas'],
    domesticRegions: [],
    overseasRegions: [],
    otaChannels: [],
    retailEqualsSettlement: false,
    priority: 100,
    effectiveStart: '2026-01-01',
    effectiveEnd: '2026-12-31',
    status: 'enabled',
    remark: '保底结算价，适用于境内+境外全部游客。',
  }),
  seed({
    id: 'ppt-glb-002',
    code: 'PPOL-GLB-002',
    name: '境内全域保底价',
    distributorGroup: 'B组',
    category: 'regular',
    policyType: 'non_ota',
    inventoryPoolId: 'pool-4',
    inventoryPoolName: '直销机动池',
    scopes: ['domestic'],
    domesticRegions: [],
    overseasRegions: [],
    otaChannels: [],
    retailEqualsSettlement: false,
    priority: 90,
    effectiveStart: '2026-01-01',
    effectiveEnd: '2026-12-31',
    status: 'enabled',
    remark: '仅面向境内属地游客的全域保底结算价。',
  }),
  seed({
    id: 'ppt-ota-001',
    code: 'PPOL-OTA-001',
    name: '美团/抖音OTA结算价',
    distributorGroup: 'A组',
    category: 'regular',
    policyType: 'ota',
    inventoryPoolId: 'pool-3',
    inventoryPoolName: 'OTA渠道池',
    scopes: [],
    domesticRegions: [],
    overseasRegions: [],
    otaChannels: ['美团', '抖音'],
    retailEqualsSettlement: true,
    priority: 30,
    effectiveStart: '2026-01-01',
    effectiveEnd: '2026-12-31',
    status: 'enabled',
    remark: '美团、抖音渠道统一OTA价；零售价与结算价相同。',
  }),
  seed({
    id: 'ppt-ota-002',
    code: 'PPOL-OTA-002',
    name: '携程OTA分设价',
    distributorGroup: 'B组',
    category: 'regular',
    policyType: 'ota',
    inventoryPoolId: 'pool-3',
    inventoryPoolName: 'OTA渠道池',
    scopes: [],
    domesticRegions: [],
    overseasRegions: [],
    otaChannels: ['携程'],
    retailEqualsSettlement: false,
    priority: 35,
    effectiveStart: '2026-01-01',
    effectiveEnd: '2026-12-31',
    status: 'enabled',
    remark: '携程渠道OTA价，零售价与结算价分设。',
  }),
]

let store: PricePolicyType[] = initialTypes.map((item) => ({
  ...item,
  domesticRegions: item.domesticRegions.map((r) => ({ ...r, path: [...r.path] })),
  overseasRegions: item.overseasRegions.map((r) => ({ ...r, path: [...r.path] })),
  otaChannels: [...item.otaChannels],
  scopes: [...item.scopes],
}))

export function listPricePolicyTypes() {
  return store.map((item) => ({
    ...item,
    domesticRegions: item.domesticRegions.map((r) => ({ ...r, path: [...r.path] })),
    overseasRegions: item.overseasRegions.map((r) => ({ ...r, path: [...r.path] })),
    otaChannels: [...item.otaChannels],
    scopes: [...item.scopes],
  }))
}

export function getPricePolicyTypeById(id: string) {
  return listPricePolicyTypes().find((item) => item.id === id)
}

export function getPricePolicyTypesByPoolId(poolId: string) {
  return listPricePolicyTypes().filter((item) => item.inventoryPoolId === poolId)
}

export function countPricePolicyTypesByPoolId(poolId: string) {
  return store.filter((item) => item.inventoryPoolId === poolId).length
}

/** 池的适用范围 = 已绑定价格政策的分销商分组 */
export function formatPoolTypeBoundSummary(poolId: string) {
  const types = getPricePolicyTypesByPoolId(poolId)
  if (types.length === 0) return '未关联价格政策'
  const groups = Array.from(new Set(types.map((item) => item.distributorGroup)))
  return `${types.length} 条政策 · ${groups.join('、')}`
}

export function upsertPricePolicyType(form: PricePolicyTypeForm, editingId?: string | null) {
  const now = new Date().toISOString()
  if (editingId) {
    store = store.map((item) => (
      item.id === editingId
        ? { ...item, ...form, updatedAt: now, updatedBy: '当前用户' }
        : item
    ))
    return getPricePolicyTypeById(editingId)!
  }
  const created: PricePolicyType = {
    ...form,
    id: generateId(),
    updatedBy: '当前用户',
    updatedAt: now,
    createdAt: now,
  }
  store = [created, ...store]
  return { ...created }
}

export function removePricePolicyType(id: string) {
  const before = store.length
  store = store.filter((item) => item.id !== id)
  return store.length < before
}
