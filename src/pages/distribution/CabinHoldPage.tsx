import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { cabinHoldApi } from '@/mock/api'
import { dealers, products } from '@/mock/data'
import type { CabinHold, CabinHoldForm, PaginatedResult, SearchParams } from '@/types'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'
import { SelectField } from '@/components/common/SelectField'

const emptyForm: CabinHoldForm = {
  dealerId: '',
  productId: '',
  voyageDate: '',
  cabinType: '阳台房',
  holdQuantity: 1,
  depositRatio: 30,
  releaseDeadline: '',
  releaseReason: '',
}

export default function CabinHoldPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<CabinHold>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [dealerFilter, setDealerFilter] = useState('all')
  const [routeFilter, setRouteFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<CabinHoldForm>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<CabinHold | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [releaseOpen, setReleaseOpen] = useState(false)
  const [activeId, setActiveId] = useState('')
  const [releaseReason, setReleaseReason] = useState('')

  const activeDealers = useMemo(() => dealers.filter((item) => item.status === 'cooperating'), [])
  const routeOptions = useMemo(() => Array.from(new Set(products.map((item) => item.routeName))), [])
  const cabinTypeOptions = useMemo(() => ['套房', '阳台房', '海景房', '内舱房'].map((item) => ({ value: item, label: item })), [])
  const selectedProduct = useMemo(() => products.find((item) => item.id === form.productId), [form.productId])
  const selectedDealer = useMemo(() => dealers.find((item) => item.id === form.dealerId), [form.dealerId])
  const availableInventory = selectedProduct ? 12 + products.findIndex((item) => item.id === selectedProduct.id) % 8 : 0
  const unitPrice = selectedProduct ? 3200 + (products.findIndex((item) => item.id === selectedProduct.id) % 5) * 320 : 0
  const depositAmount = Math.round(form.holdQuantity * unitPrice * form.depositRatio) / 100

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    if (keyword.trim()) params.keyword = keyword.trim()
    if (dealerFilter !== 'all') params.dealerId = dealerFilter
    if (routeFilter !== 'all') params.routeName = routeFilter
    if (statusFilter !== 'all') params.status = statusFilter
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo
    const result = await cabinHoldApi.list(params)
    setData(result)
    setLoading(false)
  }, [keyword, dealerFilter, routeFilter, statusFilter, dateFrom, dateTo])

  useEffect(() => { fetchData() }, [fetchData])

  const handleReset = () => {
    setKeyword('')
    setDealerFilter('all')
    setRouteFilter('all')
    setStatusFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  const openCreate = () => {
    const dealerId = activeDealers[0]?.id ?? ''
    const productId = products[0]?.id ?? ''
    setForm({
      ...emptyForm,
      dealerId,
      productId,
      voyageDate: '2026-06-18',
      releaseDeadline: '2026-05-20',
    })
    setFormOpen(true)
  }

  const openDetail = async (record: CabinHold) => {
    const result = await cabinHoldApi.getById(record.id)
    setDetail(result || null)
    setDetailOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.dealerId || !form.productId || !form.voyageDate || !form.releaseDeadline) return
    setFormLoading(true)
    const now = new Date().toISOString()
    await cabinHoldApi.create({
      dealerId: form.dealerId,
      dealerName: selectedDealer?.name || '-',
      productId: form.productId,
      productName: selectedProduct?.name || '-',
      routeName: selectedProduct?.routeName || '-',
      voyageDate: form.voyageDate,
      cabinType: form.cabinType,
      holdQuantity: form.holdQuantity,
      confirmedQuantity: 0,
      availableInventory,
      unitPrice,
      depositRatio: form.depositRatio,
      depositAmount,
      releaseDeadline: form.releaseDeadline,
      releaseReason: form.releaseReason,
      status: 'effective',
      updatedBy: '当前用户',
      updatedAt: now,
      createdAt: now,
    })
    setFormLoading(false)
    setFormOpen(false)
    fetchData(1)
  }

  const askDelete = (id: string) => { setActiveId(id); setConfirmOpen(true) }
  const askRelease = (record: CabinHold) => { setActiveId(record.id); setReleaseReason(record.releaseReason || ''); setReleaseOpen(true) }
  const confirmDelete = async () => { await cabinHoldApi.remove(activeId); setConfirmOpen(false); fetchData(data.page) }
  const confirmRelease = async () => { await cabinHoldApi.release(activeId, releaseReason || '手动释放'); setReleaseOpen(false); fetchData(data.page) }

  return (
    <div>
      <PageHeader title="锁舱记录" description="管理经销商锁舱预留记录，并联动可售库存扣减与释放。" />

      <SearchPanel onSearch={() => fetchData(1)} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">关键词</label><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="经销商名称/产品名称" className="w-56 px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">经销商</label><SelectField value={dealerFilter} onChange={setDealerFilter} options={[{ value: 'all', label: '全部' }, ...activeDealers.map((dealer) => ({ value: dealer.id, label: dealer.name }))]} className="w-44" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">航线</label><SelectField value={routeFilter} onChange={setRouteFilter} options={[{ value: 'all', label: '全部' }, ...routeOptions.map((route) => ({ value: route, label: route }))]} className="w-44" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">锁舱状态</label><SelectField value={statusFilter} onChange={setStatusFilter} options={[{ value: 'all', label: '全部' }, { value: 'effective', label: '有效' }, { value: 'released', label: '已释放' }, { value: 'expired', label: '已逾期' }]} className="w-32" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">开始日期</label><input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">结束日期</label><input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
      </SearchPanel>
      <div className="bg-white px-9 py-6">
        <button onClick={openCreate} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-blue-600 px-7 text-base font-medium text-white transition hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          添加
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">经销商</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">产品名称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">航线</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">航次日期</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">舱位类型</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">锁舱数量</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">已确认数</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">定金比例</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">定金金额</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">释放期限</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-44">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={12} className="px-4 py-16 text-center text-sm text-gray-400">加载中...</td></tr>
              ) : data.data.length === 0 ? (
                <tr><td colSpan={12} className="px-4 py-16 text-center text-sm text-gray-400">暂无数据</td></tr>
              ) : data.data.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900">{record.dealerName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{record.productName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{record.routeName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(record.voyageDate)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{record.cabinType}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{record.holdQuantity}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{record.confirmedQuantity}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{record.depositRatio}%</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(record.depositAmount)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(record.releaseDeadline)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700"><StatusBadge status={record.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openDetail(record)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">详情</button>
                      {record.status === 'effective' && <button onClick={() => askRelease(record)} className="px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded">释放</button>}
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

      <FormDialog open={formOpen} title="新增锁舱记录" width="max-w-4xl" loading={formLoading} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">锁舱信息</h4>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">经销商 <span className="text-red-500">*</span></label><SelectField value={form.dealerId} onChange={(dealerId) => setForm({ ...form, dealerId })} options={activeDealers.map((dealer) => ({ value: dealer.id, label: dealer.name }))} /></div>
              <div><label className="block text-sm text-gray-700 mb-1">产品 <span className="text-red-500">*</span></label><SelectField value={form.productId} onChange={(productId) => setForm({ ...form, productId, releaseDeadline: form.releaseDeadline || '2026-05-20' })} options={products.slice(0, 18).map((product) => ({ value: product.id, label: product.name }))} /></div>
              <div><label className="block text-sm text-gray-700 mb-1">航次日期 <span className="text-red-500">*</span></label><input type="date" value={form.voyageDate} onChange={(event) => setForm({ ...form, voyageDate: event.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">舱位类型</label><SelectField value={form.cabinType} onChange={(cabinType) => setForm({ ...form, cabinType })} options={cabinTypeOptions} /></div>
              <div><label className="block text-sm text-gray-700 mb-1">锁舱数量</label><input type="number" min={1} max={availableInventory} value={form.holdQuantity} onChange={(event) => setForm({ ...form, holdQuantity: Number(event.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">定金比例</label><input type="number" min={10} max={100} value={form.depositRatio} onChange={(event) => setForm({ ...form, depositRatio: Number(event.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">释放期限 <span className="text-red-500">*</span></label><input type="date" value={form.releaseDeadline} onChange={(event) => setForm({ ...form, releaseDeadline: event.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 grid grid-cols-4 gap-4">
            <div><span className="block text-xs text-gray-500 mb-1">关联航线</span><span className="font-medium text-gray-900">{selectedProduct?.routeName || '-'}</span></div>
            <div><span className="block text-xs text-gray-500 mb-1">当前可售库存</span><span className={`font-medium ${form.holdQuantity > availableInventory ? 'text-red-600' : 'text-gray-900'}`}>{availableInventory} 间</span></div>
            <div><span className="block text-xs text-gray-500 mb-1">参考单价</span><span className="font-medium text-gray-900">{formatCurrency(unitPrice)}</span></div>
            <div><span className="block text-xs text-gray-500 mb-1">定金金额</span><span className="font-medium text-gray-900">{formatCurrency(depositAmount)}</span></div>
          </div>
          {form.holdQuantity > availableInventory && <p className="text-sm text-red-600">超过可售库存 {availableInventory} 间，请调整锁舱数量。</p>}
        </div>
      </FormDialog>

      <FormDialog open={releaseOpen} title="手动释放锁舱" loading={false} onCancel={() => setReleaseOpen(false)} onSubmit={confirmRelease} submitText="确认释放">
        <div className="space-y-3">
          <div><label className="block text-sm text-gray-700 mb-1">释放原因</label><textarea value={releaseReason} onChange={(event) => setReleaseReason(event.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="请填写释放原因" /></div>
          <p className="text-sm text-gray-500">释放成功后，对应舱位的可售库存将自动回增。</p>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="锁舱详情" width="w-[680px]" onClose={() => setDetailOpen(false)}>
        {detail && (
          <>
            <DetailCard title="基础信息">
              <DetailRow label="经销商" value={detail.dealerName} />
              <DetailRow label="产品名称" value={detail.productName} />
              <DetailRow label="航线" value={detail.routeName} />
              <DetailRow label="航次日期" value={formatDate(detail.voyageDate)} />
              <DetailRow label="状态" value={<StatusBadge status={detail.status} />} />
            </DetailCard>
            <DetailCard title="锁舱数据">
              <DetailRow label="舱位类型" value={detail.cabinType} />
              <DetailRow label="锁舱数量" value={detail.holdQuantity} />
              <DetailRow label="已确认数" value={detail.confirmedQuantity} />
              <DetailRow label="可售库存" value={detail.availableInventory} />
              <DetailRow label="定金比例" value={`${detail.depositRatio}%`} />
              <DetailRow label="定金金额" value={formatCurrency(detail.depositAmount)} />
              <DetailRow label="释放期限" value={formatDate(detail.releaseDeadline)} />
              <DetailRow label="释放原因" value={detail.releaseReason || '-'} />
            </DetailCard>
            <DetailCard title="操作信息">
              <DetailRow label="修改人" value={detail.updatedBy} />
              <DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} />
              <DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} />
            </DetailCard>
          </>
        )}
      </DetailDrawer>

      <ConfirmDialog open={confirmOpen} title="删除锁舱记录" message="确定删除该锁舱记录吗？删除后将不再保留该条预留关系。" danger onConfirm={confirmDelete} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}
