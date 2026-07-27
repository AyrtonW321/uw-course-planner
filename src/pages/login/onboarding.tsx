import { useEffect, useMemo, useState } from "react"
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
import { COOP_SEQUENCES, defaultSequenceId } from "../../lib/coop"
import { useUserDoc } from "../../lib/userDoc"
import { ALL_TERM_IDS } from "../../lib/degreePlan"
import { errorMessage } from "../../lib/errors"
import { cardSurface, eyebrow, headingSm, primaryButton, subtleButton } from "../../lib/ui"

const FACULTIES = Object.keys(PROGRAMS_BY_FACULTY)
const TERMS: GradTerm[] = ["Fall", "Winter", "Spring"]

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, meta, loading, complete, save } = useProfileMeta()
  const { update } = useUserDoc()

  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<ProfileMeta>(EMPTY_META)
  const [seqId, setSeqId] = useState(defaultSequenceId("yes"))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Warn before an accidental tab close/refresh loses wizard progress.
  useEffect(() => {
    if (step === 0) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [step])

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
      <div className="flex min-h-screen items-center justify-center bg-void text-ash">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/[0.1] border-t-gold" />
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
        <div className="rounded-[var(--radius-input)] border border-white/[0.08] bg-white/[0.03] p-5 text-sm leading-relaxed text-fog">
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
      title: "What term are you in now?",
      subtitle: "Your current academic term — used to track your progress.",
      valid: !!draft.currentTerm,
      body: (
        <SelectMenu
          label="Current term"
          value={draft.currentTerm}
          placeholder="Select your current term"
          options={[...ALL_TERM_IDS]}
          onChange={(term) => setDraft((p) => ({ ...p, currentTerm: term }))}
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
              className={`rounded-[var(--radius-input)] border px-4 py-6 text-center transition ${
                draft.coop === opt
                  ? "border-gold/60 bg-gold/10 text-gold"
                  : "border-white/[0.08] bg-white/[0.03] text-mist hover:bg-white/[0.06]"
              }`}
            >
              <span className="text-lg font-medium">
                {opt === "yes" ? "Co-op" : "Regular"}
              </span>
              <span className="mt-1 block text-xs text-ash">
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
                    className={`w-full rounded-[var(--radius-input)] border px-4 py-3 text-left transition ${
                      seqId === s.id
                        ? "border-gold/60 bg-gold/10"
                        : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        seqId === s.id ? "text-gold" : "text-bone"
                      }`}
                    >
                      {s.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-ash">{s.description}</span>
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
      if (draft.coop === "yes" && user) await update({ coopPlan: { sequenceId: seqId } })
      navigate("/app", { replace: true })
    } catch (err) {
      setError(errorMessage(err, "Failed to save your profile. Try again."))
    } finally {
      setSaving(false)
    }
  }

  const back = () => {
    setError(null)
    setStep((s) => Math.max(0, s - 1))
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-void px-4 py-12">
      <ConstellationCanvas opacity={0.6} />

      <div className={`${cardSurface} relative z-10 w-full max-w-sm p-8`}>
        {/* Progress */}
        <div className="mb-8 flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? "bg-gold" : "bg-white/[0.08]"
              }`}
            />
          ))}
        </div>

        <p className={eyebrow}>
          Step {step + 1} of {total}
        </p>
        <h1 className={`${headingSm} mt-3`}>{current.title}</h1>
        <p className="mt-2 text-sm text-ash">{current.subtitle}</p>

        <div className="mt-8">{current.body}</div>

        {error && (
          <div role="alert" aria-live="polite" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mt-8 flex items-center gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={back}
              disabled={saving}
              className={`${subtleButton} px-5 py-2.5 text-sm font-medium`}
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={next}
            disabled={!current.valid || saving}
            className={`${primaryButton} flex-1 py-2.5 text-sm`}
          >
            {saving ? "Saving…" : isLast ? "Finish setup" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  )
}
