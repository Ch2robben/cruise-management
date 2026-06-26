import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle, FileCheck2 } from 'lucide-react'

export default function Step6Complete({ mode = 'booking' }: { mode?: 'booking' | 'special-price' }) {
  const navigate = useNavigate()
  const isSpecialPrice = mode === 'special-price'

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{isSpecialPrice ? '特价申请已提交' : '预订已提交'}</h2>
              <p className="mt-0.5 text-sm text-gray-500">
                {isSpecialPrice
                  ? '特价申请单已提交，等待审批结果后再进入后续处理。'
                  : '订单已创建并完成定金锁舱，请按时补录旅客名单并关注后续账单。'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-gray-200 bg-gray-50">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">处理结果</h3>
            </div>
            <div className="space-y-4 px-4 py-4 text-sm">
              <div className="rounded-lg border border-green-100 bg-white px-4 py-4">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">{isSpecialPrice ? '特价申请提交成功' : '定金支付成功'}</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {isSpecialPrice ? '申请信息已进入审批队列，系统已生成后续待办。' : '房型库存与船位已锁定，系统已生成后续待办。'}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">{isSpecialPrice ? '申请单号' : '订单号'}</span>
                <span className="font-mono font-medium text-gray-900">{isSpecialPrice ? '#SP20260625001' : '#CZ20260615001'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">当前状态</span>
                <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {isSpecialPrice ? '待审批' : '待补录名单'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">业务提醒</span>
                <span className="text-right text-gray-900">{isSpecialPrice ? '审批通过后自动通知经销商' : '2026-06-10 12:00 前补录完成'}</span>
              </div>
            </div>
          </aside>

          <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">后续处理</h3>
            </div>
            <div className="relative px-4 py-4">
              <div className="absolute bottom-6 left-[25px] top-6 w-px bg-gray-200" />

              <div className="relative space-y-5">
                <div className="relative flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 bg-white text-green-500" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">1. 航次、房型与定金锁舱完成</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {isSpecialPrice ? '系统已保存当前航次、房型与游客申请信息。' : '系统已保存当前占舱与订单基础信息。'}
                    </div>
                  </div>
                  <span className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">已完成</span>
                </div>

                <div className="relative flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 bg-white text-green-500" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{isSpecialPrice ? '2. 特价确认与申请提交完成' : '2. 订单确认与支付完成'}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {isSpecialPrice ? '申请单已创建，可等待审批结果。' : '财务状态已更新，可进入名单补录阶段。'}
                    </div>
                  </div>
                  <span className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">已完成</span>
                </div>

                <div className="relative flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-blue-500 bg-white">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-blue-700">{isSpecialPrice ? '3. 审批处理' : '3. 补录剩余旅客信息'}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {isSpecialPrice
                        ? '运营或管理人员审核通过后，按审批结果进入正式下单。'
                        : <>请于 <span className="text-red-500">2026-06-10 12:00</span> 前完成名单补录。</>}
                    </div>
                  </div>
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{isSpecialPrice ? '待审批' : '待处理'}</span>
                </div>

                <div className="relative flex items-start gap-3 opacity-70">
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 bg-white text-gray-300" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">{isSpecialPrice ? '4. 转正式订单 / 通知结果' : '4. 支付尾款'}</div>
                    <div className="mt-1 text-xs text-gray-400">
                      {isSpecialPrice ? '审批通过后转入正式处理流程；驳回则通知申请人。' : '出发前 7 天自动生成尾款账单。'}
                    </div>
                  </div>
                </div>

                {!isSpecialPrice && (
                <div className="relative flex items-start gap-3 opacity-70">
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 bg-white text-gray-300" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">5. 接收出团通知并登船</div>
                    <div className="mt-1 text-xs text-gray-400">名单审核通过后推送出团通知。</div>
                  </div>
                </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="flex justify-end gap-3 border border-gray-200 bg-white px-5 py-4">
        <button 
          className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          onClick={() => navigate('/dealer/orders/cruise')}
        >
          {isSpecialPrice ? '查看游轮订单' : '查看订单详情'}
        </button>
        <button 
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          onClick={() => window.location.reload()}
        >
          {isSpecialPrice ? '继续提交下一单' : '继续预定下一单'}
        </button>
      </div>
    </div>
  )
}
