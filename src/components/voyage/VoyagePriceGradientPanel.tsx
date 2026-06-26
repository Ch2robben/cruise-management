import { useMemo, useState } from 'react'
import { Pencil } from 'lucide-react'
import type { Voyage } from '@/types'
import { generateId } from '@/utils/format'

interface PriceGradientTier {
  id: string
  tierNo: number
  triggerLabel: string
  gradient: number
}

function createDefaultTiers(segmentKey: string): PriceGradientTier[] {
  const offset = segmentKey === 'all' ? 0 : segmentKey.length % 3
  return [
    { id: generateId(), tierNo: 1, triggerLabel: '可售库存 ≥ 60%', gradient: 100 + offset },
  ]
}

function sanitizeGradient(value: number) {
  const parsed = Math.floor(Number(value))
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return parsed
}

export interface VoyagePriceGradientPanelProps {
  voyage?: Voyage
  selectedSegmentKey: string
  embedded?: boolean
}

export default function VoyagePriceGradientPanel({
  voyage,
  selectedSegmentKey,
  embedded = false,
}: VoyagePriceGradientPanelProps) {
  const [editing, setEditing] = useState(false)
  const [draftTiers, setDraftTiers] = useState<PriceGradientTier[] | null>(null)
  const [tiersBySegment, setTiersBySegment] = useState<Record<string, PriceGradientTier[]>>({})

  const savedTiers = useMemo(() => {
    if (tiersBySegment[selectedSegmentKey]) return tiersBySegment[selectedSegmentKey]
    return createDefaultTiers(selectedSegmentKey)
  }, [selectedSegmentKey, tiersBySegment])

  const tiers = editing && draftTiers ? draftTiers : savedTiers

  const startEdit = () => {
    setDraftTiers(savedTiers.map((tier) => ({ ...tier })))
    setEditing(true)
  }

  const cancelEdit = () => {
    setDraftTiers(null)
    setEditing(false)
  }

  const saveEdit = () => {
    if (!draftTiers) return
    const normalized = draftTiers.map((tier) => ({
      ...tier,
      gradient: sanitizeGradient(tier.gradient),
    }))
    setTiersBySegment((prev) => ({ ...prev, [selectedSegmentKey]: normalized }))
    setDraftTiers(null)
    setEditing(false)
  }

  const updateGradient = (id: string, value: number) => {
    if (!draftTiers) return
    setDraftTiers(draftTiers.map((tier) => (
      tier.id === id ? { ...tier, gradient: sanitizeGradient(value) } : tier
    )))
  }

  if (!voyage) {
    return <div className="flex h-40 items-center justify-center text-sm text-gray-400">请先选择航次</div>
  }

  return (
    <div className={`flex flex-col ${embedded ? 'min-h-[360px]' : ''}`}>
      <div className={`min-h-0 flex-1 overflow-auto ${embedded ? 'p-3' : 'p-4'}`}>
        <p className="mb-3 text-xs text-gray-500">梯度为正整数，数值越大调价幅度越高；档位与触发条件不可修改。</p>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-16 px-3 py-2.5 text-center text-xs font-medium text-gray-500">档位</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">触发条件</th>
                <th className="w-28 px-3 py-2.5 text-right text-xs font-medium text-gray-500">梯度</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tiers.map((tier) => (
                <tr key={tier.id} className="hover:bg-gray-50/80">
                  <td className="px-3 py-2.5 text-center font-medium text-gray-900">{tier.tierNo}</td>
                  <td className="px-3 py-2.5 text-gray-700">{tier.triggerLabel}</td>
                  <td className="px-3 py-2.5 text-right">
                    {editing ? (
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={tier.gradient}
                        onChange={(event) => updateGradient(tier.id, Number(event.target.value))}
                        className="w-20 rounded border border-gray-300 px-2 py-1.5 text-right text-sm"
                      />
                    ) : (
                      <span className="font-semibold tabular-nums text-gray-900">{tier.gradient}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`flex items-center justify-between gap-3 border-t ${embedded ? 'bg-white px-3 py-3' : 'px-4 py-4'}`}>
        <div className="text-xs text-gray-500">共 {tiers.length} 档梯度规则</div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={cancelEdit} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
              <button onClick={saveEdit} className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800">保存</button>
            </>
          ) : (
            <button
              onClick={startEdit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
            >
              <Pencil className="h-3.5 w-3.5" />编辑梯度
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
