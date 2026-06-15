import { createBrowserRouter, Navigate } from 'react-router-dom'
import AuthLayout from '@/layouts/AuthLayout'
import MainLayout from '@/layouts/MainLayout'
import ProtectedRoute from './ProtectedRoute'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import PortPage from '@/pages/resources/PortPage'
import PortDistancePage from '@/pages/resources/PortDistancePage'
import AttractionPage from '@/pages/resources/AttractionPage'
import RoutePage from '@/pages/resources/RoutePage'
import ItineraryManagementPage from '@/pages/resources/ItineraryManagementPage'
import ProductPage from '@/pages/resources/ProductPage'
import ShipPage from '@/pages/resources/ShipPage'
import VoyagePage from '@/pages/voyage/VoyagePage'
import TemplatePage from '@/pages/voyage/TemplatePage'
import TicketPage from '@/pages/resources/TicketPage'
import FacilityPage from '@/pages/resources/FacilityPage'
import RoomPage from '@/pages/resources/RoomPage'
import CabinPage from '@/pages/resources/CabinPage'
import InventoryPage from '@/pages/voyage/InventoryPage'
import PriceManagementPage from '@/pages/voyage/PriceManagementPage'
import TemplateInventoryPage from '@/pages/voyage/TemplateInventoryPage'
import TemplatePricePage from '@/pages/voyage/TemplatePricePage'
import PricingPage from '@/pages/voyage/PricingPage'
import PricingRulePage from '@/pages/voyage/PricingRulePage'
import SalesControlPage from '@/pages/voyage/SalesControlPage'
import UserPage from '@/pages/system/UserPage'
import RolePage from '@/pages/system/RolePage'
import MenuPage from '@/pages/system/MenuPage'
import DictionaryPage from '@/pages/system/DictionaryPage'
import DealerPage from '@/pages/distribution/DealerPage'
import CabinHoldPage from '@/pages/distribution/CabinHoldPage'
import CharterOrderPage from '@/pages/service/CharterOrderPage'
import ComplaintTicketPage from '@/pages/service/ComplaintTicketPage'
import CustomerProfilePage from '@/pages/customer/CustomerProfilePage'
import ReconciliationPage from '@/pages/finance/ReconciliationPage'
import DataReportPage from '@/pages/report/DataReportPage'
import OrderListPage from '@/pages/order/OrderListPage'
import HolidayPage from '@/pages/basic/HolidayPage'
import IdTypePage from '@/pages/basic/IdTypePage'
import AgeGroupPage from '@/pages/basic/AgeGroupPage'
import ApprovalFlowPage from '@/pages/system/ApprovalFlowPage'

import DepositRulePage from '@/pages/rule/DepositRulePage'
import PaymentRulePage from '@/pages/rule/PaymentRulePage'
import PenaltyRulePage from '@/pages/rule/PenaltyRulePage'
import PenaltyHandlingDictPage from '@/pages/rule/PenaltyHandlingDictPage'
import DiscountRulePage from '@/pages/rule/DiscountRulePage'
import TipConfigPage from '@/pages/rule/TipConfigPage'
import OrderValidityRulePage from '@/pages/rule/OrderValidityRulePage'
import WarningRulePage from '@/pages/rule/WarningRulePage'
import GroupAuthPage from '@/pages/rule/GroupAuthPage'
import RefundRulePage from '@/pages/rule/RefundRulePage'
import ShipAuthPage from '@/pages/rule/ShipAuthPage'
import CloseRulePage from '@/pages/rule/CloseRulePage'
import PerformanceRulePage from '@/pages/rule/PerformanceRulePage'

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
      { path: '/resources/ports', element: <PortPage /> },
      { path: '/resources/port-distances', element: <PortDistancePage /> },
      { path: '/resources/attractions', element: <AttractionPage /> },
      { path: '/resources/routes', element: <RoutePage /> },
      { path: '/resources/itineraries', element: <ItineraryManagementPage /> },
      { path: '/resources/products', element: <ProductPage /> },
      { path: '/resources/ships', element: <ShipPage /> },
      { path: '/voyage/list', element: <VoyagePage /> },
      { path: '/voyage/templates', element: <TemplatePage /> },
      { path: '/voyage/templates/:id/price', element: <TemplatePricePage /> },
      { path: '/voyage/inventory', element: <InventoryPage /> },
      { path: '/voyage/pricing-rules', element: <PricingRulePage /> },
      { path: '/voyage/price-management', element: <PriceManagementPage /> },
      { path: '/voyage/sales-control', element: <SalesControlPage /> },
      { path: '/voyage/template-inventory', element: <TemplateInventoryPage /> },
      { path: '/voyage/pricing', element: <PricingPage /> },
      { path: '/orders/list', element: <OrderListPage /> },
      { path: '/distribution/dealers', element: <DealerPage /> },
      { path: '/distribution/dealer-approvals', element: <DealerPage /> },
      { path: '/distribution/dealer-rules', element: <DealerPage /> },
      { path: '/distribution/dealer-change-logs', element: <DealerPage /> },
      { path: '/distribution/cabin-holds', element: <CabinHoldPage /> },
      { path: '/service/charter-orders', element: <CharterOrderPage /> },
      { path: '/service/complaints', element: <ComplaintTicketPage /> },
      { path: '/customer/profiles', element: <CustomerProfilePage /> },
      { path: '/finance/reconciliations', element: <ReconciliationPage /> },
      { path: '/report/data-reports', element: <DataReportPage /> },
      { path: '/resources/tickets', element: <TicketPage /> },
      { path: '/resources/facilities', element: <FacilityPage /> },
      { path: '/resources/rooms', element: <RoomPage /> },
      { path: '/resources/cabins', element: <CabinPage /> },
      { path: '/basic/holidays', element: <HolidayPage /> },
      { path: '/basic/id-types', element: <IdTypePage /> },
      { path: '/basic/age-groups', element: <AgeGroupPage /> },
      { path: '/system/users', element: <UserPage /> },
      { path: '/system/roles', element: <RolePage /> },
      { path: '/system/menus', element: <MenuPage /> },
      { path: '/system/dictionaries', element: <DictionaryPage /> },
      { path: '/system/approval-flows', element: <ApprovalFlowPage /> },
      { path: '/rule/deposit', element: <DepositRulePage /> },
      { path: '/rule/payment', element: <PaymentRulePage /> },
      { path: '/rule/penalty', element: <PenaltyRulePage /> },
      { path: '/rule/penalty-handling', element: <PenaltyHandlingDictPage /> },
      { path: '/rule/dealer-cooperation', element: <DealerPage /> },
      { path: '/rule/discount', element: <DiscountRulePage /> },
      { path: '/rule/tip', element: <TipConfigPage /> },
      { path: '/rule/order-validity', element: <OrderValidityRulePage /> },
      { path: '/rule/warning', element: <WarningRulePage /> },
      { path: '/rule/group-auth', element: <GroupAuthPage /> },
      { path: '/rule/refund', element: <RefundRulePage /> },
      { path: '/rule/ship-auth', element: <ShipAuthPage /> },
      { path: '/rule/close', element: <CloseRulePage /> },
      { path: '/rule/performance', element: <PerformanceRulePage /> },
    ],
  },
], {
  basename: '/',
})
