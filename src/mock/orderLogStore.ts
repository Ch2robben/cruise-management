import type { OrderLogEntry } from '@/components/order/orderTypes'
import { buildOrderVersions, enrichOrder, type CruiseOrder } from '@/components/order/orderTypes'
import { createLogSnapshot } from '@/components/order/orderLogUtils'
import { initialOrders } from '@/mock/orderListData'
import { generateId } from '@/utils/format'

const logs: OrderLogEntry[] = []

function buildSeedLogsForOrder(order: CruiseOrder): OrderLogEntry[] {
  const versions = buildOrderVersions(order)
  const versionByNo = new Map(versions.map((item) => [item.versionNo, item]))

  if (order.orderNo === '0000000H') {
    return [
      {
        id: generateId(),
        orderId: order.id,
        orderNo: order.orderNo,
        action: '补单',
        operator: 'penglin',
        operatedAt: '2021-10-08 16:51:32',
        content: '创建订单',
        snapshot: {
          totalPeople: 1,
          adult: 1,
          child: 0,
          infant: 0,
          companion: 0,
          receivableTicket: 2300,
          smallFee: 0,
          localFee: 0,
          combinedProduct: 0,
          totalAmount: 2300,
        },
        versionId: versionByNo.get(1)?.id,
      },
      {
        id: generateId(),
        orderId: order.id,
        orderNo: order.orderNo,
        action: '支付',
        operator: 'zhangying',
        operatedAt: '2021-10-08 16:52:10',
        content: '代理商余额支付，支付金额 ¥500.0',
        snapshot: {
          totalPeople: 1,
          adult: 1,
          child: 0,
          infant: 0,
          companion: 0,
          receivableTicket: 2300,
          smallFee: 0,
          localFee: 0,
          combinedProduct: 0,
          totalAmount: 2300,
        },
      },
      {
        id: generateId(),
        orderId: order.id,
        orderNo: order.orderNo,
        action: '补差',
        operator: 'penglin',
        operatedAt: '2021-10-08 16:53:05',
        content: '手工补差小费 ¥100.0',
        snapshot: {
          totalPeople: 1,
          adult: 1,
          child: 0,
          infant: 0,
          companion: 0,
          receivableTicket: 2300,
          smallFee: 100,
          localFee: 0,
          combinedProduct: 0,
          totalAmount: 2400,
        },
        versionId: versionByNo.get(3)?.id,
      },
      {
        id: generateId(),
        orderId: order.id,
        orderNo: order.orderNo,
        action: '补盖',
        operator: 'penglin',
        operatedAt: '2021-10-09 10:15:00',
        content: '订单备注：（空） → 客户要求靠窗床位，开航前需电话确认名单。',
        snapshot: createLogSnapshot(enrichOrder(order)),
        versionId: versionByNo.get(3)?.id,
      },
    ]
  }

  const latestVersion = versions.find((item) => item.isLatest) ?? versions[0]
  return [
    {
      id: generateId(),
      orderId: order.id,
      orderNo: order.orderNo,
      action: '补单',
      operator: order.advanceAccount || order.contactName,
      operatedAt: order.bookingTime,
      content: `创建订单，航次 ${order.voyageNo}，${order.totalPeople} 人，总额 ¥${order.totalAmount}`,
      snapshot: createLogSnapshot(enrichOrder(latestVersion?.snapshot ?? order)),
      versionId: versions[versions.length - 1]?.id,
    },
  ]
}

function seedInitialLogs() {
  initialOrders.forEach((order) => {
    buildSeedLogsForOrder(order).forEach((log) => logs.push(log))
  })
}

seedInitialLogs()

export function getOrderLogs(orderId: string): OrderLogEntry[] {
  return logs
    .filter((item) => item.orderId === orderId)
    .sort((a, b) => b.operatedAt.localeCompare(a.operatedAt))
}

export function appendOrderLog(entry: Omit<OrderLogEntry, 'id'>): OrderLogEntry {
  const log: OrderLogEntry = { ...entry, id: generateId() }
  logs.push(log)
  return log
}

export function nowLogTime() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}
