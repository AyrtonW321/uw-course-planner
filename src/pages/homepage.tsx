import { Link } from "react-router-dom"
import ConstellationCanvas from "../components/ConstellationCanvas"

export default function HomePage() {
  return (
    <div className="app-bg relative min-h-screen overflow-hidden text-white flex items-center justify-center px-4">
      <ConstellationCanvas />

      {/* Glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[700px] w-[700px] rounded-full bg-yellow-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl text-center">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 font-bold text-2xl shadow-xl shadow-yellow-500/10">
            W
          </div>
        </div>

        <h1 className="text-5xl font-bold tracking-tight">
          UW Course Planner
        </h1>
        <p className="mt-4 text-lg text-zinc-500 leading-relaxed">
          Plan your terms, track degree requirements,<br className="hidden sm:block" /> and build your perfect timetable.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            to="/login"
            className="rounded-xl bg-yellow-400 px-7 py-3 font-bold text-black shadow-lg shadow-yellow-400/10 transition hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-black"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-7 py-3 font-semibold text-zinc-300 transition hover:border-yellow-500/30 hover:bg-white/[0.06]"
          >
            Create Account
          </Link>
        </div>

        <p className="mt-8 text-sm text-zinc-700">
          Built for University of Waterloo students
        </p>
      </div>
    </div>
  )
}
