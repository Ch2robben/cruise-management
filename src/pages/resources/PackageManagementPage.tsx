import { type ReactNode, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'

type PackageStatus = 'draft' | 'enabled' | 'disabled' | 'deleted'
type BundleSourceType = 'cruise' | 'addon'
type SupplierScope = 'self' | 'distribution' | 'ota'

interface PackageBundleCandidate {
  id: string
  name: string
  sourceType: BundleSourceType
  supplierScope: SupplierScope
  supplierName: string
  tag: string
  costPrice: number
  retailPrice: number
  settlementPrice: number
}

interface PackageBundleItem extends PackageBundleCandidate {
  quantity: number
}

interface PackageCalendarOverride {
  id: string
  date: string
  dailyStock: number
  salePrice: number
  settlementPrice: number
}

interface PackageChannelConfig {
  id: string
  channelName: string
  enabled: boolean
  settlementPrice: number
  retailPrice: number
}

interface PackageRuleForm {
  saleStartDate: string
  saleEndDate: string
  totalStock: number
  dailyStock: number
  costPrice: number
  suggestedPrice: number
  marketPrice: number
  ticketNotice: string
  bookingMode: 'today' | 'advance'
  advanceDays: number
  minPurchaseQty: number
  maxPurchaseQty: number
  realNameRequired: boolean
  crowdMode: 'unlimited' | 'family'
  adultLimit: number
  childLimit: number
  elderLimit: number
  noSeatLimit: number
  appointmentTimeLimited: boolean
  appointmentSlots: string[]
  payAutoCancelMinutes: number
  notifySuccess: boolean
  notifyCancel: boolean
  pickupMode: 'qr' | 'voucher'
  validMode: 'fixed' | 'relative'
  refundMode: 'not_refundable' | 'follow_sub_ticket' | 'custom'
  refundFee: number
}

interface PackageProduct {
  id: string
  name: string
  region: string
  country: string
  address: string
  contactPhone: string
  coverImages: string[]
  detailImages: string[]
  videoUrls: string[]
  bookingNotice: string
  productIntro: string
  packageIntro: string
  includedTicketDesc: string
  routeName: string
  itineraryName: string
  shipName: string
  category: string
  sortNo: number
  status: PackageStatus
  bundleItems: PackageBundleItem[]
  rules: PackageRuleForm
  calendarOverrides: PackageCalendarOverride[]
  channelConfigs: PackageChannelConfig[]
  updatedBy: string
  updatedAt: string
  createdAt: string
}

interface PackageFormState {
  name: string
  region: string
  country: string
  address: string
  contactPhone: string
  coverImages: string[]
  detailImages: string[]
  videoUrls: string[]
  bookingNotice: string
  productIntro: string
  packageIntro: string
  includedTicketDesc: string
  routeName: string
  itineraryName: string
  shipName: string
  category: string
  sortNo: number
  bundleItems: PackageBundleItem[]
  rules: PackageRuleForm
  calendarOverrides: PackageCalendarOverride[]
  channelConfigs: PackageChannelConfig[]
  publishTarget: Exclude<PackageStatus, 'deleted'>
}

const statusOptions: { key: PackageStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'enabled', label: '已上架' },
  { key: 'disabled', label: '已下架' },
  { key: 'deleted', label: '已删除' },
]

const supplierScopeLabel: Record<SupplierScope | 'all', string> = {
  all: '全部',
  self: '自营',
  distribution: '分销',
  ota: 'OTA',
}

const packageStatusLabel: Record<PackageStatus, string> = {
  draft: '草稿',
  enabled: '已上架',
  disabled: '已下架',
  deleted: '已删除',
}

const channelTemplates: PackageChannelConfig[] = [
  { id: 'c1', channelName: '分销预定', enabled: true, settlementPrice: 1680, retailPrice: 1980 },
  { id: 'c2', channelName: '抖音', enabled: false, settlementPrice: 1720, retailPrice: 2099 },
  { id: 'c3', channelName: '美团', enabled: true, settlementPrice: 1700, retailPrice: 2060 },
  { id: 'c4', channelName: '携程', enabled: false, settlementPrice: 1750, retailPrice: 2150 },
  { id: 'c5', channelName: '长航小程序', enabled: true, settlementPrice: 1760, retailPrice: 2199 },
]

const fieldInputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm'

const packageCandidates: PackageBundleCandidate[] = [
  { id: 'pc1', name: '游轮 - 成人VIP票', sourceType: 'cruise', supplierScope: 'self', supplierName: '重庆公司', tag: '实名制', costPrice: 1200, retailPrice: 1880, settlementPrice: 1580 },
  { id: 'pc2', name: '游轮 - 儿童VIP票', sourceType: 'cruise', supplierScope: 'self', supplierName: '重庆公司', tag: '儿童票', costPrice: 680, retailPrice: 1080, settlementPrice: 880 },
  { id: 'pc3', name: '游轮 - 家庭房套票', sourceType: 'cruise', supplierScope: 'distribution', supplierName: '湖北峡江国旅', tag: '家庭房', costPrice: 2360, retailPrice: 3280, settlementPrice: 2860 },
  { id: 'pc4', name: '百花券1', sourceType: 'addon', supplierScope: 'ota', supplierName: '百花楼餐饮', tag: '餐饮券', costPrice: 10, retailPrice: 20, settlementPrice: 15 },
  { id: 'pc5', name: '登船欢迎茶歇', sourceType: 'addon', supplierScope: 'self', supplierName: '船上餐饮部', tag: '附加餐饮', costPrice: 28, retailPrice: 58, settlementPrice: 39 },
  { id: 'pc6', name: '三峡沿岸接驳车', sourceType: 'addon', supplierScope: 'distribution', supplierName: '宜昌地接', tag: '岸上接驳', costPrice: 35, retailPrice: 70, settlementPrice: 52 },
]

const defaultRules = (): PackageRuleForm => ({
  saleStartDate: '2026-07-10',
  saleEndDate: '2026-12-31',
  totalStock: 300,
  dailyStock: 30,
  costPrice: 0,
  suggestedPrice: 0,
  marketPrice: 0,
  ticketNotice: '请至少提前60分钟到达登船码头，随身携带有效证件。',
  bookingMode: 'advance',
  advanceDays: 1,
  minPurchaseQty: 1,
  maxPurchaseQty: 10,
  realNameRequired: true,
  crowdMode: 'family',
  adultLimit: 2,
  childLimit: 1,
  elderLimit: 1,
  noSeatLimit: 1,
  appointmentTimeLimited: true,
  appointmentSlots: ['08:00-10:00', '14:00-16:00'],
  payAutoCancelMinutes: 30,
  notifySuccess: true,
  notifyCancel: true,
  pickupMode: 'qr',
  validMode: 'fixed',
  refundMode: 'follow_sub_ticket',
  refundFee: 0,
})

const emptyForm = (): PackageFormState => ({
  name: '',
  region: '境内',
  country: '中国 / 重庆',
  address: '',
  contactPhone: '',
  coverImages: [],
  detailImages: [],
  videoUrls: [],
  bookingNotice: '【发票说明】\n【退改说明】\n【温馨提示】\n【联系电话】',
  productIntro: '【套票简介】\n【包含票类】',
  packageIntro: '',
  includedTicketDesc: '',
  routeName: '重庆两江游',
  itineraryName: '朝天门登船夜游线',
  shipName: '长江探索号',
  category: '游轮票套餐',
  sortNo: 1,
  bundleItems: [],
  rules: defaultRules(),
  calendarOverrides: [
    { id: 'co1', date: '2026-07-18', dailyStock: 20, salePrice: 1980, settlementPrice: 1690 },
    { id: 'co2', date: '2026-07-25', dailyStock: 15, salePrice: 2080, settlementPrice: 1760 },
  ],
  channelConfigs: channelTemplates.map((item) => ({ ...item })),
  publishTarget: 'draft',
})

const initialPackages: PackageProduct[] = [
  {
    id: 'PKG001',
    name: '重庆两江游尊享套票',
    region: '境内',
    country: '中国 / 重庆',
    address: '重庆市渝中区朝天门码头',
    contactPhone: '023-88118811',
    coverImages: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80'],
    detailImages: ['https://images.unsplash.com/photo-1496412705862-e0088f16f791?w=600&q=80'],
    videoUrls: [],
    bookingNotice: '请至少提前60分钟到达码头，实名入园。',
    productIntro: '适合家庭与情侣出游，含夜游主票与欢迎茶歇。',
    packageIntro: '游轮主票 + 茶歇 + 餐饮券',
    includedTicketDesc: '成人VIP票、百花券1、登船欢迎茶歇',
    routeName: '重庆两江游',
    itineraryName: '朝天门登船夜游线',
    shipName: '长江探索号',
    category: '游轮票套餐',
    sortNo: 1,
    status: 'enabled',
    bundleItems: [
      { ...packageCandidates[0], quantity: 1 },
      { ...packageCandidates[3], quantity: 1 },
      { ...packageCandidates[4], quantity: 1 },
    ],
    rules: {
      ...defaultRules(),
      costPrice: 1238,
      suggestedPrice: 1980,
      marketPrice: 2180,
    },
    calendarOverrides: [
      { id: 'ca1', date: '2026-07-18', dailyStock: 20, salePrice: 1999, settlementPrice: 1710 },
      { id: 'ca2', date: '2026-07-19', dailyStock: 18, salePrice: 2099, settlementPrice: 1760 },
    ],
    channelConfigs: channelTemplates.map((item, index) =>
      index === 1 ? { ...item, enabled: true, settlementPrice: 1730, retailPrice: 2099 } : { ...item },
    ),
    updatedBy: '系统管理员',
    updatedAt: '2026-07-03 16:20:00',
    createdAt: '2026-06-28 10:00:00',
  },
  {
    id: 'PKG002',
    name: '三峡亲子家庭套票',
    region: '境内',
    country: '中国 / 湖北',
    address: '湖北省宜昌市三峡游客中心',
    contactPhone: '0717-6655888',
    coverImages: [],
    detailImages: [],
    videoUrls: [],
    bookingNotice: '儿童需在成人陪同下使用。',
    productIntro: '家庭型套票，适合假期亲子出游。',
    packageIntro: '家庭房套票 + 接驳车 + 餐饮券',
    includedTicketDesc: '家庭房套票、三峡沿岸接驳车、百花券1',
    routeName: '三峡精华游',
    itineraryName: '宜昌-奉节亲子线',
    shipName: '长江明珠号',
    category: '亲子套票',
    sortNo: 2,
    status: 'draft',
    bundleItems: [
      { ...packageCandidates[2], quantity: 1 },
      { ...packageCandidates[5], quantity: 1 },
      { ...packageCandidates[3], quantity: 2 },
    ],
    rules: {
      ...defaultRules(),
      costPrice: 2415,
      suggestedPrice: 3280,
      marketPrice: 3580,
      realNameRequired: false,
    },
    calendarOverrides: [],
    channelConfigs: channelTemplates.map((item) => ({ ...item, enabled: item.channelName === '长航小程序' })),
    updatedBy: '李运营',
    updatedAt: '2026-07-02 11:40:00',
    createdAt: '2026-06-25 09:30:00',
  },
]

function cloneFormFromRecord(record: PackageProduct): PackageFormState {
  return {
    name: record.name,
    region: record.region,
    country: record.country,
    address: record.address,
    contactPhone: record.contactPhone,
    coverImages: [...record.coverImages],
    detailImages: [...record.detailImages],
    videoUrls: [...record.videoUrls],
    bookingNotice: record.bookingNotice,
    productIntro: record.productIntro,
    packageIntro: record.packageIntro,
    includedTicketDesc: record.includedTicketDesc,
    routeName: record.routeName,
    itineraryName: record.itineraryName,
    shipName: record.shipName,
    category: record.category,
    sortNo: record.sortNo,
    bundleItems: record.bundleItems.map((item) => ({ ...item })),
    rules: {
      ...record.rules,
      appointmentSlots: [...record.rules.appointmentSlots],
    },
    calendarOverrides: record.calendarOverrides.map((item) => ({ ...item })),
    channelConfigs: record.channelConfigs.map((item) => ({ ...item })),
    publishTarget: record.status === 'deleted' ? 'disabled' : record.status,
  }
}

function formatCurrency(value: number) {
  return `¥ ${value.toFixed(2)}`
}

function formatDateTime(value: string) {
  return value.replace('T', ' ').slice(0, 16)
}

function buildPackageRecord(id: string, form: PackageFormState, previous?: PackageProduct): PackageProduct {
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  return {
    id,
    name: form.name,
    region: form.region,
    country: form.country,
    address: form.address,
    contactPhone: form.contactPhone,
    coverImages: [...form.coverImages],
    detailImages: [...form.detailImages],
    videoUrls: [...form.videoUrls],
    bookingNotice: form.bookingNotice,
    productIntro: form.productIntro,
    packageIntro: form.packageIntro,
    includedTicketDesc: form.includedTicketDesc,
    routeName: form.routeName,
    itineraryName: form.itineraryName,
    shipName: form.shipName,
    category: form.category,
    sortNo: form.sortNo,
    status: form.publishTarget,
    bundleItems: form.bundleItems.map((item) => ({ ...item })),
    rules: {
      ...form.rules,
      appointmentSlots: [...form.rules.appointmentSlots],
    },
    calendarOverrides: form.calendarOverrides.map((item) => ({ ...item })),
    channelConfigs: form.channelConfigs.map((item) => ({ ...item })),
    updatedBy: '当前用户',
    updatedAt: now,
    createdAt: previous?.createdAt || now,
  }
}

function StatusPill({ status }: { status: PackageStatus }) {
  if (status === 'draft') return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">草稿</span>
  if (status === 'deleted') return <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">已删除</span>
  return <StatusBadge status={status === 'enabled' ? 'enabled' : 'disabled'} />
}

function StepHeader({ current }: { current: number }) {
  const steps = ['基础信息', '打包子票', '票规配置', '发布确认']
  return (
    <div className="mb-6 flex items-center gap-4 border-b border-gray-200 pb-5">
      {steps.map((step, index) => {
        const stepNo = index + 1
        const active = stepNo === current
        const passed = stepNo < current
        return (
          <div key={step} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                active ? 'bg-blue-600 text-white' : passed ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {stepNo}
            </div>
            <div className={active ? 'text-sm font-medium text-gray-900' : 'text-sm text-gray-500'}>{step}</div>
            {index < steps.length - 1 && <div className="h-px w-12 bg-gray-200" />}
          </div>
        )
      })}
    </div>
  )
}

export default function PackageManagementPage() {
  const [records, setRecords] = useState<PackageProduct[]>(initialPackages)
  const [keyword, setKeyword] = useState('')
  const [shipFilter, setShipFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<PackageStatus | 'all'>('all')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [appliedShipFilter, setAppliedShipFilter] = useState('all')
  const [appliedCategoryFilter, setAppliedCategoryFilter] = useState('all')
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<PackageStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<PackageFormState>(emptyForm())
  const [bundleType, setBundleType] = useState<BundleSourceType>('cruise')
  const [bundleSupplierScope, setBundleSupplierScope] = useState<SupplierScope | 'all'>('all')
  const [bundleKeyword, setBundleKeyword] = useState('')
  const [calendarTargetId, setCalendarTargetId] = useState<string | null>(null)
  const [calendarDraft, setCalendarDraft] = useState<PackageCalendarOverride[]>([])
  const [channelTargetId, setChannelTargetId] = useState<string | null>(null)
  const [channelDraft, setChannelDraft] = useState<PackageChannelConfig[]>([])
  const [deleteTarget, setDeleteTarget] = useState<PackageProduct | null>(null)
  const pageSize = 10

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      const statusMatched = appliedStatusFilter === 'all' || item.status === appliedStatusFilter
      const shipMatched = appliedShipFilter === 'all' || item.shipName === appliedShipFilter
      const categoryMatched = appliedCategoryFilter === 'all' || item.category === appliedCategoryFilter
      const keywordMatched =
        !appliedKeyword.trim() ||
        item.name.includes(appliedKeyword.trim()) ||
        item.routeName.includes(appliedKeyword.trim()) ||
        item.shipName.includes(appliedKeyword.trim())
      return statusMatched && shipMatched && categoryMatched && keywordMatched
    })
  }, [records, appliedStatusFilter, appliedShipFilter, appliedCategoryFilter, appliedKeyword])

  const dataSource = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRecords.slice(start, start + pageSize)
  }, [filteredRecords, page])

  const shipOptions = useMemo(() => ['all', ...Array.from(new Set(records.map((item) => item.shipName)))], [records])
  const categoryOptions = useMemo(() => ['all', ...Array.from(new Set(records.map((item) => item.category)))], [records])

  const bundleCandidates = useMemo(() => {
    return packageCandidates.filter((item) => {
      if (item.sourceType !== bundleType) return false
      if (bundleSupplierScope !== 'all' && item.supplierScope !== bundleSupplierScope) return false
      if (bundleKeyword.trim() && !item.name.includes(bundleKeyword.trim()) && !item.supplierName.includes(bundleKeyword.trim())) return false
      return true
    })
  }, [bundleKeyword, bundleSupplierScope, bundleType])

  const bundleSummary = useMemo(() => {
    return form.bundleItems.reduce(
      (acc, item) => {
        acc.count += item.quantity
        acc.cost += item.costPrice * item.quantity
        acc.retail += item.retailPrice * item.quantity
        acc.settlement += item.settlementPrice * item.quantity
        return acc
      },
      { count: 0, cost: 0, retail: 0, settlement: 0 },
    )
  }, [form.bundleItems])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setStep(1)
    setBundleType('cruise')
    setDrawerOpen(true)
  }

  const openEdit = (record: PackageProduct) => {
    setEditingId(record.id)
    setForm(cloneFormFromRecord(record))
    setStep(1)
    setBundleType('cruise')
    setDrawerOpen(true)
  }

  const syncRulePricesFromBundle = (bundleItems: PackageBundleItem[]) => {
    const costPrice = bundleItems.reduce((sum, item) => sum + item.costPrice * item.quantity, 0)
    const suggestedPrice = bundleItems.reduce((sum, item) => sum + item.retailPrice * item.quantity, 0)
    const marketPrice = Math.max(suggestedPrice, suggestedPrice + 200)
    setForm((prev) => ({
      ...prev,
      bundleItems,
      rules: {
        ...prev.rules,
        costPrice,
        suggestedPrice,
        marketPrice,
      },
      channelConfigs: prev.channelConfigs.map((channel) => ({
        ...channel,
        settlementPrice: Math.max(channel.settlementPrice, costPrice),
      })),
    }))
  }

  const addBundleCandidate = (candidate: PackageBundleCandidate) => {
    const existing = form.bundleItems.find((item) => item.id === candidate.id)
    const nextItems = existing
      ? form.bundleItems.map((item) => (item.id === candidate.id ? { ...item, quantity: item.quantity + 1 } : item))
      : [...form.bundleItems, { ...candidate, quantity: 1 }]
    syncRulePricesFromBundle(nextItems)
  }

  const updateBundleQuantity = (id: string, quantity: number) => {
    const nextItems = form.bundleItems
      .map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item))
      .filter((item) => item.quantity > 0)
    syncRulePricesFromBundle(nextItems)
  }

  const removeBundleItem = (id: string) => {
    syncRulePricesFromBundle(form.bundleItems.filter((item) => item.id !== id))
  }

  const handleSavePackage = () => {
    const id = editingId || `PKG${String(records.length + 1).padStart(3, '0')}`
    const previous = records.find((item) => item.id === editingId)
    const nextRecord = buildPackageRecord(id, form, previous)
    setRecords((prev) => {
      if (editingId) return prev.map((item) => (item.id === editingId ? nextRecord : item))
      return [nextRecord, ...prev]
    })
    setDrawerOpen(false)
  }

  const openCalendar = (record: PackageProduct) => {
    setCalendarTargetId(record.id)
    setCalendarDraft(record.calendarOverrides.map((item) => ({ ...item })))
  }

  const openChannels = (record: PackageProduct) => {
    setChannelTargetId(record.id)
    setChannelDraft(record.channelConfigs.map((item) => ({ ...item })))
  }

  const activeCalendarTarget = records.find((item) => item.id === calendarTargetId) || null
  const activeChannelTarget = records.find((item) => item.id === channelTargetId) || null

  return (
    <div>
      <PageHeader title="套票管理" description="维护游轮套票产品、打包子票、票规、日历价格与渠道可售配置。" />

      <SearchPanel
        onSearch={() => {
          setAppliedKeyword(keyword)
          setAppliedShipFilter(shipFilter)
          setAppliedCategoryFilter(categoryFilter)
          setAppliedStatusFilter(statusFilter)
          setPage(1)
        }}
        onReset={() => {
          setKeyword('')
          setShipFilter('all')
          setCategoryFilter('all')
          setStatusFilter('all')
          setAppliedKeyword('')
          setAppliedShipFilter('all')
          setAppliedCategoryFilter('all')
          setAppliedStatusFilter('all')
          setPage(1)
        }}
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">套票名称</label>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="名称 / 航线 / 游轮" className="w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">游轮</label>
          <select value={shipFilter} onChange={(e) => setShipFilter(e.target.value)} className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm">
            {shipOptions.map((item) => <option key={item} value={item}>{item === 'all' ? '全部' : item}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">产品分类</label>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm">
            {categoryOptions.map((item) => <option key={item} value={item}>{item === 'all' ? '全部' : item}</option>)}
          </select>
        </div>
      </SearchPanel>

      <div className="bg-white px-9 py-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            {statusOptions.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  setStatusFilter(item.key)
                  setAppliedStatusFilter(item.key)
                  setPage(1)
                }}
                className={`rounded-md px-4 py-2 text-sm ${
                  appliedStatusFilter === item.key
                    ? 'bg-blue-50 text-blue-600'
                    : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button onClick={openCreate} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700">
            <Plus className="h-4 w-4" />新增套票
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {dataSource.length === 0 ? (
          <div className="border border-gray-200 bg-white px-8 py-20 text-center text-sm text-gray-400">暂无套票数据</div>
        ) : dataSource.map((record) => {
          const collapsed = expanded[record.id]
          const todayPrice = record.calendarOverrides[0]?.salePrice || record.rules.suggestedPrice
          const minChannelPrice = Math.min(...record.channelConfigs.map((item) => item.retailPrice))
          return (
            <div key={record.id} className="overflow-hidden border border-gray-200 bg-white">
              <div className="flex items-start gap-4 px-6 py-5">
                <button onClick={() => setExpanded((prev) => ({ ...prev, [record.id]: !prev[record.id] }))} className="mt-10 text-gray-400 hover:text-gray-700">
                  {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <div className="h-20 w-28 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100">
                  {record.coverImages[0] ? (
                    <img src={record.coverImages[0]} alt={record.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">暂无封面</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-rose-50 px-2 py-0.5 text-xs text-rose-600">{record.category}</span>
                    <h3 className="text-lg font-semibold text-gray-900">{record.name}</h3>
                    <span className="font-mono text-xs text-gray-400">{record.id}</span>
                    <StatusPill status={record.status} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-10 gap-y-1 text-sm text-gray-500">
                    <div>航线：{record.routeName}</div>
                    <div>行程：{record.itineraryName}</div>
                    <div>游轮：{record.shipName}</div>
                    <div>包含子票：{record.bundleItems.length} 项</div>
                    <div>今日起售价：<span className="font-medium text-gray-900">{formatCurrency(todayPrice)}</span></div>
                    <div>渠道最低售价：<span className="font-medium text-gray-900">{formatCurrency(minChannelPrice)}</span></div>
                  </div>
                  <div className="mt-3 text-xs text-gray-400">更新人：{record.updatedBy} · 更新时间：{record.updatedAt}</div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => openEdit(record)} className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">编辑套票</button>
                  <button onClick={() => openCalendar(record)} className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">日历价格</button>
                  <button onClick={() => openChannels(record)} className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">渠道设置</button>
                  {record.status !== 'deleted' && (
                    <>
                      <button
                        onClick={() => setRecords((prev) => prev.map((item) => item.id === record.id ? { ...item, status: item.status === 'enabled' ? 'disabled' : 'enabled', updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') } : item))}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {record.status === 'enabled' ? '下架' : '上架'}
                      </button>
                      <button onClick={() => setDeleteTarget(record)} className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50">删除</button>
                    </>
                  )}
                </div>
              </div>

              {collapsed && (
                <div className="border-t border-gray-200">
                  <div className="grid grid-cols-[2.2fr_repeat(5,1fr)_1.2fr] gap-0 bg-gray-50 text-xs font-medium text-gray-600">
                    {['子票名称', '来源', '成本价', '零售价', '结算价', '数量', '标签'].map((title) => (
                      <div key={title} className="border-r border-gray-200 px-4 py-3 last:border-r-0">{title}</div>
                    ))}
                  </div>
                  {record.bundleItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-[2.2fr_repeat(5,1fr)_1.2fr] gap-0 border-t border-gray-100 text-sm text-gray-700">
                      <div className="px-4 py-3">{item.name}</div>
                      <div className="px-4 py-3">{item.sourceType === 'cruise' ? '游轮产品' : '附加产品'}</div>
                      <div className="px-4 py-3">{formatCurrency(item.costPrice)}</div>
                      <div className="px-4 py-3">{formatCurrency(item.retailPrice)}</div>
                      <div className="px-4 py-3">{formatCurrency(item.settlementPrice)}</div>
                      <div className="px-4 py-3">{item.quantity}</div>
                      <div className="px-4 py-3">{item.tag}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredRecords.length > 0 && (
        <div className="mt-4 flex justify-end">
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1} className="rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 disabled:opacity-40">上一页</button>
            <span className="rounded border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700">{page}</span>
            <button onClick={() => setPage((prev) => Math.min(Math.ceil(filteredRecords.length / pageSize), prev + 1))} disabled={page >= Math.ceil(filteredRecords.length / pageSize)} className="rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 disabled:opacity-40">下一页</button>
          </div>
        </div>
      )}

      <DetailDrawer open={drawerOpen} width="w-[1180px]" title={editingId ? '编辑套票' : '新增套票'} onClose={() => setDrawerOpen(false)}>
        <StepHeader current={step} />

        {step === 1 && (
          <div className="space-y-6">
            <section className="rounded-lg border border-gray-200 p-5">
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">基本信息</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-1 block text-sm text-gray-700">产品名称 <span className="text-red-500">*</span></label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="请输入套票名称" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">所在地区</label>
                  <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="境内">境内</option>
                    <option value="境外">境外</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">国家 / 城市</label>
                  <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-sm text-gray-700">详细地址</label>
                  <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="便于游客导航或取票" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">联系电话</label>
                  <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">产品分类</label>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">关联航线</label>
                  <input value={form.routeName} onChange={(e) => setForm({ ...form, routeName: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">关联行程</label>
                  <input value={form.itineraryName} onChange={(e) => setForm({ ...form, itineraryName: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">游轮</label>
                  <input value={form.shipName} onChange={(e) => setForm({ ...form, shipName: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">排序号</label>
                  <input type="number" value={form.sortNo} onChange={(e) => setForm({ ...form, sortNo: Number(e.target.value) })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 p-5">
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">图片与媒体</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-gray-700">封面图 URL</label>
                  <input value={form.coverImages[0] || ''} onChange={(e) => setForm({ ...form, coverImages: e.target.value ? [e.target.value] : [] })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="https://..." />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">详情图 URL</label>
                  <input value={form.detailImages[0] || ''} onChange={(e) => setForm({ ...form, detailImages: e.target.value ? [e.target.value] : [] })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="https://..." />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">产品视频 URL</label>
                  <input value={form.videoUrls[0] || ''} onChange={(e) => setForm({ ...form, videoUrls: e.target.value ? [e.target.value] : [] })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="https://..." />
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 p-5">
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">产品详情</h4>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-gray-700">预订须知</label>
                  <textarea value={form.bookingNotice} onChange={(e) => setForm({ ...form, bookingNotice: e.target.value })} rows={5} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">产品介绍</label>
                  <textarea value={form.productIntro} onChange={(e) => setForm({ ...form, productIntro: e.target.value })} rows={5} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm text-gray-700">套餐简介</label>
                    <textarea value={form.packageIntro} onChange={(e) => setForm({ ...form, packageIntro: e.target.value })} rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-700">包含票类说明</label>
                    <textarea value={form.includedTicketDesc} onChange={(e) => setForm({ ...form, includedTicketDesc: e.target.value })} rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-[1.8fr_380px] gap-6">
            <section className="rounded-lg border border-gray-200 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex gap-3">
                  <button onClick={() => setBundleType('cruise')} className={`rounded-md px-4 py-2 text-sm ${bundleType === 'cruise' ? 'bg-blue-50 text-blue-600' : 'border border-gray-200 text-gray-600'}`}>游轮产品</button>
                  <button onClick={() => setBundleType('addon')} className={`rounded-md px-4 py-2 text-sm ${bundleType === 'addon' ? 'bg-blue-50 text-blue-600' : 'border border-gray-200 text-gray-600'}`}>附加产品</button>
                </div>
                <div className="text-xs text-gray-400">支持选择游轮主票与附加产品进行组合</div>
              </div>
              <div className="mb-4 grid grid-cols-3 gap-3">
                <input value={bundleKeyword} onChange={(e) => setBundleKeyword(e.target.value)} placeholder="产品名称 / 供应商" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <select value={bundleSupplierScope} onChange={(e) => setBundleSupplierScope(e.target.value as SupplierScope | 'all')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {Object.entries(supplierScopeLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
                <button onClick={() => setBundleKeyword('')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">清空筛选</button>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="grid grid-cols-[2fr_repeat(4,1fr)_88px] bg-gray-50 text-xs font-medium text-gray-600">
                  {['产品名称', '成本价', '零售价', '结算价', '来源', '选择'].map((title) => (
                    <div key={title} className="border-r border-gray-200 px-4 py-3 last:border-r-0">{title}</div>
                  ))}
                </div>
                {bundleCandidates.map((item) => (
                  <div key={item.id} className="grid grid-cols-[2fr_repeat(4,1fr)_88px] border-t border-gray-100 text-sm text-gray-700">
                    <div className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="mt-1 text-xs text-gray-400">{item.supplierName} · {item.tag}</div>
                    </div>
                    <div className="px-4 py-3">{formatCurrency(item.costPrice)}</div>
                    <div className="px-4 py-3">{formatCurrency(item.retailPrice)}</div>
                    <div className="px-4 py-3">{formatCurrency(item.settlementPrice)}</div>
                    <div className="px-4 py-3">{supplierScopeLabel[item.supplierScope]}</div>
                    <div className="px-4 py-3">
                      <button onClick={() => addBundleCandidate(item)} className="rounded border border-blue-200 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50">加入</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="rounded-lg border border-gray-200 bg-gray-50 p-5">
              <h4 className="text-base font-semibold text-gray-900">已选子票</h4>
              <div className="mt-4 space-y-3">
                {form.bundleItems.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-400">请先从左侧添加子票</div>
                ) : form.bundleItems.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="mt-1 text-xs text-gray-400">{formatCurrency(item.costPrice)} / 份 · {item.tag}</div>
                      </div>
                      <button onClick={() => removeBundleItem(item.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-gray-500">数量</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateBundleQuantity(item.id, item.quantity - 1)} className="h-8 w-8 rounded border border-gray-200 text-gray-500">-</button>
                        <span className="w-8 text-center text-sm text-gray-900">{item.quantity}</span>
                        <button onClick={() => updateBundleQuantity(item.id, item.quantity + 1)} className="h-8 w-8 rounded border border-gray-200 text-gray-500">+</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-lg bg-white p-4 text-sm">
                <div className="flex justify-between py-1"><span className="text-gray-500">已选票数</span><span className="font-medium text-gray-900">{bundleSummary.count}</span></div>
                <div className="flex justify-between py-1"><span className="text-gray-500">总打包成本</span><span className="font-medium text-red-500">{formatCurrency(bundleSummary.cost)}</span></div>
                <div className="flex justify-between py-1"><span className="text-gray-500">总零售价</span><span className="font-medium text-red-500">{formatCurrency(bundleSummary.retail)}</span></div>
                <div className="flex justify-between py-1"><span className="text-gray-500">建议结算价</span><span className="font-medium text-gray-900">{formatCurrency(bundleSummary.settlement)}</span></div>
              </div>
            </aside>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <section className="rounded-lg border border-gray-200 p-5">
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">日历与库存</h4>
              <div className="grid grid-cols-4 gap-4">
                <Field label="销售开始日期"><input type="date" value={form.rules.saleStartDate} onChange={(e) => setForm({ ...form, rules: { ...form.rules, saleStartDate: e.target.value } })} className={fieldInputClass} /></Field>
                <Field label="销售结束日期"><input type="date" value={form.rules.saleEndDate} onChange={(e) => setForm({ ...form, rules: { ...form.rules, saleEndDate: e.target.value } })} className={fieldInputClass} /></Field>
                <Field label="总库存"><input type="number" value={form.rules.totalStock} onChange={(e) => setForm({ ...form, rules: { ...form.rules, totalStock: Number(e.target.value) } })} className={fieldInputClass} /></Field>
                <Field label="日库存"><input type="number" value={form.rules.dailyStock} onChange={(e) => setForm({ ...form, rules: { ...form.rules, dailyStock: Number(e.target.value) } })} className={fieldInputClass} /></Field>
                <Field label="打包成本单价"><input type="number" value={form.rules.costPrice} onChange={(e) => setForm({ ...form, rules: { ...form.rules, costPrice: Number(e.target.value) } })} className={fieldInputClass} /></Field>
                <Field label="建议销售价"><input type="number" value={form.rules.suggestedPrice} onChange={(e) => setForm({ ...form, rules: { ...form.rules, suggestedPrice: Number(e.target.value) } })} className={fieldInputClass} /></Field>
                <Field label="门市价"><input type="number" value={form.rules.marketPrice} onChange={(e) => setForm({ ...form, rules: { ...form.rules, marketPrice: Number(e.target.value) } })} className={fieldInputClass} /></Field>
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 p-5">
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">下单与预约</h4>
              <div className="grid grid-cols-4 gap-4">
                  <Field label="票说明"><textarea value={form.rules.ticketNotice} onChange={(e) => setForm({ ...form, rules: { ...form.rules, ticketNotice: e.target.value } })} rows={4} className={`${fieldInputClass} resize-none`} /></Field>
                <Field label="提前预定">
                  <div className="flex gap-2">
                    <button onClick={() => setForm({ ...form, rules: { ...form.rules, bookingMode: 'today' } })} className={`rounded px-3 py-2 text-sm ${form.rules.bookingMode === 'today' ? 'bg-blue-50 text-blue-600' : 'border border-gray-200 text-gray-600'}`}>当天可预定</button>
                    <button onClick={() => setForm({ ...form, rules: { ...form.rules, bookingMode: 'advance' } })} className={`rounded px-3 py-2 text-sm ${form.rules.bookingMode === 'advance' ? 'bg-blue-50 text-blue-600' : 'border border-gray-200 text-gray-600'}`}>需提前预定</button>
                  </div>
                  {form.rules.bookingMode === 'advance' && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                      提前
                      <input type="number" value={form.rules.advanceDays} onChange={(e) => setForm({ ...form, rules: { ...form.rules, advanceDays: Number(e.target.value) } })} className="w-20 rounded border border-gray-300 px-2 py-1.5 text-sm" />
                      天
                    </div>
                  )}
                </Field>
                <Field label="最少购买张数"><input type="number" value={form.rules.minPurchaseQty} onChange={(e) => setForm({ ...form, rules: { ...form.rules, minPurchaseQty: Number(e.target.value) } })} className={fieldInputClass} /></Field>
                <Field label="最多购买张数"><input type="number" value={form.rules.maxPurchaseQty} onChange={(e) => setForm({ ...form, rules: { ...form.rules, maxPurchaseQty: Number(e.target.value) } })} className={fieldInputClass} /></Field>
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 p-5">
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">实名与人群规则</h4>
              <div className="grid grid-cols-4 gap-4">
                <Field label="是否实名">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={form.rules.realNameRequired} onChange={(e) => setForm({ ...form, rules: { ...form.rules, realNameRequired: e.target.checked } })} />
                    需要实名校验
                  </label>
                </Field>
                <Field label="人群规则">
                  <div className="flex gap-2">
                    <button onClick={() => setForm({ ...form, rules: { ...form.rules, crowdMode: 'unlimited' } })} className={`rounded px-3 py-2 text-sm ${form.rules.crowdMode === 'unlimited' ? 'bg-blue-50 text-blue-600' : 'border border-gray-200 text-gray-600'}`}>不限</button>
                    <button onClick={() => setForm({ ...form, rules: { ...form.rules, crowdMode: 'family' } })} className={`rounded px-3 py-2 text-sm ${form.rules.crowdMode === 'family' ? 'bg-blue-50 text-blue-600' : 'border border-gray-200 text-gray-600'}`}>家庭</button>
                  </div>
                </Field>
                <Field label="成人人数"><input type="number" value={form.rules.adultLimit} onChange={(e) => setForm({ ...form, rules: { ...form.rules, adultLimit: Number(e.target.value) } })} className={fieldInputClass} /></Field>
                <Field label="儿童人数"><input type="number" value={form.rules.childLimit} onChange={(e) => setForm({ ...form, rules: { ...form.rules, childLimit: Number(e.target.value) } })} className={fieldInputClass} /></Field>
                <Field label="老人数量"><input type="number" value={form.rules.elderLimit} onChange={(e) => setForm({ ...form, rules: { ...form.rules, elderLimit: Number(e.target.value) } })} className={fieldInputClass} /></Field>
                <Field label="不限制票"><input type="number" value={form.rules.noSeatLimit} onChange={(e) => setForm({ ...form, rules: { ...form.rules, noSeatLimit: Number(e.target.value) } })} className={fieldInputClass} /></Field>
                <Field label="可预约时段">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={form.rules.appointmentTimeLimited} onChange={(e) => setForm({ ...form, rules: { ...form.rules, appointmentTimeLimited: e.target.checked } })} />
                    限时预约
                  </label>
                </Field>
                <Field label="时段列表">
                  <input value={form.rules.appointmentSlots.join('，')} onChange={(e) => setForm({ ...form, rules: { ...form.rules, appointmentSlots: e.target.value.split('，').filter(Boolean) } })} className={fieldInputClass} placeholder="08:00-10:00，14:00-16:00" />
                </Field>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-6">
              <div className="rounded-lg border border-gray-200 p-5">
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">支付与通知</h4>
                <div className="space-y-4">
                  <Field label="自动取消时间（分钟）"><input type="number" value={form.rules.payAutoCancelMinutes} onChange={(e) => setForm({ ...form, rules: { ...form.rules, payAutoCancelMinutes: Number(e.target.value) } })} className={fieldInputClass} /></Field>
                  <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.rules.notifySuccess} onChange={(e) => setForm({ ...form, rules: { ...form.rules, notifySuccess: e.target.checked } })} /> 预定成功通知游客</label>
                  <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.rules.notifyCancel} onChange={(e) => setForm({ ...form, rules: { ...form.rules, notifyCancel: e.target.checked } })} /> 取消订单通知游客</label>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-5">
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">取票、有效期与退改</h4>
                <div className="space-y-4">
                  <Field label="取票方式">
                    <select value={form.rules.pickupMode} onChange={(e) => setForm({ ...form, rules: { ...form.rules, pickupMode: e.target.value as PackageRuleForm['pickupMode'] } })} className={fieldInputClass}>
                      <option value="qr">二维码验票</option>
                      <option value="voucher">凭证核销</option>
                    </select>
                  </Field>
                  <Field label="有效期规则">
                    <select value={form.rules.validMode} onChange={(e) => setForm({ ...form, rules: { ...form.rules, validMode: e.target.value as PackageRuleForm['validMode'] } })} className={fieldInputClass}>
                      <option value="fixed">固定有效期</option>
                      <option value="relative">购买后N天有效</option>
                    </select>
                  </Field>
                  <Field label="退改规则">
                    <select value={form.rules.refundMode} onChange={(e) => setForm({ ...form, rules: { ...form.rules, refundMode: e.target.value as PackageRuleForm['refundMode'] } })} className={fieldInputClass}>
                      <option value="not_refundable">不可退</option>
                      <option value="follow_sub_ticket">随子票规则退</option>
                      <option value="custom">自定义退票规则</option>
                    </select>
                  </Field>
                  {form.rules.refundMode === 'custom' && (
                    <Field label="退票手续费"><input type="number" value={form.rules.refundFee} onChange={(e) => setForm({ ...form, rules: { ...form.rules, refundFee: Number(e.target.value) } })} className={fieldInputClass} /></Field>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <section className="rounded-lg border border-gray-200 p-5">
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">发布确认</h4>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-2 text-gray-600">
                  <div>套票名称：<span className="font-medium text-gray-900">{form.name || '未填写'}</span></div>
                  <div>游轮 / 行程：<span className="font-medium text-gray-900">{form.shipName} / {form.itineraryName}</span></div>
                  <div>包含子票：<span className="font-medium text-gray-900">{form.bundleItems.length} 项</span></div>
                  <div>打包成本：<span className="font-medium text-red-500">{formatCurrency(form.rules.costPrice)}</span></div>
                  <div>建议销售价：<span className="font-medium text-gray-900">{formatCurrency(form.rules.suggestedPrice)}</span></div>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="mb-3 text-sm font-medium text-gray-900">保存目标</div>
                  <div className="space-y-3">
                    {(['draft', 'disabled', 'enabled'] as const).map((item) => (
                      <label key={item} className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="radio" checked={form.publishTarget === item} onChange={() => setForm({ ...form, publishTarget: item })} />
                        {item === 'draft' ? '放入仓库（草稿）' : item === 'disabled' ? '保存为已下架' : '保存并上架'}
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    保存为“草稿”时，产品状态进入仓库；恢复后默认以“已下架”状态回到套票管理列表。
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
          <button onClick={() => step > 1 ? setStep(step - 1) : setDrawerOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            {step === 1 ? '取消' : '上一步'}
          </button>
          <div className="flex gap-3">
            {step < 4 ? (
              <>
                <button onClick={() => setForm({ ...form, publishTarget: 'draft' })} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">保存草稿</button>
                <button onClick={() => setStep(step + 1)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">下一步</button>
              </>
            ) : (
              <button onClick={handleSavePackage} className="rounded-lg bg-blue-600 px-5 py-2 text-sm text-white hover:bg-blue-700">
                {editingId ? '保存套票' : '创建套票'}
              </button>
            )}
          </div>
        </div>
      </DetailDrawer>

      <FormDialog
        open={Boolean(calendarTargetId)}
        title={`日历价格设置${activeCalendarTarget ? ` · ${activeCalendarTarget.name}` : ''}`}
        width="max-w-4xl"
        onCancel={() => setCalendarTargetId(null)}
        onSubmit={() => {
          if (!activeCalendarTarget) return
          setRecords((prev) => prev.map((item) => item.id === activeCalendarTarget.id ? { ...item, calendarOverrides: calendarDraft.map((row) => ({ ...row })) } : item))
          setCalendarTargetId(null)
        }}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">列表展示今日价格；未设置日期会回退到基础票规中的建议销售价。</div>
            <button
              type="button"
              onClick={() => setCalendarDraft((prev) => [...prev, { id: `new-${Date.now()}`, date: '2026-08-01', dailyStock: 20, salePrice: activeCalendarTarget?.rules.suggestedPrice || 0, settlementPrice: activeCalendarTarget?.rules.costPrice || 0 }])}
              className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              新增日期
            </button>
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr_88px] bg-gray-50 text-xs font-medium text-gray-600">
              {['日期', '日库存', '销售价', '结算价', '操作'].map((title) => <div key={title} className="border-r border-gray-200 px-4 py-3 last:border-r-0">{title}</div>)}
            </div>
            {calendarDraft.map((row) => (
              <div key={row.id} className="grid grid-cols-[1.3fr_1fr_1fr_1fr_88px] border-t border-gray-100">
                <div className="px-4 py-3"><input type="date" value={row.date} onChange={(e) => setCalendarDraft((prev) => prev.map((item) => item.id === row.id ? { ...item, date: e.target.value } : item))} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" /></div>
                <div className="px-4 py-3"><input type="number" value={row.dailyStock} onChange={(e) => setCalendarDraft((prev) => prev.map((item) => item.id === row.id ? { ...item, dailyStock: Number(e.target.value) } : item))} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" /></div>
                <div className="px-4 py-3"><input type="number" value={row.salePrice} onChange={(e) => setCalendarDraft((prev) => prev.map((item) => item.id === row.id ? { ...item, salePrice: Number(e.target.value) } : item))} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" /></div>
                <div className="px-4 py-3"><input type="number" value={row.settlementPrice} onChange={(e) => setCalendarDraft((prev) => prev.map((item) => item.id === row.id ? { ...item, settlementPrice: Number(e.target.value) } : item))} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" /></div>
                <div className="px-4 py-3"><button onClick={() => setCalendarDraft((prev) => prev.filter((item) => item.id !== row.id))} className="text-sm text-red-500 hover:text-red-600">删除</button></div>
              </div>
            ))}
          </div>
        </div>
      </FormDialog>

      <FormDialog
        open={Boolean(channelTargetId)}
        title={`渠道设置${activeChannelTarget ? ` · ${activeChannelTarget.name}` : ''}`}
        width="max-w-4xl"
        onCancel={() => setChannelTargetId(null)}
        onSubmit={() => {
          if (!activeChannelTarget) return
          setRecords((prev) => prev.map((item) => item.id === activeChannelTarget.id ? { ...item, channelConfigs: channelDraft.map((row) => ({ ...row })) } : item))
          setChannelTargetId(null)
        }}
      >
        <div className="space-y-4">
          <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            渠道开启后才能售卖；渠道结算价不能低于套票打包成本。
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="grid grid-cols-[1.3fr_0.8fr_1fr_1fr] bg-gray-50 text-xs font-medium text-gray-600">
              {['渠道', '是否可售', '结算价', '零售价'].map((title) => <div key={title} className="border-r border-gray-200 px-4 py-3 last:border-r-0">{title}</div>)}
            </div>
            {channelDraft.map((row) => (
              <div key={row.id} className="grid grid-cols-[1.3fr_0.8fr_1fr_1fr] border-t border-gray-100">
                <div className="px-4 py-3 text-sm text-gray-700">{row.channelName}</div>
                <div className="px-4 py-3"><input type="checkbox" checked={row.enabled} onChange={(e) => setChannelDraft((prev) => prev.map((item) => item.id === row.id ? { ...item, enabled: e.target.checked } : item))} /></div>
                <div className="px-4 py-3"><input type="number" value={row.settlementPrice} onChange={(e) => setChannelDraft((prev) => prev.map((item) => item.id === row.id ? { ...item, settlementPrice: Number(e.target.value) } : item))} className={`w-full rounded border px-2 py-1.5 text-sm ${row.settlementPrice < (activeChannelTarget?.rules.costPrice || 0) ? 'border-red-300 text-red-600' : 'border-gray-300'}`} /></div>
                <div className="px-4 py-3"><input type="number" value={row.retailPrice} onChange={(e) => setChannelDraft((prev) => prev.map((item) => item.id === row.id ? { ...item, retailPrice: Number(e.target.value) } : item))} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" /></div>
              </div>
            ))}
          </div>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="删除套票"
        message="删除后数据进入已删除状态，仅供后台查询，不再支持编辑和售卖。"
        confirmText="确认删除"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return
          setRecords((prev) => prev.map((item) => item.id === deleteTarget.id ? { ...item, status: 'deleted', updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') } : item))
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-gray-700">{label}</label>
      {children}
    </div>
  )
}
