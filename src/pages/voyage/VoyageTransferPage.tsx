import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, LockKeyhole, Search } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import FormDialog from '@/components/common/FormDialog'
import PageHeader from '@/components/common/PageHeader'
import {
  TRANSFER_ACTION_OPTIONS,
  batchSetVoyageTransferDisposition,
  completeVoyageTransferCase,
  getVoyageTransferCase,
  getVoyageTransferCases,
  updateVoyageTransferOrder,
} from '@/mock/voyageTransferStore'
import type {
  VoyageTransferCase,
  VoyageTransferDisposition,
  VoyageTransferOrder,
} from '@/types'
import { formatCurrency } from '@/utils/format'

const caseStatusLabels: Record<VoyageTransferCase['status'], string> = {
  processing: '处置中',
  partially_completed: '待完成确认',
  completed: '已完成',
  cancelled: '已取消',
}

const caseStatusClasses: Record<VoyageTransferCase['status'], string> = {
  processing: 'bg-amber-100 text-amber-700',
  partially_completed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
}

const dispositionLabels: Record<VoyageTransferDisposition, string> = {
  external_transfer: '外部转船',
  reschedule: '改签',
  refund: '退款',
  manual: '人工处理',
}

const confirmationLabels: Record<VoyageTransferOrder['customerConfirmation'], string> = {
  pending_contact: '待联系',
  pending_reply: '待回复',
  agreed: '已同意转船',
  refused_reschedule: '拒绝转船，申请改签',
  refused_refund: '拒绝转船，申请退款',
  unreachable: '未联系上',
}

const handlingLabels: Record<VoyageTransferOrder['handlingStatus'], string> = {
  pending: '待处理',
  pending_confirmation: '待游客确认',
  processing: '处理中',
  completed: '已完成',
  manual: '人工处理',
}

function handlingClass(status: VoyageTransferOrder['handlingStatus']) {
  if (status === 'completed') return 'bg-green-100 text-green-700'
  if (status === 'manual') return 'bg-purple-100 text-purple-700'
  if (status === 'pending_confirmation') return 'bg-blue-100 text-blue-700'
  return 'bg-amber-100 text-amber-700'
}

export default function VoyageTransferPage() {
  const { caseId } = useParams<{ caseId?: string }>()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 })
  }, [caseId])
  return caseId ? <TransferWorkbench caseId={caseId} /> : <TransferCaseList />
}

function TransferCaseList() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const cases = getVoyageTransferCases()
  const filtered = cases.filter((item) => {
    const value = keyword.trim().toLowerCase()
    if (!value) return true
    return [item.caseNo, item.voyageNo, item.originalShipName, item.externalCompany]
      .some((field) => field.toLowerCase().includes(value))
  })

  return (
    <div>
      <PageHeader title="转船处置">
        <button onClick={() => navigate('/voyage/list')} className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
          从航次列表发起
        </button>
      </PageHeader>

      <div className="mb-4 flex items-end gap-3 border border-gray-200 bg-white p-4">
        <label className="block">
          <span className="mb-1.5 block text-xs text-gray-500">关键词</span>
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="处置单号 / 航次号 / 船舶 / 承接公司" className="h-10 w-80 rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500" />
        </label>
        <button className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-5 text-sm text-white hover:bg-blue-700"><Search className="h-4 w-4" />查询</button>
      </div>

      <div className="overflow-hidden border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-600">
            <tr>
              {['处置单号', '原航次', '原船舶', '外部承接公司', '外部承运船舶', '受影响订单', '处理进度', '状态', '发起时间', '操作'].map((title) => (
                <th key={title} className="px-4 py-3 text-left font-medium">{title}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((item) => {
              const processed = item.orders.filter((order) => order.handlingStatus === 'completed' || order.handlingStatus === 'manual').length
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-800">{item.caseNo}</td>
                  <td className="px-4 py-3 font-mono text-xs">{item.voyageNo}</td>
                  <td className="px-4 py-3">{item.originalShipName}</td>
                  <td className="px-4 py-3">{item.externalCompany}</td>
                  <td className="px-4 py-3">{item.externalShipName}</td>
                  <td className="px-4 py-3">{item.orders.length}笔</td>
                  <td className="px-4 py-3">{processed}/{item.orders.length}</td>
                  <td className="px-4 py-3"><span className={`rounded px-2 py-1 text-xs ${caseStatusClasses[item.status]}`}>{caseStatusLabels[item.status]}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{item.createdAt}</td>
                  <td className="px-4 py-3"><button onClick={() => navigate(`/voyage/transfers/${item.id}`)} className="text-blue-600 hover:text-blue-700">进入处置</button></td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-16 text-center text-sm text-gray-400">暂无转船处置单，请从航次列表发起。</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TransferWorkbench({ caseId }: { caseId: string }) {
  const navigate = useNavigate()
  const [record, setRecord] = useState(() => getVoyageTransferCase(caseId))
  const [activeTab, setActiveTab] = useState<'orders' | 'actions' | 'logs'>('orders')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchDisposition, setBatchDisposition] = useState<VoyageTransferDisposition>('external_transfer')
  const [keyword, setKeyword] = useState('')
  const [editing, setEditing] = useState<VoyageTransferOrder | null>(null)
  const [toast, setToast] = useState('')

  const refresh = () => setRecord(getVoyageTransferCase(caseId))
  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2500)
  }

  const filteredOrders = useMemo(() => {
    if (!record) return []
    const value = keyword.trim().toLowerCase()
    if (!value) return record.orders
    return record.orders.filter((order) => [order.orderNo, order.groupName, order.contactName, order.dealer]
      .some((field) => field.toLowerCase().includes(value)))
  }, [record, keyword])

  if (!record) {
    return (
      <div className="bg-white p-12 text-center text-sm text-gray-500">
        未找到该转船处置单。
        <button onClick={() => navigate('/voyage/list')} className="ml-2 text-blue-600">返回航次列表</button>
      </div>
    )
  }

  const processedOrders = record.orders.filter((order) => order.handlingStatus === 'completed' || order.handlingStatus === 'manual').length
  const totalPeople = record.orders.reduce((sum, order) => sum + order.totalPeople, 0)
  const totalAmount = record.orders.reduce((sum, order) => sum + order.orderAmount, 0)
  const canComplete = record.orders.length > 0 && processedOrders === record.orders.length

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredOrders.length && filteredOrders.length > 0) setSelectedIds(new Set())
    else setSelectedIds(new Set(filteredOrders.map((order) => order.id)))
  }

  const applyBatch = () => {
    if (selectedIds.size === 0) {
      showToast('请先勾选需要处理的订单')
      return
    }
    batchSetVoyageTransferDisposition(caseId, [...selectedIds], batchDisposition)
    setSelectedIds(new Set())
    refresh()
    showToast(`已批量设置为“${dispositionLabels[batchDisposition]}”`)
  }

  const finishCase = () => {
    if (!completeVoyageTransferCase(caseId)) {
      showToast('仍有订单没有明确处置结果，暂不能完成')
      return
    }
    refresh()
    showToast('转船处置已完成')
  }

  return (
    <div className="space-y-4">
      {toast && <div className="fixed left-1/2 top-6 z-[80] -translate-x-1/2 rounded-md bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg">{toast}</div>}

      <PageHeader title={`转船处置 · ${record.caseNo}`}>
        <button onClick={() => navigate('/voyage/list')} className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><ArrowLeft className="h-4 w-4" />返回航次列表</button>
        <button disabled={!canComplete || record.status === 'completed'} onClick={finishCase} className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40">完成处置</button>
      </PageHeader>

      <div className="flex items-center justify-between border border-red-200 bg-red-50 px-4 py-3">
        <div className="flex items-start gap-3">
          <LockKeyhole className="mt-0.5 h-5 w-5 text-red-600" />
          <div>
            <div className="text-sm font-medium text-red-800">整个航次已锁定 · 停航停售</div>
            <div className="mt-1 text-xs text-red-700">该航次订单只能在当前工作台处置，普通订单页面不得并发退款、改签或排房。</div>
          </div>
        </div>
        <span className={`rounded px-2 py-1 text-xs font-medium ${caseStatusClasses[record.status]}`}>{caseStatusLabels[record.status]}</span>
      </div>

      <div className="grid grid-cols-1 border border-gray-200 bg-white lg:grid-cols-2">
        <section className="border-b border-gray-200 p-4 lg:border-b-0 lg:border-r">
          <h3 className="text-sm font-semibold text-gray-900">原航次</h3>
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Info label="航次号" value={record.voyageNo} mono />
            <Info label="原船舶" value={record.originalShipName} />
            <Info label="开航日期" value={record.startDate} />
            <Info label="航线" value={record.routeName} />
          </div>
        </section>
        <section className="p-4">
          <h3 className="text-sm font-semibold text-gray-900">外部承运方案</h3>
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Info label="承接公司" value={record.externalCompany} />
            <Info label="承运船舶" value={record.externalShipName} />
            <Info label="开航日期" value={record.externalSailDate} />
            <Info label="确认运力" value={`${record.confirmedCapacity}人`} />
          </div>
        </section>
      </div>

      <div className="grid grid-cols-2 border border-gray-200 bg-white lg:grid-cols-4">
        <Metric label="受影响订单" value={`${record.orders.length}笔`} />
        <Metric label="受影响游客" value={`${totalPeople}人`} />
        <Metric label="订单金额" value={formatCurrency(totalAmount)} />
        <Metric label="处置进度" value={`${processedOrders}/${record.orders.length}`} strong />
      </div>

      <div className="border border-gray-200 bg-white">
        <nav className="flex border-b border-gray-200 px-4">
          {[
            { key: 'orders', label: `订单处置（${record.orders.length}）` },
            { key: 'actions', label: '联动结果' },
            { key: 'logs', label: '操作日志' },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)} className={`border-b-2 px-5 py-3 text-sm ${activeTab === tab.key ? 'border-blue-600 font-medium text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>{tab.label}</button>
          ))}
        </nav>

        {activeTab === 'orders' && (
          <div>
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-100 px-4 py-4">
              <div className="flex items-end gap-3">
                <label>
                  <span className="mb-1.5 block text-xs text-gray-500">搜索订单</span>
                  <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="订单号 / 团名 / 联系人" className="h-9 w-64 rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500" />
                </label>
                <label>
                  <span className="mb-1.5 block text-xs text-gray-500">批量处置方式</span>
                  <select value={batchDisposition} onChange={(event) => setBatchDisposition(event.target.value as VoyageTransferDisposition)} className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm">
                    {Object.entries(dispositionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <button onClick={applyBatch} className="h-9 rounded-md border border-gray-300 bg-white px-4 text-sm text-gray-700 hover:bg-gray-50">应用到已选（{selectedIds.size}）</button>
              </div>
              <div className="text-xs text-gray-500">默认采用“外部转船”，运营人员再逐单确认或改为改签、退款。</div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1380px] w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-600">
                  <tr>
                    <th className="w-12 px-3 py-3 text-center"><input type="checkbox" checked={selectedIds.size === filteredOrders.length && filteredOrders.length > 0} onChange={toggleSelectAll} className="h-4 w-4 rounded border-gray-300" /></th>
                    {['订单号', '团名/分销商', '联系人', '渠道', '人数', '原房型', '订单金额', '处置方式', '游客确认', '处理状态', '操作'].map((title) => <th key={title} className="px-3 py-3 text-left font-medium">{title}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-center"><input type="checkbox" checked={selectedIds.has(order.id)} onChange={() => setSelectedIds((current) => { const next = new Set(current); if (next.has(order.id)) next.delete(order.id); else next.add(order.id); return next })} className="h-4 w-4 rounded border-gray-300" /></td>
                      <td className="px-3 py-3 font-mono text-xs text-blue-700">{order.orderNo}</td>
                      <td className="px-3 py-3"><div className="max-w-48 truncate text-gray-800" title={order.groupName}>{order.groupName}</div><div className="mt-0.5 text-xs text-gray-400">{order.dealer}</div></td>
                      <td className="px-3 py-3"><div>{order.contactName}</div><div className="mt-0.5 text-xs text-gray-400">{order.contactPhone}</div></td>
                      <td className="px-3 py-3">{order.channel}</td>
                      <td className="px-3 py-3">{order.totalPeople}</td>
                      <td className="px-3 py-3">{order.roomType}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(order.orderAmount)}</td>
                      <td className="px-3 py-3">{dispositionLabels[order.disposition]}</td>
                      <td className="px-3 py-3 text-xs text-gray-600">{confirmationLabels[order.customerConfirmation]}</td>
                      <td className="px-3 py-3"><span className={`rounded px-2 py-1 text-xs ${handlingClass(order.handlingStatus)}`}>{handlingLabels[order.handlingStatus]}</span></td>
                      <td className="px-3 py-3"><button onClick={() => setEditing({ ...order })} className="text-blue-600 hover:text-blue-700">处理</button></td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && <tr><td colSpan={12} className="px-4 py-12 text-center text-gray-400">暂无匹配订单</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="p-4">
            <div className="mb-3 text-sm text-gray-600">发起时选择的联动动作及执行结果；未勾选项需由运营人员线下处理。</div>
            <div className="overflow-hidden border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="w-36 px-4 py-3 text-left">业务对象</th><th className="px-4 py-3 text-left">联动动作</th><th className="w-32 px-4 py-3 text-left">执行结果</th><th className="w-48 px-4 py-3 text-left">执行时间</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {record.actionResults.map((result) => {
                    const option = TRANSFER_ACTION_OPTIONS.find((item) => item.key === result.key)
                    return (
                      <tr key={result.key}>
                        <td className="px-4 py-3 font-medium text-gray-800">{option?.object}</td>
                        <td className="px-4 py-3 text-gray-700">{option?.action}</td>
                        <td className="px-4 py-3">{result.selected ? <span className="inline-flex items-center gap-1 text-green-700"><CheckCircle2 className="h-4 w-4" />已执行</span> : <span className="text-amber-700">人工处理</span>}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{result.operatedAt || '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="divide-y divide-gray-100">
            {record.logs.map((log, index) => (
              <div key={`${log.time}-${index}`} className="grid grid-cols-[180px_120px_180px_1fr] px-5 py-4 text-sm">
                <span className="text-xs text-gray-500">{log.time}</span>
                <span className="text-gray-700">{log.operator}</span>
                <span className="font-medium text-gray-800">{log.action}</span>
                <span className="text-gray-600">{log.detail}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <OrderDispositionDialog
        key={editing?.id || 'closed'}
        order={editing}
        onCancel={() => setEditing(null)}
        onSave={(next) => {
          updateVoyageTransferOrder(caseId, next.id, next)
          setEditing(null)
          refresh()
          showToast(`订单 ${next.orderNo} 已更新`)
        }}
      />
    </div>
  )
}

function OrderDispositionDialog({ order, onCancel, onSave }: { order: VoyageTransferOrder | null; onCancel: () => void; onSave: (order: VoyageTransferOrder) => void }) {
  const [draft, setDraft] = useState<VoyageTransferOrder | null>(order)
  if (!draft) return null

  return (
    <FormDialog open={!!order} title={`处理订单 · ${draft.orderNo}`} width="max-w-2xl" onCancel={onCancel} onSubmit={() => onSave(draft)} submitText="确认处理">
      <div className="space-y-5">
        <div className="grid grid-cols-3 border border-gray-200 bg-gray-50 text-sm">
          <InfoBlock label="游客" value={`${draft.contactName} · ${draft.totalPeople}人`} />
          <InfoBlock label="原房型" value={draft.roomType} />
          <InfoBlock label="订单金额" value={formatCurrency(draft.orderAmount)} />
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-800">处置方式</span>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(dispositionLabels).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setDraft({ ...draft, disposition: value as VoyageTransferDisposition })} className={`border px-3 py-2 text-sm ${draft.disposition === value ? 'border-blue-600 bg-blue-50 font-medium text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>{label}</button>
            ))}
          </div>
        </label>

        {draft.disposition === 'external_transfer' && (
          <div className="grid grid-cols-2 gap-4">
            <FieldLabel label="游客确认结果" required>
              <select value={draft.customerConfirmation} onChange={(event) => setDraft({ ...draft, customerConfirmation: event.target.value as VoyageTransferOrder['customerConfirmation'] })} className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm">
                {Object.entries(confirmationLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </FieldLabel>
            <FieldLabel label="外部承运房型">
              <input value={draft.externalRoomType} onChange={(event) => setDraft({ ...draft, externalRoomType: event.target.value })} placeholder="例：豪华阳台标准间" className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm" />
            </FieldLabel>
          </div>
        )}

        {draft.disposition === 'reschedule' && (
          <FieldLabel label="改签目标航次" required>
            <input value={draft.targetVoyageNo} onChange={(event) => setDraft({ ...draft, targetVoyageNo: event.target.value })} placeholder="请输入目标航次号" className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm" />
          </FieldLabel>
        )}

        {draft.disposition === 'refund' && (
          <FieldLabel label="退款金额" required>
            <input type="number" min={0} value={draft.refundAmount} onChange={(event) => setDraft({ ...draft, refundAmount: Number(event.target.value) })} className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm" />
          </FieldLabel>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FieldLabel label="负责人">
            <input value={draft.assignee} onChange={(event) => setDraft({ ...draft, assignee: event.target.value })} className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm" />
          </FieldLabel>
          <FieldLabel label="处理备注">
            <input value={draft.remark} onChange={(event) => setDraft({ ...draft, remark: event.target.value })} placeholder="记录联系结果或异常情况" className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm" />
          </FieldLabel>
        </div>
      </div>
    </FormDialog>
  )
}

function Metric({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="border-b border-r border-gray-200 px-5 py-4 last:border-r-0 lg:border-b-0"><div className="text-xs text-gray-500">{label}</div><div className={`mt-1 text-xl ${strong ? 'font-semibold text-blue-700' : 'font-medium text-gray-900'}`}>{value}</div></div>
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return <div><div className="text-xs text-gray-500">{label}</div><div className={`mt-1 text-gray-800 ${mono ? 'font-mono text-xs' : ''}`}>{value}</div></div>
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return <div className="border-r border-gray-200 px-3 py-3 last:border-r-0"><div className="text-xs text-gray-500">{label}</div><div className="mt-1 font-medium text-gray-800">{value}</div></div>
}

function FieldLabel({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs text-gray-600">{label}{required && <span className="ml-0.5 text-red-500">*</span>}</span>{children}</label>
}
