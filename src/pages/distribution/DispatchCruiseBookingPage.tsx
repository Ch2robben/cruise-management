import { useState } from 'react'
import CruiseBookingWizard from '@/components/dealer/booking/CruiseBookingWizard'

const dispatchDealers = [
  { id: 'd1', name: '三峡国际旅行社', group: '重庆地区' },
  { id: 'd2', name: '重庆中旅国际', group: '重庆地区' },
  { id: 'd5', name: '宜昌蓝天旅行社', group: '湖北地区' },
  { id: 'd8', name: '驴妈妈旅游网', group: 'OTA渠道' },
]

export default function DispatchCruiseBookingPage() {
  const [dealerId, setDealerId] = useState(dispatchDealers[0]?.id ?? '')
  const selectedDealer = dispatchDealers.find((d) => d.id === dealerId)

  return (
    <CruiseBookingWizard
      mode="dispatch"
      title="计调下单"
      description="计调人员代合作分销商完成游轮预订，锁定库存并生成 B2B 分销订单。"
      className="space-y-5 pb-20"
      headerExtra={
        <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-5 py-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[240px] flex-1">
              <label className="mb-1.5 block text-xs font-medium text-gray-600">代下单分销商</label>
              <select
                value={dealerId}
                onChange={(e) => setDealerId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {dispatchDealers.map((dealer) => (
                  <option key={dealer.id} value={dealer.id}>
                    {dealer.name}（{dealer.group}）
                  </option>
                ))}
              </select>
            </div>
            {selectedDealer && (
              <div className="text-sm text-gray-600">
                当前将为 <span className="font-medium text-gray-900">{selectedDealer.name}</span> 创建订单并扣减其授信/余额配额
              </div>
            )}
          </div>
        </div>
      }
    />
  )
}
