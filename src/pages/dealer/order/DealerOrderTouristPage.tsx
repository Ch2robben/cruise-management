import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import Step3TouristInfo from '@/components/dealer/booking/Step3TouristInfo'
import { defaultRoomReserveData } from '@/mock/data'

interface OrderTouristContext {
  id: string
  orderNo: string
  groupName: string
  roomType: string
  totalPeople: number
}

function orderToRoomData(order: OrderTouristContext) {
  const data = JSON.parse(JSON.stringify(defaultRoomReserveData)) as Record<string, { count: number }>
  Object.keys(data).forEach((key) => {
    data[key].count = 0
  })

  const roomType = data[order.roomType] ? order.roomType : '标准间'
  const perRoom = roomType === '标准间' ? 2 : 1
  data[roomType].count = Math.max(1, Math.ceil(order.totalPeople / perRoom))
  return data
}

export default function DealerOrderTouristPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const order = location.state?.order as OrderTouristContext | undefined

  if (!order) {
    return <Navigate to="/dealer/orders/cruise" replace />
  }

  const roomData = orderToRoomData(order)

  const handleSubmit = () => {
    window.alert(`订单 ${order.orderNo} 的游客信息已提交`)
    navigate('/dealer/orders/cruise')
  }

  return (
    <div className="p-6 pb-20">
      <PageHeader title="游客信息" />
      <div className="mb-4 rounded-lg border border-gray-200 bg-white px-5 py-4 text-sm text-gray-600">
        <span className="text-gray-500">订单号 </span>
        <span className="font-mono font-medium text-gray-900">{order.orderNo}</span>
        <span className="mx-3 text-gray-300">|</span>
        <span className="text-gray-500">团名 </span>
        <span className="font-medium text-gray-900">{order.groupName}</span>
        <span className="mx-3 text-gray-300">|</span>
        <span className="text-gray-500">应录入 </span>
        <span className="font-medium text-blue-600">{order.totalPeople} 人</span>
      </div>
      <Step3TouristInfo
        mode="order-edit"
        orderNo={order.orderNo}
        initialGroupName={order.groupName}
        roomData={roomData}
        onNext={handleSubmit}
        onPrev={() => navigate('/dealer/orders/cruise')}
      />
    </div>
  )
}
