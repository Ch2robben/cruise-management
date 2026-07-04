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
}

export interface DealerBookingDraft {
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
