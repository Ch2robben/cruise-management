import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Download, Pencil, Plus, Route, Trash2 } from 'lucide-react'
import { attractionApi, portApi, portDistanceApi } from '@/mock/api'
import type { Attraction, Port, PortDistance } from '@/types'
import PageHeader from '@/components/common/PageHeader'
import { formatDateTime, generateId } from '@/utils/format'

interface ItinerarySegment {
  id: string
  fromPortId: string
  toPortId: string
  departureTime: string
  speedKmH: number
  attractionIds: string[]
  remark: string
}

interface ItineraryPlan {
  id: string
  code: string
  name: string
  segments: ItinerarySegment[]
  updatedAt: string
  updatedBy: string
}

interface SegmentView {
  segment: ItinerarySegment
  index: number
  distance?: PortDistance
  distanceSource: 'exact' | 'reverse' | 'none'
  sailingMinutes: number
  arrivalTime: string
  stopoverMinutes?: number
  attractions: Attraction[]
  attractionMinutes: number
  enoughForAttraction?: boolean
  chained: boolean
}

interface PlanMetrics {
  rows: SegmentView[]
  totalDistance: number
  totalSailingMinutes: number
  checkedCount: number
  passedCount: number
}

const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900'
const speedOptions = [14, 16, 18, 20, 22]

const demoSegments: ItinerarySegment[] = [
  { id: 'seg01', fromPortId: 'p10', toPortId: 'p02', departureTime: '08:00', speedKmH: 18, attractionIds: ['a02'], remark: '首日重庆启航，抵达涪陵后安排白鹤梁参观。' },
  { id: 'seg02', fromPortId: 'p02', toPortId: 'p03', departureTime: '20:00', speedKmH: 18, attractionIds: ['a03'], remark: '夜航至丰都，次日上午安排名山景区。' },
  { id: 'seg03', fromPortId: 'p03', toPortId: 'p07', departureTime: '14:00', speedKmH: 18, attractionIds: ['a07'], remark: '丰都出发前往奉节。' },
]

const emptySegment = (fromPortId = ''): ItinerarySegment => ({
  id: generateId(),
  fromPortId,
  toPortId: '',
  departureTime: '',
  speedKmH: 18,
  attractionIds: [],
  remark: '',
})

const initialPlans: ItineraryPlan[] = [
  {
    id: 'itn01',
    code: 'ITN-20260515-CQYC',
    name: '重庆至宜昌三峡示例行程',
    segments: demoSegments,
    updatedAt: '2026-05-01T09:30:00',
    updatedBy: '系统管理员',
  },
]

const minutesToText = (minutes?: number) => {
  if (minutes === undefined || Number.isNaN(minutes)) return '-'
  if (minutes < 0) return '时间倒挂'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest}分钟`
  return rest ? `${hours}小时${rest}分钟` : `${hours}小时`
}

const timeToMinutes = (value: string) => {
  const [hour, minute] = value.split(':').map(Number)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return undefined
  return hour * 60 + minute
}

const addMinutesToClock = (timeValue: string, minutes: number) => {
  const start = timeToMinutes(timeValue)
  if (start === undefined) return undefined
  return start + minutes
}

const minutesToClock = (minutes?: number) => {
  if (minutes === undefined || Number.isNaN(minutes)) return '-'
  const normalized = ((minutes % 1440) + 1440) % 1440
  const dayOffset = Math.floor(minutes / 1440)
  const hour = String(Math.floor(normalized / 60)).padStart(2, '0')
  const minute = String(normalized % 60).padStart(2, '0')
  return `${hour}:${minute}${dayOffset > 0 ? ` +${dayOffset}天` : ''}`
}

const diffClockMinutes = (startAbsMinutes?: number, endClock?: string) => {
  if (startAbsMinutes === undefined || !endClock) return undefined
  const end = timeToMinutes(endClock)
  if (end === undefined) return undefined
  const startDay = Math.floor(startAbsMinutes / 1440)
  let endAbs = startDay * 1440 + end
  while (endAbs < startAbsMinutes) endAbs += 1440
  return endAbs - startAbsMinutes
}

const safeText = (value: unknown) => String(value ?? '-')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

export default function ItineraryManagementPage() {
  const [ports, setPorts] = useState<Port[]>([])
  const [distances, setDistances] = useState<PortDistance[]>([])
  const [attractions, setAttractions] = useState<Attraction[]>([])
  const [plans, setPlans] = useState<ItineraryPlan[]>(initialPlans)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftSegments, setDraftSegments] = useState<ItinerarySegment[]>([])
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    portApi.list({ pageSize: 100 }).then((result) => setPorts(result.data))
    portDistanceApi.list({ pageSize: 100 }).then((result) => setDistances(result.data))
    attractionApi.list({ pageSize: 100 }).then((result) => setAttractions(result.data))
  }, [])

  const portMap = useMemo(() => new Map(ports.map((port) => [port.id, port])), [ports])
  const attractionMap = useMemo(() => new Map(attractions.map((item) => [item.id, item])), [attractions])

  const getDistance = (fromPortId: string, toPortId: string) => {
    const exact = distances.find((item) => item.fromPortId === fromPortId && item.toPortId === toPortId && item.status === 'enabled')
    if (exact) return { distance: exact, source: 'exact' as const }
    const reverse = distances.find((item) => item.fromPortId === toPortId && item.toPortId === fromPortId && item.status === 'enabled')
    if (reverse) return { distance: reverse, source: 'reverse' as const }
    return { distance: undefined, source: 'none' as const }
  }

  const buildMetrics = (segments: ItinerarySegment[]): PlanMetrics => {
    const rows: SegmentView[] = segments.map((segment, index) => {
      const { distance, source } = getDistance(segment.fromPortId, segment.toPortId)
      const sailingMinutes = distance && segment.speedKmH > 0
        ? Math.round((distance.distanceKm / segment.speedKmH) * 60)
        : 0
      const arrivalMinutes = addMinutesToClock(segment.departureTime, sailingMinutes)
      const nextSegment = segments[index + 1]
      const stopoverMinutes = nextSegment ? diffClockMinutes(arrivalMinutes, nextSegment.departureTime) : undefined
      const selectedAttractions = segment.attractionIds
        .map((id) => attractionMap.get(id))
        .filter((item): item is Attraction => Boolean(item))
      const attractionMinutes = selectedAttractions.reduce(
        (sum, item) => sum + (item.suggestedDurationMin || 0) + (item.transferDurationMin || 0) * 2,
        0,
      )
      const enoughForAttraction = selectedAttractions.length > 0 && stopoverMinutes !== undefined ? stopoverMinutes >= attractionMinutes : undefined

      return {
        segment,
        index,
        distance,
        distanceSource: source,
        sailingMinutes,
        arrivalTime: minutesToClock(arrivalMinutes),
        stopoverMinutes,
        attractions: selectedAttractions,
        attractionMinutes,
        enoughForAttraction,
        chained: !nextSegment || nextSegment.fromPortId === segment.toPortId,
      }
    })

    const checkedRows = rows.filter((row) => row.attractions.length > 0 && row.stopoverMinutes !== undefined)
    return {
      rows,
      totalDistance: rows.reduce((sum, row) => sum + (row.distance?.distanceKm || 0), 0),
      totalSailingMinutes: rows.reduce((sum, row) => sum + row.sailingMinutes, 0),
      checkedCount: checkedRows.length,
      passedCount: checkedRows.filter((row) => row.enoughForAttraction).length,
    }
  }

  const draftMetrics = buildMetrics(draftSegments)

  const filteredPlans = plans.filter((plan) => {
    const text = `${plan.name} ${plan.code}`.toLowerCase()
    return !keyword.trim() || text.includes(keyword.trim().toLowerCase())
  })

  const openCreate = () => {
    setEditingPlanId(null)
    setDraftName('新建行程方案')
    setDraftSegments([emptySegment()])
  }

  const openEdit = (plan: ItineraryPlan) => {
    setEditingPlanId(plan.id)
    setDraftName(plan.name)
    setDraftSegments(plan.segments.map((segment) => ({ ...segment })))
  }

  const closeEditor = () => {
    setEditingPlanId(null)
    setDraftName('')
    setDraftSegments([])
  }

  const saveDraft = () => {
    const now = new Date().toISOString()
    if (editingPlanId) {
      setPlans((current) => current.map((plan) => plan.id === editingPlanId
        ? { ...plan, name: draftName || plan.name, segments: draftSegments, updatedAt: now, updatedBy: '当前用户' }
        : plan))
    } else {
      setPlans((current) => [{
        id: generateId(),
        code: `ITN-${new Date().getTime().toString().slice(-8)}`,
        name: draftName || '新建行程方案',
        segments: draftSegments,
        updatedAt: now,
        updatedBy: '当前用户',
      }, ...current])
    }
    closeEditor()
  }

  const removePlan = (id: string) => {
    setPlans((current) => current.filter((plan) => plan.id !== id))
  }

  const updateSegment = (id: string, patch: Partial<ItinerarySegment>) => {
    setDraftSegments((current) => {
      const next = current.map((segment) => segment.id === id ? { ...segment, ...patch } : segment)
      const changedIndex = next.findIndex((segment) => segment.id === id)
      if (patch.toPortId && changedIndex >= 0 && next[changedIndex + 1]) {
        next[changedIndex + 1] = { ...next[changedIndex + 1], fromPortId: patch.toPortId }
      }
      return next
    })
  }

  const addSegment = () => {
    const last = draftSegments[draftSegments.length - 1]
    setDraftSegments([...draftSegments, emptySegment(last?.toPortId || '')])
  }

  const removeSegment = (id: string) => {
    setDraftSegments(draftSegments.filter((segment) => segment.id !== id))
  }

  const addAttraction = (segmentId: string) => {
    setDraftSegments((current) => current.map((segment) => segment.id === segmentId
      ? { ...segment, attractionIds: [...segment.attractionIds, ''] }
      : segment))
  }

  const updateAttraction = (segmentId: string, attractionIndex: number, attractionId: string) => {
    setDraftSegments((current) => current.map((segment) => {
      if (segment.id !== segmentId) return segment
      return {
        ...segment,
        attractionIds: segment.attractionIds.map((id, index) => index === attractionIndex ? attractionId : id),
      }
    }))
  }

  const removeAttraction = (segmentId: string, attractionIndex: number) => {
    setDraftSegments((current) => current.map((segment) => segment.id === segmentId
      ? { ...segment, attractionIds: segment.attractionIds.filter((_, index) => index !== attractionIndex) }
      : segment))
  }

  const attractionOptionsForPort = (portId: string) => attractions.filter((item) => item.portId === portId)

  const exportPdf = (planName: string, metrics: PlanMetrics) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const rows = metrics.rows.map((row) => {
      const fromPortName = portMap.get(row.segment.fromPortId)?.name || '未选起点'
      const toPortName = portMap.get(row.segment.toPortId)?.name || '未选终点'
      const resultText = row.enoughForAttraction === undefined
        ? '未判断'
        : row.enoughForAttraction
          ? '合理'
          : '不合理'

      return `
        <tr>
          <td>${row.index + 1}</td>
          <td>${safeText(fromPortName)}</td>
          <td>${safeText(toPortName)}</td>
          <td>${safeText(row.segment.departureTime || '-')}</td>
          <td>${safeText(row.distance ? `${row.distance.distanceKm} km` : '未维护')}</td>
          <td>${safeText(`${row.segment.speedKmH} km/h`)}</td>
          <td>${safeText(minutesToText(row.sailingMinutes))}</td>
          <td>${safeText(row.arrivalTime || '-')}</td>
          <td>${safeText(row.attractions.map((item) => item.name).join('、') || '-')}</td>
          <td>${safeText(minutesToText(row.attractions.length > 0 ? row.attractionMinutes : undefined))}</td>
          <td>${safeText(minutesToText(row.stopoverMinutes))}</td>
          <td class="${resultText === '合理' ? 'ok' : resultText === '不合理' ? 'bad' : ''}">${resultText}</td>
          <td>${safeText(row.segment.remark || '-')}</td>
        </tr>
      `
    }).join('')

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${safeText(planName)} PDF</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 28px; color: #111827; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; }
            h1 { margin: 0; font-size: 24px; }
            .sub { margin-top: 8px; color: #6b7280; font-size: 13px; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 24px 0; }
            .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; background: #f9fafb; }
            .label { color: #6b7280; font-size: 12px; }
            .value { margin-top: 6px; font-size: 20px; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 11px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; vertical-align: top; word-break: break-word; }
            th { background: #f3f4f6; font-weight: 700; }
            .ok { color: #047857; font-weight: 700; }
            .bad { color: #dc2626; font-weight: 700; }
            .footer { margin-top: 18px; color: #9ca3af; font-size: 11px; }
            @page { size: A4 landscape; margin: 12mm; }
          </style>
        </head>
        <body>
          <h1>${safeText(planName)}</h1>
          <div class="sub">生成时间：${safeText(new Date().toLocaleString('zh-CN'))}</div>
          <div class="summary">
            <div class="card"><div class="label">航段数量</div><div class="value">${metrics.rows.length}</div></div>
            <div class="card"><div class="label">航行距离合计</div><div class="value">${metrics.totalDistance} km</div></div>
            <div class="card"><div class="label">航行时间合计</div><div class="value">${safeText(minutesToText(metrics.totalSailingMinutes))}</div></div>
            <div class="card"><div class="label">景点停泊判断</div><div class="value">${metrics.passedCount}/${metrics.checkedCount || 0}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 38px;">序号</th>
                <th>起始码头</th>
                <th>下个码头</th>
                <th>启航时间</th>
                <th>距离</th>
                <th>航速</th>
                <th>航行时间</th>
                <th>到达时间</th>
                <th>景点</th>
                <th>景点所需</th>
                <th>停泊时间</th>
                <th>判断</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="footer">说明：景点所需时间 = 游览时长 + 往返接驳时间；停泊时间 = 本段到达后至下一航段启航前。</div>
          <script>window.onload = function () { window.print(); };</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  if (draftSegments.length > 0) {
    return (
      <div>
        <PageHeader title={editingPlanId ? '编辑行程方案' : '新增行程方案'} description="按航段维护启航时间、航速和到达时间，并结合景点游览时长判断停泊安排是否合理。" />

        <div className="bg-white px-9 py-6">
          <div className="mb-5 flex items-end justify-between gap-6">
            <div className="w-96">
              <label className="mb-1 block text-xs text-gray-500">行程方案名称</label>
              <input value={draftName} onChange={(event) => setDraftName(event.target.value)} className={inputClass} />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={closeEditor} className="inline-flex h-10 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                <ArrowLeft className="h-4 w-4" /> 返回列表
              </button>
              <button onClick={() => exportPdf(draftName || '行程方案', draftMetrics)} className="inline-flex h-10 items-center gap-1.5 rounded-md bg-gray-900 px-5 text-sm font-medium text-white transition hover:bg-gray-800">
                <Download className="h-4 w-4" /> 导出PDF文档
              </button>
              <button disabled title="原型阶段暂不实现生成航线" className="inline-flex h-10 cursor-not-allowed items-center gap-1.5 rounded-md border border-gray-200 bg-gray-100 px-5 text-sm font-medium text-gray-400">
                <Route className="h-4 w-4" /> 生成航线
              </button>
              <button onClick={saveDraft} className="inline-flex h-10 items-center rounded-md bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700">保存</button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4">
              <p className="text-xs text-gray-500">航段数量</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{draftSegments.length}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4">
              <p className="text-xs text-gray-500">航行距离合计</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{draftMetrics.totalDistance} km</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4">
              <p className="text-xs text-gray-500">航行时间合计</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{minutesToText(draftMetrics.totalSailingMinutes)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4">
              <p className="text-xs text-gray-500">景点停泊判断</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{draftMetrics.passedCount}/{draftMetrics.checkedCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white px-9 pb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">航段编排</h3>
              <p className="mt-1 text-xs text-gray-500">到达时间由距离库距离和本航段航速自动计算；停泊时间取本段到达后到下一段启航前的时间。</p>
            </div>
            <button onClick={addSegment} className="inline-flex h-10 items-center gap-1.5 rounded-md bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700">
              <Plus className="h-4 w-4" /> 添加航段
            </button>
          </div>

          <div className="space-y-4">
            {draftMetrics.rows.map((row) => {
              const { segment, distance, distanceSource, attractions: selectedAttractions, attractionMinutes, enoughForAttraction, stopoverMinutes } = row
              const attractionOptions = attractionOptionsForPort(segment.toPortId)
              return (
                <div key={segment.id} className="rounded-lg border border-gray-200 bg-white">
                  <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">航段 {row.index + 1}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {portMap.get(segment.fromPortId)?.name || '未选起点'} → {portMap.get(segment.toPortId)?.name || '未选终点'}
                      </p>
                    </div>
                    <button onClick={() => removeSegment(segment.id)} disabled={draftSegments.length <= 1} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">
                      <Trash2 className="h-3.5 w-3.5" /> 删除
                    </button>
                  </div>

                  <div className="grid grid-cols-12 gap-4 px-5 py-4">
                    <div className="col-span-3">
                      <label className="mb-1 block text-xs text-gray-500">起始码头</label>
                      <select value={segment.fromPortId} onChange={(event) => updateSegment(segment.id, { fromPortId: event.target.value, attractionIds: [] })} className={inputClass}>
                        <option value="">请选择</option>
                        {ports.map((port) => <option key={port.id} value={port.id}>{port.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <label className="mb-1 block text-xs text-gray-500">下个码头</label>
                      <select value={segment.toPortId} onChange={(event) => updateSegment(segment.id, { toPortId: event.target.value, attractionIds: [] })} className={inputClass}>
                        <option value="">请选择</option>
                        {ports.map((port) => <option key={port.id} value={port.id}>{port.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <label className="mb-1 block text-xs text-gray-500">启航时间</label>
                      <input type="time" value={segment.departureTime} onChange={(event) => updateSegment(segment.id, { departureTime: event.target.value })} className={inputClass} />
                    </div>
                    <div className="col-span-3">
                      <label className="mb-1 block text-xs text-gray-500">航行速度</label>
                      <select value={segment.speedKmH} onChange={(event) => updateSegment(segment.id, { speedKmH: Number(event.target.value) })} className={inputClass}>
                        {speedOptions.map((speed) => <option key={speed} value={speed}>{speed} km/h</option>)}
                        {distance?.speedKmH && !speedOptions.includes(distance.speedKmH) && <option value={distance.speedKmH}>{distance.speedKmH} km/h</option>}
                      </select>
                    </div>

                    <div className="col-span-3 rounded-lg bg-blue-50 px-4 py-3">
                      <p className="text-xs text-blue-500">距离库匹配</p>
                      <p className="mt-1 text-sm font-semibold text-blue-700">{distance ? `${distance.distanceKm} km` : '未维护距离'}</p>
                      <p className="mt-1 text-xs text-blue-500">
                        {distanceSource === 'exact' ? '正向匹配' : distanceSource === 'reverse' ? '反向参考' : '请先维护码头距离库'}
                      </p>
                    </div>
                    <div className="col-span-3 rounded-lg bg-gray-50 px-4 py-3">
                      <p className="text-xs text-gray-500">预计航行时间</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{minutesToText(row.sailingMinutes)}</p>
                      <p className="mt-1 text-xs text-gray-500">按当前航速计算</p>
                    </div>
                    <div className="col-span-3 rounded-lg bg-gray-50 px-4 py-3">
                      <p className="text-xs text-gray-500">预计到达时间</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{row.arrivalTime || '-'}</p>
                      <p className="mt-1 text-xs text-gray-500">{row.chained ? '下一航段衔接正常' : '下一段起点与本段终点不一致'}</p>
                    </div>
                    <div className="col-span-3 rounded-lg bg-gray-50 px-4 py-3">
                      <p className="text-xs text-gray-500">抵达后停泊时间</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{minutesToText(stopoverMinutes)}</p>
                      <p className="mt-1 text-xs text-gray-500">到下一航段启航前</p>
                    </div>

                    <div className="col-span-4">
                      <div className="mb-1 flex items-center justify-between">
                        <label className="block text-xs text-gray-500">对应景点</label>
                        <button type="button" onClick={() => addAttraction(segment.id)} className="rounded px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50">+ 新增景点</button>
                      </div>
                      <div className="space-y-2">
                        {segment.attractionIds.length === 0 ? (
                          <div className="flex h-10 items-center rounded-lg border border-dashed border-gray-300 px-3 text-sm text-gray-400">未安排景点</div>
                        ) : segment.attractionIds.map((attractionId, attractionIndex) => (
                          <div key={`${segment.id}-${attractionIndex}`} className="flex items-center gap-2">
                            <select value={attractionId} onChange={(event) => updateAttraction(segment.id, attractionIndex, event.target.value)} className={inputClass}>
                              <option value="">请选择景点</option>
                              {attractionOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </select>
                            <button type="button" onClick={() => removeAttraction(segment.id, attractionIndex)} className="shrink-0 rounded px-2 py-2 text-xs text-red-600 hover:bg-red-50">删除</button>
                          </div>
                        ))}
                      </div>
                      {segment.toPortId && attractionOptions.length === 0 && (
                        <p className="mt-1 text-xs text-amber-600">该码头暂无可选景点。</p>
                      )}
                    </div>
                    <div className="col-span-4">
                      <label className="mb-1 block text-xs text-gray-500">景点所需时间</label>
                      <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700">
                        {selectedAttractions.length > 0 ? `${minutesToText(attractionMinutes)}（共 ${selectedAttractions.length} 个景点）` : '-'}
                      </div>
                    </div>
                    <div className="col-span-4">
                      <label className="mb-1 block text-xs text-gray-500">合理性判断</label>
                      <div className={`flex h-10 items-center rounded-lg px-3 text-sm font-medium ${
                        enoughForAttraction === undefined
                          ? 'border border-gray-200 bg-gray-50 text-gray-500'
                          : enoughForAttraction
                            ? 'border border-emerald-100 bg-emerald-50 text-emerald-700'
                            : 'border border-red-100 bg-red-50 text-red-700'
                      }`}>
                        {enoughForAttraction === undefined ? '等待选择景点或下一航段' : enoughForAttraction ? '合理，停泊时间充足' : '不合理，停泊时间不足'}
                      </div>
                    </div>

                    <div className="col-span-12">
                      <label className="mb-1 block text-xs text-gray-500">备注</label>
                      <input value={segment.remark} onChange={(event) => updateSegment(segment.id, { remark: event.target.value })} className={inputClass} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="行程管理" description="管理行程方案列表，并在新增/编辑中按航段计算到达时间和景点停泊合理性。" />

      <div className="bg-white px-9 py-6">
        <div className="mb-5 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500">关键词</label>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="行程名称/编号"
              className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <button onClick={() => setKeyword('')} className="h-10 rounded-md border border-gray-300 bg-white px-5 text-sm text-gray-600 transition hover:bg-gray-50">重置</button>
          <button onClick={openCreate} className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-md bg-blue-600 px-6 text-sm font-medium text-white transition hover:bg-blue-700">
            <Plus className="h-4 w-4" /> 新增行程
          </button>
        </div>

        <div className="overflow-hidden border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50">
                  {['行程名称', '起止码头', '航段数', '总距离', '总航行时间', '景点判断', '修改信息', '操作'].map((header) => (
                    <th key={header} className="border-b border-r border-gray-200 px-4 py-4 text-left text-[15px] font-semibold text-gray-800 last:border-r-0">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-sm text-gray-400">暂无行程方案</td>
                  </tr>
                ) : filteredPlans.map((plan) => {
                  const metrics = buildMetrics(plan.segments)
                  const firstSegment = plan.segments[0]
                  const lastSegment = plan.segments[plan.segments.length - 1]
                  return (
                    <tr key={plan.id} className="transition hover:bg-gray-50">
                      <td className="border-b border-r border-gray-200 px-4 py-5 text-sm">
                        <p className="font-medium text-gray-900">{plan.name}</p>
                        <p className="mt-1 text-xs text-gray-500">{plan.code}</p>
                      </td>
                      <td className="border-b border-r border-gray-200 px-4 py-5 text-sm text-gray-700">
                        {portMap.get(firstSegment?.fromPortId || '')?.name || '-'} → {portMap.get(lastSegment?.toPortId || '')?.name || '-'}
                      </td>
                      <td className="border-b border-r border-gray-200 px-4 py-5 text-sm text-gray-700">{plan.segments.length}</td>
                      <td className="border-b border-r border-gray-200 px-4 py-5 text-sm text-gray-700">{metrics.totalDistance} km</td>
                      <td className="border-b border-r border-gray-200 px-4 py-5 text-sm text-gray-700">{minutesToText(metrics.totalSailingMinutes)}</td>
                      <td className="border-b border-r border-gray-200 px-4 py-5 text-sm">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          metrics.checkedCount === 0
                            ? 'bg-gray-100 text-gray-500'
                            : metrics.passedCount === metrics.checkedCount
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                        }`}>
                          {metrics.passedCount}/{metrics.checkedCount || 0}
                        </span>
                      </td>
                      <td className="border-b border-r border-gray-200 px-4 py-5 text-sm text-gray-700">
                        <p>{plan.updatedBy}</p>
                        <p className="mt-1 text-xs text-gray-500">{formatDateTime(plan.updatedAt)}</p>
                      </td>
                      <td className="border-b border-gray-200 px-4 py-5 text-sm">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(plan)} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                            <Pencil className="h-3.5 w-3.5" /> 编辑
                          </button>
                          <button onClick={() => exportPdf(plan.name, metrics)} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                            <Download className="h-3.5 w-3.5" /> PDF
                          </button>
                          <button disabled title="原型阶段暂不实现生成航线" className="inline-flex cursor-not-allowed items-center gap-1 rounded px-2 py-1 text-xs text-gray-400">
                            <Route className="h-3.5 w-3.5" /> 生成航线
                          </button>
                          <button onClick={() => removePlan(plan.id)} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700">
                            <Trash2 className="h-3.5 w-3.5" /> 删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
