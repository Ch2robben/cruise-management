import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { dictionaryApi } from '@/mock/api'
import type { Dictionary, PaginatedResult, SearchParams } from '@/types'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'

interface DictForm { dictCode: string; dictName: string; itemCode: string; itemName: string; sort: number; remark: string }
const emptyForm: DictForm = { dictCode: '', dictName: '', itemCode: '', itemName: '', sort: 1, remark: '' }

export default function DictionaryPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<Dictionary>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [dictCodeFilter, setDictCodeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<DictForm>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<Dictionary | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const [allDicts, setAllDicts] = useState<Dictionary[]>([])
  useEffect(() => { dictionaryApi.list({ pageSize: 50 }).then((r) => setAllDicts(r.data)) }, [])

  const dictCodes = [...new Set(allDicts.map((d) => d.dictCode))]

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    if (keyword.trim()) params.keyword = keyword.trim()
    if (dictCodeFilter !== 'all') params.dictCode = dictCodeFilter
    if (statusFilter !== 'all') params.status = statusFilter
    const result = await dictionaryApi.list(params)
    setData(result)
    setLoading(false)
  }, [keyword, dictCodeFilter, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSearch = () => fetchData(1)
  const handleReset = () => { setKeyword(''); setDictCodeFilter('all'); setStatusFilter('all') }
  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormOpen(true) }
  const openEdit = (r: Dictionary) => { setEditingId(r.id); setForm({ dictCode: r.dictCode, dictName: r.dictName, itemCode: r.itemCode, itemName: r.itemName, sort: r.sort, remark: r.remark }); setFormOpen(true) }
  const openDetail = async (r: Dictionary) => { const item = await dictionaryApi.getById(r.id); setDetail(item || null); setDetailOpen(true) }

  const handleSubmit = async () => {
    if (!form.dictCode.trim() || !form.itemName.trim()) return
    setFormLoading(true)
    if (editingId) {
      await dictionaryApi.update(editingId, form)
    } else {
      await dictionaryApi.create({ ...form, status: 'enabled' } as Dictionary)
    }
    setFormLoading(false); setFormOpen(false); fetchData(data.page)
  }

  const handleToggleStatus = async (id: string) => { await dictionaryApi.toggleStatus(id); fetchData(data.page) }
  const handleDelete = async () => { await dictionaryApi.remove(confirmId); setConfirmOpen(false); fetchData(data.page) }

  const columns = [
    { key: 'dictCode', title: '字典编码', dataIndex: 'dictCode' as keyof Dictionary },
    { key: 'dictName', title: '字典名称', dataIndex: 'dictName' as keyof Dictionary },
    { key: 'itemCode', title: '字典项编码', dataIndex: 'itemCode' as keyof Dictionary },
    { key: 'itemName', title: '字典项名称', dataIndex: 'itemName' as keyof Dictionary },
    { key: 'sort', title: '排序', dataIndex: 'sort' as keyof Dictionary },
    { key: 'status', title: '状态', render: (r: Dictionary) => <StatusBadge status={r.status} /> },
    { key: 'remark', title: '备注', dataIndex: 'remark' as keyof Dictionary },
    {
      key: 'actions', title: '操作', width: '200px',
      render: (r: Dictionary) => (
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
      <PageHeader title="数据字典" description="管理系统数据字典项"><button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"><Plus className="w-4 h-4" />新增字典项</button></PageHeader>
      <SearchPanel onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">关键词</label><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="字典编码/名称/项名" className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">字典编码</label><select value={dictCodeFilter} onChange={(e) => setDictCodeFilter(e.target.value)} className="w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"><option value="all">全部</option>{dictCodes.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">状态</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"><option value="all">全部</option><option value="enabled">启用</option><option value="disabled">禁用</option></select></div>
      </SearchPanel>
      <DataTable columns={columns} dataSource={data.data} loading={loading} rowKey="id" pagination={{ current: data.page, pageSize: data.pageSize, total: data.total, onChange: (page) => fetchData(page) }} />

      <FormDialog open={formOpen} title={editingId ? '编辑字典项' : '新增字典项'} loading={formLoading} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">字典分组</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">字典编码 <span className="text-red-500">*</span></label><input value={form.dictCode} onChange={(e) => setForm({ ...form, dictCode: e.target.value })} placeholder="如 ROUTE_TYPE" className={inputClass} /></div>
              <div><label className="block text-sm text-gray-700 mb-1">字典名称 <span className="text-red-500">*</span></label><input value={form.dictName} onChange={(e) => setForm({ ...form, dictName: e.target.value })} placeholder="如 航线类型" className={inputClass} /></div>
            </div>
          </div>
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">字典项明细</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">字典项编码</label><input value={form.itemCode} onChange={(e) => setForm({ ...form, itemCode: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-sm text-gray-700 mb-1">字典项名称 <span className="text-red-500">*</span></label><input value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-sm text-gray-700 mb-1">排序</label><input type="number" value={form.sort} onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })} className={inputClass} /></div>
              <div><label className="block text-sm text-gray-700 mb-1">备注</label><input value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} className={inputClass} /></div>
            </div>
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="字典项详情" onClose={() => setDetailOpen(false)}>
        {detail && (<><DetailCard title="字典分组"><DetailRow label="字典编码" value={detail.dictCode} mono /><DetailRow label="字典名称" value={detail.dictName} /></DetailCard><DetailCard title="字典项明细"><DetailRow label="字典项编码" value={detail.itemCode} mono /><DetailRow label="字典项名称" value={detail.itemName} /><DetailRow label="排序" value={detail.sort} /><DetailRow label="备注" value={detail.remark || '-'} /><DetailRow label="状态" value={<StatusBadge status={detail.status} />} /></DetailCard></>)}
      </DetailDrawer>

      <ConfirmDialog open={confirmOpen} title="删除字典项" message="确定要删除该字典项吗？可能影响引用该字典项的业务数据，此操作不可恢复。" danger onConfirm={handleDelete} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}
