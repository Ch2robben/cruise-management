import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import DetailDrawer from '@/components/common/DetailDrawer'
import {
  listPeriodTicketOrders,
  reservationStatusLabelMap,
  ticketStatusLabelMap,
  type PeriodReservationStatus,
  type PeriodTicketOrder,
  type PeriodTicketStatus,
} from '@/mock/periodTicketOrders'
import { formatCurrency } from '@/utils/format'

const reservationOptions: { label: string; value: '' | PeriodReservationStatus }[] = [
  { label: '全部', value: '' },
  { label: '待预约', value: 'pending' },
  { label: '已预约', value: 'reserved' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]

const ticketOptions: { label: string; value: '' | PeriodTicketStatus }[] = [
  { label: '全部', value: '' },
  { label: '未使用', value: 'unused' },
  { label: '部分使用', value: 'partial' },
  { label: '已使用', value: 'used' },
  { label: '已取消', value: 'cancelled' },
  { label: '撤销', value: 'revoked' },
  { label: '撤改', value: 'changed' },
]

function statusClass(status: PeriodTicketStatus) {
  return {
    unused: 'text-emerald-600',
    partial: 'text-amber-600',
    used: 'text-gray-600',
    cancelled: 'text-gray-400',
    revoked: 'text-red-500',
    changed: 'text-red-500',
  }[status]
}

function eligibleForRedeem(order: PeriodTicketOrder) {
  return order.ticketStatus === 'unused' || order.ticketStatus === 'partial'
}

export default function DealerPeriodTicketOrderPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<PeriodTicketOrder[]>([])
  const [keywordType, setKeywordType] = useState<'periodOrderNo' | 'certificateNo'>('periodOrderNo')
  const [keyword, setKeyword] = useState('')
  const [productKeyword, setProductKeyword] = useState('')
  const [passengerKeyword, setPassengerKeyword] = useState('')
  const [mobileKeyword, setMobileKeyword] = useState('')
  const [reservationStatus, setReservationStatus] = useState<'' | PeriodReservationStatus>('')
  const [ticketStatus, setTicketStatus] = useState<'' | PeriodTicketStatus>('')
  const [otaChannel, setOtaChannel] = useState('')
  const [smsOrder, setSmsOrder] = useState<PeriodTicketOrder | null>(null)
  const [smsMobile, setSmsMobile] = useState('')
  const [copyOrder, setCopyOrder] = useState<PeriodTicketOrder | null>(null)
  const [modeOrder, setModeOrder] = useState<PeriodTicketOrder | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    setOrders(listPeriodTicketOrders())
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2500)
    return () => window.clearTimeout(timer)
  }, [toast])

  const otaOptions = useMemo(
    () => Array.from(new Set(orders.map((item) => item.otaChannel))),
    [orders],
  )

  const filtered = useMemo(() => {
    return orders.filter((item) => {
      const keywordMatch = !keyword.trim()
        || (keywordType === 'periodOrderNo' ? item.periodOrderNo : item.certificateNo).includes(keyword.trim())
      const productMatch = !productKeyword.trim() || item.productName.includes(productKeyword.trim())
      const passengerMatch = !passengerKeyword.trim() || item.passengerName.includes(passengerKeyword.trim())
      const mobileMatch = !mobileKeyword.trim() || item.contactMobile.includes(mobileKeyword.trim()) || item.pickupMobile.includes(mobileKeyword.trim())
      const reservationMatch = !reservationStatus || item.reservationStatus === reservationStatus
      const ticketMatch = !ticketStatus || item.ticketStatus === ticketStatus
      const otaMatch = !otaChannel || item.otaChannel === otaChannel
      return keywordMatch && productMatch && passengerMatch && mobileMatch && reservationMatch && ticketMatch && otaMatch
    })
  }, [keyword, keywordType, mobileKeyword, orders, otaChannel, passengerKeyword, productKeyword, reservationStatus, ticketStatus])

  const resetFilters = () => {
    setKeywordType('periodOrderNo')
    setKeyword('')
    setProductKeyword('')
    setPassengerKeyword('')
    setMobileKeyword('')
    setReservationStatus('')
    setTicketStatus('')
    setOtaChannel('')
  }

  const openSms = (order: PeriodTicketOrder) => {
    setSmsOrder(order)
    setSmsMobile(order.pickupMobile)
  }

  const sendSms = () => {
    if (!smsOrder) return
    setSmsOrder(null)
    setToast(`已向 ${smsMobile} 重发兑换短信`)
  }

  const copyText = async (value: string, successText: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setToast(successText)
    } catch {
      setToast('复制失败，请手动复制')
    }
  }

  return (
    <div className="space-y-5 p-6 pb-20">
      {toast && <div className="fixed left-1/2 top-6 z-[999] -translate-x-1/2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm text-white shadow-lg">{toast}</div>}

      <PageHeader title="期票订单" description="查看期票订单、兑换状态与兑换入口，支持短信重发、复制链接和人工兑换处理。" />

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-1 text-sm text-gray-600">
            <span>订单编号 / 证件号</span>
            <div className="flex gap-2">
              <select
                className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
                value={keywordType}
                onChange={(e) => setKeywordType(e.target.value as 'periodOrderNo' | 'certificateNo')}
              >
                <option value="periodOrderNo">订单编号</option>
                <option value="certificateNo">证件号</option>
              </select>
              <input
                className="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
                placeholder={keywordType === 'periodOrderNo' ? '请输入订单编号' : '请输入旅客证件号'}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </label>

          <label className="space-y-1 text-sm text-gray-600">
            <span>产品名称</span>
            <input
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
              placeholder="搜索选择产品名称"
              value={productKeyword}
              onChange={(e) => setProductKeyword(e.target.value)}
            />
          </label>

          <label className="space-y-1 text-sm text-gray-600">
            <span>预约状态</span>
            <select
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
              value={reservationStatus}
              onChange={(e) => setReservationStatus(e.target.value as '' | PeriodReservationStatus)}
            >
              {reservationOptions.map((option) => (
                <option key={option.label} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm text-gray-600">
            <span>旅客姓名</span>
            <input
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
              placeholder="请输入旅客姓名"
              value={passengerKeyword}
              onChange={(e) => setPassengerKeyword(e.target.value)}
            />
          </label>

          <label className="space-y-1 text-sm text-gray-600">
            <span>联系人手机号</span>
            <input
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
              placeholder="请输入联系人手机号"
              value={mobileKeyword}
              onChange={(e) => setMobileKeyword(e.target.value)}
            />
          </label>

          <label className="space-y-1 text-sm text-gray-600">
            <span>OTA渠道</span>
            <select
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
              value={otaChannel}
              onChange={(e) => setOtaChannel(e.target.value)}
            >
              <option value="">请选择</option>
              {otaOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm text-gray-600 xl:col-start-3">
            <span className="text-red-500">票状态</span>
            <select
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
              value={ticketStatus}
              onChange={(e) => setTicketStatus(e.target.value as '' | PeriodTicketStatus)}
            >
              {ticketOptions.map((option) => (
                <option key={option.label} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button className="h-10 rounded-lg border border-gray-300 px-5 text-sm text-gray-700" onClick={resetFilters}>重置</button>
          <button className="h-10 rounded-lg bg-blue-600 px-5 text-sm text-white">搜索</button>
          <button className="h-10 rounded-lg border border-gray-300 px-5 text-sm text-gray-700" onClick={() => setToast('已导出当前筛选结果（Mock）')}>导出</button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[1500px] w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">期票订单号</th>
                <th className="px-4 py-3 font-medium">OTA订单号</th>
                <th className="px-4 py-3 font-medium text-red-500">订单金额</th>
                <th className="px-4 py-3 font-medium">产品名称</th>
                <th className="px-4 py-3 font-medium">票名称</th>
                <th className="px-4 py-3 font-medium">预约产品/票类</th>
                <th className="px-4 py-3 font-medium">订单状态</th>
                <th className="px-4 py-3 font-medium">销售渠道</th>
                <th className="px-4 py-3 font-medium">取票人</th>
                <th className="px-4 py-3 font-medium">下单时间</th>
                <th className="px-4 py-3 font-medium">有效期</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 align-top text-gray-700">
                  <td className="px-4 py-4 font-medium text-gray-900">{item.periodOrderNo}</td>
                  <td className="px-4 py-4">{item.otaOrderNo}</td>
                  <td className="px-4 py-4 text-red-500">{formatCurrency(item.amount)}</td>
                  <td className="px-4 py-4">{item.productName}</td>
                  <td className="px-4 py-4">{item.ticketName}</td>
                  <td className="px-4 py-4 leading-6">{item.reservedProduct}</td>
                  <td className={`px-4 py-4 font-medium ${statusClass(item.ticketStatus)}`}>{ticketStatusLabelMap[item.ticketStatus]}</td>
                  <td className="px-4 py-4">{item.salesChannel}</td>
                  <td className="px-4 py-4">
                    <div>{item.pickupName}</div>
                    <div className="text-gray-400">{item.pickupMobile}</div>
                  </td>
                  <td className="px-4 py-4">{item.orderTime}</td>
                  <td className="px-4 py-4 leading-6">
                    <div>开始时间：{item.validStart}</div>
                    <div>截止时间：{item.validEnd}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                      {item.supportRefund && <button className="text-blue-600 hover:text-blue-700">退票</button>}
                      {(item.ticketStatus === 'unused' || item.ticketStatus === 'partial' || item.ticketStatus === 'used') && (
                        <button className="text-blue-600 hover:text-blue-700">售后</button>
                      )}
                      <button className="text-blue-600 hover:text-blue-700" onClick={() => navigate(`/dealer/orders/period/${item.id}`)}>详情</button>
                      {item.supportResendSms && (
                        <button className="text-blue-600 hover:text-blue-700" onClick={() => openSms(item)}>重发短信</button>
                      )}
                      {item.supportCopyLink && (
                        <button className="text-blue-600 hover:text-blue-700" onClick={() => setCopyOrder(item)}>复制链接</button>
                      )}
                      <button className="text-blue-600 hover:text-blue-700" onClick={() => setToast(`已触发 ${item.periodOrderNo} 打印任务（Mock）`)}>打印</button>
                      {eligibleForRedeem(item) && (
                        <button className="text-emerald-600 hover:text-emerald-700" onClick={() => setModeOrder(item)}>期票兑换</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-sm text-gray-400">暂无符合条件的期票订单</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
          <span>共 {filtered.length} 条记录</span>
          <span>Mock 列表，分页先按单页展示</span>
        </div>
      </div>

      <DetailDrawer open={!!smsOrder} title="重发短信" width="w-[520px]" onClose={() => setSmsOrder(null)}>
        <div className="space-y-5 pt-2">
          <div className="rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-700">
            状态为待预约时，默认发送到取票人手机号，可按客服确认后的号码重发。
          </div>
          <label className="block space-y-1 text-sm text-gray-600">
            <span>手机号</span>
            <input
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
              value={smsMobile}
              onChange={(e) => setSmsMobile(e.target.value)}
            />
          </label>
          <div className="flex justify-end gap-3">
            <button className="h-10 rounded-lg border border-gray-300 px-5 text-sm text-gray-700" onClick={() => setSmsOrder(null)}>取消</button>
            <button className="h-10 rounded-lg bg-blue-600 px-5 text-sm text-white" onClick={sendSms}>确定</button>
          </div>
        </div>
      </DetailDrawer>

      <DetailDrawer open={!!copyOrder} title="复制链接" width="w-[560px]" onClose={() => setCopyOrder(null)}>
        <div className="space-y-5 pt-2">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-700">
            <div className="mb-2 text-gray-500">订单地址</div>
            <div className="break-all font-mono text-xs">{copyOrder?.voucherUrl}</div>
          </div>
          <div className="flex justify-end gap-3">
            <button className="h-10 rounded-lg border border-gray-300 px-5 text-sm text-gray-700" onClick={() => setCopyOrder(null)}>关闭</button>
            <button
              className="h-10 rounded-lg bg-blue-600 px-5 text-sm text-white"
              onClick={() => copyOrder && copyText(copyOrder.voucherUrl, '链接已复制')}
            >
              复制
            </button>
          </div>
        </div>
      </DetailDrawer>

      <DetailDrawer open={!!modeOrder} title="选择兑换方式" width="w-[560px]" onClose={() => setModeOrder(null)}>
        <div className="space-y-4 pt-2">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            订单 {modeOrder?.periodOrderNo} 支持两种兑换方式，请由客服根据客户诉求选择。
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <button
              className="rounded-xl border border-gray-200 p-5 text-left transition hover:border-blue-400 hover:bg-blue-50"
              onClick={() => modeOrder && navigate(`/dealer/orders/period/redeem?orderId=${modeOrder.id}&mode=direct`)}
            >
              <div className="text-base font-semibold text-gray-900">直接兑换</div>
              <div className="mt-2 text-sm leading-6 text-gray-500">不补差价，完成兑换后直接生成一笔正常的游轮订单。</div>
            </button>
            <button
              className="rounded-xl border border-gray-200 p-5 text-left transition hover:border-blue-400 hover:bg-blue-50"
              onClick={() => modeOrder && navigate(`/dealer/orders/period/redeem?orderId=${modeOrder.id}&mode=upgrade`)}
            >
              <div className="text-base font-semibold text-gray-900">升单兑换</div>
              <div className="mt-2 text-sm leading-6 text-gray-500">选择升舱/升配子项后生成补差价二维码，并保留支付链接复制能力。</div>
            </button>
          </div>
        </div>
      </DetailDrawer>
    </div>
  )
}
