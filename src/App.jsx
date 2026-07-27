// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

import Login from "./pages/auth/Login";
import Unauthorized from "./pages/error/Unauthorized";
import NotFound from "./pages/error/NotFound";

import AdminDashboard from "./pages/admin/AdminDashboard";
// import ManagerDashboard from "./pages/manager/Dashboard";
import StaffDashboard from "./pages/sales/SalesDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Admin only */}
          {/* element={<ProtectedRoute allowedRoles={["admin"]} />} */}
          <Route>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          {/* Manager only */}
          {/* <Route element={<ProtectedRoute allowedRoles={["manager"]} />}>
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
          </Route> */}

          {/* Staff, and also accessible to admin/manager */}
          <Route element={<ProtectedRoute allowedRoles={["staff", "manager", "admin"]} />}>
            <Route path="/sales/dashboard" element={<StaffDashboard />} />
          </Route>

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}