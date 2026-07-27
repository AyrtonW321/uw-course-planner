# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Documentation

Always use Context7 for library/API documentation, code generation, setup, or
configuration steps — without being asked.

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — `tsc -b && vite build` (typecheck then build; build fails on type errors)
- `npm run lint` — ESLint over the whole repo
- `npm run test` — `vitest run` (all tests, single pass)
- Single test file: `npx vitest run src/lib/alerts.test.ts`
- `npm run doctor` — `react-doctor` diagnostics (lint/a11y/bundle/architecture)

Tests live next to the module they cover (`foo.ts` / `foo.test.ts`) under `src/lib/`.

## Architecture

React + TypeScript + Vite SPA (Tailwind v4, CSS-first config in `src/index.css`, no `tailwind.config.*`) with Firebase (Auth, Firestore, Storage, AI Logic) as the only backend — there is no custom server.

### Single-document data model (the load-bearing pattern)

All per-user app state — profile, degree plan, timetable, completed courses/grades, co-op plan, saved schedules, locked terms — lives in **one Firestore document**, `users/{uid}`. `src/lib/userDoc.tsx` opens a single `onSnapshot` on that document and exposes it via a `UserDocProvider` context (`useUserDoc()`).

Every feature-specific hook (`useProfileMeta`, `useDegreePlan`, `useTimetable`, `useCompleted`, `useCoopPlan`, `useSchedules`, etc.) reads a slice of that same snapshot and writes back through `update()`, which merges into the one document. **Do not add a new `onSnapshot`/`getDoc` call for user data** — add a new slice/hook on top of `useUserDoc()` instead, or the app will regress to N redundant listeners.

### Course catalog layer

- `src/lib/uwapi.ts` — thin client for the UW Open Data API v3 (terms, subjects, courses, schedules).
- `src/lib/catalog.ts` — maps raw API responses into the app's domain types (`Course`/`Section`/`Meeting` from `src/lib/courses.ts`), and falls back to a small hardcoded `COURSES` mock set when no API key is configured (`USE_API` flag). This is the layer pages should import from, not `uwapi.ts` directly.
- `src/lib/cache.ts` — generic localStorage TTL cache used to avoid re-hitting the UW API every session.

### Prerequisite system

- `src/lib/prereqParser.ts` — parses UW's free-text requirement strings (e.g. "Prereq: CS 135 or CS 145; Antireq: ...") into structured `PrereqClause[]` (AND-of-OR groups).
- `src/lib/requirements.ts` — hand-curated `PREREQS` overrides for courses where parsing isn't reliable, plus per-program requirement definitions used by the degree audit.
- `src/lib/usePrereq.ts` — builds a term-wide prereq index once (forward prereqs + reverse "leads to" edges) and caches it in a module-level variable across renders.
- `src/lib/record.ts` — derives passed/failed course sets from the combination of degree-plan course grades and standalone completed-course entries (a course can be both planned-with-a-grade and separately marked completed; this reconciles them).
- `src/lib/alerts.ts` — pure `computeAlerts()` (tested directly) plus a `useAlerts()` hook wrapper, surfacing things like "missing grade" or "failed course needs a retake" as notifications. This split (pure function + thin hook) is the pattern to follow for any new derived-state logic that needs unit tests.

### AI Advisor (`src/lib/advisor/`, `src/pages/advisor.tsx`)

Uses the **Firebase AI Logic client SDK** (`firebase/ai`) directly from the browser — there is no custom backend/Cloud Function proxy for this.

- `tools.ts` declares Gemini `FunctionDeclaration[]` and a matching executor hook that wires each tool to existing read hooks (`useProfileMeta`, `useDegreePlan`, catalog/prereq lookups, etc.), so the model can only query state through the same data layer the UI uses.
- `agent.ts` runs the conversation turn loop: send the user message, handle any `functionCalls` in the response by invoking the matching tool, feed results back, repeat until the model returns text (bounded by a max-rounds guard).

### Routing (`src/App.tsx`)

All routes are `React.lazy`-loaded. Everything under `/app` is nested inside `MainPage` (layout: NavBar + AlertBar + `<Outlet>`); `/app/planner/*` has its own nested layout (`PlannerLayout`). Unknown routes redirect to `/`.

### UI tokens

`src/lib/ui.ts` centralizes shared className strings (`glassCard`, `glassInput`, `goldButton`, etc.) that reference the glassmorphism styles defined in `src/index.css` (`.glass`, `.glass-input`, `.btn-gold`, ...). Reuse these tokens rather than re-writing the glass/border/blur classes inline.

## Execution Rules
- NEVER spin up subagents, background agents, or parallel sub-tasks.
- Perform all edits sequentially within the main thread.
- Keep terminal/build command output clean: run `tsc -b` or `vitest` only when necessary or explicitly requested.
- Scope changes to specific components/pages rather than whole-repo refactors in a single prompt.