import { useMemo, useRef, useState, useEffect } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import { Menu } from "lucide-react"
import { auth } from "../lib/firebase"
import { pageContainer } from "../lib/ui"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet"
import type { User } from "firebase/auth"

type NavBarProps = {
  user: User
}

const NAV_LINKS = [
  { to: "/app", label: "Dashboard" },
  { to: "/app/courses", label: "Courses" },
  { to: "/app/planner", label: "Degree Planner" },
  { to: "/app/advisor", label: "Advisor" },
]

export default function NavBar({ user }: NavBarProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
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
    <header className="sticky top-3 z-50">
      <div className={pageContainer}>
        <div className="glass-bar flex h-14 items-center justify-between rounded-full pl-5 pr-2">
          {/* Left: logo + name */}
          <Link to="/app" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 text-sm font-medium text-gold">
              W
            </span>
            <span className="hidden font-medium text-bone lg:block">UW Course Planner</span>
          </Link>

          {/* Middle: nav */}
          <div className="hidden flex-1 items-center justify-center gap-1 text-[13px] md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/app"}
                className="rounded-full px-3.5 py-1.5 text-fog transition hover:text-bone aria-[current=page]:bg-white/[0.06] aria-[current=page]:text-bone"
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Right: mobile hamburger + avatar dropdown */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-fog transition hover:bg-white/[0.06] hover:text-bone md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-1 transition hover:bg-white/[0.06]"
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
                <span className="hidden text-sm text-mist sm:block">
                  {displayName}
                </span>
                <span className="text-ash">▾</span>
              </button>

              {open && (
                <div className="glass-pop absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl">
                  <div className="px-4 py-3">
                    <p className="truncate text-sm font-medium text-bone">{displayName}</p>
                    <p className="truncate text-xs text-ash">{user.email}</p>
                  </div>

                  <div className="h-px bg-white/[0.06]" />

                  <Link
                    to="/app/profile"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-sm text-fog transition hover:bg-white/[0.05] hover:text-bone"
                  >
                    Profile Settings
                  </Link>
                  <Link
                    to="/app/timetable"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-sm text-fog transition hover:bg-white/[0.05] hover:text-bone"
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
        </div>
      </div>

      {/* Mobile menu sheet — full nav parity for viewports below md */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="glass-pop border-0">
          <SheetHeader>
            <SheetTitle>UW Course Planner</SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col gap-1 px-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="rounded-full px-3.5 py-2 text-sm text-fog transition hover:bg-white/[0.06] hover:text-bone"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mx-4 h-px bg-white/[0.06]" />

          <nav className="flex flex-col gap-1 px-4">
            <Link
              to="/app/profile"
              onClick={() => setMobileOpen(false)}
              className="rounded-full px-3.5 py-2 text-sm text-fog transition hover:bg-white/[0.06] hover:text-bone"
            >
              Profile Settings
            </Link>
            <Link
              to="/app/timetable"
              onClick={() => setMobileOpen(false)}
              className="rounded-full px-3.5 py-2 text-sm text-fog transition hover:bg-white/[0.06] hover:text-bone"
            >
              Timetable
            </Link>
            <button
              onClick={() => {
                setMobileOpen(false)
                handleLogout()
              }}
              className="rounded-full px-3.5 py-2 text-left text-sm text-red-400 transition hover:bg-white/[0.05]"
            >
              Log out
            </button>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}
