import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { holidayApi } from '@/mock/api'
import type { Holiday, PaginatedResult, SearchParams } from '@/types'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'

interface HolidayForm {
  name: string
  date: string
  type: '法定假日' | '周末' | '调休'
  remark: string
}

const emptyForm: HolidayForm = {
  name: '',
  date: '',
  type: '法定假日',
  remark: '',
}

export default function HolidayPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<Holiday>>({ data: [], total: 0, page: 1, pageSize: 10 })
  
  // 查询参数
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // 表单状态
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<HolidayForm>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)

  // 详情状态
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<Holiday | null>(null)

  // 删除确认状态
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    if (keyword.trim()) params.keyword = keyword.trim()
    if (typeFilter !== 'all') params.type = typeFilter
    if (statusFilter !== 'all') params.status = statusFilter

    try {
      const result = await holidayApi.list(params)
      setData(result)
    } finally {
      setLoading(false)
    }
  }, [keyword, typeFilter, statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => fetchData(1)
  
  const handleReset = () => {
    setKeyword('')
    setTypeFilter('all')
    setStatusFilter('all')
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (r: Holiday) => {
    setEditingId(r.id)
    setForm({
      name: r.name,
      date: r.date,
      type: r.type,
      remark: r.remark || '',
    })
    setFormOpen(true)
  }

  const openDetail = async (r: Holiday) => {
    const item = await holidayApi.getById(r.id)
    setDetail(item || null)
    setDetailOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.date.trim()) return

    setFormLoading(true)
    try {
      if (editingId) {
        await holidayApi.update(editingId, form)
      } else {
        await holidayApi.create({ ...form, status: 'enabled' } as Holiday)
      }
      setFormOpen(false)
      fetchData(data.page)
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggleStatus = async (id: string) => {
    await holidayApi.toggleStatus(id)
    fetchData(data.page)
  }

  const handleDelete = async () => {
    await holidayApi.remove(confirmId)
    setConfirmOpen(false)
    fetchData(data.page)
  }

  const columns = [
    { key: 'name', title: '名称', dataIndex: 'name' },
    { key: 'date', title: '日期', dataIndex: 'date' },
    { key: 'type', title: '类型', dataIndex: 'type' },
    {
      key: 'status',
      title: '状态',
      render: (r: any) => <StatusBadge status={r.status} />,
    },
    { key: 'remark', title: '备注', dataIndex: 'remark' },
    {
      key: 'actions',
      title: '操作',
      width: '200px',
      render: (r: any) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openDetail(r)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
            详情
          </button>
          <button onClick={() => openEdit(r)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
            编辑
          </button>
          <button onClick={() => handleToggleStatus(r.id)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
            {r.status === 'enabled' ? '禁用' : '启用'}
          </button>
          <button onClick={() => { setConfirmId(r.id); setConfirmOpen(true) }} className="px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded">
            删除
          </button>
        </div>
      ),
    },
  ]

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"

  return (
    <div>
      <PageHeader title="节假日设置" description="管理系统节假日配置" />

      <SearchPanel
        onSearch={handleSearch}
        onReset={handleReset}
        loading={loading}
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">名称</label>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="名称"
            className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">类型</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="all">全部</option>
            <option value="法定假日">法定假日</option>
            <option value="周末">周末</option>
            <option value="调休">调休</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">状态</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="all">全部</option>
            <option value="enabled">启用</option>
            <option value="disabled">禁用</option>
          </select>
        </div>
      </SearchPanel>

      <div className="bg-white px-9 py-6">
        <div className="mb-4">
          <button onClick={openCreate} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            新增节假日
          </button>
        </div>
        <DataTable
          columns={columns}
          dataSource={data.data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: data.page,
            pageSize: data.pageSize,
            total: data.total,
            onChange: fetchData,
          }}
        />
      </div>

      <FormDialog
        open={formOpen}
        title={editingId ? '编辑节假日' : '新增节假日'}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        loading={formLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="请输入节假日名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as any })}
              className={inputClass}
            >
              <option value="法定假日">法定假日</option>
              <option value="周末">周末</option>
              <option value="调休">调休</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={form.remark}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
              className={inputClass}
              rows={3}
              placeholder="请输入备注说明（选填）"
            />
          </div>
        </div>
      </FormDialog>

      <DetailDrawer
        open={detailOpen}
        title="节假日详情"
        onClose={() => setDetailOpen(false)}
      >
        {detail && (
          <div className="space-y-6">
            <DetailCard title="基本信息">
              <DetailRow label="名称" value={detail.name} />
              <DetailRow label="日期" value={detail.date} />
              <DetailRow label="类型" value={detail.type} />
              <DetailRow label="状态" value={<StatusBadge status={detail.status} />} />
              <DetailRow label="备注" value={detail.remark || '-'} />
            </DetailCard>
            <DetailCard title="系统信息">
              <DetailRow label="创建时间" value={detail.createdAt} />
              <DetailRow label="更新时间" value={detail.updatedAt} />
              <DetailRow label="更新人" value={detail.updatedBy} />
            </DetailCard>
          </div>
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={confirmOpen}
        title="删除节假日"
        message="确定要删除该节假日吗？此操作不可恢复。"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
