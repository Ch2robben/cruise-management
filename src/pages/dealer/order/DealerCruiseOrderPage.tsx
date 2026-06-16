import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronLeft, RotateCcw, Search } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import { formatCurrency } from '@/utils/format'

type OrderStatus = '取消' | '船款确认' | '已预订' | '已完成'

interface CruiseOrder {
  id: string
  index: number
  history: string
  orderNo: string
  groupName: string
  voyageNo: string
  orderStatus: OrderStatus
  route: string
  ship: string
  sailDate: string
  marketCategory: string
  nationality: string
  totalPeople: number
  adult: number
  child: number
  infant: number
  companion: number
  unitPrice: number
  receivableTicket: number
  smallFee: number
  localFee: number
  combinedProduct: number
  totalAmount: number
  paidAmount: number
  arrears: number
  depositAmount: number
  ticketBalance: number
  dealer: string
  remark: string
  depositDate: string
  parentOrderNo: string
  thirdPartyOrderNo: string
  sailDeadline: string
  bookingTime: string
  lockValidUntil: string
  voucherApplyStatus: string
  voucherApprovalStatus: string
  shareCenterStatus: string
  pushTime: string
  invoiceRequired: string
  miniProgramChannel: string
  advanceAccount: string
  relatedOrderNo: string
  salesPerson: string
  voyageDays: number
  departurePort: string
  arrivalPort: string
  transitPort: string
  supplier: string
  policyName: string
  line: string
  voyageStatus: string
  salesType: string
  orderType: string
  amountType: string
  roomType: string
  ageGroup: string
  occupancyType: string
  priceCoefficient: number
  contactName: string
  contactPhone: string
  fixedPhone: string
  fax: string
  email: string
  leaveMessage: string
}

const statusColor: Record<OrderStatus, string> = {
  取消: 'bg-red-100 text-red-700',
  船款确认: 'bg-blue-100 text-blue-700',
  已预订: 'bg-green-100 text-green-700',
  已完成: 'bg-gray-100 text-gray-600',
}

const orders: CruiseOrder[] = [
  {
    id: '1',
    index: 1,
    history: '历史',
    orderNo: '0000000H',
    groupName: 'ycwd20211007x',
    voyageNo: '212101',
    orderStatus: '取消',
    route: '渝宜',
    ship: '长江壹号',
    sailDate: '2021-09-30',
    marketCategory: '内宾-巫山县',
    nationality: '中国',
    totalPeople: 1,
    adult: 1,
    child: 0,
    infant: 0,
    companion: 0,
    unitPrice: 2300,
    receivableTicket: 2300,
    smallFee: 0,
    localFee: 0,
    combinedProduct: 0,
    totalAmount: 2300,
    paidAmount: 0,
    arrears: 2300,
    depositAmount: 0,
    ticketBalance: 0,
    dealer: '宜昌趸多',
    remark: '',
    depositDate: '',
    parentOrderNo: 'S0000000H',
    thirdPartyOrderNo: '',
    sailDeadline: '2021-09-27',
    bookingTime: '2021-10-08 17:41',
    lockValidUntil: '',
    voucherApplyStatus: '未申请凭证',
    voucherApprovalStatus: '待审核',
    shareCenterStatus: '暂存',
    pushTime: '',
    invoiceRequired: '否',
    miniProgramChannel: '',
    advanceAccount: '邓浪',
    relatedOrderNo: '',
    salesPerson: '彭辉',
    voyageDays: 4,
    departurePort: '重庆',
    arrivalPort: '宜昌',
    transitPort: '丰都-巫山',
    supplier: '重庆长江轮船有限公司',
    policyName: '内宾共享',
    line: '渝宜',
    voyageStatus: '开放',
    salesType: '散客',
    orderType: '普通订单',
    amountType: '船票款',
    roomType: '标准间',
    ageGroup: '成人',
    occupancyType: '正常',
    priceCoefficient: 1,
    contactName: '邓浪',
    contactPhone: '13871222817',
    fixedPhone: '',
    fax: '',
    email: '',
    leaveMessage: '是',
  },
  {
    id: '2',
    index: 2,
    history: '历史',
    orderNo: '0000000C',
    groupName: '补单2人',
    voyageNo: '211901',
    orderStatus: '取消',
    route: '渝宜',
    ship: '长江叁号',
    sailDate: '2021-10-02',
    marketCategory: '内宾-奉节县',
    nationality: '中国',
    totalPeople: 2,
    adult: 2,
    child: 0,
    infant: 0,
    companion: 0,
    unitPrice: 2300,
    receivableTicket: 4600,
    smallFee: 0,
    localFee: 0,
    combinedProduct: 0,
    totalAmount: 4600,
    paidAmount: 0,
    arrears: 4600,
    depositAmount: 0,
    ticketBalance: 0,
    dealer: '宜昌趸多',
    remark: '',
    depositDate: '',
    parentOrderNo: 'S0000000C',
    thirdPartyOrderNo: '',
    sailDeadline: '2021-09-29',
    bookingTime: '2021-10-08 16:01',
    lockValidUntil: '',
    voucherApplyStatus: '未申请凭证',
    voucherApprovalStatus: '待审核',
    shareCenterStatus: '暂存',
    pushTime: '',
    invoiceRequired: '否',
    miniProgramChannel: '',
    advanceAccount: '彭彬',
    relatedOrderNo: '',
    salesPerson: '彭辉',
    voyageDays: 4,
    departurePort: '重庆',
    arrivalPort: '宜昌',
    transitPort: '丰都-巫山',
    supplier: '重庆长江轮船有限公司',
    policyName: '内宾共享',
    line: '渝宜',
    voyageStatus: '开放',
    salesType: '补单',
    orderType: '普通订单',
    amountType: '船票款',
    roomType: '标准间',
    ageGroup: '成人',
    occupancyType: '正常',
    priceCoefficient: 1,
    contactName: '彭彬',
    contactPhone: '13800001111',
    fixedPhone: '',
    fax: '',
    email: 'demo@example.com',
    leaveMessage: '否',
  },
  {
    id: '3',
    index: 3,
    history: '历史',
    orderNo: '0000003K',
    groupName: '销售二分部1003S16入住行政房1',
    voyageNo: '212102',
    orderStatus: '取消',
    route: '宜渝',
    ship: '长江贰号',
    sailDate: '2021-10-03',
    marketCategory: '外宾-日本',
    nationality: '阿富汗',
    totalPeople: 16,
    adult: 16,
    child: 0,
    infant: 0,
    companion: 1,
    unitPrice: 2204.16,
    receivableTicket: 52900,
    smallFee: 0,
    localFee: 0,
    combinedProduct: 0,
    totalAmount: 52900,
    paidAmount: 0,
    arrears: 52900,
    depositAmount: 100,
    ticketBalance: 100,
    dealer: '销售二分部',
    remark: '',
    depositDate: '',
    parentOrderNo: 'S000003K',
    thirdPartyOrderNo: '',
    sailDeadline: '2021-09-12',
    bookingTime: '2021-11-08 15:55',
    lockValidUntil: '',
    voucherApplyStatus: '单证凭证失败',
    voucherApprovalStatus: '审批完成',
    shareCenterStatus: '暂存',
    pushTime: '2022-03-18 10:29',
    invoiceRequired: '否',
    miniProgramChannel: '',
    advanceAccount: '章莹',
    relatedOrderNo: '',
    salesPerson: '彭辉',
    voyageDays: 4,
    departurePort: '宜昌',
    arrivalPort: '重庆',
    transitPort: '奉节-丰都',
    supplier: '重庆长江轮船有限公司',
    policyName: '外宾协议',
    line: '宜渝',
    voyageStatus: '开放',
    salesType: '团队',
    orderType: '普通订单',
    amountType: '船票款',
    roomType: '行政房',
    ageGroup: '成人',
    occupancyType: '正常',
    priceCoefficient: 1,
    contactName: '章莹',
    contactPhone: '13900002222',
    fixedPhone: '',
    fax: '',
    email: '',
    leaveMessage: '是',
  },
  {
    id: '4',
    index: 4,
    history: '历史',
    orderNo: '00000001',
    groupName: '123456789',
    voyageNo: '212103',
    orderStatus: '取消',
    route: '长航渝宜',
    ship: '长江凯号',
    sailDate: '2021-10-07',
    marketCategory: '内宾-云阳县',
    nationality: '中国',
    totalPeople: 10,
    adult: 10,
    child: 0,
    infant: 0,
    companion: 0,
    unitPrice: 2050,
    receivableTicket: 19885,
    smallFee: 0,
    localFee: 0,
    combinedProduct: 0,
    totalAmount: 19885,
    paidAmount: 0,
    arrears: 19885,
    depositAmount: 0,
    ticketBalance: 0,
    dealer: '重庆神州',
    remark: '',
    depositDate: '2021-10-02',
    parentOrderNo: 'S00000001',
    thirdPartyOrderNo: '',
    sailDeadline: '2021-10-04',
    bookingTime: '2021-09-29 14:48',
    lockValidUntil: '',
    voucherApplyStatus: '未申请凭证',
    voucherApprovalStatus: '待审核',
    shareCenterStatus: '暂存',
    pushTime: '',
    invoiceRequired: '否',
    miniProgramChannel: '',
    advanceAccount: 'CHW38000C',
    relatedOrderNo: '',
    salesPerson: '栾伶伶',
    voyageDays: 4,
    departurePort: '重庆',
    arrivalPort: '宜昌',
    transitPort: '丰都-巫山',
    supplier: '重庆长江轮船有限公司',
    policyName: '内宾团队价',
    line: '长航渝宜',
    voyageStatus: '开放',
    salesType: '团队',
    orderType: '普通订单',
    amountType: '船票款',
    roomType: '标准间',
    ageGroup: '成人',
    occupancyType: '正常',
    priceCoefficient: 1,
    contactName: '张经理',
    contactPhone: '13600003333',
    fixedPhone: '023-88888888',
    fax: '',
    email: '',
    leaveMessage: '否',
  },
]

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
  { key: 'history', title: '历史', width: '70px', render: (record) => <span className="text-blue-600 underline">{record.history}</span> },
  { key: 'orderNo', title: '订单号', width: '110px' },
  { key: 'groupName', title: '团名', width: '160px' },
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
  { key: 'actions', title: '操作', width: '110px' },
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

function formatOrderCellValue(order: CruiseOrder, key: keyof CruiseOrder) {
  const value = order[key]
  if (amountColumnKeys.has(key)) return formatCurrency(Number(value || 0))
  return value === '' || value == null ? '-' : String(value)
}

function renderHeaderTitle(title: string) {
  if (title === '序号') {
    return (
      <>
        序<br />号
      </>
    )
  }
  return title
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

function RoomPriceTable({ order }: { order: CruiseOrder }) {
  const rows = [
    {
      roomType: order.roomType,
      ageGroup: order.ageGroup,
      occupancyType: order.occupancyType,
      coefficient: order.priceCoefficient,
      price: order.unitPrice,
      people: order.totalPeople,
      subtotal: order.receivableTicket,
    },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">房型</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">年龄段</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">入住类型</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">价格系数</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">结算价</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">人数</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">小计</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={`${row.roomType}-${row.ageGroup}`}>
              <td className="px-4 py-3 text-gray-700">{row.roomType}</td>
              <td className="px-4 py-3 text-gray-700">{row.ageGroup}</td>
              <td className="px-4 py-3 text-gray-700">{row.occupancyType}</td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-700">{row.coefficient}</td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-700">{formatCurrency(row.price)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-700">{row.people}</td>
              <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">{formatCurrency(row.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
    ['8', '小费', '-', order.smallFee, order.smallFee],
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

export default function DealerCruiseOrderPage() {
  const [filters, setFilters] = useState<Record<string, string>>(createEmptyFilters)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<CruiseOrder | null>(null)

  const filteredOrders = useMemo(() => {
    const keyword = filters.keyword?.trim().toLowerCase()
    return orders.filter((order) => {
      const matchedKeyword = !keyword || order.orderNo.toLowerCase().includes(keyword) || order.parentOrderNo.toLowerCase().includes(keyword)
      const matchedStatus = !filters.orderStatus || filters.orderStatus === '全部' || order.orderStatus === filters.orderStatus
      const matchedMarket = !filters.marketCategory || filters.marketCategory === '全部' || order.marketCategory === filters.marketCategory
      const matchedVoyage = !filters.voyageNo || order.voyageNo.includes(filters.voyageNo)
      const matchedGroup = !filters.groupName || order.groupName.includes(filters.groupName)
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

  if (detail) {
    return (
      <div className="space-y-5">
        <PageHeader title="订单详情">
          <button onClick={() => setDetail(null)} className="inline-flex h-11 items-center gap-2 rounded-md border border-gray-300 bg-white px-5 text-base text-gray-600 transition hover:bg-gray-50">
            <ChevronLeft className="h-4 w-4" />
            返回列表
          </button>
        </PageHeader>
        <div className="border border-gray-200 bg-white px-9 py-6">
          <div className="mb-4 text-sm text-blue-600">订单管理 / 订单详情</div>
          <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            特别提示：订单变更后如遇紧急情况（航次停航、变更等）客服人员会及时与您电话联系。
          </p>

          <DetailSection title="订单概览" className="mb-5">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <MetricItem label="订单状态" value={<OrderStatusPill status={detail.orderStatus} />} />
              <MetricItem label="订单总额" value={formatCurrency(detail.totalAmount)} highlight />
              <MetricItem label="实收总额" value={formatCurrency(detail.paidAmount)} />
              <MetricItem label="欠款" value={formatCurrency(detail.arrears)} />
              <MetricItem label="总人数" value={`${detail.totalPeople} 人`} />
            </div>
          </DetailSection>

          <div className="grid gap-5 xl:grid-cols-2">
            <DetailSection title="订单信息">
              <FieldGrid>
                <FieldItem label="订单号" value={detail.orderNo} mono />
                <FieldItem label="总单号" value={detail.parentOrderNo} mono />
                <FieldItem label="第三方订单号" value={detail.thirdPartyOrderNo || '-'} mono />
                <FieldItem label="预订时间" value={detail.bookingTime} />
                <FieldItem label="订单类型" value={detail.orderType} />
                <FieldItem label="分管业务员" value={detail.salesPerson} />
              </FieldGrid>
            </DetailSection>

            <DetailSection title="游轮产品信息">
              <FieldGrid>
                <FieldItem label="游轮" value={detail.ship} />
                <FieldItem label="航次号" value={detail.voyageNo} mono />
                <FieldItem label="航线" value={detail.line} />
                <FieldItem label="开船日期" value={detail.sailDate} />
                <FieldItem label="行程天数" value={`${detail.voyageDays} 天`} />
                <FieldItem label="供应商" value={detail.supplier} />
              </FieldGrid>
            </DetailSection>

            <DetailSection title="港口与行程">
              <FieldGrid>
                <FieldItem label="出发港" value={detail.departurePort} />
                <FieldItem label="终到港" value={detail.arrivalPort} />
                <FieldItem label="途经港" value={detail.transitPort} />
                <FieldItem label="线路" value={detail.route} />
                <FieldItem label="航次状态" value={detail.voyageStatus} />
                <FieldItem label="船款日期" value={detail.sailDeadline} />
              </FieldGrid>
            </DetailSection>

            <DetailSection title="组团社及政策">
              <FieldGrid>
                <FieldItem label="组团社" value={detail.dealer} />
                <FieldItem label="组团社用户" value={detail.advanceAccount} />
                <FieldItem label="价格政策" value={detail.policyName} />
                <FieldItem label="市场类别" value={detail.marketCategory} />
                <FieldItem label="国籍" value={detail.nationality} />
                <FieldItem label="销售类型" value={detail.salesType} />
              </FieldGrid>
            </DetailSection>

            <DetailSection title="人数信息">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <MetricItem label="总人数" value={detail.totalPeople} />
                <MetricItem label="成人" value={detail.adult} />
                <MetricItem label="儿童" value={detail.child} />
                <MetricItem label="婴儿" value={detail.infant} />
                <MetricItem label="陪同" value={detail.companion} />
                <MetricItem label="16免1数" value={0} />
              </div>
            </DetailSection>

            <DetailSection title="凭证与共享状态">
              <FieldGrid>
                <FieldItem label="凭证申请" value={detail.voucherApplyStatus} />
                <FieldItem label="凭证审批" value={detail.voucherApprovalStatus} />
                <FieldItem label="共享中心" value={detail.shareCenterStatus} />
                <FieldItem label="推送时间" value={detail.pushTime || '-'} />
                <FieldItem label="是否开票" value={detail.invoiceRequired} />
                <FieldItem label="预定账号" value={detail.advanceAccount} />
              </FieldGrid>
            </DetailSection>
          </div>

          <DetailSection title="费用信息" className="mt-5">
            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricItem label="应收船款" value={formatCurrency(detail.receivableTicket)} highlight />
              <MetricItem label="小费" value={formatCurrency(detail.smallFee)} />
              <MetricItem label="地接费" value={formatCurrency(detail.localFee)} />
              <MetricItem label="组合产品" value={formatCurrency(detail.combinedProduct)} />
            </div>
            <RoomPriceTable order={detail} />
            <div className="mt-4">
              <AmountTable order={detail} />
            </div>
          </DetailSection>

          <DetailSection title="联系人信息" className="mt-5">
            <FieldGrid columns={3}>
              <FieldItem label="团队名称" value={detail.groupName} />
              <FieldItem label="联系人" value={detail.contactName} />
              <FieldItem label="手机号" value={detail.contactPhone} />
              <FieldItem label="固定电话" value={detail.fixedPhone || '-'} />
              <FieldItem label="传真" value={detail.fax || '-'} />
              <FieldItem label="Email" value={detail.email || '-'} />
              <FieldItem label="是否留言" value={detail.leaveMessage} />
              <FieldItem label="特殊要求" value="-" />
            </FieldGrid>
            <div className="mt-4 overflow-x-auto rounded-lg bg-white">
              <table className="w-full min-w-[780px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {['陪同', '姓名', '证件类型', '证件号', '手机号', '是否转运'].map((item) => <th key={item} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{item}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
                </tbody>
              </table>
            </div>
          </DetailSection>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="游轮订单" />

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
                <th className="h-[72px] w-10 border-b border-r border-gray-200 bg-gray-50 px-3 text-center align-middle"><input type="checkbox" /></th>
                {tableColumns.map((column) => (
                  <th
                    key={column.key}
                    style={{ width: column.width }}
                    className="h-[72px] border-b border-r border-gray-200 bg-gray-50 px-4 text-center align-middle text-[18px] font-semibold leading-[1.15] text-gray-900 last:border-r-0"
                  >
                    <span className="inline-block whitespace-normal">{renderHeaderTitle(column.title)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedOrders.map((order) => (
                <tr key={order.id} className="transition hover:bg-gray-50">
                  <td className="border-b border-r border-gray-200 px-4 py-5 text-center"><input type="checkbox" /></td>
                  {tableColumns.map((column) => (
                    <td
                      key={column.key}
                      className={`whitespace-nowrap border-b border-r border-gray-200 px-4 py-5 text-sm text-gray-700 last:border-r-0 ${numericColumnKeys.has(column.key as keyof CruiseOrder) ? 'text-right tabular-nums' : ''}`}
                    >
                      {column.key === 'actions' ? (
                        <button onClick={() => setDetail(order)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">详情</button>
                      ) : column.key === 'orderNo' ? (
                        <button onClick={() => setDetail(order)} className="font-mono text-blue-700 underline underline-offset-2 hover:text-blue-900">
                          {order.orderNo}
                        </button>
                      ) : column.render ? (
                        column.render(order)
                      ) : (
                        formatOrderCellValue(order, column.key)
                      )}
                    </td>
                  ))}
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
    </div>
  )
}
