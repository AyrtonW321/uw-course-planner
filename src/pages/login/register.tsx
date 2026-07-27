import { useMemo, useState } from "react"
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth"
import { auth } from "../../lib/firebase"
import { errorMessage } from "../../lib/errors"
import { Link, useNavigate } from "react-router-dom"
import ConstellationCanvas from "../../components/ConstellationCanvas"
import { cardSurface, eyebrow, headingSm, inputSurface, primaryButton, subtleButton } from "../../lib/ui"

type RuleState = "neutral" | "valid" | "invalid"
type Rule = { id: string; label: string; state: RuleState }

const MIN_LEN = 8
const MAX_LEN = 12
const SPECIAL_RE = /[^A-Za-z0-9]/

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const rules: Rule[] = useMemo(() => {
    const lengthValid = password.length >= MIN_LEN && password.length <= MAX_LEN
    const lengthTooLong = password.length > MAX_LEN
    return [
      { id: "length", label: `${MIN_LEN}–${MAX_LEN} characters`, state: lengthValid ? "valid" : lengthTooLong ? "invalid" : "neutral" },
      { id: "upper", label: "At least 1 uppercase letter (A–Z)", state: /[A-Z]/.test(password) ? "valid" : "neutral" },
      { id: "lower", label: "At least 1 lowercase letter (a–z)", state: /[a-z]/.test(password) ? "valid" : "neutral" },
      { id: "number", label: "At least 1 number (0–9)", state: /[0-9]/.test(password) ? "valid" : "neutral" },
      { id: "special", label: "At least 1 special character", state: SPECIAL_RE.test(password) ? "valid" : "neutral" },
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
      navigate("/onboarding")
    } catch (err) {
      setError(errorMessage(err, "Registration failed."))
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
      navigate("/onboarding")
    } catch (err) {
      setError(errorMessage(err, "Google sign-in failed."))
    } finally {
      setLoading(false)
    }
  }

  const ruleClass = (state: RuleState) => {
    if (state === "valid") return "text-gold"
    if (state === "invalid") return "text-red-400"
    return "text-ash"
  }

  const dotClass = (state: RuleState) => {
    if (state === "valid") return "bg-gold"
    if (state === "invalid") return "bg-red-400"
    return "bg-white/[0.15]"
  }

  // Strength bar
  const strength = rules.filter((r) => r.state === "valid").length
  const strengthLabel = ["", "Weak", "Weak", "Fair", "Good", "Strong"][strength] ?? ""
  const strengthColor = strength <= 2 ? "bg-red-500" : strength <= 3 ? "bg-yellow-500" : strength === 4 ? "bg-gold" : "bg-green-400"

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-void px-4 py-12">
      <ConstellationCanvas opacity={0.6} />

      <div className={`${cardSurface} relative z-10 w-full max-w-sm p-8`}>
        <p className={eyebrow}>UW Course Planner</p>
        <h1 className={`${headingSm} mt-3`}>Create your account</h1>
        <p className="mt-2 text-sm text-ash">Set up your degree plan in a few minutes.</p>

        {error && (
          <div role="alert" aria-live="polite" className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="mt-8 space-y-5" autoComplete="off">
          <div className="space-y-1.5">
            <label className={eyebrow}>Email</label>
            <input
              type="email"
              placeholder="you@uwaterloo.ca"
              className={inputSurface}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <label className={eyebrow}>Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                className={`${inputSurface} pr-10`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ash transition hover:text-gold"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>

            {/* Strength bar */}
            {password.length > 0 && (
              <div className="space-y-1 pt-1">
                <div className="flex h-1 gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : "bg-white/[0.08]"}`}
                    />
                  ))}
                </div>
                {strengthLabel && (
                  <p className="text-right text-xs text-ash">
                    Strength: <span className="font-medium text-fog">{strengthLabel}</span>
                  </p>
                )}
              </div>
            )}

            {/* Rules */}
            <ul aria-live="polite" className="mt-2 space-y-1.5">
              {rules.map((r) => (
                <li key={r.id} className={`flex items-center gap-2 text-xs transition-colors ${ruleClass(r.state)}`}>
                  <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full transition-colors ${dotClass(r.state)}`} />
                  <span className={r.state === "invalid" ? "line-through opacity-50" : ""}>{r.label}</span>
                  {r.state === "valid" && (
                    <svg className="ml-auto h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
                    </svg>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className={`${primaryButton} w-full py-2.5 text-sm`}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.08]" />
          <span className="text-xs text-ash">or</span>
          <div className="h-px flex-1 bg-white/[0.08]" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          type="button"
          className={`${subtleButton} flex w-full items-center justify-center gap-3 py-2.5 text-sm`}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <p className="mt-8 text-center text-sm text-ash">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-gold transition hover:text-gold-dim">
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}
