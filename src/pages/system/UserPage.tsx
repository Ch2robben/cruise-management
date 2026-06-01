import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { userApi } from '@/mock/api'
import { ROLE_OPTIONS } from '@/utils/constants'
import { formatDateTime, generateId } from '@/utils/format'
import type { User, PaginatedResult, SearchParams } from '@/types'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'

interface UserForm {
  account: string; name: string; phone: string; email: string; roleId: string
}

const emptyForm: UserForm = { account: '', name: '', phone: '', email: '', roleId: 'viewer' }

export default function UserPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<User>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<UserForm>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<User | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string }>({ type: '', id: '' })
  const [confirmMessage, setConfirmMessage] = useState('')

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    if (keyword.trim()) params.keyword = keyword.trim()
    if (roleFilter !== 'all') params.roleId = roleFilter
    if (statusFilter !== 'all') params.status = statusFilter
    const result = await userApi.list(params)
    setData(result)
    setLoading(false)
  }, [keyword, roleFilter, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSearch = () => fetchData(1)
  const handleReset = () => { setKeyword(''); setRoleFilter('all'); setStatusFilter('all') }

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormOpen(true) }
  const openEdit = (r: User) => {
    setEditingId(r.id)
    setForm({ account: r.account, name: r.name, phone: r.phone, email: r.email, roleId: r.roleId })
    setFormOpen(true)
  }
  const openDetail = async (r: User) => { const item = await userApi.getById(r.id); setDetail(item || null); setDetailOpen(true) }

  const handleSubmit = async () => {
    if (!form.account.trim() || !form.name.trim()) return
    setFormLoading(true)
    const role = ROLE_OPTIONS.find((r) => r.value === form.roleId)
    if (editingId) {
      await userApi.update(editingId, { ...form, roleName: role?.label || '' })
    } else {
      const now = new Date().toISOString()
      await userApi.create({ ...form, roleName: role?.label || '', status: 'enabled', lastLoginAt: now, createdAt: now } as User)
    }
    setFormLoading(false); setFormOpen(false); fetchData(data.page)
  }

  const handleToggleStatus = async (id: string) => { await userApi.toggleStatus(id); fetchData(data.page) }

  const handleDelete = (id: string) => { setConfirmAction({ type: 'delete', id }); setConfirmMessage('确定要删除该用户吗？此操作不可恢复，用户将无法登录。'); setConfirmOpen(true) }
  const handleResetPwd = (id: string) => { setConfirmAction({ type: 'resetPwd', id }); setConfirmMessage('确定要重置该用户的密码吗？密码将重置为默认密码 123456。'); setConfirmOpen(true) }

  const confirmActionHandler = async () => {
    if (confirmAction.type === 'delete') await userApi.remove(confirmAction.id)
    // resetPwd is mock - no real action needed
    setConfirmOpen(false); fetchData(data.page)
  }

  const columns = [
    { key: 'account', title: '用户账号', dataIndex: 'account' as keyof User },
    { key: 'name', title: '用户姓名', dataIndex: 'name' as keyof User },
    { key: 'phone', title: '手机号', dataIndex: 'phone' as keyof User },
    { key: 'roleName', title: '所属角色', dataIndex: 'roleName' as keyof User },
    { key: 'status', title: '状态', render: (r: User) => <StatusBadge status={r.status} /> },
    { key: 'lastLoginAt', title: '最近登录', render: (r: User) => formatDateTime(r.lastLoginAt) },
    { key: 'createdAt', title: '创建时间', render: (r: User) => formatDateTime(r.createdAt) },
    {
      key: 'actions', title: '操作', width: '200px',
      render: (r: User) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openDetail(r)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">详情</button>
          <button onClick={() => openEdit(r)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">编辑</button>
          <button onClick={() => handleResetPwd(r.id)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">重置密码</button>
          <button onClick={() => handleToggleStatus(r.id)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
            {r.status === 'enabled' ? '禁用' : '启用'}
          </button>
          <button onClick={() => handleDelete(r.id)} className="px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded">删除</button>
        </div>
      ),
    },
  ]

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent'

  return (
    <div>
      <PageHeader title="用户管理" description="管理系统用户账号及权限分配" />

      <SearchPanel onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">关键词</label><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="账号/姓名/手机号" className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">角色</label><select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"><option value="all">全部</option>{ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">状态</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"><option value="all">全部</option><option value="enabled">启用</option><option value="disabled">禁用</option></select></div>
      </SearchPanel>
      <div className="bg-white px-9 py-6">
        <button onClick={openCreate} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700"><Plus className="w-4 h-4" />添加</button>
      </div>

      <DataTable columns={columns} dataSource={data.data} loading={loading} rowKey="id" pagination={{ current: data.page, pageSize: data.pageSize, total: data.total, onChange: (page) => fetchData(page) }} />

      <FormDialog open={formOpen} title={editingId ? '编辑用户' : '新增用户'} loading={formLoading} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基本信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">用户账号 <span className="text-red-500">*</span></label><input value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-sm text-gray-700 mb-1">用户姓名 <span className="text-red-500">*</span></label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-sm text-gray-700 mb-1">手机号</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-sm text-gray-700 mb-1">电子邮箱</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} /></div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">角色分配</h4>
            <div><label className="block text-sm text-gray-700 mb-1">所属角色</label><select value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">{ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="用户详情" onClose={() => setDetailOpen(false)}>
        {detail && (
          <>
            <DetailCard title="基本信息"><DetailRow label="用户账号" value={detail.account} mono /><DetailRow label="用户姓名" value={detail.name} /><DetailRow label="手机号" value={detail.phone} /><DetailRow label="电子邮箱" value={detail.email || '-'} /></DetailCard>
            <DetailCard title="账户信息"><DetailRow label="所属角色" value={detail.roleName} /><DetailRow label="状态" value={<StatusBadge status={detail.status} />} /><DetailRow label="最近登录" value={formatDateTime(detail.lastLoginAt)} /><DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} /></DetailCard>
          </>
        )}
      </DetailDrawer>

      <ConfirmDialog open={confirmOpen} title={confirmAction.type === 'delete' ? '删除用户' : '重置密码'} message={confirmMessage} danger={confirmAction.type === 'delete'} onConfirm={confirmActionHandler} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}
