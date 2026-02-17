import { Link } from "react-router-dom"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-bold">UW Course Planner</h1>
        <p className="mt-3 text-slate-300">
          Plan your terms, track requirements, and build your timetable.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/login"
            className="rounded-lg bg-white px-5 py-2 font-semibold text-slate-900 hover:opacity-90"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-lg border border-slate-600 px-5 py-2 font-semibold text-white hover:bg-slate-800"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  )
}
