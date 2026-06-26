import { useMemo, useState, type ReactNode } from 'react'
import { Pencil } from 'lucide-react'
import { dealers, products } from '@/mock/data'
import type { DealerChannelType, Product, Voyage } from '@/types'

export type InventoryConfigTab = 'shared' | 'dealer'
type ChannelFilter = 'all' | 'distributor' | 'ota' | 'group'

interface SegmentRow {
  key: string
  label: string
}

interface SharedCell {
  physical: number
  online: number
  shared: number
}

interface DealerCell {
  sold: number
  available: number
}

type SharedMatrix = Record<string, Record<string, SharedCell>>
type DealerMatrix = Record<string, Record<string, Record<string, DealerCell>>>

const channelFilterLabels: Record<ChannelFilter, string> = {
  all: '全部分类',
  distributor: '分销商',
  ota: 'OTA',
  group: '组团社',
}

function mapDealerChannel(type: DealerChannelType): ChannelFilter | null {
  if (type === 'distribution') return 'distributor'
  if (type === 'ota') return 'ota'
  if (type === 'group') return 'group'
  return null
}

function createSegments(product?: Product): SegmentRow[] {
  if (!product || product.segments.length === 0) {
    return [{ key: 'whole', label: '全航段' }]
  }
  return [
    { key: 'whole', label: `${product.startPort}-${product.endPort} 全程` },
    ...product.segments.map((segment) => ({
      key: `${segment.startPort}-${segment.endPort}`,
      label: `${segment.startPort}-${segment.endPort}`,
    })),
  ]
}

function createCabins(product?: Product) {
  const cabins = product?.pricing.map((item) => item.cabinType).filter(Boolean) || []
  return cabins.length > 0 ? [...new Set(cabins)] : ['标准房']
}

function createPhysicalMap(cabins: string[]) {
  const defaults: Record<string, number> = { 套房: 20, 阳台房: 80, 海景房: 50, 内舱房: 40, 标准房: 60 }
  return Object.fromEntries(cabins.map((cabin, index) => [cabin, defaults[cabin] || 30 + index * 10]))
}

function createSharedMatrix(segments: SegmentRow[], cabins: string[], physicalMap: Record<string, number>): SharedMatrix {
  const matrix: SharedMatrix = {}
  segments.forEach((segment, segmentIndex) => {
    matrix[segment.key] = {}
    cabins.forEach((cabin, cabinIndex) => {
      const physical = physicalMap[cabin]
      const factor = Math.max(0.7, 1 - segmentIndex * 0.05 - cabinIndex * 0.02)
      matrix[segment.key][cabin] = {
        physical,
        online: Math.max(0, Math.floor(physical * 0.25 * factor)),
        shared: Math.max(0, Math.floor(physical * 0.35 * factor)),
      }
    })
  })
  return matrix
}

function createDealerMatrix(
  segments: SegmentRow[],
  cabins: string[],
  voyage: Voyage,
  dealerIds: string[],
): DealerMatrix {
  const matrix: DealerMatrix = {}
  dealerIds.forEach((dealerId, dealerIndex) => {
    matrix[dealerId] = {}
    cabins.forEach((cabin, cabinIndex) => {
      matrix[dealerId][cabin] = {}
      segments.forEach((segment, segmentIndex) => {
        matrix[dealerId][cabin][segment.key] = {
          sold: Math.max(0, 3 + segmentIndex + cabinIndex + dealerIndex),
          available: Math.max(0, 8 + segmentIndex * 2 + cabinIndex + (voyage.soldCabins % 5)),
        }
      })
    })
  })
  return matrix
}

function sumAllocated(shared: SharedMatrix, dealer: DealerMatrix, segments: SegmentRow[], cabins: string[], dealerIds: string[]) {
  let online = 0
  let sharedStock = 0
  let dealerTotal = 0
  segments.forEach((segment) => {
    cabins.forEach((cabin) => {
      const cell = shared[segment.key]?.[cabin]
      if (cell) {
        online += cell.online
        sharedStock += cell.shared
      }
    })
  })
  dealerIds.forEach((dealerId) => {
    cabins.forEach((cabin) => {
      segments.forEach((segment) => {
        dealerTotal += dealer[dealerId]?.[cabin]?.[segment.key]?.available || 0
      })
    })
  })
  return { online, sharedStock, dealerTotal, total: online + sharedStock + dealerTotal }
}

function physicalTotal(segments: SegmentRow[], cabins: string[], physicalMap: Record<string, number>) {
  const perSegment = cabins.reduce((sum, cabin) => sum + (physicalMap[cabin] || 0), 0)
  return perSegment * segments.length
}

export interface InventoryConfigPanelProps {
  voyages: Voyage[]
  mode?: 'single' | 'batch'
  fixedTab?: InventoryConfigTab
  embedded?: boolean
  onSave?: () => void
}

export default function InventoryConfigPanel({
  voyages,
  mode = 'single',
  fixedTab,
  embedded = false,
  onSave,
}: InventoryConfigPanelProps) {
  const primaryVoyage = voyages[0]
  const product = products.find((item) => item.id === primaryVoyage?.productId)
  const segments = useMemo(() => createSegments(product), [product])
  const cabins = useMemo(() => createCabins(product), [product])
  const physicalMap = useMemo(() => createPhysicalMap(cabins), [cabins])

  const eligibleDealers = useMemo(() => {
    if (!primaryVoyage) return []
    return dealers.filter((dealer) => dealer.status === 'cooperating' && dealer.authorizedProductIds.includes(primaryVoyage.productId))
  }, [primaryVoyage])

  const activeMainTab: InventoryConfigTab = fixedTab || 'shared'
  const [editing, setEditing] = useState(false)
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all')
  const [dealerId, setDealerId] = useState('')
  const [sharedMatrix, setSharedMatrix] = useState<SharedMatrix>(() => createSharedMatrix(segments, cabins, physicalMap))
  const [dealerMatrix, setDealerMatrix] = useState<DealerMatrix>(() => (
    primaryVoyage ? createDealerMatrix(segments, cabins, primaryVoyage, eligibleDealers.map((d) => d.id)) : {}
  ))

  const filteredDealers = useMemo(() => {
    if (channelFilter === 'all') return eligibleDealers
    return eligibleDealers.filter((dealer) => dealer.channelTypes.some((type) => mapDealerChannel(type) === channelFilter))
  }, [channelFilter, eligibleDealers])

  const activeDealerId = filteredDealers.some((d) => d.id === dealerId)
    ? dealerId
    : filteredDealers[0]?.id || ''

  const allocation = sumAllocated(
    sharedMatrix,
    dealerMatrix,
    segments,
    cabins,
    eligibleDealers.map((d) => d.id),
  )
  const capacity = physicalTotal(segments, cabins, physicalMap)
  const remain = capacity - allocation.total

  const summaryClass = remain < 0
    ? 'border-red-200 bg-red-50 text-red-700'
    : remain < 20
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-green-200 bg-green-50 text-green-700'

  const resetDraft = () => {
    setSharedMatrix(createSharedMatrix(segments, cabins, physicalMap))
    if (primaryVoyage) {
      setDealerMatrix(createDealerMatrix(segments, cabins, primaryVoyage, eligibleDealers.map((d) => d.id)))
    }
    setEditing(false)
  }

  const handleSave = () => {
    setEditing(false)
    onSave?.()
  }

  const updateShared = (segmentKey: string, cabin: string, field: 'online' | 'shared', value: number) => {
    setSharedMatrix((prev) => ({
      ...prev,
      [segmentKey]: {
        ...prev[segmentKey],
        [cabin]: {
          ...prev[segmentKey][cabin],
          [field]: Math.max(0, value),
        },
      },
    }))
  }

  const updateDealer = (segmentKey: string, cabin: string, value: number) => {
    if (!activeDealerId) return
    setDealerMatrix((prev) => ({
      ...prev,
      [activeDealerId]: {
        ...prev[activeDealerId],
        [cabin]: {
          ...prev[activeDealerId][cabin],
          [segmentKey]: {
            ...prev[activeDealerId][cabin][segmentKey],
            available: Math.max(0, value),
          },
        },
      },
    }))
  }

  if (!primaryVoyage) {
    return <div className="flex h-40 items-center justify-center text-sm text-gray-400">请先选择航次</div>
  }

  return (
    <div className={`flex flex-col ${embedded ? 'min-h-[480px]' : ''}`}>
      <div className={`min-h-0 flex-1 overflow-auto ${embedded ? 'p-3' : 'px-6 py-4'}`}>
        {activeMainTab === 'shared' ? (
          <>
            <p className="mb-3 text-xs text-gray-500">配置线上散客与共享库存；物理容量为只读上限。</p>
            <table className="w-full min-w-[760px] border border-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="sticky left-0 z-10 w-44 border-b border-r border-gray-200 bg-gray-50 px-3 py-3 text-left text-xs font-medium text-gray-600">航段</th>
                  {cabins.map((cabin) => (
                    <th key={cabin} className="min-w-[140px] border-b border-r border-gray-200 px-3 py-3 text-left text-xs font-medium text-gray-600">
                      {cabin}
                      <div className="mt-0.5 font-normal text-gray-400">容量 {physicalMap[cabin]}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {segments.map((segment) => (
                  <tr key={segment.key}>
                    <td className="sticky left-0 z-10 border-r border-b border-gray-200 bg-white px-3 py-3 font-medium text-gray-900">{segment.label}</td>
                    {cabins.map((cabin) => {
                      const cell = sharedMatrix[segment.key]?.[cabin] || { physical: 0, online: 0, shared: 0 }
                      return (
                        <td key={`${segment.key}-${cabin}`} className="border-r border-b border-gray-200 p-3">
                          <CellStack>
                            <CellRow label="物理容量" value={cell.physical} />
                            <CellRow
                              label="线上散客"
                              value={cell.online}
                              editing={editing}
                              onChange={(value) => updateShared(segment.key, cabin, 'online', value)}
                            />
                            <CellRow
                              label="共享库存"
                              value={cell.shared}
                              editing={editing}
                              onChange={(value) => updateShared(segment.key, cabin, 'shared', value)}
                            />
                          </CellStack>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>组团分类</span>
                <select
                  value={channelFilter}
                  onChange={(e) => { setChannelFilter(e.target.value as ChannelFilter); setEditing(false) }}
                  className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                >
                  {(Object.keys(channelFilterLabels) as ChannelFilter[]).map((key) => (
                    <option key={key} value={key}>{channelFilterLabels[key]}</option>
                  ))}
                </select>
              </div>
              <span className={`rounded px-2 py-0.5 text-[11px] ${editing ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                {editing ? '编辑态' : '查看态'}
              </span>
            </div>

            {filteredDealers.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-gray-400">当前分类下暂无可用分销商</div>
            ) : (
              <>
                <div className="mb-3 flex gap-1 overflow-x-auto border-b pb-1">
                  {filteredDealers.map((dealer) => (
                    <button
                      key={dealer.id}
                      type="button"
                      onClick={() => { setDealerId(dealer.id); setEditing(false) }}
                      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${
                        activeDealerId === dealer.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {dealer.name}
                    </button>
                  ))}
                </div>
                <table className="w-full min-w-[760px] border border-gray-200 text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="sticky left-0 z-10 w-44 border-b border-r border-gray-200 bg-gray-50 px-3 py-3 text-left text-xs font-medium text-gray-600">航段</th>
                      {cabins.map((cabin) => (
                        <th key={cabin} className="min-w-[120px] border-b border-r border-gray-200 px-3 py-3 text-left text-xs font-medium text-gray-600">{cabin}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {segments.map((segment) => (
                      <tr key={segment.key}>
                        <td className="sticky left-0 z-10 border-r border-b border-gray-200 bg-white px-3 py-3 font-medium text-gray-900">{segment.label}</td>
                        {cabins.map((cabin) => {
                          const cell = dealerMatrix[activeDealerId]?.[cabin]?.[segment.key] || { sold: 0, available: 0 }
                          return (
                            <td key={`${segment.key}-${cabin}`} className="border-r border-b border-gray-200 p-3">
                              <CellStack>
                                <CellRow label="已售" value={cell.sold} />
                                <CellRow
                                  label="可售"
                                  value={cell.available}
                                  editing={editing}
                                  onChange={(value) => updateDealer(segment.key, cabin, value)}
                                />
                              </CellStack>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}
      </div>

      <div className={`flex flex-wrap items-center justify-between gap-3 border-t ${embedded ? 'bg-white px-3 py-3' : 'px-6 py-4'}`}>
        <div className={`rounded-lg border px-3 py-2 text-xs ${summaryClass}`}>
          已分配 {allocation.total} / 物理容量 {capacity}（剩余 {remain}）
          · 共有 {allocation.online + allocation.sharedStock}（线上 {allocation.online} + 共享 {allocation.sharedStock}）
          · 分销商 {allocation.dealerTotal}
          {mode === 'batch' && ' · 批量模式预览首个航次'}
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={resetDraft} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
              <button onClick={handleSave} className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800">保存</button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
            >
              <Pencil className="h-3.5 w-3.5" />编辑
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function CellStack({ children }: { children: ReactNode }) {
  return <div className="space-y-1.5">{children}</div>
}

function CellRow({
  label,
  value,
  editing = false,
  onChange,
}: {
  label: string
  value: number
  editing?: boolean
  onChange?: (value: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-gray-500">{label}</span>
      {editing && onChange ? (
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-16 rounded border border-gray-300 px-2 py-1 text-right text-sm"
        />
      ) : (
        <span className="font-semibold text-gray-900">{value}</span>
      )}
    </div>
  )
}
