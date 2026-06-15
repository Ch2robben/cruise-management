// ========== 通用类型 ==========
export type Status = 'enabled' | 'disabled'

export interface BaseEntity {
  id: string
  status: Status
  createdAt: string
  updatedAt: string
  updatedBy: string
}

// ========== 基础设置 ==========
export interface Holiday extends BaseEntity {
  name: string
  date: string
  type: '法定假日' | '周末' | '调休'
  remark: string
}

export interface IdType extends BaseEntity {
  code: string
  name: string
  remark: string
}

export interface AgeGroup extends BaseEntity {
  name: string
  minAge: number
  maxAge: number
  remark: string
}

// ========== 用户相关 ==========
export interface User {
  id: string
  account: string
  name: string
  phone: string
  email: string
  roleId: string
  roleName: string
  status: Status
  lastLoginAt: string
  createdAt: string
}

export interface LoginForm {
  account: string
  password: string
}

export interface RegisterForm {
  companyName: string
  name: string
  phone: string
  password: string
  confirmPassword: string
}

export interface AuthUser {
  id: string
  account: string
  name: string
  roleName: string
  token: string
}

// ========== 角色 ==========
export interface Role {
  id: string
  code: string
  name: string
  description: string
  status: Status
  createdAt: string
}

// ========== 菜单 ==========
export interface Menu {
  id: string
  name: string
  code: string
  parentId: string | null
  parentName: string
  route: string
  type: 'menu' | 'button'
  sort: number
  icon: string
  permission: string
  status: Status
}

// ========== 数据字典 ==========
export interface Dictionary {
  id: string
  dictCode: string
  dictName: string
  itemCode: string
  itemName: string
  sort: number
  status: Status
  remark: string
}

// ========== 码头 ==========
export interface Pier {
  id: string
  portId: string
  name: string
  nameEn: string
  position: string
  sort: number
}

// ========== 码头 ==========
export interface Port {
  id: string
  name: string
  nameEn: string
  code: string
  city: string
  province: string
  address?: string
  longitude?: number
  latitude?: number
  pierType?: string
  berthCount?: number
  maxShipLength?: number
  maxDraft?: number
  dockingWindow?: string
  supportedShipTypes?: string
  services?: string
  transferInfo?: string
  remark?: string
  sort: number
  piers: Pier[]
  status: Status
  updatedBy: string
  updatedAt: string
  createdAt: string
}

export interface PortForm {
  name: string
  nameEn: string
  code: string
  city: string
  province: string
  address: string
  longitude: number
  latitude: number
  pierType: string
  berthCount: number
  maxShipLength: number
  maxDraft: number
  dockingWindow: string
  supportedShipTypes: string
  services: string
  transferInfo: string
  remark: string
  sort: number
}

// ========== 码头距离 ==========
export interface PortDistance {
  id: string
  fromPortId: string
  fromPortName: string
  toPortId: string
  toPortName: string
  distanceKm: number
  speedKmH: number
  waterway: string
  remark: string
  status: Status
  updatedBy: string
  updatedAt: string
  createdAt: string
}

export interface PortDistanceForm {
  fromPortId: string
  toPortId: string
  distanceKm: number
  speedKmH: number
  waterway: string
  remark: string
}

// ========== 景点 ==========
export interface Attraction {
  id: string
  name: string
  nameEn: string
  portId: string
  portName: string
  city: string
  province?: string
  address?: string
  longitude?: number
  latitude?: number
  category?: string
  visitDuration: string
  suggestedDurationMin?: number
  minStopoverMin?: number
  portDistanceKm?: number
  transferDurationMin?: number
  openSeason?: string
  openHours?: string
  difficulty?: string
  suitableGroups?: string
  bookingRequired?: boolean
  ticketPolicy?: string
  validationNotes?: string
  description: string
  status: Status
  updatedBy: string
  updatedAt: string
  createdAt: string
}

export interface AttractionForm {
  name: string
  nameEn: string
  portId: string
  city: string
  province: string
  address: string
  longitude: number
  latitude: number
  category: string
  visitDuration: string
  suggestedDurationMin: number
  minStopoverMin: number
  portDistanceKm: number
  transferDurationMin: number
  openSeason: string
  openHours: string
  difficulty: string
  suitableGroups: string
  bookingRequired: boolean
  ticketPolicy: string
  description: string
}

// ========== 航线 ==========
export interface RouteStop {
  id: string
  portId: string
  portName: string
  day: number
  pierId: string
  pierName: string
  sailTime: string
  distance: number
  type: 'start' | 'middle' | 'end'
  embarkDisembark?: boolean
}

export interface Route {
  id: string
  code: string
  name: string
  type: 'upstream' | 'downstream'
  days: number
  nights: number
  ports: string
  duration: string
  stops: RouteStop[]
  image: string
  remark: string
  status: Status
  updatedBy: string
  updatedAt: string
  createdAt: string
}

export interface RouteForm {
  code: string
  name: string
  type: 'upstream' | 'downstream'
  stops: Omit<RouteStop, 'id'>[]
  image: string
  remark: string
}

// ========== 甲板设施 ==========
export interface DeckFacility {
  id: string
  name: string
  hours: string
  enabled: boolean
}

// ========== 船舱 ==========
export interface Cabin {
  id: string
  name: string
  nameEn: string
  image: string
  cabinCount: number
  bedCount: number
  extraBed: number
  capacity: number
  area: number
  balconyArea: number
  premiumDiff: number
  floorFee: number
  height: number
  description: string
  sort: number
  sellByRoom: boolean
  mergeTourPlan: boolean
}

// ========== 甲板 ==========
export interface Deck {
  id: string
  floorNum: number
  name: string
  nameEn: string
  area: number
  image: string
  remark: string
  facilities: DeckFacility[]
  cabins: Cabin[]
}

// ========== 船舶 ==========
export interface Ship {
  id: string
  code: string
  name: string
  nameEn: string
  series: string
  realNameId: string
  capacity: number
  floors: number
  length: number
  width: number
  depth: number
  speed: number
  voltage: number
  acSystem: string
  factoryDate: string
  lastRenovation: string
  maidenVoyage: string
  renovationContent: string
  contact: string
  contactPhone: string
  cabinCount: number
  level: string
  cabinTypes: string[]
  decks: Deck[]
  status: Status
  updatedBy: string
  updatedAt: string
  createdAt: string
}

export interface ShipForm {
  name: string
  nameEn: string
  code: string
  series: string
  realNameId: string
  capacity: number
  floors: number
  length: number
  width: number
  depth: number
  speed: number
  voltage: number
  acSystem: string
  factoryDate: string
  lastRenovation: string
  maidenVoyage: string
  renovationContent: string
  contact: string
  contactPhone: string
  decks: (Omit<Deck, 'id' | 'facilities' | 'cabins'> & { facilities: Omit<DeckFacility, 'id'>[]; cabins: Omit<Cabin, 'id'>[] })[]
}

// ========== 产品 ==========
export interface ProductSegment {
  id: string
  startPort: string
  endPort: string
  days: number
  mileage: number
  status: Status
}

export interface PricingRow {
  segmentKey: string
  startPort: string
  endPort: string
  cabinType: string
  costPrice: number
  basePrice: number
}

export interface Product {
  id: string
  name: string
  category?: string
  routeId: string
  routeName: string
  routeType: 'upstream' | 'downstream'
  shipId: string
  shipName: string
  shipLevel: string
  startPort: string
  endPort: string
  days: number
  nights: number
  mileage: number
  duration: string
  icon: string
  images: string[]
  description: string
  segments: ProductSegment[]
  pricing: PricingRow[]
  approvalStatus?: string
  approvalTimeline?: ApprovalStep[]
  publishStatus?: 'published' | 'unpublished'
  status: Status
  updatedBy: string
  updatedAt: string
  createdAt: string
}

export interface ProductForm {
  name: string
  category: string
  routeId: string
  shipId: string
  icon: string
  images: string[]
  description: string
  segments: Omit<ProductSegment, 'id'>[]
}

// ========== 通用API类型 ==========
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface SearchParams {
  keyword?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
  [key: string]: unknown
}

// ========== 航次状态 ==========
export type VoyageStatus = 'ticketing' | 'suspended' | 'chartered' | 'deadhead' | 'pending' | 'transfer'

// ========== 审批步骤 ==========
export interface ApprovalStep {
  nodeName: string
  approver: string
  status: 'approved' | 'pending' | 'rejected'
  duration: string
  plan: string
  time: string
}

// ========== 航次 ==========
export interface Voyage {
  id: string
  voyageNo: string
  shipName: string
  routeName: string
  productName: string
  templateName: string
  templateId: string
  days: number
  startDate: string
  endDate: string
  status: VoyageStatus
  approvalStatus: string
  approvalTimeline: ApprovalStep[]
  direction: 'upstream' | 'downstream'
  totalCabins: number
  soldCabins: number
  availableCabins: number
  shipId: string
  routeId: string
  productId: string
  /** 航次独立行程（已从模板剥离），若为 undefined 表示尚未剥离、仍继承模板 */
  itinerary?: TemplateItinerary[]
  updatedBy: string
  updatedAt: string
  createdAt: string
}

// ========== 航次模板 ==========
export interface TemplateInventory {
  id: string
  cabinName: string
  totalBeds: number
  released: number
  status: 'open' | 'closed'
}

export interface TemplateItinerary {
  id: string
  portName: string
  day: number
  arrivalTime: string
  departureTime: string
  theme: string
  startTime: string
  endTime: string
  description: string
  agency: string
  attraction: string
}

export interface TemplateDeposit {
  id: string
  marketCategory: string
  deposit: number
}

export interface TemplateTip {
  id: string
  marketCategory: string
  tip: number
}

export interface VoyageTemplate {
  id: string
  code: string
  name: string
  productId: string
  productName: string
  shipName: string
  voyageEndTime: string
  voyageStartTime: string
  sailType: string
  sailDay: string
  sailTime: string
  totalDays: number
  inventory: TemplateInventory[]
  itinerary: TemplateItinerary[]
  deposits: TemplateDeposit[]
  tips: TemplateTip[]
  basePriceRef: number
  surchargeStrategy: string[]
  settlementRule: string
  earlyBirdDiscount: number
  presaleDays: number
  cutoffDays: number
  refundPolicy: string
  materialReq: string[]
  status: 'draft' | 'enabled' | 'disabled'
  updatedBy: string
  updatedAt: string
  createdAt: string
}

// ========== 票类管理 ==========
export type GuestType = 'adult' | 'baby' | 'child'
export type TicketOccupancyType = '不拼房' | '拼房' | '加床' | '不占座'
export type PriceAdjustType = 'amount' | 'percent'
export type AdjustDirection = 'increase' | 'decrease'

export interface Ticket {
  id: string
  ticketId: string
  name: string
  guestType: GuestType
  occupancyType: TicketOccupancyType
  personCount: number
  priceCoefficient: number
  shareRoomType: PriceAdjustType
  shareRoomDirection: AdjustDirection
  shareRoomValue: number
  extraBedType: PriceAdjustType
  extraBedDirection: AdjustDirection
  extraBedValue: number
  tipType: string
  tipValue: number
  status: Status
  updatedBy: string
  updatedAt: string
  createdAt: string
}

export interface TicketForm {
  ticketId: string
  name: string
  guestType: GuestType
  occupancyType: TicketOccupancyType
  personCount: number
  priceCoefficient: number
  shareRoomType: PriceAdjustType
  shareRoomDirection: AdjustDirection
  shareRoomValue: number
  extraBedType: PriceAdjustType
  extraBedDirection: AdjustDirection
  extraBedValue: number
  tipType: string
  tipValue: number
}

// ========== 数据看板 ==========
// ========== 游轮设施 ==========
export type FacilityCategory = 'dining' | 'entertainment' | 'leisure' | 'sports' | 'service'
export type FacilityBizStatus = 'open' | 'closed' | 'maintenance'
export type FacilityChargeType = 'free' | 'per_time' | 'per_hour'

export interface ShipFacility {
  id: string
  code: string
  name: string
  category: FacilityCategory
  maxCapacity: number
  bizStatus: FacilityBizStatus
  chargeType: FacilityChargeType
  chargeAmount: number
  mainImage: string
  images: string[]
  description: string
  status: Status
  updatedBy: string
  updatedAt: string
  createdAt: string
}

export interface FacilityForm {
  code: string
  name: string
  category: FacilityCategory
  maxCapacity: number
  bizStatus: FacilityBizStatus
  chargeType: FacilityChargeType
  chargeAmount: number
  mainImage: string
  images: string[]
  description: string
}

// ========== 房间管理 ==========
export type RoomStatus = 'available' | 'maintenance' | 'locked'
export type RoomPosition = 'bow' | 'mid' | 'stern'

export interface Room {
  id: string
  roomNo: string
  shipId: string
  shipName: string
  cabinTypeId: string
  cabinTypeName: string
  deckId: string
  deckName: string
  floorNum: number
  position: RoomPosition
  connected: boolean
  connectedRoomNo: string
  accessible: boolean
  obstructed: boolean
  obstructedNote: string
  status: RoomStatus
  maintenanceNote: string
  updatedBy: string
  updatedAt: string
  createdAt: string
}

export interface RoomForm {
  roomNo: string
  shipId: string
  cabinTypeId: string
  deckId: string
  position: RoomPosition
  connected: boolean
  connectedRoomNo: string
  accessible: boolean
  obstructed: boolean
  obstructedNote: string
  status: RoomStatus
  maintenanceNote: string
}

// ========== 航次库存 ==========
export interface VoyageInventory {
  id: string
  voyageId: string
  voyageNo: string
  shipName: string
  cabinTypeName: string
  physicalCapacity: number
  totalRooms: number
  sold: number
  locked: number
  maintenance: number
  emergencyStock: number
  status: Status
  updatedBy: string
  updatedAt: string
  createdAt: string
}

// ========== 航次价格 ==========
export interface VoyagePrice {
  id: string
  voyageId: string
  voyageNo: string
  cabinTypeName: string
  date: string
  basePrice: number
  adultPrice: number
  childPrice: number
  babyPrice: number
  priceDetails?: Partial<Record<'adultPrice' | 'childPrice' | 'babyPrice', {
    retailPrice: number
    contractPrice: number
    settlementPrice: number
    portPrice: number
  }>>
  segmentPriceDetails?: Record<string, Partial<Record<'adultPrice' | 'childPrice' | 'babyPrice', {
    retailPrice: number
    contractPrice: number
    settlementPrice: number
    portPrice: number
  }>>>
  updatedBy: string
  updatedAt: string
  createdAt: string
}

// ========== 产品库存设置 ==========
export interface ProductInventory {
  id: string
  productId: string
  segmentKey: string
  cabinTypeName: string
  physicalCapacity: number
  totalAvailable: number
  locked: number
  emergencyStock: number
  updatedBy: string
  updatedAt: string
  createdAt: string
}

export interface DashboardData {
  todaySales: number
  todayPurchase: number
  skuCount: number
  alertCount: number
  pendingPurchaseOrders: number
  pendingSalesOrders: number
  salesTrend: { date: string; amount: number }[]
  purchaseTrend: { date: string; amount: number }[]
  alertList: { name: string; stock: number; minStock: number }[]
}

// ========== 经销商管理 ==========
export type DealerChannelType = 'ota' | 'distribution' | 'group'
export type DealerLevel = 'strategic' | 'core' | 'normal'
export type DealerSettlementCycle = 'monthly' | 'quarterly' | 'voyage_end'
export type DealerPriceSystem = 'retail' | 'online' | 'contract' | 'regional'
export type DealerRefundPermission = 'none' | 'self' | 'with_subordinate'
export type DealerRebateDimension = 'sales' | 'orders' | 'product'
export type DealerRebateCycle = 'monthly' | 'quarterly' | 'yearly'
export type DealerStatus = 'cooperating' | 'terminated'
export type DealerSubjectType = 'travel_agency' | 'hotel' | 'homestay' | 'other'
export type DealerPurchasePermission = 'enabled' | 'disabled'
export type DealerSettlementMethod = 'unlimited' | 'credit_only' | 'prepaid_only'
export type DealerCertificationStatus = 'verified' | 'unverified'
export type DealerChangeType = 'add' | 'move_group' | 'settlement_change' | 'enable' | 'disable'
export type DealerChangeStatus = 'success' | 'failed'

export interface Dealer {
  id: string
  name: string
  code: string
  account: string
  groupId: string
  groupName: string
  subjectType: DealerSubjectType
  socialCreditCode: string
  channelTypes: DealerChannelType[]
  region: string
  level: DealerLevel
  contact: string
  phone: string
  email: string
  address: string
  qualificationFiles: string[]
  businessLicenseNo: string
  travelAgencyPermitNo: string
  certificationStatus: DealerCertificationStatus
  creditLimit: number
  guaranteeAmount: number
  settlementCycle: DealerSettlementCycle
  settlementMethod: DealerSettlementMethod
  priceSystems: DealerPriceSystem[]
  otaServiceRate: number | null
  refundPermission: DealerRefundPermission
  rebateDimensions: DealerRebateDimension[]
  rebateCycle: DealerRebateCycle
  authorizedProductIds: string[]
  purchasePermission: DealerPurchasePermission
  disabledReason: string
  disabledUntil: string
  cooperationStartedAt: string
  status: DealerStatus
  updatedBy: string
  updatedAt: string
  createdAt: string
}

export interface DealerForm {
  name: string
  code: string
  account: string
  groupId: string
  subjectType: DealerSubjectType
  socialCreditCode: string
  channelTypes: DealerChannelType[]
  region: string
  level: DealerLevel
  contact: string
  phone: string
  email: string
  address: string
  qualificationFiles: string[]
  businessLicenseNo: string
  travelAgencyPermitNo: string
  creditLimit: number
  guaranteeAmount: number
  settlementCycle: DealerSettlementCycle
  settlementMethod: DealerSettlementMethod
  priceSystems: DealerPriceSystem[]
  otaServiceRate: number | null
  refundPermission: DealerRefundPermission
  rebateDimensions: DealerRebateDimension[]
  rebateCycle: DealerRebateCycle
  authorizedProductIds: string[]
}

export interface DealerGroup {
  id: string
  name: string
  dealerCount: number
  sort: number
  remark: string
}

export interface DealerCooperationRule {
  id: string
  allowSelfApply: boolean
  serviceTerms: string
  agreementFileName: string
  merchantTypes: DealerSubjectType[]
  attachmentRequirement: string
  attachmentRequired: boolean
  updatedBy: string
  updatedAt: string
}

export interface DealerChangeLog {
  id: string
  operationType: DealerChangeType
  dealerName: string
  operationContent: string
  operator: string
  operationStatus: DealerChangeStatus
  operatedAt: string
}

// ========== 锁舱记录 ==========
export type CabinHoldStatus = 'effective' | 'released' | 'expired'

export interface CabinHold {
  id: string
  dealerId: string
  dealerName: string
  productId: string
  productName: string
  routeName: string
  voyageDate: string
  cabinType: string
  holdQuantity: number
  confirmedQuantity: number
  availableInventory: number
  unitPrice: number
  depositRatio: number
  depositAmount: number
  releaseDeadline: string
  releaseReason: string
  status: CabinHoldStatus
  updatedBy: string
  updatedAt: string
  createdAt: string
}

export interface CabinHoldForm {
  dealerId: string
  productId: string
  voyageDate: string
  cabinType: string
  holdQuantity: number
  depositRatio: number
  releaseDeadline: string
  releaseReason: string
}

// ========== 包船订单 ==========
export type CharterReservationType = 'study' | 'business' | 'wedding' | 'deck' | 'hall' | 'cabin'
export type CharterOrderStatus = 'pending_accept' | 'accepted' | 'signed' | 'in_progress' | 'completed' | 'cancelled'
export type CharterBillingType = 'hourly' | 'per_person' | 'fixed'
export type CharterSettlementType = 'cash' | 'monthly' | 'unified'
export type CollectionStatus = 'unpaid' | 'partial' | 'paid'
export type BalanceStatus = 'unsettled' | 'partial' | 'settled'

export interface CharterFeeItem {
  id: string
  item: string
  unitPrice: number
  quantity: number
  amount: number
  remark: string
}

export interface CharterCollectionRecord {
  id: string
  amount: number
  feeItem: string
  voucher: string
  collectedAt: string
  collectedBy: string
}

export interface CharterTraveler {
  id: string
  name: string
  certificateType: string
  certificateNo: string
}

export interface CharterOrder {
  id: string
  orderNo: string
  reservationType: CharterReservationType
  companyName: string
  contactName: string
  phone: string
  useDate: string
  passengerCount: number
  routeId: string
  routeName: string
  shipId: string
  shipName: string
  shipCapacity: number
  billingType: CharterBillingType
  specialRequirement: string
  feeItems: CharterFeeItem[]
  totalAmount: number
  depositAmount: number
  receivedDepositAmount: number
  depositDeadline: string
  settlementType: CharterSettlementType
  realNameRequired: boolean
  travelers: CharterTraveler[]
  berthOccupancy: 'free' | 'reserved' | 'confirmed' | 'conflict'
  depositStatus: CollectionStatus
  balanceStatus: BalanceStatus
  status: CharterOrderStatus
  internalRemark: string
  rejectReason: string
  collections: CharterCollectionRecord[]
  updatedBy: string
  updatedAt: string
  createdAt: string
}

export interface CharterOrderForm {
  reservationType: CharterReservationType
  companyName: string
  contactName: string
  phone: string
  useDate: string
  passengerCount: number
  routeId: string
  shipId: string
  billingType: CharterBillingType
  specialRequirement: string
  feeItems: CharterFeeItem[]
  depositAmount: number
  depositDeadline: string
  settlementType: CharterSettlementType
  realNameRequired: boolean
  travelers: CharterTraveler[]
}

// ========== 客诉工单 ==========
export type ComplaintType = 'complaint' | 'consult' | 'refund'
export type ComplaintPriority = 'high' | 'medium' | 'low'
export type ComplaintStatus = 'pending' | 'processing' | 'completed'

export interface ComplaintRecord {
  id: string
  opinion: string
  internalRemark: string
  status: ComplaintStatus
  operator: string
  operatedAt: string
}

export interface ComplaintTicket {
  id: string
  ticketNo: string
  type: ComplaintType
  orderNo: string
  customerName: string
  phone: string
  productName: string
  voyageDate: string
  orderAmount: number
  description: string
  attachments: string[]
  priority: ComplaintPriority
  assigneeId: string
  assigneeName: string
  status: ComplaintStatus
  records: ComplaintRecord[]
  updatedBy: string
  updatedAt: string
  createdAt: string
}

export interface ComplaintTicketForm {
  type: ComplaintType
  orderNo: string
  customerName: string
  phone: string
  description: string
  attachments: string[]
  priority: ComplaintPriority
  assigneeId: string
}

// ========== 客户档案 ==========
export type CustomerLevel = 'vip' | 'advanced' | 'normal' | 'potential'
export type CustomerSourceChannel = 'ota' | 'official' | 'offline' | 'onboard'

export interface CustomerOrderHistory {
  id: string
  orderNo: string
  productName: string
  routeName: string
  voyageDate: string
  amount: number
  status: string
}

export interface CustomerRelatedTicket {
  id: string
  ticketNo: string
  type: ComplaintType
  status: ComplaintStatus
  createdAt: string
}

export interface CustomerProfile {
  id: string
  name: string
  phone: string
  idCard: string
  gender: string
  birthday: string
  nationality: string
  origin: string
  sourceChannel: CustomerSourceChannel
  totalAmount: number
  voyageCount: number
  favoriteRoute: string
  favoriteCabin: string
  lastVoyageDate: string
  tags: string[]
  level: CustomerLevel
  remark: string
  orderHistory: CustomerOrderHistory[]
  relatedTickets: CustomerRelatedTicket[]
  status: 'enabled'
  updatedBy: string
  updatedAt: string
  createdAt: string
}

export interface CustomerProfileForm {
  tags: string[]
  level: CustomerLevel
  remark: string
}

// ========== 营销活动 ==========
export type CampaignType = 'full_reduction' | 'discount' | 'free_ticket' | 'rebate' | 'early_bird' | 'off_season'
export type CampaignStatus = 'not_started' | 'ongoing' | 'ended'
export type CampaignDiscountMode = 'amount' | 'percentage' | 'free_count'
export type CampaignStackingRule = 'no_stack' | 'member_only' | 'all_stack'

export interface MarketingCampaign {
  id: string
  name: string
  type: CampaignType
  startDate: string
  endDate: string
  productIds: string[]
  productNames: string[]
  customerScopes: string[]
  channelIds: string[]
  channelNames: string[]
  discountMode: CampaignDiscountMode
  discountValue: number
  orderCap: number | null
  stackingRule: CampaignStackingRule
  coveredOrders: number
  participantCount: number
  discountTotal: number
  drivenRevenue: number
  roi: number
  status: CampaignStatus
  updatedBy: string
  updatedAt: string
  createdAt: string
}

export interface MarketingCampaignForm {
  name: string
  type: CampaignType
  startDate: string
  endDate: string
  productIds: string[]
  customerScopes: string[]
  channelIds: string[]
  discountMode: CampaignDiscountMode
  discountValue: number
  orderCap: number | null
  stackingRule: CampaignStackingRule
}

// ========== 对账批次 ==========
export type ReconciliationChannelType = 'ota' | 'distribution'
export type ReconciliationStatus = 'pending_check' | 'reconciled' | 'diff_pending' | 'diff_resolved'
export type ReconciliationDiffType = 'amount' | 'time' | 'missing_order' | 'missing_bank'

export interface ReconciliationDifference {
  id: string
  orderNo: string
  tradeTime: string
  channelAmount: number
  bankAmount: number
  diffAmount: number
  diffType: ReconciliationDiffType
  remark: string
  handled: boolean
}

export interface ReconciliationBatch {
  id: string
  batchNo: string
  dealerId: string
  dealerName: string
  channelType: ReconciliationChannelType
  reconcileDate: string
  bankFileName: string
  totalCount: number
  matchedCount: number
  diffCount: number
  matchRate: number
  handler: string
  status: ReconciliationStatus
  differences: ReconciliationDifference[]
  updatedBy: string
  updatedAt: string
  createdAt: string
}

export interface ReconciliationBatchForm {
  dealerId: string
  reconcileDate: string
  bankFileName: string
}

// ========== 数据报表 ==========
export type ReportCategory = 'operations' | 'distribution' | 'finance' | 'sales'
export type ReportPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year'

export interface DataReportEntry {
  id: string
  category: ReportCategory
  reportName: string
  period: ReportPeriod
  dateLabel: string
  routeName: string
  productName: string
  dealerName: string
  voyageNo: string
  metricA: number
  metricB: number
  metricC: number
  metricD: number
  status: 'published'
  updatedBy: string
  updatedAt: string
  createdAt: string
}

// ========== 审批流配置 ==========
export type ApprovalType = '产品与价格发布' | '退票审批' | '分销商授信审批' | '分销商退款审批' | '分销商合作审批' | '分销商价格政策' | '分销商退改政策' | 'OTA价格调整' | string

export interface ApprovalLevel {
  levelNo: number
  nodeName: string
  approvers: string[]
}

export interface ApprovalFlow {
  id: string
  businessType: ApprovalType
  status: 'enabled' | 'disabled'
  levels: ApprovalLevel[]
  updatedBy: string
  updatedAt: string
  createdAt: string
}

export interface ApprovalFlowForm {
  businessType: ApprovalType | ''
  status: 'enabled' | 'disabled'
  levels: ApprovalLevel[]
}
