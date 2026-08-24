import { useEffect, useMemo, useState } from 'react'
import { templateApi } from '@/mock/api'
import {
  aggregatePoolField,
  aggregatePoolPhysical,
  getEnabledInventoryPools,
  getPoolSold,
  getTemplateSegmentKeys,
  loadTemplatePoolQuotas,
  resetPoolDemoState,
  saveTemplatePoolQuotas,
  setAggregatedPoolQty,
  subscribePoolQuotaStore,
  type TemplatePoolQuotaRules,
} from '@/mock/templatePoolQuotas'
import { getTemplateSellRoomTypes } from '@/mock/sellRoomTypeConfig'
import type { Voyage, VoyageTemplate } from '@/types'

interface PoolInventoryRow {
  sellRoomTypeCode: string
  name: string
  physicalCapacity: number
  poolQty: Record<string, number>
  sold: number
  remaining: number
  status: 'open' | 'closed'
}

export default function VoyagePoolQuotaPanel({
  voyage,
}: {
  voyage: Voyage
  voyageInventories?: { voyageId: string; cabinTypeName: string; sold: number }[]
}) {
  const [template, setTemplate] = useState<VoyageTemplate | null>(null)
  const [quotaRules, setQuotaRules] = useState<TemplatePoolQuotaRules>({})
  const [statusMap, setStatusMap] = useState<Record<string, 'open' | 'closed'>>({})
  const [editing, setEditing] = useState<PoolInventoryRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [soldTick, setSoldTick] = useState(0)
  const pools = useMemo(() => getEnabledInventoryPools(), [])

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
      setTemplate(t)
      setQuotaRules(loadTemplatePoolQuotas(t))
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [voyage.templateId])

  useEffect(() => {
    return subscribePoolQuotaStore(() => {
      setSoldTick((tick) => tick + 1)
      setTemplate((current) => {
        if (current) setQuotaRules(loadTemplatePoolQuotas(current))
        return current
      })
    })
  }, [])

  const rows: PoolInventoryRow[] = useMemo(() => {
    if (!template) return []
    return getTemplateSellRoomTypes(template).map((sellRoom) => {
      const poolQty: Record<string, number> = {}
      pools.forEach((pool) => {
        poolQty[pool.id] = aggregatePoolField(quotaRules, sellRoom.code, pool.id)
      })
      const segmentKeys = getTemplateSegmentKeys(template)
      const soldFromPools = pools.reduce((sum, pool) => {
        return (
          sum +
          segmentKeys.reduce(
            (segSum, segKey) => segSum + getPoolSold(template.id, sellRoom.code, segKey, pool.id),
            0,
          )
        )
      }, 0)
      const allocated = Object.values(poolQty).reduce((s, n) => s + n, 0)
      return {
        sellRoomTypeCode: sellRoom.code,
        name: sellRoom.name,
        physicalCapacity: aggregatePoolPhysical(quotaRules, sellRoom.code),
        poolQty,
        sold: soldFromPools,
        remaining: Math.max(0, allocated - soldFromPools),
        status: statusMap[sellRoom.code] || 'open',
      }
    })
  }, [pools, quotaRules, soldTick, statusMap, template])

  if (!voyage.templateId) {
    return (
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white py-16 text-center text-sm text-slate-400 shadow-sm">
        当前航次未关联模板，无法查看库存池配额
      </section>
    )
  }

  const totals = rows.reduce(
    (acc, row) => {
      acc.physicalCapacity += row.physicalCapacity
      acc.sold += row.sold
      acc.remaining += row.remaining
      pools.forEach((pool) => {
        acc.byPool[pool.id] = (acc.byPool[pool.id] || 0) + (row.poolQty[pool.id] || 0)
      })
      return acc
    },
    { physicalCapacity: 0, sold: 0, remaining: 0, byPool: {} as Record<string, number> },
  )
  const allocatedTotal = Object.values(totals.byPool).reduce((s, n) => s + n, 0)

  const handleSave = (row: PoolInventoryRow, nextPoolQty: Record<string, number>, status: 'open' | 'closed') => {
    if (!template) return
    let next = quotaRules
    pools.forEach((pool) => {
      next = setAggregatedPoolQty(next, row.sellRoomTypeCode, pool.id, nextPoolQty[pool.id] ?? 0)
    })
    setQuotaRules(next)
    saveTemplatePoolQuotas(template.id, next)
    setStatusMap((prev) => ({ ...prev, [row.sellRoomTypeCode]: status }))
    setEditing(null)
  }

  return (
    <>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-2.5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">库存池配额</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              共 {rows.length} 类销售房型 · 已售为下单扣减的池名额，本机刷新后仍保留
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!window.confirm('将清空本机已保存的池配额与已售数据，并恢复演示种子。确定重置？')) return
              resetPoolDemoState()
              if (template) setQuotaRules(loadTemplatePoolQuotas(template))
            }}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50"
          >
            重置演示数据
          </button>
        </div>
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">加载中...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="w-12 border-b border-slate-200 px-3 py-2.5 text-center font-medium">序号</th>
                  <th className="border-b border-slate-200 px-3 py-2.5 text-left font-medium">销售房型</th>
                  <th className="w-20 border-b border-slate-200 px-3 py-2.5 text-right font-medium">物理容量</th>
                  {pools.map((pool) => (
                    <th key={pool.id} className="min-w-[88px] border-b border-slate-200 px-3 py-2.5 text-right font-medium">
                      {pool.name}
                    </th>
                  ))}
                  <th className="w-20 border-b border-slate-200 px-3 py-2.5 text-right font-medium">已分配</th>
                  <th className="w-16 border-b border-slate-200 px-3 py-2.5 text-right font-medium">已售</th>
                  <th className="w-16 border-b border-slate-200 px-3 py-2.5 text-right font-medium">余量</th>
                  <th className="w-16 border-b border-slate-200 px-3 py-2.5 text-right font-medium">未分配</th>
                  <th className="w-20 border-b border-slate-200 px-3 py-2.5 text-center font-medium">状态</th>
                  <th className="w-24 border-b border-slate-200 px-3 py-2.5 text-center font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const allocated = Object.values(row.poolQty).reduce((s, n) => s + n, 0)
                  const unallocated = Math.max(0, row.physicalCapacity - allocated)
                  return (
                    <tr key={row.sellRoomTypeCode} className="hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-3 py-2.5 text-center text-slate-400">{index + 1}</td>
                      <td className="border-b border-slate-100 px-3 py-2.5 font-medium text-slate-800">{row.name}</td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-right font-medium">{row.physicalCapacity}</td>
                      {pools.map((pool) => (
                        <td key={pool.id} className="border-b border-slate-100 px-3 py-2.5 text-right font-medium text-blue-700">
                          {row.poolQty[pool.id] ?? 0}
                        </td>
                      ))}
                      <td className="border-b border-slate-100 px-3 py-2.5 text-right font-semibold">{allocated}</td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-right font-medium text-emerald-600">{row.sold}</td>
                      <td className={`border-b border-slate-100 px-3 py-2.5 text-right font-medium ${row.remaining <= 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {row.remaining}
                      </td>
                      <td className={`border-b border-slate-100 px-3 py-2.5 text-right font-medium ${unallocated === 0 ? 'text-slate-400' : 'text-amber-700'}`}>
                        {unallocated}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-center">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                            row.status === 'open'
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                              : 'bg-slate-100 text-slate-500 ring-slate-200'
                          }`}
                        >
                          {row.status === 'open' ? '开放' : '关闭'}
                        </span>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => setEditing(row)}
                          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                        >
                          维护配额
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold text-slate-800">
                  <td className="border-t border-slate-200 px-3 py-2.5 text-center text-slate-400">—</td>
                  <td className="border-t border-slate-200 px-3 py-2.5 text-slate-500">合计</td>
                  <td className="border-t border-slate-200 px-3 py-2.5 text-right">{totals.physicalCapacity}</td>
                  {pools.map((pool) => (
                    <td key={pool.id} className="border-t border-slate-200 px-3 py-2.5 text-right text-blue-700">
                      {totals.byPool[pool.id] || 0}
                    </td>
                  ))}
                  <td className="border-t border-slate-200 px-3 py-2.5 text-right">{allocatedTotal}</td>
                  <td className="border-t border-slate-200 px-3 py-2.5 text-right text-emerald-600">{totals.sold}</td>
                  <td className="border-t border-slate-200 px-3 py-2.5 text-right">{totals.remaining}</td>
                  <td className="border-t border-slate-200 px-3 py-2.5 text-right text-amber-700">
                    {Math.max(0, totals.physicalCapacity - allocatedTotal)}
                  </td>
                  <td className="border-t border-slate-200 px-3 py-2.5" colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {editing && (
        <PoolQuotaEditModal
          row={editing}
          pools={pools}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </>
  )
}

function PoolQuotaEditModal({
  row,
  pools,
  onClose,
  onSave,
}: {
  row: PoolInventoryRow
  pools: { id: string; name: string; quotaMode: string }[]
  onClose: () => void
  onSave: (row: PoolInventoryRow, poolQty: Record<string, number>, status: 'open' | 'closed') => void
}) {
  const [poolQty, setPoolQty] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    pools.forEach((pool) => {
      init[pool.id] = String(row.poolQty[pool.id] ?? 0)
    })
    return init
  })
  const [status, setStatus] = useState<'open' | 'closed'>(row.status)

  const numericQty: Record<string, number> = {}
  pools.forEach((pool) => {
    numericQty[pool.id] = Math.max(0, Number(poolQty[pool.id]) || 0)
  })
  const allocated = Object.values(numericQty).reduce((s, n) => s + n, 0)
  const over = allocated > row.physicalCapacity

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">维护库存池配额</h3>
          <p className="mt-0.5 truncate text-xs text-slate-400">{row.name}</p>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 px-3 py-2 text-center text-xs">
            <div>
              <div className="text-slate-400">物理容量</div>
              <div className="mt-1 text-base font-semibold text-slate-800">{row.physicalCapacity}</div>
            </div>
            <div>
              <div className="text-slate-400">已分配</div>
              <div className={`mt-1 text-base font-semibold ${over ? 'text-rose-600' : 'text-slate-800'}`}>{allocated}</div>
            </div>
            <div>
              <div className="text-slate-400">已售</div>
              <div className="mt-1 text-base font-semibold text-emerald-600">{row.sold}</div>
            </div>
          </div>
          {pools.map((pool) => (
            <label key={pool.id} className="block">
              <span className="mb-1 block text-xs text-slate-600">
                {pool.name}
                <span className="ml-1 text-slate-400">({pool.quotaMode === 'shared' ? '共享' : '锁配额'})</span>
              </span>
              <input
                type="number"
                min={0}
                value={poolQty[pool.id]}
                onChange={(e) => setPoolQty((prev) => ({ ...prev, [pool.id]: e.target.value }))}
                className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={status === 'open'}
              onChange={(e) => setStatus(e.target.checked ? 'open' : 'closed')}
              className="accent-blue-600"
            />
            开放销售
          </label>
          {over && <p className="text-xs text-rose-500">各池合计不可超过物理容量</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
            取消
          </button>
          <button
            type="button"
            disabled={over}
            onClick={() => onSave(row, numericQty, status)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
