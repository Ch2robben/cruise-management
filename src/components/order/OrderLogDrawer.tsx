import DetailDrawer from '@/components/common/DetailDrawer'
import OrderHistoryPanel from '@/components/order/OrderHistoryPanel'
import type { CruiseOrder } from '@/components/order/orderTypes'

interface OrderLogDrawerProps {
  open: boolean
  order: CruiseOrder | null
  onClose: () => void
}

export default function OrderLogDrawer({ open, order, onClose }: OrderLogDrawerProps) {
  if (!order) return null

  return (
    <DetailDrawer
      open={open}
      title={`订单历史 · ${order.orderNo}`}
      width="w-[min(96vw,1440px)]"
      onClose={onClose}
    >
      <OrderHistoryPanel order={order} />
    </DetailDrawer>
  )
}
