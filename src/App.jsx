// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";

import Login from "./pages/auth/Login";
import Unauthorized from "./pages/error/Unauthorized";
import NotFound from "./pages/error/NotFound";

import AdminRouter from "./pages/admin/AdminDashboard";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import StaffDashboard from "./pages/sales/SalesDashboard";
import RoleProtectedRoute from "./routes/RoleProtectedRoute";
import { LoggedUserContext, useLoggedUserContext } from "./context/loggedUserContext";
import { Toaster } from "sonner";
import AccountingRouter from "./pages/accounting/AccountingDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <LoggedUserContext.Provider value={useLoggedUserContext}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

        
            <Route element={<ProtectedRoute />}>
              {/* Admin only */}
              <Route element={<RoleProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/admin/*" element={<AdminRouter />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={["accounting"]} />}>
                <Route path="/accounting/*" element={<AccountingRouter />} />
              </Route>

              {/* Manager only */}
              <Route element={<RoleProtectedRoute allowedRoles={["manager"]} />}>
                <Route path="/manager/*" element={<ManagerDashboard />} />
              </Route>

              {/* Staff, and also accessible to admin/manager */}
              <Route element={<RoleProtectedRoute allowedRoles={["sales",]} />}>
                <Route path="/sales/dashboard" element={<StaffDashboard />} />
              </Route>
            
            </Route>

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </LoggedUserContext.Provider>
    </BrowserRouter>
  );
}