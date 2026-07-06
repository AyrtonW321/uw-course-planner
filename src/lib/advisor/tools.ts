import { useCallback } from "react"
import { useProfileMeta } from "../profile"
import { useDegreePlan } from "../degreePlan"
import { useCompleted } from "../completed"
import { useAcademicRecord } from "../record"
import { useAlerts } from "../alerts"
import { usePrereqIndex } from "../usePrereq"
import { getCourseWithSections, getTermInfo, listAllCourses } from "../catalog"
import { getRatings } from "../uwflow"
import { getProgramRequirements, statusForClauses } from "../requirements"
import type { ToolDeclaration, ToolExecutor } from "./types"

export const TOOL_DECLARATIONS: ToolDeclaration[] = [
  {
    name: "get_student_context",
    description:
      "The student's program, current term, co-op, planned courses per term, completed courses with grades, passed/failed courses, and current alerts. Call this first.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "search_courses",
    description:
      "Search the live course catalog by keyword and optional subject code. Returns matching course codes and names to look up further.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keyword to match in code or title" },
        subject: { type: "string", description: "Optional subject code, e.g. AMATH, CS, STAT" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_course_details",
    description:
      "Full details for specific courses: description, prerequisite text, and UW Flow ratings (liked/useful/easy). Use this before describing or recommending a course.",
    parameters: {
      type: "object",
      properties: {
        codes: { type: "array", items: { type: "string" }, description: "Course codes, e.g. ['AMATH 449','CS 479']" },
      },
      required: ["codes"],
    },
  },
  {
    name: "check_eligibility",
    description:
      "Whether the student meets a course's prerequisites, based on their passed courses and grades. Returns met | grade | missing plus the prerequisite structure.",
    parameters: {
      type: "object",
      properties: { code: { type: "string" } },
      required: ["code"],
    },
  },
  {
    name: "get_requirements",
    description:
      "The student's program requirements and which requirement groups are satisfied by their passed/planned courses, plus unit targets.",
    parameters: { type: "object", properties: {} },
  },
]

export function useAdvisorTools(): { declarations: ToolDeclaration[]; execute: ToolExecutor } {
  const { meta } = useProfileMeta()
  const { plan } = useDegreePlan()
  const { completed } = useCompleted()
  const { passedCodes, failedCodes, bestGrades } = useAcademicRecord()
  const { resolve } = usePrereqIndex()
  const alerts = useAlerts()

  const execute = useCallback<ToolExecutor>(
    async (name, args) => {
      switch (name) {
        case "get_student_context": {
          const grades: { code: string; term?: string; grade: number | null }[] = []
          for (const [term, list] of Object.entries(plan))
            for (const c of list) if (c.grade !== undefined) grades.push({ code: c.code, term, grade: c.grade })
          for (const c of completed) grades.push({ code: c.code, grade: c.grade })
          return {
            program: meta?.program ?? null,
            faculty: meta?.faculty ?? null,
            currentTerm: meta?.currentTerm ?? null,
            coop: meta?.coop ?? null,
            graduation: meta?.gradTerm && meta?.gradYear ? `${meta.gradTerm} ${meta.gradYear}` : null,
            plannedByTerm: Object.fromEntries(
              Object.entries(plan).map(([t, list]) => [t, list.map((c) => c.code)])
            ),
            grades,
            passed: [...passedCodes],
            failed: [...failedCodes],
            alerts: alerts.map((a) => ({ kind: a.kind, detail: a.detail })),
          }
        }

        case "search_courses": {
          const t = await getTermInfo()
          const all = await listAllCourses(t.termCode)
          const q = String(args.query ?? "").toLowerCase()
          const subject = args.subject ? String(args.subject).toUpperCase() : null
          let res = all.filter(
            (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
          )
          if (subject) res = res.filter((c) => c.subject === subject)
          return { courses: res.slice(0, 25).map((c) => ({ code: c.code, name: c.name })) }
        }

        case "get_course_details": {
          const t = await getTermInfo()
          const codes = (Array.isArray(args.codes) ? (args.codes as string[]) : []).slice(0, 8)
          const ratings = await getRatings(codes)
          const courses = []
          for (const code of codes) {
            const course = await getCourseWithSections(t.termCode, code)
            if (!course) {
              courses.push({ code, found: false })
              continue
            }
            const r = ratings.get(code)
            courses.push({
              code,
              name: course.name,
              description: course.description,
              requirements: course.requirements ?? null,
              rating: r && r.filled > 0 ? { liked: r.liked, useful: r.useful, easy: r.easy, count: r.filled } : null,
            })
          }
          return { courses }
        }

        case "check_eligibility": {
          const code = String(args.code ?? "")
          const clauses = resolve(code)
          const status = statusForClauses(clauses, passedCodes, bestGrades)
          return {
            code,
            status,
            prerequisites: clauses.map((cl) =>
              cl.map((a) => a.code + (a.minGrade ? ` (≥${a.minGrade}%)` : "")).join(" or ")
            ),
          }
        }

        case "get_requirements": {
          const req = getProgramRequirements(meta?.program)
          if (!req) return { available: false, program: meta?.program ?? null }
          const have = new Set(passedCodes)
          for (const list of Object.values(plan))
            for (const c of list) if (!failedCodes.has(c.code)) have.add(c.code)
          return {
            program: req.program,
            degree: req.degree,
            mathUnits: req.mathUnits,
            nonMathUnits: req.nonMathUnits,
            totalUnits: req.totalUnits,
            groups: req.groups.map((g) =>
              g.kind === "choose"
                ? { kind: "choose", label: g.label }
                : {
                    kind: g.kind,
                    courses: g.courses.map((c) => c.code),
                    satisfied:
                      g.kind === "all"
                        ? g.courses.every((c) => have.has(c.code))
                        : g.courses.some((c) => have.has(c.code)),
                  }
            ),
          }
        }

        default:
          return { error: `Unknown tool: ${name}` }
      }
    },
    [meta, plan, completed, passedCodes, failedCodes, bestGrades, resolve, alerts]
  )

  return { declarations: TOOL_DECLARATIONS, execute }
}
