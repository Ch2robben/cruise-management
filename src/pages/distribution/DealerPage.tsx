import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { dealerApi } from '@/mock/api'
import { products } from '@/mock/data'
import type { Dealer, DealerForm, DealerLevel, DealerPriceSystem, DealerRebateCycle, DealerRebateDimension, DealerRefundPermission, DealerSettlementCycle, PaginatedResult, SearchParams, DealerChannelType } from '@/types'
import { formatCurrency, formatDateTime } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'

const channelTypeLabels: Record<DealerChannelType, string> = { ota: 'OTA', distribution: '同业分销', group: '组团社' }
const levelLabels: Record<DealerLevel, string> = { strategic: '战略', core: '核心', normal: '普通' }
const settlementLabels: Record<DealerSettlementCycle, string> = { monthly: '月度', quarterly: '季度', voyage_end: '航次结束' }
const priceSystemLabels: Record<DealerPriceSystem, string> = { retail: '零售公布价', online: '线上销售价', contract: '签约结算价', regional: '区域结算价' }
const refundLabels: Record<DealerRefundPermission, string> = { none: '无', self: '限自身订单', with_subordinate: '含下级' }
const rebateDimensionLabels: Record<DealerRebateDimension, string> = { sales: '按销售额阶梯', orders: '按订单量', product: '按特定产品' }
const rebateCycleLabels: Record<DealerRebateCycle, string> = { monthly: '月度', quarterly: '季度', yearly: '年度' }

type MultiSelectOption<T extends string> = {
  value: T
  label: string
}

const emptyForm: DealerForm = {
  name: '',
  code: '',
  socialCreditCode: '',
  channelTypes: ['distribution'],
  region: '重庆/渝中',
  level: 'normal',
  contact: '',
  phone: '',
  qualificationFiles: [],
  creditLimit: 0,
  guaranteeAmount: 0,
  settlementCycle: 'voyage_end',
  priceSystems: ['contract'],
  otaServiceRate: null,
  refundPermission: 'self',
  rebateDimensions: [],
  rebateCycle: 'quarterly',
  authorizedProductIds: [],
}

const channelTypeOptions: MultiSelectOption<DealerChannelType>[] = [
  { value: 'ota', label: 'OTA' },
  { value: 'distribution', label: '同业分销' },
  { value: 'group', label: '组团社' },
]

const priceSystemOptions: MultiSelectOption<DealerPriceSystem>[] = [
  { value: 'retail', label: '零售公布价' },
  { value: 'online', label: '线上销售价' },
  { value: 'contract', label: '签约结算价' },
  { value: 'regional', label: '区域结算价' },
]

const rebateDimensionOptions: MultiSelectOption<DealerRebateDimension>[] = [
  { value: 'sales', label: '按销售额阶梯' },
  { value: 'orders', label: '按订单量' },
  { value: 'product', label: '按特定产品' },
]

function MultiSelectField<T extends string>({
  value,
  options,
  onChange,
  className = '',
}: {
  value: T[]
  options: MultiSelectOption<T>[]
  onChange: (value: T[]) => void
  className?: string
}) {
  const selectedValues = new Set(value)

  const toggleValue = (nextValue: T) => {
    if (selectedValues.has(nextValue)) {
      onChange(value.filter((item) => item !== nextValue))
      return
    }
    onChange([...value, nextValue])
  }

  return (
    <div className={`rounded-lg border border-gray-300 bg-white p-2 transition-colors focus-within:border-gray-500 focus-within:ring-2 focus-within:ring-gray-100 ${className}`}>
      <div className="grid gap-1">
        {options.map((option) => {
          const checked = selectedValues.has(option.value)
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${checked ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleValue(option.value)}
                className="h-4 w-4 rounded border-gray-300 accent-gray-900"
              />
              <span className="truncate">{option.label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

export default function DealerPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<Dealer>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<DealerForm>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<Dealer | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmConfig, setConfirmConfig] = useState<{ type: 'delete' | 'toggle' | ''; id: string; message: string }>({ type: '', id: '', message: '' })

  const regionOptions = useMemo(() => ['重庆/渝中', '重庆/江北', '湖北/宜昌', '湖北/武汉', '江苏/南京', '上海/浦东', '广东/广州', '福建/厦门'], [])

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    if (keyword.trim()) params.keyword = keyword.trim()
    if (statusFilter !== 'all') params.status = statusFilter
    if (channelFilter !== 'all') params.channelType = channelFilter
    if (levelFilter !== 'all') params.level = levelFilter
    const result = await dealerApi.list(params)
    setData(result)
    setLoading(false)
  }, [keyword, statusFilter, channelFilter, levelFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleReset = () => {
    setKeyword('')
    setStatusFilter('all')
    setChannelFilter('all')
    setLevelFilter('all')
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (record: Dealer) => {
    setEditingId(record.id)
    setForm({
      name: record.name,
      code: record.code,
      socialCreditCode: record.socialCreditCode,
      channelTypes: record.channelTypes,
      region: record.region,
      level: record.level,
      contact: record.contact,
      phone: record.phone,
      qualificationFiles: record.qualificationFiles,
      creditLimit: record.creditLimit,
      guaranteeAmount: record.guaranteeAmount,
      settlementCycle: record.settlementCycle,
      priceSystems: record.priceSystems,
      otaServiceRate: record.otaServiceRate,
      refundPermission: record.refundPermission,
      rebateDimensions: record.rebateDimensions,
      rebateCycle: record.rebateCycle,
      authorizedProductIds: record.authorizedProductIds,
    })
    setFormOpen(true)
  }

  const openDetail = async (record: Dealer) => {
    const result = await dealerApi.getById(record.id)
    setDetail(result || null)
    setDetailOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.contact.trim() || !form.phone.trim()) return
    setFormLoading(true)
    if (editingId) {
      await dealerApi.update(editingId, { ...form, updatedBy: '当前用户', updatedAt: new Date().toISOString() })
    } else {
      const now = new Date().toISOString()
      await dealerApi.create({ ...form, status: 'cooperating', updatedBy: '当前用户', updatedAt: now, createdAt: now })
    }
    setFormLoading(false)
    setFormOpen(false)
    fetchData(data.page)
  }

  const askDelete = (id: string) => {
    setConfirmConfig({ type: 'delete', id, message: '确定删除该经销商吗？关联的锁舱记录与订单将保留但不可新建。' })
    setConfirmOpen(true)
  }
  const askToggle = (record: Dealer) => {
    setConfirmConfig({ type: 'toggle', id: record.id, message: record.status === 'cooperating' ? '终止合作后不可新建锁舱与营销投放，是否继续？' : '重新启用后该经销商可再次参与锁舱和活动投放，是否继续？' })
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    if (confirmConfig.type === 'delete') await dealerApi.remove(confirmConfig.id)
    if (confirmConfig.type === 'toggle') await dealerApi.toggleStatus(confirmConfig.id)
    setConfirmOpen(false)
    fetchData(data.page)
  }

  return (
    <div>
      <PageHeader title="经销商管理" description="管理 OTA、同业分销与组团社合作档案、结算口径与返利策略。">
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">
          <Plus className="w-4 h-4" />
          新增经销商
        </button>
      </PageHeader>

      <SearchPanel onSearch={() => fetchData(1)} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">关键词</label>
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="经销商名称/合作编号" className="w-56 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">渠道类型</label>
          <select value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)} className="w-32 select-field">
            <option value="all">全部</option>
            <option value="ota">OTA</option>
            <option value="distribution">同业分销</option>
            <option value="group">组团社</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">合作状态</label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-32 select-field">
            <option value="all">全部</option>
            <option value="cooperating">合作中</option>
            <option value="terminated">已终止</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">经销商等级</label>
          <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)} className="w-28 select-field">
            <option value="all">全部</option>
            <option value="strategic">战略</option>
            <option value="core">核心</option>
            <option value="normal">普通</option>
          </select>
        </div>
      </SearchPanel>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">经销商名称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">渠道类型</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">合作区域</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">等级</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">授信额度</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">质保金余额</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">合作状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">联系人</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">创建时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-44">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-16 text-center text-sm text-gray-400">加载中...</td></tr>
              ) : data.data.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-16 text-center text-sm text-gray-400">暂无数据</td></tr>
              ) : data.data.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="font-medium">{record.name}</div>
                    <div className="text-xs text-gray-400 font-mono mt-1">{record.code}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{record.channelTypes.map((item) => channelTypeLabels[item]).join(' / ')}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{record.region}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{levelLabels[record.level]}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(record.creditLimit)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(record.guaranteeAmount)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700"><StatusBadge status={record.status} /></td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div>{record.contact}</div>
                    <div className="text-xs text-gray-400 mt-1">{record.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(record.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openDetail(record)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">详情</button>
                      <button onClick={() => openEdit(record)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">编辑</button>
                      <button onClick={() => askToggle(record)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">{record.status === 'cooperating' ? '停用' : '启用'}</button>
                      <button onClick={() => askDelete(record.id)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-500">共 {data.total} 条</span>
            <div className="flex items-center gap-1">
              <button onClick={() => fetchData(data.page - 1)} disabled={data.page <= 1} className="px-3 py-1.5 text-sm rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30">上一页</button>
              <button onClick={() => fetchData(data.page + 1)} disabled={data.page >= Math.ceil(data.total / data.pageSize)} className="px-3 py-1.5 text-sm rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30">下一页</button>
            </div>
          </div>
        )}
      </div>

      <FormDialog open={formOpen} title={editingId ? '编辑经销商' : '新增经销商'} width="max-w-4xl" loading={formLoading} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基本信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">经销商名称 <span className="text-red-500">*</span></label><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">合作编号</label><input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">统一社会信用代码</label><input value={form.socialCreditCode} onChange={(event) => setForm({ ...form, socialCreditCode: event.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">合作区域 <span className="text-red-500">*</span></label><select value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })} className="w-full select-field">{regionOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">经销商等级</label><select value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value as DealerLevel })} className="w-full select-field"><option value="strategic">战略</option><option value="core">核心</option><option value="normal">普通</option></select></div>
              <div><label className="block text-sm text-gray-700 mb-1">渠道类型 <span className="text-red-500">*</span></label><MultiSelectField value={form.channelTypes} options={channelTypeOptions} onChange={(channelTypes) => setForm({ ...form, channelTypes })} /></div>
              <div><label className="block text-sm text-gray-700 mb-1">联系人 <span className="text-red-500">*</span></label><input value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">联系电话 <span className="text-red-500">*</span></label><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">资金与结算</h4>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">授信额度</label><input type="number" value={form.creditLimit} onChange={(event) => setForm({ ...form, creditLimit: Number(event.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">质保金</label><input type="number" value={form.guaranteeAmount} onChange={(event) => setForm({ ...form, guaranteeAmount: Number(event.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">结算周期</label><select value={form.settlementCycle} onChange={(event) => setForm({ ...form, settlementCycle: event.target.value as DealerSettlementCycle })} className="w-full select-field"><option value="monthly">月度</option><option value="quarterly">季度</option><option value="voyage_end">航次结束</option></select></div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">价格策略与返利</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">适用结算价体系</label><MultiSelectField value={form.priceSystems} options={priceSystemOptions} onChange={(priceSystems) => setForm({ ...form, priceSystems })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-700 mb-1">OTA 服务费率</label><input type="number" step="0.1" value={form.otaServiceRate ?? ''} onChange={(event) => setForm({ ...form, otaServiceRate: event.target.value === '' ? null : Number(event.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                <div><label className="block text-sm text-gray-700 mb-1">退改签权限</label><select value={form.refundPermission} onChange={(event) => setForm({ ...form, refundPermission: event.target.value as DealerRefundPermission })} className="w-full select-field"><option value="none">无</option><option value="self">限自身订单</option><option value="with_subordinate">含下级</option></select></div>
                <div><label className="block text-sm text-gray-700 mb-1">返利维度</label><MultiSelectField value={form.rebateDimensions} options={rebateDimensionOptions} onChange={(rebateDimensions) => setForm({ ...form, rebateDimensions })} /></div>
                <div><label className="block text-sm text-gray-700 mb-1">返利结算周期</label><select value={form.rebateCycle} onChange={(event) => setForm({ ...form, rebateCycle: event.target.value as DealerRebateCycle })} className="w-full select-field"><option value="monthly">月度</option><option value="quarterly">季度</option><option value="yearly">年度</option></select></div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">授权产品</h4>
            <MultiSelectField
              value={form.authorizedProductIds}
              options={products.slice(0, 18).map((product) => ({ value: product.id, label: product.name }))}
              onChange={(authorizedProductIds) => setForm({ ...form, authorizedProductIds })}
              className="max-h-48 overflow-y-auto"
            />
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="经销商详情" width="w-[680px]" onClose={() => setDetailOpen(false)}>
        {detail && (
          <>
            <DetailCard title="合作信息">
              <DetailRow label="经销商名称" value={detail.name} />
              <DetailRow label="合作编号" value={detail.code} mono />
              <DetailRow label="统一代码" value={detail.socialCreditCode || '-'} mono />
              <DetailRow label="渠道类型" value={detail.channelTypes.map((item) => channelTypeLabels[item]).join(' / ')} />
              <DetailRow label="合作区域" value={detail.region} />
              <DetailRow label="经销商等级" value={levelLabels[detail.level]} />
              <DetailRow label="合作状态" value={<StatusBadge status={detail.status} />} />
            </DetailCard>
            <DetailCard title="资金账户">
              <DetailRow label="授信额度" value={formatCurrency(detail.creditLimit)} />
              <DetailRow label="质保金余额" value={formatCurrency(detail.guaranteeAmount)} />
              <DetailRow label="结算周期" value={settlementLabels[detail.settlementCycle]} />
              <DetailRow label="联系人" value={`${detail.contact} / ${detail.phone}`} />
            </DetailCard>
            <DetailCard title="价格策略">
              <DetailRow label="结算价体系" value={detail.priceSystems.map((item) => priceSystemLabels[item]).join('、')} />
              <DetailRow label="OTA 服务费率" value={detail.otaServiceRate === null ? '-' : `${detail.otaServiceRate}%`} />
              <DetailRow label="退改权限" value={refundLabels[detail.refundPermission]} />
              <DetailRow label="授权产品数" value={`${detail.authorizedProductIds.length} 个`} />
            </DetailCard>
            <DetailCard title="返利规则">
              <DetailRow label="返利维度" value={detail.rebateDimensions.length > 0 ? detail.rebateDimensions.map((item) => rebateDimensionLabels[item]).join('、') : '-'} />
              <DetailRow label="返利结算周期" value={rebateCycleLabels[detail.rebateCycle]} />
              <DetailRow label="修改人" value={detail.updatedBy} />
              <DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} />
            </DetailCard>
          </>
        )}
      </DetailDrawer>

      <ConfirmDialog open={confirmOpen} title={confirmConfig.type === 'delete' ? '删除经销商' : '变更合作状态'} message={confirmConfig.message} danger={confirmConfig.type === 'delete'} onConfirm={handleConfirm} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}
