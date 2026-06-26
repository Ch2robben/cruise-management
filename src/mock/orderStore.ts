import type { CruiseOrder } from '@/components/order/orderTypes'
import { initialOrders } from '@/mock/orderListData'

let orders: CruiseOrder[] = initialOrders.map((order) => ({ ...order }))

export function getOrders(): CruiseOrder[] {
  return orders
}

export function getOrderById(orderId: string): CruiseOrder | undefined {
  return orders.find((order) => order.id === orderId)
}

export function updateOrder(orderId: string, patch: Partial<CruiseOrder>): CruiseOrder | undefined {
  let updated: CruiseOrder | undefined
  orders = orders.map((order) => {
    if (order.id !== orderId) return order
    updated = { ...order, ...patch }
    return updated
  })
  return updated
}

export function replaceOrders(next: CruiseOrder[]) {
  orders = next.map((order) => ({ ...order }))
}
