import { useState, useEffect, useCallback } from 'react'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { portApi } from '@/mock/api'
import type { Port, PortForm, Pier, PaginatedResult, SearchParams } from '@/types'
import { formatDateTime, generateId } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'

const emptyPier = (): Omit<Pier, 'id' | 'portId'> => ({ name: '', nameEn: '', sort: 1 })
const emptyForm: PortForm = { name: '', nameEn: '', code: '', city: '', sort: 1, piers: [emptyPier()] }

export default function PortPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<Port>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PortForm>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<Port | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string }>({ type: '', id: '' })

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    if (keyword.trim()) params.keyword = keyword.trim()
    if (statusFilter !== 'all') params.status = statusFilter
    const result = await portApi.list(params)
    setData(result)
    setLoading(false)
  }, [keyword, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])
  const handleSearch = () => fetchData(1)
  const handleReset = () => { setKeyword(''); setStatusFilter('all') }

  const toggleExpand = (id: string) => setExpanded((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormOpen(true) }
  const openEdit = (record: Port) => {
    setEditingId(record.id)
    setForm({
      name: record.name, nameEn: record.nameEn, code: record.code, city: record.city, sort: record.sort,
      piers: record.piers.length > 0 ? record.piers.map((p) => ({ name: p.name, nameEn: p.nameEn, sort: p.sort })) : [emptyPier()],
    })
    setFormOpen(true)
  }
  const openDetail = async (record: Port) => { const r = await portApi.getById(record.id); setDetail(r || null); setDetailOpen(true) }

  // Pier management
  const addPier = () => setForm({ ...form, piers: [...form.piers, emptyPier()] })
  const removePier = (idx: number) => setForm({ ...form, piers: form.piers.filter((_, i) => i !== idx) })
  const updatePier = (idx: number, field: string, value: string | number) => {
    const piers = [...form.piers]
    piers[idx] = { ...piers[idx], [field]: value }
    setForm({ ...form, piers })
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setFormLoading(true)
    if (editingId) {
      await portApi.update(editingId, { ...form, updatedBy: '当前用户', updatedAt: new Date().toISOString() } as Partial<Port>)
    } else {
      const now = new Date().toISOString()
      await portApi.create({ ...form, piers: form.piers.map((p) => ({ ...p, id: generateId(), portId: '' })), province: '', status: 'enabled', updatedBy: '当前用户', updatedAt: now, createdAt: now } as Port)
    }
    setFormLoading(false); setFormOpen(false); fetchData(data.page)
  }

  const handleToggleStatus = async (id: string) => { await portApi.toggleStatus(id); fetchData(data.page) }
  const handleDelete = (id: string) => { setConfirmAction({ type: 'delete', id }); setConfirmOpen(true) }
  const confirmDelete = async () => { await portApi.remove(confirmAction.id); setConfirmOpen(false); fetchData(data.page) }

  const treeCols = [
    { key: 'name', title: '港口名称', p: (r: Port) => r.name, c: (p: Pier) => <><span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-xs mr-1">码头</span>{p.name}</> },
    { key: 'nameEn', title: '英文名称', p: (r: Port) => r.nameEn, c: (p: Pier) => p.nameEn },
    { key: 'code', title: '港口编码', p: (r: Port) => <span className="font-mono text-xs">{r.code}</span>, c: () => '' },
    { key: 'city', title: '城市', p: (r: Port) => r.city, c: () => '' },
    { key: 'sort', title: '排序号', p: (r: Port) => r.sort, c: (p: Pier) => p.sort },
    { key: 'status', title: '状态', p: (r: Port) => <StatusBadge status={r.status} />, c: () => '' },
    { key: 'updatedBy', title: '修改人', p: (r: Port) => r.updatedBy, c: () => '' },
    { key: 'updatedAt', title: '修改时间', p: (r: Port) => formatDateTime(r.updatedAt), c: () => '' },
    { key: 'actions', title: '操作', w: '180px', p: (r: Port) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openDetail(r)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">详情</button>
        <button onClick={() => openEdit(r)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">编辑</button>
        <button onClick={() => handleToggleStatus(r.id)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">{r.status === 'enabled' ? '禁用' : '启用'}</button>
        <button onClick={() => handleDelete(r.id)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">删除</button>
      </div>
    ), c: () => '' },
  ]

  return (
    <div>
      <PageHeader title="港口管理" description="管理国内内河及沿海港口基础信息及关联码头">
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"><Plus className="w-4 h-4" />新增港口</button>
      </PageHeader>
      <SearchPanel onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">关键词</label><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="港口编码/名称" className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">状态</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option><option value="enabled">启用</option><option value="disabled">禁用</option></select></div>
      </SearchPanel>

      {/* 树形表格 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden"><div className="overflow-x-auto"><table className="w-full">
        <thead><tr className="border-b border-gray-200 bg-gray-50">
          <th className="w-10 px-2 py-3" />
          {treeCols.map((col) => <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider" style={col.w ? { width: col.w } : {}}>{col.title}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? <tr><td colSpan={treeCols.length + 1} className="px-4 py-16 text-center text-sm text-gray-400">加载中...</td></tr>
          : data.data.length === 0 ? <tr><td colSpan={treeCols.length + 1} className="px-4 py-16 text-center text-sm text-gray-400">暂无数据</td></tr>
          : data.data.map((record) => (<>
            <tr key={record.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-2 py-2.5">
                {record.piers.length > 0 && <button onClick={() => toggleExpand(record.id)} className="p-1 text-gray-400 hover:text-gray-600">{expanded.has(record.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</button>}
              </td>
              {treeCols.map((col) => <td key={col.key} className="px-4 py-2.5 text-sm text-gray-700 whitespace-nowrap">{col.p(record)}</td>)}
            </tr>
            {expanded.has(record.id) && record.piers.map((pier) => (
              <tr key={pier.id} className="bg-blue-50/30">
                <td className="px-2 py-2"><span className="block w-4 ml-2 border-l-2 border-b-2 border-blue-300 h-3" /></td>
                {treeCols.map((col) => <td key={col.key} className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">{col.c(pier)}</td>)}
              </tr>
            ))}
          </>))}
        </tbody>
      </table></div>
      {data.total > 0 && <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50"><span className="text-sm text-gray-500">共 {data.total} 条</span><div className="flex items-center gap-1"><button onClick={() => fetchData(data.page - 1)} disabled={data.page <= 1} className="px-3 py-1.5 text-sm rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30">上一页</button><button onClick={() => fetchData(data.page + 1)} disabled={data.page >= Math.ceil(data.total / data.pageSize)} className="px-3 py-1.5 text-sm rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30">下一页</button></div></div>}
      </div>

      {/* 表单 */}
      <FormDialog open={formOpen} title={editingId ? '编辑港口' : '新增港口'} loading={formLoading} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基本信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">港口名称 <span className="text-red-500">*</span></label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">英文名称</label><input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">港口编码</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">城市</label><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">排序号</label><input type="number" value={form.sort} onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3"><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">码头管理</h4><button type="button" onClick={addPier} className="text-xs text-blue-600 hover:bg-blue-50 rounded px-2 py-0.5">+ 添加码头</button></div>
            <table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b"><th className="px-3 py-2 text-left text-xs text-gray-500">码头名称</th><th className="px-3 py-2 text-left text-xs text-gray-500">英文名称</th><th className="px-3 py-2 text-left text-xs text-gray-500 w-16">排序</th><th className="px-3 py-2 text-center text-xs text-gray-500 w-12">操作</th></tr></thead>
            <tbody className="divide-y">{form.piers.map((pier, idx) => (
              <tr key={idx}><td className="px-3 py-2"><input value={pier.name} onChange={(e) => updatePier(idx, 'name', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" /></td>
              <td className="px-3 py-2"><input value={pier.nameEn} onChange={(e) => updatePier(idx, 'nameEn', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" /></td>
              <td className="px-3 py-2"><input type="number" value={pier.sort} onChange={(e) => updatePier(idx, 'sort', Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-center" /></td>
              <td className="px-3 py-2 text-center"><button type="button" onClick={() => removePier(idx)} disabled={form.piers.length <= 1} className="text-xs text-red-500 hover:bg-red-50 rounded px-1 py-0.5 disabled:opacity-30">删除</button></td></tr>
            ))}</tbody></table>
          </div>
        </div>
      </FormDialog>

      {/* 详情抽屉 */}
      <DetailDrawer open={detailOpen} title="港口详情" onClose={() => setDetailOpen(false)}>
        {detail && (<>
          <DetailCard title="基本信息"><DetailRow label="港口名称" value={detail.name} /><DetailRow label="英文名称" value={detail.nameEn || '-'} /><DetailRow label="港口编码" value={detail.code || '-'} mono /><DetailRow label="城市" value={detail.city} /><DetailRow label="排序号" value={detail.sort} /><DetailRow label="状态" value={<StatusBadge status={detail.status} />} /></DetailCard>
          <DetailCard title={`码头列表（${detail.piers.length}个）`}>{detail.piers.length > 0 ? detail.piers.map((pier) => <div key={pier.id} className="flex justify-between text-sm py-0.5"><span className="text-gray-700">{pier.name} / {pier.nameEn || '-'}</span><span className="text-gray-400">排序 {pier.sort}</span></div>) : <p className="text-sm text-gray-400">暂无码头</p>}</DetailCard>
          <DetailCard title="操作信息"><DetailRow label="修改人" value={detail.updatedBy} /><DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} /><DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} /></DetailCard>
        </>)}
      </DetailDrawer>
      <ConfirmDialog open={confirmOpen} title="删除港口" message="确定要删除该港口吗？关联的码头也将被一并删除。" danger onConfirm={confirmDelete} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}
