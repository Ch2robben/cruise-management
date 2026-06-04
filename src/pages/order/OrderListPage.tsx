import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronLeft, Eye, RotateCcw, Search } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'

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

const tableColumns: { key: keyof CruiseOrder | 'actions'; title: string; width: string; render?: (record: CruiseOrder) => ReactNode }[] = [
  { key: 'index', title: '序号', width: '58px' },
  { key: 'history', title: '历史', width: '70px', render: (record) => <span className="text-blue-600 underline">{record.history}</span> },
  { key: 'orderNo', title: '订单号', width: '110px', render: (record) => <span className="font-mono text-blue-700 underline">{record.orderNo}</span> },
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

function createEmptyFilters() {
  return Object.fromEntries(filterFields.map((field) => [field.key, ''])) as Record<string, string>
}

function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-4 text-base font-semibold text-gray-900">{title}</h3>
      {children}
    </section>
  )
}

function SimpleTable({ rows }: { rows: { label: string; value: ReactNode }[][] }) {
  return (
    <div className="overflow-hidden border border-gray-200">
      <table className="w-full table-fixed text-sm">
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((item) => (
                <td key={item.label} className="border-b border-r border-gray-200 last:border-r-0">
                  <div className="bg-gray-50 px-3 py-2 text-center text-gray-500">{item.label}</div>
                  <div className="min-h-11 px-3 py-3 text-center text-gray-700">{item.value || '-'}</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AmountTable({ order }: { order: CruiseOrder }) {
  const rows = [
    ['1', '定金', '', '0.00', '0.00'],
    ['2', '船票尾款', '', '', order.receivableTicket.toFixed(2)],
    ['3', '陪同款', '', '', '0.00'],
    ['4', '船票总款', '', '', order.receivableTicket.toFixed(2)],
    ['5', '升舱费', '', '', '0.00'],
    ['6', '地接费', '', '', order.localFee.toFixed(2)],
    ['7', '罚金', '', '', order.depositAmount.toFixed(2)],
    ['8', '小费', '', order.smallFee.toFixed(2), order.smallFee.toFixed(2)],
    ['9', '组合产品', '', '', order.combinedProduct.toFixed(2)],
    ['10', '其他', '', '', '0.00'],
    ['11', '结算总价', '', '', order.totalAmount.toFixed(2)],
  ]
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-50">
            {['序号', '名称', '系数', '单价', '总价'].map((item) => <th key={item} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-600">{item}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, index) => <td key={`${row[0]}-${index}`} className="border border-gray-300 px-3 py-2 text-center text-gray-700">{cell || '-'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function OrderListPage() {
  const [filters, setFilters] = useState<Record<string, string>>(createEmptyFilters)
  const [filtersExpanded, setFiltersExpanded] = useState(true)
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
  const visibleFilterFields = filtersExpanded ? filterFields : filterFields.slice(0, 4)

  const updateFilter = (key: string, value: string) => setFilters((prev) => ({ ...prev, [key]: value }))
  const resetFilters = () => {
    setFilters(createEmptyFilters())
    setPage(1)
  }

  if (detail) {
    return (
      <div className="space-y-5">
        <PageHeader title="订单详情">
          <button onClick={() => setDetail(null)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700 hover:bg-gray-50">
            <ChevronLeft className="h-4 w-4" />
            返回列表
          </button>
        </PageHeader>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="mb-4 text-sm text-blue-600">订单管理 / 订单详情</div>
          <div className="space-y-5">
            <InfoSection title="订单信息">
              <p className="mb-3 text-sm text-red-500">特别提示：订单变更后如遇紧急情况（航次停航、变更等）客服人员会及时与您电话联系</p>
              <SimpleTable rows={[[{ label: '订单号', value: detail.orderNo }, { label: '预定时间', value: detail.bookingTime }, { label: '订单状态', value: detail.orderStatus }]]} />
            </InfoSection>

            <InfoSection title="游轮产品信息">
              <SimpleTable rows={[
                [{ label: '游轮', value: detail.ship }, { label: '旅游天数', value: `${detail.voyageDays}` }, { label: '航次号', value: detail.voyageNo }, { label: '出发日期', value: detail.sailDate }, { label: '终到日期', value: '2021/10/03' }, { label: '开航时间', value: `${detail.sailDate} 21:00:00` }],
                [{ label: '出发港', value: detail.departurePort }, { label: '终到港', value: detail.arrivalPort }, { label: '途经港', value: detail.transitPort }, { label: '供应商', value: detail.supplier }],
              ]} />
            </InfoSection>

            <InfoSection title="组团社及政策">
              <SimpleTable rows={[[{ label: '组团社', value: detail.dealer }, { label: '组团社用户', value: detail.advanceAccount }, { label: '价格政策', value: detail.policyName }, { label: '市场类别', value: detail.marketCategory }, { label: '国籍', value: detail.nationality }]]} />
            </InfoSection>

            <InfoSection title="人数信息">
              <SimpleTable rows={[[{ label: '总人数', value: detail.totalPeople }, { label: '成人', value: detail.adult }, { label: '儿童', value: detail.child }, { label: '婴儿', value: detail.infant }, { label: '16免1数', value: 0 }, { label: '陪同', value: detail.companion }]]} />
            </InfoSection>

            <InfoSection title="费用信息">
              <SimpleTable rows={[[{ label: '定金单价', value: '0元/床位' }, { label: '定金总额', value: '0元' }, { label: '定金时限', value: '-' }, { label: '小费单价', value: `${detail.smallFee || 150}元/人` }, { label: '小费总额', value: `${detail.smallFee}元` }, { label: '船款时限', value: detail.sailDeadline }]]} />
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[920px] border border-gray-300 text-sm">
                  <thead><tr className="bg-gray-50">{['房型', '年龄段', '入住类型', '价格系数', '结算价', '人数', '小计'].map((item) => <th key={item} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-600">{item}</th>)}</tr></thead>
                  <tbody><tr>{[detail.roomType, detail.ageGroup, detail.occupancyType, detail.priceCoefficient, detail.unitPrice, detail.totalPeople, `${detail.receivableTicket}元`].map((item, index) => <td key={index} className="border border-gray-300 px-3 py-2 text-center text-gray-700">{item}</td>)}</tr></tbody>
                </table>
              </div>
              <div className="mt-4"><AmountTable order={detail} /></div>
            </InfoSection>

            <InfoSection title="联系人信息">
              <SimpleTable rows={[
                [{ label: '团队名称', value: detail.groupName }, { label: '陪同数', value: detail.companion }, { label: '陪同款', value: '0元' }, { label: '联系人姓名', value: detail.contactName }, { label: '手机号', value: detail.contactPhone }, { label: '固定电话', value: detail.fixedPhone }],
                [{ label: '传真', value: detail.fax }, { label: 'Email', value: detail.email }, { label: '是否留言', value: detail.leaveMessage }, { label: '联系人', value: detail.contactName }, { label: '回复方式', value: '-' }, { label: '特殊要求', value: '-' }],
              ]} />
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[780px] border border-gray-300 text-sm">
                  <thead><tr className="bg-gray-50">{['陪同', '姓名', '证件类型', '证件号', '手机号', '是否转运'].map((item) => <th key={item} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-600">{item}</th>)}</tr></thead>
                  <tbody><tr><td colSpan={6} className="border border-gray-300 px-3 py-6 text-center text-gray-400">暂无数据</td></tr></tbody>
                </table>
              </div>
            </InfoSection>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="订单管理" />

      <div className="mb-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="grid grid-cols-1 gap-x-10 gap-y-3 md:grid-cols-2 xl:grid-cols-4">
          {visibleFilterFields.map((field) => (
            <label key={field.key} className="grid grid-cols-[108px_1fr] items-center gap-3 text-sm">
              <span className="text-right text-gray-600">{field.label}：</span>
              {field.type === 'select' ? (
                <select value={filters[field.key] || '全部'} onChange={(event) => updateFilter(field.key, event.target.value)} className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-500">
                  {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : (
                <input type={field.type === 'date' ? 'text' : 'text'} value={filters[field.key] || ''} onChange={(event) => updateFilter(field.key, event.target.value)} placeholder={field.placeholder} className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-700 outline-none focus:border-blue-500" />
              )}
            </label>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setPage(1)} className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700">
              <Search className="h-4 w-4" />
              查询
            </button>
            <button onClick={resetFilters} className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-300 bg-white px-5 text-sm text-gray-700 hover:bg-gray-50">
              <RotateCcw className="h-4 w-4" />
              重置
            </button>
          </div>
          <button
            type="button"
            onClick={() => setFiltersExpanded((prev) => !prev)}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 text-sm font-medium text-blue-700 hover:bg-blue-100"
          >
            {filtersExpanded ? '收起筛选' : `展开筛选（${filterFields.length - visibleFilterFields.length}项）`}
            <ChevronDown className={`h-4 w-4 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-[4200px] border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="w-10 border border-gray-200 px-2 py-3 text-center"><input type="checkbox" /></th>
                {tableColumns.map((column) => (
                  <th key={column.key} style={{ width: column.width }} className="border border-gray-200 px-3 py-3 text-left text-xs font-semibold text-gray-700">{column.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-blue-50/40">
                  <td className="border border-gray-200 px-2 py-3 text-center"><input type="checkbox" /></td>
                  {tableColumns.map((column) => (
                    <td key={column.key} className="border border-gray-200 px-3 py-3 text-gray-700">
                      {column.key === 'actions' ? (
                        <button onClick={() => setDetail(order)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                          操作
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      ) : column.render ? (
                        column.render(order)
                      ) : (
                        String(order[column.key] || '-')
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-4 text-sm text-gray-500">
          <span>共 {filteredOrders.length} 条记录 第 {page} / {totalPages} 页</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))} className="rounded border border-gray-300 px-3 py-1.5 disabled:opacity-40">上一页</button>
            <button className="rounded bg-blue-600 px-3 py-1.5 text-white">{page}</button>
            <button disabled={page >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} className="rounded border border-gray-300 px-3 py-1.5 disabled:opacity-40">下一页</button>
            <span className="rounded border border-gray-300 px-3 py-1.5">10条/页</span>
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-400">
        Demo 操作说明：点击任意行右侧“操作”按钮查看订单详情。
        <Eye className="ml-1 inline h-3.5 w-3.5" />
      </div>
    </div>
  )
}
