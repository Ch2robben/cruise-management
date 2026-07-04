import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Save } from 'lucide-react'
import { templateApi } from '@/mock/api'
import { products, dictionaries } from '@/mock/data'
import {
  evaluateTemplateFormula,
  getTemplateCabinTypes,
  getTemplateSegmentsCount,
  loadTemplatePriceRules,
  saveTemplatePriceRules,
  templateVariableLabels,
  type TemplateCabinPricingRule,
  type TemplateFloorPricingRule,
  type TemplateFormulaPricingRule,
  type TemplatePricingVariableKey,
} from '@/mock/templatePriceRules'
import type { VoyageTemplate } from '@/types'

function VariableToken({ code }: { code: TemplatePricingVariableKey }) {
  if (code === 'P' || code === 'Q' || code === 'K') {
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
      const arr = [...current.variables[key]]
      arr[index] = value
      return { ...prev, [activeCabin]: { ...current, variables: { ...current.variables, [key]: arr } } }
    })
  }

  const updateFloorRule = (index: number, field: keyof TemplateFloorPricingRule, value: string | number) => {
    setPriceRules((prev) => {
      const current = prev[activeCabin]
      if (!current) return prev
      const floorRules = [...current.floorRules]
      floorRules[index] = { ...floorRules[index], [field]: value }
      return { ...prev, [activeCabin]: { ...current, floorRules } }
    })
  }

  const updateFormulaRule = (
    index: number,
    field: keyof Pick<TemplateFormulaPricingRule, 'formula' | 'enabled' | 'floor' | 'scenarioName'>,
    value: string | boolean,
  ) => {
    setPriceRules((prev) => {
      const current = prev[activeCabin]
      if (!current) return prev
      const formulaRules = [...current.formulaRules]
      formulaRules[index] = { ...formulaRules[index], [field]: value }
      return { ...prev, [activeCabin]: { ...current, formulaRules } }
    })
  }

  const addFormulaRule = () => {
    setPriceRules((prev) => {
      const current = prev[activeCabin]
      if (!current) return prev
      return {
        ...prev,
        [activeCabin]: {
          ...current,
          formulaRules: [
            ...current.formulaRules,
            {
              id: 'custom-' + Date.now(),
              floor: '全部',
              scenario: 'custom' as const,
              scenarioName: '新规则',
              formula: 'P',
              enabled: true,
            },
          ],
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
          formulaRules: current.formulaRules.filter((r) => r.id !== ruleId),
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
                  {(Object.keys(priceRule.variables) as TemplatePricingVariableKey[]).map((key, idx) => (
                    <tr key={key} className="hover:bg-gray-50/50">
                      {idx === 0 && (
                        <td
                          rowSpan={3}
                          className="sticky left-0 z-10 border-r border-gray-100 bg-white px-4 py-3 text-center align-middle shadow-[1px_0_0_0_#f3f4f6]"
                        >
                          <span className="text-2xl font-bold text-gray-900">P</span>
                        </td>
                      )}
                      {idx === 3 && (
                        <td
                          rowSpan={3}
                          className="sticky left-0 z-10 border-r border-gray-100 bg-white px-4 py-3 text-center align-middle shadow-[1px_0_0_0_#f3f4f6]"
                        >
                          <span className="text-2xl font-bold text-gray-900">S</span>
                        </td>
                      )}
                      <td className="sticky left-16 z-10 whitespace-nowrap border-r border-gray-100 bg-white px-4 py-3 shadow-[1px_0_0_0_#f3f4f6]">
                        <div className="flex flex-col">
                          <span className="font-mono text-gray-900">
                            {key === 'P' && (
                              <>
                                <span className="text-lg font-bold">P</span>
                                <span className="ml-0.5 font-sans text-xs">口岸</span>
                              </>
                            )}
                            {key === 'Q' && (
                              <>
                                <span className="text-lg font-bold">P</span>
                                <span className="ml-0.5 font-sans text-xs">区域</span>
                              </>
                            )}
                            {key === 'K' && (
                              <>
                                <span className="text-lg font-bold">P</span>
                                <span className="ml-0.5 font-sans text-xs">标准</span>
                              </>
                            )}
                            {key !== 'P' && key !== 'Q' && key !== 'K' && <VariableToken code={key} />}
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
                              value={priceRule.variables[key][i] ?? 0}
                              onChange={(e) => updatePriceVariableArray(key, i, Number(e.target.value))}
                              className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-right text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              {priceRule.variables[key][i]?.toLocaleString() ?? 0}
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
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">入住组合公式</h4>
            {editMode && (
              <button
                onClick={addFormulaRule}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                + 新增规则
              </button>
            )}
          </div>
          <div className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">甲板层</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">入住组合</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">公式</th>
                  <th className="px-4 py-3 text-right text-xs font-medium whitespace-nowrap text-gray-500">计算结果(全程)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">状态</th>
                  {editMode && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {priceRule.formulaRules.map((row, index) => (
                  <tr key={row.id} className="hover:bg-gray-50/50">
                    <td className="whitespace-nowrap px-4 py-3">
                      {editMode ? (
                        <input
                          value={row.floor}
                          onChange={(e) => updateFormulaRule(index, 'floor', e.target.value)}
                          className="rounded border border-gray-300 px-2 py-1 text-xs"
                        />
                      ) : (
                        <span className="rounded bg-gray-50 px-2 py-1 text-sm font-medium text-gray-600">
                          {row.floor}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                      {editMode ? (
                        <input
                          value={row.scenarioName}
                          onChange={(e) => updateFormulaRule(index, 'scenarioName', e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                        />
                      ) : (
                        row.scenarioName
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editMode ? (
                        <input
                          value={row.formula}
                          onChange={(e) => updateFormulaRule(index, 'formula', e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1.5 font-mono text-xs"
                        />
                      ) : (
                        <span className="rounded bg-gray-50 px-2 py-1 font-mono text-sm text-gray-700">{row.formula}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-600">
                      ¥
                      {evaluateTemplateFormula(
                        row.formula,
                        {
                          P: priceRule.variables.P[0] ?? 0,
                          Q: priceRule.variables.Q[0] ?? 0,
                          K: priceRule.variables.K[0] ?? 0,
                          S1F: priceRule.variables.S1F[0] ?? 0,
                          S2F: priceRule.variables.S2F[0] ?? 0,
                          S3F: priceRule.variables.S3F[0] ?? 0,
                        },
                      ).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editMode ? (
                        <input
                          type="checkbox"
                          checked={row.enabled}
                          onChange={(e) => updateFormulaRule(index, 'enabled', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      ) : (
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {row.enabled ? '已启用' : '已停用'}
                        </span>
                      )}
                    </td>
                    {editMode && (
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeFormulaRule(row.id)}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          删除
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
