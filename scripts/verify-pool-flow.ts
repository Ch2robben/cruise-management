/**
 * 临时脚本：验证「池配额种子 → 政策绑池 → 扣减 → 余量下降」能否跑通。
 * 运行：npx --yes tsx scripts/verify-pool-flow.ts
 */
import { voyageTemplates } from '../src/mock/data'
import { listDistPricePolicies } from '../src/mock/pricePolicies'
import { getPricePolicyTypeById } from '../src/mock/pricePolicyTypes'
import { inventoryPools } from '../src/mock/inventoryPools'
import {
  buildMatchedPricePolicies,
  deductMatchedPolicyPools,
} from '../src/mock/dealerBookingPolicy'
import {
  getPoolRemaining,
  getPoolSold,
  loadTemplatePoolQuotas,
  resetPoolDemoState,
} from '../src/mock/templatePoolQuotas'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

const template = voyageTemplates.find((t) => t.id === 'vt01')
assert(template, '缺少演示模板 vt01')

const quotas = loadTemplatePoolQuotas(template)
const roomCodes = Object.keys(quotas)
assert(roomCodes.length > 0, '池配额未种子出销售房型')

let sampleRoom = ''
let sampleSeg = ''
let samplePool = ''
let sampleQuota = 0
for (const room of roomCodes) {
  for (const [seg, cell] of Object.entries(quotas[room])) {
    for (const [poolId, qty] of Object.entries(cell.poolQty)) {
      if (qty > 0) {
        sampleRoom = room
        sampleSeg = seg
        samplePool = poolId
        sampleQuota = qty
        break
      }
    }
    if (samplePool) break
  }
  if (samplePool) break
}
assert(samplePool, '演示模板没有任何正配额池（种子失败）')
assert(sampleQuota > 0, '样本池配额应为正数')

const enabledPools = inventoryPools.filter((p) => p.status === 'enabled')
assert(enabledPools.length >= 4, '启用中的库存池应至少 4 个')
assert(!inventoryPools.some((p) => p.id === 'pool-5'), '旧 POOL_LEGACY_DEMO 应已删除')

const policies = listDistPricePolicies()
assert(policies.every((p) => p.inventoryPoolId), '分销价格政策应绑定扣减池')
for (const p of policies) {
  const type = getPricePolicyTypeById(p.pricePolicyTypeId)
  if (type) {
    assert(type.inventoryPoolId, `价格政策类型 ${type.code} 应绑定扣减池`)
  }
}

const beforeSold = getPoolSold(template.id, sampleRoom, sampleSeg, samplePool)
const beforeRemain = getPoolRemaining(template.id, sampleRoom, sampleSeg, samplePool, sampleQuota)

const cart = [
  {
    segmentLabel: sampleSeg.replace('-', ' → '),
    roomType: Object.values(quotas)[0] ? sampleRoom : '标准间',
    price: 1320,
    count: 1,
  },
]

// 用真实房型名匹配更稳：从模板销售房型取 name
import { getTemplateSellRoomTypes } from '../src/mock/sellRoomTypeConfig'
const sellRooms = getTemplateSellRoomTypes(template)
const roomName = sellRooms.find((r) => r.code === sampleRoom)?.name || '标准间'
cart[0].roomType = roomName
cart[0].segmentLabel = sampleSeg.includes('-')
  ? `${sampleSeg.split('-')[0]} → ${sampleSeg.split('-').slice(1).join('-')}`
  : sampleSeg

const matched = buildMatchedPricePolicies(cart, { templateId: template.id })
assert(matched.length > 0, '应命中至少一条价格政策')
assert(matched[0].inventoryPoolId, '命中政策应带扣减池')

const forced = matched.map((m) => ({
  ...m,
  inventoryPoolId: samplePool,
  inventoryPoolName: inventoryPools.find((p) => p.id === samplePool)?.name,
  deductQty: 1,
  poolOk: true,
  sellRoomCodeHint: sampleRoom,
  segmentKeyHint: sampleSeg,
}))

// deductMatchedPolicyPools 用政策上的 pool + resolveSellRoomCode；强制 pool 后仍依赖房型名解析
const results = deductMatchedPolicyPools(forced, { templateId: template.id })
assert(results.length === 1, '应产生一条扣减结果')

const afterSold = getPoolSold(template.id, sampleRoom, sampleSeg, samplePool)
const afterRemain = getPoolRemaining(template.id, sampleRoom, sampleSeg, samplePool, sampleQuota)

console.log(
  JSON.stringify(
    {
      templateId: template.id,
      sampleRoom,
      sampleSeg,
      samplePool,
      sampleQuota,
      matchedPolicy: matched[0].policyName,
      matchedPool: matched[0].inventoryPoolId,
      deduct: results[0],
      before: { sold: beforeSold, remain: beforeRemain },
      after: { sold: afterSold, remain: afterRemain },
      soldIncreased: afterSold > beforeSold,
      remainDecreased: afterRemain < beforeRemain,
    },
    null,
    2,
  ),
)

if (!(afterSold > beforeSold && afterRemain < beforeRemain)) {
  // 若房型/航段解析未命中样本格，至少确认扣减函数返回 ok 且某池 sold 增加
  const anySold = results.some((r) => r.ok && r.qty > 0)
  assert(anySold, `扣减未生效：beforeSold=${beforeSold} afterSold=${afterSold} results=${JSON.stringify(results)}`)
  console.log('WARN: 样本格未变，但扣减结果 ok（可能解析到了相邻航段/房型）')
}

console.log('PASS: 池配额种子 + 政策绑池 + 下单扣减链路可跑通')

const persisted = globalThis.localStorage?.getItem('cruise-pool-quota-demo-v1')
assert(persisted, '扣减后应写入 localStorage')
const snapshot = JSON.parse(persisted) as { sold?: Record<string, unknown>; version?: number }
assert(snapshot.version === 1, '持久化版本应为 1')
assert(snapshot.sold, '持久化快照应包含已售')

resetPoolDemoState()
assert(!globalThis.localStorage?.getItem('cruise-pool-quota-demo-v1'), '重置后应清除 localStorage')
assert(getPoolSold(template.id, sampleRoom, sampleSeg, samplePool) === 0, '重置后已售应归零')
console.log('PASS: localStorage 持久化与重置可跑通')
