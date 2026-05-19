import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { menuApi } from '@/mock/api'
import { MENU_TYPES } from '@/utils/constants'
import type { Menu, PaginatedResult, SearchParams } from '@/types'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'

interface MenuForm { name: string; code: string; parentId: string; route: string; type: Menu['type']; sort: number; icon: string; permission: string }
const emptyForm: MenuForm = { name: '', code: '', parentId: '', route: '', type: 'menu', sort: 1, icon: '', permission: '' }

export default function MenuPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<Menu>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<MenuForm>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<Menu | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const [allMenus, setAllMenus] = useState<Menu[]>([])

  useEffect(() => { menuApi.list({ pageSize: 50 }).then((r) => setAllMenus(r.data)) }, [])

  const parentMenus = allMenus.filter((m) => m.type === 'menu')

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    if (keyword.trim()) params.keyword = keyword.trim()
    if (typeFilter !== 'all') params.type = typeFilter
    if (statusFilter !== 'all') params.status = statusFilter
    const result = await menuApi.list(params)
    setData(result)
    setLoading(false)
  }, [keyword, typeFilter, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSearch = () => fetchData(1)
  const handleReset = () => { setKeyword(''); setTypeFilter('all'); setStatusFilter('all') }
  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormOpen(true) }
  const openEdit = (r: Menu) => { setEditingId(r.id); setForm({ name: r.name, code: r.code, parentId: r.parentId || '', route: r.route, type: r.type, sort: r.sort, icon: r.icon, permission: r.permission }); setFormOpen(true) }
  const openDetail = async (r: Menu) => { const item = await menuApi.getById(r.id); setDetail(item || null); setDetailOpen(true) }

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setFormLoading(true)
    const parent = parentMenus.find((m) => m.id === form.parentId)
    if (editingId) {
      await menuApi.update(editingId, { ...form, parentName: parent?.name || '-' })
    } else {
      await menuApi.create({ ...form, parentName: parent?.name || '-', status: 'enabled' } as Menu)
    }
    setFormLoading(false); setFormOpen(false); fetchData(data.page)
  }

  const handleToggleStatus = async (id: string) => { await menuApi.toggleStatus(id); fetchData(data.page) }
  const handleDelete = async () => { await menuApi.remove(confirmId); setConfirmOpen(false); fetchData(data.page) }

  const columns = [
    { key: 'name', title: '菜单名称', dataIndex: 'name' as keyof Menu },
    { key: 'code', title: '菜单编码', dataIndex: 'code' as keyof Menu },
    { key: 'parentName', title: '上级菜单', dataIndex: 'parentName' as keyof Menu },
    { key: 'route', title: '路由地址', dataIndex: 'route' as keyof Menu },
    { key: 'type', title: '类型', render: (r: Menu) => <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${r.type === 'menu' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{r.type === 'menu' ? '菜单' : '按钮'}</span> },
    { key: 'sort', title: '排序', dataIndex: 'sort' as keyof Menu },
    { key: 'status', title: '状态', render: (r: Menu) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', title: '操作', width: '180px',
      render: (r: Menu) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openDetail(r)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">详情</button>
          <button onClick={() => openEdit(r)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">编辑</button>
          <button onClick={() => handleToggleStatus(r.id)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">{r.status === 'enabled' ? '禁用' : '启用'}</button>
          <button onClick={() => { setConfirmId(r.id); setConfirmOpen(true) }} className="px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded">删除</button>
        </div>
      ),
    },
  ]

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent'

  return (
    <div>
      <PageHeader title="菜单管理" description="管理后台菜单结构和权限配置"><button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"><Plus className="w-4 h-4" />新增菜单</button></PageHeader>
      <SearchPanel onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">关键词</label><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="菜单名称/编码" className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">类型</label><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"><option value="all">全部</option>{MENU_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">状态</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"><option value="all">全部</option><option value="enabled">启用</option><option value="disabled">禁用</option></select></div>
      </SearchPanel>
      <DataTable columns={columns} dataSource={data.data} loading={loading} rowKey="id" pagination={{ current: data.page, pageSize: data.pageSize, total: data.total, onChange: (page) => fetchData(page) }} />

      <FormDialog open={formOpen} title={editingId ? '编辑菜单' : '新增菜单'} loading={formLoading} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基本信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">菜单名称 <span className="text-red-500">*</span></label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-sm text-gray-700 mb-1">菜单编码</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-sm text-gray-700 mb-1">上级菜单</label><select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} className={inputClass}><option value="">-</option>{parentMenus.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">路由地址</label><input value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-sm text-gray-700 mb-1">菜单类型 <span className="text-red-500">*</span></label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Menu['type'] })} className={inputClass}>{MENU_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">排序</label><input type="number" value={form.sort} onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })} className={inputClass} /></div>
            </div>
          </div>
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">权限配置</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">图标名称</label><input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="如 LayoutDashboard" className={inputClass} /></div>
              <div><label className="block text-sm text-gray-700 mb-1">权限标识</label><input value={form.permission} onChange={(e) => setForm({ ...form, permission: e.target.value })} placeholder="如 port:create" className={inputClass} /></div>
            </div>
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="菜单详情" onClose={() => setDetailOpen(false)}>
        {detail && (<><DetailCard title="基本信息"><DetailRow label="菜单名称" value={detail.name} /><DetailRow label="菜单编码" value={detail.code || '-'} mono /><DetailRow label="上级菜单" value={detail.parentName} /><DetailRow label="路由地址" value={detail.route || '-'} /><DetailRow label="类型" value={detail.type === 'menu' ? '菜单' : '按钮'} /><DetailRow label="排序" value={detail.sort} /><DetailRow label="状态" value={<StatusBadge status={detail.status} />} /></DetailCard><DetailCard title="权限配置"><DetailRow label="图标名称" value={detail.icon || '-'} /><DetailRow label="权限标识" value={detail.permission || '-'} mono /></DetailCard></>)}
      </DetailDrawer>

      <ConfirmDialog open={confirmOpen} title="删除菜单" message="确定要删除该菜单吗？其下子菜单将被一并移除，此操作不可恢复。" danger onConfirm={handleDelete} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}
