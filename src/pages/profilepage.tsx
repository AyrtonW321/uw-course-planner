import { useEffect, useMemo, useRef, useState } from "react"
import {
  updateProfile,
  updatePassword,
  verifyBeforeUpdateEmail,
  type User,
} from "firebase/auth"
import { db } from "../lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { useAuthUser } from "../lib/useAuthUser"
import SelectMenu from "../components/SelectMenu"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPen } from "@fortawesome/free-solid-svg-icons"
import { storage } from "../lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

type GradTerm = "Fall" | "Winter" | "Spring"

type ProfileMeta = {
  faculty: string
  program: string
  coop: "yes" | "no"
  gradTerm: GradTerm | ""
  gradYear: number | null
}

export async function uploadAvatar(uid: string, file: File) {
  try {
    console.log("[uploadAvatar] starting:", file.name, file.type, file.size)

    const path = `avatars/${uid}/${Date.now()}_${file.name}`
    const storageRef = ref(storage, path)

    await uploadBytes(storageRef, file)
    console.log("[uploadAvatar] uploadBytes OK")

    const url = await getDownloadURL(storageRef)
    console.log("[uploadAvatar] getDownloadURL OK:", url)

    return url
  } catch (err) {
    console.error("[uploadAvatar] FAILED:", err)
    throw err
  }
}


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
    <div className="space-y-1">
      <label className="block text-sm text-slate-200">{label}</label>
      <div className="group relative">
        {children}
        {!editing && (
          <button
            type="button"
            onClick={onEdit}
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-md border border-slate-700 bg-slate-900/70 p-1.5 text-slate-200 hover:bg-slate-800 group-hover:flex"
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

const DEFAULT_AVATAR = "/default.jpg"

const PROGRAMS_BY_FACULTY: Record<string, string[]> = {
  Arts: [
    "Accounting and Financial Management",
    "Anthropology",
    "Classical Studies",
    "Communication Studies",
    "Economics",
    "English",
    "Fine Arts",
    "French",
    "Gender and Social Justice",
    "Global Business and Digital Arts",
    "History",
    "Honours Arts",
    "Honours Arts and Business",
    "Legal Studies",
    "Liberal Studies",
    "Medieval Studies",
    "Music",
    "Peace and Conflict Studies",
    "Philosophy",
    "Political Science",
    "Psychology",
    "Religion, Culture, and Spirituality",
    "Sexualities, Relationships, and Families",
    "Social Development Studies",
    "Social Development Studies and Bachelor of Social Work Double Degree",
    "Social Work",
    "Sociology",
    "Theatre and Performance",
  ],

  Engineering: [
    "Architectural Engineering",
    "Architecture",
    "Biomedical Engineering",
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Engineering",
    "Electrical Engineering",
    "Environmental Engineering",
    "Geological Engineering",
    "Management Engineering",
    "Mechanical Engineering",
    "Mechatronics Engineering",
    "Nanotechnology Engineering",
    "Software Engineering",
    "Systems Design Engineering",
  ],

  Environment: [
    "Climate and Environmental Change",
    "Environment and Business",
    "Environment, Resources and Sustainability",
    "Geography and Aviation",
    "Geography and Environmental Management",
    "Geomatics",
    "Planning",
    "Sustainability and Financial Management",
  ],

  Health: [
    "Health Sciences",
    "Kinesiology",
    "Public Health",
    "Recreation and Leisure Studies",
    "Recreation, Leadership, and Health",
    "Sport and Recreation Management",
    "Therapeutic Recreation",
  ],

  Mathematics: [
    "Actuarial Science",
    "Applied Mathematics",
    "Applied Mathematics with Scientific Computing and Scientific Machine Learning",
    "Biostatistics",
    "Business Administration (Laurier) and Computer Science (Waterloo) Double Degree",
    "Business Administration (Laurier) and Mathematics (Waterloo) Double Degree",
    "Combinatorics and Optimization",
    "Computational Mathematics",
    "Computer Science",
    "Computing and Financial Management",
    "Data Science",
    "Information Technology Management",
    "Mathematical Economics",
    "Mathematical Finance",
    "Mathematical Optimization",
    "Mathematical Physics",
    "Mathematical Studies",
    "Mathematics",
    "Mathematics/Business Administration",
    "Mathematics/Chartered Professional Accountancy",
    "Mathematics/Financial Analysis and Risk Management",
    "Mathematics Teaching",
    "Pure Mathematics",
    "Software Engineering",
    "Statistics",
  ],

  Science: [
    "Environmental Sciences",
    "Honours Science",
    "Life Sciences",
    "Biochemistry",
    "Biology",
    "Biomedical Sciences",
    "Psychology",
    "Medical Sciences (Waterloo) and Doctor of Medicine (St. George's University)",
    "Physical Sciences",
    "Biological and Medical Physics",
    "Chemistry",
    "Earth Sciences",
    "Materials and Nanosciences",
    "Mathematical Physics",
    "Medicinal Chemistry",
    "Physics",
    "Physics and Astronomy",
    "Optometry",
    "Pharmacy",
    "Science and Aviation",
    "Science and Business",
    "Science and Financial Management",
  ],

  "School of Accounting and Finance": [
    "Accounting and Financial Management",
    "Science and Financial Management",
    "Sustainability and Financial Management",
  ],
}

export default function ProfilePage() {
  const { user, loading } = useAuthUser()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [metaLoaded, setMetaLoaded] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)

  const [meta, setMeta] = useState<ProfileMeta>({
    faculty: "",
    program: "",
    coop: "yes",
    gradTerm: "",
    gradYear: null,
  })

  // Edit toggles (inputs locked by default)
  const [editName, setEditName] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [editEmail, setEditEmail] = useState(false)
  const [editPassword, setEditPassword] = useState(false)
  const [editSettings, setEditSettings] = useState(false)

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const avatarSrc = useMemo(() => {
    if (photoPreview) return photoPreview
    return user?.photoURL || DEFAULT_AVATAR
  }, [photoPreview, user?.photoURL])

  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(() => {
    return Array.from({ length: 11 }, (_, i) => currentYear + i)
  }, [currentYear])

  const programOptions = useMemo(() => {
    if (!meta.faculty) return []
    return PROGRAMS_BY_FACULTY[meta.faculty] ?? ["Other"]
  }, [meta.faculty])

  const USER_DOC_COLLECTION = "users"

  const metaSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const queueMetaSave = (nextMeta: ProfileMeta) => {
    if (!user) return
    if (metaSaveTimer.current) clearTimeout(metaSaveTimer.current)

    metaSaveTimer.current = setTimeout(async () => {
      try {
        await setDoc(doc(db, USER_DOC_COLLECTION, user.uid), nextMeta, { merge: true })
      } catch (err: any) {
        console.error("Firestore save failed:", err)
        setError(err?.message ?? "Failed to save settings to Firestore.")
      }
    }, 400)
  }

  useEffect(() => {
    return () => {
      if (metaSaveTimer.current) clearTimeout(metaSaveTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    setDisplayName(user.displayName || "")
    setEmail(user.email || "")
  }, [user])

  // Load settings from Firestore
  useEffect(() => {
    const run = async (u: User) => {
      try {
        const ref = doc(db, "users", u.uid)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          const data = snap.data() as any

          if (typeof data.displayName === "string") setDisplayName(data.displayName)
          if (typeof data.photoURL === "string") setPhotoPreview(data.photoURL)

          setMeta((prev) => ({
            ...prev,
            faculty: data.faculty ?? prev.faculty,
            program: data.program ?? prev.program,
            coop: data.coop ?? prev.coop,
            gradTerm: data.gradTerm ?? prev.gradTerm,
            gradYear: data.gradYear ?? prev.gradYear,
          }))
        }
      } catch {
        // ignore
      } finally {
        setMetaLoaded(true)
      }
    }
    if (user) run(user)
  }, [user])

  if (loading) return <div className="text-white">Loading...</div>
  if (!user) return <div className="text-white">Not signed in.</div>

  const onPickPhoto = () => fileInputRef.current?.click()

  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.")
      return
    }

    setPhotoFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPhotoPreview(objectUrl)
  }

  const saveProfile = async () => {
    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const updates: { displayName?: string; photoURL?: string } = {}

      // Handle display name
      if (editName && displayName !== (user.displayName || "")) {
        updates.displayName = displayName
      }

      let photoUrl: string | null = null

      if (photoFile) {
        try {
          photoUrl = await uploadAvatar(user.uid, photoFile)
        } catch (err: any) {
          setError(err?.message ?? "Avatar upload failed (check Storage rules / App Check / blockers).")
          setSaving(false)
          return
        }
      }

      if (Object.keys(updates).length > 0) {
        console.log("Updating Firebase Auth profile with:", updates)
        await updateProfile(user, updates)

        // Also save to Firestore
        await setDoc(
          doc(db, "users", user.uid),
          {
            displayName: updates.displayName ?? user.displayName,
            photoURL: updates.photoURL ?? user.photoURL,
          },
          { merge: true }
        )
      }

      setPhotoFile(null)
      setEditName(false)
      setMessage("Profile updated.")
    } catch (err: any) {
      console.error("Profile update error:", err)
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
      if (!nextEmail) {
        setError("Email cannot be empty.")
        return
      }
      if (nextEmail === (user.email || "")) {
        setEditEmail(false)
        setMessage("Email unchanged.")
        return
      }

      await verifyBeforeUpdateEmail(user, nextEmail)

      setEditEmail(false)
      setMessage(
        "Verification email sent to the new address. Click the link to finish changing your email."
      )
    } catch (err: any) {
      if (err?.code === "auth/requires-recent-login") {
        setError("For security, log out and log back in, then try changing email again.")
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
      if (!newPassword) {
        setError("Enter a new password.")
        return
      }
      if (newPassword.length < 8) {
        setError("Password must be at least 8 characters.")
        return
      }

      await updatePassword(user, newPassword)
      setNewPassword("")
      setEditPassword(false)
      setMessage("Password updated.")
    } catch (err: any) {
      if (err?.code === "auth/requires-recent-login") {
        setError("For security, log out and log back in, then try changing password again.")
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
    setSettingsError(null)

    try {
      if (!meta.faculty) {
        setSettingsError("Please select a faculty before saving settings.")
        return
      }
      if (!meta.program) {
        setSettingsError("Please select a program before saving settings.")
        return
      }

      const ref = doc(db, "users", user.uid)
      await setDoc(ref, meta, { merge: true })
      setEditSettings(false)
      setMessage("Settings saved.")
    } catch (err: any) {
      setError(err?.message ?? "Failed to save settings.")
    } finally {
      setSaving(false)
    }
  }

  const InputRow = ({
    label,
    children,
  }: {
    label: string
    children: React.ReactNode
  }) => (
    <div className="space-y-1">
      <label className="block text-sm text-slate-200">{label}</label>
      {children}
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col items-center justify-center">
            <div className="group relative h-40 w-40 overflow-hidden rounded-full border border-slate-700">
              <img
                src={avatarSrc}
                alt="Profile"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR
                }}
              />
              <button
                type="button"
                onClick={onPickPhoto}
                className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/50 group-hover:opacity-100"
                title="Change profile picture"
              >
                <div className="flex flex-col items-center gap-1 text-white">
                  <span className="text-lg">📷</span>
                  <span className="text-xs font-semibold">Change</span>
                </div>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPhotoChange}
            />

            <p className="mt-3 text-sm text-slate-300">
              Signed in as <span className="text-white">{user.email}</span>
            </p>
          </div>

          {/* RIGHT: Profile fields */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Profile</h2>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-200">
                {message}
              </div>
            )}

            <EditableField
              label="Display name"
              editing={editName}
              onEdit={() => {
                setEditName(true)
                setError(null)
              }}
            >
              <input
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white outline-none focus:border-slate-400 disabled:opacity-60"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="off"
                disabled={!editName || saving}
              />
            </EditableField>

            <button
              onClick={saveProfile}
              disabled={saving || (!editName && !photoFile)}
              className="w-full rounded-lg bg-white text-slate-900 font-semibold py-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save profile"}
            </button>

            <div className="h-px bg-slate-800 my-2" />

            <h3 className="text-lg font-semibold text-white">Account</h3>

            <EditableField
              label="Email"
              editing={editEmail}
              onEdit={() => {
                setEditEmail(true)
                setError(null)
              }}
            >
              <input
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white outline-none focus:border-slate-400 disabled:opacity-60"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                disabled={!editEmail || saving}
              />
            </EditableField>

            <button
              onClick={saveEmail}
              disabled={saving || !editEmail}
              className="w-full rounded-lg border border-slate-700 text-white py-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title="This will send a verification email to the new address."
            >
              Send verification to update email
            </button>

            <EditableField
              label="New password"
              editing={editPassword}
              onEdit={() => {
                setEditPassword(true)
                setError(null)
              }}
            >
              <input
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white outline-none focus:border-slate-400 disabled:opacity-60"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter a new password"
                autoComplete="new-password"
                disabled={!editPassword || saving}
              />
            </EditableField>

            <button
              onClick={savePassword}
              disabled={saving || !editPassword}
              className="w-full rounded-lg border border-slate-700 text-white py-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Update password
            </button>
          </div>
        </div>

        <div className="h-px bg-slate-800 my-6" />

        {/* SETTINGS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Settings</h3>
            <p className="text-sm text-slate-300">
              Locked by default. Click "Change settings" to edit.
            </p>
          </div>

          <div className="space-y-3">
            {settingsError && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                {settingsError}
              </div>
            )}

            <div className="flex gap-2">
              {!editSettings ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditSettings(true)
                    setSettingsError(null)
                  }}
                  className="w-full rounded-lg border border-slate-700 text-white py-2 hover:bg-slate-800"
                >
                  Change settings
                </button>
              ) : (
                <button
                  type="button"
                  onClick={saveSettings}
                  disabled={saving}
                  className="w-full rounded-lg bg-white text-slate-900 font-semibold py-2 hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save settings"}
                </button>
              )}

              {editSettings && (
                <button
                  type="button"
                  onClick={() => {
                    setEditSettings(false)
                    setSettingsError(null)
                  }}
                  disabled={saving}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  Cancel
                </button>
              )}
            </div>

            <SelectMenu
              label="Faculty"
              value={meta.faculty}
              disabled={!editSettings || saving}
              placeholder="Select faculty"
              options={Object.keys(PROGRAMS_BY_FACULTY)}
              onChange={(faculty) => {
                setMeta((p) => {
                  const next: ProfileMeta = {
                    ...p,
                    faculty,
                    program: p.faculty === faculty ? p.program : "",
                  }
                  queueMetaSave(next)
                  return next
                })
                setSettingsError(null)
              }}
            />

            <SelectMenu
              label="Program"
              value={meta.program}
              disabled={!editSettings || saving || !meta.faculty}
              placeholder={meta.faculty ? "Select program" : "Select faculty first"}
              options={programOptions}
              onChange={(program) => {
                setMeta((p) => {
                  const next: ProfileMeta = { ...p, program }
                  queueMetaSave(next)
                  return next
                })
                setSettingsError(null)
              }}
            />

            {editSettings && metaLoaded && !meta.faculty && (
              <p className="text-xs text-amber-300">
                Select a faculty to unlock programs.
              </p>
            )}

            <InputRow label="Co-op">
              <select
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white outline-none focus:border-slate-400 disabled:opacity-60"
                value={meta.coop}
                disabled={!editSettings || saving}
                onChange={(e) => {
                  const value = e.target.value as "yes" | "no"
                  setMeta((p) => {
                    const next: ProfileMeta = { ...p, coop: value }
                    queueMetaSave(next)
                    return next
                  })
                  setSettingsError(null)
                }}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </InputRow>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputRow label="Graduation term">
                <select
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white outline-none focus:border-slate-400 disabled:opacity-60"
                  value={meta.gradTerm}
                  disabled={!editSettings || saving}
                  onChange={(e) => {
                    const value = e.target.value as GradTerm | ""
                    setMeta((p) => {
                      const next: ProfileMeta = { ...p, gradTerm: value }
                      queueMetaSave(next)
                      return next
                    })
                    setSettingsError(null)
                  }}
                >
                  <option value="">Select term</option>
                  <option value="Fall">Fall</option>
                  <option value="Winter">Winter</option>
                  <option value="Spring">Spring</option>
                </select>
              </InputRow>

              <InputRow label="Graduation year">
                <select
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white outline-none focus:border-slate-400 disabled:opacity-60"
                  value={meta.gradYear ?? ""}
                  disabled={!editSettings || saving}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : null
                    setMeta((p) => {
                      const next: ProfileMeta = { ...p, gradYear: value }
                      queueMetaSave(next)
                      return next
                    })
                    setSettingsError(null)
                  }}
                >
                  <option value="">Select year</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </InputRow>
            </div>

            {!editSettings && (
              <p className="text-xs text-slate-400">
                Click "Change settings" to edit.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}