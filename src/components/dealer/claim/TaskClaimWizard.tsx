import { useMemo, useState } from 'react'
import { Check, ChevronRight, CreditCard, Landmark, Minus, Plus, Smartphone, Wallet } from 'lucide-react'
import Step1RouteSelection from '@/components/dealer/booking/Step1RouteSelection'
import {
  createDealerTaskClaim,
  getClaimSegments,
  getRoomCatalog,
  payDealerTaskClaim,
  type ClaimVoyageInput,
  type TaskClaimLine,
} from '@/mock/dealerTaskClaims'
import { voyageList } from '@/mock/data'
import { formatCurrency } from '@/utils/format'

const steps = ['选择航次', '认领间数', '支付定金']

function getVoyageRoomStock(voyageKey: string, roomType: string) {
  const voyage = voyageList.find((item) => `${item.ship}-${item.date}` === voyageKey)
  const cabin = voyage?.cabins.find((item) => item.type === roomType)
  if (!cabin || cabin.status === '售罄') return 0
  return cabin.totalRooms > 45 ? 99 : Math.max(1, Math.ceil(cabin.remainBeds / Math.max(cabin.maxGuests, 1)))
}

export default function TaskClaimWizard({
  onCancel,
  onPaid,
}: {
  onCancel: () => void
  onPaid: (claimNo: string, holdHint: string) => void
}) {
  const [currentStep, setCurrentStep] = useState(0)
  const [voyage, setVoyage] = useState<ClaimVoyageInput | null>(null)
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({})
  const [payMethod, setPayMethod] = useState('balance')
  const [paying, setPaying] = useState(false)
  const [formError, setFormError] = useState('')

  const segments = useMemo(() => getClaimSegments(), [])
  const catalog = getRoomCatalog()
  const roomTypes = useMemo(() => {
    const voyageItem = voyageList.find((item) => `${item.ship}-${item.date}` === voyage?.voyageKey)
    return voyageItem?.cabins.map((item) => item.type) ?? Object.keys(catalog)
  }, [voyage, catalog])

  const lines = useMemo(() => {
    if (!voyage) return [] as TaskClaimLine[]
    const next: TaskClaimLine[] = []
    segments.forEach((segment) => {
      roomTypes.forEach((roomType) => {
        const rooms = qtyMap[`${segment.id}::${roomType}`] ?? 0
        if (rooms <= 0) return
        const meta = catalog[roomType as keyof typeof catalog]
        next.push({
          segmentId: segment.id,
          segmentLabel: segment.label,
          roomType,
          rooms,
          unitPrice: meta?.price ?? 0,
          depositPerRoom: meta?.deposit ?? 0,
          maxRooms: getVoyageRoomStock(voyage.voyageKey, roomType),
        })
      })
    })
    return next
  }, [voyage, segments, roomTypes, qtyMap, catalog])

  const totalRooms = lines.reduce((sum, line) => sum + line.rooms, 0)
  const depositAmount = lines.reduce((sum, line) => sum + line.rooms * line.depositPerRoom, 0)
  const totalAmount = lines.reduce((sum, line) => sum + line.rooms * line.unitPrice, 0)

  const setQty = (segmentId: string, roomType: string, value: number, maxRooms: number) => {
    const next = Math.max(0, Math.min(maxRooms, Math.floor(value) || 0))
    setQtyMap((prev) => ({ ...prev, [`${segmentId}::${roomType}`]: next }))
  }

  const handlePay = () => {
    if (!voyage || lines.length === 0) {
      setFormError('请至少认领 1 间')
      return
    }
    setPaying(true)
    const created = createDealerTaskClaim(voyage, lines)
    if (!created) {
      setPaying(false)
      setFormError('认领单创建失败，请重新填写间数')
      return
    }
    const paid = payDealerTaskClaim(created.id, payMethod)
    setPaying(false)
    if (!paid) {
      setFormError('定金支付失败，请重试')
      return
    }
    onPaid(paid.claimNo, paid.holdId ? `已同步锁舱 ${paid.holdId}` : '已同步生成锁舱记录')
  }

  const methodOptions = [
    { key: 'balance', title: '预存余额支付', desc: '可用余额：¥86,400', icon: Wallet },
    { key: 'credit', title: '授信额度支付', desc: '可用额度：¥156,800', icon: Landmark },
    { key: 'alipay', title: '支付宝 / 微信', desc: '线上扫码支付，实时确认到账', icon: Smartphone },
    { key: 'transfer', title: '银行转账汇款', desc: '提交凭证后由财务审核入账', icon: Landmark },
  ] as const

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">认领流程</h3>
            <p className="mt-0.5 text-xs text-gray-500">必须选择具体航次；按下单间数认领，支付定金后同步生成一条锁舱记录。</p>
          </div>
          <button type="button" onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-800">返回列表</button>
        </div>
        <div className="overflow-x-auto px-4 py-4">
          <div className="flex min-w-max items-stretch gap-2">
            {steps.map((step, index) => {
              const isActive = index === currentStep
              const isDone = index < currentStep
              return (
                <div key={step} className="flex items-center">
                  <div className={`flex min-w-[148px] items-center gap-3 rounded-lg border px-4 py-3 ${
                    isActive ? 'border-blue-200 bg-blue-50' : isDone ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
                  }`}>
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
                    </div>
                    <div className="text-sm font-medium text-gray-800">{step}</div>
                  </div>
                  {index < steps.length - 1 && <ChevronRight className="mx-2 h-4 w-4 shrink-0 text-gray-300" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {currentStep === 0 && (
        <Step1RouteSelection
          onNext={(data) => {
            setVoyage({
              productId: data.productId,
              productName: data.productName,
              voyageKey: data.voyageSummary.voyageKey,
              ship: data.voyageSummary.ship,
              route: data.voyageSummary.route,
              date: data.voyageSummary.date,
              days: data.voyageSummary.days,
            })
            setQtyMap({})
            setFormError('')
            setCurrentStep(1)
          }}
        />
      )}

      {currentStep === 1 && voyage && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-800">按航段认领房型间数</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              {voyage.ship} · {voyage.route} · {voyage.date} · {voyage.productName}。每个单元格为认领间数，不可超过该房型可售间数。
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">航段</th>
                  {roomTypes.map((roomType) => (
                    <th key={roomType} className="px-4 py-3 text-left font-medium">{roomType}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {segments.map((segment) => (
                  <tr key={segment.id}>
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{segment.label}</td>
                    {roomTypes.map((roomType) => {
                      const maxRooms = getVoyageRoomStock(voyage.voyageKey, roomType)
                      const key = `${segment.id}::${roomType}`
                      const value = qtyMap[key] ?? 0
                      const meta = catalog[roomType as keyof typeof catalog]
                      return (
                        <td key={roomType} className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={value <= 0}
                              onClick={() => setQty(segment.id, roomType, value - 1, maxRooms)}
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-600 disabled:opacity-30"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={maxRooms}
                              value={value}
                              onChange={(event) => setQty(segment.id, roomType, Number(event.target.value), maxRooms)}
                              className="h-8 w-16 rounded-md border border-gray-300 px-2 text-center text-sm"
                            />
                            <button
                              type="button"
                              disabled={value >= maxRooms}
                              onClick={() => setQty(segment.id, roomType, value + 1, maxRooms)}
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-600 disabled:opacity-30"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            可售 {maxRooms} 间 · 定金 {formatCurrency(meta?.deposit ?? 0)}/间
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4">
            <div className="text-sm text-gray-600">
              已认领 <span className="font-medium text-gray-900">{totalRooms}</span> 间，定金合计
              <span className="ml-1 font-semibold text-red-500">{formatCurrency(depositAmount)}</span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCurrentStep(0)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">上一步</button>
              <button
                type="button"
                disabled={totalRooms <= 0}
                onClick={() => { setFormError(''); setCurrentStep(2) }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                去支付定金
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 2 && voyage && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
              <h3 className="text-sm font-semibold text-gray-800">认领明细</h3>
            </div>
            <div className="px-5 py-4 text-sm text-gray-700">
              <div>{voyage.ship} · {voyage.route} · {voyage.date}</div>
              <div className="mt-1 text-xs text-gray-400">{voyage.productName}</div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">航段</th>
                  <th className="px-4 py-2 text-left font-medium">房型</th>
                  <th className="px-4 py-2 text-right font-medium">间数</th>
                  <th className="px-4 py-2 text-right font-medium">定金</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lines.map((line) => (
                  <tr key={`${line.segmentId}-${line.roomType}`}>
                    <td className="px-4 py-2">{line.segmentLabel}</td>
                    <td className="px-4 py-2">{line.roomType}</td>
                    <td className="px-4 py-2 text-right">{line.rooms} 间</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(line.rooms * line.depositPerRoom)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-gray-100 px-5 py-4 text-xs text-gray-500">
              支付成功后同步生成 1 条锁舱记录（锁舱数量 = 认领总间数 {totalRooms} 间）。
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-800">定金支付</h3>
              </div>
            </div>
            <div className="px-4 py-4">
              <div className="rounded-lg border border-blue-100 bg-blue-50/40 px-4 py-3">
                <div className="text-xs text-gray-500">需支付定金</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums text-red-500">{formatCurrency(depositAmount)}</div>
                <div className="mt-1 text-xs text-gray-400">参考房费 {formatCurrency(totalAmount)}</div>
              </div>
              {formError && <div className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600">{formError}</div>}
              <div className="mt-3 divide-y divide-gray-100 rounded-lg border border-gray-200">
                {methodOptions.map((method) => {
                  const active = payMethod === method.key
                  const Icon = method.icon
                  return (
                    <button
                      key={method.key}
                      type="button"
                      onClick={() => setPayMethod(method.key)}
                      className={`flex w-full items-center gap-3 px-3 py-3 text-left ${active ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
                    >
                      <Icon className={`h-4 w-4 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{method.title}</div>
                        <div className="text-xs text-gray-400">{method.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => setCurrentStep(1)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">上一步</button>
                <button
                  type="button"
                  disabled={paying || totalRooms <= 0}
                  onClick={handlePay}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {paying ? '支付中…' : '确认支付'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
