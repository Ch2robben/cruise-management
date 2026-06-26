import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import GroupNameDisplay from '@/components/order/GroupNameDisplay'
import { enrichOrder, type CruiseOrder, type OrderVersion } from '@/components/order/orderTypes'
import { formatCurrency, formatDateTime } from '@/utils/format'

const statusColor: Record<CruiseOrder['orderStatus'], string> = {
  取消: 'bg-red-100 text-red-700',
  船款确认: 'bg-blue-100 text-blue-700',
  已预订: 'bg-green-100 text-green-700',
  已完成: 'bg-gray-100 text-gray-600',
}

interface OrderSnapshotDrawerProps {
  open: boolean
  version: OrderVersion | null
  onClose: () => void
}

export default function OrderSnapshotDrawer({ open, version, onClose }: OrderSnapshotDrawerProps) {
  if (!version) return null
  const order = enrichOrder(version.snapshot)

  return (
    <DetailDrawer open={open} title={`订单快照 · V${version.versionNo}`} width="w-[720px]" onClose={onClose}>
      <DetailCard title="版本信息">
        <DetailRow label="版本号" value={`V${version.versionNo}${version.isLatest ? '（当前）' : ''}`} />
        <DetailRow label="变更类型" value={version.changeType} />
        <DetailRow label="快照时间" value={formatDateTime(version.snapshotAt)} />
        <DetailRow label="操作人" value={version.operator} />
        <DetailRow label="变更摘要" value={version.changeSummary} />
      </DetailCard>
      <DetailCard title="订单概览">
        <DetailRow label="订单号" value={order.orderNo} mono />
        <DetailRow label="团名" value={<GroupNameDisplay order={order} compact />} />
        <DetailRow label="订单状态" value={<span className={`rounded px-2 py-0.5 text-xs ${statusColor[order.orderStatus]}`}>{order.orderStatus}</span>} />
        <DetailRow label="航次" value={order.voyageNo} />
        <DetailRow label="游轮" value={order.ship} />
        <DetailRow label="开航日期" value={order.sailDate} />
        <DetailRow label="人数" value={`${order.totalPeople}（成人 ${order.adult} / 儿童 ${order.child} / 婴儿 ${order.infant} / 陪同 ${order.companion}）`} />
      </DetailCard>
      <DetailCard title="费用快照">
        <DetailRow label="应收船票" value={formatCurrency(order.receivableTicket)} />
        <DetailRow label="应收小费" value={formatCurrency(order.smallFee)} />
        <DetailRow label="应收地接" value={formatCurrency(order.localFee)} />
        <DetailRow label="应收组合产品" value={formatCurrency(order.combinedProduct)} />
        <DetailRow label="结算总价" value={formatCurrency(order.totalAmount)} />
        <DetailRow label="实收总额" value={formatCurrency(order.paidAmount)} />
        <DetailRow label="欠款" value={formatCurrency(order.arrears)} />
      </DetailCard>
      <DetailCard title="组团信息">
        <DetailRow label="组团社" value={order.dealer} />
        <DetailRow label="市场类别" value={order.marketCategory} />
        <DetailRow label="政策类别" value={order.policyName || '-'} />
        <DetailRow label="分管业务员" value={order.salesPerson} />
        <DetailRow label="备注" value={order.remark || '-'} />
      </DetailCard>
    </DetailDrawer>
  )
}
