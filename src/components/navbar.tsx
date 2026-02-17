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
  const [searchQuery, setSearchQuery] = useState("")
  const menuRef = useRef<HTMLDivElement | null>(null)

  const displayName = useMemo(() => {
    return user.displayName || user.email?.split("@")[0] || "User"
  }, [user.displayName, user.email])

  const photoUrl = user.photoURL || "default.jpg"

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    navigate("/")
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    // Temporary search route
    navigate(`/app/search?q=${encodeURIComponent(searchQuery.trim())}`)
    setSearchQuery("")
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Left: logo + name */}
        <Link to="/app" className="flex items-center gap-2">
          <img src="/logo.svg" alt="UW Course Planner" className="h-8 w-8" />
          <span className="font-semibold text-white">UW Course Planner</span>
        </Link>

        {/* Middle: nav + search */}
        <div className="hidden md:flex items-center gap-6 text-sm flex-1 justify-center">
          <Link className="text-slate-200 hover:text-white" to="/app">
            Dashboard
          </Link>
          <Link className="text-slate-200 hover:text-white" to="/app/timetable">
            Timetable
          </Link>

          {/* 🔍 TEMP SEARCH BAR */}
          <form onSubmit={handleSearch} className="ml-6">
            <input
              type="text"
              placeholder="Search courses (e.g. CS 135)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-white text-sm outline-none focus:border-slate-400"
            />
          </form>
        </div>

        {/* Right: dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-2 py-1 hover:bg-slate-700"
            aria-label="Open user menu"
          >
            <img
              src={photoUrl}
              alt="Profile"
              className="h-8 w-8 rounded-full object-cover"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).src = "/default.jpg"
              }}
            />
            <span className="hidden sm:block text-sm text-slate-100">
              {displayName}
            </span>
            <span className="text-slate-300">▾</span>
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-lg">
              <div className="px-4 py-3">
                <p className="text-sm text-white font-medium truncate">{displayName}</p>
                <p className="text-xs text-slate-300 truncate">{user.email}</p>
              </div>

              <div className="h-px bg-slate-700" />

              <Link
                to="/app/profile"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
              >
                Profile Settings
              </Link>
              <Link
                to="/app/timetable"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
              >
                Timetable
              </Link>

              <div className="h-px bg-slate-700" />

              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-300 hover:bg-slate-700"
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
