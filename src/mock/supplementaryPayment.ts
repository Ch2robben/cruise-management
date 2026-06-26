import type {
  CreateSupplementaryPaymentForm,
  CruiseOrder,
  SupplementaryPaymentOrder,
} from '@/components/order/orderTypes'
import { generateId } from '@/utils/format'

let paymentSeq = 1
let supplementaryPayments: SupplementaryPaymentOrder[] = []

export function getSupplementaryPayments(): SupplementaryPaymentOrder[] {
  return supplementaryPayments
}

export function getSupplementaryPaymentsByOrderId(orderId: string): SupplementaryPaymentOrder[] {
  return supplementaryPayments.filter((item) => item.orderId === orderId)
}

function nextPaymentNo() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const seq = String(paymentSeq++).padStart(3, '0')
  return `BK${datePart}${seq}`
}

export function createSupplementaryPayment(
  order: CruiseOrder,
  form: CreateSupplementaryPaymentForm,
  createdBy = '当前用户',
): SupplementaryPaymentOrder {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const record: SupplementaryPaymentOrder = {
    id: generateId(),
    paymentNo: nextPaymentNo(),
    orderId: order.id,
    orderNo: order.orderNo,
    dealer: order.dealer,
    groupName: order.groupName,
    paymentType: form.paymentType,
    amount: form.amount,
    channel: form.channel,
    status: '待支付',
    dueDate: form.dueDate,
    remark: form.remark.trim(),
    notifyDealer: form.notifyDealer,
    createdBy,
    createdAt: now,
  }
  supplementaryPayments = [record, ...supplementaryPayments]
  return record
}

export function confirmSupplementaryPayment(
  paymentId: string,
  payload: { receipt: string; arrivalTime: string },
  confirmedBy = '当前用户',
): { payment: SupplementaryPaymentOrder; orderPatch: Pick<CruiseOrder, 'paidAmount' | 'arrears'> } | null {
  const payment = supplementaryPayments.find((item) => item.id === paymentId)
  if (!payment || payment.status !== '待支付') return null

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const txSeq = supplementaryPayments.filter((item) => item.orderId === payment.orderId && item.status === '已到账').length + 1
  payment.status = '已到账'
  payment.serialNo = `TX-${payment.orderNo}-SP${String(txSeq).padStart(2, '0')}`
  payment.receipt = payload.receipt.trim()
  payment.arrivalTime = payload.arrivalTime
  payment.confirmedBy = confirmedBy
  payment.confirmedAt = now

  return {
    payment,
    orderPatch: {
      paidAmount: payment.amount,
      arrears: -payment.amount,
    },
  }
}

export function cancelSupplementaryPayment(paymentId: string): SupplementaryPaymentOrder | null {
  const payment = supplementaryPayments.find((item) => item.id === paymentId)
  if (!payment || payment.status !== '待支付') return null
  payment.status = '已撤销'
  return payment
}

export function applyPaymentToOrder(order: CruiseOrder, amount: number): CruiseOrder {
  const paidAmount = order.paidAmount + amount
  const arrears = Math.max(order.totalAmount - paidAmount, 0)
  return { ...order, paidAmount, arrears }
}
