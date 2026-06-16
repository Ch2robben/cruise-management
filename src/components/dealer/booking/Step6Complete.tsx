import React from 'react'
import { useNavigate } from 'react-router-dom'
import { PartyPopper, CheckCircle2, Circle } from 'lucide-react'

export default function Step6Complete() {
  const navigate = useNavigate()

  return (
    <div className="max-w-2xl mx-auto py-12 text-center">
      <div className="mb-6 flex justify-center animate-bounce">
        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center">
          <PartyPopper className="w-10 h-10" />
        </div>
      </div>
      
      <h2 className="text-3xl font-bold text-green-600 mb-4">预订成功！</h2>
      <p className="text-gray-600 mb-2">您的订单已成功创建并支付定金，房间已锁定</p>
      <p className="text-gray-500 text-sm mb-10">订单号：<span className="font-mono font-bold text-gray-800">#CZ20260615001</span></p>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-left mb-10 p-6">
        <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <div className="w-1 h-4 bg-blue-500 rounded-full" />
          后续流程
        </h3>
        
        <div className="relative pl-6 space-y-6">
          <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gray-200"></div>
          
          <div className="relative flex items-center">
            <CheckCircle2 className="w-5 h-5 text-green-500 absolute -left-[28px] bg-white" />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">1. 选择航线与航次、房型配置占舱</span>
            </div>
            <span className="text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded">已完成</span>
          </div>
          
          <div className="relative flex items-center">
            <CheckCircle2 className="w-5 h-5 text-green-500 absolute -left-[28px] bg-white" />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">2. 录入旅客信息、确认订单、支付定金</span>
            </div>
            <span className="text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded">已完成</span>
          </div>
          
          <div className="relative flex items-center">
            <div className="w-5 h-5 rounded-full border-2 border-blue-500 bg-white flex items-center justify-center absolute -left-[28px] ring-4 ring-blue-50">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            </div>
            <div className="flex-1">
              <span className="text-sm font-bold text-blue-600">3. 补录剩余旅客信息</span>
              <div className="text-xs text-gray-500 mt-1">请于 <span className="text-red-500">2026-06-10 12:00</span> 前完成名单补录</div>
            </div>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">待处理</span>
          </div>
          
          <div className="relative flex items-center opacity-60">
            <Circle className="w-5 h-5 text-gray-300 absolute -left-[28px] bg-white" />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-600">4. 支付尾款</span>
              <div className="text-xs text-gray-400 mt-1">出发前7天自动生成尾款账单</div>
            </div>
          </div>
          
          <div className="relative flex items-center opacity-60">
            <Circle className="w-5 h-5 text-gray-300 absolute -left-[28px] bg-white" />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-600">5. 接收出团通知、顺利登船</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button 
          className="px-8 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors shadow-sm font-medium"
          onClick={() => navigate('/dealer/orders/cruise')}
        >
          查看订单详情
        </button>
        <button 
          className="px-8 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm font-medium"
          onClick={() => window.location.reload()}
        >
          继续预定下一单
        </button>
      </div>
    </div>
  )
}
