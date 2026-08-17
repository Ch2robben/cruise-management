import { useEffect, useMemo, useState } from 'react'
import { Pencil } from 'lucide-react'
import { groupItineraryRows, itineraryActivityColumns, formatItineraryDayLabel } from '@/components/voyage/ItineraryEditor'
import VoyagePoolQuotaPanel from '@/components/voyage/VoyagePoolQuotaPanel'
import VoyagePoolDealerPanel from '@/components/voyage/VoyagePoolDealerPanel'
import VoyageTipManagementPanel, { type RouteSegmentOption } from '@/components/voyage/VoyageTipManagementPanel'
import { templateApi } from '@/mock/api'
import { voyageInventories, voyageTemplates, voyages, products } from '@/mock/data'
import {
  aggregateInventoryField,
  aggregatePhysicalCapacity,
  getTemplateSellRoomTypes,
  loadTemplateInventoryRules,
  saveTemplateInventoryRules,
  setAggregatedInventoryField,
  type TemplateInventoryRules,
} from '@/mock/templateInventoryRules'
import type { TemplateItinerary, Voyage, VoyageTemplate } from '@/types'
import { resolveTemplateItinerary } from '@/utils/productVoyageConfig'

type ControlTab = 'inventory' | 'private' | 'sales' | 'itinerary' | 'warning' | 'tip'
type PolicyType = 'all' | 'regional' | 'global' | 'ota'
type InventoryThresholdType = 'quantity' | 'percent'

interface PublicInventoryRow {
  sellRoomTypeCode: string
  name: string
  physicalCapacity: number
  regionalPublicStock: number
  globalPublicStock: number
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
  /** OTA 价关联渠道 */
  otaChannels?: string[]
  /** OTA 价：零售价与结算价相同 */
  retailEqualsSettlement?: boolean
}

interface PriceRow {
  id: string
  code: string
  roomType: string
  /** 结算价（区域/全域即 P 值；OTA 为结算价） */
  pValue: number
  /** OTA 零售价；非 OTA 可忽略 */
  retailPrice?: number
  availableSales: number
  sold: number
  validStart: string
  validEnd: string
}

const baseTabs: Array<{ key: ControlTab; label: string }> = [
  { key: 'inventory', label: '库存池配额' },
  { key: 'private', label: '锁配额经销商' },
  { key: 'sales', label: '价格政策' },
  { key: 'itinerary', label: '航次行程' },
  { key: 'warning', label: '库存预警' },
]

const inventoryWarningRows: InventoryWarningRow[] = [
  {
    sellRoomTypeCode: 'vip-balcony-standard',
    name: '长江叁号豪华阳台标准间',
    physicalCapacity: 202,
    regionalPublicStock: 80,
    globalPublicStock: 122,
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
    regionalPublicStock: 4,
    globalPublicStock: 8,
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
    regionalPublicStock: 1,
    globalPublicStock: 3,
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
    : (currentVoyageTemplate ? resolveTemplateItinerary(currentVoyageTemplate, currentProduct, currentVoyage?.startDate) : [])

const initialPolicyRows: PolicyRow[] = [
  { id: 'p-reg-1', name: '渝川区域结算价', type: 'regional', allowSales: 80, maxSales: 100, sold: 26 },
  { id: 'p-reg-2', name: '滇黔区域结算价', type: 'regional', allowSales: 60, maxSales: 80, sold: 18 },
  { id: 'p-glb-1', name: '长航默认全域结算价', type: 'global', allowSales: 150, maxSales: 200, sold: 48 },
  { id: 'p-glb-2', name: '境内全域保底价', type: 'global', allowSales: 100, maxSales: 120, sold: 32 },
  { id: 'p-ota-1', name: '美团/抖音OTA结算价', type: 'ota', allowSales: 90, maxSales: 120, sold: 22, otaChannels: ['美团', '抖音'], retailEqualsSettlement: true },
  { id: 'p-ota-2', name: '携程OTA分设价', type: 'ota', allowSales: 70, maxSales: 100, sold: 15, otaChannels: ['携程'], retailEqualsSettlement: false },
]

const initialPriceRowsByPolicy: Record<string, PriceRow[]> = {
  'p-reg-1': [
    { id: 'price-reg1-sui', code: 'CJTX-SUI', roomType: '套房', pValue: 6800, availableSales: 18, sold: 8, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-reg1-bal', code: 'CJTX-BAL', roomType: '阳台房', pValue: 4000, availableSales: 26, sold: 12, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-reg1-win', code: 'CJTX-WIN', roomType: '海景房', pValue: 3200, availableSales: 20, sold: 6, validStart: '2026-05-15', validEnd: '2026-05-18' },
  ],
  'p-reg-2': [
    { id: 'price-reg2-sui', code: 'CJTX-SUI', roomType: '套房', pValue: 6600, availableSales: 12, sold: 5, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-reg2-bal', code: 'CJTX-BAL', roomType: '阳台房', pValue: 3900, availableSales: 22, sold: 9, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-reg2-win', code: 'CJTX-WIN', roomType: '海景房', pValue: 3100, availableSales: 16, sold: 4, validStart: '2026-05-15', validEnd: '2026-05-18' },
  ],
  'p-glb-1': [
    { id: 'price-glb1-sui', code: 'CJTX-SUI', roomType: '套房', pValue: 7200, availableSales: 30, sold: 14, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-glb1-bal', code: 'CJTX-BAL', roomType: '阳台房', pValue: 4200, availableSales: 40, sold: 18, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-glb1-win', code: 'CJTX-WIN', roomType: '海景房', pValue: 3500, availableSales: 36, sold: 16, validStart: '2026-05-15', validEnd: '2026-05-18' },
  ],
  'p-glb-2': [
    { id: 'price-glb2-sui', code: 'CJTX-SUI', roomType: '套房', pValue: 7000, availableSales: 20, sold: 8, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-glb2-bal', code: 'CJTX-BAL', roomType: '阳台房', pValue: 4100, availableSales: 28, sold: 12, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-glb2-win', code: 'CJTX-WIN', roomType: '海景房', pValue: 3400, availableSales: 24, sold: 12, validStart: '2026-05-15', validEnd: '2026-05-18' },
  ],
  'p-ota-1': [
    { id: 'price-ota1-sui', code: 'CJTX-SUI', roomType: '套房', pValue: 6500, retailPrice: 6500, availableSales: 24, sold: 10, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-ota1-bal', code: 'CJTX-BAL', roomType: '阳台房', pValue: 3800, retailPrice: 3800, availableSales: 32, sold: 8, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-ota1-win', code: 'CJTX-WIN', roomType: '海景房', pValue: 3000, retailPrice: 3000, availableSales: 28, sold: 4, validStart: '2026-05-15', validEnd: '2026-05-18' },
  ],
  'p-ota-2': [
    { id: 'price-ota2-sui', code: 'CJTX-SUI', roomType: '套房', pValue: 6400, retailPrice: 7800, availableSales: 18, sold: 6, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-ota2-bal', code: 'CJTX-BAL', roomType: '阳台房', pValue: 3700, retailPrice: 4500, availableSales: 26, sold: 5, validStart: '2026-05-15', validEnd: '2026-05-18' },
    { id: 'price-ota2-win', code: 'CJTX-WIN', roomType: '海景房', pValue: 2900, retailPrice: 3600, availableSales: 22, sold: 4, validStart: '2026-05-15', validEnd: '2026-05-18' },
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
  regional: '区域价',
  global: '全域价',
  ota: 'OTA价',
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
  const [activeTab, setActiveTab] = useState<ControlTab>('inventory')
  const selectedSegmentLabel = segmentOptions.find((item) => item.key === selectedSegmentKey)?.label || '全部航段'
  const tabs = embedded
    ? [
      ...baseTabs,
      { key: 'tip' as const, label: `小费管理 · ${selectedSegmentLabel}` },
    ]
    : baseTabs
  const resolvedVoyage = voyage || currentVoyage
  const [selectedPolicyId, setSelectedPolicyId] = useState(initialPolicyRows[0]?.id || '')
  const [policyType, setPolicyType] = useState<PolicyType>('all')
  const [salesEditing, setSalesEditing] = useState(false)
  const [policyRows, setPolicyRows] = useState<PolicyRow[]>(() => initialPolicyRows.map((row) => ({ ...row })))
  const [priceRowsByPolicy, setPriceRowsByPolicy] = useState(() => clonePriceRowsByPolicy(initialPriceRowsByPolicy))
  const itinerary = resolvedItinerary

  const filteredPolicies = useMemo(() => {
    return policyType === 'all' ? policyRows : policyRows.filter(row => row.type === policyType)
  }, [policyType, policyRows])

  const selectedPolicy = policyRows.find(row => row.id === selectedPolicyId) || policyRows[0]
  const priceRows = priceRowsByPolicy[selectedPolicy?.id || ''] || priceRowsByPolicy['p-reg-1'] || []
  const isOtaPolicy = selectedPolicy?.type === 'ota'
  const retailLocked = Boolean(selectedPolicy?.retailEqualsSettlement)

  const updatePriceRow = (rowId: string, patch: Partial<PriceRow>) => {
    if (!selectedPolicy?.id) return
    setPriceRowsByPolicy((prev) => ({
      ...prev,
      [selectedPolicy.id]: (prev[selectedPolicy.id] || []).map((row) => {
        if (row.id !== rowId) return row
        const next = { ...row, ...patch }
        if (selectedPolicy.type === 'ota' && selectedPolicy.retailEqualsSettlement && patch.pValue != null) {
          next.retailPrice = patch.pValue
        }
        return next
      }),
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
          <VoyagePoolQuotaPanel voyage={resolvedVoyage} voyageInventories={voyageInventories} />
        ) : activeTab === 'private' ? (
          <VoyagePoolDealerPanel voyage={resolvedVoyage} />
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
        <div className="min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">价格政策</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {isOtaPolicy
                  ? `OTA价可配置结算价与零售价 · 渠道：${(selectedPolicy?.otaChannels || []).join('、') || '-'} · 当前：${selectedPolicy?.name || '-'}`
                  : `区域价 / 全域价调整 P 值（结算价）· 当前：${selectedPolicy?.name || '-'}`}
              </p>
            </div>
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
              {salesEditing ? '完成' : (isOtaPolicy ? '编辑价格' : '编辑 P 值')}
            </button>
          </div>

          <div className="grid min-w-0 grid-cols-[minmax(260px,0.9fr)_minmax(0,1.1fr)] gap-2.5">
        <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="shrink-0 whitespace-nowrap text-sm font-semibold text-slate-900">价格政策</h2>
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

          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-xs">
              <thead>
                <tr className="whitespace-nowrap bg-slate-50 text-xs text-slate-500">
                  <th className="w-9 border-b border-slate-200 px-2 py-2 text-left font-medium">序号</th>
                  <th className="border-b border-slate-200 px-2 py-2 text-left font-medium">政策名称</th>
                  <th className="w-[72px] border-b border-slate-200 px-2 py-2 text-left font-medium">类型</th>
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
                      <td className={`border-b border-slate-100 px-2 py-2 ${selected ? 'font-semibold text-blue-700' : 'text-slate-800'}`}>
                        <div className="truncate">{row.name}</div>
                        {row.type === 'ota' && row.otaChannels && row.otaChannels.length > 0 && (
                          <div className="mt-0.5 truncate text-[10px] font-normal text-amber-600">
                            {row.otaChannels.join('、')}
                            {row.retailEqualsSettlement ? ' · 同价' : ' · 分设'}
                          </div>
                        )}
                      </td>
                      <td className="border-b border-slate-100 px-2 py-2"><TypeBadge type={row.type} /></td>
                      <td className="border-b border-slate-100 px-2 py-2 text-right font-medium tabular-nums text-emerald-600">{row.sold}</td>
                      <td className={`border-b border-slate-100 px-2 py-2 text-right font-medium tabular-nums ${available <= 5 ? 'text-rose-600' : 'text-slate-900'}`}>{available}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-3 py-2.5">
            <h2 className="whitespace-nowrap text-sm font-semibold text-slate-900">
              {isOtaPolicy ? '房型结算价 / 零售价' : '房型 P 值（结算价）'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {isOtaPolicy
                ? (retailLocked ? '该 OTA 政策勾选了零售价与结算价相同，改结算价将同步零售价' : 'OTA 可分别配置结算价与零售价；调整后需走价格投放审批（原型仅本地更新）')
                : '调整后需走价格投放审批（原型仅本地更新）'}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-xs">
              <thead>
                <tr className="whitespace-nowrap bg-slate-50 text-xs text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-medium">销售房型</th>
                  <th className="w-28 border-b border-slate-200 px-2 py-2 text-left font-medium">代码</th>
                  <th className="w-24 border-b border-slate-200 px-2 py-2 text-right font-medium">
                    {isOtaPolicy ? '结算价' : 'P 值'}
                  </th>
                  {isOtaPolicy && (
                    <th className="w-24 border-b border-slate-200 px-2 py-2 text-right font-medium">零售价</th>
                  )}
                  <th className="w-16 border-b border-slate-200 px-2 py-2 text-right font-medium">可售</th>
                  <th className="w-14 border-b border-slate-200 px-2 py-2 text-right font-medium">已售</th>
                  <th className="w-[120px] border-b border-slate-200 px-2 py-2 text-left font-medium">有效期</th>
                </tr>
              </thead>
              <tbody>
                {priceRows.map(row => {
                  const retailValue = retailLocked ? row.pValue : (row.retailPrice ?? row.pValue)
                  return (
                    <tr key={row.id} className="whitespace-nowrap hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-3 py-2 font-medium text-slate-800">{row.roomType}</td>
                      <td className="border-b border-slate-100 px-2 py-2 font-mono text-[11px] text-slate-600">{row.code}</td>
                      <td className="border-b border-slate-100 px-2 py-2 text-right">
                        {salesEditing ? (
                          <input
                            type="number"
                            value={row.pValue}
                            onChange={(event) => updatePriceRow(row.id, { pValue: Number(event.target.value) || 0 })}
                            className="h-8 w-full rounded-md border border-blue-300 bg-blue-50/40 px-2 text-right text-sm font-semibold tabular-nums text-blue-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        ) : (
                          <span className="text-sm font-semibold tabular-nums text-blue-700">{row.pValue}</span>
                        )}
                      </td>
                      {isOtaPolicy && (
                        <td className="border-b border-slate-100 px-2 py-2 text-right">
                          {salesEditing && !retailLocked ? (
                            <input
                              type="number"
                              value={retailValue}
                              onChange={(event) => updatePriceRow(row.id, { retailPrice: Number(event.target.value) || 0 })}
                              className="h-8 w-full rounded-md border border-amber-300 bg-amber-50/40 px-2 text-right text-sm font-semibold tabular-nums text-amber-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100"
                            />
                          ) : (
                            <span className={`text-sm font-semibold tabular-nums ${retailLocked ? 'text-slate-500' : 'text-amber-700'}`}>
                              {retailValue}
                              {retailLocked && <span className="ml-1 text-[10px] font-normal text-slate-400">同结算</span>}
                            </span>
                          )}
                        </td>
                      )}
                      <td className={`border-b border-slate-100 px-2 py-2 text-right font-medium tabular-nums ${row.availableSales <= 5 ? 'text-rose-600' : 'text-slate-900'}`}>{row.availableSales}</td>
                      <td className="border-b border-slate-100 px-2 py-2 text-right font-medium tabular-nums text-emerald-600">{row.sold}</td>
                      <td className="border-b border-slate-100 px-2 py-2 tabular-nums text-slate-600">{formatPriceValidPeriod(row.validStart, row.validEnd)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
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
    regionalPublicStock: aggregateInventoryField(rules, sellRoom.code, 'regionalPublicStock'),
    globalPublicStock: aggregateInventoryField(rules, sellRoom.code, 'globalPublicStock'),
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
      acc.regionalPublicStock += row.regionalPublicStock
      acc.globalPublicStock += row.globalPublicStock
      acc.sold += row.sold
      return acc
    },
    { physicalCapacity: 0, regionalPublicStock: 0, globalPublicStock: 0, sold: 0 },
  )

  const handleSave = (updated: PublicInventoryRow) => {
    if (!template) return
    let nextRules = setAggregatedInventoryField(
      inventoryRules,
      updated.sellRoomTypeCode,
      'regionalPublicStock',
      updated.regionalPublicStock,
    )
    nextRules = setAggregatedInventoryField(
      nextRules,
      updated.sellRoomTypeCode,
      'globalPublicStock',
      updated.globalPublicStock,
    )
    setInventoryRules(nextRules)
    saveTemplateInventoryRules(template.id, nextRules)
    setStatusMap((prev) => ({ ...prev, [updated.sellRoomTypeCode]: updated.status }))
    setEditingRow(null)
  }

  if (!voyage.templateId) {
    return (
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white py-16 text-center text-sm text-slate-400 shadow-sm">
        当前航次未关联模板，无法查看公共库存
      </section>
    )
  }

  return (
    <>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-slate-900">公共库存</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            共 {rows.length} 类销售房型；区分区域公共库存与全域公共库存，点击「维护库存」可分别调整
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
                  <th className="w-24 border-b border-slate-200 px-3 py-2.5 text-right font-medium">区域公共</th>
                  <th className="w-24 border-b border-slate-200 px-3 py-2.5 text-right font-medium">全域公共</th>
                  <th className="w-20 border-b border-slate-200 px-3 py-2.5 text-right font-medium">公共合计</th>
                  <th className="w-20 border-b border-slate-200 px-3 py-2.5 text-right font-medium">已售数</th>
                  <th className="w-24 border-b border-slate-200 px-3 py-2.5 text-right font-medium">公共未售</th>
                  <th className="w-20 border-b border-slate-200 px-3 py-2.5 text-center font-medium">库存状态</th>
                  <th className="w-24 border-b border-slate-200 px-3 py-2.5 text-center font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const publicTotal = row.regionalPublicStock + row.globalPublicStock
                  const publicUnsold = publicTotal - row.sold
                  const isOpen = row.status === 'open'

                  return (
                    <tr key={row.sellRoomTypeCode} className="hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-3 py-2.5 text-center text-slate-400">{index + 1}</td>
                      <td className="border-b border-slate-100 px-3 py-2.5 font-medium text-slate-800">{row.name}</td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-right font-medium text-slate-900">{row.physicalCapacity}</td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-right font-medium text-purple-700">{row.regionalPublicStock}</td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-right font-medium text-blue-700">{row.globalPublicStock}</td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-right font-semibold text-slate-900">{publicTotal}</td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-right font-medium text-emerald-600">{row.sold}</td>
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
                  <td className="border-t border-slate-200 px-3 py-2.5 text-right text-purple-700">{total.regionalPublicStock}</td>
                  <td className="border-t border-slate-200 px-3 py-2.5 text-right text-blue-700">{total.globalPublicStock}</td>
                  <td className="border-t border-slate-200 px-3 py-2.5 text-right">{total.regionalPublicStock + total.globalPublicStock}</td>
                  <td className="border-t border-slate-200 px-3 py-2.5 text-right text-emerald-600">{total.sold}</td>
                  <td className="border-t border-slate-200 px-3 py-2.5 text-right text-slate-600">{total.regionalPublicStock + total.globalPublicStock - total.sold}</td>
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
  const [regionalPublicStock, setRegionalPublicStock] = useState(String(row.regionalPublicStock))
  const [globalPublicStock, setGlobalPublicStock] = useState(String(row.globalPublicStock))
  const [status, setStatus] = useState<'open' | 'closed'>(row.status)

  const regionalNum = regionalPublicStock === '' ? 0 : parseInt(regionalPublicStock, 10)
  const globalNum = globalPublicStock === '' ? 0 : parseInt(globalPublicStock, 10)
  const publicTotal = regionalNum + globalNum
  const isValid =
    regionalPublicStock !== ''
    && globalPublicStock !== ''
    && Number.isFinite(regionalNum)
    && Number.isFinite(globalNum)
    && regionalNum >= 0
    && globalNum >= 0
  const isUnderflow = isValid && publicTotal < row.sold
  const isOverCapacity = isValid && publicTotal > row.physicalCapacity
  const canSave = isValid && !isUnderflow

  const handleSave = () => {
    if (!canSave) return
    onSave({
      ...row,
      regionalPublicStock: regionalNum,
      globalPublicStock: globalNum,
      status,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[460px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-start justify-between bg-white px-6 pt-5 pb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">维护公共库存</h3>
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
            <div className="mb-1 text-[10px] text-slate-400">公共合计</div>
            <div className="text-lg font-bold leading-none text-slate-800">{publicTotal}</div>
          </div>
          <div className="px-4 py-3 text-center">
            <div className="mb-1 text-[10px] text-slate-400">已售</div>
            <div className="text-lg font-bold leading-none text-emerald-600">{row.sold}</div>
          </div>
        </div>

        <div className="space-y-4 px-6 pb-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-xs font-medium text-purple-700">区域公共库存</label>
              <input
                type="number"
                min={0}
                value={regionalPublicStock}
                onChange={(e) => setRegionalPublicStock(e.target.value)}
                autoFocus
                className="h-9 w-full rounded-lg border border-purple-200 px-3 text-sm font-semibold tabular-nums text-purple-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-blue-700">全域公共库存</label>
              <input
                type="number"
                min={0}
                value={globalPublicStock}
                onChange={(e) => setGlobalPublicStock(e.target.value)}
                className="h-9 w-full rounded-lg border border-blue-200 px-3 text-sm font-semibold tabular-nums text-blue-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          {isUnderflow && <p className="text-xs text-rose-500">区域+全域合计不能低于已售数 {row.sold}</p>}
          {isOverCapacity && !isUnderflow && (
            <p className="text-xs text-amber-600">已超过物理容量上限 {row.physicalCapacity}</p>
          )}

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
    regional: 'bg-purple-50 text-purple-700 ring-purple-200',
    global: 'bg-blue-50 text-blue-700 ring-blue-200',
    ota: 'bg-amber-50 text-amber-700 ring-amber-200',
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
