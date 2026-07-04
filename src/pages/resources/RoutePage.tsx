import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MinusCircle, Plus, PlusCircle } from 'lucide-react'
import { routeApi, portApi } from '@/mock/api'
import type { Route, RouteStop, PaginatedResult, SearchParams, Port } from '@/types'
import { formatDateTime, formatDurationMinutes, generateId } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'
import { applySailTimesToStops, formatSailTimeMinutes } from '@/utils/routeSailTime'

interface StopForm {
  key: string
  portId: string
  portName: string
  day: number
  pierName: string
  sailTime: string
  distance: number
  type: 'start' | 'middle' | 'end'
  embarkDisembark: boolean
  /** 途中码头是否开启售票（仅 middle 生效，默认 false） */
  ticketingEnabled: boolean
}

interface RouteFormData {
  code: string
  name: string
  type: 'upstream' | 'downstream'
  stops: StopForm[]
  image: string
  remark: string
}

interface ItineraryGenerationPayload {
  name: string
  stops: Omit<StopForm, 'key' | 'embarkDisembark'>[]
}

const ITINERARY_GENERATION_KEY = 'itinerary-generation-payload'

const emptyStop = (type: 'start' | 'middle' | 'end'): StopForm => ({
  key: generateId(),
  portId: '',
  portName: '',
  day: type === 'start' ? 0 : 1,
  pierName: '',
  sailTime: '',
  distance: 0,
  type,
  embarkDisembark: type === 'start' || type === 'end',
  ticketingEnabled: false,
})

const emptyForm: RouteFormData = {
  code: '', name: '', type: 'downstream',
  stops: [emptyStop('start'), emptyStop('end')],
  image: '', remark: '',
}

export default function RoutePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const generationHandledRef = useRef(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<Route>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [portFilter, setPortFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [portList, setPortList] = useState<Port[]>([])

  // 弹窗
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<RouteFormData>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)
  const [nextGeneration, setNextGeneration] = useState<'product' | null>(null)
  const [nextProductName, setNextProductName] = useState('')
  const [nextItineraryPlanId, setNextItineraryPlanId] = useState('')

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<Route | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string }>({ type: '', id: '' })

  useEffect(() => {
    portApi.list({ pageSize: 50 }).then((r) => setPortList(r.data))
  }, [])

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    if (keyword.trim()) params.keyword = keyword.trim()
    if (typeFilter !== 'all') params.type = typeFilter
    if (portFilter !== 'all') params.portId = portFilter
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo
    const result = await routeApi.list(params)
    setData(result)
    setLoading(false)
  }, [keyword, typeFilter, portFilter, dateFrom, dateTo])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSearch = () => fetchData(1)
  const handleReset = () => { setKeyword(''); setTypeFilter('all'); setPortFilter('all'); setDateFrom(''); setDateTo('') }

  const withSailTimes = useCallback((stops: StopForm[], type: RouteFormData['type']) => {
    if (portList.length === 0) return stops
    return applySailTimesToStops(stops, type, portList)
  }, [portList])

  const patchForm = useCallback((next: RouteFormData) => ({
    ...next,
    stops: withSailTimes(next.stops, next.type),
  }), [withSailTimes])

  // 航线规划表单操作
  const stopsFromRoute = (r: Route): StopForm[] =>
    r.stops.map((s) => ({ key: s.id, portId: s.portId, portName: s.portName, day: s.day, pierName: s.pierName, sailTime: s.sailTime, distance: s.distance, type: s.type, embarkDisembark: s.embarkDisembark ?? (s.type === 'start' || s.type === 'end'), ticketingEnabled: s.ticketingEnabled ?? false }))

  const openCreate = () => {
    setEditingId(null)
    setForm({
      ...emptyForm,
      code: `RTE-${Date.now().toString().slice(-8)}`,
      stops: [emptyStop('start'), emptyStop('end')],
    })
    setFormOpen(true)
  }

  useEffect(() => {
    if (searchParams.get('create') !== '1' || generationHandledRef.current) return
    generationHandledRef.current = true

    const name = searchParams.get('name') || ''
    const next = searchParams.get('next') === 'product' ? 'product' : null
    const productName = searchParams.get('productName') || name
    const itineraryPlanId = searchParams.get('itineraryPlanId') || ''
    let payload: ItineraryGenerationPayload | null = null

    try {
      const storedPayload = sessionStorage.getItem(ITINERARY_GENERATION_KEY)
      payload = storedPayload ? JSON.parse(storedPayload) as ItineraryGenerationPayload : null
    } catch {
      payload = null
    }
    sessionStorage.removeItem(ITINERARY_GENERATION_KEY)

    const generatedStops = payload?.stops?.length && payload.stops.length >= 2
      ? payload.stops.map((stop, index) => ({
          ...stop,
          key: generateId(),
          type: index === 0 ? 'start' as const : index === payload!.stops.length - 1 ? 'end' as const : 'middle' as const,
          embarkDisembark: index === 0 || index === payload!.stops.length - 1,
        }))
      : [emptyStop('start'), emptyStop('end')]

    setEditingId(null)
    setForm(patchForm({
      ...emptyForm,
      code: `RTE-${Date.now().toString().slice(-8)}`,
      name: payload?.name || name,
      stops: generatedStops,
      remark: payload ? '由行程管理生成。' : '',
    }))
    setNextGeneration(next)
    setNextProductName(productName)
    setNextItineraryPlanId(itineraryPlanId)
    setFormOpen(true)
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams, patchForm])

  useEffect(() => {
    if (!formOpen || portList.length === 0) return
    setForm((prev) => {
      const nextStops = withSailTimes(prev.stops, prev.type)
      const unchanged = nextStops.every((stop, index) => stop.sailTime === prev.stops[index]?.sailTime)
      return unchanged ? prev : { ...prev, stops: nextStops }
    })
  }, [formOpen, portList, withSailTimes])

  const openEdit = (r: Route) => {
    setEditingId(r.id)
    setForm(patchForm({ code: r.code, name: r.name, type: r.type, stops: stopsFromRoute(r), image: r.image, remark: r.remark }))
    setFormOpen(true)
  }

  const openDetail = async (r: Route) => {
    const item = await routeApi.getById(r.id)
    setDetail(item || null)
    setDetailOpen(true)
  }

  // 动态表格 - 添加停靠港：在指定节点后插入一个途中港
  const addStopAfter = (key?: string) => {
    const newStops = [...form.stops]
    if (!key) {
      newStops.splice(newStops.length - 1, 0, emptyStop('middle'))
    } else {
      const currentIndex = newStops.findIndex((item) => item.key === key)
      const insertIndex = currentIndex >= 0 ? Math.min(currentIndex + 1, newStops.length - 1) : newStops.length - 1
      newStops.splice(insertIndex, 0, emptyStop('middle'))
    }
    setForm(patchForm({ ...form, stops: newStops }))
  }

  // 删除停靠港
  const removeStop = (key: string) => {
    if (form.stops.length <= 2) return
    setForm(patchForm({ ...form, stops: form.stops.filter((s) => s.key !== key) }))
  }

  // 更新停靠港字段
  const updateStop = (key: string, field: keyof StopForm, value: unknown) => {
    const nextStops = form.stops.map((s) => {
      if (s.key !== key) return s
      const updated = { ...s, [field]: value }
      if (field === 'portId') {
        const port = portList.find((p) => p.id === value)
        updated.portName = port?.name || ''
      }
      return updated
    })
    const shouldRecalc = field === 'portId' || field === 'portName'
    setForm(shouldRecalc ? patchForm({ ...form, stops: nextStops }) : { ...form, stops: nextStops })
  }

  const computeDuration = (stops: StopForm[]) => {
    const startDay = stops[0]?.day || 0
    const endDay = stops[stops.length - 1]?.day || 0
    const totalDays = endDay - startDay
    return `${totalDays}天${totalDays - 1}晚`
  }

  const totalMileage = useMemo(
    () => form.stops.reduce((sum, stop) => sum + (Number(stop.distance) || 0), 0),
    [form.stops],
  )

  const stopTypeLabel = (type: StopForm['type']) => {
    if (type === 'start') return '起'
    if (type === 'end') return '终'
    return '途'
  }

  const stopTypeTitle = (type: StopForm['type'], index: number) => {
    if (type === 'start') return '起始码头'
    if (type === 'end') return '结束码头'
    return `经停点 ${index}`
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.code.trim()) return
    setFormLoading(true)
    let createdRoute: Route | null = null

    const duration = computeDuration(form.stops)
    const ports = form.stops.map((s) => s.portName || s.portId).join('-')
    const stops: RouteStop[] = form.stops.map((s, i) => ({
      id: `rs${Date.now()}${i}`,
      portId: s.portId,
      portName: s.portName,
      day: s.day,
      pierId: '',
      pierName: s.pierName,
      sailTime: s.sailTime,
      distance: s.distance,
      type: s.type,
      embarkDisembark: s.embarkDisembark,
      ticketingEnabled: s.type === 'middle' ? s.ticketingEnabled : undefined,
    }))

    if (editingId) {
      await routeApi.update(editingId, { ...form, stops, ports, duration })
    } else {
      const now = new Date().toISOString()
      createdRoute = await routeApi.create({
        ...form, stops, ports, duration,
        days: form.stops[form.stops.length - 1].day - form.stops[0].day,
        nights: form.stops[form.stops.length - 1].day - form.stops[0].day - 1,
        status: 'enabled', updatedBy: '当前用户', updatedAt: now, createdAt: now,
      } as Route)
    }
    setFormLoading(false)
    setFormOpen(false)
    if (!editingId && nextGeneration === 'product') {
      const params = new URLSearchParams({ create: '1' })
      if (nextProductName.trim()) params.set('name', nextProductName.trim())
      if (createdRoute?.id) params.set('routeId', createdRoute.id)
      if (nextItineraryPlanId) params.set('itineraryPlanId', nextItineraryPlanId)
      setNextGeneration(null)
      setNextItineraryPlanId('')
      navigate(`/resources/products?${params.toString()}`)
      return
    }
    fetchData(data.page)
  }

  const handleToggleStatus = async (id: string) => {
    await routeApi.toggleStatus(id)
    fetchData(data.page)
  }

  const handleDelete = (id: string) => {
    setConfirmAction({ type: 'delete', id })
    setConfirmOpen(true)
  }

  const confirmDelete = async () => {
    await routeApi.remove(confirmAction.id)
    setConfirmOpen(false)
    fetchData(data.page)
  }

  const columns = [
    { key: 'code', title: '航线编码', dataIndex: 'code' as keyof Route },
    { key: 'name', title: '航线名称', dataIndex: 'name' as keyof Route },
    {
      key: 'type', title: '类型',
      render: (r: Route) => (
        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${r.type === 'upstream' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
          {r.type === 'upstream' ? '上水' : '下水'}
        </span>
      ),
    },
    { key: 'ports', title: '途径港', dataIndex: 'ports' as keyof Route },
    { key: 'duration', title: '航程时长', dataIndex: 'duration' as keyof Route },
    { key: 'status', title: '状态', render: (r: Route) => <StatusBadge status={r.status} /> },
    { key: 'updatedAt', title: '修改时间', render: (r: Route) => formatDateTime(r.updatedAt) },
    {
      key: 'actions', title: '操作', width: '200px',
      render: (r: Route) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openDetail(r)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">详情</button>
          <button onClick={() => openEdit(r)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">编辑</button>
          <button onClick={() => handleToggleStatus(r.id)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
            {r.status === 'enabled' ? '禁用' : '启用'}
          </button>
          <button onClick={() => handleDelete(r.id)} className="px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded">删除</button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="航线管理" description="管理国内内河及沿海游轮航线信息" />

      <SearchPanel onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">关键词</label>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="航线名称/编码" className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">类型</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
            <option value="all">全部</option>
            <option value="upstream">上水</option>
            <option value="downstream">下水</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">途径港</label>
          <select value={portFilter} onChange={(e) => setPortFilter(e.target.value)} className="w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
            <option value="all">全部</option>
            {portList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">创建日期</label>
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
            <span className="text-gray-400 text-sm">至</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
          </div>
        </div>
      </SearchPanel>
      <div className="bg-white px-9 py-6">
        <button onClick={openCreate} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700">
          <Plus className="w-4 h-4" />添加
        </button>
      </div>

      <DataTable
        columns={columns}
        dataSource={data.data}
        loading={loading}
        rowKey="id"
        pagination={{
          current: data.page,
          pageSize: data.pageSize,
          total: data.total,
          onChange: (page) => fetchData(page),
        }}
      />

      <FormDialog
        open={formOpen}
        title={editingId ? '编辑航线' : '新增航线'}
        width="max-w-6xl"
        loading={formLoading}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">航线名称</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="请输入内容"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">编码</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="请输入编码"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">航线标识</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="请输入航线标识"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <p className="mt-1 text-xs text-gray-400">航线标识填写后可作为航线唯一识别编码使用。</p>
            </div>
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">类别</label>
              <div className="flex flex-wrap gap-5 text-sm text-gray-700">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    checked={form.type === 'downstream'}
                    onChange={() => setForm(patchForm({ ...form, type: 'downstream' }))}
                    className="h-4 w-4"
                  />
                  旅游航线
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    checked={form.type === 'upstream'}
                    onChange={() => setForm(patchForm({ ...form, type: 'upstream' }))}
                    className="h-4 w-4"
                  />
                  交通航线
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <span>航程总长：<span className="font-medium text-gray-900">{totalMileage}</span> 海里</span>
            <span>航行时长：<span className="font-medium text-gray-900">{computeDuration(form.stops)}</span></span>
            <span>停靠节点：<span className="font-medium text-gray-900">{form.stops.length}</span> 个</span>
          </div>

          <div>
            <h4 className="mb-1 text-base font-semibold text-gray-900">路径规划</h4>
            <p className="mb-4 text-sm text-gray-500">按起点、经停点、终点顺序维护航线节点。</p>

            <div className="space-y-4">
              {form.stops.map((stop, idx) => {
                const isStart = stop.type === 'start'
                const isEnd = stop.type === 'end'
                return (
                  <div key={stop.key} className="flex gap-4">
                    <div className="flex w-14 flex-col items-center">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                        isStart ? 'bg-blue-50 text-blue-700' : isEnd ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {stopTypeLabel(stop.type)}
                      </div>
                      {idx < form.stops.length - 1 && <div className="mt-1 h-full min-h-[56px] w-px bg-blue-200" />}
                    </div>

                    <div className="flex-1 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900">{stopTypeTitle(stop.type, idx)}</h5>
                          <p className="mt-1 text-xs text-gray-500">
                            {isStart ? '配置起航港口与首段信息。' : isEnd ? '配置终点港口。' : '配置经停港口与上一段航程信息。'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isEnd && (
                            <button
                              type="button"
                              onClick={() => addStopAfter(stop.key)}
                              className="rounded-full p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                              title="在后面添加节点"
                            >
                              <PlusCircle className="h-5 w-5" />
                            </button>
                          )}
                          {!isStart && !isEnd && (
                            <button
                              type="button"
                              onClick={() => removeStop(stop.key)}
                              className="rounded-full p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              title="删除节点"
                            >
                              <MinusCircle className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                        <div className="lg:col-span-6">
                          <label className="mb-1 block text-xs text-gray-500">选择码头</label>
                          <select
                            value={stop.portId}
                            onChange={(e) => updateStop(stop.key, 'portId', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
                          >
                            <option value="">请选择码头</option>
                            {portList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div className="lg:col-span-6">
                          <label className="mb-1 block text-xs text-gray-500">停靠码头/厅</label>
                          <input
                            value={stop.pierName}
                            onChange={(e) => updateStop(stop.key, 'pierName', e.target.value)}
                            placeholder="请输入码头或厅"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">第N天</label>
                          <input
                            type="number"
                            min={0}
                            value={stop.day}
                            onChange={(e) => updateStop(stop.key, 'day', Number(e.target.value))}
                            disabled={isStart}
                            className={`w-full rounded-lg border px-3 py-2 text-sm ${
                              isStart
                                ? 'border-gray-200 bg-gray-50 text-gray-400'
                                : 'border-gray-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">预计航行时间</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={stop.sailTime ? formatDurationMinutes(Number(stop.sailTime)) : ''}
                              readOnly
                              placeholder={isStart ? '—' : '自动汇总'}
                              className={`w-full rounded-lg border px-3 py-2 pr-12 text-sm ${
                                isStart
                                  ? 'border-gray-200 bg-gray-50 text-gray-400'
                                  : 'border-gray-200 bg-gray-50 text-gray-700'
                              }`}
                            />
                            {!isStart && (
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">时:分</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">{isStart ? '航距(nmi)' : '上段航距(nmi)'}</label>
                          <input
                            type="number"
                            min={0}
                            value={stop.distance}
                            onChange={(e) => updateStop(stop.key, 'distance', Number(e.target.value))}
                            disabled={isStart}
                            className={`w-full rounded-lg border px-3 py-2 text-sm ${
                              isStart
                                ? 'border-gray-200 bg-gray-50 text-gray-400'
                                : 'border-gray-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900'
                            }`}
                          />
                        </div>
                      </div>

                      {/* 途中码头：开启售票 */}
                      {stop.type === 'middle' && (
                        <div className="mt-3 border-t border-gray-100 pt-3">
                          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={stop.ticketingEnabled}
                              onChange={(e) => updateStop(stop.key, 'ticketingEnabled', e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            开启售票
                            <span className="text-xs text-gray-400">（勾选后该途中港可作为上船/下船节点对外售票）</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">航线图片</label>
              <input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="图片 URL（可选）"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">备注</label>
              <input
                value={form.remark}
                onChange={(e) => setForm({ ...form, remark: e.target.value })}
                placeholder="航线备注说明"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
        </div>
      </FormDialog>

      {/* 详情抽屉 */}
      <DetailDrawer open={detailOpen} title="航线详情" width="w-[720px]" onClose={() => setDetailOpen(false)}>
        {detail && (
          <>
            <DetailCard title="基本信息">
              <DetailRow label="航线编码" value={detail.code} mono />
              <DetailRow label="航线名称" value={detail.name} />
              <DetailRow label="类型" value={detail.type === 'upstream' ? '上水' : '下水'} />
              <DetailRow label="途径港" value={detail.ports} />
              <DetailRow label="航程时长" value={detail.duration} />
              <DetailRow label="状态" value={<StatusBadge status={detail.status} />} />
            </DetailCard>

            <DetailCard title="航线规划">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <th className="pb-2 font-medium">停靠港</th>
                    <th className="pb-2 font-medium">第N天</th>
                    <th className="pb-2 font-medium">预计航行时间</th>
                    <th className="pb-2 font-medium">航距(nmi)</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.stops.map((s) => (
                    <tr key={s.id} className="border-b border-gray-50">
                      <td className="py-1.5">{s.portName || '-'}</td>
                      <td className="py-1.5">{s.type === 'start' ? '起航' : `第${s.day}天`}</td>
                      <td className="py-1.5">{formatSailTimeMinutes(s.sailTime)}</td>
                      <td className="py-1.5 font-mono">{s.distance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DetailCard>

            {detail.remark && (
              <DetailCard title="备注">
                <p className="text-sm text-gray-700">{detail.remark}</p>
              </DetailCard>
            )}

            <DetailCard title="操作信息">
              <DetailRow label="修改人" value={detail.updatedBy} />
              <DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} />
              <DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} />
            </DetailCard>
          </>
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={confirmOpen}
        title="删除航线"
        message="确定要删除该航线吗？此操作不可恢复，航线下的停靠港信息将被一并删除。"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
