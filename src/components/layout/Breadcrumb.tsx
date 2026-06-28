import { useLocation, Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

const routeLabels: Record<string, string> = {
  '/dashboard': '数据看板',
  '/resources': '资源',
  '/resources/ports': '码头管理',
  '/resources/port-distances': '码头距离库',
  '/resources/attractions': '景点管理',
  '/resources/routes': '航线管理',
  '/resources/itineraries': '行程管理',
  '/resources/cabins': '船舱管理',
  '/resources/sell-room-type-configs': '房型管理',
  '/distribution': '分销合作',
  '/distribution/dealers': '合作分销商',
  '/distribution/dealer-approvals': '合作审核',
  '/distribution/dealer-rules': '申请合作规则',
  '/distribution/dealer-change-logs': '分销商变更记录',
  '/distribution/cabin-holds': '锁舱记录',
  '/orders': '订单管理',
  '/orders/list': '订单列表',
  '/voyage/pricing-rules': '房型定价规则',
  '/voyage/price-templates': '航次价格配置',
  '/voyage/inventory-templates': '航次库存配置',
  '/rule': '规则中心',
  '/rule/deposit': '定金规则管理',
  '/rule/payment': '船款规则管理',
  '/rule/penalty': '罚金规则管理',
  '/rule/penalty-handling': '罚金处理规则',
  '/rule/dealer-cooperation': '申请合作规则',
  '/rule/price-type': '价格政策类型',
  '/rule/rebate': '返利政策管理',
  '/rule/rebate-targets': '返利任务指标',
  '/rule/tip': '小费标准管理',
  '/rule/order-validity': '订单有效期规则',
  '/rule/warning': '预警规则',
  '/rule/close': '订单取消规则管理',
  '/system': '系统设置',
  '/system/users': '用户管理',
  '/system/roles': '角色管理',
  '/system/menus': '菜单管理',
  '/system/dictionaries': '数据字典',
}

export default function Breadcrumb() {
  const location = useLocation()
  const parts = location.pathname.split('/').filter(Boolean)

  const crumbs: { label: string; path?: string }[] = [{ label: '首页', path: '/dashboard' }]

  let current = ''
  for (const part of parts) {
    current += '/' + part
    const label = routeLabels[current]
    if (label) {
      crumbs.push({ label, path: current })
    }
  }

  // 去重（同一路径不重复显示）
  const unique = crumbs.filter((c, i, arr) => i === 0 || c.path !== arr[i - 1].path)

  return (
    <nav className="flex items-center gap-1.5 text-sm text-gray-400 py-2">
      {unique.map((crumb, i) => (
        <span key={crumb.path || i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="w-3.5 h-3.5" />}
          {i === 0 ? (
            <Home className="w-3.5 h-3.5" />
          ) : i === unique.length - 1 ? (
            <span className="text-gray-700 font-medium">{crumb.label}</span>
          ) : crumb.path ? (
            <Link to={crumb.path} className="hover:text-gray-600 transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span>{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
