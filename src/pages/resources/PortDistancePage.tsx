import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { portApi, portDistanceApi } from '@/mock/api'
import type { PaginatedResult, Port, PortDistance, PortDistanceForm, SearchParams } from '@/types'
import { formatDateTime } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent'

const emptyForm: PortDistanceForm = {
  fromPortId: '',
  toPortId: '',
  distanceKm: 0,
  speedKmH: 18,
  direction: 'downstream',
  remark: '',
}

const directionLabel = (direction: PortDistance['direction']) => (
  <span className={direction === 'upstream' ? 'text-blue-600' : 'text-green-600'}>
    {direction === 'upstream' ? '上水' : '下水'}
  </span>
)

export default function PortDistancePage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<PortDistance>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [fromPortFilter, setFromPortFilter] = useState('all')
  const [toPortFilter, setToPortFilter] = useState('all')
  const [directionFilter, setDirectionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [portList, setPortList] = useState<Port[]>([])

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PortDistanceForm>(emptyForm)
  const [formFromCity, setFormFromCity] = useState('all')
  const [formToCity, setFormToCity] = useState('all')
  const [formLoading, setFormLoading] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  useEffect(() => {
    portApi.list({ pageSize: 100 }).then((result) => setPortList(result.data))
  }, [])

  const fetchData = useCallback(async (
    page = 1,
    overrides?: { keyword?: string; fromPortId?: string; toPortId?: string; direction?: string; status?: string },
  ) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    const nextKeyword = overrides?.keyword ?? keyword
    const nextFromPort = overrides?.fromPortId ?? fromPortFilter
    const nextToPort = overrides?.toPortId ?? toPortFilter
    const nextDirection = overrides?.direction ?? directionFilter
    const nextStatus = overrides?.status ?? statusFilter
    if (nextKeyword.trim()) params.keyword = nextKeyword.trim()
    if (nextFromPort !== 'all') params.fromPortId = nextFromPort
    if (nextToPort !== 'all') params.toPortId = nextToPort
    if (nextDirection !== 'all') params.direction = nextDirection
    if (nextStatus !== 'all') params.status = nextStatus
    const result = await portDistanceApi.list(params)
    setData(result)
    setLoading(false)
  }, [keyword, fromPortFilter, toPortFilter, directionFilter, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const cityOptions = useMemo(
    () => Array.from(new Set(portList.map((item) => item.city).filter(Boolean))),
    [portList],
  )
  const fromPortOptions = useMemo(
    () => formFromCity === 'all' ? portList : portList.filter((item) => item.city === formFromCity),
    [formFromCity, portList],
  )
  const toPortOptions = useMemo(
    () => formToCity === 'all' ? portList : portList.filter((item) => item.city === formToCity),
    [formToCity, portList],
  )

  const totalDistance = data.data.reduce((sum, item) => sum + item.distanceKm, 0)

  const resetFilters = () => {
    setKeyword('')
    setFromPortFilter('all')
    setToPortFilter('all')
    setDirectionFilter('all')
    setStatusFilter('all')
    fetchData(1, { keyword: '', fromPortId: 'all', toPortId: 'all', direction: 'all', status: 'all' })
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormFromCity('all')
    setFormToCity('all')
    setFormOpen(true)
  }

  const openEdit = (record: PortDistance) => {
    const fromPort = portList.find((item) => item.id === record.fromPortId)
    const toPort = portList.find((item) => item.id === record.toPortId)
    setEditingId(record.id)
    setForm({
      fromPortId: record.fromPortId,
      toPortId: record.toPortId,
      distanceKm: record.distanceKm,
      speedKmH: record.speedKmH,
      direction: record.direction,
      remark: record.remark,
    })
    setFormFromCity(fromPort?.city || 'all')
    setFormToCity(toPort?.city || 'all')
    setFormOpen(true)
  }

  const submitForm = async () => {
    if (!form.fromPortId || !form.toPortId || form.fromPortId === form.toPortId) return
    setFormLoading(true)
    const now = new Date().toISOString()
    const fromPort = portList.find((item) => item.id === form.fromPortId)
    const toPort = portList.find((item) => item.id === form.toPortId)
    const payload = {
      ...form,
      fromPortName: fromPort?.name || '',
      toPortName: toPort?.name || '',
      status: 'enabled' as const,
      updatedBy: '当前用户',
      updatedAt: now,
    }
    if (editingId) {
      await portDistanceApi.update(editingId, payload)
    } else {
      await portDistanceApi.create({ ...payload, createdAt: now } as Omit<PortDistance, 'id'>)
    }
    setFormLoading(false)
    setFormOpen(false)
    fetchData(data.page)
  }

  const confirmDelete = async () => {
    await portDistanceApi.remove(confirmId)
    setConfirmOpen(false)
    fetchData(data.page)
  }

  const toggleStatus = async (id: string) => {
    await portDistanceApi.toggleStatus(id)
    fetchData(data.page)
  }

  const columns = [
    {
      key: 'ports',
      title: '起点 / 终点码头',
      width: '280px',
      render: (record: PortDistance) => (
        <div>
          <p className="font-medium text-gray-900">{record.fromPortName}</p>
          <p className="mt-1 text-xs text-gray-500">到 {record.toPortName}</p>
        </div>
      ),
    },
    {
      key: 'direction',
      title: '上下水',
      width: '100px',
      render: (record: PortDistance) => directionLabel(record.direction),
    },
    {
      key: 'distance',
      title: '距离',
      width: '120px',
      render: (record: PortDistance) => <span className="font-medium text-gray-900">{record.distanceKm} km</span>,
    },
    {
      key: 'remark',
      title: '备注',
      width: '260px',
      render: (record: PortDistance) => <p className="max-w-xs truncate text-gray-600">{record.remark || '-'}</p>,
    },
    { key: 'status', title: '状态', width: '90px', render: (record: PortDistance) => <StatusBadge status={record.status} /> },
    { key: 'updatedAt', title: '修改时间', width: '150px', render: (record: PortDistance) => formatDateTime(record.updatedAt) },
    {
      key: 'actions',
      title: '操作',
      width: '190px',
      render: (record: PortDistance) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(record)} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900">编辑</button>
          <button onClick={() => toggleStatus(record.id)} className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700">
            {record.status === 'enabled' ? '停用' : '启用'}
          </button>
          <button onClick={() => { setConfirmId(record.id); setConfirmOpen(true) }} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700">删除</button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="码头距离库" description="维护码头之间的航行距离，用于行程方案中的航段距离参考。" />

      <SearchPanel onSearch={() => fetchData(1)} onReset={resetFilters} loading={loading}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">关键词</label>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="码头/上下水/备注"
            className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">起点码头</label>
          <select value={fromPortFilter} onChange={(event) => setFromPortFilter(event.target.value)} className="w-52 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
            <option value="all">全部起点</option>
            {portList.map((port) => <option key={port.id} value={port.id}>{port.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">终点码头</label>
          <select value={toPortFilter} onChange={(event) => setToPortFilter(event.target.value)} className="w-52 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
            <option value="all">全部终点</option>
            {portList.map((port) => <option key={port.id} value={port.id}>{port.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">上下水</label>
          <select value={directionFilter} onChange={(event) => setDirectionFilter(event.target.value)} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
            <option value="all">全部</option>
            <option value="upstream">上水</option>
            <option value="downstream">下水</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">状态</label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
            <option value="all">全部</option>
            <option value="enabled">启用</option>
            <option value="disabled">停用</option>
          </select>
        </div>
      </SearchPanel>

      <div className="bg-white px-9 py-6">
        <div className="mb-5 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4">
            <p className="text-xs text-gray-500">当前记录</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{data.total}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4">
            <p className="text-xs text-gray-500">当前页距离合计</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{totalDistance} km</p>
          </div>
        </div>
        <button onClick={openCreate} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700">
          <Plus className="w-4 h-4" />新增距离
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
        title={editingId ? '编辑码头距离' : '新增码头距离'}
        width="max-w-2xl"
        loading={formLoading}
        onCancel={() => setFormOpen(false)}
        onSubmit={submitForm}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-gray-700">起点城市</label>
              <select
                value={formFromCity}
                onChange={(event) => {
                  const nextCity = event.target.value
                  setFormFromCity(nextCity)
                  setForm((prev) => {
                    const selectedPort = portList.find((item) => item.id === prev.fromPortId)
                    return selectedPort && nextCity !== 'all' && selectedPort.city !== nextCity
                      ? { ...prev, fromPortId: '' }
                      : prev
                  })
                }}
                className={inputClass}
              >
                <option value="all">全部城市</option>
                {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700">终点城市</label>
              <select
                value={formToCity}
                onChange={(event) => {
                  const nextCity = event.target.value
                  setFormToCity(nextCity)
                  setForm((prev) => {
                    const selectedPort = portList.find((item) => item.id === prev.toPortId)
                    return selectedPort && nextCity !== 'all' && selectedPort.city !== nextCity
                      ? { ...prev, toPortId: '' }
                      : prev
                  })
                }}
                className={inputClass}
              >
                <option value="all">全部城市</option>
                {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700">起点码头 <span className="text-red-500">*</span></label>
              <select value={form.fromPortId} onChange={(event) => setForm({ ...form, fromPortId: event.target.value })} className={inputClass}>
                <option value="">请选择起点</option>
                {fromPortOptions.map((port) => <option key={port.id} value={port.id}>{port.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700">终点码头 <span className="text-red-500">*</span></label>
              <select value={form.toPortId} onChange={(event) => setForm({ ...form, toPortId: event.target.value })} className={inputClass}>
                <option value="">请选择终点</option>
                {toPortOptions.map((port) => <option key={port.id} value={port.id}>{port.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700">航行距离(km)</label>
              <input type="number" value={form.distanceKm} onChange={(event) => setForm({ ...form, distanceKm: Number(event.target.value) })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700">上下水</label>
              <select value={form.direction} onChange={(event) => setForm({ ...form, direction: event.target.value as PortDistance['direction'] })} className={inputClass}>
                <option value="upstream">上水</option>
                <option value="downstream">下水</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm text-gray-700">备注</label>
              <textarea value={form.remark} onChange={(event) => setForm({ ...form, remark: event.target.value })} rows={3} className={`${inputClass} resize-none`} />
            </div>
          </div>
          {form.fromPortId && form.toPortId && form.fromPortId === form.toPortId && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">起点码头和终点码头不能相同。</p>
          )}
        </div>
      </FormDialog>

      <ConfirmDialog
        open={confirmOpen}
        title="删除距离记录"
        message="确定要删除该码头距离记录吗？"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
