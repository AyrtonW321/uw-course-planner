import { useCallback, useMemo } from "react"
import type { DocumentData } from "firebase/firestore"
import { useUserDoc } from "./userDoc"

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

/** Map a raw user document into a ProfileMeta with defaults. */
export function metaFromDoc(d: DocumentData | null | undefined): ProfileMeta {
  return {
    faculty: d?.faculty ?? "",
    program: d?.program ?? "",
    coop: d?.coop ?? "yes",
    gradTerm: (d?.gradTerm as GradTerm) ?? "",
    gradYear: d?.gradYear ?? null,
    currentTerm: d?.currentTerm ?? "",
  }
}

/**
 * The signed-in user's profile, derived from the shared user document.
 * Exposes a `complete` flag for onboarding gating and a `save` helper.
 */
export function useProfileMeta() {
  const { user, data, loading, update } = useUserDoc()

  const meta = useMemo<ProfileMeta | null>(
    () => (user ? metaFromDoc(data) : null),
    [user, data]
  )

  const save = useCallback(
    (next: Partial<ProfileMeta>) => update(next as Record<string, unknown>),
    [update]
  )

  return { user, meta, loading, complete: isProfileComplete(meta), save }
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
