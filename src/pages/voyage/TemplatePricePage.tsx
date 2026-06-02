import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Save } from 'lucide-react'
import { templateApi } from '@/mock/api'
import { products } from '@/mock/data'
import type { VoyageTemplate } from '@/types'

type CabinPricingRule = {
  effectiveStart: string
  effectiveEnd: string
  excludeDates: string[]
  variables: Record<PricingVariableKey, number[]>
  floorRules: FloorPricingRule[]
  formulaRules: FormulaPricingRule[]
}

type PricingVariableKey = 'P' | 'Q' | 'K' | 'T' | 'S'

type FloorPricingRule = {
  floor: number
  label: string
  formulaPrefix: string
  floorLevel: number
}

type FormulaRuleKey =
  | 'standard'
  | 'singleRoom'
  | 'oneAdultOneChild'
  | 'twoAdultsOneBaby'
  | 'thirdChildNoBed'
  | 'thirdChildExtraBed'
  | 'thirdAdultExtraBed'
  | 'custom'

type FormulaPricingRule = {
  id: string
  floor: string
  scenario: FormulaRuleKey
  scenarioName: string
  formula: string
  enabled: boolean
}

const variableLabels: Record<PricingVariableKey, string> = { P: '公式基数', Q: '变量Q', K: '变量K', T: '变量T', S: '楼层费' }
const deckOptions = ['全部', '1F', '2F', '3F']

const defaultFormulaRules: FormulaPricingRule[] = [
  { id: 'f-2-standard',   floor: '1F',   scenario: 'standard',           scenarioName: '标准（2成人）',       formula: '2P',              enabled: true },
  { id: 'f-3-standard',   floor: '2F',   scenario: 'standard',           scenarioName: '标准（2成人）',       formula: '2(P + S)',        enabled: true },
  { id: 'f-4-standard',   floor: '3F',   scenario: 'standard',           scenarioName: '标准（2成人）',       formula: '2(P + S * 2)',    enabled: true },
  { id: 'f-2-single',     floor: '1F',   scenario: 'singleRoom',         scenarioName: '单间',               formula: '1.75P',           enabled: true },
  { id: 'f-3-single',     floor: '2F',   scenario: 'singleRoom',         scenarioName: '单间',               formula: '1.75(P + S)',     enabled: true },
  { id: 'f-4-single',     floor: '3F',   scenario: 'singleRoom',         scenarioName: '单间',               formula: '1.75(P + S * 2)', enabled: true },
  { id: 'f-child-bed',    floor: '全部', scenario: 'oneAdultOneChild',   scenarioName: '一大一小（儿童占床）', formula: '1.7P + S',        enabled: true },
  { id: 'f-baby',         floor: '全部', scenario: 'twoAdultsOneBaby',  scenarioName: '两大一婴儿',         formula: '2.1P + S',        enabled: true },
  { id: 'f-third-nobed',  floor: '全部', scenario: 'thirdChildNoBed',    scenarioName: '第三人儿童不占床',   formula: '1.5P',            enabled: true },
  { id: 'f-third-bed',    floor: '全部', scenario: 'thirdChildExtraBed', scenarioName: '第三人儿童加床',     formula: '1.6P',            enabled: true },
  { id: 'f-third-adult',  floor: '全部', scenario: 'thirdAdultExtraBed', scenarioName: '三大成人加床',       formula: '2P',              enabled: true },
]

function formatDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function evaluateFormula(formula: string, p: number, s: number): number {
  if (!formula) return 0
  try {
    let expr = formula.replace(/([\d.]+)([\w(])/g, '$1*$2')
    expr = expr.replace(/P/g, String(p)).replace(/S/g, String(s))
    // eslint-disable-next-line no-new-func
    const result = new Function('return ' + expr)()
    return Number.isFinite(result) ? Math.round(result) : 0
  } catch { return 0 }
}

function createDefaultPricingRule(segmentsCount: number = 1): CabinPricingRule {
  const now = new Date()
  return {
    effectiveStart: formatDateInput(now),
    effectiveEnd: formatDateInput(new Date(now.getFullYear(), 11, 31)),
    excludeDates: [],
    variables: { 
      P: Array(segmentsCount).fill(1200),
      Q: Array(segmentsCount).fill(1.0),
      K: Array(segmentsCount).fill(1.0),
      T: Array(segmentsCount).fill(1.0),
      S: Array(segmentsCount).fill(180),
    },
    floorRules: [
      { floor: 1, label: '1F', formulaPrefix: 'P',         floorLevel: 0 },
      { floor: 2, label: '2F', formulaPrefix: 'P + S',     floorLevel: 1 },
      { floor: 3, label: '3F', formulaPrefix: 'P + S * 2', floorLevel: 2 },
    ],
    formulaRules: defaultFormulaRules.map(r => ({ ...r })),
  }
}

// 模拟全局存储
const mockRulesStore: Record<string, CabinPricingRule> = {}

export default function TemplatePricePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [template, setTemplate] = useState<VoyageTemplate | null>(null)
  const [priceRule, setPriceRule] = useState<CabinPricingRule | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!id) return
      setLoading(true)
      const t = await templateApi.getById(id)
      if (t) {
        setTemplate(t)
        const product = products.find(p => p.id === t.productId)
        const segmentsCount = product?.segments?.length || 1
        setPriceRule(mockRulesStore[t.id] || createDefaultPricingRule(segmentsCount))
      }
      setLoading(false)
    }
    loadData()
  }, [id])

  const savePriceRule = () => {
    if (!template || !priceRule) return
    mockRulesStore[template.id] = priceRule
    setEditMode(false)
  }

  if (loading) return <div className="p-8 text-center text-gray-500">加载中...</div>
  if (!template || !priceRule) return <div className="p-8 text-center text-gray-500">未找到模板数据</div>

  const productObj = products.find(p => p.id === template.productId)
  const segmentsList = productObj?.segments || []
  const segmentsCount = Math.max(1, priceRule.variables.P?.length || 1)

  const updatePriceRuleDate = (field: 'effectiveStart' | 'effectiveEnd', value: string) => {
    setPriceRule(prev => prev ? { ...prev, [field]: value } : prev)
  }
  const toggleExcludeDate = (date: string) => {
    setPriceRule(prev => {
      if (!prev) return prev
      const dates = prev.excludeDates || []
      return { ...prev, excludeDates: dates.includes(date) ? dates.filter(d => d !== date) : [...dates, date].sort() }
    })
  }
  const updatePriceVariableArray = (key: PricingVariableKey, index: number, value: number) => {
    setPriceRule(prev => {
      if (!prev) return prev
      const arr = [...prev.variables[key]]
      arr[index] = value
      return { ...prev, variables: { ...prev.variables, [key]: arr } }
    })
  }
  const updateFloorRule = (index: number, field: keyof FloorPricingRule, value: string | number) => {
    setPriceRule(prev => {
      if (!prev) return prev
      const floorRules = [...prev.floorRules]
      floorRules[index] = { ...floorRules[index], [field]: value }
      return { ...prev, floorRules }
    })
  }
  const updateFormulaRule = (index: number, field: keyof Pick<FormulaPricingRule, 'formula' | 'enabled' | 'floor' | 'scenarioName'>, value: string | boolean) => {
    setPriceRule(prev => {
      if (!prev) return prev
      const formulaRules = [...prev.formulaRules]
      formulaRules[index] = { ...formulaRules[index], [field]: value }
      return { ...prev, formulaRules }
    })
  }
  const addFormulaRule = () => {
    setPriceRule(prev => {
      if (!prev) return prev
      return {
        ...prev,
        formulaRules: [...prev.formulaRules, { id: 'custom-' + Date.now(), floor: '全部', scenario: 'custom' as const, scenarioName: '新规则', formula: 'P', enabled: true }],
      }
    })
  }
  const removeFormulaRule = (id: string) => {
    setPriceRule(prev => prev ? { ...prev, formulaRules: prev.formulaRules.filter(r => r.id !== id) } : prev)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50/60">
      {/* 头部导航区域 */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="mb-4">
          <button onClick={() => navigate('/voyage/templates')} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-4 h-4" /> 返回模板列表
          </button>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">定价规则管理</h1>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">{template.name}</span>
              <span className="text-gray-300">|</span>
              <span className="text-xs text-gray-500">适用游轮: <span className="font-medium text-gray-700">{template.shipName || '-'}</span></span>
              <span className="text-gray-300">|</span>
              <span className="text-xs text-gray-500">关联产品: <span className="font-medium text-gray-700">{template.productName || '-'}</span></span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditMode(v => !v)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none ${
                editMode ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {editMode ? '取消编辑' : '进入编辑模式'}
            </button>
            {editMode && (
              <button onClick={savePriceRule} className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition shadow-sm">
                <Save className="w-4 h-4" /> 保存规则
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 页面主要内容区 */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        
        {/* 顶部：航段清单 & 生效范围 (左右分栏) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 航段清单 */}
          <div className="lg:col-span-4 xl:col-span-3 rounded-xl border border-gray-200 bg-white px-5 py-5 shadow-sm flex flex-col">
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">航段清单</h4>
            <div className="flex-1 flex flex-wrap content-start gap-2">
              {Array.from({ length: segmentsCount }).map((_, i) => {
                const seg = segmentsList[i]
                const segName = seg ? `${seg.startPort}-${seg.endPort}` : (i === 0 ? '全程' : '')
                return (
                  <span key={i} className="text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md shadow-sm">
                    航段{i} <span className="text-gray-500 font-normal">{segName ? `(${segName})` : ''}</span>
                  </span>
                )
              })}
            </div>
          </div>

          {/* 生效范围 */}
          <div className="lg:col-span-8 xl:col-span-9 rounded-xl border border-gray-200 bg-white px-5 py-5 shadow-sm flex flex-col">
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">生效范围</h4>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-400">生效开始日期</label>
                {editMode
                  ? <input type="date" value={priceRule.effectiveStart} onChange={e => updatePriceRuleDate('effectiveStart', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
                  : <p className="text-base font-medium text-gray-900 bg-gray-50/50 px-3 py-2.5 rounded-lg border border-transparent">{priceRule.effectiveStart}</p>}
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-400">生效结束日期</label>
                {editMode
                  ? <input type="date" value={priceRule.effectiveEnd} onChange={e => updatePriceRuleDate('effectiveEnd', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
                  : <p className="text-base font-medium text-gray-900 bg-gray-50/50 px-3 py-2.5 rounded-lg border border-transparent">{priceRule.effectiveEnd}</p>}
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-400">排除日期</label>
                {editMode ? (
                  <div className="flex flex-col gap-2">
                    <input type="date" onChange={e => { if (e.target.value) { toggleExcludeDate(e.target.value); e.target.value = '' } }} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {priceRule.excludeDates?.map(d => (
                        <span key={d} className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          {d}<button onClick={() => toggleExcludeDate(d)} className="text-gray-400 hover:text-red-500 transition-colors">&times;</button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {priceRule.excludeDates?.length ? priceRule.excludeDates.map(d => (
                      <span key={d} className="rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700">{d}</span>
                    )) : <span className="text-sm text-gray-400">无</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 基础变量 + 楼层费规则 (左右分栏，各占一半) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">基础变量</h4>
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/80">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-28 sticky left-0 bg-gray-50/80 z-10">变量</th>
                    {Array.from({ length: segmentsCount }).map((_, i) => (
                      <th key={i} className="px-4 py-3 text-right text-xs font-medium text-gray-500 whitespace-nowrap min-w-[70px]">航段{i}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(Object.keys(priceRule.variables) as PricingVariableKey[]).map(key => (
                    <tr key={key} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 bg-white sticky left-0 whitespace-nowrap border-r border-gray-50">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-gray-900 text-sm">{key}</span>
                          <span className="text-xs text-gray-400 font-sans mt-0.5">{variableLabels[key]}</span>
                        </div>
                      </td>
                      {Array.from({ length: segmentsCount }).map((_, i) => (
                        <td key={i} className="px-4 py-3 text-right">
                          {editMode
                            ? <input type="number" step="any" value={priceRule.variables[key][i] ?? 0} onChange={e => updatePriceVariableArray(key, i, Number(e.target.value))} className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-right text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
                            : <span className="text-sm font-medium text-gray-900">{priceRule.variables[key][i]?.toLocaleString() ?? 0}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex flex-col">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">楼层费规则</h4>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/80">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">甲板层</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">公式基底</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 whitespace-nowrap">计算结果(全程)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">层级</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {priceRule.floorRules.map((row, index) => (
                    <tr key={row.floor} className="hover:bg-gray-50/50">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">{row.label}</td>
                      <td className="px-4 py-4">
                        {editMode
                          ? <input value={row.formulaPrefix} onChange={e => updateFloorRule(index, 'formulaPrefix', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-1.5 font-mono text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
                          : <span className="font-mono text-sm text-gray-700 bg-gray-50 px-2.5 py-1.5 rounded">{row.formulaPrefix}</span>}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-blue-600 text-base">
                        ¥{evaluateFormula(row.formulaPrefix, priceRule.variables.P[0] ?? 0, priceRule.variables.S[0] ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {editMode
                          ? <input type="number" value={row.floorLevel} onChange={e => updateFloorRule(index, 'floorLevel', Number(e.target.value))} className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-right text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
                          : <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2.5 py-1.5 rounded">{row.floorLevel}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 入住组合公式 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">入住组合公式</h4>
            {editMode && (
              <button onClick={addFormulaRule} className="text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none">
                + 新增组合规则
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
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 whitespace-nowrap">计算结果(全程)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">状态</th>
                  {editMode && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {priceRule.formulaRules.map((row, index) => (
                  <tr key={row.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {editMode
                        ? <select value={row.floor} onChange={e => updateFormulaRule(index, 'floor', e.target.value)} className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900">{deckOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
                        : <span className="text-sm font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded">{row.floor}</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900 font-medium">
                      {editMode
                        ? <input value={row.scenarioName} onChange={e => updateFormulaRule(index, 'scenarioName', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
                        : row.scenarioName}
                    </td>
                    <td className="px-4 py-3">
                      {editMode
                        ? <input value={row.formula} onChange={e => updateFormulaRule(index, 'formula', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-1.5 font-mono text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
                        : <span className="font-mono text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded">{row.formula}</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-600">
                      ¥{evaluateFormula(row.formula, priceRule.variables.P[0] ?? 0, priceRule.variables.S[0] ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editMode
                        ? <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={row.enabled} onChange={e => updateFormulaRule(index, 'enabled', e.target.checked)} className="sr-only peer" />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gray-900"></div>
                          </label>
                        : <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${row.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{row.enabled ? '已启用' : '已停用'}</span>}
                    </td>
                    {editMode && (
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => removeFormulaRule(row.id)} className="text-sm text-red-500 hover:text-red-700 font-medium">删除</button>
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
