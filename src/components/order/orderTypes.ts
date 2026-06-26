export type OrderStatus = '取消' | '船款确认' | '已预订' | '已完成'

export interface OrderTraveler {
  id: string
  isCompanion: boolean
  name: string
  idType: string
  idNumber: string
  phone: string
  transferRequired: string
  roomSeq?: number
  roomType?: string
  slotIndex?: number
  ageGroup?: string
  occupancyType?: string
}

export interface OrderTransaction {
  serialNo: string
  channel: string
  type: string
  amount: number
  time: string
  status: string
  receipt: string
  arrivalTime: string
  /** 关联补款单号，有值时表示来自补款单确认 */
  paymentNo?: string
}

export type SupplementaryPaymentType = '定金' | '船款' | '尾款' | '改价补差' | '罚金' | '其他'
export type SupplementaryPaymentStatus = '待支付' | '处理中' | '已到账' | '已驳回' | '已撤销'
export type SupplementaryPaymentChannel = '银行转账' | '线下现金' | '预存余额' | '授信额度' | '通联在线'

export interface SupplementaryPaymentOrder {
  id: string
  paymentNo: string
  orderId: string
  orderNo: string
  dealer: string
  groupName: string
  paymentType: SupplementaryPaymentType
  amount: number
  channel: SupplementaryPaymentChannel
  status: SupplementaryPaymentStatus
  dueDate: string
  remark: string
  notifyDealer: boolean
  createdBy: string
  createdAt: string
  serialNo?: string
  receipt?: string
  arrivalTime?: string
  confirmedBy?: string
  confirmedAt?: string
}

export interface CreateSupplementaryPaymentForm {
  orderId: string
  paymentType: SupplementaryPaymentType
  amount: number
  channel: SupplementaryPaymentChannel
  dueDate: string
  remark: string
  notifyDealer: boolean
}

export interface OrderResource {
  resourceType: string
  resourceName: string
  resourceId: string
  resourceStatus: string
}

export interface CruiseOrder {
  id: string
  index: number
  history: string
  orderNo: string
  groupName: string
  voyageNo: string
  orderStatus: OrderStatus
  route: string
  ship: string
  sailDate: string
  marketCategory: string
  nationality: string
  totalPeople: number
  adult: number
  child: number
  infant: number
  companion: number
  unitPrice: number
  receivableTicket: number
  smallFee: number
  localFee: number
  combinedProduct: number
  totalAmount: number
  paidAmount: number
  arrears: number
  depositAmount: number
  ticketBalance: number
  dealer: string
  remark: string
  depositDate: string
  parentOrderNo: string
  thirdPartyOrderNo: string
  sailDeadline: string
  bookingTime: string
  lockValidUntil: string
  voucherApplyStatus: string
  voucherApprovalStatus: string
  shareCenterStatus: string
  pushTime: string
  invoiceRequired: string
  miniProgramChannel: string
  advanceAccount: string
  relatedOrderNo: string
  salesPerson: string
  voyageDays: number
  departurePort: string
  arrivalPort: string
  transitPort: string
  supplier: string
  policyName: string
  line: string
  voyageStatus: string
  salesType: string
  orderType: string
  amountType: string
  roomType: string
  ageGroup: string
  occupancyType: string
  priceCoefficient: number
  contactName: string
  contactPhone: string
  fixedPhone: string
  fax: string
  email: string
  leaveMessage: string
  sailTime?: string
  arrivalDate?: string
  freeOf16Count?: number
  depositUnitPrice?: number
  depositDeadline?: string
  tipUnitPrice?: number
  businessStatus?: string
  orderChannel?: string
  productId?: string
  bookerId?: string
  bookerIdType?: string
  bookerIdNumber?: string
  roomLines?: OrderRoomLine[]
  /** 一单多团时的团列表；未传时由房间行或 groupName 推导 */
  teams?: OrderTeam[]
  /** 改价后的收费明细；未设置时由各金额字段推导 */
  feeItems?: OrderFeeItem[]
}

/** 订单收费项目（改价 / 费用明细） */
export interface OrderFeeItem {
  id: string
  name: string
  coefficient: string
  unitPrice: number
  amount: number
  /** 内置项不可删除，仅可改金额 */
  locked?: boolean
}

export const ADDABLE_FEE_PRESETS = [
  '升舱费',
  '陪同款',
  '服务费',
  '岸上观光',
  '酒水套餐',
  '罚金',
  '其他',
] as const

export interface OrderTeam {
  id: string
  name: string
  remark?: string
  roomCount: number
  guestCount: number
}

/** 房间内单个入住人（按第几人、入住类型计价） */
export interface OrderRoomGuest {
  id: string
  slotIndex: number
  name: string
  ageGroup: string
  occupancyType: string
  gender: string
  idType: string
  idNumber: string
  phone: string
  settlementPrice: number
  priceCoefficient: number
  isCompanion: boolean
  transferRequired: string
}

export type RoomAssignmentStatus = '待排房' | '已排房'
export type RoomInventoryStatus = 'normal' | 'oversold_pending' | 'auto_upgraded' | 'swapped'

/** 旅行社 ToB 订单：一行 = 一间房（房型 + 房间序号 + 多名入住人） */
export interface OrderRoomLine {
  id: string
  roomSeq: number
  /** 展示用主房型，默认等同 soldRoomType */
  roomType: string
  occupancyMode: string
  remark?: string
  teamId?: string
  teamName?: string
  teamRemark?: string
  guests: OrderRoomGuest[]
  /** 下单楼层/房型（结算依据） */
  soldFloor?: string
  soldRoomType?: string
  soldPrice?: number
  /** 占用楼层/房型（库存调配结果） */
  allocatedFloor?: string
  allocatedRoomType?: string
  inventoryStatus?: RoomInventoryStatus
  upgradeFee?: number
  /** 排房结果 */
  assignedRoomNo?: string
  assignedFloor?: string
  assignedRoomType?: string
  roomAssignmentStatus?: RoomAssignmentStatus
}

export interface RoomFulfillmentView {
  soldFloor: string
  soldRoomType: string
  soldPrice: number
  allocatedFloor: string
  allocatedRoomType: string
  assignedRoomNo?: string
  assignedFloor?: string
  assignedRoomType?: string
  inventoryStatus: RoomInventoryStatus
  upgradeFee: number
  roomAssignmentStatus: RoomAssignmentStatus
  allocationDiffers: boolean
}

export function getRoomFulfillment(line: OrderRoomLine, fallbackPrice = 0): RoomFulfillmentView {
  const soldRoomType = line.soldRoomType ?? line.roomType
  const soldFloor = line.soldFloor ?? '-'
  const allocatedRoomType = line.allocatedRoomType ?? soldRoomType
  const allocatedFloor = line.allocatedFloor ?? soldFloor
  return {
    soldFloor,
    soldRoomType,
    soldPrice: line.soldPrice ?? fallbackPrice,
    allocatedFloor,
    allocatedRoomType,
    assignedRoomNo: line.assignedRoomNo,
    assignedFloor: line.assignedFloor,
    assignedRoomType: line.assignedRoomType,
    inventoryStatus: line.inventoryStatus ?? 'normal',
    upgradeFee: line.upgradeFee ?? 0,
    roomAssignmentStatus: line.roomAssignmentStatus ?? '待排房',
    allocationDiffers: soldFloor !== allocatedFloor || soldRoomType !== allocatedRoomType,
  }
}

function withDefaultFulfillment(
  line: OrderRoomLine,
  soldFloor = '2F',
  unitPrice = 0,
): OrderRoomLine {
  const soldRoomType = line.soldRoomType ?? line.roomType
  return {
    ...line,
    soldRoomType,
    soldFloor: line.soldFloor ?? soldFloor,
    soldPrice: line.soldPrice ?? unitPrice,
    allocatedRoomType: line.allocatedRoomType ?? soldRoomType,
    allocatedFloor: line.allocatedFloor ?? line.soldFloor ?? soldFloor,
    inventoryStatus: line.inventoryStatus ?? 'normal',
    upgradeFee: line.upgradeFee ?? 0,
    roomAssignmentStatus: line.roomAssignmentStatus ?? '待排房',
  }
}

function mockGuest(
  order: CruiseOrder,
  lineId: string,
  slotIndex: number,
  ageGroup: string,
  occupancyType: string,
  price: number,
  coefficient: number,
  name?: string,
): OrderRoomGuest {
  return {
    id: `${lineId}-g${slotIndex}`,
    slotIndex,
    name: name || (slotIndex === 1 ? order.contactName : `游客${slotIndex}`),
    ageGroup,
    occupancyType,
    gender: slotIndex % 2 === 1 ? '男' : '女',
    idType: order.bookerIdType || '身份证',
    idNumber: slotIndex === 1 ? order.bookerIdNumber || '-' : '-',
    phone: slotIndex === 1 ? order.contactPhone : '-',
    settlementPrice: price,
    priceCoefficient: coefficient,
    isCompanion: false,
    transferRequired: '否',
  }
}

function buildStandardRoomLine(order: CruiseOrder, roomSeq: number, guestCount: number, remark = ''): OrderRoomLine {
  const lineId = `${order.id}-r${roomSeq}`
  const perGuest = Math.round(order.unitPrice / Math.max(guestCount, 1))
  const guests = Array.from({ length: guestCount }, (_, i) =>
    mockGuest(order, lineId, i + 1, order.ageGroup, order.occupancyType, perGuest, order.priceCoefficient),
  )
  return withDefaultFulfillment({
    id: lineId,
    roomSeq,
    roomType: '标准间',
    occupancyMode: '正常入住',
    remark,
    guests,
  }, '2F', perGuest)
}

function buildWholeRoomLine(
  order: CruiseOrder,
  roomSeq: number,
  roomType: string,
  occupancyMode: string,
  guestCount: number,
  unitPrice: number,
  remark = '',
  teamId?: string,
  teamName?: string,
): OrderRoomLine {
  const lineId = `${order.id}-r${roomSeq}`
  const guests = Array.from({ length: guestCount }, (_, i) =>
    mockGuest(order, lineId, i + 1, '成人', occupancyMode === '单间' ? '单间' : '正常', unitPrice, 1),
  )
  return withDefaultFulfillment({
    id: lineId,
    roomSeq,
    roomType,
    occupancyMode,
    remark,
    teamId,
    teamName,
    guests,
  }, roomType === '行政房' ? '5F' : '2F', unitPrice)
}

function assignTeamsToRoomLines(order: CruiseOrder, lines: OrderRoomLine[]): OrderRoomLine[] {
  if (order.teams?.length) {
    const assigned: OrderRoomLine[] = []
    let lineIndex = 0
    for (const team of order.teams) {
      for (let i = 0; i < team.roomCount && lineIndex < lines.length; i += 1) {
        assigned.push({
          ...lines[lineIndex],
          teamId: team.id,
          teamName: team.name,
          teamRemark: team.remark,
        })
        lineIndex += 1
      }
    }
    while (lineIndex < lines.length) {
      const fallbackTeam = order.teams[order.teams.length - 1]
      assigned.push({
        ...lines[lineIndex],
        teamId: fallbackTeam.id,
        teamName: fallbackTeam.name,
        teamRemark: fallbackTeam.remark,
      })
      lineIndex += 1
    }
    return assigned
  }

  const defaultTeamName = order.groupName || '默认团'
  return lines.map((line) => ({
    ...line,
    teamId: line.teamId || 'default',
    teamName: line.teamName || defaultTeamName,
    teamRemark: line.teamRemark || order.remark || '',
  }))
}

export function buildOrderRoomLines(order: CruiseOrder): OrderRoomLine[] {
  if (order.roomLines?.length) {
    return assignTeamsToRoomLines(
      order,
      order.roomLines.map((line) => withDefaultFulfillment(line, line.soldFloor ?? '2F', line.soldPrice ?? order.unitPrice)),
    )
  }

  let lines: OrderRoomLine[]

  if (order.totalPeople === 10 && order.salesType === '团队') {
    lines = [
      ...Array.from({ length: 4 }, (_, i) => buildStandardRoomLine(order, i + 1, 2)),
      buildWholeRoomLine(order, 5, '家庭房', '正常入住', 2, order.unitPrice * 1.2, '需安排相邻房间'),
    ]
  } else if (order.totalPeople >= 16) {
    lines = []
    let seq = 1
    for (let i = 0; i < 6; i++) {
      lines.push(buildStandardRoomLine(order, seq++, 2))
    }
    lines.push(buildWholeRoomLine(order, seq, order.roomType || '行政房', '单间', 2, order.unitPrice, '靠窗床位'))
    lines.push(buildWholeRoomLine(order, seq + 1, order.roomType || '行政房', '单间', 2, order.unitPrice))
  } else {
    const guestCount = Math.max(order.totalPeople, 1)
    if (order.roomType === '标准间' && guestCount <= 2) {
      lines = [buildStandardRoomLine(order, 1, guestCount, order.remark ? '客户特殊要求见订单备注' : '')]
    } else {
      lines = [buildWholeRoomLine(order, 1, order.roomType, order.occupancyType === '正常' ? '正常入住' : order.occupancyType, guestCount, order.unitPrice)]
    }
  }

  return assignTeamsToRoomLines(order, lines)
}

export function summarizeRoomLines(lines: OrderRoomLine[]) {
  const roomCount = lines.length
  const totalPeople = lines.reduce((sum, line) => sum + line.guests.length, 0)
  const subtotal = lines.reduce(
    (sum, line) => sum + line.guests.reduce((inner, guest) => inner + guest.settlementPrice, 0),
    0,
  )
  return { roomCount, totalPeople, subtotal }
}

export function buildOrderTeams(order: CruiseOrder): OrderTeam[] {
  if (order.teams?.length) return order.teams

  const roomLines = buildOrderRoomLines(order)
  const teamMap = new Map<string, OrderTeam>()

  roomLines.forEach((line) => {
    const teamId = line.teamId || 'default'
    const teamName = line.teamName || order.groupName || '默认团'
    const existing = teamMap.get(teamId)
    if (existing) {
      existing.roomCount += 1
      existing.guestCount += line.guests.length
      return
    }
    teamMap.set(teamId, {
      id: teamId,
      name: teamName,
      remark: line.teamRemark || '',
      roomCount: 1,
      guestCount: line.guests.length,
    })
  })

  if (teamMap.size > 0) return Array.from(teamMap.values())

  if (order.groupName) {
    const summary = summarizeRoomLines(roomLines)
    return [{
      id: 'default',
      name: order.groupName,
      remark: order.remark || '',
      roomCount: summary.roomCount,
      guestCount: summary.totalPeople,
    }]
  }

  return []
}

export function formatGroupNameSummary(teams: OrderTeam[]): string {
  if (teams.length === 0) return '-'
  if (teams.length === 1) return teams[0].name
  return `${teams[0].name} 等${teams.length}个团`
}

export function matchOrderGroupName(order: CruiseOrder, keyword: string): boolean {
  if (!keyword) return true
  const teams = buildOrderTeams(order)
  if (teams.some((team) => team.name.includes(keyword))) return true
  return order.groupName.includes(keyword)
}


export type OrderLogAction = '补单' | '支付' | '补差' | '补盖' | '编辑' | '其他'

export interface OrderLogSnapshot {
  totalPeople: number
  adult: number
  child: number
  infant: number
  companion: number
  receivableTicket: number
  smallFee: number
  localFee: number
  combinedProduct: number
  totalAmount: number
}

export interface OrderLogEntry {
  id: string
  orderId: string
  orderNo: string
  action: OrderLogAction
  operator: string
  operatedAt: string
  /** 操作内容摘要 */
  content: string
  snapshot: OrderLogSnapshot
  /** 关联订单历史版本，用于「订单快照-查看」 */
  versionId?: string
  remark?: string
}

export type OrderChangeType = '创建' | '改签' | '改价' | '改名单' | '分单' | '取消' | '恢复'

export interface OrderVersion {
  id: string
  versionNo: number
  snapshotAt: string
  changeType: OrderChangeType
  changeSummary: string
  operator: string
  isLatest?: boolean
  snapshot: CruiseOrder
}

export function buildOrderVersions(order: CruiseOrder): OrderVersion[] {
  const latest = enrichOrder(order)
  const [datePart, timePart = '00:00'] = order.bookingTime.split(' ')

  const addDays = (dateStr: string, days: number) => {
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return dateStr
    date.setDate(date.getDate() + days)
    return date.toISOString().slice(0, 10)
  }

  const v1Snapshot = enrichOrder({
    ...order,
    orderStatus: '已预订',
    remark: '',
    paidAmount: 0,
    arrears: order.totalAmount,
    depositAmount: 0,
    voucherApplyStatus: '未申请凭证',
    voucherApprovalStatus: '待审核',
    shareCenterStatus: '暂存',
  })

  const v2Snapshot = enrichOrder({
    ...v1Snapshot,
    remark: '客户申请改签，航次舱位已调整。',
    sailDate: addDays(order.sailDate, -2),
    lockValidUntil: addDays(datePart, 3),
    voucherApplyStatus: order.voucherApplyStatus === '未申请凭证' ? '未申请凭证' : '审批中',
  })

  const v3Snapshot = latest

  const versions: OrderVersion[] = [
    {
      id: `${order.id}-v1`,
      versionNo: 1,
      snapshotAt: order.bookingTime,
      changeType: '创建',
      changeSummary: `创建订单，预订航次 ${order.voyageNo}，${order.roomType} ${order.totalPeople} 人`,
      operator: order.advanceAccount || order.contactName,
      snapshot: v1Snapshot,
    },
    {
      id: `${order.id}-v2`,
      versionNo: 2,
      snapshotAt: `${addDays(datePart, 1)} ${timePart}`,
      changeType: '改签',
      changeSummary: `改签航次，开航日期调整为 ${v2Snapshot.sailDate}`,
      operator: order.salesPerson,
      snapshot: v2Snapshot,
    },
  ]

  if (order.orderStatus === '取消') {
    versions.push({
      id: `${order.id}-v3`,
      versionNo: 3,
      snapshotAt: `${addDays(datePart, 2)} ${timePart}`,
      changeType: '取消',
      changeSummary: '订单取消，舱位释放',
      operator: order.salesPerson,
      snapshot: v3Snapshot,
    })
  } else if (order.paidAmount > 0 || order.orderStatus === '船款确认') {
    versions.push({
      id: `${order.id}-v3`,
      versionNo: 3,
      snapshotAt: `${addDays(datePart, 2)} ${timePart}`,
      changeType: '改价',
      changeSummary: `船款确认，实收 ${order.paidAmount} 元`,
      operator: '财务',
      snapshot: v3Snapshot,
    })
  } else {
    versions.push({
      id: `${order.id}-v3`,
      versionNo: 3,
      snapshotAt: `${addDays(datePart, 2)} ${timePart}`,
      changeType: '改名单',
      changeSummary: '更新旅客名单与联系人信息',
      operator: order.advanceAccount || order.contactName,
      isLatest: true,
      snapshot: v3Snapshot,
    })
  }

  versions[versions.length - 1].isLatest = true
  return [...versions].reverse()
}

export function calcArrivalDate(sailDate: string, voyageDays: number) {
  const date = new Date(sailDate)
  if (Number.isNaN(date.getTime())) return '-'
  date.setDate(date.getDate() + Math.max(voyageDays - 1, 0))
  return date.toISOString().slice(0, 10)
}

export function buildOrderTransactions(
  order: CruiseOrder,
  supplementaryPayments: SupplementaryPaymentOrder[] = [],
): OrderTransaction[] {
  const confirmedPayments = supplementaryPayments.filter((item) => item.status === '已到账')

  if (confirmedPayments.length > 0) {
    const rows: OrderTransaction[] = confirmedPayments.map((payment) => ({
      serialNo: payment.serialNo || `TX-${payment.paymentNo}`,
      channel: payment.channel,
      type: payment.paymentType,
      amount: payment.amount,
      time: payment.confirmedAt || payment.createdAt,
      status: '已到账',
      receipt: payment.receipt || '-',
      arrivalTime: payment.arrivalTime || '-',
      paymentNo: payment.paymentNo,
    }))
    if (order.arrears > 0) {
      rows.push({
        serialNo: `TX-${order.orderNo}-pending`,
        channel: order.orderChannel || order.dealer || '线下汇款',
        type: '尾款',
        amount: order.arrears,
        time: '-',
        status: '待支付',
        receipt: '-',
        arrivalTime: '-',
      })
    }
    return rows
  }

  const rows: OrderTransaction[] = []
  if (order.depositAmount > 0 || order.depositDate) {
    rows.push({
      serialNo: `TX-${order.orderNo}-01`,
      channel: order.orderChannel || order.dealer || '线下汇款',
      type: '定金',
      amount: order.depositAmount,
      time: order.depositDate || order.bookingTime,
      status: order.depositAmount > 0 ? '已到账' : '待支付',
      receipt: order.depositAmount > 0 ? `RCPT-${order.orderNo}-01` : '-',
      arrivalTime: order.depositDate ? `${order.depositDate} 10:00:00` : '-',
    })
  }
  if (order.paidAmount > 0) {
    rows.push({
      serialNo: `TX-${order.orderNo}-02`,
      channel: order.orderChannel || '招商银行',
      type: '船款',
      amount: order.paidAmount,
      time: order.bookingTime,
      status: '已到账',
      receipt: `RCPT-${order.orderNo}-02`,
      arrivalTime: order.bookingTime,
    })
  }
  if (order.arrears > 0) {
    rows.push({
      serialNo: `TX-${order.orderNo}-03`,
      channel: order.orderChannel || order.dealer || '线下汇款',
      type: '尾款',
      amount: order.arrears,
      time: '-',
      status: '待支付',
      receipt: '-',
      arrivalTime: '-',
    })
  }

  if (rows.length === 0) {
    rows.push({
      serialNo: `TX-${order.orderNo}-00`,
      channel: order.orderChannel || '系统',
      type: '待发起',
      amount: 0,
      time: '-',
      status: '未交易',
      receipt: '-',
      arrivalTime: '-',
    })
  }
  return rows
}

export function suggestSupplementaryPaymentType(order: CruiseOrder): SupplementaryPaymentType {
  if (order.arrears <= 0) return '其他'
  if (order.paidAmount === 0 && order.depositAmount > 0) return '定金'
  if (order.paidAmount > 0 && order.paidAmount < order.totalAmount) return '尾款'
  return '船款'
}

export function buildOrderResources(order: CruiseOrder): OrderResource[] {
  const roomResources = buildOrderRoomLines(order).map((line) => ({
    resourceType: '舱房库存',
    resourceName: `房间${line.roomSeq} · ${line.roomType}（${line.occupancyMode}）`,
    resourceId: `${order.voyageNo}-${line.roomSeq}`,
    resourceStatus: `已占 ${line.guests.length} 人`,
  }))
  return [
    {
      resourceType: '航次舱位',
      resourceName: `${order.ship} / ${order.line}`,
      resourceId: order.voyageNo,
      resourceStatus: order.voyageStatus,
    },
    ...roomResources,
    {
      resourceType: '港口行程',
      resourceName: `${order.departurePort} → ${order.arrivalPort}`,
      resourceId: order.route,
      resourceStatus: order.transitPort ? `途经 ${order.transitPort}` : '直达',
    },
  ]
}

export function buildOrderTravelers(order: CruiseOrder): OrderTraveler[] {
  const lines = buildOrderRoomLines(order)
  if (lines.length > 0) {
    return lines.flatMap((line) =>
      line.guests.map((guest) => ({
        id: guest.id,
        isCompanion: guest.isCompanion,
        name: guest.name,
        idType: guest.idType,
        idNumber: guest.idNumber,
        phone: guest.phone,
        transferRequired: guest.transferRequired,
        roomSeq: line.roomSeq,
        roomType: line.roomType,
        slotIndex: guest.slotIndex,
        ageGroup: guest.ageGroup,
        occupancyType: guest.occupancyType,
      })),
    )
  }
  if (order.totalPeople <= 0) return []
  return [
    {
      id: order.bookerId || `USR-${order.orderNo}`,
      isCompanion: false,
      name: order.contactName,
      idType: order.bookerIdType || '身份证',
      idNumber: order.bookerIdNumber || '-',
      phone: order.contactPhone,
      transferRequired: '否',
    },
  ]
}

export function enrichOrder(order: CruiseOrder): CruiseOrder {
  return {
    ...order,
    sailTime: order.sailTime || `${order.sailDate} 21:00:00`,
    arrivalDate: order.arrivalDate || calcArrivalDate(order.sailDate, order.voyageDays),
    freeOf16Count: order.freeOf16Count ?? (order.totalPeople >= 16 ? 1 : 0),
    depositUnitPrice: order.depositUnitPrice ?? 0,
    depositDeadline: order.depositDeadline || order.depositDate || '-',
    tipUnitPrice: order.tipUnitPrice ?? (order.smallFee > 0 && order.totalPeople > 0 ? Math.round(order.smallFee / order.totalPeople) : 150),
    businessStatus: order.businessStatus || order.shareCenterStatus,
    orderChannel: order.orderChannel || order.miniProgramChannel || order.dealer || '组团社预订',
    productId: order.productId || `PRD-${order.voyageNo}`,
    bookerId: order.bookerId || `USR-${order.advanceAccount || order.contactName}`,
    bookerIdType: order.bookerIdType || '身份证',
    bookerIdNumber: order.bookerIdNumber || '-',
  }
}

export function buildOrderFeeItems(order: CruiseOrder): OrderFeeItem[] {
  if (order.feeItems?.length) {
    return order.feeItems.map((item) => ({ ...item }))
  }
  return [
    {
      id: 'fee-ticket',
      name: '应收船款',
      coefficient: '-',
      unitPrice: order.unitPrice,
      amount: order.receivableTicket,
      locked: true,
    },
    {
      id: 'fee-tip',
      name: '小费',
      coefficient: '-',
      unitPrice: order.tipUnitPrice ?? 0,
      amount: order.smallFee,
      locked: true,
    },
    {
      id: 'fee-local',
      name: '地接费',
      coefficient: '-',
      unitPrice: 0,
      amount: order.localFee,
      locked: true,
    },
    {
      id: 'fee-combo',
      name: '组合产品',
      coefficient: '-',
      unitPrice: 0,
      amount: order.combinedProduct,
      locked: true,
    },
  ]
}

export function calcFeeItemsTotal(feeItems: OrderFeeItem[]) {
  return feeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
}

export function syncOrderFromFeeItems(
  order: CruiseOrder,
  feeItems: OrderFeeItem[],
  extras: { unitPrice?: number; reason?: string } = {},
): Partial<CruiseOrder> {
  const amountByName = (names: string[]) => (
    feeItems.filter((item) => names.includes(item.name)).reduce((sum, item) => sum + item.amount, 0)
  )
  const totalAmount = calcFeeItemsTotal(feeItems)
  const paidAmount = order.paidAmount
  const patch: Partial<CruiseOrder> = {
    feeItems,
    receivableTicket: amountByName(['应收船款']),
    smallFee: amountByName(['小费']),
    localFee: amountByName(['地接费']),
    combinedProduct: amountByName(['组合产品']),
    totalAmount,
    arrears: Math.max(totalAmount - paidAmount, 0),
  }
  if (extras.unitPrice != null) {
    patch.unitPrice = extras.unitPrice
  }
  if (extras.reason) {
    patch.remark = order.remark
      ? `${order.remark}\n[改价] ${extras.reason}`
      : `[改价] ${extras.reason}`
  }
  return patch
}
