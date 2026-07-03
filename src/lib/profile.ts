import { useCallback, useEffect, useState } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "./firebase"
import { useAuthUser } from "./useAuthUser"

export type GradTerm = "Fall" | "Winter" | "Spring"

export type ProfileMeta = {
  faculty: string
  program: string
  coop: "yes" | "no"
  gradTerm: GradTerm | ""
  gradYear: number | null
  /** Academic term the student is currently in, e.g. "1A". */
  currentTerm: string
}

export const EMPTY_META: ProfileMeta = {
  faculty: "",
  program: "",
  coop: "yes",
  gradTerm: "",
  gradYear: null,
  currentTerm: "",
}

/** A profile is "complete" once the essentials for planning are filled in. */
export function isProfileComplete(m: ProfileMeta | null | undefined): boolean {
  return Boolean(m && m.faculty && m.program && m.gradTerm && m.gradYear)
}

export async function loadProfileMeta(uid: string): Promise<ProfileMeta | null> {
  const snap = await getDoc(doc(db, "users", uid))
  if (!snap.exists()) return null
  const d = snap.data() as Partial<ProfileMeta>
  return {
    faculty: d.faculty ?? "",
    program: d.program ?? "",
    coop: d.coop ?? "yes",
    gradTerm: (d.gradTerm as GradTerm) ?? "",
    gradYear: d.gradYear ?? null,
    currentTerm: d.currentTerm ?? "",
  }
}

export async function saveProfileMeta(uid: string, meta: Partial<ProfileMeta>) {
  await setDoc(doc(db, "users", uid), meta, { merge: true })
}

/**
 * Loads the signed-in user's profile from Firestore and keeps it in state.
 * Exposes a `complete` flag for onboarding gating, plus a `save` helper that
 * persists and updates local state so data survives refresh/logout.
 */
export function useProfileMeta() {
  const { user, loading: authLoading } = useAuthUser()
  const [meta, setMeta] = useState<ProfileMeta | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (authLoading) return
    if (!user) {
      setMeta(null)
      setLoading(false)
      return
    }
    setLoading(true)
    loadProfileMeta(user.uid)
      .then((m) => {
        if (active) setMeta(m ?? EMPTY_META)
      })
      .catch(() => {
        if (active) setMeta(EMPTY_META)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user, authLoading])

  const save = useCallback(
    async (next: Partial<ProfileMeta>) => {
      if (!user) throw new Error("Not signed in.")
      await saveProfileMeta(user.uid, next)
      setMeta((prev) => ({ ...(prev ?? EMPTY_META), ...next }))
    },
    [user]
  )

  return {
    user,
    meta,
    loading: authLoading || loading,
    complete: isProfileComplete(meta),
    save,
  }
}

export const PROGRAMS_BY_FACULTY: Record<string, string[]> = {
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
