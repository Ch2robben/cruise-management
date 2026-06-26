import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import FormDialog from '@/components/common/FormDialog'
import {
  ADDABLE_FEE_PRESETS,
  buildOrderFeeItems,
  calcFeeItemsTotal,
  type CruiseOrder,
  type OrderFeeItem,
} from '@/components/order/orderTypes'
import { formatCurrency, generateId } from '@/utils/format'

export interface OrderPriceChangeForm {
  unitPrice: number
  feeItems: OrderFeeItem[]
  totalAmount: number
  reason: string
}

interface OrderPriceChangeDialogProps {
  open: boolean
  order: CruiseOrder | null
  loading?: boolean
  onCancel: () => void
  onSubmit: (form: OrderPriceChangeForm) => void
}

function toForm(order: CruiseOrder): OrderPriceChangeForm {
  const feeItems = buildOrderFeeItems(order)
  return {
    unitPrice: order.unitPrice,
    feeItems,
    totalAmount: calcFeeItemsTotal(feeItems),
    reason: '',
  }
}

export default function OrderPriceChangeDialog({
  open,
  order,
  loading,
  onCancel,
  onSubmit,
}: OrderPriceChangeDialogProps) {
  const [form, setForm] = useState<OrderPriceChangeForm>(() => (order ? toForm(order) : {
    unitPrice: 0,
    feeItems: [],
    totalAmount: 0,
    reason: '',
  }))
  const [newFeeName, setNewFeeName] = useState<string>(ADDABLE_FEE_PRESETS[0])
  const [customFeeName, setCustomFeeName] = useState('')

  useEffect(() => {
    if (open && order) {
      setForm(toForm(order))
      setNewFeeName(ADDABLE_FEE_PRESETS[0])
    }
  }, [open, order])

  const previewTotal = useMemo(() => calcFeeItemsTotal(form.feeItems), [form.feeItems])
  const previewArrears = order ? Math.max(previewTotal - order.paidAmount, 0) : 0
  const amountDiff = order ? previewTotal - order.totalAmount : 0

  const usedNames = useMemo(() => new Set(form.feeItems.map((item) => item.name)), [form.feeItems])
  const availablePresets = ADDABLE_FEE_PRESETS.filter((name) => !usedNames.has(name))

  const updateFeeItem = (id: string, patch: Partial<OrderFeeItem>) => {
    setForm((prev) => ({
      ...prev,
      feeItems: prev.feeItems.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      totalAmount: calcFeeItemsTotal(
        prev.feeItems.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      ),
    }))
  }

  const removeFeeItem = (id: string) => {
    setForm((prev) => {
      const feeItems = prev.feeItems.filter((item) => item.id !== id)
      return { ...prev, feeItems, totalAmount: calcFeeItemsTotal(feeItems) }
    })
  }

  const handleSubmit = () => {
    if (!form.reason.trim()) {
      window.alert('请填写改价原因')
      return
    }
    if (previewTotal <= 0) {
      window.alert('订单总额必须大于 0')
      return
    }
    onSubmit({ ...form, totalAmount: previewTotal })
  }

  if (!order) return null

  return (
    <FormDialog
      open={open}
      title={`改价 · ${order.orderNo}`}
      width="max-w-3xl"
      loading={loading}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitText="确认改价"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          可调整各收费项目金额，也可新增升舱费、服务费等自定义项目。保存后自动重算订单总额与欠款。
        </div>

        <div className="grid gap-3 rounded-lg bg-gray-50 px-4 py-3 text-sm sm:grid-cols-3">
          <div>
            <div className="text-gray-500">原订单总额</div>
            <div className="font-medium text-gray-900">{formatCurrency(order.totalAmount)}</div>
          </div>
          <div>
            <div className="text-gray-500">改后总额</div>
            <div className="font-medium text-blue-600">{formatCurrency(previewTotal)}</div>
          </div>
          <div>
            <div className="text-gray-500">差额</div>
            <div className={`font-medium ${amountDiff > 0 ? 'text-red-600' : amountDiff < 0 ? 'text-green-600' : 'text-gray-900'}`}>
              {amountDiff > 0 ? '+' : ''}{formatCurrency(amountDiff)}
            </div>
          </div>
        </div>

        <label className="block max-w-xs text-sm">
          <span className="mb-1 block text-gray-700">参考单价（船票）</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={form.unitPrice}
            onChange={(event) => setForm({ ...form, unitPrice: Number(event.target.value) || 0 })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm tabular-nums"
          />
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">收费项目</h4>
            <span className="text-xs text-gray-500">共 {form.feeItems.length} 项</span>
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-xs text-gray-500">
                  <th className="px-3 py-2.5 text-left font-medium">收费项目</th>
                  <th className="w-24 px-3 py-2.5 text-right font-medium">单价</th>
                  <th className="w-28 px-3 py-2.5 text-right font-medium">金额</th>
                  <th className="w-14 px-3 py-2.5 text-center font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {form.feeItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2.5">
                      {item.locked ? (
                        <span className="font-medium text-gray-900">{item.name}</span>
                      ) : (
                        <input
                          value={item.name}
                          onChange={(event) => updateFeeItem(item.id, { name: event.target.value })}
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                        />
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unitPrice}
                        onChange={(event) => updateFeeItem(item.id, { unitPrice: Number(event.target.value) || 0 })}
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-right text-sm tabular-nums"
                      />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.amount}
                        onChange={(event) => updateFeeItem(item.id, { amount: Number(event.target.value) || 0 })}
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-right text-sm font-medium tabular-nums"
                      />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {item.locked ? (
                        <span className="text-xs text-gray-300">—</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => removeFeeItem(item.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded text-red-500 hover:bg-red-50"
                          title="删除"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-gray-50">
                  <td colSpan={2} className="px-3 py-2.5 text-right text-sm font-medium text-gray-700">合计</td>
                  <td className="px-3 py-2.5 text-right text-sm font-semibold tabular-nums text-blue-600">
                    {formatCurrency(previewTotal)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={newFeeName}
              onChange={(event) => setNewFeeName(event.target.value)}
              className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm"
            >
              {availablePresets.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
              <option value="__custom__">自定义名称</option>
            </select>
            {newFeeName === '__custom__' && (
              <input
                value={customFeeName}
                onChange={(event) => setCustomFeeName(event.target.value)}
                placeholder="输入收费项目名称"
                className="h-9 min-w-[160px] rounded-lg border border-gray-300 px-3 text-sm"
              />
            )}
            <button
              type="button"
              onClick={() => {
                const name = newFeeName === '__custom__' ? customFeeName.trim() : newFeeName
                if (!name) {
                  window.alert('请输入收费项目名称')
                  return
                }
                if (usedNames.has(name)) {
                  window.alert('已存在同名收费项目')
                  return
                }
                const nextItem: OrderFeeItem = {
                  id: generateId(),
                  name,
                  coefficient: '-',
                  unitPrice: 0,
                  amount: 0,
                }
                setForm((prev) => {
                  const feeItems = [...prev.feeItems, nextItem]
                  return { ...prev, feeItems, totalAmount: calcFeeItemsTotal(feeItems) }
                })
                if (newFeeName === '__custom__') setCustomFeeName('')
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 text-sm font-medium text-blue-700 hover:bg-blue-100"
            >
              <Plus className="h-4 w-4" />
              添加收费项目
            </button>
          </div>
        </div>

        <div className="grid gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm sm:grid-cols-2">
          <div>
            <div className="text-gray-500">实收总额（不变）</div>
            <div className="font-medium">{formatCurrency(order.paidAmount)}</div>
          </div>
          <div>
            <div className="text-gray-500">改后欠款</div>
            <div className="font-medium text-blue-600">{formatCurrency(previewArrears)}</div>
          </div>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-gray-700">改价原因 <span className="text-red-500">*</span></span>
          <textarea
            rows={3}
            value={form.reason}
            onChange={(event) => setForm({ ...form, reason: event.target.value })}
            placeholder="如：政策调整、协商优惠、新增升舱费等"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </div>
    </FormDialog>
  )
}
