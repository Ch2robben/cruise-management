import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import DataTable from '@/components/common/DataTable'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'
import { formatDate, formatDateTime, generateId } from '@/utils/format'
import type { Status } from '@/types'

type DiscountBenefitType = 'none' | 'escortRatio' | 'fixedFree' | 'everyFullFree'

interface DiscountTierRule {
  id: string
  startPeople: number
  endPeople: number | null
  benefitType: DiscountBenefitType
  escortTicketRatio: number
  fullPeople: number
  freePeople: number
  fixedFreePeople: number
}

interface DiscountPolicy {
  id: string
  code: string
  name: string
  marketCategory: string
  effectiveStart: string
  effectiveEnd: string
  tiers: DiscountTierRule[]
  status: Status
  remark: string
  updatedBy: string
  updatedAt: string
  createdAt: string
}

type DiscountPolicyForm = Omit<DiscountPolicy, 'id' | 'status' | 'updatedBy' | 'updatedAt' | 'createdAt'>

const marketCategories = ['内宾', '外宾', '欧美', '中东', '团队', '包船']

const benefitTypeOptions: { value: DiscountBenefitType; label: string }[] = [
  { value: 'none', label: '无优惠' },
  { value: 'escortRatio', label: '全陪票比例' },
  { value: 'fixedFree', label: '固定免人' },
  { value: 'everyFullFree', label: '每满X免Y' },
]

const emptyTier = (): DiscountTierRule => ({
  id: generateId(),
  startPeople: 1,
  endPeople: null,
  benefitType: 'none',
  escortTicketRatio: 0,
  fullPeople: 0,
  freePeople: 0,
  fixedFreePeople: 0,
})

const emptyForm: DiscountPolicyForm = {
  code: 'DIS-NEW',
  name: '',
  marketCategory: '内宾',
  effectiveStart: '2026-01-01',
  effectiveEnd: '2026-12-31',
  tiers: [emptyTier()],
  remark: '',
}

function createPolicy(form: DiscountPolicyForm, status: Status = 'enabled'): DiscountPolicy {
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

const initialPolicies: DiscountPolicy[] = [
  createPolicy({
    ...emptyForm,
    code: 'DIS-001',
    name: '内宾团队优惠政策',
    marketCategory: '内宾',
    tiers: [
      { id: generateId(), startPeople: 1, endPeople: 16, benefitType: 'none', escortTicketRatio: 0, fullPeople: 0, freePeople: 0, fixedFreePeople: 0 },
      { id: generateId(), startPeople: 16, endPeople: 50, benefitType: 'everyFullFree', escortTicketRatio: 0, fullPeople: 16, freePeople: 1, fixedFreePeople: 0 },
      { id: generateId(), startPeople: 50, endPeople: null, benefitType: 'fixedFree', escortTicketRatio: 0, fullPeople: 0, freePeople: 0, fixedFreePeople: 3 },
    ],
    remark: '内宾团队按人数阶梯切换优惠口径，小团不优惠，中团每满16免1，大团固定免3人。',
  }),
  createPolicy({
    ...emptyForm,
    code: 'DIS-002',
    name: '外宾全陪票优惠政策',
    marketCategory: '外宾',
    tiers: [
      { id: generateId(), startPeople: 1, endPeople: 20, benefitType: 'none', escortTicketRatio: 0, fullPeople: 0, freePeople: 0, fixedFreePeople: 0 },
      { id: generateId(), startPeople: 20, endPeople: 40, benefitType: 'escortRatio', escortTicketRatio: 50, fullPeople: 0, freePeople: 0, fixedFreePeople: 0 },
      { id: generateId(), startPeople: 40, endPeople: null, benefitType: 'escortRatio', escortTicketRatio: 100, fullPeople: 0, freePeople: 0, fixedFreePeople: 0 },
    ],
    remark: '外宾团队只处理全陪票，20人起全陪半免，40人起全陪全免。',
  }),
]

function formatPeopleRange(tier: DiscountTierRule) {
  return `${tier.startPeople}人(含) - ${tier.endPeople ? `${tier.endPeople}人(不含)` : '不限'}`
}

function getBenefitTypeLabel(type: DiscountBenefitType) {
  return benefitTypeOptions.find((item) => item.value === type)?.label || type
}

function formatBenefit(tier: DiscountTierRule) {
  if (tier.benefitType === 'none') return '无优惠'
  if (tier.benefitType === 'escortRatio') return `全陪票比例 ${tier.escortTicketRatio}%`
  if (tier.benefitType === 'fixedFree') return `固定免 ${tier.fixedFreePeople} 人`
  return `每满 ${tier.fullPeople} 人免 ${tier.freePeople} 人`
}

function sanitizeTiers(tiers: DiscountTierRule[]) {
  return tiers.map((tier) => ({
    ...tier,
    startPeople: Math.max(0, Number(tier.startPeople) || 0),
    endPeople: tier.endPeople === null ? null : Math.max(0, Number(tier.endPeople) || 0),
    escortTicketRatio: tier.benefitType === 'escortRatio' ? Math.max(0, Math.min(100, Number(tier.escortTicketRatio) || 0)) : 0,
    fullPeople: tier.benefitType === 'everyFullFree' ? Math.max(0, Number(tier.fullPeople) || 0) : 0,
    freePeople: tier.benefitType === 'everyFullFree' ? Math.max(0, Number(tier.freePeople) || 0) : 0,
    fixedFreePeople: tier.benefitType === 'fixedFree' ? Math.max(0, Number(tier.fixedFreePeople) || 0) : 0,
  }))
}

export default function DiscountRulePage() {
  const [records, setRecords] = useState<DiscountPolicy[]>(initialPolicies)
  const [keyword, setKeyword] = useState('')
  const [marketFilter, setMarketFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<DiscountPolicyForm>(emptyForm)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<DiscountPolicy | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const filteredRecords = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return records.filter((item) => {
      const matchedKeyword = !kw || [item.code, item.name, item.remark].some((value) => value.toLowerCase().includes(kw))
      const matchedMarket = marketFilter === 'all' || item.marketCategory === marketFilter
      const matchedStatus = statusFilter === 'all' || item.status === statusFilter
      return matchedKeyword && matchedMarket && matchedStatus
    })
  }, [records, keyword, marketFilter, statusFilter])

  const pageSize = 10
  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize)

  const resetFilters = () => {
    setKeyword('')
    setMarketFilter('all')
    setStatusFilter('all')
    setPage(1)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, tiers: [emptyTier()] })
    setFormOpen(true)
  }

  const openEdit = (record: DiscountPolicy) => {
    const { id: _id, status: _status, updatedBy: _updatedBy, updatedAt: _updatedAt, createdAt: _createdAt, ...nextForm } = record
    setEditingId(record.id)
    setForm({ ...nextForm, tiers: nextForm.tiers.map((tier) => ({ ...tier })) })
    setFormOpen(true)
  }

  const updateTier = <K extends keyof DiscountTierRule>(id: string, key: K, value: DiscountTierRule[K]) => {
    setForm((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier) => tier.id === id ? { ...tier, [key]: value } : tier),
    }))
  }

  const updateTierBenefitType = (id: string, benefitType: DiscountBenefitType) => {
    setForm((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier) => tier.id === id ? {
        ...tier,
        benefitType,
        escortTicketRatio: benefitType === 'escortRatio' ? tier.escortTicketRatio : 0,
        fullPeople: benefitType === 'everyFullFree' ? tier.fullPeople : 0,
        freePeople: benefitType === 'everyFullFree' ? tier.freePeople : 0,
        fixedFreePeople: benefitType === 'fixedFree' ? tier.fixedFreePeople : 0,
      } : tier),
    }))
  }

  const addTier = () => {
    setForm((prev) => {
      const lastTier = prev.tiers[prev.tiers.length - 1]
      const nextStart = lastTier?.endPeople || Math.max((lastTier?.startPeople || 0) + 10, 1)
      return {
        ...prev,
        tiers: [
          ...prev.tiers,
          {
            ...emptyTier(),
            startPeople: nextStart,
            endPeople: null,
            benefitType: lastTier?.benefitType || 'none',
            escortTicketRatio: lastTier?.benefitType === 'escortRatio' ? lastTier.escortTicketRatio : 0,
            fullPeople: lastTier?.benefitType === 'everyFullFree' ? lastTier.fullPeople : 0,
            freePeople: lastTier?.benefitType === 'everyFullFree' ? lastTier.freePeople : 0,
            fixedFreePeople: lastTier?.benefitType === 'fixedFree' ? lastTier.fixedFreePeople : 0,
          },
        ],
      }
    })
  }

  const removeTier = (id: string) => {
    setForm((prev) => ({
      ...prev,
      tiers: prev.tiers.length > 1 ? prev.tiers.filter((tier) => tier.id !== id) : prev.tiers,
    }))
  }

  const submit = () => {
    if (!form.code.trim() || !form.name.trim() || form.tiers.length === 0) return
    const now = new Date().toISOString()
    const normalizedForm = { ...form, tiers: sanitizeTiers(form.tiers) }
    if (editingId) {
      setRecords((prev) => prev.map((item) => item.id === editingId ? { ...item, ...normalizedForm, updatedBy: '当前用户', updatedAt: now } : item))
    } else {
      setRecords((prev) => [createPolicy(normalizedForm), ...prev])
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
    { key: 'code', title: '政策编码', render: (r: DiscountPolicy) => <span className="font-mono text-xs">{r.code}</span> },
    { key: 'name', title: '政策名称', dataIndex: 'name' as keyof DiscountPolicy },
    { key: 'marketCategory', title: '市场类别', dataIndex: 'marketCategory' as keyof DiscountPolicy },
    { key: 'tiers', title: '阶梯规则', render: (r: DiscountPolicy) => (
      <div className="space-y-1 text-xs">
        {r.tiers.slice(0, 3).map((tier) => (
          <div key={tier.id} className="text-gray-600">
            {formatPeopleRange(tier)}：{formatBenefit(tier)}
          </div>
        ))}
        {r.tiers.length > 3 && <div className="text-gray-400">另 {r.tiers.length - 3} 条...</div>}
      </div>
    ) },
    { key: 'effective', title: '有效期', render: (r: DiscountPolicy) => `${formatDate(r.effectiveStart)} 至 ${formatDate(r.effectiveEnd)}` },
    { key: 'status', title: '状态', render: (r: DiscountPolicy) => <StatusBadge status={r.status} /> },
    { key: 'updatedAt', title: '修改时间', render: (r: DiscountPolicy) => formatDateTime(r.updatedAt) },
    { key: 'actions', title: '操作', width: '190px', render: (r: DiscountPolicy) => (
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
      <PageHeader title="内外宾优惠政策管理" description="按市场类别维护人数阶梯，每个阶梯可选择无优惠、全陪票比例、固定免人或每满X免Y。" />

      <SearchPanel onSearch={() => setPage(1)} onReset={resetFilters}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">关键词</label>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="编码/名称/备注" className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">市场类别</label>
          <select value={marketFilter} onChange={(e) => setMarketFilter(e.target.value)} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">全部</option>
            {marketCategories.map((item) => <option key={item} value={item}>{item}</option>)}
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
          <Plus className="w-4 h-4" />添加优惠政策
        </button>
      </div>

      <DataTable
        columns={columns}
        dataSource={pagedRecords}
        rowKey="id"
        pagination={{ current: page, pageSize, total: filteredRecords.length, onChange: setPage }}
      />

      <FormDialog open={formOpen} title={editingId ? '编辑优惠政策信息' : '添加优惠政策信息'} width="max-w-5xl" onCancel={() => setFormOpen(false)} onSubmit={submit}>
        <div className="space-y-6">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基本信息</h4>
            <div className="grid grid-cols-4 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">政策编码 <span className="text-red-500">*</span></label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">政策名称 <span className="text-red-500">*</span></label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">市场类别</label><select value={form.marketCategory} onChange={(e) => setForm({ ...form, marketCategory: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{marketCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">阶梯数量</label><div className="flex h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">{form.tiers.length} 条</div></div>
              <div><label className="block text-sm text-gray-700 mb-1">生效开始日期</label><input type="date" value={form.effectiveStart} onChange={(e) => setForm({ ...form, effectiveStart: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">生效结束日期</label><input type="date" value={form.effectiveEnd} onChange={(e) => setForm({ ...form, effectiveEnd: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">阶梯规则</h4>
              <button type="button" onClick={addTier} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700">
                <Plus className="w-4 h-4" />添加阶梯
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[880px] text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500">
                  <tr>
                    <th className="px-3 py-3">开始人数(含)</th>
                    <th className="px-3 py-3">结束人数(不含)</th>
                    <th className="px-3 py-3">优惠方式</th>
                    <th className="px-3 py-3">全陪比例</th>
                    <th className="px-3 py-3">固定免</th>
                    <th className="px-3 py-3">满</th>
                    <th className="px-3 py-3">免</th>
                    <th className="px-3 py-3 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {form.tiers.map((tier) => (
                    <tr key={tier.id}>
                      <td className="px-3 py-3"><input type="number" min={0} value={tier.startPeople} onChange={(e) => updateTier(tier.id, 'startPeople', Number(e.target.value))} placeholder="开始人数(含)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></td>
                      <td className="px-3 py-3"><input type="number" min={0} value={tier.endPeople ?? ''} onChange={(e) => updateTier(tier.id, 'endPeople', e.target.value === '' ? null : Number(e.target.value))} placeholder="结束人数(不含)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></td>
                      <td className="px-3 py-3"><select value={tier.benefitType} onChange={(e) => updateTierBenefitType(tier.id, e.target.value as DiscountBenefitType)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">{benefitTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <input type="number" min={0} max={100} value={tier.escortTicketRatio} disabled={tier.benefitType !== 'escortRatio'} onChange={(e) => updateTier(tier.id, 'escortTicketRatio', Number(e.target.value))} placeholder="比例" className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400" />
                          <span className="text-gray-500">%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3"><input type="number" min={0} value={tier.fixedFreePeople} disabled={tier.benefitType !== 'fixedFree'} onChange={(e) => updateTier(tier.id, 'fixedFreePeople', Number(e.target.value))} placeholder="免人数" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400" /></td>
                      <td className="px-3 py-3"><input type="number" min={0} value={tier.fullPeople} disabled={tier.benefitType !== 'everyFullFree'} onChange={(e) => updateTier(tier.id, 'fullPeople', Number(e.target.value))} placeholder="满人数" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400" /></td>
                      <td className="px-3 py-3"><input type="number" min={0} value={tier.freePeople} disabled={tier.benefitType !== 'everyFullFree'} onChange={(e) => updateTier(tier.id, 'freePeople', Number(e.target.value))} placeholder="免人数" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400" /></td>
                      <td className="px-3 py-3 text-center">
                        <button type="button" onClick={() => removeTier(tier.id)} disabled={form.tiers.length <= 1} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-300">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">备注</label>
            <textarea value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="优惠政策详情" onClose={() => setDetailOpen(false)}>
        {detail && (<>
          <DetailCard title="基本信息">
            <DetailRow label="政策编码" value={detail.code} mono />
            <DetailRow label="政策名称" value={detail.name} />
            <DetailRow label="市场类别" value={detail.marketCategory} />
            <DetailRow label="有效期" value={`${formatDate(detail.effectiveStart)} 至 ${formatDate(detail.effectiveEnd)}`} />
            <DetailRow label="状态" value={<StatusBadge status={detail.status} />} />
          </DetailCard>
          <DetailCard title={`阶梯规则（${detail.tiers.length}条）`}>
            <div className="space-y-3">
              {detail.tiers.map((tier) => (
                <div key={tier.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                  <div className="font-medium text-gray-900">{formatPeopleRange(tier)}</div>
                  <div className="mt-1 text-gray-600">优惠方式：{getBenefitTypeLabel(tier.benefitType)}</div>
                  <div className="mt-1 text-gray-600">优惠内容：{formatBenefit(tier)}</div>
                </div>
              ))}
            </div>
          </DetailCard>
          <DetailCard title="操作信息">
            <DetailRow label="备注" value={detail.remark || '-'} />
            <DetailRow label="修改人" value={detail.updatedBy} />
            <DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} />
            <DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} />
          </DetailCard>
        </>)}
      </DetailDrawer>

      <ConfirmDialog
        open={confirmOpen}
        title="删除优惠政策"
        message="确定要删除该优惠政策吗？删除后相关市场类别将无法引用该政策。"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
