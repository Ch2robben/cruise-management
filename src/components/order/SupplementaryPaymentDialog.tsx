import { useEffect, useState } from 'react'
import FormDialog from '@/components/common/FormDialog'
import type {
  CreateSupplementaryPaymentForm,
  CruiseOrder,
  SupplementaryPaymentChannel,
  SupplementaryPaymentType,
} from '@/components/order/orderTypes'
import { suggestSupplementaryPaymentType } from '@/components/order/orderTypes'
import { formatCurrency } from '@/utils/format'

const paymentTypeOptions: SupplementaryPaymentType[] = ['定金', '船款', '尾款', '改价补差', '罚金', '其他']
const channelOptions: SupplementaryPaymentChannel[] = ['银行转账', '线下现金', '预存余额', '授信额度', '通联在线']

interface SupplementaryPaymentDialogProps {
  open: boolean
  order: CruiseOrder
  loading?: boolean
  onCancel: () => void
  onSubmit: (form: CreateSupplementaryPaymentForm) => void
}

function defaultDueDate() {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString().slice(0, 10)
}

export default function SupplementaryPaymentDialog({
  open,
  order,
  loading,
  onCancel,
  onSubmit,
}: SupplementaryPaymentDialogProps) {
  const [form, setForm] = useState<CreateSupplementaryPaymentForm>(() => ({
    orderId: order.id,
    paymentType: suggestSupplementaryPaymentType(order),
    amount: Math.max(order.arrears, 0),
    channel: '银行转账',
    dueDate: defaultDueDate(),
    remark: '',
    notifyDealer: true,
  }))

  useEffect(() => {
    if (!open) return
    setForm({
      orderId: order.id,
      paymentType: suggestSupplementaryPaymentType(order),
      amount: Math.max(order.arrears, 0),
      channel: '银行转账',
      dueDate: defaultDueDate(),
      remark: '',
      notifyDealer: true,
    })
  }, [open, order])

  const handleSubmit = () => {
    if (form.amount <= 0) {
      window.alert('补款金额必须大于 0')
      return
    }
    if (!form.dueDate) {
      window.alert('请填写应付截止日')
      return
    }
    onSubmit(form)
  }

  return (
    <FormDialog
      open={open}
      title="生成补款单"
      width="max-w-2xl"
      loading={loading}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitText="生成补款单"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          补款单生成后状态为「待支付」，财务确认到账后将写入收付款流水并更新实收/欠款。
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ReadonlyField label="关联订单号" value={order.orderNo} mono />
          <ReadonlyField label="组团社" value={order.dealer} />
          <ReadonlyField label="团名" value={order.groupName} />
          <ReadonlyField label="当前欠款" value={formatCurrency(order.arrears)} highlight />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-gray-700">补款类型</span>
            <select
              value={form.paymentType}
              onChange={(event) => setForm({ ...form, paymentType: event.target.value as SupplementaryPaymentType })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              {paymentTypeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-gray-700">收款渠道</span>
            <select
              value={form.channel}
              onChange={(event) => setForm({ ...form, channel: event.target.value as SupplementaryPaymentChannel })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              {channelOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-gray-700">补款金额（元）</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-gray-700">应付截止日</span>
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-gray-700">备注</span>
          <textarea
            rows={3}
            value={form.remark}
            onChange={(event) => setForm({ ...form, remark: event.target.value })}
            placeholder="可填写补款原因，如改价差额、逾期船款等"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.notifyDealer}
            onChange={(event) => setForm({ ...form, notifyDealer: event.target.checked })}
            className="rounded border-gray-300"
          />
          生成后通知分销商付款
        </label>
      </div>
    </FormDialog>
  )
}

function ReadonlyField({
  label,
  value,
  mono,
  highlight,
}: {
  label: string
  value: string
  mono?: boolean
  highlight?: boolean
}) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 text-sm font-medium ${highlight ? 'text-blue-600' : 'text-gray-900'} ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </div>
  )
}
