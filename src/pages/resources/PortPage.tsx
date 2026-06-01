import { Fragment, useState, useEffect, useCallback } from 'react'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { portApi } from '@/mock/api'
import type { Port, PortForm, Pier, PaginatedResult, SearchParams } from '@/types'
import { formatDateTime, generateId } from '@/utils/format'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'

const emptyPier = (): Omit<Pier, 'id' | 'portId'> => ({ name: '', nameEn: '', position: '', sort: 1 })
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

  const fetchData = useCallback(async (
    page = 1,
    overrides?: { keyword?: string; status?: string },
  ) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    const nextKeyword = overrides?.keyword ?? keyword
    const nextStatusFilter = overrides?.status ?? statusFilter
    if (nextKeyword.trim()) params.keyword = nextKeyword.trim()
    if (nextStatusFilter !== 'all') params.status = nextStatusFilter
    const result = await portApi.list(params)
    setData(result)
    setLoading(false)
  }, [keyword, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])
  const handleSearch = () => fetchData(1)
  const handleReset = () => {
    setKeyword('')
    setStatusFilter('all')
    fetchData(1, { keyword: '', status: 'all' })
  }

  const toggleExpand = (id: string) => setExpanded((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormOpen(true) }
  const openEdit = (record: Port) => {
    setEditingId(record.id)
    setForm({
      name: record.name, nameEn: record.nameEn, code: record.code, city: record.city, sort: record.sort,
      piers: record.piers.length > 0 ? record.piers.map((p) => ({ name: p.name, nameEn: p.nameEn, position: p.position || '', sort: p.sort })) : [emptyPier()],
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

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize))
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).slice(
    Math.max(0, Math.min(data.page - 3, totalPages - 5)),
    Math.max(0, Math.min(data.page - 3, totalPages - 5)) + Math.min(5, totalPages),
  )

  const renderNameCell = (record: Port) => (
    <div className="flex items-center gap-2">
      {record.piers.length > 0 ? (
        <button
          type="button"
          onClick={() => toggleExpand(record.id)}
          className="flex h-6 w-6 items-center justify-center rounded border border-transparent text-gray-400 transition hover:border-gray-200 hover:bg-gray-50 hover:text-gray-600"
        >
          {expanded.has(record.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      ) : (
        <span className="block w-6" />
      )}
      <div>
        <div className="text-sm font-medium text-gray-900">{record.name}</div>
        {record.nameEn && <div className="mt-0.5 text-xs text-gray-400">{record.nameEn}</div>}
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[32px] font-semibold text-gray-900">港口管理</h2>
      </div>

      <div className="bg-white">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-b border-gray-200 px-9 py-8">
          <div className="flex items-center gap-4">
            <label className="text-[15px] font-medium text-gray-800">港口名称</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              placeholder="请输入内容"
              className="h-12 w-[460px] border border-gray-300 px-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-[15px] font-medium text-gray-800">状态</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 w-36 border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none transition focus:border-blue-500"
            >
              <option value="all">全部</option>
              <option value="enabled">启用</option>
              <option value="disabled">禁用</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="h-12 min-w-[90px] rounded-md bg-blue-600 px-6 text-base font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              搜索
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="h-12 min-w-[90px] rounded-md border border-gray-300 bg-white px-6 text-base text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              重置
            </button>
          </div>
        </div>

        <div className="px-9 py-6">
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            添加
          </button>
        </div>
      </div>

      <div className="overflow-hidden border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="border-b border-r border-gray-200 px-4 py-4 text-left text-[15px] font-semibold text-gray-800">序号</th>
                <th className="border-b border-r border-gray-200 px-4 py-4 text-left text-[15px] font-semibold text-gray-800">港口名称</th>
                <th className="border-b border-r border-gray-200 px-4 py-4 text-left text-[15px] font-semibold text-gray-800">港口编码</th>
                <th className="border-b border-r border-gray-200 px-4 py-4 text-left text-[15px] font-semibold text-gray-800">城市</th>
                <th className="border-b border-r border-gray-200 px-4 py-4 text-left text-[15px] font-semibold text-gray-800">状态</th>
                <th className="border-b border-gray-200 px-4 py-4 text-left text-[15px] font-semibold text-gray-800">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-20 text-center text-sm text-gray-400">加载中...</td>
                </tr>
              ) : data.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-20 text-center text-sm text-gray-400">暂无数据</td>
                </tr>
              ) : (
                data.data.map((record, index) => (
                  <Fragment key={record.id}>
                    <tr className="transition hover:bg-gray-50">
                      <td className="border-b border-r border-gray-200 px-4 py-5 text-[15px] text-gray-900">
                        {(data.page - 1) * data.pageSize + index + 1}
                      </td>
                      <td className="border-b border-r border-gray-200 px-4 py-4">{renderNameCell(record)}</td>
                      <td className="border-b border-r border-gray-200 px-4 py-5 text-sm text-gray-700">
                        {record.code ? <span className="font-mono">{record.code}</span> : '-'}
                      </td>
                      <td className="border-b border-r border-gray-200 px-4 py-5 text-sm text-gray-700">{record.city || '-'}</td>
                      <td className="border-b border-r border-gray-200 px-4 py-5"><StatusBadge status={record.status} /></td>
                      <td className="border-b border-gray-200 px-4 py-5 text-sm">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(record)} className="text-base text-blue-600 hover:text-blue-700">编辑</button>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => handleDelete(record.id)} className="text-base text-red-500 hover:text-red-600">删除</button>
                          <button onClick={() => openDetail(record)} className="ml-3 text-sm text-gray-500 hover:text-gray-700">详情</button>
                          <button onClick={() => handleToggleStatus(record.id)} className="text-sm text-gray-500 hover:text-gray-700">
                            {record.status === 'enabled' ? '禁用' : '启用'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expanded.has(record.id) && record.piers.map((pier) => (
                      <tr key={pier.id} className="bg-blue-50/40">
                        <td className="border-b border-r border-gray-200 px-4 py-4 text-sm text-gray-400" />
                        <td className="border-b border-r border-gray-200 px-4 py-4 text-sm text-gray-700">
                          <div className="flex items-center gap-3 pl-9">
                            <span className="block h-3 w-3 rounded-full border border-blue-300 bg-white" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">码头</span>
                                <span>{pier.name || '-'}</span>
                              </div>
                              {pier.nameEn && <div className="mt-0.5 text-xs text-gray-400">{pier.nameEn}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="border-b border-r border-gray-200 px-4 py-4 text-sm text-gray-400">-</td>
                        <td className="border-b border-r border-gray-200 px-4 py-4 text-sm text-gray-700">{pier.position || '-'}</td>
                        <td className="border-b border-r border-gray-200 px-4 py-4 text-sm text-gray-400">-</td>
                        <td className="border-b border-gray-200 px-4 py-4 text-sm text-gray-400">排序 {pier.sort}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 px-9 py-10 text-gray-500">
            <div className="text-[15px]">
              共 {data.total} 条记录 第 {data.page} / {totalPages} 页
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fetchData(data.page - 1)}
                  disabled={data.page <= 1}
                  className="flex h-12 w-12 items-center justify-center rounded border border-gray-200 bg-white text-sm transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  &lt;
                </button>
                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => fetchData(page)}
                    className={`flex h-12 w-12 items-center justify-center rounded border text-lg transition ${
                      page === data.page
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-blue-500 hover:text-blue-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => fetchData(data.page + 1)}
                  disabled={data.page >= totalPages}
                  className="flex h-12 w-12 items-center justify-center rounded border border-gray-200 bg-white text-sm transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  &gt;
                </button>
              </div>
              <div className="flex h-12 min-w-[110px] items-center justify-center rounded border border-gray-200 bg-white px-4 text-lg text-gray-500">
                {data.pageSize}条/页
              </div>
            </div>
          </div>
        )}
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
            <table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b"><th className="px-3 py-2 text-left text-xs text-gray-500">码头名称</th><th className="px-3 py-2 text-left text-xs text-gray-500">英文名称</th><th className="px-3 py-2 text-left text-xs text-gray-500">位置</th><th className="px-3 py-2 text-left text-xs text-gray-500 w-16">排序</th><th className="px-3 py-2 text-center text-xs text-gray-500 w-12">操作</th></tr></thead>
            <tbody className="divide-y">{form.piers.map((pier, idx) => (
              <tr key={idx}><td className="px-3 py-2"><input value={pier.name} onChange={(e) => updatePier(idx, 'name', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" /></td>
              <td className="px-3 py-2"><input value={pier.nameEn} onChange={(e) => updatePier(idx, 'nameEn', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" /></td>
              <td className="px-3 py-2"><select value={pier.position || ''} onChange={(e) => updatePier(idx, 'position', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs"><option value="">请选择</option><option value="一码头">一码头</option><option value="二码头">二码头</option><option value="三码头">三码头</option></select></td>
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
          <DetailCard title={`码头列表（${detail.piers.length}个）`}>{detail.piers.length > 0 ? detail.piers.map((pier) => <div key={pier.id} className="flex justify-between text-sm py-0.5"><span className="text-gray-700">{pier.name} / {pier.nameEn || '-'}</span><span className="text-gray-400">{pier.position ? `${pier.position} · ` : ''}排序 {pier.sort}</span></div>) : <p className="text-sm text-gray-400">暂无码头</p>}</DetailCard>
          <DetailCard title="操作信息"><DetailRow label="修改人" value={detail.updatedBy} /><DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} /><DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} /></DetailCard>
        </>)}
      </DetailDrawer>
      <ConfirmDialog open={confirmOpen} title="删除港口" message="确定要删除该港口吗？关联的码头也将被一并删除。" danger onConfirm={confirmDelete} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}
