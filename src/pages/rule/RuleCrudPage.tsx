import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'
import ApplicableScopeTransfer, { formatApplicableScope, formatApplicableScopeDetail, scopeIncludesProduct, type ApplicableScope } from '@/components/rule/ApplicableScopeTransfer'
import { products } from '@/mock/data'
import { formatDate, formatDateTime, generateId } from '@/utils/format'
import type { Status } from '@/types'

export type RuleAmountType = 'fixed' | 'percent' | 'perPerson' | 'perRoom' | 'formula'

export interface RuleRecord {
  id: string
  code: string
  name: string
  approvalStatus: 'pending' | 'approved' | 'rejected'
  applyScope: ApplicableScope
  channel: string
  triggerPoint: string
  amountType: RuleAmountType
  amountValue: number
  dueDays: number
  priority: number
  effectiveStart: string
  effectiveEnd: string
  allowManualAdjust: boolean
  remark: string
  status: Status
  updatedBy: string
  updatedAt: string
  createdAt: string
}

type RuleForm = Omit<RuleRecord, 'id' | 'status' | 'updatedBy' | 'updatedAt' | 'createdAt'>

interface RuleCrudConfig {
  title: string
  description: string
  addText: string
  amountLabel: string
  amountValueLabel: string
  dueDaysLabel: string
  dueDaysSuffix: string
  triggerLabel: string
  scopeLabel?: string
  channelLabel?: string
  adjustLabel: string
  defaultForm: RuleForm
  initialData: RuleRecord[]
  scopeOptions: string[]
  channelOptions: string[]
  triggerOptions: string[]
  amountTypeOptions: { value: RuleAmountType; label: string }[]
}

interface RuleCrudPageProps {
  config: RuleCrudConfig
}

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'enabled', label: '启用' },
  { value: 'disabled', label: '禁用' },
]

function formatAmount(type: RuleAmountType, value: number) {
  const map: Record<RuleAmountType, string> = {
    fixed: `¥${value.toLocaleString()}`,
    percent: `${value}%`,
    perPerson: `¥${value.toLocaleString()}/人`,
    perRoom: `¥${value.toLocaleString()}/间`,
    formula: `公式系数 ${value}`,
  }
  return map[type]
}

function optionLabel<T extends string>(options: { value: T; label: string }[], value: T) {
  return options.find((item) => item.value === value)?.label || value
}

export function createRuleRecord(form: RuleForm, status: Status = 'enabled'): RuleRecord {
  const now = new Date().toISOString()
  return {
    ...form,
    id: generateId(),
    approvalStatus: form.approvalStatus || 'pending',
    status,
    updatedBy: '当前用户',
    updatedAt: now,
    createdAt: now,
  }
}

export default function RuleCrudPage({ config }: RuleCrudPageProps) {
  const [records, setRecords] = useState<RuleRecord[]>(config.initialData)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [scopeFilter, setScopeFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<RuleForm>(config.defaultForm)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<RuleRecord | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const filteredRecords = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return records.filter((item) => {
      const matchedKeyword = !kw || [item.code, item.name, item.remark, formatApplicableScopeDetail(item.applyScope)].some((value) => value.toLowerCase().includes(kw))
      const matchedStatus = statusFilter === 'all' || item.status === statusFilter
      const matchedScope = scopeFilter === 'all' || scopeIncludesProduct(item.applyScope, scopeFilter)
      const matchedChannel = channelFilter === 'all' || item.channel === channelFilter
      return matchedKeyword && matchedStatus && matchedScope && matchedChannel
    })
  }, [records, keyword, statusFilter, scopeFilter, channelFilter])

  const pageSize = 10
  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize)

  const resetFilters = () => {
    setKeyword('')
    setStatusFilter('all')
    setScopeFilter('all')
    setChannelFilter('all')
    setPage(1)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(config.defaultForm)
    setFormOpen(true)
  }

  const openEdit = (record: RuleRecord) => {
    const { id: _id, status: _status, updatedBy: _updatedBy, updatedAt: _updatedAt, createdAt: _createdAt, ...nextForm } = record
    setEditingId(record.id)
    setForm(nextForm)
    setFormOpen(true)
  }

  const handleSubmit = () => {
    if (!form.code.trim() || !form.name.trim()) return
    const now = new Date().toISOString()
    if (editingId) {
      setRecords((prev) => prev.map((item) => item.id === editingId ? { ...item, ...form, updatedBy: '当前用户', updatedAt: now } : item))
    } else {
      setRecords((prev) => [createRuleRecord(form), ...prev])
      setPage(1)
    }
    setFormOpen(false)
  }

  const toggleStatus = (id: string) => {
    const now = new Date().toISOString()
    setRecords((prev) => prev.map((item) => item.id === id ? {
      ...item,
      status: item.status === 'enabled' ? 'disabled' : 'enabled',
      updatedBy: '当前用户',
      updatedAt: now,
    } : item))
  }

  const confirmDelete = () => {
    setRecords((prev) => prev.filter((item) => item.id !== confirmId))
    setConfirmOpen(false)
  }

  const columns = [
    { key: 'code', title: '规则编码', render: (r: RuleRecord) => <span className="font-mono text-xs">{r.code}</span> },
    { key: 'name', title: '规则名称', dataIndex: 'name' as keyof RuleRecord },
    { key: 'scope', title: '适用范围', render: (r: RuleRecord) => formatApplicableScope(r.applyScope) },
    { key: 'channel', title: config.channelLabel || '适用渠道', dataIndex: 'channel' as keyof RuleRecord },
    { key: 'trigger', title: config.triggerLabel, dataIndex: 'triggerPoint' as keyof RuleRecord },
    { key: 'amount', title: config.amountLabel, render: (r: RuleRecord) => formatAmount(r.amountType, r.amountValue) },
    { key: 'dueDays', title: config.dueDaysLabel, render: (r: RuleRecord) => `${r.dueDays}${config.dueDaysSuffix}` },
    { key: 'effective', title: '有效期', render: (r: RuleRecord) => `${formatDate(r.effectiveStart)} 至 ${formatDate(r.effectiveEnd)}` },
    { key: 'priority', title: '优先级', dataIndex: 'priority' as keyof RuleRecord },
    { key: 'approvalStatus', title: '审批状态', render: (r: RuleRecord) => <StatusBadge status={r.approvalStatus} /> },
    { key: 'status', title: '状态', render: (r: RuleRecord) => <StatusBadge status={r.status} /> },
    { key: 'updatedAt', title: '修改时间', render: (r: RuleRecord) => formatDateTime(r.updatedAt) },
    { key: 'actions', title: '操作', width: '190px', render: (r: RuleRecord) => (
      <div className="flex items-center gap-1">
        <button onClick={() => { setDetail(r); setDetailOpen(true) }} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">详情</button>
        <button onClick={() => openEdit(r)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">编辑</button>
        <button onClick={() => toggleStatus(r.id)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">{r.status === 'enabled' ? '禁用' : '启用'}</button>
        <button onClick={() => { setConfirmId(r.id); setConfirmOpen(true) }} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">删除</button>
      </div>
    ) },
  ]

  return (
    <div>
      <PageHeader title={config.title} description={config.description} />
      <SearchPanel onSearch={() => setPage(1)} onReset={resetFilters}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">关键词</label>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="编码/名称/备注" className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">适用产品</label>
          <select value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value)} className="w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">全部</option>
            {products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">{config.channelLabel || '适用渠道'}</label>
          <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className="w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">全部</option>
            {config.channelOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">状态</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm">
            {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
      </SearchPanel>

      <div className="bg-white px-9 py-6">
        <button onClick={openCreate} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700">
          <Plus className="w-4 h-4" />{config.addText}
        </button>
      </div>

      <DataTable
        columns={columns}
        dataSource={pagedRecords}
        rowKey="id"
        pagination={{ current: page, pageSize, total: filteredRecords.length, onChange: setPage }}
      />

      <FormDialog open={formOpen} title={editingId ? `编辑${config.title}` : config.addText} width="max-w-4xl" onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基本信息</h4>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">规则编码 <span className="text-red-500">*</span></label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">规则名称 <span className="text-red-500">*</span></label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">优先级</label><input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">{config.channelLabel || '适用渠道'}</label><select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{config.channelOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">{config.triggerLabel}</label><select value={form.triggerPoint} onChange={(e) => setForm({ ...form, triggerPoint: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{config.triggerOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
            </div>
          </div>

          <ApplicableScopeTransfer value={form.applyScope} onChange={(applyScope) => setForm({ ...form, applyScope })} />

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">规则口径</h4>
            <div className="grid grid-cols-4 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">{config.amountLabel}</label><select value={form.amountType} onChange={(e) => setForm({ ...form, amountType: e.target.value as RuleAmountType })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{config.amountTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">{config.amountValueLabel}</label><input type="number" value={form.amountValue} onChange={(e) => setForm({ ...form, amountValue: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">{config.dueDaysLabel}</label><input type="number" value={form.dueDays} onChange={(e) => setForm({ ...form, dueDays: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">{config.adjustLabel}</label><select value={form.allowManualAdjust ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, allowManualAdjust: e.target.value === 'yes' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="yes">允许</option><option value="no">不允许</option></select></div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">生效控制</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">生效开始日期</label><input type="date" value={form.effectiveStart} onChange={(e) => setForm({ ...form, effectiveStart: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">生效结束日期</label><input type="date" value={form.effectiveEnd} onChange={(e) => setForm({ ...form, effectiveEnd: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">规则说明</label>
            <textarea value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title={`${config.title}详情`} onClose={() => setDetailOpen(false)}>
        {detail && (<>
          <DetailCard title="基本信息">
            <DetailRow label="规则编码" value={detail.code} mono />
            <DetailRow label="规则名称" value={detail.name} />
            <DetailRow label="适用范围" value={formatApplicableScope(detail.applyScope)} />
            <DetailRow label={config.channelLabel || '适用渠道'} value={detail.channel} />
            <DetailRow label="优先级" value={detail.priority} />
            <DetailRow label="审批状态" value={<StatusBadge status={detail.approvalStatus} />} />
            <DetailRow label="状态" value={<StatusBadge status={detail.status} />} />
          </DetailCard>
          <DetailCard title="规则口径">
            <DetailRow label={config.triggerLabel} value={detail.triggerPoint} />
            <DetailRow label={config.amountLabel} value={`${optionLabel(config.amountTypeOptions, detail.amountType)} ${formatAmount(detail.amountType, detail.amountValue)}`} />
            <DetailRow label={config.dueDaysLabel} value={`${detail.dueDays}${config.dueDaysSuffix}`} />
            <DetailRow label={config.adjustLabel} value={detail.allowManualAdjust ? '允许' : '不允许'} />
          </DetailCard>
          <DetailCard title="生效控制">
            <DetailRow label="生效开始" value={formatDate(detail.effectiveStart)} />
            <DetailRow label="生效结束" value={formatDate(detail.effectiveEnd)} />
            <DetailRow label="规则说明" value={detail.remark || '-'} />
          </DetailCard>
          <DetailCard title="适用范围">
            <DetailRow label="产品/航次" value={<span className="whitespace-pre-line">{formatApplicableScopeDetail(detail.applyScope)}</span>} />
          </DetailCard>
          <DetailCard title="操作信息">
            <DetailRow label="修改人" value={detail.updatedBy} />
            <DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} />
            <DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} />
          </DetailCard>
        </>)}
      </DetailDrawer>

      <ConfirmDialog
        open={confirmOpen}
        title={`删除${config.title}`}
        message="确定要删除该规则吗？此操作不可恢复。"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
