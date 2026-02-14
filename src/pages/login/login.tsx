// src/pages/Login.tsx
import { useState } from "react"
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { auth } from "../../lib/firebase"
import { useNavigate } from "react-router-dom"

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate("/planner") // change to wherever you want after login
    } catch (err: any) {
      setError(err?.message ?? "Login failed.")
    } finally {
      setLoading(false)
    }
  }

  const onGoogleLogin = async () => {
    setError(null)
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      navigate("/planner")
    } catch (err: any) {
      setError(err?.message ?? "Google login failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-800 p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white">Login</h1>
        <p className="text-slate-300 mt-1">Sign in to your course planner.</p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={onEmailLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-200 mb-1">Email</label>
            <input
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white outline-none focus:border-slate-400"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@uwaterloo.ca"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-200 mb-1">Password</label>
            <input
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white outline-none focus:border-slate-400"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-lg bg-white text-slate-900 font-semibold py-2 hover:opacity-90 disabled:opacity-60"
            type="submit"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-700" />
          <span className="text-xs text-slate-400">OR</span>
          <div className="h-px flex-1 bg-slate-700" />
        </div>

        <button
          onClick={onGoogleLogin}
          disabled={loading}
          className="w-full rounded-lg border border-slate-600 text-white py-2 hover:bg-slate-700 disabled:opacity-60"
          type="button"
        >
          Continue with Google
        </button>
      </div>
    </div>
  )
}
