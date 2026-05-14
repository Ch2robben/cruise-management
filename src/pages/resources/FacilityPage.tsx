import { useState, useEffect, useCallback } from 'react'
import { Plus, ChevronLeft, ChevronRight, X, Upload } from 'lucide-react'
import { facilityApi } from '@/mock/api'
import type { ShipFacility, FacilityForm, PaginatedResult, SearchParams } from '@/types'
import { formatDateTime } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'

const catLabels: Record<string, string> = { dining: '餐饮', entertainment: '娱乐', leisure: '休闲', sports: '运动', service: '服务' }
const catColors: Record<string, string> = { dining: 'bg-orange-100 text-orange-700', entertainment: 'bg-purple-100 text-purple-700', leisure: 'bg-green-100 text-green-700', sports: 'bg-blue-100 text-blue-700', service: 'bg-gray-100 text-gray-700' }
const bizLabels: Record<string, string> = { open: '营业中', closed: '停业', maintenance: '维护中' }
const bizColors: Record<string, string> = { open: 'bg-green-100 text-green-700', closed: 'bg-red-100 text-red-600', maintenance: 'bg-yellow-100 text-yellow-700' }
const chargeLabels: Record<string, string> = { free: '免费', per_time: '按次收费', per_hour: '按时收费' }

const emptyForm: FacilityForm = {
  code: '', name: '', category: 'dining', maxCapacity: 0, bizStatus: 'open',
  chargeType: 'free', chargeAmount: 0, mainImage: '', images: [], description: '',
}

export default function FacilityPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<ShipFacility>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [bizFilter, setBizFilter] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FacilityForm>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<ShipFacility | null>(null)
  const [carouselIdx, setCarouselIdx] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    if (keyword.trim()) params.keyword = keyword.trim()
    if (catFilter !== 'all') params.category = catFilter
    const result = await facilityApi.list(params)
    // 前端过滤 bizStatus（createCrudApi 不支持 bizStatus 字段）
    let items = result.data
    if (bizFilter !== 'all') items = items.filter((f: ShipFacility) => f.bizStatus === bizFilter)
    setData({ ...result, data: items })
    setLoading(false)
  }, [keyword, catFilter, bizFilter])

  useEffect(() => { fetchData() }, [fetchData])
  const handleSearch = () => fetchData(1)
  const handleReset = () => { setKeyword(''); setCatFilter('all'); setBizFilter('all') }

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormOpen(true) }
  const openEdit = (r: ShipFacility) => {
    setEditingId(r.id)
    setForm({ code: r.code, name: r.name, category: r.category, maxCapacity: r.maxCapacity, bizStatus: r.bizStatus, chargeType: r.chargeType, chargeAmount: r.chargeAmount, mainImage: r.mainImage, images: r.images, description: r.description })
    setFormOpen(true)
  }
  const openDetail = async (r: ShipFacility) => { const f = await facilityApi.getById(r.id); setDetail(f || null); setCarouselIdx(0); setDetailOpen(true) }

  const handleSubmit = async () => {
    if (!form.code.trim() || !form.name.trim()) return
    setFormLoading(true)
    const now = new Date().toISOString()
    if (editingId) await facilityApi.update(editingId, { ...form, updatedBy: '当前用户', updatedAt: now })
    else await facilityApi.create({ ...form, status: 'enabled' as const, updatedBy: '当前用户', updatedAt: now, createdAt: now } as ShipFacility)
    setFormLoading(false); setFormOpen(false); fetchData(data.page)
  }

  const handleToggleStatus = async (id: string) => { await facilityApi.toggleStatus(id); fetchData(data.page) }
  const handleDelete = (id: string) => { setConfirmId(id); setConfirmOpen(true) }
  const confirmDelete = async () => { await facilityApi.remove(confirmId); setConfirmOpen(false); fetchData(data.page) }

  const formatCharge = (t: string, a: number) => t === 'free' ? '免费' : t === 'per_time' ? `¥${a}/次` : `¥${a}/时`
  const allImages = (d: ShipFacility | null) => { if (!d) return []; const imgs: string[] = []; if (d.mainImage) imgs.push(d.mainImage); return imgs.concat(d.images) }

  const columns = [
    { key: 'code', title: '设施编码', render: (r: ShipFacility) => <span className="font-mono text-xs">{r.code}</span> },
    { key: 'name', title: '设施名称', dataIndex: 'name' as keyof ShipFacility },
    { key: 'category', title: '设施分类', render: (r: ShipFacility) => <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${catColors[r.category]}`}>{catLabels[r.category]}</span> },
    { key: 'maxCapacity', title: '容纳人数', render: (r: ShipFacility) => `${r.maxCapacity}人` },
    { key: 'chargeType', title: '收费类型', render: (r: ShipFacility) => formatCharge(r.chargeType, r.chargeAmount) },
    { key: 'bizStatus', title: '营业状态', render: (r: ShipFacility) => <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${bizColors[r.bizStatus]}`}>{bizLabels[r.bizStatus]}</span> },
    { key: 'updatedBy', title: '修改人', dataIndex: 'updatedBy' as keyof ShipFacility },
    { key: 'updatedAt', title: '修改时间', render: (r: ShipFacility) => formatDateTime(r.updatedAt) },
    { key: 'actions', title: '操作', width: '160px', render: (r: ShipFacility) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openDetail(r)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">详情</button>
        <button onClick={() => openEdit(r)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">编辑</button>
        <button onClick={() => handleToggleStatus(r.id)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">{r.status === 'enabled' ? '停用' : '启用'}</button>
        <button onClick={() => handleDelete(r.id)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">删除</button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="游轮设施管理" description="管理游轮通用设施资源：餐饮、娱乐、休闲、运动、服务">
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"><Plus className="w-4 h-4" />新增设施</button>
      </PageHeader>
      <SearchPanel onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">关键词</label><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="设施编码/名称" className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">设施分类</label><select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option>{Object.entries(catLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">营业状态</label><select value={bizFilter} onChange={(e) => setBizFilter(e.target.value)} className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option>{Object.entries(bizLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      </SearchPanel>
      <DataTable columns={columns} dataSource={data.data} loading={loading} rowKey="id" pagination={{ current: data.page, pageSize: data.pageSize, total: data.total, onChange: (page) => fetchData(page) }} />

      <FormDialog open={formOpen} title={editingId ? '编辑设施' : '新增设施'} loading={formLoading} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基本信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">设施编码 <span className="text-red-500">*</span></label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">设施名称 <span className="text-red-500">*</span></label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">设施分类 <span className="text-red-500">*</span></label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as FacilityForm['category'] })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{Object.entries(catLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">最大容纳人数</label><input type="number" value={form.maxCapacity || ''} onChange={(e) => setForm({ ...form, maxCapacity: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            </div>
          </div>
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">营业规则</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">营业状态</label><select value={form.bizStatus} onChange={(e) => setForm({ ...form, bizStatus: e.target.value as FacilityForm['bizStatus'] })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{Object.entries(bizLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">收费类型</label><select value={form.chargeType} onChange={(e) => setForm({ ...form, chargeType: e.target.value as FacilityForm['chargeType'], chargeAmount: e.target.value === 'free' ? 0 : form.chargeAmount })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{Object.entries(chargeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              {form.chargeType !== 'free' && <div><label className="block text-sm text-gray-700 mb-1">收费标准(¥)</label><input type="number" value={form.chargeAmount || ''} onChange={(e) => setForm({ ...form, chargeAmount: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>}
            </div>
          </div>
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">设施详情</h4>
            <div className="space-y-3">
              <div><label className="block text-sm text-gray-700 mb-1">设施主图</label><div className="flex items-center gap-2"><button type="button" onClick={() => { const u = prompt('图片URL:'); if (u) setForm({ ...form, mainImage: u }) }} className="px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50"><Upload className="w-3 h-3 inline mr-1" />上传</button>{form.mainImage && <span className="text-xs text-gray-400 truncate max-w-[200px]">{form.mainImage}</span>}</div></div>
              <div><label className="block text-sm text-gray-700 mb-1">设施相册（最多5张）</label><div className="flex flex-wrap gap-2">{form.images.map((img, i) => <div key={i} className="relative w-16 h-16 border rounded overflow-hidden group"><div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">图{i + 1}</div><button onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })} className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-bl text-xs flex items-center justify-center opacity-0 group-hover:opacity-100">×</button></div>)}{form.images.length < 5 && <button type="button" onClick={() => { const u = prompt('图片URL:'); if (u) setForm({ ...form, images: [...form.images, u] }) }} className="w-16 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 hover:border-gray-500"><Plus className="w-4 h-4" /></button>}</div></div>
              <div><label className="block text-sm text-gray-700 mb-1">详细介绍</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={500} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" /><span className="text-xs text-gray-400">{form.description.length}/500</span></div>
            </div>
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="设施详情" onClose={() => setDetailOpen(false)}>
        {detail && (<>
          <DetailCard title="基本信息"><DetailRow label="设施编码" value={detail.code} mono /><DetailRow label="设施名称" value={detail.name} /><DetailRow label="设施分类" value={catLabels[detail.category]} /><DetailRow label="容纳人数" value={`${detail.maxCapacity}人`} /><DetailRow label="状态" value={<StatusBadge status={detail.status} />} /></DetailCard>
          <DetailCard title="营业规则"><DetailRow label="营业状态" value={<span className={`px-1.5 py-0.5 rounded text-xs font-medium ${bizColors[detail.bizStatus]}`}>{bizLabels[detail.bizStatus]}</span>} /><DetailRow label="收费类型" value={formatCharge(detail.chargeType, detail.chargeAmount)} /></DetailCard>
          {allImages(detail).length > 0 && (
            <DetailCard title={`设施图片（${allImages(detail).length}张）`}>
              <div className="relative">
                <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm">设施图片 {carouselIdx + 1}/{allImages(detail).length}</div>
                </div>
                {allImages(detail).length > 1 && (
                  <div className="flex justify-between absolute inset-y-0 left-0 right-0 px-2">
                    <button onClick={() => setCarouselIdx((i) => Math.max(0, i - 1))} disabled={carouselIdx === 0} className="p-1 bg-black/30 text-white rounded-full hover:bg-black/50 disabled:opacity-20 self-center"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => setCarouselIdx((i) => Math.min(allImages(detail).length - 1, i + 1))} disabled={carouselIdx === allImages(detail).length - 1} className="p-1 bg-black/30 text-white rounded-full hover:bg-black/50 disabled:opacity-20 self-center"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            </DetailCard>
          )}
          <DetailCard title="设施介绍"><p className="text-sm text-gray-700">{detail.description || '-'}</p></DetailCard>
          <DetailCard title="操作信息"><DetailRow label="修改人" value={detail.updatedBy} /><DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} /><DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} /></DetailCard>
        </>)}
      </DetailDrawer>
      <ConfirmDialog open={confirmOpen} title="删除设施" message="确定要删除该设施吗？此操作不可恢复。" danger onConfirm={confirmDelete} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}
