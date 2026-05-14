import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { attractionApi, portApi } from '@/mock/api'
import type { Attraction, AttractionForm, PaginatedResult, SearchParams, Port } from '@/types'
import { formatDateTime } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'

const emptyForm: AttractionForm = { name: '', nameEn: '', portId: '', visitDuration: '', description: '' }

export default function AttractionPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<Attraction>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [portList, setPortList] = useState<Port[]>([])

  // 弹窗
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AttractionForm>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<Attraction | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  // 全文弹窗
  const [descOpen, setDescOpen] = useState(false)
  const [descText, setDescText] = useState('')

  useEffect(() => {
    portApi.list({ pageSize: 50 }).then((r) => setPortList(r.data))
  }, [])

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    if (keyword.trim()) params.keyword = keyword.trim()
    const result = await attractionApi.list(params)
    setData(result)
    setLoading(false)
  }, [keyword])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSearch = () => fetchData(1)
  const handleReset = () => setKeyword('')

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormOpen(true) }
  const openEdit = (r: Attraction) => {
    setEditingId(r.id)
    setForm({ name: r.name, nameEn: r.nameEn, portId: r.portId, visitDuration: r.visitDuration || '', description: r.description })
    setFormOpen(true)
  }

  const openDetail = async (r: Attraction) => {
    const item = await attractionApi.getById(r.id)
    setDetail(item || null)
    setDetailOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.portId) return
    setFormLoading(true)
    const port = portList.find((p) => p.id === form.portId)
    if (editingId) {
      await attractionApi.update(editingId, { ...form, portName: port?.name || '', city: port?.city || '' })
    } else {
      const now = new Date().toISOString()
      await attractionApi.create({
        ...form,
        nameEn: form.nameEn || '',
        visitDuration: form.visitDuration || '',
        description: form.description || '',
        portName: port?.name || '',
        city: port?.city || '',
        status: 'enabled',
        updatedBy: '当前用户',
        updatedAt: now,
        createdAt: now,
      } as Attraction)
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
    { key: 'name', title: '景点名称', dataIndex: 'name' as keyof Attraction },
    { key: 'nameEn', title: '英文名称', dataIndex: 'nameEn' as keyof Attraction },
    { key: 'portName', title: '所属港口', dataIndex: 'portName' as keyof Attraction },
    { key: 'city', title: '城市', dataIndex: 'city' as keyof Attraction },
    { key: 'visitDuration', title: '游览时长', dataIndex: 'visitDuration' as keyof Attraction },
    {
      key: 'description', title: '景区介绍',
      render: (r: Attraction) => (
        <div className="max-w-xs">
          <p className="truncate text-gray-600">{r.description?.slice(0, 40) || '-'}</p>
          {r.description && r.description.length > 40 && (
            <button
              onClick={() => { setDescText(r.description); setDescOpen(true) }}
              className="text-xs text-blue-600 hover:underline mt-0.5"
            >全部</button>
          )}
        </div>
      ),
    },
    { key: 'status', title: '状态', render: (r: Attraction) => <StatusBadge status={r.status} /> },
    { key: 'updatedBy', title: '修改人', dataIndex: 'updatedBy' as keyof Attraction },
    { key: 'updatedAt', title: '修改时间', render: (r: Attraction) => formatDateTime(r.updatedAt) },
    {
      key: 'actions', title: '操作', width: '160px',
      render: (r: Attraction) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openDetail(r)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">详情</button>
          <button onClick={() => openEdit(r)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">编辑</button>
          <button onClick={() => { setConfirmId(r.id); setConfirmOpen(true) }} className="px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded">删除</button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="景点管理" description="管理各港口关联的旅游景点信息">
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">
          <Plus className="w-4 h-4" />新增景点
        </button>
      </PageHeader>

      <SearchPanel onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">关键词</label>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="景点名称"
            className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
      </SearchPanel>

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

      {/* 新增/编辑弹窗 */}
      <FormDialog
        open={formOpen}
        title={editingId ? '编辑景点' : '新增景点'}
        loading={formLoading}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基本信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">景点名称 <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">英文名称</label>
                <input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">所属港口 <span className="text-red-500">*</span></label>
                <select value={form.portId} onChange={(e) => setForm({ ...form, portId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
                  <option value="">请选择港口</option>
                  {portList.map((p) => <option key={p.id} value={p.id}>{p.name} - {p.city}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">游览时长</label>
                <input value={form.visitDuration} onChange={(e) => setForm({ ...form, visitDuration: e.target.value })} placeholder="如 5-10月" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">景区介绍</h4>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={500}
              rows={4}
              placeholder="景区介绍（限500个中文字符）"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{form.description.length}/500</p>
          </div>
        </div>
      </FormDialog>

      {/* 详情抽屉 */}
      <DetailDrawer open={detailOpen} title="景点详情" onClose={() => setDetailOpen(false)}>
        {detail && (
          <>
            <DetailCard title="基本信息">
              <DetailRow label="景点名称" value={detail.name} />
              <DetailRow label="英文名称" value={detail.nameEn || '-'} />
              <DetailRow label="所属港口" value={detail.portName} />
              <DetailRow label="城市" value={detail.city} />
              <DetailRow label="游览时长" value={detail.visitDuration || '-'} />
              <DetailRow label="状态" value={<StatusBadge status={detail.status} />} />
            </DetailCard>
            <DetailCard title="景区介绍">
              <p className="text-sm text-gray-700 leading-relaxed">{detail.description || '-'}</p>
            </DetailCard>
            <DetailCard title="操作信息">
              <DetailRow label="修改人" value={detail.updatedBy} />
              <DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} />
              <DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} />
            </DetailCard>
          </>
        )}
      </DetailDrawer>

      {/* 全文弹窗 */}
      {descOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDescOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 max-h-[70vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-gray-900 mb-4">景区介绍</h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{descText}</p>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setDescOpen(false)} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">关闭</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="删除景点"
        message="确定要删除该景点吗？此操作不可恢复。"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
