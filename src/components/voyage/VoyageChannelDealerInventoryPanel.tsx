import { useEffect, useMemo, useState } from 'react'
import { Pencil } from 'lucide-react'
import { templateApi } from '@/mock/api'
import { dealers, products } from '@/mock/data'
import DealerInventoryAllocationTable from '@/components/voyage/DealerInventoryAllocationTable'
import {
  collectSelectedDealerIds,
  findAggregatedOverAllocations,
  getTemplateSellRoomTypes,
  loadDealerInventoryRules,
  loadTemplateInventoryRules,
  saveDealerInventoryRules,
  saveTemplateInventoryRules,
  segmentKey,
  setAggregatedDealerAllocation,
  setDealerQuantity,
  type TemplateDealerInventoryRules,
  type TemplateInventoryRules,
} from '@/mock/templateInventoryRules'
import type { TemplateSellRoomType } from '@/mock/sellRoomTypeConfig'
import type { ProductSegment, Voyage, VoyageTemplate } from '@/types'

interface VoyageChannelDealerInventoryPanelProps {
  voyage: Voyage
}

export default function VoyageChannelDealerInventoryPanel({ voyage }: VoyageChannelDealerInventoryPanelProps) {
  const [template, setTemplate] = useState<VoyageTemplate | null>(null)
  const [inventoryRules, setInventoryRules] = useState<TemplateInventoryRules>({})
  const [dealerRules, setDealerRules] = useState<TemplateDealerInventoryRules>({})
  const [sellRoomTypes, setSellRoomTypes] = useState<TemplateSellRoomType[]>([])
  const [selectedDealers, setSelectedDealers] = useState<string[]>([])
  const [editMode, setEditMode] = useState(false)
  const [dealerDropdownOpen, setDealerDropdownOpen] = useState(false)
  const [saveWarning, setSaveWarning] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!voyage.templateId) {
      setTemplate(null)
      setSellRoomTypes([])
      return
    }
    let cancelled = false

    async function loadData() {
      setLoading(true)
      setEditMode(false)
      setSaveWarning('')
      setDealerDropdownOpen(false)

      const t = await templateApi.getById(voyage.templateId)
      if (cancelled || !t) {
        setLoading(false)
        return
      }

      const roomTypes = getTemplateSellRoomTypes(t)
      const channelRules = loadTemplateInventoryRules(t)
      const dealerAllocRules = loadDealerInventoryRules(t, channelRules)
      setTemplate(t)
      setSellRoomTypes(roomTypes)
      setInventoryRules(channelRules)
      setDealerRules(dealerAllocRules)
      setSelectedDealers(collectSelectedDealerIds(dealerAllocRules))
      setLoading(false)
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [voyage.templateId])

  const productObj = useMemo(
    () => (template ? products.find((p) => p.id === template.productId) : undefined),
    [template],
  )
  const segmentsList = productObj?.segments || []
  const activeDealers = useMemo(() => dealers.filter((dealer) => dealer.status === 'cooperating'), [])

  const segmentEntries = useMemo(
    () =>
      segmentsList.length > 0
        ? segmentsList.map((segment) => ({ key: segmentKey(segment), segment }))
        : [{ key: '全程', segment: null as ProductSegment | null }],
    [segmentsList],
  )

  const overAllocations = useMemo(
    () => findAggregatedOverAllocations(inventoryRules, dealerRules, sellRoomTypes.map((item) => item.code)),
    [dealerRules, inventoryRules, sellRoomTypes],
  )

  const selectedDealerNames = selectedDealers
    .map((dealerId) => activeDealers.find((dealer) => dealer.id === dealerId)?.name)
    .filter(Boolean)
    .join('、')

  const syncDealerRows = (dealerIds: string[]) => {
    setDealerRules((prev) => {
      const nextRules: TemplateDealerInventoryRules = { ...prev }
      sellRoomTypes.forEach((sellRoom) => {
        const cabinMap = { ...(nextRules[sellRoom.code] || {}) }
        segmentEntries.forEach(({ key }) => {
          const current = cabinMap[key] || []
          cabinMap[key] = dealerIds.map((dealerId) => {
            const existing = current.find((item) => item.dealerId === dealerId)
            return existing || { dealerId, quantity: 0 }
          })
        })
        nextRules[sellRoom.code] = cabinMap
      })
      return nextRules
    })
  }

  const toggleDealerSelection = (dealerId: string) => {
    const next = selectedDealers.includes(dealerId)
      ? selectedDealers.filter((id) => id !== dealerId)
      : [...selectedDealers, dealerId]
    setSelectedDealers(next)
    syncDealerRows(next)
  }

  const updateDealerAllocation = (
    sellRoomTypeCode: string,
    segKey: string,
    dealerId: string,
    value: number,
  ) => {
    setDealerRules((prev) => {
      const cabinMap = { ...(prev[sellRoomTypeCode] || {}) }
      const current = cabinMap[segKey] || []
      return {
        ...prev,
        [sellRoomTypeCode]: {
          ...cabinMap,
          [segKey]: setDealerQuantity(current, dealerId, value),
        },
      }
    })
  }

  const updateAggregatedDealerAllocation = (sellRoomTypeCode: string, dealerId: string, value: number) => {
    setDealerRules((prev) => setAggregatedDealerAllocation(prev, sellRoomTypeCode, dealerId, value))
  }

  const handleSave = () => {
    if (!template) return
    const warnings = findAggregatedOverAllocations(
      inventoryRules,
      dealerRules,
      sellRoomTypes.map((item) => item.code),
    )
    setSaveWarning(
      warnings.length > 0 ? `有 ${warnings.length} 个销售房型分配超额，已允许保存（mock 阶段仅提示）` : '',
    )
    saveTemplateInventoryRules(template.id, inventoryRules)
    saveDealerInventoryRules(template.id, dealerRules)
    setEditMode(false)
  }

  if (!voyage.templateId) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-white py-16 text-center text-sm text-gray-400">
        当前航次未关联模板，无法查看经销商库存分配
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">经销商库存分配</h3>
          <p className="mt-1 text-xs text-gray-500">
            按销售房型将经销商库存池拆分到各经销商；数据来源于航次模板
            {template ? `「${template.name}」` : ''}，各航段汇总展示。
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditMode((v) => !v)
            setSaveWarning('')
          }}
          className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium ${
            editMode
              ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          <Pencil className="h-3.5 w-3.5" />
          {editMode ? '取消编辑' : '编辑'}
        </button>
      </div>

      <div className="space-y-4 p-5">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">加载中...</div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs text-gray-500">航次 {voyage.voyageNo} · 不区分航段，按销售房型汇总。</p>
              {editMode && (
                <div className="relative w-72 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDealerDropdownOpen((v) => !v)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-left text-sm"
                  >
                    <span className="block truncate">{selectedDealerNames || '请选择经销商'}</span>
                  </button>
                  {dealerDropdownOpen && (
                    <div className="absolute right-0 z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border bg-white p-2 shadow-lg">
                      {activeDealers.map((dealer) => (
                        <label
                          key={dealer.id}
                          className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedDealers.includes(dealer.id)}
                            onChange={() => toggleDealerSelection(dealer.id)}
                          />
                          <span className="truncate">{dealer.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <DealerInventoryAllocationTable
              sellRoomTypes={sellRoomTypes}
              segmentEntries={segmentEntries}
              inventoryRules={inventoryRules}
              dealerRules={dealerRules}
              selectedDealers={selectedDealers}
              activeDealers={activeDealers}
              editMode={editMode}
              showSegments={false}
              onUpdateDealerAllocation={updateDealerAllocation}
              onUpdateAggregatedDealerAllocation={updateAggregatedDealerAllocation}
            />

            {overAllocations.length > 0 && (
              <p className="text-xs text-amber-600">有 {overAllocations.length} 个销售房型分配超额。</p>
            )}
            {saveWarning && <p className="text-xs text-amber-600">{saveWarning}</p>}
          </>
        )}
      </div>

      {editMode && (
        <div className="flex justify-end gap-3 border-t px-5 py-4">
          <button
            type="button"
            onClick={() => {
              setEditMode(false)
              setSaveWarning('')
            }}
            className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            保存
          </button>
        </div>
      )}
    </div>
  )
}
