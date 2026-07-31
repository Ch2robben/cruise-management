import { useMemo, useState } from 'react'
import { Search, RotateCcw, CheckCircle, XCircle, AlertCircle, FileText, DollarSign, ArrowRight } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer from '@/components/common/DetailDrawer'
import StatusBadge from '@/components/common/StatusBadge'
import type { RefundOrder, RefundOrderStatus, RefundType } from '@/components/order/refundOrderTypes'
import { getRefundOrders, auditRefundOrder } from '@/mock/refundOrderStore'
import { formatCurrency } from '@/utils/format'

export default function RefundOrderPage() {
  const [refundOrders, setRefundOrders] = useState<RefundOrder[]>(() => getRefundOrders())
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('全部')
  const [typeFilter, setTypeFilter] = useState<string>('全部')

  // 弹窗与抽屉状态
  const [auditTarget, setAuditTarget] = useState<RefundOrder | null>(null)
  const [detailTarget, setDetailTarget] = useState<RefundOrder | null>(null)
  const [auditLoading, setAuditLoading] = useState(false)

  // 审核弹窗表单状态
  const [approvedAmount, setApprovedAmount] = useState<number>(0)
  const [deductFee, setDeductFee] = useState<number>(0)
  const [auditRemark, setAuditRemark] = useState<string>('')

  const refreshList = () => {
    setRefundOrders([...getRefundOrders()])
  }

  const filteredOrders = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return refundOrders.filter((item) => {
      const matchKw =
        !kw ||
        item.refundNo.toLowerCase().includes(kw) ||
        item.orderNo.toLowerCase().includes(kw) ||
        item.dealer.toLowerCase().includes(kw)
      const matchStatus = statusFilter === '全部' || item.status === statusFilter
      const matchType = typeFilter === '全部' || item.refundType === typeFilter
      return matchKw && matchStatus && matchType
    })
  }, [refundOrders, keyword, statusFilter, typeFilter])

  // 统计指标
  const stats = useMemo(() => {
    const pendingCount = refundOrders.filter((r) => r.status === '待审核').length
    const completedCount = refundOrders.filter((r) => r.status === '已完成').length
    const totalRefunded = refundOrders
      .filter((r) => r.status === '已完成')
      .reduce((sum, r) => sum + r.approvedRefundAmount, 0)
    return { pendingCount, completedCount, totalRefunded }
  }, [refundOrders])

  const openAuditModal = (item: RefundOrder) => {
    setAuditTarget(item)
    setApprovedAmount(item.approvedRefundAmount || item.applyRefundAmount)
    setDeductFee(item.deductFee || 0)
    setAuditRemark('经审核确认，情况属实准予退款。')
  }

  const handleAuditAction = async (status: '已同意' | '已拒绝') => {
    if (!auditTarget) return
    setAuditLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 300))

    auditRefundOrder({
      refundId: auditTarget.id,
      status,
      approvedRefundAmount: approvedAmount,
      deductFee,
      auditRemark,
    })

    setAuditLoading(false)
    setAuditTarget(null)
    refreshList()

    if (status === '已同意') {
      window.alert(`退款单 ${auditTarget.refundNo} 已通过审核并完成退款（核准额度：${formatCurrency(approvedAmount)}）`)
    } else {
      window.alert(`退款单 ${auditTarget.refundNo} 已驳回`)
    }
  }

  const getStatusBadgeVariant = (status: RefundOrderStatus) => {
    switch (status) {
      case '待审核':
        return 'warning'
      case '已完成':
      case '已同意':
        return 'success'
      case '已拒绝':
        return 'danger'
      default:
        return 'neutral'
    }
  }

  return (
    <div>
      <PageHeader
        title="退款单管理"
        description="统一集中审核订单退款申请，进行扣费金额复核、核准退款额度调整与账务退还处理"
      />

      {/* 顶部统计面板 */}
      <div className="bg-white border-b border-gray-200 px-9 py-4">
        <div className="grid grid-cols-3 gap-6 max-w-4xl">
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3.5">
            <div className="rounded-md bg-amber-100 p-2 text-amber-700">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-amber-800 font-medium">待审核退款申请</div>
              <div className="text-xl font-bold text-amber-900">{stats.pendingCount} <span className="text-xs font-normal">笔</span></div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50/50 p-3.5">
            <div className="rounded-md bg-green-100 p-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-green-800 font-medium">已完成退款笔数</div>
              <div className="text-xl font-bold text-green-900">{stats.completedCount} <span className="text-xs font-normal">笔</span></div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3.5">
            <div className="rounded-md bg-blue-100 p-2 text-blue-700">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-blue-800 font-medium">累计完成退款金额</div>
              <div className="text-xl font-bold text-blue-900">{formatCurrency(stats.totalRefunded)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="border-b border-gray-200 bg-white px-9 py-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex min-w-[240px] flex-1 items-center gap-2">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索退款单号 / 订单号 / 经销商..."
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none transition focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">退款状态:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-500"
            >
              <option value="全部">全部状态</option>
              <option value="待审核">待审核</option>
              <option value="已完成">已完成</option>
              <option value="已拒绝">已拒绝</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">退款类型:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-500"
            >
              <option value="全部">全部类型</option>
              <option value="按退规扣费退款">按退规扣费退款</option>
              <option value="全额退款">全额退款</option>
              <option value="部分退款">部分退款</option>
            </select>
          </div>

          <button
            onClick={() => {
              setKeyword('')
              setStatusFilter('全部')
              setTypeFilter('全部')
            }}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 text-sm text-gray-600 hover:bg-gray-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            重置
          </button>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="overflow-hidden border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-left border-b border-gray-200 text-xs font-medium text-gray-500">
                <th className="px-4 py-3">退款单号</th>
                <th className="px-4 py-3">关联订单号</th>
                <th className="px-4 py-3">组团社 / 经销商</th>
                <th className="px-4 py-3">退款类型</th>
                <th className="px-4 py-3 text-right">已付总额</th>
                <th className="px-4 py-3 text-right">扣费/手续费</th>
                <th className="px-4 py-3 text-right">申请退款额</th>
                <th className="px-4 py-3 text-right">核准退款额</th>
                <th className="px-4 py-3 text-center">状态</th>
                <th className="px-4 py-3">申请时间</th>
                <th className="px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-400">
                    暂无符合条件的退款单记录
                  </td>
                </tr>
              ) : (
                filteredOrders.map((item) => {
                  const isAdjusted =
                    item.status !== '待审核' &&
                    item.approvedRefundAmount !== item.applyRefundAmount

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono font-medium text-blue-700">
                        {item.refundNo}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-800">{item.orderNo}</td>
                      <td className="px-4 py-3 text-gray-800">{item.dealer}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                          {item.refundType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                        {formatCurrency(item.paidAmount)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-amber-700 font-medium">
                        {formatCurrency(item.deductFee)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-800">
                        {formatCurrency(item.applyRefundAmount)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span
                          className={`font-semibold ${
                            isAdjusted ? 'text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200' : 'text-green-700'
                          }`}
                        >
                          {formatCurrency(item.approvedRefundAmount)}
                        </span>
                        {isAdjusted && (
                          <span className="block text-[10px] text-purple-600 font-normal">已作微调</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{item.applyTime}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setDetailTarget(item)}
                            className="text-xs text-gray-600 hover:text-gray-900 hover:underline"
                          >
                            详情
                          </button>
                          {item.status === '待审核' && (
                            <button
                              onClick={() => openAuditModal(item)}
                              className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
                            >
                              审核与修改金额
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 审核与修改金额弹窗 AuditRefundDialog */}
      {auditTarget && (
        <FormDialog
          open={!!auditTarget}
          title={`审核订单退款 (${auditTarget.refundNo})`}
          onCancel={() => setAuditTarget(null)}
          onSubmit={() => handleAuditAction('已同意')}
          loading={auditLoading}
          submitText="同意并退款"
          width="max-w-2xl"
        >
          <div className="space-y-5 text-sm text-gray-700">
            {/* 原申请快照 */}
            <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 mb-2">退款申请信息</div>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                <div><span className="text-gray-400">退款单号：</span><span className="font-mono text-gray-800">{auditTarget.refundNo}</span></div>
                <div><span className="text-gray-400">关联订单号：</span><span className="font-mono text-gray-800">{auditTarget.orderNo}</span></div>
                <div><span className="text-gray-400">组团社/经销商：</span><span className="text-gray-800">{auditTarget.dealer}</span></div>
                <div><span className="text-gray-400">退款类型：</span><span className="font-medium text-gray-800">{auditTarget.refundType}</span></div>
                <div><span className="text-gray-400">原订单付额：</span><span className="font-medium text-gray-900">{formatCurrency(auditTarget.paidAmount)}</span></div>
                <div><span className="text-gray-400">申请退款额：</span><span className="font-semibold text-blue-700">{formatCurrency(auditTarget.applyRefundAmount)}</span></div>
                <div className="col-span-2"><span className="text-gray-400">申请退款原因：</span><span className="text-gray-800">{auditTarget.reason}</span></div>
              </div>
            </div>

            {/* 审核人微调退款金额核心区域 */}
            <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900">审核微调核准金额</span>
                <span className="text-[11px] text-blue-600">审核员可根据最新政策或扣费协议调整核准退款额</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    核准扣费/退票费 (¥)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={auditTarget.paidAmount}
                    value={deductFee}
                    onChange={(e) => {
                      const df = Math.max(0, Number(e.target.value))
                      setDeductFee(df)
                      setApprovedAmount(Math.max(0, auditTarget.paidAmount - df))
                    }}
                    className="w-full h-10 rounded border border-gray-300 bg-white px-3 text-sm font-medium outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    最终核准退款金额 (¥) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={auditTarget.paidAmount}
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(Number(e.target.value))}
                    className="w-full h-10 rounded border border-blue-600 bg-white px-3 text-base font-bold text-green-700 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {approvedAmount !== auditTarget.applyRefundAmount && (
                <div className="text-xs text-purple-700 bg-purple-50 p-2 rounded border border-purple-200">
                  ⚠️ 调整后核准退款金额与申请额差异：
                  <b>{formatCurrency(approvedAmount - auditTarget.applyRefundAmount)}</b>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                审核备注与意见
              </label>
              <textarea
                rows={2}
                value={auditRemark}
                onChange={(e) => setAuditRemark(e.target.value)}
                placeholder="请输入审核处理意见..."
                className="w-full rounded border border-gray-300 p-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => handleAuditAction('已拒绝')}
                disabled={auditLoading}
                className="rounded bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                驳回退款申请
              </button>
              <span className="text-xs text-gray-400">确认后将原路退回对应资金并关闭退款单</span>
            </div>
          </div>
        </FormDialog>
      )}

      {/* 详情抽屉 DetailDrawer */}
      {detailTarget && (
        <DetailDrawer
          open={!!detailTarget}
          title={`退款单详情 (${detailTarget.refundNo})`}
          onClose={() => setDetailTarget(null)}
        >
          <div className="space-y-6 text-sm text-gray-700">
            <div className="rounded-lg bg-gray-50 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="font-semibold text-gray-800">退款单状态</span>
                <StatusBadge status={detailTarget.status} />
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <div><span className="text-gray-400">退款单号：</span><span className="font-mono text-gray-900">{detailTarget.refundNo}</span></div>
                <div><span className="text-gray-400">关联订单号：</span><span className="font-mono text-gray-900">{detailTarget.orderNo}</span></div>
                <div><span className="text-gray-400">退款类型：</span><span>{detailTarget.refundType}</span></div>
                <div><span className="text-gray-400">退款渠道：</span><span>{detailTarget.refundChannel}</span></div>
                <div><span className="text-gray-400">申请人：</span><span>{detailTarget.applicant}</span></div>
                <div><span className="text-gray-400">申请时间：</span><span>{detailTarget.applyTime}</span></div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">金额计算与审核结语</h4>
              <div className="rounded-lg border border-gray-200 p-4 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">原订单已付金额</span><span>{formatCurrency(detailTarget.paidAmount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">申请退款金额</span><span>{formatCurrency(detailTarget.applyRefundAmount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">扣费/退票手续费</span><span className="text-amber-700">{formatCurrency(detailTarget.deductFee)}</span></div>
                <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-sm">
                  <span>核准退款金额</span>
                  <span className="text-green-700">{formatCurrency(detailTarget.approvedRefundAmount)}</span>
                </div>
              </div>
            </div>

            {detailTarget.auditTime && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">审核日志</h4>
                <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-3 text-xs space-y-1">
                  <div><span className="text-gray-500">审核人：</span><span className="text-gray-800">{detailTarget.auditor || '管理员'}</span></div>
                  <div><span className="text-gray-500">审核时间：</span><span className="text-gray-800">{detailTarget.auditTime}</span></div>
                  <div><span className="text-gray-500">审核意见：</span><span className="text-gray-800">{detailTarget.auditRemark || '无'}</span></div>
                </div>
              </div>
            )}
          </div>
        </DetailDrawer>
      )}
    </div>
  )
}
