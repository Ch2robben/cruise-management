/** 分销商任务认领：按航次 × 航段 × 房型认领间数并支付定金，同步生成一条锁舱记录 */
import { cabinHolds, dealers, products } from '@/mock/data'
import { bookingSegmentOptions, defaultRoomReserveData } from '@/mock/data'
import type { CabinHold } from '@/types'
import { generateId } from '@/utils/format'

export type TaskClaimStatus = 'pending_payment' | 'effective' | 'cancelled'

export interface TaskClaimLine {
  segmentId: string
  segmentLabel: string
  roomType: string
  rooms: number
  unitPrice: number
  depositPerRoom: number
  maxRooms: number
}

export interface DealerTaskClaim {
  id: string
  claimNo: string
  dealerId: string
  dealerName: string
  productId: string
  productName: string
  voyageKey: string
  ship: string
  route: string
  voyageDate: string
  days: string
  lines: TaskClaimLine[]
  totalRooms: number
  totalAmount: number
  depositAmount: number
  holdId?: string
  status: TaskClaimStatus
  payMethod?: string
  createdAt: string
  paidAt?: string
}

export interface ClaimVoyageInput {
  productId: string
  productName: string
  voyageKey: string
  ship: string
  route: string
  date: string
  days: string
}

const currentDealer = dealers.find((item) => item.status === 'cooperating') ?? dealers[1]

export function getClaimDealer() {
  return currentDealer
}

export function getRoomCatalog() {
  return defaultRoomReserveData
}

export function getClaimSegments() {
  return bookingSegmentOptions.map((item) => ({
    id: item.id,
    label: `${item.startPort} → ${item.endPort}${item.isWhole ? '（全程）' : ''}`,
    isWhole: Boolean(item.isWhole),
  }))
}

function nowStamp() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

function buildClaimNo() {
  return `CLM${Date.now().toString().slice(-10)}`
}

function summarizeLines(lines: TaskClaimLine[]) {
  const totalRooms = lines.reduce((sum, line) => sum + line.rooms, 0)
  const totalAmount = lines.reduce((sum, line) => sum + line.rooms * line.unitPrice, 0)
  const depositAmount = lines.reduce((sum, line) => sum + line.rooms * line.depositPerRoom, 0)
  const roomTypes = Array.from(new Set(lines.map((line) => line.roomType)))
  const segments = Array.from(new Set(lines.map((line) => line.segmentLabel)))
  const roomSummary = lines.map((line) => `${line.segmentLabel} ${line.roomType}${line.rooms}间`).join('；')
  return {
    totalRooms,
    totalAmount,
    depositAmount,
    cabinType: roomTypes.length === 1 ? roomTypes[0] : '多种房型',
    segmentLabel: segments.join('、'),
    roomSummary,
  }
}

function addDays(dateStr: string, delta: number) {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + delta)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function createHoldFromClaim(claim: DealerTaskClaim): CabinHold {
  const summary = summarizeLines(claim.lines)
  const depositRatio = summary.totalAmount > 0
    ? Math.round((summary.depositAmount / summary.totalAmount) * 100)
    : 30
  const product = products.find((item) => item.id === claim.productId)
  const now = nowStamp()
  return {
    id: `hold-claim-${claim.id}`,
    dealerId: claim.dealerId,
    dealerName: claim.dealerName,
    productId: claim.productId,
    productName: claim.productName,
    routeName: product?.routeName || claim.route,
    voyageDate: claim.voyageDate,
    cabinType: summary.cabinType,
    holdQuantity: summary.totalRooms,
    confirmedQuantity: 0,
    availableInventory: summary.totalRooms,
    unitPrice: summary.totalRooms > 0 ? Math.round(summary.totalAmount / summary.totalRooms) : 0,
    depositRatio,
    depositAmount: summary.depositAmount,
    releaseDeadline: addDays(claim.voyageDate, -7),
    releaseReason: '',
    status: 'effective',
    source: 'dealer_claim',
    claimNo: claim.claimNo,
    segmentLabel: summary.segmentLabel,
    roomSummary: summary.roomSummary,
    updatedBy: claim.dealerName,
    updatedAt: now,
    createdAt: now,
  }
}

const seedLines: TaskClaimLine[] = [
  {
    segmentId: 'cq-yz',
    segmentLabel: '重庆 → 宜昌（全程）',
    roomType: '标准间',
    rooms: 4,
    unitPrice: 2980,
    depositPerRoom: 500,
    maxRooms: 8,
  },
  {
    segmentId: 'cq-yz',
    segmentLabel: '重庆 → 宜昌（全程）',
    roomType: '豪华套房',
    rooms: 1,
    unitPrice: 5680,
    depositPerRoom: 1500,
    maxRooms: 2,
  },
]

const seedSummary = summarizeLines(seedLines)
const seedClaim: DealerTaskClaim = {
  id: 'claim-seed-01',
  claimNo: 'CLM2026061501',
  dealerId: currentDealer.id,
  dealerName: currentDealer.name,
  productId: products[0]?.id ?? 'prod01',
  productName: products[0]?.name ?? '三峡经典下水之旅',
  voyageKey: '长江叁号-2026-06-15',
  ship: '长江叁号',
  route: '重庆→宜昌',
  voyageDate: '2026-06-15',
  days: '上水4天3晚',
  lines: seedLines,
  totalRooms: seedSummary.totalRooms,
  totalAmount: seedSummary.totalAmount,
  depositAmount: seedSummary.depositAmount,
  status: 'effective',
  payMethod: 'balance',
  createdAt: '2026-06-01 10:20:00',
  paidAt: '2026-06-01 10:26:00',
  holdId: 'hold-claim-claim-seed-01',
}

let store: DealerTaskClaim[] = [{ ...seedClaim, lines: seedLines.map((line) => ({ ...line })) }]

export function listDealerTaskClaims() {
  return store.map((item) => ({
    ...item,
    lines: item.lines.map((line) => ({ ...line })),
  }))
}

export function getDealerTaskClaimById(id: string) {
  return listDealerTaskClaims().find((item) => item.id === id)
}

export function createDealerTaskClaim(voyage: ClaimVoyageInput, lines: TaskClaimLine[]) {
  const validLines = lines.filter((line) => line.rooms > 0)
  if (validLines.length === 0) return undefined
  const summary = summarizeLines(validLines)
  const claim: DealerTaskClaim = {
    id: generateId(),
    claimNo: buildClaimNo(),
    dealerId: currentDealer.id,
    dealerName: currentDealer.name,
    productId: voyage.productId,
    productName: voyage.productName,
    voyageKey: voyage.voyageKey,
    ship: voyage.ship,
    route: voyage.route,
    voyageDate: voyage.date,
    days: voyage.days,
    lines: validLines,
    totalRooms: summary.totalRooms,
    totalAmount: summary.totalAmount,
    depositAmount: summary.depositAmount,
    status: 'pending_payment',
    createdAt: nowStamp(),
  }
  store = [claim, ...store]
  return { ...claim, lines: validLines.map((line) => ({ ...line })) }
}

export function payDealerTaskClaim(id: string, payMethod: string) {
  const current = store.find((item) => item.id === id)
  if (!current || current.status !== 'pending_payment') return undefined
  const hold = createHoldFromClaim(current)
  cabinHolds.unshift(hold)
  const paidAt = nowStamp()
  store = store.map((item) => (
    item.id === id
      ? { ...item, status: 'effective', payMethod, holdId: hold.id, paidAt }
      : item
  ))
  return getDealerTaskClaimById(id)
}

export function cancelDealerTaskClaim(id: string) {
  const current = store.find((item) => item.id === id)
  if (!current || current.status !== 'pending_payment') return false
  store = store.map((item) => (item.id === id ? { ...item, status: 'cancelled' } : item))
  return true
}
