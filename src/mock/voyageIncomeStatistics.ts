import { dealers, ships } from '@/mock/data'

export type VoyageSalesMode = '经销' | '直客' | 'OTA' | '包船' | '内部'

export interface VoyageIncomeStatisticRow {
  id: string
  voyageNo: string
  sailDate: string
  salesperson: string
  salesMode: VoyageSalesMode
  orderNo: string
  shipName: string
  orderReception: number
  actualReception: number
  agentName: string
  listAvgPrice: number
  settleAvgPrice: number
  ticketIncome: number
  addonIncome: number
  sightseeingIncome: number
  subtotal: number
}

export const voyageSalesModes: VoyageSalesMode[] = ['经销', '直客', 'OTA', '包船', '内部']

const salespeople = ['张敏', '李强', '王芳', '陈伟', '赵丽', '刘洋', '周杰', '吴婷']

const enabledShips = ships.filter((ship) => ship.status === 'enabled').slice(0, 8)
const agencyNames = dealers.slice(0, 10).map((item) => item.name)

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function buildSailDate(index: number) {
  const day = (index % 27) + 1
  return `2026-08-${pad(day)}`
}

function buildVoyageNo(shipIndex: number, day: number) {
  const shipCode = enabledShips[shipIndex % enabledShips.length].code.replace(/-/g, '')
  return `${shipCode}2608${pad(day)}`
}

/** 航次收入统计 mock 明细（按订单维度） */
export const voyageIncomeStatistics: VoyageIncomeStatisticRow[] = Array.from({ length: 48 }, (_, index) => {
  const ship = enabledShips[index % enabledShips.length]
  const sailDate = buildSailDate(index)
  const day = Number(sailDate.slice(-2))
  const salesMode = voyageSalesModes[index % voyageSalesModes.length]
  const orderReception = 8 + (index % 12) * 2
  const actualReception = Math.max(4, orderReception - (index % 3))
  const listAvgPrice = 2680 + (index % 7) * 120
  const settleAvgPrice = Math.round(listAvgPrice * (0.78 + (index % 5) * 0.03))
  const ticketIncome = settleAvgPrice * actualReception
  const sightseeingIncome = Math.round(actualReception * (80 + (index % 5) * 20))
  const addonIncome = Math.round(ticketIncome * (0.08 + (index % 4) * 0.02))
    + Math.round(actualReception * (30 + (index % 3) * 10))
  const subtotal = ticketIncome + addonIncome + sightseeingIncome

  return {
    id: `vis-${String(index + 1).padStart(3, '0')}`,
    voyageNo: buildVoyageNo(index, day),
    sailDate,
    salesperson: salespeople[index % salespeople.length],
    salesMode,
    orderNo: `ORD202608${pad(day)}${String(1000 + index)}`,
    shipName: ship.name,
    orderReception,
    actualReception,
    agentName: agencyNames[index % agencyNames.length],
    listAvgPrice,
    settleAvgPrice,
    ticketIncome,
    addonIncome,
    sightseeingIncome,
    subtotal,
  }
})

export interface VoyageIncomeFilter {
  dateFrom?: string
  dateTo?: string
  shipName?: string
  salesMode?: string
  agencyName?: string
  voyageNo?: string
}

export function filterVoyageIncomeStatistics(filters: VoyageIncomeFilter = {}) {
  const voyageKeyword = filters.voyageNo?.trim().toLowerCase() ?? ''
  return voyageIncomeStatistics.filter((row) => {
    if (filters.dateFrom && row.sailDate < filters.dateFrom) return false
    if (filters.dateTo && row.sailDate > filters.dateTo) return false
    if (filters.shipName && filters.shipName !== 'all' && row.shipName !== filters.shipName) return false
    if (filters.salesMode && filters.salesMode !== 'all' && row.salesMode !== filters.salesMode) return false
    if (filters.agencyName && filters.agencyName !== 'all' && row.agentName !== filters.agencyName) return false
    if (voyageKeyword && !row.voyageNo.toLowerCase().includes(voyageKeyword)) return false
    return true
  })
}

export const voyageIncomeShipOptions = enabledShips.map((ship) => ship.name)
export const voyageIncomeAgencyOptions = agencyNames
