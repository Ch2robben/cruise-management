import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import FormDialog from '@/components/common/FormDialog'
import { getOrders } from '@/mock/orderStore'
import { TRANSFER_ACTION_OPTIONS, type CreateVoyageTransferInput } from '@/mock/voyageTransferStore'
import type { Voyage, VoyageTransferActionKey } from '@/types'
import { formatCurrency } from '@/utils/format'

interface Props {
  open: boolean
  voyage: Voyage | null
  loading?: boolean
  onCancel: () => void
  onSubmit: (input: CreateVoyageTransferInput) => void
}

const inputClass = 'h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100'

export default function VoyageTransferLaunchDialog({ open, voyage, loading, onCancel, onSubmit }: Props) {
  const affectedOrders = useMemo(
    () => getOrders().filter((order) => order.orderStatus !== '取消' && order.orderStatus !== '已完成'),
    [open],
  )
  const affectedPeople = affectedOrders.reduce((sum, order) => sum + order.totalPeople, 0)
  const affectedAmount = affectedOrders.reduce((sum, order) => sum + order.totalAmount, 0)

  const [form, setForm] = useState({
    reason: '船舶承担接待任务',
    externalCompany: '',
    externalShipName: '',
    externalSailDate: '',
    departurePort: '重庆朝天门码头',
    arrivalPort: '宜昌秭归港',
    externalContact: '',
    externalPhone: '',
    confirmedCapacity: 0,
    agreementNo: '',
    owner: '当前用户',
    remark: '',
  })
  const [selectedActions, setSelectedActions] = useState<Set<VoyageTransferActionKey>>(
    () => new Set(TRANSFER_ACTION_OPTIONS.map((item) => item.key)),
  )
  const [offlineConfirmed, setOfflineConfirmed] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !voyage) return
    setForm({
      reason: '船舶承担接待任务',
      externalCompany: '',
      externalShipName: '',
      externalSailDate: voyage.startDate,
      departurePort: voyage.direction === 'downstream' ? '重庆朝天门码头' : '宜昌秭归港',
      arrivalPort: voyage.direction === 'downstream' ? '宜昌秭归港' : '重庆朝天门码头',
      externalContact: '',
      externalPhone: '',
      confirmedCapacity: affectedPeople,
      agreementNo: '',
      owner: '当前用户',
      remark: '',
    })
    setSelectedActions(new Set(TRANSFER_ACTION_OPTIONS.map((item) => item.key)))
    setOfflineConfirmed(false)
    setError('')
  }, [open, voyage, affectedPeople])

  if (!voyage) return null

  const unselectedCount = TRANSFER_ACTION_OPTIONS.length - selectedActions.size
  const toggleAction = (key: VoyageTransferActionKey) => {
    setSelectedActions((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const submit = () => {
    if (!form.externalCompany.trim() || !form.externalShipName.trim() || !form.externalContact.trim() || !form.externalPhone.trim()) {
      setError('请完整填写外部承接公司、承运船舶和联系人信息。')
      return
    }
    if (!form.agreementNo.trim()) {
      setError('请填写线下协议或确认单编号。')
      return
    }
    if (form.confirmedCapacity < affectedPeople) {
      setError(`外部确认运力不能少于受影响的 ${affectedPeople} 名游客。`)
      return
    }
    if (!offlineConfirmed) {
      setError('请确认外部承接方案已在线下谈妥。')
      return
    }
    if (selectedActions.size === 0) {
      setError('至少选择一项发起后的联动动作。')
      return
    }
    setError('')
    onSubmit({ voyage, ...form, selectedActions: [...selectedActions] })
  }

  return (
    <FormDialog
      open={open}
      title={`发起外部转船 · ${voyage.voyageNo}`}
      width="max-w-5xl"
      loading={loading}
      onCancel={onCancel}
      onSubmit={submit}
      submitText="确认发起并锁定航次"
    >
      <div className="space-y-6">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">受影响航次</h4>
              <p className="mt-1 text-xs text-gray-500">发起后将锁定整个航次，再在处置工作台逐单处理。</p>
            </div>
            <span className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700">整航次锁定</span>
          </div>
          <div className="grid grid-cols-2 border border-gray-200 bg-gray-50 text-sm lg:grid-cols-6">
            {[
              ['原航次', voyage.voyageNo],
              ['原船舶', voyage.shipName],
              ['开航日期', voyage.startDate],
              ['受影响订单', `${affectedOrders.length}笔`],
              ['受影响游客', `${affectedPeople}人`],
              ['订单金额', formatCurrency(affectedAmount)],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-r border-gray-200 px-3 py-3 last:border-r-0 lg:border-b-0">
                <div className="text-xs text-gray-500">{label}</div>
                <div className="mt-1 truncate font-medium text-gray-900" title={value}>{value}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-sm font-semibold text-gray-900">线下承接结果</h4>
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="转船原因" required>
              <input className={inputClass} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
            </Field>
            <Field label="外部承接公司" required>
              <input className={inputClass} value={form.externalCompany} onChange={(event) => setForm({ ...form, externalCompany: event.target.value })} placeholder="请输入企业全称" />
            </Field>
            <Field label="外部承运船舶" required>
              <input className={inputClass} value={form.externalShipName} onChange={(event) => setForm({ ...form, externalShipName: event.target.value })} placeholder="请输入船舶名称" />
            </Field>
            <Field label="外部开航日期" required>
              <input type="date" className={inputClass} value={form.externalSailDate} onChange={(event) => setForm({ ...form, externalSailDate: event.target.value })} />
            </Field>
            <Field label="上船港口" required>
              <input className={inputClass} value={form.departurePort} onChange={(event) => setForm({ ...form, departurePort: event.target.value })} />
            </Field>
            <Field label="下船港口" required>
              <input className={inputClass} value={form.arrivalPort} onChange={(event) => setForm({ ...form, arrivalPort: event.target.value })} />
            </Field>
            <Field label="承接方联系人" required>
              <input className={inputClass} value={form.externalContact} onChange={(event) => setForm({ ...form, externalContact: event.target.value })} />
            </Field>
            <Field label="联系电话" required>
              <input className={inputClass} value={form.externalPhone} onChange={(event) => setForm({ ...form, externalPhone: event.target.value })} />
            </Field>
            <Field label="已确认承接人数" required>
              <input type="number" min={0} className={inputClass} value={form.confirmedCapacity} onChange={(event) => setForm({ ...form, confirmedCapacity: Number(event.target.value) })} />
            </Field>
            <Field label="线下协议/确认单号" required>
              <input className={inputClass} value={form.agreementNo} onChange={(event) => setForm({ ...form, agreementNo: event.target.value })} placeholder="例：WT-2026-001" />
            </Field>
            <Field label="内部负责人" required>
              <input className={inputClass} value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })} />
            </Field>
            <Field label="备注">
              <input className={inputClass} value={form.remark} onChange={(event) => setForm({ ...form, remark: event.target.value })} placeholder="可填写线下约定的补充说明" />
            </Field>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">发起后的联动动作</h4>
              <p className="mt-1 text-xs text-gray-500">系统默认全部勾选；可按实际线下处置情况取消，未勾选项需人工处理。</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedActions(new Set(TRANSFER_ACTION_OPTIONS.map((item) => item.key)))}
              className="shrink-0 text-xs text-blue-600 hover:text-blue-700"
            >
              恢复默认勾选
            </button>
          </div>
          <div className="overflow-hidden border border-gray-200">
            <table className="w-full table-fixed text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="w-14 px-3 py-2 text-center">选择</th>
                  <th className="w-32 px-3 py-2 text-left">业务对象</th>
                  <th className="px-3 py-2 text-left">发起转船后的动作</th>
                  <th className="w-[310px] px-3 py-2 text-left">取消后的风险</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {TRANSFER_ACTION_OPTIONS.map((item) => {
                  const checked = selectedActions.has(item.key)
                  return (
                    <tr key={item.key} className={checked ? 'bg-white' : 'bg-amber-50/60'}>
                      <td className="px-3 py-2.5 text-center">
                        <input type="checkbox" checked={checked} onChange={() => toggleAction(item.key)} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-800">{item.object}</td>
                      <td className="px-3 py-2.5 text-gray-700">{item.action}</td>
                      <td className={`px-3 py-2.5 text-xs ${checked ? 'text-gray-400' : 'text-amber-700'}`}>
                        {checked ? '系统自动执行' : item.risk}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {unselectedCount > 0 ? (
            <div className="mt-3 flex items-start gap-2 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              已取消 {unselectedCount} 项自动联动，发起后请按风险提示完成人工处理。
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 bg-green-50 px-3 py-2.5 text-xs text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              已采用推荐配置，发起后自动执行全部联动动作。
            </div>
          )}
        </section>

        <label className="flex cursor-pointer items-start gap-2 border-t border-gray-200 pt-4 text-sm text-gray-700">
          <input type="checkbox" checked={offlineConfirmed} onChange={(event) => setOfflineConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600" />
          <span>我确认外部承接公司、承运船舶、运力及线下协议均已谈妥，可以锁定整个航次并开始逐单处置。</span>
        </label>

        {error && <div className="bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}
      </div>
    </FormDialog>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-gray-600">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
    </label>
  )
}
