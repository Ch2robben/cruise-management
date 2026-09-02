import { products, ships } from '@/mock/data'

export type DistCruiseShelfStatus = 'on_sale' | 'off_shelf'

export interface DistCruiseChannelSetting {
  key: string
  name: string
  sellable: boolean
  settlePrice: number
}

export interface DistCruiseCalendarDayPrice {
  date: string
  costPrice: number
  retailPrice: number
  marketPrice: number
  windowPrice: number
  distributePrice: number
}

export interface DistCruiseTicket {
  id: string
  name: string
  departPort: string
  arrivePort: string
  cabinName: string
  ticketType: string
  costPrice: number
  retailPrice: number
  marketPrice: number
  settlePrice: number
  status: 'on' | 'off'
  sort: number
  channels: DistCruiseChannelSetting[]
  calendarPrices: DistCruiseCalendarDayPrice[]
}

export interface DistCruiseProduct {
  id: string
  name: string
  shipName: string
  category: string
  supplier: string
  source: string
  tag: string
  shelfStatus: DistCruiseShelfStatus
  sort: number
  tickets: DistCruiseTicket[]
}

export const DIST_CRUISE_CHANNELS = [
  { key: 'distribute', name: '分销预定' },
  { key: 'douyin', name: '抖音' },
  { key: 'meituan', name: '美团' },
  { key: 'ctrip', name: '携程' },
  { key: 'tongcheng', name: '同程' },
  { key: 'fliggy', name: '飞猪' },
] as const

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function buildCalendarPrices(baseRetail: number, baseDistribute: number): DistCruiseCalendarDayPrice[] {
  return Array.from({ length: 31 }, (_, index) => {
    const day = index + 1
    const bump = day % 7 === 0 || day % 7 === 6 ? 30 : 0
    return {
      date: `2026-08-${pad(day)}`,
      costPrice: 0,
      retailPrice: baseRetail + bump,
      marketPrice: baseRetail + 40 + bump,
      windowPrice: baseRetail + 20 + bump,
      distributePrice: baseDistribute + Math.floor(bump * 0.6),
    }
  })
}

function defaultChannels(settlePrice: number): DistCruiseChannelSetting[] {
  return DIST_CRUISE_CHANNELS.map((channel, index) => ({
    key: channel.key,
    name: channel.name,
    sellable: index === 0,
    settlePrice: index === 0 ? settlePrice : 0,
  }))
}

const ticketTypes = ['成人票', '儿童票', '优待票']

/** 分销中心 · 游轮产品（对齐 CTIOP 产品库） */
export const distributionCruiseProducts: DistCruiseProduct[] = products.slice(0, 8).map((product, index) => {
  const shelfStatus: DistCruiseShelfStatus = index % 5 === 0 ? 'off_shelf' : 'on_sale'
  const retail = 2680 + (index % 5) * 120
  const settle = Math.round(retail * 0.78)
  const tickets: DistCruiseTicket[] = ticketTypes.map((ticketType, ticketIndex) => {
    const ticketRetail = retail - ticketIndex * 400
    const ticketSettle = Math.round(ticketRetail * 0.78)
    return {
      id: `${product.id}-t${ticketIndex + 1}`,
      name: `${ticketType} - ${product.shipName}（${product.startPort} -> ${product.endPort}）`,
      departPort: product.startPort,
      arrivePort: product.endPort,
      cabinName: product.configuredRoomTypes?.[0] || '标准间',
      ticketType,
      costPrice: Math.round(ticketRetail * 0.55),
      retailPrice: ticketRetail,
      marketPrice: ticketRetail + 200,
      settlePrice: ticketSettle,
      status: shelfStatus === 'on_sale' ? 'on' : 'off',
      sort: ticketIndex + 1,
      channels: defaultChannels(ticketSettle),
      calendarPrices: buildCalendarPrices(ticketRetail, ticketSettle),
    }
  })

  return {
    id: product.id,
    name: product.name.startsWith('【') ? product.name : `【${index % 2 === 0 ? '上行' : '下行'}】${product.name}`,
    shipName: product.shipName || ships[index % ships.length].name,
    category: product.category || '三峡游轮',
    supplier: '长江游轮运营中心',
    source: '游管系统同步',
    tag: '航期制',
    shelfStatus,
    sort: index + 1,
    tickets,
  }
})

export const distributionCruiseShipOptions = [...new Set(distributionCruiseProducts.map((item) => item.shipName))]

export interface DistCruiseProductFilter {
  shipName?: string
  keyword?: string
  shelfStatus?: DistCruiseShelfStatus | 'all'
}

export function filterDistributionCruiseProducts(filters: DistCruiseProductFilter = {}) {
  const keyword = filters.keyword?.trim().toLowerCase() ?? ''
  return distributionCruiseProducts.filter((item) => {
    if (filters.shelfStatus && filters.shelfStatus !== 'all' && item.shelfStatus !== filters.shelfStatus) return false
    if (filters.shipName && filters.shipName !== 'all' && item.shipName !== filters.shipName) return false
    if (keyword && ![item.name, item.shipName, item.category, ...item.tickets.map((t) => t.name)].some((v) => v.toLowerCase().includes(keyword))) {
      return false
    }
    return true
  })
}
