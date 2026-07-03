import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, Link2, Plus, RefreshCw, Shuffle, SlidersHorizontal, Trash2 } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import FormDialog from '@/components/common/FormDialog'
import { voyages } from '@/mock/data'
import {
  demoVoyage,
  initialAllocationLogs,
  initialAllocationRooms,
  initialFloorPools,
  poolAvailable,
  statusClass,
  statusLabel,
  type AllocationLog,
  type AllocationOrderRoom,
  type FloorInventoryPool,
} from '@/mock/inventoryAllocation'
import {
  buildPoolsFromVoyage,
  createEmptyOversellRule,
  getVoyageInventoryRows,
  prepareVoyageWorkbenchState,
  saveVoyageOversellRules,
  type VoyageOversellRule,
} from '@/mock/voyageOversellRules'
import { formatCurrency } from '@/utils/format'

function nowStr() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function MetricCard({ label, value, hint, warning }: { label: string; value: string | number; hint?: string; warning?: boolean }) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${warning ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'}`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${warning ? 'text-orange-600' : 'text-gray-900'}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </div>
  )
}

function loadVoyageState(voyageId: string) {
  const next = prepareVoyageWorkbenchState(voyageId)
  return {
    rules: next.rules,
    pools: next.pools.length > 0 ? next.pools : JSON.parse(JSON.stringify(initialFloorPools)),
    rooms: next.rooms.length > 0 ? next.rooms : JSON.parse(JSON.stringify(initialAllocationRooms)),
    logs: next.logs.length > 0 ? next.logs : JSON.parse(JSON.stringify(initialAllocationLogs)),
  }
}

export default function InventoryAllocationPage() {
  const voyageOptions = useMemo(
    () => voyages
      .filter((item) => item.status === 'ticketing')
      .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [],
  )

  const [selectedVoyageId, setSelectedVoyageId] = useState('v01')
  const selectedVoyage = voyageOptions.find((item) => item.id === selectedVoyageId) || voyageOptions[0]

  const [oversellRules, setOversellRules] = useState<VoyageOversellRule[]>(() => loadVoyageState('v01').rules)
  const [pools, setPools] = useState<FloorInventoryPool[]>(() => loadVoyageState('v01').pools)
  const [rooms, setRooms] = useState<AllocationOrderRoom[]>(() => loadVoyageState('v01').rooms)
  const [logs, setLogs] = useState<AllocationLog[]>(() => loadVoyageState('v01').logs)
  const [rulesDirty, setRulesDirty] = useState(false)

  const [changeTarget, setChangeTarget] = useState<AllocationOrderRoom | null>(null)
  const [changeFloor, setChangeFloor] = useState('')
  const [swapSource, setSwapSource] = useState<AllocationOrderRoom | null>(null)
  const [swapTargetId, setSwapTargetId] = useState('')

  const cabinTypes = useMemo(
    () => getVoyageInventoryRows(selectedVoyageId).map((item) => item.cabinTypeName),
    [selectedVoyageId],
  )

  useEffect(() => {
    const next = loadVoyageState(selectedVoyageId)
    setOversellRules(next.rules)
    setPools(next.pools)
    setRooms(next.rooms)
    setLogs(next.logs)
    setRulesDirty(false)
    setChangeTarget(null)
    setSwapSource(null)
  }, [selectedVoyageId])

  const pendingRooms = useMemo(() => rooms.filter((r) => r.inventoryStatus === 'oversold_pending' || r.inventoryStatus === 'auto_upgraded'), [rooms])
  const basicPools = useMemo(() => pools.filter((p) => p.tier === 'basic'), [pools])
  const premiumPools = useMemo(() => pools.filter((p) => p.tier === 'premium'), [pools])
  const releasableBasic = useMemo(() => pendingRooms.filter((r) => basicPools.some((pool) => pool.floorLabel === r.soldFloor)).length, [basicPools, pendingRooms])

  const swapTarget = useMemo(() => rooms.find((r) => r.id === swapTargetId), [rooms, swapTargetId])
  const swapCandidates = useMemo(() => {
    if (!swapSource) return []
    return rooms.filter((r) => r.id !== swapSource.id && r.roomAssignmentStatus === '待排房')
  }, [rooms, swapSource])

  const changeFloorOptions = useMemo(() => {
    if (!changeTarget) return premiumPools
    const sourcePool = pools.find((p) => p.floorLabel === changeTarget.soldFloor)
    const targetIds = sourcePool?.upgradeTargets ?? premiumPools.map((p) => p.id)
    return pools.filter((p) => targetIds.includes(p.id) && poolAvailable(p) > 0)
  }, [changeTarget, pools, premiumPools])

  const appendLog = (log: Omit<AllocationLog, 'id' | 'operatedAt'>) => {
    setLogs((prev) => [{ ...log, id: `log-${Date.now()}`, operatedAt: nowStr() }, ...prev])
  }

  const adjustPoolSold = (floorLabel: string, delta: number) => {
    setPools((prev) =>
      prev.map((pool) => (pool.floorLabel === floorLabel ? { ...pool, sold: Math.max(0, pool.sold + delta) } : pool)),
    )
  }

  const applyOversellRules = () => {
    saveVoyageOversellRules(selectedVoyageId, oversellRules)
    setPools(buildPoolsFromVoyage(selectedVoyageId, oversellRules))
    setRulesDirty(false)
    appendLog({
      actionType: 'manual_change_cabin',
      actionLabel: '超售关联',
      summary: `更新航次 ${selectedVoyage?.voyageNo || selectedVoyageId} 房型超售关联 ${oversellRules.length} 条`,
      operator: '计调-王敏',
    })
  }

  const updateRule = (ruleId: string, patch: Partial<VoyageOversellRule>) => {
    setOversellRules((prev) => prev.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)))
    setRulesDirty(true)
  }

  const toggleRuleTarget = (ruleId: string, cabinType: string) => {
    setOversellRules((prev) => prev.map((rule) => {
      if (rule.id !== ruleId) return rule
      const exists = rule.targetCabinTypes.includes(cabinType)
      return {
        ...rule,
        targetCabinTypes: exists
          ? rule.targetCabinTypes.filter((item) => item !== cabinType)
          : [...rule.targetCabinTypes, cabinType],
      }
    }))
    setRulesDirty(true)
  }

  const addRule = () => {
    if (cabinTypes.length < 2) return
    setOversellRules((prev) => [...prev, createEmptyOversellRule(cabinTypes)])
    setRulesDirty(true)
  }

  const removeRule = (ruleId: string) => {
    setOversellRules((prev) => prev.filter((rule) => rule.id !== ruleId))
    setRulesDirty(true)
  }

  const openChangeCabin = (room: AllocationOrderRoom) => {
    setChangeTarget(room)
    const sourcePool = pools.find((pool) => pool.floorLabel === room.soldFloor)
    const options = pools.filter((pool) => {
      if (sourcePool?.upgradeTargets.length) return sourcePool.upgradeTargets.includes(pool.id) && poolAvailable(pool) > 0
      return pool.tier === 'premium' && poolAvailable(pool) > 0
    })
    setChangeFloor(options[0]?.floorLabel ?? '')
  }

  const confirmChangeCabin = () => {
    if (!changeTarget || !changeFloor) return
    const beforeAlloc = changeTarget.allocatedFloor
    setRooms((prev) =>
      prev.map((room) =>
        room.id === changeTarget.id
          ? {
              ...room,
              allocatedFloor: changeFloor,
              allocatedCabinType: changeFloor,
              inventoryStatus: room.soldFloor === changeFloor ? 'normal' : 'auto_upgraded',
            }
          : room,
      ),
    )
    if (beforeAlloc !== changeFloor) {
      adjustPoolSold(beforeAlloc, -1)
      adjustPoolSold(changeFloor, 1)
    }
    appendLog({
      actionType: 'manual_change_cabin',
      actionLabel: '改房型',
      summary: `订单 ${changeTarget.orderNo} 房间${changeTarget.roomSeq}：占用 ${beforeAlloc} → ${changeFloor}，结算仍按 ${changeTarget.soldFloor} ¥${changeTarget.soldPrice}`,
      operator: '计调-王敏',
    })
    setChangeTarget(null)
  }

  const openSwap = (room: AllocationOrderRoom) => {
    setSwapSource(room)
    const candidate = rooms.find((r) => r.id !== room.id && r.upgradeFee > 0)
    setSwapTargetId(candidate?.id ?? '')
  }

  const confirmSwap = () => {
    if (!swapSource || !swapTarget) return
    const a = swapSource
    const b = swapTarget
    if (a.roomAssignmentStatus !== '待排房' || b.roomAssignmentStatus !== '待排房') return

    setRooms((prev) =>
      prev.map((room) => {
        if (room.id === a.id) {
          return {
            ...room,
            allocatedFloor: b.allocatedFloor,
            allocatedCabinType: b.allocatedCabinType,
            inventoryStatus: 'swapped',
            upgradeFee: 0,
          }
        }
        if (room.id === b.id) {
          return {
            ...room,
            allocatedFloor: a.allocatedFloor,
            allocatedCabinType: a.allocatedCabinType,
            inventoryStatus: 'swapped',
          }
        }
        return room
      }),
    )

    appendLog({
      actionType: 'order_swap',
      actionLabel: '订单对调',
      summary: `对调 ${a.orderNo}-房${a.roomSeq}（${a.soldFloor}价占${a.allocatedFloor}）与 ${b.orderNo}-房${b.roomSeq}（${b.soldFloor}价占${b.allocatedFloor}），回收升舱补差 ¥${b.upgradeFee}`,
      operator: '计调-王敏',
    })
    setSwapSource(null)
    setSwapTargetId('')
  }

  const runAutoUpgradeDemo = () => {
    const pending = rooms.find((r) => r.inventoryStatus === 'oversold_pending')
    if (!pending) return
    const sourcePool = pools.find((pool) => pool.floorLabel === pending.soldFloor)
    const target = pools.find((pool) => sourcePool?.upgradeTargets.includes(pool.id) && poolAvailable(pool) > 0)
      || premiumPools.find((pool) => poolAvailable(pool) > 0)
    if (!target) return
    const before = pending.allocatedFloor
    setRooms((prev) =>
      prev.map((room) =>
        room.id === pending.id
          ? {
              ...room,
              allocatedFloor: target.floorLabel,
              allocatedCabinType: target.cabinType,
              inventoryStatus: 'auto_upgraded',
            }
          : room,
      ),
    )
    if (before !== target.floorLabel) {
      adjustPoolSold(before, -1)
      adjustPoolSold(target.floorLabel, 1)
    }
    appendLog({
      actionType: 'auto_upgrade',
      actionLabel: '自动升舱',
      summary: `订单 ${pending.orderNo} 房间${pending.roomSeq}：${pending.soldFloor} 库存不足，自动占用 ${target.floorLabel}，结算仍按 ${pending.soldFloor}`,
      operator: '系统',
    })
  }

  const resetDemo = () => {
    const next = loadVoyageState(selectedVoyageId)
    setOversellRules(next.rules)
    setPools(next.pools)
    setRooms(next.rooms)
    setLogs(next.logs)
    setRulesDirty(false)
    setChangeTarget(null)
    setSwapSource(null)
  }

  const voyageBanner = selectedVoyage
    ? `${selectedVoyage.shipName} · ${selectedVoyage.routeName} · ${selectedVoyage.startDate} · 航次 ${selectedVoyage.voyageNo}`
    : `${demoVoyage.shipName} · ${demoVoyage.route} · ${demoVoyage.sailDate} · 航次 ${demoVoyage.voyageNo}`

  return (
    <div className="space-y-5">
      <PageHeader
        title="库存调配工作台"
        description="配置房型超售关联，并在超售场景下执行自动升舱、改房型释放库存、升舱补差订单对调（排房前操作）"
      />

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex min-w-[280px] flex-col gap-1.5">
            <span className="text-xs text-gray-500">选择航次</span>
            <select
              value={selectedVoyageId}
              onChange={(event) => setSelectedVoyageId(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {voyageOptions.map((voyage) => (
                <option key={voyage.id} value={voyage.id}>
                  {voyage.voyageNo} · {voyage.startDate} · {voyage.shipName}
                </option>
              ))}
            </select>
          </label>
          {selectedVoyage && (
            <div className="text-sm text-gray-600">
              <span className="text-gray-500">产品：</span>{selectedVoyage.productName}
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-gray-500">可售舱位：</span>{selectedVoyage.availableCabins}
            </div>
          )}
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Link2 className="h-4 w-4 text-blue-600" />
            房型超售关联
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addRule}
              disabled={cabinTypes.length < 2}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-300 bg-white px-3 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" /> 新增关联
            </button>
            <button
              type="button"
              onClick={applyOversellRules}
              disabled={!rulesDirty}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-blue-600 px-3 text-xs text-white hover:bg-blue-700 disabled:opacity-40"
            >
              保存并应用
            </button>
          </div>
        </div>

        <p className="border-b border-gray-100 px-4 py-2 text-xs text-gray-500">
          将售卖房型关联到可占用房型：当售卖房型库存售罄后，可继续超售并按关联顺序占用高档房型，结算仍按原售卖房型计价。
        </p>

        {cabinTypes.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-gray-400">当前航次暂无库存房型数据</div>
        ) : oversellRules.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-gray-400">
            尚未配置超售关联，点击「新增关联」添加规则
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-white text-xs text-gray-500">
                  <th className="px-4 py-3 text-left font-medium">售卖房型</th>
                  <th className="px-4 py-3 text-left font-medium">关联占用房型</th>
                  <th className="px-4 py-3 text-left font-medium">超售上限</th>
                  <th className="px-4 py-3 text-left font-medium">说明</th>
                  <th className="px-4 py-3 text-center font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {oversellRules.map((rule) => {
                  const targetOptions = cabinTypes.filter((name) => name !== rule.sellCabinType)
                  return (
                    <tr key={rule.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <select
                          value={rule.sellCabinType}
                          onChange={(event) => updateRule(rule.id, {
                            sellCabinType: event.target.value,
                            targetCabinTypes: rule.targetCabinTypes.filter((item) => item !== event.target.value),
                          })}
                          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                        >
                          {cabinTypes.map((name) => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {targetOptions.map((name) => (
                            <label key={name} className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-1 text-xs">
                              <input
                                type="checkbox"
                                checked={rule.targetCabinTypes.includes(name)}
                                onChange={() => toggleRuleTarget(rule.id, name)}
                                className="rounded border-gray-300 text-blue-600"
                              />
                              {name}
                            </label>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          value={rule.oversellLimit}
                          onChange={(event) => updateRule(rule.id, { oversellLimit: Math.max(0, Number(event.target.value) || 0) })}
                          className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {rule.targetCabinTypes.length > 0
                          ? `${rule.sellCabinType} 售罄后可超售 ${rule.oversellLimit} 间，依次占用 ${rule.targetCabinTypes.join(' → ')}`
                          : '请至少选择一个关联占用房型'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeRule(rule.id)}
                          className="inline-flex items-center gap-1 rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" /> 删除
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <strong>{voyageBanner}</strong>
        <span className="ml-3 text-blue-600">
          {basicPools.some((pool) => poolAvailable(pool) === 0 && pool.oversellLimit > 0)
            ? '基础房型已满或触发超售，存在待调配订单。'
            : '已加载当前航次房型库存与超售关联规则。'}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="基础房型可售" value={basicPools.reduce((s, p) => s + poolAvailable(p), 0)} hint="含超售额度" warning />
        <MetricCard label="待调配房间" value={pendingRooms.length} hint="超售 / 自动升舱" warning={pendingRooms.length > 0} />
        <MetricCard label="可释放基础库存" value={`约 ${releasableBasic} 间`} hint="通过对调或改房型" />
        <MetricCard label="高档房型可售" value={premiumPools.reduce((s, p) => s + poolAvailable(p), 0)} hint="关联占用来源" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={runAutoUpgradeDemo}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-4 text-sm text-white hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" /> 模拟自动升舱
        </button>
        <button
          type="button"
          onClick={resetDemo}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 text-sm text-gray-700 hover:bg-gray-50"
        >
          重置 Demo 数据
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        <section className="xl:col-span-2 space-y-4">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800">房型库存池</div>
            <div className="divide-y divide-gray-100">
              {pools.map((pool) => {
                const available = poolAvailable(pool)
                const rate = pool.release > 0 ? Math.round((pool.sold / pool.release) * 100) : 0
                const linkedNames = pool.upgradeTargets
                  .map((targetId) => pools.find((item) => item.id === targetId)?.cabinType)
                  .filter(Boolean)
                return (
                  <div key={pool.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className={`mr-2 rounded px-1.5 py-0.5 text-[10px] font-medium ${pool.tier === 'basic' ? 'bg-slate-100 text-slate-600' : 'bg-purple-100 text-purple-700'}`}>
                          {pool.tier === 'basic' ? '基础' : '高档'}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{pool.cabinType}</span>
                      </div>
                      <span className={`text-xs font-medium ${available === 0 ? 'text-red-600' : 'text-green-600'}`}>
                        可售 {available}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${rate >= 100 ? 'bg-red-500' : rate >= 85 ? 'bg-orange-400' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(rate, 100)}%` }}
                      />
                    </div>
                    <div className="mt-1 flex flex-wrap justify-between gap-1 text-xs text-gray-500">
                      <span>已售 {pool.sold} / 投放 {pool.release}</span>
                      {pool.oversellLimit > 0 && <span>可超售 {pool.oversellLimit}</span>}
                    </div>
                    {linkedNames.length > 0 && (
                      <div className="mt-1 text-xs text-blue-600">
                        关联占用：{linkedNames.join('、')}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="xl:col-span-3 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
            <div className="text-sm font-semibold text-gray-800">待调配 / 全部房间占用</div>
            <span className="text-xs text-gray-500">排房前可操作</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-white text-xs text-gray-500">
                  {['订单', '团名', '房间', '结算房型', '占用房型', '结算价', '状态', '操作'].map((col) => (
                    <th key={col} className="px-3 py-3 text-left font-medium">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rooms.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-12 text-center text-sm text-gray-400">
                      当前航次暂无待调配演示订单
                    </td>
                  </tr>
                ) : rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 font-mono text-xs">{room.orderNo}</td>
                    <td className="px-3 py-3">{room.groupName}</td>
                    <td className="px-3 py-3">房{room.roomSeq} · {room.guestName}</td>
                    <td className="px-3 py-3">{room.soldCabinType}</td>
                    <td className="px-3 py-3">
                      <span className={room.soldCabinType !== room.allocatedCabinType ? 'font-medium text-orange-600' : ''}>
                        {room.allocatedCabinType}
                      </span>
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      {formatCurrency(room.soldPrice)}
                      {room.upgradeFee > 0 && <span className="ml-1 text-xs text-green-600">+{room.upgradeFee}</span>}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusClass(room.inventoryStatus)}`}>
                        {statusLabel(room.inventoryStatus)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          disabled={room.roomAssignmentStatus !== '待排房'}
                          onClick={() => openChangeCabin(room)}
                          className="inline-flex items-center gap-0.5 rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                        >
                          <SlidersHorizontal className="h-3 w-3" /> 改房型
                        </button>
                        <button
                          type="button"
                          disabled={room.roomAssignmentStatus !== '待排房'}
                          onClick={() => openSwap(room)}
                          className="inline-flex items-center gap-0.5 rounded border border-blue-200 px-2 py-1 text-xs text-blue-700 hover:bg-blue-50 disabled:opacity-40"
                        >
                          <Shuffle className="h-3 w-3" /> 对调
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800">调配操作日志</div>
        <div className="divide-y divide-gray-100">
          {logs.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">暂无操作记录</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">{log.actionLabel}</span>
                    <span className="text-gray-800">{log.summary}</span>
                  </div>
                </div>
                <div className="shrink-0 text-xs text-gray-500">{log.operator} · {log.operatedAt}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <FormDialog
        open={!!changeTarget}
        title="改房型 / 释放基础库存"
        width="max-w-lg"
        onCancel={() => setChangeTarget(null)}
        onSubmit={confirmChangeCabin}
      >
        {changeTarget && (
          <div className="space-y-4 text-sm">
            <p className="text-gray-600">
              将订单 <strong>{changeTarget.orderNo}</strong> 房间{changeTarget.roomSeq} 的<strong>实际占用</strong>调整到关联房型，
              结算仍按 <strong>{changeTarget.soldCabinType}</strong> 计价，从而释放基础房型库存。
            </p>
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
              当前：卖 {changeTarget.soldCabinType} / 占 {changeTarget.allocatedCabinType} · {formatCurrency(changeTarget.soldPrice)}
            </div>
            <label className="block">
              <span className="mb-1 block text-gray-700">调整到占用房型</span>
              <select
                value={changeFloor}
                onChange={(e) => setChangeFloor(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              >
                {changeFloorOptions.map((pool) => (
                  <option key={pool.id} value={pool.floorLabel}>
                    {pool.cabinType}（可售 {poolAvailable(pool)}）
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </FormDialog>

      <FormDialog
        open={!!swapSource}
        title="升舱补差 · 订单对调"
        width="max-w-2xl"
        onCancel={() => setSwapSource(null)}
        onSubmit={confirmSwap}
      >
        {swapSource && (
          <div className="space-y-4 text-sm">
            <p className="text-gray-600">
              将<strong>超售单</strong>（低价占高档房）与<strong>升舱单</strong>（愿付补差）对调占用房型，回收升舱差价。
              须在排房前完成。
            </p>
            <div className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-xs text-orange-800">
              源订单：{swapSource.orderNo} 房{swapSource.roomSeq} · 卖{swapSource.soldCabinType} 占{swapSource.allocatedCabinType}
            </div>
            <label className="block">
              <span className="mb-1 block text-gray-700">选择对调目标订单</span>
              <select
                value={swapTargetId}
                onChange={(e) => setSwapTargetId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="">请选择</option>
                {swapCandidates.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.orderNo} 房{room.roomSeq} · 卖{room.soldCabinType} 占{room.allocatedCabinType}
                    {room.upgradeFee > 0 ? ` · 补差¥${room.upgradeFee}` : ''}
                  </option>
                ))}
              </select>
            </label>
            {swapSource && swapTarget && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                <div className="mb-2 flex items-center gap-2 font-medium text-gray-900">
                  <ArrowLeftRight className="h-4 w-4" /> 对调预览
                </div>
                <div>A：占 {swapSource.allocatedCabinType} → {swapTarget.allocatedCabinType}（仍按 {swapSource.soldCabinType} 结算）</div>
                <div>B：占 {swapTarget.allocatedCabinType} → {swapSource.allocatedCabinType}（仍按 {swapTarget.soldCabinType} 结算，补差 ¥{swapTarget.upgradeFee}）</div>
                <div className="mt-2 text-green-700">基础房型 {swapSource.soldCabinType} 释放 1 间可售库存</div>
              </div>
            )}
          </div>
        )}
      </FormDialog>
    </div>
  )
}
