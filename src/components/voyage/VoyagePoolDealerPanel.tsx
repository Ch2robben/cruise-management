import { useEffect, useMemo, useState } from 'react'
import { templateApi } from '@/mock/api'
import { dealers } from '@/mock/data'
import {
  collectPoolDealerIds,
  getByDealerPools,
  getProductSegments,
  loadTemplatePoolDealerRules,
  loadTemplatePoolQuotas,
  saveTemplatePoolDealerRules,
  segmentKey,
  setPoolDealerQuantity,
  subscribePoolQuotaStore,
  type TemplatePoolDealerRules,
  type TemplatePoolQuotaRules,
} from '@/mock/templatePoolQuotas'
import { getTemplateSellRoomTypes } from '@/mock/sellRoomTypeConfig'
import type { Voyage, VoyageTemplate } from '@/types'

export default function VoyagePoolDealerPanel({ voyage }: { voyage: Voyage }) {
  const [template, setTemplate] = useState<VoyageTemplate | null>(null)
  const [quotas, setQuotas] = useState<TemplatePoolQuotaRules>({})
  const [dealerRules, setDealerRules] = useState<TemplatePoolDealerRules>({})
  const [poolId, setPoolId] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const byDealerPools = useMemo(() => getByDealerPools(), [])
  const activeDealers = useMemo(() => dealers.filter((d) => d.status === 'cooperating'), [])

  useEffect(() => {
    if (!voyage.templateId) {
      setTemplate(null)
      return
    }
    let cancelled = false
    async function load() {
      setLoading(true)
      const t = await templateApi.getById(voyage.templateId)
      if (cancelled || !t) {
        setLoading(false)
        return
      }
      const q = loadTemplatePoolQuotas(t)
      const d = loadTemplatePoolDealerRules(t, q)
      setTemplate(t)
      setQuotas(q)
      setDealerRules(d)
      setPoolId(getByDealerPools()[0]?.id ?? '')
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [voyage.templateId])

  useEffect(() => {
    return subscribePoolQuotaStore(() => {
      setTemplate((current) => {
        if (!current || editMode) return current
        const q = loadTemplatePoolQuotas(current)
        setQuotas(q)
        setDealerRules(loadTemplatePoolDealerRules(current, q))
        return current
      })
    })
  }, [editMode])

  const dealerIds = useMemo(() => collectPoolDealerIds(dealerRules), [dealerRules])
  const segments = useMemo(() => {
    if (!template) return [{ key: '全程' }]
    const list = getProductSegments(template)
    return list.length > 0 ? list.map((s) => ({ key: segmentKey(s) })) : [{ key: '全程' }]
  }, [template])
  const rooms = useMemo(() => (template ? getTemplateSellRoomTypes(template) : []), [template])
  const activePool = byDealerPools.find((p) => p.id === poolId) ?? byDealerPools[0]

  if (!voyage.templateId) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white py-16 text-center text-sm text-slate-400 shadow-sm">
        当前航次未关联模板，无法查看锁配额经销商额度
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">锁配额 · 经销商额度</h2>
          <p className="mt-0.5 text-xs text-slate-500">仅展示配额模式为「按经销商拆额度」的库存池</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {byDealerPools.map((pool) => (
            <button
              key={pool.id}
              type="button"
              onClick={() => setPoolId(pool.id)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                activePool?.id === pool.id ? 'bg-blue-600 text-white' : 'border border-slate-300 text-slate-700'
              }`}
            >
              {pool.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              if (editMode && template) {
                saveTemplatePoolDealerRules(template.id, dealerRules)
              }
              setEditMode((v) => !v)
            }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            {editMode ? '保存并退出' : '编辑'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">加载中...</div>
      ) : !activePool ? (
        <div className="py-16 text-center text-sm text-slate-400">暂无锁配额类型库存池</div>
      ) : (
        <div className="overflow-x-auto p-4">
          <table className="min-w-full border border-slate-200 text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500">
                <th className="border-b border-r px-3 py-2 text-left">航段</th>
                <th className="border-b border-r px-3 py-2 text-left">销售房型</th>
                <th className="border-b border-r px-3 py-2 text-right">池配额</th>
                {dealerIds.map((id) => (
                  <th key={id} className="border-b border-r px-3 py-2 text-right">
                    <span className="inline-block max-w-[6rem] truncate" title={activeDealers.find((d) => d.id === id)?.name}>
                      {activeDealers.find((d) => d.id === id)?.name || id}
                    </span>
                  </th>
                ))}
                <th className="border-b px-3 py-2 text-right">合计</th>
              </tr>
            </thead>
            <tbody>
              {segments.flatMap(({ key }) =>
                rooms.map((room, roomIndex) => {
                  const poolQty = quotas[room.code]?.[key]?.poolQty[activePool.id] ?? 0
                  const allocations = dealerRules[room.code]?.[key]?.[activePool.id] || []
                  const sum = dealerIds.reduce((s, id) => s + (allocations.find((a) => a.dealerId === id)?.qty || 0), 0)
                  return (
                    <tr key={`${key}-${room.code}`}>
                      {roomIndex === 0 && (
                        <td rowSpan={rooms.length} className="border-b border-r bg-slate-50/50 px-3 py-2 align-top font-medium">
                          {key}
                        </td>
                      )}
                      <td className="border-b border-r px-3 py-2">{room.name}</td>
                      <td className="border-b border-r px-3 py-2 text-right text-slate-600">{poolQty}</td>
                      {dealerIds.map((id) => {
                        const qty = allocations.find((a) => a.dealerId === id)?.qty ?? 0
                        return (
                          <td key={id} className="border-b border-r px-3 py-2 text-right">
                            {editMode ? (
                              <input
                                type="number"
                                min={0}
                                value={qty}
                                onChange={(e) => {
                                  const value = Math.max(0, Number(e.target.value) || 0)
                                  setDealerRules((prev) => {
                                    const cabin = { ...(prev[room.code] || {}) }
                                    const seg = { ...(cabin[key] || {}) }
                                    const current = seg[activePool.id] || []
                                    return {
                                      ...prev,
                                      [room.code]: {
                                        ...cabin,
                                        [key]: {
                                          ...seg,
                                          [activePool.id]: setPoolDealerQuantity(current, id, value),
                                        },
                                      },
                                    }
                                  })
                                }}
                                className="w-16 rounded border border-slate-300 px-1 py-0.5 text-right"
                              />
                            ) : (
                              qty
                            )}
                          </td>
                        )
                      })}
                      <td className={`border-b px-3 py-2 text-right font-medium ${sum > poolQty ? 'text-rose-600' : 'text-blue-700'}`}>
                        {sum}
                      </td>
                    </tr>
                  )
                }),
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
