// src/routes/admin/admin_router.jsx
import React from "react"
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard, Store, Package, FileText, Users,
  ArrowLeftRight, ShoppingCart, DollarSign,
  TrendingUp, RotateCcw, Receipt, BarChart3
} from "lucide-react"

import Layout from "../../layouts/adminLayout"
import DashboardHome from "../../pages/admin/DashboardHome"
import StoreManagement from "../../pages/admin/StoreManagement"
import InventoryManagement from "../../pages/admin/InventoryManagement"
import InvoiceManagement from "../../pages/admin/InvoiceManagement"
import SalesReturn from "../../pages/admin/SalesReturn"
import UserManagement from "../../pages/admin/UserManagement"
import TransferManagement from "../../pages/admin/TransferManagement"
import PurchaseOrders from "../../pages/admin/PurchaseOrders"
import PurchaseBills from "../../pages/admin/PurchaseBills"
import ExpenseManagement from "../../pages/admin/ExpenseManagement"
import GSTReports from "../../pages/admin/GSTReports"
import ProfitLoss from "../../pages/admin/ProfitLoss"

import { useSelector } from "react-redux"
import { useLogout } from "../../hooks/useAuth"
import { StoreContext, useStoreContext } from "../../context/storeContext"
import { useLoggedUserContext } from "../../context/loggedUserContext"

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { id: "stores", label: "Stores", icon: Store, path: "/admin/stores" },
  { id: "inventory", label: "Master Inventory", icon: Package, path: "/admin/inventory" },
  { id: "invoices", label: "Sales Invoices", icon: FileText, path: "/admin/invoices" },
  { id: "sales-return", label: "Sales Return", icon: RotateCcw, path: "/admin/sales-return" },
  { id: "users", label: "Users", icon: Users, path: "/admin/users" },
  { id: "transfers", label: "Store Transfers", icon: ArrowLeftRight, path: "/admin/transfers" },
  { id: "purchase", label: "Purchase Orders", icon: ShoppingCart, path: "/admin/purchase" },
  { id: "purchase-bills", label: "Purchase Bills", icon: Receipt, path: "/admin/purchase-bills" },
  { id: "expenses", label: "Expenses", icon: DollarSign, path: "/admin/expenses" },
  { id: "gst-reports", label: "GST Reports", icon: BarChart3, path: "/admin/gst-reports" },
  { id: "profit-loss", label: "Profit & Loss", icon: TrendingUp, path: "/admin/profit-loss" },
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
      logoSrc="/src/imports/475883765_1412800516794054_7992306912571437520_n-1.jpg"
      items={navigationItems}
      activeId={activeItem.id}
      onSelect={handleSelect}
      onLogout={logout}
      user={user}
    >
      {children}
    </Layout>
  )
}

export default function AdminRouter() {
  const { loggedUser} = useLoggedUserContext();
  const user =  useSelector((state) => state.app.userInfo) || loggedUser

  return (
    <LayoutWrapper user={user}>
      <StoreContext.Provider value={useStoreContext()}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardHome user={user} />} />
          <Route path="/stores" element={<StoreManagement user={user} />} />
          <Route path="/inventory" element={<InventoryManagement user={user} />} />
          <Route path="/invoices" element={<InvoiceManagement user={user} />} />
          <Route path="/sales-return" element={<SalesReturn user={user} />} />
          <Route path="/users" element={<UserManagement user={user} />} />
          <Route path="/transfers" element={<TransferManagement user={user} />} />
          <Route path="/purchase" element={<PurchaseOrders user={user} />} />
          <Route path="/purchase-bills" element={<PurchaseBills user={user} />} />
          <Route path="/expenses" element={<ExpenseManagement user={user} />} />
          <Route path="/gst-reports" element={<GSTReports user={user} />} />
          <Route path="/profit-loss" element={<ProfitLoss user={user} />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </StoreContext.Provider>
    </LayoutWrapper>
  )
}