import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import ApplicableScopeTransfer, { createDefaultApplicableScope, formatApplicableScope, formatApplicableScopeDetail, type ApplicableScope } from '@/components/rule/ApplicableScopeTransfer'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'
import { formatDate, formatDateTime, generateId } from '@/utils/format'

type ThresholdType = 'quantity' | 'percent'
type WarningScene = 'release_unsold_low' | 'inventory_unsold_low' | 'dedicated_stock_low' | 'sales_ratio_high'
type WarningLevel = 'low' | 'medium' | 'high'
type RuleStatus = 'enabled' | 'disabled'
type ApprovalStatus = 'pending' | 'approved' | 'rejected'

interface WarningRule {
  id: string
  code: string
  name: string
  applyScope: ApplicableScope
  scene: WarningScene
  thresholdType: ThresholdType
  thresholdValue: number
  warningLevel: WarningLevel
  notifyTarget: string
  effectiveStart: string
  effectiveEnd: string
  approvalStatus: ApprovalStatus
  status: RuleStatus
  remark: string
  updatedBy: string
  updatedAt: string
  createdAt: string
}

type WarningRuleForm = Omit<WarningRule, 'id' | 'approvalStatus' | 'updatedBy' | 'updatedAt' | 'createdAt'>

const sceneOptions: { value: WarningScene; label: string }[] = [
  { value: 'release_unsold_low', label: '投放未售不足' },
  { value: 'inventory_unsold_low', label: '库存未售不足' },
  { value: 'dedicated_stock_low', label: '专仓库存不足' },
  { value: 'sales_ratio_high', label: '销售占比过高' },
]

const thresholdTypeOptions: { value: ThresholdType; label: string }[] = [
  { value: 'quantity', label: '值类型' },
  { value: 'percent', label: '百分比' },
]

const warningLevelOptions: { value: WarningLevel; label: string }[] = [
  { value: 'low', label: '低风险' },
  { value: 'medium', label: '中风险' },
  { value: 'high', label: '高风险' },
]

const notifyTargetOptions = ['运营专员', '库存专员', '产品经理', '系统自动']

const levelClass: Record<WarningLevel, string> = {
  low: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
  medium: 'bg-orange-50 text-orange-700 ring-orange-200',
  high: 'bg-red-50 text-red-700 ring-red-200',
}

const emptyForm: WarningRuleForm = {
  code: 'WARN-NEW',
  name: '',
  applyScope: createDefaultApplicableScope(),
  scene: 'release_unsold_low',
  thresholdType: 'quantity',
  thresholdValue: 10,
  warningLevel: 'medium',
  notifyTarget: '库存专员',
  effectiveStart: '2026-01-01',
  effectiveEnd: '2026-12-31',
  status: 'enabled',
  remark: '',
}

function getSceneLabel(scene: WarningScene) {
  return sceneOptions.find((item) => item.value === scene)?.label || scene
}

function getThresholdTypeLabel(type: ThresholdType) {
  return thresholdTypeOptions.find((item) => item.value === type)?.label || type
}

function getWarningLevelLabel(level: WarningLevel) {
  return warningLevelOptions.find((item) => item.value === level)?.label || level
}

function formatThreshold(type: ThresholdType, value: number) {
  return type === 'percent' ? `${value}%` : String(value)
}

function createRule(form: WarningRuleForm, approvalStatus: ApprovalStatus = 'pending'): WarningRule {
  const now = new Date().toISOString()
  return {
    ...form,
    id: generateId(),
    approvalStatus,
    updatedBy: '当前用户',
    updatedAt: now,
    createdAt: now,
  }
}

const initialRules: WarningRule[] = [
  createRule({
    ...emptyForm,
    code: 'WARN-INV-001',
    name: '航次库存投放未售不足',
    thresholdType: 'quantity',
    thresholdValue: 10,
    warningLevel: 'medium',
    remark: '投放未售数量小于等于阈值时触发库存预警。',
  }, 'approved'),
  createRule({
    ...emptyForm,
    code: 'WARN-INV-002',
    name: '航次库存剩余比例不足',
    thresholdType: 'percent',
    thresholdValue: 15,
    warningLevel: 'high',
    notifyTarget: '产品经理',
    remark: '投放未售比例低于15%时触发高风险提醒。',
  }, 'approved'),
]

export default function WarningRulePage() {
  const [records, setRecords] = useState<WarningRule[]>(initialRules)
  const [keyword, setKeyword] = useState('')
  const [sceneFilter, setSceneFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<WarningRuleForm>(emptyForm)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<WarningRule | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const filteredRecords = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return records.filter((item) => {
      const matchedKeyword = !kw || [item.code, item.name, item.remark].some((value) => value.toLowerCase().includes(kw))
      const matchedScene = sceneFilter === 'all' || item.scene === sceneFilter
      const matchedStatus = statusFilter === 'all' || item.status === statusFilter
      return matchedKeyword && matchedScene && matchedStatus
    })
  }, [records, keyword, sceneFilter, statusFilter])

  const pageSize = 10
  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize)

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, applyScope: createDefaultApplicableScope() })
    setFormOpen(true)
  }

  const openEdit = (record: WarningRule) => {
    const { id: _id, approvalStatus: _approvalStatus, updatedBy: _updatedBy, updatedAt: _updatedAt, createdAt: _createdAt, ...nextForm } = record
    setEditingId(record.id)
    setForm(nextForm)
    setFormOpen(true)
  }

  const handleSubmit = () => {
    if (!form.code.trim() || !form.name.trim() || form.thresholdValue < 0) return
    if (form.thresholdType === 'percent' && form.thresholdValue > 100) return

    const now = new Date().toISOString()
    if (editingId) {
      setRecords((prev) => prev.map((item) => item.id === editingId ? { ...item, ...form, updatedBy: '当前用户', updatedAt: now } : item))
    } else {
      setRecords((prev) => [createRule(form), ...prev])
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
    { key: 'code', title: '规则编码', render: (r: WarningRule) => <span className="font-mono text-xs">{r.code}</span> },
    { key: 'name', title: '规则名称', dataIndex: 'name' as keyof WarningRule },
    { key: 'scope', title: '适用范围', render: (r: WarningRule) => formatApplicableScope(r.applyScope) },
    { key: 'scene', title: '预警场景', render: (r: WarningRule) => getSceneLabel(r.scene) },
    { key: 'threshold', title: '预警阈值', render: (r: WarningRule) => `${formatThreshold(r.thresholdType, r.thresholdValue)}（${getThresholdTypeLabel(r.thresholdType)}）` },
    { key: 'warningLevel', title: '预警等级', render: (r: WarningRule) => (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${levelClass[r.warningLevel]}`}>
        {getWarningLevelLabel(r.warningLevel)}
      </span>
    ) },
    { key: 'approvalStatus', title: '审批状态', render: (r: WarningRule) => <StatusBadge status={r.approvalStatus} /> },
    { key: 'status', title: '状态', render: (r: WarningRule) => <StatusBadge status={r.status} /> },
    { key: 'updatedAt', title: '修改时间', render: (r: WarningRule) => formatDateTime(r.updatedAt) },
    { key: 'actions', title: '操作', width: '190px', render: (r: WarningRule) => (
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
      <PageHeader title="预警规则" description="维护库存预警场景、阈值类型、阈值和预警等级。" />
      <SearchPanel onSearch={() => setPage(1)} onReset={() => { setKeyword(''); setSceneFilter('all'); setStatusFilter('all'); setPage(1) }}>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">关键词</label><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="编码/名称" className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">预警场景</label><select value={sceneFilter} onChange={(e) => setSceneFilter(e.target.value)} className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option>{sceneOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">状态</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option><option value="enabled">启用</option><option value="disabled">禁用</option></select></div>
      </SearchPanel>

      <div className="bg-white px-9 py-6">
        <button onClick={openCreate} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700"><Plus className="w-4 h-4" />新增预警规则</button>
      </div>

      <DataTable columns={columns} dataSource={pagedRecords} rowKey="id" pagination={{ current: page, pageSize, total: filteredRecords.length, onChange: setPage }} />

      <FormDialog open={formOpen} title={editingId ? '编辑预警规则' : '新增预警规则'} width="max-w-5xl" onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基本信息</h4>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">规则编码 <span className="text-red-500">*</span></label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">规则名称 <span className="text-red-500">*</span></label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">预警场景</label><select value={form.scene} onChange={(e) => setForm({ ...form, scene: e.target.value as WarningScene })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{sceneOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
            </div>
          </div>

          <ApplicableScopeTransfer value={form.applyScope} onChange={(applyScope) => setForm({ ...form, applyScope })} />

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">阈值与等级</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">阈值类型</label>
                <select value={form.thresholdType} onChange={(e) => setForm({ ...form, thresholdType: e.target.value as ThresholdType })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {thresholdTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">预警阈值 <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2">
                  <input type="number" min={0} max={form.thresholdType === 'percent' ? 100 : undefined} value={form.thresholdValue} onChange={(e) => setForm({ ...form, thresholdValue: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <span className="shrink-0 text-sm text-gray-600">{form.thresholdType === 'percent' ? '%' : '值'}</span>
                </div>
                {form.thresholdType === 'percent' && form.thresholdValue > 100 && <p className="mt-1 text-xs text-red-500">百分比阈值不能超过 100</p>}
              </div>
              <div><label className="block text-sm text-gray-700 mb-1">预警等级</label><select value={form.warningLevel} onChange={(e) => setForm({ ...form, warningLevel: e.target.value as WarningLevel })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{warningLevelOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">通知对象</label><select value={form.notifyTarget} onChange={(e) => setForm({ ...form, notifyTarget: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{notifyTargetOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">生效开始日期</label><input type="date" value={form.effectiveStart} onChange={(e) => setForm({ ...form, effectiveStart: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">生效结束日期</label><input type="date" value={form.effectiveEnd} onChange={(e) => setForm({ ...form, effectiveEnd: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">状态</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as RuleStatus })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="enabled">启用</option><option value="disabled">禁用</option></select></div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">规则说明</label>
            <textarea value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="预警规则详情" onClose={() => setDetailOpen(false)}>
        {detail && (<>
          <DetailCard title="基本信息"><DetailRow label="规则编码" value={detail.code} mono /><DetailRow label="规则名称" value={detail.name} /><DetailRow label="适用范围" value={formatApplicableScope(detail.applyScope)} /><DetailRow label="预警场景" value={getSceneLabel(detail.scene)} /><DetailRow label="审批状态" value={<StatusBadge status={detail.approvalStatus} />} /><DetailRow label="状态" value={<StatusBadge status={detail.status} />} /></DetailCard>
          <DetailCard title="阈值与等级"><DetailRow label="阈值类型" value={getThresholdTypeLabel(detail.thresholdType)} /><DetailRow label="预警阈值" value={formatThreshold(detail.thresholdType, detail.thresholdValue)} /><DetailRow label="预警等级" value={<span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${levelClass[detail.warningLevel]}`}>{getWarningLevelLabel(detail.warningLevel)}</span>} /><DetailRow label="通知对象" value={detail.notifyTarget} /><DetailRow label="有效期" value={`${formatDate(detail.effectiveStart)} 至 ${formatDate(detail.effectiveEnd)}`} /></DetailCard>
          <DetailCard title="适用范围"><DetailRow label="适用产品" value={<span className="whitespace-pre-line">{formatApplicableScopeDetail(detail.applyScope)}</span>} /></DetailCard>
          <DetailCard title="说明"><DetailRow label="规则说明" value={detail.remark || '-'} /></DetailCard>
          <DetailCard title="操作信息"><DetailRow label="修改人" value={detail.updatedBy} /><DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} /><DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} /></DetailCard>
        </>)}
      </DetailDrawer>

      <ConfirmDialog open={confirmOpen} title="删除预警规则" message="确定要删除该预警规则吗？此操作不可恢复。" danger onConfirm={confirmDelete} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}
