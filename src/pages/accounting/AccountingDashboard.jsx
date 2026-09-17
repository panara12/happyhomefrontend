// src/routes/accounting/accounting_router.jsx
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard, Receipt, RotateCcw, ArrowLeftRight, Package, FileText
} from "lucide-react"

import Layout from "../../layouts/adminLayout"
import DashboardHome from "../../pages/admin/DashboardHome"
import AccountingPurchaseBills from "../../pages/accounting/AccountingPurchaseBills"
import DistributorReturns from "../../pages/accounting/DistributorReturns"
import InventoryManagement from "../../pages/admin/InventoryManagement"
import ViewTransfers from "../../pages/accounting/ViewTransfers"
import ManagerInvoices from "../manager/ManagerInvoices"

import { useSelector } from "react-redux"
import { useLogout } from "../../hooks/useAuth"
import logoImg from "../../assets/logo.jpg"
import AddCategory from "./AddCategory"
import AddBrand from "./addBrand"
import { StoreContext, useStoreContext } from "../../context/storeContext"

const ACCOUNTING_THEME = {
  gradientFrom: "from-indigo-900",
  gradientTo: "to-purple-900",
  activeBg: "bg-white",
  activeText: "text-indigo-900",
  hoverBg: "hover:bg-indigo-800",
  idleText: "text-indigo-100",
  border: "border-indigo-700",
  panel: "bg-indigo-800",
  subtitleText: "text-indigo-200",
  subtitleText2: "text-indigo-300",
}

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/accounting/dashboard" },
  { id: "invoices", label: "Sales Invoices", icon: FileText, path: "/accounting/invoices" },
  { id: "purchase-bills", label: "Purchase Bills", icon: Receipt, path: "/accounting/purchase-bills" },
  { id: "distributor-returns", label: "Distributor Returns", icon: RotateCcw, path: "/accounting/distributor-returns" },
  { id: "transfers", label: "View Transfers", icon: ArrowLeftRight, path: "/accounting/transfers" },
  { id: "inventory", label: "Inventory Status", icon: Package, path: "/accounting/inventory" },
  { id: "category", label: "Category", icon: Package, path: "/accounting/category" },
  { id: "brand", label: "Brand", icon: Package, path: "/accounting/brand" },
]

function LayoutWrapper({ children, user }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { mutate: logout } = useLogout()

  const activeItem = navigationItems.find(item => location.pathname === item.path) || navigationItems[0]

  const handleSelect = (id) => {
    const item = navigationItems.find(n => n.id === id)
    if (item) navigate(item.path)
  }

  return (
    <Layout
      title="Happy Home"
      subtitle="Accounting Department"
      logoSrc={logoImg}
      items={navigationItems}
      activeId={activeItem.id}
      onSelect={handleSelect}
      onLogout={logout}
      user={user}
      theme={ACCOUNTING_THEME}
    >
      {children}
    </Layout>
  )
}

export default function AccountingRouter() {
  const user = useSelector((state) => state.app.userInfo)

  return (
    <LayoutWrapper user={user}>
      <StoreContext.Provider value={useStoreContext()}>
        <Routes>
          <Route path="/" element={<Navigate to="/accounting/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardHome user={user} />} />
          <Route path="/invoices" element={<ManagerInvoices />} />
          <Route path="/purchase-bills" element={<AccountingPurchaseBills user={user} />} />
          <Route path="/distributor-returns" element={<DistributorReturns user={user} />} />
          <Route path="/transfers" element={<ViewTransfers user={user} />} />
          <Route path="/category" element={<AddCategory user={user} />} />
          <Route path="/brand" element={<AddBrand user={user} />} />
          <Route path="/inventory" element={<InventoryManagement user={user} />} />
          <Route path="*" element={<Navigate to="/accounting/dashboard" replace />} />
        </Routes>
      </StoreContext.Provider>
    </LayoutWrapper>
  )
}