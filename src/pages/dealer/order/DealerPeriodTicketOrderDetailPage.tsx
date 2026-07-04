import { Navigate, useNavigate, useParams } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import {
  getPeriodTicketOrder,
  reservationStatusLabelMap,
  ticketStatusLabelMap,
} from '@/mock/periodTicketOrders'
import { formatCurrency } from '@/utils/format'

export default function DealerPeriodTicketOrderDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const detail = id ? getPeriodTicketOrder(id) : undefined

  if (!detail) {
    return <Navigate to="/dealer/orders/period" replace />
  }

  return (
    <div className="space-y-5 p-6 pb-20">
      <PageHeader title="期票订单详情" description="查看期票订单基础信息、可兑换产品、短信链接与处理记录。">
        <div className="flex flex-wrap gap-3">
          {(detail.ticketStatus === 'unused' || detail.ticketStatus === 'partial') && (
            <>
              <button
                className="h-10 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm text-blue-700"
                onClick={() => navigate(`/dealer/orders/period/redeem?orderId=${detail.id}&mode=direct`)}
              >
                直接兑换
              </button>
              <button
                className="h-10 rounded-lg bg-blue-600 px-4 text-sm text-white"
                onClick={() => navigate(`/dealer/orders/period/redeem?orderId=${detail.id}&mode=upgrade`)}
              >
                升单兑换
              </button>
            </>
          )}
          <button className="h-10 rounded-lg border border-gray-300 px-4 text-sm text-gray-700" onClick={() => navigate('/dealer/orders/period')}>
            返回列表
          </button>
        </div>
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="text-lg font-semibold text-gray-900">{detail.periodOrderNo}</div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                {reservationStatusLabelMap[detail.reservationStatus]}
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                {ticketStatusLabelMap[detail.ticketStatus]}
              </span>
            </div>

            <DetailCard title="订单信息">
              <DetailRow label="期票订单号" value={detail.periodOrderNo} mono />
              <DetailRow label="OTA订单号" value={detail.otaOrderNo} mono />
              <DetailRow label="订单金额" value={formatCurrency(detail.amount)} />
              <DetailRow label="下单时间" value={detail.orderTime} />
              <DetailRow label="销售渠道" value={`${detail.salesChannel} / ${detail.otaChannel}`} />
              <DetailRow label="预约产品" value={detail.reservedProduct} />
            </DetailCard>

            <DetailCard title="取票与旅客信息">
              <DetailRow label="取票人" value={`${detail.pickupName} / ${detail.pickupMobile}`} />
              <DetailRow label="旅客姓名" value={detail.passengerName} />
              <DetailRow label="联系人手机" value={detail.contactMobile} />
              <DetailRow label="证件信息" value={`${detail.certificateType} / ${detail.certificateNo}`} />
            </DetailCard>

            <DetailCard title="可兑换产品">
              <DetailRow label="可兑产品" value={detail.redeemableProduct.productName} />
              <DetailRow label="航线" value={detail.redeemableProduct.routeName} />
              <DetailRow label="游轮" value={detail.redeemableProduct.cruiseName} />
              <DetailRow label="房型" value={detail.redeemableProduct.roomType} />
              <DetailRow label="入住类型" value={detail.redeemableProduct.occupancyType} />
              <DetailRow label="兑换有效期" value={detail.redeemableProduct.validDesc} />
            </DetailCard>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="mb-4 text-base font-semibold text-gray-900">处理记录</div>
            <div className="space-y-4">
              {detail.logs.map((log, index) => (
                <div key={`${log.time}-${index}`} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    {index < detail.logs.length - 1 && <div className="mt-1 h-full w-px bg-gray-200" />}
                  </div>
                  <div className="pb-4">
                    <div className="text-sm font-medium text-gray-900">{log.action}</div>
                    <div className="mt-1 text-xs text-gray-500">{log.time} · {log.operator}</div>
                    <div className="mt-2 text-sm leading-6 text-gray-600">{log.remark}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="mb-3 text-base font-semibold text-gray-900">兑换码信息</div>
            <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50 px-4 py-5">
              <div className="text-xs text-blue-600">兑换码</div>
              <div className="mt-2 font-mono text-xl font-semibold tracking-wider text-blue-700">{detail.redeemCode}</div>
              <div className="mt-3 text-sm text-blue-700">短信链接：{detail.voucherUrl}</div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="mb-3 text-base font-semibold text-gray-900">可兑换最小子项</div>
            <div className="space-y-3">
              {detail.redeemableProduct.minItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-200 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-gray-900">{item.label}</div>
                      <div className="mt-1 text-sm text-gray-500">
                        {item.roomType} · {item.occupancyType}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>成人 {item.adult} / 儿童 {item.child} / 婴儿 {item.infant}</div>
                      <div>升单补差价起 {formatCurrency(item.baseDiffPrice)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="mb-3 text-base font-semibold text-gray-900">有效期</div>
            <div className="space-y-2 text-sm text-gray-600">
              <div>开始时间：{detail.validStart}</div>
              <div>截止时间：{detail.validEnd}</div>
              <div>当前预约状态：{reservationStatusLabelMap[detail.reservationStatus]}</div>
              <div>当前票状态：{ticketStatusLabelMap[detail.ticketStatus]}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
