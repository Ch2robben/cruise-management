export interface VoyageQPricingConfig {
  voyageKey: string
  q: number
  updatedAt: string
}

const DEFAULT_VOYAGE_Q = 500

const voyageQStore: Record<string, VoyageQPricingConfig> = {
  v01: { voyageKey: 'v01', q: 500, updatedAt: '2026-07-26 10:00:00' },
  v02: { voyageKey: 'v02', q: 520, updatedAt: '2026-07-26 10:00:00' },
  v03: { voyageKey: 'v03', q: 550, updatedAt: '2026-07-26 10:00:00' },
  '长江叁号-2026-06-15': {
    voyageKey: '长江叁号-2026-06-15',
    q: 2980,
    updatedAt: '2026-07-26 10:00:00',
  },
  '长江贰号-2026-06-22': {
    voyageKey: '长江贰号-2026-06-22',
    q: 3680,
    updatedAt: '2026-07-26 10:00:00',
  },
}

const voyageSegmentQStore: Record<string, Record<string, number>> = {
  '长江叁号-2026-06-15': {
    'cq-yz': 2980,
    'cq-fd': 980,
    'cq-fj': 1680,
    'fd-yz': 2180,
    'fd-fj': 880,
    'fj-yz': 1480,
  },
  '长江贰号-2026-06-22': {
    'cq-yz': 3680,
    'cq-fd': 1180,
    'cq-fj': 2080,
    'fd-yz': 2680,
    'fd-fj': 1080,
    'fj-yz': 1780,
  },
}

const roomCoefficientStore: Record<string, number> = {
  标准间: 1,
  行政房: 1.35,
  套房: 1.6,
  阳台房: 1,
  海景房: 0.6,
  豪华套房: 1.9,
  总统套房: 3.32,
  内舱房: 0.8,
}

export function buildBookingVoyageKey(ship: string, date: string) {
  return `${ship}-${date}`
}

export function getVoyageQ(voyageKey: string) {
  return voyageQStore[voyageKey]?.q ?? DEFAULT_VOYAGE_Q
}

export function getVoyageSegmentQ(voyageKey: string, segmentId: string) {
  return voyageSegmentQStore[voyageKey]?.[segmentId] ?? getVoyageQ(voyageKey)
}

export function saveVoyageQ(voyageKey: string, q: number) {
  const normalizedQ = Math.max(0, Number(q) || 0)
  voyageQStore[voyageKey] = {
    voyageKey,
    q: normalizedQ,
    updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
  }
  return voyageQStore[voyageKey]
}

export function getDefaultRoomCoefficient(roomType: string) {
  return roomCoefficientStore[roomType] ?? 1
}

export function saveDefaultRoomCoefficient(roomType: string, coefficient: number) {
  roomCoefficientStore[roomType] = Math.max(0, Number(coefficient) || 0)
  return roomCoefficientStore[roomType]
}

export function calculateCabinPrice(q: number, coefficient: number) {
  return Math.round(Math.max(0, q) * Math.max(0, coefficient))
}
