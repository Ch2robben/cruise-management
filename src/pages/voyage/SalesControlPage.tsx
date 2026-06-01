import { useMemo, useRef, useState } from 'react'
import { Save } from 'lucide-react'
import { groupItineraryRows, itineraryActivityColumns } from '@/components/voyage/ItineraryEditor'
import { voyageTemplates, voyages } from '@/mock/data'
import type { TemplateItinerary, Voyage, VoyageTemplate } from '@/types'

type ControlTab = 'inventory' | 'sales' | 'itinerary'
type PolicyType = 'all' | 'ota' | 'dealer' | 'group'
type PriceStatus = 'enabled' | 'paused' | 'soldout'

interface CabinStockRow {
  id: string
  name: string
  release: number
  sold: number
}

interface VoyageInventoryRow {
  id: string
  name: string
  stock: number
  release: number
  sold: number
  status: 'open' | 'closed'
}

interface PolicyRow {
  id: string
  name: string
  type: Exclude<PolicyType, 'all'>
  allowSales: number
  maxSales: number
  sold: number
  validPeriod: string
}

interface PriceRow {
  id: string
  code: string
  settlementPrice: number
  allowSales: number
  sold: number
  status: PriceStatus
}

const tabs: Array<{ key: ControlTab; label: string }> = [
  { key: 'inventory', label: '航次库存' },
  { key: 'sales', label: '销售控制' },
  { key: 'itinerary', label: '航次行程' },
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

const voyageInventoryRows: VoyageInventoryRow[] = [
  { id: 'vip-balcony-standard', name: '长江叁号豪华阳台标准间', stock: 202, release: 202, sold: 0, status: 'open' },
  { id: 'deluxe-suite', name: '长江壹号豪华套房', stock: 12, release: 12, sold: 0, status: 'open' },
  { id: 'presidential-suite', name: '长江壹号总统套房', stock: 4, release: 4, sold: 0, status: 'open' },
]

const currentVoyage = voyages[0]
const currentVoyageTemplate = voyageTemplates.find(template => (
  template.id === currentVoyage?.templateId || template.productId === currentVoyage?.productId
))

/** 是否已从模板剥离：voyage 上有自己的 itinerary 数组 */
const voyageHasOwnItinerary = Array.isArray(currentVoyage?.itinerary)
/** 实际展示的行程数据 */
const resolvedItinerary: TemplateItinerary[] =
  voyageHasOwnItinerary
    ? (currentVoyage.itinerary as TemplateItinerary[])
    : (currentVoyageTemplate?.itinerary ?? [])

const policyRows: PolicyRow[] = [
  { id: 'p-ota-1', name: '携程阶梯控售政策', type: 'ota', allowSales: 58, maxSales: 80, sold: 21, validPeriod: '2026-05-15 至 2026-05-18' },
  { id: 'p-ota-2', name: '飞猪周末促销政策', type: 'ota', allowSales: 32, maxSales: 40, sold: 12, validPeriod: '2026-05-15 至 2026-05-18' },
  { id: 'p-dealer-1', name: '西南分销商控售', type: 'dealer', allowSales: 46, maxSales: 60, sold: 18, validPeriod: '2026-05-15 至 2026-05-18' },
  { id: 'p-group-1', name: '华东组团社保留位', type: 'group', allowSales: 24, maxSales: 30, sold: 10, validPeriod: '2026-05-15 至 2026-05-18' },
]

const priceRows: PriceRow[] = [
  { id: 'price-a', code: 'STD-A-OTA', settlementPrice: 2680, allowSales: 28, sold: 11, status: 'enabled' },
  { id: 'price-b', code: 'STD-A-DLR', settlementPrice: 2550, allowSales: 18, sold: 7, status: 'enabled' },
  { id: 'price-c', code: 'STD-A-GRP', settlementPrice: 2480, allowSales: 12, sold: 10, status: 'paused' },
  { id: 'price-d', code: 'STD-A-LAST', settlementPrice: 2980, allowSales: 8, sold: 8, status: 'soldout' },
]

const policyTypeLabels: Record<PolicyType, string> = {
  all: '全部',
  ota: 'OTA',
  dealer: '分销商',
  group: '组团社',
}

const statusLabels: Record<PriceStatus, string> = {
  enabled: '开放',
  paused: '暂停',
  soldout: '售罄',
}

const statusClass: Record<PriceStatus, string> = {
  enabled: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  paused: 'bg-amber-50 text-amber-700 ring-amber-200',
  soldout: 'bg-rose-50 text-rose-700 ring-rose-200',
}

export default function SalesControlPage() {
  return <SalesControlWorkspace />
}

export function SalesControlWorkspace({ embedded = false }: { embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState<ControlTab>('sales')
  const [selectedCabinId, setSelectedCabinId] = useState(cabinRows[0]?.id || '')
  const [selectedPolicyId, setSelectedPolicyId] = useState(policyRows[0]?.id || '')
  const [policyType, setPolicyType] = useState<PolicyType>('all')
  const [validDate, setValidDate] = useState('2026-05-15')
  const [floorFee, setFloorFee] = useState('0')
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
  }, [policyType])

  const selectedCabin = cabinRows.find(row => row.id === selectedCabinId) || cabinRows[0]
  const selectedPolicy = policyRows.find(row => row.id === selectedPolicyId) || policyRows[0]
  const selectedCabinRate = selectedCabin.release <= 0 ? 0 : Math.round((selectedCabin.sold / selectedCabin.release) * 100)

  return (
    <div className={`${embedded ? 'overflow-hidden rounded-lg border border-gray-200 bg-slate-100' : '-m-6 min-h-[calc(100vh-56px)] bg-slate-100'} text-slate-700`}>
      <div className="border-b border-slate-200 bg-white px-4">
        <nav className="flex h-11 items-center gap-7 text-sm">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              aria-selected={activeTab === tab.key}
              className={`h-full border-b-2 px-1 transition-colors ${
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
          <VoyageInventoryTab />
        ) : activeTab === 'itinerary' ? (
          <VoyageItineraryTab
            voyage={currentVoyage}
            template={currentVoyageTemplate}
            itinerary={itinerary}
            hasOwnItinerary={voyageHasOwnItinerary}
          />
        ) : activeTab === 'sales' && (
        <div className="grid min-w-0 grid-cols-[0.9fr_1.52fr_0.9fr] items-start gap-2.5">
        <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">船舱信息</h2>
                <p className="mt-1 truncate text-xs text-slate-500">当前船舱：{selectedCabin?.name || '-'}</p>
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
                  <th className="border-b border-slate-200 px-2.5 py-2 text-left font-medium">船舱名称</th>
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

        <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">价格政策</h2>
                <p className="mt-1 text-xs text-slate-500">政策名称：{selectedPolicy?.name || '-'}</p>
              </div>
              <button type="button" className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">查询</button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-slate-500">价格政策</span>
              <select
                value={policyType}
                onChange={(event) => {
                  const value = event.target.value as PolicyType
                  setPolicyType(value)
                  const nextPolicy = value === 'all' ? policyRows[0] : policyRows.find(row => row.type === value)
                  if (nextPolicy) setSelectedPolicyId(nextPolicy.id)
                }}
                className="h-8 w-32 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700"
              >
                {(Object.keys(policyTypeLabels) as PolicyType[]).map(type => (
                  <option key={type} value={type}>{policyTypeLabels[type]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-hidden">
            <table className="w-full table-fixed border-separate border-spacing-0 text-xs">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500">
                  <th className="w-10 border-b border-slate-200 px-2 py-2 text-left font-medium">序号</th>
                  <th className="border-b border-slate-200 px-2 py-2 text-left font-medium">政策名称</th>
                  <th className="w-16 border-b border-slate-200 px-2 py-2 text-left font-medium">类型</th>
                  <th className="w-16 border-b border-slate-200 px-2 py-2 text-right font-medium">允许</th>
                  <th className="w-16 border-b border-slate-200 px-2 py-2 text-right font-medium">上限</th>
                  <th className="w-16 border-b border-slate-200 px-2 py-2 text-right font-medium">已售</th>
                  <th className="w-16 border-b border-slate-200 px-2 py-2 text-right font-medium">可售</th>
                  <th className="w-36 border-b border-slate-200 px-2 py-2 text-left font-medium">有效期</th>
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
                      className={`cursor-pointer transition-colors ${selected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                    >
                      <td className="border-b border-slate-100 px-2 py-2 text-slate-500">{index + 1}</td>
                      <td className={`truncate border-b border-slate-100 px-2 py-2 ${selected ? 'font-semibold text-blue-700' : 'text-slate-800'}`}>{row.name}</td>
                      <td className="border-b border-slate-100 px-2 py-2"><TypeBadge type={row.type} /></td>
                      <td className="border-b border-slate-100 px-2 py-2 text-right font-medium text-slate-900">{row.allowSales}</td>
                      <td className="border-b border-slate-100 px-2 py-2 text-right text-slate-700">{row.maxSales}</td>
                      <td className="border-b border-slate-100 px-2 py-2 text-right font-medium text-emerald-600">{row.sold}</td>
                      <td className={`border-b border-slate-100 px-2 py-2 text-right font-medium ${available <= 8 ? 'text-rose-600' : 'text-slate-900'}`}>{available}</td>
                      <td className="truncate border-b border-slate-100 px-2 py-2 text-slate-500">{row.validPeriod}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">价格详情</h2>
                <p className="mt-1 text-xs text-slate-500">{selectedCabin?.name || '-'} / {selectedPolicy?.name || '-'}</p>
              </div>
              <button type="button" className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                <Save className="h-3.5 w-3.5" />
                保存
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2">
                <span className="shrink-0 text-slate-500">有效期</span>
                <input
                  type="date"
                  value={validDate}
                  onChange={(event) => setValidDate(event.target.value)}
                  className="h-8 min-w-0 flex-1 rounded-md border border-slate-300 px-1.5 text-xs"
                />
              </label>
              <label className="flex items-center gap-2">
                <span className="shrink-0 text-slate-500">楼层费</span>
                <input
                  value={floorFee}
                  onChange={(event) => setFloorFee(event.target.value)}
                  className="h-8 min-w-0 flex-1 rounded-md border border-slate-300 px-1.5 text-xs"
                />
              </label>
            </div>
          </div>

          <div className="overflow-hidden">
            <table className="w-full table-fixed border-separate border-spacing-0 text-xs">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500">
                  <th className="border-b border-slate-200 px-2 py-2 text-left font-medium">代码</th>
                  <th className="w-24 border-b border-slate-200 px-2 py-2 text-left font-medium">结算价</th>
                  <th className="w-20 border-b border-slate-200 px-2 py-2 text-left font-medium">允许</th>
                  <th className="w-12 border-b border-slate-200 px-2 py-2 text-right font-medium">已售</th>
                  <th className="w-14 border-b border-slate-200 px-2 py-2 text-left font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {priceRows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="truncate border-b border-slate-100 px-2 py-2 font-mono text-xs text-slate-700">{row.code}</td>
                    <td className="border-b border-slate-100 px-2 py-2">
                      <input
                        type="number"
                        defaultValue={row.settlementPrice}
                        className="h-8 w-full rounded-md border border-slate-300 px-1.5 text-right text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </td>
                    <td className="border-b border-slate-100 px-2 py-2">
                      <input
                        type="number"
                        defaultValue={row.allowSales}
                        className="h-8 w-full rounded-md border border-slate-300 px-1.5 text-right text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </td>
                    <td className="border-b border-slate-100 px-2 py-2 text-right font-medium text-emerald-600">{row.sold}</td>
                    <td className="border-b border-slate-100 px-2 py-2"><StatusTag status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        </div>
        )}
      </div>
    </div>
  )
}

function VoyageInventoryTab() {
  const [rows, setRows] = useState<VoyageInventoryRow[]>(voyageInventoryRows)
  const [editingRow, setEditingRow] = useState<VoyageInventoryRow | null>(null)

  const total = rows.reduce((acc, row) => {
    acc.stock += row.stock
    acc.release += row.release
    acc.sold += row.sold
    return acc
  }, { stock: 0, release: 0, sold: 0 })

  const handleSave = (updated: VoyageInventoryRow) => {
    setRows(prev => prev.map(r => r.id === updated.id ? updated : r))
    setEditingRow(null)
  }

  return (
    <>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-slate-900">航次库存</h2>
          <p className="mt-0.5 text-xs text-slate-500">共 {rows.length} 类船舱，点击「维护库存」可调整投放数量与状态</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-xs text-slate-700">
            <thead>
              <tr className="bg-slate-50 text-slate-500">
                <th className="w-12 border-b border-slate-200 px-3 py-2.5 text-center font-medium">序号</th>
                <th className="border-b border-slate-200 px-3 py-2.5 text-left font-medium">船舱名称</th>
                <th className="w-20 border-b border-slate-200 px-3 py-2.5 text-right font-medium">库存数量</th>
                <th className="w-20 border-b border-slate-200 px-3 py-2.5 text-right font-medium">投放数量</th>
                <th className="w-20 border-b border-slate-200 px-3 py-2.5 text-right font-medium">已售数</th>
                <th className="w-24 border-b border-slate-200 px-3 py-2.5 text-right font-medium">库存未售数</th>
                <th className="w-24 border-b border-slate-200 px-3 py-2.5 text-right font-medium">投放未售数</th>
                <th className="w-20 border-b border-slate-200 px-3 py-2.5 text-center font-medium">库存状态</th>
                <th className="w-24 border-b border-slate-200 px-3 py-2.5 text-center font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const stockUnsold = row.stock - row.sold
                const releaseUnsold = row.release - row.sold
                const isOpen = row.status === 'open'

                return (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-3 py-2.5 text-center text-slate-400">{index + 1}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 font-medium text-slate-800">{row.name}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-right font-medium text-slate-900">{row.stock}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-right text-slate-700">{row.release}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-right font-medium text-emerald-600">{row.sold}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-right font-medium text-slate-900">{stockUnsold}</td>
                    <td className={`border-b border-slate-100 px-3 py-2.5 text-right font-medium ${releaseUnsold <= 5 ? 'text-rose-600' : 'text-slate-700'}`}>{releaseUnsold}</td>
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
                <td className="border-t border-slate-200 px-3 py-2.5 text-right">{total.stock}</td>
                <td className="border-t border-slate-200 px-3 py-2.5 text-right text-slate-600">{total.release}</td>
                <td className="border-t border-slate-200 px-3 py-2.5 text-right text-emerald-600">{total.sold}</td>
                <td className="border-t border-slate-200 px-3 py-2.5 text-right">{total.stock - total.sold}</td>
                <td className="border-t border-slate-200 px-3 py-2.5 text-right text-slate-600">{total.release - total.sold}</td>
                <td className="border-t border-slate-200 px-3 py-2.5" />
                <td className="border-t border-slate-200 px-3 py-2.5" />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {editingRow && (
        <InventoryModal
          row={editingRow}
          onSave={handleSave}
          onClose={() => setEditingRow(null)}
        />
      )}
    </>
  )
}

function InventoryModal({
  row,
  onSave,
  onClose,
}: {
  row: VoyageInventoryRow
  onSave: (updated: VoyageInventoryRow) => void
  onClose: () => void
}) {
  const [delta, setDelta] = useState('')
  const [status, setStatus] = useState<'open' | 'closed'>(row.status)

  const deltaNum = delta === '' ? 0 : parseInt(delta, 10)
  const isValidDelta = delta === '' || (Number.isFinite(deltaNum) && !isNaN(deltaNum))
  const nextRelease = row.release + (isValidDelta ? deltaNum : 0)
  const hasDelta = delta !== '' && isValidDelta && deltaNum !== 0
  const isOverstock = nextRelease > row.stock
  const isUnderflow = nextRelease < row.sold
  const canSave = isValidDelta && !isUnderflow

  const step = (n: number) => setDelta(String((isValidDelta ? deltaNum : 0) + n))

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'Enter' && canSave) handleSave()
  }

  const handleSave = () => {
    if (!canSave) return
    onSave({ ...row, release: nextRelease, status })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inv-modal-title"
      onKeyDown={handleKey}
    >
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} />

      {/* 弹窗 */}
      <div className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">

        {/* 标题栏 */}
        <div className="flex items-start justify-between bg-white px-6 pt-5 pb-4">
          <div>
            <h3 id="inv-modal-title" className="text-sm font-semibold text-slate-900">维护航次库存</h3>
            <p className="mt-0.5 text-xs text-slate-400 font-normal truncate max-w-[280px]">{row.name}</p>
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

        {/* 数据概览卡 */}
        <div className="mx-6 mb-4 grid grid-cols-3 divide-x divide-slate-100 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
          <div className="px-4 py-3 text-center">
            <div className="text-[10px] text-slate-400 mb-1">库存数</div>
            <div className="text-lg font-bold text-slate-800 leading-none">{row.stock}</div>
          </div>
          <div className="px-4 py-3 text-center">
            <div className="text-[10px] text-slate-400 mb-1">当前投放</div>
            <div className="text-lg font-bold text-slate-800 leading-none">{row.release}</div>
          </div>
          <div className="px-4 py-3 text-center">
            <div className="text-[10px] text-slate-400 mb-1">已售</div>
            <div className="text-lg font-bold text-emerald-600 leading-none">{row.sold}</div>
          </div>
        </div>

        {/* 表单区 */}
        <div className="space-y-4 px-6 pb-5">

          {/* 投放增量 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">投放增量</label>
              <span className="text-[10px] text-slate-400">正数增加 · 负数减少</span>
            </div>

            {/* 输入行 */}
            <div className="flex items-center gap-2">
              {/* − 按钮 */}
              <button
                type="button"
                onClick={() => step(-1)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 12 2" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" d="M1 1h10" />
                </svg>
              </button>

              {/* 数字输入 */}
              <input
                type="number"
                value={delta}
                onChange={e => setDelta(e.target.value)}
                placeholder="0"
                autoFocus
                className={`h-9 flex-1 rounded-lg border px-3 text-center text-sm font-semibold tabular-nums transition-colors focus:outline-none focus:ring-2 ${
                  !isValidDelta || isUnderflow
                    ? 'border-rose-300 text-rose-700 focus:border-rose-400 focus:ring-rose-100'
                    : isOverstock
                      ? 'border-amber-300 text-amber-700 focus:border-amber-400 focus:ring-amber-100'
                      : 'border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />

              {/* + 按钮 */}
              <button
                type="button"
                onClick={() => step(1)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" d="M6 1v10M1 6h10" />
                </svg>
              </button>
            </div>

            {/* 结果预览 */}
            <div className="mt-2 min-h-[20px]">
              {hasDelta && isValidDelta && (
                <div className={`flex items-center gap-1.5 text-xs ${isUnderflow ? 'text-rose-600' : isOverstock ? 'text-amber-600' : 'text-slate-500'}`}>
                  <span className="tabular-nums font-medium text-slate-400">{row.release}</span>
                  <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 16 8" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M1 4h12m0 0L9 1m4 3L9 7" />
                  </svg>
                  <span className="tabular-nums font-semibold">{nextRelease}</span>
                  {isUnderflow && <span className="ml-1 text-rose-500">· 低于已售数，无法保存</span>}
                  {isOverstock && !isUnderflow && <span className="ml-1 text-amber-500">· 超出库存上限</span>}
                </div>
              )}
            </div>
          </div>

          {/* 库存状态 - 分段选择器 */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-700">库存状态</label>
            <div className="flex gap-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              {(['open', 'closed'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-all ${
                    status === s
                      ? s === 'open'
                        ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200'
                        : 'bg-white text-slate-600 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    status === s
                      ? s === 'open' ? 'bg-emerald-500' : 'bg-slate-400'
                      : 'bg-slate-300'
                  }`} />
                  {s === 'open' ? '开放' : '关闭'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 底部操作 */}
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
  }

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${className[type]}`}>
      {policyTypeLabels[type]}
    </span>
  )
}

function StatusTag({ status }: { status: PriceStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${statusClass[status]}`}>
      {statusLabels[status]}
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
                {['停靠港', '天数', '抵港', '离港', ...itineraryActivityColumns.map(c => c.title)].map(header => (
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
                        {row.day || '-'}
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
