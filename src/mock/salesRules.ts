export interface SalesDepositRule {
  id: string
  name: string
  calculationType: 'fixed' | 'percent'
  dimension: '按人' | '按房' | '按订单'
  amount: number
  paymentTrigger: string
  deadlineText: string
  overdueAction: string
  offsetPayment: boolean
  scopeText: string
  status: 'enabled' | 'disabled'
}

export interface SalesPaymentRule {
  id: string
  name: string
  collectionStartDays: number
  deadlineDays: number
  deductDeposit: boolean
  lateBookingPolicyText: string
  overdueActionText: string
  feeScopeText: string
  status: 'enabled' | 'disabled'
}

export const availableDepositRules: SalesDepositRule[] = [
  {
    id: 'dep_default',
    name: '默认定金规则',
    calculationType: 'fixed',
    dimension: '按人',
    amount: 300,
    paymentTrigger: '库存锁定后',
    deadlineText: '预定后 24 小时内',
    overdueAction: '取消订单并释放库存',
    offsetPayment: true,
    scopeText: '全部房型通用',
    status: 'enabled',
  },
  {
    id: 'dep_special_wushan',
    name: '内宾巫山特殊房型定金',
    calculationType: 'fixed',
    dimension: '按人',
    amount: 500,
    paymentTrigger: '库存锁定后',
    deadlineText: '下单后 12 小时内',
    overdueAction: '取消订单并释放库存',
    offsetPayment: true,
    scopeText: '套房、阳台房适用',
    status: 'enabled',
  },
  {
    id: 'dep_foreign_luxury',
    name: '外宾高端定制游轮定金规则',
    calculationType: 'percent',
    dimension: '按订单',
    amount: 30,
    paymentTrigger: '合同确认后',
    deadlineText: '确认后 48 小时内',
    overdueAction: '转人工审核',
    offsetPayment: true,
    scopeText: '行政套房、总统套房专用',
    status: 'enabled',
  },
  {
    id: 'dep_low_season',
    name: '淡季促销低门槛定金规则',
    calculationType: 'fixed',
    dimension: '按人',
    amount: 100,
    paymentTrigger: '订单确认后',
    deadlineText: '下单后 48 小时内',
    overdueAction: '保留订单并提醒',
    offsetPayment: true,
    scopeText: '特惠航段与特惠房型适用',
    status: 'enabled',
  },
]

export const availablePaymentRules: SalesPaymentRule[] = [
  {
    id: 'pay_default',
    name: '默认船款规则',
    collectionStartDays: 30,
    deadlineDays: 7,
    deductDeposit: true,
    lateBookingPolicyText: '下单后 2 小时内付清',
    overdueActionText: '进入罚金处理',
    feeScopeText: '仅船票金额',
    status: 'enabled',
  },
  {
    id: 'pay_summer_peak',
    name: '暑期旺季全款提前付清规则',
    collectionStartDays: 45,
    deadlineDays: 15,
    deductDeposit: true,
    lateBookingPolicyText: '立即支付全款',
    overdueActionText: '取消订单并释放库存',
    feeScopeText: '订单总额（含附加产品）',
    status: 'enabled',
  },
  {
    id: 'pay_c_direct',
    name: '直销散客即时付清规则 (2C专用)',
    collectionStartDays: 0,
    deadlineDays: 0,
    deductDeposit: false,
    lateBookingPolicyText: '下单后 30 分钟内付清全款',
    overdueActionText: '超时自动取消订单并释放库存',
    feeScopeText: '订单总额',
    status: 'enabled',
  },
  {
    id: 'pay_b2b_credit',
    name: '同业分销账期结算规则 (2B专用)',
    collectionStartDays: 20,
    deadlineDays: 3,
    deductDeposit: true,
    lateBookingPolicyText: '授信代扣或临航人工复核',
    overdueActionText: '转人工计调审核催缴',
    feeScopeText: '仅船票金额',
    status: 'enabled',
  },
]
