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
  { value: 'port_manager', label: '港口管理员' },
  { value: 'ship_captain', label: '船长' },
  { value: 'ticket_agent', label: '票务员' },
  { value: 'viewer', label: '普通用户' },
]
