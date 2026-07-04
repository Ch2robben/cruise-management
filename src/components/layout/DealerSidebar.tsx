import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Ship, ChevronDown, ChevronRight, ShoppingCart, Wallet, PieChart, FileText, Settings, Navigation } from 'lucide-react'

interface MenuItem {
  key: string
  label: string
  icon: string
  path?: string
  children?: { key: string; label: string; path: string }[]
}

const menuItems: MenuItem[] = [
  {
    key: 'dashboard', label: '工作台首页', icon: 'LayoutDashboard', path: '/dealer/home'
  },
  {
    key: 'booking', label: '产品预定', icon: 'Navigation',
    children: [
      { key: 'cruise', label: '游轮预定', path: '/dealer/booking/cruise' },
      { key: 'special_price', label: '特价申请', path: '/dealer/booking/special-price' },
      { key: 'boat', label: '城市游船预定', path: '/dealer/booking/boat' },
      { key: 'flight', label: '航班查询', path: '/dealer/booking/flight' },
      { key: 'combo', label: '组合产品售票', path: '/dealer/booking/combo-sales' },
    ],
  },
  {
    key: 'orders', label: '订单管理', icon: 'ShoppingCart',
    children: [
      { key: 'cruise_orders', label: '游轮订单', path: '/dealer/orders/cruise' },
      { key: 'tourist_orders', label: '游客订单', path: '/dealer/orders/tourists' },
      { key: 'period_orders', label: '期票订单', path: '/dealer/orders/period' },
      { key: 'special_price_orders', label: '特价申请单', path: '/dealer/orders/special-price' },
      { key: 'boat_orders', label: '游船订单', path: '/dealer/orders/boat' },
      { key: 'combo_orders', label: '组合产品订单', path: '/dealer/booking/combo-orders' },
    ],
  },
  {
    key: 'finance', label: '财务管理', icon: 'Wallet',
    children: [
      { key: 'my_bills', label: '我的账单', path: '/dealer/finance/my-bills' },
      { key: 'pending_invoice', label: '待开票订单', path: '/dealer/finance/pending-invoice' },
      { key: 'invoice_records', label: '开票记录', path: '/dealer/finance/invoice-records' },
    ],
  },
  {
    key: 'stats', label: '数据统计', icon: 'PieChart',
    children: [
      { key: 'cruise_stats', label: '游轮销售统计', path: '/dealer/stats/cruise-sales' },
      { key: 'boat_stats', label: '游船销售统计', path: '/dealer/stats/boat-sales' },
    ],
  },
  {
    key: 'invoice', label: '发票管理', icon: 'FileText',
    children: [
      { key: 'invoice_header', label: '抬头管理', path: '/dealer/invoice/header' },
      { key: 'invoice_apply', label: '发票申请管理', path: '/dealer/invoice/apply' },
      { key: 'invoice_query', label: '已申请发票查询', path: '/dealer/invoice/query' },
    ],
  },
  {
    key: 'settings', label: '系统管理', icon: 'Settings',
    children: [
      { key: 'positions', label: '岗位管理', path: '/dealer/system/positions' },
      { key: 'employees', label: '员工管理', path: '/dealer/system/employees' },
      { key: 'personal', label: '个人中心', path: '/dealer/system/personal' },
    ],
  },
]

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-4 h-4" />,
  Navigation: <Navigation className="w-4 h-4" />,
  Ship: <Ship className="w-4 h-4" />,
  ShoppingCart: <ShoppingCart className="w-4 h-4" />,
  Wallet: <Wallet className="w-4 h-4" />,
  PieChart: <PieChart className="w-4 h-4" />,
  FileText: <FileText className="w-4 h-4" />,
  Settings: <Settings className="w-4 h-4" />,
}

export default function DealerSidebar() {
  const location = useLocation()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    booking: true,
    orders: true,
    finance: true,
    stats: true,
    invoice: true,
    settings: true,
  })

  const toggle = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const isChildActive = (children?: { path: string }[]) => {
    return children?.some((c) => location.pathname === c.path)
  }

  return (
    <aside className="w-56 bg-gray-900 text-gray-300 flex flex-col shrink-0 h-full overflow-y-auto">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-800">
        <Ship className="w-5 h-5 text-emerald-400" />
        <span className="text-base font-semibold text-white">长航文旅分销平台</span>
      </div>

      <nav className="flex-1 py-2">
        {menuItems.map((item) => (
          <div key={item.key}>
            {item.children ? (
              <>
                <button
                  onClick={() => toggle(item.key)}
                  className={`w-full flex items-center gap-2 px-4 py-3 text-base hover:bg-gray-800 transition-colors ${
                    isChildActive(item.children) ? 'text-white bg-gray-800' : ''
                  }`}
                >
                  <span className="shrink-0">{iconMap[item.icon]}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {expanded[item.key] ? (
                    <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  )}
                </button>
                {expanded[item.key] && (
                  <div className="bg-gray-950/50">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.key}
                        to={child.path}
                        className={({ isActive }) =>
                          `block pl-12 pr-4 py-2.5 text-base hover:bg-gray-800 transition-colors ${
                            isActive ? 'text-white bg-emerald-600/20 border-r-2 border-emerald-500' : ''
                          }`
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink
                to={item.path!}
                className={({ isActive }) =>
                  `w-full flex items-center gap-2 px-4 py-3 text-base hover:bg-gray-800 transition-colors ${
                    isActive ? 'text-white bg-emerald-600/20 border-r-2 border-emerald-500' : ''
                  }`
                }
              >
                <span className="shrink-0">{iconMap[item.icon]}</span>
                <span className="flex-1 text-left">{item.label}</span>
              </NavLink>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}
