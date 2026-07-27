import type { MatchedPricePolicy } from '@/mock/dealerBookingPolicy'

export interface BookingCartLine {
  id: string
  segmentId: string
  segmentLabel: string
  roomType: string
  bedType: string
  count: number
  price: number
  deposit: number
  maxRooms: number
  pricingSnapshot?: {
    q: number
    coefficient: number
    formula: 'Q × 系数'
    cabinPrice: number
    capturedAt: string
  }
}

export interface DealerBookingDraft {
  productId?: string
  productName?: string
  voyageSummary?: {
    voyageKey: string
    ship: string
    route: string
    date: string
    days: string
  }
  cart?: BookingCartLine[]
  rooms?: Record<string, { count?: number; price?: number; deposit?: number; bedType?: string }>
  segmentKey?: string
  matchedPolicies?: MatchedPricePolicy[]
  specialPriceApplication?: {
    applyScope: 'order' | 'room' | 'guest'
    requestedAmount: number
    currentAmount: number
    discountAmount: number
    reason: string
    remark?: string
    contactName?: string
    contactPhone?: string
    status?: 'draft' | 'pending' | 'approved' | 'rejected'
  }
  touristData?: {
    touristList?: unknown[]
    teams?: unknown[]
    roomGroups?: unknown[]
    escortTickets?: unknown[]
  }
}
