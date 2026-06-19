import { useMemo, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import ConstellationCanvas from "../../components/ConstellationCanvas"
import SelectMenu from "../../components/SelectMenu"
import {
  EMPTY_META,
  PROGRAMS_BY_FACULTY,
  isProfileComplete,
  useProfileMeta,
  type GradTerm,
  type ProfileMeta,
} from "../../lib/profile"
import { COOP_SEQUENCES, defaultSequenceId, saveCoopSequence } from "../../lib/coop"
import { goldButton, glassButton } from "../../lib/ui"

const FACULTIES = Object.keys(PROGRAMS_BY_FACULTY)
const TERMS: GradTerm[] = ["Fall", "Winter", "Spring"]

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, meta, loading, complete, save } = useProfileMeta()

  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<ProfileMeta>(EMPTY_META)
  const [seqId, setSeqId] = useState(defaultSequenceId("yes"))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(
    () => Array.from({ length: 11 }, (_, i) => String(currentYear + i)),
    [currentYear]
  )
  const programOptions = useMemo(
    () => (draft.faculty ? PROGRAMS_BY_FACULTY[draft.faculty] ?? [] : []),
    [draft.faculty]
  )

  // Gate: wait for load, bounce out if not signed in or already onboarded.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-yellow-400" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  // If they already finished onboarding (e.g. came here by accident), skip.
  if (complete && isProfileComplete(meta)) return <Navigate to="/app" replace />

  const displayName = user.displayName?.split(" ")[0] || user.email?.split("@")[0] || "there"

  const steps = [
    {
      title: `Welcome, ${displayName} 👋`,
      subtitle: "Let's set up your academic profile. Takes 30 seconds.",
      valid: true,
      body: (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 text-sm leading-relaxed text-zinc-400">
          We'll use this to track your degree requirements, validate prerequisites,
          and recommend courses. You can change any of it later in Profile Settings.
        </div>
      ),
    },
    {
      title: "What faculty are you in?",
      subtitle: "Choose your home faculty at Waterloo.",
      valid: !!draft.faculty,
      body: (
        <SelectMenu
          label="Faculty"
          value={draft.faculty}
          placeholder="Select faculty"
          options={FACULTIES}
          onChange={(faculty) =>
            setDraft((p) => ({
              ...p,
              faculty,
              program: p.faculty === faculty ? p.program : "",
            }))
          }
        />
      ),
    },
    {
      title: "What's your program?",
      subtitle: "Your major or plan.",
      valid: !!draft.program,
      body: (
        <SelectMenu
          label="Program"
          value={draft.program}
          placeholder={draft.faculty ? "Select program" : "Pick a faculty first"}
          options={programOptions}
          disabled={!draft.faculty}
          onChange={(program) => setDraft((p) => ({ ...p, program }))}
        />
      ),
    },
    {
      title: "Are you in co-op?",
      subtitle: "This affects how your terms are sequenced.",
      valid: true,
      body: (
        <div className="grid grid-cols-2 gap-3">
          {(["yes", "no"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setDraft((p) => ({ ...p, coop: opt }))}
              className={`rounded-xl border px-4 py-6 text-center transition ${
                draft.coop === opt
                  ? "border-yellow-500/60 bg-yellow-500/10 text-yellow-400"
                  : "border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06]"
              }`}
            >
              <span className="text-lg font-semibold">
                {opt === "yes" ? "Co-op" : "Regular"}
              </span>
              <span className="mt-1 block text-xs text-zinc-500">
                {opt === "yes" ? "Alternating work terms" : "No work terms"}
              </span>
            </button>
          ))}
        </div>
      ),
    },
    ...(draft.coop === "yes"
      ? [
          {
            title: "Pick your co-op sequence",
            subtitle: "How your study and work terms alternate. You can change this later.",
            valid: true,
            body: (
              <div className="space-y-2">
                {COOP_SEQUENCES.filter((s) => s.id !== "regular").map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSeqId(s.id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      seqId === s.id
                        ? "border-yellow-500/60 bg-yellow-500/10"
                        : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
                    }`}
                  >
                    <span
                      className={`text-sm font-semibold ${
                        seqId === s.id ? "text-yellow-400" : "text-white"
                      }`}
                    >
                      {s.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-500">{s.description}</span>
                  </button>
                ))}
              </div>
            ),
          },
        ]
      : []),
    {
      title: "When do you graduate?",
      subtitle: "Your expected graduation term.",
      valid: !!draft.gradTerm && !!draft.gradYear,
      body: (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectMenu
            label="Term"
            value={draft.gradTerm}
            placeholder="Select term"
            options={TERMS}
            onChange={(t) => setDraft((p) => ({ ...p, gradTerm: t as GradTerm }))}
          />
          <SelectMenu
            label="Year"
            value={draft.gradYear ? String(draft.gradYear) : ""}
            placeholder="Select year"
            options={yearOptions}
            onChange={(y) => setDraft((p) => ({ ...p, gradYear: Number(y) }))}
          />
        </div>
      ),
    },
  ]

  const total = steps.length
  const current = steps[step]
  const isLast = step === total - 1

  const next = async () => {
    setError(null)
    if (!current.valid) return
    if (!isLast) {
      setStep((s) => s + 1)
      return
    }
    // Final step → save
    setSaving(true)
    try {
      await save(draft)
      if (draft.coop === "yes" && user) await saveCoopSequence(user.uid, seqId)
      navigate("/app", { replace: true })
    } catch (err: any) {
      setError(err?.message ?? "Failed to save your profile. Try again.")
    } finally {
      setSaving(false)
    }
  }

  const back = () => {
    setError(null)
    setStep((s) => Math.max(0, s - 1))
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4">
      <ConstellationCanvas />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[600px] rounded-full bg-yellow-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Progress */}
        <div className="mb-6 flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? "bg-yellow-400" : "bg-white/[0.08]"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-8 py-8 shadow-2xl backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400/80">
            Step {step + 1} of {total}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
            {current.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{current.subtitle}</p>

          <div className="mt-6">{current.body}</div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="mt-8 flex items-center gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={back}
                disabled={saving}
                className={`${glassButton} px-5 py-2.5 text-sm font-medium`}
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              disabled={!current.valid || saving}
              className={`${goldButton} flex-1 py-2.5 text-sm`}
            >
              {saving ? "Saving…" : isLast ? "Finish setup" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
