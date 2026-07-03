import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { portApi, attractionApi } from '@/mock/api'
import type { Attraction, PaginatedResult, Port, PortForm, SearchParams } from '@/types'
import { formatDateTime, formatDurationMinutes } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'
import RegionCascadeSelect from '@/components/common/RegionCascadeSelect'
import { findProvinceByCity } from '@/mock/regionData'
import { RIVER_REACH_LABEL, RIVER_REACH_OPTIONS } from '@/utils/constants'

const emptyForm: PortForm = {
  name: '',
  nameEn: '',
  code: '',
  city: '',
  province: '',
  district: '',
  address: '',
  longitude: 0,
  latitude: 0,
  pierType: '客运码头',
  berthCount: 1,
  maxShipLength: 120,
  maxDraft: 3.5,
  dockingWindow: '全天',
  supportedShipTypes: '内河游轮',
  services: '',
  transferInfo: '',
  remark: '',
  sort: 1,
  riverReach: '',
  mileageKm: 0,
  prevPierUpstreamMin: 0,
  nextPierDownstreamMin: 0,
}

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'

export default function PortPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<Port>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [cityFilter, setCityFilter] = useState('all')
  const [reachFilter, setReachFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [allPiers, setAllPiers] = useState<Port[]>([])

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PortForm>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<Port | null>(null)
  const [detailAttractions, setDetailAttractions] = useState<Attraction[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const fetchData = useCallback(async (
    page = 1,
    overrides?: { keyword?: string; city?: string; riverReach?: string; status?: string },
  ) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    const nextKeyword = overrides?.keyword ?? keyword
    const nextCity = overrides?.city ?? cityFilter
    const nextReach = overrides?.riverReach ?? reachFilter
    const nextStatus = overrides?.status ?? statusFilter
    if (nextKeyword.trim()) params.keyword = nextKeyword.trim()
    if (nextCity !== 'all') params.city = nextCity
    if (nextReach !== 'all') params.riverReach = nextReach
    if (nextStatus !== 'all') params.status = nextStatus
    const result = await portApi.list(params)
    setData(result)
    setLoading(false)
  }, [keyword, cityFilter, reachFilter, statusFilter])

  useEffect(() => {
    fetchData()
    portApi.list({ pageSize: 100 }).then((result) => setAllPiers(result.data))
  }, [fetchData])

  const cityOptions = Array.from(new Set(allPiers.map((item) => item.city).filter(Boolean)))

  const resetFilters = () => {
    setKeyword('')
    setCityFilter('all')
    setReachFilter('all')
    setStatusFilter('all')
    fetchData(1, { keyword: '', city: 'all', riverReach: 'all', status: 'all' })
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (record: Port) => {
    setEditingId(record.id)
    setForm({
      name: record.name,
      nameEn: record.nameEn,
      code: record.code,
      city: record.city,
      province: record.province || findProvinceByCity(record.city),
      district: record.district || '',
      address: record.address || '',
      longitude: record.longitude || 0,
      latitude: record.latitude || 0,
      pierType: record.pierType || '客运码头',
      berthCount: record.berthCount || 1,
      maxShipLength: record.maxShipLength || 0,
      maxDraft: record.maxDraft || 0,
      dockingWindow: record.dockingWindow || '',
      supportedShipTypes: record.supportedShipTypes || '',
      services: record.services || '',
      transferInfo: record.transferInfo || '',
      remark: record.remark || '',
      sort: record.sort,
      riverReach: record.riverReach || '',
      mileageKm: record.mileageKm ?? 0,
      prevPierUpstreamMin: record.prevPierUpstreamMin ?? 0,
      nextPierDownstreamMin: record.nextPierDownstreamMin ?? 0,
    })
    setFormOpen(true)
  }

  const openDetail = async (record: Port) => {
    const [item, attractionResult] = await Promise.all([
      portApi.getById(record.id),
      attractionApi.list({ portId: record.id, pageSize: 100 }),
    ])
    setDetail(item || null)
    setDetailAttractions(attractionResult.data)
    setDetailOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.province.trim() || !form.city.trim()) return
    setFormLoading(true)
    const now = new Date().toISOString()
    if (editingId) {
      await portApi.update(editingId, {
        ...form,
        updatedBy: '当前用户',
        updatedAt: now,
      } as Partial<Port>)
    } else {
      await portApi.create({
        ...form,
        piers: [],
        status: 'enabled',
        updatedBy: '当前用户',
        updatedAt: now,
        createdAt: now,
      } as Omit<Port, 'id'>)
    }
    setFormLoading(false)
    setFormOpen(false)
    fetchData(data.page)
    portApi.list({ pageSize: 100 }).then((result) => setAllPiers(result.data))
  }

  const toggleStatus = async (id: string) => {
    await portApi.toggleStatus(id)
    fetchData(data.page)
  }

  const confirmDelete = async () => {
    await portApi.remove(confirmId)
    setConfirmOpen(false)
    fetchData(data.page)
  }

  const columns = [
    { key: 'name', title: '码头名称', render: (record: Port) => (
      <div>
        <div className="font-medium text-gray-900">{record.name}</div>
        {record.nameEn && <div className="mt-0.5 text-xs text-gray-400">{record.nameEn}</div>}
      </div>
    ) },
    { key: 'code', title: '码头编码', render: (record: Port) => <span className="font-mono text-xs">{record.code || '-'}</span> },
    { key: 'riverReach', title: '江段', width: '90px', render: (record: Port) => (
      <span className="text-sm text-gray-700">{record.riverReach ? RIVER_REACH_LABEL[record.riverReach] : '-'}</span>
    ) },
    { key: 'mileage', title: '段内里程', width: '100px', render: (record: Port) => (
      record.mileageKm != null ? `${record.mileageKm} km` : '-'
    ) },
    { key: 'city', title: '所属城市', render: (record: Port) => {
      const parts = [record.province, record.city, record.district].filter(Boolean)
      return parts.length > 0 ? parts.join(' · ') : '-'
    } },
    { key: 'status', title: '状态', render: (record: Port) => <StatusBadge status={record.status} /> },
    { key: 'actions', title: '操作', width: '210px', render: (record: Port) => (
      <div className="flex items-center gap-2">
        <button onClick={() => openDetail(record)} className="text-sm text-gray-600 hover:text-gray-900">详情</button>
        <button onClick={() => openEdit(record)} className="text-sm text-blue-600 hover:text-blue-700">编辑</button>
        <button onClick={() => toggleStatus(record.id)} className="text-sm text-gray-600 hover:text-gray-900">{record.status === 'enabled' ? '禁用' : '启用'}</button>
        <button onClick={() => { setConfirmId(record.id); setConfirmOpen(true) }} className="text-sm text-red-500 hover:text-red-600">删除</button>
      </div>
    ) },
  ]

  return (
    <div>
      <PageHeader title="码头管理" description="维护长江沿线码头，含上中下游分区与里程锚点。" />

      <SearchPanel onSearch={() => fetchData(1)} onReset={resetFilters} loading={loading}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">码头名称</label>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') fetchData(1) }}
            placeholder="码头名称/编码"
            className="w-52 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">所属城市</label>
          <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} className="w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">全部</option>
            {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">江段</label>
          <select value={reachFilter} onChange={(event) => setReachFilter(event.target.value)} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">全部</option>
            {RIVER_REACH_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">状态</label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">全部</option>
            <option value="enabled">启用</option>
            <option value="disabled">禁用</option>
          </select>
        </div>
      </SearchPanel>

      <div className="bg-white px-9 py-6">
        <button onClick={openCreate} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700">
          <Plus className="w-4 h-4" />新增码头
        </button>
      </div>

      <DataTable
        columns={columns}
        dataSource={data.data}
        loading={loading}
        rowKey="id"
        pagination={{ current: data.page, pageSize: data.pageSize, total: data.total, onChange: fetchData }}
      />

      <FormDialog open={formOpen} title={editingId ? '编辑码头' : '新增码头'} width="max-w-5xl" loading={formLoading} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">基础信息</h4>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="mb-1 block text-sm text-gray-700">码头名称 <span className="text-red-500">*</span></label><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} /></div>
              <div><label className="mb-1 block text-sm text-gray-700">英文名称</label><input value={form.nameEn} onChange={(event) => setForm({ ...form, nameEn: event.target.value })} className={inputClass} /></div>
              <div><label className="mb-1 block text-sm text-gray-700">码头编码</label><input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className={`${inputClass} font-mono`} /></div>
              <RegionCascadeSelect
                province={form.province}
                city={form.city}
                district={form.district}
                required
                onChange={({ province, city, district }) => setForm({ ...form, province, city, district })}
              />
              <div className="col-span-3"><label className="mb-1 block text-sm text-gray-700">详细地址</label><input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className={inputClass} /></div>
              <div><label className="mb-1 block text-sm text-gray-700">经度</label><input type="number" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: Number(event.target.value) })} className={inputClass} /></div>
              <div><label className="mb-1 block text-sm text-gray-700">纬度</label><input type="number" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: Number(event.target.value) })} className={inputClass} /></div>
              <div><label className="mb-1 block text-sm text-gray-700">排序号</label><input type="number" value={form.sort} onChange={(event) => setForm({ ...form, sort: Number(event.target.value) })} className={inputClass} /></div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">江段（上中下游）</label>
                <select value={form.riverReach} onChange={(event) => setForm({ ...form, riverReach: event.target.value as PortForm['riverReach'] })} className={inputClass}>
                  <option value="">未设置</option>
                  {RIVER_REACH_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <div><label className="mb-1 block text-sm text-gray-700">段内里程(km)</label><input type="number" value={form.mileageKm} onChange={(event) => setForm({ ...form, mileageKm: Number(event.target.value) })} className={inputClass} /></div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">上个码头上水时间</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={form.prevPierUpstreamMin || ''}
                    onChange={(event) => setForm({ ...form, prevPierUpstreamMin: Number(event.target.value) })}
                    placeholder="请输入"
                    className={`${inputClass} pr-12`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">hh:mm</span>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">下个码头下水时间</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={form.nextPierDownstreamMin || ''}
                    onChange={(event) => setForm({ ...form, nextPierDownstreamMin: Number(event.target.value) })}
                    placeholder="请输入"
                    className={`${inputClass} pr-12`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">hh:mm</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">补充信息</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3"><label className="mb-1 block text-sm text-gray-700">备注</label><textarea value={form.remark} onChange={(event) => setForm({ ...form, remark: event.target.value })} rows={3} className={inputClass} /></div>
            </div>
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="码头详情" onClose={() => setDetailOpen(false)}>
        {detail && (<>
          <DetailCard title="基础信息">
            <DetailRow label="码头名称" value={detail.name} />
            <DetailRow label="英文名称" value={detail.nameEn || '-'} />
            <DetailRow label="码头编码" value={detail.code || '-'} mono />
            <DetailRow label="所属城市" value={[detail.province, detail.city, detail.district].filter(Boolean).join(' · ') || '-'} />
            <DetailRow label="详细地址" value={detail.address || '-'} />
            <DetailRow label="经纬度" value={`${detail.longitude || '-'}, ${detail.latitude || '-'}`} />
            <DetailRow label="江段" value={detail.riverReach ? RIVER_REACH_LABEL[detail.riverReach] : '-'} />
            <DetailRow label="段内里程" value={detail.mileageKm != null ? `${detail.mileageKm} km` : '-'} />
            <DetailRow label="上个码头上水时间" value={formatDurationMinutes(detail.prevPierUpstreamMin)} />
            <DetailRow label="下个码头下水时间" value={formatDurationMinutes(detail.nextPierDownstreamMin)} />
            <DetailRow label="状态" value={<StatusBadge status={detail.status} />} />
          </DetailCard>
          <DetailCard title="关联景点">
            {detailAttractions.length === 0 ? (
              <p className="text-sm text-gray-500">暂无关联景点</p>
            ) : (
              <ul className="space-y-2">
                {detailAttractions.map((attraction) => (
                  <li key={attraction.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{attraction.name}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{attraction.category || '-'} · 建议游览 {formatDurationMinutes(attraction.suggestedDurationMin)}</p>
                    </div>
                    <StatusBadge status={attraction.status} />
                  </li>
                ))}
              </ul>
            )}
          </DetailCard>
          <DetailCard title="补充信息">
            <DetailRow label="备注" value={detail.remark || '-'} />
          </DetailCard>
          <DetailCard title="操作信息">
            <DetailRow label="修改人" value={detail.updatedBy} />
            <DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} />
            <DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} />
          </DetailCard>
        </>)}
      </DetailDrawer>

      <ConfirmDialog
        open={confirmOpen}
        title="删除码头"
        message="确定要删除该码头吗？关联航线和景点可能需要重新选择停靠点。"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
