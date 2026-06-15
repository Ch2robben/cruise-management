import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { ageGroupApi } from '@/mock/api'
import type { AgeGroup, PaginatedResult, SearchParams } from '@/types'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'

interface AgeGroupForm {
  name: string
  minAge: number
  maxAge: number
  remark: string
}

const emptyForm: AgeGroupForm = {
  name: '',
  minAge: 0,
  maxAge: 120,
  remark: '',
}

export default function AgeGroupPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<AgeGroup>>({ data: [], total: 0, page: 1, pageSize: 10 })
  
  // 查询参数
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // 表单状态
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AgeGroupForm>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)

  // 详情状态
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<AgeGroup | null>(null)

  // 删除确认状态
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    if (keyword.trim()) params.keyword = keyword.trim()
    if (statusFilter !== 'all') params.status = statusFilter

    try {
      const result = await ageGroupApi.list(params)
      setData(result)
    } finally {
      setLoading(false)
    }
  }, [keyword, statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => fetchData(1)
  
  const handleReset = () => {
    setKeyword('')
    setStatusFilter('all')
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (r: AgeGroup) => {
    setEditingId(r.id)
    setForm({
      name: r.name,
      minAge: r.minAge,
      maxAge: r.maxAge,
      remark: r.remark || '',
    })
    setFormOpen(true)
  }

  const openDetail = async (r: AgeGroup) => {
    const item = await ageGroupApi.getById(r.id)
    setDetail(item || null)
    setDetailOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || form.minAge < 0 || form.maxAge < form.minAge) return

    setFormLoading(true)
    try {
      if (editingId) {
        await ageGroupApi.update(editingId, form)
      } else {
        await ageGroupApi.create({ ...form, status: 'enabled' } as AgeGroup)
      }
      setFormOpen(false)
      fetchData(data.page)
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggleStatus = async (id: string) => {
    await ageGroupApi.toggleStatus(id)
    fetchData(data.page)
  }

  const handleDelete = async () => {
    await ageGroupApi.remove(confirmId)
    setConfirmOpen(false)
    fetchData(data.page)
  }

  const columns = [
    { key: 'name', title: '年龄段名称', dataIndex: 'name' as keyof AgeGroup },
    { 
      key: 'range', 
      title: '年龄范围', 
      render: (r: any) => <>{r.minAge} - {r.maxAge} 岁</>
    },
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
      <PageHeader title="年龄段管理" description="管理系统各年龄段划分规则" />

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
            placeholder="年龄段名称"
            className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
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
            新增年龄段
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
        title={editingId ? '编辑年龄段' : '新增年龄段'}
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
              placeholder="如 成人、儿童"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最小年龄 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.minAge}
                onChange={(e) => setForm({ ...form, minAge: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最大年龄 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.maxAge}
                onChange={(e) => setForm({ ...form, maxAge: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
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
        title="年龄段详情"
        onClose={() => setDetailOpen(false)}
      >
        {detail && (
          <div className="space-y-6">
            <DetailCard title="基本信息">
              <DetailRow label="名称" value={detail.name} />
              <DetailRow label="年龄范围" value={`${detail.minAge} - ${detail.maxAge} 岁`} />
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
        title="删除年龄段"
        message="确定要删除该年龄段吗？此操作不可恢复。"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
