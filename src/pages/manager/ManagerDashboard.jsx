// src/routes/manager/manager_router.jsx
import React from "react"
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard, Package, FileText, Users,
  ShoppingCart, DollarSign, ArrowLeftRight, CreditCard
} from "lucide-react"

import Layout from "../../layouts/adminLayout"
import DashboardHome from "../admin/DashboardHome"
import InventoryManagement from "../admin/InventoryManagement"
import InvoiceManagement from "../admin/InvoiceManagement"
import ClientCards from "./ClientCards"
import TransferManagement from "../admin/TransferManagement"
import UserManagement from "../admin/UserManagement"
import PurchaseOrders from "../admin/PurchaseOrders"
import ExpenseManagement from "../admin/ExpenseManagement"
// import StoreManagement from "../../pages/manager/StoreManagement" // imported in original but not wired to any menu item — add a route if needed

import { useSelector } from "react-redux"
import { useLogout } from "../../hooks/useAuth"

// Amber theme — same as admin, so no `theme` prop needed (Layout defaults to this)
const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/manager/dashboard" },
  { id: "inventory", label: "Master Inventory", icon: Package, path: "/manager/inventory" },
  { id: "invoices", label: "Invoices", icon: FileText, path: "/manager/invoices" },
  { id: "client-cards", label: "Client Cards", icon: CreditCard, path: "/manager/client-cards" },
  { id: "transfers", label: "Store Transfers", icon: ArrowLeftRight, path: "/manager/transfers" },
  { id: "sales-team", label: "Sales Team", icon: Users, path: "/manager/sales-team" },
  { id: "purchase", label: "Purchase Orders", icon: ShoppingCart, path: "/manager/purchase" },
  { id: "expenses", label: "Expenses", icon: DollarSign, path: "/manager/expenses" },
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
      subtitle="Manager Panel"
      logoSrc="/src/imports/475883765_1412800516794054_7992306912571437520_n-1.jpg"
      items={navigationItems}
      activeId={activeItem.id}
      onSelect={handleSelect}
      onLogout={logout}
      user={user}
      // theme omitted — amber/orange is the Layout default, same as admin
    >
      {children}
    </Layout>
  )
}

export default function ManagerDashboard() {
  const user = useSelector((state) => state.app.userInfo)

  return (
    <LayoutWrapper user={user}>
      <Routes>
        <Route path="/" element={<Navigate to="/manager/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardHome user={user} />} />
        <Route path="/inventory" element={<InventoryManagement user={user} />} />
        <Route path="/invoices" element={<InvoiceManagement user={user} />} />
        <Route path="/client-cards" element={<ClientCards user={user} />} />
        <Route path="/transfers" element={<TransferManagement user={user} />} />
        <Route path="/sales-team" element={<UserManagement user={user} />} />
        <Route path="/purchase" element={<PurchaseOrders user={user} />} />
        <Route path="/expenses" element={<ExpenseManagement user={user} />} />
        <Route path="*" element={<Navigate to="/manager/dashboard" replace />} />
      </Routes>
    </LayoutWrapper>
  )
}