import React, { useState } from 'react'
import PageHeader from '@/components/common/PageHeader'
import { ChevronRight, Check } from 'lucide-react'
import Step1RouteSelection from '@/components/dealer/booking/Step1RouteSelection'
import Step2RoomReserve from '@/components/dealer/booking/Step2RoomReserve'
import Step3TouristInfo from '@/components/dealer/booking/Step3TouristInfo'
import Step4OrderConfirm from '@/components/dealer/booking/Step4OrderConfirm'
import Step5DepositPayment from '@/components/dealer/booking/Step5DepositPayment'
import Step6Complete from '@/components/dealer/booking/Step6Complete'

const steps = ['航线选择', '房型配置', '旅客信息', '订单确认', '定金支付', '完成']

export default function CruiseBookingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [roomReserveData, setRoomReserveData] = useState<any>({})

  const handleNext = (data?: any) => {
    if (data && currentStep === 1) {
      setRoomReserveData(data)
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
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
    <div className="p-6 pb-20">
      <PageHeader title="游轮预定" />

      {/* Step Bar */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-100 mb-6 flex items-center justify-center gap-2 overflow-x-auto">
        {steps.map((step, index) => {
          const isActive = index === currentStep
          const isDone = index < currentStep
          return (
            <div key={index} className="flex items-center" onClick={() => goToStep(index)}>
              {index > 0 && <ChevronRight className="w-4 h-4 text-gray-300 mx-2 shrink-0" />}
              <div className={`flex items-center gap-2 cursor-pointer transition-colors ${isActive || isDone ? '' : 'opacity-50'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border-2 shrink-0 transition-colors
                  ${isActive ? 'border-blue-500 bg-blue-500 text-white ring-4 ring-blue-50' : 
                    isDone ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 text-gray-400 bg-white'}`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : index + 1}
                </div>
                <span className={`text-sm whitespace-nowrap ${isActive ? 'text-blue-600 font-semibold' : isDone ? 'text-green-600' : 'text-gray-500'}`}>
                  {step}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <div className="mt-6">
        {currentStep === 0 && <Step1RouteSelection onNext={handleNext} />}
        {currentStep === 1 && <Step2RoomReserve onNext={handleNext} onPrev={handlePrev} />}
        {currentStep === 2 && <Step3TouristInfo roomData={roomReserveData} onNext={handleNext} onPrev={handlePrev} />}
        {currentStep === 3 && <Step4OrderConfirm data={{}} onNext={() => handleNext()} onPrev={handlePrev} />}
        {currentStep === 4 && <Step5DepositPayment onNext={() => handleNext()} onPrev={handlePrev} />}
        {currentStep === 5 && <Step6Complete />}
      </div>
    </div>
  )
}
