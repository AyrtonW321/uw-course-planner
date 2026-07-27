import { lazy, Suspense } from "react"
import { Routes, Route, Navigate } from "react-router-dom"

// Route-level code splitting keeps the initial bundle small; each page loads
// on demand behind the Suspense fallback below.
const HomePage = lazy(() => import("./pages/homepage"))
const Login = lazy(() => import("./pages/login/login"))
const Register = lazy(() => import("./pages/login/register"))
const Onboarding = lazy(() => import("./pages/login/onboarding"))
const MainPage = lazy(() => import("./pages/mainpage"))
const Dashboard = lazy(() => import("./pages/dashboard"))
const ProfilePage = lazy(() => import("./pages/profilepage"))
const TimetablePage = lazy(() => import("./pages/timetable"))
const CoursesPage = lazy(() => import("./pages/courses"))
const CourseInfoPage = lazy(() => import("./pages/courseinfo"))
const AdvisorPage = lazy(() => import("./pages/advisor"))
const PlannerLayout = lazy(() => import("./pages/planner/PlannerLayout"))
const PlannerTerms = lazy(() => import("./pages/planner/terms"))
const MyDegree = lazy(() => import("./pages/planner/mydegree"))
const CompletedPage = lazy(() => import("./pages/planner/completed"))
const CoopPage = lazy(() => import("./pages/planner/coop"))

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-void text-fog">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/[0.1] border-t-gold" />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* First-run profile setup (auth required, no navbar) */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Protected app area (NavBar shows here) */}
        <Route path="/app" element={<MainPage />}>
          <Route index element={<Dashboard />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/:code" element={<CourseInfoPage />} />
          <Route path="advisor" element={<AdvisorPage />} />
          <Route path="planner" element={<PlannerLayout />}>
            <Route index element={<PlannerTerms />} />
            <Route path="degree" element={<MyDegree />} />
            <Route path="completed" element={<CompletedPage />} />
            <Route path="coop" element={<CoopPage />} />
          </Route>
          <Route path="profile" element={<ProfilePage />} />
          <Route path="timetable" element={<TimetablePage />} />
        </Route>

        {/* Unknown routes fall back home. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
