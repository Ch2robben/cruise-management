import type { OrderEditForm } from '@/components/order/OrderEditDialog'
import type { OrderPriceChangeForm } from '@/components/order/OrderPriceChangeDialog'
import { buildOrderFeeItems, type CruiseOrder, type OrderLogAction, type OrderLogEntry, type OrderLogSnapshot } from '@/components/order/orderTypes'
import { formatCurrency } from '@/utils/format'

export const ORDER_LOG_OPERATOR = '当前用户'

export function createLogSnapshot(order: CruiseOrder): OrderLogSnapshot {
  return {
    totalPeople: order.totalPeople,
    adult: order.adult,
    child: order.child,
    infant: order.infant,
    companion: order.companion,
    receivableTicket: order.receivableTicket,
    smallFee: order.smallFee,
    localFee: order.localFee,
    combinedProduct: order.combinedProduct,
    totalAmount: order.totalAmount,
  }
}

export function normalizeLogAction(action: string): OrderLogAction {
  const map: Record<string, OrderLogAction> = {
    创建: '补单',
    编辑订单: '编辑',
    改价: '补差',
    生成补款单: '补差',
    确认到账: '支付',
    撤销补款单: '其他',
  }
  if (map[action]) return map[action]
  if (['补单', '支付', '补差', '补盖', '编辑', '其他'].includes(action)) {
    return action as OrderLogAction
  }
  return '其他'
}

export function appendOrderLogFromOrder(
  order: CruiseOrder,
  entry: {
    action: string
    operator: string
    operatedAt: string
    content?: string
    changes?: string[]
    snapshot?: OrderLogSnapshot
    versionId?: string
    remark?: string
  },
): Omit<OrderLogEntry, 'id'> {
  return {
    orderId: order.id,
    orderNo: order.orderNo,
    action: normalizeLogAction(entry.action),
    operator: entry.operator,
    operatedAt: entry.operatedAt,
    content: entry.content ?? entry.changes?.join('；') ?? '',
    snapshot: entry.snapshot ?? createLogSnapshot(order),
    versionId: entry.versionId,
    remark: entry.remark,
  }
}

export const ORDER_EDIT_FIELD_LABELS: Record<keyof OrderEditForm, string> = {
  groupName: '团名',
  contactName: '联系人',
  contactPhone: '手机号',
  fixedPhone: '固定电话',
  fax: '传真',
  email: 'Email',
  thirdPartyOrderNo: '第三方订单号',
  relatedOrderNo: '关联单号',
  invoiceRequired: '是否开票',
  salesPerson: '分管业务员',
  remark: '订单备注',
}

function displayValue(value: unknown) {
  if (value === '' || value == null) return '（空）'
  return String(value)
}

export function diffEditFormChanges(before: OrderEditForm, after: OrderEditForm) {
  const changes: string[] = []
  ;(Object.keys(ORDER_EDIT_FIELD_LABELS) as Array<keyof OrderEditForm>).forEach((key) => {
    const prev = before[key] ?? ''
    const next = after[key] ?? ''
    if (prev !== next) {
      changes.push(`${ORDER_EDIT_FIELD_LABELS[key]}：${displayValue(prev)} → ${displayValue(next)}`)
    }
  })
  return changes
}

export function buildPriceChangeLogs(before: CruiseOrder, form: OrderPriceChangeForm) {
  const changes: string[] = []
  const beforeFees = buildOrderFeeItems(before)
  const feeAmount = (items: typeof form.feeItems, name: string) => (
    items.find((item) => item.name === name)?.amount ?? 0
  )

  const pushMoney = (label: string, prev: number, next: number) => {
    if (prev !== next) changes.push(`${label}：${formatCurrency(prev)} → ${formatCurrency(next)}`)
  }

  pushMoney('单价', before.unitPrice, form.unitPrice)
  pushMoney('应收船款', before.receivableTicket, feeAmount(form.feeItems, '应收船款'))
  pushMoney('小费', before.smallFee, feeAmount(form.feeItems, '小费'))
  pushMoney('地接费', before.localFee, feeAmount(form.feeItems, '地接费'))
  pushMoney('组合产品', before.combinedProduct, feeAmount(form.feeItems, '组合产品'))
  pushMoney('订单总额', before.totalAmount, form.totalAmount)

  const arrearsBefore = Math.max(before.totalAmount - before.paidAmount, 0)
  const arrearsAfter = Math.max(form.totalAmount - before.paidAmount, 0)
  pushMoney('欠款', arrearsBefore, arrearsAfter)

  const beforeFeeMap = new Map(beforeFees.map((item) => [item.name, item.amount]))
  form.feeItems.forEach((item) => {
    if (['应收船款', '小费', '地接费', '组合产品'].includes(item.name)) return
    const prev = beforeFeeMap.get(item.name)
    if (prev == null) {
      changes.push(`新增费用项「${item.name}」：${formatCurrency(item.amount)}`)
    } else if (prev !== item.amount) {
      changes.push(`费用项「${item.name}」：${formatCurrency(prev)} → ${formatCurrency(item.amount)}`)
    }
  })

  if (form.reason.trim()) {
    changes.push(`改价原因：${form.reason.trim()}`)
  }

  return changes
}
