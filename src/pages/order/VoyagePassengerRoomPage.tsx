import { useMemo, useState } from 'react'
import { RotateCcw, Search } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import RoomAllocationDialogs, { RoomAllocationActionButtons } from '@/components/order/RoomAllocationDialogs'
import { listAllocatableRooms, type AllocatableRoomRef } from '@/components/order/roomAllocationUtils'
import {
  buildVoyagePassengerRoomRows,
  buildVoyageSummaries,
  filterPassengerRows,
} from '@/components/order/voyagePassengerRoom'
import { initialOrders } from '@/mock/orderListData'
import { statusClass, statusLabel } from '@/mock/inventoryAllocation'

export default function VoyagePassengerRoomPage() {
  const [orders, setOrders] = useState(initialOrders)
  const [voyageNo, setVoyageNo] = useState('全部')
  const [keyword, setKeyword] = useState('')
  const [onlyMismatch, setOnlyMismatch] = useState(false)
  const [onlyPendingAssignment, setOnlyPendingAssignment] = useState(false)
  const [page, setPage] = useState(1)
  const [changeTarget, setChangeTarget] = useState<AllocatableRoomRef | null>(null)
  const [swapSource, setSwapSource] = useState<AllocatableRoomRef | null>(null)

  const voyages = useMemo(() => buildVoyageSummaries(orders), [orders])
  const allRows = useMemo(() => buildVoyagePassengerRoomRows(orders), [orders])
  const allRooms = useMemo(() => listAllocatableRooms(orders), [orders])
  const roomRefMap = useMemo(
    () => new Map(allRooms.map((room) => [`${room.orderId}:${room.lineId}`, room])),
    [allRooms],
  )

  const filteredRows = useMemo(() => {
    let rows = filterPassengerRows(allRows, voyageNo, keyword)
    if (onlyMismatch) rows = rows.filter((row) => row.allocationDiffers)
    if (onlyPendingAssignment) rows = rows.filter((row) => row.roomAssignmentStatus === '待排房')
    return rows
  }, [allRows, voyageNo, keyword, onlyMismatch, onlyPendingAssignment])

  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)

  const resetFilters = () => {
    setVoyageNo('全部')
    setKeyword('')
    setOnlyMismatch(false)
    setOnlyPendingAssignment(false)
    setPage(1)
  }

  return (
    <div>
      <PageHeader
        title="航次旅客房型管理"
        description="查看各航次旅客的下单房型、占用房型与排房房型，支持改房型与订单对调"
      />

      <div className="border-b border-gray-200 bg-white px-9 py-6">
        <div className="flex flex-wrap items-end gap-4">
          <label className="min-w-[160px]">
            <span className="mb-1.5 block text-xs text-gray-500">航次号</span>
            <select
              value={voyageNo}
              onChange={(event) => {
                setVoyageNo(event.target.value)
                setPage(1)
              }}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-500"
            >
              <option value="全部">全部</option>
              {voyages.map((voyage) => (
                <option key={voyage.voyageNo} value={voyage.voyageNo}>
                  {voyage.voyageNo} · {voyage.ship}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-[220px] flex-1">
            <span className="mb-1.5 block text-xs text-gray-500">旅客 / 订单 / 团名 / 游轮</span>
            <input
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value)
                setPage(1)
              }}
              placeholder="请输入"
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-700 outline-none focus:border-blue-500"
            />
          </label>
          <label className="inline-flex h-11 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={onlyMismatch}
              onChange={(event) => {
                setOnlyMismatch(event.target.checked)
                setPage(1)
              }}
            />
            仅看占用异常
          </label>
          <label className="inline-flex h-11 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={onlyPendingAssignment}
              onChange={(event) => {
                setOnlyPendingAssignment(event.target.checked)
                setPage(1)
              }}
            />
            仅看待排房
          </label>
          <button
            type="button"
            onClick={() => setPage(1)}
            className="inline-flex h-11 min-w-[90px] items-center justify-center gap-2 rounded-md bg-blue-600 px-6 text-base font-medium text-white hover:bg-blue-700"
          >
            <Search className="h-4 w-4" />
            搜索
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-11 min-w-[90px] items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-6 text-base text-gray-600 hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" />
            重置
          </button>
        </div>
      </div>

      <div className="overflow-hidden border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[1580px] border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['航次', '游轮', '开航日期', '订单号', '团名', '房间', '旅客', '序位', '年龄段', '入住类型', '下单房型', '占用房型', '排房房型', '排房状态', '调配状态', '操作'].map((col) => (
                  <th
                    key={col}
                    className="h-14 border-b border-r border-gray-200 px-4 text-left align-middle text-sm font-semibold text-gray-900 last:border-r-0"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={16} className="border-b border-gray-200 px-4 py-12 text-center text-sm text-gray-400">
                    暂无符合条件的旅客记录
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => {
                  const roomRef = row.isRoomLeader ? roomRefMap.get(`${row.orderId}:${row.lineId}`) : undefined
                  return (
                    <tr key={row.id} className="transition hover:bg-gray-50">
                      <td className="border-b border-r border-gray-200 px-4 py-4 font-mono text-xs text-gray-700">{row.voyageNo}</td>
                      <td className="border-b border-r border-gray-200 px-4 py-4 whitespace-nowrap text-gray-700">{row.ship}</td>
                      <td className="border-b border-r border-gray-200 px-4 py-4 whitespace-nowrap text-gray-700">{row.sailDate}</td>
                      <td className="border-b border-r border-gray-200 px-4 py-4 font-mono text-xs text-gray-700">{row.orderNo}</td>
                      <td className="border-b border-r border-gray-200 px-4 py-4 text-gray-700">{row.groupName}</td>
                      <td className="border-b border-r border-gray-200 px-4 py-4 text-gray-700">房{row.roomSeq}</td>
                      <td className="border-b border-r border-gray-200 px-4 py-4 font-medium text-gray-900">{row.guestName}</td>
                      <td className="border-b border-r border-gray-200 px-4 py-4 text-gray-700">第{row.slotIndex}人</td>
                      <td className="border-b border-r border-gray-200 px-4 py-4 text-gray-700">{row.ageGroup}</td>
                      <td className="border-b border-r border-gray-200 px-4 py-4 text-gray-700">{row.occupancyType}</td>
                      <td className="border-b border-r border-gray-200 px-4 py-4 text-gray-700">{row.soldLabel}</td>
                      <td className={`border-b border-r border-gray-200 px-4 py-4 ${row.allocationDiffers ? 'font-medium text-orange-600' : 'text-gray-700'}`}>
                        {row.allocatedLabel}
                      </td>
                      <td className="border-b border-r border-gray-200 px-4 py-4 text-gray-700">
                        {row.assignedLabel === '待排房' ? (
                          <span className="text-gray-400">待排房</span>
                        ) : (
                          <span className="font-mono text-xs">{row.assignedLabel}</span>
                        )}
                      </td>
                      <td className="border-b border-r border-gray-200 px-4 py-4 text-gray-700">{row.roomAssignmentStatus}</td>
                      <td className="border-b border-r border-gray-200 px-4 py-4">
                        <span className={`rounded px-2 py-1 text-xs font-medium ${statusClass(row.inventoryStatus)}`}>
                          {statusLabel(row.inventoryStatus)}
                        </span>
                      </td>
                      <td className="border-b border-gray-200 px-4 py-4">
                        {roomRef ? (
                          <RoomAllocationActionButtons
                            room={roomRef}
                            onChangeCabin={setChangeTarget}
                            onSwap={setSwapSource}
                          />
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 px-9 py-8 text-gray-500">
          <span className="text-sm">共 {filteredRows.length} 条记录 第 {page} / {totalPages} 页</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="flex h-10 min-w-[72px] items-center justify-center rounded border border-gray-200 bg-white px-4 text-sm hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              上一页
            </button>
            <span className="flex h-10 w-10 items-center justify-center rounded border border-blue-600 bg-blue-600 text-sm text-white">
              {page}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="flex h-10 min-w-[72px] items-center justify-center rounded border border-gray-200 bg-white px-4 text-sm hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      <RoomAllocationDialogs
        orders={orders}
        allRooms={allRooms}
        changeTarget={changeTarget}
        swapSource={swapSource}
        onCloseChange={() => setChangeTarget(null)}
        onCloseSwap={() => setSwapSource(null)}
        onOrdersChange={setOrders}
      />
    </div>
  )
}
