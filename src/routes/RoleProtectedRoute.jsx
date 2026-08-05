// src/routes/RoleProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom"
import { useSelector } from "react-redux"
import { useLoggedUserContext } from "../context/loggedUserContext"

export default function RoleProtectedRoute({ allowedRoles }) {
  let user = useSelector((state) => state.app.userInfo) 
  const {loggedUser, loggedUserLoading} = useLoggedUserContext()
  if(loggedUserLoading) return <div>Loading...</div>
  if(!user) user = loggedUser

  if (allowedRoles && !allowedRoles.includes(user?.userType)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}