import { NavLink, Outlet } from "react-router-dom"

const TABS = [
  { to: "/app/planner", label: "Planner", end: true },
  { to: "/app/planner/degree", label: "My Degree", end: false },
  { to: "/app/planner/completed", label: "Completed", end: false },
  { to: "/app/planner/coop", label: "Co-op", end: false },
]

export default function PlannerLayout() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[180px_1fr]">
      {/* Side nav */}
      <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-yellow-400/10 text-yellow-400"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
