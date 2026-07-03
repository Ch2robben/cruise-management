import type { Port, PortDistance, RiverReach } from '@/types'

/** 长江里程表锚点（各段以该段下游端为 0km） */
export interface YangtzeMileageAnchor {
  portId: string
  tableName: string
  mileageKm: number
  riverReach: RiverReach
  segment: 'cq-yichang' | 'yichang-wuhan' | 'wuhan-wusong' | 'shanghai-harbor'
  riverSort: number
}

/** 重庆-上海里程表（来源：业务方重庆-上海里程表） */
export const yangtzeMileageAnchors: YangtzeMileageAnchor[] = [
  // —— 上游：重庆 → 宜昌 ——
  { portId: 'p10', tableName: '重庆', mileageKm: 660, riverReach: 'upstream', segment: 'cq-yichang', riverSort: 1 },
  { portId: 'p02', tableName: '涪陵', mileageKm: 536, riverReach: 'upstream', segment: 'cq-yichang', riverSort: 2 },
  { portId: 'p03', tableName: '丰都', mileageKm: 483, riverReach: 'upstream', segment: 'cq-yichang', riverSort: 3 },
  { portId: 'p04', tableName: '忠县', mileageKm: 418, riverReach: 'upstream', segment: 'cq-yichang', riverSort: 4 },
  { portId: 'p05', tableName: '万州', mileageKm: 330, riverReach: 'upstream', segment: 'cq-yichang', riverSort: 5 },
  { portId: 'p06', tableName: '云阳', mileageKm: 293, riverReach: 'upstream', segment: 'cq-yichang', riverSort: 6 },
  { portId: 'p07', tableName: '奉节', mileageKm: 206, riverReach: 'upstream', segment: 'cq-yichang', riverSort: 7 },
  { portId: 'p31', tableName: '巫山', mileageKm: 170, riverReach: 'upstream', segment: 'cq-yichang', riverSort: 8 },
  { portId: 'p08', tableName: '神女溪', mileageKm: 155, riverReach: 'upstream', segment: 'cq-yichang', riverSort: 9 },
  { portId: 'p09', tableName: '巴东', mileageKm: 123, riverReach: 'upstream', segment: 'cq-yichang', riverSort: 10 },
  { portId: 'p21', tableName: '茅坪', mileageKm: 50, riverReach: 'upstream', segment: 'cq-yichang', riverSort: 11 },
  { portId: 'p22', tableName: '三峡大坝', mileageKm: 45, riverReach: 'upstream', segment: 'cq-yichang', riverSort: 12 },
  { portId: 'p23', tableName: '黄陵庙', mileageKm: 39, riverReach: 'upstream', segment: 'cq-yichang', riverSort: 13 },
  { portId: 'p24', tableName: '葛洲坝', mileageKm: 9, riverReach: 'upstream', segment: 'cq-yichang', riverSort: 14 },
  { portId: 'p15', tableName: '宜昌9码头', mileageKm: 0, riverReach: 'middle', segment: 'cq-yichang', riverSort: 15 },
  // —— 中游：宜昌 → 武汉 ——
  { portId: 'p15', tableName: '宜昌9码头', mileageKm: 626, riverReach: 'middle', segment: 'yichang-wuhan', riverSort: 15 },
  { portId: 'p25', tableName: '沙市', mileageKm: 478, riverReach: 'middle', segment: 'yichang-wuhan', riverSort: 16 },
  { portId: 'p14', tableName: '城陵矶', mileageKm: 230, riverReach: 'middle', segment: 'yichang-wuhan', riverSort: 17 },
  { portId: 'p11', tableName: '武汉', mileageKm: 0, riverReach: 'middle', segment: 'yichang-wuhan', riverSort: 18 },
  // —— 下游：武汉 → 吴淞口 ——
  { portId: 'p11', tableName: '武汉', mileageKm: 1043, riverReach: 'lower', segment: 'wuhan-wusong', riverSort: 18 },
  { portId: 'p16', tableName: '九江', mileageKm: 792, riverReach: 'lower', segment: 'wuhan-wusong', riverSort: 19 },
  { portId: 'p19', tableName: '安庆', mileageKm: 636, riverReach: 'lower', segment: 'wuhan-wusong', riverSort: 20 },
  { portId: 'p26', tableName: '贵池247#', mileageKm: 566, riverReach: 'lower', segment: 'wuhan-wusong', riverSort: 21 },
  { portId: 'p12', tableName: '南京五马渡', mileageKm: 340, riverReach: 'lower', segment: 'wuhan-wusong', riverSort: 22 },
  { portId: 'p27', tableName: '扬州', mileageKm: 270, riverReach: 'lower', segment: 'wuhan-wusong', riverSort: 23 },
  { portId: 'p28', tableName: '吴淞口', mileageKm: 0, riverReach: 'lower', segment: 'wuhan-wusong', riverSort: 24 },
  // —— 上海港区 ——
  { portId: 'p28', tableName: '吴淞口', mileageKm: 0, riverReach: 'estuary', segment: 'shanghai-harbor', riverSort: 24 },
  { portId: 'p29', tableName: '北外滩', mileageKm: 25, riverReach: 'estuary', segment: 'shanghai-harbor', riverSort: 25 },
  { portId: 'p30', tableName: '国客中心', mileageKm: 25, riverReach: 'estuary', segment: 'shanghai-harbor', riverSort: 26 },
]

/** 重庆朝天门 → 国客中心 总里程（km） */
export const YANGTZE_CHONGQING_TO_SHANGHAI_KM = 660 + 626 + 1043 + 25

const SEGMENT_LABEL: Record<YangtzeMileageAnchor['segment'], string> = {
  'cq-yichang': '重庆-宜昌',
  'yichang-wuhan': '宜昌-武汉',
  'wuhan-wusong': '武汉-吴淞口',
  'shanghai-harbor': '上海港区',
}

/** 各里程段长度（km）及自重庆起的累计起点 */
const SEGMENT_LENGTH_KM: Record<YangtzeMileageAnchor['segment'], number> = {
  'cq-yichang': 660,
  'yichang-wuhan': 626,
  'wuhan-wusong': 1043,
  'shanghai-harbor': 25,
}

const SEGMENT_OFFSET_KM: Record<YangtzeMileageAnchor['segment'], number> = {
  'cq-yichang': 0,
  'yichang-wuhan': 660,
  'wuhan-wusong': 660 + 626,
  'shanghai-harbor': 660 + 626 + 1043,
}

const SEGMENT_NAME_TO_KEY: Record<string, YangtzeMileageAnchor['segment']> = {
  '重庆-宜昌': 'cq-yichang',
  '宜昌-武汉': 'yichang-wuhan',
  '武汉-吴淞口': 'wuhan-wusong',
  '上海港区': 'shanghai-harbor',
}

export type MileageDistanceSource = 'mileage' | 'manual' | 'reverse' | 'none'

export interface ResolvedMileageDistance {
  distance?: PortDistance
  source: MileageDistanceSource
  hint: string | null
}

function globalKmFromAnchor(anchor: YangtzeMileageAnchor): number {
  const offset = SEGMENT_OFFSET_KM[anchor.segment]
  const len = SEGMENT_LENGTH_KM[anchor.segment]
  if (anchor.segment === 'shanghai-harbor') {
    return offset + anchor.mileageKm
  }
  return offset + (len - anchor.mileageKm)
}

/** 码头在里程表上的绝对位置（自重庆向下游，km） */
export function getPortMileagePosition(portId: string): number | null {
  const entries = yangtzeMileageAnchors.filter((anchor) => anchor.portId === portId)
  if (entries.length === 0) return null
  const values = entries.map(globalKmFromAnchor)
  return Math.min(...values)
}

/** 将码头换算为自重庆朝下游的绝对里程（km） */
export function getGlobalRiverKm(port: Port): number | null {
  const fromAnchors = getPortMileagePosition(port.id)
  if (fromAnchors != null) return fromAnchors
  if (port.mileageKm == null || !port.mileageSegment) return null
  const segmentKey = SEGMENT_NAME_TO_KEY[port.mileageSegment]
  if (!segmentKey) return null
  const segmentLen = SEGMENT_LENGTH_KM[segmentKey]
  const offset = SEGMENT_OFFSET_KM[segmentKey]
  if (segmentKey === 'shanghai-harbor') {
    return offset + port.mileageKm
  }
  return offset + (segmentLen - port.mileageKm)
}

function makeMileageDistance(from: Port, to: Port, distanceKm: number, direction: PortDistance['direction']): PortDistance {
  return {
    id: `mileage-${from.id}-${to.id}`,
    fromPortId: from.id,
    fromPortName: from.name,
    toPortId: to.id,
    toPortName: to.name,
    distanceKm,
    speedKmH: 18,
    direction,
    remark: `里程表：${from.name}→${to.name}，${distanceKm}km。`,
    status: 'enabled',
    updatedBy: '里程表',
    updatedAt: '2026-06-28 10:00:00',
    createdAt: '2026-06-28 10:00:00',
  }
}

/** 里程表优先：任意两锚点距离 = 绝对里程差；非里程表码头才查距离库 */
export function resolveMileageDistance(
  from: Port | undefined,
  to: Port | undefined,
  distanceList: PortDistance[],
): ResolvedMileageDistance {
  if (!from || !to) return { source: 'none', hint: null }

  const fromKm = getPortMileagePosition(from.id)
  const toKm = getPortMileagePosition(to.id)
  if (fromKm != null && toKm != null) {
    if (toKm > fromKm) {
      return {
        distance: makeMileageDistance(from, to, toKm - fromKm, 'downstream'),
        source: 'mileage',
        hint: null,
      }
    }
    if (toKm < fromKm) {
      return {
        distance: makeMileageDistance(from, to, fromKm - toKm, 'upstream'),
        source: 'mileage',
        hint: '上行航段：距离由里程表反推，请核对上水航速与船闸影响',
      }
    }
    return {
      distance: makeMileageDistance(from, to, 0, 'downstream'),
      source: 'mileage',
      hint: null,
    }
  }

  const exact = distanceList.find(
    (item) => item.fromPortId === from.id && item.toPortId === to.id && item.status === 'enabled',
  )
  if (exact) return { distance: exact, source: 'manual', hint: null }

  const reverse = distanceList.find(
    (item) => item.fromPortId === to.id && item.toPortId === from.id && item.status === 'enabled',
  )
  if (reverse) return { distance: reverse, source: 'reverse', hint: null }

  return {
    source: 'none',
    hint: getMileageLinkHint(from, to, false),
  }
}

export function getRiverReachMeta(portId: string): Pick<Port, 'riverReach' | 'mileageKm' | 'riverSort' | 'mileageSegment'> | null {
  const entries = yangtzeMileageAnchors.filter((item) => item.portId === portId)
  if (entries.length === 0) return null
  const primary = entries.find((item) => item.segment === 'cq-yichang')
    ?? entries.find((item) => item.segment === 'yichang-wuhan')
    ?? entries[0]
  return {
    riverReach: primary.riverReach,
    mileageKm: primary.mileageKm,
    riverSort: primary.riverSort,
    mileageSegment: SEGMENT_LABEL[primary.segment],
  }
}

/** 里程表新增码头（补充现有码头库） */
export const yangtzeSupplementPorts: Port[] = [
  { id: 'p21', name: '茅坪码头', nameEn: 'Maoping Pier', code: 'YC-MP', city: '宜昌', province: '湖北', address: '湖北省宜昌市秭归县茅坪镇', pierType: '旅游码头', berthCount: 2, maxShipLength: 130, maxDraft: 3.8, dockingWindow: '07:00-20:00', supportedShipTypes: '内河游轮', services: '换乘、候船', transferInfo: '三峡大坝游览换乘点', remark: '里程表锚点：茅坪。', sort: 21, riverReach: 'upstream', mileageKm: 50, riverSort: 11, mileageSegment: '重庆-宜昌', piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-06-28 10:00:00', createdAt: '2026-06-28 10:00:00' },
  { id: 'p22', name: '三峡大坝码头', nameEn: 'Three Gorges Dam Pier', code: 'YC-SXDB', city: '宜昌', province: '湖北', address: '湖北省宜昌市三峡坝区', pierType: '旅游码头', berthCount: 2, maxShipLength: 120, maxDraft: 3.5, dockingWindow: '08:00-18:00', supportedShipTypes: '内河游轮', services: '大坝参观换乘', transferInfo: '大坝景区接驳', remark: '里程表锚点：三峡大坝。', sort: 22, riverReach: 'upstream', mileageKm: 45, riverSort: 12, mileageSegment: '重庆-宜昌', piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-06-28 10:00:00', createdAt: '2026-06-28 10:00:00' },
  { id: 'p23', name: '黄陵庙码头', nameEn: 'Huangling Temple Pier', code: 'YC-HLM', city: '宜昌', province: '湖北', address: '湖北省宜昌市夷陵区三斗坪镇', pierType: '旅游码头', berthCount: 1, maxShipLength: 120, maxDraft: 3.5, dockingWindow: '08:00-18:00', supportedShipTypes: '内河游轮', services: '候船、景区短驳', transferInfo: '黄陵庙景区', remark: '里程表锚点：黄陵庙。', sort: 23, riverReach: 'upstream', mileageKm: 39, riverSort: 13, mileageSegment: '重庆-宜昌', piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-06-28 10:00:00', createdAt: '2026-06-28 10:00:00' },
  { id: 'p24', name: '葛洲坝码头', nameEn: 'Gezhouba Pier', code: 'YC-GZB', city: '宜昌', province: '湖北', address: '湖北省宜昌市西陵区葛洲坝', pierType: '旅游码头', berthCount: 2, maxShipLength: 130, maxDraft: 3.8, dockingWindow: '全天', supportedShipTypes: '内河游轮', services: '候船厅、船闸观光', transferInfo: '距宜昌市区约20分钟', remark: '里程表锚点：葛洲坝。', sort: 24, riverReach: 'upstream', mileageKm: 9, riverSort: 14, mileageSegment: '重庆-宜昌', piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-06-28 10:00:00', createdAt: '2026-06-28 10:00:00' },
  { id: 'p25', name: '沙市码头', nameEn: 'Shashi Pier', code: 'JZ-SS', city: '荆州', province: '湖北', address: '湖北省荆州市沙市区沿江路', pierType: '客运码头', berthCount: 2, maxShipLength: 130, maxDraft: 3.8, dockingWindow: '07:00-21:00', supportedShipTypes: '内河游轮', services: '候船、集散', transferInfo: '沙市老城区接驳', remark: '里程表锚点：沙市。', sort: 25, riverReach: 'middle', mileageKm: 478, riverSort: 16, mileageSegment: '宜昌-武汉', piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-06-28 10:00:00', createdAt: '2026-06-28 10:00:00' },
  { id: 'p26', name: '贵池247号码头', nameEn: 'Guichi Pier 247', code: 'GC-247', city: '池州', province: '安徽', address: '安徽省池州市贵池区沿江段', pierType: '旅游码头', berthCount: 1, maxShipLength: 120, maxDraft: 3.5, dockingWindow: '07:00-20:00', supportedShipTypes: '内河游轮', services: '候船、停车场', transferInfo: '九华山方向接驳', remark: '里程表锚点：贵池247#。', sort: 26, riverReach: 'lower', mileageKm: 566, riverSort: 21, mileageSegment: '武汉-吴淞口', piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-06-28 10:00:00', createdAt: '2026-06-28 10:00:00' },
  { id: 'p27', name: '扬州旅游码头', nameEn: 'Yangzhou Tourist Pier', code: 'YZ-LY', city: '扬州', province: '江苏', address: '江苏省扬州市广陵区文昌东路沿江段', pierType: '旅游码头', berthCount: 2, maxShipLength: 120, maxDraft: 3.5, dockingWindow: '07:00-21:00', supportedShipTypes: '内河游轮', services: '候船、旅游集散', transferInfo: '瘦西湖方向车程较长', remark: '里程表锚点：扬州。', sort: 27, riverReach: 'lower', mileageKm: 270, riverSort: 23, mileageSegment: '武汉-吴淞口', piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-06-28 10:00:00', createdAt: '2026-06-28 10:00:00' },
  { id: 'p28', name: '吴淞口国际邮轮码头', nameEn: 'Wusongkou Cruise Terminal', code: 'SH-WSK', city: '上海', province: '上海', address: '上海市宝山区吴淞口', pierType: '邮轮码头', berthCount: 2, maxShipLength: 150, maxDraft: 4.2, dockingWindow: '全天', supportedShipTypes: '内河游轮、邮轮', services: '候船厅、安检、行李', transferInfo: '长江入海口节点', remark: '里程表锚点：吴淞口。', sort: 28, riverReach: 'lower', mileageKm: 0, riverSort: 24, mileageSegment: '武汉-吴淞口', piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-06-28 10:00:00', createdAt: '2026-06-28 10:00:00' },
  { id: 'p29', name: '上海北外滩码头', nameEn: 'North Bund Pier', code: 'SH-BWT', city: '上海', province: '上海', address: '上海市虹口区东大名路', pierType: '旅游码头', berthCount: 2, maxShipLength: 130, maxDraft: 3.8, dockingWindow: '全天', supportedShipTypes: '内河游轮、黄浦江游船', services: '候船、游客集散', transferInfo: '北外滩商圈', remark: '里程表锚点：北外滩。', sort: 29, riverReach: 'estuary', mileageKm: 25, riverSort: 25, mileageSegment: '上海港区', piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-06-28 10:00:00', createdAt: '2026-06-28 10:00:00' },
  { id: 'p30', name: '国客中心码头', nameEn: 'Shanghai International Cruise Terminal', code: 'SH-GK', city: '上海', province: '上海', address: '上海市虹口区东大名路500号', pierType: '邮轮码头', berthCount: 3, maxShipLength: 150, maxDraft: 4, dockingWindow: '全天', supportedShipTypes: '内河游轮、邮轮', services: '候船厅、安检、商业配套', transferInfo: '距浦东机场约50分钟', remark: '里程表终点：国客中心；重庆至国客中心总里程2354km。', sort: 30, riverReach: 'estuary', mileageKm: 25, riverSort: 26, mileageSegment: '上海港区', piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-06-28 10:00:00', createdAt: '2026-06-28 10:00:00' },
  { id: 'p31', name: '巫山港码头', nameEn: 'Wushan Port Pier', code: 'WS-GK', city: '巫山', province: '重庆', address: '重庆市巫山县长江北岸', pierType: '旅游码头', berthCount: 2, maxShipLength: 130, maxDraft: 3.8, dockingWindow: '07:00-20:00', supportedShipTypes: '内河游轮', services: '候船、换乘', transferInfo: '与神女溪码头衔接', remark: '里程表锚点：巫山。', sort: 31, riverReach: 'upstream', mileageKm: 170, riverSort: 8, mileageSegment: '重庆-宜昌', piers: [], status: 'enabled', updatedBy: '系统管理员', updatedAt: '2026-06-28 10:00:00', createdAt: '2026-06-28 10:00:00' },
]

export function applyYangtzeMileageToPorts(basePorts: Port[]): Port[] {
  const supplementIds = new Set(yangtzeSupplementPorts.map((item) => item.id))
  const merged = basePorts
    .filter((port) => !supplementIds.has(port.id))
    .map((port) => {
      const meta = getRiverReachMeta(port.id)
      if (!meta) return port
      return { ...port, ...meta, remark: port.remark || `里程表：${meta.mileageSegment}。` }
    })
  return enrichPortSailTimes([...merged, ...yangtzeSupplementPorts].sort((a, b) => (a.riverSort ?? a.sort) - (b.riverSort ?? b.sort)))
}

/** 按里程表相邻锚点推算默认上/下水航行时间（分钟） */
function enrichPortSailTimes(portList: Port[]): Port[] {
  const chain = getMileageChainPorts(portList)
  const byId = new Map(portList.map((port) => [port.id, { ...port }]))

  for (let i = 0; i < chain.length - 1; i += 1) {
    const from = byId.get(chain[i].id)
    const to = byId.get(chain[i + 1].id)
    if (!from || !to) continue
    const fromKm = getPortMileagePosition(from.id)
    const toKm = getPortMileagePosition(to.id)
    if (fromKm == null || toKm == null) continue
    const km = toKm - fromKm
    if (km <= 0) continue
    if (!from.nextPierDownstreamMin) from.nextPierDownstreamMin = Math.round((km / 18) * 60)
    if (!to.prevPierUpstreamMin) to.prevPierUpstreamMin = Math.round((km / 15) * 60)
  }

  return portList.map((port) => byId.get(port.id) ?? port)
}

function getMileageChainPorts(portList: Port[]): Port[] {
  const portMap = new Map(portList.map((port) => [port.id, port]))
  const seen = new Set<string>()
  return yangtzeMileageAnchors
    .map((anchor) => ({
      anchor,
      globalKm: globalKmFromAnchor(anchor),
      port: portMap.get(anchor.portId),
    }))
    .filter((item) => item.port && !seen.has(item.anchor.portId) && (seen.add(item.anchor.portId), true))
    .sort((a, b) => a.globalKm - b.globalKm || a.anchor.riverSort - b.anchor.riverSort)
    .map((item) => item.port!)
}

/** 按里程表生成全线任意两码头（下水方向）的距离记录，不限相邻 */
export function buildYangtzePortDistances(portList: Port[]): PortDistance[] {
  const chain = getMileageChainPorts(portList)
  const result: PortDistance[] = []
  let id = 1
  const now = '2026-06-28 10:00:00'

  for (let i = 0; i < chain.length; i += 1) {
    const from = chain[i]
    const fromKm = getPortMileagePosition(from.id)!
    for (let j = i + 1; j < chain.length; j += 1) {
      const to = chain[j]
      const toKm = getPortMileagePosition(to.id)!
      const distanceKm = toKm - fromKm
      if (distanceKm <= 0) continue
      const hopCount = j - i
      result.push({
        id: `pd${String(id).padStart(3, '0')}`,
        fromPortId: from.id,
        fromPortName: from.name,
        toPortId: to.id,
        toPortName: to.name,
        distanceKm,
        speedKmH: 18,
        direction: 'downstream',
        remark: hopCount === 1
          ? `里程表：${from.name}→${to.name}。`
          : `里程表：${from.name}→${to.name}（${distanceKm}km）。`,
        status: 'enabled',
        updatedBy: '系统管理员',
        updatedAt: now,
        createdAt: now,
      })
      id += 1
    }
  }
  return result
}

/** 按长江全线排序码头（有 riverSort 的优先） */
export function sortPortsByRiver(portList: Port[]): Port[] {
  return [...portList].sort((a, b) => {
    const sortA = a.riverSort ?? a.sort
    const sortB = b.riverSort ?? b.sort
    return sortA - sortB
  })
}

/** 判断两码头在里程表上是否相邻（仅下水方向） */
export function isAdjacentMileagePort(from: Port | undefined, to: Port | undefined): boolean {
  if (!from?.riverSort || !to?.riverSort) return false
  return to.riverSort - from.riverSort === 1
}

/** 航段里程匹配提示 */
export function getMileageLinkHint(
  from: Port | undefined,
  to: Port | undefined,
  hasDistance: boolean,
): string | null {
  if (!from || !to) return null
  if (hasDistance) return null
  if (from.riverSort != null && to.riverSort != null && to.riverSort < from.riverSort) {
    return '上行航段：当前距离库以下水里程表为主，请核对或补充上水距离'
  }
  return '码头不在里程表范围内，请手工维护距离'
}

/** 景点同步关联码头的江段等信息 */
export function applyPortMetaToAttractions(attractionList: import('@/types').Attraction[], portList: Port[]): import('@/types').Attraction[] {
  const portMap = new Map(portList.map((port) => [port.id, port]))
  return attractionList.map((attraction) => {
    const port = portMap.get(attraction.portId)
    if (!port) return attraction
    return {
      ...attraction,
      portName: port.name,
      city: attraction.city || port.city,
      province: attraction.province || port.province,
      riverReach: port.riverReach,
    }
  })
}
