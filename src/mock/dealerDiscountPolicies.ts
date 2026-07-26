export type DealerDiscountPolicyStatus = '生效中' | '待生效' | '已失效'
export type DealerDiscountPolicyType = '专属结算价' | '团队优惠' | '限时促销' | '口岸优惠'

export interface DealerDiscountPolicy {
  id: string
  code: string
  name: string
  policyType: DealerDiscountPolicyType
  productName: string
  voyageScope: string
  ticketType: string
  roomTypes: string[]
  minPeople: number
  retailPrice: number
  settlementPrice: number
  discountLabel: string
  quotaUsed: number
  quotaTotal: number | null
  startDate: string
  endDate: string
  status: DealerDiscountPolicyStatus
  priority: number
  description: string
  usageRules: string[]
}

export const currentDealerProfile = {
  id: 'dealer-yc-lantian',
  name: '宜昌蓝天旅行社',
  groupName: '宜昌口岸合作组',
}

interface ScopedDealerPolicy extends DealerDiscountPolicy {
  dealerIds: string[]
}

const assignedPolicies: ScopedDealerPolicy[] = [
  {
    id: 'dp01',
    code: 'DLR-YC-SUMMER-2026',
    name: '暑期散客专享结算政策',
    policyType: '专属结算价',
    productName: '长江三峡5日游',
    voyageScope: '2026年7—8月宜昌出发航次',
    ticketType: '成人票',
    roomTypes: ['标准间', '行政房'],
    minPeople: 1,
    retailPrice: 3580,
    settlementPrice: 3180,
    discountLabel: '每人直减 ¥400',
    quotaUsed: 28,
    quotaTotal: 80,
    startDate: '2026-07-01',
    endDate: '2026-08-31',
    status: '生效中',
    priority: 20,
    description: '面向当前经销商的暑期散客专享结算价，下单时符合条件将自动命中。',
    usageRules: ['仅适用于宜昌出发的指定航次', '不与临时特价申请同时使用', '以提交订单时的政策快照为准'],
    dealerIds: ['dealer-yc-lantian'],
  },
  {
    id: 'dp02',
    code: 'DLR-YC-TEAM-15',
    name: '15人以上团队优惠',
    policyType: '团队优惠',
    productName: '黄金水道4日游',
    voyageScope: '全部可售航次',
    ticketType: '成人票',
    roomTypes: ['标准间'],
    minPeople: 15,
    retailPrice: 2980,
    settlementPrice: 2580,
    discountLabel: '满15人每人减 ¥400',
    quotaUsed: 3,
    quotaTotal: 12,
    startDate: '2026-06-15',
    endDate: '2026-09-30',
    status: '生效中',
    priority: 30,
    description: '用于团队订单的阶梯优惠，订单成人数达到15人时自动匹配。',
    usageRules: ['单笔订单成人数不少于15人', '儿童和婴儿不计入起订人数', '减免金额仅计入船票结算价'],
    dealerIds: ['dealer-yc-lantian'],
  },
  {
    id: 'dp03',
    code: 'PORT-YC-2026Q3',
    name: '宜昌口岸专享价',
    policyType: '口岸优惠',
    productName: '三峡精品4日游',
    voyageScope: '宜昌至重庆上水航次',
    ticketType: '成人票、儿童票',
    roomTypes: ['标准间', '豪华标间'],
    minPeople: 1,
    retailPrice: 3280,
    settlementPrice: 2880,
    discountLabel: '口岸专享价 ¥2,880',
    quotaUsed: 17,
    quotaTotal: 50,
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    status: '生效中',
    priority: 25,
    description: '根据当前经销商所属的宜昌口岸合作组自动授予。',
    usageRules: ['仅适用于宜昌口岸合作组成员', '仅适用于宜昌至重庆上水航次', '库存以下单时实时校验为准'],
    dealerIds: ['dealer-yc-lantian'],
  },
  {
    id: 'dp04',
    code: 'DLR-YC-NATIONAL-2026',
    name: '国庆早鸟优惠',
    policyType: '限时促销',
    productName: '长江三峡5日游',
    voyageScope: '2026年9月29日至10月8日航次',
    ticketType: '成人票',
    roomTypes: ['标准间', '行政房'],
    minPeople: 2,
    retailPrice: 3980,
    settlementPrice: 3480,
    discountLabel: '提前30天每人减 ¥500',
    quotaUsed: 0,
    quotaTotal: 30,
    startDate: '2026-08-01',
    endDate: '2026-09-10',
    status: '待生效',
    priority: 15,
    description: '国庆档期早鸟促销政策，在政策期内提前预订指定航次可享受。',
    usageRules: ['需在开航前30天完成下单', '每笔订单至少2名成人', '不与团队阶梯优惠叠加'],
    dealerIds: ['dealer-yc-lantian'],
  },
  {
    id: 'dp05',
    code: 'PROMO-618-YC',
    name: '618限时促销',
    policyType: '限时促销',
    productName: '长江三峡5日游',
    voyageScope: '2026年6月指定航次',
    ticketType: '成人票',
    roomTypes: ['标准间'],
    minPeople: 1,
    retailPrice: 3580,
    settlementPrice: 3080,
    discountLabel: '每人直减 ¥500',
    quotaUsed: 20,
    quotaTotal: 20,
    startDate: '2026-06-15',
    endDate: '2026-06-18',
    status: '已失效',
    priority: 40,
    description: '618活动期间的限时优惠，已结束，仅供查看历史订单政策快照。',
    usageRules: ['活动期内创建的订单保留原政策快照', '新订单不再匹配该政策'],
    dealerIds: ['dealer-yc-lantian'],
  },
  {
    id: 'private-other-dealer',
    code: 'DLR-CQ-PRIVATE',
    name: '重庆分销商专属政策',
    policyType: '专属结算价',
    productName: '长江三峡5日游',
    voyageScope: '重庆出发航次',
    ticketType: '成人票',
    roomTypes: ['标准间'],
    minPeople: 1,
    retailPrice: 3580,
    settlementPrice: 2990,
    discountLabel: '专属结算价',
    quotaUsed: 0,
    quotaTotal: null,
    startDate: '2026-07-01',
    endDate: '2026-12-31',
    status: '生效中',
    priority: 99,
    description: '其他经销商的私有政策。',
    usageRules: [],
    dealerIds: ['dealer-cq-private'],
  },
]

/**
 * 经销商端不接受 dealerId 查询参数，数据范围始终由当前登录身份决定。
 * 对接真实后端时，同样应由服务端从 token/session 解析经销商，不信任前端传入的 dealerId。
 */
export function getCurrentDealerDiscountPolicies(): DealerDiscountPolicy[] {
  return assignedPolicies
    .filter((policy) => policy.dealerIds.includes(currentDealerProfile.id))
    .map(({ dealerIds: _dealerIds, ...policy }) => policy)
}
