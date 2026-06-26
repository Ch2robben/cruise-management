import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import FormDialog from '@/components/common/FormDialog'
import SupplementaryPaymentDialog from '@/components/order/SupplementaryPaymentDialog'
import type {
  CreateSupplementaryPaymentForm,
  CruiseOrder,
  SupplementaryPaymentOrder,
  SupplementaryPaymentStatus,
} from '@/components/order/orderTypes'
import { supplementaryPaymentApi } from '@/mock/api'
import { applyPaymentToOrder } from '@/mock/supplementaryPayment'
import { updateOrder } from '@/mock/orderStore'
import { appendOrderLog, nowLogTime } from '@/mock/orderLogStore'
import { appendOrderLogFromOrder, ORDER_LOG_OPERATOR } from '@/components/order/orderLogUtils'
import { formatCurrency } from '@/utils/format'

const statusColor: Record<SupplementaryPaymentStatus, string> = {
  待支付: 'bg-amber-100 text-amber-700',
  处理中: 'bg-blue-100 text-blue-700',
  已到账: 'bg-green-100 text-green-700',
  已驳回: 'bg-red-100 text-red-700',
  已撤销: 'bg-gray-100 text-gray-600',
}

interface SupplementaryPaymentSectionProps {
  order: CruiseOrder
  onOrderChange?: (order: CruiseOrder) => void
  createOpen?: boolean
  onCreateOpenChange?: (open: boolean) => void
}

export default function SupplementaryPaymentSection({
  order,
  onOrderChange,
  createOpen: controlledCreateOpen,
  onCreateOpenChange,
}: SupplementaryPaymentSectionProps) {
  const [internalCreateOpen, setInternalCreateOpen] = useState(false)
  const createOpen = controlledCreateOpen ?? internalCreateOpen
  const setCreateOpen = onCreateOpenChange ?? setInternalCreateOpen
  const [payments, setPayments] = useState<SupplementaryPaymentOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<SupplementaryPaymentOrder | null>(null)
  const [confirmForm, setConfirmForm] = useState({ receipt: '', arrivalTime: '' })
  const [actionLoading, setActionLoading] = useState(false)

  const loadPayments = useCallback(async () => {
    setLoading(true)
    const result = await supplementaryPaymentApi.listByOrderId(order.id)
    setPayments(result)
    setLoading(false)
  }, [order.id])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  const handleCreate = async (form: CreateSupplementaryPaymentForm) => {
    setActionLoading(true)
    const payment = await supplementaryPaymentApi.create(order, form)
    setActionLoading(false)
    setCreateOpen(false)
    appendOrderLog(appendOrderLogFromOrder(order, {
      action: '生成补款单',
      operator: ORDER_LOG_OPERATOR,
      operatedAt: nowLogTime(),
      changes: [
        `补款单号：${payment.paymentNo}`,
        `类型：${payment.paymentType}`,
        `金额：${formatCurrency(payment.amount)}`,
        `渠道：${payment.channel}`,
        form.notifyDealer ? '已通知分销商付款' : '未通知分销商',
      ],
      remark: form.remark || undefined,
    }))
    await loadPayments()
    if (form.notifyDealer) {
      window.alert(`补款单已生成，已通知分销商「${order.dealer}」付款。`)
    } else {
      window.alert('补款单已生成。')
    }
  }

  const handleConfirm = async () => {
    if (!confirmTarget) return
    if (!confirmForm.receipt.trim()) {
      window.alert('请填写交易回执号')
      return
    }
    if (!confirmForm.arrivalTime) {
      window.alert('请填写到账时间')
      return
    }
    setActionLoading(true)
    const result = await supplementaryPaymentApi.confirm(confirmTarget.id, confirmForm)
    setActionLoading(false)
    if (!result) {
      window.alert('确认失败，补款单状态可能已变更')
      return
    }
    const updated = applyPaymentToOrder(order, result.payment.amount)
    onOrderChange?.(updated)
    updateOrder(order.id, updated)
    appendOrderLog(appendOrderLogFromOrder(updated, {
      action: '确认到账',
      operator: ORDER_LOG_OPERATOR,
      operatedAt: nowLogTime(),
      changes: [
        `补款单号：${result.payment.paymentNo}`,
        `到账金额：${formatCurrency(result.payment.amount)}`,
        `实收总额：${formatCurrency(order.paidAmount)} → ${formatCurrency(updated.paidAmount)}`,
        `欠款：${formatCurrency(order.arrears)} → ${formatCurrency(updated.arrears)}`,
        `回执号：${confirmForm.receipt}`,
      ],
    }))
    setConfirmTarget(null)
    setConfirmForm({ receipt: '', arrivalTime: '' })
    await loadPayments()
    window.alert(`补款单 ${result.payment.paymentNo} 已确认到账，实收已更新。`)
  }

  const handleCancel = async (payment: SupplementaryPaymentOrder) => {
    if (!window.confirm(`确定撤销补款单 ${payment.paymentNo}？`)) return
    setActionLoading(true)
    const result = await supplementaryPaymentApi.cancel(payment.id)
    setActionLoading(false)
    if (!result) {
      window.alert('撤销失败，仅「待支付」状态可撤销')
      return
    }
    appendOrderLog(appendOrderLogFromOrder(order, {
      action: '撤销补款单',
      operator: ORDER_LOG_OPERATOR,
      operatedAt: nowLogTime(),
      changes: [
        `补款单号：${payment.paymentNo}`,
        `金额：${formatCurrency(payment.amount)}`,
      ],
    }))
    await loadPayments()
  }

  const openConfirm = (payment: SupplementaryPaymentOrder) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
    setConfirmTarget(payment)
    setConfirmForm({
      receipt: `RCPT-${payment.paymentNo}`,
      arrivalTime: now,
    })
  }

  const canCreate = order.orderStatus !== '取消' && order.orderStatus !== '已完成'
  const createDisabledReason = order.orderStatus === '取消'
    ? '已取消订单不可生成补款单'
    : order.orderStatus === '已完成'
      ? '已完成订单不可生成补款单'
      : ''

  return (
    <>
      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-5 py-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">补款单</h3>
            <p className="mt-0.5 text-xs text-gray-500">向分销商发起补款通知，财务确认后写入流水</p>
          </div>
          {canCreate ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              生成补款单
            </button>
          ) : (
            <span className="text-xs text-gray-400" title={createDisabledReason}>{createDisabledReason}</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-white">
                {['补款单号', '类型', '金额', '渠道', '状态', '应付截止', '创建时间', '备注', '操作'].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">加载中...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">暂无补款单</td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 font-mono text-gray-700">{payment.paymentNo}</td>
                    <td className="px-4 py-3 text-gray-700">{payment.paymentType}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">{formatCurrency(payment.amount)}</td>
                    <td className="px-4 py-3 text-gray-700">{payment.channel}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-xs ${statusColor[payment.status]}`}>{payment.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{payment.dueDate}</td>
                    <td className="px-4 py-3 text-gray-700">{payment.createdAt}</td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-gray-600" title={payment.remark}>{payment.remark || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {payment.status === '待支付' && (
                          <>
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => openConfirm(payment)}
                              className="text-blue-600 hover:underline disabled:opacity-50"
                            >
                              确认到账
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleCancel(payment)}
                              className="text-gray-500 hover:underline disabled:opacity-50"
                            >
                              撤销
                            </button>
                          </>
                        )}
                        {payment.status === '已到账' && (
                          <span className="text-xs text-gray-400">{payment.receipt}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <SupplementaryPaymentDialog
        open={createOpen}
        order={order}
        loading={actionLoading}
        onCancel={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <FormDialog
        open={!!confirmTarget}
        title="财务确认到账"
        width="max-w-lg"
        loading={actionLoading}
        onCancel={() => setConfirmTarget(null)}
        onSubmit={handleConfirm}
        submitText="确认到账"
      >
        {confirmTarget && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
              <div className="text-gray-500">补款单号</div>
              <div className="mt-1 font-mono font-medium text-gray-900">{confirmTarget.paymentNo}</div>
              <div className="mt-2 text-gray-500">到账金额</div>
              <div className="mt-1 text-lg font-semibold text-blue-600">{formatCurrency(confirmTarget.amount)}</div>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-700">交易回执号</span>
              <input
                value={confirmForm.receipt}
                onChange={(event) => setConfirmForm({ ...confirmForm, receipt: event.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-700">到账时间</span>
              <input
                type="datetime-local"
                value={confirmForm.arrivalTime.replace(' ', 'T').slice(0, 16)}
                onChange={(event) => setConfirmForm({
                  ...confirmForm,
                  arrivalTime: event.target.value.replace('T', ' ') + ':00',
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </label>
          </div>
        )}
      </FormDialog>
    </>
  )
}
