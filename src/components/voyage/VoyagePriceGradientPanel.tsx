import { useMemo, useState } from 'react'
import { Pencil } from 'lucide-react'
import type { RouteSegmentOption } from '@/components/voyage/VoyageTipManagementPanel'
import type { Voyage } from '@/types'

function sanitizeGradient(value: number) {
  const parsed = Math.floor(Number(value))
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return parsed
}

export interface VoyagePriceGradientPanelProps {
  voyage?: Voyage
  segmentOptions: RouteSegmentOption[]
  embedded?: boolean
}

export default function VoyagePriceGradientPanel({
  voyage,
  segmentOptions,
  embedded = false,
}: VoyagePriceGradientPanelProps) {
  const [editing, setEditing] = useState(false)
  const [draftGradients, setDraftGradients] = useState<Record<string, number> | null>(null)
  const [gradientsByVoyage, setGradientsByVoyage] = useState<Record<string, Record<string, number>>>({})

  const segmentRows = useMemo(() => {
    const actualSegments = segmentOptions.filter((segment) => segment.key !== 'all')
    return actualSegments.length > 0 ? actualSegments : segmentOptions
  }, [segmentOptions])
  const voyageKey = voyage?.id || 'default'
  const savedGradients = gradientsByVoyage[voyageKey] || {}

  const startEdit = () => {
    setDraftGradients(Object.fromEntries(
      segmentRows.map((segment) => [segment.key, savedGradients[segment.key] ?? 100]),
    ))
    setEditing(true)
  }

  const cancelEdit = () => {
    setDraftGradients(null)
    setEditing(false)
  }

  const saveEdit = () => {
    if (!draftGradients) return
    const normalized = Object.fromEntries(
      Object.entries(draftGradients).map(([segmentKey, gradient]) => [segmentKey, sanitizeGradient(gradient)]),
    )
    setGradientsByVoyage((prev) => ({ ...prev, [voyageKey]: normalized }))
    setDraftGradients(null)
    setEditing(false)
  }

  const updateGradient = (segmentKey: string, value: number) => {
    if (!draftGradients) return
    setDraftGradients({ ...draftGradients, [segmentKey]: sanitizeGradient(value) })
  }

  if (!voyage) {
    return <div className="flex h-40 items-center justify-center text-sm text-gray-400">请先选择航次</div>
  }

  return (
    <div className={`flex flex-col ${embedded ? 'min-h-[360px]' : ''}`}>
      <div className={`min-h-0 flex-1 overflow-auto ${embedded ? 'p-3' : 'p-4'}`}>
        <p className="mb-3 text-xs text-gray-500">按航段设置调价梯度，默认梯度为 100；梯度为正整数，数值越大调价幅度越高。</p>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">航段</th>
                <th className="w-28 px-3 py-2.5 text-right text-xs font-medium text-gray-500">梯度</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {segmentRows.map((segment) => {
                const gradient = editing && draftGradients
                  ? draftGradients[segment.key] ?? 100
                  : savedGradients[segment.key] ?? 100
                return (
                <tr key={segment.key} className="hover:bg-gray-50/80">
                  <td className="px-3 py-2.5 font-medium text-gray-900">{segment.label}</td>
                  <td className="px-3 py-2.5 text-right">
                    {editing ? (
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={gradient}
                        onChange={(event) => updateGradient(segment.key, Number(event.target.value))}
                        className="w-20 rounded border border-gray-300 px-2 py-1.5 text-right text-sm"
                      />
                    ) : (
                      <span className="font-semibold tabular-nums text-gray-900">{gradient}</span>
                    )}
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`flex items-center justify-between gap-3 border-t ${embedded ? 'bg-white px-3 py-3' : 'px-4 py-4'}`}>
        <div className="text-xs text-gray-500">共 {segmentRows.length} 个航段</div>
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
