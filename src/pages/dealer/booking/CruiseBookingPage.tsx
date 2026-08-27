import CruiseBookingWizard from '@/components/dealer/booking/CruiseBookingWizard'

export default function CruiseBookingPage() {
  return (
    <CruiseBookingWizard
      mode="dealer"
      title="游轮预定"
      description="按航次、航段、房型与旅客信息完成 ToB 预订流程。"
    />
  )
}
