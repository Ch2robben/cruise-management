import { useEffect, useState } from 'react'
import FormDialog from '@/components/common/FormDialog'
import type { CruiseOrder } from '@/components/order/orderTypes'
import type { CreateRefundOrderForm, RefundType } from '@/components/order/refundOrderTypes'
import { formatCurrency } from '@/utils/format'

interface InitiateRefundDialogProps {
  open: boolean
  order: CruiseOrder | null
  loading?: boolean
  onCancel: () => void
  onSubmit: (form: CreateRefundOrderForm) => void
}

export default function InitiateRefundDialog({
  open,
  order,
  loading,
  onCancel,
  onSubmit,
}: InitiateRefundDialogProps) {
  const [refundType, setRefundType] = useState<RefundType>('按退规扣费退款')
  const [deductFee, setDeductFee] = useState<number>(0)
  const [applyRefundAmount, setApplyRefundAmount] = useState<number>(0)
  const [refundChannel, setRefundChannel] = useState<string>('原路返回')
  const [reason, setReason] = useState<string>('')

  useEffect(() => {
    if (open && order) {
      const paid = order.paidAmount || order.totalAmount || 0
      // 默认按扣10%退费规则建议
      const defaultDeduct = Math.round(paid * 0.1)
      setRefundType('按退规扣费退款')
      setDeductFee(defaultDeduct)
      setApplyRefundAmount(Math.max(0, paid - defaultDeduct))
      setRefundChannel('原路返回')
      setReason('游客行程变更，申请退票扣费退款')
    }
  }, [open, order])

  if (!order) return null

  const handleRefundTypeChange = (type: RefundType) => {
    setRefundType(type)
    const paid = order.paidAmount || order.totalAmount || 0
    if (type === '全额退款') {
      setDeductFee(0)
      setApplyRefundAmount(paid)
    } else if (type === '按退规扣费退款') {
      const defaultDeduct = Math.round(paid * 0.1)
      setDeductFee(defaultDeduct)
      setApplyRefundAmount(Math.max(0, paid - defaultDeduct))
    } else {
      // 部分退款
      setDeductFee(0)
      setApplyRefundAmount(Math.round(paid * 0.5))
    }
  }

  const handleDeductFeeChange = (val: number) => {
    const deduct = Math.max(0, val)
    setDeductFee(deduct)
    const paid = order.paidAmount || order.totalAmount || 0
    setApplyRefundAmount(Math.max(0, paid - deduct))
  }

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert('请填写退款原因说明')
      return
    }
    onSubmit({
      orderId: order.id,
      refundType,
      deductFee,
      applyRefundAmount,
      refundChannel,
      reason: reason.trim(),
    })
  }

  const paid = order.paidAmount || order.totalAmount || 0

  return (
    <FormDialog
      open={open}
      title={`发起订单退款申请 (${order.orderNo})`}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      loading={loading}
      width="max-w-2xl"
    >
      <div className="space-y-5 text-sm text-gray-700">
        {/* 原单信息面板 */}
        <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
          <div className="text-xs font-semibold text-gray-500 mb-2">原订单费用概要</div>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
            <div><span className="text-gray-400">订单号：</span><span className="font-mono text-gray-800">{order.orderNo}</span></div>
            <div><span className="text-gray-400">组团社/经销商：</span><span className="text-gray-800">{order.dealer || '内部直客'}</span></div>
            <div><span className="text-gray-400">航次与团名：</span><span className="text-gray-800">{order.voyageNo} ({order.groupName})</span></div>
            <div><span className="text-gray-400">订单总金额：</span><span className="font-medium text-gray-900">{formatCurrency(order.totalAmount)}</span></div>
            <div><span className="text-gray-400">已付金额：</span><span className="font-semibold text-green-700">{formatCurrency(paid)}</span></div>
            <div><span className="text-gray-400">尚欠金额：</span><span className="text-gray-700">{formatCurrency(order.arrears)}</span></div>
          </div>
        </div>

        {/* 退款配置 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              退款类型 <span className="text-red-500">*</span>
            </label>
            <select
              value={refundType}
              onChange={(e) => handleRefundTypeChange(e.target.value as RefundType)}
              className="w-full h-10 rounded border border-gray-300 px-3 text-sm bg-white focus:border-blue-500 outline-none"
            >
              <option value="按退规扣费退款">按退规扣费退款 (自理扣费)</option>
              <option value="全额退款">全额退款 (免收手续费)</option>
              <option value="部分退款">部分退款 (自定义金额)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              退款资金返回渠道
            </label>
            <select
              value={refundChannel}
              onChange={(e) => setRefundChannel(e.target.value)}
              className="w-full h-10 rounded border border-gray-300 px-3 text-sm bg-white focus:border-blue-500 outline-none"
            >
              <option value="原路返回">原路返回</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              扣费/退票手续费 (¥)
            </label>
            <input
              type="number"
              min={0}
              max={paid}
              value={deductFee}
              onChange={(e) => handleDeductFeeChange(Number(e.target.value))}
              disabled={refundType === '全额退款'}
              className="w-full h-10 rounded border border-gray-300 px-3 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 outline-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">扣款将计入退票损失/手续费</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              申请退款金额 (¥) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              max={paid}
              value={applyRefundAmount}
              onChange={(e) => setApplyRefundAmount(Number(e.target.value))}
              className="w-full h-10 rounded border border-blue-500 bg-blue-50/20 px-3 text-sm font-semibold text-blue-900 focus:border-blue-600 outline-none"
            />
            <p className="text-[11px] text-blue-600 mt-1">建议金额：已付 {formatCurrency(paid)} - 手续费 {formatCurrency(deductFee)}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            退款原因及说明 <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="请详细说明退款原因（如游客因病退团、航线受天气影响调整等）"
            className="w-full rounded border border-gray-300 p-2.5 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div className="rounded bg-amber-50 p-3 border border-amber-200 text-xs text-amber-800">
          💡 提交申请后，系统将自动生成退款单并发送至<b>【订单管理 → 退款单管理】</b>由财务/主管进行金额复核与退款审批。
        </div>
      </div>
    </FormDialog>
  )
}
