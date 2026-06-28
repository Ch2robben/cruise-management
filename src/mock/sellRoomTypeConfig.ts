import { initialCabinData, type CabinRecord } from '@/mock/cabinManagement'

export type SellRoomTypeStatus = 'enabled' | 'disabled'

/** 售卖房型与物理房型的单条关联 */
export interface PhysicalRoomMapping {
  id: string
  physicalCabinId: string
  physicalCabinName: string
  floor?: string
}

/** 售卖房型配置 */
export interface SellRoomTypeConfig {
  id: string
  shipName: string
  sellRoomTypeName: string
  sellRoomTypeCode: string
  description: string
  mappings: PhysicalRoomMapping[]
  countDimension: 'room' | 'bed'
  alertEnabled: boolean
  alertType: 'percentage' | 'quantity'
  alertValue: number
  status: SellRoomTypeStatus
  sortNo: number
  updatedBy: string
  updatedAt: string
}

const shipCodeMap: Record<string, string> = {
  长江壹号: 'CJ1',
  长江贰号: 'CJ2',
  长江叁号: 'CJ3',
  长江探索号: 'CJTX',
  黄金游轮: 'HJ',
  维多利亚号: 'WDL',
}

const typeCodeMap: Record<string, string> = {
  标准间: 'STD',
  行政房: 'ADM',
  套房: 'SUI',
  阳台房: 'BAL',
  海景房: 'WIN',
}

export function generateSellRoomTypeCode(shipName: string, sellRoomTypeName: string) {
  const ship = shipCodeMap[shipName] || shipName.replace(/[^A-Za-z0-9\u4e00-\u9fa5]/g, '').slice(0, 4).toUpperCase()
  const type = typeCodeMap[sellRoomTypeName.trim()]
    || sellRoomTypeName.replace(/房|间/g, '').slice(0, 4).toUpperCase()
  return `${ship}-${type}`
}

export const sellRoomTypeShipOptions = ['all', '长江壹号', '长江贰号', '长江叁号']

export function getPhysicalCabinsByShip(shipName: string, cabins: CabinRecord[] = initialCabinData): CabinRecord[] {
  return cabins.filter((item) => item.shipName === shipName)
}

export function formatMappingSummary(mappings: PhysicalRoomMapping[]): string {
  if (mappings.length === 0) return '未配置'
  return mappings
    .map((item) => {
      const floor = item.floor ? `${item.floor} ` : ''
      return `${floor}${item.physicalCabinName}`
    })
    .join(' / ')
}

export const initialSellRoomTypeConfigs: SellRoomTypeConfig[] = [
  {
    id: 'srt-1',
    shipName: '长江叁号',
    sellRoomTypeName: '标准间',
    sellRoomTypeCode: 'CJ3-STD',
    description: '对外销售的标准间，可调配至同船标准间及豪华阳台标准间库存。',
    mappings: [
      {
        id: 'map-1',
        physicalCabinId: '2',
        physicalCabinName: '标准间',
        floor: '2F',
      },
      {
        id: 'map-2',
        physicalCabinId: '1',
        physicalCabinName: '长江叁号豪华阳台标准间',
        floor: '3F',
      },
    ],
    countDimension: 'room',
    alertEnabled: true,
    alertType: 'percentage',
    alertValue: 10,
    status: 'enabled',
    sortNo: 1,
    updatedBy: '彭琳',
    updatedAt: '2026-06-10 14:20:11',
  },
  {
    id: 'srt-2',
    shipName: '长江叁号',
    sellRoomTypeName: '行政房',
    sellRoomTypeCode: 'CJ3-ADM',
    description: '对外销售的行政房，优先占用 3F 行政库存。',
    mappings: [
      {
        id: 'map-3',
        physicalCabinId: '2',
        physicalCabinName: '标准间',
        floor: '3F',
      },
    ],
    countDimension: 'room',
    alertEnabled: false,
    alertType: 'percentage',
    alertValue: 10,
    status: 'enabled',
    sortNo: 2,
    updatedBy: '赵昕玥',
    updatedAt: '2026-06-08 09:15:33',
  },
  {
    id: 'srt-3',
    shipName: '长江壹号',
    sellRoomTypeName: '标准间',
    sellRoomTypeCode: 'CJ1-STD',
    description: '长江壹号标准间售卖口径，优先占用观景房库存。',
    mappings: [
      {
        id: 'map-4',
        physicalCabinId: '4',
        physicalCabinName: '长江壹号观景房',
        floor: '2F',
      },
      {
        id: 'map-5',
        physicalCabinId: '5',
        physicalCabinName: '长江壹号行政房',
        floor: '3F',
      },
    ],
    countDimension: 'room',
    alertEnabled: false,
    alertType: 'percentage',
    alertValue: 10,
    status: 'enabled',
    sortNo: 1,
    updatedBy: '彭琳',
    updatedAt: '2026-05-28 16:42:08',
  },
  {
    id: 'srt-4',
    shipName: '长江壹号',
    sellRoomTypeName: '行政房',
    sellRoomTypeCode: 'CJ1-ADM',
    description: '仅允许占用行政房物理库存，不支持向下调配。',
    mappings: [
      {
        id: 'map-6',
        physicalCabinId: '5',
        physicalCabinName: '长江壹号行政房',
        floor: '3F',
      },
    ],
    countDimension: 'room',
    alertEnabled: false,
    alertType: 'percentage',
    alertValue: 10,
    status: 'enabled',
    sortNo: 2,
    updatedBy: '彭琳',
    updatedAt: '2026-05-28 16:43:21',
  },
  {
    id: 'srt-5',
    shipName: '长江壹号',
    sellRoomTypeName: '套房',
    sellRoomTypeCode: 'CJ1-SUI',
    description: '豪华套房与总统套房统一对外售卖为“套房”。',
    mappings: [
      {
        id: 'map-7',
        physicalCabinId: '3',
        physicalCabinName: '长江壹号豪华套房',
        floor: '5F',
      },
      {
        id: 'map-8',
        physicalCabinId: '6',
        physicalCabinName: '长江壹号总统套房',
        floor: '5F',
      },
    ],
    countDimension: 'room',
    alertEnabled: false,
    alertType: 'percentage',
    alertValue: 10,
    status: 'enabled',
    sortNo: 3,
    updatedBy: '彭琳',
    updatedAt: '2026-05-29 11:08:44',
  },
  {
    id: 'srt-6',
    shipName: '长江贰号',
    sellRoomTypeName: '标准间',
    sellRoomTypeCode: 'CJ2-STD',
    description: '长江贰号标准间售卖配置，待补充物理房型映射。',
    mappings: [],
    countDimension: 'room',
    alertEnabled: false,
    alertType: 'percentage',
    alertValue: 10,
    status: 'disabled',
    sortNo: 1,
    updatedBy: '系统管理员',
    updatedAt: '2026-06-01 10:00:00',
  },
  {
    id: 'srt-7',
    shipName: '长江探索号',
    sellRoomTypeName: '套房',
    sellRoomTypeCode: 'CJTX-SUI',
    description: '长江探索号套房对外售卖口径。',
    mappings: [],
    countDimension: 'room',
    alertEnabled: false,
    alertType: 'percentage',
    alertValue: 10,
    status: 'enabled',
    sortNo: 1,
    updatedBy: '彭琳',
    updatedAt: '2026-06-12 10:00:00',
  },
  {
    id: 'srt-8',
    shipName: '长江探索号',
    sellRoomTypeName: '阳台房',
    sellRoomTypeCode: 'CJTX-BAL',
    description: '长江探索号阳台房对外售卖口径。',
    mappings: [],
    countDimension: 'room',
    alertEnabled: false,
    alertType: 'percentage',
    alertValue: 10,
    status: 'enabled',
    sortNo: 2,
    updatedBy: '彭琳',
    updatedAt: '2026-06-12 10:00:00',
  },
  {
    id: 'srt-9',
    shipName: '长江探索号',
    sellRoomTypeName: '海景房',
    sellRoomTypeCode: 'CJTX-WIN',
    description: '长江探索号海景房对外售卖口径。',
    mappings: [],
    countDimension: 'room',
    alertEnabled: false,
    alertType: 'percentage',
    alertValue: 10,
    status: 'enabled',
    sortNo: 3,
    updatedBy: '彭琳',
    updatedAt: '2026-06-12 10:00:00',
  },
  {
    id: 'srt-10',
    shipName: '黄金游轮',
    sellRoomTypeName: '阳台房',
    sellRoomTypeCode: 'HJ-BAL',
    description: '黄金游轮阳台房售卖口径。',
    mappings: [],
    countDimension: 'room',
    alertEnabled: false,
    alertType: 'percentage',
    alertValue: 10,
    status: 'enabled',
    sortNo: 1,
    updatedBy: '彭琳',
    updatedAt: '2026-06-12 10:00:00',
  },
  {
    id: 'srt-11',
    shipName: '黄金游轮',
    sellRoomTypeName: '海景房',
    sellRoomTypeCode: 'HJ-WIN',
    description: '黄金游轮海景房售卖口径。',
    mappings: [],
    countDimension: 'room',
    alertEnabled: false,
    alertType: 'percentage',
    alertValue: 10,
    status: 'enabled',
    sortNo: 2,
    updatedBy: '彭琳',
    updatedAt: '2026-06-12 10:00:00',
  },
  {
    id: 'srt-12',
    shipName: '维多利亚号',
    sellRoomTypeName: '套房',
    sellRoomTypeCode: 'WDL-SUI',
    description: '维多利亚号套房售卖口径。',
    mappings: [],
    countDimension: 'room',
    alertEnabled: false,
    alertType: 'percentage',
    alertValue: 10,
    status: 'enabled',
    sortNo: 1,
    updatedBy: '彭琳',
    updatedAt: '2026-06-12 10:00:00',
  },
  {
    id: 'srt-13',
    shipName: '维多利亚号',
    sellRoomTypeName: '阳台房',
    sellRoomTypeCode: 'WDL-BAL',
    description: '维多利亚号阳台房售卖口径。',
    mappings: [],
    countDimension: 'room',
    alertEnabled: false,
    alertType: 'percentage',
    alertValue: 10,
    status: 'enabled',
    sortNo: 2,
    updatedBy: '彭琳',
    updatedAt: '2026-06-12 10:00:00',
  },
  {
    id: 'srt-14',
    shipName: '维多利亚号',
    sellRoomTypeName: '海景房',
    sellRoomTypeCode: 'WDL-WIN',
    description: '维多利亚号海景房售卖口径。',
    mappings: [],
    countDimension: 'room',
    alertEnabled: false,
    alertType: 'percentage',
    alertValue: 10,
    status: 'enabled',
    sortNo: 3,
    updatedBy: '彭琳',
    updatedAt: '2026-06-12 10:00:00',
  },
]

export function createEmptySellRoomTypeConfig(shipName: string): SellRoomTypeConfig {
  return {
    id: `srt-${Date.now()}`,
    shipName,
    sellRoomTypeName: '',
    sellRoomTypeCode: generateSellRoomTypeCode(shipName, '新房型'),
    description: '',
    mappings: [],
    countDimension: 'room',
    alertEnabled: false,
    alertType: 'percentage',
    alertValue: 10,
    status: 'enabled',
    sortNo: 99,
    updatedBy: '系统管理员',
    updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
  }
}

export function createEmptyMapping(): PhysicalRoomMapping {
  return {
    id: `map-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    physicalCabinId: '',
    physicalCabinName: '',
    floor: '',
  }
}

/** 模板库存等业务引用的销售房型摘要 */
export interface TemplateSellRoomType {
  code: string
  name: string
  config?: SellRoomTypeConfig
}

export function getEnabledSellRoomTypesByShip(
  shipName: string,
  configs: SellRoomTypeConfig[] = initialSellRoomTypeConfigs,
): SellRoomTypeConfig[] {
  return configs
    .filter((item) => item.shipName === shipName && item.status === 'enabled')
    .sort((a, b) => a.sortNo - b.sortNo)
}

export function getTemplateSellRoomTypes(template: {
  id: string
  shipName: string
  inventory?: { cabinName: string }[]
}): TemplateSellRoomType[] {
  const fromConfig = getEnabledSellRoomTypesByShip(template.shipName)
  if (fromConfig.length > 0) {
    return fromConfig.map((item) => ({
      code: item.sellRoomTypeCode,
      name: item.sellRoomTypeName,
      config: item,
    }))
  }

  const seen = new Set<string>()
  const fromInventory: TemplateSellRoomType[] = []
  for (const item of template.inventory || []) {
    if (seen.has(item.cabinName)) continue
    seen.add(item.cabinName)
    fromInventory.push({
      code: `${template.id}-${item.cabinName}`,
      name: item.cabinName,
    })
  }
  if (fromInventory.length > 0) return fromInventory

  return [{ code: 'default', name: '默认销售房型' }]
}

export function getSellRoomTypeName(
  code: string,
  sellRoomTypes: TemplateSellRoomType[],
): string {
  return sellRoomTypes.find((item) => item.code === code)?.name ?? code
}
