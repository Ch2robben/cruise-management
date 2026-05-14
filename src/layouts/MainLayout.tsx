import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function MainLayout() {
  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
