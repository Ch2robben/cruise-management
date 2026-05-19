import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { charterOrderApi } from '@/mock/api'
import { routes, ships } from '@/mock/data'
import type { CharterOrder, CharterOrderForm, PaginatedResult, SearchParams, CharterReservationType, CharterBillingType, CharterSettlementType, CharterFeeItem } from '@/types'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'

const reservationTypeLabels: Record<CharterReservationType, string> = {
  study: '研学',
  business: '商务宴请',
  wedding: '婚庆',
  deck: '包层',
  hall: '包厅',
  cabin: '包舱',
}

const billingTypeLabels: Record<CharterBillingType, string> = {
  hourly: '按航行小时',
  per_person: '按人数',
  fixed: '固定起包价',
}

const settlementTypeLabels: Record<CharterSettlementType, string> = {
  cash: '现结',
  monthly: '月结',
  unified: '统一结算',
}

function createFeeItem(id = 1): CharterFeeItem {
  return { id: `draft-fee-${id}`, item: '船票费', unitPrice: 0, quantity: 1, amount: 0, remark: '' }
}

const emptyForm: CharterOrderForm = {
  reservationType: 'business',
  companyName: '',
  contactName: '',
  phone: '',
  useDate: '',
  passengerCount: 20,
  routeId: '',
  shipId: '',
  billingType: 'fixed',
  specialRequirement: '',
  feeItems: [createFeeItem()],
  depositAmount: 0,
  depositDeadline: '',
  settlementType: 'cash',
  realNameRequired: false,
  travelers: [],
}

export default function CharterOrderPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<CharterOrder>>({ data: [], total: 0, page: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<CharterOrderForm>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<CharterOrder | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmMessage, setConfirmMessage] = useState('')
  const [confirmAction, setConfirmAction] = useState<'accept' | 'reject' | 'sign' | 'cancel' | ''>('')
  const [activeId, setActiveId] = useState('')
  const [reasonOpen, setReasonOpen] = useState(false)
  const [actionReason, setActionReason] = useState('')

  const selectedRoute = useMemo(() => routes.find((item) => item.id === form.routeId), [form.routeId])
  const selectedShip = useMemo(() => ships.find((item) => item.id === form.shipId), [form.shipId])
  const totalAmount = useMemo(() => form.feeItems.reduce((sum, item) => sum + item.amount, 0), [form.feeItems])

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    if (keyword.trim()) params.keyword = keyword.trim()
    if (statusFilter !== 'all') params.status = statusFilter
    if (typeFilter !== 'all') params.reservationType = typeFilter
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo
    const result = await charterOrderApi.list(params)
    setData(result)
    setLoading(false)
  }, [keyword, statusFilter, typeFilter, dateFrom, dateTo])

  useEffect(() => { fetchData() }, [fetchData])

  const handleReset = () => {
    setKeyword('')
    setStatusFilter('all')
    setTypeFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  const openCreate = () => {
    setForm({
      ...emptyForm,
      routeId: routes[0]?.id || '',
      shipId: ships[0]?.id || '',
      useDate: '2026-06-20',
      depositDeadline: '2026-05-30',
      feeItems: [createFeeItem(1), createFeeItem(2)],
    })
    setFormOpen(true)
  }

  const openDetail = async (record: CharterOrder) => {
    const result = await charterOrderApi.getById(record.id)
    setDetail(result || null)
    setDetailOpen(true)
  }

  const updateFeeItem = (id: string, field: keyof CharterFeeItem, value: string | number) => {
    const next = form.feeItems.map((item) => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }
      updated.amount = Number(updated.unitPrice) * Number(updated.quantity)
      return updated
    })
    const nextTotal = next.reduce((sum, item) => sum + item.amount, 0)
    setForm({ ...form, feeItems: next, depositAmount: Math.round(nextTotal * 0.3) })
  }

  const addFeeItem = () => {
    setForm({ ...form, feeItems: [...form.feeItems, createFeeItem(form.feeItems.length + 1)] })
  }

  const removeFeeItem = (id: string) => {
    const next = form.feeItems.filter((item) => item.id !== id)
    const nextTotal = next.reduce((sum, item) => sum + item.amount, 0)
    setForm({ ...form, feeItems: next.length > 0 ? next : [createFeeItem()], depositAmount: Math.round(nextTotal * 0.3) })
  }

  const handleSubmit = async () => {
    if (!form.companyName.trim() || !form.contactName.trim() || !form.routeId || !form.shipId) return
    setFormLoading(true)
    const now = new Date().toISOString()
    await charterOrderApi.create({
      orderNo: `CHT${Date.now()}`,
      reservationType: form.reservationType,
      companyName: form.companyName,
      contactName: form.contactName,
      phone: form.phone,
      useDate: form.useDate,
      passengerCount: form.passengerCount,
      routeId: form.routeId,
      routeName: selectedRoute?.name || '-',
      shipId: form.shipId,
      shipName: selectedShip?.name || '-',
      shipCapacity: selectedShip?.capacity || 0,
      billingType: form.billingType,
      specialRequirement: form.specialRequirement,
      feeItems: form.feeItems,
      totalAmount,
      depositAmount: form.depositAmount,
      receivedDepositAmount: 0,
      depositDeadline: form.depositDeadline,
      settlementType: form.settlementType,
      realNameRequired: form.realNameRequired,
      travelers: form.travelers,
      berthOccupancy: 'reserved',
      depositStatus: 'unpaid',
      balanceStatus: 'unsettled',
      status: 'pending_accept',
      internalRemark: '',
      rejectReason: '',
      collections: [],
      updatedBy: '当前用户',
      updatedAt: now,
      createdAt: now,
    })
    setFormLoading(false)
    setFormOpen(false)
    fetchData(1)
  }

  const askReasonAction = (id: string, action: 'accept' | 'reject' | 'cancel', title: string, message: string) => {
    setActiveId(id)
    setConfirmAction(action)
    setConfirmTitle(title)
    setConfirmMessage(message)
    setActionReason('')
    setReasonOpen(true)
  }

  const askConfirmAction = (id: string, action: 'sign', title: string, message: string) => {
    setActiveId(id)
    setConfirmAction(action)
    setConfirmTitle(title)
    setConfirmMessage(message)
    setConfirmOpen(true)
  }

  const handleReasonAction = async () => {
    if (confirmAction === 'accept') await charterOrderApi.accept(activeId, actionReason || '已完成业务确认')
    if (confirmAction === 'reject') await charterOrderApi.reject(activeId, actionReason || '档期冲突')
    if (confirmAction === 'cancel') await charterOrderApi.cancel(activeId, actionReason || '客户取消')
    setReasonOpen(false)
    fetchData(data.page)
  }

  const handleConfirm = async () => {
    if (confirmAction === 'sign') await charterOrderApi.sign(activeId)
    setConfirmOpen(false)
    fetchData(data.page)
  }

  return (
    <div>
      <PageHeader title="包船订单" description="管理包船预约、接单签约、收款与实名名单等业务流程。">
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">
          <Plus className="w-4 h-4" />
          新建预约单
        </button>
      </PageHeader>

      <SearchPanel onSearch={() => fetchData(1)} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">关键词</label><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="包船单号/用船单位" className="w-56 px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">预约类型</label><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option>{Object.entries(reservationTypeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">订单状态</label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">全部</option><option value="pending_accept">待接单</option><option value="accepted">已接单</option><option value="signed">已签约</option><option value="in_progress">执行中</option><option value="completed">已完成</option><option value="cancelled">已取消</option></select></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">开始日期</label><input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-gray-500">结束日期</label><input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
      </SearchPanel>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">包船单号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">用船单位</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">预约类型</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">用船日期</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">航线</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">船型</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">人数</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">合计金额</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">定金状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">订单状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-60">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={11} className="px-4 py-16 text-center text-sm text-gray-400">加载中...</td></tr>
              ) : data.data.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-16 text-center text-sm text-gray-400">暂无数据</td></tr>
              ) : data.data.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900"><div className="font-medium">{record.orderNo}</div><div className="text-xs text-gray-400 mt-1">{record.contactName} / {record.phone}</div></td>
                  <td className="px-4 py-3 text-sm text-gray-700">{record.companyName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{reservationTypeLabels[record.reservationType]}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(record.useDate)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{record.routeName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{record.shipName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{record.passengerCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(record.totalAmount)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700"><StatusBadge status={record.depositStatus} /></td>
                  <td className="px-4 py-3 text-sm text-gray-700"><StatusBadge status={record.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      <button onClick={() => openDetail(record)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">详情</button>
                      {record.status === 'pending_accept' && <button onClick={() => askReasonAction(record.id, 'accept', '接单确认', '确认接单并填写业务确认说明。')} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded">接单</button>}
                      {record.status === 'pending_accept' && <button onClick={() => askReasonAction(record.id, 'reject', '拒单确认', '拒单后该预约单将直接转为已取消。')} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">拒单</button>}
                      {record.status === 'accepted' && <button onClick={() => askConfirmAction(record.id, 'sign', '生成正式订单', '确认后状态将进入“已签约”。')} className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded">签约</button>}
                      {record.status !== 'cancelled' && record.status !== 'completed' && <button onClick={() => askReasonAction(record.id, 'cancel', '整单取消', '已收定金需按规则处理，请填写取消原因。')} className="px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded">取消</button>}
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

      <FormDialog open={formOpen} title="新建包船预约单" width="max-w-4xl" loading={formLoading} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">预约信息</h4>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">预约类型 <span className="text-red-500">*</span></label><select value={form.reservationType} onChange={(event) => setForm({ ...form, reservationType: event.target.value as CharterReservationType })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{Object.entries(reservationTypeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">用船单位 <span className="text-red-500">*</span></label><input value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">联系人姓名 <span className="text-red-500">*</span></label><input value={form.contactName} onChange={(event) => setForm({ ...form, contactName: event.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">联系电话</label><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">用船日期 <span className="text-red-500">*</span></label><input type="date" value={form.useDate} onChange={(event) => setForm({ ...form, useDate: event.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">人数</label><input type="number" value={form.passengerCount} onChange={(event) => setForm({ ...form, passengerCount: Number(event.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">航线</label><select value={form.routeId} onChange={(event) => setForm({ ...form, routeId: event.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{routes.slice(0, 18).map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">船型</label><select value={form.shipId} onChange={(event) => setForm({ ...form, shipId: event.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{ships.map((ship) => <option key={ship.id} value={ship.id}>{ship.name}</option>)}</select></div>
              <div><label className="block text-sm text-gray-700 mb-1">计费类型</label><select value={form.billingType} onChange={(event) => setForm({ ...form, billingType: event.target.value as CharterBillingType })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{Object.entries(billingTypeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
            </div>
            <div className="mt-4"><label className="block text-sm text-gray-700 mb-1">特殊需求</label><textarea rows={3} value={form.specialRequirement} onChange={(event) => setForm({ ...form, specialRequirement: event.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">费用明细</h4>
              <button type="button" onClick={addFeeItem} className="text-xs text-blue-600 hover:bg-blue-50 rounded px-2 py-0.5">+ 添加费用项</button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-3 py-2 text-left text-xs text-gray-500">费用项目</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">单价</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">数量</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">金额</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">备注</th>
                  <th className="px-3 py-2 text-center text-xs text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {form.feeItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2"><select value={item.item} onChange={(event) => updateFeeItem(item.id, 'item', event.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs"><option value="船票费">船票费</option><option value="茶水费">茶水费</option><option value="餐饮费">餐饮费</option><option value="服务费">服务费</option><option value="场地费">场地费</option><option value="其他">其他</option></select></td>
                    <td className="px-3 py-2"><input type="number" value={item.unitPrice} onChange={(event) => updateFeeItem(item.id, 'unitPrice', Number(event.target.value))} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" /></td>
                    <td className="px-3 py-2"><input type="number" value={item.quantity} onChange={(event) => updateFeeItem(item.id, 'quantity', Number(event.target.value))} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" /></td>
                    <td className="px-3 py-2 text-gray-700">{formatCurrency(item.amount)}</td>
                    <td className="px-3 py-2"><input value={item.remark} onChange={(event) => updateFeeItem(item.id, 'remark', event.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" /></td>
                    <td className="px-3 py-2 text-center"><button type="button" onClick={() => removeFeeItem(item.id)} className="text-xs text-red-500 hover:bg-red-50 rounded px-1 py-0.5">删除</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 text-right text-sm font-medium text-gray-900">合计金额：{formatCurrency(totalAmount)}</div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">收款信息</h4>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm text-gray-700 mb-1">定金金额</label><input type="number" value={form.depositAmount} onChange={(event) => setForm({ ...form, depositAmount: Number(event.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">定金支付期限</label><input type="date" value={form.depositDeadline} onChange={(event) => setForm({ ...form, depositDeadline: event.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">尾款结算方式</label><select value={form.settlementType} onChange={(event) => setForm({ ...form, settlementType: event.target.value as CharterSettlementType })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{Object.entries(settlementTypeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-3 gap-4 text-sm text-gray-600">
            <div><span className="block text-xs text-gray-500 mb-1">关联航线</span><span className="font-medium text-gray-900">{selectedRoute?.name || '-'}</span></div>
            <div><span className="block text-xs text-gray-500 mb-1">船型核载人数</span><span className="font-medium text-gray-900">{selectedShip?.capacity || 0}</span></div>
            <div><span className="block text-xs text-gray-500 mb-1">甲板层数</span><span className="font-medium text-gray-900">{selectedShip?.floors || 0}</span></div>
          </div>
        </div>
      </FormDialog>

      <FormDialog open={reasonOpen} title={confirmTitle} loading={false} onCancel={() => setReasonOpen(false)} onSubmit={handleReasonAction} submitText="确认">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">{confirmMessage}</p>
          <div><label className="block text-sm text-gray-700 mb-1">处理说明</label><textarea rows={4} value={actionReason} onChange={(event) => setActionReason(event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="请输入业务确认说明 / 拒单原因 / 取消原因" /></div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="包船订单详情" width="w-[720px]" onClose={() => setDetailOpen(false)}>
        {detail && (
          <>
            <DetailCard title="预约信息">
              <DetailRow label="包船单号" value={detail.orderNo} mono />
              <DetailRow label="用船单位" value={detail.companyName} />
              <DetailRow label="预约类型" value={reservationTypeLabels[detail.reservationType]} />
              <DetailRow label="用船日期" value={formatDate(detail.useDate)} />
              <DetailRow label="航线 / 船型" value={`${detail.routeName} / ${detail.shipName}`} />
              <DetailRow label="订单状态" value={<StatusBadge status={detail.status} />} />
            </DetailCard>
            <DetailCard title="费用与收款">
              <DetailRow label="计费类型" value={billingTypeLabels[detail.billingType]} />
              <DetailRow label="合计金额" value={formatCurrency(detail.totalAmount)} />
              <DetailRow label="定金金额" value={formatCurrency(detail.depositAmount)} />
              <DetailRow label="已收定金" value={formatCurrency(detail.receivedDepositAmount)} />
              <DetailRow label="定金状态" value={<StatusBadge status={detail.depositStatus} />} />
              <DetailRow label="尾款状态" value={<StatusBadge status={detail.balanceStatus} />} />
            </DetailCard>
            <DetailCard title={`费用明细（${detail.feeItems.length}项）`}>
              {detail.feeItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-1">
                  <span className="text-gray-700">{item.item} / {item.quantity} × {formatCurrency(item.unitPrice)}</span>
                  <span className="text-gray-500">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </DetailCard>
            <DetailCard title="操作信息">
              <DetailRow label="修改人" value={detail.updatedBy} />
              <DetailRow label="修改时间" value={formatDateTime(detail.updatedAt)} />
              <DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} />
            </DetailCard>
          </>
        )}
      </DetailDrawer>

      <ConfirmDialog open={confirmOpen} title={confirmTitle} message={confirmMessage} onConfirm={handleConfirm} onCancel={() => setConfirmOpen(false)} />
    </div>
  )
}
