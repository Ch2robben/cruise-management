import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'
import { formatDateTime, generateId } from '@/utils/format'
import type { Status } from '@/types'

type OrderImpactMode = 'none' | 'warning' | 'hold' | 'block'
type DeductSource = 'none' | 'deposit' | 'balance' | 'credit' | 'manual'

interface PenaltyHandlingRule {
  id: string
  code: string
  name: string
  penaltyScene: string
  applyScope: string
  affectSubsequentOrder: boolean
  orderImpactMode: OrderImpactMode
  autoDeduct: boolean
  deductSource: DeductSource
  allowManualRelease: boolean
  releaseCondition: string
  notifyRole: string
  priority: number
  status: Status
  remark: string
  updatedBy: string
  updatedAt: string
  createdAt: string
}

type PenaltyHandlingForm = Omit<PenaltyHandlingRule, 'id' | 'status' | 'updatedBy' | 'updatedAt' | 'createdAt'>

const orderImpactLabels: Record<OrderImpactMode, string> = {
  none: '不影响',
  warning: '下单提醒',
  hold: '提交后待审核',
  block: '禁止下单',
}

const deductSourceLabels: Record<DeductSource, string> = {
  none: '不扣减',
  deposit: '从定金扣减',
  balance: '从尾款扣减',
  credit: '从授信额度扣减',
  manual: '人工处理',
}

const sceneOptions = ['船款逾期']
const scopeOptions = ['所有经销商']
const notifyRoleOptions = ['财务专员', '销售经理', '运营主管', '经销商管理员', '无需通知']

const emptyForm: PenaltyHandlingForm = {
  code: 'PHD-NEW',
  name: '',
  penaltyScene: '船款逾期',
  applyScope: '所有经销商',
  affectSubsequentOrder: true,
  orderImpactMode: 'warning',
  autoDeduct: false,
  deductSource: 'manual',
  allowManualRelease: true,
  releaseCondition: '罚金结清后自动解除',
  notifyRole: '财务专员',
  priority: 10,
  remark: '',
}

function createRule(form: PenaltyHandlingForm, status: Status = 'enabled'): PenaltyHandlingRule {
  const now = new Date().toISOString()
  return {
    ...form,
    id: generateId(),
    status,
    updatedBy: '当前用户',
    updatedAt: now,
    createdAt: now,
  }
}

const initialRules: PenaltyHandlingRule[] = [
  createRule({
    ...emptyForm,
    code: 'PHD-001',
    name: '全体经销商船款逾期自动扣减',
    penaltyScene: '船款逾期',
    applyScope: '所有经销商',
    affectSubsequentOrder: true,
    orderImpactMode: 'hold',
    autoDeduct: true,
    deductSource: 'credit',
    releaseCondition: '罚金扣减成功并完成财务确认',
    notifyRole: '财务专员',
    priority: 20,
    remark: '所有经销商逾期罚金优先从授信额度扣减，扣减完成前后续订单进入待审核。',
  }),
  createRule({
    ...emptyForm,
    code: 'PHD-002',
    name: '全体经销商船款逾期禁止下单',
    penaltyScene: '船款逾期',
    applyScope: '所有经销商',
    affectSubsequentOrder: true,
    orderImpactMode: 'block',
    autoDeduct: false,
    deductSource: 'manual',
    releaseCondition: '罚金结清并由财务确认解除',
    notifyRole: '销售经理',
    priority: 30,
    remark: '存在未处理船款逾期罚金时禁止经销商继续下单。',
  }),
  createRule({
    ...emptyForm,
    code: 'PHD-003',
    name: '全体经销商船款逾期提醒',
    penaltyScene: '船款逾期',
    applyScope: '所有经销商',
    affectSubsequentOrder: true,
    orderImpactMode: 'warning',
    autoDeduct: false,
    deductSource: 'manual',
    releaseCondition: '人工记录处理结果后解除提醒',
    notifyRole: '运营主管',
    priority: 5,
    remark: '船款逾期罚金只做提醒，不强制拦截后续下单。',
  }),
]

function booleanText(value: boolean) {
  return value ? '是' : '否'
}

export default function PenaltyHandlingDictPage() {
  const [records, setRecords] = useState<PenaltyHandlingRule[]>(initialRules)
  const [keyword, setKeyword] = useState('')
  const [sceneFilter, setSceneFilter] = useState('all')
  const [impactFilter, setImpactFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PenaltyHandlingForm>(emptyForm)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<PenaltyHandlingRule | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const filteredRecords = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return records.filter((item) => {
      const matchedKeyword = !kw || [item.code, item.name, item.remark].some((value) => value.toLowerCase().includes(kw))
      const matchedScene = sceneFilter === 'all' || item.penaltyScene === sceneFilter
      const matchedImpact = impactFilter === 'all' || (impactFilter === 'yes' ? item.affectSubsequentOrder : !item.affectSubsequentOrder)
      const matchedStatus = statusFilter === 'all' || item.status === statusFilter
      return matchedKeyword && matchedScene && matchedImpact && matchedStatus
    })
  }, [records, keyword, sceneFilter, impactFilter, statusFilter])

  const pageSize = 10
  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize)

  const resetFilters = () => {
    setKeyword('')
    setSceneFilter('all')
    setImpactFilter('all')
    setStatusFilter('all')
    setPage(1)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (record: PenaltyHandlingRule) => {
    const { id: _id, status: _status, updatedBy: _updatedBy, updatedAt: _updatedAt, createdAt: _createdAt, ...nextForm } = record
    setEditingId(record.id)
    setForm(nextForm)
    setFormOpen(true)
  }

  const submit = () => {
    if (!form.code.trim() || !form.name.trim()) return
    const now = new Date().toISOString()
    const normalizedForm: PenaltyHandlingForm = {
      ...form,
      orderImpactMode: form.affectSubsequentOrder ? form.orderImpactMode : 'none',
      deductSource: form.autoDeduct ? form.deductSource : 'manual',
    }
    if (editingId) {
      setRecords((prev) => prev.map((item) => item.id === editingId ? { ...item, ...normalizedForm, updatedBy: '当前用户', updatedAt: now } : item))
    } else {
      setRecords((prev) => [createRule(normalizedForm), ...prev])
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
    { key: 'code', title: '规则编码', render: (r: PenaltyHandlingRule) => <span className="font-mono text-xs">{r.code}</span> },
    { key: 'name', title: '处理规则名称', dataIndex: 'name' as keyof PenaltyHandlingRule },
    { key: 'scene', title: '罚金场景', dataIndex: 'penaltyScene' as keyof PenaltyHandlingRule },
    { key: 'scope', title: '作用对象', dataIndex: 'applyScope' as keyof PenaltyHandlingRule },
    { key: 'affectOrder', title: '影响后续下单', render: (r: PenaltyHandlingRule) => booleanText(r.affectSubsequentOrder) },
    { key: 'impactMode', title: '下单控制', render: (r: PenaltyHandlingRule) => orderImpactLabels[r.orderImpactMode] },
    { key: 'autoDeduct', title: '自动扣减', render: (r: PenaltyHandlingRule) => booleanText(r.autoDeduct) },
    { key: 'deductSource', title: '扣减来源', render: (r: PenaltyHandlingRule) => deductSourceLabels[r.deductSource] },
    { key: 'priority', title: '优先级', dataIndex: 'priority' as keyof PenaltyHandlingRule },
    { key: 'status', title: '状态', render: (r: PenaltyHandlingRule) => <StatusBadge status={r.status} /> },
    { key: 'actions', title: '操作', width: '190px', render: (r: PenaltyHandlingRule) => (
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
      <PageHeader title="罚金处理规则" description="维护作用于所有经销商的罚金处理动作，和可按个别分销商配置的罚金规则分开管理。" />

      <SearchPanel onSearch={() => setPage(1)} onReset={resetFilters}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">关键词</label>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="编码/名称/备注" className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">罚金场景</label>
          <select value={sceneFilter} onChange={(e) => setSceneFilter(e.target.value)} className="w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">全部</option>
            {sceneOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">影响下单</label>
          <select value={impactFilter} onChange={(e) => setImpactFilter(e.target.value)} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">全部</option>
            <option value="yes">是</option>
            <option value="no">否</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">状态</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">全部</option>
            <option value="enabled">启用</option>
            <option value="disabled">禁用</option>
          </select>
        </div>
      </SearchPanel>

      <div className="bg-white px-9 py-6">
        <button onClick={openCreate} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700">
          <Plus className="w-4 h-4" />新增处理规则
        </button>
      </div>

      <DataTable
        columns={columns}
        dataSource={pagedRecords}
        rowKey="id"
        pagination={{ current: page, pageSize, total: filteredRecords.length, onChange: setPage }}
      />

      <FormDialog open={formOpen} title={editingId ? '编辑罚金处理规则' : '新增罚金处理规则'} width="max-w-4xl" onCancel={() => setFormOpen(false)} onSubmit={submit}>
        <div className="space-y-5">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基本信息</h4>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">规则编码 <span className="text-red-500">*</span></label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">处理规则名称 <span className="text-red-500">*</span></label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">优先级</label><input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">罚金场景</label><select value={form.penaltyScene} onChange={(e) => setForm({ ...form, penaltyScene: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{sceneOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">作用对象</label><select value={form.applyScope} onChange={(e) => setForm({ ...form, applyScope: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{scopeOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">通知角色</label><select value={form.notifyRole} onChange={(e) => setForm({ ...form, notifyRole: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{notifyRoleOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">处理动作</h4>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">是否影响后续下单</label><select value={form.affectSubsequentOrder ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, affectSubsequentOrder: e.target.value === 'yes', orderImpactMode: e.target.value === 'yes' ? form.orderImpactMode : 'none' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="yes">是</option><option value="no">否</option></select></div>
              <div><label className="block text-sm text-gray-700 mb-1">下单控制方式</label><select value={form.orderImpactMode} disabled={!form.affectSubsequentOrder} onChange={(e) => setForm({ ...form, orderImpactMode: e.target.value as OrderImpactMode })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-400">{Object.entries(orderImpactLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">是否自动扣减</label><select value={form.autoDeduct ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, autoDeduct: e.target.value === 'yes', deductSource: e.target.value === 'yes' ? form.deductSource : 'manual' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="yes">是</option><option value="no">否</option></select></div>
              <div><label className="block text-sm text-gray-700 mb-1">扣减来源</label><select value={form.deductSource} disabled={!form.autoDeduct} onChange={(e) => setForm({ ...form, deductSource: e.target.value as DeductSource })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-400">{Object.entries(deductSourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">是否允许人工解除</label><select value={form.allowManualRelease ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, allowManualRelease: e.target.value === 'yes' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="yes">允许</option><option value="no">不允许</option></select></div>
              <div><label className="block text-sm text-gray-700 mb-1">解除条件</label><input value={form.releaseCondition} onChange={(e) => setForm({ ...form, releaseCondition: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">备注</label>
            <textarea value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="罚金处理规则详情" onClose={() => setDetailOpen(false)}>
        {detail && (<>
          <DetailCard title="基本信息">
            <DetailRow label="规则编码" value={detail.code} mono />
            <DetailRow label="处理规则名称" value={detail.name} />
            <DetailRow label="罚金场景" value={detail.penaltyScene} />
            <DetailRow label="作用对象" value={detail.applyScope} />
            <DetailRow label="优先级" value={detail.priority} />
            <DetailRow label="状态" value={<StatusBadge status={detail.status} />} />
          </DetailCard>
          <DetailCard title="处理动作">
            <DetailRow label="影响后续下单" value={booleanText(detail.affectSubsequentOrder)} />
            <DetailRow label="下单控制方式" value={orderImpactLabels[detail.orderImpactMode]} />
            <DetailRow label="自动扣减" value={booleanText(detail.autoDeduct)} />
            <DetailRow label="扣减来源" value={deductSourceLabels[detail.deductSource]} />
            <DetailRow label="允许人工解除" value={detail.allowManualRelease ? '允许' : '不允许'} />
            <DetailRow label="解除条件" value={detail.releaseCondition || '-'} />
            <DetailRow label="通知角色" value={detail.notifyRole} />
            <DetailRow label="备注" value={detail.remark || '-'} />
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
        title="删除罚金处理规则"
        message="确定要删除该处理规则吗？删除后关联业务将无法继续引用该字典项。"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
