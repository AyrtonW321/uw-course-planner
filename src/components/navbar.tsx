import { useMemo, useRef, useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import { auth } from "../lib/firebase"
import type { User } from "firebase/auth"

type NavBarProps = {
  user: User
}

export default function NavBar({ user }: NavBarProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const displayName = useMemo(() => {
    return user.displayName || user.email?.split("@")[0] || "User"
  }, [user.displayName, user.email])

  const photoUrl = user.photoURL || "/default.jpg"

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDocClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    navigate("/")
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-black/40 backdrop-blur-2xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Left: logo + name */}
        <Link to="/app" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-sm font-bold text-yellow-400">
            W
          </span>
          <span className="hidden font-semibold text-white sm:block">UW Course Planner</span>
        </Link>

        {/* Middle: nav */}
        <div className="hidden flex-1 items-center justify-center gap-6 text-sm md:flex">
          <Link className="text-zinc-400 transition hover:text-white" to="/app">
            Dashboard
          </Link>
          <Link className="text-zinc-400 transition hover:text-white" to="/app/courses">
            Courses
          </Link>
          <Link className="text-zinc-400 transition hover:text-white" to="/app/planner">
            Degree Planner
          </Link>
          <Link className="text-zinc-400 transition hover:text-white" to="/app/advisor">
            Advisor
          </Link>
        </div>

        {/* Right: dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="glass glass-hover flex items-center gap-2 rounded-full px-2 py-1"
            aria-label="Open user menu"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <img
              src={photoUrl}
              alt="Profile"
              className="h-8 w-8 rounded-full object-cover"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).src = "/default.jpg"
              }}
            />
            <span className="hidden text-sm text-zinc-200 sm:block">
              {displayName}
            </span>
            <span className="text-zinc-500">▾</span>
          </button>

          {open && (
            <div className="glass-menu absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl">
              <div className="px-4 py-3">
                <p className="truncate text-sm font-medium text-white">{displayName}</p>
                <p className="truncate text-xs text-zinc-500">{user.email}</p>
              </div>

              <div className="h-px bg-white/[0.06]" />

              <Link
                to="/app/profile"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
              >
                Profile Settings
              </Link>
              <Link
                to="/app/timetable"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
              >
                Timetable
              </Link>

              <div className="h-px bg-white/[0.06]" />

              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-400 transition hover:bg-white/[0.05]"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
