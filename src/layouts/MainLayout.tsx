import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import TopNav from '@/components/layout/TopNav'

export default function MainLayout() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopNav />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-y-auto bg-[#f0f2f5] p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
