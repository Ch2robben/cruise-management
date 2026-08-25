import { LogOut, Repeat, Ship, User } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { adminModules, findModuleByPath, firstLeafPath, isMenuPathMatch } from '@/config/adminMenu'
import { APP_UPDATED_AT, APP_VERSION } from '@/config/appMeta'
import { useAuthStore } from '@/stores/authStore'

export default function TopNav() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const activeModule = findModuleByPath(location.pathname)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSwitchModule = (moduleKey: string) => {
    const target = adminModules.find((m) => m.key === moduleKey)
    if (!target) return
    const stays = target.groups.some((g) => g.children.some((leaf) => isMenuPathMatch(location.pathname, leaf.path)))
    if (!stays) navigate(firstLeafPath(target))
  }

  return (
    <header className="h-14 bg-gray-900 text-gray-300 flex items-center px-4 shrink-0 border-b border-gray-800">
      <div className="flex items-center gap-2 pr-6 border-r border-gray-700 mr-4 shrink-0">
        <Ship className="w-5 h-5 text-blue-400" />
        <span className="text-sm font-semibold text-white whitespace-nowrap">某旅游公司游轮管理</span>
      </div>

      <nav className="flex items-stretch gap-1 flex-1 min-w-0 h-full">
        {adminModules.map((mod) => {
          const active = mod.key === activeModule.key
          return (
            <button
              key={mod.key}
              type="button"
              onClick={() => handleSwitchModule(mod.key)}
              className={`relative px-4 text-sm font-medium transition-colors ${
                active ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {mod.label}
              {active && <span className="absolute inset-x-3 bottom-0 h-0.5 bg-blue-500 rounded-t" />}
            </button>
          )
        })}
      </nav>

      <div className="flex items-center gap-3 shrink-0 pl-4">
        <div className="hidden lg:block text-[11px] leading-4 text-gray-500 text-right">
          版本 {APP_VERSION}
          <div>更新 {APP_UPDATED_AT}</div>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <User className="w-4 h-4" />
          <span>{user?.name}</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dealer/home')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Repeat className="w-4 h-4" />
          切换到分销台
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>
    </header>
  )
}
