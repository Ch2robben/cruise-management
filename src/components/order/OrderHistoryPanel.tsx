import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import OrderSnapshotDrawer from '@/components/order/OrderSnapshotDrawer'
import {
  buildOrderTransactions,
  buildOrderVersions,
  enrichOrder,
  type CruiseOrder,
  type OrderLogEntry,
  type OrderVersion,
} from '@/components/order/orderTypes'
import { getOrderLogs } from '@/mock/orderLogStore'
import { formatCurrency, formatDateTime } from '@/utils/format'

type HistoryTab = 'operation' | 'payment'

function CollapseSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2 border-b border-gray-200 bg-gray-50 px-5 py-3 text-left"
      >
        {open ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
        <span className="text-sm font-semibold text-gray-800">{title}</span>
      </button>
      {open && <div className="p-5">{children}</div>}
    </section>
  )
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 lg:grid-cols-2">{children}</div>
}

function FieldItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[108px_1fr] gap-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="min-w-0 break-words text-gray-900">{value || '-'}</span>
    </div>
  )
}

function OperationHistoryTable({
  logs,
  versions,
  onViewSnapshot,
}: {
  logs: OrderLogEntry[]
  versions: OrderVersion[]
  onViewSnapshot: (version: OrderVersion | null, log: OrderLogEntry) => void
}) {
  if (logs.length === 0) {
    return <div className="py-10 text-center text-sm text-gray-400">暂无操作记录</div>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-[1480px] w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 text-xs font-medium text-gray-500">
            <th className="border-b border-r border-gray-200 px-3 py-3 text-center">序号</th>
            <th className="border-b border-r border-gray-200 px-3 py-3 text-left whitespace-nowrap">操作时间</th>
            <th className="border-b border-r border-gray-200 px-3 py-3 text-left">操作类型</th>
            <th className="border-b border-r border-gray-200 px-3 py-3 text-left min-w-[220px]">内容</th>
            <th className="border-b border-r border-gray-200 px-3 py-3 text-left">操作人</th>
            <th className="border-b border-r border-gray-200 px-3 py-3 text-right">人数</th>
            <th className="border-b border-r border-gray-200 px-3 py-3 text-right">成人</th>
            <th className="border-b border-r border-gray-200 px-3 py-3 text-right">儿童</th>
            <th className="border-b border-r border-gray-200 px-3 py-3 text-right">婴儿</th>
            <th className="border-b border-r border-gray-200 px-3 py-3 text-right">陪同数</th>
            <th className="border-b border-r border-gray-200 px-3 py-3 text-right">应收船票</th>
            <th className="border-b border-r border-gray-200 px-3 py-3 text-right">应收小费</th>
            <th className="border-b border-r border-gray-200 px-3 py-3 text-right">应收地接</th>
            <th className="border-b border-r border-gray-200 px-3 py-3 text-right">应收组合产品</th>
            <th className="border-b border-r border-gray-200 px-3 py-3 text-right">结算总价</th>
            <th className="border-b border-gray-200 px-3 py-3 text-center">订单快照</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => {
            const version = log.versionId ? versions.find((item) => item.id === log.versionId) ?? null : null
            return (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="border-b border-r border-gray-200 px-3 py-3 text-center text-gray-600">{index + 1}</td>
                <td className="border-b border-r border-gray-200 px-3 py-3 whitespace-nowrap text-gray-700">{formatDateTime(log.operatedAt)}</td>
                <td className="border-b border-r border-gray-200 px-3 py-3 text-gray-700">{log.action}</td>
                <td className="border-b border-r border-gray-200 px-3 py-3 text-gray-700">{log.content}</td>
                <td className="border-b border-r border-gray-200 px-3 py-3 text-gray-700">{log.operator}</td>
                <td className="border-b border-r border-gray-200 px-3 py-3 text-right tabular-nums">{log.snapshot.totalPeople}</td>
                <td className="border-b border-r border-gray-200 px-3 py-3 text-right tabular-nums">{log.snapshot.adult}</td>
                <td className="border-b border-r border-gray-200 px-3 py-3 text-right tabular-nums">{log.snapshot.child}</td>
                <td className="border-b border-r border-gray-200 px-3 py-3 text-right tabular-nums">{log.snapshot.infant}</td>
                <td className="border-b border-r border-gray-200 px-3 py-3 text-right tabular-nums">{log.snapshot.companion}</td>
                <td className="border-b border-r border-gray-200 px-3 py-3 text-right tabular-nums">{formatCurrency(log.snapshot.receivableTicket)}</td>
                <td className="border-b border-r border-gray-200 px-3 py-3 text-right tabular-nums">{formatCurrency(log.snapshot.smallFee)}</td>
                <td className="border-b border-r border-gray-200 px-3 py-3 text-right tabular-nums">{formatCurrency(log.snapshot.localFee)}</td>
                <td className="border-b border-r border-gray-200 px-3 py-3 text-right tabular-nums">{formatCurrency(log.snapshot.combinedProduct)}</td>
                <td className="border-b border-r border-gray-200 px-3 py-3 text-right tabular-nums">{formatCurrency(log.snapshot.totalAmount)}</td>
                <td className="border-b border-gray-200 px-3 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => onViewSnapshot(version, log)}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    查看
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function PaymentHistoryTable({ order }: { order: CruiseOrder }) {
  const transactions = buildOrderTransactions(order)

  if (transactions.length === 0) {
    return <div className="py-10 text-center text-sm text-gray-400">暂无支付记录</div>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-[960px] w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 text-xs font-medium text-gray-500">
            <th className="border-b border-r border-gray-200 px-3 py-3 text-center">序号</th>
            <th className="border-b border-r border-gray-200 px-3 py-3 text-left">支付时间</th>
            <th className="border-b border-r border-gray-200 px-3 py-3 text-left">支付类型</th>
            <th className="border-b border-r border-gray-200 px-3 py-3 text-right">金额</th>
            <th className="border-b border-r border-gray-200 px-3 py-3 text-left">渠道</th>
            <th className="border-b border-r border-gray-200 px-3 py-3 text-left">状态</th>
            <th className="border-b border-r border-gray-200 px-3 py-3 text-left">回执号</th>
            <th className="border-b border-gray-200 px-3 py-3 text-left">到账时间</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((item, index) => (
            <tr key={item.serialNo} className="hover:bg-gray-50">
              <td className="border-b border-r border-gray-200 px-3 py-3 text-center text-gray-600">{index + 1}</td>
              <td className="border-b border-r border-gray-200 px-3 py-3 whitespace-nowrap">{item.time}</td>
              <td className="border-b border-r border-gray-200 px-3 py-3">{item.type}</td>
              <td className="border-b border-r border-gray-200 px-3 py-3 text-right tabular-nums">{formatCurrency(item.amount)}</td>
              <td className="border-b border-r border-gray-200 px-3 py-3">{item.channel}</td>
              <td className="border-b border-r border-gray-200 px-3 py-3">{item.status}</td>
              <td className="border-b border-r border-gray-200 px-3 py-3 font-mono text-xs">{item.receipt}</td>
              <td className="border-b border-gray-200 px-3 py-3 whitespace-nowrap">{item.arrivalTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function OrderHistoryPanel({ order }: { order: CruiseOrder }) {
  const [activeTab, setActiveTab] = useState<HistoryTab>('operation')
  const [snapshotVersion, setSnapshotVersion] = useState<OrderVersion | null>(null)
  const displayOrder = enrichOrder(order)
  const logs = useMemo(() => getOrderLogs(order.id), [order.id])
  const versions = useMemo(() => buildOrderVersions(order), [order])

  const handleViewSnapshot = (version: OrderVersion | null, log: OrderLogEntry) => {
    if (version) {
      setSnapshotVersion(version)
      return
    }
    const fallback = versions.find((item) => item.snapshotAt === log.operatedAt) ?? versions[0] ?? null
    setSnapshotVersion(fallback)
  }

  return (
    <div className="space-y-5">
      <div className="border border-gray-200 bg-white px-6 py-4">
        <div className="mb-4 flex flex-wrap items-center gap-6 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('operation')}
            className={`border-b-2 px-1 pb-3 text-sm transition ${
              activeTab === 'operation' ? 'border-blue-600 font-medium text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            操作历史
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payment')}
            className={`border-b-2 px-1 pb-3 text-sm transition ${
              activeTab === 'payment' ? 'border-blue-600 font-medium text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            支付记录
          </button>
        </div>

        {activeTab === 'operation' ? (
          <OperationHistoryTable logs={logs} versions={versions} onViewSnapshot={handleViewSnapshot} />
        ) : (
          <PaymentHistoryTable order={displayOrder} />
        )}
      </div>

      <CollapseSection title="订单详情">
        <FieldGrid>
          <FieldItem label="订单号" value={displayOrder.orderNo} />
          <FieldItem label="预订时间" value={displayOrder.bookingTime} />
          <FieldItem label="订单状态" value={displayOrder.orderStatus} />
          <FieldItem label="定金期限" value={displayOrder.depositDate || displayOrder.lockValidUntil || '-'} />
          <FieldItem label="结算总价" value={formatCurrency(displayOrder.totalAmount)} />
          <FieldItem label="实收总额" value={formatCurrency(displayOrder.paidAmount)} />
        </FieldGrid>
      </CollapseSection>

      <CollapseSection title="游轮产品信息">
        <FieldGrid>
          <FieldItem label="线路" value={displayOrder.route} />
          <FieldItem label="游轮" value={displayOrder.ship} />
          <FieldItem label="航次号" value={displayOrder.voyageNo} />
          <FieldItem label="开航日期" value={displayOrder.sailDate} />
          <FieldItem label="出发港" value={displayOrder.departurePort} />
          <FieldItem label="到达港" value={displayOrder.arrivalPort} />
        </FieldGrid>
      </CollapseSection>

      <CollapseSection title="组团及政策">
        <FieldGrid>
          <FieldItem label="组团社" value={displayOrder.dealer} />
          <FieldItem label="价格政策" value={displayOrder.policyName} />
          <FieldItem label="市场类别" value={displayOrder.marketCategory} />
          <FieldItem label="国籍" value={displayOrder.nationality} />
        </FieldGrid>
      </CollapseSection>

      <CollapseSection title="订单部门信息" defaultOpen={false}>
        <FieldGrid>
          <FieldItem label="分管业务员" value={displayOrder.salesPerson} />
          <FieldItem label="预定账号" value={displayOrder.advanceAccount} />
          <FieldItem label="共享中心状态" value={displayOrder.shareCenterStatus} />
          <FieldItem label="凭证审批状态" value={displayOrder.voucherApprovalStatus} />
        </FieldGrid>
      </CollapseSection>

      <OrderSnapshotDrawer
        open={!!snapshotVersion}
        version={snapshotVersion}
        onClose={() => setSnapshotVersion(null)}
      />
    </div>
  )
}
