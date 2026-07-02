import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import FormDialog from '@/components/common/FormDialog'
import CoefficientStepper from '@/components/common/CoefficientStepper'
import type { SellRoomTypeConfig } from '@/mock/sellRoomTypeConfig'
import { formatMappingSummary } from '@/mock/sellRoomTypeConfig'
import {
  getTicketClassById,
} from '@/mock/ticketClasses'
import {
  getOccupancyFormulaTemplate,
  occupancyFormulaTemplates,
} from '@/mock/occupancyFormulaTemplates'
import {
  createDefaultPricingRule,
  createEmptyExcludePeriod,
  createEmptyFormulaRule,
  createSupplementPricingRule,
  deckOptions,
  formatEffectiveRange,
  formatExcludePeriod,
  formatFormulaFromGuestCoefficients,
  normalizeFormulaRule,
  sortPricingRules,
  type CabinPricingRule,
  type ExcludePeriod,
  type FloorPricingRule,
  type FormulaPricingRule,
  type GuestPriceCoefficient,
} from '@/utils/cabinPriceCoefficient'

interface SellRoomTypePricingDialogProps {
  open: boolean
  sellRoomType: SellRoomTypeConfig | null
  rules: CabinPricingRule[]
  onClose: () => void
  onSave: (rules: CabinPricingRule[]) => void
}

export default function SellRoomTypePricingDialog({
  open,
  sellRoomType,
  rules,
  onClose,
  onSave,
}: SellRoomTypePricingDialogProps) {
  const [cabinRules, setCabinRules] = useState<CabinPricingRule[]>([])
  const [activeRuleId, setActiveRuleId] = useState('')
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    if (!open || !sellRoomType) return
    const sorted = sortPricingRules(
      rules.length > 0 ? rules : [createDefaultPricingRule(sellRoomType)],
    ).map((rule) => ({
      ...rule,
      formulaRules: rule.formulaRules.map((item) => normalizeFormulaRule(item)),
    }))
    setCabinRules(sorted)
    setActiveRuleId(sorted[0]?.id || '')
    setEditMode(false)
  }, [open, sellRoomType, rules])

  const pricingRule = useMemo(
    () => cabinRules.find((rule) => rule.id === activeRuleId) || null,
    [activeRuleId, cabinRules],
  )

  const updateActiveRule = (updater: (rule: CabinPricingRule) => CabinPricingRule) => {
    setCabinRules((prev) => prev.map((rule) => (rule.id === activeRuleId ? updater(rule) : rule)))
  }

  const updatePricingRuleField = (field: 'name' | 'effectiveStart' | 'effectiveEnd', value: string) => {
    updateActiveRule((rule) => ({ ...rule, [field]: value }))
  }

  const addExcludePeriod = () => {
    updateActiveRule((rule) => ({
      ...rule,
      excludePeriods: [...rule.excludePeriods, createEmptyExcludePeriod()],
    }))
  }

  const updateExcludePeriod = (periodId: string, field: keyof Pick<ExcludePeriod, 'start' | 'end'>, value: string) => {
    updateActiveRule((rule) => ({
      ...rule,
      excludePeriods: rule.excludePeriods.map((period) =>
        period.id === periodId ? { ...period, [field]: value } : period,
      ),
    }))
  }

  const removeExcludePeriod = (periodId: string) => {
    updateActiveRule((rule) => ({
      ...rule,
      excludePeriods: rule.excludePeriods.filter((period) => period.id !== periodId),
    }))
  }

  const updateFloorRule = (index: number, field: keyof FloorPricingRule, value: string | number) => {
    updateActiveRule((rule) => {
      const floorRules = [...rule.floorRules]
      floorRules[index] = { ...floorRules[index], [field]: value }
      return { ...rule, floorRules }
    })
  }

  const updateFormulaRule = (
    index: number,
    field: keyof Pick<FormulaPricingRule, 'enabled' | 'floor' | 'scenarioName' | 'ticketClassId' | 'templateId'>,
    value: string | boolean,
  ) => {
    updateActiveRule((rule) => {
      const formulaRules = [...rule.formulaRules]
      const current = formulaRules[index]
      if (field === 'ticketClassId' && typeof value === 'string') {
        const template = occupancyFormulaTemplates.find((item) => item.ticketClassId === value)
        formulaRules[index] = normalizeFormulaRule({
          ...current,
          ticketClassId: value,
          templateId: template?.id,
          scenario: template?.scenario || current.scenario,
          scenarioName: template?.name || current.scenarioName,
          guestCoefficients: template?.guestCoefficients.map((item) => ({ ...item })) || current.guestCoefficients,
        })
      } else if (field === 'templateId' && typeof value === 'string') {
        const template = getOccupancyFormulaTemplate(value)
        formulaRules[index] = normalizeFormulaRule({
          ...current,
          templateId: value,
          scenario: template?.scenario || current.scenario,
          scenarioName: template?.name || current.scenarioName,
          ticketClassId: template?.ticketClassId || current.ticketClassId,
          guestCoefficients: template?.guestCoefficients.map((item) => ({ ...item })) || current.guestCoefficients,
        })
      } else {
        formulaRules[index] = normalizeFormulaRule({
          ...current,
          [field]: value,
        })
      }
      return { ...rule, formulaRules }
    })
  }

  const updateGuestCoefficient = (
    index: number,
    guestIndex: number,
    field: keyof GuestPriceCoefficient,
    value: number,
  ) => {
    updateActiveRule((rule) => {
      const formulaRules = [...rule.formulaRules]
      const current = formulaRules[index]
      const guestCoefficients = current.guestCoefficients.map((item, idx) => (
        idx === guestIndex ? { ...item, [field]: value } : item
      ))
      formulaRules[index] = normalizeFormulaRule({ ...current, guestCoefficients })
      return { ...rule, formulaRules }
    })
  }

  const addFormulaRule = (templateId?: string) => {
    updateActiveRule((rule) => {
      const template = templateId ? getOccupancyFormulaTemplate(templateId) : undefined
      const nextRule = template
        ? normalizeFormulaRule({
          ...createEmptyFormulaRule(template.ticketClassId),
          floor: '全部',
          scenario: template.scenario,
          scenarioName: template.name,
          templateId: template.id,
          guestCoefficients: template.guestCoefficients.map((item) => ({ ...item })),
        })
        : createEmptyFormulaRule()
      return {
        ...rule,
        formulaRules: [...rule.formulaRules, nextRule],
      }
    })
  }

  const removeFormulaRule = (id: string) => {
    updateActiveRule((rule) => ({
      ...rule,
      formulaRules: rule.formulaRules.filter((item) => item.id !== id),
    }))
  }

  const addPricingRule = () => {
    if (!sellRoomType) return
    const nextRule = createSupplementPricingRule(sellRoomType, cabinRules)
    setCabinRules((prev) => sortPricingRules([...prev, nextRule]))
    setActiveRuleId(nextRule.id)
    setEditMode(true)
  }

  const removeActivePricingRule = () => {
    if (cabinRules.length <= 1) return
    const nextRules = cabinRules.filter((rule) => rule.id !== activeRuleId)
    setCabinRules(nextRules)
    setActiveRuleId(nextRules[0].id)
  }

  const handleSave = () => {
    onSave(
      sortPricingRules(
        cabinRules.map((rule) => ({
          ...rule,
          formulaRules: rule.formulaRules.map((item) => normalizeFormulaRule(item)),
        })),
      ),
    )
    setEditMode(false)
    onClose()
  }

  if (!open || !sellRoomType || !pricingRule) return null

  return (
    <FormDialog
      open={open}
      title={`价格系数 - ${sellRoomType.sellRoomTypeName}`}
      width="max-w-6xl"
      onCancel={onClose}
      onSubmit={editMode ? handleSave : undefined}
      submitText="保存全部规则"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-[1fr_auto] items-start gap-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="block text-xs text-gray-500">船舶</span>
                <span className="mt-1 block font-medium text-gray-900">{sellRoomType.shipName}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500">房型</span>
                <span className="mt-1 block font-medium text-gray-900">{sellRoomType.sellRoomTypeName}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500">编码</span>
                <span className="mt-1 block font-medium text-gray-900">{sellRoomType.sellRoomTypeCode || '-'}</span>
              </div>
            </div>
            <div className="mt-3 border-t border-gray-200 pt-3 text-sm text-gray-600">
              关联物理船舱：{formatMappingSummary(sellRoomType.mappings)}
            </div>
          </div>
          <button
            onClick={() => setEditMode((v) => !v)}
            className={`h-10 rounded-lg border px-4 text-sm font-medium transition-colors ${
              editMode
                ? 'border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {editMode ? '退出编辑' : '编辑'}
          </button>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">生效规则</h4>
            {editMode && (
              <button
                onClick={addPricingRule}
                className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100"
              >
                <Plus className="h-4 w-4" /> 新增规则
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {sortPricingRules(cabinRules).map((rule) => (
              <button
                key={rule.id}
                onClick={() => setActiveRuleId(rule.id)}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  activeRuleId === rule.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{rule.name}</div>
                <div className="mt-0.5 text-xs text-gray-500">{formatEffectiveRange(rule)}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">当前规则配置</h4>
              <p className="mt-1 text-xs text-gray-500">同一房型下不同生效期可维护独立系数与公式模板</p>
            </div>
            {editMode && cabinRules.length > 1 && (
              <button
                onClick={removeActivePricingRule}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> 删除当前规则
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-xs text-gray-500">规则名称</label>
              {editMode ? (
                <input
                  value={pricingRule.name}
                  onChange={(e) => updatePricingRuleField('name', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              ) : (
                <p className="mt-1 text-sm font-medium text-gray-900">{pricingRule.name}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">生效开始日期</label>
              {editMode ? (
                <input
                  type="date"
                  value={pricingRule.effectiveStart}
                  onChange={(e) => updatePricingRuleField('effectiveStart', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              ) : (
                <p className="mt-1 text-sm font-medium text-gray-900">{pricingRule.effectiveStart}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">生效结束日期</label>
              {editMode ? (
                <input
                  type="date"
                  value={pricingRule.effectiveEnd}
                  onChange={(e) => updatePricingRuleField('effectiveEnd', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              ) : (
                <p className="mt-1 text-sm font-medium text-gray-900">{pricingRule.effectiveEnd}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs text-gray-500">排除时间段</label>
              {editMode && (
                <button onClick={addExcludePeriod} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                  + 添加时间段
                </button>
              )}
            </div>
            {pricingRule.excludePeriods.length === 0 ? (
              <p className="text-sm text-gray-500">无排除时间段</p>
            ) : (
              <div className="space-y-2">
                {pricingRule.excludePeriods.map((period) => (
                  <div
                    key={period.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    {editMode ? (
                      <>
                        <input
                          type="date"
                          value={period.start}
                          onChange={(e) => updateExcludePeriod(period.id, 'start', e.target.value)}
                          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                        />
                        <span className="text-xs text-gray-400">至</span>
                        <input
                          type="date"
                          value={period.end}
                          onChange={(e) => updateExcludePeriod(period.id, 'end', e.target.value)}
                          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                        />
                        <button
                          onClick={() => removeExcludePeriod(period.id)}
                          className="ml-auto text-xs text-red-500 hover:text-red-600"
                        >
                          删除
                        </button>
                      </>
                    ) : (
                      <span className="text-sm text-gray-700">{formatExcludePeriod(period)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">楼层费规则</h4>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs text-gray-500">甲板层</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">公式基底</th>
                  <th className="px-3 py-2 text-right text-xs text-gray-500">层级</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pricingRule.floorRules.map((row, index) => (
                  <tr key={row.floor}>
                    <td className="px-3 py-2 text-sm font-medium text-gray-900">{row.label}</td>
                    <td className="px-3 py-2">
                      {editMode ? (
                        <input
                          value={row.formulaPrefix}
                          onChange={(e) => updateFloorRule(index, 'formulaPrefix', e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1.5 font-mono text-xs"
                        />
                      ) : (
                        <span className="font-mono text-xs text-gray-700">{row.formulaPrefix}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {editMode ? (
                        <input
                          type="number"
                          value={row.floorLevel}
                          onChange={(e) => updateFloorRule(index, 'floorLevel', Number(e.target.value))}
                          className="w-16 rounded border border-gray-300 px-2 py-1.5 text-right text-xs"
                        />
                      ) : (
                        <span className="text-xs text-gray-700">{row.floorLevel}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">入住组合公式</h4>
            <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-600">
              系数配置到人：第一人=XP+XS+X；P/S/X 变量取值在航次价格配置中维护
            </span>
          </div>
          <div className="max-h-[420px] overflow-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs text-gray-500">甲板层</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">公式模板</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">入住组合</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">按人系数</th>
                  <th className="px-3 py-2 text-center text-xs text-gray-500">启用</th>
                  {editMode && <th className="px-3 py-2 text-center text-xs text-gray-500">操作</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pricingRule.formulaRules.map((row, index) => {
                  const ticketClass = getTicketClassById(row.ticketClassId)
                  const guestLabels = ticketClass?.types.map((type) => type.label)
                    || row.guestCoefficients.map((_, guestIndex) => `第${guestIndex + 1}人`)

                  return (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap px-3 py-2 align-top">
                      {editMode ? (
                        <select
                          value={row.floor}
                          onChange={(e) => updateFormulaRule(index, 'floor', e.target.value)}
                          className="rounded border border-gray-300 px-2 py-1 text-xs"
                        >
                          {deckOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-gray-500">{row.floor}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-top">
                      {editMode ? (
                        <select
                          value={row.templateId || ''}
                          onChange={(e) => updateFormulaRule(index, 'templateId', e.target.value)}
                          className="max-w-[160px] rounded border border-gray-300 px-2 py-1 text-xs"
                        >
                          <option value="">自定义</option>
                          {occupancyFormulaTemplates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-gray-600">
                          {getOccupancyFormulaTemplate(row.templateId || '')?.name || '自定义'}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-gray-700">
                      {editMode ? (
                        <input
                          value={row.scenarioName}
                          onChange={(e) => updateFormulaRule(index, 'scenarioName', e.target.value)}
                          className="w-full min-w-[120px] rounded border border-gray-300 px-2 py-1 text-xs"
                        />
                      ) : (
                        row.scenarioName
                      )}
                      <div className="mt-1 text-[11px] text-gray-400">{ticketClass?.name || '-'}</div>
                    </td>
                    <td className="px-3 py-2 align-top">
                      {editMode ? (
                        <div className="space-y-2">
                          {row.guestCoefficients.map((guestCoeff, guestIndex) => (
                            <div key={`${row.id}-guest-${guestIndex}`} className="flex flex-wrap items-center gap-1.5">
                              <span className="w-12 shrink-0 text-[11px] text-gray-500">{guestLabels[guestIndex]}</span>
                              <CoefficientStepper
                                value={guestCoeff.p}
                                onChange={(value) => updateGuestCoefficient(index, guestIndex, 'p', value)}
                              />
                              <span className="text-xs font-mono text-gray-500">P</span>
                              <span className="text-xs text-gray-400">+</span>
                              <CoefficientStepper
                                value={guestCoeff.s}
                                onChange={(value) => updateGuestCoefficient(index, guestIndex, 's', value)}
                              />
                              <span className="text-xs font-mono text-gray-500">S</span>
                              <span className="text-xs text-gray-400">+</span>
                              <CoefficientStepper
                                value={guestCoeff.x}
                                onChange={(value) => updateGuestCoefficient(index, guestIndex, 'x', value)}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs leading-5 text-gray-700">
                          {formatFormulaFromGuestCoefficients(row.guestCoefficients)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center align-top">
                      {editMode ? (
                        <input
                          type="checkbox"
                          checked={row.enabled}
                          onChange={(e) => updateFormulaRule(index, 'enabled', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      ) : (
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${row.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
                        />
                      )}
                    </td>
                    {editMode && (
                      <td className="px-3 py-2 text-center align-top">
                        <button onClick={() => removeFormulaRule(row.id)} className="text-xs text-red-500 hover:text-red-600">
                          删除
                        </button>
                      </td>
                    )}
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {editMode && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={() => addFormulaRule()} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                + 新增自定义规则
              </button>
              {occupancyFormulaTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => addFormulaRule(template.id)}
                  className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs text-blue-700 hover:bg-blue-100"
                >
                  + {template.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </FormDialog>
  )
}
