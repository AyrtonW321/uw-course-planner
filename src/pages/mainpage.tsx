import { Outlet, Navigate } from "react-router-dom"
import NavBar from "../components/navbar"
import AlertBar from "../components/AlertBar"
import { useProfileMeta } from "../lib/profile"

export default function MainPage() {
  const { user, loading, complete } = useProfileMeta()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-yellow-400" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // First-run users (or anyone who never finished setup) must onboard first.
  if (!complete) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <div className="app-bg min-h-screen">
      <NavBar user={user} />
      <AlertBar />
      <main className="mx-auto max-w-6xl px-4 py-8 text-white">
        <Outlet />
      </main>
    </div>
  )
}
