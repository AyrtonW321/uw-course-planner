import { useState } from "react"
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { auth } from "../../lib/firebase"
import { Link, useNavigate } from "react-router-dom"

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate("/planner")
    } catch (err: any) {
      setError(err?.message ?? "Login failed.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    setLoading(true)

    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      navigate("/planner")
    } catch (err: any) {
      setError(err?.message ?? "Google sign-in failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md bg-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-white">Login</h1>

        {error && <div className="mt-4 text-sm text-red-400">{error}</div>}

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 rounded bg-slate-900 text-white border border-slate-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 rounded bg-slate-900 text-white border border-slate-700"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            className="w-full bg-white text-slate-900 font-semibold py-2 rounded hover:opacity-90 disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-700" />
          <span className="text-xs text-slate-400">OR</span>
          <div className="h-px flex-1 bg-slate-700" />
        </div>

        <button
          onClick={handleGoogle}
          className="w-full border border-slate-600 text-white font-semibold py-2 rounded hover:bg-slate-700 disabled:opacity-60"
          disabled={loading}
          type="button"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-sm text-slate-400 text-center">
          Don't have an account?{" "}
          <Link to="/register" className="text-white underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}