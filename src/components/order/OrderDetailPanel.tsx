import { useMemo, useState, type ReactNode } from 'react'
import { formatCurrency } from '@/utils/format'
import {
  buildOrderResources,
  buildOrderRoomLines,
  buildOrderTeams,
  buildOrderTransactions,
  buildOrderVersions,
  enrichOrder,
  formatGroupNameSummary,
  summarizeRoomLines,
  type CruiseOrder,
  type OrderRoomLine,
  type OrderStatus,
  type OrderVersion,
} from './orderTypes'

/** 对应订单结构文档五类子单，Tab 名称面向业务人员 */
const DETAIL_TABS = [
  { id: 'basic', label: '基本信息' },
  { id: 'payment', label: '收付款记录' },
  { id: 'voyage', label: '航次舱位' },
  { id: 'traveler', label: '旅客信息' },
  { id: 'fee', label: '费用明细' },
] as const

type DetailTabId = (typeof DETAIL_TABS)[number]['id']

const statusColor: Record<OrderStatus, string> = {
  取消: 'bg-red-100 text-red-700',
  船款确认: 'bg-blue-100 text-blue-700',
  已预订: 'bg-green-100 text-green-700',
  已完成: 'bg-gray-100 text-gray-600',
}

function OrderStatusPill({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${statusColor[status]}`}>{status}</span>
}

function MetricItem({ label, value, highlight }: { label: string; value: ReactNode; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-gray-50 px-4 py-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${highlight ? 'text-blue-600' : 'text-gray-900'}`}>{value}</div>
    </div>
  )
}

function DetailSection({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`overflow-hidden rounded-lg border border-gray-200 bg-white ${className}`}>
      <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function FieldGrid({ children, columns = 2 }: { children: ReactNode; columns?: 2 | 3 }) {
  const columnClass = columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
  return <div className={`grid gap-x-8 gap-y-3 ${columnClass}`}>{children}</div>
}

function FieldItem({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="grid min-h-8 grid-cols-[108px_1fr] items-start gap-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`min-w-0 break-words text-gray-900 ${mono ? 'font-mono' : ''}`}>{value || '-'}</span>
    </div>
  )
}

function RoomLinesPriceTable({ order }: { order: CruiseOrder }) {
  const roomLines = buildOrderRoomLines(order)

  return (
    <div className="space-y-4">
      {roomLines.map((line) => {
        const lineSubtotal = line.guests.reduce((sum, guest) => sum + guest.settlementPrice, 0)
        return (
          <div key={line.id} className="overflow-hidden rounded-lg border border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm">
              <span className="font-medium text-gray-800">
                房间 {line.roomSeq} · {line.roomType} · {line.occupancyMode}
              </span>
              <span className="text-gray-500">{line.guests.length} 人 · 小计 {formatCurrency(lineSubtotal)}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-white">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">序位</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">姓名</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">年龄段</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">入住类型</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">价格系数</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">结算价</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {line.guests.map((guest) => (
                    <tr key={guest.id}>
                      <td className="px-4 py-3 text-gray-700">第{guest.slotIndex}人</td>
                      <td className="px-4 py-3 text-gray-700">{guest.name}</td>
                      <td className="px-4 py-3 text-gray-700">{guest.ageGroup}</td>
                      <td className="px-4 py-3 text-gray-700">{guest.occupancyType}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700">{guest.priceCoefficient}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">{formatCurrency(guest.settlementPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RoomGuestGroups({ lines }: { lines: OrderRoomLine[] }) {
  return (
    <div className="space-y-4">
      {lines.map((line) => (
        <div key={line.id} className="overflow-hidden rounded-lg border border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm">
            <span className="font-medium text-gray-800">
              房间 {line.roomSeq} · {line.roomType} · {line.occupancyMode}（{line.guests.length} 人）
            </span>
            <div className="flex min-w-0 max-w-xl items-start gap-2 text-sm">
              <span className="shrink-0 text-gray-500">备注</span>
              <span className="min-w-0 break-words text-gray-700">{line.remark || '-'}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['序位', '姓名', '年龄段', '入住类型', '证件类型', '证件号', '手机号', '是否转运'].map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {line.guests.map((guest) => (
                  <tr key={guest.id}>
                    <td className="px-4 py-3 text-gray-700">第{guest.slotIndex}人</td>
                    <td className="px-4 py-3 text-gray-700">{guest.name}</td>
                    <td className="px-4 py-3 text-gray-700">{guest.ageGroup}</td>
                    <td className="px-4 py-3 text-gray-700">{guest.occupancyType}</td>
                    <td className="px-4 py-3 text-gray-700">{guest.idType}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">{guest.idNumber}</td>
                    <td className="px-4 py-3 text-gray-700">{guest.phone}</td>
                    <td className="px-4 py-3 text-gray-700">{guest.transferRequired}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

function AmountTable({ order }: { order: CruiseOrder }) {
  const rows = [
    ['1', '定金', '-', 0, 0],
    ['2', '船票尾款', '-', 0, order.receivableTicket],
    ['3', '陪同款', '-', 0, 0],
    ['4', '船票总款', '-', 0, order.receivableTicket],
    ['5', '升舱费', '-', 0, 0],
    ['6', '地接费', '-', 0, order.localFee],
    ['7', '罚金', '-', 0, order.depositAmount],
    ['8', '小费', '-', order.tipUnitPrice ?? order.smallFee, order.smallFee],
    ['9', '组合产品', '-', 0, order.combinedProduct],
    ['10', '其他', '-', 0, 0],
    ['11', '结算总价', '-', 0, order.totalAmount],
  ]
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">序号</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">名称</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">系数</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">单价</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">总价</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row[0]}>
              <td className="px-4 py-3 text-gray-700">{row[0]}</td>
              <td className="px-4 py-3 text-gray-700">{row[1]}</td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-700">{row[2]}</td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-700">{formatCurrency(Number(row[3]))}</td>
              <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">{formatCurrency(Number(row[4]))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatVersionOption(version: OrderVersion) {
  const latestTag = version.isLatest ? '（当前）' : ''
  return `第${version.versionNo}版 · ${version.changeType} · ${version.snapshotAt}${latestTag}`
}

function GroupNameField({ order }: { order: CruiseOrder }) {
  const teams = useMemo(() => buildOrderTeams(order), [order])
  const summary = formatGroupNameSummary(teams)

  if (teams.length <= 1) {
    return <span>{summary}</span>
  }

  return (
    <div className="group relative inline-block max-w-full">
      <span className="cursor-default border-b border-dashed border-gray-400 text-gray-900">{summary}</span>
      <div className="invisible absolute left-0 top-full z-30 mt-1 min-w-[240px] rounded-lg border border-gray-200 bg-white p-3 opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100">
        <div className="mb-2 text-xs font-medium text-gray-500">团信息</div>
        <ul className="space-y-2.5">
          {teams.map((team) => (
            <li key={team.id} className="text-sm">
              <div className="font-medium text-gray-900">{team.name}</div>
              <div className="mt-0.5 text-xs text-gray-500">{team.roomCount} 间房 · {team.guestCount} 人</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function BasicTab({ order }: { order: CruiseOrder }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <DetailSection title="订单信息">
        <FieldGrid>
          <FieldItem label="订单号" value={order.orderNo} mono />
          <FieldItem label="订单金额" value={formatCurrency(order.totalAmount)} />
          <FieldItem label="订单创建时间" value={order.bookingTime} />
          <FieldItem label="订单状态" value={<OrderStatusPill status={order.orderStatus} />} />
          <FieldItem label="业务状态" value={order.businessStatus} />
          <FieldItem label="下单渠道" value={order.orderChannel} />
          <FieldItem label="下单人" value={order.advanceAccount} />
          <FieldItem label="订单类型" value={order.orderType} />
          <FieldItem label="团名" value={<GroupNameField order={order} />} />
          <FieldItem label="商品ID" value={order.productId} mono />
          <FieldItem label="总单号" value={order.parentOrderNo} mono />
          <FieldItem label="第三方订单号" value={order.thirdPartyOrderNo || '-'} mono />
          <FieldItem label="关联单号" value={order.relatedOrderNo || '-'} mono />
          <FieldItem label="分管业务员" value={order.salesPerson} />
        </FieldGrid>
      </DetailSection>

      <DetailSection title="组团社及政策">
        <FieldGrid>
          <FieldItem label="组团社" value={order.dealer} />
          <FieldItem label="组团社用户" value={order.advanceAccount} />
          <FieldItem label="价格政策" value={order.policyName} />
          <FieldItem label="市场类别" value={order.marketCategory} />
          <FieldItem label="国籍" value={order.nationality} />
          <FieldItem label="销售类型" value={order.salesType} />
        </FieldGrid>
      </DetailSection>

      <DetailSection title="凭证与共享状态">
        <FieldGrid>
          <FieldItem label="凭证申请" value={order.voucherApplyStatus} />
          <FieldItem label="凭证审批" value={order.voucherApprovalStatus} />
          <FieldItem label="共享中心" value={order.shareCenterStatus} />
          <FieldItem label="推送时间" value={order.pushTime || '-'} />
          <FieldItem label="是否开票" value={order.invoiceRequired} />
          <FieldItem label="预定账号" value={order.advanceAccount} />
        </FieldGrid>
      </DetailSection>

      <DetailSection title="联系人信息">
        <FieldGrid columns={3}>
          <FieldItem label="联系人" value={order.contactName} />
          <FieldItem label="手机号" value={order.contactPhone} />
          <FieldItem label="固定电话" value={order.fixedPhone || '-'} />
          <FieldItem label="传真" value={order.fax || '-'} />
          <FieldItem label="Email" value={order.email || '-'} />
          <FieldItem label="是否留言" value={order.leaveMessage} />
        </FieldGrid>
      </DetailSection>
    </div>
  )
}

function PaymentTab({ order }: { order: CruiseOrder }) {
  const transactions = buildOrderTransactions(order)
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricItem label="订单总额" value={formatCurrency(order.totalAmount)} highlight />
        <MetricItem label="实收总额" value={formatCurrency(order.paidAmount)} />
        <MetricItem label="欠款" value={formatCurrency(order.arrears)} />
        <MetricItem label="船款罚金" value={formatCurrency(order.ticketBalance)} />
      </div>

      <DetailSection title="收付款流水">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['订单流水号', '交易渠道', '交易类型', '交易金额', '交易时间', '交易状态', '交易回执', '到账时间'].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((row) => (
                <tr key={row.serialNo}>
                  <td className="px-4 py-3 font-mono text-gray-700">{row.serialNo}</td>
                  <td className="px-4 py-3 text-gray-700">{row.channel}</td>
                  <td className="px-4 py-3 text-gray-700">{row.type}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">{formatCurrency(row.amount)}</td>
                  <td className="px-4 py-3 text-gray-700">{row.time}</td>
                  <td className="px-4 py-3 text-gray-700">{row.status}</td>
                  <td className="px-4 py-3 font-mono text-gray-700">{row.receipt}</td>
                  <td className="px-4 py-3 text-gray-700">{row.arrivalTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DetailSection>

      <DetailSection title="定金与船款节点">
        <FieldGrid columns={3}>
          <FieldItem label="定金单价" value={`${order.depositUnitPrice ?? 0}元/床位`} />
          <FieldItem label="定金总额" value={formatCurrency(order.depositAmount)} />
          <FieldItem label="定金时效" value={order.depositDeadline} />
          <FieldItem label="定金日期" value={order.depositDate || '-'} />
          <FieldItem label="船款时限" value={order.sailDeadline} />
          <FieldItem label="锁铺有效期" value={order.lockValidUntil || '-'} />
        </FieldGrid>
      </DetailSection>
    </div>
  )
}

function VoyageTab({ order }: { order: CruiseOrder }) {
  const resources = buildOrderResources(order)
  const roomSummary = summarizeRoomLines(buildOrderRoomLines(order))
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricItem label="房间数" value={`${roomSummary.roomCount} 间`} />
        <MetricItem label="入住人数" value={`${roomSummary.totalPeople} 人`} />
        <MetricItem label="房型种类" value={new Set(buildOrderRoomLines(order).map((line) => line.roomType)).size} />
        <MetricItem label="舱房小计" value={formatCurrency(roomSummary.subtotal)} highlight />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <DetailSection title="游轮产品信息">
          <FieldGrid>
            <FieldItem label="游轮" value={order.ship} />
            <FieldItem label="航次号" value={order.voyageNo} mono />
            <FieldItem label="航线" value={order.line} />
            <FieldItem label="旅游天数" value={`${order.voyageDays} 天`} />
            <FieldItem label="出发日期" value={order.sailDate} />
            <FieldItem label="终到日期" value={order.arrivalDate} />
            <FieldItem label="开航时间" value={order.sailTime} />
            <FieldItem label="供应商" value={order.supplier} />
          </FieldGrid>
        </DetailSection>

        <DetailSection title="港口与行程">
          <FieldGrid>
            <FieldItem label="出发港" value={order.departurePort} />
            <FieldItem label="终到港" value={order.arrivalPort} />
            <FieldItem label="途经港" value={order.transitPort} />
            <FieldItem label="线路" value={order.route} />
            <FieldItem label="航次状态" value={order.voyageStatus} />
            <FieldItem label="船款日期" value={order.sailDeadline} />
          </FieldGrid>
        </DetailSection>
      </div>

      <DetailSection title="舱位与库存资源">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['资源类型', '资源名称', '资源ID', '资源状态'].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resources.map((row) => (
                <tr key={row.resourceId}>
                  <td className="px-4 py-3 text-gray-700">{row.resourceType}</td>
                  <td className="px-4 py-3 text-gray-700">{row.resourceName}</td>
                  <td className="px-4 py-3 font-mono text-gray-700">{row.resourceId}</td>
                  <td className="px-4 py-3 text-gray-700">{row.resourceStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <FieldGrid columns={3}>
            <FieldItem label="主房型" value={order.roomType} />
            <FieldItem label="房间数" value={`${roomSummary.roomCount} 间`} />
            <FieldItem label="锁铺有效期" value={order.lockValidUntil || '-'} />
          </FieldGrid>
        </div>
      </DetailSection>
    </div>
  )
}

function TravelerTab({ order }: { order: CruiseOrder }) {
  const roomLines = buildOrderRoomLines(order)
  const roomSummary = summarizeRoomLines(roomLines)
  return (
    <div className="space-y-5">
      <DetailSection title="人数信息">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-7">
          <MetricItem label="房间数" value={roomSummary.roomCount} />
          <MetricItem label="总人数" value={order.totalPeople} />
          <MetricItem label="成人" value={order.adult} />
          <MetricItem label="儿童" value={order.child} />
          <MetricItem label="婴儿" value={order.infant} />
          <MetricItem label="陪同" value={order.companion} />
          <MetricItem label="16免1数" value={order.freeOf16Count ?? 0} />
        </div>
      </DetailSection>

      <DetailSection title="预定人信息">
        <FieldGrid columns={3}>
          <FieldItem label="用户ID" value={order.bookerId} mono />
          <FieldItem label="用户名称" value={order.contactName} />
          <FieldItem label="证件类型" value={order.bookerIdType} />
          <FieldItem label="证件号码" value={order.bookerIdNumber} mono />
          <FieldItem label="联系类型" value="手机" />
          <FieldItem label="联系方式" value={order.contactPhone} />
        </FieldGrid>
      </DetailSection>

      <DetailSection title="出行人名单（按房间）">
        {roomLines.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">暂无入住人信息</p>
        ) : (
          <RoomGuestGroups lines={roomLines} />
        )}
      </DetailSection>

      <DetailSection title="特殊要求">
        <FieldItem label="备注" value={order.remark || '-'} />
      </DetailSection>
    </div>
  )
}

function FeeTab({ order }: { order: CruiseOrder }) {
  const roomSummary = summarizeRoomLines(buildOrderRoomLines(order))
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricItem label="房间数" value={`${roomSummary.roomCount} 间`} />
        <MetricItem label="应收船款" value={formatCurrency(order.receivableTicket)} highlight />
        <MetricItem label="小费单价" value={`${order.tipUnitPrice ?? 0}元/人`} />
        <MetricItem label="小费总额" value={formatCurrency(order.smallFee)} />
        <MetricItem label="地接费" value={formatCurrency(order.localFee)} />
        <MetricItem label="组合产品" value={formatCurrency(order.combinedProduct)} />
        <MetricItem label="金额类型" value={order.amountType} />
      </div>

      <DetailSection title="房型计价明细（按房间）">
        <RoomLinesPriceTable order={order} />
      </DetailSection>

      <DetailSection title="费用汇总">
        <AmountTable order={order} />
      </DetailSection>
    </div>
  )
}

export default function OrderDetailPanel({ order }: { order: CruiseOrder }) {
  const [activeTab, setActiveTab] = useState<DetailTabId>('basic')
  const versions = useMemo(() => buildOrderVersions(order), [order])
  const [selectedVersionId, setSelectedVersionId] = useState(() => versions[0]?.id ?? '')
  const selectedVersion = versions.find((v) => v.id === selectedVersionId) ?? versions[0]
  const displayOrder = enrichOrder(selectedVersion?.snapshot ?? order)

  return (
    <div className="border border-gray-200 bg-white px-9 py-6">
      <div className="mb-4 text-sm text-blue-600">订单管理 / 订单详情</div>

      <label className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-600">变更快照</span>
        <select
          value={selectedVersion?.id ?? ''}
          onChange={(event) => setSelectedVersionId(event.target.value)}
          className="h-10 min-w-[280px] max-w-2xl flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-500"
        >
          {versions.map((version) => (
            <option key={version.id} value={version.id}>
              {formatVersionOption(version)}
            </option>
          ))}
        </select>
        {selectedVersion && !selectedVersion.isLatest && (
          <span className="text-xs text-amber-600">正在查看历史版本</span>
        )}
      </label>

      <DetailSection title="订单概览" className="mb-5">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <MetricItem label="订单状态" value={<OrderStatusPill status={displayOrder.orderStatus} />} />
          <MetricItem label="订单总额" value={formatCurrency(displayOrder.totalAmount)} highlight />
          <MetricItem label="实收总额" value={formatCurrency(displayOrder.paidAmount)} />
          <MetricItem label="欠款" value={formatCurrency(displayOrder.arrears)} />
          <MetricItem label="总人数" value={`${displayOrder.totalPeople} 人`} />
        </div>
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="text-xs text-gray-500">备注</div>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-900">{displayOrder.remark || '暂无备注'}</p>
        </div>
      </DetailSection>

      <div className="mb-5 border-b border-gray-200">
        <div className="flex flex-wrap gap-1">
          {DETAIL_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'basic' && <BasicTab order={displayOrder} />}
      {activeTab === 'payment' && <PaymentTab order={displayOrder} />}
      {activeTab === 'voyage' && <VoyageTab order={displayOrder} />}
      {activeTab === 'traveler' && <TravelerTab order={displayOrder} />}
      {activeTab === 'fee' && <FeeTab order={displayOrder} />}
    </div>
  )
}
