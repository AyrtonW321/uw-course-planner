import { Routes, Route, Navigate } from "react-router-dom"
import HomePage from "./pages/homepage"
import Login from "./pages/login/login"
import Register from "./pages/login/register"
import MainPage from "./pages/mainpage"
import Dashboard from "./pages/dashboard"
import ProfilePage from "./pages/profilepage"
import TimetablePage from "./pages/timetable"
import CoursesPage from "./pages/courses"
import CourseInfoPage from "./pages/courseinfo"
import PlannerLayout from "./pages/planner/PlannerLayout"
import PlannerTerms from "./pages/planner/terms"
import MyDegree from "./pages/planner/mydegree"
import CoopPage from "./pages/planner/coop"
import Onboarding from "./pages/login/onboarding"


export default function App() {
  return (
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
        <Route path="planner" element={<PlannerLayout />}>
          <Route index element={<PlannerTerms />} />
          <Route path="degree" element={<MyDegree />} />
          <Route path="coop" element={<CoopPage />} />
        </Route>
        <Route path="profile" element={<ProfilePage />} />
        <Route path="timetable" element={<TimetablePage />} />
      </Route>

      {/* Unknown routes fall back home. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
