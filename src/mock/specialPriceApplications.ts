export type SpecialPriceApplicationStatus = '待审批' | '已通过' | '已驳回'

export interface SpecialPriceApplicationRecord {
  id: string
  applicationNo: string
  relatedOrderNo?: string
  groupName: string
  dealerName: string
  voyageNo: string
  route: string
  sailDate: string
  shipName: string
  applyScope: '整单特价' | '房型特价' | '游客特价'
  contactName: string
  contactPhone: string
  currentAmount: number
  requestedAmount: number
  discountAmount: number
  passengerCount: number
  roomCount: number
  reason: string
  remark?: string
  status: SpecialPriceApplicationStatus
  createdAt: string
  submittedAt: string
  reviewedAt?: string
  reviewer?: string
  reviewComment?: string
}

export const specialPriceApplications: SpecialPriceApplicationRecord[] = [
  {
    id: 'spa-001',
    applicationNo: 'SP20260625001',
    relatedOrderNo: '',
    groupName: '华东踩线团 6月首航',
    dealerName: '上海同行中心',
    voyageNo: 'VC260701',
    route: '重庆-宜昌 4天3晚',
    sailDate: '2026-07-01',
    shipName: '长江探索号',
    applyScope: '整单特价',
    contactName: '王敏',
    contactPhone: '13800006601',
    currentAmount: 46800,
    requestedAmount: 42800,
    discountAmount: 4000,
    passengerCount: 18,
    roomCount: 9,
    reason: '竞品同期报价更低，客户为后续系列团采购方，需首单让利锁定合作。',
    remark: '承诺 8 月追加 2 条包团线索，需保留行政楼层房源。',
    status: '待审批',
    createdAt: '2026-06-25 16:58',
    submittedAt: '2026-06-25 17:08',
  },
  {
    id: 'spa-002',
    applicationNo: 'SP20260623003',
    relatedOrderNo: 'CZ20260623018',
    groupName: '日韩媒体采风团',
    dealerName: '华游国际',
    voyageNo: 'VC260710',
    route: '宜昌-重庆 5天4晚',
    sailDate: '2026-07-10',
    shipName: '长江贰号',
    applyScope: '游客特价',
    contactName: '陈璐',
    contactPhone: '13800006602',
    currentAmount: 52200,
    requestedAmount: 49800,
    discountAmount: 2400,
    passengerCount: 12,
    roomCount: 6,
    reason: '外宾媒体团需统一包装价格，避免与公开价倒挂。',
    remark: '仅针对 2 间行政房和 4 间标准间生效。',
    status: '已通过',
    createdAt: '2026-06-23 10:16',
    submittedAt: '2026-06-23 10:28',
    reviewedAt: '2026-06-23 14:35',
    reviewer: '运营经理-周岚',
    reviewComment: '同意按媒体合作价执行，需同步备案合同。',
  },
  {
    id: 'spa-003',
    applicationNo: 'SP20260622002',
    relatedOrderNo: '',
    groupName: '川渝同业联盟培训团',
    dealerName: '重庆神州',
    voyageNo: 'VC260718',
    route: '重庆-万州 3天2晚',
    sailDate: '2026-07-18',
    shipName: '长江叁号',
    applyScope: '房型特价',
    contactName: '李卓',
    contactPhone: '13800006603',
    currentAmount: 31600,
    requestedAmount: 27600,
    discountAmount: 4000,
    passengerCount: 20,
    roomCount: 10,
    reason: '培训团预算较低，申请下调标准间价格以保团。',
    remark: '客户要求含一次欢迎茶歇。',
    status: '已驳回',
    createdAt: '2026-06-22 09:12',
    submittedAt: '2026-06-22 09:30',
    reviewedAt: '2026-06-22 11:10',
    reviewer: '收益平台主管-张锐',
    reviewComment: '该航次周末库存紧张，不建议额外放价。',
  },
]
