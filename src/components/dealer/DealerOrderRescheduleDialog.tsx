import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Info } from 'lucide-react'
import FormDialog from '@/components/common/FormDialog'
import { formatCurrency } from '@/utils/format'

export interface DealerRescheduleOrderSummary {
  orderNo: string
  voyageNo: string
  ship: string
  sailDate: string
  route: string
  totalPeople: number
  roomType: string
  totalAmount: number
}

export interface DealerRescheduleTarget {
  voyageNo: string
  ship: string
  sailDate: string
  route: string
  availableBeds: number
  supportedRoomTypes: string[]
}

export interface DealerRescheduleSubmitValue {
  target: DealerRescheduleTarget
  reason: string
  remark: string
}

interface DealerOrderRescheduleDialogProps {
  open: boolean
  order: DealerRescheduleOrderSummary | null
  onCancel: () => void
  onSubmit: (value: DealerRescheduleSubmitValue) => void
}

const targetVoyages: DealerRescheduleTarget[] = [
  {
    voyageNo: 'CJ20260708-CQYC',
    ship: '长江壹号',
    sailDate: '2026-07-08',
    route: '重庆—宜昌',
    availableBeds: 42,
    supportedRoomTypes: ['标准间', '行政房', '豪华套房'],
  },
  {
    voyageNo: 'CJ20260715-CQYC',
    ship: '长江贰号',
    sailDate: '2026-07-15',
    route: '重庆—宜昌',
    availableBeds: 18,
    supportedRoomTypes: ['标准间', '行政房'],
  },
  {
    voyageNo: 'CJ20260722-CQYC',
    ship: '长江叁号',
    sailDate: '2026-07-22',
    route: '重庆—宜昌',
    availableBeds: 12,
    supportedRoomTypes: ['标准间', '行政房', '豪华套房'],
  },
]

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-gray-900">{value}</div>
    </div>
  )
}

export default function DealerOrderRescheduleDialog({ open, order, onCancel, onSubmit }: DealerOrderRescheduleDialogProps) {
  const [targetVoyageNo, setTargetVoyageNo] = useState('')
  const [reason, setReason] = useState('')
  const [remark, setRemark] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setTargetVoyageNo('')
    setReason('')
    setRemark('')
    setError('')
  }, [open, order?.orderNo])

  const target = useMemo(
    () => targetVoyages.find((item) => item.voyageNo === targetVoyageNo) || null,
    [targetVoyageNo],
  )

  if (!order) return null

  const inventoryMatched = Boolean(target && target.availableBeds >= order.totalPeople)
  const roomTypeMatched = Boolean(target?.supportedRoomTypes.includes(order.roomType))

  const handleSubmit = () => {
    if (!target) {
      setError('请选择目标航次')
      return
    }
    if (!reason) {
      setError('请选择改签原因')
      return
    }
    if (!inventoryMatched || !roomTypeMatched) {
      setError('目标航次库存或房型不满足当前订单，请更换航次')
      return
    }
    onSubmit({ target, reason, remark: remark.trim() })
  }

  return (
    <FormDialog
      open={open}
      title={`订单改签·${order.orderNo}`}
      width="max-w-4xl"
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitText="确认改签"
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className="font-medium">经销商改签免收罚金</div>
            <div className="mt-1 text-blue-700">仅更换所属航次，原订单金额和游客信息保留；原航次房间将释放，目标航次需重新排房。</div>
          </div>
        </div>

        <section>
          <h4 className="mb-3 text-sm font-semibold text-gray-900">原订单信息</h4>
          <div className="grid grid-cols-2 gap-4 border border-gray-200 bg-gray-50 px-4 py-4 md:grid-cols-4">
            <SummaryCell label="原航次" value={order.voyageNo} />
            <SummaryCell label="游轮 / 开航日期" value={`${order.ship} / ${order.sailDate}`} />
            <SummaryCell label="房型 / 人数" value={`${order.roomType} / ${order.totalPeople} 人`} />
            <SummaryCell label="订单金额" value={formatCurrency(order.totalAmount)} />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-gray-700">
            <span className="mb-1.5 block font-medium">目标航次 <span className="text-red-500">*</span></span>
            <select
              value={targetVoyageNo}
              onChange={(event) => {
                setTargetVoyageNo(event.target.value)
                setError('')
              }}
              className="h-10 w-full border border-gray-300 bg-white px-3 outline-none focus:border-blue-500"
            >
              <option value="">请选择可改签航次</option>
              {targetVoyages.map((item) => (
                <option key={item.voyageNo} value={item.voyageNo}>
                  {item.voyageNo}·{item.ship}·{item.sailDate}·余 {item.availableBeds} 床
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-gray-700">
            <span className="mb-1.5 block font-medium">改签原因 <span className="text-red-500">*</span></span>
            <select
              value={reason}
              onChange={(event) => {
                setReason(event.target.value)
                setError('')
              }}
              className="h-10 w-full border border-gray-300 bg-white px-3 outline-none focus:border-blue-500"
            >
              <option value="">请选择</option>
              <option value="客人行程调整">客人行程调整</option>
              <option value="航次运营调整">航次运营调整</option>
              <option value="房型或库存调整">房型或库存调整</option>
              <option value="其他">其他</option>
            </select>
          </label>
        </section>

        {target && (
          <section className="border border-gray-200">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900">改签校验</div>
            <div className="grid gap-4 px-4 py-4 text-sm md:grid-cols-3">
              <SummaryCell label="目标航次" value={`${target.voyageNo} / ${target.ship}`} />
              <SummaryCell label="新开航日期" value={target.sailDate} />
              <SummaryCell label="航线" value={target.route} />
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                库存充足（需 {order.totalPeople} 床，余 {target.availableBeds} 床）
              </div>
              <div className={`flex items-center gap-2 ${roomTypeMatched ? 'text-green-700' : 'text-red-600'}`}>
                <CheckCircle2 className="h-4 w-4" />
                {roomTypeMatched ? `支持${order.roomType}` : `不支持${order.roomType}`}
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                游客资料将整单迁移
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-4 border border-green-200 bg-green-50 px-4 py-4 md:grid-cols-3">
          <SummaryCell label="改签罚金" value="¥0.00" />
          <SummaryCell label="价格差额" value="¥0.00" />
          <SummaryCell label="改签后订单金额" value={formatCurrency(order.totalAmount)} />
        </div>

        <label className="block text-sm text-gray-700">
          <span className="mb-1.5 block font-medium">备注</span>
          <textarea
            value={remark}
            onChange={(event) => setRemark(event.target.value)}
            rows={3}
            maxLength={200}
            placeholder="可填写与客人沟通结果或特殊排房要求"
            className="w-full resize-none border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
          />
          <div className="mt-1 text-right text-xs text-gray-400">{remark.length}/200</div>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </FormDialog>
  )
}
