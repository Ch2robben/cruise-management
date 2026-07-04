import { useEffect, useMemo, useRef, useState } from 'react'
import { X, Save, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import type { Port } from '@/types'
import { navigationTimeStore, type NavigationTimePair } from '@/mock/navigationTimeStore'
import { RIVER_REACH_LABEL } from '@/utils/constants'
import { getPortMileagePosition } from '@/mock/yangtzeRiverMileage'

interface Props {
  open: boolean
  ports: Port[]
  onClose: () => void
}

// ────────────────────────────────────────────────────────────
// 常量 & 工具
// ────────────────────────────────────────────────────────────

/** 总分钟 → { h, m } */
function toHM(totalMin: number): { h: number; m: number } {
  const safe = Math.max(0, Math.round(totalMin))
  return { h: Math.floor(safe / 60), m: safe % 60 }
}

/** { h, m } → 总分钟 */
function fromHM(h: number, m: number): number {
  return Math.max(0, h) * 60 + Math.max(0, m)
}
const REACH_ORDER = ['upstream', 'middle', 'lower', 'estuary'] as const
type ReachKey = typeof REACH_ORDER[number]

const REACH_SUBTITLE: Record<ReachKey, string> = {
  upstream: '重庆 → 宜昌',
  middle:   '宜昌 → 武汉',
  lower:    '武汉 → 吴淞口',
  estuary:  '吴淞口 → 国客中心',
}

const REACH_COLOR: Record<ReachKey, { badge: string; dot: string; header: string }> = {
  upstream: { badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500',   header: 'bg-blue-50'   },
  middle:   { badge: 'bg-green-100 text-green-700', dot: 'bg-green-500',  header: 'bg-green-50'  },
  lower:    { badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500', header: 'bg-purple-50' },
  estuary:  { badge: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400',   header: 'bg-gray-50'   },
}

interface PortPair {
  key: string          // `${fromId}->${toId}`
  from: Port
  to: Port
  distanceKm: number | null
}

interface ReachGroup {
  reach: ReachKey
  label: string
  subtitle: string
  pairs: PortPair[]
}

function buildGroups(ports: Port[]): ReachGroup[] {
  const byReach: Record<string, Port[]> = {}
  for (const port of ports) {
    const reach = (port.riverReach ?? 'upstream') as ReachKey
    if (!byReach[reach]) byReach[reach] = []
    byReach[reach].push(port)
  }

  return REACH_ORDER
    .filter((reach) => (byReach[reach]?.length ?? 0) > 1)
    .map((reach) => {
      const sorted = [...(byReach[reach] ?? [])].sort(
        (a, b) => (a.riverSort ?? a.sort) - (b.riverSort ?? b.sort),
      )
      const pairs: PortPair[] = []
      for (let i = 0; i < sorted.length - 1; i++) {
        const from = sorted[i]
        const to   = sorted[i + 1]
        const fromKm = getPortMileagePosition(from.id)
        const toKm   = getPortMileagePosition(to.id)
        const distanceKm = fromKm != null && toKm != null ? Math.abs(toKm - fromKm) : null
        pairs.push({ key: `${from.id}->${to.id}`, from, to, distanceKm })
      }
      return {
        reach,
        label: RIVER_REACH_LABEL[reach] ?? reach,
        subtitle: REACH_SUBTITLE[reach],
        pairs,
      }
    })
}

// ────────────────────────────────────────────────────────────
// 组件
// ────────────────────────────────────────────────────────────
export default function NavigationTimeDialog({ open, ports, onClose }: Props) {
  // draft: key → { downstreamMin, upstreamMin }
  const [draft, setDraft] = useState<Record<string, { downstreamMin: number; upstreamMin: number }>>({})
  const [collapsed, setCollapsed] = useState<Record<ReachKey, boolean>>({
    upstream: false, middle: false, lower: false, estuary: false,
  })
  const [saved, setSaved] = useState(false)
  const initialized = useRef(false)

  const groups = useMemo(() => buildGroups(ports), [ports])

  // 初始化 draft
  useEffect(() => {
    if (!open) return
    if (initialized.current) return
    initialized.current = true

    navigationTimeStore.seedFromPorts(ports)

    const initial: typeof draft = {}
    for (const group of groups) {
      for (const pair of group.pairs) {
        const stored = navigationTimeStore.get(pair.from.id, pair.to.id)
        initial[pair.key] = {
          downstreamMin: stored?.downstreamMin ?? pair.from.nextPierDownstreamMin ?? 0,
          upstreamMin:   stored?.upstreamMin   ?? pair.to.prevPierUpstreamMin   ?? 0,
        }
      }
    }
    setDraft(initial)
  }, [open, groups, ports])

  const handleSave = () => {
    const pairs: NavigationTimePair[] = []
    for (const [key, val] of Object.entries(draft)) {
      const [fromId, toId] = key.split('->')
      const fromPort = ports.find((p) => p.id === fromId)
      const toPort   = ports.find((p) => p.id === toId)
      if (!fromPort || !toPort) continue
      pairs.push({
        fromPortId: fromId, toPortId: toId,
        fromPortName: fromPort.name, toPortName: toPort.name,
        downstreamMin: val.downstreamMin,
        upstreamMin:   val.upstreamMin,
      })
    }
    navigationTimeStore.setMany(pairs)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClose = () => {
    initialized.current = false
    setDraft({})
    onClose()
  }

  const toggleCollapse = (reach: ReachKey) => {
    setCollapsed((prev) => ({ ...prev, [reach]: !prev[reach] }))
  }

  const setHM = (
    key: string,
    field: 'downstreamMin' | 'upstreamMin',
    part: 'h' | 'm',
    raw: string,
  ) => {
    const num = raw === '' ? 0 : Math.max(0, Number(raw))
    setDraft((prev) => {
      const cur = prev[key] ?? { downstreamMin: 0, upstreamMin: 0 }
      const { h, m } = toHM(cur[field])
      const newH = part === 'h' ? num : h
      const newM = part === 'm' ? Math.min(59, num) : m
      return { ...prev, [key]: { ...cur, [field]: fromHM(newH, newM) } }
    })
  }

  if (!open) return null

  const totalPairs = groups.reduce((acc, g) => acc + g.pairs.length, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      {/* Panel */}
      <div className="relative flex flex-col bg-white rounded-xl shadow-2xl w-[860px] max-h-[88vh] overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-semibold text-gray-900">航行时间配置</h2>
              <p className="text-xs text-gray-400 mt-0.5">共 {totalPairs} 个区间 · 时间单位：分钟</p>
            </div>
          </div>
          <button onClick={handleClose} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Column legend ── */}
        <div className="flex items-center gap-6 px-6 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 flex-shrink-0">
          <span>距离(km)：物理里程，上下水方向相同，只读</span>
          <span className="text-blue-600">↓ 下水时间：顺流（重庆→上海），可编辑</span>
          <span className="text-orange-500">↑ 上水时间：逆流（上海→重庆），可编辑</span>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          {groups.map((group) => {
            const color = REACH_COLOR[group.reach]
            const isCollapsed = collapsed[group.reach]
            return (
              <div key={group.reach} className="border-b border-gray-100 last:border-b-0">

                {/* Section header */}
                <button
                  type="button"
                  onClick={() => toggleCollapse(group.reach)}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-left hover:brightness-95 transition ${color.header}`}
                >
                  {isCollapsed
                    ? <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    : <ChevronDown  className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  }
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color.badge}`}>
                    {group.label}
                  </span>
                  <span className="text-sm text-gray-600">{group.subtitle}</span>
                  <span className="ml-auto text-xs text-gray-400">{group.pairs.length} 个区间</span>
                </button>

                {/* Table */}
                {!isCollapsed && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-white">
                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 w-[40%]">区间</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 w-[15%]">距离(km)</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-blue-500 w-[22%]">↓ 下水时间</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-orange-500 w-[22%]">↑ 上水时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {group.pairs.map((pair, idx) => {
                        const val = draft[pair.key] ?? { downstreamMin: 0, upstreamMin: 0 }
                        return (
                          <tr key={pair.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                            {/* 区间 */}
                            <td className="px-6 py-2.5">
                              <div className="flex items-center gap-2 text-xs text-gray-700">
                                <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${color.dot}`} />
                                <span className="font-medium">{pair.from.name}</span>
                                <span className="text-gray-300">→</span>
                                <span className="font-medium">{pair.to.name}</span>
                              </div>
                            </td>
                            {/* 距离 只读 */}
                            <td className="px-4 py-2.5 text-center">
                              <span className="inline-block rounded bg-gray-100 px-2.5 py-1 text-xs font-mono text-gray-600">
                                {pair.distanceKm != null ? pair.distanceKm.toFixed(0) : '—'}
                              </span>
                            </td>
                            {/* 下水时间 h+m */}
                            <td className="px-4 py-2.5">
                              {(() => {
                                const { h, m } = toHM(val.downstreamMin)
                                return (
                                  <div className="flex items-center justify-center gap-1">
                                    <input
                                      type="number" min={0}
                                      value={h || ''}
                                      onChange={(e) => setHM(pair.key, 'downstreamMin', 'h', e.target.value)}
                                      placeholder="0"
                                      className="w-12 rounded border border-blue-200 bg-blue-50 px-1.5 py-1 text-center text-xs text-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                    />
                                    <span className="text-xs text-gray-400">时</span>
                                    <input
                                      type="number" min={0} max={59}
                                      value={m || ''}
                                      onChange={(e) => setHM(pair.key, 'downstreamMin', 'm', e.target.value)}
                                      placeholder="0"
                                      className="w-12 rounded border border-blue-200 bg-blue-50 px-1.5 py-1 text-center text-xs text-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                    />
                                    <span className="text-xs text-gray-400">分</span>
                                  </div>
                                )
                              })()}
                            </td>
                            {/* 上水时间 h+m */}
                            <td className="px-4 py-2.5">
                              {(() => {
                                const { h, m } = toHM(val.upstreamMin)
                                return (
                                  <div className="flex items-center justify-center gap-1">
                                    <input
                                      type="number" min={0}
                                      value={h || ''}
                                      onChange={(e) => setHM(pair.key, 'upstreamMin', 'h', e.target.value)}
                                      placeholder="0"
                                      className="w-12 rounded border border-orange-200 bg-orange-50 px-1.5 py-1 text-center text-xs text-orange-800 focus:outline-none focus:ring-1 focus:ring-orange-400"
                                    />
                                    <span className="text-xs text-gray-400">时</span>
                                    <input
                                      type="number" min={0} max={59}
                                      value={m || ''}
                                      onChange={(e) => setHM(pair.key, 'upstreamMin', 'm', e.target.value)}
                                      placeholder="0"
                                      className="w-12 rounded border border-orange-200 bg-orange-50 px-1.5 py-1 text-center text-xs text-orange-800 focus:outline-none focus:ring-1 focus:ring-orange-400"
                                    />
                                    <span className="text-xs text-gray-400">分</span>
                                  </div>
                                )
                              })()}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )
          })}

          {groups.length === 0 && (
            <div className="flex items-center justify-center py-20 text-sm text-gray-400">
              暂无码头数据，请先添加码头并设置江段。
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <p className="text-xs text-gray-400">修改后点击「保存配置」生效，关闭弹窗不自动保存。</p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              关闭
            </button>
            <button
              onClick={handleSave}
              className={`inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-medium text-white shadow-sm transition
                ${saved ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              <Save className="h-4 w-4" />
              {saved ? '已保存 ✓' : '保存配置'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
