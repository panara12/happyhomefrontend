// src/routes/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom"
import { useEffect } from "react"
import { useGetLoggedUser } from "../hooks/useAuth"
import { useDispatch } from "react-redux"
import { setUserInfo } from "../store/slice/appSlice"

export default function ProtectedRoute() {
  const { data, isLoading, isError } = useGetLoggedUser()
  const dispatch = useDispatch()

  useEffect(() => {
    if (data?.data?.user) {
      dispatch(setUserInfo(data.data.user))
    }
  }, [data, dispatch])

  if (isLoading) return <div>Loading...</div>

  if (isError) return <Navigate to="/login" replace />

  return <Outlet />
}