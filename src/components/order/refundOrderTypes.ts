export type RefundOrderStatus = '待审核' | '已同意' | '已拒绝' | '已完成'

export type RefundType = '全额退款' | '部分退款' | '按退规扣费退款'

export interface RefundOrder {
  id: string
  refundNo: string
  orderId: string
  orderNo: string
  dealer: string
  voyageNo: string
  groupName: string
  orderTotalAmount: number
  paidAmount: number
  refundType: RefundType
  reason: string
  deductFee: number
  applyRefundAmount: number
  approvedRefundAmount: number
  refundChannel: string
  status: RefundOrderStatus
  applicant: string
  applyTime: string
  auditor?: string
  auditTime?: string
  auditRemark?: string
}

export interface CreateRefundOrderForm {
  orderId: string
  refundType: RefundType
  reason: string
  deductFee: number
  applyRefundAmount: number
  refundChannel?: string
}

export interface RefundOrderSourceSnapshot {
  orderNo: string
  dealer: string
  voyageNo: string
  groupName: string
  totalAmount: number
  paidAmount: number
}

export interface AuditRefundForm {
  refundId: string
  status: '已同意' | '已拒绝'
  approvedRefundAmount: number
  deductFee: number
  auditRemark: string
}
