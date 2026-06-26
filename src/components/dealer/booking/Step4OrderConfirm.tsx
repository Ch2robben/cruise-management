import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { DealerBookingDraft } from '@/components/dealer/booking/bookingTypes'
import {
  buildMatchedPricePolicies,
  defaultMatchedPolicies,
  policyTypeClass,
  type MatchedPricePolicy,
} from '@/mock/dealerBookingPolicy'
import { defaultRoomReserveData } from '@/mock/data'
import { resolveGuestPriceInfo } from '@/components/dealer/booking/guestPricingUtils'
import { formatCurrency } from '@/utils/format'

function FieldItem({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-3 py-2 text-sm">
      <span className="w-20 shrink-0 text-gray-500">{label}</span>
      <span className={`min-w-0 text-gray-900 ${mono ? 'font-mono' : 'font-medium'}`}>{value || '-'}</span>
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-center">
      <div className="text-xl font-semibold tabular-nums text-gray-900">{value}</div>
      <div className="mt-1 text-xs text-gray-500">{label}</div>
    </div>
  )
}

function cartLinePax(roomType: string, count: number) {
  return roomType === '标准间' ? count * 2 : count
}

function cartLineDeposit(line: { roomType: string; deposit: number; count: number }) {
  if (line.roomType === '标准间') return line.deposit * 2 * line.count
  return line.deposit * line.count
}

const defaultFeeRows = [
  { segment: '重庆 → 宜昌', roomType: '标准间', ageGroup: '成人', occupancy: '标准', price: 2980, count: 4, subtotal: 11920 },
  { segment: '重庆 → 宜昌', roomType: '标准间', ageGroup: '儿童', occupancy: '不占床', price: 1500, count: 1, subtotal: 1500 },
  { segment: '丰都 → 奉节', roomType: '豪华套房', ageGroup: '成人', occupancy: '单间', price: 6880, count: 1, subtotal: 6880 },
]

interface TouristGuestLike {
  id: number
  name: string
  ageGroup: string
  gender: string
  stayType: string
  nationality: string
  idType: string
  idNum: string
  guestType: string
}

interface RoomGroupLike {
  id: string
  roomSeq: string
  roomType: string
  teamId?: string
  segmentLabel: string
  guests: TouristGuestLike[]
}

interface TeamLike {
  id: string
  name: string
  remark?: string
}

interface PriceRosterRow {
  key: string
  roomType: string
  ageGroup: string
  stayType: string
  price: number
  count: number
  subtotal: number
}

interface PriceGuestRow {
  key: string
  teamId: string
  teamName: string
  roomSeq: string
  roomType: string
  name: string
  ageGroup: string
  gender: string
  stayType: string
  priceTypeLabel: string
  ticketPrice: number
}

function getRoomBasePrice(roomType: string, rooms?: DealerBookingDraft['rooms']) {
  return rooms?.[roomType]?.price ?? defaultRoomReserveData[roomType as keyof typeof defaultRoomReserveData]?.price ?? 0
}

export default function Step4OrderConfirm({
  data,
  onNext,
  onPrev,
}: {
  data?: DealerBookingDraft
  onNext: () => void
  onPrev: () => void
}) {
  const [guestListExpanded, setGuestListExpanded] = useState(false)
  const cart = data?.cart ?? []
  const hasCart = cart.length > 0
  const roomGroups = (data?.touristData?.roomGroups ?? []) as RoomGroupLike[]
  const teams = (data?.touristData?.teams ?? []) as TeamLike[]

  const matchedPolicies: MatchedPricePolicy[] =
    data?.matchedPolicies ?? (hasCart ? buildMatchedPricePolicies(cart) : defaultMatchedPolicies())

  const totalRooms = hasCart ? cart.reduce((sum, line) => sum + line.count, 0) : 3
  const totalPax = hasCart ? cart.reduce((sum, line) => sum + cartLinePax(line.roomType, line.count), 0) : 5
  const totalAmount = hasCart
    ? cart.reduce((sum, line) => sum + line.price * line.count, 0)
    : defaultFeeRows.reduce((sum, row) => sum + row.subtotal, 0)
  const deposit = hasCart ? cart.reduce((sum, line) => sum + cartLineDeposit(line), 0) : 3900
  const totalDiscount = matchedPolicies.reduce((sum, policy) => sum + policy.discountAmount, 0)

  const bookedSegments = hasCart
    ? [...new Set(cart.map((line) => line.segmentLabel))]
    : ['重庆 → 宜昌', '丰都 → 奉节']

  const feeRows = hasCart
    ? cart.map((line) => ({
        segment: line.segmentLabel,
        roomType: line.roomType,
        ageGroup: '预估',
        occupancy: line.bedType,
        price: line.price,
        count: cartLinePax(line.roomType, line.count),
        subtotal: line.price * line.count,
      }))
    : defaultFeeRows

  const priceGuestRows = useMemo<PriceGuestRow[]>(() => {
    const teamMap = new Map(teams.map((team) => [team.id, team.name]))
    return roomGroups.flatMap((room) => {
      const basePrice = getRoomBasePrice(room.roomType, data?.rooms)
      return room.guests.map((guest, index) => {
        const priceInfo = resolveGuestPriceInfo(guest, room, index, basePrice)
        return {
          key: `${room.id}-${guest.id}`,
          teamId: room.teamId || 'default',
          teamName: teamMap.get(room.teamId || '') || '默认团',
          roomSeq: room.roomSeq,
          roomType: room.roomType,
          name: guest.name || `游客${index + 1}`,
          ageGroup: guest.ageGroup || '-',
          gender: guest.gender || '-',
          stayType: guest.stayType || '-',
          priceTypeLabel: priceInfo.priceTypeLabel,
          ticketPrice: priceInfo.ticketPrice,
        }
      })
    })
  }, [roomGroups, teams, data?.rooms])

  const guestRowsByTeam = useMemo(() => {
    const grouped = new Map<string, { teamName: string; rows: PriceGuestRow[] }>()
    priceGuestRows.forEach((row) => {
      const existing = grouped.get(row.teamId)
      if (existing) {
        existing.rows.push(row)
        return
      }
      grouped.set(row.teamId, { teamName: row.teamName, rows: [row] })
    })
    return Array.from(grouped.entries()).map(([teamId, value]) => ({
      teamId,
      teamName: value.teamName,
      rows: value.rows,
    }))
  }, [priceGuestRows])

  const priceRosterRows = useMemo<PriceRosterRow[]>(() => {
    const grouped = new Map<string, PriceRosterRow>()

    roomGroups.forEach((room) => {
      const basePrice = getRoomBasePrice(room.roomType, data?.rooms)
      room.guests.forEach((guest, index) => {
        const priceInfo = resolveGuestPriceInfo(guest, room, index, basePrice)
        const key = [room.roomType, guest.ageGroup, guest.stayType, priceInfo.ticketPrice].join('|')
        const existing = grouped.get(key)

        if (existing) {
          existing.count += 1
          existing.subtotal += priceInfo.ticketPrice
          return
        }

        grouped.set(key, {
          key,
          roomType: room.roomType,
          ageGroup: guest.ageGroup || '-',
          stayType: guest.stayType || '-',
          price: priceInfo.ticketPrice,
          count: 1,
          subtotal: priceInfo.ticketPrice,
        })
      })
    })

    return Array.from(grouped.values())
  }, [roomGroups, data?.rooms])

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">订单确认</h2>
          <p className="mt-1 text-sm text-gray-500">请核对预定信息，确认无误后支付定金</p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100 sm:grid-cols-4">
          <div className="px-5 py-4">
            <div className="text-xs text-gray-500">订单状态</div>
            <div className="mt-1 text-sm font-semibold text-orange-600">待支付定金</div>
          </div>
          <div className="px-5 py-4">
            <div className="text-xs text-gray-500">订单总额</div>
            <div className="mt-1 text-sm font-semibold tabular-nums text-blue-600">{formatCurrency(totalAmount)}</div>
          </div>
          <div className="px-5 py-4">
            <div className="text-xs text-gray-500">需支付定金</div>
            <div className="mt-1 text-sm font-semibold tabular-nums text-orange-600">{formatCurrency(deposit)}</div>
          </div>
          <div className="px-5 py-4">
            <div className="text-xs text-gray-500">总人数 / 房间</div>
            <div className="mt-1 text-sm font-semibold tabular-nums text-gray-900">
              {totalPax} 人 · {totalRooms} 间
            </div>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-800">订单信息</h3>
          </div>
          <div className="grid gap-x-10 px-5 py-2 sm:grid-cols-2">
            <FieldItem label="订单号" value="#CZ20260615001" mono />
            <FieldItem label="预订时间" value="2026-06-08 14:30" />
            <FieldItem label="订单类型" value="普通订单" />
            <FieldItem label="分销商" value="同业分销" />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-800">人数信息</h3>
          </div>
          <div className="grid grid-cols-4 gap-3 p-5">
            <StatCell label="总人数" value={totalPax} />
            <StatCell label="成人" value={hasCart ? totalPax : 4} />
            <StatCell label="儿童" value={hasCart ? 0 : 1} />
            <StatCell label="房间数" value={totalRooms} />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white lg:col-span-2">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-800">航次信息</h3>
          </div>
          <div className="grid gap-x-10 px-5 py-2 sm:grid-cols-2 lg:grid-cols-4">
            <FieldItem label="游轮" value="长江叁号" />
            <FieldItem label="航次号" value="V20260615" mono />
            <FieldItem label="航线" value="重庆 → 宜昌" />
            <FieldItem label="预订航段" value={bookedSegments.join('、')} />
            <FieldItem label="行程天数" value="4 天 3 晚" />
            <FieldItem label="出发港" value="重庆" />
            <FieldItem label="终到港" value="宜昌" />
            <FieldItem label="开船日期" value="2026-06-15" />
            <FieldItem label="离船日期" value="2026-06-18" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-blue-200 bg-white">
        <div className="border-b border-blue-100 bg-blue-50 px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-blue-900">命中的价格政策</h3>
            <span className="text-xs text-blue-700">
              共命中 {matchedPolicies.length} 条 · 政策优惠合计 {formatCurrency(totalDiscount)}
            </span>
          </div>
          <p className="mt-1 text-xs text-blue-600/80">
            结算价已按当前命中的价格政策计算；名额超额时将自动回退至下一优先级政策
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-white">
                {['航段', '房型', '命中政策', '类型', '优先级', '优惠', '结算价', '名额', '有效期'].map((col) => (
                  <th
                    key={col}
                    className={`px-4 py-3 text-xs font-medium text-gray-500 ${
                      ['优惠', '结算价', '优先级'].includes(col) ? 'text-right' : 'text-left'
                    }`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {matchedPolicies.map((policy) => (
                <tr key={policy.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800 whitespace-nowrap">{policy.segmentLabel}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{policy.roomType}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{policy.policyName}</div>
                    <div className="mt-0.5 font-mono text-xs text-gray-400">{policy.policyCode}</div>
                    {policy.fallbackPolicy && (
                      <div className="mt-1 text-xs text-gray-500">回退：{policy.fallbackPolicy}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${policyTypeClass[policy.policyType]}`}>
                      {policy.policyType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">{policy.priority}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-green-600">
                    -{formatCurrency(policy.discountAmount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                    {formatCurrency(policy.settlementPrice)}
                  </td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{policy.quotaLabel}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{policy.validPeriod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-800">费用信息</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-white">
                {['航段', '房型', '年龄段', '入住类型', '结算价', '人数', '小计'].map((col) => (
                  <th
                    key={col}
                    className={`px-4 py-3 text-xs font-medium text-gray-500 ${
                      ['结算价', '人数', '小计'].includes(col) ? 'text-right' : 'text-left'
                    }`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {feeRows.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800 whitespace-nowrap">{row.segment}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.roomType}</td>
                  <td className="px-4 py-3 text-gray-700">{row.ageGroup}</td>
                  <td className="px-4 py-3 text-gray-700">{row.occupancy}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">{formatCurrency(row.price)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">{row.count}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                    {formatCurrency(row.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end border-t border-gray-100 bg-gray-50 px-5 py-4">
          <div className="w-full max-w-xs space-y-2 text-sm">
            {totalDiscount > 0 && (
              <div className="flex items-center justify-between text-green-700">
                <span>政策优惠</span>
                <span className="tabular-nums">-{formatCurrency(totalDiscount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">订单总计</span>
              <span className="text-lg font-semibold tabular-nums text-gray-900">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-2">
              <span className="font-medium text-gray-700">本次需支付定金</span>
              <span className="text-lg font-semibold tabular-nums text-orange-600">{formatCurrency(deposit)}</span>
            </div>
          </div>
        </div>
      </div>

      {priceRosterRows.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">价格游客名单</h3>
                <p className="mt-0.5 text-xs text-gray-500">按房型、年龄段与入住类型汇总价格，并可展开查看游客名单。</p>
              </div>
              <button
                type="button"
                onClick={() => setGuestListExpanded((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                {guestListExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {guestListExpanded ? '收起名单' : '展开名单'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-white">
                  {['房型', '年龄段', '入住类型', '结算价', '人数', '小计'].map((col) => (
                    <th
                      key={col}
                      className={`px-4 py-3 text-xs font-medium text-gray-500 ${
                        ['结算价', '人数', '小计'].includes(col) ? 'text-right' : 'text-left'
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {priceRosterRows.map((row) => (
                  <tr key={row.key} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.roomType}</td>
                    <td className="px-4 py-3 text-gray-700">{row.ageGroup}</td>
                    <td className="px-4 py-3 text-gray-700">{row.stayType}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">{formatCurrency(row.price)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">{row.count}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">{formatCurrency(row.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {guestListExpanded && (
            <div className="border-t border-gray-200">
              <div className="border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs font-medium text-gray-600">
                游客名单
              </div>
              <div className="space-y-4 p-4">
                {guestRowsByTeam.map((group) => (
                  <div key={group.teamId} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
                      <div className="text-sm font-semibold text-gray-800">{group.teamName}</div>
                      <div className="text-xs text-gray-500">{group.rows.length} 位游客</div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[820px] text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-white">
                            {['房间', '房型', '姓名', '年龄段', '性别', '入住类型', '价格类型', '结算价'].map((col) => (
                              <th
                                key={col}
                                className={`px-4 py-3 text-xs font-medium text-gray-500 ${
                                  col === '结算价' ? 'text-right' : 'text-left'
                                }`}
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {group.rows.map((guest) => (
                            <tr key={guest.key} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-700">房间 {guest.roomSeq}</td>
                              <td className="px-4 py-3 font-medium text-gray-900">{guest.roomType}</td>
                              <td className="px-4 py-3 text-gray-700">{guest.name}</td>
                              <td className="px-4 py-3 text-gray-700">{guest.ageGroup}</td>
                              <td className="px-4 py-3 text-gray-700">{guest.gender}</td>
                              <td className="px-4 py-3 text-gray-700">{guest.stayType}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                                  guest.priceTypeLabel === '区域价' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                                }`}>
                                  {guest.priceTypeLabel}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">{formatCurrency(guest.ticketPrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
        <button
          type="button"
          className="rounded-md border border-gray-300 px-6 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          onClick={onPrev}
        >
          返回修改
        </button>
        <button
          type="button"
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          onClick={onNext}
        >
          确认并支付定金
        </button>
      </div>
    </div>
  )
}
