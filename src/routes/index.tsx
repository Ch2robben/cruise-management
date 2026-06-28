import { createBrowserRouter, Navigate, useParams, useSearchParams } from 'react-router-dom'
import AuthLayout from '@/layouts/AuthLayout'
import MainLayout from '@/layouts/MainLayout'
import DealerLayout from '@/layouts/DealerLayout'
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
import SellRoomTypeConfigPage from '@/pages/resources/SellRoomTypeConfigPage'
import InventoryPage from '@/pages/voyage/InventoryPage'
import InventoryAllocationPage from '@/pages/voyage/InventoryAllocationPage'
import PriceManagementPage from '@/pages/voyage/PriceManagementPage'
import TemplatePricePage from '@/pages/voyage/TemplatePricePage'
import VoyageInventoryTemplatePage from '@/pages/voyage/VoyageInventoryTemplatePage'
import VoyagePriceTemplatePage from '@/pages/voyage/VoyagePriceTemplatePage'
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
import SupplementaryPaymentPage from '@/pages/finance/SupplementaryPaymentPage'
import DataReportPage from '@/pages/report/DataReportPage'
import OrderListPage from '@/pages/order/OrderListPage'
import VoyagePassengerRoomPage from '@/pages/order/VoyagePassengerRoomPage'
import HolidayPage from '@/pages/basic/HolidayPage'
import IdTypePage from '@/pages/basic/IdTypePage'
import AgeGroupPage from '@/pages/basic/AgeGroupPage'
import ApprovalFlowPage from '@/pages/system/ApprovalFlowPage'

import DealerHomePage from '@/pages/dealer/DealerHomePage'
import CruiseBookingPage from '@/pages/dealer/booking/CruiseBookingPage'
import SpecialPriceBookingPage from '@/pages/dealer/booking/SpecialPriceBookingPage'
import BoatBookingPage from '@/pages/dealer/booking/BoatBookingPage'
import FlightQueryPage from '@/pages/dealer/booking/FlightQueryPage'
import ComboSalesPage from '@/pages/dealer/booking/ComboSalesPage'
import DealerCruiseOrderPage from '@/pages/dealer/order/DealerCruiseOrderPage'
import DealerOrderTouristPage from '@/pages/dealer/order/DealerOrderTouristPage'
import DealerSpecialPriceApplicationPage from '@/pages/dealer/order/DealerSpecialPriceApplicationPage'
import DealerCruiseSalesStatsPage from '@/pages/dealer/stats/DealerCruiseSalesStatsPage'

import DepositRulePage from '@/pages/rule/DepositRulePage'
import PaymentRulePage from '@/pages/rule/PaymentRulePage'
import PenaltyRulePage from '@/pages/rule/PenaltyRulePage'
import PenaltyHandlingDictPage from '@/pages/rule/PenaltyHandlingDictPage'
import DiscountRulePage from '@/pages/rule/DiscountRulePage'
import RebateTargetIndicatorPage from '@/pages/rule/RebateTargetIndicatorPage'
import TipConfigPage from '@/pages/rule/TipConfigPage'
import OrderValidityRulePage from '@/pages/rule/OrderValidityRulePage'
import WarningRulePage from '@/pages/rule/WarningRulePage'
import GroupAuthPage from '@/pages/rule/GroupAuthPage'
import RefundRulePage from '@/pages/rule/RefundRulePage'
import ShipAuthPage from '@/pages/rule/ShipAuthPage'
import CloseRulePage from '@/pages/rule/CloseRulePage'
import PerformanceRulePage from '@/pages/rule/PerformanceRulePage'
import RebateRulePage from '@/pages/rule/RebateRulePage'
import PricePolicyTypePage from '@/pages/rule/PriceTypeRulePage'

function LegacyTemplatePriceRedirect() {
  const { id } = useParams()
  return <Navigate to={id ? `/voyage/price-templates/${id}` : '/voyage/price-templates'} replace />
}

function InventoryTemplateDetailRedirect() {
  const { id } = useParams()
  return <Navigate to={id ? `/voyage/inventory-templates?templateId=${id}` : '/voyage/inventory-templates'} replace />
}

function LegacyTemplateInventoryRedirect() {
  const [searchParams] = useSearchParams()
  const templateId = searchParams.get('templateId')
  return <Navigate to={templateId ? `/voyage/inventory-templates?templateId=${templateId}` : '/voyage/inventory-templates'} replace />
}

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
      { path: '/voyage/templates/:id/price', element: <LegacyTemplatePriceRedirect /> },
      { path: '/voyage/price-templates', element: <VoyagePriceTemplatePage /> },
      { path: '/voyage/price-templates/:id', element: <TemplatePricePage /> },
      { path: '/voyage/inventory-templates', element: <VoyageInventoryTemplatePage /> },
      { path: '/voyage/inventory-templates/:id', element: <InventoryTemplateDetailRedirect /> },
      { path: '/voyage/inventory', element: <InventoryPage /> },
      { path: '/voyage/inventory-allocation', element: <InventoryAllocationPage /> },
      { path: '/voyage/pricing-rules', element: <PricingRulePage /> },
      { path: '/voyage/price-management', element: <PriceManagementPage /> },
      { path: '/voyage/sales-control', element: <SalesControlPage /> },
      { path: '/voyage/template-inventory', element: <LegacyTemplateInventoryRedirect /> },
      { path: '/voyage/pricing', element: <PricingPage /> },
      { path: '/orders/list', element: <OrderListPage /> },
      { path: '/orders/voyage-passenger-rooms', element: <VoyagePassengerRoomPage /> },
      { path: '/distribution/dealers', element: <DealerPage /> },
      { path: '/distribution/dealer-approvals', element: <DealerPage /> },
      { path: '/distribution/dealer-rules', element: <DealerPage /> },
      { path: '/distribution/dealer-change-logs', element: <DealerPage /> },
      { path: '/distribution/cabin-holds', element: <CabinHoldPage /> },
      { path: '/service/charter-orders', element: <CharterOrderPage /> },
      { path: '/service/complaints', element: <ComplaintTicketPage /> },
      { path: '/customer/profiles', element: <CustomerProfilePage /> },
      { path: '/finance/reconciliations', element: <ReconciliationPage /> },
      { path: '/finance/supplementary-payments', element: <SupplementaryPaymentPage /> },
      { path: '/report/data-reports', element: <DataReportPage /> },
      { path: '/resources/tickets', element: <TicketPage /> },
      { path: '/resources/facilities', element: <FacilityPage /> },
      { path: '/resources/rooms', element: <RoomPage /> },
      { path: '/resources/cabins', element: <CabinPage /> },
      { path: '/resources/sell-room-type-configs', element: <SellRoomTypeConfigPage /> },
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
      { path: '/rule/price-type', element: <PricePolicyTypePage /> },
      { path: '/rule/tip', element: <TipConfigPage /> },
      { path: '/rule/order-validity', element: <OrderValidityRulePage /> },
      { path: '/rule/warning', element: <WarningRulePage /> },
      { path: '/rule/group-auth', element: <GroupAuthPage /> },
      { path: '/rule/refund', element: <RefundRulePage /> },
      { path: '/rule/ship-auth', element: <ShipAuthPage /> },
      { path: '/rule/close', element: <CloseRulePage /> },
      { path: '/rule/performance', element: <PerformanceRulePage /> },
      { path: '/rule/rebate', element: <RebateRulePage /> },
      { path: '/rule/rebate-targets', element: <RebateTargetIndicatorPage /> },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <DealerLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/dealer/home', element: <DealerHomePage /> },
      { path: '/dealer/booking/cruise', element: <CruiseBookingPage /> },
      { path: '/dealer/booking/special-price', element: <SpecialPriceBookingPage /> },
      { path: '/dealer/booking/boat', element: <BoatBookingPage /> },
      { path: '/dealer/booking/flight', element: <FlightQueryPage /> },
      { path: '/dealer/booking/combo-sales', element: <ComboSalesPage /> },
      { path: '/dealer/orders/cruise', element: <DealerCruiseOrderPage /> },
      { path: '/dealer/orders/special-price', element: <DealerSpecialPriceApplicationPage /> },
      { path: '/dealer/orders/cruise/tourists', element: <DealerOrderTouristPage /> },
      { path: '/dealer/stats/cruise-sales', element: <DealerCruiseSalesStatsPage /> },
    ],
  },
], {
  basename: '/',
})
