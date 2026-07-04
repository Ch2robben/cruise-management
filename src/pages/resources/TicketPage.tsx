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
const occupancyTypeOptions: TicketForm['occupancyType'][] = ['标准入住', '同性拼房', '加床', '不占床']

const emptyForm: TicketForm = {
  ticketId: '', name: '', guestType: 'adult', occupancyType: '标准入住', personCount: 1, priceCoefficient: 1.0,
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
  const [baseName, setBaseName] = useState('')
  const [baseTicketId, setBaseTicketId] = useState('')
  const [multiForms, setMultiForms] = useState<(TicketForm & { _key: string })[]>([])
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

  const openCreate = () => { 
    setEditingId(null)
    setBaseName('')
    setBaseTicketId('')
    setMultiForms([{ ...emptyForm, _key: Date.now().toString() }])
    setFormOpen(true) 
  }
  const openEdit = (r: Ticket) => {
    setEditingId(r.id)
    setBaseName(r.name)
    setBaseTicketId(r.ticketId)
    setMultiForms([{
      _key: 'edit', ticketId: r.ticketId, name: r.name, guestType: r.guestType, occupancyType: r.occupancyType || '标准入住', personCount: r.personCount || 1,
      priceCoefficient: r.priceCoefficient, shareRoomType: r.shareRoomType, shareRoomDirection: r.shareRoomDirection || 'increase',
      shareRoomValue: r.shareRoomValue, extraBedType: r.extraBedType, extraBedDirection: r.extraBedDirection || 'increase',
      extraBedValue: r.extraBedValue, tipType: r.tipType, tipValue: r.tipValue
    }])
    setFormOpen(true)
  }
  const openDetail = async (r: Ticket) => { const t = await ticketApi.getById(r.id); setDetail(t || null); setDetailOpen(true) }

  const handleSubmit = async () => {
    if (!baseName.trim() || multiForms.length === 0) return
    setFormLoading(true)
    const now = new Date().toISOString()
    
    if (editingId) {
      const { _key, ...rest } = multiForms[0]
      await ticketApi.update(editingId, { ...rest, ticketId: baseTicketId.trim(), name: baseName.trim(), updatedBy: '当前用户', updatedAt: now })
    } else {
      for (const form of multiForms) {
        const { _key, ...rest } = form
        await ticketApi.create({ ...rest, ticketId: baseTicketId.trim(), name: baseName.trim(), status: 'enabled' as const, updatedBy: '当前用户', updatedAt: now, createdAt: now } as Ticket)
      }
    }
    setFormLoading(false); setFormOpen(false); fetchData(data.page)
  }

  const handleToggleStatus = async (id: string) => { await ticketApi.toggleStatus(id); fetchData(data.page) }
  const handleDelete = (id: string) => { setConfirmId(id); setConfirmOpen(true) }
  const confirmDelete = async () => { await ticketApi.remove(confirmId); setConfirmOpen(false); fetchData(data.page) }

  const columns = [
    { key: 'ticketId', title: '票ID', dataIndex: 'ticketId' as keyof Ticket },
    { key: 'name', title: '票名称', dataIndex: 'name' as keyof Ticket },
    { key: 'guestType', title: '游客类型', render: (r: Ticket) => <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">{guestTypeLabels[r.guestType]}</span> },
    { key: 'occupancyType', title: '入住类型', render: (r: Ticket) => r.occupancyType || '-' },
    { key: 'personCount', title: '计数人数', render: (r: Ticket) => r.personCount ?? 1 },
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

      <FormDialog open={formOpen} title={editingId ? '编辑票类' : '新增票类'} width="max-w-2xl" loading={formLoading} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基本信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">票名称 <span className="text-red-500">*</span></label>
                <input 
                  value={baseName} 
                  onChange={(e) => setBaseName(e.target.value)} 
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-shadow" 
                  placeholder="请输入公用票名称，如: 成人特惠票"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">票ID</label>
                <input
                  type="text"
                  value={baseTicketId}
                  onChange={(e) => setBaseTicketId(e.target.value)}
                  placeholder="票ID"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-shadow"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">游客及入住类型</h4>
                <p className="mt-1 text-xs text-gray-400">每添加 1 个类型，价格系数公式中对应增加 1 个 P 变量（P1、P2…）</p>
              </div>
              {!editingId && (
                <button
                  type="button"
                  onClick={() => setMultiForms([...multiForms, { ...emptyForm, _key: Date.now().toString() + Math.random() }])}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
                >
                  <Plus className="w-4 h-4" /> 添加类型
                </button>
              )}
            </div>
            
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 pb-2">
              {multiForms.map((mf, index) => (
                <div key={mf._key} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 relative group transition-colors hover:border-blue-200 hover:bg-blue-50/30">
                  {!editingId && multiForms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setMultiForms(multiForms.filter(f => f._key !== mf._key))}
                      className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-white border border-gray-300 text-gray-400 hover:text-red-500 hover:border-red-300 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                    >
                      ×
                    </button>
                  )}
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">游客类型</label>
                      <select 
                        value={mf.guestType} 
                        onChange={(e) => { 
                          const gt = e.target.value as TicketForm['guestType']; 
                          const defaults: Record<string, number> = { adult: 1.0, baby: 0.1, child: 0.3 }; 
                          const newForms = [...multiForms]
                          newForms[index].guestType = gt
                          newForms[index].priceCoefficient = defaults[gt]
                          setMultiForms(newForms) 
                        }} 
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none transition-shadow"
                      >
                        <option value="adult">成人</option>
                        <option value="baby">婴儿</option>
                        <option value="child">儿童</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">入住类型</label>
                      <select 
                        value={mf.occupancyType} 
                        onChange={(e) => { 
                          const ot = e.target.value as TicketForm['occupancyType']
                          const newForms = [...multiForms]
                          newForms[index].occupancyType = ot
                          setMultiForms(newForms) 
                        }} 
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none transition-shadow"
                      >
                        {occupancyTypeOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">计数人数</label>
                      <input 
                        type="number"
                        min="1"
                        value={mf.personCount} 
                        onChange={(e) => { 
                          const pc = parseInt(e.target.value) || 1
                          const newForms = [...multiForms]
                          newForms[index].personCount = pc
                          setMultiForms(newForms) 
                        }} 
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none transition-shadow"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="票类详情" onClose={() => setDetailOpen(false)}>
        {detail && (<>
          <DetailCard title="基本信息"><DetailRow label="票ID" value={detail.ticketId} /><DetailRow label="票名称" value={detail.name} /><DetailRow label="游客类型" value={guestTypeLabels[detail.guestType]} /><DetailRow label="入住类型" value={detail.occupancyType || '-'} /><DetailRow label="状态" value={<StatusBadge status={detail.status} />} /></DetailCard>
          <DetailCard title="操作信息"><DetailRow label="修改人" value={detail.updatedBy} /><DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} /><DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} /></DetailCard>
        </>)}
      </DetailDrawer>
      <ConfirmDialog open={confirmOpen} title="删除票类" message="确定要删除该票类吗？此操作不可恢复。" danger onConfirm={confirmDelete} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}
