import { useCallback, useEffect, useState } from 'react'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import FormDialog from '@/components/common/FormDialog'
import type { SupplementaryPaymentOrder, SupplementaryPaymentStatus } from '@/components/order/orderTypes'
import { supplementaryPaymentApi } from '@/mock/api'
import { applyPaymentToOrder } from '@/mock/supplementaryPayment'
import { getOrderById, updateOrder } from '@/mock/orderStore'
import type { PaginatedResult } from '@/types'
import { formatCurrency } from '@/utils/format'

const statusOptions = ['全部', '待支付', '处理中', '已到账', '已驳回', '已撤销']

const statusColor: Record<SupplementaryPaymentStatus, string> = {
  待支付: 'bg-amber-100 text-amber-700',
  处理中: 'bg-blue-100 text-blue-700',
  已到账: 'bg-green-100 text-green-700',
  已驳回: 'bg-red-100 text-red-700',
  已撤销: 'bg-gray-100 text-gray-600',
}

export default function SupplementaryPaymentPage() {
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('全部')
  const [data, setData] = useState<PaginatedResult<SupplementaryPaymentOrder>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [confirmTarget, setConfirmTarget] = useState<SupplementaryPaymentOrder | null>(null)
  const [confirmForm, setConfirmForm] = useState({ receipt: '', arrivalTime: '' })
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const result = await supplementaryPaymentApi.list({
      page,
      pageSize: 10,
      keyword: keyword.trim() || undefined,
      status: statusFilter === '全部' ? 'all' : statusFilter,
    })
    setData(result)
    setLoading(false)
  }, [keyword, statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleConfirm = async () => {
    if (!confirmTarget) return
    if (!confirmForm.receipt.trim() || !confirmForm.arrivalTime) {
      window.alert('请填写回执号和到账时间')
      return
    }
    setActionLoading(true)
    const result = await supplementaryPaymentApi.confirm(confirmTarget.id, confirmForm)
    setActionLoading(false)
    if (!result) {
      window.alert('确认失败')
      return
    }
    const sourceOrder = getOrderById(result.payment.orderId)
    if (sourceOrder) {
      updateOrder(sourceOrder.id, applyPaymentToOrder(sourceOrder, result.payment.amount))
    }
    setConfirmTarget(null)
    await fetchData(data.page)
    window.alert(`补款单 ${result.payment.paymentNo} 已确认到账。请在订单详情查看更新后的实收金额。`)
  }

  const handleCancel = async (payment: SupplementaryPaymentOrder) => {
    if (!window.confirm(`确定撤销补款单 ${payment.paymentNo}？`)) return
    setActionLoading(true)
    await supplementaryPaymentApi.cancel(payment.id)
    setActionLoading(false)
    await fetchData(data.page)
  }

  return (
    <div>
      <PageHeader title="补款单管理" description="查看全站补款单，财务可在此确认到账或撤销待支付单据。" />

      <SearchPanel onSearch={() => fetchData(1)} onReset={() => { setKeyword(''); setStatusFilter('全部') }}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block text-gray-700">关键词</span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="补款单号 / 订单号 / 组团社"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-gray-700">状态</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
      </SearchPanel>

      <div className="mt-5 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['补款单号', '订单号', '团名', '组团社', '类型', '金额', '渠道', '状态', '应付截止', '创建时间', '操作'].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-gray-400">加载中...</td></tr>
              ) : data.data.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-gray-400">暂无补款单</td></tr>
              ) : (
                data.data.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 font-mono text-gray-700">{payment.paymentNo}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">{payment.orderNo}</td>
                    <td className="px-4 py-3 text-gray-700">{payment.groupName}</td>
                    <td className="px-4 py-3 text-gray-700">{payment.dealer}</td>
                    <td className="px-4 py-3 text-gray-700">{payment.paymentType}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">{formatCurrency(payment.amount)}</td>
                    <td className="px-4 py-3 text-gray-700">{payment.channel}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-xs ${statusColor[payment.status]}`}>{payment.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{payment.dueDate}</td>
                    <td className="px-4 py-3 text-gray-700">{payment.createdAt}</td>
                    <td className="px-4 py-3">
                      {payment.status === '待支付' ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => {
                              const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
                              setConfirmTarget(payment)
                              setConfirmForm({ receipt: `RCPT-${payment.paymentNo}`, arrivalTime: now })
                            }}
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
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
              <div className="mt-1 font-mono font-medium">{confirmTarget.paymentNo}</div>
              <div className="mt-2 text-gray-500">订单号</div>
              <div className="mt-1 font-mono">{confirmTarget.orderNo}</div>
              <div className="mt-2 text-gray-500">到账金额</div>
              <div className="mt-1 text-lg font-semibold text-blue-600">{formatCurrency(confirmTarget.amount)}</div>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-700">交易回执号</span>
              <input
                value={confirmForm.receipt}
                onChange={(event) => setConfirmForm({ ...confirmForm, receipt: event.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          </div>
        )}
      </FormDialog>
    </div>
  )
}
