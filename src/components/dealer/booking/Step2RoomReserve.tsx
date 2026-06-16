import React, { useState, useMemo } from 'react'
import { defaultRoomReserveData } from '@/mock/data'
import { Info, Minus, Plus } from 'lucide-react'

export default function Step2RoomReserve({ onNext, onPrev }: { onNext: (data: any) => void, onPrev: () => void }) {
  const [roomData, setRoomData] = useState<any>(JSON.parse(JSON.stringify(defaultRoomReserveData)))

  const totalRooms = useMemo(() => {
    return Object.values(roomData).reduce((sum: number, room: any) => sum + room.count, 0)
  }, [roomData])

  const totalDeposit = useMemo(() => {
    let total = 0
    Object.entries(roomData).forEach(([key, room]: [string, any]) => {
      if (key === '标准间') {
        total += room.deposit * 2 * room.count
      } else {
        total += room.deposit * room.count
      }
    })
    return total
  }, [roomData])

  const changeRoomCount = (roomType: string, delta: number) => {
    setRoomData((prev: any) => {
      const newData = { ...prev }
      const room = newData[roomType]
      if (!room) return prev

      let newVal = room.count + delta
      if (newVal < 0) newVal = 0
      if (newVal > room.maxRooms) {
        alert('已超过可售库存！')
        return prev
      }
      room.count = newVal
      return newData
    })
  }

  const onCountChange = (roomType: string, val: string) => {
    setRoomData((prev: any) => {
      const newData = { ...prev }
      const room = newData[roomType]
      if (!room) return prev

      let newVal = parseInt(val) || 0
      if (newVal < 0) newVal = 0
      if (newVal > room.maxRooms) {
        alert('已超过可售库存！')
        newVal = room.maxRooms
      }
      room.count = newVal
      return newData
    })
  }

  const calculateDeposit = (roomType: string) => {
    const room = roomData[roomType]
    if (!room || room.count === 0) return 0
    if (roomType === '标准间') return room.deposit * 2 * room.count
    return room.deposit * room.count
  }

  const handleNext = () => {
    if (totalRooms === 0) {
      if (!window.confirm('您尚未占舱，确定跳过占舱直接分配吗？')) {
        return
      }
    }
    onNext(roomData)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">提前占舱</h2>
        <span className="text-gray-600 text-sm">
          已占：<strong className="text-blue-600 text-lg mx-1">{totalRooms}</strong> 间房
        </span>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm mb-4">
        🚢 长江叁号 · 重庆→宜昌 · 2026-06-15 · 4天3晚
      </div>

      <div className="bg-blue-50/50 border border-blue-100 text-blue-600 px-4 py-3 rounded-lg text-sm mb-6 flex items-start gap-2">
        <Info className="w-5 h-5 shrink-0" />
        <span>提前锁定客房库存，支付定金后即可保留房间。后续陆续收客后再分配游客入住。</span>
      </div>

      <div className="space-y-4">
        {Object.entries(roomData).map(([key, room]: [string, any]) => (
          <div key={key} className="bg-white border border-gray-200 rounded-lg flex overflow-hidden hover:border-green-300 transition-colors shadow-sm">
            <div className="flex-1 p-5">
              <div className="flex items-center gap-2 mb-3">
                {room.badge && <span className="bg-red-50 text-red-500 text-[11px] px-2 py-0.5 rounded-full font-medium">{room.badge}</span>}
                <h3 className="text-lg font-bold text-gray-900">{key}</h3>
              </div>
              <div className="flex gap-6 text-sm text-gray-600">
                <span><span className="text-gray-400 mr-1">床型</span>{room.bedType}</span>
                <span><span className="text-gray-400 mr-1">剩余</span><strong className="text-gray-900 mx-0.5">{room.maxRooms - room.count}</strong>间</span>
                <span><span className="text-gray-400 mr-1">定金</span>¥{room.deposit}{key === '标准间' ? '/床' : '/间'}</span>
              </div>
            </div>
            <div className="w-56 bg-gray-50 border-l border-gray-100 p-5 flex flex-col items-center justify-center gap-2 shrink-0">
              <div className="text-xl font-bold text-red-500">
                ¥{room.price.toLocaleString()} <span className="text-xs text-gray-400 font-normal">/间</span>
              </div>
              <div className="flex items-center">
                <button className="w-8 h-8 flex items-center justify-center border border-gray-300 bg-white hover:bg-gray-100 rounded-l transition-colors" onClick={() => changeRoomCount(key, -1)}>
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <input 
                  type="number" 
                  className="w-12 h-8 border-y border-gray-300 text-center text-sm font-semibold outline-none" 
                  value={room.count} 
                  onChange={e => onCountChange(key, e.target.value)} 
                />
                <button className="w-8 h-8 flex items-center justify-center border border-gray-300 bg-white hover:bg-gray-100 rounded-r transition-colors" onClick={() => changeRoomCount(key, 1)}>
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className={`text-xs px-2.5 py-0.5 rounded-full ${room.count > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                {room.count > 0 ? `已占 ${room.count} 间` : '未占舱'}
              </div>
              <div className="text-xs text-gray-500">
                定金：¥{calculateDeposit(key).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalRooms > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6 flex justify-between items-center">
          <span className="text-gray-800 text-sm">已占 {totalRooms} 间房</span>
          <span className="text-green-600 font-bold text-lg">定金合计：¥{totalDeposit.toLocaleString()}</span>
        </div>
      )}

      <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-gray-100">
        <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors" onClick={onPrev}>
          ← 上一步
        </button>
        <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm font-medium" onClick={handleNext}>
          下一步：分配游客 →
        </button>
      </div>
    </div>
  )
}
