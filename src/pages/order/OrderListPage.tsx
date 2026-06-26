import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronLeft, RotateCcw, Search } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import OrderDetailPanel from '@/components/order/OrderDetailPanel'
import OrderEditDialog, { orderToEditForm, type OrderEditForm } from '@/components/order/OrderEditDialog'
import OrderPriceChangeDialog, { type OrderPriceChangeForm } from '@/components/order/OrderPriceChangeDialog'
import { buildPriceChangeLogs, diffEditFormChanges, appendOrderLogFromOrder, ORDER_LOG_OPERATOR } from '@/components/order/orderLogUtils'
import GroupNameDisplay from '@/components/order/GroupNameDisplay'
import OrderHistoryPanel from '@/components/order/OrderHistoryPanel'
import { matchOrderGroupName, syncOrderFromFeeItems, type CruiseOrder, type OrderStatus } from '@/components/order/orderTypes'
import { getOrders, updateOrder } from '@/mock/orderStore'
import { appendOrderLog, nowLogTime } from '@/mock/orderLogStore'
import { formatCurrency } from '@/utils/format'

const statusColor: Record<OrderStatus, string> = {
  取消: 'bg-red-100 text-red-700',
  船款确认: 'bg-blue-100 text-blue-700',
  已预订: 'bg-green-100 text-green-700',
  已完成: 'bg-gray-100 text-gray-600',
}

const filterFields = [
  { key: 'keyword', label: '总单号/订单号', type: 'input', placeholder: '请输入' },
  { key: 'orderStatus', label: '订单状态', type: 'select', options: ['全部', '取消', '船款确认', '已预订', '已完成'] },
  { key: 'voyageNo', label: '航次号', type: 'input', placeholder: '请输入' },
  { key: 'voyageStatus', label: '航次状态', type: 'select', options: ['全部', '开放', '关闭'] },
  { key: 'marketCategory', label: '市场类别', type: 'select', options: ['全部', '内宾-巫山县', '内宾-奉节县', '内宾-云阳县', '外宾-日本', '外宾-美国'] },
  { key: 'bookingDate', label: '预订日期', type: 'date', placeholder: '请选择' },
  { key: 'groupName', label: '团队名称', type: 'input', placeholder: '请输入' },
  { key: 'line', label: '线路', type: 'select', options: ['全部', '渝宜', '宜渝', '长航渝宜'] },
  { key: 'policy', label: '政策类别', type: 'select', options: ['全部', '内宾共享', '外宾协议', '内宾团队价'] },
  { key: 'sailDate', label: '开航日期', type: 'date', placeholder: '2021-01-01 - 2021-12-31' },
  { key: 'ship', label: '游轮', type: 'select', options: ['全部', '长江壹号', '长江贰号', '长江叁号', '长江凯号'] },
  { key: 'dealer', label: '组团社', type: 'select', options: ['全部', '宜昌趸多', '销售二分部', '重庆神州'] },
  { key: 'amountType', label: '金额类型', type: 'select', options: ['全部', '船票款', '小费', '地接费'] },
  { key: 'lockStatus', label: '锁铺状态', type: 'select', options: ['全部', '暂存', '已锁定', '已释放'] },
  { key: 'voucherApplyStatus', label: '凭证申请状态', type: 'select', options: ['全部', '未申请凭证', '单证凭证失败'] },
  { key: 'voucherApprovalStatus', label: '凭证审批状态', type: 'select', options: ['全部', '待审核', '审批完成'] },
  { key: 'shareStatus', label: '共享中心状态', type: 'select', options: ['全部', '暂存', '已同步'] },
  { key: 'salesType', label: '销售类型', type: 'select', options: ['全部', '散客', '团队', '补单'] },
  { key: 'invoiceRequired', label: '是否开票', type: 'select', options: ['全部', '是', '否'] },
  { key: 'depositDate', label: '定金时间', type: 'date', placeholder: '请选择' },
  { key: 'sailDeadline', label: '船款时间', type: 'date', placeholder: '请选择' },
  { key: 'miniProgramChannel', label: '小程序来源渠道', type: 'select', options: ['全部', '公众号', '小程序', '旅行社'] },
  { key: 'thirdPartyOrderNo', label: '第三方订单号', type: 'input', placeholder: '请输入' },
  { key: 'orderType', label: '订单类型', type: 'select', options: ['全部', '普通订单', '补差订单'] },
  { key: 'pushTime', label: '推送时间', type: 'date', placeholder: '请选择' },
  { key: 'relatedOrderNo', label: '关联单号', type: 'input', placeholder: '请输入' },
  { key: 'advanceAccount', label: '预定账号', type: 'input', placeholder: '请输入在线搜索' },
  { key: 'salesPerson', label: '分管业务员', type: 'select', options: ['全部', '彭辉', '栾伶伶'] },
]

const primaryFilterKeys = ['keyword', 'orderStatus', 'voyageNo', 'marketCategory', 'sailDate', 'groupName']
const primaryFilterFields = filterFields.filter((field) => primaryFilterKeys.includes(field.key))
const advancedFilterFields = filterFields.filter((field) => !primaryFilterKeys.includes(field.key))

const tableColumns: { key: keyof CruiseOrder | 'actions'; title: string; width: string; render?: (record: CruiseOrder) => ReactNode }[] = [
  { key: 'index', title: '序号', width: '58px' },
  { key: 'history', title: '历史', width: '70px' },
  { key: 'orderNo', title: '订单号', width: '110px' },
  { key: 'groupName', title: '团名', width: '160px', render: (record) => <GroupNameDisplay order={record} compact placement="above" /> },
  { key: 'voyageNo', title: '航次', width: '88px' },
  { key: 'orderStatus', title: '订单状态', width: '96px', render: (record) => <span className={`rounded px-2 py-1 text-xs ${statusColor[record.orderStatus]}`}>{record.orderStatus}</span> },
  { key: 'route', title: '线路', width: '90px' },
  { key: 'ship', title: '游轮', width: '110px' },
  { key: 'sailDate', title: '开船日期', width: '110px' },
  { key: 'marketCategory', title: '市场类别', width: '120px' },
  { key: 'nationality', title: '国籍', width: '80px' },
  { key: 'totalPeople', title: '人数', width: '70px' },
  { key: 'child', title: '儿童', width: '70px' },
  { key: 'infant', title: '婴儿', width: '70px' },
  { key: 'companion', title: '陪同', width: '70px' },
  { key: 'unitPrice', title: '单价', width: '90px' },
  { key: 'receivableTicket', title: '应收船款', width: '100px' },
  { key: 'smallFee', title: '小费', width: '80px' },
  { key: 'localFee', title: '地接', width: '80px' },
  { key: 'combinedProduct', title: '组合产品', width: '90px' },
  { key: 'totalAmount', title: '总价', width: '90px' },
  { key: 'paidAmount', title: '实收总额', width: '100px' },
  { key: 'arrears', title: '欠款', width: '90px' },
  { key: 'depositAmount', title: '定金罚金', width: '100px' },
  { key: 'ticketBalance', title: '船款罚金', width: '100px' },
  { key: 'dealer', title: '组团社', width: '120px' },
  { key: 'remark', title: '备注', width: '120px' },
  { key: 'depositDate', title: '定金日期', width: '110px' },
  { key: 'parentOrderNo', title: '总单号', width: '120px' },
  { key: 'thirdPartyOrderNo', title: '第三方订单号', width: '130px' },
  { key: 'sailDeadline', title: '船款日期', width: '110px' },
  { key: 'bookingTime', title: '预订日期', width: '145px' },
  { key: 'lockValidUntil', title: '锁铺有效期', width: '120px' },
  { key: 'voucherApplyStatus', title: '凭证申请状态', width: '130px' },
  { key: 'voucherApprovalStatus', title: '凭证审批状态', width: '130px' },
  { key: 'shareCenterStatus', title: '共享中心状态', width: '120px' },
  { key: 'pushTime', title: '推送时间', width: '140px' },
  { key: 'invoiceRequired', title: '是否开票', width: '90px' },
  { key: 'miniProgramChannel', title: '小程序来源渠道', width: '140px' },
  { key: 'advanceAccount', title: '预定账号', width: '120px' },
  { key: 'relatedOrderNo', title: '关联单号', width: '120px' },
  { key: 'salesPerson', title: '分管业务员', width: '110px' },
  { key: 'actions', title: '操作', width: '280px' },
]

const amountColumnKeys = new Set<keyof CruiseOrder>([
  'unitPrice',
  'receivableTicket',
  'smallFee',
  'localFee',
  'combinedProduct',
  'totalAmount',
  'paidAmount',
  'arrears',
  'depositAmount',
  'ticketBalance',
])

const numericColumnKeys = new Set<keyof CruiseOrder>([
  'totalPeople',
  'adult',
  'child',
  'infant',
  'companion',
  ...amountColumnKeys,
])

function createEmptyFilters() {
  return Object.fromEntries(filterFields.map((field) => [field.key, ''])) as Record<string, string>
}

function OrderStatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${statusColor[status]}`}>
      {status}
    </span>
  )
}

function formatOrderCellValue(order: CruiseOrder, key: keyof CruiseOrder) {
  const value = order[key]
  if (amountColumnKeys.has(key)) return formatCurrency(Number(value || 0))
  return value === '' || value == null ? '-' : String(value)
}

function getColumnAlign(key: keyof CruiseOrder | 'actions' | 'checkbox') {
  if (key === 'checkbox' || key === 'index' || key === 'actions') return 'center'
  if (numericColumnKeys.has(key as keyof CruiseOrder)) return 'right'
  return 'left'
}

function headerAlignClass(align: 'left' | 'center' | 'right') {
  if (align === 'center') return 'text-center'
  if (align === 'right') return 'text-right'
  return 'text-left'
}

function FilterControl({ field, value, onChange }: { field: (typeof filterFields)[number]; value: string; onChange: (key: string, value: string) => void }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs text-gray-500">{field.label}</span>
      {field.type === 'select' ? (
        <select value={value || '全部'} onChange={(event) => onChange(field.key, event.target.value)} className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-500">
          {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <input type="text" value={value || ''} onChange={(event) => onChange(field.key, event.target.value)} placeholder={field.placeholder} className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500" />
      )}
    </label>
  )
}

function canModifyOrder(order: CruiseOrder) {
  return order.orderStatus !== '取消' && order.orderStatus !== '已完成'
}

export default function OrderListPage() {
  const [orders, setOrders] = useState(() => getOrders())
  const [filters, setFilters] = useState<Record<string, string>>(createEmptyFilters)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [page, setPage] = useState(1)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<CruiseOrder | null>(null)
  const [priceTarget, setPriceTarget] = useState<CruiseOrder | null>(null)
  const [logTarget, setLogTarget] = useState<CruiseOrder | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)

  const detail = useMemo(
    () => (detailId ? orders.find((order) => order.id === detailId) ?? null : null),
    [detailId, orders],
  )

  const filteredOrders = useMemo(() => {
    const keyword = filters.keyword?.trim().toLowerCase()
    return orders.filter((order) => {
      const matchedKeyword = !keyword || order.orderNo.toLowerCase().includes(keyword) || order.parentOrderNo.toLowerCase().includes(keyword)
      const matchedStatus = !filters.orderStatus || filters.orderStatus === '全部' || order.orderStatus === filters.orderStatus
      const matchedMarket = !filters.marketCategory || filters.marketCategory === '全部' || order.marketCategory === filters.marketCategory
      const matchedVoyage = !filters.voyageNo || order.voyageNo.includes(filters.voyageNo)
      const matchedGroup = matchOrderGroupName(order, filters.groupName?.trim() || '')
      return matchedKeyword && matchedStatus && matchedMarket && matchedVoyage && matchedGroup
    })
  }, [filters])

  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize))
  const pagedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize)

  const updateFilter = (key: string, value: string) => setFilters((prev) => ({ ...prev, [key]: value }))
  const resetFilters = () => {
    setFilters(createEmptyFilters())
    setPage(1)
  }

  const refreshOrders = () => setOrders(getOrders())

  const handleEditSubmit = async (form: OrderEditForm) => {
    if (!editTarget) return
    setDialogLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    const changes = diffEditFormChanges(orderToEditForm(editTarget), form)
    updateOrder(editTarget.id, form)
    if (changes.length > 0) {
      const updated = getOrders().find((item) => item.id === editTarget.id) ?? editTarget
      appendOrderLog(appendOrderLogFromOrder(updated, {
        action: '编辑订单',
        operator: ORDER_LOG_OPERATOR,
        operatedAt: nowLogTime(),
        changes,
      }))
    }
    refreshOrders()
    setDialogLoading(false)
    setEditTarget(null)
    window.alert(`订单 ${editTarget.orderNo} 已保存`)
  }

  const handlePriceSubmit = async (form: OrderPriceChangeForm) => {
    if (!priceTarget) return
    setDialogLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    const changes = buildPriceChangeLogs(priceTarget, form)
    const patch = syncOrderFromFeeItems(priceTarget, form.feeItems, {
      unitPrice: form.unitPrice,
      reason: form.reason,
    })
    updateOrder(priceTarget.id, patch)
    if (changes.length > 0) {
      const saved = getOrders().find((item) => item.id === priceTarget.id) ?? { ...priceTarget, ...patch }
      appendOrderLog(appendOrderLogFromOrder(saved, {
        action: '改价',
        operator: ORDER_LOG_OPERATOR,
        operatedAt: nowLogTime(),
        changes,
      }))
    }
    refreshOrders()
    setDialogLoading(false)
    const diff = form.totalAmount - priceTarget.totalAmount
    setPriceTarget(null)
    if (diff > 0) {
      window.alert(`改价完成。订单总额增加 ${formatCurrency(diff)}，请视情况生成补款单。`)
    } else if (diff < 0) {
      window.alert(`改价完成。订单总额减少 ${formatCurrency(Math.abs(diff))}，如有多收请走退款流程。`)
    } else {
      window.alert('改价完成。')
    }
  }

  if (logTarget) {
    return (
      <div className="space-y-5">
        <PageHeader title="订单历史">
          <button onClick={() => setLogTarget(null)} className="inline-flex h-11 items-center gap-2 rounded-md border border-gray-300 bg-white px-5 text-base text-gray-600 transition hover:bg-gray-50">
            <ChevronLeft className="h-4 w-4" />
            返回列表
          </button>
        </PageHeader>
        <OrderHistoryPanel order={logTarget} />
      </div>
    )
  }

  if (detail) {
    return (
      <div className="space-y-5">
        <PageHeader title="订单详情">
          <button onClick={() => setDetailId(null)} className="inline-flex h-11 items-center gap-2 rounded-md border border-gray-300 bg-white px-5 text-base text-gray-600 transition hover:bg-gray-50">
            <ChevronLeft className="h-4 w-4" />
            返回列表
          </button>
        </PageHeader>
        <OrderDetailPanel
          order={detail}
          onOrderChange={(updated) => {
            updateOrder(updated.id, updated)
            setOrders(getOrders())
          }}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="订单管理" />

      <div className="border-b border-gray-200 bg-white px-9 py-6">
        <div className="flex items-start gap-6">
          <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-3 2xl:grid-cols-6">
            {primaryFilterFields.map((field) => (
              <FilterControl key={field.key} field={field} value={filters[field.key]} onChange={updateFilter} />
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-3 pt-[22px]">
            <button onClick={() => setPage(1)} className="inline-flex h-11 min-w-[90px] items-center justify-center gap-2 rounded-md bg-blue-600 px-6 text-base font-medium text-white transition hover:bg-blue-700">
              <Search className="h-4 w-4" />
              搜索
            </button>
            <button onClick={resetFilters} className="inline-flex h-11 min-w-[90px] items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-6 text-base text-gray-600 transition hover:bg-gray-50">
              <RotateCcw className="h-4 w-4" />
              重置
            </button>
            <button
              type="button"
              onClick={() => setFiltersExpanded((prev) => !prev)}
              className="inline-flex h-11 min-w-[128px] items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-base text-gray-600 transition hover:bg-gray-50"
            >
              {filtersExpanded ? '收起高级' : `高级筛选(${advancedFilterFields.length})`}
              <ChevronDown className={`h-4 w-4 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {filtersExpanded && (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">高级筛选</span>
              <span className="text-xs text-gray-400">低频条件默认收起，避免影响订单检索效率</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4 2xl:grid-cols-6">
              {advancedFilterFields.map((field) => (
                <FilterControl key={field.key} field={field} value={filters[field.key]} onChange={updateFilter} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="overflow-hidden border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[4200px] border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="sticky top-0 z-10 w-10 border-b border-r border-gray-200 bg-gray-50 px-3 py-3 text-center align-middle">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                {tableColumns.map((column) => {
                  const align = getColumnAlign(column.key)
                  return (
                    <th
                      key={column.key}
                      style={{ width: column.width, minWidth: column.width }}
                      className={`sticky top-0 z-10 border-b border-r border-gray-200 bg-gray-50 px-3 py-3 align-middle text-xs font-medium text-gray-500 last:border-r-0 ${headerAlignClass(align)}`}
                    >
                      <span className="whitespace-nowrap">{column.title}</span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {pagedOrders.map((order) => (
                <tr key={order.id} className="transition hover:bg-gray-50">
                  <td className="border-b border-r border-gray-200 px-3 py-3 text-center align-middle">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </td>
                  {tableColumns.map((column) => {
                    const align = getColumnAlign(column.key)
                    return (
                    <td
                      key={column.key}
                      className={`border-b border-r border-gray-200 px-3 py-3 text-sm text-gray-700 last:border-r-0 ${column.key === 'groupName' ? 'whitespace-normal' : 'whitespace-nowrap'} ${headerAlignClass(align)} ${numericColumnKeys.has(column.key as keyof CruiseOrder) ? 'tabular-nums' : ''}`}
                    >
                      {column.key === 'actions' ? (
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailId(order.id)}
                            className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                          >
                            详情
                          </button>
                          <button
                            type="button"
                            disabled={!canModifyOrder(order)}
                            onClick={() => setEditTarget(order)}
                            className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-gray-300"
                          >
                            编辑订单
                          </button>
                          <button
                            type="button"
                            disabled={!canModifyOrder(order)}
                            onClick={() => setPriceTarget(order)}
                            className="rounded px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 disabled:cursor-not-allowed disabled:text-gray-300"
                          >
                            改价
                          </button>
                        </div>
                      ) : column.key === 'history' ? (
                        <button
                          type="button"
                          onClick={() => setLogTarget(order)}
                          className="text-blue-600 underline hover:text-blue-800"
                        >
                          {order.history}
                        </button>
                      ) : column.key === 'orderNo' ? (
                        <button onClick={() => setDetailId(order.id)} className="font-mono text-blue-700 underline underline-offset-2 hover:text-blue-900">
                          {order.orderNo}
                        </button>
                      ) : column.render ? (
                        column.render(order)
                      ) : (
                        formatOrderCellValue(order, column.key)
                      )}
                    </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 px-9 py-10 text-gray-500">
          <span className="text-[15px]">共 {filteredOrders.length} 条记录 第 {page} / {totalPages} 页</span>
          <div className="flex items-center gap-4">
            <button disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))} className="flex h-12 min-w-[72px] items-center justify-center rounded border border-gray-200 bg-white px-4 text-sm transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40">上一页</button>
            <button className="flex h-12 w-12 items-center justify-center rounded border border-blue-600 bg-blue-600 text-lg text-white">{page}</button>
            <button disabled={page >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} className="flex h-12 min-w-[72px] items-center justify-center rounded border border-gray-200 bg-white px-4 text-sm transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40">下一页</button>
            <button type="button" className="flex h-12 min-w-[110px] items-center justify-center rounded border border-gray-200 bg-white px-4 text-lg text-gray-500">10条/页</button>
          </div>
        </div>
      </div>

      <OrderEditDialog
        open={!!editTarget}
        order={editTarget}
        loading={dialogLoading}
        onCancel={() => setEditTarget(null)}
        onSubmit={handleEditSubmit}
      />

      <OrderPriceChangeDialog
        open={!!priceTarget}
        order={priceTarget}
        loading={dialogLoading}
        onCancel={() => setPriceTarget(null)}
        onSubmit={handlePriceSubmit}
      />
    </div>
  )
}
