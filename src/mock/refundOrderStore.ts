import type {
  AuditRefundForm,
  CreateRefundOrderForm,
  RefundOrder,
  RefundOrderSourceSnapshot,
} from '@/components/order/refundOrderTypes'
import { getOrderById, updateOrder } from '@/mock/orderStore'

const initialRefundOrders: RefundOrder[] = [
  {
    id: 'rf-1',
    refundNo: 'RF20260725001',
    orderId: 'ord-3',
    orderNo: 'ORD20260720003',
    dealer: '湖北携程国际旅行社',
    voyageNo: 'V20260805-01',
    groupName: '宜昌-重庆 4天3晚 精英游览团',
    orderTotalAmount: 18600,
    paidAmount: 18600,
    refundType: '按退规扣费退款',
    reason: '游客行程变更，提前10天申请退房',
    deductFee: 1860,
    applyRefundAmount: 16740,
    approvedRefundAmount: 16740,
    refundChannel: '原路返回',
    status: '待审核',
    applicant: '李经理',
    applyTime: '2026-07-25 14:30:00',
  },
  {
    id: 'rf-2',
    refundNo: 'RF20260722002',
    orderId: 'ord-5',
    orderNo: 'ORD20260718005',
    dealer: '重庆国旅同程分部',
    voyageNo: 'V20260810-02',
    groupName: '重庆-宜昌 5天4晚 全景体验团',
    orderTotalAmount: 24500,
    paidAmount: 24500,
    refundType: '全额退款',
    reason: '因不可抗力天气预警航次停航',
    deductFee: 0,
    applyRefundAmount: 24500,
    approvedRefundAmount: 24500,
    refundChannel: '原路返回',
    status: '已完成',
    applicant: '张主管',
    applyTime: '2026-07-22 10:15:00',
    auditor: '系统管理员',
    auditTime: '2026-07-22 11:00:00',
    auditRemark: '停航全额退款核准通过',
  },
]

let refundOrders: RefundOrder[] = [...initialRefundOrders]

export function getRefundOrders(): RefundOrder[] {
  return refundOrders
}

export function getRefundOrderById(id: string): RefundOrder | undefined {
  return refundOrders.find((r) => r.id === id)
}

export function getRefundOrdersByOrderId(orderId: string): RefundOrder[] {
  return refundOrders.filter((r) => r.orderId === orderId)
}

export function createRefundOrder(
  form: CreateRefundOrderForm,
  applicant = '系统管理员',
  sourceOrder?: RefundOrderSourceSnapshot,
): RefundOrder {
  const targetOrder = getOrderById(form.orderId)
  const orderNo = sourceOrder?.orderNo || targetOrder?.orderNo || 'ORD-UNKNOWN'
  const dealer = sourceOrder?.dealer || targetOrder?.dealer || '分销商'
  const voyageNo = sourceOrder?.voyageNo || targetOrder?.voyageNo || '-'
  const groupName = sourceOrder?.groupName || targetOrder?.groupName || '-'
  const orderTotalAmount = sourceOrder?.totalAmount ?? targetOrder?.totalAmount ?? 0
  const paidAmount = sourceOrder?.paidAmount ?? targetOrder?.paidAmount ?? 0

  const count = refundOrders.length + 1
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const refundNo = `RF${todayStr}${String(count).padStart(3, '0')}`

  const now = new Date()
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

  const newRefundOrder: RefundOrder = {
    id: `rf-${Date.now()}`,
    refundNo,
    orderId: form.orderId,
    orderNo,
    dealer,
    voyageNo,
    groupName,
    orderTotalAmount,
    paidAmount,
    refundType: form.refundType,
    reason: form.reason,
    deductFee: form.deductFee,
    applyRefundAmount: form.applyRefundAmount,
    approvedRefundAmount: form.applyRefundAmount, // 默认与申请额一致，供审核时微调
    refundChannel: form.refundChannel || '原路返回',
    status: '待审核',
    applicant,
    applyTime: timeStr,
  }

  refundOrders = [newRefundOrder, ...refundOrders]

  // 更新对应主订单退款标记状态
  if (targetOrder) {
    updateOrder(targetOrder.id, {
      refundStatus: '退款处理中',
    })
  }

  return newRefundOrder
}

export function auditRefundOrder(form: AuditRefundForm, auditor = '系统管理员'): RefundOrder | undefined {
  let updated: RefundOrder | undefined

  const now = new Date()
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

  refundOrders = refundOrders.map((item) => {
    if (item.id !== form.refundId) return item

    const nextStatus = form.status === '已同意' ? '已完成' : '已拒绝'
    updated = {
      ...item,
      status: nextStatus,
      approvedRefundAmount: form.approvedRefundAmount,
      deductFee: form.deductFee,
      auditor,
      auditTime: timeStr,
      auditRemark: form.auditRemark,
    }
    return updated
  })

  if (updated) {
    const targetOrder = getOrderById(updated.orderId)
    if (targetOrder) {
      if (updated.status === '已完成') {
        const newPaidAmount = Math.max(0, targetOrder.paidAmount - updated.approvedRefundAmount)
        updateOrder(targetOrder.id, {
          orderStatus: newPaidAmount === 0 ? '取消' : targetOrder.orderStatus,
          refundStatus: '已退款',
          paidAmount: newPaidAmount,
          arrears: Math.max(0, targetOrder.totalAmount - newPaidAmount),
        })
      } else if (updated.status === '已拒绝') {
        updateOrder(targetOrder.id, {
          refundStatus: '退款被拒',
        })
      }
    }
  }

  return updated
}
