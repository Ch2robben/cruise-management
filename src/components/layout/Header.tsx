import { useAuthStore } from '@/stores/authStore'
import { LogOut, User, Repeat } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { APP_UPDATED_AT, APP_VERSION } from '@/config/appMeta'

export default function Header() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const location = useLocation()
  const isDealerPortal = location.pathname.startsWith('/dealer')

  const handleSwitchPortal = () => {
    if (isDealerPortal) {
      navigate('/voyage/list')
    } else {
      navigate('/dealer/home')
    }
  }

  return (
    <header className="min-h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 py-2 shrink-0">
      <div className="flex flex-col gap-0.5">
        <div className="text-sm text-gray-500">
          欢迎回来，<span className="text-gray-900 font-medium">{user?.name}</span>
        </div>
        <div className="text-[11px] leading-4 text-gray-400">
          版本 {APP_VERSION} · 更新时间 {APP_UPDATED_AT}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <User className="w-4 h-4" />
          <span>{user?.roleName}</span>
        </div>
        <button
          onClick={handleSwitchPortal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
        >
          <Repeat className="w-4 h-4" />
          {isDealerPortal ? '切换到后台管理' : '切换到分销台'}
        </button>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>
    </header>
  )
}
