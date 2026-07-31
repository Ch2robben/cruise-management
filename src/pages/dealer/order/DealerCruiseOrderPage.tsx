import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronLeft, RotateCcw, Search } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import DealerOrderRescheduleDialog, {
  type DealerRescheduleSubmitValue,
} from '@/components/dealer/DealerOrderRescheduleDialog'
import InitiateRefundDialog from '@/components/order/InitiateRefundDialog'
import type { CreateRefundOrderForm } from '@/components/order/refundOrderTypes'
import { createRefundOrder, getRefundOrdersByOrderId } from '@/mock/refundOrderStore'
import { formatCurrency } from '@/utils/format'

type OrderStatus = '取消' | '船款确认' | '已预订' | '已完成'
type RefundStatus = '无退款' | '退款处理中' | '已退款' | '退款被拒'
export type CruiseOrderDimension = 'order' | 'group' | 'room' | 'tourist'

interface CruiseOrder {
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
  realNameCount: number
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
  refundStatus?: RefundStatus
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
}

interface CruiseTourist {
  id: string
  name: string
  sex: '男' | '女'
  ageGroup: '成人' | '儿童' | '婴儿'
  nationality: string
  idType: '身份证' | '护照'
  idNo: string
  phone: string
  occupancyType: string
  price: number
  realNamed: boolean
}

interface CruiseRoom {
  id: string
  roomNo: string
  roomType: string
  occupancyType: string
  tourists: CruiseTourist[]
}

interface CruiseGroup {
  id: string
  groupName: string
  contactName: string
  contactPhone: string
  rooms: CruiseRoom[]
}

interface DimensionRow {
  id: string
  order: CruiseOrder
  group?: CruiseGroup
  room?: CruiseRoom
  tourist?: CruiseTourist
}

interface FilterField {
  key: string
  label: string
  type: 'input' | 'select' | 'date'
  placeholder?: string
  options?: string[]
}

interface DimensionColumn {
  key: string
  title: string
  width: string
  numeric?: boolean
  render: (row: DimensionRow) => ReactNode
}

const statusColor: Record<OrderStatus, string> = {
  取消: 'bg-red-100 text-red-700',
  船款确认: 'bg-blue-100 text-blue-700',
  已预订: 'bg-green-100 text-green-700',
  已完成: 'bg-gray-100 text-gray-600',
}

const refundStatusColor: Record<RefundStatus, string> = {
  无退款: 'bg-gray-100 text-gray-600',
  退款处理中: 'bg-amber-100 text-amber-700',
  已退款: 'bg-green-100 text-green-700',
  退款被拒: 'bg-red-100 text-red-700',
}

const getDealerRefundOrderId = (orderId: string) => `dealer:${orderId}`

function getLatestRefundStatus(order: CruiseOrder): RefundStatus {
  const latestRefund = getRefundOrdersByOrderId(getDealerRefundOrderId(order.id))[0]
  if (!latestRefund) return order.refundStatus || '无退款'
  if (latestRefund.status === '已完成') return '已退款'
  if (latestRefund.status === '已拒绝') return '退款被拒'
  return '退款处理中'
}

const orders: CruiseOrder[] = [
  {
    id: '1',
    index: 1,
    history: '历史',
    orderNo: '0000000H',
    groupName: 'ycwd20211007x',
    voyageNo: '212101',
    orderStatus: '船款确认',
    route: '渝宜',
    ship: '长江壹号',
    sailDate: '2021-09-30',
    marketCategory: '内宾-巫山县',
    nationality: '中国',
    totalPeople: 1,
    realNameCount: 0,
    adult: 1,
    child: 0,
    infant: 0,
    companion: 0,
    unitPrice: 2300,
    receivableTicket: 2300,
    smallFee: 0,
    localFee: 0,
    combinedProduct: 0,
    totalAmount: 2300,
    paidAmount: 2300,
    arrears: 0,
    depositAmount: 0,
    ticketBalance: 0,
    dealer: '宜昌趸多',
    remark: '',
    depositDate: '',
    parentOrderNo: 'S0000000H',
    thirdPartyOrderNo: '',
    sailDeadline: '2021-09-27',
    bookingTime: '2021-10-08 17:41',
    lockValidUntil: '',
    voucherApplyStatus: '未申请凭证',
    voucherApprovalStatus: '待审核',
    shareCenterStatus: '暂存',
    pushTime: '',
    refundStatus: '无退款',
    invoiceRequired: '否',
    miniProgramChannel: '',
    advanceAccount: '邓浪',
    relatedOrderNo: '',
    salesPerson: '彭辉',
    voyageDays: 4,
    departurePort: '重庆',
    arrivalPort: '宜昌',
    transitPort: '丰都-巫山',
    supplier: '重庆长江轮船有限公司',
    policyName: '内宾共享',
    line: '渝宜',
    voyageStatus: '开放',
    salesType: '散客',
    orderType: '普通订单',
    amountType: '船票款',
    roomType: '标准间',
    ageGroup: '成人',
    occupancyType: '正常',
    priceCoefficient: 1,
    contactName: '邓浪',
    contactPhone: '13871222817',
    fixedPhone: '',
    fax: '',
    email: '',
    leaveMessage: '是',
  },
  {
    id: '2',
    index: 2,
    history: '历史',
    orderNo: '0000000C',
    groupName: '补单2人',
    voyageNo: '211901',
    orderStatus: '取消',
    route: '渝宜',
    ship: '长江叁号',
    sailDate: '2021-10-02',
    marketCategory: '内宾-奉节县',
    nationality: '中国',
    totalPeople: 2,
    realNameCount: 1,
    adult: 2,
    child: 0,
    infant: 0,
    companion: 0,
    unitPrice: 2300,
    receivableTicket: 4600,
    smallFee: 0,
    localFee: 0,
    combinedProduct: 0,
    totalAmount: 4600,
    paidAmount: 0,
    arrears: 4600,
    depositAmount: 0,
    ticketBalance: 0,
    dealer: '宜昌趸多',
    remark: '',
    depositDate: '',
    parentOrderNo: 'S0000000C',
    thirdPartyOrderNo: '',
    sailDeadline: '2021-09-29',
    bookingTime: '2021-10-08 16:01',
    lockValidUntil: '',
    voucherApplyStatus: '未申请凭证',
    voucherApprovalStatus: '待审核',
    shareCenterStatus: '暂存',
    pushTime: '',
    invoiceRequired: '否',
    miniProgramChannel: '',
    advanceAccount: '彭彬',
    relatedOrderNo: '',
    salesPerson: '彭辉',
    voyageDays: 4,
    departurePort: '重庆',
    arrivalPort: '宜昌',
    transitPort: '丰都-巫山',
    supplier: '重庆长江轮船有限公司',
    policyName: '内宾共享',
    line: '渝宜',
    voyageStatus: '开放',
    salesType: '补单',
    orderType: '普通订单',
    amountType: '船票款',
    roomType: '标准间',
    ageGroup: '成人',
    occupancyType: '正常',
    priceCoefficient: 1,
    contactName: '彭彬',
    contactPhone: '13800001111',
    fixedPhone: '',
    fax: '',
    email: 'demo@example.com',
    leaveMessage: '否',
  },
  {
    id: '3',
    index: 3,
    history: '历史',
    orderNo: '0000003K',
    groupName: '销售二分部1003S16入住行政房1',
    voyageNo: '212102',
    orderStatus: '取消',
    route: '宜渝',
    ship: '长江贰号',
    sailDate: '2021-10-03',
    marketCategory: '外宾-日本',
    nationality: '阿富汗',
    totalPeople: 16,
    realNameCount: 12,
    adult: 16,
    child: 0,
    infant: 0,
    companion: 1,
    unitPrice: 2204.16,
    receivableTicket: 52900,
    smallFee: 0,
    localFee: 0,
    combinedProduct: 0,
    totalAmount: 52900,
    paidAmount: 0,
    arrears: 52900,
    depositAmount: 100,
    ticketBalance: 100,
    dealer: '销售二分部',
    remark: '',
    depositDate: '',
    parentOrderNo: 'S000003K',
    thirdPartyOrderNo: '',
    sailDeadline: '2021-09-12',
    bookingTime: '2021-11-08 15:55',
    lockValidUntil: '',
    voucherApplyStatus: '单证凭证失败',
    voucherApprovalStatus: '审批完成',
    shareCenterStatus: '暂存',
    pushTime: '2022-03-18 10:29',
    invoiceRequired: '否',
    miniProgramChannel: '',
    advanceAccount: '章莹',
    relatedOrderNo: '',
    salesPerson: '彭辉',
    voyageDays: 4,
    departurePort: '宜昌',
    arrivalPort: '重庆',
    transitPort: '奉节-丰都',
    supplier: '重庆长江轮船有限公司',
    policyName: '外宾协议',
    line: '宜渝',
    voyageStatus: '开放',
    salesType: '团队',
    orderType: '普通订单',
    amountType: '船票款',
    roomType: '行政房',
    ageGroup: '成人',
    occupancyType: '正常',
    priceCoefficient: 1,
    contactName: '章莹',
    contactPhone: '13900002222',
    fixedPhone: '',
    fax: '',
    email: '',
    leaveMessage: '是',
  },
  {
    id: '4',
    index: 4,
    history: '历史',
    orderNo: '00000001',
    groupName: '123456789',
    voyageNo: '212103',
    orderStatus: '取消',
    route: '长航渝宜',
    ship: '长江凯号',
    sailDate: '2021-10-07',
    marketCategory: '内宾-云阳县',
    nationality: '中国',
    totalPeople: 10,
    realNameCount: 10,
    adult: 10,
    child: 0,
    infant: 0,
    companion: 0,
    unitPrice: 2050,
    receivableTicket: 19885,
    smallFee: 0,
    localFee: 0,
    combinedProduct: 0,
    totalAmount: 19885,
    paidAmount: 0,
    arrears: 19885,
    depositAmount: 0,
    ticketBalance: 0,
    dealer: '重庆神州',
    remark: '',
    depositDate: '2021-10-02',
    parentOrderNo: 'S00000001',
    thirdPartyOrderNo: '',
    sailDeadline: '2021-10-04',
    bookingTime: '2021-09-29 14:48',
    lockValidUntil: '',
    voucherApplyStatus: '未申请凭证',
    voucherApprovalStatus: '待审核',
    shareCenterStatus: '暂存',
    pushTime: '',
    invoiceRequired: '否',
    miniProgramChannel: '',
    advanceAccount: 'CHW38000C',
    relatedOrderNo: '',
    salesPerson: '栾伶伶',
    voyageDays: 4,
    departurePort: '重庆',
    arrivalPort: '宜昌',
    transitPort: '丰都-巫山',
    supplier: '重庆长江轮船有限公司',
    policyName: '内宾团队价',
    line: '长航渝宜',
    voyageStatus: '开放',
    salesType: '团队',
    orderType: '普通订单',
    amountType: '船票款',
    roomType: '标准间',
    ageGroup: '成人',
    occupancyType: '正常',
    priceCoefficient: 1,
    contactName: '张经理',
    contactPhone: '13600003333',
    fixedPhone: '023-88888888',
    fax: '',
    email: '',
    leaveMessage: '否',
  },
]

const touristNamePool = [
  '张明', '李娜', '王强', '赵敏', '陈晨', '刘洋', '周宁', '吴桐', '徐佳', '孙悦',
  '郑凯', '何静', '高远', '林溪', '罗宇', '唐欣', '梁辰', '宋妍', '许诺', '韩雪',
]

function buildOrderGroups(order: CruiseOrder, orderIndex: number): CruiseGroup[] {
  const groupCounts = order.totalPeople >= 8
    ? [Math.ceil(order.totalPeople / 2), Math.floor(order.totalPeople / 2)]
    : [order.totalPeople]
  let touristCursor = 0

  return groupCounts.map((groupCount, groupIndex) => {
    const roomCount = Math.max(1, Math.ceil(groupCount / 2))
    let remaining = groupCount
    const rooms = Array.from({ length: roomCount }, (_, roomIndex): CruiseRoom => {
      const roomPeople = Math.min(2, remaining)
      remaining -= roomPeople
      const roomType = roomIndex === roomCount - 1 && order.roomType === '标准间'
        ? (groupIndex === 1 ? '豪华套房' : order.roomType)
        : order.roomType
      const tourists = Array.from({ length: roomPeople }, (_, touristIndex): CruiseTourist => {
        const absoluteIndex = touristCursor++
        const isChild = absoluteIndex >= order.adult && absoluteIndex < order.adult + order.child
        const isInfant = absoluteIndex >= order.adult + order.child
        const ageGroup: CruiseTourist['ageGroup'] = isInfant ? '婴儿' : isChild ? '儿童' : '成人'
        const name = touristNamePool[(orderIndex * 5 + absoluteIndex) % touristNamePool.length]
        const realNamed = absoluteIndex < order.realNameCount
        return {
          id: `${order.id}-G${groupIndex + 1}-R${roomIndex + 1}-T${touristIndex + 1}`,
          name,
          sex: absoluteIndex % 2 === 0 ? '男' : '女',
          ageGroup,
          nationality: order.nationality,
          idType: order.nationality === '中国' ? '身份证' : '护照',
          idNo: realNamed ? `500101199${orderIndex}${groupIndex}${roomIndex}${touristIndex}1234` : '',
          phone: `13${8 + (absoluteIndex % 2)}0000${String(orderIndex * 100 + absoluteIndex).padStart(4, '0')}`,
          occupancyType: touristIndex === 0 ? order.occupancyType : '正常',
          price: Math.round(order.receivableTicket / Math.max(1, order.totalPeople)),
          realNamed,
        }
      })
      return {
        id: `${order.id}-G${groupIndex + 1}-R${roomIndex + 1}`,
        roomNo: `${order.voyageNo}-${groupIndex + 1}${String(roomIndex + 1).padStart(2, '0')}`,
        roomType,
        occupancyType: tourists.length === 1 ? '单人入住' : order.occupancyType,
        tourists,
      }
    })

    return {
      id: `${order.id}-G${groupIndex + 1}`,
      groupName: groupIndex === 0 ? order.groupName : `${order.ship}${order.voyageNo}B团`,
      contactName: groupIndex === 0 ? order.contactName : `${touristNamePool[(orderIndex * 5 + touristCursor) % touristNamePool.length]}领队`,
      contactPhone: groupIndex === 0 ? order.contactPhone : `1390000${String(orderIndex * 10 + groupIndex).padStart(4, '0')}`,
      rooms,
    }
  })
}

const orderGroupsByOrderId = Object.fromEntries(
  orders.map((order, orderIndex) => [order.id, buildOrderGroups(order, orderIndex)]),
) as Record<string, CruiseGroup[]>

function getRowsByDimension(dimension: CruiseOrderDimension): DimensionRow[] {
  if (dimension === 'order') return orders.map((order) => ({ id: order.id, order }))

  return orders.flatMap((order) => orderGroupsByOrderId[order.id].flatMap((group) => {
    if (dimension === 'group') return [{ id: group.id, order, group }]
    return group.rooms.flatMap((room) => {
      if (dimension === 'room') return [{ id: room.id, order, group, room }]
      return room.tourists.map((tourist) => ({ id: tourist.id, order, group, room, tourist }))
    })
  }))
}

function getScopedTourists(row: DimensionRow) {
  if (row.tourist) return [row.tourist]
  if (row.room) return row.room.tourists
  if (row.group) return row.group.rooms.flatMap((room) => room.tourists)
  return orderGroupsByOrderId[row.order.id].flatMap((group) => group.rooms.flatMap((room) => room.tourists))
}

function buildScopedOrder(row: DimensionRow): CruiseOrder {
  if (!row.group && !row.room && !row.tourist) return row.order

  const tourists = getScopedTourists(row)
  const scopedAmount = tourists.reduce((sum, tourist) => sum + tourist.price, 0)
  const paidRatio = row.order.totalAmount > 0 ? row.order.paidAmount / row.order.totalAmount : 0
  const paidAmount = Math.min(scopedAmount, Math.round(scopedAmount * paidRatio))
  const adult = tourists.filter((tourist) => tourist.ageGroup === '成人').length
  const child = tourists.filter((tourist) => tourist.ageGroup === '儿童').length
  const infant = tourists.filter((tourist) => tourist.ageGroup === '婴儿').length
  const scopeRoomType = row.room?.roomType || Array.from(new Set((row.group?.rooms || []).map((room) => room.roomType))).join('、') || row.order.roomType

  return {
    ...row.order,
    groupName: row.group?.groupName || row.order.groupName,
    totalPeople: tourists.length,
    realNameCount: tourists.filter((tourist) => tourist.realNamed).length,
    adult,
    child,
    infant,
    unitPrice: tourists.length ? Math.round(scopedAmount / tourists.length) : 0,
    receivableTicket: scopedAmount,
    totalAmount: scopedAmount,
    paidAmount,
    arrears: Math.max(0, scopedAmount - paidAmount),
    roomType: scopeRoomType,
    ageGroup: row.tourist?.ageGroup || (child > 0 || infant > 0 ? '混合年龄段' : '成人'),
    occupancyType: row.tourist?.occupancyType || row.room?.occupancyType || row.order.occupancyType,
    nationality: row.tourist?.nationality || row.order.nationality,
    contactName: row.tourist?.name || row.group?.contactName || row.order.contactName,
    contactPhone: row.tourist?.phone || row.group?.contactPhone || row.order.contactPhone,
  }
}

const dimensionMeta: Record<CruiseOrderDimension, { title: string; description: string }> = {
  order: { title: '游轮订单（订单维度）', description: '一行对应一笔游轮订单，金额、人数和状态按整单汇总。' },
  group: { title: '游轮订单（团维度）', description: '同一订单按团拆分，一行仅汇总当前团的房间、游客和金额。' },
  room: { title: '游轮订单（房维度）', description: '同一订单按团内房间拆分，一行仅汇总当前房间及房内游客。' },
  tourist: { title: '游轮订单（游客维度）', description: '同一订单按游客拆分，一行对应一位游客及其房间、入住和价格信息。' },
}

const baseFilterFields: FilterField[] = [
  { key: 'keyword', label: '总单号/订单号', type: 'input', placeholder: '请输入' },
  { key: 'orderStatus', label: '订单状态', type: 'select', options: ['全部', '取消', '船款确认', '已预订', '已完成'] },
  { key: 'refundStatus', label: '退款状态', type: 'select', options: ['全部', '无退款', '退款处理中', '已退款', '退款被拒'] },
  { key: 'voyageNo', label: '航次号', type: 'input', placeholder: '请输入' },
  { key: 'voyageStatus', label: '航次状态', type: 'select', options: ['全部', '开放', '关闭'] },
  { key: 'marketCategory', label: '市场类别', type: 'select', options: ['全部', '内宾-巫山县', '内宾-奉节县', '内宾-云阳县', '外宾-日本', '外宾-美国'] },
  { key: 'bookingDate', label: '预订日期', type: 'date', placeholder: '请选择' },
  { key: 'groupName', label: '团名', type: 'input', placeholder: '请输入团名' },
  { key: 'line', label: '线路', type: 'select', options: ['全部', '渝宜', '宜渝', '长航渝宜'] },
  { key: 'policy', label: '政策类别', type: 'select', options: ['全部', '内宾共享', '外宾协议', '内宾团队价'] },
  { key: 'sailDate', label: '开航日期', type: 'date', placeholder: '2021-01-01 - 2021-12-31' },
  { key: 'ship', label: '游轮', type: 'select', options: ['全部', '长江壹号', '长江贰号', '长江叁号', '长江凯号'] },
  { key: 'amountType', label: '金额类型', type: 'select', options: ['全部', '船票款', '小费', '地接费'] },
  { key: 'lockStatus', label: '锁铺状态', type: 'select', options: ['全部', '暂存', '已锁定', '已释放'] },
  { key: 'salesType', label: '销售类型', type: 'select', options: ['全部', '散客', '团队', '补单'] },
  { key: 'invoiceRequired', label: '是否开票', type: 'select', options: ['全部', '是', '否'] },
  { key: 'depositDate', label: '定金时间', type: 'date', placeholder: '请选择' },
  { key: 'sailDeadline', label: '船款时间', type: 'date', placeholder: '请选择' },
  { key: 'thirdPartyOrderNo', label: '第三方订单号', type: 'input', placeholder: '请输入' },
  { key: 'orderType', label: '订单类型', type: 'select', options: ['全部', '普通订单', '补差订单'] },
  { key: 'relatedOrderNo', label: '关联单号', type: 'input', placeholder: '请输入' },
  { key: 'advanceAccount', label: '预定账号', type: 'input', placeholder: '请输入在线搜索' },
]

function getFilterFields(dimension: CruiseOrderDimension): FilterField[] {
  const dimensionFields: FilterField[] = dimension === 'room'
    ? [
        { key: 'roomNo', label: '房间号', type: 'input', placeholder: '请输入房间号' },
        { key: 'roomType', label: '房型', type: 'select', options: ['全部', '标准间', '行政房', '豪华套房'] },
      ]
    : dimension === 'tourist'
      ? [
          { key: 'touristKeyword', label: '游客姓名', type: 'input', placeholder: '请输入游客姓名' },
          { key: 'idNo', label: '证件号码', type: 'input', placeholder: '请输入证件号码' },
          { key: 'roomType', label: '房型', type: 'select', options: ['全部', '标准间', '行政房', '豪华套房'] },
        ]
      : []
  const excluded = new Set(dimension === 'order' ? ['groupName'] : [])
  const existingKeys = new Set(dimensionFields.map((field) => field.key))
  return [
    ...dimensionFields,
    ...baseFilterFields.filter((field) => !excluded.has(field.key) && !existingKeys.has(field.key)),
  ]
}

function getPrimaryFilterKeys(dimension: CruiseOrderDimension) {
  if (dimension === 'order') return ['keyword', 'orderStatus', 'voyageNo', 'marketCategory', 'sailDate', 'ship']
  if (dimension === 'group') return ['keyword', 'groupName', 'orderStatus', 'voyageNo', 'sailDate', 'ship']
  if (dimension === 'room') return ['keyword', 'groupName', 'roomNo', 'roomType', 'sailDate', 'orderStatus']
  return ['keyword', 'touristKeyword', 'idNo', 'roomType', 'sailDate', 'orderStatus']
}

const tableColumns: { key: keyof CruiseOrder | 'actions'; title: string; width: string; render?: (record: CruiseOrder) => ReactNode }[] = [
  { key: 'index', title: '序号', width: '58px' },
  { key: 'orderNo', title: '订单号', width: '110px' },
  { key: 'voyageNo', title: '航次', width: '88px' },
  { key: 'orderStatus', title: '订单状态', width: '96px', render: (record) => <span className={`rounded px-2 py-1 text-xs ${statusColor[record.orderStatus]}`}>{record.orderStatus}</span> },
  { key: 'refundStatus', title: '退款状态', width: '110px', render: (record) => <RefundStatusPill status={record.refundStatus || '无退款'} /> },
  { key: 'route', title: '线路', width: '90px' },
  { key: 'ship', title: '游轮', width: '110px' },
  { key: 'sailDate', title: '开船日期', width: '110px' },
  { key: 'marketCategory', title: '市场类别', width: '120px' },
  { key: 'nationality', title: '国籍', width: '80px' },
  { key: 'totalPeople', title: '人数', width: '70px' },
  { key: 'realNameCount', title: '游客信息', width: '90px', render: (record) => `${record.realNameCount}/${record.totalPeople}` },
  { key: 'child', title: '儿童', width: '70px' },
  { key: 'infant', title: '婴儿', width: '70px' },
  { key: 'companion', title: '陪同', width: '70px' },
  { key: 'unitPrice', title: '单价', width: '90px' },
  { key: 'receivableTicket', title: '应收船款', width: '100px' },
  { key: 'smallFee', title: '小费', width: '80px' },
  { key: 'localFee', title: '地接', width: '80px' },
  { key: 'combinedProduct', title: '组合产品', width: '90px' },
  { key: 'totalAmount', title: '总价', width: '90px' },
  { key: 'paidAmount', title: '实收总额', width: '100px' },
  { key: 'arrears', title: '欠款', width: '90px' },
  { key: 'depositAmount', title: '定金罚金', width: '100px' },
  { key: 'ticketBalance', title: '船款罚金', width: '100px' },
  { key: 'remark', title: '备注', width: '120px' },
  { key: 'depositDate', title: '定金日期', width: '110px' },
  { key: 'parentOrderNo', title: '总单号', width: '120px' },
  { key: 'thirdPartyOrderNo', title: '第三方订单号', width: '130px' },
  { key: 'sailDeadline', title: '船款日期', width: '110px' },
  { key: 'bookingTime', title: '预订日期', width: '145px' },
  { key: 'lockValidUntil', title: '锁铺有效期', width: '120px' },
  { key: 'invoiceRequired', title: '是否开票', width: '90px' },
  { key: 'advanceAccount', title: '预定账号', width: '120px' },
  { key: 'relatedOrderNo', title: '关联单号', width: '120px' },
  { key: 'actions', title: '操作', width: '300px' },
]

function getDimensionColumns(dimension: CruiseOrderDimension): DimensionColumn[] {
  if (dimension === 'order') {
    return tableColumns.map((column) => ({
      key: String(column.key),
      title: column.title,
      width: column.width,
      numeric: numericColumnKeys.has(column.key as keyof CruiseOrder),
      render: (row: DimensionRow) => column.render
        ? column.render(row.order)
        : column.key === 'actions'
          ? null
          : formatOrderCellValue(row.order, column.key as keyof CruiseOrder),
    }))
  }

  const common: DimensionColumn[] = [
    { key: 'orderNo', title: '订单号', width: '130px', render: (row) => row.order.orderNo },
    { key: 'voyageNo', title: '航次', width: '100px', render: (row) => row.order.voyageNo },
    { key: 'ship', title: '游轮', width: '110px', render: (row) => row.order.ship },
    { key: 'sailDate', title: '开船日期', width: '110px', render: (row) => row.order.sailDate },
    { key: 'orderStatus', title: '订单状态', width: '100px', render: (row) => <OrderStatusPill status={row.order.orderStatus} /> },
  ]
  const totals: DimensionColumn[] = [
    { key: 'totalPeople', title: '人数', width: '80px', numeric: true, render: (row) => buildScopedOrder(row).totalPeople },
    { key: 'realNameCount', title: '实名人数', width: '90px', numeric: true, render: (row) => buildScopedOrder(row).realNameCount },
    { key: 'totalAmount', title: '结算金额', width: '110px', numeric: true, render: (row) => formatCurrency(buildScopedOrder(row).totalAmount) },
    { key: 'arrears', title: '欠款', width: '100px', numeric: true, render: (row) => formatCurrency(buildScopedOrder(row).arrears) },
  ]

  if (dimension === 'group') {
    return [
      { key: 'groupName', title: '团名', width: '210px', render: (row) => row.group?.groupName || '-' },
      ...common,
      { key: 'roomCount', title: '房间数', width: '90px', numeric: true, render: (row) => row.group?.rooms.length || 0 },
      ...totals,
      { key: 'contactName', title: '团联系人', width: '100px', render: (row) => row.group?.contactName || '-' },
      { key: 'contactPhone', title: '联系电话', width: '130px', render: (row) => row.group?.contactPhone || '-' },
      { key: 'actions', title: '操作', width: '100px', render: () => null },
    ]
  }
  if (dimension === 'room') {
    return [
      { key: 'roomNo', title: '房间号', width: '130px', render: (row) => row.room?.roomNo || '-' },
      { key: 'groupName', title: '所属团', width: '190px', render: (row) => row.group?.groupName || '-' },
      ...common,
      { key: 'roomType', title: '房型', width: '110px', render: (row) => row.room?.roomType || '-' },
      { key: 'occupancyType', title: '入住方式', width: '100px', render: (row) => row.room?.occupancyType || '-' },
      { key: 'tourists', title: '房内游客', width: '190px', render: (row) => row.room?.tourists.map((tourist) => tourist.name).join('、') || '-' },
      ...totals,
      { key: 'actions', title: '操作', width: '100px', render: () => null },
    ]
  }
  return [
    { key: 'touristName', title: '游客姓名', width: '110px', render: (row) => row.tourist?.name || '-' },
    { key: 'groupName', title: '所属团', width: '190px', render: (row) => row.group?.groupName || '-' },
    { key: 'roomNo', title: '房间号', width: '130px', render: (row) => row.room?.roomNo || '-' },
    ...common,
    { key: 'idType', title: '证件类型', width: '100px', render: (row) => row.tourist?.idType || '-' },
    { key: 'idNo', title: '证件号码', width: '180px', render: (row) => row.tourist?.idNo || '待补录' },
    { key: 'nationality', title: '国籍', width: '90px', render: (row) => row.tourist?.nationality || '-' },
    { key: 'ageGroup', title: '年龄段', width: '90px', render: (row) => row.tourist?.ageGroup || '-' },
    { key: 'roomType', title: '房型', width: '110px', render: (row) => row.room?.roomType || '-' },
    { key: 'occupancyType', title: '入住类型', width: '100px', render: (row) => row.tourist?.occupancyType || '-' },
    { key: 'price', title: '结算价', width: '100px', numeric: true, render: (row) => formatCurrency(row.tourist?.price || 0) },
    { key: 'phone', title: '手机号', width: '130px', render: (row) => row.tourist?.phone || '-' },
    { key: 'actions', title: '操作', width: '100px', render: () => null },
  ]
}

const amountColumnKeys = new Set<keyof CruiseOrder>([
  'unitPrice',
  'receivableTicket',
  'smallFee',
  'localFee',
  'combinedProduct',
  'totalAmount',
  'paidAmount',
  'arrears',
  'depositAmount',
  'ticketBalance',
])

const numericColumnKeys = new Set<keyof CruiseOrder>([
  'totalPeople',
  'adult',
  'child',
  'infant',
  'companion',
  ...amountColumnKeys,
])

function createEmptyFilters(fields: FilterField[]) {
  return Object.fromEntries(fields.map((field) => [field.key, ''])) as Record<string, string>
}

function OrderStatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${statusColor[status]}`}>
      {status}
    </span>
  )
}

function RefundStatusPill({ status }: { status: RefundStatus }) {
  return (
    <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${refundStatusColor[status]}`}>
      {status}
    </span>
  )
}

function MetricItem({ label, value, highlight }: { label: string; value: ReactNode; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-gray-50 px-4 py-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${highlight ? 'text-blue-600' : 'text-gray-900'}`}>{value}</div>
    </div>
  )
}

function DetailSection({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`overflow-hidden rounded-lg border border-gray-200 bg-white ${className}`}>
      <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function FieldGrid({ children, columns = 2 }: { children: ReactNode; columns?: 2 | 3 }) {
  const columnClass = columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
  return <div className={`grid gap-x-8 gap-y-3 ${columnClass}`}>{children}</div>
}

function FieldItem({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="grid min-h-8 grid-cols-[108px_1fr] items-start gap-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`min-w-0 break-words text-gray-900 ${mono ? 'font-mono' : ''}`}>{value || '-'}</span>
    </div>
  )
}

function formatOrderCellValue(order: CruiseOrder, key: keyof CruiseOrder) {
  const value = order[key]
  if (amountColumnKeys.has(key)) return formatCurrency(Number(value || 0))
  return value === '' || value == null ? '-' : String(value)
}

function renderHeaderTitle(title: string) {
  if (title === '序号') {
    return (
      <>
        序<br />号
      </>
    )
  }
  return title
}

function FilterControl({ field, value, onChange }: { field: FilterField; value: string; onChange: (key: string, value: string) => void }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs text-gray-500">{field.label}</span>
      {field.type === 'select' ? (
        <select value={value || '全部'} onChange={(event) => onChange(field.key, event.target.value)} className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-500">
          {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <input type="text" value={value || ''} onChange={(event) => onChange(field.key, event.target.value)} placeholder={field.placeholder} className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500" />
      )}
    </label>
  )
}

function RoomPriceTable({ order }: { order: CruiseOrder }) {
  const rows = [
    {
      roomType: order.roomType,
      ageGroup: order.ageGroup,
      occupancyType: order.occupancyType,
      coefficient: order.priceCoefficient,
      price: order.unitPrice,
      people: order.totalPeople,
      subtotal: order.receivableTicket,
    },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">房型</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">年龄段</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">入住类型</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">价格系数</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">结算价</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">人数</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">小计</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={`${row.roomType}-${row.ageGroup}`}>
              <td className="px-4 py-3 text-gray-700">{row.roomType}</td>
              <td className="px-4 py-3 text-gray-700">{row.ageGroup}</td>
              <td className="px-4 py-3 text-gray-700">{row.occupancyType}</td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-700">{row.coefficient}</td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-700">{formatCurrency(row.price)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-700">{row.people}</td>
              <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">{formatCurrency(row.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AmountTable({ order }: { order: CruiseOrder }) {
  const rows = [
    ['1', '定金', '-', 0, 0],
    ['2', '船票尾款', '-', 0, order.receivableTicket],
    ['3', '陪同款', '-', 0, 0],
    ['4', '船票总款', '-', 0, order.receivableTicket],
    ['5', '升舱费', '-', 0, 0],
    ['6', '地接费', '-', 0, order.localFee],
    ['7', '罚金', '-', 0, order.depositAmount],
    ['8', '小费', '-', order.smallFee, order.smallFee],
    ['9', '组合产品', '-', 0, order.combinedProduct],
    ['10', '其他', '-', 0, 0],
    ['11', '结算总价', '-', 0, order.totalAmount],
  ]
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">序号</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">名称</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">系数</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">单价</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">总价</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row[0]}>
              <td className="px-4 py-3 text-gray-700">{row[0]}</td>
              <td className="px-4 py-3 text-gray-700">{row[1]}</td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-700">{row[2]}</td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-700">{formatCurrency(Number(row[3]))}</td>
              <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">{formatCurrency(Number(row[4]))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function getRefundActionState(order: CruiseOrder) {
  if (order.orderStatus === '取消') {
    return { enabled: false, label: '申请退款', title: '已取消订单不可再次发起退款' }
  }
  if (order.paidAmount <= 0) {
    return { enabled: false, label: '申请退款', title: '订单暂无实收金额' }
  }
  if (order.refundStatus === '退款处理中') {
    return { enabled: false, label: '退款审核中', title: '已有退款单正在审核，请勿重复提交' }
  }
  if (order.refundStatus === '已退款') {
    return { enabled: false, label: '已退款', title: '订单退款已完成' }
  }
  if (order.refundStatus === '退款被拒') {
    return { enabled: true, label: '再次申请退款', title: '上次申请被拒，可重新提交' }
  }
  return { enabled: true, label: '申请退款', title: '发起订单退款申请' }
}

export default function DealerCruiseOrderPage({ dimension = 'order' }: { dimension?: CruiseOrderDimension }) {
  const navigate = useNavigate()
  const [orderOverrides, setOrderOverrides] = useState<Record<string, Partial<CruiseOrder>>>({})
  const [rescheduleRow, setRescheduleRow] = useState<DimensionRow | null>(null)
  const [refundRow, setRefundRow] = useState<DimensionRow | null>(null)
  const [refundLoading, setRefundLoading] = useState(false)
  const [toast, setToast] = useState('')
  const filterFields = useMemo(() => getFilterFields(dimension), [dimension])
  const primaryFilterKeys = useMemo(() => getPrimaryFilterKeys(dimension), [dimension])
  const primaryFilterFields = useMemo(
    () => filterFields.filter((field) => primaryFilterKeys.includes(field.key)),
    [filterFields, primaryFilterKeys],
  )
  const advancedFilterFields = useMemo(
    () => filterFields.filter((field) => !primaryFilterKeys.includes(field.key)),
    [filterFields, primaryFilterKeys],
  )
  const allRows = useMemo(() => getRowsByDimension(dimension).map((row) => {
    const mergedOrder = { ...row.order, ...orderOverrides[row.order.id] }
    return {
      ...row,
      order: {
        ...mergedOrder,
        refundStatus: getLatestRefundStatus(mergedOrder),
      },
    }
  }), [dimension, orderOverrides])
  const activeColumns = useMemo(() => getDimensionColumns(dimension), [dimension])
  const [filters, setFilters] = useState<Record<string, string>>(() => createEmptyFilters(getFilterFields(dimension)))
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [page, setPage] = useState(1)
  const [detailRow, setDetail] = useState<DimensionRow | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const detail = useMemo(() => detailRow ? buildScopedOrder(detailRow) : null, [detailRow])

  useEffect(() => {
    setFilters(createEmptyFilters(getFilterFields(dimension)))
    setFiltersExpanded(false)
    setPage(1)
    setDetail(null)
    setSelectedIds([])
    setRescheduleRow(null)
    setRefundRow(null)
  }, [dimension])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2500)
    return () => window.clearTimeout(timer)
  }, [toast])

  const filteredRows = useMemo(() => {
    const keyword = filters.keyword?.trim().toLowerCase()
    const touristKeyword = filters.touristKeyword?.trim().toLowerCase()
    const idNo = filters.idNo?.trim().toLowerCase()
    return allRows.filter((row) => {
      const order = row.order
      const matchedKeyword = !keyword || [order.orderNo, order.parentOrderNo, row.group?.groupName, row.room?.roomNo, row.tourist?.name]
        .some((value) => value?.toLowerCase().includes(keyword))
      const matchedStatus = !filters.orderStatus || filters.orderStatus === '全部' || order.orderStatus === filters.orderStatus
      const matchedRefundStatus = !filters.refundStatus || filters.refundStatus === '全部' || order.refundStatus === filters.refundStatus
      const matchedMarket = !filters.marketCategory || filters.marketCategory === '全部' || order.marketCategory === filters.marketCategory
      const matchedVoyage = !filters.voyageNo || order.voyageNo.includes(filters.voyageNo)
      const matchedGroup = !filters.groupName || row.group?.groupName.includes(filters.groupName)
      const matchedShip = !filters.ship || filters.ship === '全部' || order.ship === filters.ship
      const matchedSailDate = !filters.sailDate || order.sailDate.includes(filters.sailDate)
      const matchedRoomNo = !filters.roomNo || row.room?.roomNo.includes(filters.roomNo)
      const matchedRoomType = !filters.roomType || filters.roomType === '全部' || row.room?.roomType === filters.roomType
      const matchedTourist = !touristKeyword || row.tourist?.name.toLowerCase().includes(touristKeyword)
      const matchedIdNo = !idNo || row.tourist?.idNo.toLowerCase().includes(idNo)
      return matchedKeyword && matchedStatus && matchedRefundStatus && matchedMarket && matchedVoyage && matchedGroup && matchedShip && matchedSailDate && matchedRoomNo && matchedRoomType && matchedTourist && matchedIdNo
    })
  }, [allRows, filters])

  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)

  const updateFilter = (key: string, value: string) => setFilters((prev) => ({ ...prev, [key]: value }))
  const resetFilters = () => {
    setFilters(createEmptyFilters(filterFields))
    setPage(1)
  }

  const selectedRows = useMemo(
    () => filteredRows.filter((row) => selectedIds.includes(row.id)),
    [filteredRows, selectedIds],
  )

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? pagedRows.map((row) => row.id) : [])
  }

  const toggleSelectOne = (rowId: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, rowId] : prev.filter((id) => id !== rowId)))
  }

  const handlePay = (row?: DimensionRow) => {
    const targets = row ? [row] : selectedRows
    if (targets.length === 0) {
      window.alert('请先选择订单')
      return
    }
    const uniqueOrders = Array.from(new Map(targets.map((item) => [item.order.id, item.order])).values())
    const summary = uniqueOrders.map((item) => `${item.orderNo}（欠款 ${formatCurrency(item.arrears)}）`).join('\n')
    window.alert(`即将支付以下订单：\n${summary}`)
  }

  const handleTouristInfo = (row?: DimensionRow) => {
    const target = row ?? selectedRows[0]
    if (!target) {
      window.alert('请先选择订单')
      return
    }
    if (!row && selectedRows.length > 1) {
      window.alert('一次只能维护一个订单的游客信息，已打开第一条选中订单')
    }
    navigate('/dealer/orders/cruise/tourists', { state: { order: target.order } })
  }

  const canReschedule = (order: CruiseOrder) => order.orderStatus === '已预订' || order.orderStatus === '船款确认'

  const handleOpenReschedule = (row: DimensionRow) => {
    if (!canReschedule(row.order)) return
    setRescheduleRow(row)
  }

  const handleReschedule = ({ target, reason, remark }: DealerRescheduleSubmitValue) => {
    if (!rescheduleRow) return
    const originalOrder = rescheduleRow.order
    setOrderOverrides((prev) => ({
      ...prev,
      [originalOrder.id]: {
        voyageNo: target.voyageNo,
        ship: target.ship,
        sailDate: target.sailDate,
        remark: `已由 ${originalOrder.voyageNo} 改签至 ${target.voyageNo}（${reason}）${remark ? `；${remark}` : ''}`,
      },
    }))
    setRescheduleRow(null)
    setToast(`订单 ${originalOrder.orderNo} 已改签至 ${target.voyageNo}，本次罚金 ¥0.00`)
  }

  const handleOpenRefund = (row: DimensionRow) => {
    const action = getRefundActionState(row.order)
    if (!action.enabled) return
    setRefundRow(row)
  }

  const handleRefundSubmit = (form: CreateRefundOrderForm) => {
    if (!refundRow) return
    const sourceOrder = refundRow.order
    const action = getRefundActionState(sourceOrder)
    if (!action.enabled) {
      setRefundRow(null)
      setToast(action.title)
      return
    }
    if (form.applyRefundAmount <= 0 || form.applyRefundAmount > sourceOrder.paidAmount) {
      window.alert(`申请退款金额应大于 0 且不超过实收金额 ${formatCurrency(sourceOrder.paidAmount)}`)
      return
    }

    setRefundLoading(true)
    try {
      const refundOrder = createRefundOrder(
        {
          ...form,
          orderId: getDealerRefundOrderId(sourceOrder.id),
        },
        sourceOrder.dealer,
        {
          orderNo: sourceOrder.orderNo,
          dealer: sourceOrder.dealer,
          voyageNo: sourceOrder.voyageNo,
          groupName: sourceOrder.groupName,
          totalAmount: sourceOrder.totalAmount,
          paidAmount: sourceOrder.paidAmount,
        },
      )
      setOrderOverrides((prev) => ({
        ...prev,
        [sourceOrder.id]: {
          ...prev[sourceOrder.id],
          refundStatus: '退款处理中',
        },
      }))
      setRefundRow(null)
      setToast(`退款申请 ${refundOrder.refundNo} 已提交，等待平台审核`)
    } finally {
      setRefundLoading(false)
    }
  }

  if (detail) {
    return (
      <div className="space-y-5">
        <PageHeader title="订单详情">
          <button onClick={() => setDetail(null)} className="inline-flex h-11 items-center gap-2 rounded-md border border-gray-300 bg-white px-5 text-base text-gray-600 transition hover:bg-gray-50">
            <ChevronLeft className="h-4 w-4" />
            返回列表
          </button>
        </PageHeader>
        <div className="border border-gray-200 bg-white px-9 py-6">
          <div className="mb-4 text-sm text-blue-600">订单管理 / 订单详情</div>
          <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            特别提示：订单变更后如遇紧急情况（航次停航、变更等）客服人员会及时与您电话联系。
          </p>

          <DetailSection title="订单概览" className="mb-5">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
              <MetricItem label="订单状态" value={<OrderStatusPill status={detail.orderStatus} />} />
              <MetricItem label="退款状态" value={<RefundStatusPill status={detail.refundStatus || '无退款'} />} />
              <MetricItem label="订单总额" value={formatCurrency(detail.totalAmount)} highlight />
              <MetricItem label="实收总额" value={formatCurrency(detail.paidAmount)} />
              <MetricItem label="欠款" value={formatCurrency(detail.arrears)} />
              <MetricItem label="总人数" value={`${detail.totalPeople} 人`} />
            </div>
          </DetailSection>

          <div className="grid gap-5 xl:grid-cols-2">
            <DetailSection title="订单信息">
              <FieldGrid>
                <FieldItem label="订单号" value={detail.orderNo} mono />
                <FieldItem label="总单号" value={detail.parentOrderNo} mono />
                <FieldItem label="第三方订单号" value={detail.thirdPartyOrderNo || '-'} mono />
                <FieldItem label="预订时间" value={detail.bookingTime} />
                <FieldItem label="订单类型" value={detail.orderType} />
              </FieldGrid>
            </DetailSection>

            <DetailSection title="游轮产品信息">
              <FieldGrid>
                <FieldItem label="游轮" value={detail.ship} />
                <FieldItem label="航次号" value={detail.voyageNo} mono />
                <FieldItem label="航线" value={detail.line} />
                <FieldItem label="开船日期" value={detail.sailDate} />
                <FieldItem label="行程天数" value={`${detail.voyageDays} 天`} />
                <FieldItem label="供应商" value={detail.supplier} />
              </FieldGrid>
            </DetailSection>

            <DetailSection title="港口与行程">
              <FieldGrid>
                <FieldItem label="出发港" value={detail.departurePort} />
                <FieldItem label="终到港" value={detail.arrivalPort} />
                <FieldItem label="途经港" value={detail.transitPort} />
                <FieldItem label="线路" value={detail.route} />
                <FieldItem label="航次状态" value={detail.voyageStatus} />
                <FieldItem label="船款日期" value={detail.sailDeadline} />
              </FieldGrid>
            </DetailSection>

            <DetailSection title="政策与市场">
              <FieldGrid>
                <FieldItem label="预定账号" value={detail.advanceAccount} />
                <FieldItem label="价格政策" value={detail.policyName} />
                <FieldItem label="市场类别" value={detail.marketCategory} />
                <FieldItem label="国籍" value={detail.nationality} />
                <FieldItem label="销售类型" value={detail.salesType} />
                <FieldItem label="锁铺有效期" value={detail.lockValidUntil || '-'} />
              </FieldGrid>
            </DetailSection>

            <DetailSection title="人数信息">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <MetricItem label="总人数" value={detail.totalPeople} />
                <MetricItem label="成人" value={detail.adult} />
                <MetricItem label="儿童" value={detail.child} />
                <MetricItem label="婴儿" value={detail.infant} />
                <MetricItem label="陪同" value={detail.companion} />
                <MetricItem label="16免1数" value={0} />
              </div>
            </DetailSection>

            <DetailSection title="开票信息">
              <FieldGrid>
                <FieldItem label="是否开票" value={detail.invoiceRequired} />
              </FieldGrid>
            </DetailSection>
          </div>

          <DetailSection title="费用信息" className="mt-5">
            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricItem label="应收船款" value={formatCurrency(detail.receivableTicket)} highlight />
              <MetricItem label="小费" value={formatCurrency(detail.smallFee)} />
              <MetricItem label="地接费" value={formatCurrency(detail.localFee)} />
              <MetricItem label="组合产品" value={formatCurrency(detail.combinedProduct)} />
            </div>
            <RoomPriceTable order={detail} />
            <div className="mt-4">
              <AmountTable order={detail} />
            </div>
          </DetailSection>

          <DetailSection title="联系人信息" className="mt-5">
            <FieldGrid columns={3}>
              <FieldItem label="联系人" value={detail.contactName} />
              <FieldItem label="手机号" value={detail.contactPhone} />
              <FieldItem label="固定电话" value={detail.fixedPhone || '-'} />
              <FieldItem label="传真" value={detail.fax || '-'} />
              <FieldItem label="Email" value={detail.email || '-'} />
              <FieldItem label="是否留言" value={detail.leaveMessage} />
              <FieldItem label="特殊要求" value="-" />
            </FieldGrid>
            <div className="mt-4 overflow-x-auto rounded-lg bg-white">
              <table className="w-full min-w-[780px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {['陪同', '姓名', '证件类型', '证件号', '手机号', '是否转运'].map((item) => <th key={item} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{item}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
                </tbody>
              </table>
            </div>
          </DetailSection>
        </div>
      </div>
    )
  }

  return (
    <div>
      {toast && (
        <div className="fixed left-1/2 top-6 z-[70] -translate-x-1/2 bg-gray-900 px-5 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
      <PageHeader title={dimensionMeta[dimension].title} description={dimensionMeta[dimension].description} />

      <div className="border-b border-gray-200 bg-white px-9 py-6">
        <div className="flex items-start gap-6">
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-3 2xl:grid-cols-6">
              {primaryFilterFields.map((field) => (
                <FilterControl key={field.key} field={field} value={filters[field.key]} onChange={updateFilter} />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handlePay()}
                className="inline-flex h-10 items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
              >
                {dimension === 'order' ? '支付' : '支付所属订单'}
              </button>
              <button
                type="button"
                onClick={() => handleTouristInfo()}
                className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                {dimension === 'order' ? '游客信息' : '维护所属订单游客'}
              </button>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 pt-[22px]">
            <button onClick={() => setPage(1)} className="inline-flex h-11 min-w-[90px] items-center justify-center gap-2 rounded-md bg-blue-600 px-6 text-base font-medium text-white transition hover:bg-blue-700">
              <Search className="h-4 w-4" />
              搜索
            </button>
            <button onClick={resetFilters} className="inline-flex h-11 min-w-[90px] items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-6 text-base text-gray-600 transition hover:bg-gray-50">
              <RotateCcw className="h-4 w-4" />
              重置
            </button>
            <button
              type="button"
              onClick={() => setFiltersExpanded((prev) => !prev)}
              className="inline-flex h-11 min-w-[128px] items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-base text-gray-600 transition hover:bg-gray-50"
            >
              {filtersExpanded ? '收起高级' : `高级筛选(${advancedFilterFields.length})`}
              <ChevronDown className={`h-4 w-4 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {filtersExpanded && (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">高级筛选</span>
              <span className="text-xs text-gray-400">低频条件默认收起，避免影响订单检索效率</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4 2xl:grid-cols-6">
              {advancedFilterFields.map((field) => (
                <FilterControl key={field.key} field={field} value={filters[field.key]} onChange={updateFilter} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="overflow-hidden border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className={`${dimension === 'order' ? 'min-w-[4000px]' : 'min-w-[1800px]'} border-collapse text-sm`}>
            <thead>
              <tr className="bg-gray-50">
                <th className="h-[72px] w-10 border-b border-r border-gray-200 bg-gray-50 px-3 text-center align-middle">
                  <input
                    type="checkbox"
                    checked={pagedRows.length > 0 && pagedRows.every((row) => selectedIds.includes(row.id))}
                    onChange={(event) => toggleSelectAll(event.target.checked)}
                  />
                </th>
                {activeColumns.map((column) => (
                  <th
                    key={column.key}
                    style={{ width: column.width }}
                    className="h-[72px] border-b border-r border-gray-200 bg-gray-50 px-4 text-center align-middle text-[18px] font-semibold leading-[1.15] text-gray-900 last:border-r-0"
                  >
                    <span className="inline-block whitespace-nowrap">{renderHeaderTitle(column.title)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((row) => (
                <tr key={row.id} className="transition hover:bg-gray-50">
                  <td className="border-b border-r border-gray-200 px-4 py-5 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={(event) => toggleSelectOne(row.id, event.target.checked)}
                    />
                  </td>
                  {activeColumns.map((column) => (
                    <td
                      key={column.key}
                      className={`whitespace-nowrap border-b border-r border-gray-200 px-4 py-5 text-sm text-gray-700 last:border-r-0 ${column.numeric ? 'text-right tabular-nums' : ''}`}
                    >
                      {column.key === 'actions' ? (
                        <div className="flex items-center justify-center gap-2">
                          {dimension === 'order' ? (
                            <>
                              <button type="button" onClick={() => handlePay(row)} className="rounded px-2 py-1 text-xs text-blue-700 hover:bg-blue-50">支付</button>
                              <button type="button" onClick={() => handleTouristInfo(row)} className="rounded px-2 py-1 text-xs text-gray-700 hover:bg-gray-100">游客信息</button>
                              <button
                                type="button"
                                disabled={!canReschedule(row.order)}
                                title={canReschedule(row.order) ? '改签至其他可售航次' : '仅已预订或船款确认订单可改签'}
                                onClick={() => handleOpenReschedule(row)}
                                className="rounded px-2 py-1 text-xs text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                              >
                                改签
                              </button>
                              <button
                                type="button"
                                disabled={!getRefundActionState(row.order).enabled}
                                title={getRefundActionState(row.order).title}
                                onClick={() => handleOpenRefund(row)}
                                className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                              >
                                {getRefundActionState(row.order).label}
                              </button>
                            </>
                          ) : (
                            <button type="button" onClick={() => setDetail(row)} className="rounded px-2 py-1 text-xs text-blue-700 hover:bg-blue-50">订单详情</button>
                          )}
                        </div>
                      ) : column.key === 'orderNo' ? (
                        <button onClick={() => setDetail(row)} className="font-mono text-blue-700 underline underline-offset-2 hover:text-blue-900">
                          {row.order.orderNo}
                        </button>
                      ) : (
                        column.render(row)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 px-9 py-10 text-gray-500">
          <span className="text-[15px]">共 {filteredRows.length} 条记录 第 {page} / {totalPages} 页</span>
          <div className="flex items-center gap-4">
            <button disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))} className="flex h-12 min-w-[72px] items-center justify-center rounded border border-gray-200 bg-white px-4 text-sm transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40">上一页</button>
            <button className="flex h-12 w-12 items-center justify-center rounded border border-blue-600 bg-blue-600 text-lg text-white">{page}</button>
            <button disabled={page >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} className="flex h-12 min-w-[72px] items-center justify-center rounded border border-gray-200 bg-white px-4 text-sm transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40">下一页</button>
            <button type="button" className="flex h-12 min-w-[110px] items-center justify-center rounded border border-gray-200 bg-white px-4 text-lg text-gray-500">10条/页</button>
          </div>
        </div>
      </div>
      <DealerOrderRescheduleDialog
        open={Boolean(rescheduleRow)}
        order={rescheduleRow ? {
          orderNo: rescheduleRow.order.orderNo,
          voyageNo: rescheduleRow.order.voyageNo,
          ship: rescheduleRow.order.ship,
          sailDate: rescheduleRow.order.sailDate,
          route: rescheduleRow.order.route,
          totalPeople: rescheduleRow.order.totalPeople,
          roomType: rescheduleRow.order.roomType,
          totalAmount: rescheduleRow.order.totalAmount,
        } : null}
        onCancel={() => setRescheduleRow(null)}
        onSubmit={handleReschedule}
      />
      <InitiateRefundDialog
        open={Boolean(refundRow)}
        order={refundRow?.order ?? null}
        loading={refundLoading}
        onCancel={() => setRefundRow(null)}
        onSubmit={handleRefundSubmit}
      />
    </div>
  )
}
