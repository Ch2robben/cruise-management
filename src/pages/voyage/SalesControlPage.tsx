import { useEffect, useMemo, useState } from 'react'
import { Pencil } from 'lucide-react'
import { groupItineraryRows, itineraryActivityColumns, formatItineraryDayLabel } from '@/components/voyage/ItineraryEditor'
import VoyageTipManagementPanel, { type RouteSegmentOption } from '@/components/voyage/VoyageTipManagementPanel'
import VoyagePriceGradientPanel from '@/components/voyage/VoyagePriceGradientPanel'
import { templateApi } from '@/mock/api'
import { voyageInventories, voyageTemplates, voyages, products } from '@/mock/data'
import {
  aggregatePhysicalCapacity,
  aggregatePublicStock,
  getTemplateSellRoomTypes,
  loadTemplateInventoryRules,
  saveTemplateInventoryRules,
  setAggregatedInventoryField,
  type TemplateInventoryRules,
} from '@/mock/templateInventoryRules'
import type { TemplateItinerary, Voyage, VoyageTemplate } from '@/types'
import { resolveTemplateItinerary } from '@/utils/productVoyageConfig'

type ControlTab = 'inventory' | 'sales' | 'itinerary' | 'warning' | 'tip' | 'gradient'
type PolicyType = 'all' | 'ota' | 'dealer' | 'group' | 'port' | 'regional'
type InventoryThresholdType = 'quantity' | 'percent'

interface CabinStockRow {
  id: string
  name: string
  release: number
  sold: number
}

interface PublicInventoryRow {
  sellRoomTypeCode: string
  name: string
  physicalCapacity: number
  publicStock: number
  sold: number
  status: 'open' | 'closed'
}

type InventoryWarningLevel = 'high' | 'medium' | 'low'

interface InventoryWarningRow extends PublicInventoryRow {
  threshold: number
  thresholdType: InventoryThresholdType
  owner: string
  handled: boolean
  release: number
}

interface PolicyRow {
  id: string
  name: string
  type: Exclude<PolicyType, 'all'>
  allowSales: number
  maxSales: number
  sold: number
}

interface PriceRow {
  id: string
  code: string
  portPrice: number
  settlementPrice: number
  availableSales: number
  sold: number
  validStart: string
  validEnd: string
}

const baseTabs: Array<{ key: ControlTab; label: string }> = [
  { key: 'inventory', label: '公有库存' },
  { key: 'sales', label: '销售控制' },
  { key: 'itinerary', label: '航次行程' },
  { key: 'warning', label: '库存预警' },
]

const cabinRows: CabinStockRow[] = [
  { id: 'std-a', name: '长江叁号豪华阳台标准间', release: 172, sold: 36 },
  { id: 'std-b', name: '长江叁号4楼豪华阳台标准', release: 128, sold: 28 },
  { id: 'std-c', name: '长江叁号5楼豪华阳台标准', release: 80, sold: 18 },
  { id: 'family-a', name: '长江叁号5楼大床房', release: 6, sold: 2 },
  { id: 'family-b', name: '长江叁号6楼大床房', release: 6, sold: 1 },
  { id: 'suite-family', name: '长江叁号家庭套房', release: 20, sold: 6 },
  { id: 'suite-admin', name: '长江叁号行政房', release: 20, sold: 7 },
  { id: 'suite-view', name: '长江叁号观景套房', release: 8, sold: 5 },
  { id: 'suite-luxury', name: '长江叁号豪华套房', release: 4, sold: 2 },
  { id: 'suite-ceo', name: '长江叁号总套套房', release: 4, sold: 1 },
  { id: 'inside-23', name: '长江叁号2-3楼内舱房', release: 10, sold: 3 },
  { id: 'inside-4', name: '长江叁号4楼内舱房', release: 12, sold: 5 },
  { id: 'inside-5', name: '长江叁号5楼内舱房', release: 12, sold: 4 },
  { id: 'barrier-free', name: '长江叁号无障碍房', release: 2, sold: 0 },
  { id: 'theater', name: '长江叁号影院房', release: 16, sold: 3 },
]

const inventoryWarningRows: InventoryWarningRow[] = [
  {
    sellRoomTypeCode: 'vip-balcony-standard',
    name: '长江叁号豪华阳台标准间',
    physicalCapacity: 202,
    publicStock: 202,
    sold: 188,
    status: 'open',
    release: 202,
    threshold: 10,
    thresholdType: 'quantity',
    owner: '运营专员',
    handled: true,
  },
  {
    sellRoomTypeCode: 'deluxe-suite',
    name: '长江壹号豪华套房',
    physicalCapacity: 12,
    publicStock: 12,
    sold: 5,
    status: 'open',
    release: 12,
    threshold: 5,
    thresholdType: 'quantity',
    owner: '库存专员',
    handled: false,
  },
  {
    sellRoomTypeCode: 'presidential-suite',
    name: '长江壹号总统套房',
    physicalCapacity: 4,
    publicStock: 4,
    sold: 4,
    status: 'open',
    release: 4,
    threshold: 2,
    thresholdType: 'quantity',
    owner: '系统自动',
    handled: false,
  },
]

const currentVoyage = voyages[0]
const currentVoyageTemplate = voyageTemplates.find(template => (
  template.id === currentVoyage?.templateId || template.productId === currentVoyage?.productId
))
const currentProduct = products.find((product) => product.id === currentVoyage?.productId)

/** 是否已从模板剥离：voyage 上有自己的 itinerary 数组 */
const voyageHasOwnItinerary = Array.isArray(currentVoyage?.itinerary)
/** 实际展示的行程数据 */
const resolvedItinerary: TemplateItinerary[] =
  voyageHasOwnItinerary
    ? (currentVoyage.itinerary as TemplateItinerary[])
    : (currentVoyageTemplate ? resolveTemplateItinerary(currentVoyageTemplate, currentProduct) : [])

const initialPolicyRows: PolicyRow[] = [
  { id: 'p-ota-1', name: '携程阶梯控售政策', type: 'ota', allowSales: 58, maxSales: 80, sold: 21 },
  { id: 'p-ota-2', name: '飞猪周末促销政策', type: 'ota', allowSales: 32, maxSales: 40, sold: 12 },
  { id: 'p-dealer-1', name: '西南分销商控售', type: 'dealer', allowSales: 46, maxSales: 60, sold: 18 },
  { id: 'p-group-1', name: '华东组团社保留位', type: 'group', allowSales: 24, maxSales: 30, sold: 10 },
  { id: 'p-port-1', name: '重庆出发默认口岸价', type: 'port', allowSales: 120, maxSales: 150, sold: 42 },
  { id: 'p-reg-1', name: '湖北省区域结算价', type: 'regional', allowSales: 80, maxSales: 100, sold: 26 },
]

const initialPriceRowsByPolicy: Record<string, PriceRow[]> = {
  'p-ota-1': [
    { id: 'price-sp-ota1', code: 'SP', portPrice: 2780, settlementPrice: 2580, availableSales: 12, sold: 6, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-a', code: 'STD-A-OTA', portPrice: 2880, settlementPrice: 2680, availableSales: 17, sold: 11, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-b', code: 'STD-A-DLR', portPrice: 2750, settlementPrice: 2550, availableSales: 11, sold: 7, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-c', code: 'STD-A-GRP', portPrice: 2680, settlementPrice: 2480, availableSales: 2, sold: 10, validStart: '2026-05-15', validEnd: '2026-05-17' },
    { id: 'price-d', code: 'STD-A-LAST', portPrice: 3180, settlementPrice: 2980, availableSales: 0, sold: 8, validStart: '2026-05-16', validEnd: '2026-05-18' },
  ],
  'p-ota-2': [
    { id: 'price-sp-ota2', code: 'SP', portPrice: 2680, settlementPrice: 2480, availableSales: 8, sold: 3, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-ota2-a', code: 'STD-A-OTA-WK', portPrice: 2780, settlementPrice: 2580, availableSales: 12, sold: 8, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-ota2-b', code: 'STD-A-OTA-WK2', portPrice: 2680, settlementPrice: 2480, availableSales: 8, sold: 4, validStart: '2026-05-15', validEnd: '2026-05-18' },
  ],
  'p-dealer-1': [
    { id: 'price-sp-dlr', code: 'SP', portPrice: 2620, settlementPrice: 2420, availableSales: 10, sold: 4, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-dlr-a', code: 'STD-A-DLR-SW', portPrice: 2720, settlementPrice: 2520, availableSales: 18, sold: 12, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-dlr-b', code: 'STD-A-DLR-SW2', portPrice: 2620, settlementPrice: 2420, availableSales: 10, sold: 6, validStart: '2026-05-15', validEnd: '2026-05-18' },
  ],
  'p-group-1': [
    { id: 'price-sp-grp', code: 'SP', portPrice: 2480, settlementPrice: 2280, availableSales: 6, sold: 2, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-grp-a', code: 'STD-A-GRP-EA', portPrice: 2580, settlementPrice: 2380, availableSales: 8, sold: 7, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-grp-b', code: 'STD-A-GRP-EA2', portPrice: 2480, settlementPrice: 2280, availableSales: 6, sold: 3, validStart: '2026-05-15', validEnd: '2026-05-17' },
  ],
  'p-port-1': [
    { id: 'price-sp-port', code: 'SP', portPrice: 2480, settlementPrice: 2280, availableSales: 20, sold: 8, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-port-a', code: 'STD-A-PORT', portPrice: 2580, settlementPrice: 2380, availableSales: 38, sold: 22, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-port-b', code: 'STD-A-PORT-P', portPrice: 2480, settlementPrice: 2280, availableSales: 26, sold: 14, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-port-c', code: 'STD-A-PORT-L', portPrice: 2380, settlementPrice: 2180, availableSales: 14, sold: 6, validStart: '2026-05-15', validEnd: '2026-05-18' },
  ],
  'p-reg-1': [
    { id: 'price-sp-reg', code: 'SP', portPrice: 2280, settlementPrice: 2080, availableSales: 15, sold: 5, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-reg-a', code: 'STD-A-REG', portPrice: 2380, settlementPrice: 2180, availableSales: 26, sold: 14, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-reg-b', code: 'STD-A-REG-HB', portPrice: 2280, settlementPrice: 2080, availableSales: 17, sold: 8, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-reg-c', code: 'STD-A-REG-YC', portPrice: 2180, settlementPrice: 1980, availableSales: 11, sold: 4, validStart: '2026-05-15', validEnd: '2026-05-17' },
  ],
}

function clonePriceRowsByPolicy(source: Record<string, PriceRow[]>) {
  return Object.fromEntries(
    Object.entries(source).map(([policyId, rows]) => [
      policyId,
      rows.map((row) => ({ ...row })),
    ]),
  ) as Record<string, PriceRow[]>
}

function formatPriceValidPeriod(start: string, end: string) {
  const compact = (value: string) => value.slice(5).replace('-', '/')
  return `${compact(start)}~${compact(end)}`
}

const policyTypeLabels: Record<PolicyType, string> = {
  all: '全部',
  ota: 'OTA',
  dealer: '分销商',
  group: '组团社',
  port: '口岸价',
  regional: '区域价',
}

const inventoryWarningLabels: Record<InventoryWarningLevel, string> = {
  high: '高风险',
  medium: '中风险',
  low: '低风险',
}

const inventoryWarningClass: Record<InventoryWarningLevel, string> = {
  high: 'bg-rose-50 text-rose-700 ring-rose-200',
  medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  low: 'bg-blue-50 text-blue-700 ring-blue-200',
}

function getEffectiveThreshold(release: number, threshold: number, thresholdType: InventoryThresholdType) {
  if (thresholdType === 'percent') return Math.ceil((release * threshold) / 100)
  return threshold
}

function formatThreshold(row: InventoryWarningRow) {
  return row.thresholdType === 'percent' ? `${row.threshold}%` : String(row.threshold)
}

function getInventoryWarningLevel(releaseUnsold: number, threshold: number): InventoryWarningLevel {
  if (releaseUnsold <= threshold) return 'high'
  if (releaseUnsold <= threshold * 2) return 'medium'
  return 'low'
}

export default function SalesControlPage() {
  return <SalesControlWorkspace />
}

export function SalesControlWorkspace({
  embedded = false,
  voyage,
  selectedSegmentKey = 'all',
  segmentOptions = [{ key: 'all', label: '全部航段' }],
}: {
  embedded?: boolean
  voyage?: Voyage
  selectedSegmentKey?: string
  segmentOptions?: RouteSegmentOption[]
}) {
  const [activeTab, setActiveTab] = useState<ControlTab>('sales')
  const selectedSegmentLabel = segmentOptions.find((item) => item.key === selectedSegmentKey)?.label || '全部航段'
  const tabs = embedded
    ? [
      ...baseTabs,
      { key: 'tip' as const, label: `小费管理 · ${selectedSegmentLabel}` },
      { key: 'gradient' as const, label: `调价梯度 · ${selectedSegmentLabel}` },
    ]
    : baseTabs
  const resolvedVoyage = voyage || currentVoyage
  const [selectedCabinId, setSelectedCabinId] = useState(cabinRows[0]?.id || '')
  const [selectedPolicyId, setSelectedPolicyId] = useState(initialPolicyRows[0]?.id || '')
  const [policyType, setPolicyType] = useState<PolicyType>('all')
  const [salesEditing, setSalesEditing] = useState(false)
  const [policyRows, setPolicyRows] = useState<PolicyRow[]>(() => initialPolicyRows.map((row) => ({ ...row })))
  const [priceRowsByPolicy, setPriceRowsByPolicy] = useState(() => clonePriceRowsByPolicy(initialPriceRowsByPolicy))
  const itinerary = resolvedItinerary

  const total = useMemo(() => {
    return cabinRows.reduce((acc, row) => {
      acc.release += row.release
      acc.sold += row.sold
      return acc
    }, { release: 0, sold: 0 })
  }, [])

  const filteredPolicies = useMemo(() => {
    return policyType === 'all' ? policyRows : policyRows.filter(row => row.type === policyType)
  }, [policyType, policyRows])

  const selectedCabin = cabinRows.find(row => row.id === selectedCabinId) || cabinRows[0]
  const selectedPolicy = policyRows.find(row => row.id === selectedPolicyId) || policyRows[0]
  const selectedCabinRate = selectedCabin.release <= 0 ? 0 : Math.round((selectedCabin.sold / selectedCabin.release) * 100)
  const priceRows = priceRowsByPolicy[selectedPolicy?.id || ''] || priceRowsByPolicy['p-ota-1'] || []

  const updatePolicyRow = (rowId: string, patch: Partial<Pick<PolicyRow, 'allowSales' | 'maxSales'>>) => {
    setPolicyRows((prev) => prev.map((row) => (
      row.id === rowId ? { ...row, ...patch } : row
    )))
  }

  const updatePriceRow = (rowId: string, patch: Partial<PriceRow>) => {
    if (!selectedPolicy?.id) return
    setPriceRowsByPolicy((prev) => ({
      ...prev,
      [selectedPolicy.id]: (prev[selectedPolicy.id] || []).map((row) => (
        row.id === rowId ? { ...row, ...patch } : row
      )),
    }))
  }

  const enterSalesEditing = () => setSalesEditing(true)
  const exitSalesEditing = () => setSalesEditing(false)

  return (
    <div className={`${embedded ? 'overflow-hidden rounded-lg border border-gray-200 bg-slate-100' : '-m-6 min-h-[calc(100vh-56px)] bg-slate-100'} text-slate-700`}>
      <div className="border-b border-slate-200 bg-white px-4">
        <nav className="flex h-11 items-center gap-7 overflow-x-auto text-sm">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              aria-selected={activeTab === tab.key}
              className={`h-full shrink-0 border-b-2 px-1 transition-colors ${
                activeTab === tab.key ? 'border-blue-600 font-medium text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="overflow-hidden p-2.5">
        {activeTab === 'inventory' ? (
          <PublicInventoryTab voyage={resolvedVoyage} />
        ) : activeTab === 'warning' ? (
          <InventoryWarningTab />
        ) : activeTab === 'tip' ? (
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <VoyageTipManagementPanel
              voyage={resolvedVoyage}
              selectedSegmentKey={selectedSegmentKey}
              embedded
            />
          </section>
        ) : activeTab === 'gradient' ? (
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <VoyagePriceGradientPanel
              voyage={resolvedVoyage}
              selectedSegmentKey={selectedSegmentKey}
              embedded
            />
          </section>
        ) : activeTab === 'itinerary' ? (
          <VoyageItineraryTab
            voyage={resolvedVoyage}
            template={voyageTemplates.find(template => (
              template.id === resolvedVoyage?.templateId || template.productId === resolvedVoyage?.productId
            ))}
            itinerary={itinerary}
            hasOwnItinerary={voyageHasOwnItinerary}
          />
        ) : activeTab === 'sales' && (
        <div className="grid min-w-0 grid-cols-[minmax(200px,0.68fr)_minmax(0,1.32fr)] items-start gap-2.5">
        <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">房型信息</h2>
                <p className="mt-1 truncate text-xs text-slate-500">当前房型：{selectedCabin?.name || '-'}</p>
              </div>
              <div className="rounded-md bg-slate-50 px-2.5 py-1 text-right">
                <div className="text-[11px] text-slate-500">售卖率</div>
                <div className="text-sm font-semibold text-slate-900">{selectedCabinRate}%</div>
              </div>
            </div>
          </div>
          <div className="h-[420px] overflow-y-auto overflow-x-hidden">
            <table className="w-full table-fixed border-separate border-spacing-0 text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 text-xs text-slate-500">
                  <th className="border-b border-slate-200 px-2.5 py-2 text-left font-medium">房型名称</th>
                  <th className="w-14 border-b border-slate-200 px-2 py-2 text-right font-medium">投放</th>
                  <th className="w-14 border-b border-slate-200 px-2 py-2 text-right font-medium">已售</th>
                  <th className="w-14 border-b border-slate-200 px-2 py-2 text-right font-medium">未售</th>
                </tr>
              </thead>
              <tbody>
                {cabinRows.map(row => {
                  const selected = row.id === selectedCabinId
                  const unsold = row.release - row.sold
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedCabinId(row.id)}
                      className={`cursor-pointer transition-colors ${selected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                    >
                      <td className={`truncate border-b border-slate-100 px-2.5 py-2 ${selected ? 'font-semibold text-blue-700' : 'text-slate-700'}`}>{row.name}</td>
                      <td className="border-b border-slate-100 px-2 py-2 text-right font-medium text-slate-900">{row.release}</td>
                      <td className="border-b border-slate-100 px-2 py-2 text-right font-medium text-emerald-600">{row.sold}</td>
                      <td className={`border-b border-slate-100 px-2 py-2 text-right font-medium ${unsold <= 3 ? 'text-rose-600' : 'text-slate-700'}`}>{unsold}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="sticky bottom-0 bg-slate-50 text-sm font-semibold text-slate-900">
                <tr>
                  <td className="border-t border-slate-200 px-2.5 py-2.5">合计</td>
                  <td className="border-t border-slate-200 px-2 py-2.5 text-right">{total.release}</td>
                  <td className="border-t border-slate-200 px-2 py-2.5 text-right text-emerald-600">{total.sold}</td>
                  <td className="border-t border-slate-200 px-2 py-2.5 text-right">{total.release - total.sold}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <div className="min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <p className="min-w-0 truncate whitespace-nowrap text-xs text-slate-500">
              {selectedCabin?.name || '-'} · {selectedPolicy?.name || '-'}
            </p>
            <button
              type="button"
              onClick={salesEditing ? exitSalesEditing : enterSalesEditing}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${
                salesEditing
                  ? 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              <Pencil className="h-3.5 w-3.5" />
              {salesEditing ? '完成' : '编辑'}
            </button>
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-2.5">
        <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="shrink-0 whitespace-nowrap text-sm font-semibold text-slate-900">价格政策</h2>
              <div className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-xs">
                <select
                  value={policyType}
                  onChange={(event) => {
                    const value = event.target.value as PolicyType
                    setPolicyType(value)
                    const nextPolicy = value === 'all' ? policyRows[0] : policyRows.find(row => row.type === value)
                    if (nextPolicy) setSelectedPolicyId(nextPolicy.id)
                  }}
                  className="h-7 max-w-[96px] rounded-md border border-slate-300 bg-white px-1.5 text-xs text-slate-700"
                >
                  {(Object.keys(policyTypeLabels) as PolicyType[]).map(type => (
                    <option key={type} value={type}>{policyTypeLabels[type]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-separate border-spacing-0 text-xs">
              <thead>
                <tr className="whitespace-nowrap bg-slate-50 text-xs text-slate-500">
                  <th className="w-9 border-b border-slate-200 px-2 py-2 text-left font-medium">序号</th>
                  <th className="min-w-[120px] border-b border-slate-200 px-2 py-2 text-left font-medium">政策名称</th>
                  <th className="w-[68px] border-b border-slate-200 px-2 py-2 text-left font-medium">类型</th>
                  <th className="w-12 border-b border-slate-200 px-2 py-2 text-right font-medium">允许</th>
                  <th className="w-12 border-b border-slate-200 px-2 py-2 text-right font-medium">上限</th>
                  <th className="w-12 border-b border-slate-200 px-2 py-2 text-right font-medium">已售</th>
                  <th className="w-12 border-b border-slate-200 px-2 py-2 text-right font-medium">可售</th>
                </tr>
              </thead>
              <tbody>
                {filteredPolicies.map((row, index) => {
                  const selected = row.id === selectedPolicyId
                  const available = row.allowSales - row.sold
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedPolicyId(row.id)}
                      className={`cursor-pointer whitespace-nowrap transition-colors ${selected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                    >
                      <td className="border-b border-slate-100 px-2 py-2 text-slate-500">{index + 1}</td>
                      <td className={`max-w-[140px] truncate border-b border-slate-100 px-2 py-2 ${selected ? 'font-semibold text-blue-700' : 'text-slate-800'}`}>{row.name}</td>
                      <td className="border-b border-slate-100 px-2 py-2"><TypeBadge type={row.type} /></td>
                      <td className="border-b border-slate-100 px-2 py-2 text-right">
                        {salesEditing ? (
                          <input
                            type="number"
                            min={0}
                            value={row.allowSales}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => updatePolicyRow(row.id, { allowSales: Math.max(0, Number(event.target.value) || 0) })}
                            className="h-7 w-full rounded-md border border-slate-300 px-1 text-right text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        ) : (
                          <span className="font-medium tabular-nums text-slate-900">{row.allowSales}</span>
                        )}
                      </td>
                      <td className="border-b border-slate-100 px-2 py-2 text-right">
                        {salesEditing ? (
                          <input
                            type="number"
                            min={0}
                            value={row.maxSales}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => updatePolicyRow(row.id, { maxSales: Math.max(0, Number(event.target.value) || 0) })}
                            className="h-7 w-full rounded-md border border-slate-300 px-1 text-right text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        ) : (
                          <span className="tabular-nums text-slate-700">{row.maxSales}</span>
                        )}
                      </td>
                      <td className="border-b border-slate-100 px-2 py-2 text-right font-medium tabular-nums text-emerald-600">{row.sold}</td>
                      <td className={`border-b border-slate-100 px-2 py-2 text-right font-medium tabular-nums ${available <= 8 ? 'text-rose-600' : 'text-slate-900'}`}>{available}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-3 py-2.5">
            <h2 className="whitespace-nowrap text-sm font-semibold text-slate-900">价格详情</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-separate border-spacing-0 text-xs">
              <thead>
                <tr className="whitespace-nowrap bg-slate-50 text-xs text-slate-500">
                  <th className="w-10 border-b border-slate-200 px-1 py-2 text-center font-medium">代码</th>
                  <th className="w-14 border-b border-slate-200 px-2 py-2 text-right font-medium">P</th>
                  <th className="w-14 border-b border-slate-200 px-2 py-2 text-right font-medium">S</th>
                  <th className="w-14 border-b border-slate-200 px-2 py-2 text-right font-medium">可售</th>
                  <th className="w-12 border-b border-slate-200 px-2 py-2 text-right font-medium">已售</th>
                  <th className="w-[108px] border-b border-slate-200 px-2 py-2 text-left font-medium">有效期</th>
                </tr>
              </thead>
              <tbody>
                {priceRows.map(row => (
                  <tr key={row.id} className="whitespace-nowrap hover:bg-slate-50">
                    <td className="w-10 truncate border-b border-slate-100 px-1 py-2 text-center font-mono text-[11px] text-slate-700" title={row.code}>{row.code}</td>
                    <td className="border-b border-slate-100 px-2 py-2 text-right">
                      {salesEditing ? (
                        <input
                          type="number"
                          value={row.portPrice}
                          onChange={(event) => updatePriceRow(row.id, { portPrice: Number(event.target.value) || 0 })}
                          className="h-7 w-full rounded-md border border-slate-300 px-1 text-right text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      ) : (
                        <span className="font-medium tabular-nums text-slate-900">{row.portPrice}</span>
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-2 py-2 text-right">
                      {salesEditing ? (
                        <input
                          type="number"
                          value={row.settlementPrice}
                          onChange={(event) => updatePriceRow(row.id, { settlementPrice: Number(event.target.value) || 0 })}
                          className="h-7 w-full rounded-md border border-slate-300 px-1 text-right text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      ) : (
                        <span className="font-medium tabular-nums text-slate-900">{row.settlementPrice}</span>
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-2 py-2 text-right">
                      {salesEditing ? (
                        <input
                          type="number"
                          min={0}
                          value={row.availableSales}
                          onChange={(event) => updatePriceRow(row.id, { availableSales: Math.max(0, Number(event.target.value) || 0) })}
                          className="h-7 w-full rounded-md border border-slate-300 px-1 text-right text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      ) : (
                        <span className={`font-medium tabular-nums ${row.availableSales <= 5 ? 'text-rose-600' : 'text-slate-900'}`}>{row.availableSales}</span>
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-2 py-2 text-right font-medium tabular-nums text-emerald-600">{row.sold}</td>
                    <td className="border-b border-slate-100 px-2 py-2">
                      {salesEditing ? (
                        <div className="flex flex-nowrap items-center gap-0.5">
                          <input
                            type="date"
                            value={row.validStart}
                            onChange={(event) => updatePriceRow(row.id, { validStart: event.target.value })}
                            className="h-7 w-[88px] shrink-0 rounded-md border border-slate-300 px-0.5 text-[10px] text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                          <span className="shrink-0 text-slate-400">~</span>
                          <input
                            type="date"
                            value={row.validEnd}
                            onChange={(event) => updatePriceRow(row.id, { validEnd: event.target.value })}
                            className="h-7 w-[88px] shrink-0 rounded-md border border-slate-300 px-0.5 text-[10px] text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      ) : (
                        <span className="tabular-nums text-slate-600">{formatPriceValidPeriod(row.validStart, row.validEnd)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
          </div>
        </div>
        </div>
        )}
      </div>
    </div>
  )
}

function getSoldForSellRoom(voyageId: string, sellRoomName: string) {
  return voyageInventories
    .filter((item) => item.voyageId === voyageId && item.cabinTypeName === sellRoomName)
    .reduce((sum, item) => sum + item.sold, 0)
}

function buildPublicInventoryRows(
  template: VoyageTemplate,
  rules: TemplateInventoryRules,
  voyageId: string,
  statusMap: Record<string, 'open' | 'closed'>,
): PublicInventoryRow[] {
  return getTemplateSellRoomTypes(template).map((sellRoom) => ({
    sellRoomTypeCode: sellRoom.code,
    name: sellRoom.name,
    physicalCapacity: aggregatePhysicalCapacity(rules, sellRoom.code),
    publicStock: aggregatePublicStock(rules, sellRoom.code),
    sold: getSoldForSellRoom(voyageId, sellRoom.name),
    status: statusMap[sellRoom.code] || 'open',
  }))
}

function PublicInventoryTab({ voyage }: { voyage: Voyage }) {
  const [template, setTemplate] = useState<VoyageTemplate | null>(null)
  const [inventoryRules, setInventoryRules] = useState<TemplateInventoryRules>({})
  const [statusMap, setStatusMap] = useState<Record<string, 'open' | 'closed'>>({})
  const [rows, setRows] = useState<PublicInventoryRow[]>([])
  const [editingRow, setEditingRow] = useState<PublicInventoryRow | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!voyage.templateId) {
      setTemplate(null)
      setRows([])
      return
    }
    let cancelled = false

    async function loadData() {
      setLoading(true)
      const t = await templateApi.getById(voyage.templateId)
      if (cancelled || !t) {
        setLoading(false)
        return
      }
      const rules = loadTemplateInventoryRules(t)
      setTemplate(t)
      setInventoryRules(rules)
      setLoading(false)
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [voyage.templateId])

  useEffect(() => {
    if (!template) return
    setRows(buildPublicInventoryRows(template, inventoryRules, voyage.id, statusMap))
  }, [inventoryRules, statusMap, template, voyage.id])

  const total = rows.reduce(
    (acc, row) => {
      acc.physicalCapacity += row.physicalCapacity
      acc.publicStock += row.publicStock
      acc.sold += row.sold
      return acc
    },
    { physicalCapacity: 0, publicStock: 0, sold: 0 },
  )

  const handleSave = (updated: PublicInventoryRow) => {
    if (!template) return
    const nextRules = setAggregatedInventoryField(
      inventoryRules,
      updated.sellRoomTypeCode,
      'publicStock',
      updated.publicStock,
    )
    setInventoryRules(nextRules)
    saveTemplateInventoryRules(template.id, nextRules)
    setStatusMap((prev) => ({ ...prev, [updated.sellRoomTypeCode]: updated.status }))
    setEditingRow(null)
  }

  if (!voyage.templateId) {
    return (
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white py-16 text-center text-sm text-slate-400 shadow-sm">
        当前航次未关联模板，无法查看公有库存
      </section>
    )
  }

  return (
    <>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-slate-900">公有库存</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            共 {rows.length} 类销售房型，展示模板渠道配置中的公有库存；点击「维护库存」可调整数量与状态
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">加载中...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="w-12 border-b border-slate-200 px-3 py-2.5 text-center font-medium">序号</th>
                  <th className="border-b border-slate-200 px-3 py-2.5 text-left font-medium">销售房型</th>
                  <th className="w-20 border-b border-slate-200 px-3 py-2.5 text-right font-medium">物理容量</th>
                  <th className="w-20 border-b border-slate-200 px-3 py-2.5 text-right font-medium">公有库存</th>
                  <th className="w-20 border-b border-slate-200 px-3 py-2.5 text-right font-medium">已售数</th>
                  <th className="w-24 border-b border-slate-200 px-3 py-2.5 text-right font-medium">容量未售</th>
                  <th className="w-24 border-b border-slate-200 px-3 py-2.5 text-right font-medium">公有未售</th>
                  <th className="w-20 border-b border-slate-200 px-3 py-2.5 text-center font-medium">库存状态</th>
                  <th className="w-24 border-b border-slate-200 px-3 py-2.5 text-center font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const capacityUnsold = row.physicalCapacity - row.sold
                  const publicUnsold = row.publicStock - row.sold
                  const isOpen = row.status === 'open'

                  return (
                    <tr key={row.sellRoomTypeCode} className="hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-3 py-2.5 text-center text-slate-400">{index + 1}</td>
                      <td className="border-b border-slate-100 px-3 py-2.5 font-medium text-slate-800">{row.name}</td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-right font-medium text-slate-900">{row.physicalCapacity}</td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-right font-medium text-blue-700">{row.publicStock}</td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-right font-medium text-emerald-600">{row.sold}</td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-right font-medium text-slate-900">{capacityUnsold}</td>
                      <td className={`border-b border-slate-100 px-3 py-2.5 text-right font-medium ${publicUnsold <= 5 ? 'text-rose-600' : 'text-slate-700'}`}>{publicUnsold}</td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-center">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                          isOpen
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                            : 'bg-slate-100 text-slate-500 ring-slate-200'
                        }`}>
                          {isOpen ? '开放' : '关闭'}
                        </span>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => setEditingRow(row)}
                          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                        >
                          维护库存
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold text-slate-800">
                  <td className="border-t border-slate-200 px-3 py-2.5 text-center text-slate-400">—</td>
                  <td className="border-t border-slate-200 px-3 py-2.5 text-slate-500">合计</td>
                  <td className="border-t border-slate-200 px-3 py-2.5 text-right">{total.physicalCapacity}</td>
                  <td className="border-t border-slate-200 px-3 py-2.5 text-right text-blue-700">{total.publicStock}</td>
                  <td className="border-t border-slate-200 px-3 py-2.5 text-right text-emerald-600">{total.sold}</td>
                  <td className="border-t border-slate-200 px-3 py-2.5 text-right">{total.physicalCapacity - total.sold}</td>
                  <td className="border-t border-slate-200 px-3 py-2.5 text-right text-slate-600">{total.publicStock - total.sold}</td>
                  <td className="border-t border-slate-200 px-3 py-2.5" />
                  <td className="border-t border-slate-200 px-3 py-2.5" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {editingRow && (
        <PublicInventoryModal
          row={editingRow}
          onSave={handleSave}
          onClose={() => setEditingRow(null)}
        />
      )}
    </>
  )
}

function InventoryWarningTab() {
  const [rows, setRows] = useState<InventoryWarningRow[]>(inventoryWarningRows)
  const [editingRow, setEditingRow] = useState<InventoryWarningRow | null>(null)

  const total = rows.reduce((acc, row) => {
    const releaseUnsold = row.release - row.sold
    acc.release += row.release
    acc.sold += row.sold
    acc.releaseUnsold += releaseUnsold
    if (!row.handled) acc.unhandled += 1
    return acc
  }, { release: 0, sold: 0, releaseUnsold: 0, unhandled: 0 })

  const handleSaveThreshold = (sellRoomTypeCode: string, threshold: number, thresholdType: InventoryThresholdType) => {
    setRows(prev => prev.map(row => row.sellRoomTypeCode === sellRoomTypeCode ? { ...row, threshold, thresholdType } : row))
    setEditingRow(null)
  }

  return (
    <>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-slate-900">库存预警</h2>
          <p className="mt-0.5 text-xs text-slate-500">共 {rows.length} 条预警，未处理 {total.unhandled} 条；预警基于投放未售数和阈值判断。</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-xs text-slate-700">
            <thead>
              <tr className="bg-slate-50 text-slate-500">
                <th className="w-12 border-b border-slate-200 px-3 py-2.5 text-center font-medium">序号</th>
                <th className="border-b border-slate-200 px-3 py-2.5 text-left font-medium">房型名称</th>
                <th className="w-20 border-b border-slate-200 px-3 py-2.5 text-right font-medium">投放数量</th>
                <th className="w-20 border-b border-slate-200 px-3 py-2.5 text-right font-medium">已售数</th>
                <th className="w-24 border-b border-slate-200 px-3 py-2.5 text-right font-medium">投放未售数</th>
                <th className="w-20 border-b border-slate-200 px-3 py-2.5 text-right font-medium">预警阈值</th>
                <th className="w-24 border-b border-slate-200 px-3 py-2.5 text-center font-medium">预警等级</th>
                <th className="w-24 border-b border-slate-200 px-3 py-2.5 text-center font-medium">处理人</th>
                <th className="w-24 border-b border-slate-200 px-3 py-2.5 text-center font-medium">处理状态</th>
                <th className="w-24 border-b border-slate-200 px-3 py-2.5 text-center font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const releaseUnsold = row.release - row.sold
                const effectiveThreshold = getEffectiveThreshold(row.release, row.threshold, row.thresholdType)
                const warningLevel = getInventoryWarningLevel(releaseUnsold, effectiveThreshold)
                return (
                  <tr key={row.sellRoomTypeCode} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-3 py-2.5 text-center text-slate-400">{index + 1}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 font-medium text-slate-800">{row.name}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-right text-slate-700">{row.release}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-right font-medium text-emerald-600">{row.sold}</td>
                    <td className={`border-b border-slate-100 px-3 py-2.5 text-right font-medium ${releaseUnsold <= effectiveThreshold ? 'text-rose-600' : 'text-slate-700'}`}>{releaseUnsold}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-right text-slate-700">
                      <div className="font-medium">{formatThreshold(row)}</div>
                      {row.thresholdType === 'percent' && <div className="mt-0.5 text-[10px] text-slate-400">折算 {effectiveThreshold}</div>}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${inventoryWarningClass[warningLevel]}`}>
                        {inventoryWarningLabels[warningLevel]}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-center text-slate-600">{row.owner}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                        row.handled
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : 'bg-amber-50 text-amber-700 ring-amber-200'
                      }`}>
                        {row.handled ? '已处理' : '待处理'}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => setEditingRow(row)}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                      >
                        调整阈值
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-semibold text-slate-800">
                <td className="border-t border-slate-200 px-3 py-2.5 text-center text-slate-400">—</td>
                <td className="border-t border-slate-200 px-3 py-2.5 text-slate-500">合计</td>
                <td className="border-t border-slate-200 px-3 py-2.5 text-right text-slate-600">{total.release}</td>
                <td className="border-t border-slate-200 px-3 py-2.5 text-right text-emerald-600">{total.sold}</td>
                <td className="border-t border-slate-200 px-3 py-2.5 text-right">{total.releaseUnsold}</td>
                <td className="border-t border-slate-200 px-3 py-2.5" />
                <td className="border-t border-slate-200 px-3 py-2.5" />
                <td className="border-t border-slate-200 px-3 py-2.5 text-center text-slate-500">未处理 {total.unhandled} 条</td>
                <td className="border-t border-slate-200 px-3 py-2.5" />
                <td className="border-t border-slate-200 px-3 py-2.5" />
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="border-t bg-gray-50 px-4 py-3 text-xs text-gray-500">调整阈值后，预警等级会按当前投放未售数重新计算；后续可接入阈值模板和操作记录。</div>
      </section>

      {editingRow && (
        <WarningThresholdModal
          row={editingRow}
          onSave={handleSaveThreshold}
          onClose={() => setEditingRow(null)}
        />
      )}
    </>
  )
}

function WarningThresholdModal({
  row,
  onSave,
  onClose,
}: {
  row: InventoryWarningRow
  onSave: (rowId: string, threshold: number, thresholdType: InventoryThresholdType) => void
  onClose: () => void
}) {
  const [threshold, setThreshold] = useState(String(row.threshold))
  const [thresholdType, setThresholdType] = useState<InventoryThresholdType>(row.thresholdType)
  const thresholdNum = parseInt(threshold, 10)
  const releaseUnsold = row.release - row.sold
  const isValid = threshold !== ''
    && Number.isFinite(thresholdNum)
    && !isNaN(thresholdNum)
    && thresholdNum >= 0
    && (thresholdType === 'quantity' || thresholdNum <= 100)
  const nextEffectiveThreshold = getEffectiveThreshold(row.release, isValid ? thresholdNum : row.threshold, thresholdType)
  const nextLevel = getInventoryWarningLevel(releaseUnsold, nextEffectiveThreshold)

  const handleKey = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') onClose()
    if (event.key === 'Enter' && isValid) onSave(row.sellRoomTypeCode, thresholdNum, thresholdType)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="warning-threshold-title"
      onKeyDown={handleKey}
    >
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-start justify-between bg-white px-6 pb-4 pt-5">
          <div>
            <h3 id="warning-threshold-title" className="text-sm font-semibold text-slate-900">调整预警阈值</h3>
            <p className="mt-0.5 max-w-[280px] truncate text-xs font-normal text-slate-400">{row.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="关闭"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>

        <div className="mx-6 mb-4 grid grid-cols-3 divide-x divide-slate-100 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
          <div className="px-4 py-3 text-center">
            <div className="mb-1 text-[10px] text-slate-400">投放数量</div>
            <div className="text-lg font-bold leading-none text-slate-800">{row.release}</div>
          </div>
          <div className="px-4 py-3 text-center">
            <div className="mb-1 text-[10px] text-slate-400">已售数</div>
            <div className="text-lg font-bold leading-none text-emerald-600">{row.sold}</div>
          </div>
          <div className="px-4 py-3 text-center">
            <div className="mb-1 text-[10px] text-slate-400">投放未售</div>
            <div className="text-lg font-bold leading-none text-slate-800">{releaseUnsold}</div>
          </div>
        </div>

        <div className="space-y-4 px-6 pb-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">预警阈值</label>
              <span className="text-[10px] text-slate-400">
                {thresholdType === 'percent' ? '按投放数量百分比折算阈值' : '投放未售数小于等于阈值时触发高风险'}
              </span>
            </div>
            <div className="grid grid-cols-[1fr_116px] gap-2">
              <input
                type="number"
                min={0}
                max={thresholdType === 'percent' ? 100 : undefined}
                value={threshold}
                onChange={event => setThreshold(event.target.value)}
                autoFocus
                className={`h-9 w-full rounded-lg border px-3 text-center text-sm font-semibold tabular-nums transition-colors focus:outline-none focus:ring-2 ${
                  isValid
                    ? 'border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-blue-100'
                    : 'border-rose-300 text-rose-700 focus:border-rose-400 focus:ring-rose-100'
                }`}
              />
              <select
                value={thresholdType}
                onChange={event => setThresholdType(event.target.value as InventoryThresholdType)}
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="quantity">值类型</option>
                <option value="percent">百分比</option>
              </select>
            </div>
            {!isValid && (
              <div className="mt-2 text-xs text-rose-500">
                {thresholdType === 'percent' ? '请输入 0 到 100 的整数百分比' : '请输入大于等于 0 的整数阈值'}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">保存后预警等级</span>
                <span className={`inline-flex rounded-full px-2 py-0.5 font-medium ring-1 ${inventoryWarningClass[nextLevel]}`}>
                  {inventoryWarningLabels[nextLevel]}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>实际触发阈值</span>
                <span className="font-medium text-slate-600">{isValid ? nextEffectiveThreshold : '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg border border-slate-200 bg-white px-5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => isValid && onSave(row.sellRoomTypeCode, thresholdNum, thresholdType)}
            disabled={!isValid}
            className="h-9 rounded-lg bg-blue-600 px-6 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            保存修改
          </button>
        </div>
      </div>
    </div>
  )
}

function PublicInventoryModal({
  row,
  onSave,
  onClose,
}: {
  row: PublicInventoryRow
  onSave: (updated: PublicInventoryRow) => void
  onClose: () => void
}) {
  const [publicStock, setPublicStock] = useState(String(row.publicStock))
  const [status, setStatus] = useState<'open' | 'closed'>(row.status)

  const publicStockNum = publicStock === '' ? 0 : parseInt(publicStock, 10)
  const isValid = publicStock !== '' && Number.isFinite(publicStockNum) && !Number.isNaN(publicStockNum) && publicStockNum >= 0
  const isUnderflow = isValid && publicStockNum < row.sold
  const isOverCapacity = isValid && publicStockNum > row.physicalCapacity
  const canSave = isValid && !isUnderflow

  const handleSave = () => {
    if (!canSave) return
    onSave({ ...row, publicStock: publicStockNum, status })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-start justify-between bg-white px-6 pt-5 pb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">维护公有库存</h3>
            <p className="mt-0.5 max-w-[280px] truncate text-xs font-normal text-slate-400">{row.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="关闭"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>

        <div className="mx-6 mb-4 grid grid-cols-3 divide-x divide-slate-100 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
          <div className="px-4 py-3 text-center">
            <div className="mb-1 text-[10px] text-slate-400">物理容量</div>
            <div className="text-lg font-bold leading-none text-slate-800">{row.physicalCapacity}</div>
          </div>
          <div className="px-4 py-3 text-center">
            <div className="mb-1 text-[10px] text-slate-400">当前公有库存</div>
            <div className="text-lg font-bold leading-none text-blue-700">{row.publicStock}</div>
          </div>
          <div className="px-4 py-3 text-center">
            <div className="mb-1 text-[10px] text-slate-400">已售</div>
            <div className="text-lg font-bold leading-none text-emerald-600">{row.sold}</div>
          </div>
        </div>

        <div className="space-y-4 px-6 pb-5">
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-700">公有库存数量</label>
            <input
              type="number"
              min={0}
              value={publicStock}
              onChange={(e) => setPublicStock(e.target.value)}
              autoFocus
              className={`h-9 w-full rounded-lg border px-3 text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 ${
                !isValid || isUnderflow
                  ? 'border-rose-300 text-rose-700 focus:border-rose-400 focus:ring-rose-100'
                  : isOverCapacity
                    ? 'border-amber-300 text-amber-700 focus:border-amber-400 focus:ring-amber-100'
                    : 'border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-blue-100'
              }`}
            />
            {isUnderflow && <p className="mt-1 text-xs text-rose-500">不能低于已售数 {row.sold}</p>}
            {isOverCapacity && !isUnderflow && (
              <p className="mt-1 text-xs text-amber-600">已超过物理容量上限 {row.physicalCapacity}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-700">库存状态</label>
            <div className="flex gap-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              {(['open', 'closed'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-all ${
                    status === s
                      ? 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {s === 'open' ? '开放' : '关闭'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg border border-slate-200 bg-white px-5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="h-9 rounded-lg bg-blue-600 px-6 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            保存修改
          </button>
        </div>
      </div>
    </div>
  )
}




function TypeBadge({ type }: { type: Exclude<PolicyType, 'all'> }) {
  const className: Record<Exclude<PolicyType, 'all'>, string> = {
    ota: 'bg-violet-50 text-violet-700 ring-violet-200',
    dealer: 'bg-blue-50 text-blue-700 ring-blue-200',
    group: 'bg-amber-50 text-amber-700 ring-amber-200',
    port: 'bg-teal-50 text-teal-700 ring-teal-200',
    regional: 'bg-purple-50 text-purple-700 ring-purple-200',
  }

  return (
    <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${className[type]}`}>
      {policyTypeLabels[type]}
    </span>
  )
}

function VoyageItineraryTab({
  voyage,
  template,
  itinerary,
  hasOwnItinerary,
}: {
  voyage?: Voyage
  template?: VoyageTemplate
  itinerary: TemplateItinerary[]
  hasOwnItinerary: boolean
}) {
  const rows = groupItineraryRows(itinerary)

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">航次行程 · {voyage?.voyageNo || '-'}</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              {voyage?.productName || '-'} · 模板：{template?.name || voyage?.templateName || '未找到关联模板'}
            </p>
          </div>
          {hasOwnItinerary ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              航次独立行程
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              继承自模板
            </span>
          )}
        </div>
      </div>

      {!template ? (
        <div className="py-16 text-center text-sm text-gray-400">未找到该航次关联的航次模板</div>
      ) : itinerary.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">该模板暂无行程配置</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-xs text-slate-700">
            <thead>
              <tr className="bg-slate-50 text-slate-500">
                {['停靠港', '行程日', '抵港时间', '启航时间', ...itineraryActivityColumns.map(c => c.title)].map(header => (
                  <th
                    key={header}
                    className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left font-medium"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ row, idx, isFirst, span }) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  {isFirst && (
                    <>
                      <td
                        rowSpan={span}
                        className="whitespace-nowrap border-b border-r border-slate-100 bg-slate-50/60 px-3 py-2 align-middle font-medium text-slate-800"
                      >
                        {row.portName || '-'}
                      </td>
                      <td
                        rowSpan={span}
                        className="border-b border-r border-slate-100 bg-slate-50/60 px-3 py-2 text-center align-middle text-slate-600"
                      >
                        {formatItineraryDayLabel(row.day)}
                      </td>
                      <td
                        rowSpan={span}
                        className="whitespace-nowrap border-b border-r border-slate-100 bg-slate-50/60 px-3 py-2 align-middle text-slate-600"
                      >
                        {row.arrivalTime || '--:--'}
                      </td>
                      <td
                        rowSpan={span}
                        className="whitespace-nowrap border-b border-r border-slate-100 bg-slate-50/60 px-3 py-2 align-middle text-slate-600"
                      >
                        {row.departureTime || '--:--'}
                      </td>
                    </>
                  )}
                  {itineraryActivityColumns.map(col => (
                    <td
                      key={col.key}
                      className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-slate-700"
                    >
                      {row[col.key] || <span className="text-slate-300">-</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
