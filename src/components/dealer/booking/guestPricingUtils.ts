/** 身份证区划码命中 demo 规则 → 区域价 */
const REGIONAL_ID_PREFIXES = ['42', '50', '43', '4205', '500229']

const REGIONAL_PRICE_FACTOR = 0.9

export type GuestPriceType = 'port' | 'regional'

export interface GuestPriceInfo {
  ticketPrice: number
  priceType: GuestPriceType
  priceTypeLabel: string
}

export function formatPriceTypeLabel(type: GuestPriceType) {
  return type === 'regional' ? '重庆地区结算政策' : '口岸结算政策'
}

export function parseAgeFromIdCard(idNum: string) {
  const normalized = idNum.trim()
  if (normalized.length !== 18 && normalized.length !== 15) return ''
  const birth =
    normalized.length === 18
      ? normalized.slice(6, 14)
      : `19${normalized.slice(6, 12)}`
  const year = Number(birth.slice(0, 4))
  const month = Number(birth.slice(4, 6))
  const day = Number(birth.slice(6, 8))
  if (!year || !month || !day) return ''
  const today = new Date()
  let age = today.getFullYear() - year
  const birthdayPassed =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day)
  if (!birthdayPassed) age -= 1
  return age >= 0 && age < 120 ? String(age) : ''
}

export function parseGenderFromIdCard(idNum: string) {
  const normalized = idNum.trim()
  if (normalized.length !== 18 && normalized.length !== 15) return ''
  const code = normalized.length === 18 ? Number(normalized[16]) : Number(normalized[14])
  if (Number.isNaN(code)) return ''
  return code % 2 === 1 ? '男' : '女'
}

function matchesRegionalId(idNum: string) {
  return REGIONAL_ID_PREFIXES.some((prefix) => idNum.startsWith(prefix))
}

export function resolveGuestPriceType(input: {
  idType: string
  idNum: string
  nationality: string
  guestType: string
}): GuestPriceType {
  const idNum = input.idNum.trim()

  if (input.idType === '身份证' && idNum.length >= 2) {
    return matchesRegionalId(idNum) ? 'regional' : 'port'
  }
  if (input.nationality && input.nationality !== '中国') return 'regional'
  if (input.guestType === '外宾') return 'regional'
  return 'port'
}

export interface PricePolicyOption {
  id: string
  name: string
  shortLabel: string
  factor: number
  desc: string
}

export const BOOKING_PRICE_POLICIES: PricePolicyOption[] = [
  { id: 'auto', name: '自动匹配政策 (默认)', shortLabel: '自动匹配', factor: 1, desc: '根据证件属地/国籍自动识别' },
  { id: 'cq_trade', name: '重庆地区结算政策 (9折)', shortLabel: '重庆地区结算政策', factor: 0.9, desc: '9折' },
  { id: 'hb_trade', name: '湖北同业结算政策 (92折)', shortLabel: '湖北同业结算政策', factor: 0.92, desc: '9.2折' },
  { id: 'port_base', name: '口岸基准政策 (无折扣)', shortLabel: '口岸基准政策', factor: 1.0, desc: '标准基准价' },
  { id: 'ota_special', name: 'OTA渠道结算政策 (88折)', shortLabel: 'OTA渠道结算政策', factor: 0.88, desc: '8.8折' },
  { id: 'vip_protocol', name: 'VIP协议优惠政策 (85折)', shortLabel: 'VIP协议优惠政策', factor: 0.85, desc: '8.5折' },
]

export function applyGuestPriceType(ticketPrice: number, priceType: GuestPriceType) {
  if (priceType === 'port') return ticketPrice
  return Math.round(ticketPrice * REGIONAL_PRICE_FACTOR)
}

interface GuestPriceInput {
  id: number
  idType: string
  idNum: string
  nationality: string
  guestType: string
  stayType: string
  pricePolicyId?: string
}

interface RoomPriceInput {
  roomType: string
  guests: GuestPriceInput[]
}

export function calculateGuestBaseTicket(
  room: RoomPriceInput,
  guestIndex: number,
  basePrice: number,
) {
  const guest = room.guests[guestIndex]
  if (!guest) return { price: 0, desc: '' }

  const position = guestIndex + 1
  const { roomType } = room
  const { stayType } = guest
  const guestCount = room.guests.length

  if (roomType !== '标准间' && stayType === '单间' && guestCount === 1) {
    return { price: basePrice, desc: `${roomType}·单间` }
  }
  if (stayType === '单间') {
    return { price: Math.round(basePrice * 1.75), desc: `第${position}人·单间` }
  }
  if (stayType === '儿童不占床') {
    return { price: Math.round(basePrice * 0.5), desc: `第${position}人·儿童不占床` }
  }
  if (stayType === '不占床') {
    return { price: Math.round(basePrice * 0.1), desc: `第${position}人·婴儿不占床` }
  }
  if (stayType === '加床') {
    const factor = position >= 3 ? 0.5 : 1.5
    return { price: Math.round(basePrice * factor), desc: `第${position}人·加床` }
  }
  return { price: basePrice, desc: `第${position}人·标准` }
}

export function resolveGuestPriceInfo(
  guest: GuestPriceInput,
  room: RoomPriceInput,
  guestIndex: number,
  basePrice: number,
): GuestPriceInfo {
  const { price } = calculateGuestBaseTicket(room, guestIndex, basePrice)
  const selectedPolicy = BOOKING_PRICE_POLICIES.find((item) => item.id === guest.pricePolicyId)

  if (selectedPolicy && selectedPolicy.id !== 'auto') {
    const ticketPrice = Math.round(price * selectedPolicy.factor)
    return {
      ticketPrice,
      priceType: selectedPolicy.id === 'port_base' ? 'port' : 'regional',
      priceTypeLabel: selectedPolicy.shortLabel,
    }
  }

  const priceType = resolveGuestPriceType(guest)
  const ticketPrice = applyGuestPriceType(price, priceType)

  return {
    ticketPrice,
    priceType,
    priceTypeLabel: formatPriceTypeLabel(priceType),
  }
}
