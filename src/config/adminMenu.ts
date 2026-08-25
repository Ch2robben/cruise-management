export interface AdminMenuLeaf {
  key: string
  label: string
  path: string
}

export interface AdminMenuGroup {
  key: string
  label: string
  children: AdminMenuLeaf[]
}

export interface AdminModule {
  key: string
  label: string
  groups: AdminMenuGroup[]
}

/** 顶栏四大板块 + 左侧一级/二级，对齐 CTIOP 与确认后的游轮菜单方案 */
export const adminModules: AdminModule[] = [
  {
    key: 'cruise',
    label: '游轮业务',
    groups: [
      {
        key: 'order',
        label: '订单',
        children: [
          { key: 'order_list', label: '订单列表', path: '/orders/list' },
          { key: 'refund_order', label: '退款单管理', path: '/orders/refunds' },
          { key: 'voyage_additional_products', label: '航次附加产品清单', path: '/orders/voyage-additional-products' },
          { key: 'voyage_passenger_room', label: '航次旅客房型管理', path: '/orders/voyage-passenger-rooms' },
        ],
      },
      {
        key: 'product',
        label: '产品',
        children: [
          { key: 'product', label: '产品管理', path: '/resources/products' },
          { key: 'ticket', label: '票类管理', path: '/resources/tickets' },
          { key: 'package', label: '套票管理', path: '/resources/packages' },
          { key: 'additional_product', label: '附加产品管理', path: '/resources/additional-products' },
        ],
      },
      {
        key: 'resources',
        label: '资源配置',
        children: [
          { key: 'port', label: '码头管理', path: '/resources/ports' },
          { key: 'attraction', label: '景点管理', path: '/resources/attractions' },
          { key: 'route', label: '航线管理', path: '/resources/routes' },
          { key: 'itinerary', label: '行程管理', path: '/resources/itineraries' },
          { key: 'ship', label: '船舶管理', path: '/resources/ships' },
          { key: 'cabin', label: '船舱管理', path: '/resources/cabins' },
          { key: 'room', label: '房间管理', path: '/resources/rooms' },
          { key: 'sell_room_type_config', label: '房型管理', path: '/resources/sell-room-type-configs' },
          { key: 'facility', label: '设施管理', path: '/resources/facilities' },
        ],
      },
      {
        key: 'voyage',
        label: '航次管理',
        children: [
          { key: 'voyage_list', label: '航次列表', path: '/voyage/list' },
          { key: 'voyage_template', label: '航次模板', path: '/voyage/templates' },
          { key: 'voyage_price_template', label: '航次价格配置', path: '/voyage/price-templates' },
          { key: 'voyage_inventory_template', label: '航次库存配置', path: '/voyage/inventory-templates' },
          { key: 'voyage_calendar_board', label: '日历看板', path: '/voyage/calendar-board' },
          { key: 'voyage_inv', label: '航次库存看板', path: '/voyage/inventory' },
          { key: 'voyage_allocation', label: '库存调配工作台', path: '/voyage/inventory-allocation' },
        ],
      },
      {
        key: 'service',
        label: '服务运营',
        children: [
          { key: 'charter_order', label: '包船订单', path: '/service/charter-orders' },
          { key: 'complaint_ticket', label: '客诉工单', path: '/service/complaints' },
        ],
      },
    ],
  },
  {
    key: 'distribution',
    label: '分销中心',
    groups: [
      {
        key: 'cooperation',
        label: '合作管理',
        children: [
          { key: 'cooperation', label: '合作管理', path: '/distribution/cooperation' },
          { key: 'dealer_cooperation_rule', label: '申请合作规则', path: '/rule/dealer-cooperation' },
        ],
      },
      {
        key: 'dist_policy',
        label: '分销与政策',
        children: [
          { key: 'distribution_mgmt', label: '分销管理', path: '/distribution/distribution-mgmt' },
          { key: 'deposit_rule', label: '定金规则管理', path: '/rule/deposit' },
          { key: 'payment_rule', label: '船款规则管理', path: '/rule/payment' },
          { key: 'penalty_rule', label: '罚金规则管理', path: '/rule/penalty' },
          { key: 'penalty_handling_dict', label: '罚金处理规则', path: '/rule/penalty-handling' },
          { key: 'discount_management', label: '营销规则管理', path: '/distribution/discounts' },
        ],
      },
      {
        key: 'ota',
        label: 'OTA平台分销',
        children: [
          { key: 'ota', label: 'OTA平台分销', path: '/distribution/ota' },
        ],
      },
      {
        key: 'rebate',
        label: '返利与绩效',
        children: [
          { key: 'rebate_rule', label: '返利政策管理', path: '/rule/rebate' },
          { key: 'rebate_target', label: '返利任务指标', path: '/rule/rebate-targets' },
          { key: 'performance_rule', label: '绩效系数规则管理', path: '/rule/performance' },
        ],
      },
    ],
  },
  {
    key: 'basic',
    label: '基础配置',
    groups: [
      {
        key: 'basic_settings',
        label: '基础设置',
        children: [
          { key: 'holiday', label: '节假日设置', path: '/basic/holidays' },
          { key: 'id_type', label: '证件类型管理', path: '/basic/id-types' },
          { key: 'age_group', label: '年龄段管理', path: '/basic/age-groups' },
          { key: 'activity_category', label: '分级字典', path: '/basic/hierarchical-dictionaries' },
          { key: 'inventory_pool', label: '库存池管理', path: '/basic/inventory-pools' },
        ],
      },
      {
        key: 'system',
        label: '系统管理',
        children: [
          { key: 'user', label: '用户管理', path: '/system/users' },
          { key: 'role', label: '角色管理', path: '/system/roles' },
          { key: 'menu', label: '菜单管理', path: '/system/menus' },
          { key: 'dictionary', label: '数据字典', path: '/system/dictionaries' },
          { key: 'approval_flow', label: '审批流配置', path: '/system/approval-flows' },
        ],
      },
      {
        key: 'platform_rule',
        label: '平台规则',
        children: [
          { key: 'policy_content', label: '规则/政策展示', path: '/rule/policy-content' },
          { key: 'tip_config', label: '小费标准管理', path: '/rule/tip' },
          { key: 'order_validity_rule', label: '订单有效期规则', path: '/rule/order-validity' },
          { key: 'warning_rule', label: '预警规则', path: '/rule/warning' },
          { key: 'close_rule', label: '订单取消规则管理', path: '/rule/close' },
        ],
      },
      {
        key: 'customer_account',
        label: '客户与账号',
        children: [
          { key: 'customer_profile', label: '客户档案', path: '/customer/profiles' },
          { key: 'user_center', label: '用户中心', path: '/user-management' },
        ],
      },
    ],
  },
  {
    key: 'finance',
    label: '财务与报表',
    groups: [
      {
        key: 'finance',
        label: '财务管理',
        children: [
          { key: 'reconciliation', label: '对账批次', path: '/finance/reconciliations' },
          { key: 'supplementary_payment', label: '补款单管理', path: '/finance/supplementary-payments' },
        ],
      },
      {
        key: 'report',
        label: '报表中心',
        children: [
          { key: 'data_report', label: '数据报表', path: '/report/data-reports' },
          { key: 'rebate_order_statistics', label: '返利订单统计', path: '/report/rebate-orders' },
        ],
      },
    ],
  },
]

export function isMenuPathMatch(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function findModuleByPath(pathname: string): AdminModule {
  const matched = adminModules.find((mod) =>
    mod.groups.some((group) => group.children.some((leaf) => isMenuPathMatch(pathname, leaf.path))),
  )
  return matched || adminModules[0]
}

export function firstLeafPath(mod: AdminModule) {
  return mod.groups[0]?.children[0]?.path || '/voyage/list'
}

export function findGroupKeyByPath(mod: AdminModule, pathname: string) {
  const group = mod.groups.find((g) => g.children.some((leaf) => isMenuPathMatch(pathname, leaf.path)))
  return group?.key
}
