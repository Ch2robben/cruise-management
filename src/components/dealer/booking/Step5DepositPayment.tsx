import React, { useState } from 'react'
import { Wallet, Landmark, CreditCard, Smartphone } from 'lucide-react'

export default function Step5DepositPayment({ onNext, onPrev }: { onNext: () => void, onPrev: () => void }) {
  const [selectedMethod, setSelectedMethod] = useState('balance')
  const methodOptions = [
    { key: 'balance', title: '预存余额支付', desc: '可用余额：¥86,400', icon: Wallet },
    { key: 'credit', title: '授信额度支付', desc: '可用额度：¥156,800', icon: Landmark },
    { key: 'alipay', title: '支付宝 / 微信', desc: '线上扫码支付，实时确认到账', icon: Smartphone },
    { key: 'transfer', title: '银行转账汇款', desc: '提交凭证后由财务审核入账', icon: Landmark },
  ] as const

  const handlePayment = () => {
    // In a real app we'd call an API here
    onNext()
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">定金支付</h2>
              <p className="mt-0.5 text-sm text-gray-500">选择支付方式并完成定金锁舱，付款成功后进入后续补录流程。</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-gray-200 bg-gray-50">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">付款摘要</h3>
            </div>
            <div className="space-y-4 px-4 py-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">订单号</span>
                <span className="font-mono font-medium text-gray-900">#CZ20260615001</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">订单状态</span>
                <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">待支付定金</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">付款主体</span>
                <span className="text-gray-900">同业分销</span>
              </div>
              <div className="rounded-lg border border-blue-100 bg-white px-4 py-4">
                <div className="text-xs text-gray-500">需支付定金</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums text-red-500">¥3,900</div>
                <div className="mt-1 text-xs text-gray-400">支付成功后自动锁定当前已选房型与船位</div>
              </div>
            </div>
          </aside>

          <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">支付方式</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {methodOptions.map((method) => {
                const active = selectedMethod === method.key
                const Icon = method.icon
                return (
                  <button
                    key={method.key}
                    type="button"
                    onClick={() => setSelectedMethod(method.key)}
                    className={`flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition ${
                      active ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-sm font-medium ${active ? 'text-blue-700' : 'text-gray-900'}`}>{method.title}</div>
                        <div className="mt-0.5 text-xs text-gray-500">{method.desc}</div>
                      </div>
                    </div>
                    <div className={`h-4 w-4 shrink-0 rounded-full border-2 ${active ? 'border-blue-600 bg-blue-600 ring-2 ring-blue-100' : 'border-gray-300 bg-white'}`} />
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 flex justify-end gap-3 border border-gray-200 bg-white px-5 py-4 shadow-[0_-6px_16px_rgba(15,23,42,0.04)]">
        <button className="rounded-md border border-gray-300 px-6 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50" onClick={onPrev}>
          返回订单确认
        </button>
        <button className="rounded-md bg-green-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700" onClick={handlePayment}>
          确认支付 ¥3,900
        </button>
      </div>
    </div>
  )
}
