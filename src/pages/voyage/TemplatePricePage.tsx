import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Save } from 'lucide-react'
import { templateApi } from '@/mock/api'
import { products, dictionaries } from '@/mock/data'
import CoefficientStepper from '@/components/common/CoefficientStepper'
import {
  evaluateTemplateFormula,
  getTemplateCabinTypes,
  getTemplateSegmentsCount,
  loadTemplatePriceRules,
  saveTemplatePriceRules,
  templateDeckOptions,
  templateVariableLabels,
  type TemplateCabinPricingRule,
  type TemplatePricingVariableKey,
} from '@/mock/templatePriceRules'
import {
  getOccupancyFormulaTemplate,
  occupancyFormulaTemplates,
} from '@/mock/occupancyFormulaTemplates'
import { getTicketClassById } from '@/mock/ticketClasses'
import {
  createEmptyFormulaRule,
  formatFormulaFromGuestCoefficients,
  normalizeFormulaRule,
  type FormulaPricingRule,
  type GuestPriceCoefficient,
} from '@/utils/cabinPriceCoefficient'
import type { VoyageTemplate } from '@/types'

function VariableToken({ code }: { code: TemplatePricingVariableKey }) {
  if (code === 'P' || code === 'Q' || code === 'K' || code === 'S') {
    return <span className="text-lg font-bold">{code}</span>
  }

  const suffix = code.slice(1)
  return (
    <>
      <span className="text-lg font-bold">S</span>
      <span className="ml-0.5 font-sans text-[10px] leading-none text-gray-500">{suffix}</span>
    </>
  )
}

const variableRows: Array<{
  key: TemplatePricingVariableKey
  category: 'P' | 'Q' | 'S'
  rowSpan: number
  prefix: 'P' | 'Q' | 'S'
  policyLabel: string
}> = [
  { key: 'P', category: 'P', rowSpan: 3, prefix: 'P', policyLabel: '口岸' },
  { key: 'P_AREA', category: 'P', rowSpan: 0, prefix: 'P', policyLabel: '区域' },
  { key: 'K', category: 'P', rowSpan: 0, prefix: 'P', policyLabel: '标准' },
  { key: 'Q', category: 'Q', rowSpan: 3, prefix: 'Q', policyLabel: '口岸' },
  { key: 'Q_AREA', category: 'Q', rowSpan: 0, prefix: 'Q', policyLabel: '区域' },
  { key: 'Q_K', category: 'Q', rowSpan: 0, prefix: 'Q', policyLabel: '标准' },
  { key: 'S', category: 'S', rowSpan: 1, prefix: 'S', policyLabel: '楼层费' },
]

function formatCoefficientTerm(coefficient: number, variable: string) {
  if (coefficient === 0) return ''
  if (coefficient === 1) return variable
  return `${parseFloat(coefficient.toFixed(4))}${variable}`
}

function buildVoyageFormula(rule: FormulaPricingRule) {
  const totals = rule.guestCoefficients.reduce(
    (sum, coefficient) => ({
      p: sum.p + coefficient.p,
      s: sum.s + coefficient.s,
      q: sum.q + coefficient.q,
    }),
    { p: 0, s: 0, q: 0 },
  )
  const parts = [
    formatCoefficientTerm(totals.p, 'P'),
    formatCoefficientTerm(totals.s, 'S'),
    formatCoefficientTerm(totals.q, 'Q'),
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' + ') : '0'
}

export default function TemplatePricePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [template, setTemplate] = useState<VoyageTemplate | null>(null)
  const [priceRules, setPriceRules] = useState<Record<string, TemplateCabinPricingRule>>({})
  const [activeCabin, setActiveCabin] = useState<string>('')
  const [cabinTypes, setCabinTypes] = useState<string[]>([])
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)

  const getCabinName = (code: string) => {
    const dict = dictionaries.find((d) => d.dictCode === 'CABIN_TYPE' && d.itemCode === code)
    return dict ? dict.itemName : code
  }

  useEffect(() => {
    async function loadData() {
      if (!id) return
      setLoading(true)
      const t = await templateApi.getById(id)
      if (t) {
        setTemplate(t)
        const cTypes = getTemplateCabinTypes(t)
        setCabinTypes(cTypes)
        setPriceRules(loadTemplatePriceRules(t))
        setActiveCabin(cTypes[0])
      }
      setLoading(false)
    }
    loadData()
  }, [id])

  const savePriceRule = () => {
    if (!template) return
    saveTemplatePriceRules(template.id, priceRules)
    setEditMode(false)
  }

  if (loading) return <div className="p-8 text-center text-gray-500">加载中...</div>
  if (!template || !activeCabin) return <div className="p-8 text-center text-gray-500">未找到模板数据</div>

  const priceRule = priceRules[activeCabin]
  if (!priceRule) return <div className="p-8 text-center text-gray-500">数据错误</div>

  const productObj = products.find((p) => p.id === template.productId)
  const segmentsList = productObj?.segments || []
  const segmentsCount = getTemplateSegmentsCount(template)

  const updatePriceVariableArray = (key: TemplatePricingVariableKey, index: number, value: number) => {
    setPriceRules((prev) => {
      const current = prev[activeCabin]
      if (!current) return prev
      const currentArr = current.variables[key] ? [...current.variables[key]] : Array(segmentsCount).fill(0)
      currentArr[index] = value
      return { ...prev, [activeCabin]: { ...current, variables: { ...current.variables, [key]: currentArr } } }
    })
  }

  const updateFormulaRule = (
    index: number,
    field: keyof Pick<FormulaPricingRule, 'enabled' | 'floor' | 'scenarioName' | 'ticketClassId' | 'templateId'>,
    value: string | boolean,
  ) => {
    setPriceRules((prev) => {
      const current = prev[activeCabin]
      if (!current) return prev
      const formulaRules = [...current.formulaRules]
      const row = formulaRules[index]

      if (field === 'ticketClassId' && typeof value === 'string') {
        const formulaTemplate = occupancyFormulaTemplates.find((item) => item.ticketClassId === value)
        formulaRules[index] = normalizeFormulaRule({
          ...row,
          ticketClassId: value,
          templateId: formulaTemplate?.id,
          scenario: formulaTemplate?.scenario || row.scenario,
          scenarioName: formulaTemplate?.name || row.scenarioName,
          guestCoefficients:
            formulaTemplate?.guestCoefficients.map((coefficient) => ({ ...coefficient }))
            || row.guestCoefficients,
        })
      } else if (field === 'templateId' && typeof value === 'string') {
        const formulaTemplate = getOccupancyFormulaTemplate(value)
        formulaRules[index] = normalizeFormulaRule({
          ...row,
          templateId: value,
          scenario: formulaTemplate?.scenario || row.scenario,
          scenarioName: formulaTemplate?.name || row.scenarioName,
          ticketClassId: formulaTemplate?.ticketClassId || row.ticketClassId,
          guestCoefficients:
            formulaTemplate?.guestCoefficients.map((coefficient) => ({ ...coefficient }))
            || row.guestCoefficients,
        })
      } else {
        formulaRules[index] = normalizeFormulaRule({ ...row, [field]: value })
      }

      return { ...prev, [activeCabin]: { ...current, formulaRules } }
    })
  }

  const updateGuestCoefficient = (
    index: number,
    guestIndex: number,
    field: keyof GuestPriceCoefficient,
    value: number,
  ) => {
    setPriceRules((prev) => {
      const current = prev[activeCabin]
      if (!current) return prev
      const formulaRules = [...current.formulaRules]
      const row = formulaRules[index]
      const guestCoefficients = row.guestCoefficients.map((coefficient, coefficientIndex) =>
        coefficientIndex === guestIndex ? { ...coefficient, [field]: value } : coefficient,
      )
      formulaRules[index] = normalizeFormulaRule({ ...row, guestCoefficients })
      return { ...prev, [activeCabin]: { ...current, formulaRules } }
    })
  }

  const addFormulaRule = (templateId?: string) => {
    setPriceRules((prev) => {
      const current = prev[activeCabin]
      if (!current) return prev
      const formulaTemplate = templateId ? getOccupancyFormulaTemplate(templateId) : undefined
      const nextRule = formulaTemplate
        ? normalizeFormulaRule({
            ...createEmptyFormulaRule(formulaTemplate.ticketClassId),
            floor: '全部',
            scenario: formulaTemplate.scenario,
            scenarioName: formulaTemplate.name,
            templateId: formulaTemplate.id,
            guestCoefficients: formulaTemplate.guestCoefficients.map((coefficient) => ({ ...coefficient })),
          })
        : createEmptyFormulaRule()
      return {
        ...prev,
        [activeCabin]: {
          ...current,
          formulaRules: [...current.formulaRules, nextRule],
        },
      }
    })
  }

  const removeFormulaRule = (ruleId: string) => {
    setPriceRules((prev) => {
      const current = prev[activeCabin]
      if (!current) return prev
      return {
        ...prev,
        [activeCabin]: {
          ...current,
          formulaRules: current.formulaRules.filter((rule) => rule.id !== ruleId),
        },
      }
    })
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-slate-50/60">
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 pt-4">
        <div className="mb-4">
          <button
            onClick={() => navigate('/voyage/price-templates')}
            className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            <ChevronLeft className="h-4 w-4" /> 返回航次价格配置
          </button>
        </div>
        <div className="mb-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">航次价格配置</h1>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">{template.name}</span>
              <span className="text-gray-300">|</span>
              <span className="text-xs text-gray-500">
                适用游轮: <span className="font-medium text-gray-700">{template.shipName || '-'}</span>
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-xs text-gray-500">
                关联产品: <span className="font-medium text-gray-700">{template.productName || '-'}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditMode((v) => !v)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none"
            >
              {editMode ? '取消编辑' : '进入编辑模式'}
            </button>
            {editMode && (
              <button
                onClick={savePriceRule}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800"
              >
                <Save className="h-4 w-4" /> 保存规则
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-6 overflow-x-auto">
          {cabinTypes.map((cabin) => (
            <button
              key={cabin}
              onClick={() => setActiveCabin(cabin)}
              className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                activeCabin === cabin
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {getCabinName(cabin)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <div className="flex flex-col rounded-xl border border-gray-200 bg-white px-5 py-5 shadow-sm">
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">航段清单</h4>
          <div className="flex flex-wrap items-center gap-2">
            {Array.from({ length: segmentsCount }).map((_, i) => {
              const seg = segmentsList[i]
              const segName = seg ? `${seg.startPort}-${seg.endPort}` : i === 0 ? '全程' : ''
              return (
                <span
                  key={i}
                  className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm"
                >
                  航段{i}{' '}
                  <span className="font-normal text-gray-500">{segName ? `(${segName})` : ''}</span>
                </span>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="flex flex-col">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">基础变量</h4>
            <div className="flex-1 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/80">
                    <th className="sticky left-0 z-20 w-16 border-r border-gray-100 bg-gray-50/80 px-4 py-3 text-center text-xs font-medium text-gray-500 shadow-[1px_0_0_0_#f3f4f6]">
                      大类
                    </th>
                    <th className="sticky left-16 z-20 w-28 border-r border-gray-100 bg-gray-50/80 px-4 py-3 text-left text-xs font-medium text-gray-500 shadow-[1px_0_0_0_#f3f4f6]">
                      变量
                    </th>
                    {Array.from({ length: segmentsCount }).map((_, i) => (
                      <th key={i} className="min-w-[70px] whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-gray-500">
                        航段{i}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {variableRows.map(({ key, category, rowSpan, prefix, policyLabel }) => (
                    <tr key={key} className="hover:bg-gray-50/50">
                      {rowSpan > 0 && (
                        <td
                          rowSpan={rowSpan}
                          className="sticky left-0 z-10 border-r border-gray-100 bg-white px-4 py-3 text-center align-middle shadow-[1px_0_0_0_#f3f4f6]"
                        >
                          <span className="text-2xl font-bold text-gray-900">{category}</span>
                        </td>
                      )}
                      <td className="sticky left-16 z-10 whitespace-nowrap border-r border-gray-100 bg-white px-4 py-3 shadow-[1px_0_0_0_#f3f4f6]">
                        <div className="flex flex-col">
                          <span className="font-mono text-gray-900">
                            {category === 'S' ? (
                              <VariableToken code={key} />
                            ) : (
                              <>
                                <span className="text-lg font-bold">{prefix}</span>
                                <span className="ml-0.5 font-sans text-xs">{policyLabel}</span>
                              </>
                            )}
                          </span>
                          <span className="mt-0.5 font-sans text-xs text-gray-400">{templateVariableLabels[key]}</span>
                        </div>
                      </td>
                      {Array.from({ length: segmentsCount }).map((_, i) => (
                        <td key={i} className="px-4 py-3 text-right">
                          {editMode ? (
                            <input
                              type="number"
                              step="any"
                              value={priceRule.variables[key]?.[i] ?? 0}
                              onChange={(e) => updatePriceVariableArray(key, i, Number(e.target.value))}
                              className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-right text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              {priceRule.variables[key]?.[i]?.toLocaleString() ?? 0}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">入住组合公式</h4>
              <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-600">
                与房型管理一致：按入住人分别配置 P、S、Q 系数
              </span>
            </div>
            {editMode && (
              <button
                type="button"
                onClick={() => addFormulaRule()}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                + 新增自定义规则
              </button>
            )}
          </div>
          <div className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full min-w-[1180px] text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">甲板层</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">公式模板</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">按人系数</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">航次计算公式</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-gray-500">计算结果（航段0）</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">启用</th>
                  {editMode && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {priceRule.formulaRules.map((row, index) => {
                  const formula = buildVoyageFormula(row)
                  const ticketClass = getTicketClassById(row.ticketClassId)
                  const guestLabels =
                    ticketClass?.types.map((type) => type.label)
                    || row.guestCoefficients.map((_, guestIndex) => `第${guestIndex + 1}人`)
                  return (
                    <tr key={row.id} className="hover:bg-gray-50/50">
                      <td className="whitespace-nowrap px-4 py-3 align-top">
                        {editMode ? (
                          <select
                            value={row.floor}
                            onChange={(event) => updateFormulaRule(index, 'floor', event.target.value)}
                            className="rounded border border-gray-300 px-2 py-1 text-xs"
                          >
                            {templateDeckOptions.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="rounded bg-gray-50 px-2 py-1 text-sm font-medium text-gray-600">
                            {row.floor}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-top">
                        {editMode ? (
                          <select
                            value={row.templateId || ''}
                            onChange={(event) => updateFormulaRule(index, 'templateId', event.target.value)}
                            className="max-w-[170px] rounded border border-gray-300 px-2 py-1 text-xs"
                          >
                            <option value="">自定义</option>
                            {occupancyFormulaTemplates.map((formulaTemplate) => (
                              <option key={formulaTemplate.id} value={formulaTemplate.id}>
                                {formulaTemplate.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-gray-600">
                            {getOccupancyFormulaTemplate(row.templateId || '')?.name || '自定义'}
                          </span>
                        )}
                      </td>
                      <td className="min-w-[380px] px-4 py-3 align-top">
                        <div className="mb-2">
                          {editMode ? (
                            <input
                              value={row.scenarioName}
                              onChange={(event) => updateFormulaRule(index, 'scenarioName', event.target.value)}
                              className="w-full max-w-[220px] rounded border border-gray-300 px-2 py-1 text-xs"
                            />
                          ) : (
                            <span className="font-medium text-gray-900">{row.scenarioName}</span>
                          )}
                          <div className="mt-1 text-[11px] text-gray-400">{ticketClass?.name || '-'}</div>
                        </div>
                        {editMode ? (
                          <div className="space-y-2">
                            {row.guestCoefficients.map((guestCoefficient, guestIndex) => (
                              <div key={`${row.id}-guest-${guestIndex}`} className="flex flex-wrap items-center gap-1.5">
                                <span className="w-12 shrink-0 text-[11px] text-gray-500">
                                  {guestLabels[guestIndex]}
                                </span>
                                <CoefficientStepper
                                  value={guestCoefficient.p}
                                  onChange={(value) => updateGuestCoefficient(index, guestIndex, 'p', value)}
                                />
                                <span className="font-mono text-xs text-gray-500">P</span>
                                <span className="text-xs text-gray-400">+</span>
                                <CoefficientStepper
                                  value={guestCoefficient.s}
                                  onChange={(value) => updateGuestCoefficient(index, guestIndex, 's', value)}
                                />
                                <span className="font-mono text-xs text-gray-500">S</span>
                                <span className="text-xs text-gray-400">+</span>
                                <CoefficientStepper
                                  value={guestCoefficient.q}
                                  onChange={(value) => updateGuestCoefficient(index, guestIndex, 'q', value)}
                                />
                                <span className="font-mono text-xs text-gray-500">Q</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs leading-5 text-gray-700">
                            {formatFormulaFromGuestCoefficients(row.guestCoefficients)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="rounded bg-gray-50 px-2 py-1 font-mono text-sm text-gray-700">
                          {formula}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right align-top font-semibold text-blue-600">
                        ¥
                        {evaluateTemplateFormula(
                          formula,
                          {
                            P: priceRule.variables.P?.[0] ?? 0,
                            P_AREA: priceRule.variables.P_AREA?.[0] ?? 0,
                            K: priceRule.variables.K?.[0] ?? 0,
                            Q: priceRule.variables.Q?.[0] ?? 0,
                            Q_AREA: priceRule.variables.Q_AREA?.[0] ?? 0,
                            Q_K: priceRule.variables.Q_K?.[0] ?? 0,
                            S: priceRule.variables.S?.[0] ?? priceRule.variables.S2F?.[0] ?? 180,
                          },
                        ).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center align-top">
                        {editMode ? (
                          <input
                            type="checkbox"
                            checked={row.enabled}
                            onChange={(event) => updateFormulaRule(index, 'enabled', event.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        ) : (
                          <span className={`inline-block h-2 w-2 rounded-full ${row.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        )}
                      </td>
                      {editMode && (
                        <td className="px-4 py-3 text-center align-top">
                          <button
                            type="button"
                            onClick={() => removeFormulaRule(row.id)}
                            className="text-xs text-red-500 hover:text-red-600"
                          >
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
            <div className="mt-3 flex flex-wrap gap-2">
              {occupancyFormulaTemplates.map((formulaTemplate) => (
                <button
                  key={formulaTemplate.id}
                  type="button"
                  onClick={() => addFormulaRule(formulaTemplate.id)}
                  className="rounded border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-100"
                >
                  + {formulaTemplate.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
