import { useMemo, useState } from "react"
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth"
import { auth } from "../../lib/firebase"
import { Link, useNavigate } from "react-router-dom"

type RuleState = "neutral" | "valid" | "invalid"

type Rule = {
  id: string
  label: string
  state: RuleState
}

const MIN_LEN = 8
const MAX_LEN = 12
const SPECIAL_RE = /[^A-Za-z0-9]/ // any non-alphanumeric

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const rules: Rule[] = useMemo(() => {
    const lengthValid = password.length >= MIN_LEN && password.length <= MAX_LEN
    const lengthTooLong = password.length > MAX_LEN

    return [
      {
        id: "length",
        label: `${MIN_LEN}–${MAX_LEN} characters`,
        state: lengthValid ? "valid" : lengthTooLong ? "invalid" : "neutral",
      },
      {
        id: "upper",
        label: "At least 1 uppercase letter (A–Z)",
        state: /[A-Z]/.test(password) ? "valid" : "neutral",
      },
      {
        id: "lower",
        label: "At least 1 lowercase letter (a–z)",
        state: /[a-z]/.test(password) ? "valid" : "neutral",
      },
      {
        id: "number",
        label: "At least 1 number (0–9)",
        state: /[0-9]/.test(password) ? "valid" : "neutral",
      },
      {
        id: "special",
        label: "At least 1 special character",
        state: SPECIAL_RE.test(password) ? "valid" : "neutral",
      },
    ]
  }, [password])

  const isPasswordValid =
    password.length >= MIN_LEN &&
    password.length <= MAX_LEN &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    SPECIAL_RE.test(password)

  const canSubmit = !loading && email.trim().length > 0 && isPasswordValid

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!isPasswordValid) return

    setLoading(true)
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      navigate("/planner")
    } catch (err: any) {
      setError(err?.message ?? "Registration failed.")
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

  const ruleTextClass = (state: RuleState) => {
    if (state === "valid") return "text-green-300"
    if (state === "invalid") return "text-red-400"
    return "text-slate-400"
  }

  const ruleBorderClass = (state: RuleState) => {
    if (state === "valid") return "border-green-300"
    if (state === "invalid") return "border-red-400"
    return "border-slate-600"
  }

  const ruleIcon = (state: RuleState) => {
    if (state === "valid") return "✓"
    if (state === "invalid") return "✕"
    return ""
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md bg-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-white">Register</h1>

        {error && <div className="mt-4 text-sm text-red-400">{error}</div>}

        <form
          onSubmit={handleRegister}
          className="mt-6 space-y-4"
          autoComplete="off"
        >
          <div>
            <label className="block text-sm text-slate-200 mb-1">Email</label>
            <input
              type="email"
              placeholder="you@uwaterloo.ca"
              className="w-full p-2 rounded bg-slate-900 text-white border border-slate-700 outline-none focus:border-slate-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-200 mb-1">Password</label>
            <input
              type="password"
              placeholder="Create a password"
              className="w-full p-2 rounded bg-slate-900 text-white border border-slate-700 outline-none focus:border-slate-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />

            {/* Live password policy checklist */}
            <ul className="mt-3 space-y-1 text-xs">
              {rules.map((r) => (
                <li key={r.id} className={`flex items-center gap-2 ${ruleTextClass(r.state)}`}>
                  <span
                    className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${ruleBorderClass(
                      r.state
                    )}`}
                    aria-hidden="true"
                  >
                    {ruleIcon(r.state)}
                  </span>

                  <span className={r.state === "invalid" ? "line-through" : ""}>
                    {r.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button
            className="w-full bg-white text-slate-900 font-semibold py-2 rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canSubmit}
            type="submit"
            title={!isPasswordValid ? "Password does not meet the requirements." : ""}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-700" />
          <span className="text-xs text-slate-400">OR</span>
          <div className="h-px flex-1 bg-slate-700" />
        </div>

        <button
          onClick={handleGoogle}
          className="w-full border border-slate-600 text-white font-semibold py-2 rounded hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading}
          type="button"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-sm text-slate-400 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-white underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}