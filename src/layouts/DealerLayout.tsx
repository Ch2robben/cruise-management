import { Outlet } from 'react-router-dom'
import DealerSidebar from '@/components/layout/DealerSidebar'
import Header from '@/components/layout/Header'

export default function DealerLayout() {
  return (
    <div className="h-screen flex overflow-hidden">
      <DealerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
