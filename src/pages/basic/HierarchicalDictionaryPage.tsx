import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Plus, Upload } from 'lucide-react'
import { hierarchicalDictApi } from '@/mock/api'
import type { HierarchicalDictForm, HierarchicalDictItem, HierarchicalDictTypeCode } from '@/types'
import { HIERARCHICAL_DICT_TYPES, getHierarchicalDictTypeName } from '@/utils/hierarchicalDict'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'
import { formatDateTime } from '@/utils/format'

interface TableRow {
  record: HierarchicalDictItem
  serialNo: number
  typeLabel: string
  indent: boolean
}

const emptyForm = (dictType: HierarchicalDictTypeCode): HierarchicalDictForm => ({
  dictType,
  code: '',
  nameCn: '',
  nameEn: '',
  parentId: null,
  level: 1,
  sort: 1,
  remark: '',
})

const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900'

function matchText(value: string, keyword: string) {
  if (!keyword.trim()) return true
  return value.toLowerCase().includes(keyword.trim().toLowerCase())
}

export default function HierarchicalDictionaryPage() {
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<HierarchicalDictItem[]>([])
  const [dictTypeFilter, setDictTypeFilter] = useState<HierarchicalDictTypeCode | 'all'>('ACTIVITY_CATEGORY')
  const [parentFilter, setParentFilter] = useState('all')
  const [codeFilter, setCodeFilter] = useState('')
  const [nameCnFilter, setNameCnFilter] = useState('')
  const [nameEnFilter, setNameEnFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [appliedFilters, setAppliedFilters] = useState({
    dictTypeFilter: 'ACTIVITY_CATEGORY' as HierarchicalDictTypeCode | 'all',
    parentFilter: 'all',
    codeFilter: '',
    nameCnFilter: '',
    nameEnFilter: '',
    statusFilter: 'all',
  })
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<HierarchicalDictForm>(emptyForm('ACTIVITY_CATEGORY'))
  const [formLoading, setFormLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<HierarchicalDictItem | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')
  const [infoOpen, setInfoOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const result = await hierarchicalDictApi.list({ pageSize: 300 })
    setRecords(result.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const scopedRecords = useMemo(() => {
    if (appliedFilters.dictTypeFilter === 'all') return records
    return records.filter((item) => item.dictType === appliedFilters.dictTypeFilter)
  }, [appliedFilters.dictTypeFilter, records])

  const parentOptions = useMemo(
    () => scopedRecords.filter((item) => item.level === 1).sort((a, b) => a.sort - b.sort),
    [scopedRecords],
  )

  const parentMap = useMemo(
    () => new Map(parentOptions.map((item) => [item.id, item])),
    [parentOptions],
  )

  const recordMatches = useCallback((record: HierarchicalDictItem) => {
    const { parentFilter: parent, codeFilter: code, nameCnFilter: nameCn, nameEnFilter: nameEn, statusFilter: status } = appliedFilters
    if (parent !== 'all') {
      if (record.level === 1 && record.id !== parent) return false
      if (record.level === 2 && record.parentId !== parent) return false
    }
    if (!matchText(record.code, code)) return false
    if (!matchText(record.nameCn, nameCn)) return false
    if (!matchText(record.nameEn, nameEn)) return false
    if (status !== 'all' && record.status !== status) return false
    return true
  }, [appliedFilters])

  const tableRows = useMemo(() => {
    const childrenByParent = new Map<string, HierarchicalDictItem[]>()
    scopedRecords.filter((item) => item.level === 2).forEach((item) => {
      if (!item.parentId) return
      const list = childrenByParent.get(item.parentId) || []
      list.push(item)
      childrenByParent.set(item.parentId, list)
    })

    const rows: TableRow[] = []
    let serialNo = 0

    parentOptions.forEach((parent) => {
      const children = (childrenByParent.get(parent.id) || []).sort((a, b) => a.sort - b.sort)
      const parentMatched = recordMatches(parent)
      const matchedChildren = children.filter(recordMatches)
      const shouldShowParent = parentMatched || matchedChildren.length > 0
      if (!shouldShowParent) return

      serialNo += 1
      rows.push({
        record: parent,
        serialNo,
        typeLabel: appliedFilters.dictTypeFilter === 'all' ? getHierarchicalDictTypeName(parent.dictType) : '一级分类',
        indent: false,
      })

      const childrenToShow = parentMatched ? children.filter(recordMatches) : matchedChildren
      childrenToShow.forEach((child) => {
        serialNo += 1
        rows.push({
          record: child,
          serialNo,
          typeLabel: parent.nameCn,
          indent: true,
        })
      })
    })

    return rows
  }, [appliedFilters.dictTypeFilter, parentOptions, recordMatches, scopedRecords])

  const pageSize = 10
  const pagedRows = tableRows.slice((page - 1) * pageSize, page * pageSize)

  const handleSearch = () => {
    setAppliedFilters({ dictTypeFilter, parentFilter, codeFilter, nameCnFilter, nameEnFilter, statusFilter })
    setPage(1)
  }

  const handleReset = () => {
    setDictTypeFilter('ACTIVITY_CATEGORY')
    setParentFilter('all')
    setCodeFilter('')
    setNameCnFilter('')
    setNameEnFilter('')
    setStatusFilter('all')
    setAppliedFilters({
      dictTypeFilter: 'ACTIVITY_CATEGORY',
      parentFilter: 'all',
      codeFilter: '',
      nameCnFilter: '',
      nameEnFilter: '',
      statusFilter: 'all',
    })
    setPage(1)
  }

  const openCreate = (options?: { parentId?: string; level?: 1 | 2 }) => {
    setEditingId(null)
    const dictType = dictTypeFilter === 'all' ? 'ACTIVITY_CATEGORY' : dictTypeFilter
    const parentId = options?.parentId
    const level = options?.level || (parentId ? 2 : 1)
    if (parentId) {
      const parent = parentMap.get(parentId)
      setForm({
        ...emptyForm(parent?.dictType || dictType),
        level: 2,
        parentId,
        dictType: parent?.dictType || dictType,
        sort: (scopedRecords.filter((item) => item.parentId === parentId).length || 0) + 1,
        code: parent ? `${parent.code}_` : '',
      })
    } else {
      setForm({
        ...emptyForm(dictType),
        level,
        parentId: null,
        sort: level === 1 ? parentOptions.length + 1 : 1,
      })
    }
    setFormOpen(true)
  }

  const openEdit = (record: HierarchicalDictItem) => {
    setEditingId(record.id)
    setForm({
      dictType: record.dictType,
      code: record.code,
      nameCn: record.nameCn,
      nameEn: record.nameEn,
      parentId: record.parentId,
      level: record.level,
      sort: record.sort,
      remark: record.remark,
    })
    setFormOpen(true)
  }

  const openDetail = async (record: HierarchicalDictItem) => {
    const item = await hierarchicalDictApi.getById(record.id)
    setDetail(item || null)
    setDetailOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.code.trim() || !form.nameCn.trim()) return
    if (form.level === 2 && !form.parentId) return

    setFormLoading(true)
    const now = new Date().toISOString()
    if (editingId) {
      await hierarchicalDictApi.update(editingId, form)
    } else {
      await hierarchicalDictApi.create({
        ...form,
        status: 'enabled',
        updatedBy: '当前用户',
        updatedAt: now,
        createdAt: now,
      })
    }
    setFormLoading(false)
    setFormOpen(false)
    fetchData()
  }

  const handleToggleStatus = async (id: string) => {
    await hierarchicalDictApi.toggleStatus(id)
    fetchData()
  }

  const handleDelete = async () => {
    const target = records.find((item) => item.id === confirmId)
    if (target?.level === 1) {
      const hasChildren = records.some((item) => item.parentId === target.id)
      if (hasChildren) {
        setConfirmOpen(false)
        return
      }
    }
    await hierarchicalDictApi.remove(confirmId)
    setConfirmOpen(false)
    fetchData()
  }

  const handleExport = () => {
    const exportData = appliedFilters.dictTypeFilter === 'all'
      ? records
      : records.filter((item) => item.dictType === appliedFilters.dictTypeFilter)
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `hierarchical-dict-${appliedFilters.dictTypeFilter}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const columns = [
    { key: 'serial', title: '序号', width: '72px', render: (row: TableRow) => row.serialNo },
    {
      key: 'type',
      title: '类型',
      width: '140px',
      render: (row: TableRow) => (
        <span className={row.indent ? 'text-gray-500' : 'font-medium text-gray-900'}>{row.typeLabel}</span>
      ),
    },
    { key: 'code', title: '编码值', render: (row: TableRow) => <span className="font-mono text-xs">{row.record.code}</span> },
    {
      key: 'nameCn',
      title: '中文名称',
      render: (row: TableRow) => (
        <span className={row.indent ? 'pl-4 text-gray-700 before:mr-1 before:text-gray-300 before:content-["└"]' : 'font-medium text-gray-900'}>
          {row.record.nameCn}
        </span>
      ),
    },
    { key: 'nameEn', title: '英文名称', render: (row: TableRow) => row.record.nameEn || '-' },
    { key: 'remark', title: '备注', render: (row: TableRow) => row.record.remark || '-' },
    { key: 'status', title: '状态', width: '90px', render: (row: TableRow) => <StatusBadge status={row.record.status} /> },
    {
      key: 'actions',
      title: '操作',
      width: '240px',
      render: (row: TableRow) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openDetail(row.record)} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900">详情</button>
          <button onClick={() => openEdit(row.record)} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900">编辑</button>
          {row.record.level === 1 && (
            <button onClick={() => openCreate({ parentId: row.record.id, level: 2 })} className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700">添加子类</button>
          )}
          <button onClick={() => handleToggleStatus(row.record.id)} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900">
            {row.record.status === 'enabled' ? '禁用' : '启用'}
          </button>
          <button onClick={() => { setConfirmId(row.record.id); setConfirmOpen(true) }} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700">删除</button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="分级字典" description="维护支持二级的通用数据字典，按分类型管理编码项" />

      <SearchPanel onSearch={handleSearch} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">分类型</label>
          <select
            value={dictTypeFilter}
            onChange={(event) => {
              setDictTypeFilter(event.target.value as HierarchicalDictTypeCode | 'all')
              setParentFilter('all')
            }}
            className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">全部</option>
            {HIERARCHICAL_DICT_TYPES.map((item) => (
              <option key={item.code} value={item.code}>{item.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">一级分类</label>
          <select value={parentFilter} onChange={(event) => setParentFilter(event.target.value)} className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="all">全部</option>
            {parentOptions.map((item) => <option key={item.id} value={item.id}>{item.nameCn}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">编码值</label>
          <input value={codeFilter} onChange={(event) => setCodeFilter(event.target.value)} placeholder="编码值" className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">中文名称</label>
          <input value={nameCnFilter} onChange={(event) => setNameCnFilter(event.target.value)} placeholder="中文名称" className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">英文名称</label>
          <input value={nameEnFilter} onChange={(event) => setNameEnFilter(event.target.value)} placeholder="英文名称" className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">状态</label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="all">全部</option>
            <option value="enabled">启用</option>
            <option value="disabled">禁用</option>
          </select>
        </div>
      </SearchPanel>

      <div className="bg-white px-9 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => openCreate({ level: 1 })} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700">
            <Plus className="h-4 w-4" />添加编码
          </button>
          <button onClick={() => openCreate({ level: 1 })} className="inline-flex h-11 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-5 text-sm text-gray-700 hover:bg-gray-50">
            <Plus className="h-4 w-4" />添加分类型
          </button>
          <button onClick={() => setInfoOpen(true)} className="inline-flex h-11 items-center rounded-md border border-gray-300 bg-white px-5 text-sm text-gray-700 hover:bg-gray-50">
            编码说明
          </button>
          <button onClick={() => window.alert('导入功能演示阶段暂未开放')} className="inline-flex h-11 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-5 text-sm text-gray-700 hover:bg-gray-50">
            <Upload className="h-4 w-4" />导入
          </button>
          <button onClick={handleExport} className="inline-flex h-11 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-5 text-sm text-gray-700 hover:bg-gray-50">
            <Download className="h-4 w-4" />导出
          </button>
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            当导入时如编码相同则更新名称和备注，编码不同则新增。编码值唯一。
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        dataSource={pagedRows}
        loading={loading}
        rowKey={(row) => row.record.id}
        emptyText="暂无字典项"
        pagination={{ current: page, pageSize, total: tableRows.length, onChange: setPage }}
      />

      <FormDialog
        open={formOpen}
        title={editingId ? '编辑字典项' : form.level === 2 ? '新增二级字典项' : '新增一级字典项'}
        loading={formLoading}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-gray-700">分类型 <span className="text-red-500">*</span></label>
              <select
                value={form.dictType}
                disabled={Boolean(editingId)}
                onChange={(event) => setForm({ ...form, dictType: event.target.value as HierarchicalDictTypeCode, parentId: null, level: 1 })}
                className={inputClass}
              >
                {HIERARCHICAL_DICT_TYPES.map((item) => (
                  <option key={item.code} value={item.code}>{item.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700">分类层级</label>
              <select
                value={form.level}
                disabled={Boolean(editingId)}
                onChange={(event) => {
                  const level = Number(event.target.value) as 1 | 2
                  setForm({
                    ...form,
                    level,
                    parentId: level === 1 ? null : form.parentId,
                  })
                }}
                className={inputClass}
              >
                <option value={1}>一级分类</option>
                <option value={2}>二级分类</option>
              </select>
            </div>
            {form.level === 2 && (
              <div className="col-span-2">
                <label className="mb-1 block text-sm text-gray-700">所属一级分类 <span className="text-red-500">*</span></label>
                <select
                  value={form.parentId || ''}
                  disabled={Boolean(editingId)}
                  onChange={(event) => setForm({ ...form, parentId: event.target.value || null })}
                  className={inputClass}
                >
                  <option value="">请选择</option>
                  {records
                    .filter((item) => item.dictType === form.dictType && item.level === 1)
                    .sort((a, b) => a.sort - b.sort)
                    .map((item) => <option key={item.id} value={item.id}>{item.nameCn}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm text-gray-700">编码值 <span className="text-red-500">*</span></label>
              <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="如 ACT_SCENIC" className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700">排序</label>
              <input type="number" value={form.sort} onChange={(event) => setForm({ ...form, sort: Number(event.target.value) })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700">中文名称 <span className="text-red-500">*</span></label>
              <input value={form.nameCn} onChange={(event) => setForm({ ...form, nameCn: event.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700">英文名称</label>
              <input value={form.nameEn} onChange={(event) => setForm({ ...form, nameEn: event.target.value })} className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm text-gray-700">备注</label>
              <input value={form.remark} onChange={(event) => setForm({ ...form, remark: event.target.value })} className={inputClass} />
            </div>
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="字典项详情" onClose={() => setDetailOpen(false)}>
        {detail && (
          <>
            <DetailCard title="字典信息">
              <DetailRow label="分类型" value={getHierarchicalDictTypeName(detail.dictType)} />
              <DetailRow label="分类层级" value={detail.level === 1 ? '一级分类' : '二级分类'} />
              {detail.level === 2 && <DetailRow label="所属一级分类" value={parentMap.get(detail.parentId || '')?.nameCn || records.find((item) => item.id === detail.parentId)?.nameCn || '-'} />}
              <DetailRow label="编码值" value={detail.code} mono />
              <DetailRow label="中文名称" value={detail.nameCn} />
              <DetailRow label="英文名称" value={detail.nameEn || '-'} />
              <DetailRow label="排序" value={detail.sort} />
              <DetailRow label="备注" value={detail.remark || '-'} />
              <DetailRow label="状态" value={<StatusBadge status={detail.status} />} />
            </DetailCard>
            <DetailCard title="维护信息">
              <DetailRow label="修改人" value={detail.updatedBy} />
              <DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} />
            </DetailCard>
          </>
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={infoOpen}
        title="分级字典说明"
        message={`分级字典支持二级结构，通过「分类型」区分业务场景。当前已配置：${HIERARCHICAL_DICT_TYPES.map((item) => item.name).join('、')}。一级分类用于归类，二级分类用于业务引用；编码值在同一分类型内唯一。`}
        onConfirm={() => setInfoOpen(false)}
        onCancel={() => setInfoOpen(false)}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="删除字典项"
        message={(() => {
          const target = records.find((item) => item.id === confirmId)
          if (target?.level === 1 && records.some((item) => item.parentId === target.id)) {
            return '该一级分类下仍有二级分类，请先删除或迁移子分类后再删除。'
          }
          return '确定要删除该字典项吗？删除后不可恢复。'
        })()}
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
