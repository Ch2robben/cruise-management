import { useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  LifeBuoy,
  RotateCcw,
  Search,
  Ship,
  UserRoundCheck,
  Users,
  Wallet,
} from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import { formatCurrency } from '@/utils/format'

type ReportTab = 'orders' | 'voyages' | 'finance' | 'rebate' | 'alerts'

interface OrderReportRow {
  id: string
  orderNo: string
  groupName: string
  accountName: string
  voyageNo: string
  sailDate: string
  ship: string
  roomSummary: string
  peopleBooked: number
  peopleRealNamed: number
  peoplePendingRealName: number
  peopleCancelled: number
  netPeople: number
  salesType: string
  focusVoyage: boolean
  realNameStatus: '未实名' | '部分实名' | '已实名'
  areaSplit: string
  receivable: number
  paid: number
  arrears: number
  updatedAt: string
}

interface VoyageReportRow {
  id: string
  voyageNo: string
  sailDate: string
  ship: string
  route: string
  focusVoyage: boolean
  totalInventory: number
  soldPeople: number
  cancelledPeople: number
  netPeople: number
  regionalPeople: number
  nonRegionalPeople: number
  pendingRealName: number
  inventorySummary: string
  receivable: number
  paid: number
  bookingRate: number
}

interface FinanceReportRow {
  id: string
  orderNo: string
  groupName: string
  voyageNo: string
  accountName: string
  ticketAmount: number
  tipAmount: number
  priceDiffAmount: number
  otherAmount: number
  receivable: number
  paid: number
  arrears: number
  channel: string
  paymentStatus: string
  latestArrivalTime: string
}

interface RebateReportRow {
  id: string
  accountName: string
  regionName: string
  voyageNo: string
  sailDate: string
  ship: string
  focusVoyage: boolean
  regionalSale: boolean
  includedInRebate: boolean
  netPeople: number
  settlementAmount: number
  rebateRule: string
  rebateAmount: number
  settlementStatus: '待确认' | '已确认' | '已结算'
}

interface AlertRow {
  id: string
  level: 'high' | 'medium'
  voyageNo: string
  sailDate: string
  orderNo: string
  groupName: string
  pendingRealName: number
  contactName: string
  contactPhone: string
  note: string
}

const tabs: { key: ReportTab; label: string; hint: string }[] = [
  { key: 'orders', label: '订单明细报表', hint: '销售日常查单' },
  { key: 'voyages', label: '航次销售汇总', hint: '按航次看销量与库存' },
  { key: 'finance', label: '财务对账明细', hint: '核对应收与实收' },
  { key: 'rebate', label: '返利结算报表', hint: '重点航次与返利口径' },
  { key: 'alerts', label: '待补实名看板', hint: '临近开航异常提醒' },
]

const orderRows: OrderReportRow[] = [
  {
    id: 'o1',
    orderNo: 'DZ202606120031',
    groupName: '重庆云贵同业 6月12日团',
    accountName: '重庆志同-四川云贵联合账号',
    voyageNo: 'CJ3-240612',
    sailDate: '2026-06-12',
    ship: '长江叁号',
    roomSummary: '2F标准间 3间 / 3F行政房 1间',
    peopleBooked: 10,
    peopleRealNamed: 6,
    peoplePendingRealName: 4,
    peopleCancelled: 1,
    netPeople: 9,
    salesType: '团队',
    focusVoyage: true,
    realNameStatus: '部分实名',
    areaSplit: '区域内 7 / 非区域 2',
    receivable: 28600,
    paid: 12000,
    arrears: 16600,
    updatedAt: '2026-06-09 17:40',
  },
  {
    id: 'o2',
    orderNo: 'DZ202606150018',
    groupName: '川渝散拼团 4人同行',
    accountName: '重庆志同-四川云贵联合账号',
    voyageNo: 'CJ2-240615',
    sailDate: '2026-06-15',
    ship: '长江贰号',
    roomSummary: '4F豪华标准间 2间',
    peopleBooked: 4,
    peopleRealNamed: 4,
    peoplePendingRealName: 0,
    peopleCancelled: 0,
    netPeople: 4,
    salesType: '散客',
    focusVoyage: false,
    realNameStatus: '已实名',
    areaSplit: '区域内 0 / 非区域 4',
    receivable: 11200,
    paid: 11200,
    arrears: 0,
    updatedAt: '2026-06-11 10:25',
  },
  {
    id: 'o3',
    orderNo: 'DZ202606180044',
    groupName: '重庆重点返利专班 12人',
    accountName: '重庆志同-四川云贵联合账号',
    voyageNo: 'CJ1-240618',
    sailDate: '2026-06-18',
    ship: '长江壹号',
    roomSummary: '3F标准间 5间 / 5F套房 1间',
    peopleBooked: 12,
    peopleRealNamed: 2,
    peoplePendingRealName: 10,
    peopleCancelled: 0,
    netPeople: 12,
    salesType: '团队',
    focusVoyage: true,
    realNameStatus: '部分实名',
    areaSplit: '区域内 5 / 非区域 7',
    receivable: 45800,
    paid: 20000,
    arrears: 25800,
    updatedAt: '2026-06-14 09:12',
  },
  {
    id: 'o4',
    orderNo: 'DZ202606220067',
    groupName: '贵阳康养包船拼团',
    accountName: '重庆志同-四川云贵联合账号',
    voyageNo: 'CJ3-240622',
    sailDate: '2026-06-22',
    ship: '长江叁号',
    roomSummary: '2F标准间 4间 / 4F豪华房 2间',
    peopleBooked: 14,
    peopleRealNamed: 14,
    peoplePendingRealName: 0,
    peopleCancelled: 2,
    netPeople: 12,
    salesType: '团队',
    focusVoyage: false,
    realNameStatus: '已实名',
    areaSplit: '区域内 12 / 非区域 0',
    receivable: 39600,
    paid: 39600,
    arrears: 0,
    updatedAt: '2026-06-18 16:36',
  },
]

const voyageRows: VoyageReportRow[] = [
  {
    id: 'v1',
    voyageNo: 'CJ3-240612',
    sailDate: '2026-06-12',
    ship: '长江叁号',
    route: '重庆 -> 宜昌 4天3晚',
    focusVoyage: true,
    totalInventory: 128,
    soldPeople: 86,
    cancelledPeople: 5,
    netPeople: 81,
    regionalPeople: 62,
    nonRegionalPeople: 19,
    pendingRealName: 11,
    inventorySummary: '2F标间余6 / 3F行政余3 / 4F豪华余2',
    receivable: 286000,
    paid: 213500,
    bookingRate: 67,
  },
  {
    id: 'v2',
    voyageNo: 'CJ2-240615',
    sailDate: '2026-06-15',
    ship: '长江贰号',
    route: '宜昌 -> 重庆 3天2晚',
    focusVoyage: false,
    totalInventory: 96,
    soldPeople: 73,
    cancelledPeople: 3,
    netPeople: 70,
    regionalPeople: 41,
    nonRegionalPeople: 29,
    pendingRealName: 4,
    inventorySummary: '3F标间余4 / 4F豪华余1 / 5F套房余0',
    receivable: 215800,
    paid: 196300,
    bookingRate: 73,
  },
  {
    id: 'v3',
    voyageNo: 'CJ1-240618',
    sailDate: '2026-06-18',
    ship: '长江壹号',
    route: '重庆 -> 宜昌 4天3晚',
    focusVoyage: true,
    totalInventory: 88,
    soldPeople: 77,
    cancelledPeople: 1,
    netPeople: 76,
    regionalPeople: 50,
    nonRegionalPeople: 26,
    pendingRealName: 15,
    inventorySummary: '2F标间余1 / 3F标间余0 / 5F套房余1',
    receivable: 309600,
    paid: 188400,
    bookingRate: 86,
  },
  {
    id: 'v4',
    voyageNo: 'CJ3-240622',
    sailDate: '2026-06-22',
    ship: '长江叁号',
    route: '宜昌 -> 重庆 5天4晚',
    focusVoyage: false,
    totalInventory: 128,
    soldPeople: 92,
    cancelledPeople: 6,
    netPeople: 86,
    regionalPeople: 58,
    nonRegionalPeople: 28,
    pendingRealName: 3,
    inventorySummary: '2F标间余5 / 3F行政余2 / 4F豪华余2',
    receivable: 332400,
    paid: 301600,
    bookingRate: 72,
  },
]

const financeRows: FinanceReportRow[] = [
  {
    id: 'f1',
    orderNo: 'DZ202606120031',
    groupName: '重庆云贵同业 6月12日团',
    voyageNo: 'CJ3-240612',
    accountName: '重庆志同-四川云贵联合账号',
    ticketAmount: 25200,
    tipAmount: 1800,
    priceDiffAmount: 1200,
    otherAmount: 400,
    receivable: 28600,
    paid: 12000,
    arrears: 16600,
    channel: '预存余额',
    paymentStatus: '部分到账',
    latestArrivalTime: '2026-06-10 15:28',
  },
  {
    id: 'f2',
    orderNo: 'DZ202606150018',
    groupName: '川渝散拼团 4人同行',
    voyageNo: 'CJ2-240615',
    accountName: '重庆志同-四川云贵联合账号',
    ticketAmount: 10400,
    tipAmount: 800,
    priceDiffAmount: 0,
    otherAmount: 0,
    receivable: 11200,
    paid: 11200,
    arrears: 0,
    channel: '通联在线',
    paymentStatus: '已到账',
    latestArrivalTime: '2026-06-12 09:06',
  },
  {
    id: 'f3',
    orderNo: 'DZ202606180044',
    groupName: '重庆重点返利专班 12人',
    voyageNo: 'CJ1-240618',
    accountName: '重庆志同-四川云贵联合账号',
    ticketAmount: 42000,
    tipAmount: 2400,
    priceDiffAmount: 800,
    otherAmount: 600,
    receivable: 45800,
    paid: 20000,
    arrears: 25800,
    channel: '银行转账',
    paymentStatus: '待付尾款',
    latestArrivalTime: '2026-06-13 14:40',
  },
  {
    id: 'f4',
    orderNo: 'DZ202606220067',
    groupName: '贵阳康养包船拼团',
    voyageNo: 'CJ3-240622',
    accountName: '重庆志同-四川云贵联合账号',
    ticketAmount: 36000,
    tipAmount: 2400,
    priceDiffAmount: 0,
    otherAmount: 1200,
    receivable: 39600,
    paid: 39600,
    arrears: 0,
    channel: '授信额度',
    paymentStatus: '已到账',
    latestArrivalTime: '2026-06-20 18:10',
  },
]

const rebateRows: RebateReportRow[] = [
  {
    id: 'r1',
    accountName: '重庆志同-四川云贵联合账号',
    regionName: '四川 / 云贵',
    voyageNo: 'CJ3-240612',
    sailDate: '2026-06-12',
    ship: '长江叁号',
    focusVoyage: true,
    regionalSale: true,
    includedInRebate: true,
    netPeople: 9,
    settlementAmount: 28600,
    rebateRule: '重点航次返利 6%',
    rebateAmount: 1716,
    settlementStatus: '待确认',
  },
  {
    id: 'r2',
    accountName: '重庆志同-四川云贵联合账号',
    regionName: '四川 / 云贵',
    voyageNo: 'CJ2-240615',
    sailDate: '2026-06-15',
    ship: '长江贰号',
    focusVoyage: false,
    regionalSale: false,
    includedInRebate: false,
    netPeople: 4,
    settlementAmount: 11200,
    rebateRule: '常规航次不返',
    rebateAmount: 0,
    settlementStatus: '已确认',
  },
  {
    id: 'r3',
    accountName: '重庆志同-四川云贵联合账号',
    regionName: '四川 / 云贵',
    voyageNo: 'CJ1-240618',
    sailDate: '2026-06-18',
    ship: '长江壹号',
    focusVoyage: true,
    regionalSale: false,
    includedInRebate: true,
    netPeople: 12,
    settlementAmount: 45800,
    rebateRule: '重点航次非区域纳返 4%',
    rebateAmount: 1832,
    settlementStatus: '待确认',
  },
  {
    id: 'r4',
    accountName: '重庆志同-四川云贵联合账号',
    regionName: '四川 / 云贵',
    voyageNo: 'CJ3-240622',
    sailDate: '2026-06-22',
    ship: '长江叁号',
    focusVoyage: false,
    regionalSale: true,
    includedInRebate: true,
    netPeople: 12,
    settlementAmount: 39600,
    rebateRule: '月度常规返利 2%',
    rebateAmount: 792,
    settlementStatus: '已结算',
  },
]

const alertRows: AlertRow[] = [
  {
    id: 'a1',
    level: 'high',
    voyageNo: 'CJ1-240618',
    sailDate: '2026-06-18',
    orderNo: 'DZ202606180044',
    groupName: '重庆重点返利专班 12人',
    pendingRealName: 10,
    contactName: '李倩',
    contactPhone: '13900001122',
    note: '距离开航 3 天，重点返利航次仍有大批未实名名单。',
  },
  {
    id: 'a2',
    level: 'medium',
    voyageNo: 'CJ3-240612',
    sailDate: '2026-06-12',
    orderNo: 'DZ202606120031',
    groupName: '重庆云贵同业 6月12日团',
    pendingRealName: 4,
    contactName: '杨帆',
    contactPhone: '13812344321',
    note: '已补录 60%，建议今日内补齐剩余名单。',
  },
]

function StatCard({
  title,
  value,
  hint,
  icon,
  accent,
}: {
  title: string
  value: string
  hint: string
  icon: ReactNode
  accent: string
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-gray-500">{title}</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
          <div className="mt-1 text-xs text-gray-500">{hint}</div>
        </div>
        <div className={`rounded-xl p-3 ${accent}`}>{icon}</div>
      </div>
    </div>
  )
}

function Tag({ text, tone = 'gray' }: { text: string; tone?: 'gray' | 'blue' | 'green' | 'orange' | 'red' }) {
  const toneClass = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    orange: 'bg-orange-50 text-orange-700',
    red: 'bg-red-50 text-red-700',
  }[tone]

  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${toneClass}`}>{text}</span>
}

function FilterField({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 ${wide ? 'min-w-[220px]' : 'min-w-[160px]'}`}>
      <span className="text-xs text-gray-500">{label}</span>
      <button className="flex h-10 items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm hover:border-gray-300">
        <span>{value}</span>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </button>
    </div>
  )
}

function PaginationBar({ total }: { total: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
      <div className="text-sm text-gray-500">共 {total} 条，当前第 1 页，每页 10 条</div>
      <div className="flex items-center gap-2">
        <button className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 px-3 text-sm text-gray-400" disabled>
          <ChevronLeft className="h-4 w-4" />
          上一页
        </button>
        <button className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 px-3 text-sm text-gray-700 hover:border-gray-300">
          下一页
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function SectionIntro({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-gray-600">{description}</p>
    </div>
  )
}

function MiniMetric({
  label,
  value,
  trend,
  positive = false,
}: {
  label: string
  value: string
  trend: string
  positive?: boolean
}) {
  return (
    <div className="rounded-xl bg-gray-50 px-4 py-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-gray-900">{value}</div>
      <div className={`mt-1 text-xs ${positive ? 'text-emerald-600' : 'text-gray-500'}`}>{trend}</div>
    </div>
  )
}

function NoticeCard({
  title,
  desc,
  tone,
}: {
  title: string
  desc: string
  tone: 'red' | 'blue'
}) {
  const config = tone === 'red'
    ? {
        icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
        box: 'border-red-100 bg-red-50',
        title: 'text-red-800',
        desc: 'text-red-600',
      }
    : {
        icon: <CheckCircle2 className="h-4 w-4 text-blue-600" />,
        box: 'border-blue-100 bg-blue-50',
        title: 'text-blue-800',
        desc: 'text-blue-600',
      }

  return (
    <div className={`rounded-xl border p-3 ${config.box}`}>
      <div className="flex items-start gap-2">
        {config.icon}
        <div>
          <div className={`text-sm font-medium ${config.title}`}>{title}</div>
          <div className={`mt-1 text-xs leading-5 ${config.desc}`}>{desc}</div>
        </div>
      </div>
    </div>
  )
}

export default function DealerCruiseSalesStatsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('orders')

  const summary = useMemo(() => {
    const booked = orderRows.reduce((sum, row) => sum + row.peopleBooked, 0)
    const pending = orderRows.reduce((sum, row) => sum + row.peoplePendingRealName, 0)
    const focusVoyages = voyageRows.filter((row) => row.focusVoyage).length
    const receivable = financeRows.reduce((sum, row) => sum + row.receivable, 0)
    const paid = financeRows.reduce((sum, row) => sum + row.paid, 0)
    return { booked, pending, focusVoyages, receivable, paid }
  }, [])

  return (
    <div className="space-y-5">
      <PageHeader
        title="游轮销售统计"
        description="面向经销商的订单、航次、对账、返利与实名进度统一查询中心。"
      />

      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-emerald-50 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-blue-700">经销商分销平台</div>
            <h3 className="mt-1 text-2xl font-semibold text-gray-900">重庆志同销售报表中心</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              统一承接订单查单、航次销量、财务对账、返利结算和待补实名提醒。当前按重庆志同联合账号视角展示，重点航次、区域内外销售和未实名进度均可直接查看。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Tag text="默认签约零售价" tone="blue" />
              <Tag text="重点返利航次高亮" tone="orange" />
              <Tag text="支持批量导出" tone="green" />
            </div>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-xs text-gray-500">当前账号</div>
            <div className="mt-1 text-lg font-semibold text-gray-900">重庆志同-四川云贵联合账号</div>
            <div className="mt-1 text-xs text-gray-500">共享预存余额 / 共用返利口径 / 首页醒目展示</div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-500">
              <div>
                <div>预存余额</div>
                <div className="mt-1 font-medium text-gray-900">{formatCurrency(186400)}</div>
              </div>
              <div>
                <div>授信剩余</div>
                <div className="mt-1 font-medium text-gray-900">{formatCurrency(560000)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="本期预订人数"
          value={`${summary.booked} 人`}
          hint="含已实名与未实名"
          icon={<Users className="h-5 w-5 text-blue-600" />}
          accent="bg-blue-50"
        />
        <StatCard
          title="待补实名人数"
          value={`${summary.pending} 人`}
          hint="临近开航重点提醒"
          icon={<UserRoundCheck className="h-5 w-5 text-orange-600" />}
          accent="bg-orange-50"
        />
        <StatCard
          title="重点返利航次"
          value={`${summary.focusVoyages} 个`}
          hint="支持重点标识高亮"
          icon={<Ship className="h-5 w-5 text-emerald-600" />}
          accent="bg-emerald-50"
        />
        <StatCard
          title="本期应收金额"
          value={formatCurrency(summary.receivable)}
          hint="供经销商快速核账"
          icon={<Wallet className="h-5 w-5 text-purple-600" />}
          accent="bg-purple-50"
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-gray-900">筛选条件</div>
            <div className="mt-1 text-xs text-gray-500">按航次、实名状态、重点航次、区域内外与销售方式快速定位数据</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition hover:border-gray-300">
              <RotateCcw className="h-4 w-4" />
              重置
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition hover:border-gray-300">
              <Search className="h-4 w-4" />
              查询
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
              <Download className="h-4 w-4" />
              导出当前报表
            </button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <FilterField label="统计周期" value="2026-06-01 至 2026-06-30" wide />
          <FilterField label="区域" value="四川 / 云贵" />
          <FilterField label="航次" value="全部航次" />
          <FilterField label="重点航次" value="全部" />
          <FilterField label="实名状态" value="全部" />
          <FilterField label="销售方式" value="团队 / 散客" />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">经营概览</div>
              <div className="mt-1 text-xs text-gray-500">本期销售、到账、待补实名与重点航次跟进情况</div>
            </div>
            <Tag text="2026年6月" tone="blue" />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <MiniMetric label="已收金额" value={formatCurrency(summary.paid)} trend="+18.4%" positive />
            <MiniMetric label="欠款金额" value={formatCurrency(summary.receivable - summary.paid)} trend="3单待跟进" />
            <MiniMetric label="实名完成率" value="69.2%" trend="较上周 +6.1%" positive />
            <MiniMetric label="重点航次成交" value="21人" trend="占净销售 56%" positive />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">系统提醒</div>
              <div className="mt-1 text-xs text-gray-500">默认显示高优先级事项，便于销售每日跟进</div>
            </div>
            <Tag text="2项待处理" tone="orange" />
          </div>
          <div className="mt-4 space-y-3">
            <NoticeCard
              title="重点返利航次未实名人数偏高"
              desc="CJ1-240618 尚有 10 人未实名，建议今日内完成补录。"
              tone="red"
            />
            <NoticeCard
              title="月度返利结算待确认"
              desc={`6月上旬返利预计 ${formatCurrency(3548)}，请于 6月25日前确认。`}
              tone="blue"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-gray-100 p-3">
          {tabs.map((tab) => {
            const active = tab.key === activeTab
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-xl px-4 py-3 text-left transition ${
                  active ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="text-sm font-medium">{tab.label}</div>
                <div className={`mt-1 text-xs ${active ? 'text-blue-100' : 'text-gray-500'}`}>{tab.hint}</div>
              </button>
            )
          })}
        </div>

        {activeTab === 'orders' && (
          <div>
            <div className="p-4">
              <SectionIntro
                title="订单明细报表"
                description="首页直接看房型、楼层、预订人数、已实名/未实名、取消人数、净预订人数、区域内外结构和应收欠款。"
              />
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
                      <th className="px-3 py-3 font-medium">订单 / 团名</th>
                      <th className="px-3 py-3 font-medium">航次</th>
                      <th className="px-3 py-3 font-medium">房型楼层摘要</th>
                      <th className="px-3 py-3 font-medium">人数结构</th>
                      <th className="px-3 py-3 font-medium">销售与区域</th>
                      <th className="px-3 py-3 font-medium">金额</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orderRows.map((row) => (
                      <tr key={row.id} className="align-top hover:bg-gray-50">
                        <td className="px-3 py-3">
                          <div className="font-medium text-gray-900">{row.orderNo}</div>
                          <div className="mt-1 text-gray-600">{row.groupName}</div>
                          <div className="mt-2 text-xs text-gray-500">{row.accountName}</div>
                          <div className="mt-1 text-xs text-gray-400">最近更新：{row.updatedAt}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-gray-900">{row.voyageNo}</div>
                          <div className="mt-1 text-gray-600">{row.ship}</div>
                          <div className="mt-1 text-xs text-gray-500">{row.sailDate}</div>
                          <div className="mt-2">{row.focusVoyage ? <Tag text="重点返利航次" tone="orange" /> : <Tag text="常规航次" />}</div>
                        </td>
                        <td className="px-3 py-3 text-gray-700">{row.roomSummary}</td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Tag text={`预订 ${row.peopleBooked}`} tone="blue" />
                            <Tag text={`已实名 ${row.peopleRealNamed}`} tone="green" />
                            <Tag text={`未实名 ${row.peoplePendingRealName}`} tone="orange" />
                            <Tag text={`取消 ${row.peopleCancelled}`} tone="red" />
                            <Tag text={`净 ${row.netPeople}`} />
                          </div>
                          <div className="mt-2 text-xs text-gray-500">{row.realNameStatus}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-gray-900">{row.salesType}</div>
                          <div className="mt-1 text-gray-600">{row.areaSplit}</div>
                          <div className="mt-1 text-xs text-gray-500">默认签约零售价</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-gray-900">应收 {formatCurrency(row.receivable)}</div>
                          <div className="mt-1 text-gray-600">已收 {formatCurrency(row.paid)}</div>
                          <div className="mt-1 text-xs text-red-600">欠款 {formatCurrency(row.arrears)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <PaginationBar total={orderRows.length} />
          </div>
        )}

        {activeTab === 'voyages' && (
          <div>
            <div className="p-4">
              <SectionIntro
                title="航次销售汇总报表"
                description="直接按开航时间查看每个航次销量、重点标识、区域内外结构、楼层房型余量和满载率。"
              />
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
                      <th className="px-3 py-3 font-medium">航次</th>
                      <th className="px-3 py-3 font-medium">库存与销量</th>
                      <th className="px-3 py-3 font-medium">区域结构</th>
                      <th className="px-3 py-3 font-medium">楼层房型余量</th>
                      <th className="px-3 py-3 font-medium">金额</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {voyageRows.map((row) => (
                      <tr key={row.id} className="align-top hover:bg-gray-50">
                        <td className="px-3 py-3">
                          <div className="font-medium text-gray-900">{row.voyageNo}</div>
                          <div className="mt-1 text-gray-600">{row.ship}</div>
                          <div className="mt-1 text-gray-600">{row.route}</div>
                          <div className="mt-1 text-xs text-gray-500">{row.sailDate}</div>
                          <div className="mt-2">{row.focusVoyage ? <Tag text="重点返利航次" tone="orange" /> : <Tag text="常规航次" />}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-gray-900">总库存 {row.totalInventory}</div>
                          <div className="mt-1 text-gray-600">已售 {row.soldPeople} / 取消 {row.cancelledPeople}</div>
                          <div className="mt-1 text-gray-600">净销售 {row.netPeople}</div>
                          <div className="mt-1 text-xs text-orange-600">未实名 {row.pendingRealName} / 满载率 {row.bookingRate}%</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-gray-900">区域内 {row.regionalPeople}</div>
                          <div className="mt-1 text-gray-600">非区域 {row.nonRegionalPeople}</div>
                        </td>
                        <td className="px-3 py-3 text-gray-700">{row.inventorySummary}</td>
                        <td className="px-3 py-3">
                          <div className="text-gray-900">应收 {formatCurrency(row.receivable)}</div>
                          <div className="mt-1 text-gray-600">已收 {formatCurrency(row.paid)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <PaginationBar total={voyageRows.length} />
          </div>
        )}

        {activeTab === 'finance' && (
          <div>
            <div className="p-4">
              <SectionIntro
                title="财务对账明细报表"
                description="供经销商核对船票、小费、补差和到账情况，支持导出后与内部财务系统核账。"
              />
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
                      <th className="px-3 py-3 font-medium">订单</th>
                      <th className="px-3 py-3 font-medium">费用结构</th>
                      <th className="px-3 py-3 font-medium">收款情况</th>
                      <th className="px-3 py-3 font-medium">支付渠道</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {financeRows.map((row) => (
                      <tr key={row.id} className="align-top hover:bg-gray-50">
                        <td className="px-3 py-3">
                          <div className="font-medium text-gray-900">{row.orderNo}</div>
                          <div className="mt-1 text-gray-600">{row.groupName}</div>
                          <div className="mt-1 text-xs text-gray-500">{row.voyageNo} / {row.accountName}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-gray-900">船票 {formatCurrency(row.ticketAmount)}</div>
                          <div className="mt-1 text-gray-600">小费 {formatCurrency(row.tipAmount)}</div>
                          <div className="mt-1 text-gray-600">改价补差 {formatCurrency(row.priceDiffAmount)}</div>
                          <div className="mt-1 text-gray-600">其他 {formatCurrency(row.otherAmount)}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-gray-900">应收 {formatCurrency(row.receivable)}</div>
                          <div className="mt-1 text-gray-600">已收 {formatCurrency(row.paid)}</div>
                          <div className="mt-1 text-xs text-red-600">欠款 {formatCurrency(row.arrears)}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-gray-900">{row.channel}</div>
                          <div className="mt-1 text-xs text-gray-500">{row.paymentStatus}</div>
                          <div className="mt-1 text-xs text-gray-400">最近到账：{row.latestArrivalTime}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <PaginationBar total={financeRows.length} />
          </div>
        )}

        {activeTab === 'rebate' && (
          <div>
            <div className="p-4">
              <SectionIntro
                title="返利结算报表"
                description="单独管理重点返利航次、区域内外销售和是否纳返口径，避免和普通销量报表混淆。"
              />
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
                      <th className="px-3 py-3 font-medium">账号 / 区域</th>
                      <th className="px-3 py-3 font-medium">航次</th>
                      <th className="px-3 py-3 font-medium">返利口径</th>
                      <th className="px-3 py-3 font-medium">返利结果</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rebateRows.map((row) => (
                      <tr key={row.id} className="align-top hover:bg-gray-50">
                        <td className="px-3 py-3">
                          <div className="font-medium text-gray-900">{row.accountName}</div>
                          <div className="mt-1 text-gray-600">{row.regionName}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-gray-900">{row.voyageNo}</div>
                          <div className="mt-1 text-gray-600">{row.ship}</div>
                          <div className="mt-1 text-xs text-gray-500">{row.sailDate}</div>
                          <div className="mt-2">{row.focusVoyage ? <Tag text="重点返利航次" tone="orange" /> : <Tag text="非重点航次" />}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Tag text={row.regionalSale ? '区域内销售' : '非区域销售'} tone={row.regionalSale ? 'green' : 'blue'} />
                            <Tag text={row.includedInRebate ? '纳入返利' : '不纳返'} tone={row.includedInRebate ? 'orange' : 'gray'} />
                          </div>
                          <div className="mt-2 text-gray-600">{row.rebateRule}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-gray-900">净人数 {row.netPeople}</div>
                          <div className="mt-1 text-gray-600">结算 {formatCurrency(row.settlementAmount)}</div>
                          <div className="mt-1 text-sm font-medium text-emerald-700">返利 {formatCurrency(row.rebateAmount)}</div>
                          <div className="mt-1 text-xs text-gray-500">{row.settlementStatus}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <PaginationBar total={rebateRows.length} />
          </div>
        )}

        {activeTab === 'alerts' && (
          <div>
            <div className="p-4">
              <SectionIntro
                title="待补实名看板"
                description="更偏运营提醒，聚焦临近开航但仍未补实名的订单，重点航次优先高亮。"
              />
              <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">高风险提醒</span>
                    </div>
                    <div className="mt-3 text-3xl font-semibold text-red-700">1 单</div>
                    <div className="mt-1 text-xs text-red-600">距离开航 3 天且仍有 10 人未实名</div>
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                    <div className="flex items-center gap-2 text-orange-700">
                      <LifeBuoy className="h-4 w-4" />
                      <span className="text-sm font-medium">待跟进订单</span>
                    </div>
                    <div className="mt-3 text-3xl font-semibold text-orange-700">2 单</div>
                    <div className="mt-1 text-xs text-orange-600">建议当天联系销售负责人补齐名单</div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
                        <th className="px-3 py-3 font-medium">风险等级</th>
                        <th className="px-3 py-3 font-medium">订单</th>
                        <th className="px-3 py-3 font-medium">航次</th>
                        <th className="px-3 py-3 font-medium">未实名</th>
                        <th className="px-3 py-3 font-medium">联系人</th>
                        <th className="px-3 py-3 font-medium">说明</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {alertRows.map((row) => (
                        <tr key={row.id} className="align-top hover:bg-gray-50">
                          <td className="px-3 py-3">
                            {row.level === 'high' ? <Tag text="高风险" tone="red" /> : <Tag text="待跟进" tone="orange" />}
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-medium text-gray-900">{row.orderNo}</div>
                            <div className="mt-1 text-gray-600">{row.groupName}</div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-medium text-gray-900">{row.voyageNo}</div>
                            <div className="mt-1 text-xs text-gray-500">{row.sailDate}</div>
                          </td>
                          <td className="px-3 py-3 text-orange-700">{row.pendingRealName} 人</td>
                          <td className="px-3 py-3">
                            <div className="text-gray-900">{row.contactName}</div>
                            <div className="mt-1 text-xs text-gray-500">{row.contactPhone}</div>
                          </td>
                          <td className="px-3 py-3 text-gray-700">{row.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <PaginationBar total={alertRows.length} />
          </div>
        )}
      </div>
    </div>
  )
}
