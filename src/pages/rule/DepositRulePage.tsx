import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'
import ApplicableScopeTransfer, { createDefaultApplicableScope, formatApplicableScope, formatApplicableScopeDetail, type ApplicableScope } from '@/components/rule/ApplicableScopeTransfer'
import { formatDate, formatDateTime, generateId } from '@/utils/format'

type DepositStatus = 'effective' | 'disabled'
type DepositDeadlineType = 'beforeSail' | 'afterBooking'
type TimeUnit = 'day' | 'hour'
type DepositDimension = '按人手' | '按房收' | '按订单收'

interface DepositRule {
  id: string
  name: string
  approvalStatus: 'pending' | 'approved' | 'rejected'
  applyScope: ApplicableScope
  collectDeposit: boolean
  dimension: DepositDimension
  depositAmount: number
  sailingStart: string
  sailingEnd: string
  bookingDaysFrom: number
  bookingDaysTo: number
  bookingTimeUnit: TimeUnit
  deadlineType: DepositDeadlineType
  deadlineDays: number
  deadlineTimeUnit: TimeUnit
  enableOverdueDeduction: boolean
  overdueDeductionPercent: number
  status: DepositStatus
  updatedBy: string
  updatedAt: string
  createdAt: string
}

type DepositRuleForm = Omit<DepositRule, 'id' | 'approvalStatus' | 'updatedBy' | 'updatedAt' | 'createdAt'>

const dimensionOptions: DepositDimension[] = ['按人手', '按房收', '按订单收']

const emptyForm: DepositRuleForm = {
  name: '',
  applyScope: createDefaultApplicableScope(),
  collectDeposit: true,
  dimension: '按人手',
  depositAmount: 300,
  sailingStart: '2025-07-01',
  sailingEnd: '2025-12-31',
  bookingDaysFrom: 30,
  bookingDaysTo: 21,
  bookingTimeUnit: 'day',
  deadlineType: 'afterBooking',
  deadlineDays: 7,
  deadlineTimeUnit: 'day',
  enableOverdueDeduction: false,
  overdueDeductionPercent: 5,
  status: 'effective',
}

function createDepositRule(form: DepositRuleForm): DepositRule {
  const now = new Date().toISOString()
  return {
    ...form,
    id: generateId(),
    approvalStatus: 'pending',
    updatedBy: '当前用户',
    updatedAt: now,
    createdAt: now,
  }
}

const initialRules: DepositRule[] = [
  createDepositRule({ ...emptyForm, name: '内宾巫山定金', depositAmount: 300, bookingDaysFrom: 30, bookingDaysTo: 21, deadlineType: 'afterBooking', deadlineDays: 7, enableOverdueDeduction: true, overdueDeductionPercent: 5 }),
  createDepositRule({ ...emptyForm, name: '外宾日本旺季定金', depositAmount: 500, bookingDaysFrom: 45, bookingDaysTo: 30, deadlineType: 'beforeSail', deadlineDays: 20, enableOverdueDeduction: true, overdueDeductionPercent: 8 }),
  createDepositRule({ ...emptyForm, name: '内宾奉节免定金', collectDeposit: false, depositAmount: 0, bookingDaysFrom: 60, bookingDaysTo: 30, deadlineType: 'afterBooking', deadlineDays: 0, enableOverdueDeduction: false, overdueDeductionPercent: 0 }),
]

const statusOptions: { value: DepositStatus; label: string }[] = [
  { value: 'effective', label: '有效' },
  { value: 'disabled', label: '无效' },
]

const timeUnitOptions: { value: TimeUnit; label: string }[] = [
  { value: 'day', label: '天' },
  { value: 'hour', label: '小时' },
]

const getTimeUnitLabel = (unit: TimeUnit) => timeUnitOptions.find((item) => item.value === unit)?.label || unit

function getDepositUnit(dimension: DepositDimension) {
  if (dimension === '按房收') return '元/房'
  if (dimension === '按订单收') return '元/单'
  return '元/人'
}

function formatDepositAmount(rule: DepositRule) {
  return rule.collectDeposit ? `¥${rule.depositAmount}/${getDepositUnit(rule.dimension).replace('元/', '')}` : '不收取'
}

function formatDeadline(rule: DepositRule) {
  const unitLabel = getTimeUnitLabel(rule.deadlineTimeUnit)
  return rule.deadlineType === 'beforeSail' ? `开航前 ${rule.deadlineDays}${unitLabel}` : `预定后 ${rule.deadlineDays}${unitLabel}`
}

function formatOverdueDeduction(rule: DepositRule) {
  if (!rule.collectDeposit || !rule.enableOverdueDeduction) return '未启用'
  return `逾期按未付定金 ${rule.overdueDeductionPercent}% 扣减`
}

export default function DepositRulePage() {
  const [records, setRecords] = useState<DepositRule[]>(initialRules)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<DepositRuleForm>(emptyForm)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<DepositRule | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const filteredRecords = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return records.filter((item) => {
      const matchedKeyword = !kw || item.name.toLowerCase().includes(kw)
      const matchedStatus = statusFilter === 'all' || item.status === statusFilter
      return matchedKeyword && matchedStatus
    })
  }, [records, keyword, statusFilter])

  const pageSize = 10
  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize)

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (record: DepositRule) => {
    const { id: _id, approvalStatus: _approvalStatus, updatedBy: _updatedBy, updatedAt: _updatedAt, createdAt: _createdAt, ...nextForm } = record
    setEditingId(record.id)
    setForm(nextForm)
    setFormOpen(true)
  }

  const handleSubmit = () => {
    if (!form.name.trim()) return
    const now = new Date().toISOString()
    if (editingId) {
      setRecords((prev) => prev.map((item) => item.id === editingId ? { ...item, ...form, updatedBy: '当前用户', updatedAt: now } : item))
    } else {
      setRecords((prev) => [createDepositRule(form), ...prev])
      setPage(1)
    }
    setFormOpen(false)
  }

  const toggleStatus = (id: string) => {
    const now = new Date().toISOString()
    setRecords((prev) => prev.map((item) => item.id === id ? {
      ...item,
      status: item.status === 'effective' ? 'disabled' : 'effective',
      updatedBy: '当前用户',
      updatedAt: now,
    } : item))
  }

  const confirmDelete = () => {
    setRecords((prev) => prev.filter((item) => item.id !== confirmId))
    setConfirmOpen(false)
  }

  const columns = [
    { key: 'name', title: '定金规则名称', dataIndex: 'name' as keyof DepositRule },
    { key: 'applyScope', title: '适用范围', render: (r: DepositRule) => formatApplicableScope(r.applyScope) },
    { key: 'collectDeposit', title: '是否收取定金', render: (r: DepositRule) => r.collectDeposit ? '是' : '否' },
    { key: 'dimension', title: '维度', dataIndex: 'dimension' as keyof DepositRule },
    { key: 'depositAmount', title: '收取定金', render: (r: DepositRule) => formatDepositAmount(r) },
    { key: 'sailingPeriod', title: '船期', render: (r: DepositRule) => `${formatDate(r.sailingStart)} 至 ${formatDate(r.sailingEnd)}` },
    { key: 'bookingPeriod', title: '预订期间(距开航)', render: (r: DepositRule) => `${r.bookingDaysFrom}${getTimeUnitLabel(r.bookingTimeUnit)} - ${r.bookingDaysTo}${getTimeUnitLabel(r.bookingTimeUnit)}` },
    { key: 'deadline', title: '定金期限', render: (r: DepositRule) => formatDeadline(r) },
    { key: 'overdueDeduction', title: '逾期扣减', render: (r: DepositRule) => <span className="text-xs text-gray-600">{formatOverdueDeduction(r)}</span> },
    { key: 'approvalStatus', title: '审批状态', render: (r: DepositRule) => <StatusBadge status={r.approvalStatus} /> },
    { key: 'status', title: '状态', render: (r: DepositRule) => <StatusBadge status={r.status} /> },
    { key: 'updatedAt', title: '修改时间', render: (r: DepositRule) => formatDateTime(r.updatedAt) },
    { key: 'actions', title: '操作', width: '190px', render: (r: DepositRule) => (
      <div className="flex items-center gap-1">
        <button onClick={() => { setDetail(r); setDetailOpen(true) }} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">详情</button>
        <button onClick={() => openEdit(r)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">编辑</button>
        <button onClick={() => toggleStatus(r.id)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">{r.status === 'effective' ? '禁用' : '启用'}</button>
        <button onClick={() => { setConfirmId(r.id); setConfirmOpen(true) }} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">删除</button>
      </div>
    ) },
  ]

  return (
    <div>
      <PageHeader title="定金规则管理" description="维护定金收取、支付期限及逾期扣减规则（按未付定金百分比）" />
      <SearchPanel onSearch={() => setPage(1)} onReset={() => { setKeyword(''); setStatusFilter('all'); setPage(1) }}>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">关键词</label><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="定金规则名称" className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">状态</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option>{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      </SearchPanel>

      <div className="bg-white px-9 py-6">
        <button onClick={openCreate} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700"><Plus className="w-4 h-4" />新增定金规则</button>
      </div>

      <DataTable columns={columns} dataSource={pagedRecords} rowKey="id" pagination={{ current: page, pageSize, total: filteredRecords.length, onChange: setPage }} />

      <FormDialog open={formOpen} title={editingId ? '编辑定金规则信息' : '新增定金规则信息'} width="max-w-5xl" onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基本信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">定金规则名称 <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">是否收取定金</label>
                <select value={form.collectDeposit ? 'yes' : 'no'} onChange={(e) => setForm({
                  ...form,
                  collectDeposit: e.target.value === 'yes',
                  depositAmount: e.target.value === 'yes' ? form.depositAmount : 0,
                  enableOverdueDeduction: e.target.value === 'yes' ? form.enableOverdueDeduction : false,
                  overdueDeductionPercent: e.target.value === 'yes' ? form.overdueDeductionPercent : 0,
                })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="yes">是</option>
                  <option value="no">否</option>
                </select>
              </div>
            </div>
          </div>

          <ApplicableScopeTransfer value={form.applyScope} onChange={(applyScope) => setForm({ ...form, applyScope })} />

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">定金规则</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">维度 <span className="text-red-500">*</span></label>
                <select value={form.dimension} onChange={(e) => setForm({ ...form, dimension: e.target.value as DepositDimension })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{dimensionOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">收取定金 <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2">
                  <input type="number" disabled={!form.collectDeposit} value={form.depositAmount} onChange={(e) => setForm({ ...form, depositAmount: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50" />
                  <span className="shrink-0 text-sm text-gray-600">{getDepositUnit(form.dimension)}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">船期开始 <span className="text-red-500">*</span></label>
                <input type="date" value={form.sailingStart} onChange={(e) => setForm({ ...form, sailingStart: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">船期结束 <span className="text-red-500">*</span></label>
                <input type="date" value={form.sailingEnd} onChange={(e) => setForm({ ...form, sailingEnd: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">预订期间开始(距开航) <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2">
                  <input type="number" value={form.bookingDaysFrom} onChange={(e) => setForm({ ...form, bookingDaysFrom: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <select value={form.bookingTimeUnit} onChange={(e) => setForm({ ...form, bookingTimeUnit: e.target.value as TimeUnit })} className="w-24 shrink-0 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {timeUnitOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">预订期间结束(距开航) <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2">
                  <input type="number" value={form.bookingDaysTo} onChange={(e) => setForm({ ...form, bookingDaysTo: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <select value={form.bookingTimeUnit} onChange={(e) => setForm({ ...form, bookingTimeUnit: e.target.value as TimeUnit })} className="w-24 shrink-0 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {timeUnitOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">逾期扣减规则</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">是否启用逾期扣减</label>
                <select
                  value={form.enableOverdueDeduction && form.collectDeposit ? 'yes' : 'no'}
                  disabled={!form.collectDeposit}
                  onChange={(e) => setForm({
                    ...form,
                    enableOverdueDeduction: e.target.value === 'yes',
                    overdueDeductionPercent: e.target.value === 'yes' ? (form.overdueDeductionPercent || 5) : 0,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50"
                >
                  <option value="yes">是</option>
                  <option value="no">否</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">逾期扣减比例</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    disabled={!form.collectDeposit || !form.enableOverdueDeduction}
                    value={form.enableOverdueDeduction ? form.overdueDeductionPercent : ''}
                    onChange={(e) => setForm({ ...form, overdueDeductionPercent: Number(e.target.value) })}
                    placeholder="未启用"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50"
                  />
                  <span className="shrink-0 text-sm text-gray-600">%（未付定金）</span>
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {form.collectDeposit && form.enableOverdueDeduction
                ? `超过定金期限后，按未付定金金额的 ${form.overdueDeductionPercent}% 计扣减。`
                : form.collectDeposit
                  ? '未启用逾期扣减；超过定金期限仅触发提醒。'
                  : '当前规则不收取定金，无需配置逾期扣减。'}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">期限与状态</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm text-gray-700 mb-2">定金期限 <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <input type="radio" checked={form.deadlineType === 'beforeSail'} onChange={() => setForm({ ...form, deadlineType: 'beforeSail' })} className="h-4 w-4" />
                  开航前
                  </label>
                  <input type="number" disabled={form.deadlineType !== 'beforeSail'} value={form.deadlineType === 'beforeSail' ? form.deadlineDays : ''} onChange={(e) => setForm({ ...form, deadlineDays: Number(e.target.value) })} className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50" />
                  <select disabled={form.deadlineType !== 'beforeSail'} value={form.deadlineTimeUnit} onChange={(e) => setForm({ ...form, deadlineTimeUnit: e.target.value as TimeUnit })} className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50">
                    {timeUnitOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <input type="radio" checked={form.deadlineType === 'afterBooking'} onChange={() => setForm({ ...form, deadlineType: 'afterBooking' })} className="h-4 w-4" />
                  预定后
                  </label>
                  <input type="number" disabled={form.deadlineType !== 'afterBooking'} value={form.deadlineType === 'afterBooking' ? form.deadlineDays : ''} onChange={(e) => setForm({ ...form, deadlineDays: Number(e.target.value) })} className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50" />
                  <select disabled={form.deadlineType !== 'afterBooking'} value={form.deadlineTimeUnit} onChange={(e) => setForm({ ...form, deadlineTimeUnit: e.target.value as TimeUnit })} className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50">
                    {timeUnitOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">状态</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as DepositStatus })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
              </div>
            </div>
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="定金规则详情" onClose={() => setDetailOpen(false)}>
        {detail && (<>
          <DetailCard title="基本信息"><DetailRow label="规则名称" value={detail.name} /><DetailRow label="适用范围" value={formatApplicableScope(detail.applyScope)} /><DetailRow label="是否收取定金" value={detail.collectDeposit ? '是' : '否'} /><DetailRow label="审批状态" value={<StatusBadge status={detail.approvalStatus} />} /><DetailRow label="状态" value={<StatusBadge status={detail.status} />} /></DetailCard>
          <DetailCard title="定金规则"><DetailRow label="维度" value={detail.dimension} /><DetailRow label="收取定金" value={detail.collectDeposit ? `${detail.depositAmount}${getDepositUnit(detail.dimension)}` : '不收取'} /><DetailRow label="船期" value={`${formatDate(detail.sailingStart)} 至 ${formatDate(detail.sailingEnd)}`} /><DetailRow label="预订期间" value={`${detail.bookingDaysFrom}${getTimeUnitLabel(detail.bookingTimeUnit)} - ${detail.bookingDaysTo}${getTimeUnitLabel(detail.bookingTimeUnit)}`} /><DetailRow label="定金期限" value={formatDeadline(detail)} /><DetailRow label="逾期扣减" value={formatOverdueDeduction(detail)} /></DetailCard>
          <DetailCard title="适用范围"><DetailRow label="适用产品" value={<span className="whitespace-pre-line">{formatApplicableScopeDetail(detail.applyScope)}</span>} /></DetailCard>
          <DetailCard title="操作信息"><DetailRow label="修改人" value={detail.updatedBy} /><DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} /><DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} /></DetailCard>
        </>)}
      </DetailDrawer>

      <ConfirmDialog open={confirmOpen} title="删除定金规则" message="确定要删除该定金规则吗？此操作不可恢复。" danger onConfirm={confirmDelete} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}
