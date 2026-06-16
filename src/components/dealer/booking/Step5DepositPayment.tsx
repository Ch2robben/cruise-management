import React, { useState } from 'react'
import { Wallet, Landmark, CreditCard, Smartphone } from 'lucide-react'

export default function Step5DepositPayment({ onNext, onPrev }: { onNext: () => void, onPrev: () => void }) {
  const [selectedMethod, setSelectedMethod] = useState('balance')

  const handlePayment = () => {
    // In a real app we'd call an API here
    onNext()
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">支付定金</h2>
        <p className="text-gray-500">请支付定金以锁定房间及船位</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <span className="text-gray-500">订单号</span>
          <span className="font-mono text-gray-900 font-medium">#CZ20260615001</span>
        </div>
        <div className="flex items-center justify-between pb-2">
          <span className="text-gray-500">需支付定金</span>
          <span className="text-2xl font-bold text-red-500">¥3,900</span>
        </div>
      </div>

      <h3 className="font-semibold text-gray-800 mb-4 px-1">选择支付方式</h3>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div 
          className={`p-5 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center text-center ${selectedMethod === 'balance' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 bg-white'}`}
          onClick={() => setSelectedMethod('balance')}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${selectedMethod === 'balance' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
            <Wallet className="w-6 h-6" />
          </div>
          <div className="font-semibold text-gray-900 mb-1">预存余额支付</div>
          <div className="text-xs text-gray-500">可用余额：¥86,400</div>
        </div>

        <div 
          className={`p-5 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center text-center ${selectedMethod === 'credit' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 bg-white'}`}
          onClick={() => setSelectedMethod('credit')}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${selectedMethod === 'credit' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
            <Landmark className="w-6 h-6" />
          </div>
          <div className="font-semibold text-gray-900 mb-1">授信额度支付</div>
          <div className="text-xs text-gray-500">可用额度：¥156,800</div>
        </div>
        
        <div 
          className={`p-5 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center text-center ${selectedMethod === 'alipay' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 bg-white'}`}
          onClick={() => setSelectedMethod('alipay')}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${selectedMethod === 'alipay' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="font-semibold text-gray-900 mb-1">支付宝/微信</div>
          <div className="text-xs text-gray-500">扫码在线支付</div>
        </div>
        
        <div 
          className={`p-5 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center text-center ${selectedMethod === 'transfer' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 bg-white'}`}
          onClick={() => setSelectedMethod('transfer')}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${selectedMethod === 'transfer' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
            <Landmark className="w-6 h-6" />
          </div>
          <div className="font-semibold text-gray-900 mb-1">银行转账汇款</div>
          <div className="text-xs text-gray-500">上传转账凭证审核</div>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button className="px-8 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors" onClick={onPrev}>
          ← 返回订单确认
        </button>
        <button className="px-8 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm font-medium flex items-center gap-2" onClick={handlePayment}>
          确认支付 ¥3,900
        </button>
      </div>
    </div>
  )
}
