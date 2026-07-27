import { Link } from "react-router-dom"
import ConstellationCanvas from "../components/ConstellationCanvas"
import { display, eyebrow, bodyLg, caption, primaryButton } from "../lib/ui"

const FEATURES = [
  { label: "Requirements", detail: "Live degree audit against your program" },
  { label: "Prerequisites", detail: "See what unlocks what, every term" },
  { label: "Timetable", detail: "Build and export your real schedule" },
]

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen items-center overflow-hidden bg-void px-6 sm:px-12 lg:px-24">
      <ConstellationCanvas opacity={1} />

      <div className="relative z-10 max-w-2xl py-24">
        <p className={eyebrow}>University of Waterloo</p>
        <h1 className={`${display} mt-4`}>Plan your degree with clarity.</h1>
        <p className={`${bodyLg} mt-6 max-w-md`}>
          Track requirements, build your timetable, and see exactly what unlocks what — every term,
          mapped against the real course catalog.
        </p>

        <div className="glass mt-10 flex flex-wrap items-center gap-6 rounded-2xl p-6">
          <Link to="/login" className={`${primaryButton} px-8 py-3.5 text-sm uppercase tracking-[0.025em]`}>
            Sign in
          </Link>
          <Link to="/register" className="text-sm text-ash transition hover:text-bone">
            Create an account
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.label} className="glass rounded-2xl p-4">
              <p className="text-sm font-medium text-bone">{f.label}</p>
              <p className={`${caption} mt-1`}>{f.detail}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-caption text-ash">Built for University of Waterloo students</p>
      </div>
    </div>
  )
}
