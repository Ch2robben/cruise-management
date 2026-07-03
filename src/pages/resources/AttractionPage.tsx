import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, Upload, X } from 'lucide-react'
import { attractionApi, portApi } from '@/mock/api'
import type { Attraction, AttractionForm, PaginatedResult, Port, RiverReach, SearchParams } from '@/types'
import { formatDateTime, formatDurationMinutes } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'
import PortSelectByReach from '@/components/resources/PortSelectByReach'
import { RIVER_REACH_LABEL, RIVER_REACH_OPTIONS } from '@/utils/constants'
import { loadHierarchicalDictOptions, type HierarchicalDictOption } from '@/utils/hierarchicalDict'

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent'
const categoryOptions = ['自然景观', '历史人文', '工程参观', '城市观光', '民俗体验', '船岸联游']
const difficultyOptions = ['轻松', '适中', '较高']

const emptyForm: AttractionForm = {
  name: '',
  nameEn: '',
  portId: '',
  city: '',
  province: '',
  address: '',
  longitude: 0,
  latitude: 0,
  category: '自然景观',
  attractionService: '',
  images: [],
  visitDuration: '全年',
  suggestedDurationMin: 120,
  portDistanceKm: 0,
  transferDurationMin: 30,
  openSeason: '全年',
  openHours: '08:00-17:30',
  difficulty: '轻松',
  suitableGroups: '普通游客、团队客人',
  bookingRequired: false,
  ticketPolicy: '',
  description: '',
}

const isPreviewableImage = (url: string) => url.startsWith('data:') || url.startsWith('http')

export default function AttractionPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<Attraction>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [portFilter, setPortFilter] = useState('all')
  const [reachFilter, setReachFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [portList, setPortList] = useState<Port[]>([])
  const [serviceOptions, setServiceOptions] = useState<HierarchicalDictOption[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AttractionForm>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<Attraction | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const [descOpen, setDescOpen] = useState(false)
  const [descText, setDescText] = useState('')

  useEffect(() => {
    portApi.list({ pageSize: 100 }).then((result) => setPortList(result.data))
    loadHierarchicalDictOptions('ATTRACTION_SERVICE').then(setServiceOptions)
  }, [])

  const getServiceLabel = (value?: string) => {
    if (!value) return '-'
    return serviceOptions.find((item) => item.value === value)?.label || value
  }

  const handleImageFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || form.images.length >= 5) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((prev) => ({ ...prev, images: [...prev.images, reader.result as string] }))
      }
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const removeImage = (idx: number) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== idx) })
  }

  const fetchData = useCallback(async (
    page = 1,
    overrides?: { keyword?: string; portId?: string; riverReach?: string; category?: string; attractionService?: string; status?: string },
  ) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    const nextKeyword = overrides?.keyword ?? keyword
    const nextPortId = overrides?.portId ?? portFilter
    const nextReach = overrides?.riverReach ?? reachFilter
    const nextCategory = overrides?.category ?? categoryFilter
    const nextService = overrides?.attractionService ?? serviceFilter
    const nextStatus = overrides?.status ?? statusFilter
    if (nextKeyword.trim()) params.keyword = nextKeyword.trim()
    if (nextPortId !== 'all') params.portId = nextPortId
    if (nextReach !== 'all') params.riverReach = nextReach
    if (nextCategory !== 'all') params.category = nextCategory
    if (nextService !== 'all') params.attractionService = nextService
    if (nextStatus !== 'all') params.status = nextStatus
    const result = await attractionApi.list(params)
    setData(result)
    setLoading(false)
  }, [keyword, portFilter, reachFilter, categoryFilter, serviceFilter, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSearch = () => fetchData(1)
  const handleReset = () => {
    setKeyword('')
    setPortFilter('all')
    setReachFilter('all')
    setCategoryFilter('all')
    setServiceFilter('all')
    setStatusFilter('all')
    fetchData(1, { keyword: '', portId: 'all', riverReach: 'all', category: 'all', attractionService: 'all', status: 'all' })
  }

  const patchFormByPort = (portId: string) => {
    const port = portList.find((item) => item.id === portId)
    setForm({
      ...form,
      portId,
      city: port?.city || form.city,
      province: port?.province || form.province,
    })
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (record: Attraction) => {
    setEditingId(record.id)
    setForm({
      name: record.name,
      nameEn: record.nameEn,
      portId: record.portId,
      city: record.city,
      province: record.province || '',
      address: record.address || '',
      longitude: record.longitude || 0,
      latitude: record.latitude || 0,
      category: record.category || '自然景观',
      attractionService: record.attractionService || '',
      images: [...(record.images || [])],
      visitDuration: record.visitDuration || '全年',
      suggestedDurationMin: record.suggestedDurationMin || 120,
      portDistanceKm: record.portDistanceKm || 0,
      transferDurationMin: record.transferDurationMin || 0,
      openSeason: record.openSeason || '全年',
      openHours: record.openHours || '',
      difficulty: record.difficulty || '轻松',
      suitableGroups: record.suitableGroups || '',
      bookingRequired: Boolean(record.bookingRequired),
      ticketPolicy: record.ticketPolicy || '',
      description: record.description || '',
    })
    setFormOpen(true)
  }

  const openDetail = async (record: Attraction) => {
    const item = await attractionApi.getById(record.id)
    setDetail(item || null)
    setDetailOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.portId) return
    setFormLoading(true)
    const now = new Date().toISOString()
    const port = portList.find((item) => item.id === form.portId)
    const payload = {
      ...form,
      nameEn: form.nameEn || '',
      portName: port?.name || '',
      city: form.city || port?.city || '',
      province: form.province || port?.province || '',
      riverReach: port?.riverReach as RiverReach | undefined,
      status: 'enabled' as const,
      updatedBy: '当前用户',
      updatedAt: now,
    }
    if (editingId) {
      await attractionApi.update(editingId, payload)
    } else {
      await attractionApi.create({ ...payload, createdAt: now } as Omit<Attraction, 'id'>)
    }
    setFormLoading(false)
    setFormOpen(false)
    fetchData(data.page)
  }

  const handleDelete = async () => {
    await attractionApi.remove(confirmId)
    setConfirmOpen(false)
    fetchData(data.page)
  }

  const columns = [
    {
      key: 'name',
      title: '景点名称',
      width: '220px',
      render: (record: Attraction) => (
        <div className="flex items-start gap-3">
          {record.images?.[0] && isPreviewableImage(record.images[0]) ? (
            <img src={record.images[0]} alt={record.name} className="h-10 w-10 shrink-0 rounded object-cover" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">无图</div>
          )}
          <div>
            <p className="font-medium text-gray-900">{record.name}</p>
            <p className="mt-1 text-xs text-gray-500">{record.nameEn || '-'}</p>
          </div>
        </div>
      ),
    },
    { key: 'portName', title: '关联码头', dataIndex: 'portName' as keyof Attraction, width: '180px' },
    {
      key: 'riverReach',
      title: '江段',
      width: '80px',
      render: (record: Attraction) => (
        <span className="text-sm text-gray-700">{record.riverReach ? RIVER_REACH_LABEL[record.riverReach] : '-'}</span>
      ),
    },
    {
      key: 'location',
      title: '城市/类型',
      width: '150px',
      render: (record: Attraction) => (
        <div>
          <p className="text-gray-900">{record.city}</p>
          <p className="mt-1 text-xs text-gray-500">{record.category || '-'}</p>
          <p className="mt-1 text-xs text-blue-600">{getServiceLabel(record.attractionService)}</p>
        </div>
      ),
    },
    {
      key: 'duration',
      title: '行程时间',
      width: '190px',
      render: (record: Attraction) => (
        <div className="space-y-1 text-xs">
          <p>游览：<span className="font-medium text-gray-900">{formatDurationMinutes(record.suggestedDurationMin)}</span></p>
          <p>接驳：<span className="font-medium text-gray-900">{formatDurationMinutes(record.transferDurationMin)}</span></p>
        </div>
      ),
    },
    {
      key: 'open',
      title: '开放与预约',
      width: '170px',
      render: (record: Attraction) => (
        <div>
          <p className="text-gray-900">{record.openSeason || record.visitDuration || '-'}</p>
          <p className="mt-1 text-xs text-gray-500">{record.openHours || '-'}</p>
          {record.bookingRequired && <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">需预约</span>}
        </div>
      ),
    },
    {
      key: 'description',
      title: '景点说明',
      width: '240px',
      render: (record: Attraction) => (
        <div className="max-w-xs">
          <p className="truncate text-gray-600">{record.description || '-'}</p>
          {record.description && record.description.length > 28 && (
            <button
              type="button"
              onClick={() => { setDescText(record.description); setDescOpen(true) }}
              className="mt-1 text-xs text-blue-600 hover:underline"
            >
              查看介绍
            </button>
          )}
        </div>
      ),
    },
    { key: 'status', title: '状态', width: '100px', render: (record: Attraction) => <StatusBadge status={record.status} /> },
    {
      key: 'actions',
      title: '操作',
      width: '160px',
      render: (record: Attraction) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openDetail(record)} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900">详情</button>
          <button onClick={() => openEdit(record)} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900">编辑</button>
          <button onClick={() => { setConfirmId(record.id); setConfirmOpen(true) }} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700">删除</button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="景点管理" description="维护可编排行程的岸上景点、关联码头、接驳时间、开放时间和预约要求。" />

      <SearchPanel onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">关键词</label>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="景点名称/城市/说明"
            className="w-52 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">江段</label>
          <select value={reachFilter} onChange={(event) => setReachFilter(event.target.value)} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
            <option value="all">全部江段</option>
            {RIVER_REACH_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">关联码头</label>
          <select value={portFilter} onChange={(event) => setPortFilter(event.target.value)} className="w-56 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
            <option value="all">全部码头</option>
            <PortSelectByReach ports={portList} />
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">景点类型</label>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
            <option value="all">全部类型</option>
            {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">景点服务</label>
          <select value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)} className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
            <option value="all">全部服务</option>
            {serviceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">状态</label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
            <option value="all">全部</option>
            <option value="enabled">启用</option>
            <option value="disabled">禁用</option>
          </select>
        </div>
      </SearchPanel>

      <div className="bg-white px-9 py-6">
        <button onClick={openCreate} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700">
          <Plus className="w-4 h-4" />添加景点
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
        title={editingId ? '编辑景点' : '新增景点'}
        loading={formLoading}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="space-y-5">
          <section>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">基础信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-gray-700">景点名称 <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">英文名称</label>
                <input value={form.nameEn} onChange={(event) => setForm({ ...form, nameEn: event.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">关联码头 <span className="text-red-500">*</span></label>
                <select value={form.portId} onChange={(event) => patchFormByPort(event.target.value)} className={inputClass}>
                  <option value="">请选择码头</option>
                  <PortSelectByReach ports={portList} />
                </select>
                {form.portId && (() => {
                  const port = portList.find((item) => item.id === form.portId)
                  return port?.riverReach ? (
                    <p className="mt-1 text-xs text-gray-500">江段：{RIVER_REACH_LABEL[port.riverReach]}{port.mileageKm != null ? ` · ${port.mileageKm}km` : ''}</p>
                  ) : null
                })()}
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">景点类型</label>
                <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={inputClass}>
                  {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">景点服务</label>
                <select value={form.attractionService} onChange={(event) => setForm({ ...form, attractionService: event.target.value })} className={inputClass}>
                  <option value="">请选择</option>
                  {serviceOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm text-gray-700">景点图片（最多5张）</label>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
                <div className="flex flex-wrap gap-2">
                  {form.images.map((img, idx) => (
                    <div key={`${idx}-${img.slice(0, 24)}`} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200">
                      {isPreviewableImage(img) ? (
                        <img src={img} alt={`景点图${idx + 1}`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs text-gray-400">图{idx + 1}</div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl bg-red-500 text-xs text-white opacity-0 transition group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {form.images.length < 5 && (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-500 hover:text-gray-600"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="text-xs">上传</span>
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">省份</label>
                <input value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">城市</label>
                <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className={inputClass} />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm text-gray-700">详细地址</label>
                <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">经度</label>
                <input type="number" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: Number(event.target.value) })} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">纬度</label>
                <input type="number" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: Number(event.target.value) })} className={inputClass} />
              </div>
            </div>
          </section>

          <section>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">行程编排参数</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-sm text-gray-700">开放季节</label>
                <input value={form.openSeason} onChange={(event) => setForm({ ...form, openSeason: event.target.value, visitDuration: event.target.value })} placeholder="全年 / 3-11月" className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">开放时间</label>
                <input value={form.openHours} onChange={(event) => setForm({ ...form, openHours: event.target.value })} placeholder="08:00-17:30" className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">游览强度</label>
                <select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })} className={inputClass}>
                  {difficultyOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">码头距离(km)</label>
                <input type="number" value={form.portDistanceKm} onChange={(event) => setForm({ ...form, portDistanceKm: Number(event.target.value) })} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">单程接驳(分钟)</label>
                <input type="number" value={form.transferDurationMin} onChange={(event) => setForm({ ...form, transferDurationMin: Number(event.target.value) })} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">建议游览(分钟)</label>
                <input type="number" value={form.suggestedDurationMin} onChange={(event) => setForm({ ...form, suggestedDurationMin: Number(event.target.value) })} className={inputClass} />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm text-gray-700">适配客群</label>
                <input value={form.suitableGroups} onChange={(event) => setForm({ ...form, suitableGroups: event.target.value })} className={inputClass} />
              </div>
              <label className="col-span-3 inline-flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.bookingRequired} onChange={(event) => setForm({ ...form, bookingRequired: event.target.checked })} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                需要提前预约或报备
              </label>
            </div>
          </section>

          <section>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">说明信息</h4>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-700">票务/政策说明</label>
                <textarea value={form.ticketPolicy} onChange={(event) => setForm({ ...form, ticketPolicy: event.target.value })} rows={2} className={`${inputClass} resize-none`} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">景区介绍</label>
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength={500} rows={4} className={`${inputClass} resize-none`} />
                <p className="mt-1 text-xs text-gray-400">{form.description.length}/500</p>
              </div>
            </div>
          </section>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="景点详情" onClose={() => setDetailOpen(false)}>
        {detail && (
          <>
            <DetailCard title="基础信息">
              <DetailRow label="景点名称" value={detail.name} />
              <DetailRow label="英文名称" value={detail.nameEn || '-'} />
              <DetailRow label="关联码头" value={detail.portName} />
              <DetailRow label="江段" value={detail.riverReach ? RIVER_REACH_LABEL[detail.riverReach] : '-'} />
              <DetailRow label="城市" value={`${detail.province || ''}${detail.city ? ` / ${detail.city}` : ''}`} />
              <DetailRow label="景点类型" value={detail.category || '-'} />
              <DetailRow label="景点服务" value={getServiceLabel(detail.attractionService)} />
              <DetailRow label="详细地址" value={detail.address || '-'} />
              <DetailRow label="状态" value={<StatusBadge status={detail.status} />} />
            </DetailCard>
            {(detail.images || []).length > 0 && (
              <DetailCard title="景点图片">
                <div className="flex flex-wrap gap-2">
                  {(detail.images || []).map((img, idx) => (
                    isPreviewableImage(img) ? (
                      <img key={`${idx}-${img.slice(0, 24)}`} src={img} alt={`${detail.name}-${idx + 1}`} className="h-24 w-24 rounded-lg object-cover" />
                    ) : null
                  ))}
                </div>
              </DetailCard>
            )}
            <DetailCard title="行程编排参数">
              <DetailRow label="开放季节" value={detail.openSeason || detail.visitDuration || '-'} />
              <DetailRow label="开放时间" value={detail.openHours || '-'} />
              <DetailRow label="码头距离" value={detail.portDistanceKm || detail.portDistanceKm === 0 ? `${detail.portDistanceKm} km` : '-'} />
              <DetailRow label="单程接驳" value={formatDurationMinutes(detail.transferDurationMin)} />
              <DetailRow label="建议游览" value={formatDurationMinutes(detail.suggestedDurationMin)} />
              <DetailRow label="游览强度" value={detail.difficulty || '-'} />
              <DetailRow label="适配客群" value={detail.suitableGroups || '-'} />
              <DetailRow label="是否需预约" value={detail.bookingRequired ? '是' : '否'} />
            </DetailCard>
            <DetailCard title="说明信息">
              <DetailRow label="票务/政策" value={detail.ticketPolicy || '-'} />
              <p className="mt-3 text-sm leading-relaxed text-gray-700">{detail.description || '-'}</p>
            </DetailCard>
            <DetailCard title="操作信息">
              <DetailRow label="修改人" value={detail.updatedBy} />
              <DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} />
              <DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} />
            </DetailCard>
          </>
        )}
      </DetailDrawer>

      {descOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDescOpen(false)} />
          <div className="relative mx-4 max-h-[70vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-base font-semibold text-gray-900">景区介绍</h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{descText}</p>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setDescOpen(false)} className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200">关闭</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="删除景点"
        message="确定要删除该景点吗？关联行程模板和航次行程可能受影响。"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
