import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { routeApi, portApi } from '@/mock/api'
import type { Route, RouteStop, PaginatedResult, SearchParams, Port } from '@/types'
import { formatDateTime, generateId } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'

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
}

interface RouteFormData {
  code: string
  name: string
  type: 'upstream' | 'downstream'
  stops: StopForm[]
  image: string
  remark: string
}

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
})

const emptyForm: RouteFormData = {
  code: '', name: '', type: 'downstream',
  stops: [emptyStop('start'), emptyStop('end')],
  image: '', remark: '',
}

export default function RoutePage() {
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
  const [formWidth, setFormWidth] = useState('max-w-4xl')

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

  // 航线规划表单操作
  const stopsFromRoute = (r: Route): StopForm[] =>
    r.stops.map((s) => ({ key: s.id, portId: s.portId, portName: s.portName, day: s.day, pierName: s.pierName, sailTime: s.sailTime, distance: s.distance, type: s.type, embarkDisembark: s.embarkDisembark ?? (s.type === 'start' || s.type === 'end') }))

  const openCreate = () => { setEditingId(null); setForm({ ...emptyForm, stops: [emptyStop('start'), emptyStop('end')] }); setFormOpen(true) }

  const openEdit = (r: Route) => {
    setEditingId(r.id)
    setForm({ code: r.code, name: r.name, type: r.type, stops: stopsFromRoute(r), image: r.image, remark: r.remark })
    setFormOpen(true)
  }

  const openDetail = async (r: Route) => {
    const item = await routeApi.getById(r.id)
    setDetail(item || null)
    setDetailOpen(true)
  }

  // 动态表格 - 添加停靠港：在止港前面插入一个途中港
  const addStop = () => {
    const newStops = [...form.stops]
    // 在倒数第一个（止港）之前插入
    newStops.splice(newStops.length - 1, 0, emptyStop('middle'))
    setForm({ ...form, stops: newStops })
  }

  // 删除停靠港
  const removeStop = (key: string) => {
    if (form.stops.length <= 2) return
    setForm({ ...form, stops: form.stops.filter((s) => s.key !== key) })
  }

  // 更新停靠港字段
  const updateStop = (key: string, field: keyof StopForm, value: unknown) => {
    setForm({
      ...form,
      stops: form.stops.map((s) => {
        if (s.key !== key) return s
        const updated = { ...s, [field]: value }
        if (field === 'portId') {
          const port = portList.find((p) => p.id === value)
          updated.portName = port?.name || ''
        }
        return updated
      }),
    })
  }

  const computeDuration = (stops: StopForm[]) => {
    const startDay = stops[0]?.day || 0
    const endDay = stops[stops.length - 1]?.day || 0
    const totalDays = endDay - startDay
    return `${totalDays}天${totalDays - 1}晚`
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.code.trim()) return
    setFormLoading(true)

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
    }))

    if (editingId) {
      await routeApi.update(editingId, { ...form, stops, ports, duration })
    } else {
      const now = new Date().toISOString()
      await routeApi.create({
        ...form, stops, ports, duration,
        days: form.stops[form.stops.length - 1].day - form.stops[0].day,
        nights: form.stops[form.stops.length - 1].day - form.stops[0].day - 1,
        status: 'enabled', updatedBy: '当前用户', updatedAt: now, createdAt: now,
      } as Route)
    }
    setFormLoading(false)
    setFormOpen(false)
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

      {/* 新增/编辑弹窗 - 含动态表格 */}
      <FormDialog
        open={formOpen}
        title={editingId ? '编辑航线' : '新增航线'}
        width="max-w-5xl"
        loading={formLoading}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="space-y-6">
          {/* 基本信息 */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基本信息</h4>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">航线编码 <span className="text-red-500">*</span></label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">航线名称 <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">类型 <span className="text-red-500">*</span></label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'upstream' | 'downstream' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
                  <option value="downstream">下水</option>
                  <option value="upstream">上水</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">航程总长</label>
                <input value={computeDuration(form.stops)} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
              </div>
            </div>
          </div>

          {/* 航线规划 - 动态表格 */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">航线规划</h4>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">起止港</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">港口名称</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-20">第N天</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">停靠码头</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-28">预计航行时间</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-28">上段航距(nmi)</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-16">上下客</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-16">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {form.stops.map((stop, idx) => {
                    const isStart = stop.type === 'start'
                    const isEnd = stop.type === 'end'
                    return (
                      <tr key={stop.key} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            isStart ? 'bg-blue-100 text-blue-700' : isEnd ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {isStart ? '起港' : isEnd ? '止港' : '途中'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={stop.portId}
                            onChange={(e) => updateStop(stop.key, 'portId', e.target.value)}
                            disabled={isStart || isEnd ? false : false}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          >
                            <option value="">选择港口</option>
                            {portList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={stop.day}
                            onChange={(e) => updateStop(stop.key, 'day', Number(e.target.value))}
                            disabled={isStart}
                            className={`w-full px-2 py-1.5 border rounded text-sm text-center ${isStart ? 'border-gray-200 bg-gray-50 text-gray-400' : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent'}`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={stop.pierName}
                            onChange={(e) => updateStop(stop.key, 'pierName', e.target.value)}
                            placeholder="码头名称"
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="time"
                            value={stop.sailTime}
                            onChange={(e) => updateStop(stop.key, 'sailTime', e.target.value)}
                            disabled={isStart}
                            className={`w-full px-2 py-1.5 border rounded text-sm ${isStart ? 'border-gray-200 bg-gray-50 text-gray-400' : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent'}`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={stop.distance}
                              onChange={(e) => updateStop(stop.key, 'distance', Number(e.target.value))}
                              disabled={isStart}
                              className={`w-full px-2 py-1.5 border rounded text-sm ${isStart ? 'border-gray-200 bg-gray-50 text-gray-400' : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent'}`}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={stop.embarkDisembark}
                            onChange={(e) => updateStop(stop.key, 'embarkDisembark', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          {!isEnd && (
                            <button onClick={() => addStop()} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="增加">
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                          {!isStart && !isEnd && (
                            <button onClick={() => removeStop(stop.key)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded ml-0.5" title="删除">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 航线介绍 */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">航线介绍</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">图片</label>
                <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="图片URL（可选）" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">备注</label>
                <input value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} placeholder="航线备注说明" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              </div>
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
                    <th className="pb-2 font-medium">上下客</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.stops.map((s) => (
                    <tr key={s.id} className="border-b border-gray-50">
                      <td className="py-1.5">{s.portName || '-'}</td>
                      <td className="py-1.5">{s.type === 'start' ? '起航' : `第${s.day}天`}</td>
                      <td className="py-1.5">{s.sailTime || '-'}</td>
                      <td className="py-1.5 font-mono">{s.distance}</td>
                      <td className="py-1.5">{s.embarkDisembark ? '是' : '否'}</td>
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
