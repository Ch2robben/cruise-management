import { useAuthStore } from '@/stores/authStore'
import { LogOut, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Header() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <div className="text-sm text-gray-500">
        欢迎回来，<span className="text-gray-900 font-medium">{user?.name}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <User className="w-4 h-4" />
          <span>{user?.roleName}</span>
        </div>
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
