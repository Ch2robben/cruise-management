export type PeriodReservationStatus = 'pending' | 'reserved' | 'completed' | 'cancelled'
export type PeriodTicketStatus = 'unused' | 'partial' | 'used' | 'cancelled' | 'revoked' | 'changed'
export type PeriodRedeemMode = 'direct' | 'upgrade'

export interface PeriodRedeemInventory {
  date: string
  stock: number
  priceDiff: number
  voyageNo: string
}

export interface PeriodRedeemMinItem {
  id: string
  label: string
  roomType: string
  occupancyType: string
  adult: number
  child: number
  infant: number
  baseDiffPrice: number
  inventories: PeriodRedeemInventory[]
}

export interface PeriodRedeemProduct {
  productName: string
  routeName: string
  roomType: string
  occupancyType: string
  cruiseName: string
  validDesc: string
  minItems: PeriodRedeemMinItem[]
}

export interface PeriodOrderLog {
  time: string
  operator: string
  action: string
  remark: string
}

export interface PeriodTicketOrder {
  id: string
  periodOrderNo: string
  otaOrderNo: string
  amount: number
  productName: string
  ticketName: string
  reservedProduct: string
  reservationStatus: PeriodReservationStatus
  ticketStatus: PeriodTicketStatus
  salesChannel: string
  otaChannel: string
  pickupName: string
  pickupMobile: string
  passengerName: string
  contactMobile: string
  certificateType: string
  certificateNo: string
  orderTime: string
  validStart: string
  validEnd: string
  redeemCode: string
  voucherUrl: string
  supportRefund: boolean
  supportResendSms: boolean
  supportCopyLink: boolean
  redeemableProduct: PeriodRedeemProduct
  logs: PeriodOrderLog[]
}

interface RedeemPayload {
  orderId: string
  mode: PeriodRedeemMode
  travelDate: string
  minItemId: string
}

const inventoryA: PeriodRedeemInventory[] = [
  { date: '2026-07-12', stock: 8, priceDiff: 0, voyageNo: 'CR20260712-01' },
  { date: '2026-07-19', stock: 5, priceDiff: 0, voyageNo: 'CR20260719-01' },
  { date: '2026-07-26', stock: 2, priceDiff: 200, voyageNo: 'CR20260726-01' },
  { date: '2026-08-02', stock: 6, priceDiff: 0, voyageNo: 'CR20260802-01' },
]

const inventoryB: PeriodRedeemInventory[] = [
  { date: '2026-07-10', stock: 3, priceDiff: 600, voyageNo: 'CR20260710-02' },
  { date: '2026-07-17', stock: 4, priceDiff: 800, voyageNo: 'CR20260717-02' },
  { date: '2026-07-24', stock: 1, priceDiff: 1200, voyageNo: 'CR20260724-02' },
  { date: '2026-07-31', stock: 7, priceDiff: 500, voyageNo: 'CR20260731-02' },
]

const inventoryC: PeriodRedeemInventory[] = [
  { date: '2026-07-15', stock: 10, priceDiff: 0, voyageNo: 'CR20260715-03' },
  { date: '2026-07-22', stock: 4, priceDiff: 300, voyageNo: 'CR20260722-03' },
  { date: '2026-08-05', stock: 5, priceDiff: 0, voyageNo: 'CR20260805-03' },
]

let periodTicketOrdersStore: PeriodTicketOrder[] = [
  {
    id: 'pto-001',
    periodOrderNo: 'PT202607010001',
    otaOrderNo: '230426180508176',
    amount: 80,
    productName: '海上游金厦',
    ticketName: '期票豪华套票',
    reservedProduct: '海上游金厦 成人票-普通舱（和平码头→和平码头）',
    reservationStatus: 'pending',
    ticketStatus: 'unused',
    salesChannel: '屿见厦门',
    otaChannel: '美团',
    pickupName: '侯南',
    pickupMobile: '18559026242',
    passengerName: '侯南',
    contactMobile: '18312341234',
    certificateType: '身份证',
    certificateNo: '350203199109102314',
    orderTime: '2026-06-14 10:10:10',
    validStart: '2026-06-14 10:10:10',
    validEnd: '2026-12-31 23:59:59',
    redeemCode: 'DH-8A72-4XZ1',
    voucherUrl: 'http://url.amoyseatrip.com/#/?k=Tyln9ylqsRPB',
    supportRefund: true,
    supportResendSms: true,
    supportCopyLink: true,
    redeemableProduct: {
      productName: '长江叁号·重庆至宜昌 4天3晚',
      routeName: '重庆 → 宜昌',
      roomType: '阳台标准间',
      occupancyType: '支持 2大 / 2大1小 / 1大1小',
      cruiseName: '长江叁号',
      validDesc: '2026-07-01 至 2026-12-31 可兑换指定航次',
      minItems: [
        { id: 'mix-201', label: '2大', roomType: '阳台标准间', occupancyType: '2大', adult: 2, child: 0, infant: 0, baseDiffPrice: 0, inventories: inventoryA },
        { id: 'mix-211', label: '2大1小', roomType: '阳台标准间', occupancyType: '2大1小', adult: 2, child: 1, infant: 0, baseDiffPrice: 300, inventories: inventoryB },
        { id: 'mix-111', label: '1大1小', roomType: '阳台标准间', occupancyType: '1大1小', adult: 1, child: 1, infant: 0, baseDiffPrice: 0, inventories: inventoryC },
        { id: 'mix-301', label: '2大', roomType: '豪华套房', occupancyType: '2大', adult: 2, child: 0, infant: 0, baseDiffPrice: 1200, inventories: inventoryB },
        { id: 'mix-311', label: '2大1小', roomType: '豪华套房', occupancyType: '2大1小', adult: 2, child: 1, infant: 0, baseDiffPrice: 1600, inventories: inventoryC },
      ],
    },
    logs: [
      { time: '2026-06-14 10:10:10', operator: 'OTA同步', action: '创建订单', remark: '生成期票订单并下发兑换码。' },
      { time: '2026-06-14 10:12:10', operator: '系统', action: '发送短信', remark: '已向取票手机号发送兑换短信。' },
    ],
  },
  {
    id: 'pto-002',
    periodOrderNo: 'PT202607010002',
    otaOrderNo: '230426162922864',
    amount: 80,
    productName: '海上游金厦',
    ticketName: '期票商务套票',
    reservedProduct: '海上游金厦 成人票-普通舱（和平码头→和平码头）',
    reservationStatus: 'reserved',
    ticketStatus: 'partial',
    salesChannel: '屿见厦门',
    otaChannel: '携程',
    pickupName: '侯南',
    pickupMobile: '18559026242',
    passengerName: '侯南',
    contactMobile: '18312341234',
    certificateType: '身份证',
    certificateNo: '350203199109102314',
    orderTime: '2026-06-16 10:10:10',
    validStart: '2026-06-16 10:10:10',
    validEnd: '2026-12-31 23:59:59',
    redeemCode: 'DH-3P21-KQ90',
    voucherUrl: 'http://url.amoyseatrip.com/#/?k=3P21KQ90',
    supportRefund: true,
    supportResendSms: false,
    supportCopyLink: true,
    redeemableProduct: {
      productName: '长江贰号·宜昌至重庆 5天4晚',
      routeName: '宜昌 → 重庆',
      roomType: '豪华套房',
      occupancyType: '支持 2大 / 2大1小',
      cruiseName: '长江贰号',
      validDesc: '仅限暑期指定舱位兑换',
      minItems: [
        { id: 'mix-202', label: '2大', roomType: '豪华套房', occupancyType: '2大', adult: 2, child: 0, infant: 0, baseDiffPrice: 500, inventories: inventoryB },
        { id: 'mix-212', label: '2大1小', roomType: '豪华套房', occupancyType: '2大1小', adult: 2, child: 1, infant: 0, baseDiffPrice: 900, inventories: inventoryC },
        { id: 'mix-402', label: '2大', roomType: '总统套房', occupancyType: '2大', adult: 2, child: 0, infant: 0, baseDiffPrice: 2600, inventories: inventoryA },
        { id: 'mix-412', label: '2大1小', roomType: '总统套房', occupancyType: '2大1小', adult: 2, child: 1, infant: 0, baseDiffPrice: 3200, inventories: inventoryB },
      ],
    },
    logs: [
      { time: '2026-06-16 10:10:10', operator: 'OTA同步', action: '创建订单', remark: '生成期票订单并下发兑换码。' },
      { time: '2026-06-18 11:20:00', operator: '客服王芳', action: '兑换中', remark: '已预约 2026-07-10 航次，待游客补充实名信息。' },
    ],
  },
  {
    id: 'pto-003',
    periodOrderNo: 'PT202607010003',
    otaOrderNo: '230426162922865',
    amount: 80,
    productName: '海上游金厦',
    ticketName: '期票商务套票',
    reservedProduct: '海上游金厦 成人票-普通舱（和平码头→和平码头）',
    reservationStatus: 'completed',
    ticketStatus: 'used',
    salesChannel: '屿见厦门',
    otaChannel: '抖音',
    pickupName: '侯南',
    pickupMobile: '18559026242',
    passengerName: '侯南',
    contactMobile: '18312341234',
    certificateType: '护照',
    certificateNo: 'P80921112',
    orderTime: '2026-06-18 10:10:10',
    validStart: '2026-06-18 10:10:10',
    validEnd: '2026-12-31 23:59:59',
    redeemCode: 'DH-1S45-JM28',
    voucherUrl: 'http://url.amoyseatrip.com/#/?k=1S45JM28',
    supportRefund: false,
    supportResendSms: false,
    supportCopyLink: false,
    redeemableProduct: {
      productName: '长江探索号·重庆至奉节 2天1晚',
      routeName: '重庆 → 奉节',
      roomType: '阳台标准间',
      occupancyType: '支持 2大',
      cruiseName: '长江探索号',
      validDesc: '已完成兑换',
      minItems: [
        { id: 'mix-203', label: '2大', roomType: '阳台标准间', occupancyType: '2大', adult: 2, child: 0, infant: 0, baseDiffPrice: 0, inventories: inventoryA },
      ],
    },
    logs: [
      { time: '2026-06-18 10:10:10', operator: 'OTA同步', action: '创建订单', remark: '生成期票订单并下发兑换码。' },
      { time: '2026-06-20 09:30:00', operator: '客服李敏', action: '直接兑换', remark: '已生成游轮订单 CR202606200001。' },
    ],
  },
  {
    id: 'pto-004',
    periodOrderNo: 'PT202607010004',
    otaOrderNo: '230426162922866',
    amount: 80,
    productName: '期票产品名称',
    ticketName: '期票票名称',
    reservedProduct: '海上游金厦 成人票-普通舱（和平码头→和平码头）',
    reservationStatus: 'cancelled',
    ticketStatus: 'cancelled',
    salesChannel: '屿见厦门',
    otaChannel: '美团',
    pickupName: '惠娟',
    pickupMobile: '18559026242',
    passengerName: '惠娟',
    contactMobile: '18312349999',
    certificateType: '身份证',
    certificateNo: '350203198805202318',
    orderTime: '2026-06-21 10:10:10',
    validStart: '2026-06-21 10:10:10',
    validEnd: '2026-12-31 23:59:59',
    redeemCode: 'DH-0D22-HJ11',
    voucherUrl: 'http://url.amoyseatrip.com/#/?k=0D22HJ11',
    supportRefund: false,
    supportResendSms: false,
    supportCopyLink: false,
    redeemableProduct: {
      productName: '长江叁号·重庆至宜昌 4天3晚',
      routeName: '重庆 → 宜昌',
      roomType: '阳台标准间',
      occupancyType: '支持 2大',
      cruiseName: '长江叁号',
      validDesc: '订单已取消，不可兑换',
      minItems: [
        { id: 'mix-204', label: '2大', roomType: '阳台标准间', occupancyType: '2大', adult: 2, child: 0, infant: 0, baseDiffPrice: 0, inventories: inventoryA },
      ],
    },
    logs: [{ time: '2026-06-21 12:00:00', operator: '客服陈晨', action: '取消订单', remark: 'OTA发起取消。' }],
  },
  {
    id: 'pto-005',
    periodOrderNo: 'PT202607010005',
    otaOrderNo: '230426162922867',
    amount: 80,
    productName: '期票产品名称',
    ticketName: '期票票名称',
    reservedProduct: '海上游金厦 成人票-普通舱（和平码头→和平码头）',
    reservationStatus: 'cancelled',
    ticketStatus: 'revoked',
    salesChannel: '屿见厦门',
    otaChannel: '飞猪',
    pickupName: '侯南',
    pickupMobile: '18559026242',
    passengerName: '侯南',
    contactMobile: '18312342222',
    certificateType: '身份证',
    certificateNo: '350203199109102314',
    orderTime: '2026-06-22 10:10:10',
    validStart: '2026-06-22 10:10:10',
    validEnd: '2026-12-31 23:59:59',
    redeemCode: 'DH-8V99-TR12',
    voucherUrl: 'http://url.amoyseatrip.com/#/?k=8V99TR12',
    supportRefund: false,
    supportResendSms: false,
    supportCopyLink: false,
    redeemableProduct: {
      productName: '长江贰号·宜昌至重庆 5天4晚',
      routeName: '宜昌 → 重庆',
      roomType: '豪华套房',
      occupancyType: '支持 2大',
      cruiseName: '长江贰号',
      validDesc: '订单已撤销',
      minItems: [
        { id: 'mix-205', label: '2大', roomType: '豪华套房', occupancyType: '2大', adult: 2, child: 0, infant: 0, baseDiffPrice: 0, inventories: inventoryB },
      ],
    },
    logs: [{ time: '2026-06-23 09:00:00', operator: '财务系统', action: '撤销', remark: '退款原路退回，期票失效。' }],
  },
  {
    id: 'pto-006',
    periodOrderNo: 'PT202607010006',
    otaOrderNo: '230426162922868',
    amount: 80,
    productName: '期票产品名称',
    ticketName: '期票票名称',
    reservedProduct: '海上游金厦 成人票-普通舱（和平码头→和平码头）',
    reservationStatus: 'cancelled',
    ticketStatus: 'changed',
    salesChannel: '屿见厦门',
    otaChannel: '同程',
    pickupName: '侯南',
    pickupMobile: '18559026242',
    passengerName: '侯南',
    contactMobile: '18312345555',
    certificateType: '身份证',
    certificateNo: '350203199109102314',
    orderTime: '2026-06-23 10:10:10',
    validStart: '2026-06-23 10:10:10',
    validEnd: '2026-12-31 23:59:59',
    redeemCode: 'DH-4N21-BQ78',
    voucherUrl: 'http://url.amoyseatrip.com/#/?k=4N21BQ78',
    supportRefund: false,
    supportResendSms: false,
    supportCopyLink: false,
    redeemableProduct: {
      productName: '长江探索号·重庆至奉节 2天1晚',
      routeName: '重庆 → 奉节',
      roomType: '阳台标准间',
      occupancyType: '支持 2大',
      cruiseName: '长江探索号',
      validDesc: '订单已撤改',
      minItems: [
        { id: 'mix-206', label: '2大', roomType: '阳台标准间', occupancyType: '2大', adult: 2, child: 0, infant: 0, baseDiffPrice: 0, inventories: inventoryC },
      ],
    },
    logs: [{ time: '2026-06-24 15:20:00', operator: '客服王芳', action: '撤改', remark: '原期票变更为新兑换码订单。' }],
  },
]

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export const reservationStatusLabelMap: Record<PeriodReservationStatus, string> = {
  pending: '待预约',
  reserved: '已预约',
  completed: '已完成',
  cancelled: '已取消',
}

export const ticketStatusLabelMap: Record<PeriodTicketStatus, string> = {
  unused: '未使用',
  partial: '部分使用',
  used: '已使用',
  cancelled: '已取消',
  revoked: '撤销',
  changed: '撤改',
}

export function listPeriodTicketOrders() {
  return clone(periodTicketOrdersStore)
}

export function getPeriodTicketOrder(id: string) {
  const record = periodTicketOrdersStore.find((item) => item.id === id)
  return record ? clone(record) : undefined
}

export function getRedeemableOrderByCode(code: string) {
  const normalized = code.trim().toUpperCase()
  const record = periodTicketOrdersStore.find((item) => item.redeemCode.toUpperCase() === normalized)
  return record ? clone(record) : undefined
}

export function performPeriodTicketRedeem(payload: RedeemPayload) {
  const order = periodTicketOrdersStore.find((item) => item.id === payload.orderId)
  if (!order) return null

  const minItem = order.redeemableProduct.minItems.find((item) => item.id === payload.minItemId)
  const inventory = minItem?.inventories.find((item) => item.date === payload.travelDate)
  if (!minItem || !inventory) return null

  const cruiseOrderNo = `CR${Date.now()}`
  const diffAmount = payload.mode === 'upgrade' ? minItem.baseDiffPrice + inventory.priceDiff : 0

  order.logs.unshift({
    time: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    operator: '当前客服',
    action: payload.mode === 'direct' ? '直接兑换' : '升单兑换',
    remark:
      payload.mode === 'direct'
        ? `已兑换 ${payload.travelDate} ${order.redeemableProduct.productName}，生成游轮订单 ${cruiseOrderNo}。`
        : `已发起升单兑换，航期 ${payload.travelDate}，待补差价 ${diffAmount} 元，游轮订单号 ${cruiseOrderNo}。`,
  })

  order.reservationStatus = payload.mode === 'direct' ? 'completed' : 'reserved'
  order.ticketStatus = payload.mode === 'direct' ? 'used' : 'partial'

  return {
    cruiseOrderNo,
    diffAmount,
    payLink: `https://pay.example.com/period-ticket/${order.periodOrderNo}?order=${cruiseOrderNo}&amount=${diffAmount}`,
    selectedDate: payload.travelDate,
    minItem,
    inventory,
  }
}
