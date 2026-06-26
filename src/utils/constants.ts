// ========== 常量定义 ==========

export const PROVINCES = [
  '北京', '天津', '上海', '重庆',
  '河北', '山西', '辽宁', '吉林', '黑龙江',
  '江苏', '浙江', '安徽', '福建', '江西', '山东',
  '河南', '湖北', '湖南', '广东', '广西', '海南',
  '四川', '贵州', '云南', '西藏',
  '陕西', '甘肃', '青海', '宁夏', '新疆',
  '香港', '澳门', '台湾',
]

export const CITIES_BY_PROVINCE: Record<string, string[]> = {
  '辽宁': ['大连', '营口', '锦州', '丹东', '葫芦岛'],
  '天津': ['天津'],
  '河北': ['秦皇岛', '唐山', '沧州'],
  '山东': ['青岛', '烟台', '威海', '日照', '东营'],
  '上海': ['上海'],
  '江苏': ['连云港', '南京', '苏州', '南通', '镇江'],
  '浙江': ['宁波', '舟山', '温州', '台州', '嘉兴'],
  '福建': ['厦门', '福州', '泉州', '漳州', '莆田'],
  '广东': ['广州', '深圳', '珠海', '汕头', '湛江'],
  '广西': ['北海', '防城港', '钦州'],
  '海南': ['海口', '三亚', '洋浦'],
  '重庆': ['重庆'],
  '湖北': ['武汉', '宜昌', '荆州', '黄石'],
  '湖南': ['岳阳', '长沙'],
  '江西': ['九江', '南昌'],
  '安徽': ['芜湖', '安庆', '马鞍山'],
  '北京': ['北京'],
}

export const ROUTE_TYPES = [
  { value: 'upstream', label: '上水' },
  { value: 'downstream', label: '下水' },
]

export const MENU_TYPES = [
  { value: 'menu', label: '菜单' },
  { value: 'button', label: '按钮' },
]

export const ROLE_OPTIONS = [
  { value: 'system_admin', label: '系统管理员' },
  { value: 'operation_manager', label: '运营经理' },
  { value: 'route_planner', label: '航线规划师' },
  { value: 'port_manager', label: '码头管理员' },
  { value: 'ship_captain', label: '船长' },
  { value: 'ticket_agent', label: '票务员' },
  { value: 'viewer', label: '普通用户' },
]

export type MarketCategoryParent = '内宾' | '外宾'

export interface MarketCategoryOption {
  value: string
  label: string
  parent: MarketCategoryParent
}

export const MARKET_CATEGORY_GROUPS: MarketCategoryParent[] = ['内宾', '外宾']

export const MARKET_CATEGORY_OPTIONS: MarketCategoryOption[] = [
  { value: 'domestic_wushan', label: '内宾-巫山县', parent: '内宾' },
  { value: 'domestic_fengjie', label: '内宾-奉节县', parent: '内宾' },
  { value: 'domestic_yunyang', label: '内宾-云阳县', parent: '内宾' },
  { value: 'foreign_japan', label: '外宾-日本', parent: '外宾' },
  { value: 'foreign_usa', label: '外宾-美国', parent: '外宾' },
]

export const DEFAULT_MARKET_CATEGORY = MARKET_CATEGORY_OPTIONS[0].value

export function getMarketCategoryLabel(value: string) {
  return MARKET_CATEGORY_OPTIONS.find((item) => item.value === value)?.label || value || '-'
}

/** 入住人国籍选项（与下单游客信息一致） */
export const NATIONALITY_OPTIONS = [
  '中国',
  '日本',
  '美国',
  '韩国',
  '英国',
  '法国',
  '德国',
  '澳大利亚',
  '加拿大',
  '新加坡',
  '马来西亚',
  '泰国',
  '俄罗斯',
  '阿富汗',
] as const
