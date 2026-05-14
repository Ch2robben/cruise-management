import { useState, useEffect } from 'react'
import { dashboardApi } from '@/mock/api'
import type { DashboardData } from '@/types'
import { formatCurrency } from '@/utils/format'
import { TrendingUp, TrendingDown, Package, AlertTriangle, FileText, ShoppingCart } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.get().then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">加载中...</div>
    )
  }

  const statCards = [
    { label: '今日销售额', value: formatCurrency(data.todaySales), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '今日采购额', value: formatCurrency(data.todayPurchase), icon: TrendingDown, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '当前SKU数', value: data.skuCount.toLocaleString(), icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: '库存预警', value: `${data.alertCount} 项`, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: '待审核采购单', value: `${data.pendingPurchaseOrders} 张`, icon: FileText, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: '待出库销售单', value: `${data.pendingSalesOrders} 张`, icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">数据看板</h2>
        <p className="text-sm text-gray-500 mt-0.5">长航集团游轮业务核心运营数据概览</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-lg p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className="text-xl font-semibold text-gray-900 mt-0.5">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 趋势图 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h4 className="text-sm font-medium text-gray-700 mb-4">近7日销售趋势</h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`} />
              <Tooltip formatter={(v: number) => [formatCurrency(v), '销售额']} />
              <Line type="monotone" dataKey="amount" stroke="#1f2937" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h4 className="text-sm font-medium text-gray-700 mb-4">近7日采购趋势</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.purchaseTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`} />
              <Tooltip formatter={(v: number) => [formatCurrency(v), '采购额']} />
              <Bar dataKey="amount" fill="#374151" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 预警列表 */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h4 className="text-sm font-medium text-gray-700 mb-3">库存预警</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
              <th className="pb-2 font-medium">商品名称</th>
              <th className="pb-2 font-medium">当前库存</th>
              <th className="pb-2 font-medium">最低库存</th>
              <th className="pb-2 font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {data.alertList.map((item, i) => (
              <tr key={i} className="border-b border-gray-50">
                <td className="py-2 text-gray-700">{item.name}</td>
                <td className="py-2 font-mono">{item.stock}</td>
                <td className="py-2 font-mono text-gray-400">{item.minStock}</td>
                <td className="py-2">
                  {item.stock === 0 ? (
                    <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">缺货</span>
                  ) : (
                    <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">不足</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
