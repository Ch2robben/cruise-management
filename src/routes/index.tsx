import { createBrowserRouter, Navigate } from 'react-router-dom'
import AuthLayout from '@/layouts/AuthLayout'
import MainLayout from '@/layouts/MainLayout'
import ProtectedRoute from './ProtectedRoute'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import PortPage from '@/pages/resources/PortPage'
import AttractionPage from '@/pages/resources/AttractionPage'
import RoutePage from '@/pages/resources/RoutePage'
import ProductPage from '@/pages/resources/ProductPage'
import ShipPage from '@/pages/resources/ShipPage'
import VoyagePage from '@/pages/voyage/VoyagePage'
import TemplatePage from '@/pages/voyage/TemplatePage'
import TicketPage from '@/pages/resources/TicketPage'
import FacilityPage from '@/pages/resources/FacilityPage'
import RoomPage from '@/pages/resources/RoomPage'
import InventoryPage from '@/pages/voyage/InventoryPage'
import PricingPage from '@/pages/voyage/PricingPage'
import UserPage from '@/pages/system/UserPage'
import RolePage from '@/pages/system/RolePage'
import MenuPage from '@/pages/system/MenuPage'
import DictionaryPage from '@/pages/system/DictionaryPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/voyage/list" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      // { path: '/dashboard', element: <DashboardPage /> },
      { path: '/resources/ports', element: <PortPage /> },
      { path: '/resources/attractions', element: <AttractionPage /> },
      { path: '/resources/routes', element: <RoutePage /> },
      { path: '/resources/products', element: <ProductPage /> },
      { path: '/resources/ships', element: <ShipPage /> },
      { path: '/voyage/list', element: <VoyagePage /> },
      { path: '/voyage/templates', element: <TemplatePage /> },
      { path: '/voyage/inventory', element: <InventoryPage /> },
      { path: '/voyage/pricing', element: <PricingPage /> },
      { path: '/resources/tickets', element: <TicketPage /> },
      { path: '/resources/facilities', element: <FacilityPage /> },
      { path: '/resources/rooms', element: <RoomPage /> },
      { path: '/system/users', element: <UserPage /> },
      { path: '/system/roles', element: <RolePage /> },
      { path: '/system/menus', element: <MenuPage /> },
      { path: '/system/dictionaries', element: <DictionaryPage /> },
    ],
  },
])
