import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { templateApi } from '@/mock/api'
import { dealers } from '@/mock/data'
import {
  collectPoolDealerIds,
  findDealerOverAllocations,
  findPoolOverAllocations,
  getByDealerPools,
  getEnabledInventoryPools,
  getPoolAllocatedTotal,
  getPoolUnallocated,
  getProductSegments,
  loadTemplatePoolDealerRules,
  loadTemplatePoolQuotas,
  saveTemplatePoolDealerRules,
  saveTemplatePoolQuotas,
  segmentKey,
  setPoolDealerQuantity,
  type TemplatePoolDealerRules,
  type TemplatePoolQuotaCell,
  type TemplatePoolQuotaRules,
} from '@/mock/templatePoolQuotas'
import { getTemplateSellRoomTypes, type TemplateSellRoomType } from '@/mock/sellRoomTypeConfig'
import type { InventoryPool, ProductSegment, VoyageTemplate } from '@/types'

type ConfigStep = 1 | 2

const stepLabels: Record<ConfigStep, string> = {
  1: '库存池配额',
  2: '经销商额度',
}

function getCell(
  rules: TemplatePoolQuotaRules,
  sellRoomTypeCode: string,
  segKey: string,
  poolIds: string[],
): TemplatePoolQuotaCell {
  const existing = rules[sellRoomTypeCode]?.[segKey]
  if (existing) {
    const poolQty = { ...existing.poolQty }
    poolIds.forEach((id) => {
      if (poolQty[id] == null) poolQty[id] = 0
    })
    return { ...existing, poolQty }
  }
  const poolQty: Record<string, number> = {}
  poolIds.forEach((id) => {
    poolQty[id] = 0
  })
  return { physicalCapacity: 0, poolQty }
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
  const [quotaRules, setQuotaRules] = useState<TemplatePoolQuotaRules>({})
  const [dealerRules, setDealerRules] = useState<TemplatePoolDealerRules>({})
  const [selectedDealers, setSelectedDealers] = useState<string[]>([])
  const [sellRoomTypes, setSellRoomTypes] = useState<TemplateSellRoomType[]>([])
  const [currentStep, setCurrentStep] = useState<ConfigStep>(1)
  const [activeDealerPoolId, setActiveDealerPoolId] = useState<string>('')
  const [editMode, setEditMode] = useState(false)
  const [saveWarning, setSaveWarning] = useState('')
  const [loading, setLoading] = useState(false)

  const enabledPools = useMemo(() => getEnabledInventoryPools(), [])
  const byDealerPools = useMemo(() => getByDealerPools(), [])
  const poolIds = useMemo(() => enabledPools.map((item) => item.id), [enabledPools])

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

      const t = await templateApi.getById(id)
      if (cancelled || !t) {
        setLoading(false)
        return
      }

      const roomTypes = getTemplateSellRoomTypes(t)
      const quotas = loadTemplatePoolQuotas(t)
      const dealerAlloc = loadTemplatePoolDealerRules(t, quotas)
      const dealerPoolList = getByDealerPools()
      setTemplate(t)
      setSellRoomTypes(roomTypes)
      setQuotaRules(quotas)
      setDealerRules(dealerAlloc)
      setSelectedDealers(collectPoolDealerIds(dealerAlloc))
      setActiveDealerPoolId(dealerPoolList[0]?.id ?? '')
      setLoading(false)
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [active, templateId])

  const segmentsList = useMemo(() => (template ? getProductSegments(template) : []), [template])
  const activeDealers = useMemo(() => dealers.filter((dealer) => dealer.status === 'cooperating'), [])

  const segmentEntries = useMemo(
    () =>
      segmentsList.length > 0
        ? segmentsList.map((segment) => ({ key: segmentKey(segment), segment }))
        : [{ key: '全程', segment: null as ProductSegment | null }],
    [segmentsList],
  )

  const poolOvers = useMemo(() => findPoolOverAllocations(quotaRules), [quotaRules])
  const dealerOvers = useMemo(
    () => findDealerOverAllocations(quotaRules, dealerRules),
    [quotaRules, dealerRules],
  )

  const saveConfig = () => {
    if (!template) return
    const poolWarnings = findPoolOverAllocations(quotaRules)
    const dealerWarnings = findDealerOverAllocations(quotaRules, dealerRules)
    const parts: string[] = []
    if (poolWarnings.length > 0) parts.push(`${poolWarnings.length} 处池配额超过物理容量`)
    if (dealerWarnings.length > 0) parts.push(`${dealerWarnings.length} 处经销商额度超过池配额`)
    setSaveWarning(parts.length > 0 ? `${parts.join('；')}，已允许保存（mock 仅提示）` : '')
    saveTemplatePoolQuotas(template.id, quotaRules)
    saveTemplatePoolDealerRules(template.id, dealerRules)
    setEditMode(false)
    onSaved?.()
    onClose?.()
  }

  const updatePoolQty = (sellRoomTypeCode: string, segKey: string, poolId: string, value: number) => {
    setQuotaRules((prev) => {
      const cell = getCell(prev, sellRoomTypeCode, segKey, poolIds)
      return {
        ...prev,
        [sellRoomTypeCode]: {
          ...(prev[sellRoomTypeCode] || {}),
          [segKey]: {
            ...cell,
            poolQty: { ...cell.poolQty, [poolId]: value },
          },
        },
      }
    })
  }

  const syncDealerRows = (dealerIds: string[]) => {
    setDealerRules((prev) => {
      const next: TemplatePoolDealerRules = { ...prev }
      sellRoomTypes.forEach((sellRoom) => {
        const cabinMap = { ...(next[sellRoom.code] || {}) }
        segmentEntries.forEach(({ key }) => {
          const poolMap = { ...(cabinMap[key] || {}) }
          byDealerPools.forEach((pool) => {
            const current = poolMap[pool.id] || []
            poolMap[pool.id] = dealerIds.map((dealerId) => {
              const existing = current.find((item) => item.dealerId === dealerId)
              return existing || { dealerId, qty: 0 }
            })
          })
          cabinMap[key] = poolMap
        })
        next[sellRoom.code] = cabinMap
      })
      return next
    })
  }

  const updateDealerQty = (
    sellRoomTypeCode: string,
    segKey: string,
    poolId: string,
    dealerId: string,
    value: number,
  ) => {
    setDealerRules((prev) => {
      const cabinMap = { ...(prev[sellRoomTypeCode] || {}) }
      const poolMap = { ...(cabinMap[segKey] || {}) }
      const current = poolMap[poolId] || []
      return {
        ...prev,
        [sellRoomTypeCode]: {
          ...cabinMap,
          [segKey]: {
            ...poolMap,
            [poolId]: setPoolDealerQuantity(current, dealerId, value),
          },
        },
      }
    })
  }

  const goNextStep = () => {
    if (byDealerPools.length === 0) {
      saveConfig()
      return
    }
    if (selectedDealers.length === 0) {
      const defaultIds = activeDealers.slice(0, 3).map((dealer) => dealer.id)
      setSelectedDealers(defaultIds)
      syncDealerRows(defaultIds)
    }
    if (!activeDealerPoolId && byDealerPools[0]) {
      setActiveDealerPoolId(byDealerPools[0].id)
    }
    setCurrentStep(2)
  }

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

  const activeDealerPool = byDealerPools.find((item) => item.id === activeDealerPoolId) ?? byDealerPools[0]

  const dealerPoolHint = (pool: InventoryPool | undefined) => {
    if (!pool) return ''
    return pool.quotaMode === 'byDealer' ? '按经销商拆额度' : '共享余量'
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={`shrink-0 border-b border-gray-200 ${embedded ? 'px-6 py-3' : 'px-6 py-4'}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {([1, 2] as ConfigStep[]).map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (step === 2 && byDealerPools.length === 0) return
                    setCurrentStep(step)
                  }}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm ${
                    currentStep === step ? 'font-medium text-blue-700' : 'text-gray-500 hover:text-gray-700'
                  } ${step === 2 && byDealerPools.length === 0 ? 'cursor-not-allowed opacity-40' : ''}`}
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
            数据来源：航次模板「{template.name}」· 按启用中的库存池分配可售名额
          </p>
        )}
      </div>

      <div className={`min-h-0 flex-1 overflow-y-auto ${padding}`}>
        {!templateId ? (
          <div className="py-16 text-center text-sm text-gray-400">未关联航次模板，无法配置库存</div>
        ) : loading || !template || sellRoomTypes.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">加载中...</div>
        ) : enabledPools.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            暂无启用中的库存池，请先在「基础设置 → 库存池管理」启用至少一个池
          </div>
        ) : currentStep === 1 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border-b border-r px-3 py-2 text-left text-xs font-medium text-gray-500">航段</th>
                    <th className="border-b border-r px-3 py-2 text-left text-xs font-medium text-gray-500">销售房型</th>
                    <th className="border-b border-r px-3 py-2 text-right text-xs font-medium text-gray-500">物理容量</th>
                    {enabledPools.map((pool) => (
                      <th
                        key={pool.id}
                        className="border-b border-r px-3 py-2 text-right text-xs font-medium text-gray-500"
                        title={`${pool.code} · ${dealerPoolHint(pool)}`}
                      >
                        <div>{pool.name}</div>
                        <div className="mt-0.5 font-normal text-gray-400">
                          {pool.quotaMode === 'shared' ? '共享' : '锁配额'}
                        </div>
                      </th>
                    ))}
                    <th className="border-b border-r px-3 py-2 text-right text-xs font-medium text-gray-500">未分配</th>
                    <th className="border-b px-3 py-2 text-right text-xs font-medium text-gray-500">已分配合计</th>
                  </tr>
                </thead>
                <tbody>
                  {renderSegmentCabinRows((segKey, sellRoomTypeCode) => {
                    const cell = getCell(quotaRules, sellRoomTypeCode, segKey, poolIds)
                    const allocated = getPoolAllocatedTotal(cell)
                    const unallocated = getPoolUnallocated(cell)
                    const over = allocated > cell.physicalCapacity
                    return (
                      <>
                        <td className="border-r border-b px-3 py-2 text-right text-gray-600">{cell.physicalCapacity}</td>
                        {enabledPools.map((pool) => (
                          <td key={pool.id} className="border-r border-b px-3 py-2 text-right">
                            {editMode ? (
                              <input
                                type="number"
                                min={0}
                                value={cell.poolQty[pool.id] ?? 0}
                                onChange={(e) =>
                                  updatePoolQty(
                                    sellRoomTypeCode,
                                    segKey,
                                    pool.id,
                                    Math.max(0, Number(e.target.value) || 0),
                                  )
                                }
                                className="w-20 rounded border border-gray-300 px-2 py-1 text-right text-sm"
                              />
                            ) : (
                              cell.poolQty[pool.id] ?? 0
                            )}
                          </td>
                        ))}
                        <td
                          className={`border-r border-b px-3 py-2 text-right font-medium tabular-nums ${
                            unallocated === 0 ? 'text-slate-400' : 'text-amber-700'
                          }`}
                        >
                          {unallocated}
                        </td>
                        <td
                          className={`border-b px-3 py-2 text-right font-medium tabular-nums ${
                            over ? 'text-rose-600' : 'text-blue-600'
                          }`}
                        >
                          {allocated}
                        </td>
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500">
              按航段 × 销售房型为各库存池录入可下单数量；未分配 = 物理容量 − 各池之和（默认不可售）。
              共享池下单时共用余量；锁配额池需在下一步拆到经销商。
            </p>
            {poolOvers.length > 0 && (
              <p className="text-xs text-amber-600">有 {poolOvers.length} 处已分配合计超过物理容量。</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500">锁配额池：</span>
              {byDealerPools.map((pool) => (
                <button
                  key={pool.id}
                  type="button"
                  onClick={() => setActiveDealerPoolId(pool.id)}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    activeDealerPool?.id === pool.id
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pool.name}
                </button>
              ))}
              <div className="ml-auto flex flex-wrap gap-2">
                {activeDealers.slice(0, 6).map((dealer) => {
                  const checked = selectedDealers.includes(dealer.id)
                  return (
                    <label
                      key={dealer.id}
                      className={`flex cursor-pointer items-center gap-1.5 rounded border px-2 py-1 text-xs ${
                        checked ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!editMode}
                        onChange={() => {
                          const next = checked
                            ? selectedDealers.filter((id) => id !== dealer.id)
                            : [...selectedDealers, dealer.id]
                          setSelectedDealers(next)
                          syncDealerRows(next)
                        }}
                        className="accent-blue-600"
                      />
                      <span className="max-w-[7rem] truncate" title={dealer.name}>
                        {dealer.name}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {!activeDealerPool ? (
              <div className="rounded-lg border border-dashed py-12 text-center text-sm text-gray-400">
                当前无「按经销商拆额度」类型的库存池
              </div>
            ) : selectedDealers.length === 0 ? (
              <div className="rounded-lg border border-dashed py-12 text-center text-sm text-gray-400">
                请勾选需要拆分额度的经销商
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border-b border-r px-3 py-2 text-left text-xs font-medium text-gray-500">航段</th>
                      <th className="border-b border-r px-3 py-2 text-left text-xs font-medium text-gray-500">销售房型</th>
                      <th className="border-b border-r px-3 py-2 text-right text-xs font-medium text-gray-500">
                        池配额
                      </th>
                      {selectedDealers.map((dealerId) => {
                        const dealer = activeDealers.find((item) => item.id === dealerId)
                        return (
                          <th
                            key={dealerId}
                            className="border-b border-r px-3 py-2 text-right text-xs font-medium text-gray-500"
                          >
                            <span className="inline-block max-w-[6rem] truncate" title={dealer?.name}>
                              {dealer?.name || dealerId}
                            </span>
                          </th>
                        )
                      })}
                      <th className="border-b px-3 py-2 text-right text-xs font-medium text-gray-500">经销商合计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderSegmentCabinRows((segKey, sellRoomTypeCode) => {
                      const poolId = activeDealerPool.id
                      const poolQty = getCell(quotaRules, sellRoomTypeCode, segKey, poolIds).poolQty[poolId] ?? 0
                      const allocations = dealerRules[sellRoomTypeCode]?.[segKey]?.[poolId] || []
                      const dealerSum = selectedDealers.reduce((sum, dealerId) => {
                        const row = allocations.find((item) => item.dealerId === dealerId)
                        return sum + (row?.qty || 0)
                      }, 0)
                      const over = dealerSum > poolQty
                      return (
                        <>
                          <td className="border-r border-b px-3 py-2 text-right text-gray-600">{poolQty}</td>
                          {selectedDealers.map((dealerId) => {
                            const row = allocations.find((item) => item.dealerId === dealerId)
                            const qty = row?.qty ?? 0
                            return (
                              <td key={dealerId} className="border-r border-b px-3 py-2 text-right">
                                {editMode ? (
                                  <input
                                    type="number"
                                    min={0}
                                    value={qty}
                                    onChange={(e) =>
                                      updateDealerQty(
                                        sellRoomTypeCode,
                                        segKey,
                                        poolId,
                                        dealerId,
                                        Math.max(0, Number(e.target.value) || 0),
                                      )
                                    }
                                    className="w-20 rounded border border-gray-300 px-2 py-1 text-right text-sm"
                                  />
                                ) : (
                                  qty
                                )}
                              </td>
                            )
                          })}
                          <td
                            className={`border-b px-3 py-2 text-right font-medium tabular-nums ${
                              over ? 'text-rose-600' : 'text-blue-600'
                            }`}
                          >
                            {dealerSum}
                          </td>
                        </>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-gray-500">
              仅「按经销商拆额度」的库存池需要本步配置；经销商额度合计不应超过该池在 Step1 的配额。
            </p>
            {dealerOvers.length > 0 && (
              <p className="text-xs text-amber-600">有 {dealerOvers.length} 处经销商额度超过池配额。</p>
            )}
            {saveWarning && <p className="text-xs text-amber-600">{saveWarning}</p>}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-gray-200 px-6 py-4">
        <span className="text-xs text-gray-500">
          Step {currentStep}/{byDealerPools.length > 0 ? 2 : 1}
        </span>
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
              {byDealerPools.length > 0 ? '下一步' : editMode ? '保存' : '完成'}
            </button>
          ) : editMode ? (
            <button
              type="button"
              onClick={saveConfig}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              保存
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              完成
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
