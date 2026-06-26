import { useMemo, useState } from 'react'
import { ArrowLeftRight, RefreshCw, Shuffle, SlidersHorizontal } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import FormDialog from '@/components/common/FormDialog'
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

export default function InventoryAllocationPage() {
  const [pools, setPools] = useState<FloorInventoryPool[]>(() => JSON.parse(JSON.stringify(initialFloorPools)))
  const [rooms, setRooms] = useState<AllocationOrderRoom[]>(() => JSON.parse(JSON.stringify(initialAllocationRooms)))
  const [logs, setLogs] = useState<AllocationLog[]>(() => JSON.parse(JSON.stringify(initialAllocationLogs)))

  const [changeTarget, setChangeTarget] = useState<AllocationOrderRoom | null>(null)
  const [changeFloor, setChangeFloor] = useState('')
  const [swapSource, setSwapSource] = useState<AllocationOrderRoom | null>(null)
  const [swapTargetId, setSwapTargetId] = useState('')

  const pendingRooms = useMemo(() => rooms.filter((r) => r.inventoryStatus === 'oversold_pending' || r.inventoryStatus === 'auto_upgraded'), [rooms])
  const basicPools = useMemo(() => pools.filter((p) => p.tier === 'basic'), [pools])
  const premiumPools = useMemo(() => pools.filter((p) => p.tier === 'premium'), [pools])
  const releasableBasic = useMemo(() => pendingRooms.filter((r) => r.soldFloor === '2F' || r.soldFloor === '3F').length, [pendingRooms])

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

  const openChangeCabin = (room: AllocationOrderRoom) => {
    setChangeTarget(room)
    const options = pools.filter((p) => p.tier === 'premium' && poolAvailable(p) > 0)
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
    const target = premiumPools.find((p) => poolAvailable(p) > 0)
    if (!target) return
    const before = pending.allocatedFloor
    setRooms((prev) =>
      prev.map((room) =>
        room.id === pending.id
          ? { ...room, allocatedFloor: target.floorLabel, inventoryStatus: 'auto_upgraded' }
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
    setPools(JSON.parse(JSON.stringify(initialFloorPools)))
    setRooms(JSON.parse(JSON.stringify(initialAllocationRooms)))
    setLogs(JSON.parse(JSON.stringify(initialAllocationLogs)))
    setChangeTarget(null)
    setSwapSource(null)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="库存调配工作台"
        description="超售场景下的自动升舱、改房型释放基础库存、升舱补差订单对调（排房前操作）"
      />

      <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <strong>{demoVoyage.shipName}</strong> · {demoVoyage.route} · {demoVoyage.sailDate} · 航次 {demoVoyage.voyageNo}
        <span className="ml-3 text-blue-600">基础楼层（2F/3F）已满，高档楼层（4F/5F）仍有余量，存在超售待调配订单。</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="基础楼层可售" value={basicPools.reduce((s, p) => s + poolAvailable(p), 0)} hint="2F + 3F 合计" warning />
        <MetricCard label="待调配房间" value={pendingRooms.length} hint="超售 / 自动升舱" warning={pendingRooms.length > 0} />
        <MetricCard label="可释放基础库存" value={`约 ${releasableBasic} 间`} hint="通过对调或改房型" />
        <MetricCard label="高档楼层可售" value={premiumPools.reduce((s, p) => s + poolAvailable(p), 0)} hint="4F + 5F 合计" />
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
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800">楼层库存池</div>
            <div className="divide-y divide-gray-100">
              {pools.map((pool) => {
                const available = poolAvailable(pool)
                const rate = pool.release > 0 ? Math.round((pool.sold / pool.release) * 100) : 0
                return (
                  <div key={pool.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className={`mr-2 rounded px-1.5 py-0.5 text-[10px] font-medium ${pool.tier === 'basic' ? 'bg-slate-100 text-slate-600' : 'bg-purple-100 text-purple-700'}`}>
                          {pool.tier === 'basic' ? '基础' : '高档'}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{pool.floorLabel} · {pool.cabinType}</span>
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
                    <div className="mt-1 flex justify-between text-xs text-gray-500">
                      <span>已售 {pool.sold} / 投放 {pool.release}</span>
                      {pool.oversellLimit > 0 && <span>可超售 {pool.oversellLimit}</span>}
                    </div>
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
                  {['订单', '团名', '房间', '结算楼层', '占用楼层', '结算价', '状态', '操作'].map((col) => (
                    <th key={col} className="px-3 py-3 text-left font-medium">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 font-mono text-xs">{room.orderNo}</td>
                    <td className="px-3 py-3">{room.groupName}</td>
                    <td className="px-3 py-3">房{room.roomSeq} · {room.guestName}</td>
                    <td className="px-3 py-3">{room.soldFloor} {room.soldCabinType}</td>
                    <td className="px-3 py-3">
                      <span className={room.soldFloor !== room.allocatedFloor ? 'font-medium text-orange-600' : ''}>
                        {room.allocatedFloor} {room.allocatedCabinType}
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
              将订单 <strong>{changeTarget.orderNo}</strong> 房间{changeTarget.roomSeq} 的<strong>实际占用</strong>调整到高档楼层，
              结算仍按 <strong>{changeTarget.soldFloor}</strong> 计价，从而释放基础楼层库存。
            </p>
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
              当前：卖 {changeTarget.soldFloor} / 占 {changeTarget.allocatedFloor} · {formatCurrency(changeTarget.soldPrice)}
            </div>
            <label className="block">
              <span className="mb-1 block text-gray-700">调整到占用楼层</span>
              <select
                value={changeFloor}
                onChange={(e) => setChangeFloor(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              >
                {changeFloorOptions.map((pool) => (
                  <option key={pool.id} value={pool.floorLabel}>
                    {pool.floorLabel}（可售 {poolAvailable(pool)}）
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
              将<strong>超售单</strong>（低价占高档房）与<strong>升舱单</strong>（愿付补差）对调占用楼层，回收升舱差价。
              须在排房前完成。
            </p>
            <div className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-xs text-orange-800">
              源订单：{swapSource.orderNo} 房{swapSource.roomSeq} · 卖{swapSource.soldFloor} 占{swapSource.allocatedFloor}
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
                    {room.orderNo} 房{room.roomSeq} · 卖{room.soldFloor} 占{room.allocatedFloor}
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
                <div>A：占 {swapSource.allocatedFloor} → {swapTarget.allocatedFloor}（仍按 {swapSource.soldFloor} 结算）</div>
                <div>B：占 {swapTarget.allocatedFloor} → {swapSource.allocatedFloor}（仍按 {swapTarget.soldFloor} 结算，补差 ¥{swapTarget.upgradeFee}）</div>
                <div className="mt-2 text-green-700">基础楼层 {swapSource.soldFloor} 释放 1 间可售库存</div>
              </div>
            )}
          </div>
        )}
      </FormDialog>
    </div>
  )
}
