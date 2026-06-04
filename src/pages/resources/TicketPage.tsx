import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { ticketApi } from '@/mock/api'
import type { Ticket, TicketForm, PaginatedResult, SearchParams } from '@/types'
import { formatDateTime } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'

const guestTypeLabels: Record<string, string> = { adult: '成人', baby: '婴儿', child: '儿童' }
const occupancyTypeOptions: TicketForm['occupancyType'][] = ['不拼房', '拼房', '加床', '不占座']

const emptyForm: TicketForm = {
  name: '', guestType: 'adult', occupancyType: '不拼房', priceCoefficient: 1.0,
  shareRoomType: 'amount', shareRoomDirection: 'increase', shareRoomValue: 0,
  extraBedType: 'amount', extraBedDirection: 'increase', extraBedValue: 0,
  tipType: '不收取', tipValue: 0,
}

export default function TicketPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<Ticket>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TicketForm>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<Ticket | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    if (keyword.trim()) params.keyword = keyword.trim()
    if (statusFilter !== 'all') params.status = statusFilter
    const result = await ticketApi.list(params)
    setData(result)
    setLoading(false)
  }, [keyword, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])
  const handleSearch = () => fetchData(1)
  const handleReset = () => { setKeyword(''); setStatusFilter('all') }

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormOpen(true) }
  const openEdit = (r: Ticket) => {
    setEditingId(r.id)
    setForm({ name: r.name, guestType: r.guestType, occupancyType: r.occupancyType || '不拼房', priceCoefficient: r.priceCoefficient, shareRoomType: r.shareRoomType, shareRoomDirection: r.shareRoomDirection || 'increase', shareRoomValue: r.shareRoomValue, extraBedType: r.extraBedType, extraBedDirection: r.extraBedDirection || 'increase', extraBedValue: r.extraBedValue, tipType: r.tipType, tipValue: r.tipValue })
    setFormOpen(true)
  }
  const openDetail = async (r: Ticket) => { const t = await ticketApi.getById(r.id); setDetail(t || null); setDetailOpen(true) }

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setFormLoading(true)
    const now = new Date().toISOString()
    if (editingId) await ticketApi.update(editingId, { ...form, updatedBy: '当前用户', updatedAt: now })
    else await ticketApi.create({ ...form, status: 'enabled' as const, updatedBy: '当前用户', updatedAt: now, createdAt: now } as Ticket)
    setFormLoading(false); setFormOpen(false); fetchData(data.page)
  }

  const handleToggleStatus = async (id: string) => { await ticketApi.toggleStatus(id); fetchData(data.page) }
  const handleDelete = (id: string) => { setConfirmId(id); setConfirmOpen(true) }
  const confirmDelete = async () => { await ticketApi.remove(confirmId); setConfirmOpen(false); fetchData(data.page) }

  const columns = [
    { key: 'name', title: '票名称', dataIndex: 'name' as keyof Ticket },
    { key: 'guestType', title: '游客类型', render: (r: Ticket) => <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">{guestTypeLabels[r.guestType]}</span> },
    { key: 'occupancyType', title: '入住类型', render: (r: Ticket) => r.occupancyType || '-' },
    { key: 'status', title: '状态', render: (r: Ticket) => <StatusBadge status={r.status} /> },
    { key: 'updatedBy', title: '修改人', dataIndex: 'updatedBy' as keyof Ticket },
    { key: 'updatedAt', title: '修改时间', render: (r: Ticket) => formatDateTime(r.updatedAt) },
    { key: 'actions', title: '操作', width: '160px', render: (r: Ticket) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openDetail(r)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">详情</button>
        <button onClick={() => openEdit(r)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">编辑</button>
        <button onClick={() => handleToggleStatus(r.id)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">{r.status === 'enabled' ? '禁用' : '启用'}</button>
        <button onClick={() => handleDelete(r.id)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">删除</button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="票类管理" description="管理游轮票类基础信息、游客类型和入住类型。" />
      <SearchPanel onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">关键词</label><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="票名称" className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">状态</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option><option value="enabled">启用</option><option value="disabled">禁用</option></select></div>
      </SearchPanel>
      <div className="bg-white px-9 py-6">
        <button onClick={openCreate} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700"><Plus className="w-4 h-4" />添加</button>
      </div>
      <DataTable columns={columns} dataSource={data.data} loading={loading} rowKey="id" pagination={{ current: data.page, pageSize: data.pageSize, total: data.total, onChange: (page) => fetchData(page) }} />

      <FormDialog open={formOpen} title={editingId ? '编辑票类' : '新增票类'} loading={formLoading} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基本信息</h4>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">票名称 <span className="text-red-500">*</span></label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">游客类型</label><select value={form.guestType} onChange={(e) => { const gt = e.target.value as TicketForm['guestType']; const defaults: Record<string, number> = { adult: 1.0, baby: 0.1, child: 0.3 }; setForm({ ...form, guestType: gt, priceCoefficient: defaults[gt] }) }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="adult">成人</option><option value="baby">婴儿</option><option value="child">儿童</option></select></div>
              <div><label className="block text-sm text-gray-700 mb-1">入住类型</label><select value={form.occupancyType} onChange={(e) => setForm({ ...form, occupancyType: e.target.value as TicketForm['occupancyType'] })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{occupancyTypeOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
            </div>
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="票类详情" onClose={() => setDetailOpen(false)}>
        {detail && (<>
          <DetailCard title="基本信息"><DetailRow label="票名称" value={detail.name} /><DetailRow label="游客类型" value={guestTypeLabels[detail.guestType]} /><DetailRow label="入住类型" value={detail.occupancyType || '-'} /><DetailRow label="状态" value={<StatusBadge status={detail.status} />} /></DetailCard>
          <DetailCard title="操作信息"><DetailRow label="修改人" value={detail.updatedBy} /><DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} /><DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} /></DetailCard>
        </>)}
      </DetailDrawer>
      <ConfirmDialog open={confirmOpen} title="删除票类" message="确定要删除该票类吗？此操作不可恢复。" danger onConfirm={confirmDelete} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}
