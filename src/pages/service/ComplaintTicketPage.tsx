import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { complaintApi } from '@/mock/api'
import { complaintTickets, users } from '@/mock/data'
import type {
  ComplaintPriority,
  ComplaintRecord,
  ComplaintStatus,
  ComplaintTicket,
  ComplaintTicketForm,
  ComplaintType,
  PaginatedResult,
  SearchParams,
} from '@/types'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import PageHeader from '@/components/common/PageHeader'
import SearchPanel from '@/components/common/SearchPanel'
import FormDialog from '@/components/common/FormDialog'
import DetailDrawer, { DetailCard, DetailRow } from '@/components/common/DetailDrawer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatusBadge from '@/components/common/StatusBadge'

const typeLabels: Record<ComplaintType, string> = {
  complaint: '投诉',
  consult: '咨询',
  refund: '退款',
}

const priorityLabels: Record<ComplaintPriority, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

const statusLabels: Record<ComplaintStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
}

const emptyForm: ComplaintTicketForm = {
  type: 'complaint',
  orderNo: '',
  customerName: '',
  phone: '',
  description: '',
  attachments: [],
  priority: 'medium',
  assigneeId: users[0]?.id || '',
}

export default function ComplaintTicketPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResult<ComplaintTicket>>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
  })
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState<ComplaintTicketForm>(emptyForm)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<ComplaintTicket | null>(null)

  const [recordOpen, setRecordOpen] = useState(false)
  const [recordOpinion, setRecordOpinion] = useState('')
  const [recordRemark, setRecordRemark] = useState('')
  const [recordStatus, setRecordStatus] = useState<ComplaintStatus>('processing')
  const [recordTarget, setRecordTarget] = useState<ComplaintTicket | null>(null)

  const [assignOpen, setAssignOpen] = useState(false)
  const [assignTarget, setAssignTarget] = useState<ComplaintTicket | null>(null)
  const [assignAssigneeId, setAssignAssigneeId] = useState(users[0]?.id || '')

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [closeTarget, setCloseTarget] = useState<ComplaintTicket | null>(null)

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    const params: SearchParams = { page, pageSize: 10 }
    if (keyword.trim()) params.keyword = keyword.trim()
    if (typeFilter !== 'all') params.type = typeFilter
    if (statusFilter !== 'all') params.status = statusFilter
    if (priorityFilter !== 'all') params.priority = priorityFilter
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo
    const result = await complaintApi.list(params)
    setData(result)
    setLoading(false)
  }, [keyword, typeFilter, statusFilter, priorityFilter, dateFrom, dateTo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleReset = () => {
    setKeyword('')
    setTypeFilter('all')
    setStatusFilter('all')
    setPriorityFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  const openCreate = () => {
    const sample = complaintTickets[0]
    setForm({
      ...emptyForm,
      orderNo: sample?.orderNo || '',
      customerName: '',
      phone: '',
      description: '',
      attachments: ['通话录音.zip'],
      assigneeId: users[0]?.id || '',
    })
    setFormOpen(true)
  }

  const openDetail = async (record: ComplaintTicket) => {
    const result = await complaintApi.getById(record.id)
    setDetail(result || null)
    setDetailOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.orderNo.trim() || !form.customerName.trim() || !form.phone.trim() || !form.description.trim()) return
    setFormLoading(true)
    const now = new Date().toISOString()
    const assignee = users.find((item) => item.id === form.assigneeId)
    await complaintApi.create({
      ticketNo: `WO${Date.now()}`,
      type: form.type,
      orderNo: form.orderNo,
      customerName: form.customerName,
      phone: form.phone,
      productName: complaintTickets[0]?.productName || '长江精选航线产品',
      voyageDate: complaintTickets[0]?.voyageDate || '2026-06-18',
      orderAmount: complaintTickets[0]?.orderAmount || 3980,
      description: form.description,
      attachments: form.attachments.filter(Boolean),
      priority: form.priority,
      assigneeId: form.assigneeId,
      assigneeName: assignee?.name || '待分配',
      status: 'pending',
      records: [
        {
          id: 'draft-record',
          opinion: '工单已创建，待客服跟进。',
          internalRemark: '系统自动生成',
          status: 'pending',
          operator: '当前用户',
          operatedAt: now,
        },
      ],
      updatedBy: '当前用户',
      updatedAt: now,
      createdAt: now,
    })
    setFormLoading(false)
    setFormOpen(false)
    fetchData(1)
  }

  const openAssign = (record: ComplaintTicket) => {
    setAssignTarget(record)
    setAssignAssigneeId(record.assigneeId || users[0]?.id || '')
    setAssignOpen(true)
  }

  const handleAssign = async () => {
    if (!assignTarget) return
    const assignee = users.find((item) => item.id === assignAssigneeId)
    await complaintApi.assign(assignTarget.id, assignAssigneeId, assignee?.name || '待分配')
    setAssignOpen(false)
    if (detail?.id === assignTarget.id) {
      const next = await complaintApi.getById(assignTarget.id)
      setDetail(next || null)
    }
    fetchData(data.page)
  }

  const openRecord = (record: ComplaintTicket) => {
    setRecordTarget(record)
    setRecordOpinion('')
    setRecordRemark('')
    setRecordStatus(record.status === 'pending' ? 'processing' : record.status)
    setRecordOpen(true)
  }

  const handleRecord = async () => {
    if (!recordTarget || !recordOpinion.trim()) return
    const nextRecord: Omit<ComplaintRecord, 'id'> = {
      opinion: recordOpinion.trim(),
      internalRemark: recordRemark.trim(),
      status: recordStatus,
      operator: '当前用户',
      operatedAt: new Date().toISOString(),
    }
    await complaintApi.appendRecord(recordTarget.id, nextRecord)
    setRecordOpen(false)
    if (detail?.id === recordTarget.id) {
      const next = await complaintApi.getById(recordTarget.id)
      setDetail(next || null)
    }
    fetchData(data.page)
  }

  const askClose = (record: ComplaintTicket) => {
    setCloseTarget(record)
    setConfirmOpen(true)
  }

  const handleClose = async () => {
    if (!closeTarget) return
    await complaintApi.close(closeTarget.id, '已与客户确认处理结果，工单闭环。')
    setConfirmOpen(false)
    if (detail?.id === closeTarget.id) {
      const next = await complaintApi.getById(closeTarget.id)
      setDetail(next || null)
    }
    fetchData(data.page)
  }

  return (
    <div>
      <PageHeader title="客诉工单" description="管理投诉、咨询、退款类工单的受理、指派、跟进与闭环。">
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
        >
          <Plus className="w-4 h-4" />
          新建工单
        </button>
      </PageHeader>

      <SearchPanel onSearch={() => fetchData(1)} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">关键词</label>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="工单号/订单号/客户姓名"
            className="w-56 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">工单类型</label>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="w-32 select-field"
          >
            <option value="all">全部</option>
            {Object.entries(typeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">处理状态</label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-32 select-field"
          >
            <option value="all">全部</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">优先级</label>
          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="w-28 select-field"
          >
            <option value="all">全部</option>
            {Object.entries(priorityLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">开始日期</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">结束日期</label>
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </SearchPanel>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">工单号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">类型</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">客户信息</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">关联订单</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">航次日期</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">优先级</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">处理人</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-72">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-sm text-gray-400">加载中...</td>
                </tr>
              ) : data.data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-sm text-gray-400">暂无数据</td>
                </tr>
              ) : (
                data.data.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{record.ticketNo}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{typeLabels[record.type]}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>{record.customerName}</div>
                      <div className="text-xs text-gray-400">{record.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>{record.orderNo}</div>
                      <div className="text-xs text-gray-400">{formatCurrency(record.orderAmount)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(record.voyageDate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{priorityLabels[record.priority]}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{record.assigneeName || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600"><StatusBadge status={record.status} /></td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-3 text-sm">
                        <button onClick={() => openDetail(record)} className="text-blue-600 hover:text-blue-700">详情</button>
                        <button onClick={() => openAssign(record)} className="text-gray-700 hover:text-gray-900">指派</button>
                        {record.status !== 'completed' && (
                          <button onClick={() => openRecord(record)} className="text-gray-700 hover:text-gray-900">跟进</button>
                        )}
                        {record.status !== 'completed' && (
                          <button onClick={() => askClose(record)} className="text-green-600 hover:text-green-700">关闭</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-500">共 {data.total} 条，当前第 {data.page} / {Math.max(1, Math.ceil(data.total / data.pageSize))} 页</div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchData(Math.max(1, data.page - 1))}
              disabled={data.page <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50"
            >
              上一页
            </button>
            <button
              onClick={() => fetchData(data.page + 1)}
              disabled={data.page >= Math.ceil(data.total / data.pageSize)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      <FormDialog
        open={formOpen}
        title="新建客诉工单"
        width="max-w-3xl"
        loading={formLoading}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-600">工单类型</label>
            <select
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value as ComplaintType })}
              className="w-full select-field"
            >
              {Object.entries(typeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-600">优先级</label>
            <select
              value={form.priority}
              onChange={(event) => setForm({ ...form, priority: event.target.value as ComplaintPriority })}
              className="w-full select-field"
            >
              {Object.entries(priorityLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-600">订单号</label>
            <input
              value={form.orderNo}
              onChange={(event) => setForm({ ...form, orderNo: event.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-600">处理人</label>
            <select
              value={form.assigneeId}
              onChange={(event) => setForm({ ...form, assigneeId: event.target.value })}
              className="w-full select-field"
            >
              {users.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-600">客户姓名</label>
            <input
              value={form.customerName}
              onChange={(event) => setForm({ ...form, customerName: event.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-600">联系电话</label>
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-sm text-gray-600">客诉描述</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={4}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-sm text-gray-600">附件名称（逗号分隔）</label>
            <input
              value={form.attachments.join(', ')}
              onChange={(event) => setForm({
                ...form,
                attachments: event.target.value.split(',').map((item) => item.trim()).filter(Boolean),
              })}
              placeholder="录音.zip, 退款申请单.pdf"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </FormDialog>

      <FormDialog
        open={assignOpen}
        title="指派处理人"
        loading={false}
        onCancel={() => setAssignOpen(false)}
        onSubmit={handleAssign}
        submitText="确认指派"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-gray-600">处理人</label>
          <select
            value={assignAssigneeId}
            onChange={(event) => setAssignAssigneeId(event.target.value)}
            className="w-full select-field"
          >
            {users.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>
      </FormDialog>

      <FormDialog
        open={recordOpen}
        title="追加处理记录"
        width="max-w-2xl"
        loading={false}
        onCancel={() => setRecordOpen(false)}
        onSubmit={handleRecord}
        submitText="保存记录"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-600">流转状态</label>
            <select
              value={recordStatus}
              onChange={(event) => setRecordStatus(event.target.value as ComplaintStatus)}
              className="w-full select-field"
            >
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-600">当前工单</label>
            <input
              value={recordTarget?.ticketNo || ''}
              readOnly
              className="px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-sm text-gray-600">处理意见</label>
            <textarea
              value={recordOpinion}
              onChange={(event) => setRecordOpinion(event.target.value)}
              rows={4}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-sm text-gray-600">内部备注</label>
            <textarea
              value={recordRemark}
              onChange={(event) => setRecordRemark(event.target.value)}
              rows={3}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
            />
          </div>
        </div>
      </FormDialog>

      <DetailDrawer open={detailOpen} title="工单详情" width="w-[720px]" onClose={() => setDetailOpen(false)}>
        {detail && (
          <>
            <DetailCard title="工单信息">
              <DetailRow label="工单号" value={detail.ticketNo} mono />
              <DetailRow label="工单类型" value={typeLabels[detail.type]} />
              <DetailRow label="处理状态" value={<StatusBadge status={detail.status} />} />
              <DetailRow label="优先级" value={priorityLabels[detail.priority]} />
              <DetailRow label="处理人" value={detail.assigneeName} />
              <DetailRow label="创建时间" value={formatDateTime(detail.createdAt)} />
            </DetailCard>

            <DetailCard title="客户与订单">
              <DetailRow label="客户姓名" value={detail.customerName} />
              <DetailRow label="联系电话" value={detail.phone} />
              <DetailRow label="订单号" value={detail.orderNo} mono />
              <DetailRow label="产品名称" value={detail.productName} />
              <DetailRow label="航次日期" value={formatDate(detail.voyageDate)} />
              <DetailRow label="订单金额" value={formatCurrency(detail.orderAmount)} />
            </DetailCard>

            <DetailCard title="问题描述">
              <div className="text-sm text-gray-700 leading-6">{detail.description}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {detail.attachments.map((item) => (
                  <span key={item} className="px-2.5 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">{item}</span>
                ))}
              </div>
            </DetailCard>

            <DetailCard title="处理记录">
              <div className="space-y-3">
                {detail.records.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-gray-900">{item.operator}</div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <StatusBadge status={item.status} />
                        <span>{formatDateTime(item.operatedAt)}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-700 leading-6">{item.opinion}</div>
                    {item.internalRemark && (
                      <div className="mt-2 text-xs text-gray-500">备注：{item.internalRemark}</div>
                    )}
                  </div>
                ))}
              </div>
            </DetailCard>
          </>
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={confirmOpen}
        title="关闭工单"
        message="确定将该工单关闭吗？关闭后会自动追加一条完成记录。"
        onConfirm={handleClose}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
