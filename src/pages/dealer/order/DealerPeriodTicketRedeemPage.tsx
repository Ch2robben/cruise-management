import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Check, ChevronRight, Plus, Trash2 } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Step3TouristInfo from '@/components/dealer/booking/Step3TouristInfo'
import { defaultRoomReserveData } from '@/mock/data'
import {
  getPeriodTicketOrder,
  getRedeemableOrderByCode,
  performPeriodTicketRedeem,
  type PeriodRedeemMinItem,
  type PeriodRedeemMode,
  type PeriodTicketOrder,
} from '@/mock/periodTicketOrders'
import { formatCurrency } from '@/utils/format'

const steps = ['兑换码校验', '房型与入住类型', '旅客信息', '兑换完成']

interface RedeemCodeRow {
  rowId: string
  code: string
  order: PeriodTicketOrder | null
  error: string
  selectedRoomType: string
  selectedOccupancy: string
  selectedOptionId: string
  selectedDate: string
}

interface RedeemExecutionResult {
  rowId: string
  code: string
  orderNo: string
  cruiseOrderNo: string
  diffAmount: number
  selectedDate: string
  roomType: string
  occupancyType: string
  payLink: string
}

function FakeQrCode({ value }: { value: string }) {
  const dots = Array.from({ length: 121 }, (_, index) => {
    const char = value.charCodeAt(index % value.length)
    return ((char + index * 7) % 5) < 2
  })

  return (
    <div className="grid grid-cols-11 gap-1 rounded-xl bg-white p-3 shadow-inner">
      {dots.map((filled, index) => (
        <span key={index} className={`h-3.5 w-3.5 rounded-sm ${filled ? 'bg-gray-900' : 'bg-gray-100'}`} />
      ))}
    </div>
  )
}

function modeLabel(mode: PeriodRedeemMode) {
  return mode === 'direct' ? '直接兑换' : '升单兑换'
}

function createRow(code = ''): RedeemCodeRow {
  return {
    rowId: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    code,
    order: null,
    error: '',
    selectedRoomType: '',
    selectedOccupancy: '',
    selectedOptionId: '',
    selectedDate: '',
  }
}

function dedupe<T>(list: T[]) {
  return Array.from(new Set(list))
}

function getRoomTypes(order: PeriodTicketOrder | null) {
  return order ? dedupe(order.redeemableProduct.minItems.map((item) => item.roomType)) : []
}

function getOccupancies(order: PeriodTicketOrder | null, roomType: string) {
  return order
    ? dedupe(order.redeemableProduct.minItems.filter((item) => item.roomType === roomType).map((item) => item.occupancyType))
    : []
}

function getOption(order: PeriodTicketOrder | null, roomType: string, occupancyType: string) {
  return order?.redeemableProduct.minItems.find((item) => item.roomType === roomType && item.occupancyType === occupancyType) ?? null
}

function normalizeRoomType(roomType: string) {
  if (roomType.includes('总统')) return '总统套房'
  if (roomType.includes('豪华')) return '豪华套房'
  return '标准间'
}

function buildRoomDataFromRows(rows: RedeemCodeRow[]) {
  const data = JSON.parse(JSON.stringify(defaultRoomReserveData)) as Record<string, { count: number }>
  Object.keys(data).forEach((key) => {
    data[key].count = 0
  })

  rows.forEach((row) => {
    const option = getOption(row.order, row.selectedRoomType, row.selectedOccupancy)
    if (!option) return
    const roomKey = normalizeRoomType(option.roomType)
    const totalPeople = option.adult + option.child + option.infant
    const perRoom = roomKey === '标准间' ? 2 : 2
    data[roomKey].count += Math.max(1, Math.ceil(totalPeople / perRoom))
  })

  return data
}

export default function DealerPeriodTicketRedeemPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId') || ''
  const mode = (searchParams.get('mode') === 'upgrade' ? 'upgrade' : 'direct') as PeriodRedeemMode
  const baseOrder = getPeriodTicketOrder(orderId)

  const [currentStep, setCurrentStep] = useState(0)
  const [rows, setRows] = useState<RedeemCodeRow[]>(baseOrder ? [createRow(baseOrder.redeemCode)] : [])
  const [touristData, setTouristData] = useState<any>(null)
  const [results, setResults] = useState<RedeemExecutionResult[]>([])
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!baseOrder) return
    const roomType = getRoomTypes(baseOrder)[0] ?? ''
    const occupancy = getOccupancies(baseOrder, roomType)[0] ?? ''
    const option = getOption(baseOrder, roomType, occupancy)
    setRows([
      {
        ...createRow(baseOrder.redeemCode),
        code: baseOrder.redeemCode,
        order: baseOrder,
        selectedRoomType: roomType,
        selectedOccupancy: occupancy,
        selectedOptionId: option?.id ?? '',
        selectedDate: option?.inventories[0]?.date ?? '',
      },
    ])
  }, [baseOrder])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2500)
    return () => window.clearTimeout(timer)
  }, [toast])

  const verifiedRows = useMemo(() => rows.filter((row) => row.order), [rows])
  const canGoStep2 = verifiedRows.length > 0 && rows.every((row) => row.order && !row.error)
  const canGoStep3 = verifiedRows.length > 0 && verifiedRows.every((row) => row.selectedOptionId && row.selectedDate)
  const roomData = useMemo(() => buildRoomDataFromRows(verifiedRows), [verifiedRows])
  const totalDiffAmount = results.reduce((sum, item) => sum + item.diffAmount, 0)
  const mergedPayLink = `https://pay.example.com/period-ticket/batch?orderId=${orderId}&amount=${totalDiffAmount}&count=${results.length}`

  if (!baseOrder) {
    return <Navigate to="/dealer/orders/period" replace />
  }

  const updateRow = (rowId: string, patch: Partial<RedeemCodeRow>) => {
    setRows((prev) => prev.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row)))
  }

  const verifySingleCode = (row: RedeemCodeRow) => {
    const matched = getRedeemableOrderByCode(row.code)
    if (!matched) {
      updateRow(row.rowId, { order: null, error: '兑换码无效', selectedRoomType: '', selectedOccupancy: '', selectedOptionId: '', selectedDate: '' })
      return
    }
    if (matched.ticketStatus !== 'unused' && matched.ticketStatus !== 'partial') {
      updateRow(row.rowId, { order: null, error: '该兑换码当前状态不可核销', selectedRoomType: '', selectedOccupancy: '', selectedOptionId: '', selectedDate: '' })
      return
    }
    const roomType = getRoomTypes(matched)[0] ?? ''
    const occupancy = getOccupancies(matched, roomType)[0] ?? ''
    const option = getOption(matched, roomType, occupancy)
    updateRow(row.rowId, {
      order: matched,
      error: '',
      code: matched.redeemCode,
      selectedRoomType: roomType,
      selectedOccupancy: occupancy,
      selectedOptionId: option?.id ?? '',
      selectedDate: option?.inventories[0]?.date ?? '',
    })
  }

  const verifyAllCodes = () => {
    rows.forEach(verifySingleCode)
    setCurrentStep(0)
  }

  const addCodeRow = () => setRows((prev) => [...prev, createRow('')])

  const removeCodeRow = (rowId: string) => {
    if (rows.length === 1) return
    setRows((prev) => prev.filter((row) => row.rowId !== rowId))
  }

  const handleRoomTypeChange = (row: RedeemCodeRow, roomType: string) => {
    const occupancy = getOccupancies(row.order, roomType)[0] ?? ''
    const option = getOption(row.order, roomType, occupancy)
    updateRow(row.rowId, {
      selectedRoomType: roomType,
      selectedOccupancy: occupancy,
      selectedOptionId: option?.id ?? '',
      selectedDate: option?.inventories[0]?.date ?? '',
    })
  }

  const handleOccupancyChange = (row: RedeemCodeRow, occupancy: string) => {
    const option = getOption(row.order, row.selectedRoomType, occupancy)
    updateRow(row.rowId, {
      selectedOccupancy: occupancy,
      selectedOptionId: option?.id ?? '',
      selectedDate: option?.inventories[0]?.date ?? '',
    })
  }

  const handleTouristNext = (data: any) => {
    setTouristData(data)
    const nextResults = verifiedRows.flatMap((row) => {
      const result = performPeriodTicketRedeem({
        orderId: row.order!.id,
        mode,
        travelDate: row.selectedDate,
        minItemId: row.selectedOptionId,
      })
      const option = getOption(row.order, row.selectedRoomType, row.selectedOccupancy)
      if (!result || !option) return []
      return [{
        rowId: row.rowId,
        code: row.code,
        orderNo: row.order!.periodOrderNo,
        cruiseOrderNo: result.cruiseOrderNo,
        diffAmount: result.diffAmount,
        selectedDate: result.selectedDate,
        roomType: option.roomType,
        occupancyType: option.occupancyType,
        payLink: result.payLink,
      }]
    })
    setResults(nextResults)
    setCurrentStep(3)
  }

  const copyText = async (value: string, successText: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setToast(successText)
    } catch {
      setToast('复制失败，请手动复制')
    }
  }

  return (
    <div className="space-y-5 p-6 pb-20">
      {toast && <div className="fixed left-1/2 top-6 z-[999] -translate-x-1/2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm text-white shadow-lg">{toast}</div>}

      <PageHeader title="期票兑换" description="支持单码或批量核销多张兑换码，每张码可分别选择房型、入住类型和兑换航期。">
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            当前方式：{modeLabel(mode)}
          </span>
          <button className="h-10 rounded-lg border border-gray-300 px-4 text-sm text-gray-700" onClick={() => navigate(`/dealer/orders/period/${baseOrder.id}`)}>
            返回详情
          </button>
        </div>
      </PageHeader>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">兑换流程</h3>
              <p className="mt-0.5 text-xs text-gray-500">当前步骤 {currentStep + 1} / {steps.length}</p>
            </div>
            <div className="text-xs text-gray-500">主订单号：{baseOrder.periodOrderNo}</div>
          </div>
        </div>
        <div className="overflow-x-auto px-4 py-4">
          <div className="flex min-w-max items-stretch gap-2">
            {steps.map((step, index) => {
              const isActive = index === currentStep
              const isDone = index < currentStep
              return (
                <div key={index} className="flex items-center">
                  <button
                    type="button"
                    className={`flex min-w-[156px] items-center gap-3 rounded-lg border px-4 py-3 text-left ${
                      isActive ? 'border-blue-200 bg-blue-50' : isDone ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
                    }`}
                    onClick={() => index < currentStep && setCurrentStep(index)}
                  >
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${isActive ? 'text-blue-700' : isDone ? 'text-green-700' : 'text-gray-700'}`}>{step}</div>
                      <div className="mt-0.5 text-xs text-gray-500">{isActive ? '当前处理' : isDone ? '已完成' : '待处理'}</div>
                    </div>
                  </button>
                  {index < steps.length - 1 && <ChevronRight className="mx-2 h-4 w-4 text-gray-300" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {currentStep === 0 && (
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-gray-900">步骤一：校验兑换码</div>
                <div className="mt-1 text-sm text-gray-500">支持批量录入多张兑换码，校验通过后每张码都能单独选房型和入住类型。</div>
              </div>
              <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm text-gray-700" onClick={addCodeRow}>
                <Plus className="h-4 w-4" />
                新增兑换码
              </button>
            </div>

            <div className="space-y-4">
              {rows.map((row, index) => (
                <div key={row.rowId} className="rounded-xl border border-gray-200 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-gray-900">兑换码 {index + 1}</div>
                    {rows.length > 1 && (
                      <button className="inline-flex items-center gap-1 text-sm text-red-500" onClick={() => removeCodeRow(row.rowId)}>
                        <Trash2 className="h-4 w-4" />
                        删除
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                    <input
                      className="h-10 rounded-lg border border-gray-300 px-3 text-sm font-mono outline-none focus:border-blue-500"
                      value={row.code}
                      onChange={(e) => updateRow(row.rowId, { code: e.target.value.toUpperCase(), order: null, error: '' })}
                      placeholder="请输入兑换码"
                    />
                    <button className="h-10 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm text-blue-700" onClick={() => verifySingleCode(row)}>
                      校验当前码
                    </button>
                    <button className="h-10 rounded-lg bg-blue-600 px-4 text-sm text-white" onClick={verifyAllCodes}>
                      全部校验
                    </button>
                  </div>

                  {row.error && <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{row.error}</div>}

                  {row.order && (
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
                        <div className="text-gray-500">可兑产品</div>
                        <div className="mt-1 font-medium text-gray-900">{row.order.redeemableProduct.productName}</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
                        <div className="text-gray-500">航线</div>
                        <div className="mt-1 font-medium text-gray-900">{row.order.redeemableProduct.routeName}</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
                        <div className="text-gray-500">支持房型</div>
                        <div className="mt-1 font-medium text-gray-900">{getRoomTypes(row.order).join(' / ')}</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
                        <div className="text-gray-500">支持入住类型</div>
                        <div className="mt-1 font-medium text-gray-900">{row.order.redeemableProduct.occupancyType}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                className="h-10 rounded-lg bg-blue-600 px-5 text-sm text-white disabled:cursor-not-allowed disabled:bg-blue-300"
                disabled={!canGoStep2}
                onClick={() => setCurrentStep(1)}
              >
                下一步：选择房型和入住类型
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="mb-4 text-base font-semibold text-gray-900">当前兑换说明</div>
            <div className="space-y-3 text-sm leading-6 text-gray-600">
              <div>1. 当前支持从期票订单发起批量核销。</div>
              <div>2. 每张兑换码可单独选择房型、入住类型与航期库存。</div>
              <div>3. 旅客信息会在下一步统一录入，系统按所选房型自动汇总房间数。</div>
              <div>4. 升单兑换会在最后一步汇总补差价并生成支付二维码。</div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div className="space-y-5">
          {verifiedRows.map((row, index) => {
            const roomTypes = getRoomTypes(row.order)
            const occupancies = getOccupancies(row.order, row.selectedRoomType)
            const selectedOption = getOption(row.order, row.selectedRoomType, row.selectedOccupancy)
            return (
              <div key={row.rowId} className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-gray-900">兑换码 {index + 1}：{row.code}</div>
                    <div className="mt-1 text-sm text-gray-500">{row.order?.redeemableProduct.productName}</div>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{row.order?.periodOrderNo}</span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1 text-sm text-gray-600">
                    <span>房型 <span className="text-red-500">*</span></span>
                    <select
                      className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
                      value={row.selectedRoomType}
                      onChange={(e) => handleRoomTypeChange(row, e.target.value)}
                    >
                      {roomTypes.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-gray-600">
                    <span>入住类型 <span className="text-red-500">*</span></span>
                    <select
                      className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
                      value={row.selectedOccupancy}
                      onChange={(e) => handleOccupancyChange(row, e.target.value)}
                    >
                      {occupancies.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {selectedOption && (
                  <>
                    <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
                      该入住类型对应：成人 {selectedOption.adult} / 儿童 {selectedOption.child} / 婴儿 {selectedOption.infant}
                      {mode === 'upgrade' && (
                        <span className="ml-4">基础补差价：<strong className="text-gray-900">{formatCurrency(selectedOption.baseDiffPrice)}</strong></span>
                      )}
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                      {selectedOption.inventories.map((inventory) => {
                        const active = row.selectedDate === inventory.date
                        const diffAmount = mode === 'upgrade' ? selectedOption.baseDiffPrice + inventory.priceDiff : 0
                        return (
                          <button
                            key={inventory.date}
                            type="button"
                            className={`rounded-xl border p-4 text-left transition ${active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                            onClick={() => updateRow(row.rowId, { selectedDate: inventory.date, selectedOptionId: selectedOption.id })}
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-base font-semibold text-gray-900">{inventory.date}</div>
                              <span className={`rounded-full px-2 py-1 text-xs ${inventory.stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                剩余 {inventory.stock}
                              </span>
                            </div>
                            <div className="mt-3 space-y-2 text-sm text-gray-500">
                              <div>航次号：{inventory.voyageNo}</div>
                              <div>房型：{selectedOption.roomType}</div>
                              <div>入住：{selectedOption.occupancyType}</div>
                              <div>补差价：<span className="font-medium text-gray-900">{formatCurrency(diffAmount)}</span></div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )
          })}

          <div className="flex justify-between gap-3">
            <button className="h-10 rounded-lg border border-gray-300 px-5 text-sm text-gray-700" onClick={() => setCurrentStep(0)}>
              返回上一步
            </button>
            <button
              className="h-10 rounded-lg bg-blue-600 px-5 text-sm text-white disabled:cursor-not-allowed disabled:bg-blue-300"
              disabled={!canGoStep3}
              onClick={() => setCurrentStep(2)}
            >
              下一步：录入旅客信息
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white px-5 py-4 text-sm text-gray-600">
            <div className="mb-2 font-medium text-gray-900">本次批量兑换摘要</div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {verifiedRows.map((row) => {
                const option = getOption(row.order, row.selectedRoomType, row.selectedOccupancy)
                return (
                  <div key={row.rowId} className="rounded-lg bg-gray-50 px-4 py-3">
                    <div className="font-mono text-xs text-gray-500">{row.code}</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">{option?.roomType} · {option?.occupancyType}</div>
                    <div className="mt-1 text-xs text-gray-500">航期：{row.selectedDate}</div>
                  </div>
                )
              })}
            </div>
          </div>
          <Step3TouristInfo
            roomData={roomData}
            onNext={handleTouristNext}
            onPrev={() => setCurrentStep(1)}
            initialGroupName={`${baseOrder.pickupName}批量兑换团`}
          />
        </div>
      )}

      {currentStep === 3 && results.length > 0 && (
        <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Check className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xl font-semibold text-gray-900">
                  {mode === 'direct' ? '批量直接兑换完成' : '批量升单兑换已生成补差价'}
                </div>
                <div className="mt-2 text-sm leading-6 text-gray-500">
                  已处理 {results.length} 张兑换码，旅客信息共录入 {touristData?.touristList?.length ?? 0} 人。
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">兑换码</th>
                    <th className="px-4 py-3 font-medium">期票订单</th>
                    <th className="px-4 py-3 font-medium">房型/入住</th>
                    <th className="px-4 py-3 font-medium">航期</th>
                    <th className="px-4 py-3 font-medium">生成游轮订单</th>
                    <th className="px-4 py-3 font-medium">补差价</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((item) => (
                    <tr key={item.rowId} className="border-t border-gray-100 text-gray-700">
                      <td className="px-4 py-3 font-mono">{item.code}</td>
                      <td className="px-4 py-3">{item.orderNo}</td>
                      <td className="px-4 py-3">{item.roomType} / {item.occupancyType}</td>
                      <td className="px-4 py-3">{item.selectedDate}</td>
                      <td className="px-4 py-3 font-mono">{item.cruiseOrderNo}</td>
                      <td className="px-4 py-3">{formatCurrency(item.diffAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button className="h-10 rounded-lg border border-gray-300 px-5 text-sm text-gray-700" onClick={() => navigate(`/dealer/orders/period/${baseOrder.id}`)}>
                返回期票详情
              </button>
              <button className="h-10 rounded-lg bg-blue-600 px-5 text-sm text-white" onClick={() => navigate('/dealer/orders/cruise')}>
                去看游轮订单
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            {mode === 'direct' ? (
              <>
                <div className="text-base font-semibold text-gray-900">兑换结果</div>
                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-700">
                  本次为直接兑换，无需补差价，所有游轮订单已生成完成。
                </div>
              </>
            ) : (
              <>
                <div className="text-base font-semibold text-gray-900">批量补差价支付</div>
                <div className="mt-3 text-sm leading-6 text-gray-500">
                  已按本次批量核销结果汇总补差价，可统一发送二维码或复制支付链接给客户。
                </div>
                <div className="mt-5 flex justify-center rounded-2xl bg-gray-50 p-6">
                  <FakeQrCode value={mergedPayLink} />
                </div>
                <div className="mt-5 rounded-xl border border-orange-100 bg-orange-50 px-4 py-4">
                  <div className="text-sm text-orange-700">应补差价合计</div>
                  <div className="mt-2 text-2xl font-semibold text-orange-600">{formatCurrency(totalDiffAmount)}</div>
                </div>
                <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                  <div className="text-sm text-gray-500">支付链接</div>
                  <div className="mt-2 break-all font-mono text-xs text-gray-700">{mergedPayLink}</div>
                  <button
                    className="mt-4 h-9 rounded-lg bg-blue-600 px-4 text-sm text-white"
                    onClick={() => copyText(mergedPayLink, '支付链接已复制')}
                  >
                    复制支付链接
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
