import { useState } from 'react'
import PageHeader from '@/components/common/PageHeader'
import { ChevronRight, Check } from 'lucide-react'
import Step1RouteSelection from '@/components/dealer/booking/Step1RouteSelection'
import Step2RoomReserve from '@/components/dealer/booking/Step2RoomReserve'
import Step3TouristInfo from '@/components/dealer/booking/Step3TouristInfo'
import Step4OrderConfirm from '@/components/dealer/booking/Step4OrderConfirm'
import Step5DepositPayment from '@/components/dealer/booking/Step5DepositPayment'
import Step6Complete from '@/components/dealer/booking/Step6Complete'
import type { DealerBookingDraft } from '@/components/dealer/booking/bookingTypes'
import { buildMatchedPricePolicies } from '@/mock/dealerBookingPolicy'

const steps = ['航线选择', '房型配置', '旅客信息', '订单确认', '定金支付', '完成']

export default function CruiseBookingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [bookingDraft, setBookingDraft] = useState<DealerBookingDraft>({})

  const handleNext = (data?: unknown) => {
    if (data) {
      if (currentStep === 1) {
        const step2Data = data as DealerBookingDraft & { rooms?: DealerBookingDraft['rooms'] }
        const cart = step2Data.cart ?? []
        setBookingDraft((prev) => ({
          ...prev,
          cart,
          rooms: step2Data.rooms,
          segmentKey: step2Data.segmentKey,
          matchedPolicies: buildMatchedPricePolicies(cart),
        }))
      } else if (currentStep === 2) {
        setBookingDraft((prev) => ({
          ...prev,
          touristData: data as DealerBookingDraft['touristData'],
        }))
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const goToStep = (index: number) => {
    if (index <= currentStep) {
      setCurrentStep(index)
    }
  }

  return (
    <div className="space-y-5 p-6 pb-20">
      <PageHeader title="游轮预定" description="按航次、航段、房型与旅客信息完成 ToB 预订流程。" />

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">预订流程</h3>
              <p className="mt-0.5 text-xs text-gray-500">当前步骤 {currentStep + 1} / {steps.length}</p>
            </div>
            <div className="text-xs text-gray-500">
              仅可回看已完成步骤，避免跨步骤修改导致数据不一致
            </div>
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
                    onClick={() => goToStep(index)}
                    className={`flex min-w-[148px] items-center gap-3 rounded-lg border px-4 py-3 text-left transition ${
                      isActive
                        ? 'border-blue-200 bg-blue-50'
                        : isDone
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-white'
                    } ${index <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : isDone
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className={`truncate text-sm font-medium ${isActive ? 'text-blue-700' : isDone ? 'text-green-700' : 'text-gray-700'}`}>
                        {step}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">
                        {isActive ? '当前处理' : isDone ? '已完成' : '待处理'}
                      </div>
                    </div>
                  </button>
                  {index < steps.length - 1 && <ChevronRight className="mx-2 h-4 w-4 shrink-0 text-gray-300" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div>
        {currentStep === 0 && <Step1RouteSelection onNext={handleNext} />}
        {currentStep === 1 && <Step2RoomReserve onNext={handleNext} onPrev={handlePrev} />}
        {currentStep === 2 && (
          <Step3TouristInfo roomData={bookingDraft.rooms ?? {}} onNext={handleNext} onPrev={handlePrev} />
        )}
        {currentStep === 3 && <Step4OrderConfirm data={bookingDraft} onNext={() => handleNext()} onPrev={handlePrev} />}
        {currentStep === 4 && <Step5DepositPayment onNext={() => handleNext()} onPrev={handlePrev} />}
        {currentStep === 5 && <Step6Complete />}
      </div>
    </div>
  )
}
