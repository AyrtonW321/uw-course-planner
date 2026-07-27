import { Outlet, Navigate } from "react-router-dom"
import NavBar from "../components/navbar"
import AlertBar from "../components/AlertBar"
import ConstellationCanvas from "../components/ConstellationCanvas"
import { useProfileMeta } from "../lib/profile"
import { pageContainer } from "../lib/ui"

export default function MainPage() {
  const { user, loading, complete } = useProfileMeta()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void text-ash">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/[0.1] border-t-gold" />
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
    <div className="ambient-wash flex min-h-screen flex-col bg-void">
      <ConstellationCanvas
        opacity={0.07}
        minWidthPx={1024}
        className="pointer-events-none fixed inset-0 z-0"
      />
      <div className="relative z-20">
        <NavBar user={user} />
        <AlertBar />
      </div>
      <main className={`${pageContainer} relative z-10 flex-1 py-8 text-bone`}>
        <Outlet />
      </main>
    </div>
  )
}
