import { getOrders } from '@/mock/orderStore'
import type {
  Voyage,
  VoyageTransferActionKey,
  VoyageTransferCase,
  VoyageTransferDisposition,
  VoyageTransferOrder,
} from '@/types'

export const TRANSFER_ACTION_OPTIONS: Array<{
  key: VoyageTransferActionKey
  object: string
  action: string
  risk: string
}> = [
  { key: 'voyage_suspend', object: '航次运营', action: '设置为“停航（接待占船）”', risk: '不执行时航次仍会显示为正常运营' },
  { key: 'sales_stop', object: '销售状态', action: '设置为“停售”，禁止新建订单', risk: '不执行时内部销售仍可继续下单' },
  { key: 'channels_close', object: '全部渠道', action: '关闭直营、分销商、OTA、小程序及线下销售入口', risk: '不执行时外部渠道可能继续产生订单' },
  { key: 'channel_inventory_zero', object: '渠道库存', action: '可售数归零，撤回已分配但未售库存', risk: '不执行时渠道配额仍会被占用' },
  { key: 'ship_schedule_block', object: '原船排期', action: '生成“接待任务占用”，禁止该时间段再安排其他航次', risk: '不执行时可能产生船期冲突' },
  { key: 'orders_lock', object: '已有订单', action: '标记“转船处置中”，冻结退款、改签、排房等并发操作', risk: '不执行时订单可能被重复处理' },
  { key: 'pending_order_pause', object: '待支付订单', action: '停止催款、自动取消、罚金和超时释放规则', risk: '不执行时自动任务仍会继续运行' },
  { key: 'room_inventory_snapshot', object: '房间库存', action: '保存转船前快照，停止排房和库存调配', risk: '不执行时无法准确追溯原库存' },
  { key: 'orders_generate', object: '订单处置', action: '自动生成受影响订单清单', risk: '不执行时需要人工整理订单' },
  { key: 'operation_log', object: '操作记录', action: '记录发起人、原因、时间及停航停售结果', risk: '不执行时缺少完整审计记录' },
]

export interface CreateVoyageTransferInput {
  voyage: Voyage
  reason: string
  externalCompany: string
  externalShipName: string
  externalSailDate: string
  departurePort: string
  arrivalPort: string
  externalContact: string
  externalPhone: string
  confirmedCapacity: number
  agreementNo: string
  owner: string
  remark: string
  selectedActions: VoyageTransferActionKey[]
}

const STORAGE_KEY = 'cruise-voyage-transfer-cases'

function loadCases(): VoyageTransferCase[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) as VoyageTransferCase[] : []
  } catch {
    return []
  }
}

let cases = loadCases()

function persist() {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cases))
  }
}

function nowText() {
  return new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
}

function resolveChannel(order: ReturnType<typeof getOrders>[number]) {
  if (order.thirdPartyOrderNo) return 'OTA'
  if (order.miniProgramChannel) return '小程序'
  if (order.dealer && order.dealer !== '销售二分部') return '分销商'
  return '直营网'
}

function buildTransferOrders(): VoyageTransferOrder[] {
  const activeOrders = getOrders().filter((order) => order.orderStatus !== '取消' && order.orderStatus !== '已完成')
  return activeOrders.map((order) => ({
    id: `transfer-order-${order.id}-${Date.now()}`,
    sourceOrderId: order.id,
    orderNo: order.orderNo,
    groupName: order.groupName,
    dealer: order.dealer,
    channel: resolveChannel(order),
    contactName: order.contactName,
    contactPhone: order.contactPhone,
    totalPeople: order.totalPeople,
    roomType: order.roomType,
    orderAmount: order.totalAmount,
    paidAmount: order.paidAmount,
    sourceOrderStatus: order.orderStatus,
    disposition: 'external_transfer',
    handlingStatus: 'pending',
    customerConfirmation: 'pending_contact',
    externalRoomType: '',
    targetVoyageNo: '',
    refundAmount: order.paidAmount,
    assignee: '当前用户',
    remark: '',
    updatedAt: nowText(),
  }))
}

export function getVoyageTransferCases() {
  return cases.map((item) => ({ ...item, orders: item.orders.map((order) => ({ ...order })) }))
}

export function getVoyageTransferCase(caseId: string) {
  const item = cases.find((current) => current.id === caseId)
  return item ? { ...item, orders: item.orders.map((order) => ({ ...order })) } : undefined
}

export function getVoyageTransferCaseByVoyage(voyageId: string) {
  return cases.find((item) => item.voyageId === voyageId && item.status !== 'cancelled')
}

export function createVoyageTransferCase(input: CreateVoyageTransferInput) {
  const createdAt = nowText()
  const id = `transfer-${Date.now()}`
  const selected = new Set(input.selectedActions)
  const item: VoyageTransferCase = {
    id,
    caseNo: `ZC${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(cases.length + 1).padStart(3, '0')}`,
    voyageId: input.voyage.id,
    voyageNo: input.voyage.voyageNo,
    originalShipName: input.voyage.shipName,
    routeName: input.voyage.routeName,
    productName: input.voyage.productName,
    startDate: input.voyage.startDate,
    endDate: input.voyage.endDate,
    reason: input.reason,
    externalCompany: input.externalCompany,
    externalShipName: input.externalShipName,
    externalSailDate: input.externalSailDate,
    departurePort: input.departurePort,
    arrivalPort: input.arrivalPort,
    externalContact: input.externalContact,
    externalPhone: input.externalPhone,
    confirmedCapacity: input.confirmedCapacity,
    agreementNo: input.agreementNo,
    owner: input.owner,
    remark: input.remark,
    status: 'processing',
    actionResults: TRANSFER_ACTION_OPTIONS.map((option) => ({
      key: option.key,
      selected: selected.has(option.key),
      status: selected.has(option.key) ? 'success' : 'skipped',
      operatedAt: selected.has(option.key) ? createdAt : undefined,
    })),
    orders: selected.has('orders_generate') ? buildTransferOrders() : [],
    createdBy: '当前用户',
    createdAt,
    updatedAt: createdAt,
    logs: [
      {
        time: createdAt,
        operator: '当前用户',
        action: '发起外部转船',
        detail: `锁定航次 ${input.voyage.voyageNo}，已执行 ${input.selectedActions.length} 项联动动作。`,
      },
    ],
  }
  cases = [item, ...cases]
  persist()
  return item
}

function resolveHandlingStatus(
  disposition: VoyageTransferDisposition,
  customerConfirmation: VoyageTransferOrder['customerConfirmation'],
): VoyageTransferOrder['handlingStatus'] {
  if (disposition === 'external_transfer') {
    return customerConfirmation === 'agreed' ? 'completed' : 'pending_confirmation'
  }
  if (disposition === 'manual') return 'manual'
  return 'completed'
}

export function updateVoyageTransferOrder(
  caseId: string,
  orderId: string,
  patch: Partial<VoyageTransferOrder>,
) {
  const caseIndex = cases.findIndex((item) => item.id === caseId)
  if (caseIndex === -1) return
  const current = cases[caseIndex]
  const nextOrders = current.orders.map((order) => {
    if (order.id !== orderId) return order
    const next = { ...order, ...patch }
    return {
      ...next,
      handlingStatus: resolveHandlingStatus(next.disposition, next.customerConfirmation),
      updatedAt: nowText(),
    }
  })
  cases[caseIndex] = {
    ...current,
    orders: nextOrders,
    status: nextOrders.every((order) => order.handlingStatus === 'completed' || order.handlingStatus === 'manual')
      ? 'partially_completed'
      : 'processing',
    updatedAt: nowText(),
  }
  persist()
}

export function batchSetVoyageTransferDisposition(
  caseId: string,
  orderIds: string[],
  disposition: VoyageTransferDisposition,
) {
  const caseIndex = cases.findIndex((item) => item.id === caseId)
  if (caseIndex === -1) return
  const selectedIds = new Set(orderIds)
  const current = cases[caseIndex]
  const nextOrders = current.orders.map((order) => {
    if (!selectedIds.has(order.id)) return order
    return {
      ...order,
      disposition,
      handlingStatus: resolveHandlingStatus(disposition, order.customerConfirmation),
      updatedAt: nowText(),
    }
  })
  cases[caseIndex] = {
    ...current,
    orders: nextOrders,
    updatedAt: nowText(),
    logs: [
      ...current.logs,
      {
        time: nowText(),
        operator: '当前用户',
        action: '批量设置处置方式',
        detail: `已将 ${orderIds.length} 笔订单设置为 ${disposition}。`,
      },
    ],
  }
  persist()
}

export function completeVoyageTransferCase(caseId: string) {
  const caseIndex = cases.findIndex((item) => item.id === caseId)
  if (caseIndex === -1) return false
  const current = cases[caseIndex]
  const canComplete = current.orders.length > 0
    && current.orders.every((order) => order.handlingStatus === 'completed' || order.handlingStatus === 'manual')
  if (!canComplete) return false
  const completedAt = nowText()
  cases[caseIndex] = {
    ...current,
    status: 'completed',
    updatedAt: completedAt,
    logs: [
      ...current.logs,
      { time: completedAt, operator: '当前用户', action: '完成转船处置', detail: '全部受影响订单已有明确处置结果。' },
    ],
  }
  persist()
  return true
}
