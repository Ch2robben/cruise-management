import { useMemo, useState } from 'react'
import type { DealerBookingDraft } from '@/components/dealer/booking/bookingTypes'
import { formatCurrency } from '@/utils/format'

interface SpecialPriceForm {
  applyScope: 'order' | 'room' | 'guest'
  requestedAmount: number
  currentAmount: number
  discountAmount: number
  reason: string
  remark: string
  contactName: string
  contactPhone: string
  status: 'draft' | 'pending'
}

const scopeOptions: Array<{ value: SpecialPriceForm['applyScope']; label: string; desc: string }> = [
  { value: 'order', label: '整单特价', desc: '按整张申请单整体申请特价' },
  { value: 'room', label: '房型特价', desc: '按房型汇总后申请特价' },
  { value: 'guest', label: '游客特价', desc: '按游客价格清单申请特价' },
]

function cartLinePax(roomType: string, count: number) {
  return roomType === '标准间' ? count * 2 : count
}

export default function Step4SpecialPriceConfirm({
  data,
  onNext,
  onPrev,
}: {
  data?: DealerBookingDraft
  onNext: (data: DealerBookingDraft['specialPriceApplication']) => void
  onPrev: () => void
}) {
  const cart = data?.cart ?? []
  const touristList = (data?.touristData?.touristList ?? []) as Array<{ name?: string; roomType?: string; segmentLabel?: string }>

  const currentAmount = useMemo(
    () => cart.reduce((sum, line) => sum + line.price * line.count, 0),
    [cart],
  )
  const totalPax = useMemo(
    () => cart.reduce((sum, line) => sum + cartLinePax(line.roomType, line.count), 0),
    [cart],
  )

  const [form, setForm] = useState<SpecialPriceForm>(() => {
    const requestedAmount = data?.specialPriceApplication?.requestedAmount ?? currentAmount
    return {
      applyScope: data?.specialPriceApplication?.applyScope ?? 'order',
      requestedAmount,
      currentAmount,
      discountAmount: Math.max(currentAmount - requestedAmount, 0),
      reason: data?.specialPriceApplication?.reason ?? '',
      remark: data?.specialPriceApplication?.remark ?? '',
      contactName: data?.specialPriceApplication?.contactName ?? '当前经办人',
      contactPhone: data?.specialPriceApplication?.contactPhone ?? '',
      status: 'draft',
    }
  })

  const updateRequestedAmount = (value: number) => {
    const requestedAmount = Math.max(0, Number(value) || 0)
    setForm((prev) => ({
      ...prev,
      requestedAmount,
      discountAmount: Math.max(prev.currentAmount - requestedAmount, 0),
    }))
  }

  const canSubmit = form.requestedAmount > 0 && form.reason.trim() && form.contactName.trim() && form.contactPhone.trim()

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">特价确认</h2>
          <p className="mt-1 text-sm text-gray-500">请确认本次申请范围、目标价与申请原因，提交后进入审批流程。</p>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-gray-200 bg-gray-50">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">申请摘要</h3>
            </div>
            <div className="space-y-3 px-4 py-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">申请航段</span>
                <span className="text-right text-gray-900">{[...new Set(cart.map((line) => line.segmentLabel))].join('、') || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">申请房间</span>
                <span className="text-gray-900">{cart.reduce((sum, line) => sum + line.count, 0)} 间</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">申请人数</span>
                <span className="text-gray-900">{totalPax} 人</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">游客名单</span>
                <span className="text-gray-900">{touristList.length > 0 ? `${touristList.length} 位` : '未录入'}</span>
              </div>
              <div className="rounded-lg border border-orange-100 bg-white px-4 py-4">
                <div className="text-xs text-gray-500">当前规则价</div>
                <div className="mt-1 text-xl font-semibold tabular-nums text-gray-900">{formatCurrency(currentAmount)}</div>
                <div className="mt-3 text-xs text-gray-500">申请特价</div>
                <div className="mt-1 text-xl font-semibold tabular-nums text-red-500">{formatCurrency(form.requestedAmount)}</div>
                <div className="mt-3 text-xs text-gray-500">优惠差额</div>
                <div className="mt-1 text-base font-semibold tabular-nums text-green-600">-{formatCurrency(form.discountAmount)}</div>
              </div>
            </div>
          </aside>

          <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">申请信息</h3>
            </div>
            <div className="space-y-5 px-4 py-4">
              <div>
                <div className="mb-2 text-sm text-gray-700">申请范围</div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {scopeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, applyScope: option.value }))}
                      className={`rounded-lg border px-4 py-3 text-left transition ${
                        form.applyScope === option.value
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-blue-200'
                      }`}
                    >
                      <div className={`text-sm font-medium ${form.applyScope === option.value ? 'text-blue-700' : 'text-gray-900'}`}>{option.label}</div>
                      <div className="mt-1 text-xs text-gray-500">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block text-gray-700">当前规则价</span>
                  <input value={formatCurrency(form.currentAmount)} disabled className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-gray-700">申请特价 <span className="text-red-500">*</span></span>
                  <input
                    type="number"
                    min={0}
                    value={form.requestedAmount}
                    onChange={(e) => updateRequestedAmount(Number(e.target.value))}
                    className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-gray-700">联系人 <span className="text-red-500">*</span></span>
                  <input
                    value={form.contactName}
                    onChange={(e) => setForm((prev) => ({ ...prev, contactName: e.target.value }))}
                    className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-gray-700">联系电话 <span className="text-red-500">*</span></span>
                  <input
                    value={form.contactPhone}
                    onChange={(e) => setForm((prev) => ({ ...prev, contactPhone: e.target.value }))}
                    className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className="mb-1 block text-gray-700">申请原因 <span className="text-red-500">*</span></span>
                <textarea
                  rows={4}
                  value={form.reason}
                  onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="请输入客户背景、竞争情况、控价说明等"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-gray-700">补充说明</span>
                <textarea
                  rows={3}
                  value={form.remark}
                  onChange={(e) => setForm((prev) => ({ ...prev, remark: e.target.value }))}
                  placeholder="可填写申请依据、特殊承诺、附件说明等"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </label>
            </div>
          </section>
        </div>
      </div>

      <div className="flex justify-end gap-3 border border-gray-200 bg-white px-5 py-4">
        <button
          type="button"
          className="rounded-md border border-gray-300 px-6 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          onClick={onPrev}
        >
          返回旅客信息
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          className={`rounded-md px-6 py-2 text-sm font-medium transition-colors ${
            canSubmit ? 'bg-blue-600 text-white hover:bg-blue-700' : 'cursor-not-allowed bg-gray-200 text-gray-400'
          }`}
          onClick={() => onNext({ ...form, status: 'draft' })}
        >
          下一步：提交申请
        </button>
      </div>
    </div>
  )
}
