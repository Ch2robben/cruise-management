import { Outlet } from 'react-router-dom'
import { Ship } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <Ship className="w-8 h-8 text-gray-900" />
            <h1 className="text-xl font-bold text-gray-900">长航集团游轮管理系统</h1>
          </div>
          <p className="text-sm text-gray-500">中国内河及沿海游轮综合管理平台</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
