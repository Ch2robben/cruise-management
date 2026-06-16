import React from 'react'
import { CheckCircle2 } from 'lucide-react'

// -------------------------------------------------------------
// UI Components (Adapted from Admin Order Details)
// -------------------------------------------------------------
function MetricItem({ label, value, highlight, warning }: { label: string; value: React.ReactNode; highlight?: boolean; warning?: boolean }) {
  return (
    <div className="rounded-lg bg-gray-50 px-4 py-3 border border-gray-100">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${highlight ? 'text-blue-600' : warning ? 'text-orange-500' : 'text-gray-900'}`}>{value}</div>
    </div>
  )
}

function DetailSection({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
      <div className="border-b border-gray-200 bg-gray-50 px-5 py-3 flex items-center gap-2">
        <div className="w-1 h-3 bg-blue-500 rounded-full" />
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function FieldGrid({ children, columns = 2 }: { children: React.ReactNode; columns?: 2 | 3 }) {
  const columnClass = columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
  return <div className={`grid gap-x-8 gap-y-3 ${columnClass}`}>{children}</div>
}

function FieldItem({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="grid min-h-8 grid-cols-[108px_1fr] items-start gap-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`min-w-0 break-words text-gray-900 font-medium ${mono ? 'font-mono' : ''}`}>{value || '-'}</span>
    </div>
  )
}

// -------------------------------------------------------------
// Step 4 Component
// -------------------------------------------------------------
export default function Step4OrderConfirm({ data, onNext, onPrev }: { data: any, onNext: () => void, onPrev: () => void }) {
  const totalPax = 5
  const totalRooms = 3
  const totalAmount = 20300
  const deposit = 3900

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-blue-50/50">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">订单确认</h2>
        <p className="text-gray-500">订单已生成，请确认以下预定详情无误</p>
      </div>

      <div className="space-y-5 mb-8">
        <DetailSection title="订单概览">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricItem label="订单状态" value={<span className="text-orange-500 text-base">待支付定金</span>} />
            <MetricItem label="订单总额" value={`¥${totalAmount.toLocaleString()}`} highlight />
            <MetricItem label="需支付定金" value={`¥${deposit.toLocaleString()}`} warning />
            <MetricItem label="总人数" value={`${totalPax} 人`} />
          </div>
        </DetailSection>

        <div className="grid gap-5 lg:grid-cols-2">
          <DetailSection title="订单信息">
            <FieldGrid columns={2}>
              <FieldItem label="订单号" value="#CZ20260615001" mono />
              <FieldItem label="预订时间" value="2026-06-08 14:30" />
              <FieldItem label="订单类型" value="普通订单" />
              <FieldItem label="分销商" value="同业分销" />
            </FieldGrid>
          </DetailSection>

          <DetailSection title="游轮产品信息">
            <FieldGrid columns={2}>
              <FieldItem label="游轮" value="长江叁号" />
              <FieldItem label="航次号" value="V20260615" mono />
              <FieldItem label="航线" value="重庆→宜昌" />
              <FieldItem label="行程天数" value="4 天" />
            </FieldGrid>
          </DetailSection>

          <DetailSection title="港口与行程">
            <FieldGrid columns={2}>
              <FieldItem label="出发港" value="重庆" />
              <FieldItem label="终到港" value="宜昌" />
              <FieldItem label="开船日期" value="2026-06-15" />
              <FieldItem label="离船日期" value="2026-06-18" />
            </FieldGrid>
          </DetailSection>

          <DetailSection title="人数信息">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <MetricItem label="总人数" value={5} />
              <MetricItem label="成人" value={4} />
              <MetricItem label="儿童" value={1} />
              <MetricItem label="房间数" value={3} />
            </div>
          </DetailSection>
        </div>

        <DetailSection title="费用信息">
          <div className="overflow-x-auto rounded-lg border border-gray-100 mb-4">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">房型</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">年龄段</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">入住类型</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">结算价</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">人数</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">小计</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 text-gray-700 font-medium">标准间</td>
                  <td className="px-4 py-3 text-gray-700">成人</td>
                  <td className="px-4 py-3 text-gray-700">标准</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">¥2,980</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">4</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">¥11,920</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-700 font-medium">标准间</td>
                  <td className="px-4 py-3 text-gray-700">儿童</td>
                  <td className="px-4 py-3 text-gray-700">不占床</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">¥1,500</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">1</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">¥1,500</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-700 font-medium">豪华套房</td>
                  <td className="px-4 py-3 text-gray-700">成人</td>
                  <td className="px-4 py-3 text-gray-700">单间</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">¥6,880</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">1</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">¥6,880</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex justify-end pt-2">
            <div className="text-right bg-orange-50 p-4 rounded-lg border border-orange-100 w-full sm:w-1/2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 text-sm">订单总计</span>
                <span className="text-xl font-bold text-red-500">¥{totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-t border-orange-200/50 pt-2">
                <span className="text-gray-600 text-sm font-medium">本次需支付定金</span>
                <span className="text-lg font-bold text-orange-500">¥{deposit.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </DetailSection>
      </div>

      <div className="flex justify-center gap-4">
        <button className="px-8 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors bg-white font-medium shadow-sm" onClick={onPrev}>
          ← 返回修改
        </button>
        <button className="px-8 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm font-medium flex items-center gap-2" onClick={onNext}>
          确认并支付定金 →
        </button>
      </div>
    </div>
  )
}
