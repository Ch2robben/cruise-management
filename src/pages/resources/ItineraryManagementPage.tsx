import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Package, Plus } from 'lucide-react'
import { attractionApi, portApi, routeApi } from '@/mock/api'
import { listItineraryPlans, saveItineraryPlans } from '@/mock/itineraryPlanStore'
import { resolveMileageDistance, sortPortsByRiver } from '@/mock/yangtzeRiverMileage'
import type { Attraction, ItineraryPlan, ItineraryPlanSegment, Port, PortDistance, RiverReach, Route, TemplateItinerary } from '@/types'
import { RIVER_REACH_LABEL, RIVER_REACH_OPTIONS } from '@/utils/constants'
import { formatDurationMinutes } from '@/utils/format'
import { flattenSegmentActivities } from '@/utils/itinerarySchedule'
import { buildSegmentsFromRoute, mergeRouteSegmentsWithConfig } from '@/utils/routeItinerarySegments'
import ItineraryEditor, { formatItineraryDayLabel, getItineraryDayOptions } from '@/components/voyage/ItineraryEditor'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import DetailDrawer from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import FormDialog from '@/components/common/FormDialog'
import { formatDateTime, generateId } from '@/utils/format'

interface ItinerarySegment extends ItineraryPlanSegment {}

interface SegmentView {
  segment: ItinerarySegment
  index: number
  distance?: PortDistance
  distanceSource: 'mileage' | 'manual' | 'reverse' | 'none'
  mileageHint: string | null
  fromPort?: Port
  toPort?: Port
  sailingMinutes: number
  arrivalTime: string
  stopoverMinutes?: number
  attractions: Attraction[]
  attractionMinutes: number
  chained: boolean
}

interface PlanMetrics {
  rows: SegmentView[]
  totalDistance: number
  totalSailingMinutes: number
}

type GenerationTarget = 'product'

const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900'
const speedOptions = [14, 16, 18, 20, 22]

const minutesToText = (minutes?: number) => formatDurationMinutes(minutes)

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

const reachLabel = (reach?: RiverReach) => (reach ? RIVER_REACH_LABEL[reach] : '未分区')

const reachBadgeClass = (reach?: RiverReach) => {
  switch (reach) {
    case 'upstream': return 'bg-sky-50 text-sky-700'
    case 'middle': return 'bg-violet-50 text-violet-700'
    case 'lower': return 'bg-amber-50 text-amber-700'
    case 'estuary': return 'bg-rose-50 text-rose-700'
    default: return 'bg-gray-100 text-gray-500'
  }
}

const ReachBadge = ({ reach }: { reach?: RiverReach }) => (
  <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${reachBadgeClass(reach)}`}>
    {reachLabel(reach)}
  </span>
)

const planReachSummary = (segments: ItinerarySegment[], portMap: Map<string, Port>) => {
  const ids = new Set<string>()
  segments.forEach((seg) => {
    if (seg.fromPortId) ids.add(seg.fromPortId)
    if (seg.toPortId) ids.add(seg.toPortId)
  })
  const reaches = Array.from(ids)
    .map((id) => portMap.get(id)?.riverReach)
    .filter((item): item is RiverReach => Boolean(item))
  const unique = Array.from(new Set(reaches))
  return unique.map((reach) => RIVER_REACH_LABEL[reach]).join(' → ') || '-'
}

export default function ItineraryManagementPage() {
  const navigate = useNavigate()
  const [ports, setPorts] = useState<Port[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [attractions, setAttractions] = useState<Attraction[]>([])
  const [plans, setPlans] = useState<ItineraryPlan[]>(() => listItineraryPlans())
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftRouteId, setDraftRouteId] = useState('')
  const [draftSegments, setDraftSegments] = useState<ItinerarySegment[]>([])
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [reachFilter, setReachFilter] = useState('all')
  const [deletePlanId, setDeletePlanId] = useState('')
  const [viewPlan, setViewPlan] = useState<ItineraryPlan | null>(null)
  const [generationPlan, setGenerationPlan] = useState<ItineraryPlan | null>(null)
  const [generationTargets, setGenerationTargets] = useState<GenerationTarget[]>(['product'])

  useEffect(() => {
    portApi.list({ pageSize: 200 }).then((result) => setPorts(sortPortsByRiver(result.data)))
    routeApi.list({ pageSize: 100, status: 'enabled' }).then((result) => setRoutes(result.data))
    attractionApi.list({ pageSize: 100 }).then((result) => setAttractions(result.data))
  }, [])

  const portMap = useMemo(() => new Map(ports.map((port) => [port.id, port])), [ports])
  const routeMap = useMemo(() => new Map(routes.map((route) => [route.id, route])), [routes])
  const attractionMap = useMemo(() => new Map(attractions.map((item) => [item.id, item])), [attractions])

  const getDistance = (fromPortId: string, toPortId: string) => {
    const fromPort = portMap.get(fromPortId)
    const toPort = portMap.get(toPortId)
    const resolved = resolveMileageDistance(fromPort, toPort, [])
    return { distance: resolved.distance, source: resolved.source, hint: resolved.hint }
  }

  const buildMetrics = (segments: ItinerarySegment[]): PlanMetrics => {
    const rows: SegmentView[] = segments.map((segment, index) => {
      const fromPort = portMap.get(segment.fromPortId)
      const toPort = portMap.get(segment.toPortId)
      const { distance, source, hint } = getDistance(segment.fromPortId, segment.toPortId)
      const mileageHint = hint
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

      return {
        segment,
        index,
        distance,
        distanceSource: source,
        mileageHint,
        fromPort,
        toPort,
        sailingMinutes,
        arrivalTime: minutesToClock(arrivalMinutes),
        stopoverMinutes,
        attractions: selectedAttractions,
        attractionMinutes,
        chained: !nextSegment || nextSegment.fromPortId === segment.toPortId,
      }
    })

    return {
      rows,
      totalDistance: rows.reduce((sum, row) => sum + (row.distance?.distanceKm || 0), 0),
      totalSailingMinutes: rows.reduce((sum, row) => sum + row.sailingMinutes, 0),
    }
  }

  const draftMetrics = buildMetrics(draftSegments)
  const segmentDayOptions = useMemo(
    () => getItineraryDayOptions(Math.max(14, ...draftSegments.map((segment) => segment.day ?? 0))),
    [draftSegments],
  )
  const selectedRoute = draftRouteId ? routeMap.get(draftRouteId) : undefined

  const applyRouteSegments = (routeId: string, existing: ItinerarySegment[] = []) => {
    const route = routeMap.get(routeId)
    if (!route) {
      setDraftSegments([])
      return
    }
    const base = buildSegmentsFromRoute(route, ports)
    setDraftSegments(existing.length > 0 ? mergeRouteSegmentsWithConfig(base, existing) : base)
  }

  const handleRouteChange = (routeId: string) => {
    setDraftRouteId(routeId)
    applyRouteSegments(routeId, editingPlanId ? draftSegments : [])
  }

  const filteredPlans = plans.filter((plan) => {
    const text = `${plan.name} ${plan.code}`.toLowerCase()
    const keywordOk = !appliedKeyword.trim() || text.includes(appliedKeyword.trim().toLowerCase())
    if (!keywordOk) return false
    if (reachFilter === 'all') return true
    const portIds = new Set<string>()
    plan.segments.forEach((seg) => {
      if (seg.fromPortId) portIds.add(seg.fromPortId)
      if (seg.toPortId) portIds.add(seg.toPortId)
    })
    return Array.from(portIds).some((id) => portMap.get(id)?.riverReach === reachFilter)
  })

  const openCreate = () => {
    setEditorOpen(true)
    setEditingPlanId(null)
    setDraftName('新建行程方案')
    setDraftRouteId('')
    setDraftSegments([])
  }

  const openEdit = (plan: ItineraryPlan) => {
    setEditorOpen(true)
    setEditingPlanId(plan.id)
    setDraftName(plan.name)
    setDraftRouteId(plan.routeId || '')
    setDraftSegments(plan.segments.map((segment, index) => ({
      ...segment,
      passengerOnOff: segment.passengerOnOff ?? false,
      day: typeof segment.day === 'number' ? segment.day : index,
      activities: (segment.activities || []).map((item) => ({ ...item })),
    })))
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditingPlanId(null)
    setDraftName('')
    setDraftRouteId('')
    setDraftSegments([])
  }

  const syncPlans = (nextPlans: ItineraryPlan[]) => {
    saveItineraryPlans(nextPlans)
    setPlans(listItineraryPlans())
  }

  const saveDraft = () => {
    if (!draftRouteId || draftSegments.length === 0) return
    const now = new Date().toISOString()
    const schedule = flattenSegmentActivities(draftSegments)
    if (editingPlanId) {
      syncPlans(plans.map((plan) => plan.id === editingPlanId
        ? {
          ...plan,
          name: draftName || plan.name,
          routeId: draftRouteId,
          segments: draftSegments,
          schedule,
          updatedAt: now,
          updatedBy: '当前用户',
        }
        : plan))
    } else {
      syncPlans([{
        id: generateId(),
        code: `ITN-${new Date().getTime().toString().slice(-8)}`,
        name: draftName || '新建行程方案',
        routeId: draftRouteId,
        segments: draftSegments,
        schedule,
        updatedAt: now,
        updatedBy: '当前用户',
      }, ...plans])
    }
    closeEditor()
  }

  const confirmRemovePlan = () => {
    syncPlans(plans.filter((plan) => plan.id !== deletePlanId))
    setDeletePlanId('')
  }

  const goCreateProduct = (name?: string, itineraryPlanId?: string) => {
    const params = new URLSearchParams({ create: '1' })
    if (name?.trim()) params.set('name', name.trim())
    if (itineraryPlanId) params.set('itineraryPlanId', itineraryPlanId)
    navigate(`/resources/products?${params.toString()}`)
  }

  const openGeneration = (plan: ItineraryPlan) => {
    setGenerationPlan(plan)
    setGenerationTargets(['product'])
  }

  const toggleGenerationTarget = (target: GenerationTarget) => {
    setGenerationTargets((current) => current.includes(target)
      ? current.filter((item) => item !== target)
      : [...current, target])
  }

  const confirmGeneration = () => {
    if (!generationPlan || generationTargets.length === 0) return
    const name = generationPlan.name.trim()
    setGenerationPlan(null)
    goCreateProduct(name, generationPlan.id)
  }

  const updateSegment = (id: string, patch: Partial<ItinerarySegment>) => {
    setDraftSegments((current) => current.map((segment) => segment.id === id ? { ...segment, ...patch } : segment))
  }

  const updateSegmentActivities = (segmentId: string, activities: TemplateItinerary[]) => {
    updateSegment(segmentId, { activities })
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

  const exportPdf = (planName: string, metrics: PlanMetrics, schedule: TemplateItinerary[]) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const rows = metrics.rows.map((row) => {
      const fromPortName = portMap.get(row.segment.fromPortId)?.name || '未选起点'
      const toPortName = portMap.get(row.segment.toPortId)?.name || '未选终点'

      return `
        <tr>
          <td>${row.index + 1}</td>
          <td>${safeText(fromPortName)}</td>
          <td>${safeText(toPortName)}</td>
          <td>${safeText(row.fromPort?.riverReach ? RIVER_REACH_LABEL[row.fromPort.riverReach] : '-')}${row.toPort?.riverReach ? ` → ${RIVER_REACH_LABEL[row.toPort.riverReach]}` : ''}</td>
          <td>${safeText(formatItineraryDayLabel(row.segment.day ?? 0))}</td>
          <td>${safeText(row.segment.departureTime || '-')}</td>
          <td>${row.segment.passengerOnOff ? '是' : '否'}</td>
          <td>${safeText(row.distance ? `${row.distance.distanceKm} km` : '未维护')}</td>
          <td>${safeText(`${row.segment.speedKmH} km/h`)}</td>
          <td>${safeText(minutesToText(row.sailingMinutes))}</td>
          <td>${safeText(row.arrivalTime || '-')}</td>
          <td>${safeText(row.attractions.map((item) => item.name).join('、') || '-')}</td>
          <td>${safeText(minutesToText(row.attractions.length > 0 ? row.attractionMinutes : undefined))}</td>
          <td>${safeText(minutesToText(row.stopoverMinutes))}</td>
          <td>${safeText(row.segment.remark || '-')}</td>
        </tr>
      `
    }).join('')

    const scheduleRows = schedule.length === 0
      ? '<tr><td colspan="4" style="text-align:center;color:#9ca3af;">暂无活动配置</td></tr>'
      : schedule.map((row) => `
          <tr>
            <td>${safeText(row.activityCategory || '-')}</td>
            <td>${safeText(row.startTime || '-')}</td>
            <td>${safeText(row.endTime || '-')}</td>
            <td>${safeText(row.description || '-')}</td>
          </tr>
        `).join('')

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
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 24px 0; }
            .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; background: #f9fafb; }
            .label { color: #6b7280; font-size: 12px; }
            .value { margin-top: 6px; font-size: 20px; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 11px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; vertical-align: top; word-break: break-word; }
            th { background: #f3f4f6; font-weight: 700; }
            .ok { color: #047857; font-weight: 700; }
            .bad { color: #dc2626; font-weight: 700; }
            .footer { margin-top: 18px; color: #9ca3af; font-size: 11px; }
            h2 { margin: 28px 0 12px; font-size: 16px; }
            .section-note { margin: 0 0 12px; color: #6b7280; font-size: 12px; }
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
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 38px;">序号</th>
                <th>起始码头</th>
                <th>下个码头</th>
                <th>江段</th>
                <th>行程日</th>
                <th>启航时间</th>
                <th>上下客</th>
                <th>距离</th>
                <th>航速</th>
                <th>航行时间</th>
                <th>到达时间</th>
                <th>景点</th>
                <th>景点所需</th>
                <th>停泊时间</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <h2>活动安排</h2>
          <table>
            <thead>
              <tr>
                <th>活动</th>
                <th style="width: 72px;">开始时间</th>
                <th style="width: 72px;">结束时间</th>
                <th>活动备注</th>
              </tr>
            </thead>
            <tbody>${scheduleRows}</tbody>
          </table>
          <div class="footer">说明：景点所需时间 = 游览时长 + 往返接驳时间；停泊时间 = 本段到达后至下一航段启航前。</div>
          <script>window.onload = function () { window.print(); };</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const columns = [
    { key: 'name', title: '行程名称', render: (plan: ItineraryPlan) => (
      <div>
        <div className="font-medium text-gray-900">{plan.name}</div>
        <div className="mt-0.5 font-mono text-xs text-gray-400">{plan.code}</div>
      </div>
    ) },
    { key: 'route', title: '关联航线', width: '180px', render: (plan: ItineraryPlan) => (
      <span className="text-sm text-gray-700">{routeMap.get(plan.routeId || '')?.name || '-'}</span>
    ) },
    { key: 'ports', title: '起止码头', render: (plan: ItineraryPlan) => {
      const firstSegment = plan.segments[0]
      const lastSegment = plan.segments[plan.segments.length - 1]
      return `${portMap.get(firstSegment?.fromPortId || '')?.name || '-'} → ${portMap.get(lastSegment?.toPortId || '')?.name || '-'}`
    } },
    { key: 'reach', title: '途经江段', width: '140px', render: (plan: ItineraryPlan) => (
      <span className="text-sm text-gray-700">{planReachSummary(plan.segments, portMap)}</span>
    ) },
    { key: 'segmentCount', title: '航段数', width: '90px', render: (plan: ItineraryPlan) => plan.segments.length },
    { key: 'scheduleCount', title: '活动数', width: '90px', render: (plan: ItineraryPlan) => (plan.schedule || []).length },
    { key: 'distance', title: '总距离', width: '110px', render: (plan: ItineraryPlan) => `${buildMetrics(plan.segments).totalDistance} km` },
    { key: 'sailingTime', title: '总航行时间', width: '140px', render: (plan: ItineraryPlan) => minutesToText(buildMetrics(plan.segments).totalSailingMinutes) },
    { key: 'updated', title: '修改信息', width: '170px', render: (plan: ItineraryPlan) => (
      <div>
        <div>{plan.updatedBy}</div>
        <div className="mt-0.5 text-xs text-gray-400">{formatDateTime(plan.updatedAt)}</div>
      </div>
    ) },
    { key: 'actions', title: '操作', width: '280px', render: (plan: ItineraryPlan) => {
      return (
        <div className="flex items-center gap-2">
          <button onClick={() => setViewPlan(plan)} className="text-sm text-gray-600 hover:text-gray-900">查看行程</button>
          <button onClick={() => openEdit(plan)} className="text-sm text-blue-600 hover:text-blue-700">编辑</button>
          <button onClick={() => openGeneration(plan)} className="text-sm text-gray-600 hover:text-gray-900">生成</button>
          <button onClick={() => setDeletePlanId(plan.id)} className="text-sm text-red-500 hover:text-red-600">删除</button>
        </div>
      )
    } },
  ]

  const editorContent = (
      <div className="space-y-6">
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">基础信息</h4>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">
              <label className="mb-1 block text-sm text-gray-700">行程方案名称</label>
              <input value={draftName} onChange={(event) => setDraftName(event.target.value)} className={inputClass} />
            </div>
            <div className="col-span-4">
              <label className="mb-1 block text-sm text-gray-700">关联航线 <span className="text-red-500">*</span></label>
              <select
                value={draftRouteId}
                onChange={(event) => handleRouteChange(event.target.value)}
                disabled={Boolean(editingPlanId && draftRouteId)}
                className={inputClass}
              >
                <option value="">请选择航线</option>
                {routes.map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}
              </select>
              {editingPlanId && draftRouteId && <p className="mt-1 text-xs text-gray-400">编辑时不可更换关联航线。</p>}
            </div>
            <div className="col-span-4 flex items-end justify-end gap-3">
              <button onClick={closeEditor} className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700 hover:bg-gray-50">
                取消
              </button>
              <button onClick={() => exportPdf(draftName || '行程方案', draftMetrics, flattenSegmentActivities(draftSegments))} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700 hover:bg-gray-50">
                <Download className="h-4 w-4" /> 导出PDF文档
              </button>
              <button onClick={() => goCreateProduct(draftName || '新建行程方案', editingPlanId || undefined)} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700 hover:bg-gray-50">
                <Package className="h-4 w-4" /> 生成产品
              </button>
              <button onClick={saveDraft} disabled={!draftRouteId || draftSegments.length === 0} className="inline-flex h-10 items-center rounded-lg bg-gray-900 px-4 text-sm text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">保存</button>
            </div>
          </div>
          {selectedRoute && (
            <p className="mt-3 text-xs text-gray-500">
              航线结构：{selectedRoute.ports} · {selectedRoute.duration} · 共 {draftSegments.length} 个航段（由航线自动生成，不可手工增删）
            </p>
          )}
        </div>

        {!draftRouteId ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500">
            请先选择关联航线，系统将自动载入该航线下的航段结构。
          </div>
        ) : (
        <>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">计算概览</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">航段数量</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{draftSegments.length}</p>
            </div>
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">航行距离合计</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{draftMetrics.totalDistance} km</p>
            </div>
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">航行时间合计</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{minutesToText(draftMetrics.totalSailingMinutes)}</p>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">航段配置</h4>
            <p className="mt-1 text-xs text-gray-500">航段起止码头来自关联航线；行程日、启航时间、航速、景点与活动由用户自行配置。</p>
          </div>

          <div className="space-y-4">
            {draftMetrics.rows.map((row) => {
              const { segment, distance, distanceSource, attractions: selectedAttractions, attractionMinutes, stopoverMinutes } = row
              const attractionOptions = attractionOptionsForPort(segment.toPortId)
              const segmentActivities = segment.activities || []
              return (
                <div key={segment.id} className="rounded-lg border border-gray-200 bg-white">
                  <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
                    <p className="text-sm font-semibold text-gray-900">航段 {row.index + 1}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                      <ReachBadge reach={row.fromPort?.riverReach} />
                      <span>{portMap.get(segment.fromPortId)?.name || '未选起点'}</span>
                      <span>→</span>
                      <ReachBadge reach={row.toPort?.riverReach} />
                      <span>{portMap.get(segment.toPortId)?.name || '未选终点'}</span>
                      {segment.passengerOnOff && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700">允许上下客</span>}
                    </p>
                  </div>

                  <div className="grid grid-cols-12 gap-4 px-5 py-4">
                    <div className="col-span-2">
                      <label className="mb-1 block text-sm text-gray-700">行程日</label>
                      <select
                        value={segment.day ?? 0}
                        onChange={(event) => updateSegment(segment.id, { day: Number(event.target.value) })}
                        className={inputClass}
                      >
                        {segmentDayOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1 block text-sm text-gray-700">启航时间</label>
                      <input
                        type="time"
                        value={segment.departureTime}
                        onChange={(event) => updateSegment(segment.id, { departureTime: event.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1 block text-sm text-gray-700">航行速度</label>
                      <select value={segment.speedKmH} onChange={(event) => updateSegment(segment.id, { speedKmH: Number(event.target.value) })} className={inputClass}>
                        {speedOptions.map((speed) => <option key={speed} value={speed}>{speed} km/h</option>)}
                        {distance?.speedKmH && !speedOptions.includes(distance.speedKmH) && <option value={distance.speedKmH}>{distance.speedKmH} km/h</option>}
                      </select>
                    </div>
                    <div className="col-span-2 rounded-lg bg-gray-50 px-4 py-3">
                      <p className="text-xs text-gray-500">距离库匹配</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{distance ? `${distance.distanceKm} km` : '未维护距离'}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {distanceSource === 'mileage'
                          ? '里程表匹配'
                          : distanceSource === 'manual'
                            ? '距离库'
                            : distanceSource === 'reverse'
                              ? '反向参考'
                              : row.mileageHint || '请手工维护距离'}
                      </p>
                    </div>
                    <div className="col-span-2 rounded-lg bg-gray-50 px-4 py-3">
                      <p className="text-xs text-gray-500">预计航行时间</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{minutesToText(row.sailingMinutes)}</p>
                      <p className="mt-1 text-xs text-gray-500">按当前航速计算</p>
                    </div>
                    <div className="col-span-2 rounded-lg bg-gray-50 px-4 py-3">
                      <p className="text-xs text-gray-500">预计到达 / 停泊</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{row.arrivalTime || '-'} / {minutesToText(stopoverMinutes)}</p>
                      <p className="mt-1 text-xs text-gray-500">{row.chained ? '下一航段衔接正常' : '下一段起点与本段终点不一致'}</p>
                    </div>

                    <div className="col-span-6">
                      <div className="mb-1 flex items-center justify-between">
                        <label className="block text-sm text-gray-700">关联景点</label>
                        <button type="button" onClick={() => addAttraction(segment.id)} className="text-sm text-blue-600 hover:text-blue-700">新增景点</button>
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
                            <button type="button" onClick={() => removeAttraction(segment.id, attractionIndex)} className="shrink-0 text-sm text-red-500 hover:text-red-600">删除</button>
                          </div>
                        ))}
                      </div>
                      {segment.toPortId && attractionOptions.length === 0 && (
                        <p className="mt-1 text-xs text-amber-600">该码头暂无可选景点。</p>
                      )}
                    </div>
                    <div className="col-span-6">
                      <label className="mb-1 block text-sm text-gray-700">景点所需时间</label>
                      <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700">
                        {selectedAttractions.length > 0 ? `${minutesToText(attractionMinutes)}（共 ${selectedAttractions.length} 个景点）` : '-'}
                      </div>
                    </div>

                    <div className="col-span-12">
                      <ItineraryEditor
                        value={segmentActivities}
                        onChange={(next) => updateSegmentActivities(segment.id, next)}
                        title={`航段 ${row.index + 1} 活动安排`}
                        variant="activities-only"
                        emptyText="暂无活动，点击「新增活动」添加"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        </>
        )}
      </div>
  )

  return (
    <div>
      <PageHeader title="行程管理" description="基于已有航线配置各航段航速、关联景点与活动，支持生成产品。" />

      <SearchPanel onSearch={() => setAppliedKeyword(keyword)} onReset={() => { setKeyword(''); setAppliedKeyword(''); setReachFilter('all') }}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">关键词</label>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') setAppliedKeyword(keyword) }}
            placeholder="行程名称/编号"
            className="w-52 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">途经江段</label>
          <select value={reachFilter} onChange={(event) => setReachFilter(event.target.value)} className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="all">全部</option>
            {RIVER_REACH_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
      </SearchPanel>

      <div className="bg-white px-9 py-6">
        <button onClick={openCreate} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700">
          <Plus className="h-4 w-4" />新增行程
        </button>
      </div>

      <DataTable columns={columns} dataSource={filteredPlans} rowKey="id" emptyText="暂无行程方案" />

      <DetailDrawer
        open={Boolean(viewPlan)}
        title="查看行程"
        width="w-[1120px]"
        onClose={() => setViewPlan(null)}
      >
        {viewPlan && (() => {
          const metrics = buildMetrics(viewPlan.segments)
          return (
            <div className="space-y-6">
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">基本信息</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="rounded-lg bg-gray-50 px-4 py-3">
                    <p className="text-xs text-gray-500">行程名称</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{viewPlan.name}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-4 py-3">
                    <p className="text-xs text-gray-500">行程编号</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-gray-900">{viewPlan.code}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-4 py-3">
                    <p className="text-xs text-gray-500">关联航线</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{routeMap.get(viewPlan.routeId || '')?.name || '-'}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-4 py-3">
                    <p className="text-xs text-gray-500">途经江段</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{planReachSummary(viewPlan.segments, portMap)}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-4 py-3">
                    <p className="text-xs text-gray-500">修改人</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{viewPlan.updatedBy}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-4 py-3">
                    <p className="text-xs text-gray-500">修改时间</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{formatDateTime(viewPlan.updatedAt)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">行程概览</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border border-gray-200 px-4 py-3">
                    <p className="text-xs text-gray-500">航段数量</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{metrics.rows.length}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 px-4 py-3">
                    <p className="text-xs text-gray-500">航行距离合计</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{metrics.totalDistance} km</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 px-4 py-3">
                    <p className="text-xs text-gray-500">航行时间合计</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{minutesToText(metrics.totalSailingMinutes)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">活动安排（{(viewPlan.schedule || []).length}项）</h4>
                {(viewPlan.schedule || []).length === 0 ? (
                  <p className="text-sm text-gray-500">暂无活动配置</p>
                ) : (
                  <div className="space-y-2 rounded-lg border border-gray-200 p-4">
                    {viewPlan.schedule.map((item) => (
                      <div key={item.id} className="flex flex-wrap gap-2 text-sm">
                        <span className="font-medium text-gray-900">{item.activityCategory || '未选活动'}</span>
                        {(item.startTime || item.endTime) && (
                          <span className="text-gray-500">{item.startTime || '--:--'} - {item.endTime || '--:--'}</span>
                        )}
                        {item.description && <span className="text-gray-500">· {item.description}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">航段明细</h4>
                  <button
                    onClick={() => exportPdf(viewPlan.name, metrics, viewPlan.schedule || [])}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4" />导出PDF
                  </button>
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="w-16 px-4 py-3 text-left text-xs font-medium text-gray-500">航段</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">起止码头</th>
                        <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500">江段</th>
                        <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500">行程日</th>
                        <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500">启航</th>
                        <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500">上下客</th>
                        <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500">到达</th>
                        <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500">距离</th>
                        <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500">航行时间</th>
                        <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500">停泊时间</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">景点安排</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {metrics.rows.map((row) => {
                        const fromPortName = portMap.get(row.segment.fromPortId)?.name || '未选起点'
                        const toPortName = portMap.get(row.segment.toPortId)?.name || '未选终点'
                        return (
                          <tr key={row.segment.id} className="align-top hover:bg-gray-50">
                            <td className="px-4 py-4 font-medium text-gray-900">{row.index + 1}</td>
                            <td className="px-4 py-4">
                              <p className="font-medium text-gray-900">{fromPortName} → {toPortName}</p>
                              {row.segment.remark && <p className="mt-1 text-xs leading-5 text-gray-500">{row.segment.remark}</p>}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap items-center gap-1">
                                <ReachBadge reach={row.fromPort?.riverReach} />
                                <span className="text-gray-400">→</span>
                                <ReachBadge reach={row.toPort?.riverReach} />
                              </div>
                            </td>
                            <td className="px-4 py-4 text-gray-700">{formatItineraryDayLabel(row.segment.day ?? 0)}</td>
                            <td className="px-4 py-4 text-gray-700">{row.segment.departureTime || '-'}</td>
                            <td className="px-4 py-4 text-gray-700">{row.segment.passengerOnOff ? '是' : '否'}</td>
                            <td className="px-4 py-4 text-gray-700">{row.arrivalTime}</td>
                            <td className="px-4 py-4 text-gray-700">{row.distance ? `${row.distance.distanceKm} km` : '未维护'}</td>
                            <td className="px-4 py-4 text-gray-700">{minutesToText(row.sailingMinutes)}</td>
                            <td className="px-4 py-4 text-gray-700">{minutesToText(row.stopoverMinutes)}</td>
                            <td className="px-4 py-4">
                              <p className="text-gray-900">{row.attractions.map((item) => item.name).join('、') || '-'}</p>
                              {row.attractions.length > 0 && (
                                <p className="mt-1 text-xs text-gray-500">预计需要 {minutesToText(row.attractionMinutes)}</p>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        })()}
      </DetailDrawer>

      <DetailDrawer
        open={editorOpen}
        title={editingPlanId ? '编辑行程方案' : '新增行程方案'}
        width="w-[1120px]"
        onClose={closeEditor}
      >
        {editorContent}
      </DetailDrawer>

      <ConfirmDialog
        open={Boolean(deletePlanId)}
        title="删除行程方案"
        message="确定要删除该行程方案吗？删除后不可恢复。"
        danger
        onConfirm={confirmRemovePlan}
        onCancel={() => setDeletePlanId('')}
      />

      <FormDialog
        open={Boolean(generationPlan)}
        title="生成"
        width="max-w-xl"
        submitText="确认生成"
        onCancel={() => setGenerationPlan(null)}
        onSubmit={confirmGeneration}
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-900">{generationPlan?.name}</p>
            <p className="mt-1 text-xs text-gray-500">基于该行程生成产品，带入行程名称与配置。</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
              generationTargets.includes('product') ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="checkbox"
                checked={generationTargets.includes('product')}
                onChange={() => toggleGenerationTarget('product')}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                  <Package className="h-4 w-4" />产品
                </span>
                <span className="mt-1 block text-xs leading-5 text-gray-500">进入产品新增，带入行程名称。</span>
              </span>
            </label>
          </div>
          {generationTargets.length === 0 && <p className="text-xs text-red-500">请至少选择一个生成对象。</p>}
        </div>
      </FormDialog>
    </div>
  )
}
