import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { templateApi } from '@/mock/api'
import { dealers, products } from '@/mock/data'
import DealerInventoryAllocationTable from '@/components/voyage/DealerInventoryAllocationTable'
import {
  collectSelectedDealerIds,
  findOverAllocations,
  getTemplateSellRoomTypes,
  loadDealerInventoryRules,
  loadTemplateInventoryRules,
  saveDealerInventoryRules,
  saveTemplateInventoryRules,
  segmentKey,
  setDealerQuantity,
  type TemplateDealerInventoryRules,
  type TemplateInventoryCell,
  type TemplateInventoryRules,
} from '@/mock/templateInventoryRules'
import type { TemplateSellRoomType } from '@/mock/sellRoomTypeConfig'
import type { ProductSegment, VoyageTemplate } from '@/types'

type ConfigStep = 1 | 2
type ChannelField = 'onlineChannel' | 'publicStock' | 'dealerStockPool'

const stepLabels: Record<ConfigStep, string> = {
  1: '渠道库存配置',
  2: '经销商库存分配',
}

function getCell(
  rules: TemplateInventoryRules,
  sellRoomTypeCode: string,
  segKey: string,
): TemplateInventoryCell {
  return (
    rules[sellRoomTypeCode]?.[segKey] || {
      physicalCapacity: 0,
      onlineChannel: 0,
      publicStock: 0,
      dealerStockPool: 0,
    }
  )
}

export interface TemplateInventoryConfigPanelProps {
  templateId: string | null
  active?: boolean
  embedded?: boolean
  batchHint?: string
  onSaved?: () => void
  onClose?: () => void
}

export default function TemplateInventoryConfigPanel({
  templateId,
  active = true,
  embedded = false,
  batchHint,
  onSaved,
  onClose,
}: TemplateInventoryConfigPanelProps) {
  const [template, setTemplate] = useState<VoyageTemplate | null>(null)
  const [inventoryRules, setInventoryRules] = useState<TemplateInventoryRules>({})
  const [dealerRules, setDealerRules] = useState<TemplateDealerInventoryRules>({})
  const [selectedDealers, setSelectedDealers] = useState<string[]>([])
  const [sellRoomTypes, setSellRoomTypes] = useState<TemplateSellRoomType[]>([])
  const [currentStep, setCurrentStep] = useState<ConfigStep>(1)
  const [editMode, setEditMode] = useState(false)
  const [dealerDropdownOpen, setDealerDropdownOpen] = useState(false)
  const [saveWarning, setSaveWarning] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!active || !templateId) {
      setTemplate(null)
      setSellRoomTypes([])
      return
    }
    const id = templateId
    let cancelled = false

    async function loadData() {
      setLoading(true)
      setCurrentStep(1)
      setEditMode(false)
      setSaveWarning('')
      setDealerDropdownOpen(false)

      const t = await templateApi.getById(id)
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
  }, [active, templateId])

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
    () => findOverAllocations(inventoryRules, dealerRules),
    [inventoryRules, dealerRules],
  )

  const saveConfig = () => {
    if (!template) return
    const warnings = findOverAllocations(inventoryRules, dealerRules)
    setSaveWarning(
      warnings.length > 0 ? `有 ${warnings.length} 个航段销售房型分配超额，已允许保存（mock 阶段仅提示）` : '',
    )
    saveTemplateInventoryRules(template.id, inventoryRules)
    saveDealerInventoryRules(template.id, dealerRules)
    setEditMode(false)
    onSaved?.()
    onClose?.()
  }

  const updateCell = (sellRoomTypeCode: string, segKey: string, field: ChannelField, value: number) => {
    setInventoryRules((prev) => {
      const cabinRule = prev[sellRoomTypeCode] || {}
      return {
        ...prev,
        [sellRoomTypeCode]: {
          ...cabinRule,
          [segKey]: { ...getCell(prev, sellRoomTypeCode, segKey), [field]: value },
        },
      }
    })
  }

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

  const goNextStep = () => {
    if (selectedDealers.length === 0) {
      const defaultIds = activeDealers.slice(0, 3).map((dealer) => dealer.id)
      setSelectedDealers(defaultIds)
      syncDealerRows(defaultIds)
    }
    setCurrentStep(2)
  }

  const selectedDealerNames = selectedDealers
    .map((dealerId) => activeDealers.find((dealer) => dealer.id === dealerId)?.name)
    .filter(Boolean)
    .join('、')

  const padding = embedded ? 'px-6 py-4' : 'px-6 py-5'

  const renderSegmentCabinRows = (
    renderCells: (segKey: string, sellRoomTypeCode: string, segment: ProductSegment | null) => ReactNode,
  ) =>
    segmentEntries.map(({ key, segment }) =>
      sellRoomTypes.map((sellRoom, roomIndex) => (
        <tr key={`${key}-${sellRoom.code}`}>
          {roomIndex === 0 && (
            <td rowSpan={sellRoomTypes.length} className="border-r border-b bg-gray-50/40 px-3 py-2 align-top">
              <div className="font-medium text-gray-900">{key}</div>
              {segment && (
                <div className="mt-0.5 text-xs text-gray-400">
                  {segment.days}天 · {segment.mileage}km
                </div>
              )}
            </td>
          )}
          <td className="border-r border-b px-3 py-2 font-medium text-gray-800">{sellRoom.name}</td>
          {renderCells(key, sellRoom.code, segment)}
        </tr>
      )),
    )

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${embedded ? '' : ''}`}>
      <div className={`shrink-0 border-b border-gray-200 ${embedded ? 'px-6 py-3' : 'px-6 py-4'}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {([1, 2] as ConfigStep[]).map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(step)}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm ${
                    currentStep === step ? 'font-medium text-blue-700' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                      currentStep === step ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {step}
                  </span>
                  {stepLabels[step]}
                </button>
                {index === 0 && <ChevronRight className="h-4 w-4 text-gray-300" />}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setEditMode((v) => !v)
              setSaveWarning('')
            }}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            {editMode ? '取消编辑' : '编辑'}
          </button>
        </div>
        {batchHint && <p className="mt-2 text-xs text-amber-700">{batchHint}</p>}
        {template && embedded && (
          <p className="mt-2 text-xs text-gray-500">
            数据来源：航次模板「{template.name}」· 销售房型按房型管理配置
          </p>
        )}
      </div>

      <div className={`min-h-0 flex-1 overflow-y-auto ${padding}`}>
        {!templateId ? (
          <div className="py-16 text-center text-sm text-gray-400">未关联航次模板，无法配置库存</div>
        ) : loading || !template || sellRoomTypes.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">加载中...</div>
        ) : currentStep === 1 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border-b border-r px-3 py-2 text-left text-xs font-medium text-gray-500">航段</th>
                    <th className="border-b border-r px-3 py-2 text-left text-xs font-medium text-gray-500">销售房型</th>
                    <th className="border-b border-r px-3 py-2 text-right text-xs font-medium text-gray-500">物理容量</th>
                    <th className="border-b border-r px-3 py-2 text-right text-xs font-medium text-gray-500">线上渠道</th>
                    <th className="border-b border-r px-3 py-2 text-right text-xs font-medium text-gray-500">公共库存</th>
                    <th className="border-b border-r px-3 py-2 text-right text-xs font-medium text-gray-500">经销商库存</th>
                    <th className="border-b px-3 py-2 text-right text-xs font-medium text-gray-500">可售合计</th>
                  </tr>
                </thead>
                <tbody>
                  {renderSegmentCabinRows((segKey, sellRoomTypeCode) => {
                    const cell = getCell(inventoryRules, sellRoomTypeCode, segKey)
                    const total = cell.onlineChannel + cell.publicStock + cell.dealerStockPool
                    return (
                      <>
                        <td className="border-r border-b px-3 py-2 text-right text-gray-600">{cell.physicalCapacity}</td>
                        {(['onlineChannel', 'publicStock', 'dealerStockPool'] as ChannelField[]).map((field) => (
                          <td key={field} className="border-r border-b px-3 py-2 text-right">
                            {editMode ? (
                              <input
                                type="number"
                                min={0}
                                value={cell[field]}
                                onChange={(e) =>
                                  updateCell(
                                    sellRoomTypeCode,
                                    segKey,
                                    field,
                                    Math.max(0, Number(e.target.value) || 0),
                                  )
                                }
                                className="w-20 rounded border border-gray-300 px-2 py-1 text-right text-sm"
                              />
                            ) : (
                              cell[field]
                            )}
                          </td>
                        ))}
                        <td className="border-b px-3 py-2 text-right font-medium text-blue-600">{total}</td>
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500">
              按航段 × 销售房型维护渠道库存；经销商库存为 Step2 各经销商分配的上限。
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs text-gray-500">按航段 × 销售房型将经销商库存池拆分到各经销商。</p>
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

            {selectedDealers.length === 0 ? (
              <div className="rounded-lg border border-dashed py-12 text-center text-sm text-gray-400">
                {editMode ? '请先选择经销商' : '暂无经销商分配'}
              </div>
            ) : (
              <DealerInventoryAllocationTable
                sellRoomTypes={sellRoomTypes}
                segmentEntries={segmentEntries}
                inventoryRules={inventoryRules}
                dealerRules={dealerRules}
                selectedDealers={selectedDealers}
                activeDealers={activeDealers}
                editMode={editMode}
                showSegments
                onUpdateDealerAllocation={updateDealerAllocation}
              />
            )}
            {overAllocations.length > 0 && (
              <p className="text-xs text-amber-600">有 {overAllocations.length} 个航段销售房型分配超额。</p>
            )}
            {saveWarning && <p className="text-xs text-amber-600">{saveWarning}</p>}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-gray-200 px-6 py-4">
        <span className="text-xs text-gray-500">Step {currentStep}/2</span>
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              关闭
            </button>
          )}
          {currentStep === 2 && (
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              上一步
            </button>
          )}
          {currentStep === 1 ? (
            <button
              type="button"
              onClick={goNextStep}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              下一步
            </button>
          ) : editMode ? (
            <button
              type="button"
              onClick={saveConfig}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              保存
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
