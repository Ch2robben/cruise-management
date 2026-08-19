/** 分销管理 · 价格政策 mock（含扣减库存池绑定，供政策页与库存池反查共用） */

export interface DistPricePolicy {
  id: string
  name: string
  productName: string
  ticketType: string
  policyType: string
  groupId: string
  groupName: string
  /** 关联价格政策；扣减库存池从政策同步 */
  pricePolicyTypeId: string
  /** 默认扣减库存池（与价格政策同步） */
  inventoryPoolId: string
  inventoryPoolName: string
  startDate: string
  endDate: string
  minOrder: number
  retailPrice: number
  settlementPrice: number
  priority: number
  status: '审批中' | '已发布' | '已下架'
}

const initialPricePolicies: DistPricePolicy[] = [
  {
    id: 'pp1',
    name: '国庆特惠政策',
    productName: '长江三峡5日游',
    ticketType: '成人票',
    policyType: '散客预定',
    groupId: 'g1',
    groupName: '重庆地区',
    pricePolicyTypeId: 'ppt-reg-001',
    inventoryPoolId: 'pool-1',
    inventoryPoolName: '同业共享池',
    startDate: '2026-09-29',
    endDate: '2026-10-08',
    minOrder: 0,
    retailPrice: 1580,
    settlementPrice: 1320,
    priority: 1,
    status: '已发布',
  },
  {
    id: 'pp2',
    name: '暑期团队政策',
    productName: '黄金水道4日游',
    ticketType: '成人票',
    policyType: '团队预定',
    groupId: 'g2',
    groupName: '湖北地区',
    pricePolicyTypeId: 'ppt-reg-003',
    inventoryPoolId: 'pool-2',
    inventoryPoolName: '大客户锁配额池',
    startDate: '2026-07-01',
    endDate: '2026-08-31',
    minOrder: 15,
    retailPrice: 1250,
    settlementPrice: 980,
    priority: 2,
    status: '审批中',
  },
  {
    id: 'pp3',
    name: '五一散客专享',
    productName: '长江三峡5日游',
    ticketType: '成人票',
    policyType: '散客预定',
    groupId: 'g3',
    groupName: 'OTA渠道',
    pricePolicyTypeId: 'ppt-ota-001',
    inventoryPoolId: 'pool-3',
    inventoryPoolName: 'OTA渠道池',
    startDate: '2026-04-30',
    endDate: '2026-05-05',
    minOrder: 0,
    retailPrice: 1620,
    settlementPrice: 1250,
    priority: 1,
    status: '已下架',
  },
]

let pricePoliciesStore: DistPricePolicy[] = initialPricePolicies.map((item) => ({ ...item }))

export function listDistPricePolicies() {
  return pricePoliciesStore.map((item) => ({ ...item }))
}

export function getDistPricePoliciesByPoolId(poolId: string) {
  return pricePoliciesStore.filter((item) => item.inventoryPoolId === poolId).map((item) => ({ ...item }))
}

/** 池的「适用范围」= 已绑定价格政策的分销商分组 */
export function formatPoolBoundSummary(poolId: string) {
  const policies = getDistPricePoliciesByPoolId(poolId)
  if (policies.length === 0) return '未关联价格政策'
  const groups = Array.from(new Set(policies.map((item) => item.groupName)))
  return `${policies.length} 条政策 · ${groups.join('、')}`
}

export function syncDistPoliciesPoolFromType(typeId: string, inventoryPoolId: string, inventoryPoolName: string) {
  pricePoliciesStore = pricePoliciesStore.map((item) => (
    item.pricePolicyTypeId === typeId
      ? { ...item, inventoryPoolId, inventoryPoolName }
      : item
  ))
}

export function upsertDistPricePolicy(policy: DistPricePolicy) {
  const idx = pricePoliciesStore.findIndex((item) => item.id === policy.id)
  if (idx === -1) {
    pricePoliciesStore = [policy, ...pricePoliciesStore]
  } else {
    pricePoliciesStore = pricePoliciesStore.map((item) => (item.id === policy.id ? policy : item))
  }
  return { ...policy }
}

export function patchDistPricePolicy(id: string, patch: Partial<DistPricePolicy>) {
  const current = pricePoliciesStore.find((item) => item.id === id)
  if (!current) return undefined
  const next = { ...current, ...patch }
  pricePoliciesStore = pricePoliciesStore.map((item) => (item.id === id ? next : item))
  return { ...next }
}

export function removeDistPricePolicy(id: string) {
  const before = pricePoliciesStore.length
  pricePoliciesStore = pricePoliciesStore.filter((item) => item.id !== id)
  return pricePoliciesStore.length < before
}

export function countDistPricePoliciesByPoolId(poolId: string) {
  return pricePoliciesStore.filter((item) => item.inventoryPoolId === poolId).length
}
