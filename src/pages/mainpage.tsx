import { Outlet, Navigate } from "react-router-dom"
import NavBar from "../components/navbar"
import { useAuthUser } from "../lib/useAuthUser"

export default function MainPage() {
  const { user, loading } = useAuthUser()

  if (loading) {
    return <div className="min-h-screen bg-slate-900 text-white p-6">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <NavBar user={user} />
      <main className="mx-auto max-w-6xl px-4 py-6 text-white">
        <Outlet />
      </main>
    </div>
  )
}
