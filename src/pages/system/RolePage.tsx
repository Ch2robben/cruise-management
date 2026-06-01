import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { roleApi } from '@/mock/api'
import type { Role, PaginatedResult, SearchParams } from '@/types'
import { formatDateTime } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'

interface RoleForm { code: string; name: string; description: string }
const emptyForm: RoleForm = { code: '', name: '', description: '' }

export default function RolePage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<Role>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<RoleForm>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<Role | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')
  const [permOpen, setPermOpen] = useState(false)

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    if (keyword.trim()) params.keyword = keyword.trim()
    if (statusFilter !== 'all') params.status = statusFilter
    const result = await roleApi.list(params)
    setData(result)
    setLoading(false)
  }, [keyword, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSearch = () => fetchData(1)
  const handleReset = () => { setKeyword(''); setStatusFilter('all') }
  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormOpen(true) }
  const openEdit = (r: Role) => { setEditingId(r.id); setForm({ code: r.code, name: r.name, description: r.description }); setFormOpen(true) }
  const openDetail = async (r: Role) => { const item = await roleApi.getById(r.id); setDetail(item || null); setDetailOpen(true) }

  const handleSubmit = async () => {
    if (!form.code.trim() || !form.name.trim()) return
    setFormLoading(true)
    if (editingId) {
      await roleApi.update(editingId, form)
    } else {
      const now = new Date().toISOString()
      await roleApi.create({ ...form, status: 'enabled', createdAt: now } as Role)
    }
    setFormLoading(false); setFormOpen(false); fetchData(data.page)
  }

  const handleToggleStatus = async (id: string) => { await roleApi.toggleStatus(id); fetchData(data.page) }
  const handleDelete = async () => { await roleApi.remove(confirmId); setConfirmOpen(false); fetchData(data.page) }

  const columns = [
    { key: 'code', title: '角色编码', dataIndex: 'code' as keyof Role },
    { key: 'name', title: '角色名称', dataIndex: 'name' as keyof Role },
    { key: 'description', title: '角色说明', dataIndex: 'description' as keyof Role },
    { key: 'status', title: '状态', render: (r: Role) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', title: '创建时间', render: (r: Role) => formatDateTime(r.createdAt) },
    {
      key: 'actions', title: '操作', width: '200px',
      render: (r: Role) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openDetail(r)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">详情</button>
          <button onClick={() => openEdit(r)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">编辑</button>
          <button onClick={() => setPermOpen(true)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">分配权限</button>
          <button onClick={() => handleToggleStatus(r.id)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">{r.status === 'enabled' ? '禁用' : '启用'}</button>
          <button onClick={() => { setConfirmId(r.id); setConfirmOpen(true) }} className="px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded">删除</button>
        </div>
      ),
    },
  ]

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent'

  return (
    <div>
      <PageHeader title="角色管理" description="管理角色及对应权限" />
      <SearchPanel onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">关键词</label><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="角色编码/名称" className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">状态</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"><option value="all">全部</option><option value="enabled">启用</option><option value="disabled">禁用</option></select></div>
      </SearchPanel>
      <div className="bg-white px-9 py-6">
        <button onClick={openCreate} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700"><Plus className="w-4 h-4" />添加</button>
      </div>
      <DataTable columns={columns} dataSource={data.data} loading={loading} rowKey="id" pagination={{ current: data.page, pageSize: data.pageSize, total: data.total, onChange: (page) => fetchData(page) }} />

      <FormDialog open={formOpen} title={editingId ? '编辑角色' : '新增角色'} loading={formLoading} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基本信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">角色编码 <span className="text-red-500">*</span></label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-sm text-gray-700 mb-1">角色名称 <span className="text-red-500">*</span></label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></div>
            </div>
          </div>
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">权限说明</h4>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none" />
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="角色详情" onClose={() => setDetailOpen(false)}>
        {detail && (<><DetailCard title="基本信息"><DetailRow label="角色编码" value={detail.code} mono /><DetailRow label="角色名称" value={detail.name} /><DetailRow label="状态" value={<StatusBadge status={detail.status} />} /></DetailCard><DetailCard title="权限说明"><p className="text-sm text-gray-700">{detail.description || '-'}</p></DetailCard><DetailCard title="操作信息"><DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} /></DetailCard></>)}
      </DetailDrawer>

      <ConfirmDialog open={confirmOpen} title="删除角色" message="确定要删除该角色吗？关联用户将失去对应权限，此操作不可恢复。" danger onConfirm={handleDelete} onCancel={() => setConfirmOpen(false)} />

      {/* 分配权限预留弹窗 */}
      {permOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"><div className="absolute inset-0 bg-black/40" onClick={() => setPermOpen(false)} /><div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6"><h3 className="text-base font-semibold text-gray-900 mb-4">分配权限</h3><p className="text-sm text-gray-500 mb-4">权限分配功能将在后续版本中实现，敬请期待。</p><div className="flex justify-end"><button onClick={() => setPermOpen(false)} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">关闭</button></div></div></div>
      )}
    </div>
  )
}
