import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, Settings, ChevronDown, ChevronRight, Ship, Calendar, Users, Wallet, PieChart, ClipboardList, ShoppingCart } from 'lucide-react'

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
      { key: 'port', label: '码头管理', path: '/resources/ports' },
      { key: 'port_distance', label: '码头距离库', path: '/resources/port-distances' },
      { key: 'attraction', label: '景点管理', path: '/resources/attractions' },
      { key: 'route', label: '航线管理', path: '/resources/routes' },
      { key: 'itinerary', label: '行程管理', path: '/resources/itineraries' },
      { key: 'ship', label: '船舶管理', path: '/resources/ships' },
      { key: 'room', label: '房间管理', path: '/resources/rooms' },
      { key: 'cabin', label: '船舱管理', path: '/resources/cabins' },
      { key: 'sell_room_type_config', label: '房型管理', path: '/resources/sell-room-type-configs' },
      { key: 'facility', label: '设施管理', path: '/resources/facilities' },
      { key: 'ticket', label: '票类管理', path: '/resources/tickets' },
      { key: 'product', label: '产品管理', path: '/resources/products' },
    ],
  },
  {
    key: 'voyage', label: '航次', icon: 'Calendar',
    children: [
      { key: 'voyage_list', label: '航次列表', path: '/voyage/list' },
      { key: 'voyage_template', label: '航次模板', path: '/voyage/templates' },
      { key: 'voyage_price_template', label: '航次价格配置', path: '/voyage/price-templates' },
      { key: 'voyage_inventory_template', label: '航次库存配置', path: '/voyage/inventory-templates' },
      { key: 'voyage_inv', label: '航次库存看板', path: '/voyage/inventory' },
      { key: 'voyage_allocation', label: '库存调配工作台', path: '/voyage/inventory-allocation' },
      // { key: 'pricing_rule', label: '房型定价规则', path: '/voyage/pricing-rules' },
      // { key: 'sales_control', label: '销售控制', path: '/voyage/sales-control' },
      // { key: 'voyage_price', label: '价格日历', path: '/voyage/pricing' },
      // { key: 'price_management', label: '价格管理', path: '/voyage/price-management' },
    ],
  },
  {
    key: 'order', label: '订单管理', icon: 'ShoppingCart',
    children: [
      { key: 'order_list', label: '订单列表', path: '/orders/list' },
      { key: 'voyage_passenger_room', label: '航次旅客房型管理', path: '/orders/voyage-passenger-rooms' },
    ],
  },
  {
    key: 'distribution', label: '分销合作', icon: 'Ship',
    children: [
      { key: 'dealer', label: '合作分销商', path: '/distribution/dealers' },
      { key: 'dealer_approval', label: '合作审核', path: '/distribution/dealer-approvals' },
      { key: 'dealer_change_log', label: '分销商变更记录', path: '/distribution/dealer-change-logs' },
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
      { key: 'supplementary_payment', label: '补款单管理', path: '/finance/supplementary-payments' },
    ],
  },
  {
    key: 'report', label: '报表中心', icon: 'PieChart',
    children: [
      { key: 'data_report', label: '数据报表', path: '/report/data-reports' },
    ],
  },
  {
    key: 'basic', label: '基础设置', icon: 'Settings',
    children: [
      { key: 'holiday', label: '节假日设置', path: '/basic/holidays' },
      { key: 'id_type', label: '证件类型管理', path: '/basic/id-types' },
      { key: 'age_group', label: '年龄段管理', path: '/basic/age-groups' },
    ],
  },
  {
    key: 'system', label: '系统设置', icon: 'Settings',
    children: [
      { key: 'user', label: '用户管理', path: '/system/users' },
      { key: 'role', label: '角色管理', path: '/system/roles' },
      { key: 'menu', label: '菜单管理', path: '/system/menus' },
      { key: 'dictionary', label: '数据字典', path: '/system/dictionaries' },
      { key: 'approval_flow', label: '审批流配置', path: '/system/approval-flows' },
    ],
  },
  {
    key: 'rule', label: '规则中心', icon: 'ClipboardList',
    children: [
      { key: 'deposit_rule', label: '定金规则管理', path: '/rule/deposit' },
      { key: 'payment_rule', label: '船款规则管理', path: '/rule/payment' },
      { key: 'penalty_rule', label: '罚金规则管理', path: '/rule/penalty' },
      { key: 'penalty_handling_dict', label: '罚金处理规则', path: '/rule/penalty-handling' },
      { key: 'dealer_cooperation_rule', label: '申请合作规则', path: '/rule/dealer-cooperation' },
      { key: 'discount_rule', label: '内外宾优惠政策管理', path: '/rule/discount' },
      { key: 'price_policy_type', label: '价格政策类型', path: '/rule/price-type' },
      { key: 'rebate_rule', label: '返利政策管理', path: '/rule/rebate' },
      { key: 'rebate_target', label: '返利任务指标', path: '/rule/rebate-targets' },
      { key: 'tip_config', label: '小费标准管理', path: '/rule/tip' },
      { key: 'order_validity_rule', label: '订单有效期规则', path: '/rule/order-validity' },
      { key: 'warning_rule', label: '预警规则', path: '/rule/warning' },
      { key: 'group_auth', label: '组团社权限管理', path: '/rule/group-auth' },
      { key: 'refund_rule', label: '分销商退票费规则', path: '/rule/refund' },
      { key: 'ship_auth', label: '船舶权限管理', path: '/rule/ship-auth' },
      { key: 'close_rule', label: '订单取消规则管理', path: '/rule/close' },
      { key: 'performance_rule', label: '绩效系数规则管理', path: '/rule/performance' },
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
  ClipboardList: <ClipboardList className="w-4 h-4" />,
  ShoppingCart: <ShoppingCart className="w-4 h-4" />,
}

export default function Sidebar() {
  const location = useLocation()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    // dashboard: true,
    resources: true,
    voyage: true,
    order: true,
    distribution: true,
    service: true,
    customer: true,
    finance: true,
    report: true,
    basic: true,
    system: true,
    rule: true,
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
        <span className="text-base font-semibold text-white">某旅游公司游轮管理</span>
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
