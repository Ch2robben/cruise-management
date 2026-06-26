import { useEffect, useState } from 'react'
import FormDialog from '@/components/common/FormDialog'
import type { CruiseOrder } from '@/components/order/orderTypes'

export interface OrderEditForm {
  groupName: string
  contactName: string
  contactPhone: string
  fixedPhone: string
  fax: string
  email: string
  thirdPartyOrderNo: string
  relatedOrderNo: string
  invoiceRequired: string
  salesPerson: string
  remark: string
}

interface OrderEditDialogProps {
  open: boolean
  order: CruiseOrder | null
  loading?: boolean
  onCancel: () => void
  onSubmit: (form: OrderEditForm) => void
}

export function orderToEditForm(order: CruiseOrder): OrderEditForm {
  return {
    groupName: order.groupName,
    contactName: order.contactName,
    contactPhone: order.contactPhone,
    fixedPhone: order.fixedPhone || '',
    fax: order.fax || '',
    email: order.email || '',
    thirdPartyOrderNo: order.thirdPartyOrderNo || '',
    relatedOrderNo: order.relatedOrderNo || '',
    invoiceRequired: order.invoiceRequired || '否',
    salesPerson: order.salesPerson || '',
    remark: order.remark || '',
  }
}

export default function OrderEditDialog({
  open,
  order,
  loading,
  onCancel,
  onSubmit,
}: OrderEditDialogProps) {
  const [form, setForm] = useState<OrderEditForm>(() => (order ? orderToEditForm(order) : {
    groupName: '',
    contactName: '',
    contactPhone: '',
    fixedPhone: '',
    fax: '',
    email: '',
    thirdPartyOrderNo: '',
    relatedOrderNo: '',
    invoiceRequired: '否',
    salesPerson: '',
    remark: '',
  }))

  useEffect(() => {
    if (open && order) setForm(orderToEditForm(order))
  }, [open, order])

  const handleSubmit = () => {
    if (!form.contactName.trim()) {
      window.alert('请填写联系人')
      return
    }
    if (!form.contactPhone.trim()) {
      window.alert('请填写手机号')
      return
    }
    onSubmit(form)
  }

  if (!order) return null

  return (
    <FormDialog
      open={open}
      title={`编辑订单 · ${order.orderNo}`}
      width="max-w-2xl"
      loading={loading}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitText="保存"
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="团名" value={form.groupName} onChange={(groupName) => setForm({ ...form, groupName })} />
          <Field label="分管业务员" value={form.salesPerson} onChange={(salesPerson) => setForm({ ...form, salesPerson })} />
          <Field label="联系人" value={form.contactName} onChange={(contactName) => setForm({ ...form, contactName })} required />
          <Field label="手机号" value={form.contactPhone} onChange={(contactPhone) => setForm({ ...form, contactPhone })} required />
          <Field label="固定电话" value={form.fixedPhone} onChange={(fixedPhone) => setForm({ ...form, fixedPhone })} />
          <Field label="传真" value={form.fax} onChange={(fax) => setForm({ ...form, fax })} />
          <Field label="Email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
          <label className="block text-sm">
            <span className="mb-1 block text-gray-700">是否开票</span>
            <select
              value={form.invoiceRequired}
              onChange={(event) => setForm({ ...form, invoiceRequired: event.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="是">是</option>
              <option value="否">否</option>
            </select>
          </label>
          <Field label="第三方订单号" value={form.thirdPartyOrderNo} onChange={(thirdPartyOrderNo) => setForm({ ...form, thirdPartyOrderNo })} mono />
          <Field label="关联单号" value={form.relatedOrderNo} onChange={(relatedOrderNo) => setForm({ ...form, relatedOrderNo })} mono />
        </div>
        <label className="block text-sm">
          <span className="mb-1 block text-gray-700">订单备注</span>
          <textarea
            rows={3}
            value={form.remark}
            onChange={(event) => setForm({ ...form, remark: event.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </div>
    </FormDialog>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  mono,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  mono?: boolean
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${mono ? 'font-mono' : ''}`}
      />
    </label>
  )
}
