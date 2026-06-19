import { useEffect, useMemo, useRef, useState } from "react"
import {
  updateProfile,
  updatePassword,
  verifyBeforeUpdateEmail,
} from "firebase/auth"
import { db, storage } from "../lib/firebase"
import { doc, setDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPen } from "@fortawesome/free-solid-svg-icons"
import SelectMenu from "../components/SelectMenu"
import {
  EMPTY_META,
  PROGRAMS_BY_FACULTY,
  useProfileMeta,
  type GradTerm,
  type ProfileMeta,
} from "../lib/profile"
import { glassCard, glassInput, goldButton, glassButton, labelText } from "../lib/ui"

const DEFAULT_AVATAR = "/default.jpg"
const TERMS: GradTerm[] = ["Fall", "Winter", "Spring"]

async function uploadAvatar(uid: string, file: File) {
  const path = `avatars/${uid}/${Date.now()}_${file.name}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

/** Inline editable text field: locked until the pencil is clicked. */
function EditableField({
  label,
  editing,
  onEdit,
  children,
}: {
  label: string
  editing: boolean
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className={labelText}>{label}</label>
      <div className="group relative">
        {children}
        {!editing && (
          <button
            type="button"
            onClick={onEdit}
            className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.06] p-1.5 text-zinc-300 backdrop-blur-md transition hover:text-yellow-400 group-hover:flex"
            aria-label={`Edit ${label}`}
            title={`Edit ${label}`}
          >
            <FontAwesomeIcon icon={faPen} className="text-xs" />
          </button>
        )}
      </div>
    </div>
  )
}

/** A read-only labelled row used in the collapsed settings summary. */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.05] py-3 last:border-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm font-medium text-white">{value || "—"}</span>
    </div>
  )
}

export default function ProfilePage() {
  const { user, meta, loading, save } = useProfileMeta()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // --- Auth-side fields ---
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const [editName, setEditName] = useState(false)
  const [editEmail, setEditEmail] = useState(false)
  const [editPassword, setEditPassword] = useState(false)

  // --- Academic settings ---
  const [editSettings, setEditSettings] = useState(false)
  const [draft, setDraft] = useState<ProfileMeta>(EMPTY_META)

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setDisplayName(user.displayName || "")
    setEmail(user.email || "")
    if (user.photoURL) setPhotoPreview(user.photoURL)
  }, [user])

  useEffect(() => {
    if (meta) setDraft(meta)
  }, [meta])

  const avatarSrc = useMemo(
    () => photoPreview || user?.photoURL || DEFAULT_AVATAR,
    [photoPreview, user?.photoURL]
  )

  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(
    () => Array.from({ length: 11 }, (_, i) => String(currentYear + i)),
    [currentYear]
  )
  const programOptions = useMemo(
    () => (draft.faculty ? PROGRAMS_BY_FACULTY[draft.faculty] ?? [] : []),
    [draft.faculty]
  )

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-zinc-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-yellow-400" />
      </div>
    )
  }
  if (!user) return <div className="text-white">Not signed in.</div>

  const flash = (msg: string) => {
    setMessage(msg)
    setError(null)
  }

  const onPickPhoto = () => fileInputRef.current?.click()
  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.")
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const saveProfile = async () => {
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const updates: { displayName?: string; photoURL?: string } = {}
      if (editName && displayName !== (user.displayName || "")) {
        updates.displayName = displayName
      }
      if (photoFile) {
        try {
          updates.photoURL = await uploadAvatar(user.uid, photoFile)
        } catch {
          setError("Avatar upload failed (check Storage rules / blockers).")
          setSaving(false)
          return
        }
      }
      if (Object.keys(updates).length > 0) {
        await updateProfile(user, updates)
        await setDoc(
          doc(db, "users", user.uid),
          {
            displayName: updates.displayName ?? user.displayName,
            photoURL: updates.photoURL ?? user.photoURL,
          },
          { merge: true }
        )
        if (updates.photoURL) setPhotoPreview(updates.photoURL)
      }
      setPhotoFile(null)
      setEditName(false)
      flash("Profile updated.")
    } catch (err: any) {
      setError(err?.message ?? "Failed to update profile.")
    } finally {
      setSaving(false)
    }
  }

  const saveEmail = async () => {
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const nextEmail = email.trim()
      if (!nextEmail) return setError("Email cannot be empty.")
      if (nextEmail === (user.email || "")) {
        setEditEmail(false)
        return flash("Email unchanged.")
      }
      await verifyBeforeUpdateEmail(user, nextEmail)
      setEditEmail(false)
      flash("Verification email sent. Click the link to finish changing your email.")
    } catch (err: any) {
      if (err?.code === "auth/requires-recent-login") {
        setError("For security, log out and back in, then change your email again.")
      } else {
        setError(err?.message ?? "Failed to update email.")
      }
    } finally {
      setSaving(false)
    }
  }

  const savePassword = async () => {
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      if (newPassword.length < 8) return setError("Password must be at least 8 characters.")
      await updatePassword(user, newPassword)
      setNewPassword("")
      setEditPassword(false)
      flash("Password updated.")
    } catch (err: any) {
      if (err?.code === "auth/requires-recent-login") {
        setError("For security, log out and back in, then change your password again.")
      } else {
        setError(err?.message ?? "Failed to update password.")
      }
    } finally {
      setSaving(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      if (!draft.faculty) return setError("Please select a faculty.")
      if (!draft.program) return setError("Please select a program.")
      if (!draft.gradTerm || !draft.gradYear)
        return setError("Please set your graduation term and year.")
      await save(draft)
      setEditSettings(false) // collapse back to summary
      flash("Settings saved.")
    } catch (err: any) {
      setError(err?.message ?? "Failed to save settings.")
    } finally {
      setSaving(false)
    }
  }

  const cancelSettings = () => {
    setDraft(meta ?? EMPTY_META)
    setEditSettings(false)
    setError(null)
  }

  const coopLabel = (meta?.coop ?? "yes") === "yes" ? "Co-op" : "Regular"
  const gradLabel =
    meta?.gradTerm && meta?.gradYear ? `${meta.gradTerm} ${meta.gradYear}` : ""

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">Profile</h1>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {message}
        </div>
      )}

      {/* Identity + account */}
      <div className={`${glassCard} p-6`}>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr]">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="group relative h-36 w-36 overflow-hidden rounded-full border border-white/[0.1]">
              <img
                src={avatarSrc}
                alt="Profile"
                className="h-full w-full object-cover"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR
                }}
              />
              <button
                type="button"
                onClick={onPickPhoto}
                className="absolute inset-0 flex items-center justify-center opacity-0 backdrop-blur-sm transition group-hover:bg-black/50 group-hover:opacity-100"
                title="Change profile picture"
              >
                <span className="text-xs font-semibold text-white">📷 Change</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPhotoChange}
            />
            <p className="mt-3 text-center text-xs text-zinc-500">{user.email}</p>
          </div>

          {/* Account fields */}
          <div className="space-y-4">
            <EditableField label="Display name" editing={editName} onEdit={() => setEditName(true)}>
              <input
                className={glassInput}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={!editName || saving}
                autoComplete="off"
              />
            </EditableField>

            <button
              onClick={saveProfile}
              disabled={saving || (!editName && !photoFile)}
              className={`${goldButton} w-full py-2.5 text-sm`}
            >
              {saving ? "Saving…" : "Save profile"}
            </button>

            <div className="h-px bg-white/[0.06]" />

            <EditableField label="Email" editing={editEmail} onEdit={() => setEditEmail(true)}>
              <input
                className={glassInput}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!editEmail || saving}
                autoComplete="off"
              />
            </EditableField>
            {editEmail && (
              <button
                onClick={saveEmail}
                disabled={saving}
                className={`${glassButton} w-full py-2.5 text-sm font-medium`}
              >
                Send verification to update email
              </button>
            )}

            <EditableField
              label="New password"
              editing={editPassword}
              onEdit={() => setEditPassword(true)}
            >
              <input
                type="password"
                className={glassInput}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter a new password"
                disabled={!editPassword || saving}
                autoComplete="new-password"
              />
            </EditableField>
            {editPassword && (
              <button
                onClick={savePassword}
                disabled={saving}
                className={`${glassButton} w-full py-2.5 text-sm font-medium`}
              >
                Update password
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Academic settings */}
      <div className={`${glassCard} p-6`}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Academic Profile</h2>
            <p className="text-sm text-zinc-500">
              Used for degree audits, prerequisites, and recommendations.
            </p>
          </div>
          {!editSettings && (
            <button
              type="button"
              onClick={() => setEditSettings(true)}
              className={`${glassButton} px-4 py-2 text-sm font-medium`}
            >
              Edit
            </button>
          )}
        </div>

        {!editSettings ? (
          // Collapsed read-only summary
          <div>
            <SummaryRow label="Faculty" value={meta?.faculty ?? ""} />
            <SummaryRow label="Program" value={meta?.program ?? ""} />
            <SummaryRow label="Co-op" value={coopLabel} />
            <SummaryRow label="Graduation" value={gradLabel} />
          </div>
        ) : (
          // Edit form
          <div className="space-y-4">
            <SelectMenu
              label="Faculty"
              value={draft.faculty}
              placeholder="Select faculty"
              options={Object.keys(PROGRAMS_BY_FACULTY)}
              disabled={saving}
              onChange={(faculty) =>
                setDraft((p) => ({
                  ...p,
                  faculty,
                  program: p.faculty === faculty ? p.program : "",
                }))
              }
            />
            <SelectMenu
              label="Program"
              value={draft.program}
              placeholder={draft.faculty ? "Select program" : "Select faculty first"}
              options={programOptions}
              disabled={saving || !draft.faculty}
              onChange={(program) => setDraft((p) => ({ ...p, program }))}
            />

            <div className="space-y-1.5">
              <label className={labelText}>Co-op</label>
              <div className="grid grid-cols-2 gap-3">
                {(["yes", "no"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    disabled={saving}
                    onClick={() => setDraft((p) => ({ ...p, coop: opt }))}
                    className={`rounded-lg border py-2.5 text-sm font-medium transition ${
                      draft.coop === opt
                        ? "border-yellow-500/60 bg-yellow-500/10 text-yellow-400"
                        : "border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
                    }`}
                  >
                    {opt === "yes" ? "Co-op" : "Regular"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectMenu
                label="Graduation term"
                value={draft.gradTerm}
                placeholder="Select term"
                options={TERMS}
                disabled={saving}
                onChange={(t) => setDraft((p) => ({ ...p, gradTerm: t as GradTerm }))}
              />
              <SelectMenu
                label="Graduation year"
                value={draft.gradYear ? String(draft.gradYear) : ""}
                placeholder="Select year"
                options={yearOptions}
                disabled={saving}
                onChange={(y) => setDraft((p) => ({ ...p, gradYear: Number(y) }))}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={cancelSettings}
                disabled={saving}
                className={`${glassButton} px-5 py-2.5 text-sm font-medium`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSettings}
                disabled={saving}
                className={`${goldButton} flex-1 py-2.5 text-sm`}
              >
                {saving ? "Saving…" : "Save settings"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
