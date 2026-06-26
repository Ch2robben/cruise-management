import { useMemo, useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { voyageTemplates } from '@/mock/data'
import type { Product, Voyage, VoyageTemplate } from '@/types'
import { DEFAULT_MARKET_CATEGORY, MARKET_CATEGORY_GROUPS, MARKET_CATEGORY_OPTIONS, getMarketCategoryLabel } from '@/utils/constants'
import { generateId } from '@/utils/format'

export interface RouteSegmentOption {
  key: string
  label: string
}

type TipChargeType = 'none' | 'perDay' | 'perPerson' | 'perRoom'

interface VoyageSegmentTipRule {
  id: string
  marketCategory: string
  chargeType: TipChargeType
  amount: number
  status: 'enabled' | 'disabled'
}

const chargeTypeOptions: { value: TipChargeType; label: string }[] = [
  { value: 'none', label: '不收取' },
  { value: 'perDay', label: '按天收取' },
  { value: 'perPerson', label: '按人收取' },
  { value: 'perRoom', label: '按房收取' },
]

function getChargeTypeLabel(type: TipChargeType) {
  return chargeTypeOptions.find((item) => item.value === type)?.label || type
}

function createDefaultRules(template?: VoyageTemplate, segmentKey = 'all'): VoyageSegmentTipRule[] {
  const templateTips = template?.tips || []
  if (templateTips.length > 0) {
    return templateTips.map((tip, index) => ({
      id: tip.id || generateId(),
      marketCategory: tip.marketCategory,
      chargeType: 'perPerson' as const,
      amount: segmentKey === 'all' ? tip.tip : Math.max(0, tip.tip + (segmentKey.length % 3) * 10 - index * 5),
      status: 'enabled' as const,
    }))
  }

  return [
    { id: generateId(), marketCategory: 'domestic_wushan', chargeType: 'perDay', amount: segmentKey === 'all' ? 50 : 45, status: 'enabled' },
    { id: generateId(), marketCategory: 'foreign_japan', chargeType: 'perPerson', amount: segmentKey === 'all' ? 100 : 90, status: 'enabled' },
    { id: generateId(), marketCategory: 'foreign_usa', chargeType: 'perRoom', amount: segmentKey === 'all' ? 200 : 180, status: 'enabled' },
  ]
}

function emptyRule(): VoyageSegmentTipRule {
  return {
    id: generateId(),
    marketCategory: DEFAULT_MARKET_CATEGORY,
    chargeType: 'perDay',
    amount: 0,
    status: 'enabled',
  }
}

export interface VoyageTipManagementPanelProps {
  voyage?: Voyage
  selectedSegmentKey: string
  embedded?: boolean
}

export default function VoyageTipManagementPanel({
  voyage,
  selectedSegmentKey,
  embedded = false,
}: VoyageTipManagementPanelProps) {
  const template = useMemo(() => {
    if (!voyage) return undefined
    return voyageTemplates.find((item) => item.id === voyage.templateId || item.productId === voyage.productId)
  }, [voyage])

  const [editing, setEditing] = useState(false)
  const [rulesBySegment, setRulesBySegment] = useState<Record<string, VoyageSegmentTipRule[]>>({})

  const rules = useMemo(() => {
    if (rulesBySegment[selectedSegmentKey]) return rulesBySegment[selectedSegmentKey]
    return createDefaultRules(template, selectedSegmentKey)
  }, [rulesBySegment, selectedSegmentKey, template])

  const updateRules = (nextRules: VoyageSegmentTipRule[]) => {
    setRulesBySegment((prev) => ({ ...prev, [selectedSegmentKey]: nextRules }))
  }

  const updateRule = (id: string, patch: Partial<VoyageSegmentTipRule>) => {
    updateRules(rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)))
  }

  const addRule = () => updateRules([...rules, emptyRule()])
  const removeRule = (id: string) => updateRules(rules.filter((rule) => rule.id !== id))

  const resetDraft = () => {
    setRulesBySegment((prev) => {
      const next = { ...prev }
      delete next[selectedSegmentKey]
      return next
    })
    setEditing(false)
  }

  if (!voyage) {
    return <div className="flex h-40 items-center justify-center text-sm text-gray-400">请先选择航次</div>
  }

  return (
    <div className={`flex flex-col ${embedded ? 'min-h-[420px]' : ''}`}>
      <div className={`min-h-0 flex-1 overflow-auto ${embedded ? 'p-3' : 'p-4'}`}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-gray-500">按市场类别维护当前航段小费标准。</p>
          {editing && (
            <button
              type="button"
              onClick={addRule}
              className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
            >
              <Plus className="h-3.5 w-3.5" />添加规则
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">市场类别</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">收取方式</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500">小费金额</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500">状态</th>
                {editing && <th className="w-16 px-3 py-2.5 text-xs font-medium text-gray-500">操作</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={editing ? 5 : 4} className="px-3 py-10 text-center text-sm text-gray-400">
                    当前航段暂无小费规则
                  </td>
                </tr>
              ) : rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50/80">
                  <td className="px-3 py-2.5">
                    {editing ? (
                      <select
                        value={rule.marketCategory}
                        onChange={(event) => updateRule(rule.id, { marketCategory: event.target.value })}
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                      >
                        <option value="">选择市场</option>
                        {MARKET_CATEGORY_GROUPS.map((group) => (
                          <optgroup key={group} label={group}>
                            {MARKET_CATEGORY_OPTIONS.filter((item) => item.parent === group).map((item) => (
                              <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-900">{getMarketCategoryLabel(rule.marketCategory)}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {editing ? (
                      <select
                        value={rule.chargeType}
                        onChange={(event) => updateRule(rule.id, { chargeType: event.target.value as TipChargeType })}
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                      >
                        {chargeTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-700">{getChargeTypeLabel(rule.chargeType)}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {editing ? (
                      <input
                        type="number"
                        min={0}
                        value={rule.amount}
                        onChange={(event) => updateRule(rule.id, { amount: Number(event.target.value) || 0 })}
                        className="w-24 rounded border border-gray-300 px-2 py-1.5 text-right text-sm"
                      />
                    ) : (
                      <span className="font-semibold text-gray-900">
                        {rule.chargeType === 'none' ? '-' : `¥${rule.amount}`}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {editing ? (
                      <select
                        value={rule.status}
                        onChange={(event) => updateRule(rule.id, { status: event.target.value as VoyageSegmentTipRule['status'] })}
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                      >
                        <option value="enabled">启用</option>
                        <option value="disabled">停用</option>
                      </select>
                    ) : (
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${rule.status === 'enabled' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {rule.status === 'enabled' ? '启用' : '停用'}
                      </span>
                    )}
                  </td>
                  {editing && (
                    <td className="px-3 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => removeRule(rule.id)}
                        className="text-xs text-red-500 hover:bg-red-50 rounded px-2 py-1"
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

      <div className={`flex items-center justify-between gap-3 border-t ${embedded ? 'bg-white px-3 py-3' : 'px-4 py-4'}`}>
        <div className="text-xs text-gray-500">
          共 {rules.filter((rule) => rule.status === 'enabled' && rule.chargeType !== 'none').length} 条生效规则
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={resetDraft} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
              <button onClick={() => setEditing(false)} className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800">保存</button>
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

export function createRouteSegmentOptions(product?: Product): RouteSegmentOption[] {
  if (!product || product.segments.length === 0) {
    return [{ key: 'all', label: '全部航段' }]
  }
  const stops = [product.segments[0].startPort, ...product.segments.map((segment) => segment.endPort)]
  return [
    { key: 'all', label: '全部航段' },
    ...Array.from({ length: stops.length - 1 }).map((_, index) => ({
      key: `${stops[index]}-${stops[index + 1]}`,
      label: `${stops[index]}-${stops[index + 1]}`,
    })),
  ]
}
