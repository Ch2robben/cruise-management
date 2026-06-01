import type { Port, Attraction, Route, RouteStop, User, Role, Menu, Dictionary, DashboardData, Ship, Product, ProductSegment, PricingRow } from '@/types'
import type {
  Dealer,
  DealerChannelType,
  DealerLevel,
  DealerPriceSystem,
  DealerRebateCycle,
  DealerRebateDimension,
  DealerRefundPermission,
  DealerSettlementCycle,
  CabinHold,
  CabinHoldStatus,
  CharterBillingType,
  CharterFeeItem,
  CharterOrder,
  CharterOrderStatus,
  CharterReservationType,
  CharterSettlementType,
  CharterTraveler,
  ComplaintPriority,
  ComplaintRecord,
  ComplaintTicket,
  ComplaintStatus,
  ComplaintType,
  CustomerLevel,
  CustomerProfile,
  CustomerSourceChannel,
  DataReportEntry,
  MarketingCampaign,
  CampaignDiscountMode,
  CampaignStackingRule,
  CampaignStatus,
  CampaignType,
  ReconciliationBatch,
  ReconciliationChannelType,
  ReconciliationDiffType,
  ReconciliationDifference,
  ReconciliationStatus,
  ReportCategory,
  ReportPeriod,
} from '@/types'

// ===================== 港口数据 =====================
export const ports: Port[] = [
  { id: 'p01', name: '大连港', nameEn: 'Dalian Port', code: 'DLC', city: '大连', province: '辽宁', sort: 1, piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-15 09:30:00',  createdAt: '2025-01-10 08:00:00' },
  { id: 'p02', name: '天津港', nameEn: 'Tianjin Port', code: 'TSN', city: '天津', province: '天津', sort: 2, piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-14 14:20:00',  createdAt: '2025-01-10 08:00:00' },
  { id: 'p03', name: '青岛港', nameEn: 'Qingdao Port', code: 'TAO', city: '青岛', province: '山东', sort: 3, piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-13 11:00:00',  createdAt: '2025-01-10 08:00:00' },
  { id: 'p04', name: '上海港', nameEn: 'Shanghai Port', code: 'SHA', city: '上海', province: '上海', sort: 4, piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-12 16:45:00',  createdAt: '2025-01-12 09:00:00' },
  { id: 'p05', name: '宁波港', nameEn: 'Ningbo Port', code: 'NGB', city: '宁波', province: '浙江', sort: 5, piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-11 10:30:00',  createdAt: '2025-01-12 09:00:00' },
  { id: 'p06', name: '厦门港', nameEn: 'Xiamen Port', code: 'XMN', city: '厦门', province: '福建', sort: 6, piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-10 08:15:00',  createdAt: '2025-01-15 10:00:00' },
  { id: 'p07', name: '广州港', nameEn: 'Guangzhou Port', code: 'CAN', city: '广州', province: '广东', sort: 7, piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-09 13:00:00',  createdAt: '2025-01-15 10:00:00' },
  { id: 'p08', name: '深圳港', nameEn: 'Shenzhen Port', code: 'SZX', city: '深圳', province: '广东', sort: 8, piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-08 15:30:00',  createdAt: '2025-01-18 08:30:00' },
  { id: 'p09', name: '三亚港', nameEn: 'Sanya Port', code: 'SYX', city: '三亚', province: '海南', sort: 9, piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-07 09:45:00',  createdAt: '2025-01-18 08:30:00' },
  { id: 'p10', name: '重庆港', nameEn: 'Chongqing Port', code: 'CKG', city: '重庆', province: '重庆', sort: 10, piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-06 11:20:00',  createdAt: '2025-01-20 09:00:00' },
  { id: 'p11', name: '武汉港', nameEn: 'Wuhan Port', code: 'WUH', city: '武汉', province: '湖北', sort: 11, piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-05 14:00:00',  createdAt: '2025-01-20 09:00:00' },
  { id: 'p12', name: '南京港', nameEn: 'Nanjing Port', code: 'NKG', city: '南京', province: '江苏', sort: 12, piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-04 10:10:00',  createdAt: '2025-01-22 08:00:00' },
  { id: 'p13', name: '烟台港', nameEn: 'Yantai Port', code: 'YNT', city: '烟台', province: '山东', sort: 13, piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-03 16:30:00',  createdAt: '2025-01-22 08:00:00' },
  { id: 'p14', name: '秦皇岛港', nameEn: 'Qinhuangdao Port', code: 'QHD', city: '秦皇岛', province: '河北', sort: 14, piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-02 08:45:00',  createdAt: '2025-01-25 09:00:00' },
  { id: 'p15', name: '宜昌港', nameEn: 'Yichang Port', code: 'YIH', city: '宜昌', province: '湖北', sort: 15, piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-01 12:00:00',  createdAt: '2025-01-25 09:00:00' },
  { id: 'p16', name: '九江港', nameEn: 'Jiujiang Port', code: 'JIU', city: '九江', province: '江西', sort: 16, piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-03-30 09:30:00',  createdAt: '2025-02-01 08:00:00' },
  { id: 'p17', name: '岳阳港', nameEn: 'Yueyang Port', code: 'YYG', city: '岳阳', province: '湖南', sort: 17, piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-03-29 14:20:00',  createdAt: '2025-02-01 08:00:00' },
  { id: 'p18', name: '北海港', nameEn: 'Beihai Port', code: 'BHY', city: '北海', province: '广西', sort: 18, piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-03-28 11:00:00',  createdAt: '2025-02-05 09:00:00' },
  { id: 'p19', name: '珠海港', nameEn: 'Zhuhai Port', code: 'ZUH', city: '珠海', province: '广东', sort: 19, piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-03-27 15:45:00',  createdAt: '2025-02-05 09:00:00' },
  { id: 'p20', name: '温州港', nameEn: 'Wenzhou Port', code: 'WNZ', city: '温州', province: '浙江', sort: 20, piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-03-26 10:30:00',  createdAt: '2025-02-08 08:00:00' },
]


// ===================== 码头数据 =====================
export const piers: import('@/types').Pier[] = [
  { id: 'pr01', portId: 'p01', name: 'p01_观光码头', nameEn: '观光码头 #1', position: '一码头', sort: 1 },
  { id: 'pr02', portId: 'p01', name: 'p01_滚装码头', nameEn: '滚装码头 #2', position: '二码头', sort: 2 },
  { id: 'pr03', portId: 'p01', name: 'p01_货运码头', nameEn: '货运码头 #3', position: '三码头', sort: 3 },
  { id: 'pr04', portId: 'p02', name: 'p02_集装箱码头', nameEn: '集装箱码头 #1', position: '一码头', sort: 1 },
  { id: 'pr05', portId: 'p02', name: 'p02_观光码头', nameEn: '观光码头 #2', position: '二码头', sort: 2 },
  { id: 'pr06', portId: 'p02', name: 'p02_货运码头', nameEn: '货运码头 #3', position: '三码头', sort: 3 },
  { id: 'pr07', portId: 'p03', name: 'p03_集装箱码头', nameEn: '集装箱码头 #1', position: '一码头', sort: 1 },
  { id: 'pr08', portId: 'p04', name: 'p04_游艇码头', nameEn: '游艇码头 #1', position: '一码头', sort: 1 },
  { id: 'pr09', portId: 'p04', name: 'p04_散货码头', nameEn: '散货码头 #2', position: '二码头', sort: 2 },
  { id: 'pr10', portId: 'p05', name: 'p05_散货码头', nameEn: '散货码头 #1', position: '一码头', sort: 1 },
  { id: 'pr11', portId: 'p05', name: 'p05_集装箱码头', nameEn: '集装箱码头 #2', position: '二码头', sort: 2 },
  { id: 'pr12', portId: 'p05', name: 'p05_货运码头', nameEn: '货运码头 #3', position: '三码头', sort: 3 },
  { id: 'pr13', portId: 'p06', name: 'p06_游艇码头', nameEn: '游艇码头 #1', position: '一码头', sort: 1 },
  { id: 'pr14', portId: 'p06', name: 'p06_邮轮码头', nameEn: '邮轮码头 #2', position: '二码头', sort: 2 },
  { id: 'pr15', portId: 'p07', name: 'p07_集装箱码头', nameEn: '集装箱码头 #1', position: '一码头', sort: 1 },
  { id: 'pr16', portId: 'p07', name: 'p07_散货码头', nameEn: '散货码头 #2', position: '二码头', sort: 2 },
  { id: 'pr17', portId: 'p08', name: 'p08_集装箱码头', nameEn: '集装箱码头 #1', position: '一码头', sort: 1 },
  { id: 'pr18', portId: 'p08', name: 'p08_客运码头', nameEn: '客运码头 #2', position: '二码头', sort: 2 },
  { id: 'pr19', portId: 'p09', name: 'p09_邮轮码头', nameEn: '邮轮码头 #1', position: '一码头', sort: 1 },
  { id: 'pr20', portId: 'p09', name: 'p09_观光码头', nameEn: '观光码头 #2', position: '二码头', sort: 2 },
  { id: 'pr21', portId: 'p09', name: 'p09_滚装码头', nameEn: '滚装码头 #3', position: '三码头', sort: 3 },
  { id: 'pr22', portId: 'p10', name: 'p10_客运码头', nameEn: '客运码头 #1', position: '一码头', sort: 1 },
  { id: 'pr23', portId: 'p10', name: 'p10_集装箱码头', nameEn: '集装箱码头 #2', position: '二码头', sort: 2 },
  { id: 'pr24', portId: 'p11', name: 'p11_集装箱码头', nameEn: '集装箱码头 #1', position: '一码头', sort: 1 },
  { id: 'pr25', portId: 'p12', name: 'p12_散货码头', nameEn: '散货码头 #1', position: '一码头', sort: 1 },
  { id: 'pr26', portId: 'p13', name: 'p13_货运码头', nameEn: '货运码头 #1', position: '一码头', sort: 1 },
  { id: 'pr27', portId: 'p14', name: 'p14_邮轮码头', nameEn: '邮轮码头 #1', position: '一码头', sort: 1 },
  { id: 'pr28', portId: 'p15', name: 'p15_客运码头', nameEn: '客运码头 #1', position: '一码头', sort: 1 },
  { id: 'pr29', portId: 'p15', name: 'p15_滚装码头', nameEn: '滚装码头 #2', position: '二码头', sort: 2 },
  { id: 'pr30', portId: 'p15', name: 'p15_游艇码头', nameEn: '游艇码头 #3', position: '三码头', sort: 3 },
  { id: 'pr31', portId: 'p16', name: 'p16_观光码头', nameEn: '观光码头 #1', position: '一码头', sort: 1 },
  { id: 'pr32', portId: 'p16', name: 'p16_客运码头', nameEn: '客运码头 #2', position: '二码头', sort: 2 },
  { id: 'pr33', portId: 'p16', name: 'p16_邮轮码头', nameEn: '邮轮码头 #3', position: '三码头', sort: 3 },
  { id: 'pr34', portId: 'p17', name: 'p17_散货码头', nameEn: '散货码头 #1', position: '一码头', sort: 1 },
  { id: 'pr35', portId: 'p17', name: 'p17_货运码头', nameEn: '货运码头 #2', position: '二码头', sort: 2 },
  { id: 'pr36', portId: 'p18', name: 'p18_滚装码头', nameEn: '滚装码头 #1', position: '一码头', sort: 1 },
  { id: 'pr37', portId: 'p18', name: 'p18_散货码头', nameEn: '散货码头 #2', position: '二码头', sort: 2 },
  { id: 'pr38', portId: 'p18', name: 'p18_散货码头', nameEn: '散货码头 #3', position: '三码头', sort: 3 },
  { id: 'pr39', portId: 'p19', name: 'p19_散货码头', nameEn: '散货码头 #1', position: '一码头', sort: 1 },
  { id: 'pr40', portId: 'p20', name: 'p20_滚装码头', nameEn: '滚装码头 #1', position: '一码头', sort: 1 },
  { id: 'pr41', portId: 'p20', name: 'p20_客运码头', nameEn: '客运码头 #2', position: '二码头', sort: 2 },
]

// ===================== 景点数据 =====================
export const attractions: Attraction[] = [
  { id: 'a01', name: '星海广场', nameEn: 'Xinghai Square', portId: 'p01', portName: '大连港', city: '大连', visitDuration: '5-10月', description: '亚洲最大的城市广场，位于大连市沙河口区，是大连市的标志性建筑之一。广场占地面积110万平方米，中心广场面积4.5万平方米，设有大型音乐喷泉，周围环绕着现代建筑群，是游客必到的打卡地。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-10 09:00:00',  createdAt: '2025-02-10 08:00:00' },
  { id: 'a02', name: '天津之眼', nameEn: 'Tianjin Eye', portId: 'p02', portName: '天津港', city: '天津', visitDuration: '4-10月', description: '世界上唯一建在桥上的摩天轮，坐落在天津市红桥区海河畔，直径110米，最高点达120米，可俯瞰整个天津城市风光和海河美景，是天津的地标性建筑。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-09 10:00:00',  createdAt: '2025-02-10 08:00:00' },
  { id: 'a03', name: '崂山风景区', nameEn: 'Laoshan Scenic Area', portId: 'p03', portName: '青岛港', city: '青岛', visitDuration: '4-11月', description: '中国海岸线第一高峰，素有"海上第一名山"之称。主峰巨峰海拔1132.7米，山海相连，云雾缭绕，道教文化深厚，太清宫为道教全真派天下第二丛林。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-08 11:00:00',  createdAt: '2025-02-12 09:00:00' },
  { id: 'a04', name: '外滩', nameEn: 'The Bund', portId: 'p04', portName: '上海港', city: '上海', visitDuration: '全年', description: '上海最著名的城市名片，位于黄浦江畔，长1.5公里的滨江大道上汇聚了52幢风格迥异的古典复兴大楼，被誉为"万国建筑博览群"，对岸是陆家嘴金融区的现代摩天大楼群。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-07 14:00:00',  createdAt: '2025-02-12 09:00:00' },
  { id: 'a05', name: '普陀山', nameEn: 'Mount Putuo', portId: 'p05', portName: '宁波港', city: '宁波', visitDuration: '4-11月', description: '中国佛教四大名山之一，观音菩萨道场。位于舟山群岛东部海域，面积12.5平方公里，拥有普济寺、法雨寺、慧济寺三大寺和紫竹林、南海观音像等著名景点。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-06 08:30:00',  createdAt: '2025-02-15 08:00:00' },
  { id: 'a06', name: '鼓浪屿', nameEn: 'Gulangyu Island', portId: 'p06', portName: '厦门港', city: '厦门', visitDuration: '3-5月, 10-11月', description: '世界文化遗产，面积1.87平方公里，素有"海上花园"之称。岛上保留了大量中西合璧的历史建筑，钢琴博物馆、郑成功纪念馆、日光岩等景点闻名遐迩，全岛禁止机动车通行。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-05 15:00:00',  createdAt: '2025-02-15 08:00:00' },
  { id: 'a07', name: '珠江夜游', nameEn: 'Pearl River Night Cruise', portId: 'p07', portName: '广州港', city: '广州', visitDuration: '全年', description: '广州最具特色的旅游项目之一，沿珠江两岸可欣赏广州塔、海心沙、二沙岛、星海音乐厅等标志性建筑，夜晚灯火辉煌，游船穿梭于珠江之上，尽显羊城魅力。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-04 09:15:00',  createdAt: '2025-02-18 09:00:00' },
  { id: 'a08', name: '世界之窗', nameEn: 'Window of the World', portId: 'p08', portName: '深圳港', city: '深圳', visitDuration: '10-5月', description: '大型文化旅游景区，占地48万平方米，汇集了世界奇观、历史遗迹、古今名胜、自然风光等微缩景观，包括埃菲尔铁塔、金字塔、尼亚加拉瀑布等130多个景点。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-03 11:30:00',  createdAt: '2025-02-18 09:00:00' },
  { id: 'a09', name: '天涯海角', nameEn: 'Tianya Haijiao', portId: 'p09', portName: '三亚港', city: '三亚', visitDuration: '10-4月', description: '三亚最著名的风景区之一，位于三亚市天涯区，以"天涯"、"海角"两块巨石闻名。碧海蓝天，椰风海韵，是海南岛标志性的热带海滨风光代表。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-02 14:45:00',  createdAt: '2025-02-20 08:00:00' },
  { id: 'a10', name: '洪崖洞', nameEn: 'Hongya Cave', portId: 'p10', portName: '重庆港', city: '重庆', visitDuration: '3-5月, 9-11月', description: '重庆最具代表性的传统建筑群，依山而建的吊脚楼群沿嘉陵江分布，共11层，集餐饮、娱乐、休闲、购物于一体。夜晚灯火璀璨，被誉为现实版的"千与千寻"。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-01 10:00:00',  createdAt: '2025-02-20 08:00:00' },
  { id: 'a11', name: '黄鹤楼', nameEn: 'Yellow Crane Tower', portId: 'p11', portName: '武汉港', city: '武汉', visitDuration: '3-5月, 9-11月', description: '中国四大名楼之一，位于武汉市武昌区蛇山之巅，始建于三国时期吴黄武二年，屡毁屡建。现楼为1985年重建，高51.4米，登楼可俯瞰武汉三镇和长江大桥。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-03-31 08:30:00',  createdAt: '2025-02-22 09:00:00' },
  { id: 'a12', name: '中山陵', nameEn: 'Sun Yat-sen Mausoleum', portId: 'p12', portName: '南京港', city: '南京', visitDuration: '4-11月', description: '孙中山先生的陵寝，位于南京市玄武区紫金山南麓，占地8万余平方米。陵园依山势而建，392级台阶象征当时3.92亿同胞，整体建筑庄严雄伟，是中国近代建筑史上的杰作。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-03-30 13:00:00',  createdAt: '2025-02-22 09:00:00' },
  { id: 'a13', name: '蓬莱阁', nameEn: 'Penglai Pavilion', portId: 'p13', portName: '烟台港', city: '烟台', visitDuration: '5-10月', description: '中国四大名楼之一，位于烟台蓬莱区丹崖山上，始建于北宋嘉祐六年。蓬莱阁与八仙过海传说密切相关，下临大海，常有海市蜃楼奇观出现，被誉为"人间仙境"。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-03-29 09:00:00',  createdAt: '2025-02-25 08:00:00' },
  { id: 'a14', name: '山海关', nameEn: 'Shanhai Pass', portId: 'p14', portName: '秦皇岛港', city: '秦皇岛', visitDuration: '5-10月', description: '明长城东部起点，有"天下第一关"之称，位于秦皇岛市东北15公里处。山海关城楼雄伟壮观，与万里之外的嘉峪关遥相呼应，是明长城最精华的关隘之一。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-03-28 15:30:00',  createdAt: '2025-02-25 08:00:00' },
  { id: 'a15', name: '三峡大坝', nameEn: 'Three Gorges Dam', portId: 'p15', portName: '宜昌港', city: '宜昌', visitDuration: '4-10月', description: '世界最大的水利枢纽工程，位于湖北省宜昌市三斗坪镇，全长2309米，坝高185米。坛子岭可俯瞰大坝全景，185平台可近距离感受大坝的宏伟气势，截流纪念园记录建设历程。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-03-27 10:45:00',  createdAt: '2025-02-28 09:00:00' },
  { id: 'a16', name: '庐山', nameEn: 'Mount Lu', portId: 'p16', portName: '九江港', city: '九江', visitDuration: '5-10月', description: '世界文化景观遗产，位于九江市南部，主峰汉阳峰海拔1474米。以雄、奇、险、秀闻名，有"匡庐奇秀甲天下"之誉，三叠泉瀑布落差155米，为庐山第一奇观。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-03-26 08:00:00',  createdAt: '2025-02-28 09:00:00' },
  { id: 'a17', name: '岳阳楼', nameEn: 'Yueyang Tower', portId: 'p17', portName: '岳阳港', city: '岳阳', visitDuration: '4-11月', description: '中国四大名楼之一，位于岳阳市洞庭湖畔，始建于东汉末年。范仲淹《岳阳楼记》中的"先天下之忧而忧，后天下之乐而乐"使其名扬天下，登楼可远眺洞庭湖壮美风光。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-03-25 11:30:00',  createdAt: '2025-03-02 08:00:00' },
  { id: 'a18', name: '涠洲岛', nameEn: 'Weizhou Island', portId: 'p18', portName: '北海港', city: '北海', visitDuration: '4-11月', description: '中国最大最年轻的火山岛，位于北海市南部海域，面积24.74平方公里。岛上火山地貌奇特，鳄鱼山景区可看到完整的火山口，五彩滩的日出美不胜收，天主教堂为百年法式哥特建筑。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-03-24 14:00:00',  createdAt: '2025-03-02 08:00:00' },
  { id: 'a19', name: '长隆海洋王国', nameEn: 'Chimelong Ocean Kingdom', portId: 'p19', portName: '珠海港', city: '珠海', visitDuration: '全年', description: '世界最大的海洋主题乐园，位于横琴新区，拥有八大主题区，鲸鲨馆保有世界最大水族箱，企鹅馆、北极熊馆、海豚剧场等深受游客喜爱，夜间的烟花表演更是精彩绝伦。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-03-23 09:15:00',  createdAt: '2025-03-05 09:00:00' },
  { id: 'a20', name: '雁荡山', nameEn: 'Yandang Mountain', portId: 'p20', portName: '温州港', city: '温州', visitDuration: '4-11月', description: '世界地质公园，以奇峰怪石、飞瀑流泉、古洞石室著称，灵峰、灵岩、大龙湫为"雁荡三绝"。大龙湫瀑布落差197米，为"中国瀑布之冠"，夜色中的灵峰剪影更是别具韵味。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-03-22 16:30:00',  createdAt: '2025-03-05 09:00:00' },
]

// ===================== 航线数据 =====================
const makeStops = (stops: Omit<RouteStop, 'id'>[]): RouteStop[] =>
  stops.map((s, i) => ({ ...s, id: `rs${i + 1}` }))

export const routes: Route[] = [
  {
    id: 'r01', code: 'CJ-SX-001', name: '重庆-宜昌三峡航线（下水）', type: 'downstream',
    days: 4, nights: 3, ports: '重庆-丰都-奉节-宜昌', duration: '4天3晚',
    stops: makeStops([
      { portId: 'p10', portName: '重庆港', day: 0, pierId: '', pierName: '', sailTime: '20:00', distance: 0, type: 'start' },
      { portId: '', portName: '丰都', day: 1, pierId: '', pierName: '丰都码头', sailTime: '12:00', distance: 120, type: 'middle' },
      { portId: '', portName: '奉节', day: 2, pierId: '', pierName: '奉节码头', sailTime: '14:00', distance: 85, type: 'middle' },
      { portId: 'p15', portName: '宜昌港', day: 4, pierId: '', pierName: '', sailTime: '', distance: 105, type: 'end' },
    ]),
    image: '', remark: '经典三峡下水航线，途经丰都鬼城、白帝城、三峡大坝',
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-15 10:00:00',  createdAt: '2025-03-10 08:00:00',
  },
  {
    id: 'r02', code: 'CJ-SX-002', name: '宜昌-重庆三峡航线（上水）', type: 'upstream',
    days: 5, nights: 4, ports: '宜昌-奉节-丰都-重庆', duration: '5天4晚',
    stops: makeStops([
      { portId: 'p15', portName: '宜昌港', day: 0, pierId: '', pierName: '', sailTime: '18:00', distance: 0, type: 'start' },
      { portId: '', portName: '奉节', day: 2, pierId: '', pierName: '奉节码头', sailTime: '18:00', distance: 160, type: 'middle' },
      { portId: '', portName: '丰都', day: 3, pierId: '', pierName: '丰都码头', sailTime: '13:00', distance: 85, type: 'middle' },
      { portId: 'p10', portName: '重庆港', day: 5, pierId: '', pierName: '', sailTime: '', distance: 120, type: 'end' },
    ]),
    image: '', remark: '三峡上水航线，慢游三峡，深度体验巴渝文化',
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-14 09:00:00',  createdAt: '2025-03-10 08:00:00',
  },
  {
    id: 'r03', code: 'HD-QL-001', name: '青岛-大连-天津环渤海航线', type: 'downstream',
    days: 5, nights: 4, ports: '青岛-烟台-大连-天津', duration: '5天4晚',
    stops: makeStops([
      { portId: 'p03', portName: '青岛港', day: 0, pierId: '', pierName: '', sailTime: '17:00', distance: 0, type: 'start' },
      { portId: 'p13', portName: '烟台港', day: 1, pierId: '', pierName: '', sailTime: '17:00', distance: 85, type: 'middle' },
      { portId: 'p01', portName: '大连港', day: 2, pierId: '', pierName: '', sailTime: '18:00', distance: 95, type: 'middle' },
      { portId: 'p02', portName: '天津港', day: 4, pierId: '', pierName: '', sailTime: '', distance: 165, type: 'end' },
    ]),
    image: '', remark: '环渤海精品航线，串联北方重要港口城市',
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-13 11:00:00',  createdAt: '2025-03-12 09:00:00',
  },
  {
    id: 'r04', code: 'HD-HH-001', name: '上海-宁波-厦门-深圳东南沿海航线', type: 'downstream',
    days: 6, nights: 5, ports: '上海-宁波-温州-厦门-深圳', duration: '6天5晚',
    stops: makeStops([
      { portId: 'p04', portName: '上海港', day: 0, pierId: '', pierName: '', sailTime: '16:00', distance: 0, type: 'start' },
      { portId: 'p05', portName: '宁波港', day: 1, pierId: '', pierName: '', sailTime: '18:00', distance: 135, type: 'middle' },
      { portId: 'p20', portName: '温州港', day: 2, pierId: '', pierName: '', sailTime: '16:00', distance: 120, type: 'middle' },
      { portId: 'p06', portName: '厦门港', day: 3, pierId: '', pierName: '', sailTime: '20:00', distance: 175, type: 'middle' },
      { portId: 'p08', portName: '深圳港', day: 5, pierId: '', pierName: '', sailTime: '', distance: 220, type: 'end' },
    ]),
    image: '', remark: '东南沿海黄金航线，串联长三角与珠三角',
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-12 14:00:00',  createdAt: '2025-03-15 08:00:00',
  },
  {
    id: 'r05', code: 'HN-NH-001', name: '海口-三亚-北海南海航线', type: 'downstream',
    days: 4, nights: 3, ports: '海口-三亚-北海', duration: '4天3晚',
    stops: makeStops([
      { portId: '', portName: '海口港', day: 0, pierId: '', pierName: '', sailTime: '19:00', distance: 0, type: 'start' },
      { portId: 'p09', portName: '三亚港', day: 2, pierId: '', pierName: '', sailTime: '17:00', distance: 180, type: 'middle' },
      { portId: 'p18', portName: '北海港', day: 4, pierId: '', pierName: '', sailTime: '', distance: 160, type: 'end' },
    ]),
    image: '', remark: '南国热带风情航线，尽享阳光沙滩',
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-11 08:30:00',  createdAt: '2025-03-18 09:00:00',
  },
  {
    id: 'r06', code: 'CJ-ZX-001', name: '武汉-九江-南京-上海长江中下游航线', type: 'downstream',
    days: 7, nights: 6, ports: '武汉-九江-芜湖-南京-上海', duration: '7天6晚',
    stops: makeStops([
      { portId: 'p11', portName: '武汉港', day: 0, pierId: '', pierName: '', sailTime: '18:00', distance: 0, type: 'start' },
      { portId: 'p16', portName: '九江港', day: 2, pierId: '', pierName: '', sailTime: '14:00', distance: 180, type: 'middle' },
      { portId: '', portName: '芜湖港', day: 4, pierId: '', pierName: '', sailTime: '16:00', distance: 155, type: 'middle' },
      { portId: 'p12', portName: '南京港', day: 5, pierId: '', pierName: '', sailTime: '20:00', distance: 110, type: 'middle' },
      { portId: 'p04', portName: '上海港', day: 7, pierId: '', pierName: '', sailTime: '', distance: 200, type: 'end' },
    ]),
    image: '', remark: '长江中下游全景航线，领略江南水乡与都市繁华',
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-10 15:00:00',  createdAt: '2025-03-20 08:00:00',
  },
  {
    id: 'r07', code: 'DB-DH-001', name: '大连-烟台-威海-青岛东北亚航线', type: 'downstream',
    days: 5, nights: 4, ports: '大连-烟台-威海-青岛', duration: '5天4晚',
    stops: makeStops([
      { portId: 'p01', portName: '大连港', day: 0, pierId: '', pierName: '', sailTime: '17:00', distance: 0, type: 'start' },
      { portId: 'p13', portName: '烟台港', day: 1, pierId: '', pierName: '', sailTime: '17:00', distance: 85, type: 'middle' },
      { portId: '', portName: '威海港', day: 2, pierId: '', pierName: '', sailTime: '16:00', distance: 55, type: 'middle' },
      { portId: 'p03', portName: '青岛港', day: 4, pierId: '', pierName: '', sailTime: '', distance: 130, type: 'end' },
    ]),
    image: '', remark: '山东半岛+辽东半岛精华航线',
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-09 10:30:00',  createdAt: '2025-03-22 09:00:00',
  },
  {
    id: 'r08', code: 'ZS-NH-001', name: '广州-珠海-深圳珠三角航线', type: 'downstream',
    days: 3, nights: 2, ports: '广州-珠海-深圳', duration: '3天2晚',
    stops: makeStops([
      { portId: 'p07', portName: '广州港', day: 0, pierId: '', pierName: '', sailTime: '18:00', distance: 0, type: 'start' },
      { portId: 'p19', portName: '珠海港', day: 1, pierId: '', pierName: '', sailTime: '17:00', distance: 75, type: 'middle' },
      { portId: 'p08', portName: '深圳港', day: 3, pierId: '', pierName: '', sailTime: '', distance: 50, type: 'end' },
    ]),
    image: '', remark: '珠三角大湾区精品短途航线',
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-08 09:00:00',  createdAt: '2025-03-25 08:00:00',
  },
  {
    id: 'r09', code: 'CJ-ZX-002', name: '上海-南京-武汉长江中游上水航线', type: 'upstream',
    days: 6, nights: 5, ports: '上海-南京-九江-武汉', duration: '6天5晚',
    stops: makeStops([
      { portId: 'p04', portName: '上海港', day: 0, pierId: '', pierName: '', sailTime: '17:00', distance: 0, type: 'start' },
      { portId: 'p12', portName: '南京港', day: 2, pierId: '', pierName: '', sailTime: '20:00', distance: 180, type: 'middle' },
      { portId: 'p16', portName: '九江港', day: 4, pierId: '', pierName: '', sailTime: '16:00', distance: 210, type: 'middle' },
      { portId: 'p11', portName: '武汉港', day: 6, pierId: '', pierName: '', sailTime: '', distance: 155, type: 'end' },
    ]),
    image: '', remark: '长江中游上水航线，慢节奏感受江南古韵',
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-07 11:00:00',  createdAt: '2025-03-28 09:00:00',
  },
  {
    id: 'r10', code: 'YN-BH-001', name: '北海-三亚-广州-厦门南海东海连线', type: 'upstream',
    days: 7, nights: 6, ports: '北海-三亚-广州-深圳-厦门', duration: '7天6晚',
    stops: makeStops([
      { portId: 'p18', portName: '北海港', day: 0, pierId: '', pierName: '', sailTime: '16:00', distance: 0, type: 'start' },
      { portId: 'p09', portName: '三亚港', day: 2, pierId: '', pierName: '', sailTime: '18:00', distance: 160, type: 'middle' },
      { portId: 'p07', portName: '广州港', day: 4, pierId: '', pierName: '', sailTime: '20:00', distance: 240, type: 'middle' },
      { portId: 'p08', portName: '深圳港', day: 5, pierId: '', pierName: '', sailTime: '16:00', distance: 50, type: 'middle' },
      { portId: 'p06', portName: '厦门港', day: 7, pierId: '', pierName: '', sailTime: '', distance: 220, type: 'end' },
    ]),
    image: '', remark: '南海到东海全景连线，一路向北看遍南国风光',
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-06 14:30:00',  createdAt: '2025-04-01 08:00:00',
  },
  {
    id: 'r11', code: 'CJ-SX-003', name: '重庆-宜昌-武汉-九江-南京-上海长江全线下水', type: 'downstream',
    days: 11, nights: 10, ports: '重庆-宜昌-岳阳-武汉-九江-南京-上海', duration: '11天10晚',
    stops: makeStops([
      { portId: 'p10', portName: '重庆港', day: 0, pierId: '', pierName: '', sailTime: '20:00', distance: 0, type: 'start' },
      { portId: 'p15', portName: '宜昌港', day: 3, pierId: '', pierName: '', sailTime: '14:00', distance: 310, type: 'middle' },
      { portId: 'p17', portName: '岳阳港', day: 5, pierId: '', pierName: '', sailTime: '15:00', distance: 195, type: 'middle' },
      { portId: 'p11', portName: '武汉港', day: 6, pierId: '', pierName: '', sailTime: '18:00', distance: 140, type: 'middle' },
      { portId: 'p16', portName: '九江港', day: 7, pierId: '', pierName: '', sailTime: '20:00', distance: 130, type: 'middle' },
      { portId: 'p12', portName: '南京港', day: 9, pierId: '', pierName: '', sailTime: '16:00', distance: 220, type: 'middle' },
      { portId: 'p04', portName: '上海港', day: 11, pierId: '', pierName: '', sailTime: '', distance: 200, type: 'end' },
    ]),
    image: '', remark: '万里长江全线下水航线，从山城到魔都的史诗之旅',
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-05 08:00:00',  createdAt: '2025-04-05 09:00:00',
  },
  {
    id: 'r12', code: 'BH-HW-001', name: '天津-秦皇岛-大连-烟台环渤海北线', type: 'downstream',
    days: 5, nights: 4, ports: '天津-秦皇岛-大连-烟台', duration: '5天4晚',
    stops: makeStops([
      { portId: 'p02', portName: '天津港', day: 0, pierId: '', pierName: '', sailTime: '18:00', distance: 0, type: 'start' },
      { portId: 'p14', portName: '秦皇岛港', day: 1, pierId: '', pierName: '', sailTime: '14:00', distance: 90, type: 'middle' },
      { portId: 'p01', portName: '大连港', day: 2, pierId: '', pierName: '', sailTime: '18:00', distance: 130, type: 'middle' },
      { portId: 'p13', portName: '烟台港', day: 4, pierId: '', pierName: '', sailTime: '', distance: 85, type: 'end' },
    ]),
    image: '', remark: '环渤海北线，感受长城起点与海滨城市的魅力',
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-04 16:00:00',  createdAt: '2025-04-08 08:00:00',
  },
  {
    id: 'r13', code: 'ZS-DH-001', name: '厦门-宁波-舟山-上海华东精华航线', type: 'upstream',
    days: 5, nights: 4, ports: '厦门-温州-宁波-上海', duration: '5天4晚',
    stops: makeStops([
      { portId: 'p06', portName: '厦门港', day: 0, pierId: '', pierName: '', sailTime: '17:00', distance: 0, type: 'start' },
      { portId: 'p20', portName: '温州港', day: 1, pierId: '', pierName: '', sailTime: '18:00', distance: 175, type: 'middle' },
      { portId: 'p05', portName: '宁波港', day: 2, pierId: '', pierName: '', sailTime: '18:00', distance: 120, type: 'middle' },
      { portId: 'p04', portName: '上海港', day: 4, pierId: '', pierName: '', sailTime: '', distance: 135, type: 'end' },
    ]),
    image: '', remark: '华东沿海精华航线，从海上花园到东方明珠',
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-03 10:00:00',  createdAt: '2025-04-10 09:00:00',
  },
  {
    id: 'r14', code: 'CJ-SX-004', name: '重庆-宜昌快捷航线', type: 'downstream',
    days: 3, nights: 2, ports: '重庆-宜昌', duration: '3天2晚',
    stops: makeStops([
      { portId: 'p10', portName: '重庆港', day: 0, pierId: '', pierName: '', sailTime: '21:00', distance: 0, type: 'start' },
      { portId: '', portName: '巫山', day: 2, pierId: '', pierName: '巫山码头', sailTime: '13:00', distance: 230, type: 'middle' },
      { portId: 'p15', portName: '宜昌港', day: 3, pierId: '', pierName: '', sailTime: '', distance: 130, type: 'end' },
    ]),
    image: '', remark: '三峡快捷下水航线，精华景点全覆盖',
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-02 09:00:00',  createdAt: '2025-04-12 08:00:00',
  },
  {
    id: 'r15', code: 'ZS-NF-001', name: '深圳-广州-珠海-湛江-北海南粤风情航线', type: 'downstream',
    days: 6, nights: 5, ports: '深圳-广州-珠海-湛江-北海', duration: '6天5晚',
    stops: makeStops([
      { portId: 'p08', portName: '深圳港', day: 0, pierId: '', pierName: '', sailTime: '17:00', distance: 0, type: 'start' },
      { portId: 'p07', portName: '广州港', day: 1, pierId: '', pierName: '', sailTime: '16:00', distance: 50, type: 'middle' },
      { portId: 'p19', portName: '珠海港', day: 2, pierId: '', pierName: '', sailTime: '16:00', distance: 75, type: 'middle' },
      { portId: '', portName: '湛江港', day: 3, pierId: '', pierName: '', sailTime: '18:00', distance: 180, type: 'middle' },
      { portId: 'p18', portName: '北海港', day: 5, pierId: '', pierName: '', sailTime: '', distance: 120, type: 'end' },
    ]),
    image: '', remark: '南粤全景航线，从经济特区到北部湾明珠',
    status: 'disabled', updatedBy: '系统管理员', updatedAt: '2026-04-01 11:00:00',  createdAt: '2025-04-15 09:00:00',
  },
]

// ===================== 用户数据 =====================
export const users: User[] = [
  { id: 'u01', account: 'admin', name: '系统管理员', phone: '13800000001', email: 'admin@changhang.com', roleId: 'role01', roleName: '系统管理员', status: 'enabled', lastLoginAt: '2026-05-08 08:30:00',  createdAt: '2025-01-01 00:00:00' },
  { id: 'u02', account: 'zhangsan', name: '张三', phone: '13800000002', email: 'zhangsan@changhang.com', roleId: 'role02', roleName: '运营经理', status: 'enabled', lastLoginAt: '2026-05-07 14:20:00',  createdAt: '2025-01-15 09:00:00' },
  { id: 'u03', account: 'lisi', name: '李四', phone: '13800000003', email: 'lisi@changhang.com', roleId: 'role03', roleName: '航线规划师', status: 'enabled', lastLoginAt: '2026-05-06 10:15:00',  createdAt: '2025-02-01 10:00:00' },
  { id: 'u04', account: 'wangwu', name: '王五', phone: '13800000004', email: 'wangwu@changhang.com', roleId: 'role04', roleName: '港口管理员', status: 'enabled', lastLoginAt: '2026-05-05 16:00:00',  createdAt: '2025-02-10 08:00:00' },
  { id: 'u05', account: 'zhaoliu', name: '赵六', phone: '13800000005', email: 'zhaoliu@changhang.com', roleId: 'role05', roleName: '船长', status: 'enabled', lastLoginAt: '2026-05-04 09:30:00',  createdAt: '2025-03-01 09:00:00' },
  { id: 'u06', account: 'sunqi', name: '孙七', phone: '13800000006', email: 'sunqi@changhang.com', roleId: 'role06', roleName: '票务员', status: 'enabled', lastLoginAt: '2026-05-03 11:45:00',  createdAt: '2025-03-15 08:00:00' },
  { id: 'u07', account: 'zhouba', name: '周八', phone: '13800000007', email: 'zhouba@changhang.com', roleId: 'role07', roleName: '普通用户', status: 'enabled', lastLoginAt: '2026-05-02 15:00:00',  createdAt: '2025-04-01 10:00:00' },
  { id: 'u08', account: 'wujiu', name: '吴九', phone: '13800000008', email: 'wujiu@changhang.com', roleId: 'role02', roleName: '运营经理', status: 'disabled', lastLoginAt: '2026-04-15 08:00:00',  createdAt: '2025-04-10 09:00:00' },
  { id: 'u09', account: 'zhengshi', name: '郑十', phone: '13800000009', email: 'zhengshi@changhang.com', roleId: 'role03', roleName: '航线规划师', status: 'enabled', lastLoginAt: '2026-05-01 13:20:00',  createdAt: '2025-05-01 08:00:00' },
  { id: 'u10', account: 'chenyi', name: '陈一', phone: '13800000010', email: 'chenyi@changhang.com', roleId: 'role07', roleName: '普通用户', status: 'enabled', lastLoginAt: '2026-04-30 10:00:00',  createdAt: '2025-05-15 09:00:00' },
  { id: 'u11', account: 'liuer', name: '刘二', phone: '13800000011', email: 'liuer@changhang.com', roleId: 'role04', roleName: '港口管理员', status: 'enabled', lastLoginAt: '2026-04-29 14:30:00',  createdAt: '2025-06-01 08:00:00' },
  { id: 'u12', account: 'huangsan', name: '黄三', phone: '13800000012', email: 'huangsan@changhang.com', roleId: 'role05', roleName: '船长', status: 'enabled', lastLoginAt: '2026-04-28 09:15:00',  createdAt: '2025-06-10 10:00:00' },
  { id: 'u13', account: 'yangsi', name: '杨四', phone: '13800000013', email: 'yangsi@changhang.com', roleId: 'role06', roleName: '票务员', status: 'disabled', lastLoginAt: '2026-04-20 16:00:00',  createdAt: '2025-07-01 09:00:00' },
  { id: 'u14', account: 'maxiaowu', name: '马小五', phone: '13800000014', email: 'maxiaowu@changhang.com', roleId: 'role07', roleName: '普通用户', status: 'enabled', lastLoginAt: '2026-04-25 11:00:00',  createdAt: '2025-07-15 08:00:00' },
  { id: 'u15', account: 'linliu', name: '林六', phone: '13800000015', email: 'linliu@changhang.com', roleId: 'role02', roleName: '运营经理', status: 'enabled', lastLoginAt: '2026-04-22 08:30:00',  createdAt: '2025-08-01 10:00:00' },
]

// ===================== 角色数据 =====================
export const roles: Role[] = [
  { id: 'role01', code: 'SYSTEM_ADMIN', name: '系统管理员', description: '拥有系统全部权限，可进行系统配置、用户管理、数据维护等所有操作', status: 'enabled',  createdAt: '2025-01-01 00:00:00' },
  { id: 'role02', code: 'OP_MANAGER', name: '运营经理', description: '负责航线运营管理，包括航线规划、排班、港口协调等日常工作', status: 'enabled',  createdAt: '2025-01-10 09:00:00' },
  { id: 'role03', code: 'ROUTE_PLANNER', name: '航线规划师', description: '负责航线设计与规划，管理航线信息、停靠港口、航行时间等', status: 'enabled',  createdAt: '2025-01-15 08:00:00' },
  { id: 'role04', code: 'PORT_MANAGER', name: '港口管理员', description: '负责港口基础信息维护，管理港口数据、码头信息、景点关联等', status: 'enabled',  createdAt: '2025-02-01 10:00:00' },
  { id: 'role05', code: 'SHIP_CAPTAIN', name: '船长', description: '查看和管理所负责船舶的航线、排班、乘客等信息', status: 'enabled',  createdAt: '2025-02-15 09:00:00' },
  { id: 'role06', code: 'TICKET_AGENT', name: '票务员', description: '负责票务相关操作，可查看航线、舱房、订单等信息', status: 'enabled',  createdAt: '2025-03-01 08:00:00' },
  { id: 'role07', code: 'VIEWER', name: '普通用户', description: '仅具有基础查看权限，可浏览公开的航线、港口、景点等信息', status: 'enabled',  createdAt: '2025-03-15 09:00:00' },
]

// ===================== 菜单数据 =====================
export const menus: Menu[] = [
  { id: 'm01', name: '首页', code: 'dashboard', parentId: null, parentName: '-', route: '/dashboard', type: 'menu', sort: 1, icon: 'LayoutDashboard', permission: 'dashboard:view', status: 'enabled' },
  { id: 'm02', name: '数据看板', code: 'dashboard_index', parentId: 'm01', parentName: '首页', route: '/dashboard', type: 'menu', sort: 1, icon: '', permission: 'dashboard:view', status: 'enabled' },
  { id: 'm03', name: '资源', code: 'resources', parentId: null, parentName: '-', route: '/resources', type: 'menu', sort: 2, icon: 'Package', permission: 'resources:view', status: 'enabled' },
  { id: 'm04', name: '港口管理', code: 'port', parentId: 'm03', parentName: '资源', route: '/resources/ports', type: 'menu', sort: 1, icon: '', permission: 'port:view', status: 'enabled' },
  { id: 'm05', name: '景点管理', code: 'attraction', parentId: 'm03', parentName: '资源', route: '/resources/attractions', type: 'menu', sort: 2, icon: '', permission: 'attraction:view', status: 'enabled' },
  { id: 'm06', name: '航线管理', code: 'route', parentId: 'm03', parentName: '资源', route: '/resources/routes', type: 'menu', sort: 3, icon: '', permission: 'route:view', status: 'enabled' },
  { id: 'm07', name: '系统设置', code: 'system', parentId: null, parentName: '-', route: '/system', type: 'menu', sort: 3, icon: 'Settings', permission: 'system:view', status: 'enabled' },
  { id: 'm08', name: '用户管理', code: 'user', parentId: 'm07', parentName: '系统设置', route: '/system/users', type: 'menu', sort: 1, icon: '', permission: 'user:view', status: 'enabled' },
  { id: 'm09', name: '角色管理', code: 'role', parentId: 'm07', parentName: '系统设置', route: '/system/roles', type: 'menu', sort: 2, icon: '', permission: 'role:view', status: 'enabled' },
  { id: 'm10', name: '菜单管理', code: 'menu', parentId: 'm07', parentName: '系统设置', route: '/system/menus', type: 'menu', sort: 3, icon: '', permission: 'menu:view', status: 'enabled' },
  { id: 'm11', name: '数据字典', code: 'dictionary', parentId: 'm07', parentName: '系统设置', route: '/system/dictionaries', type: 'menu', sort: 4, icon: '', permission: 'dictionary:view', status: 'enabled' },
  { id: 'm12', name: '新增港口', code: 'port_create', parentId: 'm04', parentName: '港口管理', route: '', type: 'button', sort: 1, icon: '', permission: 'port:create', status: 'enabled' },
  { id: 'm13', name: '编辑港口', code: 'port_edit', parentId: 'm04', parentName: '港口管理', route: '', type: 'button', sort: 2, icon: '', permission: 'port:edit', status: 'enabled' },
  { id: 'm14', name: '删除港口', code: 'port_delete', parentId: 'm04', parentName: '港口管理', route: '', type: 'button', sort: 3, icon: '', permission: 'port:delete', status: 'enabled' },
  { id: 'm15', name: '新增航线', code: 'route_create', parentId: 'm06', parentName: '航线管理', route: '', type: 'button', sort: 1, icon: '', permission: 'route:create', status: 'enabled' },
  { id: 'm16', name: '编辑航线', code: 'route_edit', parentId: 'm06', parentName: '航线管理', route: '', type: 'button', sort: 2, icon: '', permission: 'route:edit', status: 'enabled' },
  { id: 'm17', name: '删除航线', code: 'route_delete', parentId: 'm06', parentName: '航线管理', route: '', type: 'button', sort: 3, icon: '', permission: 'route:delete', status: 'enabled' },
]

// ===================== 数据字典 =====================
export const dictionaries: Dictionary[] = [
  { id: 'd01', dictCode: 'ROUTE_TYPE', dictName: '航线类型', itemCode: 'upstream', itemName: '上水', sort: 1, status: 'enabled', remark: '逆流而上' },
  { id: 'd02', dictCode: 'ROUTE_TYPE', dictName: '航线类型', itemCode: 'downstream', itemName: '下水', sort: 2, status: 'enabled', remark: '顺流而下' },
  { id: 'd03', dictCode: 'SEASON', dictName: '旅游季节', itemCode: 'spring', itemName: '春季', sort: 1, status: 'enabled', remark: '3-5月' },
  { id: 'd04', dictCode: 'SEASON', dictName: '旅游季节', itemCode: 'summer', itemName: '夏季', sort: 2, status: 'enabled', remark: '6-8月' },
  { id: 'd05', dictCode: 'SEASON', dictName: '旅游季节', itemCode: 'autumn', itemName: '秋季', sort: 3, status: 'enabled', remark: '9-11月' },
  { id: 'd06', dictCode: 'SEASON', dictName: '旅游季节', itemCode: 'winter', itemName: '冬季', sort: 4, status: 'enabled', remark: '12-2月' },
  { id: 'd07', dictCode: 'SHIP_TYPE', dictName: '船舶类型', itemCode: 'cruise', itemName: '游轮', sort: 1, status: 'enabled', remark: '内河游轮' },
  { id: 'd08', dictCode: 'SHIP_TYPE', dictName: '船舶类型', itemCode: 'ferry', itemName: '客轮', sort: 2, status: 'enabled', remark: '客运渡轮' },
  { id: 'd09', dictCode: 'SHIP_TYPE', dictName: '船舶类型', itemCode: 'speedboat', itemName: '快艇', sort: 3, status: 'enabled', remark: '高速客运' },
  { id: 'd10', dictCode: 'CABIN_TYPE', dictName: '舱房类型', itemCode: 'suite', itemName: '套房', sort: 1, status: 'enabled', remark: '豪华套房' },
  { id: 'd11', dictCode: 'CABIN_TYPE', dictName: '舱房类型', itemCode: 'balcony', itemName: '阳台房', sort: 2, status: 'enabled', remark: '带阳台' },
  { id: 'd12', dictCode: 'CABIN_TYPE', dictName: '舱房类型', itemCode: 'window', itemName: '海景房', sort: 3, status: 'enabled', remark: '有窗观景' },
  { id: 'd13', dictCode: 'CABIN_TYPE', dictName: '舱房类型', itemCode: 'inside', itemName: '内舱房', sort: 4, status: 'enabled', remark: '无窗经济型' },
  { id: 'd14', dictCode: 'RIVER', dictName: '水域', itemCode: 'yangtze', itemName: '长江', sort: 1, status: 'enabled', remark: '长江流域' },
  { id: 'd15', dictCode: 'RIVER', dictName: '水域', itemCode: 'yellow', itemName: '黄河', sort: 2, status: 'enabled', remark: '黄河流域' },
  { id: 'd16', dictCode: 'RIVER', dictName: '水域', itemCode: 'pearl', itemName: '珠江', sort: 3, status: 'enabled', remark: '珠江流域' },
  { id: 'd17', dictCode: 'RIVER', dictName: '水域', itemCode: 'coastal', itemName: '沿海', sort: 4, status: 'enabled', remark: '沿海航线' },
]

// ===================== 船舶数据 =====================
// 甲板设施模板数据
const deckFacilities: Record<string, { name: string; hours: string; enabled: boolean }[]> = {
  'top': [
    { name: '观景酒吧', hours: '18:00-02:00', enabled: true },
    { name: '游泳池', hours: '08:00-22:00', enabled: true },
    { name: '健身房', hours: '06:00-22:00', enabled: true },
  ],
  'upper': [
    { name: '主餐厅', hours: '07:00-21:00', enabled: true },
    { name: '咖啡厅', hours: '09:00-23:00', enabled: true },
    { name: 'SPA中心', hours: '10:00-22:00', enabled: true },
    { name: '棋牌室', hours: '10:00-02:00', enabled: true },
  ],
  'middle': [
    { name: '自助餐厅', hours: '06:30-10:00,17:30-21:00', enabled: true },
    { name: '商店', hours: '09:00-21:00', enabled: true },
    { name: '医务室', hours: '24小时', enabled: true },
  ],
  'lower': [
    { name: '医务室', hours: '24小时', enabled: true },
    { name: '洗衣房', hours: '08:00-20:00', enabled: true },
  ],
}

function genDeck(floor: number, type: 'top' | 'upper' | 'middle' | 'lower', suffix: number): import('@/types').Deck {
  const names: Record<string, { zh: string; en: string }> = {
    top: { zh: '顶层阳光甲板', en: 'Sun Deck' },
    upper: { zh: '上层甲板', en: 'Upper Deck' },
    middle: { zh: '中层甲板', en: 'Middle Deck' },
    lower: { zh: '下层甲板', en: 'Lower Deck' },
  }
  const base = names[type]
  return {
    id: `d_${suffix}`,
    floorNum: floor,
    name: `${floor}层-${base.zh}`,
    nameEn: `Deck ${floor} - ${base.en}`,
    area: Math.round(400 + Math.random() * 600),
    image: '',
    remark: '',
    facilities: (deckFacilities[type] || []).map((f, i) => ({
      id: `f_${suffix}_${i}`,
      ...f,
    })),
    cabins: [],
  }
}

function genShipDecks(id: string, floors: number): import('@/types').Deck[] {
  const decks: import('@/types').Deck[] = []
  if (floors >= 1) decks.push(genDeck(1, 'lower', 0))
  for (let i = 2; i <= Math.min(floors - 1, floors); i++) {
    decks.push(genDeck(i, 'middle', 10 + i))
  }
  if (floors >= 3) decks.push(genDeck(floors - 1, 'upper', 20 + floors))
  if (floors >= 3) decks.push(genDeck(floors, 'top', 30 + floors))
  return decks.map((d, i) => ({ ...d, id: `${id}_d${i + 1}` }))
}

export const ships: Ship[] = [
  { id: 's01', code: 'CJ-TXS-001', name: '长江探索号', nameEn: 'Yangtze Explorer', series: '长江系列', realNameId: 'CN-YZ-2021001', capacity: 480, floors: 6, length: 139, width: 19, depth: 4.5, speed: 26, voltage: 380, acSystem: '中央空调系统', factoryDate: '2020-06-15', lastRenovation: '2024-03-20', maidenVoyage: '2021-04-01', renovationContent: '全船软装升级、客房智能化改造、餐厅设备更新', contact: '张伟', contactPhone: '13800138001', cabinCount: 210, level: '五星级', cabinTypes: ['suite', 'balcony', 'window'], decks: genShipDecks('s01', 6), status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-15 10:00:00',  createdAt: '2025-06-01 08:00:00' },
  { id: 's02', code: 'SJ-YL-002', name: '世纪游轮', nameEn: 'Century Cruises', series: '世纪系列', realNameId: 'CN-SJ-2021002', capacity: 520, floors: 7, length: 149, width: 21, depth: 5.0, speed: 28, voltage: 380, acSystem: '中央空调系统', factoryDate: '2020-08-20', lastRenovation: '2024-01-15', maidenVoyage: '2021-05-18', renovationContent: '阳台房扩容、新增SPA中心、泳池改造', contact: '李芳', contactPhone: '13900139002', cabinCount: 230, level: '五星级', cabinTypes: ['suite', 'balcony', 'window', 'inside'], decks: genShipDecks('s02', 7), status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-14 09:00:00',  createdAt: '2025-06-01 08:00:00' },
  { id: 's03', code: 'HJ-YL-003', name: '黄金游轮', nameEn: 'Golden Cruises', series: '黄金系列', realNameId: 'CN-HJ-2021003', capacity: 380, floors: 5, length: 126, width: 17, depth: 4.0, speed: 24, voltage: 380, acSystem: '中央空调系统', factoryDate: '2019-12-10', lastRenovation: '2023-09-05', maidenVoyage: '2020-07-20', renovationContent: '客房翻新、公共区域改造', contact: '王建国', contactPhone: '13700137003', cabinCount: 165, level: '四星级', cabinTypes: ['balcony', 'window', 'inside'], decks: genShipDecks('s03', 5), status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-13 11:00:00',  createdAt: '2025-06-05 09:00:00' },
  { id: 's04', code: 'WDL-YH-004', name: '维多利亚号', nameEn: 'MS Victoria', series: '维多利亚系列', realNameId: 'CN-WDL-2021004', capacity: 550, floors: 7, length: 155, width: 22, depth: 5.2, speed: 27, voltage: 380, acSystem: '中央空调系统', factoryDate: '2021-02-28', lastRenovation: '2025-01-10', maidenVoyage: '2021-09-01', renovationContent: '套房升级、新增电影院、健身设施更新', contact: '陈志强', contactPhone: '13600136004', cabinCount: 245, level: '五星级', cabinTypes: ['suite', 'balcony', 'window', 'inside'], decks: genShipDecks('s04', 7), status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-12 14:00:00',  createdAt: '2025-06-05 09:00:00' },
  { id: 's05', code: 'SX-MZ-005', name: '三峡明珠号', nameEn: 'Three Gorges Pearl', series: '三峡系列', realNameId: 'CN-SX-2021005', capacity: 320, floors: 5, length: 120, width: 16, depth: 3.8, speed: 23, voltage: 220, acSystem: '分体空调系统', factoryDate: '2019-05-15', lastRenovation: '2023-06-20', maidenVoyage: '2020-04-10', renovationContent: '客房翻新、餐厅改造', contact: '刘洋', contactPhone: '13500135005', cabinCount: 140, level: '四星级', cabinTypes: ['window', 'inside'], decks: genShipDecks('s05', 5), status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-11 08:30:00',  createdAt: '2025-06-10 08:00:00' },
  { id: 's06', code: 'CJ-ZX-006', name: '长江之星号', nameEn: 'Yangtze Star', series: '长江系列', realNameId: 'CN-CJ-2021006', capacity: 260, floors: 4, length: 105, width: 14, depth: 3.2, speed: 20, voltage: 220, acSystem: '分体空调系统', factoryDate: '2017-08-10', lastRenovation: '2022-05-15', maidenVoyage: '2018-06-01', renovationContent: '基础维护翻新', contact: '赵敏', contactPhone: '13400134006', cabinCount: 110, level: '三星级', cabinTypes: ['window', 'inside'], decks: genShipDecks('s06', 4), status: 'disabled', updatedBy: '系统管理员', updatedAt: '2026-04-10 15:00:00',  createdAt: '2025-06-10 08:00:00' },
  { id: 's07', code: 'HT-HH-007', name: '海天号', nameEn: 'Ocean Sky', series: '海天系列', realNameId: 'CN-HT-2021007', capacity: 350, floors: 5, length: 128, width: 17, depth: 4.1, speed: 25, voltage: 380, acSystem: '中央空调系统', factoryDate: '2019-11-20', lastRenovation: '2024-02-10', maidenVoyage: '2020-08-15', renovationContent: '公共区域升级、客房智能化改造', contact: '孙磊', contactPhone: '13300133007', cabinCount: 155, level: '四星级', cabinTypes: ['balcony', 'window', 'inside'], decks: genShipDecks('s07', 5), status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-09 10:30:00',  createdAt: '2025-06-15 09:00:00' },
  { id: 's08', code: 'YZJ-HH-008', name: '扬子江号', nameEn: 'Yangtze River', series: '扬子江系列', realNameId: 'CN-YZJ-2021008', capacity: 220, floors: 4, length: 98, width: 13, depth: 3.0, speed: 18, voltage: 220, acSystem: '分体空调系统', factoryDate: '2017-03-25', lastRenovation: '2022-10-08', maidenVoyage: '2018-04-30', renovationContent: '客房基础翻新', contact: '周文', contactPhone: '13200132008', cabinCount: 95, level: '三星级', cabinTypes: ['inside'], decks: genShipDecks('s08', 4), status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-08 09:00:00',  createdAt: '2025-06-15 09:00:00' },
  { id: 's09', code: 'SN-SN-009', name: '神女号', nameEn: 'Goddess', series: '神女系列', realNameId: 'CN-SN-2022009', capacity: 500, floors: 6, length: 142, width: 20, depth: 4.8, speed: 26, voltage: 380, acSystem: '中央空调系统', factoryDate: '2022-05-10', lastRenovation: '', maidenVoyage: '2022-11-01', renovationContent: '', contact: '吴婷', contactPhone: '13100131009', cabinCount: 220, level: '五星级', cabinTypes: ['suite', 'balcony', 'window', 'inside'], decks: genShipDecks('s09', 6), status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-07 14:00:00',  createdAt: '2025-07-01 08:00:00' },
  { id: 's10', code: 'ZT-ZT-010', name: '总统号', nameEn: 'President', series: '总统系列', realNameId: 'CN-ZT-2022010', capacity: 560, floors: 7, length: 152, width: 21, depth: 5.1, speed: 28, voltage: 380, acSystem: '中央空调系统', factoryDate: '2022-08-15', lastRenovation: '', maidenVoyage: '2023-03-18', renovationContent: '', contact: '郑刚', contactPhone: '13000130010', cabinCount: 250, level: '五星级', cabinTypes: ['suite', 'balcony', 'window'], decks: genShipDecks('s10', 7), status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-06 10:00:00',  createdAt: '2025-07-01 08:00:00' },
  { id: 's11', code: 'CJ-CS-011', name: '长江传说号', nameEn: 'Yangtze Legend', series: '长江系列', realNameId: 'CN-CJ-2022011', capacity: 340, floors: 5, length: 124, width: 16, depth: 3.9, speed: 23, voltage: 380, acSystem: '中央空调系统', factoryDate: '2021-09-20', lastRenovation: '2024-11-30', maidenVoyage: '2022-06-10', renovationContent: '餐厅改造、新增棋牌室', contact: '黄丽', contactPhone: '12900129011', cabinCount: 148, level: '四星级', cabinTypes: ['balcony', 'window', 'inside'], decks: genShipDecks('s11', 5), status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-05 11:30:00',  createdAt: '2025-07-05 09:00:00' },
  { id: 's12', code: 'HJ-GZ-012', name: '皇家公主号', nameEn: 'Royal Princess', series: '皇家系列', realNameId: 'CN-HJ-2022012', capacity: 600, floors: 8, length: 160, width: 23, depth: 5.5, speed: 30, voltage: 380, acSystem: '中央空调系统', factoryDate: '2022-12-01', lastRenovation: '', maidenVoyage: '2023-06-01', renovationContent: '', contact: '马超', contactPhone: '12800128012', cabinCount: 270, level: '五星级', cabinTypes: ['suite', 'balcony', 'window', 'inside'], decks: genShipDecks('s12', 8), status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-04 08:00:00',  createdAt: '2025-07-05 09:00:00' },
  { id: 's13', code: 'DF-HH-013', name: '东方皇后号', nameEn: 'Oriental Empress', series: '东方系列', realNameId: 'CN-DF-2022013', capacity: 370, floors: 5, length: 130, width: 18, depth: 4.2, speed: 24, voltage: 380, acSystem: '中央空调系统', factoryDate: '2021-11-10', lastRenovation: '2024-07-20', maidenVoyage: '2022-08-05', renovationContent: '阳台加装、公共区域翻新', contact: '何伟', contactPhone: '12700127013', cabinCount: 160, level: '四星级', cabinTypes: ['balcony', 'window'], decks: genShipDecks('s13', 5), status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-03 16:00:00',  createdAt: '2025-07-10 08:00:00' },
  { id: 's14', code: 'CJ-TS-014', name: '长江天使号', nameEn: 'Yangtze Angel', series: '长江系列', realNameId: 'CN-CJ-2022014', capacity: 240, floors: 4, length: 102, width: 14, depth: 3.1, speed: 19, voltage: 220, acSystem: '分体空调系统', factoryDate: '2018-04-20', lastRenovation: '2023-03-12', maidenVoyage: '2019-05-01', renovationContent: '客房翻新、公共区域改造', contact: '林小红', contactPhone: '12600126014', cabinCount: 105, level: '三星级', cabinTypes: ['window', 'inside'], decks: genShipDecks('s14', 4), status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-02 09:45:00',  createdAt: '2025-07-10 08:00:00' },
  { id: 's15', code: 'KY-KY-015', name: '凯悦号', nameEn: 'Hyatt Cruiser', series: '凯悦系列', realNameId: 'CN-KY-2022015', capacity: 510, floors: 7, length: 146, width: 20, depth: 4.9, speed: 27, voltage: 380, acSystem: '中央空调系统', factoryDate: '2022-10-25', lastRenovation: '', maidenVoyage: '2023-09-15', renovationContent: '', contact: '杨帆', contactPhone: '12500125015', cabinCount: 235, level: '五星级', cabinTypes: ['suite', 'balcony', 'window', 'inside'], decks: genShipDecks('s15', 7), status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-01 13:00:00',  createdAt: '2025-07-15 09:00:00' },
  { id: 's16', code: 'HX-HH-016', name: '华夏号', nameEn: 'Huaxia Cruiser', series: '华夏系列', realNameId: 'CN-HX-2022016', capacity: 300, floors: 5, length: 118, width: 16, depth: 3.7, speed: 22, voltage: 380, acSystem: '中央空调系统', factoryDate: '2021-07-15', lastRenovation: '2024-05-10', maidenVoyage: '2022-04-20', renovationContent: '客房改造、棋牌室新增', contact: '徐强', contactPhone: '12400124016', cabinCount: 130, level: '四星级', cabinTypes: ['window', 'inside'], decks: genShipDecks('s16', 5), status: 'disabled', updatedBy: '系统管理员', updatedAt: '2026-03-30 10:30:00',  createdAt: '2025-07-15 09:00:00' },
]

const cabinTypeNames: Record<string, string> = {
  suite: '套房', balcony: '阳台房', window: '海景房', inside: '内舱房',
}

// ===================== 产品数据 =====================
// C(n,2) 生成单向航段
function genSegments(stops: { name: string; day: number; dist: number }[]): Omit<ProductSegment, 'id'>[] {
  const segments: Omit<ProductSegment, 'id'>[] = []
  for (let i = 0; i < stops.length; i++) {
    for (let j = i + 1; j < stops.length; j++) {
      let mileage = 0
      for (let k = i + 1; k <= j; k++) mileage += stops[k].dist
      segments.push({
        startPort: stops[i].name,
        endPort: stops[j].name,
        days: stops[j].day - stops[i].day,
        mileage,
        status: 'enabled',
      })
    }
  }
  return segments
}

function genPricing(segments: ProductSegment[], cabinTypes: string[]): PricingRow[] {
  const rows: PricingRow[] = []
  for (const seg of segments) {
    for (const ct of cabinTypes) {
      const base = 500 + seg.mileage * 3 + (ct === 'suite' ? 2000 : ct === 'balcony' ? 800 : ct === 'window' ? 300 : 0)
      rows.push({
        segmentKey: `${seg.startPort}-${seg.endPort}`,
        startPort: seg.startPort,
        endPort: seg.endPort,
        cabinType: cabinTypeNames[ct] || ct,
        costPrice: Math.round(base * 0.6),
        basePrice: base,
      })
    }
  }
  return rows
}

export const products: Product[] = [
  // 重庆-宜昌三峡下水产品
  {
    id: 'prod01', name: '三峡经典下水之旅', routeId: 'r01', routeName: '重庆-宜昌三峡航线（下水）', routeType: 'downstream',
    shipId: 's01', shipName: '长江探索号', shipLevel: '五星级',
    startPort: '重庆港', endPort: '宜昌港', days: 4, nights: 3, mileage: 310, duration: '4天3晚',
    icon: '', images: [], description: '乘坐五星级长江探索号，顺流而下领略三峡壮美风光，途经丰都鬼城、白帝城、三峡大坝等世界级景点。',
    segments: genSegments([
      { name: '重庆港', day: 0, dist: 0 }, { name: '丰都', day: 1, dist: 120 }, { name: '奉节', day: 2, dist: 85 }, { name: '宜昌港', day: 4, dist: 105 },
    ]) as ProductSegment[],
    pricing: genPricing(genSegments([
      { name: '重庆港', day: 0, dist: 0 }, { name: '丰都', day: 1, dist: 120 }, { name: '奉节', day: 2, dist: 85 }, { name: '宜昌港', day: 4, dist: 105 },
    ]) as ProductSegment[], ships[0].cabinTypes),
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-06 09:00:00',  createdAt: '2026-03-01 08:00:00',
  },
  {
    id: 'prod02', name: '世纪游轮三峡下水游', routeId: 'r01', routeName: '重庆-宜昌三峡航线（下水）', routeType: 'downstream',
    shipId: 's02', shipName: '世纪游轮', shipLevel: '五星级',
    startPort: '重庆港', endPort: '宜昌港', days: 4, nights: 3, mileage: 310, duration: '4天3晚',
    icon: '', images: [], description: '世纪游轮五星级体验，4天3晚三峡下水精华航线，全船配备豪华设施。',
    segments: genSegments([
      { name: '重庆港', day: 0, dist: 0 }, { name: '丰都', day: 1, dist: 120 }, { name: '奉节', day: 2, dist: 85 }, { name: '宜昌港', day: 4, dist: 105 },
    ]) as ProductSegment[],
    pricing: genPricing(genSegments([
      { name: '重庆港', day: 0, dist: 0 }, { name: '丰都', day: 1, dist: 120 }, { name: '奉节', day: 2, dist: 85 }, { name: '宜昌港', day: 4, dist: 105 },
    ]) as ProductSegment[], ships[1].cabinTypes),
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-05 10:30:00',  createdAt: '2026-03-02 09:00:00',
  },
  // 宜昌-重庆三峡上水
  {
    id: 'prod03', name: '三峡深度上水游', routeId: 'r02', routeName: '宜昌-重庆三峡航线（上水）', routeType: 'upstream',
    shipId: 's03', shipName: '黄金游轮', shipLevel: '四星级',
    startPort: '宜昌港', endPort: '重庆港', days: 5, nights: 4, mileage: 365, duration: '5天4晚',
    icon: '', images: [], description: '乘坐黄金游轮逆流而上，5天4晚深度游览三峡，慢节奏感受长江两岸巴渝文化。',
    segments: genSegments([
      { name: '宜昌港', day: 0, dist: 0 }, { name: '奉节', day: 2, dist: 160 }, { name: '丰都', day: 3, dist: 85 }, { name: '重庆港', day: 5, dist: 120 },
    ]) as ProductSegment[],
    pricing: genPricing(genSegments([
      { name: '宜昌港', day: 0, dist: 0 }, { name: '奉节', day: 2, dist: 160 }, { name: '丰都', day: 3, dist: 85 }, { name: '重庆港', day: 5, dist: 120 },
    ]) as ProductSegment[], ships[2].cabinTypes),
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-04 14:00:00',  createdAt: '2026-03-03 10:00:00',
  },
  // 环渤海
  {
    id: 'prod04', name: '环渤海风情游', routeId: 'r03', routeName: '青岛-大连-天津环渤海航线', routeType: 'downstream',
    shipId: 's04', shipName: '维多利亚号', shipLevel: '五星级',
    startPort: '青岛港', endPort: '天津港', days: 5, nights: 4, mileage: 345, duration: '5天4晚',
    icon: '', images: [], description: '环渤海精品航线，串联青岛、烟台、大连、天津四大港口城市，尽览北方海滨风光。',
    segments: genSegments([
      { name: '青岛港', day: 0, dist: 0 }, { name: '烟台港', day: 1, dist: 85 }, { name: '大连港', day: 2, dist: 95 }, { name: '天津港', day: 4, dist: 165 },
    ]) as ProductSegment[],
    pricing: genPricing(genSegments([
      { name: '青岛港', day: 0, dist: 0 }, { name: '烟台港', day: 1, dist: 85 }, { name: '大连港', day: 2, dist: 95 }, { name: '天津港', day: 4, dist: 165 },
    ]) as ProductSegment[], ships[3].cabinTypes),
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-03 08:30:00',  createdAt: '2026-03-05 08:00:00',
  },
  // 东南沿海
  {
    id: 'prod05', name: '东南沿海黄金线', routeId: 'r04', routeName: '上海-宁波-厦门-深圳东南沿海航线', routeType: 'downstream',
    shipId: 's07', shipName: '海天号', shipLevel: '四星级',
    startPort: '上海港', endPort: '深圳港', days: 6, nights: 5, mileage: 650, duration: '6天5晚',
    icon: '', images: [], description: '从上海到深圳，串联长三角与珠三角，6天5晚东南沿海豪华之旅。',
    segments: genSegments([
      { name: '上海港', day: 0, dist: 0 }, { name: '宁波港', day: 1, dist: 135 }, { name: '温州港', day: 2, dist: 120 }, { name: '厦门港', day: 3, dist: 175 }, { name: '深圳港', day: 5, dist: 220 },
    ]) as ProductSegment[],
    pricing: genPricing(genSegments([
      { name: '上海港', day: 0, dist: 0 }, { name: '宁波港', day: 1, dist: 135 }, { name: '温州港', day: 2, dist: 120 }, { name: '厦门港', day: 3, dist: 175 }, { name: '深圳港', day: 5, dist: 220 },
    ]) as ProductSegment[], ships[6].cabinTypes),
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-02 11:00:00',  createdAt: '2026-03-08 09:00:00',
  },
  // 南海航线
  {
    id: 'prod06', name: '南国热带逍遥游', routeId: 'r05', routeName: '海口-三亚-北海南海航线', routeType: 'downstream',
    shipId: 's04', shipName: '维多利亚号', shipLevel: '五星级',
    startPort: '海口港', endPort: '北海港', days: 4, nights: 3, mileage: 340, duration: '4天3晚',
    icon: '', images: [], description: '南海热带风情航线，享受三亚阳光沙滩与北海涠洲岛火山奇观。',
    segments: genSegments([
      { name: '海口港', day: 0, dist: 0 }, { name: '三亚港', day: 2, dist: 180 }, { name: '北海港', day: 4, dist: 160 },
    ]) as ProductSegment[],
    pricing: genPricing(genSegments([
      { name: '海口港', day: 0, dist: 0 }, { name: '三亚港', day: 2, dist: 180 }, { name: '北海港', day: 4, dist: 160 },
    ]) as ProductSegment[], ships[3].cabinTypes),
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-01 16:00:00',  createdAt: '2026-03-10 08:00:00',
  },
  // 长江中下游
  {
    id: 'prod07', name: '长江中下游全景游', routeId: 'r06', routeName: '武汉-九江-南京-上海长江中下游航线', routeType: 'downstream',
    shipId: 's01', shipName: '长江探索号', shipLevel: '五星级',
    startPort: '武汉港', endPort: '上海港', days: 7, nights: 6, mileage: 645, duration: '7天6晚',
    icon: '', images: [], description: '长江中下游全景航线，从武汉到上海，途经九江庐山、南京中山陵，终点魔都上海。',
    segments: genSegments([
      { name: '武汉港', day: 0, dist: 0 }, { name: '九江港', day: 2, dist: 180 }, { name: '芜湖港', day: 4, dist: 155 }, { name: '南京港', day: 5, dist: 110 }, { name: '上海港', day: 7, dist: 200 },
    ]) as ProductSegment[],
    pricing: genPricing(genSegments([
      { name: '武汉港', day: 0, dist: 0 }, { name: '九江港', day: 2, dist: 180 }, { name: '芜湖港', day: 4, dist: 155 }, { name: '南京港', day: 5, dist: 110 }, { name: '上海港', day: 7, dist: 200 },
    ]) as ProductSegment[], ships[0].cabinTypes),
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-30 09:45:00',  createdAt: '2026-03-12 10:00:00',
  },
  // 山东半岛+辽东
  {
    id: 'prod08', name: '齐鲁辽东精华游', routeId: 'r07', routeName: '大连-烟台-威海-青岛东北亚航线', routeType: 'downstream',
    shipId: 's07', shipName: '海天号', shipLevel: '四星级',
    startPort: '大连港', endPort: '青岛港', days: 5, nights: 4, mileage: 270, duration: '5天4晚',
    icon: '', images: [], description: '从大连到青岛，途径烟台蓬莱阁、威海卫，感受山东半岛与辽东半岛的独特魅力。',
    segments: genSegments([
      { name: '大连港', day: 0, dist: 0 }, { name: '烟台港', day: 1, dist: 85 }, { name: '威海港', day: 2, dist: 55 }, { name: '青岛港', day: 4, dist: 130 },
    ]) as ProductSegment[],
    pricing: genPricing(genSegments([
      { name: '大连港', day: 0, dist: 0 }, { name: '烟台港', day: 1, dist: 85 }, { name: '威海港', day: 2, dist: 55 }, { name: '青岛港', day: 4, dist: 130 },
    ]) as ProductSegment[], ships[6].cabinTypes),
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-29 10:00:00',  createdAt: '2026-03-15 08:00:00',
  },
  // 珠三角
  {
    id: 'prod09', name: '大湾区精品短线', routeId: 'r08', routeName: '广州-珠海-深圳珠三角航线', routeType: 'downstream',
    shipId: 's05', shipName: '三峡明珠号', shipLevel: '四星级',
    startPort: '广州港', endPort: '深圳港', days: 3, nights: 2, mileage: 125, duration: '3天2晚',
    icon: '', images: [], description: '珠三角大湾区精品短线，3天2晚从广州到深圳，途经珠海长隆海洋王国。',
    segments: genSegments([
      { name: '广州港', day: 0, dist: 0 }, { name: '珠海港', day: 1, dist: 75 }, { name: '深圳港', day: 3, dist: 50 },
    ]) as ProductSegment[],
    pricing: genPricing(genSegments([
      { name: '广州港', day: 0, dist: 0 }, { name: '珠海港', day: 1, dist: 75 }, { name: '深圳港', day: 3, dist: 50 },
    ]) as ProductSegment[], ships[4].cabinTypes),
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-28 15:30:00',  createdAt: '2026-03-18 09:00:00',
  },
  // 上海-武汉上水
  {
    id: 'prod10', name: '长江中游古韵游', routeId: 'r09', routeName: '上海-南京-武汉长江中游上水航线', routeType: 'upstream',
    shipId: 's03', shipName: '黄金游轮', shipLevel: '四星级',
    startPort: '上海港', endPort: '武汉港', days: 6, nights: 5, mileage: 545, duration: '6天5晚',
    icon: '', images: [], description: '从上海出发，逆流而上，慢节奏感受江南古韵，经南京中山陵、九江庐山到武汉黄鹤楼。',
    segments: genSegments([
      { name: '上海港', day: 0, dist: 0 }, { name: '南京港', day: 2, dist: 180 }, { name: '九江港', day: 4, dist: 210 }, { name: '武汉港', day: 6, dist: 155 },
    ]) as ProductSegment[],
    pricing: genPricing(genSegments([
      { name: '上海港', day: 0, dist: 0 }, { name: '南京港', day: 2, dist: 180 }, { name: '九江港', day: 4, dist: 210 }, { name: '武汉港', day: 6, dist: 155 },
    ]) as ProductSegment[], ships[2].cabinTypes),
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-27 08:30:00',  createdAt: '2026-03-20 10:00:00',
  },
  // 南海东海连线
  {
    id: 'prod11', name: '南海东海全景连线', routeId: 'r10', routeName: '北海-三亚-广州-厦门南海东海连线', routeType: 'upstream',
    shipId: 's02', shipName: '世纪游轮', shipLevel: '五星级',
    startPort: '北海港', endPort: '厦门港', days: 7, nights: 6, mileage: 670, duration: '7天6晚',
    icon: '', images: [], description: '从北部湾到台湾海峡，7天6晚南海东海全景连线，一路向北看遍南国风光。',
    segments: genSegments([
      { name: '北海港', day: 0, dist: 0 }, { name: '三亚港', day: 2, dist: 160 }, { name: '广州港', day: 4, dist: 240 }, { name: '深圳港', day: 5, dist: 50 }, { name: '厦门港', day: 7, dist: 220 },
    ]) as ProductSegment[],
    pricing: genPricing(genSegments([
      { name: '北海港', day: 0, dist: 0 }, { name: '三亚港', day: 2, dist: 160 }, { name: '广州港', day: 4, dist: 240 }, { name: '深圳港', day: 5, dist: 50 }, { name: '厦门港', day: 7, dist: 220 },
    ]) as ProductSegment[], ships[1].cabinTypes),
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-26 11:15:00',  createdAt: '2026-03-22 08:00:00',
  },
  // 重庆-上海长江全线
  {
    id: 'prod12', name: '万里长江史诗之旅', routeId: 'r11', routeName: '重庆-宜昌-武汉-九江-南京-上海长江全线下水', routeType: 'downstream',
    shipId: 's01', shipName: '长江探索号', shipLevel: '五星级',
    startPort: '重庆港', endPort: '上海港', days: 11, nights: 10, mileage: 1195, duration: '11天10晚',
    icon: '', images: [], description: '万里长江全线下水航线，11天10晚从山城重庆到魔都上海，一次走完长江黄金水道。',
    segments: genSegments([
      { name: '重庆港', day: 0, dist: 0 }, { name: '宜昌港', day: 3, dist: 310 }, { name: '岳阳港', day: 5, dist: 195 }, { name: '武汉港', day: 6, dist: 140 }, { name: '九江港', day: 7, dist: 130 }, { name: '南京港', day: 9, dist: 220 }, { name: '上海港', day: 11, dist: 200 },
    ]) as ProductSegment[],
    pricing: genPricing(genSegments([
      { name: '重庆港', day: 0, dist: 0 }, { name: '宜昌港', day: 3, dist: 310 }, { name: '岳阳港', day: 5, dist: 195 }, { name: '武汉港', day: 6, dist: 140 }, { name: '九江港', day: 7, dist: 130 }, { name: '南京港', day: 9, dist: 220 }, { name: '上海港', day: 11, dist: 200 },
    ]) as ProductSegment[], ships[0].cabinTypes),
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-25 14:00:00',  createdAt: '2026-03-25 09:00:00',
  },
  // 环渤海北线
  {
    id: 'prod13', name: '环渤海北线之旅', routeId: 'r12', routeName: '天津-秦皇岛-大连-烟台环渤海北线', routeType: 'downstream',
    shipId: 's04', shipName: '维多利亚号', shipLevel: '五星级',
    startPort: '天津港', endPort: '烟台港', days: 5, nights: 4, mileage: 305, duration: '5天4晚',
    icon: '', images: [], description: '从天津出发，经山海关、大连到烟台，环渤海北线感受长城起点与海滨魅力。',
    segments: genSegments([
      { name: '天津港', day: 0, dist: 0 }, { name: '秦皇岛港', day: 1, dist: 90 }, { name: '大连港', day: 2, dist: 130 }, { name: '烟台港', day: 4, dist: 85 },
    ]) as ProductSegment[],
    pricing: genPricing(genSegments([
      { name: '天津港', day: 0, dist: 0 }, { name: '秦皇岛港', day: 1, dist: 90 }, { name: '大连港', day: 2, dist: 130 }, { name: '烟台港', day: 4, dist: 85 },
    ]) as ProductSegment[], ships[3].cabinTypes),
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-24 09:30:00',  createdAt: '2026-03-28 08:00:00',
  },
  // 华东精华
  {
    id: 'prod14', name: '华东沿海精华游', routeId: 'r13', routeName: '厦门-宁波-上海华东精华航线', routeType: 'upstream',
    shipId: 's02', shipName: '世纪游轮', shipLevel: '五星级',
    startPort: '厦门港', endPort: '上海港', days: 5, nights: 4, mileage: 430, duration: '5天4晚',
    icon: '', images: [], description: '从海上花园厦门到东方明珠上海，5天4晚华东沿海精华航线。',
    segments: genSegments([
      { name: '厦门港', day: 0, dist: 0 }, { name: '温州港', day: 1, dist: 175 }, { name: '宁波港', day: 2, dist: 120 }, { name: '上海港', day: 4, dist: 135 },
    ]) as ProductSegment[],
    pricing: genPricing(genSegments([
      { name: '厦门港', day: 0, dist: 0 }, { name: '温州港', day: 1, dist: 175 }, { name: '宁波港', day: 2, dist: 120 }, { name: '上海港', day: 4, dist: 135 },
    ]) as ProductSegment[], ships[1].cabinTypes),
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-23 15:00:00',  createdAt: '2026-03-30 10:00:00',
  },
  // 三峡快捷
  {
    id: 'prod15', name: '三峡快捷精华游', routeId: 'r14', routeName: '重庆-宜昌快捷航线', routeType: 'downstream',
    shipId: 's05', shipName: '三峡明珠号', shipLevel: '四星级',
    startPort: '重庆港', endPort: '宜昌港', days: 3, nights: 2, mileage: 360, duration: '3天2晚',
    icon: '', images: [], description: '三峡快捷下水航线，3天2晚精华三峡全覆盖，适合快节奏出行。',
    segments: genSegments([
      { name: '重庆港', day: 0, dist: 0 }, { name: '巫山', day: 2, dist: 230 }, { name: '宜昌港', day: 3, dist: 130 },
    ]) as ProductSegment[],
    pricing: genPricing(genSegments([
      { name: '重庆港', day: 0, dist: 0 }, { name: '巫山', day: 2, dist: 230 }, { name: '宜昌港', day: 3, dist: 130 },
    ]) as ProductSegment[], ships[4].cabinTypes),
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-22 10:00:00',  createdAt: '2026-04-01 08:00:00',
  },
  // 南粤风情（禁用状态）
  {
    id: 'prod16', name: '南粤风情深度游', routeId: 'r15', routeName: '深圳-广州-珠海-湛江-北海南粤风情航线', routeType: 'downstream',
    shipId: 's08', shipName: '扬子江号', shipLevel: '三星级',
    startPort: '深圳港', endPort: '北海港', days: 6, nights: 5, mileage: 425, duration: '6天5晚',
    icon: '', images: [], description: '从深圳特区到北部湾明珠北海，6天5晚南粤全景深度体验。',
    segments: genSegments([
      { name: '深圳港', day: 0, dist: 0 }, { name: '广州港', day: 1, dist: 50 }, { name: '珠海港', day: 2, dist: 75 }, { name: '湛江港', day: 3, dist: 180 }, { name: '北海港', day: 5, dist: 120 },
    ]) as ProductSegment[],
    pricing: genPricing(genSegments([
      { name: '深圳港', day: 0, dist: 0 }, { name: '广州港', day: 1, dist: 50 }, { name: '珠海港', day: 2, dist: 75 }, { name: '湛江港', day: 3, dist: 180 }, { name: '北海港', day: 5, dist: 120 },
    ]) as ProductSegment[], ships[7].cabinTypes),
    status: 'disabled', updatedBy: '系统管理员', updatedAt: '2026-04-21 08:30:00',  createdAt: '2026-04-05 09:00:00',
  },
]

// ===================== 数据看板 =====================
export const dashboardData: DashboardData = {
  todaySales: 1856000,
  todayPurchase: 426800,
  skuCount: 2347,
  alertCount: 18,
  pendingPurchaseOrders: 12,
  pendingSalesOrders: 8,
  salesTrend: [
    { date: '05-02', amount: 1520000 }, { date: '05-03', amount: 1680000 },
    { date: '05-04', amount: 1430000 }, { date: '05-05', amount: 1920000 },
    { date: '05-06', amount: 1750000 }, { date: '05-07', amount: 2010000 },
    { date: '05-08', amount: 1856000 },
  ],
  purchaseTrend: [
    { date: '05-02', amount: 380000 }, { date: '05-03', amount: 410000 },
    { date: '05-04', amount: 350000 }, { date: '05-05', amount: 450000 },
    { date: '05-06', amount: 398000 }, { date: '05-07', amount: 435000 },
    { date: '05-08', amount: 426800 },
  ],
  alertList: [
    { name: '长江探索号-标准间库存', stock: 2, minStock: 10 },
    { name: '三峡游轮-阳台房库存', stock: 1, minStock: 5 },
    { name: '世纪游轮-内舱房库存', stock: 3, minStock: 8 },
    { name: '黄金游轮-海景房库存', stock: 0, minStock: 6 },
    { name: '维多利亚号-套房库存', stock: 1, minStock: 3 },
  ],
}

// ===================== 航次数据 =====================
export const voyages: import('@/types').Voyage[] = [
  {
    id: 'v01', voyageNo: 'CJ20260501-TXS', shipName: '长江探索号', routeName: '重庆-宜昌三峡航线（下水）', productName: '三峡经典下水之旅', days: 4, startDate: '2026-05-15', endDate: '2026-05-18', status: 'ticketing', direction: 'downstream', totalCabins: 210, soldCabins: 142, availableCabins: 68, shipId: 's01', routeId: 'r01', productId: 'prod01', templateName: '三峡下水准模板', templateId: 'vt01', approvalStatus: '已审批', approvalTimeline: [{nodeName: '提交申请', approver: '运营经理', status: 'approved', duration: '2小时', plan: '自动通过', time: '2026-04-01 10:00'}],
    itinerary: [
      { id: 'vit01_1', portName: '重庆港', day: 0, arrivalTime: '', departureTime: '20:00', theme: '', startTime: '', endTime: '', description: '', agency: '', attraction: '' },
      { id: 'vit01_2', portName: '丰都', day: 1, arrivalTime: '08:00', departureTime: '12:00', theme: '景点', startTime: '08:30', endTime: '11:30', description: '游览丰都鬼城', agency: '中青旅', attraction: '丰都鬼城' },
      { id: 'vit01_3', portName: '丰都', day: 1, arrivalTime: '08:00', departureTime: '12:00', theme: '用餐', startTime: '12:00', endTime: '13:00', description: '船上自助午餐', agency: '', attraction: '' },
      { id: 'vit01_4', portName: '奉节', day: 2, arrivalTime: '07:00', departureTime: '14:00', theme: '景点', startTime: '08:00', endTime: '12:00', description: '游览白帝城', agency: '春秋旅游', attraction: '' },
      { id: 'vit01_5', portName: '宜昌港', day: 4, arrivalTime: '09:00', departureTime: '', theme: '', startTime: '', endTime: '', description: '', agency: '', attraction: '' },
    ],
    updatedBy: '系统管理员', updatedAt: '2026-05-01 08:00:00', createdAt: '2026-04-01 08:00:00',
  },
  { id: 'v02', voyageNo: 'CJ20260502-TXS', shipName: '长江探索号', routeName: '重庆-宜昌三峡航线（下水）', productName: '三峡经典下水之旅', days: 4, startDate: '2026-05-19', endDate: '2026-05-22', status: 'ticketing', direction: 'downstream', totalCabins: 210, soldCabins: 89, availableCabins: 121, shipId: 's01', routeId: 'r01', productId: 'prod01', templateName: '', templateId: '', approvalStatus: '已审批', approvalTimeline: [{nodeName: '提交申请', approver: '运营经理', status: 'approved', duration: '2小时', plan: '自动通过', time: '2026-04-01 10:00'}],  updatedBy: '系统管理员', updatedAt: '2026-05-01 08:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'v03', voyageNo: 'CJ20260503-SJ', shipName: '世纪游轮', routeName: '重庆-宜昌三峡航线（下水）', productName: '世纪游轮三峡下水游', days: 4, startDate: '2026-05-16', endDate: '2026-05-19', status: 'ticketing', direction: 'downstream', totalCabins: 230, soldCabins: 195, availableCabins: 35, shipId: 's02', routeId: 'r01', productId: 'prod02', templateName: '', templateId: '', approvalStatus: '已审批', approvalTimeline: [{nodeName: '提交申请', approver: '运营经理', status: 'approved', duration: '2小时', plan: '自动通过', time: '2026-04-01 10:00'}],  updatedBy: '系统管理员', updatedAt: '2026-05-01 08:00:00', createdAt: '2026-04-02 09:00:00' },
  { id: 'v04', voyageNo: 'CJ20260504-HJ', shipName: '黄金游轮', routeName: '宜昌-重庆三峡航线（上水）', productName: '三峡深度上水游', days: 5, startDate: '2026-05-14', endDate: '2026-05-18', status: 'ticketing', direction: 'upstream', totalCabins: 165, soldCabins: 110, availableCabins: 55, shipId: 's03', routeId: 'r02', productId: 'prod03', templateName: '', templateId: '', approvalStatus: '已审批', approvalTimeline: [{nodeName: '提交申请', approver: '运营经理', status: 'approved', duration: '2小时', plan: '自动通过', time: '2026-04-01 10:00'}],  updatedBy: '系统管理员', updatedAt: '2026-05-01 08:00:00', createdAt: '2026-04-02 09:00:00' },
  { id: 'v05', voyageNo: 'CJ20260505-WDL', shipName: '维多利亚号', routeName: '青岛-大连-天津环渤海航线', productName: '环渤海风情游', days: 5, startDate: '2026-05-20', endDate: '2026-05-24', status: 'suspended', direction: 'downstream', totalCabins: 245, soldCabins: 0, availableCabins: 245, shipId: 's04', routeId: 'r03', productId: 'prod04', templateName: '', templateId: '', approvalStatus: '已审批', approvalTimeline: [{nodeName: '提交申请', approver: '运营经理', status: 'approved', duration: '2小时', plan: '自动通过', time: '2026-04-01 10:00'}],  updatedBy: '系统管理员', updatedAt: '2026-05-01 08:00:00', createdAt: '2026-04-03 10:00:00' },
  { id: 'v06', voyageNo: 'CJ20260506-HT', shipName: '海天号', routeName: '上海-宁波-厦门-深圳东南沿海航线', productName: '东南沿海黄金线', days: 6, startDate: '2026-05-18', endDate: '2026-05-23', status: 'chartered', direction: 'downstream', totalCabins: 155, soldCabins: 0, availableCabins: 0, shipId: 's07', routeId: 'r04', productId: 'prod05', templateName: '', templateId: '', approvalStatus: '已审批', approvalTimeline: [{nodeName: '提交申请', approver: '运营经理', status: 'approved', duration: '2小时', plan: '自动通过', time: '2026-04-01 10:00'}],  updatedBy: '系统管理员', updatedAt: '2026-05-01 08:00:00', createdAt: '2026-04-03 10:00:00' },
  { id: 'v07', voyageNo: 'CJ20260507-WDL2', shipName: '维多利亚号', routeName: '海口-三亚-北海南海航线', productName: '南国热带逍遥游', days: 4, startDate: '2026-05-25', endDate: '2026-05-28', status: 'ticketing', direction: 'downstream', totalCabins: 245, soldCabins: 78, availableCabins: 167, shipId: 's04', routeId: 'r05', productId: 'prod06', templateName: '', templateId: '', approvalStatus: '已审批', approvalTimeline: [{nodeName: '提交申请', approver: '运营经理', status: 'approved', duration: '2小时', plan: '自动通过', time: '2026-04-01 10:00'}],  updatedBy: '系统管理员', updatedAt: '2026-05-01 08:00:00', createdAt: '2026-04-04 08:00:00' },
  { id: 'v08', voyageNo: 'CJ20260508-TXS2', shipName: '长江探索号', routeName: '武汉-九江-南京-上海长江中下游航线', productName: '长江中下游全景游', days: 7, startDate: '2026-06-01', endDate: '2026-06-07', status: 'ticketing', direction: 'downstream', totalCabins: 210, soldCabins: 156, availableCabins: 54, shipId: 's01', routeId: 'r06', productId: 'prod07', templateName: '', templateId: '', approvalStatus: '已审批', approvalTimeline: [{nodeName: '提交申请', approver: '运营经理', status: 'approved', duration: '2小时', plan: '自动通过', time: '2026-04-01 10:00'}],  updatedBy: '系统管理员', updatedAt: '2026-05-01 08:00:00', createdAt: '2026-04-04 08:00:00' },
  { id: 'v09', voyageNo: 'CJ20260509-HT2', shipName: '海天号', routeName: '大连-烟台-威海-青岛东北亚航线', productName: '齐鲁辽东精华游', days: 5, startDate: '2026-06-02', endDate: '2026-06-06', status: 'deadhead', direction: 'downstream', totalCabins: 155, soldCabins: 0, availableCabins: 155, shipId: 's07', routeId: 'r07', productId: 'prod08', templateName: '', templateId: '', approvalStatus: '已审批', approvalTimeline: [{nodeName: '提交申请', approver: '运营经理', status: 'approved', duration: '2小时', plan: '自动通过', time: '2026-04-01 10:00'}],  updatedBy: '系统管理员', updatedAt: '2026-05-01 08:00:00', createdAt: '2026-04-05 11:00:00' },
  { id: 'v10', voyageNo: 'CJ20260510-SXMZ', shipName: '三峡明珠号', routeName: '广州-珠海-深圳珠三角航线', productName: '大湾区精品短线', days: 3, startDate: '2026-05-22', endDate: '2026-05-24', status: 'pending', direction: 'downstream', totalCabins: 140, soldCabins: 0, availableCabins: 140, shipId: 's05', routeId: 'r08', productId: 'prod09', templateName: '', templateId: '', approvalStatus: '已审批', approvalTimeline: [{nodeName: '提交申请', approver: '运营经理', status: 'approved', duration: '2小时', plan: '自动通过', time: '2026-04-01 10:00'}],  updatedBy: '系统管理员', updatedAt: '2026-05-01 08:00:00', createdAt: '2026-04-05 11:00:00' },
  { id: 'v11', voyageNo: 'CJ20260511-HJ2', shipName: '黄金游轮', routeName: '上海-南京-武汉长江中游上水航线', productName: '长江中游古韵游', days: 6, startDate: '2026-06-05', endDate: '2026-06-10', status: 'ticketing', direction: 'upstream', totalCabins: 165, soldCabins: 45, availableCabins: 120, shipId: 's03', routeId: 'r09', productId: 'prod10', templateName: '', templateId: '', approvalStatus: '已审批', approvalTimeline: [{nodeName: '提交申请', approver: '运营经理', status: 'approved', duration: '2小时', plan: '自动通过', time: '2026-04-01 10:00'}],  updatedBy: '系统管理员', updatedAt: '2026-05-01 08:00:00', createdAt: '2026-04-06 14:00:00' },
  { id: 'v12', voyageNo: 'CJ20260512-SJ2', shipName: '世纪游轮', routeName: '北海-三亚-广州-厦门南海东海连线', productName: '南海东海全景连线', days: 7, startDate: '2026-06-08', endDate: '2026-06-14', status: 'ticketing', direction: 'upstream', totalCabins: 230, soldCabins: 201, availableCabins: 29, shipId: 's02', routeId: 'r10', productId: 'prod11', templateName: '', templateId: '', approvalStatus: '已审批', approvalTimeline: [{nodeName: '提交申请', approver: '运营经理', status: 'approved', duration: '2小时', plan: '自动通过', time: '2026-04-01 10:00'}],  updatedBy: '系统管理员', updatedAt: '2026-05-01 08:00:00', createdAt: '2026-04-06 14:00:00' },
  { id: 'v13', voyageNo: 'CJ20260513-TXS3', shipName: '长江探索号', routeName: '重庆-宜昌-武汉-九江-南京-上海长江全线下水', productName: '万里长江史诗之旅', days: 11, startDate: '2026-06-15', endDate: '2026-06-25', status: 'transfer', direction: 'downstream', totalCabins: 210, soldCabins: 180, availableCabins: 30, shipId: 's01', routeId: 'r11', productId: 'prod12', templateName: '', templateId: '', approvalStatus: '已审批', approvalTimeline: [{nodeName: '提交申请', approver: '运营经理', status: 'approved', duration: '2小时', plan: '自动通过', time: '2026-04-01 10:00'}],  updatedBy: '系统管理员', updatedAt: '2026-05-01 08:00:00', createdAt: '2026-04-07 09:00:00' },
  { id: 'v14', voyageNo: 'CJ20260514-WDL3', shipName: '维多利亚号', routeName: '天津-秦皇岛-大连-烟台环渤海北线', productName: '环渤海北线之旅', days: 5, startDate: '2026-06-03', endDate: '2026-06-07', status: 'ticketing', direction: 'downstream', totalCabins: 245, soldCabins: 67, availableCabins: 178, shipId: 's04', routeId: 'r12', productId: 'prod13', templateName: '', templateId: '', approvalStatus: '已审批', approvalTimeline: [{nodeName: '提交申请', approver: '运营经理', status: 'approved', duration: '2小时', plan: '自动通过', time: '2026-04-01 10:00'}],  updatedBy: '系统管理员', updatedAt: '2026-05-01 08:00:00', createdAt: '2026-04-07 09:00:00' },
  { id: 'v15', voyageNo: 'CJ20260515-SXMZ2', shipName: '三峡明珠号', routeName: '重庆-宜昌快捷航线', productName: '三峡快捷精华游', days: 3, startDate: '2026-05-28', endDate: '2026-05-30', status: 'ticketing', direction: 'downstream', totalCabins: 140, soldCabins: 98, availableCabins: 42, shipId: 's05', routeId: 'r14', productId: 'prod15', templateName: '', templateId: '', approvalStatus: '已审批', approvalTimeline: [{nodeName: '提交申请', approver: '运营经理', status: 'approved', duration: '2小时', plan: '自动通过', time: '2026-04-01 10:00'}],  updatedBy: '系统管理员', updatedAt: '2026-05-01 08:00:00', createdAt: '2026-04-08 10:00:00' },
  { id: 'v16', voyageNo: 'CJ20260516-YZJ', shipName: '扬子江号', routeName: '深圳-广州-珠海-湛江-北海南粤风情航线', productName: '南粤风情深度游', days: 6, startDate: '2026-06-10', endDate: '2026-06-15', status: 'suspended', direction: 'downstream', totalCabins: 95, soldCabins: 0, availableCabins: 0, shipId: 's08', routeId: 'r15', productId: 'prod16', templateName: '', templateId: '', approvalStatus: '已审批', approvalTimeline: [{nodeName: '提交申请', approver: '运营经理', status: 'approved', duration: '2小时', plan: '自动通过', time: '2026-04-01 10:00'}],  updatedBy: '系统管理员', updatedAt: '2026-05-01 08:00:00', createdAt: '2026-04-08 10:00:00' },
]

// ===================== 航次模板数据 =====================
const tplAgencies = ['中青旅', '春秋旅游', '携程国旅', '康辉旅游', '众信旅游']
const tplAttractions: Record<string, string[]> = {
  '重庆港': ['洪崖洞', '解放碑', '磁器口'],
  '丰都': ['丰都鬼城', '名山景区'],
  '宜昌港': ['三峡大坝', '三峡人家', '屈原故里'],
  '武汉港': ['黄鹤楼', '东湖', '户部巷'],
  '南京港': ['中山陵', '夫子庙', '总统府'],
  '上海港': ['外滩', '东方明珠', '豫园'],
}

export const voyageTemplates: import('@/types').VoyageTemplate[] = [
  {
    id: 'vt01', code: 'TPL-SX-DOWN-001', name: '三峡下水准模板', productId: 'prod01', productName: '三峡经典下水之旅', shipName: '长江探索号',
    voyageEndTime: '2026-05-18', voyageStartTime: '2026-05-15', sailType: '周内固定', sailDay: '周一', sailTime: '20:00', totalDays: 4,
    inventory: [
      { id: 'tinv01_1', cabinName: '套房', totalBeds: 2, released: 0, status: 'open' },
      { id: 'tinv01_2', cabinName: '阳台房', totalBeds: 2, released: 0, status: 'open' },
      { id: 'tinv01_3', cabinName: '海景房', totalBeds: 2, released: 0, status: 'closed' },
    ],
    itinerary: [
      { id: 'tit01_1', portName: '重庆港', day: 0, arrivalTime: '', departureTime: '20:00', theme: '', startTime: '', endTime: '', description: '', agency: '', attraction: '' },
      { id: 'tit01_2', portName: '丰都', day: 1, arrivalTime: '08:00', departureTime: '12:00', theme: '景点', startTime: '08:30', endTime: '11:30', description: '游览丰都鬼城', agency: '中青旅', attraction: '丰都鬼城' },
      { id: 'tit01_3', portName: '丰都', day: 1, arrivalTime: '08:00', departureTime: '12:00', theme: '用餐', startTime: '12:00', endTime: '13:00', description: '船上自助午餐', agency: '', attraction: '' },
      { id: 'tit01_4', portName: '奉节', day: 2, arrivalTime: '07:00', departureTime: '14:00', theme: '景点', startTime: '08:00', endTime: '12:00', description: '游览白帝城', agency: '春秋旅游', attraction: '' },
      { id: 'tit01_5', portName: '宜昌港', day: 4, arrivalTime: '09:00', departureTime: '', theme: '', startTime: '', endTime: '', description: '', agency: '', attraction: '' },
    ],
    deposits: [
      { id: 'tdep01_1', marketCategory: '欧美', deposit: 3000 },
      { id: 'tdep01_2', marketCategory: '中东', deposit: 2000 },
      { id: 'tdep01_3', marketCategory: '内宾', deposit: 1000 },
    ],
    basePriceRef: 2800, surchargeStrategy: ['节假日加价', '旺季加价'], settlementRule: '月结30天', earlyBirdDiscount: 200,
    presaleDays: 90, cutoffDays: 3, refundPolicy: '标准退改', materialReq: ['宣传册', '行程单'],
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-10 09:00:00',  createdAt: '2026-03-20 08:00:00',
  },
  {
    id: 'vt02', code: 'TPL-SX-UP-001', name: '三峡上水准模板', productId: 'prod03', productName: '三峡深度上水游', shipName: '黄金游轮',
    voyageEndTime: '2026-05-18', voyageStartTime: '2026-05-14', sailType: '周期循环', sailDay: '7', sailTime: '18:00', totalDays: 5,
    inventory: [
      { id: 'tinv02_1', cabinName: '阳台房', totalBeds: 2, released: 0, status: 'open' },
      { id: 'tinv02_2', cabinName: '海景房', totalBeds: 2, released: 0, status: 'open' },
    ],
    itinerary: [
      { id: 'tit02_1', portName: '宜昌港', day: 0, arrivalTime: '', departureTime: '18:00', theme: '', startTime: '', endTime: '', description: '', agency: '', attraction: '' },
      { id: 'tit02_2', portName: '奉节', day: 2, arrivalTime: '14:00', departureTime: '18:00', theme: '景点', startTime: '14:30', endTime: '17:30', description: '游览白帝城、夔门', agency: '携程国旅', attraction: '' },
      { id: 'tit02_3', portName: '丰都', day: 3, arrivalTime: '09:00', departureTime: '13:00', theme: '景点', startTime: '09:30', endTime: '12:00', description: '游览名山景区', agency: '康辉旅游', attraction: '名山景区' },
      { id: 'tit02_4', portName: '重庆港', day: 5, arrivalTime: '08:00', departureTime: '', theme: '', startTime: '', endTime: '', description: '', agency: '', attraction: '' },
    ],
    deposits: [
      { id: 'tdep02_1', marketCategory: '欧美', deposit: 3500 },
      { id: 'tdep02_2', marketCategory: '内宾', deposit: 1500 },
    ],
    basePriceRef: 3200, surchargeStrategy: ['节假日加价'], settlementRule: '月结30天', earlyBirdDiscount: 300,
    presaleDays: 60, cutoffDays: 5, refundPolicy: '标准退改', materialReq: ['行程单'],
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-09 14:00:00',  createdAt: '2026-03-22 09:00:00',
  },
  {
    id: 'vt03', code: 'TPL-BH-DOWN-001', name: '环渤海风光准模板', productId: 'prod04', productName: '环渤海风情游', shipName: '维多利亚号',
    voyageEndTime: '2026-05-24', voyageStartTime: '2026-05-20', sailType: '周内固定', sailDay: '周三', sailTime: '17:00', totalDays: 5,
    inventory: [
      { id: 'tinv03_1', cabinName: '套房', totalBeds: 2, released: 0, status: 'open' },
      { id: 'tinv03_2', cabinName: '阳台房', totalBeds: 2, released: 0, status: 'open' },
      { id: 'tinv03_3', cabinName: '海景房', totalBeds: 2, released: 0, status: 'open' },
    ],
    itinerary: [
      { id: 'tit03_1', portName: '青岛港', day: 0, arrivalTime: '', departureTime: '17:00', theme: '', startTime: '', endTime: '', description: '', agency: '', attraction: '' },
      { id: 'tit03_2', portName: '烟台港', day: 1, arrivalTime: '08:00', departureTime: '17:00', theme: '景点', startTime: '09:00', endTime: '16:00', description: '游览蓬莱阁、烟台山', agency: '众信旅游', attraction: '' },
      { id: 'tit03_3', portName: '大连港', day: 2, arrivalTime: '09:00', departureTime: '18:00', theme: '景点', startTime: '09:30', endTime: '17:00', description: '星海广场、老虎滩', agency: '中青旅', attraction: '' },
      { id: 'tit03_4', portName: '天津港', day: 4, arrivalTime: '08:00', departureTime: '', theme: '', startTime: '', endTime: '', description: '', agency: '', attraction: '' },
    ],
    deposits: [
      { id: 'tdep03_1', marketCategory: '内宾', deposit: 2000 },
    ],
    basePriceRef: 3500, surchargeStrategy: ['旺季加价'], settlementRule: '预付款50%', earlyBirdDiscount: 500,
    presaleDays: 120, cutoffDays: 7, refundPolicy: '标准退改', materialReq: ['宣传册', '行程单', '保险单'],
    status: 'draft', updatedBy: '系统管理员', updatedAt: '2026-04-08 10:00:00',  createdAt: '2026-03-25 10:00:00',
  },
  {
    id: 'vt04', code: 'TPL-CJ-MD-001', name: '长江中下游准模板', productId: 'prod07', productName: '长江中下游全景游', shipName: '长江探索号',
    voyageEndTime: '2026-06-07', voyageStartTime: '2026-06-01', sailType: '周期循环', sailDay: '14', sailTime: '18:00', totalDays: 7,
    inventory: [
      { id: 'tinv04_1', cabinName: '套房', totalBeds: 2, released: 0, status: 'open' },
      { id: 'tinv04_2', cabinName: '阳台房', totalBeds: 2, released: 0, status: 'open' },
      { id: 'tinv04_3', cabinName: '海景房', totalBeds: 2, released: 0, status: 'closed' },
    ],
    itinerary: [
      { id: 'tit04_1', portName: '武汉港', day: 0, arrivalTime: '', departureTime: '18:00', theme: '', startTime: '', endTime: '', description: '', agency: '', attraction: '' },
      { id: 'tit04_2', portName: '九江港', day: 2, arrivalTime: '08:00', departureTime: '14:00', theme: '景点', startTime: '08:30', endTime: '12:30', description: '庐山一日游', agency: '携程国旅', attraction: '庐山' },
      { id: 'tit04_3', portName: '南京港', day: 5, arrivalTime: '12:00', departureTime: '20:00', theme: '景点', startTime: '13:00', endTime: '18:00', description: '中山陵、夫子庙', agency: '康辉旅游', attraction: '中山陵' },
      { id: 'tit04_4', portName: '上海港', day: 7, arrivalTime: '10:00', departureTime: '', theme: '', startTime: '', endTime: '', description: '', agency: '', attraction: '' },
    ],
    deposits: [
      { id: 'tdep04_1', marketCategory: '欧美', deposit: 5000 },
      { id: 'tdep04_2', marketCategory: '中东', deposit: 3000 },
      { id: 'tdep04_3', marketCategory: '内宾', deposit: 2000 },
    ],
    basePriceRef: 6800, surchargeStrategy: ['节假日加价', '旺季加价', '单房差'], settlementRule: '月结30天', earlyBirdDiscount: 800,
    presaleDays: 180, cutoffDays: 10, refundPolicy: '严格退改', materialReq: ['宣传册', '行程单', '签证指南'],
    status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-07 11:00:00',  createdAt: '2026-03-28 08:00:00',
  },
  {
    id: 'vt05', code: 'TPL-DW-DOWN-001', name: '大湾区短线准模板', productId: 'prod09', productName: '大湾区精品短线', shipName: '三峡明珠号',
    voyageEndTime: '2026-05-24', voyageStartTime: '2026-05-22', sailType: '周内固定', sailDay: '周五', sailTime: '18:00', totalDays: 3,
    inventory: [
      { id: 'tinv05_1', cabinName: '海景房', totalBeds: 2, released: 0, status: 'open' },
      { id: 'tinv05_2', cabinName: '内舱房', totalBeds: 2, released: 0, status: 'open' },
    ],
    itinerary: [
      { id: 'tit05_1', portName: '广州港', day: 0, arrivalTime: '', departureTime: '18:00', theme: '', startTime: '', endTime: '', description: '', agency: '', attraction: '' },
      { id: 'tit05_2', portName: '珠海港', day: 1, arrivalTime: '08:00', departureTime: '17:00', theme: '景点', startTime: '09:00', endTime: '16:00', description: '长隆海洋王国', agency: '春秋旅游', attraction: '' },
      { id: 'tit05_3', portName: '深圳港', day: 3, arrivalTime: '08:00', departureTime: '', theme: '', startTime: '', endTime: '', description: '', agency: '', attraction: '' },
    ],
    deposits: [
      { id: 'tdep05_1', marketCategory: '内宾', deposit: 500 },
    ],
    basePriceRef: 1200, surchargeStrategy: [], settlementRule: '全额预付', earlyBirdDiscount: 100,
    presaleDays: 30, cutoffDays: 1, refundPolicy: '灵活退改', materialReq: ['行程单'],
    status: 'disabled', updatedBy: '系统管理员', updatedAt: '2026-04-06 15:00:00',  createdAt: '2026-04-01 09:00:00',
  },
]

// ===================== 票类数据 =====================
export const tickets: import('@/types').Ticket[] = [
  { id: 'tk01', name: '成人标准票', guestType: 'adult', priceCoefficient: 1.0, shareRoomType: 'amount', shareRoomDirection: 'increase', shareRoomValue: 200, extraBedType: 'amount', extraBedDirection: 'increase', extraBedValue: 300, tipType: '按天收取', tipValue: 50, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-10 09:00:00',  createdAt: '2026-01-10 08:00:00' },
  { id: 'tk02', name: '成人豪华票', guestType: 'adult', priceCoefficient: 1.2, shareRoomType: 'percent', shareRoomDirection: 'increase', shareRoomValue: 15, extraBedType: 'percent', extraBedDirection: 'increase', extraBedValue: 20, tipType: '按天收取', tipValue: 80, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-09 10:00:00',  createdAt: '2026-01-10 08:00:00' },
  { id: 'tk03', name: '成人商务票', guestType: 'adult', priceCoefficient: 1.5, shareRoomType: 'amount', shareRoomDirection: 'increase', shareRoomValue: 500, extraBedType: 'amount', extraBedDirection: 'increase', extraBedValue: 600, tipType: '按人收取', tipValue: 100, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-08 11:00:00',  createdAt: '2026-01-12 09:00:00' },
  { id: 'tk04', name: '儿童标准票', guestType: 'child', priceCoefficient: 0.3, shareRoomType: 'amount', shareRoomDirection: 'increase', shareRoomValue: 100, extraBedType: 'amount', extraBedDirection: 'increase', extraBedValue: 150, tipType: '不收取', tipValue: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-07 14:00:00',  createdAt: '2026-01-15 10:00:00' },
  { id: 'tk05', name: '儿童半价票', guestType: 'child', priceCoefficient: 0.5, shareRoomType: 'percent', shareRoomDirection: 'increase', shareRoomValue: 10, extraBedType: 'percent', extraBedDirection: 'increase', extraBedValue: 10, tipType: '不收取', tipValue: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-06 08:30:00',  createdAt: '2026-01-15 10:00:00' },
  { id: 'tk06', name: '婴儿票', guestType: 'baby', priceCoefficient: 0.1, shareRoomType: 'amount', shareRoomDirection: 'increase', shareRoomValue: 0, extraBedType: 'amount', extraBedDirection: 'increase', extraBedValue: 0, tipType: '不收取', tipValue: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-05 15:00:00',  createdAt: '2026-01-18 08:30:00' },
  { id: 'tk07', name: '成人团购票', guestType: 'adult', priceCoefficient: 0.85, shareRoomType: 'percent', shareRoomDirection: 'increase', shareRoomValue: 20, extraBedType: 'amount', extraBedDirection: 'increase', extraBedValue: 250, tipType: '按天收取', tipValue: 30, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-04 09:15:00',  createdAt: '2026-01-20 09:00:00' },
  { id: 'tk08', name: '老年优待票', guestType: 'adult', priceCoefficient: 0.7, shareRoomType: 'amount', shareRoomDirection: 'increase', shareRoomValue: 150, extraBedType: 'amount', extraBedDirection: 'increase', extraBedValue: 200, tipType: '按天收取', tipValue: 20, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-03 11:30:00',  createdAt: '2026-01-22 08:00:00' },
  { id: 'tk09', name: '学生特惠票', guestType: 'adult', priceCoefficient: 0.6, shareRoomType: 'percent', shareRoomDirection: 'increase', shareRoomValue: 12, extraBedType: 'percent', extraBedDirection: 'increase', extraBedValue: 15, tipType: '不收取', tipValue: 0, status: 'disabled', updatedBy: '系统管理员', updatedAt: '2026-04-02 14:45:00',  createdAt: '2026-01-25 09:00:00' },
  { id: 'tk10', name: '成人早鸟票', guestType: 'adult', priceCoefficient: 0.8, shareRoomType: 'amount', shareRoomDirection: 'increase', shareRoomValue: 200, extraBedType: 'amount', extraBedDirection: 'increase', extraBedValue: 300, tipType: '按天收取', tipValue: 40, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-01 10:00:00',  createdAt: '2026-02-01 08:00:00' },
  { id: 'tk11', name: '儿童优惠票', guestType: 'child', priceCoefficient: 0.2, shareRoomType: 'amount', shareRoomDirection: 'increase', shareRoomValue: 80, extraBedType: 'amount', extraBedDirection: 'increase', extraBedValue: 120, tipType: '不收取', tipValue: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-03-30 08:30:00',  createdAt: '2026-02-05 09:00:00' },
  { id: 'tk12', name: '成人VIP票', guestType: 'adult', priceCoefficient: 2.0, shareRoomType: 'amount', shareRoomDirection: 'increase', shareRoomValue: 1000, extraBedType: 'amount', extraBedDirection: 'increase', extraBedValue: 1200, tipType: '按房收取', tipValue: 200, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-03-29 13:00:00',  createdAt: '2026-02-08 08:00:00' },
  { id: 'tk13', name: '儿童VIP票', guestType: 'child', priceCoefficient: 0.6, shareRoomType: 'amount', shareRoomDirection: 'increase', shareRoomValue: 300, extraBedType: 'amount', extraBedDirection: 'increase', extraBedValue: 400, tipType: '按房收取', tipValue: 100, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-03-28 09:00:00',  createdAt: '2026-02-10 08:00:00' },
  { id: 'tk14', name: '候补票', guestType: 'adult', priceCoefficient: 1.1, shareRoomType: 'percent', shareRoomDirection: 'increase', shareRoomValue: 25, extraBedType: 'percent', extraBedDirection: 'increase', extraBedValue: 25, tipType: '按人收取', tipValue: 60, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-03-27 15:30:00',  createdAt: '2026-02-12 09:00:00' },
  { id: 'tk15', name: '加床票', guestType: 'adult', priceCoefficient: 0.5, shareRoomType: 'amount', shareRoomDirection: 'increase', shareRoomValue: 0, extraBedType: 'amount', extraBedDirection: 'increase', extraBedValue: 500, tipType: '按天收取', tipValue: 30, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-03-26 10:45:00',  createdAt: '2026-02-15 08:00:00' },
  { id: 'tk16', name: '婴儿免费票', guestType: 'baby', priceCoefficient: 0.0, shareRoomType: 'amount', shareRoomDirection: 'increase', shareRoomValue: 0, extraBedType: 'amount', extraBedDirection: 'increase', extraBedValue: 0, tipType: '不收取', tipValue: 0, status: 'disabled', updatedBy: '系统管理员', updatedAt: '2026-03-25 08:00:00',  createdAt: '2026-02-18 09:00:00' },
]

// ===================== 设施数据 =====================
export const facilities: import('@/types').ShipFacility[] = [
  { id: 'f01', code: 'FAC-DINING-001', name: '主餐厅', category: 'dining', maxCapacity: 200, bizStatus: 'open', chargeType: 'free', chargeAmount: 0, mainImage: '', images: [], description: '位于中层甲板的主餐厅，可容纳200人同时就餐，提供中西自助餐及点餐服务。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-15 10:00:00', createdAt: '2025-06-01 08:00:00' },
  { id: 'f02', code: 'FAC-DINING-002', name: '咖啡厅', category: 'dining', maxCapacity: 60, bizStatus: 'open', chargeType: 'per_time', chargeAmount: 58, mainImage: '', images: [], description: '江景咖啡厅，提供现磨咖啡、茶饮及精致糕点。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-14 09:00:00', createdAt: '2025-06-01 08:00:00' },
  { id: 'f03', code: 'FAC-ENT-001', name: '观景酒吧', category: 'entertainment', maxCapacity: 80, bizStatus: 'open', chargeType: 'per_time', chargeAmount: 88, mainImage: '', images: [], description: '顶层观景酒吧，夜间现场乐队表演，可欣赏长江夜景。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-13 11:00:00', createdAt: '2025-06-05 09:00:00' },
  { id: 'f04', code: 'FAC-SPORT-001', name: '健身房', category: 'sports', maxCapacity: 30, bizStatus: 'open', chargeType: 'free', chargeAmount: 0, mainImage: '', images: [], description: '配备跑步机、椭圆机、哑铃等器材，24小时开放。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-12 14:00:00', createdAt: '2025-06-05 09:00:00' },
  { id: 'f05', code: 'FAC-LEISURE-001', name: 'SPA中心', category: 'leisure', maxCapacity: 15, bizStatus: 'open', chargeType: 'per_hour', chargeAmount: 298, mainImage: '', images: [], description: '专业SPA护理中心，提供按摩、面部护理、芳香疗法等服务。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-11 08:30:00', createdAt: '2025-06-10 08:00:00' },
  { id: 'f06', code: 'FAC-ENT-002', name: 'KTV包房', category: 'entertainment', maxCapacity: 20, bizStatus: 'open', chargeType: 'per_hour', chargeAmount: 198, mainImage: '', images: [], description: '豪华KTV包房，配备专业音响设备，适合聚会娱乐。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-10 15:00:00', createdAt: '2025-06-10 08:00:00' },
  { id: 'f07', code: 'FAC-SERVICE-001', name: '医务室', category: 'service', maxCapacity: 10, bizStatus: 'open', chargeType: 'per_time', chargeAmount: 50, mainImage: '', images: [], description: '配备专业医护人员，提供基础医疗服务及应急处理。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-09 10:30:00', createdAt: '2025-06-15 09:00:00' },
  { id: 'f08', code: 'FAC-LEISURE-002', name: '游泳池', category: 'sports', maxCapacity: 50, bizStatus: 'open', chargeType: 'free', chargeAmount: 0, mainImage: '', images: [], description: '恒温游泳池，配备救生员，免费向游客开放。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-08 09:00:00', createdAt: '2025-06-15 09:00:00' },
  { id: 'f09', code: 'FAC-DINING-003', name: '自助餐厅', category: 'dining', maxCapacity: 150, bizStatus: 'open', chargeType: 'free', chargeAmount: 0, mainImage: '', images: [], description: '提供早中晚自助餐，菜品丰富多样。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-07 14:00:00', createdAt: '2025-07-01 08:00:00' },
  { id: 'f10', code: 'FAC-ENT-003', name: '棋牌室', category: 'entertainment', maxCapacity: 40, bizStatus: 'open', chargeType: 'per_hour', chargeAmount: 68, mainImage: '', images: [], description: '提供麻将、扑克等棋牌娱乐设施。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-06 10:00:00', createdAt: '2025-07-01 08:00:00' },
  { id: 'f11', code: 'FAC-SERVICE-002', name: '商店', category: 'service', maxCapacity: 30, bizStatus: 'open', chargeType: 'per_time', chargeAmount: 0, mainImage: '', images: [], description: '游轮纪念品商店，售卖特产、礼品及日用品。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-05 11:30:00', createdAt: '2025-07-05 09:00:00' },
  { id: 'f12', code: 'FAC-LEISURE-003', name: '电影院', category: 'entertainment', maxCapacity: 100, bizStatus: 'maintenance', chargeType: 'free', chargeAmount: 0, mainImage: '', images: [], description: '小型影厅，每日放映热门影片，维护中暂不开放。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-04 08:00:00', createdAt: '2025-07-05 09:00:00' },
  { id: 'f13', code: 'FAC-SPORT-002', name: '儿童乐园', category: 'sports', maxCapacity: 40, bizStatus: 'open', chargeType: 'free', chargeAmount: 0, mainImage: '', images: [], description: '专为儿童设计的游乐空间，配备滑梯、海洋球等设施。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-03 16:00:00', createdAt: '2025-07-10 08:00:00' },
  { id: 'f14', code: 'FAC-DINING-004', name: '江景餐厅', category: 'dining', maxCapacity: 120, bizStatus: 'closed', chargeType: 'per_time', chargeAmount: 128, mainImage: '', images: [], description: '高端江景餐厅，提供精致中餐，因装修暂关闭。', status: 'disabled', updatedBy: '系统管理员', updatedAt: '2026-04-02 09:45:00', createdAt: '2025-07-10 08:00:00' },
  { id: 'f15', code: 'FAC-SERVICE-003', name: '洗衣房', category: 'service', maxCapacity: 10, bizStatus: 'open', chargeType: 'per_time', chargeAmount: 30, mainImage: '', images: [], description: '提供洗衣、干洗及熨烫服务。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-04-01 13:00:00', createdAt: '2025-07-15 09:00:00' },
  { id: 'f16', code: 'FAC-ENT-004', name: '演艺大厅', category: 'entertainment', maxCapacity: 300, bizStatus: 'open', chargeType: 'free', chargeAmount: 0, mainImage: '', images: [], description: '多功能演艺大厅，可举办晚会、讲座及演出活动。', status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-03-30 10:30:00', createdAt: '2025-07-15 09:00:00' },
]

// ===================== 房间数据 =====================
export const rooms: import('@/types').Room[] = [
  { id: 'rm01', roomNo: '8001', shipId: 's01', shipName: '长江探索号', cabinTypeId: '', cabinTypeName: '套房', deckId: 's01_d2', deckName: '2层-中层甲板', floorNum: 2, position: 'mid', connected: false, connectedRoomNo: '', accessible: false, obstructed: false, obstructedNote: '', status: 'available', maintenanceNote: '', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-03-01 08:00:00' },
  { id: 'rm02', roomNo: '8002', shipId: 's01', shipName: '长江探索号', cabinTypeId: '', cabinTypeName: '套房', deckId: 's01_d2', deckName: '2层-中层甲板', floorNum: 2, position: 'mid', connected: true, connectedRoomNo: '8003', accessible: false, obstructed: false, obstructedNote: '', status: 'available', maintenanceNote: '', updatedBy: '系统管理员', updatedAt: '2026-05-09 10:00:00', createdAt: '2026-03-01 08:00:00' },
  { id: 'rm03', roomNo: '8003', shipId: 's01', shipName: '长江探索号', cabinTypeId: '', cabinTypeName: '套房', deckId: 's01_d2', deckName: '2层-中层甲板', floorNum: 2, position: 'mid', connected: true, connectedRoomNo: '8002', accessible: false, obstructed: false, obstructedNote: '', status: 'available', maintenanceNote: '', updatedBy: '系统管理员', updatedAt: '2026-05-09 10:00:00', createdAt: '2026-03-01 08:00:00' },
  { id: 'rm04', roomNo: '8004', shipId: 's01', shipName: '长江探索号', cabinTypeId: '', cabinTypeName: '阳台房', deckId: 's01_d3', deckName: '3层-中层甲板', floorNum: 3, position: 'bow', connected: false, connectedRoomNo: '', accessible: false, obstructed: true, obstructedNote: '救生艇遮挡部分视野', status: 'available', maintenanceNote: '', updatedBy: '系统管理员', updatedAt: '2026-05-08 11:00:00', createdAt: '2026-03-02 09:00:00' },
  { id: 'rm05', roomNo: '8005', shipId: 's01', shipName: '长江探索号', cabinTypeId: '', cabinTypeName: '阳台房', deckId: 's01_d3', deckName: '3层-中层甲板', floorNum: 3, position: 'mid', connected: false, connectedRoomNo: '', accessible: true, obstructed: false, obstructedNote: '', status: 'available', maintenanceNote: '', updatedBy: '系统管理员', updatedAt: '2026-05-08 11:00:00', createdAt: '2026-03-02 09:00:00' },
  { id: 'rm06', roomNo: '8006', shipId: 's01', shipName: '长江探索号', cabinTypeId: '', cabinTypeName: '海景房', deckId: 's01_d3', deckName: '3层-中层甲板', floorNum: 3, position: 'stern', connected: false, connectedRoomNo: '', accessible: false, obstructed: false, obstructedNote: '', status: 'maintenance', maintenanceNote: '空调维修中，预计5月15日恢复', updatedBy: '系统管理员', updatedAt: '2026-05-07 14:00:00', createdAt: '2026-03-02 09:00:00' },
  { id: 'rm07', roomNo: '5001', shipId: 's02', shipName: '世纪游轮', cabinTypeId: '', cabinTypeName: '套房', deckId: 's02_d2', deckName: '2层-中层甲板', floorNum: 2, position: 'mid', connected: false, connectedRoomNo: '', accessible: false, obstructed: false, obstructedNote: '', status: 'available', maintenanceNote: '', updatedBy: '系统管理员', updatedAt: '2026-05-06 09:00:00', createdAt: '2026-03-05 08:00:00' },
  { id: 'rm08', roomNo: '5002', shipId: 's02', shipName: '世纪游轮', cabinTypeId: '', cabinTypeName: '阳台房', deckId: 's02_d3', deckName: '3层-中层甲板', floorNum: 3, position: 'bow', connected: false, connectedRoomNo: '', accessible: false, obstructed: false, obstructedNote: '', status: 'locked', maintenanceNote: 'VIP预留', updatedBy: '系统管理员', updatedAt: '2026-05-06 09:00:00', createdAt: '2026-03-05 08:00:00' },
  { id: 'rm09', roomNo: '5003', shipId: 's02', shipName: '世纪游轮', cabinTypeId: '', cabinTypeName: '海景房', deckId: 's02_d3', deckName: '3层-中层甲板', floorNum: 3, position: 'mid', connected: false, connectedRoomNo: '', accessible: false, obstructed: false, obstructedNote: '', status: 'available', maintenanceNote: '', updatedBy: '系统管理员', updatedAt: '2026-05-05 15:00:00', createdAt: '2026-03-05 08:00:00' },
  { id: 'rm10', roomNo: '5004', shipId: 's02', shipName: '世纪游轮', cabinTypeId: '', cabinTypeName: '内舱房', deckId: 's02_d3', deckName: '3层-中层甲板', floorNum: 3, position: 'stern', connected: false, connectedRoomNo: '', accessible: false, obstructed: false, obstructedNote: '', status: 'available', maintenanceNote: '', updatedBy: '系统管理员', updatedAt: '2026-05-05 15:00:00', createdAt: '2026-03-05 08:00:00' },
  { id: 'rm11', roomNo: '3001', shipId: 's03', shipName: '黄金游轮', cabinTypeId: '', cabinTypeName: '阳台房', deckId: 's03_d2', deckName: '2层-中层甲板', floorNum: 2, position: 'bow', connected: false, connectedRoomNo: '', accessible: false, obstructed: false, obstructedNote: '', status: 'available', maintenanceNote: '', updatedBy: '系统管理员', updatedAt: '2026-05-04 10:00:00', createdAt: '2026-03-08 09:00:00' },
  { id: 'rm12', roomNo: '3002', shipId: 's03', shipName: '黄金游轮', cabinTypeId: '', cabinTypeName: '海景房', deckId: 's03_d2', deckName: '2层-中层甲板', floorNum: 2, position: 'mid', connected: false, connectedRoomNo: '', accessible: true, obstructed: false, obstructedNote: '', status: 'available', maintenanceNote: '', updatedBy: '系统管理员', updatedAt: '2026-05-04 10:00:00', createdAt: '2026-03-08 09:00:00' },
  { id: 'rm13', roomNo: '3003', shipId: 's03', shipName: '黄金游轮', cabinTypeId: '', cabinTypeName: '内舱房', deckId: 's03_d3', deckName: '3层-中层甲板', floorNum: 3, position: 'stern', connected: false, connectedRoomNo: '', accessible: false, obstructed: true, obstructedNote: '靠近电梯区域', status: 'available', maintenanceNote: '', updatedBy: '系统管理员', updatedAt: '2026-05-03 08:00:00', createdAt: '2026-03-08 09:00:00' },
  { id: 'rm14', roomNo: '3004', shipId: 's03', shipName: '黄金游轮', cabinTypeId: '', cabinTypeName: '阳台房', deckId: 's03_d3', deckName: '3层-中层甲板', floorNum: 3, position: 'mid', connected: false, connectedRoomNo: '', accessible: false, obstructed: false, obstructedNote: '', status: 'maintenance', maintenanceNote: '浴室翻新', updatedBy: '系统管理员', updatedAt: '2026-05-03 08:00:00', createdAt: '2026-03-08 09:00:00' },
  { id: 'rm15', roomNo: '6001', shipId: 's04', shipName: '维多利亚号', cabinTypeId: '', cabinTypeName: '套房', deckId: 's04_d2', deckName: '2层-中层甲板', floorNum: 2, position: 'bow', connected: false, connectedRoomNo: '', accessible: false, obstructed: false, obstructedNote: '', status: 'locked', maintenanceNote: '航次包租预留', updatedBy: '系统管理员', updatedAt: '2026-05-02 11:00:00', createdAt: '2026-03-10 09:00:00' },
  { id: 'rm16', roomNo: '6002', shipId: 's04', shipName: '维多利亚号', cabinTypeId: '', cabinTypeName: '阳台房', deckId: 's04_d3', deckName: '3层-中层甲板', floorNum: 3, position: 'mid', connected: true, connectedRoomNo: '6003', accessible: false, obstructed: false, obstructedNote: '', status: 'available', maintenanceNote: '', updatedBy: '系统管理员', updatedAt: '2026-05-02 11:00:00', createdAt: '2026-03-10 09:00:00' },
]
// ===================== 航次库存数据 =====================
export const voyageInventories: import('@/types').VoyageInventory[] = [
  { id: 'inv01', voyageId: 'v01', voyageNo: 'CJ20260501-TXS', shipName: '长江探索号', cabinTypeName: '套房', physicalCapacity: 60, emergencyStock: 3, totalRooms: 25, sold: 13, locked: 1, maintenance: 1, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv02', voyageId: 'v01', voyageNo: 'CJ20260501-TXS', shipName: '长江探索号', cabinTypeName: '阳台房', physicalCapacity: 26, emergencyStock: 0, totalRooms: 50, sold: 22, locked: 0, maintenance: 1, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv03', voyageId: 'v01', voyageNo: 'CJ20260501-TXS', shipName: '长江探索号', cabinTypeName: '海景房', physicalCapacity: 38, emergencyStock: 3, totalRooms: 49, sold: 8, locked: 1, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv04', voyageId: 'v02', voyageNo: 'CJ20260502-TXS', shipName: '长江探索号', cabinTypeName: '套房', physicalCapacity: 48, emergencyStock: 0, totalRooms: 40, sold: 5, locked: 1, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv05', voyageId: 'v02', voyageNo: 'CJ20260502-TXS', shipName: '长江探索号', cabinTypeName: '阳台房', physicalCapacity: 35, emergencyStock: 2, totalRooms: 50, sold: 10, locked: 1, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv06', voyageId: 'v02', voyageNo: 'CJ20260502-TXS', shipName: '长江探索号', cabinTypeName: '海景房', physicalCapacity: 47, emergencyStock: 2, totalRooms: 41, sold: 8, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv07', voyageId: 'v03', voyageNo: 'CJ20260503-SJ', shipName: '世纪游轮', cabinTypeName: '套房', physicalCapacity: 27, emergencyStock: 0, totalRooms: 30, sold: 29, locked: 1, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv08', voyageId: 'v03', voyageNo: 'CJ20260503-SJ', shipName: '世纪游轮', cabinTypeName: '阳台房', physicalCapacity: 48, emergencyStock: 2, totalRooms: 50, sold: 28, locked: 0, maintenance: 1, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv09', voyageId: 'v03', voyageNo: 'CJ20260503-SJ', shipName: '世纪游轮', cabinTypeName: '海景房', physicalCapacity: 30, emergencyStock: 2, totalRooms: 33, sold: 8, locked: 1, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv10', voyageId: 'v04', voyageNo: 'CJ20260504-HJ', shipName: '黄金游轮', cabinTypeName: '套房', physicalCapacity: 38, emergencyStock: 3, totalRooms: 20, sold: 21, locked: 1, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv11', voyageId: 'v04', voyageNo: 'CJ20260504-HJ', shipName: '黄金游轮', cabinTypeName: '阳台房', physicalCapacity: 45, emergencyStock: 0, totalRooms: 50, sold: 16, locked: 1, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv12', voyageId: 'v04', voyageNo: 'CJ20260504-HJ', shipName: '黄金游轮', cabinTypeName: '海景房', physicalCapacity: 54, emergencyStock: 0, totalRooms: 25, sold: 8, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv13', voyageId: 'v04', voyageNo: 'CJ20260504-HJ', shipName: '黄金游轮', cabinTypeName: '内舱房', physicalCapacity: 50, emergencyStock: 2, totalRooms: 20, sold: 7, locked: 0, maintenance: 1, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv14', voyageId: 'v05', voyageNo: 'CJ20260505-WDL', shipName: '维多利亚号', cabinTypeName: '套房', physicalCapacity: 46, emergencyStock: 2, totalRooms: 40, sold: 21, locked: 2, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv15', voyageId: 'v05', voyageNo: 'CJ20260505-WDL', shipName: '维多利亚号', cabinTypeName: '阳台房', physicalCapacity: 34, emergencyStock: 2, totalRooms: 30, sold: 10, locked: 1, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv16', voyageId: 'v05', voyageNo: 'CJ20260505-WDL', shipName: '维多利亚号', cabinTypeName: '海景房', physicalCapacity: 22, emergencyStock: 0, totalRooms: 25, sold: 13, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv17', voyageId: 'v05', voyageNo: 'CJ20260505-WDL', shipName: '维多利亚号', cabinTypeName: '内舱房', physicalCapacity: 28, emergencyStock: 0, totalRooms: 25, sold: 7, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv18', voyageId: 'v06', voyageNo: 'CJ20260506-HT', shipName: '海天号', cabinTypeName: '套房', physicalCapacity: 34, emergencyStock: 2, totalRooms: 35, sold: 21, locked: 0, maintenance: 1, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv19', voyageId: 'v06', voyageNo: 'CJ20260506-HT', shipName: '海天号', cabinTypeName: '阳台房', physicalCapacity: 33, emergencyStock: 3, totalRooms: 40, sold: 34, locked: 1, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv20', voyageId: 'v06', voyageNo: 'CJ20260506-HT', shipName: '海天号', cabinTypeName: '海景房', physicalCapacity: 40, emergencyStock: 2, totalRooms: 25, sold: 18, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv21', voyageId: 'v06', voyageNo: 'CJ20260506-HT', shipName: '海天号', cabinTypeName: '内舱房', physicalCapacity: 26, emergencyStock: 0, totalRooms: 15, sold: 7, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv22', voyageId: 'v07', voyageNo: 'CJ20260507-WDL2', shipName: '维多利亚号', cabinTypeName: '套房', physicalCapacity: 29, emergencyStock: 2, totalRooms: 30, sold: 21, locked: 1, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv23', voyageId: 'v07', voyageNo: 'CJ20260507-WDL2', shipName: '维多利亚号', cabinTypeName: '阳台房', physicalCapacity: 36, emergencyStock: 1, totalRooms: 50, sold: 28, locked: 1, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv24', voyageId: 'v07', voyageNo: 'CJ20260507-WDL2', shipName: '维多利亚号', cabinTypeName: '海景房', physicalCapacity: 46, emergencyStock: 1, totalRooms: 25, sold: 8, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv25', voyageId: 'v07', voyageNo: 'CJ20260507-WDL2', shipName: '维多利亚号', cabinTypeName: '内舱房', physicalCapacity: 56, emergencyStock: 1, totalRooms: 20, sold: 7, locked: 0, maintenance: 1, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv26', voyageId: 'v08', voyageNo: 'CJ20260508-TXS2', shipName: '长江探索号', cabinTypeName: '套房', physicalCapacity: 43, emergencyStock: 2, totalRooms: 25, sold: 21, locked: 2, maintenance: 1, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv27', voyageId: 'v08', voyageNo: 'CJ20260508-TXS2', shipName: '长江探索号', cabinTypeName: '阳台房', physicalCapacity: 39, emergencyStock: 3, totalRooms: 30, sold: 22, locked: 1, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv28', voyageId: 'v08', voyageNo: 'CJ20260508-TXS2', shipName: '长江探索号', cabinTypeName: '海景房', physicalCapacity: 54, emergencyStock: 3, totalRooms: 25, sold: 13, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv29', voyageId: 'v08', voyageNo: 'CJ20260508-TXS2', shipName: '长江探索号', cabinTypeName: '内舱房', physicalCapacity: 44, emergencyStock: 3, totalRooms: 25, sold: 7, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv30', voyageId: 'v09', voyageNo: 'CJ20260509-HT2', shipName: '海天号', cabinTypeName: '套房', physicalCapacity: 20, emergencyStock: 1, totalRooms: 20, sold: 21, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv31', voyageId: 'v09', voyageNo: 'CJ20260509-HT2', shipName: '海天号', cabinTypeName: '阳台房', physicalCapacity: 47, emergencyStock: 0, totalRooms: 40, sold: 16, locked: 1, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv32', voyageId: 'v09', voyageNo: 'CJ20260509-HT2', shipName: '海天号', cabinTypeName: '海景房', physicalCapacity: 33, emergencyStock: 1, totalRooms: 25, sold: 18, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv33', voyageId: 'v09', voyageNo: 'CJ20260509-HT2', shipName: '海天号', cabinTypeName: '内舱房', physicalCapacity: 45, emergencyStock: 0, totalRooms: 15, sold: 7, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv34', voyageId: 'v10', voyageNo: 'CJ20260510-SXMZ', shipName: '三峡明珠号', cabinTypeName: '套房', physicalCapacity: 38, emergencyStock: 3, totalRooms: 40, sold: 21, locked: 1, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv35', voyageId: 'v10', voyageNo: 'CJ20260510-SXMZ', shipName: '三峡明珠号', cabinTypeName: '阳台房', physicalCapacity: 45, emergencyStock: 2, totalRooms: 50, sold: 10, locked: 1, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv36', voyageId: 'v10', voyageNo: 'CJ20260510-SXMZ', shipName: '三峡明珠号', cabinTypeName: '海景房', physicalCapacity: 23, emergencyStock: 2, totalRooms: 25, sold: 8, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv37', voyageId: 'v10', voyageNo: 'CJ20260510-SXMZ', shipName: '三峡明珠号', cabinTypeName: '内舱房', physicalCapacity: 40, emergencyStock: 2, totalRooms: 20, sold: 7, locked: 0, maintenance: 1, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv38', voyageId: 'v11', voyageNo: 'CJ20260511-HJ2', shipName: '黄金游轮', cabinTypeName: '套房', physicalCapacity: 55, emergencyStock: 0, totalRooms: 35, sold: 21, locked: 2, maintenance: 1, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv39', voyageId: 'v11', voyageNo: 'CJ20260511-HJ2', shipName: '黄金游轮', cabinTypeName: '阳台房', physicalCapacity: 37, emergencyStock: 3, totalRooms: 30, sold: 34, locked: 1, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv40', voyageId: 'v11', voyageNo: 'CJ20260511-HJ2', shipName: '黄金游轮', cabinTypeName: '海景房', physicalCapacity: 44, emergencyStock: 2, totalRooms: 25, sold: 13, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv41', voyageId: 'v11', voyageNo: 'CJ20260511-HJ2', shipName: '黄金游轮', cabinTypeName: '内舱房', physicalCapacity: 35, emergencyStock: 0, totalRooms: 25, sold: 7, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv42', voyageId: 'v12', voyageNo: 'CJ20260512-SJ2', shipName: '世纪游轮', cabinTypeName: '套房', physicalCapacity: 36, emergencyStock: 2, totalRooms: 30, sold: 21, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv43', voyageId: 'v12', voyageNo: 'CJ20260512-SJ2', shipName: '世纪游轮', cabinTypeName: '阳台房', physicalCapacity: 27, emergencyStock: 0, totalRooms: 40, sold: 28, locked: 1, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv44', voyageId: 'v12', voyageNo: 'CJ20260512-SJ2', shipName: '世纪游轮', cabinTypeName: '海景房', physicalCapacity: 59, emergencyStock: 0, totalRooms: 25, sold: 18, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv45', voyageId: 'v12', voyageNo: 'CJ20260512-SJ2', shipName: '世纪游轮', cabinTypeName: '内舱房', physicalCapacity: 46, emergencyStock: 0, totalRooms: 15, sold: 7, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv46', voyageId: 'v13', voyageNo: 'CJ20260513-TXS3', shipName: '长江探索号', cabinTypeName: '套房', physicalCapacity: 56, emergencyStock: 2, totalRooms: 25, sold: 21, locked: 1, maintenance: 1, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv47', voyageId: 'v13', voyageNo: 'CJ20260513-TXS3', shipName: '长江探索号', cabinTypeName: '阳台房', physicalCapacity: 29, emergencyStock: 0, totalRooms: 50, sold: 22, locked: 1, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv48', voyageId: 'v13', voyageNo: 'CJ20260513-TXS3', shipName: '长江探索号', cabinTypeName: '海景房', physicalCapacity: 29, emergencyStock: 3, totalRooms: 25, sold: 8, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv49', voyageId: 'v13', voyageNo: 'CJ20260513-TXS3', shipName: '长江探索号', cabinTypeName: '内舱房', physicalCapacity: 20, emergencyStock: 0, totalRooms: 20, sold: 7, locked: 0, maintenance: 1, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv50', voyageId: 'v14', voyageNo: 'CJ20260514-WDL3', shipName: '维多利亚号', cabinTypeName: '套房', physicalCapacity: 54, emergencyStock: 3, totalRooms: 20, sold: 21, locked: 2, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv51', voyageId: 'v14', voyageNo: 'CJ20260514-WDL3', shipName: '维多利亚号', cabinTypeName: '阳台房', physicalCapacity: 41, emergencyStock: 0, totalRooms: 30, sold: 16, locked: 1, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv52', voyageId: 'v14', voyageNo: 'CJ20260514-WDL3', shipName: '维多利亚号', cabinTypeName: '海景房', physicalCapacity: 36, emergencyStock: 3, totalRooms: 25, sold: 13, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv53', voyageId: 'v14', voyageNo: 'CJ20260514-WDL3', shipName: '维多利亚号', cabinTypeName: '内舱房', physicalCapacity: 21, emergencyStock: 1, totalRooms: 25, sold: 7, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv54', voyageId: 'v15', voyageNo: 'CJ20260515-SXMZ2', shipName: '三峡明珠号', cabinTypeName: '套房', physicalCapacity: 36, emergencyStock: 1, totalRooms: 40, sold: 21, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv55', voyageId: 'v15', voyageNo: 'CJ20260515-SXMZ2', shipName: '三峡明珠号', cabinTypeName: '阳台房', physicalCapacity: 41, emergencyStock: 0, totalRooms: 40, sold: 10, locked: 1, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv56', voyageId: 'v15', voyageNo: 'CJ20260515-SXMZ2', shipName: '三峡明珠号', cabinTypeName: '海景房', physicalCapacity: 40, emergencyStock: 1, totalRooms: 25, sold: 18, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv57', voyageId: 'v15', voyageNo: 'CJ20260515-SXMZ2', shipName: '三峡明珠号', cabinTypeName: '内舱房', physicalCapacity: 50, emergencyStock: 3, totalRooms: 15, sold: 7, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv58', voyageId: 'v16', voyageNo: 'CJ20260516-YZJ', shipName: '扬子江号', cabinTypeName: '套房', physicalCapacity: 52, emergencyStock: 3, totalRooms: 35, sold: 21, locked: 1, maintenance: 1, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv59', voyageId: 'v16', voyageNo: 'CJ20260516-YZJ', shipName: '扬子江号', cabinTypeName: '阳台房', physicalCapacity: 36, emergencyStock: 0, totalRooms: 50, sold: 34, locked: 1, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv60', voyageId: 'v16', voyageNo: 'CJ20260516-YZJ', shipName: '扬子江号', cabinTypeName: '海景房', physicalCapacity: 52, emergencyStock: 3, totalRooms: 25, sold: 8, locked: 0, maintenance: 0, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'inv61', voyageId: 'v16', voyageNo: 'CJ20260516-YZJ', shipName: '扬子江号', cabinTypeName: '内舱房', physicalCapacity: 51, emergencyStock: 1, totalRooms: 20, sold: 7, locked: 0, maintenance: 1, status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
]

// ===================== 航次价格数据 =====================
export const voyagePrices: import('@/types').VoyagePrice[] = [
  { id: 'prc001', voyageId: 'v01', voyageNo: 'CJ20260501-TXS', cabinTypeName: '套房', date: '2026-05-15', basePrice: 800, adultPrice: 800, childPrice: 240, babyPrice: 80, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc002', voyageId: 'v01', voyageNo: 'CJ20260501-TXS', cabinTypeName: '阳台房', date: '2026-05-15', basePrice: 500, adultPrice: 500, childPrice: 150, babyPrice: 50, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc003', voyageId: 'v01', voyageNo: 'CJ20260501-TXS', cabinTypeName: '海景房', date: '2026-05-15', basePrice: 300, adultPrice: 300, childPrice: 90, babyPrice: 30, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc004', voyageId: 'v02', voyageNo: 'CJ20260502-TXS', cabinTypeName: '套房', date: '2026-05-19', basePrice: 800, adultPrice: 800, childPrice: 240, babyPrice: 80, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc005', voyageId: 'v02', voyageNo: 'CJ20260502-TXS', cabinTypeName: '阳台房', date: '2026-05-19', basePrice: 500, adultPrice: 500, childPrice: 150, babyPrice: 50, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc006', voyageId: 'v02', voyageNo: 'CJ20260502-TXS', cabinTypeName: '海景房', date: '2026-05-19', basePrice: 300, adultPrice: 300, childPrice: 90, babyPrice: 30, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc007', voyageId: 'v03', voyageNo: 'CJ20260503-SJ', cabinTypeName: '套房', date: '2026-05-16', basePrice: 800, adultPrice: 800, childPrice: 240, babyPrice: 80, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc008', voyageId: 'v03', voyageNo: 'CJ20260503-SJ', cabinTypeName: '阳台房', date: '2026-05-16', basePrice: 500, adultPrice: 500, childPrice: 150, babyPrice: 50, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc009', voyageId: 'v03', voyageNo: 'CJ20260503-SJ', cabinTypeName: '海景房', date: '2026-05-16', basePrice: 300, adultPrice: 300, childPrice: 90, babyPrice: 30, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc010', voyageId: 'v04', voyageNo: 'CJ20260504-HJ', cabinTypeName: '套房', date: '2026-05-14', basePrice: 800, adultPrice: 800, childPrice: 240, babyPrice: 80, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc011', voyageId: 'v04', voyageNo: 'CJ20260504-HJ', cabinTypeName: '阳台房', date: '2026-05-14', basePrice: 500, adultPrice: 500, childPrice: 150, babyPrice: 50, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc012', voyageId: 'v04', voyageNo: 'CJ20260504-HJ', cabinTypeName: '海景房', date: '2026-05-14', basePrice: 300, adultPrice: 300, childPrice: 90, babyPrice: 30, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc013', voyageId: 'v05', voyageNo: 'CJ20260505-WDL', cabinTypeName: '套房', date: '2026-05-20', basePrice: 800, adultPrice: 800, childPrice: 240, babyPrice: 80, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc014', voyageId: 'v05', voyageNo: 'CJ20260505-WDL', cabinTypeName: '阳台房', date: '2026-05-20', basePrice: 500, adultPrice: 500, childPrice: 150, babyPrice: 50, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc015', voyageId: 'v05', voyageNo: 'CJ20260505-WDL', cabinTypeName: '海景房', date: '2026-05-20', basePrice: 300, adultPrice: 300, childPrice: 90, babyPrice: 30, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc016', voyageId: 'v06', voyageNo: 'CJ20260506-HT', cabinTypeName: '套房', date: '2026-05-18', basePrice: 800, adultPrice: 800, childPrice: 240, babyPrice: 80, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc017', voyageId: 'v06', voyageNo: 'CJ20260506-HT', cabinTypeName: '阳台房', date: '2026-05-18', basePrice: 500, adultPrice: 500, childPrice: 150, babyPrice: 50, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc018', voyageId: 'v06', voyageNo: 'CJ20260506-HT', cabinTypeName: '海景房', date: '2026-05-18', basePrice: 300, adultPrice: 300, childPrice: 90, babyPrice: 30, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc019', voyageId: 'v07', voyageNo: 'CJ20260507-WDL2', cabinTypeName: '套房', date: '2026-05-25', basePrice: 800, adultPrice: 800, childPrice: 240, babyPrice: 80, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc020', voyageId: 'v07', voyageNo: 'CJ20260507-WDL2', cabinTypeName: '阳台房', date: '2026-05-25', basePrice: 500, adultPrice: 500, childPrice: 150, babyPrice: 50, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc021', voyageId: 'v07', voyageNo: 'CJ20260507-WDL2', cabinTypeName: '海景房', date: '2026-05-25', basePrice: 300, adultPrice: 300, childPrice: 90, babyPrice: 30, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc022', voyageId: 'v08', voyageNo: 'CJ20260508-TXS2', cabinTypeName: '套房', date: '2026-06-01', basePrice: 800, adultPrice: 800, childPrice: 240, babyPrice: 80, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc023', voyageId: 'v08', voyageNo: 'CJ20260508-TXS2', cabinTypeName: '阳台房', date: '2026-06-01', basePrice: 500, adultPrice: 500, childPrice: 150, babyPrice: 50, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc024', voyageId: 'v08', voyageNo: 'CJ20260508-TXS2', cabinTypeName: '海景房', date: '2026-06-01', basePrice: 300, adultPrice: 300, childPrice: 90, babyPrice: 30, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc025', voyageId: 'v09', voyageNo: 'CJ20260509-HT2', cabinTypeName: '套房', date: '2026-06-02', basePrice: 800, adultPrice: 800, childPrice: 240, babyPrice: 80, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc026', voyageId: 'v09', voyageNo: 'CJ20260509-HT2', cabinTypeName: '阳台房', date: '2026-06-02', basePrice: 500, adultPrice: 500, childPrice: 150, babyPrice: 50, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc027', voyageId: 'v09', voyageNo: 'CJ20260509-HT2', cabinTypeName: '海景房', date: '2026-06-02', basePrice: 300, adultPrice: 300, childPrice: 90, babyPrice: 30, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc028', voyageId: 'v10', voyageNo: 'CJ20260510-SXMZ', cabinTypeName: '套房', date: '2026-05-22', basePrice: 800, adultPrice: 800, childPrice: 240, babyPrice: 80, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc029', voyageId: 'v10', voyageNo: 'CJ20260510-SXMZ', cabinTypeName: '阳台房', date: '2026-05-22', basePrice: 500, adultPrice: 500, childPrice: 150, babyPrice: 50, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc030', voyageId: 'v10', voyageNo: 'CJ20260510-SXMZ', cabinTypeName: '海景房', date: '2026-05-22', basePrice: 300, adultPrice: 300, childPrice: 90, babyPrice: 30, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc031', voyageId: 'v11', voyageNo: 'CJ20260511-HJ2', cabinTypeName: '套房', date: '2026-06-05', basePrice: 800, adultPrice: 800, childPrice: 240, babyPrice: 80, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc032', voyageId: 'v11', voyageNo: 'CJ20260511-HJ2', cabinTypeName: '阳台房', date: '2026-06-05', basePrice: 500, adultPrice: 500, childPrice: 150, babyPrice: 50, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc033', voyageId: 'v11', voyageNo: 'CJ20260511-HJ2', cabinTypeName: '海景房', date: '2026-06-05', basePrice: 300, adultPrice: 300, childPrice: 90, babyPrice: 30, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc034', voyageId: 'v12', voyageNo: 'CJ20260512-SJ2', cabinTypeName: '套房', date: '2026-06-08', basePrice: 800, adultPrice: 800, childPrice: 240, babyPrice: 80, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc035', voyageId: 'v12', voyageNo: 'CJ20260512-SJ2', cabinTypeName: '阳台房', date: '2026-06-08', basePrice: 500, adultPrice: 500, childPrice: 150, babyPrice: 50, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc036', voyageId: 'v12', voyageNo: 'CJ20260512-SJ2', cabinTypeName: '海景房', date: '2026-06-08', basePrice: 300, adultPrice: 300, childPrice: 90, babyPrice: 30, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc037', voyageId: 'v13', voyageNo: 'CJ20260513-TXS3', cabinTypeName: '套房', date: '2026-06-15', basePrice: 800, adultPrice: 800, childPrice: 240, babyPrice: 80, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc038', voyageId: 'v13', voyageNo: 'CJ20260513-TXS3', cabinTypeName: '阳台房', date: '2026-06-15', basePrice: 500, adultPrice: 500, childPrice: 150, babyPrice: 50, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc039', voyageId: 'v13', voyageNo: 'CJ20260513-TXS3', cabinTypeName: '海景房', date: '2026-06-15', basePrice: 300, adultPrice: 300, childPrice: 90, babyPrice: 30, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc040', voyageId: 'v14', voyageNo: 'CJ20260514-WDL3', cabinTypeName: '套房', date: '2026-06-03', basePrice: 800, adultPrice: 800, childPrice: 240, babyPrice: 80, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc041', voyageId: 'v14', voyageNo: 'CJ20260514-WDL3', cabinTypeName: '阳台房', date: '2026-06-03', basePrice: 500, adultPrice: 500, childPrice: 150, babyPrice: 50, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc042', voyageId: 'v14', voyageNo: 'CJ20260514-WDL3', cabinTypeName: '海景房', date: '2026-06-03', basePrice: 300, adultPrice: 300, childPrice: 90, babyPrice: 30, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc043', voyageId: 'v15', voyageNo: 'CJ20260515-SXMZ2', cabinTypeName: '套房', date: '2026-05-28', basePrice: 800, adultPrice: 800, childPrice: 240, babyPrice: 80, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc044', voyageId: 'v15', voyageNo: 'CJ20260515-SXMZ2', cabinTypeName: '阳台房', date: '2026-05-28', basePrice: 500, adultPrice: 500, childPrice: 150, babyPrice: 50, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc045', voyageId: 'v15', voyageNo: 'CJ20260515-SXMZ2', cabinTypeName: '海景房', date: '2026-05-28', basePrice: 300, adultPrice: 300, childPrice: 90, babyPrice: 30, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc046', voyageId: 'v16', voyageNo: 'CJ20260516-YZJ', cabinTypeName: '套房', date: '2026-06-10', basePrice: 800, adultPrice: 800, childPrice: 240, babyPrice: 80, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc047', voyageId: 'v16', voyageNo: 'CJ20260516-YZJ', cabinTypeName: '阳台房', date: '2026-06-10', basePrice: 500, adultPrice: 500, childPrice: 150, babyPrice: 50, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'prc048', voyageId: 'v16', voyageNo: 'CJ20260516-YZJ', cabinTypeName: '海景房', date: '2026-06-10', basePrice: 300, adultPrice: 300, childPrice: 90, babyPrice: 30, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
]

// ===================== 产品库存数据 =====================
export const productInventories: import('@/types').ProductInventory[] = [
  { id: 'pinv001', productId: 'prod01', segmentKey: '重庆港-丰都', cabinTypeName: '套房', physicalCapacity: 26, totalAvailable: 25, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv002', productId: 'prod01', segmentKey: '重庆港-丰都', cabinTypeName: '阳台房', physicalCapacity: 37, totalAvailable: 35, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv003', productId: 'prod01', segmentKey: '重庆港-丰都', cabinTypeName: '海景房', physicalCapacity: 23, totalAvailable: 23, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv004', productId: 'prod01', segmentKey: '重庆港-丰都', cabinTypeName: '内舱房', physicalCapacity: 19, totalAvailable: 18, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv005', productId: 'prod01', segmentKey: '重庆港-奉节', cabinTypeName: '套房', physicalCapacity: 25, totalAvailable: 23, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv006', productId: 'prod01', segmentKey: '重庆港-奉节', cabinTypeName: '阳台房', physicalCapacity: 36, totalAvailable: 36, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv007', productId: 'prod01', segmentKey: '重庆港-奉节', cabinTypeName: '海景房', physicalCapacity: 22, totalAvailable: 21, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv008', productId: 'prod01', segmentKey: '重庆港-奉节', cabinTypeName: '内舱房', physicalCapacity: 18, totalAvailable: 16, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv009', productId: 'prod01', segmentKey: '重庆港-宜昌港', cabinTypeName: '套房', physicalCapacity: 29, totalAvailable: 29, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv010', productId: 'prod01', segmentKey: '重庆港-宜昌港', cabinTypeName: '阳台房', physicalCapacity: 35, totalAvailable: 34, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv011', productId: 'prod01', segmentKey: '重庆港-宜昌港', cabinTypeName: '海景房', physicalCapacity: 21, totalAvailable: 19, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv012', productId: 'prod01', segmentKey: '重庆港-宜昌港', cabinTypeName: '内舱房', physicalCapacity: 17, totalAvailable: 17, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv013', productId: 'prod02', segmentKey: '重庆港-丰都', cabinTypeName: '套房', physicalCapacity: 28, totalAvailable: 27, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv014', productId: 'prod02', segmentKey: '重庆港-丰都', cabinTypeName: '阳台房', physicalCapacity: 39, totalAvailable: 37, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv015', productId: 'prod02', segmentKey: '重庆港-丰都', cabinTypeName: '海景房', physicalCapacity: 20, totalAvailable: 20, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv016', productId: 'prod02', segmentKey: '重庆港-丰都', cabinTypeName: '内舱房', physicalCapacity: 16, totalAvailable: 15, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv017', productId: 'prod02', segmentKey: '重庆港-奉节', cabinTypeName: '套房', physicalCapacity: 27, totalAvailable: 25, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv018', productId: 'prod02', segmentKey: '重庆港-奉节', cabinTypeName: '阳台房', physicalCapacity: 38, totalAvailable: 38, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv019', productId: 'prod02', segmentKey: '重庆港-奉节', cabinTypeName: '海景房', physicalCapacity: 24, totalAvailable: 23, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv020', productId: 'prod02', segmentKey: '重庆港-奉节', cabinTypeName: '内舱房', physicalCapacity: 15, totalAvailable: 13, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv021', productId: 'prod02', segmentKey: '重庆港-宜昌港', cabinTypeName: '套房', physicalCapacity: 26, totalAvailable: 26, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv022', productId: 'prod02', segmentKey: '重庆港-宜昌港', cabinTypeName: '阳台房', physicalCapacity: 37, totalAvailable: 36, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv023', productId: 'prod02', segmentKey: '重庆港-宜昌港', cabinTypeName: '海景房', physicalCapacity: 23, totalAvailable: 21, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv024', productId: 'prod02', segmentKey: '重庆港-宜昌港', cabinTypeName: '内舱房', physicalCapacity: 19, totalAvailable: 19, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv025', productId: 'prod03', segmentKey: '上海港-宁波港', cabinTypeName: '套房', physicalCapacity: 25, totalAvailable: 24, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv026', productId: 'prod03', segmentKey: '上海港-宁波港', cabinTypeName: '阳台房', physicalCapacity: 36, totalAvailable: 34, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv027', productId: 'prod03', segmentKey: '上海港-宁波港', cabinTypeName: '海景房', physicalCapacity: 22, totalAvailable: 22, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv028', productId: 'prod03', segmentKey: '上海港-宁波港', cabinTypeName: '内舱房', physicalCapacity: 18, totalAvailable: 17, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv029', productId: 'prod03', segmentKey: '上海港-厦门港', cabinTypeName: '套房', physicalCapacity: 29, totalAvailable: 27, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv030', productId: 'prod03', segmentKey: '上海港-厦门港', cabinTypeName: '阳台房', physicalCapacity: 35, totalAvailable: 35, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv031', productId: 'prod03', segmentKey: '上海港-厦门港', cabinTypeName: '海景房', physicalCapacity: 21, totalAvailable: 20, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv032', productId: 'prod03', segmentKey: '上海港-厦门港', cabinTypeName: '内舱房', physicalCapacity: 17, totalAvailable: 15, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv033', productId: 'prod03', segmentKey: '上海港-深圳港', cabinTypeName: '套房', physicalCapacity: 28, totalAvailable: 28, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv034', productId: 'prod03', segmentKey: '上海港-深圳港', cabinTypeName: '阳台房', physicalCapacity: 39, totalAvailable: 38, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv035', productId: 'prod03', segmentKey: '上海港-深圳港', cabinTypeName: '海景房', physicalCapacity: 20, totalAvailable: 18, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv036', productId: 'prod03', segmentKey: '上海港-深圳港', cabinTypeName: '内舱房', physicalCapacity: 16, totalAvailable: 16, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv037', productId: 'prod04', segmentKey: '上海港-宁波港', cabinTypeName: '套房', physicalCapacity: 27, totalAvailable: 26, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv038', productId: 'prod04', segmentKey: '上海港-宁波港', cabinTypeName: '阳台房', physicalCapacity: 38, totalAvailable: 36, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv039', productId: 'prod04', segmentKey: '上海港-宁波港', cabinTypeName: '海景房', physicalCapacity: 24, totalAvailable: 24, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv040', productId: 'prod04', segmentKey: '上海港-宁波港', cabinTypeName: '内舱房', physicalCapacity: 15, totalAvailable: 14, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv041', productId: 'prod04', segmentKey: '上海港-厦门港', cabinTypeName: '套房', physicalCapacity: 26, totalAvailable: 24, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv042', productId: 'prod04', segmentKey: '上海港-厦门港', cabinTypeName: '阳台房', physicalCapacity: 37, totalAvailable: 37, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv043', productId: 'prod04', segmentKey: '上海港-厦门港', cabinTypeName: '海景房', physicalCapacity: 23, totalAvailable: 22, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv044', productId: 'prod04', segmentKey: '上海港-厦门港', cabinTypeName: '内舱房', physicalCapacity: 19, totalAvailable: 17, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv045', productId: 'prod04', segmentKey: '上海港-深圳港', cabinTypeName: '套房', physicalCapacity: 25, totalAvailable: 25, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv046', productId: 'prod04', segmentKey: '上海港-深圳港', cabinTypeName: '阳台房', physicalCapacity: 36, totalAvailable: 35, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv047', productId: 'prod04', segmentKey: '上海港-深圳港', cabinTypeName: '海景房', physicalCapacity: 22, totalAvailable: 20, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv048', productId: 'prod04', segmentKey: '上海港-深圳港', cabinTypeName: '内舱房', physicalCapacity: 18, totalAvailable: 18, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv049', productId: 'prod05', segmentKey: '上海港-宁波港', cabinTypeName: '套房', physicalCapacity: 29, totalAvailable: 28, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv050', productId: 'prod05', segmentKey: '上海港-宁波港', cabinTypeName: '阳台房', physicalCapacity: 35, totalAvailable: 33, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv051', productId: 'prod05', segmentKey: '上海港-宁波港', cabinTypeName: '海景房', physicalCapacity: 21, totalAvailable: 21, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv052', productId: 'prod05', segmentKey: '上海港-宁波港', cabinTypeName: '内舱房', physicalCapacity: 17, totalAvailable: 16, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv053', productId: 'prod05', segmentKey: '上海港-厦门港', cabinTypeName: '套房', physicalCapacity: 28, totalAvailable: 26, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv054', productId: 'prod05', segmentKey: '上海港-厦门港', cabinTypeName: '阳台房', physicalCapacity: 39, totalAvailable: 39, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv055', productId: 'prod05', segmentKey: '上海港-厦门港', cabinTypeName: '海景房', physicalCapacity: 20, totalAvailable: 19, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv056', productId: 'prod05', segmentKey: '上海港-厦门港', cabinTypeName: '内舱房', physicalCapacity: 16, totalAvailable: 14, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv057', productId: 'prod05', segmentKey: '上海港-深圳港', cabinTypeName: '套房', physicalCapacity: 27, totalAvailable: 27, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv058', productId: 'prod05', segmentKey: '上海港-深圳港', cabinTypeName: '阳台房', physicalCapacity: 38, totalAvailable: 37, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv059', productId: 'prod05', segmentKey: '上海港-深圳港', cabinTypeName: '海景房', physicalCapacity: 24, totalAvailable: 22, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv060', productId: 'prod05', segmentKey: '上海港-深圳港', cabinTypeName: '内舱房', physicalCapacity: 15, totalAvailable: 15, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv061', productId: 'prod06', segmentKey: '上海港-宁波港', cabinTypeName: '套房', physicalCapacity: 26, totalAvailable: 25, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv062', productId: 'prod06', segmentKey: '上海港-宁波港', cabinTypeName: '阳台房', physicalCapacity: 37, totalAvailable: 35, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv063', productId: 'prod06', segmentKey: '上海港-宁波港', cabinTypeName: '海景房', physicalCapacity: 23, totalAvailable: 23, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv064', productId: 'prod06', segmentKey: '上海港-宁波港', cabinTypeName: '内舱房', physicalCapacity: 19, totalAvailable: 18, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv065', productId: 'prod06', segmentKey: '上海港-厦门港', cabinTypeName: '套房', physicalCapacity: 25, totalAvailable: 23, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv066', productId: 'prod06', segmentKey: '上海港-厦门港', cabinTypeName: '阳台房', physicalCapacity: 36, totalAvailable: 36, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv067', productId: 'prod06', segmentKey: '上海港-厦门港', cabinTypeName: '海景房', physicalCapacity: 22, totalAvailable: 21, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv068', productId: 'prod06', segmentKey: '上海港-厦门港', cabinTypeName: '内舱房', physicalCapacity: 18, totalAvailable: 16, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv069', productId: 'prod06', segmentKey: '上海港-深圳港', cabinTypeName: '套房', physicalCapacity: 29, totalAvailable: 29, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv070', productId: 'prod06', segmentKey: '上海港-深圳港', cabinTypeName: '阳台房', physicalCapacity: 35, totalAvailable: 34, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv071', productId: 'prod06', segmentKey: '上海港-深圳港', cabinTypeName: '海景房', physicalCapacity: 21, totalAvailable: 19, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv072', productId: 'prod06', segmentKey: '上海港-深圳港', cabinTypeName: '内舱房', physicalCapacity: 17, totalAvailable: 17, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv073', productId: 'prod07', segmentKey: '武汉港-九江港', cabinTypeName: '套房', physicalCapacity: 28, totalAvailable: 27, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv074', productId: 'prod07', segmentKey: '武汉港-九江港', cabinTypeName: '阳台房', physicalCapacity: 39, totalAvailable: 37, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv075', productId: 'prod07', segmentKey: '武汉港-九江港', cabinTypeName: '海景房', physicalCapacity: 20, totalAvailable: 20, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv076', productId: 'prod07', segmentKey: '武汉港-九江港', cabinTypeName: '内舱房', physicalCapacity: 16, totalAvailable: 15, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv077', productId: 'prod07', segmentKey: '武汉港-南京港', cabinTypeName: '套房', physicalCapacity: 27, totalAvailable: 25, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv078', productId: 'prod07', segmentKey: '武汉港-南京港', cabinTypeName: '阳台房', physicalCapacity: 38, totalAvailable: 38, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv079', productId: 'prod07', segmentKey: '武汉港-南京港', cabinTypeName: '海景房', physicalCapacity: 24, totalAvailable: 23, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv080', productId: 'prod07', segmentKey: '武汉港-南京港', cabinTypeName: '内舱房', physicalCapacity: 15, totalAvailable: 13, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv081', productId: 'prod07', segmentKey: '武汉港-上海港', cabinTypeName: '套房', physicalCapacity: 26, totalAvailable: 26, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv082', productId: 'prod07', segmentKey: '武汉港-上海港', cabinTypeName: '阳台房', physicalCapacity: 37, totalAvailable: 36, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv083', productId: 'prod07', segmentKey: '武汉港-上海港', cabinTypeName: '海景房', physicalCapacity: 23, totalAvailable: 21, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv084', productId: 'prod07', segmentKey: '武汉港-上海港', cabinTypeName: '内舱房', physicalCapacity: 19, totalAvailable: 19, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv085', productId: 'prod08', segmentKey: '上海港-宁波港', cabinTypeName: '套房', physicalCapacity: 25, totalAvailable: 24, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv086', productId: 'prod08', segmentKey: '上海港-宁波港', cabinTypeName: '阳台房', physicalCapacity: 36, totalAvailable: 34, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv087', productId: 'prod08', segmentKey: '上海港-宁波港', cabinTypeName: '海景房', physicalCapacity: 22, totalAvailable: 22, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv088', productId: 'prod08', segmentKey: '上海港-宁波港', cabinTypeName: '内舱房', physicalCapacity: 18, totalAvailable: 17, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv089', productId: 'prod08', segmentKey: '上海港-厦门港', cabinTypeName: '套房', physicalCapacity: 29, totalAvailable: 27, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv090', productId: 'prod08', segmentKey: '上海港-厦门港', cabinTypeName: '阳台房', physicalCapacity: 35, totalAvailable: 35, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv091', productId: 'prod08', segmentKey: '上海港-厦门港', cabinTypeName: '海景房', physicalCapacity: 21, totalAvailable: 20, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv092', productId: 'prod08', segmentKey: '上海港-厦门港', cabinTypeName: '内舱房', physicalCapacity: 17, totalAvailable: 15, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv093', productId: 'prod08', segmentKey: '上海港-深圳港', cabinTypeName: '套房', physicalCapacity: 28, totalAvailable: 28, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv094', productId: 'prod08', segmentKey: '上海港-深圳港', cabinTypeName: '阳台房', physicalCapacity: 39, totalAvailable: 38, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv095', productId: 'prod08', segmentKey: '上海港-深圳港', cabinTypeName: '海景房', physicalCapacity: 20, totalAvailable: 18, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv096', productId: 'prod08', segmentKey: '上海港-深圳港', cabinTypeName: '内舱房', physicalCapacity: 16, totalAvailable: 16, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv097', productId: 'prod09', segmentKey: '上海港-宁波港', cabinTypeName: '套房', physicalCapacity: 27, totalAvailable: 26, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv098', productId: 'prod09', segmentKey: '上海港-宁波港', cabinTypeName: '阳台房', physicalCapacity: 38, totalAvailable: 36, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv099', productId: 'prod09', segmentKey: '上海港-宁波港', cabinTypeName: '海景房', physicalCapacity: 24, totalAvailable: 24, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv100', productId: 'prod09', segmentKey: '上海港-宁波港', cabinTypeName: '内舱房', physicalCapacity: 15, totalAvailable: 14, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv101', productId: 'prod09', segmentKey: '上海港-厦门港', cabinTypeName: '套房', physicalCapacity: 26, totalAvailable: 24, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv102', productId: 'prod09', segmentKey: '上海港-厦门港', cabinTypeName: '阳台房', physicalCapacity: 37, totalAvailable: 37, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv103', productId: 'prod09', segmentKey: '上海港-厦门港', cabinTypeName: '海景房', physicalCapacity: 23, totalAvailable: 22, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv104', productId: 'prod09', segmentKey: '上海港-厦门港', cabinTypeName: '内舱房', physicalCapacity: 19, totalAvailable: 17, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv105', productId: 'prod09', segmentKey: '上海港-深圳港', cabinTypeName: '套房', physicalCapacity: 25, totalAvailable: 25, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv106', productId: 'prod09', segmentKey: '上海港-深圳港', cabinTypeName: '阳台房', physicalCapacity: 36, totalAvailable: 35, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv107', productId: 'prod09', segmentKey: '上海港-深圳港', cabinTypeName: '海景房', physicalCapacity: 22, totalAvailable: 20, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv108', productId: 'prod09', segmentKey: '上海港-深圳港', cabinTypeName: '内舱房', physicalCapacity: 18, totalAvailable: 18, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv109', productId: 'prod10', segmentKey: '上海港-宁波港', cabinTypeName: '套房', physicalCapacity: 29, totalAvailable: 28, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv110', productId: 'prod10', segmentKey: '上海港-宁波港', cabinTypeName: '阳台房', physicalCapacity: 35, totalAvailable: 33, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv111', productId: 'prod10', segmentKey: '上海港-宁波港', cabinTypeName: '海景房', physicalCapacity: 21, totalAvailable: 21, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv112', productId: 'prod10', segmentKey: '上海港-宁波港', cabinTypeName: '内舱房', physicalCapacity: 17, totalAvailable: 16, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv113', productId: 'prod10', segmentKey: '上海港-厦门港', cabinTypeName: '套房', physicalCapacity: 28, totalAvailable: 26, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv114', productId: 'prod10', segmentKey: '上海港-厦门港', cabinTypeName: '阳台房', physicalCapacity: 39, totalAvailable: 39, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv115', productId: 'prod10', segmentKey: '上海港-厦门港', cabinTypeName: '海景房', physicalCapacity: 20, totalAvailable: 19, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv116', productId: 'prod10', segmentKey: '上海港-厦门港', cabinTypeName: '内舱房', physicalCapacity: 16, totalAvailable: 14, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv117', productId: 'prod10', segmentKey: '上海港-深圳港', cabinTypeName: '套房', physicalCapacity: 27, totalAvailable: 27, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv118', productId: 'prod10', segmentKey: '上海港-深圳港', cabinTypeName: '阳台房', physicalCapacity: 38, totalAvailable: 37, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv119', productId: 'prod10', segmentKey: '上海港-深圳港', cabinTypeName: '海景房', physicalCapacity: 24, totalAvailable: 22, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv120', productId: 'prod10', segmentKey: '上海港-深圳港', cabinTypeName: '内舱房', physicalCapacity: 15, totalAvailable: 15, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv121', productId: 'prod11', segmentKey: '上海港-宁波港', cabinTypeName: '套房', physicalCapacity: 26, totalAvailable: 25, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv122', productId: 'prod11', segmentKey: '上海港-宁波港', cabinTypeName: '阳台房', physicalCapacity: 37, totalAvailable: 35, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv123', productId: 'prod11', segmentKey: '上海港-宁波港', cabinTypeName: '海景房', physicalCapacity: 23, totalAvailable: 23, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv124', productId: 'prod11', segmentKey: '上海港-宁波港', cabinTypeName: '内舱房', physicalCapacity: 19, totalAvailable: 18, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv125', productId: 'prod11', segmentKey: '上海港-厦门港', cabinTypeName: '套房', physicalCapacity: 25, totalAvailable: 23, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv126', productId: 'prod11', segmentKey: '上海港-厦门港', cabinTypeName: '阳台房', physicalCapacity: 36, totalAvailable: 36, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv127', productId: 'prod11', segmentKey: '上海港-厦门港', cabinTypeName: '海景房', physicalCapacity: 22, totalAvailable: 21, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv128', productId: 'prod11', segmentKey: '上海港-厦门港', cabinTypeName: '内舱房', physicalCapacity: 18, totalAvailable: 16, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv129', productId: 'prod11', segmentKey: '上海港-深圳港', cabinTypeName: '套房', physicalCapacity: 29, totalAvailable: 29, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv130', productId: 'prod11', segmentKey: '上海港-深圳港', cabinTypeName: '阳台房', physicalCapacity: 35, totalAvailable: 34, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv131', productId: 'prod11', segmentKey: '上海港-深圳港', cabinTypeName: '海景房', physicalCapacity: 21, totalAvailable: 19, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv132', productId: 'prod11', segmentKey: '上海港-深圳港', cabinTypeName: '内舱房', physicalCapacity: 17, totalAvailable: 17, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv133', productId: 'prod12', segmentKey: '上海港-宁波港', cabinTypeName: '套房', physicalCapacity: 28, totalAvailable: 27, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv134', productId: 'prod12', segmentKey: '上海港-宁波港', cabinTypeName: '阳台房', physicalCapacity: 39, totalAvailable: 37, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv135', productId: 'prod12', segmentKey: '上海港-宁波港', cabinTypeName: '海景房', physicalCapacity: 20, totalAvailable: 20, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv136', productId: 'prod12', segmentKey: '上海港-宁波港', cabinTypeName: '内舱房', physicalCapacity: 16, totalAvailable: 15, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv137', productId: 'prod12', segmentKey: '上海港-厦门港', cabinTypeName: '套房', physicalCapacity: 27, totalAvailable: 25, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv138', productId: 'prod12', segmentKey: '上海港-厦门港', cabinTypeName: '阳台房', physicalCapacity: 38, totalAvailable: 38, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv139', productId: 'prod12', segmentKey: '上海港-厦门港', cabinTypeName: '海景房', physicalCapacity: 24, totalAvailable: 23, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv140', productId: 'prod12', segmentKey: '上海港-厦门港', cabinTypeName: '内舱房', physicalCapacity: 15, totalAvailable: 13, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv141', productId: 'prod12', segmentKey: '上海港-深圳港', cabinTypeName: '套房', physicalCapacity: 26, totalAvailable: 26, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv142', productId: 'prod12', segmentKey: '上海港-深圳港', cabinTypeName: '阳台房', physicalCapacity: 37, totalAvailable: 36, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv143', productId: 'prod12', segmentKey: '上海港-深圳港', cabinTypeName: '海景房', physicalCapacity: 23, totalAvailable: 21, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv144', productId: 'prod12', segmentKey: '上海港-深圳港', cabinTypeName: '内舱房', physicalCapacity: 19, totalAvailable: 19, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv145', productId: 'prod13', segmentKey: '上海港-宁波港', cabinTypeName: '套房', physicalCapacity: 25, totalAvailable: 24, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv146', productId: 'prod13', segmentKey: '上海港-宁波港', cabinTypeName: '阳台房', physicalCapacity: 36, totalAvailable: 34, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv147', productId: 'prod13', segmentKey: '上海港-宁波港', cabinTypeName: '海景房', physicalCapacity: 22, totalAvailable: 22, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv148', productId: 'prod13', segmentKey: '上海港-宁波港', cabinTypeName: '内舱房', physicalCapacity: 18, totalAvailable: 17, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv149', productId: 'prod13', segmentKey: '上海港-厦门港', cabinTypeName: '套房', physicalCapacity: 29, totalAvailable: 27, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv150', productId: 'prod13', segmentKey: '上海港-厦门港', cabinTypeName: '阳台房', physicalCapacity: 35, totalAvailable: 35, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv151', productId: 'prod13', segmentKey: '上海港-厦门港', cabinTypeName: '海景房', physicalCapacity: 21, totalAvailable: 20, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv152', productId: 'prod13', segmentKey: '上海港-厦门港', cabinTypeName: '内舱房', physicalCapacity: 17, totalAvailable: 15, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv153', productId: 'prod13', segmentKey: '上海港-深圳港', cabinTypeName: '套房', physicalCapacity: 28, totalAvailable: 28, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv154', productId: 'prod13', segmentKey: '上海港-深圳港', cabinTypeName: '阳台房', physicalCapacity: 39, totalAvailable: 38, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv155', productId: 'prod13', segmentKey: '上海港-深圳港', cabinTypeName: '海景房', physicalCapacity: 20, totalAvailable: 18, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv156', productId: 'prod13', segmentKey: '上海港-深圳港', cabinTypeName: '内舱房', physicalCapacity: 16, totalAvailable: 16, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv157', productId: 'prod14', segmentKey: '上海港-宁波港', cabinTypeName: '套房', physicalCapacity: 27, totalAvailable: 26, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv158', productId: 'prod14', segmentKey: '上海港-宁波港', cabinTypeName: '阳台房', physicalCapacity: 38, totalAvailable: 36, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv159', productId: 'prod14', segmentKey: '上海港-宁波港', cabinTypeName: '海景房', physicalCapacity: 24, totalAvailable: 24, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv160', productId: 'prod14', segmentKey: '上海港-宁波港', cabinTypeName: '内舱房', physicalCapacity: 15, totalAvailable: 14, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv161', productId: 'prod14', segmentKey: '上海港-厦门港', cabinTypeName: '套房', physicalCapacity: 26, totalAvailable: 24, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv162', productId: 'prod14', segmentKey: '上海港-厦门港', cabinTypeName: '阳台房', physicalCapacity: 37, totalAvailable: 37, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv163', productId: 'prod14', segmentKey: '上海港-厦门港', cabinTypeName: '海景房', physicalCapacity: 23, totalAvailable: 22, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv164', productId: 'prod14', segmentKey: '上海港-厦门港', cabinTypeName: '内舱房', physicalCapacity: 19, totalAvailable: 17, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv165', productId: 'prod14', segmentKey: '上海港-深圳港', cabinTypeName: '套房', physicalCapacity: 25, totalAvailable: 25, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv166', productId: 'prod14', segmentKey: '上海港-深圳港', cabinTypeName: '阳台房', physicalCapacity: 36, totalAvailable: 35, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv167', productId: 'prod14', segmentKey: '上海港-深圳港', cabinTypeName: '海景房', physicalCapacity: 22, totalAvailable: 20, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv168', productId: 'prod14', segmentKey: '上海港-深圳港', cabinTypeName: '内舱房', physicalCapacity: 18, totalAvailable: 18, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv169', productId: 'prod15', segmentKey: '上海港-宁波港', cabinTypeName: '套房', physicalCapacity: 29, totalAvailable: 28, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv170', productId: 'prod15', segmentKey: '上海港-宁波港', cabinTypeName: '阳台房', physicalCapacity: 35, totalAvailable: 33, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv171', productId: 'prod15', segmentKey: '上海港-宁波港', cabinTypeName: '海景房', physicalCapacity: 21, totalAvailable: 21, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv172', productId: 'prod15', segmentKey: '上海港-宁波港', cabinTypeName: '内舱房', physicalCapacity: 17, totalAvailable: 16, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv173', productId: 'prod15', segmentKey: '上海港-厦门港', cabinTypeName: '套房', physicalCapacity: 28, totalAvailable: 26, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv174', productId: 'prod15', segmentKey: '上海港-厦门港', cabinTypeName: '阳台房', physicalCapacity: 39, totalAvailable: 39, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv175', productId: 'prod15', segmentKey: '上海港-厦门港', cabinTypeName: '海景房', physicalCapacity: 20, totalAvailable: 19, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv176', productId: 'prod15', segmentKey: '上海港-厦门港', cabinTypeName: '内舱房', physicalCapacity: 16, totalAvailable: 14, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv177', productId: 'prod15', segmentKey: '上海港-深圳港', cabinTypeName: '套房', physicalCapacity: 27, totalAvailable: 27, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv178', productId: 'prod15', segmentKey: '上海港-深圳港', cabinTypeName: '阳台房', physicalCapacity: 38, totalAvailable: 37, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv179', productId: 'prod15', segmentKey: '上海港-深圳港', cabinTypeName: '海景房', physicalCapacity: 24, totalAvailable: 22, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv180', productId: 'prod15', segmentKey: '上海港-深圳港', cabinTypeName: '内舱房', physicalCapacity: 15, totalAvailable: 15, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv181', productId: 'prod16', segmentKey: '上海港-宁波港', cabinTypeName: '套房', physicalCapacity: 26, totalAvailable: 25, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv182', productId: 'prod16', segmentKey: '上海港-宁波港', cabinTypeName: '阳台房', physicalCapacity: 37, totalAvailable: 35, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv183', productId: 'prod16', segmentKey: '上海港-宁波港', cabinTypeName: '海景房', physicalCapacity: 23, totalAvailable: 23, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv184', productId: 'prod16', segmentKey: '上海港-宁波港', cabinTypeName: '内舱房', physicalCapacity: 19, totalAvailable: 18, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv185', productId: 'prod16', segmentKey: '上海港-厦门港', cabinTypeName: '套房', physicalCapacity: 25, totalAvailable: 23, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv186', productId: 'prod16', segmentKey: '上海港-厦门港', cabinTypeName: '阳台房', physicalCapacity: 36, totalAvailable: 36, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv187', productId: 'prod16', segmentKey: '上海港-厦门港', cabinTypeName: '海景房', physicalCapacity: 22, totalAvailable: 21, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv188', productId: 'prod16', segmentKey: '上海港-厦门港', cabinTypeName: '内舱房', physicalCapacity: 18, totalAvailable: 16, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv189', productId: 'prod16', segmentKey: '上海港-深圳港', cabinTypeName: '套房', physicalCapacity: 29, totalAvailable: 29, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv190', productId: 'prod16', segmentKey: '上海港-深圳港', cabinTypeName: '阳台房', physicalCapacity: 35, totalAvailable: 34, locked: 1, emergencyStock: 1, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv191', productId: 'prod16', segmentKey: '上海港-深圳港', cabinTypeName: '海景房', physicalCapacity: 21, totalAvailable: 19, locked: 2, emergencyStock: 2, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
  { id: 'pinv192', productId: 'prod16', segmentKey: '上海港-深圳港', cabinTypeName: '内舱房', physicalCapacity: 17, totalAvailable: 17, locked: 0, emergencyStock: 0, updatedBy: '系统管理员', updatedAt: '2026-05-10 09:00:00', createdAt: '2026-04-01 08:00:00' },
]

// ===================== 扩展模块基础常量 =====================
const dealerRegions = ['重庆/渝中', '重庆/江北', '湖北/宜昌', '湖北/武汉', '江苏/南京', '上海/浦东', '广东/广州', '福建/厦门']
const dealerNames = [
  '携程邮轮旗舰店',
  '同程旅行邮轮事业部',
  '飞猪度假邮轮频道',
  '春秋旅游三峡专线',
  '上海锦江游轮分销中心',
  '重庆海外旅业集团',
  '湖北峡州国旅',
  '宜昌交运旅行社',
  '南京中北国际旅行社',
  '广东南湖国旅邮轮部',
  '厦门建发国旅',
  '武汉长江国旅',
  '上海悠游假期',
  '成都环球国旅邮轮中心',
  '杭州新世界旅游',
  '深圳招商国旅',
]
const dealerChannelPool: DealerChannelType[][] = [
  ['ota'],
  ['distribution'],
  ['group'],
  ['ota', 'distribution'],
  ['distribution', 'group'],
]
const dealerLevelPool: DealerLevel[] = ['strategic', 'core', 'normal']
const dealerSettlementPool: DealerSettlementCycle[] = ['monthly', 'quarterly', 'voyage_end']
const dealerPriceSystemPool: DealerPriceSystem[][] = [
  ['retail', 'online'],
  ['contract', 'regional'],
  ['retail', 'contract'],
  ['online', 'regional'],
]
const dealerRefundPool: DealerRefundPermission[] = ['none', 'self', 'with_subordinate']
const dealerRebateDimensionPool: DealerRebateDimension[][] = [['sales'], ['orders'], ['product'], ['sales', 'orders']]
const dealerRebateCyclePool: DealerRebateCycle[] = ['monthly', 'quarterly', 'yearly']
const complaintTypePool: ComplaintType[] = ['complaint', 'consult', 'refund']
const complaintPriorityPool: ComplaintPriority[] = ['high', 'medium', 'low']
const complaintStatusPool: ComplaintStatus[] = ['pending', 'processing', 'completed']
const customerLevelPool: CustomerLevel[] = ['vip', 'advanced', 'normal', 'potential']
const customerSourcePool: CustomerSourceChannel[] = ['ota', 'official', 'offline', 'onboard']
const campaignTypePool: CampaignType[] = ['full_reduction', 'discount', 'free_ticket', 'rebate', 'early_bird', 'off_season']
const campaignStatusPool: CampaignStatus[] = ['not_started', 'ongoing', 'ended']
const campaignModePool: CampaignDiscountMode[] = ['amount', 'percentage', 'free_count']
const campaignStackingPool: CampaignStackingRule[] = ['no_stack', 'member_only', 'all_stack']
const reconciliationChannelPool: ReconciliationChannelType[] = ['ota', 'distribution']
const reconciliationStatusPool: ReconciliationStatus[] = ['pending_check', 'reconciled', 'diff_pending', 'diff_resolved']
const reconciliationDiffTypePool: ReconciliationDiffType[] = ['amount', 'time', 'missing_order', 'missing_bank']
const reportCategoryPool: ReportCategory[] = ['operations', 'distribution', 'finance', 'sales']
const reportPeriodPool: ReportPeriod[] = ['day', 'week', 'month', 'quarter', 'year']

const charterReservationTypePool: CharterReservationType[] = ['study', 'business', 'wedding', 'deck', 'hall', 'cabin']
const charterBillingTypePool: CharterBillingType[] = ['fixed', 'hourly', 'per_person']
const charterSettlementPool: CharterSettlementType[] = ['cash', 'monthly', 'unified']
const charterStatusPool: CharterOrderStatus[] = ['pending_accept', 'accepted', 'signed', 'in_progress', 'completed', 'cancelled']
const cabinHoldStatusPool: CabinHoldStatus[] = ['effective', 'released', 'expired']

function makeCharterFeeItems(seed: number): CharterFeeItem[] {
  return [
    { id: `fee-${seed}-1`, item: '船票费', unitPrice: 380 + seed * 10, quantity: 30 + seed, amount: (380 + seed * 10) * (30 + seed), remark: '基础船票' },
    { id: `fee-${seed}-2`, item: '餐饮费', unitPrice: 88, quantity: 30 + seed, amount: 88 * (30 + seed), remark: '自助晚宴' },
    { id: `fee-${seed}-3`, item: '服务费', unitPrice: 1500, quantity: 1, amount: 1500, remark: '活动统筹' },
  ]
}

function makeTravelers(seed: number): CharterTraveler[] {
  return Array.from({ length: 3 }, (_, index) => ({
    id: `traveler-${seed}-${index + 1}`,
    name: `乘客${seed}${index + 1}`,
    certificateType: '身份证',
    certificateNo: `50010${seed}${index + 1}19900101${String(index + 1).padStart(4, '0')}`,
  }))
}

function makeComplaintRecords(seed: number, status: ComplaintStatus): ComplaintRecord[] {
  const base: ComplaintRecord[] = [
    { id: `cr-${seed}-1`, opinion: '已接收工单并完成基础核验。', internalRemark: '核对订单来源与游客信息', status: 'pending', operator: users[seed % users.length].name, operatedAt: `2026-05-${String((seed % 20) + 1).padStart(2, '0')} 09:10:00` },
  ]
  if (status === 'processing' || status === 'completed') {
    base.push({ id: `cr-${seed}-2`, opinion: '已联系游客并补充问题背景，进入跟进阶段。', internalRemark: '等待业务部门回复', status: 'processing', operator: users[(seed + 1) % users.length].name, operatedAt: `2026-05-${String((seed % 20) + 1).padStart(2, '0')} 13:40:00` })
  }
  if (status === 'completed') {
    base.push({ id: `cr-${seed}-3`, opinion: '问题已闭环处理，游客已确认。', internalRemark: '归档完成', status: 'completed', operator: users[(seed + 2) % users.length].name, operatedAt: `2026-05-${String((seed % 20) + 2).padStart(2, '0')} 10:20:00` })
  }
  return base
}

function maskIdCard(value: string) {
  return `${value.slice(0, 3)}********${value.slice(-4)}`
}

function getCampaignReportName(category: ReportCategory) {
  const map: Record<ReportCategory, string> = {
    operations: '检票统计表',
    distribution: '经销商销售业绩表',
    finance: '航次收入统计表',
    sales: '产品销售排行',
  }
  return map[category]
}

// ===================== 经销商数据 =====================
export const dealers: Dealer[] = Array.from({ length: 16 }, (_, index) => {
  const product = products[index % products.length]
  return {
    id: `dealer${String(index + 1).padStart(2, '0')}`,
    name: dealerNames[index % dealerNames.length],
    code: `DLR2026${String(index + 1).padStart(3, '0')}`,
    socialCreditCode: `9150010${String(index + 1).padStart(10, '0')}`,
    channelTypes: dealerChannelPool[index % dealerChannelPool.length],
    region: dealerRegions[index % dealerRegions.length],
    level: dealerLevelPool[index % dealerLevelPool.length],
    contact: `联系人${index + 1}`,
    phone: `1380001${String(index + 1).padStart(4, '0')}`,
    qualificationFiles: [`license-${index + 1}.pdf`, `agreement-${index + 1}.jpg`],
    creditLimit: 80000 + index * 12000,
    guaranteeAmount: 10000 + index * 1500,
    settlementCycle: dealerSettlementPool[index % dealerSettlementPool.length],
    priceSystems: dealerPriceSystemPool[index % dealerPriceSystemPool.length],
    otaServiceRate: index % 3 === 0 ? Number((2.5 + index * 0.2).toFixed(1)) : null,
    refundPermission: dealerRefundPool[index % dealerRefundPool.length],
    rebateDimensions: dealerRebateDimensionPool[index % dealerRebateDimensionPool.length],
    rebateCycle: dealerRebateCyclePool[index % dealerRebateCyclePool.length],
    authorizedProductIds: [product.id, products[(index + 3) % products.length].id],
    status: index % 5 === 0 ? 'terminated' : 'cooperating',
    updatedBy: users[index % users.length].name,
    updatedAt: `2026-05-${String((index % 18) + 1).padStart(2, '0')} 10:${String((index * 7) % 60).padStart(2, '0')}:00`,
    createdAt: `2026-03-${String((index % 18) + 1).padStart(2, '0')} 09:00:00`,
  }
})

// ===================== 锁舱记录数据 =====================
export const cabinHolds: CabinHold[] = Array.from({ length: 16 }, (_, index) => {
  const dealer = dealers[index % dealers.length]
  const product = products[index % products.length]
  const voyage = voyages[index % voyages.length]
  const holdQuantity = 4 + (index % 6)
  const unitPrice = 2200 + index * 120
  const depositRatio = 20 + (index % 5) * 10
  const status = cabinHoldStatusPool[index % cabinHoldStatusPool.length]
  return {
    id: `hold${String(index + 1).padStart(2, '0')}`,
    dealerId: dealer.id,
    dealerName: dealer.name,
    productId: product.id,
    productName: product.name,
    routeName: product.routeName,
    voyageDate: voyage.startDate,
    cabinType: ['套房', '阳台房', '海景房', '内舱房'][index % 4],
    holdQuantity,
    confirmedQuantity: status === 'effective' ? Math.max(0, holdQuantity - 2) : holdQuantity - 1,
    availableInventory: 18 + (index % 8),
    unitPrice,
    depositRatio,
    depositAmount: Math.round(holdQuantity * unitPrice * depositRatio) / 100,
    releaseDeadline: `2026-06-${String((index % 20) + 1).padStart(2, '0')}`,
    releaseReason: status === 'released' ? '经销商主动释放未售库存' : status === 'expired' ? '超过释放期限自动回收' : '',
    status,
    updatedBy: users[(index + 1) % users.length].name,
    updatedAt: `2026-05-${String((index % 20) + 1).padStart(2, '0')} 15:${String((index * 3) % 60).padStart(2, '0')}:00`,
    createdAt: `2026-04-${String((index % 20) + 1).padStart(2, '0')} 11:00:00`,
  }
})

// ===================== 包船订单数据 =====================
export const charterOrders: CharterOrder[] = Array.from({ length: 15 }, (_, index) => {
  const route = routes[index % routes.length]
  const ship = ships[index % ships.length]
  const feeItems = makeCharterFeeItems(index + 1)
  const totalAmount = feeItems.reduce((sum, item) => sum + item.amount, 0)
  const status = charterStatusPool[index % charterStatusPool.length]
  const receivedDepositAmount = status === 'pending_accept' ? 0 : status === 'accepted' ? totalAmount * 0.15 : totalAmount * 0.3
  return {
    id: `charter${String(index + 1).padStart(2, '0')}`,
    orderNo: `CHT202605${String(index + 1).padStart(4, '0')}`,
    reservationType: charterReservationTypePool[index % charterReservationTypePool.length],
    companyName: `用船单位${index + 1}`,
    contactName: `联系人${index + 1}`,
    phone: `1390002${String(index + 1).padStart(4, '0')}`,
    useDate: `2026-06-${String((index % 20) + 1).padStart(2, '0')}`,
    passengerCount: 36 + index * 4,
    routeId: route.id,
    routeName: route.name,
    shipId: ship.id,
    shipName: ship.name,
    shipCapacity: ship.capacity,
    billingType: charterBillingTypePool[index % charterBillingTypePool.length],
    specialRequirement: index % 2 === 0 ? '需安排舞台、投影及欢迎茶歇。' : '需预留嘉宾休息区与摄影点位。',
    feeItems,
    totalAmount,
    depositAmount: Math.round(totalAmount * 0.3),
    receivedDepositAmount,
    depositDeadline: `2026-05-${String((index % 20) + 5).padStart(2, '0')}`,
    settlementType: charterSettlementPool[index % charterSettlementPool.length],
    realNameRequired: index % 3 === 0,
    travelers: index % 3 === 0 ? makeTravelers(index + 1) : [],
    berthOccupancy: ['free', 'reserved', 'confirmed', 'conflict'][index % 4] as CharterOrder['berthOccupancy'],
    depositStatus: receivedDepositAmount === 0 ? 'unpaid' : receivedDepositAmount < Math.round(totalAmount * 0.3) ? 'partial' : 'paid',
    balanceStatus: status === 'completed' ? 'settled' : status === 'in_progress' ? 'partial' : 'unsettled',
    status,
    internalRemark: status === 'accepted' ? '已完成业务确认，待客户签约。' : status === 'cancelled' ? '客户行程调整取消。' : '',
    rejectReason: status === 'cancelled' ? '档期冲突或客户主动取消' : '',
    collections: receivedDepositAmount > 0 ? [{ id: `collect-${index + 1}`, amount: receivedDepositAmount, feeItem: '定金', voucher: `voucher-${index + 1}.pdf`, collectedAt: `2026-05-${String((index % 20) + 2).padStart(2, '0')} 16:00:00`, collectedBy: users[index % users.length].name }] : [],
    updatedBy: users[index % users.length].name,
    updatedAt: `2026-05-${String((index % 20) + 1).padStart(2, '0')} 17:00:00`,
    createdAt: `2026-04-${String((index % 20) + 1).padStart(2, '0')} 10:00:00`,
  }
})

// ===================== 客诉工单数据 =====================
export const complaintTickets: ComplaintTicket[] = Array.from({ length: 16 }, (_, index) => {
  const product = products[index % products.length]
  const orderNo = `ORD202605${String(index + 1).padStart(4, '0')}`
  const status = complaintStatusPool[index % complaintStatusPool.length]
  return {
    id: `complaint${String(index + 1).padStart(2, '0')}`,
    ticketNo: `WO202605${String(index + 1).padStart(4, '0')}`,
    type: complaintTypePool[index % complaintTypePool.length],
    orderNo,
    customerName: `游客${index + 1}`,
    phone: `1370003${String(index + 1).padStart(4, '0')}`,
    productName: product.name,
    voyageDate: `2026-06-${String((index % 20) + 1).padStart(2, '0')}`,
    orderAmount: 3680 + index * 320,
    description: index % 3 === 0 ? '游客反馈登船前通知不及时，希望尽快确认处理结果。' : index % 3 === 1 ? '游客咨询同行儿童政策及舱房加床安排。' : '游客提交退款申请，需核对退款金额与规则。',
    attachments: [`attachment-${index + 1}.jpg`],
    priority: complaintPriorityPool[index % complaintPriorityPool.length],
    assigneeId: users[(index + 2) % users.length].id,
    assigneeName: users[(index + 2) % users.length].name,
    status,
    records: makeComplaintRecords(index + 1, status),
    updatedBy: users[(index + 2) % users.length].name,
    updatedAt: `2026-05-${String((index % 18) + 1).padStart(2, '0')} 18:00:00`,
    createdAt: `2026-05-${String((index % 18) + 1).padStart(2, '0')} 09:00:00`,
  }
})

// ===================== 客户档案数据 =====================
export const customerProfiles: CustomerProfile[] = Array.from({ length: 15 }, (_, index) => {
  const product = products[index % products.length]
  const complaint = complaintTickets[index % complaintTickets.length]
  const orderHistory = Array.from({ length: 3 }, (_, historyIndex) => ({
    id: `customer-order-${index + 1}-${historyIndex + 1}`,
    orderNo: `ORD20260${historyIndex + 3}${String(index + 1).padStart(4, '0')}`,
    productName: products[(index + historyIndex) % products.length].name,
    routeName: products[(index + historyIndex) % products.length].routeName,
    voyageDate: `2026-0${historyIndex + 3}-${String((index % 20) + 1).padStart(2, '0')}`,
    amount: 3980 + historyIndex * 860 + index * 120,
    status: '已完成',
  }))
  return {
    id: `customer${String(index + 1).padStart(2, '0')}`,
    name: `客户${index + 1}`,
    phone: `1360004${String(index + 1).padStart(4, '0')}`,
    idCard: maskIdCard(`50010${String(index + 1).padStart(12, '0')}`),
    gender: index % 2 === 0 ? '男' : '女',
    birthday: `198${index % 10}-0${(index % 8) + 1}-15`,
    nationality: '中国',
    origin: ['重庆', '上海', '武汉', '南京', '广州'][index % 5],
    sourceChannel: customerSourcePool[index % customerSourcePool.length],
    totalAmount: 6800 + index * 5200,
    voyageCount: 1 + (index % 6),
    favoriteRoute: product.routeName,
    favoriteCabin: ['套房', '阳台房', '海景房', '内舱房'][index % 4],
    lastVoyageDate: orderHistory[0].voyageDate,
    tags: index % 2 === 0 ? ['家庭出游', '高净值'] : ['企业客户', '复购潜力'],
    level: customerLevelPool[index % customerLevelPool.length],
    remark: index % 3 === 0 ? '重点关注客户，适合推送高端长线产品。' : '来源稳定，可持续触达。',
    orderHistory,
    relatedTickets: [
      { id: complaint.id, ticketNo: complaint.ticketNo, type: complaint.type, status: complaint.status, createdAt: complaint.createdAt },
    ],
    status: 'enabled',
    updatedBy: users[index % users.length].name,
    updatedAt: `2026-05-${String((index % 18) + 1).padStart(2, '0')} 12:00:00`,
    createdAt: `2026-03-${String((index % 18) + 1).padStart(2, '0')} 08:00:00`,
  }
})

// ===================== 营销活动数据 =====================
export const marketingCampaigns: MarketingCampaign[] = Array.from({ length: 15 }, (_, index) => {
  const product = products[index % products.length]
  const dealer = dealers[index % dealers.length]
  const type = campaignTypePool[index % campaignTypePool.length]
  const status = campaignStatusPool[index % campaignStatusPool.length]
  const discountValue = type === 'discount' ? 8.5 : type === 'free_ticket' ? 1 : 300 + index * 20
  const discountTotal = 12000 + index * 2600
  const drivenRevenue = 68000 + index * 12000
  return {
    id: `campaign${String(index + 1).padStart(2, '0')}`,
    name: `${product.name}营销活动${index + 1}`,
    type,
    startDate: `2026-06-${String((index % 15) + 1).padStart(2, '0')}`,
    endDate: `2026-07-${String((index % 15) + 6).padStart(2, '0')}`,
    productIds: [product.id, products[(index + 1) % products.length].id],
    productNames: [product.name, products[(index + 1) % products.length].name],
    customerScopes: index % 2 === 0 ? ['VIP', '高级'] : ['家庭出游', '企业客户'],
    channelIds: [dealer.id],
    channelNames: [dealer.name],
    discountMode: campaignModePool[index % campaignModePool.length],
    discountValue,
    orderCap: index % 4 === 0 ? null : 2000 + index * 200,
    stackingRule: campaignStackingPool[index % campaignStackingPool.length],
    coveredOrders: 40 + index * 6,
    participantCount: 88 + index * 10,
    discountTotal,
    drivenRevenue,
    roi: Number((discountTotal / drivenRevenue).toFixed(4)),
    status,
    updatedBy: users[index % users.length].name,
    updatedAt: `2026-05-${String((index % 18) + 1).padStart(2, '0')} 11:30:00`,
    createdAt: `2026-04-${String((index % 18) + 1).padStart(2, '0')} 09:20:00`,
  }
})

// ===================== 对账批次数据 =====================
export const reconciliationBatches: ReconciliationBatch[] = Array.from({ length: 15 }, (_, index) => {
  const dealer = dealers.filter((item) => item.channelTypes.includes('ota') || item.channelTypes.includes('distribution'))[index % 10]
  const diffCount = index % 4 === 0 ? 0 : (index % 3) + 1
  const differences: ReconciliationDifference[] = Array.from({ length: diffCount }, (_, diffIndex) => {
    const channelAmount = 3200 + diffIndex * 280 + index * 90
    const bankAmount = diffIndex % 2 === 0 ? channelAmount + 60 : channelAmount - 45
    return {
      id: `diff-${index + 1}-${diffIndex + 1}`,
      orderNo: `ORDREC2026${String(index + 1).padStart(3, '0')}${diffIndex + 1}`,
      tradeTime: `2026-05-${String((index % 18) + 1).padStart(2, '0')} 10:${String(diffIndex * 10).padStart(2, '0')}:00`,
      channelAmount,
      bankAmount,
      diffAmount: bankAmount - channelAmount,
      diffType: reconciliationDiffTypePool[(index + diffIndex) % reconciliationDiffTypePool.length],
      remark: diffIndex === 0 ? '等待渠道确认差异来源' : '',
      handled: index % 4 === 3,
    }
  })
  const status = diffCount === 0 ? 'reconciled' : reconciliationStatusPool[index % reconciliationStatusPool.length]
  return {
    id: `recon${String(index + 1).padStart(2, '0')}`,
    batchNo: `REC202605${String(index + 1).padStart(3, '0')}`,
    dealerId: dealer.id,
    dealerName: dealer.name,
    channelType: reconciliationChannelPool[index % reconciliationChannelPool.length],
    reconcileDate: `2026-05-${String((index % 18) + 1).padStart(2, '0')}`,
    bankFileName: `bank-flow-${index + 1}.xlsx`,
    totalCount: 80 + index * 4,
    matchedCount: 80 + index * 4 - diffCount,
    diffCount,
    matchRate: Number((((80 + index * 4 - diffCount) / (80 + index * 4)) * 100).toFixed(2)),
    handler: users[(index + 3) % users.length].name,
    status,
    differences,
    updatedBy: users[(index + 3) % users.length].name,
    updatedAt: `2026-05-${String((index % 18) + 1).padStart(2, '0')} 19:00:00`,
    createdAt: `2026-05-${String((index % 18) + 1).padStart(2, '0')} 09:40:00`,
  }
})

// ===================== 数据报表数据 =====================
export const dataReports: DataReportEntry[] = Array.from({ length: 20 }, (_, index) => {
  const category = reportCategoryPool[index % reportCategoryPool.length]
  const product = products[index % products.length]
  const route = routes[index % routes.length]
  const dealer = dealers[index % dealers.length]
  return {
    id: `report${String(index + 1).padStart(2, '0')}`,
    category,
    reportName: getCampaignReportName(category),
    period: reportPeriodPool[index % reportPeriodPool.length],
    dateLabel: `2026-${String((index % 5) + 1).padStart(2, '0')}-${String((index % 20) + 1).padStart(2, '0')}`,
    routeName: route.name,
    productName: product.name,
    dealerName: dealer.name,
    voyageNo: voyages[index % voyages.length].voyageNo,
    metricA: 80 + index * 6,
    metricB: 12 + index * 2,
    metricC: 56000 + index * 3800,
    metricD: 15 + index,
    status: 'published',
    updatedBy: users[index % users.length].name,
    updatedAt: `2026-05-${String((index % 18) + 1).padStart(2, '0')} 08:30:00`,
    createdAt: `2026-04-${String((index % 18) + 1).padStart(2, '0')} 08:30:00`,
  }
})
