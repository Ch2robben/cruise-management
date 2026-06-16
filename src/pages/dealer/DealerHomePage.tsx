import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import { ClipboardList, CheckCircle, TrendingUp, Wallet, Landmark } from 'lucide-react'

// 本周销售趋势数据 (6.1-6.7)
const weekData = [
  { day: '周一', value: 82000 },
  { day: '周二', value: 65000 },
  { day: '周三', value: 78000 },
  { day: '周四', value: 91000 },
  { day: '周五', value: 72000 },
  { day: '周六', value: 56000 },
  { day: '周日', value: 42200 },
]
const maxWeek = Math.max(...weekData.map(d => d.value))

// 公告数据
interface Announcement { id: number; title: string; date: string; type: 'system' | 'product' | 'danger' | 'finance'; unread: boolean; content: string }
const initialAnnouncements: Announcement[] = [
  { id: 1, title: '【系统通知】ICS 3.0 版本将于6月10日升级，届时部分功能暂停使用', date: '2026-06-05', type: 'system', unread: true, content: 'ICS 系统将于2026年6月10日 02:00-06:00 进行版本升级，届时订单查询、出票等功能将暂停服务。' },
  { id: 2, title: '【产品上新】长江叁号新增"重庆→武汉"6天深度游航线，现已开售', date: '2026-06-04', type: 'product', unread: true, content: '长江叁号游轮新增重庆→武汉（上水）6天深度游览线路，途径三峡大坝、神农溪、黄鹤楼等经典景点。' },
  { id: 3, title: '【停航通知】长江贰号6月18日航次因天气原因取消，已订购客户请及时通知', date: '2026-06-03', type: 'danger', unread: false, content: '因长江中上游暴雨预警，长江贰号原定6月18日宜昌→重庆航次取消。' },
  { id: 4, title: '【结算通知】2026年5月销售返利结算单已生成，请于6月15日前确认', date: '2026-06-02', type: 'finance', unread: false, content: '2026年5月销售返利结算单已生成，请登录系统进入「数据统计」查看确认。' },
]

export default function DealerHomePage() {
  const navigate = useNavigate()
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const unreadCount = announcements.filter(a => a.unread).length

  const openAnnouncement = (id: number) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, unread: false } : a))
    const ann = announcements.find(a => a.id === id)
    if (ann) {
      alert(`📢 ${ann.title}\n\n${ann.content}`)
    }
  }

  return (
    <div className="p-6 pb-20">
      <PageHeader title="分销商工作台首页" />

      {/* Stat Grid */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCard icon={<ClipboardList className="w-6 h-6 text-blue-500" />} bg="bg-blue-50" value="23" label="待处理订单" change="↑ 较昨日+3" trend="up" />
        <StatCard icon={<CheckCircle className="w-6 h-6 text-green-500" />} bg="bg-green-50" value="156" label="本月已出票" change="↑ 12.5%" trend="up" />
        <StatCard icon={<TrendingUp className="w-6 h-6 text-cyan-500" />} bg="bg-cyan-50" value="¥5.86M" label="本月销售额" change="↑ 较上月+8.2%" trend="up" />
        <StatCard icon={<Wallet className="w-6 h-6 text-orange-500" />} bg="bg-orange-50" value="¥86,400" label="预存余额" change="↓ 较上月-15%" trend="down" />
        <StatCard icon={<Landmark className="w-6 h-6 text-purple-500" />} bg="bg-purple-50" value="¥200,000" label="授信额度" change="剩余 ¥156,800" trend="neutral" />
      </div>

      <div className="grid grid-cols-[1.4fr_1fr] gap-4">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Pending Tasks */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-blue-500 rounded-full" />
                <h3 className="font-semibold text-gray-900">待办事项</h3>
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">4项待处理</span>
              </div>
              <button onClick={() => navigate('/dealer/orders/cruise')} className="text-xs text-gray-500 hover:text-blue-600">查看全部 →</button>
            </div>
            <div className="p-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-500">
                    <th className="pb-3 font-medium">类型</th>
                    <th className="pb-3 font-medium">内容</th>
                    <th className="pb-3 font-medium">截止时间</th>
                    <th className="pb-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-3"><span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-xs border border-orange-100">船款待支付</span></td>
                    <td className="py-3 text-gray-700">长江叁号 6月15日航次 订单 #CZ20260615001</td>
                    <td className="py-3 text-red-500">2026-06-05 18:00</td>
                    <td className="py-3"><button className="text-white bg-blue-600 px-3 py-1 rounded text-xs hover:bg-blue-700 transition" onClick={() => navigate('/dealer/orders/cruise')}>立即处理</button></td>
                  </tr>
                  <tr>
                    <td className="py-3"><span className="text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded text-xs border border-yellow-100">待补充名单</span></td>
                    <td className="py-3 text-gray-700">长江叁号 6月20日航次 订单 #CZ20260620003</td>
                    <td className="py-3 text-gray-700">2026-06-10</td>
                    <td className="py-3"><button className="text-gray-700 bg-white border border-gray-300 px-3 py-1 rounded text-xs hover:border-blue-500 hover:text-blue-500 transition" onClick={() => navigate('/dealer/orders/cruise')}>去补录</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Voyages */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-blue-500 rounded-full" />
                <h3 className="font-semibold text-gray-900">近期航次</h3>
              </div>
              <button onClick={() => navigate('/dealer/booking/cruise')} className="text-xs text-gray-500 hover:text-blue-600">查看全部 →</button>
            </div>
            <div className="p-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-500">
                    <th className="pb-3 font-medium">航次</th>
                    <th className="pb-3 font-medium">游轮</th>
                    <th className="pb-3 font-medium">航线</th>
                    <th className="pb-3 font-medium">出发日期</th>
                    <th className="pb-3 font-medium">状态</th>
                    <th className="pb-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-3 font-semibold text-blue-600">V20260615</td>
                    <td className="py-3 text-gray-700">长江叁号</td>
                    <td className="py-3 text-gray-700">重庆→宜昌（上水4天）</td>
                    <td className="py-3 text-gray-700">2026-06-15</td>
                    <td className="py-3"><span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs">可预订</span></td>
                    <td className="py-3"><button className="text-blue-600 hover:underline" onClick={() => navigate('/dealer/booking/cruise')}>立即预订</button></td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-blue-600">V20260620</td>
                    <td className="py-3 text-gray-700">长江叁号</td>
                    <td className="py-3 text-gray-700">宜昌→重庆（下水3天）</td>
                    <td className="py-3 text-gray-700">2026-06-20</td>
                    <td className="py-3"><span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-xs">紧张</span></td>
                    <td className="py-3"><button className="text-blue-600 hover:underline" onClick={() => navigate('/dealer/booking/cruise')}>立即预订</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Announcements */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="flex items-center gap-2 p-4 border-b border-gray-100">
              <div className="w-1 h-4 bg-blue-500 rounded-full" />
              <h3 className="font-semibold text-gray-900">公告通知</h3>
              {unreadCount > 0 && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{unreadCount}条未读</span>}
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              <div className="space-y-3">
                {announcements.map(a => (
                  <div key={a.id} className={`flex items-start gap-3 p-2 rounded cursor-pointer transition ${a.unread ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`} onClick={() => openAnnouncement(a.id)}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.type === 'system' ? 'bg-blue-500' : a.type === 'product' ? 'bg-green-500' : a.type === 'danger' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm truncate ${a.unread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{a.title}</div>
                      <div className="text-xs text-gray-400 mt-1">{a.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-4 bg-blue-500 rounded-full" />
              <h3 className="font-semibold text-gray-900">本周销售趋势</h3>
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">6.1 – 6.7</span>
            </div>
            
            <div className="flex gap-6 mb-6">
              <div>
                <div className="text-2xl font-bold text-gray-900">¥{(486200).toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">本周累计</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">98<span className="text-sm font-normal text-gray-500 ml-1">单</span></div>
                <div className="text-xs text-gray-500 mt-1">本周订单</div>
              </div>
            </div>

            <div className="flex items-end justify-between h-36 pt-4">
              {weekData.map(d => (
                <div key={d.day} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                  <div className="w-full flex justify-center items-end flex-1 mb-2">
                    <div 
                      className="w-3/4 max-w-[40px] rounded-t-md bg-gradient-to-t from-blue-400 to-blue-300 group-hover:from-blue-500 group-hover:to-blue-400 transition-all duration-300"
                      style={{ height: `${(d.value / maxWeek) * 100}%` }}
                      title={`¥${d.value.toLocaleString()}`}
                    />
                  </div>
                  <div className="text-[11px] text-gray-500">{d.day}</div>
                  <div className="text-[11px] font-medium text-gray-600">¥{(d.value / 1000).toFixed(1)}k</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, bg, value, label, change, trend }: any) {
  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-2xl font-bold text-gray-900 truncate">{value}</div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
        <div className={`text-xs mt-1 truncate ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
          {change}
        </div>
      </div>
    </div>
  )
}
