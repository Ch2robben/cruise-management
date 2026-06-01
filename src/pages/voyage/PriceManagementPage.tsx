import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronDown, Edit3, ShipWheel, X } from 'lucide-react'
import { inventoryApi } from '@/mock/api'
import { dealers, products, routes, ships, voyageTemplates, voyages } from '@/mock/data'
import type { Product, ProductSegment, Voyage, VoyageInventory } from '@/types'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import { SalesControlWorkspace } from '@/pages/voyage/SalesControlPage'

type ViewMode = 'voyage' | 'channel'
type StockChangeType = 'increase' | 'decrease'
type RouteLineMode = 'release' | 'sales'

interface SegmentTab {
  key: string
  label: string
  segment?: ProductSegment
}

interface InventoryBoardRow extends VoyageInventory {
  segmentKey: string
  segmentLabel: string
  inventoryQuantity: number
  releaseQuantity: number
  inventoryUnsold: number
  releaseUnsold: number
  displayStatus: 'open' | 'closed' | 'warning' | 'soldout'
  warningLevel: 'none' | 'level1' | 'level2' | 'level3'
}

type ChannelType = 'distributor' | 'ota' | 'mini_program' | 'group'
type ChannelSupplierFilter = 'all' | ChannelType

interface ChannelInventoryRow {
  id: string
  channelName: string
  channelTypes: ChannelType[]
  channelCode: string
  maxSales: number
  sold: number
  available: number
  validPeriod: string
}

interface ChannelSupplierSegment {
  key: string
  label: string
}

interface ChannelSupplierInventoryCell {
  sold: number
  available: number
}

type ChannelSupplierInventoryMatrix = Record<string, Record<string, ChannelSupplierInventoryCell>>

interface ChannelSupplierInventoryState {
  row: ChannelInventoryRow
  group: ChannelSupplierFilter
  supplierId: string
  segments: ChannelSupplierSegment[]
  cabins: string[]
  matrix: ChannelSupplierInventoryMatrix
}

interface EditState {
  row: InventoryBoardRow
  changeType: StockChangeType
  quantity: number
  status: 'enabled' | 'disabled'
}

interface RouteInventoryLine {
  id: string
  name: string
  start: number
  end: number
  color: string
  total: number
  released: number
  sold: number
}

interface RouteLineTooltip {
  segmentIndex: number
  x: number
  y: number
}

const PAGE_SIZE = 500

const statusLabels: Record<InventoryBoardRow['displayStatus'], string> = {
  open: '开放',
  closed: '关闭',
  warning: '预警',
  soldout: '售罄',
}

const statusClass: Record<InventoryBoardRow['displayStatus'], string> = {
  open: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
  warning: 'bg-yellow-100 text-yellow-700',
  soldout: 'bg-red-100 text-red-600',
}

const voyageStatusLabels: Record<string, string> = {
  ticketing: '售票',
  suspended: '停航',
  chartered: '包租',
  deadhead: '空放',
  pending: '待定',
  transfer: '转船',
}

const voyageStatusClass: Record<string, string> = {
  ticketing: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-600',
  chartered: 'bg-purple-100 text-purple-700',
  deadhead: 'bg-gray-100 text-gray-500',
  pending: 'bg-yellow-100 text-yellow-700',
  transfer: 'bg-blue-100 text-blue-700',
}

const voyageStatusOptions = ['ticketing', 'suspended', 'chartered', 'deadhead', 'pending', 'transfer']

const warningLevelLabels: Record<InventoryBoardRow['warningLevel'], string> = {
  none: '无预警',
  level1: '一级预警',
  level2: '二级预警',
  level3: '三级预警',
}

const warningLevelClass: Record<InventoryBoardRow['warningLevel'], string> = {
  none: 'bg-gray-100 text-gray-500',
  level1: 'bg-red-100 text-red-700',
  level2: 'bg-orange-100 text-orange-700',
  level3: 'bg-yellow-100 text-yellow-700',
}

const channelTypeLabels: Record<ChannelType, string> = {
  distributor: '分销商',
  ota: 'OTA',
  mini_program: '小程序',
  group: '组团社',
}

const channelSupplierFilterLabels: Record<ChannelSupplierFilter, string> = {
  all: '全部分类',
  ...channelTypeLabels,
}

const channelTypeClass: Record<ChannelType, string> = {
  distributor: 'bg-blue-100 text-blue-700',
  ota: 'bg-violet-100 text-violet-700',
  mini_program: 'bg-emerald-100 text-emerald-700',
  group: 'bg-amber-100 text-amber-700',
}

const cabinTagClass: Record<string, string> = {
  套房: 'bg-amber-50 text-amber-700 border-amber-200',
  阳台房: 'bg-sky-50 text-sky-700 border-sky-200',
  海景房: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  内舱房: 'bg-slate-100 text-slate-600 border-slate-200',
}

const routeLineColors = ['#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0891b2']

const segmentKey = (segment: ProductSegment) => `${segment.startPort}-${segment.endPort}`

const availableRelease = (row: Pick<VoyageInventory, 'totalRooms' | 'sold' | 'locked' | 'maintenance'>) =>
  Math.max(0, row.totalRooms - row.sold - row.locked - row.maintenance)

const getInventoryStatus = (row: Pick<VoyageInventory, 'status' | 'totalRooms' | 'sold' | 'locked' | 'maintenance'>): InventoryBoardRow['displayStatus'] => {
  if (row.status === 'disabled') return 'closed'
  const available = availableRelease(row)
  if (available <= 0) return 'soldout'
  if (available <= 5) return 'warning'
  return 'open'
}

const getWarningLevel = (releaseUnsold: number): InventoryBoardRow['warningLevel'] => {
  if (releaseUnsold <= 0) return 'level1'
  if (releaseUnsold <= 5) return 'level2'
  if (releaseUnsold <= 10) return 'level3'
  return 'none'
}

function getProduct(voyage?: Voyage) {
  if (!voyage) return undefined
  return products.find(item => item.id === voyage.productId)
}

function getTemplate(voyage?: Voyage) {
  if (!voyage) return undefined
  return voyageTemplates.find(item => item.id === voyage.templateId) || voyageTemplates.find(item => item.productId === voyage.productId)
}

function createSegmentTabs(product?: Product): SegmentTab[] {
  if (!product) return [{ key: 'whole', label: '全航线' }]
  return [
    { key: 'whole', label: `全航线 ${product.startPort}-${product.endPort}` },
    ...product.segments.map(segment => ({ key: segmentKey(segment), label: segmentKey(segment), segment })),
  ]
}

function scaleRowBySegment(row: VoyageInventory, tab: SegmentTab, index: number): InventoryBoardRow {
  if (!tab.segment) {
    const releaseUnsold = availableRelease(row)
    return {
      ...row,
      segmentKey: tab.key,
      segmentLabel: tab.label,
      inventoryQuantity: row.physicalCapacity,
      releaseQuantity: row.totalRooms,
      inventoryUnsold: Math.max(0, row.physicalCapacity - row.sold),
      releaseUnsold,
      displayStatus: getInventoryStatus(row),
      warningLevel: getWarningLevel(releaseUnsold),
    }
  }

  const segmentOffset = Math.max(1, index)
  const inventoryQuantity = Math.max(0, row.physicalCapacity - segmentOffset * 2)
  const releaseQuantity = Math.max(0, row.totalRooms - segmentOffset * 3)
  const sold = Math.min(row.sold, releaseQuantity)
  const locked = Math.min(row.locked, Math.max(0, releaseQuantity - sold))
  const maintenance = Math.min(row.maintenance, Math.max(0, releaseQuantity - sold - locked))
  const scopedRow = { ...row, totalRooms: releaseQuantity, sold, locked, maintenance }

  return {
    ...scopedRow,
    segmentKey: tab.key,
    segmentLabel: tab.label,
    inventoryQuantity,
    releaseQuantity,
    inventoryUnsold: Math.max(0, inventoryQuantity - sold),
    releaseUnsold: availableRelease(scopedRow),
    displayStatus: getInventoryStatus(scopedRow),
    warningLevel: getWarningLevel(availableRelease(scopedRow)),
  }
}

function buildChannelRows(voyage?: Voyage): ChannelInventoryRow[] {
  if (!voyage) return []
  const relatedDealers = dealers.filter(item => item.authorizedProductIds.includes(voyage.productId))
  const supplementDealers = dealers.filter(item => !relatedDealers.some(dealer => dealer.id === item.id))
  const channelDealers = [...relatedDealers, ...supplementDealers].slice(0, 12)

  return channelDealers.map((dealer, index) => {
    const reserved = index % 3 === 1 || index % 3 === 2
    const maxSales = 18 + index * 6 + (reserved ? 10 : 0)
    const sold = Math.min(maxSales, 4 + index * 4 + (voyage.soldCabins % 9))
    const channelTypes: ChannelType[] = dealer.channelTypes.map(type => {
      if (type === 'distribution') return 'distributor'
      return type
    })
    if (index % 5 === 4 && !channelTypes.includes('mini_program')) {
      channelTypes.push('mini_program')
    }
    return {
      id: `${dealer.id}-${index}`,
      channelName: dealer.name,
      channelTypes,
      channelCode: dealer.code,
      maxSales,
      sold,
      available: Math.max(0, maxSales - sold),
      validPeriod: `${voyage.startDate} 至 ${voyage.endDate}`,
    }
  })
}

function createChannelSupplierSegments(product?: Product): ChannelSupplierSegment[] {
  if (!product || product.segments.length === 0) return [{ key: 'whole', label: '全航段' }]
  return [
    { key: 'whole', label: `${product.startPort}-${product.endPort} 全程` },
    ...product.segments.map(segment => ({
      key: segmentKey(segment),
      label: `${segment.startPort}-${segment.endPort}`,
    })),
  ]
}

function createChannelSupplierCabins(rows: VoyageInventory[]): string[] {
  const cabins = Array.from(new Set(rows.map(row => row.cabinTypeName).filter(Boolean)))
  return cabins.length > 0 ? cabins : ['标准房']
}

function createChannelSupplierMatrix(
  row: ChannelInventoryRow,
  segments: ChannelSupplierSegment[],
  cabins: string[],
): ChannelSupplierInventoryMatrix {
  const cabinCount = Math.max(cabins.length, 1)

  return segments.reduce<ChannelSupplierInventoryMatrix>((segmentAcc, segment, segmentIndex) => {
    segmentAcc[segment.key] = cabins.reduce<Record<string, ChannelSupplierInventoryCell>>((cabinAcc, cabin, cabinIndex) => {
      const soldBase = row.sold / cabinCount
      const availableBase = row.available / cabinCount
      const segmentWeight = Math.max(0.55, 1 - segmentIndex * 0.08)
      const cabinWeight = 1 + cabinIndex * 0.12

      cabinAcc[cabin] = {
        sold: Math.max(0, Math.round(soldBase * segmentWeight * cabinWeight + segmentIndex)),
        available: Math.max(0, Math.round(availableBase * segmentWeight * cabinWeight + cabinCount - cabinIndex)),
      }
      return cabinAcc
    }, {})
    return segmentAcc
  }, {})
}

function filterChannelRowsBySupplierGroup(rows: ChannelInventoryRow[], group: ChannelSupplierFilter) {
  if (group === 'all') return rows
  return rows.filter(row => row.channelTypes.includes(group))
}

export default function PriceManagementPage() {
  const [searchParams] = useSearchParams()
  const initialVoyageId = searchParams.get('voyageId') || ''
  const initialKeyword = searchParams.get('keyword') || ''
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<VoyageInventory[]>([])
  const [keyword, setKeyword] = useState(initialKeyword)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [routeFilters, setRouteFilters] = useState<string[]>([])
  const [routeDropdownOpen, setRouteDropdownOpen] = useState(false)
  const [shipFilter, setShipFilter] = useState('all')
  const [voyageStatusFilter, setVoyageStatusFilter] = useState('all')
  const [selectedVoyageId, setSelectedVoyageId] = useState(initialVoyageId)
  const [viewMode, setViewMode] = useState<ViewMode>('voyage')
  const [activeSegmentKey, setActiveSegmentKey] = useState('whole')
  const [editState, setEditState] = useState<EditState | null>(null)
  const [channelSupplierState, setChannelSupplierState] = useState<ChannelSupplierInventoryState | null>(null)
  const [channelInventoryOverrides, setChannelInventoryOverrides] = useState<Record<string, number>>({})

  const fetchInventories = useCallback(async () => {
    setLoading(true)
    try {
      const result = await inventoryApi.list({ page: 1, pageSize: PAGE_SIZE })
      setRows(result.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInventories()
  }, [fetchInventories])

  const filteredVoyages = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return voyages.filter(voyage => {
      if (kw && !`${voyage.voyageNo} ${voyage.productName} ${voyage.routeName}`.toLowerCase().includes(kw)) return false
      if (dateFrom && voyage.startDate < dateFrom) return false
      if (dateTo && voyage.startDate > dateTo) return false
      if (routeFilters.length > 0 && !routeFilters.includes(voyage.routeId)) return false
      if (shipFilter !== 'all' && voyage.shipId !== shipFilter) return false
      if (voyageStatusFilter !== 'all' && voyage.status !== voyageStatusFilter) return false
      return true
    })
  }, [dateFrom, dateTo, keyword, routeFilters, shipFilter, voyageStatusFilter])

  useEffect(() => {
    if (filteredVoyages.length === 0) {
      setSelectedVoyageId('')
      return
    }
    if (selectedVoyageId && filteredVoyages.some(item => item.id === selectedVoyageId)) return
    const queryVoyage = initialKeyword ? filteredVoyages.find(item => item.voyageNo === initialKeyword) : undefined
    setSelectedVoyageId(initialVoyageId || queryVoyage?.id || filteredVoyages[0].id)
  }, [filteredVoyages, initialKeyword, initialVoyageId, selectedVoyageId])

  const selectedVoyage = useMemo(() => {
    return voyages.find(item => item.id === selectedVoyageId) || filteredVoyages[0]
  }, [filteredVoyages, selectedVoyageId])

  const selectedProduct = useMemo(() => getProduct(selectedVoyage), [selectedVoyage])
  const selectedTemplate = useMemo(() => getTemplate(selectedVoyage), [selectedVoyage])
  const segmentTabs = useMemo(() => createSegmentTabs(selectedProduct), [selectedProduct])

  useEffect(() => {
    if (!segmentTabs.some(item => item.key === activeSegmentKey)) {
      setActiveSegmentKey('whole')
    }
  }, [activeSegmentKey, segmentTabs])

  const selectedInventoryRows = useMemo(() => {
    if (!selectedVoyage) return []
    return rows.filter(row => row.voyageId === selectedVoyage.id)
  }, [rows, selectedVoyage])

  const activeSegment = segmentTabs.find(item => item.key === activeSegmentKey) || segmentTabs[0]

  const boardRows = useMemo(() => {
    return selectedInventoryRows.map((row, index) => scaleRowBySegment(row, activeSegment, segmentTabs.findIndex(item => item.key === activeSegment.key) + index))
  }, [activeSegment, segmentTabs, selectedInventoryRows])

  const rawChannelRows = useMemo(() => buildChannelRows(selectedVoyage), [selectedVoyage])
  const channelRows = useMemo(() => {
    return rawChannelRows.map(row => (
      channelInventoryOverrides[row.id] === undefined ? row : { ...row, available: channelInventoryOverrides[row.id] }
    ))
  }, [channelInventoryOverrides, rawChannelRows])

  const routeFilterLabel = useMemo(() => {
    if (routeFilters.length === 0) return '全部航线'
    if (routeFilters.length === 1) return routes.find(route => route.id === routeFilters[0])?.name || '已选 1 条航线'
    return `已选 ${routeFilters.length} 条航线`
  }, [routeFilters])

  const toggleRouteFilter = (routeId: string) => {
    setRouteFilters(prev => prev.includes(routeId) ? prev.filter(id => id !== routeId) : [...prev, routeId])
  }

  const handleReset = () => {
    setKeyword('')
    setDateFrom('')
    setDateTo('')
    setRouteFilters([])
    setRouteDropdownOpen(false)
    setShipFilter('all')
    setVoyageStatusFilter('all')
  }

  const openEdit = (row: InventoryBoardRow) => {
    setEditState({
      row,
      changeType: 'increase',
      quantity: 0,
      status: row.status === 'disabled' ? 'disabled' : 'enabled',
    })
  }

  const saveEdit = async () => {
    if (!editState) return
    const current = rows.find(item => item.id === editState.row.id)
    if (!current) return
    const delta = editState.changeType === 'increase' ? editState.quantity : -editState.quantity
    const nextTotalRooms = Math.max(0, current.totalRooms + delta)
    await inventoryApi.batchUpdate([current.id], {
      totalRooms: nextTotalRooms,
      status: editState.status,
      updatedBy: '当前用户',
      updatedAt: new Date().toISOString(),
    })
    setEditState(null)
    await fetchInventories()
  }

  const openChannelSupplierInventory = (row: ChannelInventoryRow) => {
    const segments = createChannelSupplierSegments(selectedProduct)
    const cabins = createChannelSupplierCabins(selectedInventoryRows)
    setChannelSupplierState({
      row,
      group: 'all',
      supplierId: row.id,
      segments,
      cabins,
      matrix: createChannelSupplierMatrix(row, segments, cabins),
    })
  }

  const changeChannelSupplierGroup = (group: ChannelSupplierFilter) => {
    setChannelSupplierState(prev => {
      if (!prev) return prev
      const options = filterChannelRowsBySupplierGroup(channelRows, group)
      const nextRow = options.find(row => row.id === prev.supplierId) || options[0] || prev.row
      return {
        ...prev,
        row: nextRow,
        group,
        supplierId: nextRow.id,
        matrix: createChannelSupplierMatrix(nextRow, prev.segments, prev.cabins),
      }
    })
  }

  const changeChannelSupplier = (supplierId: string) => {
    setChannelSupplierState(prev => {
      if (!prev) return prev
      const nextRow = channelRows.find(row => row.id === supplierId) || prev.row
      return {
        ...prev,
        row: nextRow,
        supplierId: nextRow.id,
        matrix: createChannelSupplierMatrix(nextRow, prev.segments, prev.cabins),
      }
    })
  }

  const updateChannelSupplierAvailable = (segmentKey: string, cabin: string, value: number) => {
    setChannelSupplierState(prev => {
      if (!prev) return prev
      const currentSegment = prev.matrix[segmentKey] || {}
      const currentCell = currentSegment[cabin] || { sold: 0, available: 0 }
      return {
        ...prev,
        matrix: {
          ...prev.matrix,
          [segmentKey]: {
            ...currentSegment,
            [cabin]: {
              ...currentCell,
              available: Math.max(0, value),
            },
          },
        },
      }
    })
  }

  const saveChannelSupplierInventory = () => {
    if (!channelSupplierState) return
    const wholeSegmentKey = channelSupplierState.segments[0]?.key
    const sourceSegment = channelSupplierState.matrix[wholeSegmentKey] || channelSupplierState.matrix[channelSupplierState.segments[1]?.key] || {}
    const nextAvailable = Object.values(sourceSegment).reduce((sum, cell) => sum + cell.available, 0)
    setChannelInventoryOverrides(prev => ({
      ...prev,
      [channelSupplierState.row.id]: nextAvailable,
    }))
    setChannelSupplierState(null)
  }

  const pageTitle = selectedVoyage ? `价格管理 · ${selectedVoyage.voyageNo}` : '价格管理'
  const channelSupplierOptions = channelSupplierState ? filterChannelRowsBySupplierGroup(channelRows, channelSupplierState.group) : []

  return (
    <div>
      <PageHeader title={pageTitle} description="管理所选航次的价格策略与信息" />

      <SearchPanel onSearch={() => setRouteDropdownOpen(false)} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">航期开始</label>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">航期结束</label>
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="relative flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">航线（多选）</label>
          <button
            type="button"
            onClick={() => setRouteDropdownOpen(open => !open)}
            className="flex h-10 w-64 items-center justify-between rounded-lg border border-gray-300 bg-white px-3 text-left text-sm text-gray-700 hover:border-gray-400"
          >
            <span className="truncate">{routeFilterLabel}</span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${routeDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {routeDropdownOpen && (
            <div className="absolute left-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
              <button
                type="button"
                onClick={() => setRouteFilters([])}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${routeFilters.length === 0 ? 'font-medium text-blue-600' : 'text-gray-700'}`}
              >
                全部航线
              </button>
              <div className="max-h-64 overflow-y-auto border-t border-gray-100 py-1">
                {routes.map(route => (
                  <label key={route.id} className="flex cursor-pointer items-start gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={routeFilters.includes(route.id)}
                      onChange={() => toggleRouteFilter(route.id)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="leading-5">{route.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">游轮</label>
          <select value={shipFilter} onChange={(event) => setShipFilter(event.target.value)} className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">全部</option>
            {ships.map(ship => <option key={ship.id} value={ship.id}>{ship.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">航次状态</label>
          <select value={voyageStatusFilter} onChange={(event) => setVoyageStatusFilter(event.target.value)} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">全部</option>
            {voyageStatusOptions.map(status => <option key={status} value={status}>{voyageStatusLabels[status]}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">关键词</label>
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="航次号/产品/航线" className="w-52 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      </SearchPanel>

      <div className="grid grid-cols-[260px_minmax(0,1fr)] gap-4">
        <aside className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">筛选结果航次</span>
            <span className="text-xs text-gray-500">共 {filteredVoyages.length} 条</span>
          </div>
          <div className="max-h-[690px] overflow-y-auto p-3 space-y-2">
            {filteredVoyages.length === 0 ? (
              <div className="py-20 text-center text-sm text-gray-400">暂无匹配航次</div>
            ) : filteredVoyages.map(voyage => {
              const selected = selectedVoyage?.id === voyage.id
              return (
                <button
                  key={voyage.id}
                  onClick={() => setSelectedVoyageId(voyage.id)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    selected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-gray-900">{voyage.voyageNo}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${selected ? 'bg-blue-600 text-white' : voyageStatusClass[voyage.status] || 'bg-gray-100 text-gray-500'}`}>
                      {voyageStatusLabels[voyage.status] || voyage.status}
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-medium text-gray-900 truncate">{voyage.productName}</div>
                  <div className="mt-1 text-xs text-gray-500 truncate">{voyage.startDate} · {voyage.shipName}</div>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="space-y-4">
          {selectedVoyage ? (
            <div className="bg-white border border-gray-200 rounded-lg py-24 flex flex-col items-center justify-center">
              <span className="text-gray-500 text-sm">价格管理内容建设中...</span>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg py-24 text-center text-sm text-gray-400">请选择左侧航次</div>
          )}
        </section>
      </div>

      {channelSupplierState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setChannelSupplierState(null)} />
          <div className="relative flex max-h-[86vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">分销商-库存</h3>
                <p className="mt-1 text-xs text-gray-500">按分销商、航段和房型调整可售库存；已售数仅展示不可编辑。</p>
              </div>
              <button onClick={() => setChannelSupplierState(null)} className="rounded p-1 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>

            <div className="border-b bg-gray-50 px-5 py-4">
              <div className="grid grid-cols-[180px_minmax(0,320px)_1fr] gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-500">组团分类</label>
                  <select
                    value={channelSupplierState.group}
                    onChange={(event) => changeChannelSupplierGroup(event.target.value as ChannelSupplierFilter)}
                    className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700"
                  >
                    {(['all', 'ota', 'distributor', 'group', 'mini_program'] as ChannelSupplierFilter[]).map(type => (
                      <option key={type} value={type}>{channelSupplierFilterLabels[type]}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-500">分销商</label>
                  <select
                    value={channelSupplierState.supplierId}
                    onChange={(event) => changeChannelSupplier(event.target.value)}
                    className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700"
                  >
                    {channelSupplierOptions.length === 0 ? (
                      <option value={channelSupplierState.supplierId}>{channelSupplierState.row.channelName}</option>
                    ) : channelSupplierOptions.map(row => (
                      <option key={row.id} value={row.id}>{row.channelName}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500">
                    当前分销商：<span className="font-medium text-gray-900">{channelSupplierState.row.channelName}</span>
                    <span className="mx-2 text-gray-300">/</span>
                    编码：<span className="font-mono text-gray-700">{channelSupplierState.row.channelCode}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-5">
              <table className="w-full min-w-[860px] border-separate border-spacing-0 overflow-hidden rounded-lg border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="sticky left-0 z-10 w-52 border-b border-r border-gray-200 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600">航段（含子航段）</th>
                    {channelSupplierState.cabins.map(cabin => (
                      <th key={cabin} className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-600">{cabin}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {channelSupplierState.segments.map(segment => (
                    <tr key={segment.key} className="border-b last:border-b-0">
                      <td className="sticky left-0 z-10 border-r border-t border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900">{segment.label}</td>
                      {channelSupplierState.cabins.map(cabin => {
                        const cell = channelSupplierState.matrix[segment.key]?.[cabin] || { sold: 0, available: 0 }
                        return (
                          <td key={`${segment.key}-${cabin}`} className="border-t border-gray-200 px-4 py-3 align-top">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between rounded-md bg-gray-50 px-2 py-1.5 text-xs text-gray-500">
                                <span>已售</span>
                                <span className="font-semibold text-gray-900">{cell.sold}</span>
                              </div>
                              <label className="block">
                                <span className="mb-1 block text-xs text-gray-500">可售库存</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={cell.available}
                                  onChange={(event) => updateChannelSupplierAvailable(segment.key, cabin, Number(event.target.value) || 0)}
                                  className="h-9 w-full rounded-lg border border-gray-300 px-2 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                              </label>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 border-t px-5 py-4">
              <button onClick={() => setChannelSupplierState(null)} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
              <button onClick={saveChannelSupplierInventory} className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800">保存</button>
            </div>
          </div>
        </div>
      )}

      {editState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditState(null)} />
          <div className="relative w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">编辑航次库存</h3>
                <p className="mt-1 text-xs text-gray-500">库存变动会记录到当前航次、航段和舱房类型。</p>
              </div>
              <button onClick={() => setEditState(null)} className="rounded p-1 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 px-5 py-4">
              <ReadonlyField label="航次舱位" value={`${editState.row.voyageNo} / ${editState.row.segmentLabel} / ${editState.row.cabinTypeName}`} />
              <ReadonlyField label="库存数" value={String(rows.find(item => item.id === editState.row.id)?.totalRooms ?? editState.row.releaseQuantity)} />
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">变动类型</label>
                <div className="flex gap-3">
                  <RadioButton checked={editState.changeType === 'increase'} label="增加库存" onClick={() => setEditState({ ...editState, changeType: 'increase' })} />
                  <RadioButton checked={editState.changeType === 'decrease'} label="减少库存" onClick={() => setEditState({ ...editState, changeType: 'decrease' })} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">变动数量</label>
                <input
                  type="number"
                  min={0}
                  value={editState.quantity}
                  onChange={(event) => setEditState({ ...editState, quantity: Math.max(0, Number(event.target.value) || 0) })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">状态</label>
                <div className="flex gap-3">
                  <RadioButton checked={editState.status === 'enabled'} label="开放" onClick={() => setEditState({ ...editState, status: 'enabled' })} />
                  <RadioButton checked={editState.status === 'disabled'} label="关闭" onClick={() => setEditState({ ...editState, status: 'disabled' })} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t px-5 py-4">
              <button onClick={() => setEditState(null)} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
              <button onClick={saveEdit} className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RouteInventoryLineBoard({
  product,
  rows = [],
  channelRows,
  title = '库存线路视图',
  lineLabel = 'OD 线',
}: {
  product?: Product
  rows?: VoyageInventory[]
  channelRows?: ChannelInventoryRow[]
  title?: string
  lineLabel?: string
}) {
  const [mode, setMode] = useState<RouteLineMode>('release')
  const [tooltip, setTooltip] = useState<RouteLineTooltip | null>(null)
  const [selectedRouteSegment, setSelectedRouteSegment] = useState('all')

  const segments = product?.segments || []
  const stops = useMemo(() => {
    if (!product || segments.length === 0) return []
    return [segments[0].startPort, ...segments.map(segment => segment.endPort)]
  }, [product, segments])

  const lines = useMemo(() => {
    if (channelRows) return buildChannelInventoryLines(stops, channelRows)
    return buildRouteInventoryLines(stops, rows)
  }, [channelRows, rows, stops])
  const segmentCount = Math.max(0, stops.length - 1)
  const routeSegmentOptions = useMemo(() => {
    return Array.from({ length: segmentCount }).map((_, index) => ({
      key: `${stops[index]}-${stops[index + 1]}`,
      label: `${stops[index]}-${stops[index + 1]}`,
    }))
  }, [segmentCount, stops])

  if (!product || segmentCount === 0) {
    return null
  }

  const activeLines = tooltip ? lines.filter(line => line.start <= tooltip.segmentIndex && tooltip.segmentIndex < line.end) : []
  const aggregate = getLineAggregate(activeLines, mode)

  return (
    <div
      className="relative overflow-visible rounded-lg border border-gray-200 bg-white"
      onMouseLeave={() => setTooltip(null)}
    >
      <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-xs text-gray-500">
            {mode === 'release' ? '绿色表示已投库存，灰色表示可投未占用。' : '绿色表示已售库存，灰色表示已投未售。'}
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => setMode('release')}
            className={`rounded-md px-3 py-1.5 text-sm ${mode === 'release' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            可投库存
          </button>
          <button
            type="button"
            onClick={() => setMode('sales')}
            className={`rounded-md px-3 py-1.5 text-sm ${mode === 'sales' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            已投库存
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        <div
          className="grid items-start gap-6"
          style={{ gridTemplateColumns: '124px minmax(0, 1fr)' }}
        >
          <div className="flex flex-col">
            <select
              value={selectedRouteSegment}
              onChange={(event) => setSelectedRouteSegment(event.target.value)}
              className="h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">全部航段</option>
              {routeSegmentOptions.map(option => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
            <div className="mt-3 flex h-5 items-center justify-center text-sm font-semibold text-gray-900">停靠点</div>
          </div>
          <div className="relative px-1 pb-12 pt-2">
            <div
              className="grid gap-0"
              style={{ gridTemplateColumns: `repeat(${segmentCount}, minmax(72px, 1fr))` }}
            >
              {Array.from({ length: segmentCount }).map((_, index) => {
                const segmentLines = lines.filter(line => line.start <= index && index < line.end)
                const { total, used, percent } = getLineAggregate(segmentLines, mode)
                const stockColor = getStockLevelColor(percent)
                const segmentOptionKey = `${stops[index]}-${stops[index + 1]}`
                const selected = selectedRouteSegment === segmentOptionKey
                return (
                  <div
                    key={`${stops[index]}-${stops[index + 1]}`}
                    className={`h-4 cursor-pointer overflow-hidden border transition-transform ${
                      tooltip?.segmentIndex === index || selected ? 'translate-y-[-2px] border-gray-900' : 'border-gray-300'
                    }`}
                    style={{
                      background: `linear-gradient(to right, ${stockColor} 0 ${percent}%, #d8dee8 ${percent}% 100%)`,
                    }}
                    onMouseEnter={(event) => setTooltip({ segmentIndex: index, x: event.clientX + 18, y: event.clientY + 10 })}
                    onMouseMove={(event) => setTooltip({ segmentIndex: index, x: event.clientX + 18, y: event.clientY + 10 })}
                    title={`${stops[index]} → ${stops[index + 1]} ${used}/${total}`}
                  />
                )
              })}
            </div>
            <div className="pointer-events-none absolute left-1 right-1 top-2 h-7">
              {stops.map((stop, index) => {
                const left = segmentCount === 0 ? 0 : `${(index / segmentCount) * 100}%`
                return (
                  <div
                    key={stop}
                    className="absolute flex w-[72px] -translate-x-1/2 flex-col items-center px-1.5"
                    style={{ left }}
                  >
                    <span className="block h-2.5 w-2.5 rounded-full border-2 border-slate-400 bg-white" />
                    <span className="mt-4 flex h-5 w-full items-center justify-center truncate text-center text-sm font-medium text-gray-700">{stop}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 w-[340px] border border-gray-900 bg-white p-3 shadow-xl"
          style={{ left: Math.min(tooltip.x, window.innerWidth - 360), top: tooltip.y }}
        >
          <div className="font-semibold text-gray-900">{stops[tooltip.segmentIndex]} → {stops[tooltip.segmentIndex + 1]}</div>
          <div className="mt-1 text-xs text-gray-500">当前航段共有 {activeLines.length} 条{lineLabel}穿过</div>
          <div className="mt-2 h-2 bg-gray-100">
            <div className="h-full" style={{ width: `${aggregate.percent}%`, backgroundColor: getStockLevelColor(aggregate.percent) }} />
          </div>
          <div className="mt-2 flex items-center justify-between border-t pt-2 text-xs text-gray-600">
            <span>本航段合计 {mode === 'release' ? '已投 / 可投' : '已售 / 已投'}</span>
            <strong className="text-sm text-gray-900">{aggregate.used}/{aggregate.total}</strong>
          </div>
          <div className="mt-2 flex items-center justify-between border-t pt-2 text-xs text-gray-600">
            <span>本航段占用率</span>
            <strong className="text-sm text-gray-900">{aggregate.percent}%</strong>
          </div>
          <div className="mt-3 space-y-2">
            {activeLines.map(line => {
              const itemTotal = mode === 'release' ? line.total : line.released
              const itemUsed = mode === 'release' ? line.released : line.sold
              const itemPercent = itemTotal <= 0 ? 0 : Math.round((itemUsed / itemTotal) * 100)
              const itemColor = getStockLevelColor(itemPercent)
              return (
                <div key={line.id} className="border border-gray-200 bg-gray-50 p-2">
                  <div className="flex items-center justify-between gap-3 text-xs font-semibold text-gray-900">
                    <span>{line.name}</span>
                    <span>{itemUsed}/{itemTotal}</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-200">
                    <div className="h-full" style={{ width: `${itemPercent}%`, backgroundColor: itemColor }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function buildRouteInventoryLines(stops: string[], rows: VoyageInventory[]): RouteInventoryLine[] {
  if (stops.length < 2) return []

  const totalRooms = rows.reduce((sum, row) => sum + row.totalRooms, 0)
  const physicalCapacity = rows.reduce((sum, row) => sum + row.physicalCapacity, 0)
  const sold = rows.reduce((sum, row) => sum + row.sold, 0)
  const safeTotal = Math.max(physicalCapacity, totalRooms, 1)
  const safeRelease = Math.max(totalRooms, sold, 1)
  const lastIndex = stops.length - 1

  const candidates: Array<Omit<RouteInventoryLine, 'color'>> = [
    {
      id: 'full',
      name: `${stops[0]}-${stops[lastIndex]} 全程`,
      start: 0,
      end: lastIndex,
      total: safeTotal,
      released: safeRelease,
      sold,
    },
  ]

  if (lastIndex >= 2) {
    candidates.push({
      id: 'start-mid',
      name: `${stops[0]}-${stops[lastIndex - 1]} 联程`,
      start: 0,
      end: lastIndex - 1,
      total: Math.max(1, Math.round(safeTotal * 0.58)),
      released: Math.max(1, Math.round(safeRelease * 0.52)),
      sold: Math.max(0, Math.round(sold * 0.48)),
    })
    candidates.push({
      id: 'mid-end',
      name: `${stops[1]}-${stops[lastIndex]} 联程`,
      start: 1,
      end: lastIndex,
      total: Math.max(1, Math.round(safeTotal * 0.44)),
      released: Math.max(1, Math.round(safeRelease * 0.36)),
      sold: Math.max(0, Math.round(sold * 0.28)),
    })
  }

  if (lastIndex >= 3) {
    candidates.push({
      id: 'short-middle',
      name: `${stops[2]}-${stops[lastIndex - 1]} 短途`,
      start: 2,
      end: lastIndex - 1,
      total: Math.max(1, Math.round(safeTotal * 0.32)),
      released: Math.max(1, Math.round(safeRelease * 0.28)),
      sold: Math.max(0, Math.round(sold * 0.22)),
    })
  }

  candidates.push({
    id: 'short-last',
    name: `${stops[lastIndex - 1]}-${stops[lastIndex]} 短途`,
    start: lastIndex - 1,
    end: lastIndex,
    total: Math.max(1, Math.round(safeTotal * 0.38)),
    released: Math.max(1, Math.round(safeRelease * 0.24)),
    sold: Math.max(0, Math.round(sold * 0.14)),
  })

  return candidates
    .filter(line => line.end > line.start)
    .map((line, index) => ({ ...line, color: routeLineColors[index % routeLineColors.length] }))
}

function buildChannelInventoryLines(stops: string[], rows: ChannelInventoryRow[]): RouteInventoryLine[] {
  if (stops.length < 2) return []
  const lastIndex = stops.length - 1
  const maxSalesTotal = rows.reduce((sum, row) => sum + row.maxSales, 0)
  const segmentBaseTotal = Math.max(maxSalesTotal, 1)

  return rows.slice(0, 8).map((row, index) => {
    const start = Math.min(index % lastIndex, Math.max(0, lastIndex - 1))
    const span = index % 3 === 0 ? lastIndex : index % 3 === 1 ? Math.min(2, lastIndex - start) : 1
    const end = Math.min(lastIndex, Math.max(start + 1, start + span))
    const allocationBase = Math.max(row.maxSales + row.available, row.maxSales, 1)

    return {
      id: row.id,
      name: row.channelName,
      start,
      end,
      color: routeLineColors[index % routeLineColors.length],
      total: Math.max(allocationBase, Math.round(segmentBaseTotal / Math.max(2, rows.length))),
      released: Math.max(row.maxSales, row.sold, 1),
      sold: row.sold,
    }
  })
}

function getLineAggregate(lines: RouteInventoryLine[], mode: RouteLineMode) {
  const total = lines.reduce((sum, line) => sum + (mode === 'release' ? line.total : line.released), 0)
  const used = lines.reduce((sum, line) => sum + (mode === 'release' ? line.released : line.sold), 0)
  return {
    total,
    used,
    percent: total <= 0 ? 0 : Math.round((used / total) * 100),
  }
}

function getStockLevelColor(percent: number) {
  if (percent >= 85) return '#dc2626'
  if (percent >= 60) return '#f59e0b'
  return '#16a34a'
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 truncate font-medium text-gray-900">{value || '-'}</div>
    </div>
  )
}

function VoyageInventoryTable({ rows, onEdit }: { rows: InventoryBoardRow[]; onEdit: (row: InventoryBoardRow) => void }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              {['序号', '船舱类型', '库存数量', '投放数量', '已售数', '库存未售数', '投放未售数', '库存状态', '预警等级', '操作'].map(title => (
                <th key={title} className="px-4 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">{title}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-16 text-center text-sm text-gray-400">暂无库存数据</td></tr>
            ) : rows.map((row, index) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                <td className="px-4 py-3"><CabinTag name={row.cabinTypeName} /></td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{row.inventoryQuantity}</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{row.releaseQuantity}</td>
                <td className="px-4 py-3 text-sm text-green-600 font-semibold">{row.sold}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{row.inventoryUnsold}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{row.releaseUnsold}</td>
                <td className="px-4 py-3"><StatusTag status={row.displayStatus} /></td>
                <td className="px-4 py-3"><WarningLevelTag level={row.warningLevel} /></td>
                <td className="px-4 py-3">
                  <button onClick={() => onEdit(row)} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">
                    <Edit3 className="h-3 w-3" />编辑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t bg-gray-50 px-4 py-3 text-xs text-gray-500">表格字段只展示不直接编辑；库存调整通过行内“编辑”弹窗完成。</div>
    </div>
  )
}

function ChannelInventoryTable({ rows, onRowClick }: { rows: ChannelInventoryRow[]; onRowClick: (row: ChannelInventoryRow) => void }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              {['渠道', '渠道类型', '允许销售总数', '已售总数', '可售', '有效期'].map(title => (
                <th key={title} className="px-4 py-3 text-left text-xs font-medium text-gray-600 whitespace-nowrap">{title}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(row => (
              <tr key={row.id} onClick={() => onRowClick(row)} className="cursor-pointer hover:bg-blue-50/60">
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">{row.channelName}</div>
                  <div className="mt-0.5 font-mono text-xs text-gray-400">{row.channelCode}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {row.channelTypes.map(type => (
                      <span key={type} className={`rounded-full px-2 py-0.5 text-xs ${channelTypeClass[type]}`}>
                        {channelTypeLabels[type]}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{row.maxSales}</td>
                <td className="px-4 py-3 text-sm text-green-600 font-semibold">{row.sold}</td>
                <td className={`px-4 py-3 text-sm font-semibold ${row.available <= 5 ? 'text-red-600' : 'text-gray-900'}`}>{row.available}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.validPeriod}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t bg-gray-50 px-4 py-3 text-xs text-gray-500">点击分销商行，可按分销商、航段和房型调整可售库存。</div>
    </div>
  )
}

function CabinTag({ name }: { name: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${cabinTagClass[name] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {name}
    </span>
  )
}

function StatusTag({ status }: { status: InventoryBoardRow['displayStatus'] }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass[status]}`}>{statusLabels[status]}</span>
}

function WarningLevelTag({ level }: { level: InventoryBoardRow['warningLevel'] }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs ${warningLevelClass[level]}`}>{warningLevelLabels[level]}</span>
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input value={value} readOnly className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600" />
    </div>
  )
}

function RadioButton({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm ${checked ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
    >
      {label}
    </button>
  )
}
