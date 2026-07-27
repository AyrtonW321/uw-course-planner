import { NavLink, Outlet } from "react-router-dom"

const TABS = [
  { to: "/app/planner", label: "Planner", end: true },
  { to: "/app/planner/degree", label: "My Degree", end: false },
  { to: "/app/planner/completed", label: "Completed", end: false },
  { to: "/app/planner/coop", label: "Co-op", end: false },
]

export default function PlannerLayout() {
  return (
    <div className="space-y-4">
      <nav className="flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
                isActive ? "bg-white/[0.06] text-bone" : "text-fog hover:text-bone"
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
