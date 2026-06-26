import { useState } from 'react'
import type { DealerBookingDraft } from '@/components/dealer/booking/bookingTypes'
import { FileText, Send } from 'lucide-react'
import { formatCurrency } from '@/utils/format'

export default function Step5SpecialPriceSubmit({
  data,
  onNext,
  onPrev,
}: {
  data?: DealerBookingDraft
  onNext: () => void
  onPrev: () => void
}) {
  const [agreed, setAgreed] = useState(true)
  const application = data?.specialPriceApplication
  const canSubmit = !!application && agreed

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">提交申请</h2>
              <p className="mt-0.5 text-sm text-gray-500">确认申请信息后提交审批，审批通过前不会生成正式支付流程。</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-gray-200 bg-gray-50">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">申请单摘要</h3>
            </div>
            <div className="space-y-3 px-4 py-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">申请单号</span>
                <span className="font-mono text-gray-900">SP20260625001</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">申请状态</span>
                <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">待提交</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">申请范围</span>
                <span className="text-gray-900">
                  {application?.applyScope === 'order' ? '整单特价' : application?.applyScope === 'room' ? '房型特价' : '游客特价'}
                </span>
              </div>
              <div className="rounded-lg border border-orange-100 bg-white px-4 py-4">
                <div className="text-xs text-gray-500">当前规则价</div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-gray-900">{formatCurrency(application?.currentAmount ?? 0)}</div>
                <div className="mt-3 text-xs text-gray-500">申请特价</div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-red-500">{formatCurrency(application?.requestedAmount ?? 0)}</div>
                <div className="mt-3 text-xs text-gray-500">优惠差额</div>
                <div className="mt-1 text-base font-semibold tabular-nums text-green-600">-{formatCurrency(application?.discountAmount ?? 0)}</div>
              </div>
            </div>
          </aside>

          <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">提交前确认</h3>
            </div>
            <div className="space-y-4 px-4 py-4 text-sm">
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-4 text-blue-700">
                <div className="font-medium">提交后进入审批</div>
                <div className="mt-1 text-xs text-blue-600/80">
                  审批结果将回写到特价申请单；审批通过后再进入后续支付或下单处理。
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="text-xs text-gray-500">联系人</div>
                  <div className="mt-1 font-medium text-gray-900">{application?.contactName || '-'}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="text-xs text-gray-500">联系电话</div>
                  <div className="mt-1 font-medium text-gray-900">{application?.contactPhone || '-'}</div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-xs text-gray-500">申请原因</div>
                <div className="mt-1 whitespace-pre-wrap text-gray-900">{application?.reason || '-'}</div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-xs text-gray-500">补充说明</div>
                <div className="mt-1 whitespace-pre-wrap text-gray-900">{application?.remark || '-'}</div>
              </div>

              <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 rounded"
                />
                <span className="text-sm text-gray-700">
                  我已确认申请原因、目标特价与联系人信息无误，提交后将进入审批流程。
                </span>
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
          返回特价确认
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          className={`inline-flex items-center gap-2 rounded-md px-6 py-2 text-sm font-medium transition-colors ${
            canSubmit ? 'bg-blue-600 text-white hover:bg-blue-700' : 'cursor-not-allowed bg-gray-200 text-gray-400'
          }`}
          onClick={onNext}
        >
          <Send className="h-4 w-4" />
          提交申请
        </button>
      </div>
    </div>
  )
}
