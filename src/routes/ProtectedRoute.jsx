// src/routes/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom"
import { useEffect } from "react"
import { useGetLoggedUser } from "../hooks/useAuth"
import { useDispatch } from "react-redux"
import { setUserInfo } from "../store/slice/appSlice"

export default function ProtectedRoute() {
  const { data, isPending, isError, isFetching } = useGetLoggedUser()
  const dispatch = useDispatch()

  useEffect(() => {
    if (data?.user) {
      dispatch(setUserInfo(data.user))
    }
  }, [data, dispatch])

  // isPending covers first load; isFetching+isError covers reset after login
  if (isPending || (isFetching && isError)) {
    return <div>Loading...</div>
  }

  if (isError) return <Navigate to="/login" replace />

  return <Outlet />
}
