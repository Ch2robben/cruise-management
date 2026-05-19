import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, Settings, ChevronDown, ChevronRight, Ship, Calendar, Users, Wallet, PieChart } from 'lucide-react'

interface MenuItem {
  key: string
  label: string
  icon: string
  path?: string
  children?: { key: string; label: string; path: string }[]
}

const menuItems: MenuItem[] = [
  {
    key: 'resources', label: '资源', icon: 'Package',
    children: [
      { key: 'port', label: '港口管理', path: '/resources/ports' },
      { key: 'attraction', label: '景点管理', path: '/resources/attractions' },
      { key: 'route', label: '航线管理', path: '/resources/routes' },
      { key: 'ship', label: '船舶管理', path: '/resources/ships' },
      { key: 'room', label: '房间管理', path: '/resources/rooms' },
      { key: 'facility', label: '设施管理', path: '/resources/facilities' },
      { key: 'ticket', label: '票类管理', path: '/resources/tickets' },
      { key: 'product', label: '产品管理', path: '/resources/products' },
    ],
  },
  {
    key: 'voyage', label: '航次', icon: 'Calendar',
    children: [
      { key: 'voyage_list', label: '航次列表', path: '/voyage/list' },
      { key: 'voyage_tpl', label: '航次模板', path: '/voyage/templates' },
      { key: 'voyage_inv', label: '库存看板', path: '/voyage/inventory' },
      { key: 'voyage_price', label: '价格日历', path: '/voyage/pricing' },
    ],
  },
  {
    key: 'distribution', label: '分销合作', icon: 'Ship',
    children: [
      { key: 'dealer', label: '经销商管理', path: '/distribution/dealers' },
      { key: 'cabin_hold', label: '锁舱记录', path: '/distribution/cabin-holds' },
    ],
  },
  {
    key: 'service', label: '服务运营', icon: 'Calendar',
    children: [
      { key: 'charter_order', label: '包船订单', path: '/service/charter-orders' },
      { key: 'complaint_ticket', label: '客诉工单', path: '/service/complaints' },
    ],
  },
  {
    key: 'customer', label: '客户管理', icon: 'Users',
    children: [
      { key: 'customer_profile', label: '客户档案', path: '/customer/profiles' },
    ],
  },
  {
    key: 'finance', label: '财务管理', icon: 'Wallet',
    children: [
      { key: 'reconciliation', label: '对账批次', path: '/finance/reconciliations' },
    ],
  },
  {
    key: 'report', label: '报表中心', icon: 'PieChart',
    children: [
      { key: 'data_report', label: '数据报表', path: '/report/data-reports' },
    ],
  },
  {
    key: 'system', label: '系统设置', icon: 'Settings',
    children: [
      { key: 'user', label: '用户管理', path: '/system/users' },
      { key: 'role', label: '角色管理', path: '/system/roles' },
      { key: 'menu', label: '菜单管理', path: '/system/menus' },
      { key: 'dictionary', label: '数据字典', path: '/system/dictionaries' },
    ],
  },
]

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-4 h-4" />,
  Package: <Package className="w-4 h-4" />,
  Settings: <Settings className="w-4 h-4" />,
  Ship: <Ship className="w-4 h-4" />,
  Calendar: <Calendar className="w-4 h-4" />,
  Users: <Users className="w-4 h-4" />,
  Wallet: <Wallet className="w-4 h-4" />,
  PieChart: <PieChart className="w-4 h-4" />,
}

export default function Sidebar() {
  const location = useLocation()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    // dashboard: true,
    resources: true,
    voyage: true,
    distribution: true,
    service: true,
    customer: true,
    finance: true,
    report: true,
    system: true,
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
        <Ship className="w-5 h-5 text-blue-400" />
        <span className="text-base font-semibold text-white">长航集团游轮管理</span>
      </div>

      <nav className="flex-1 py-2">
        {menuItems.map((item) => (
          <div key={item.key}>
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
            {expanded[item.key] && item.children && (
              <div className="bg-gray-950/50">
                {item.children.map((child) => (
                  <NavLink
                    key={child.key}
                    to={child.path}
                    className={({ isActive }) =>
                      `block pl-12 pr-4 py-2.5 text-base hover:bg-gray-800 transition-colors ${
                        isActive ? 'text-white bg-blue-600/20 border-r-2 border-blue-500' : ''
                      }`
                    }
                  >
                    {child.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}
