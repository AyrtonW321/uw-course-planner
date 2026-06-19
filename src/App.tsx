import { Routes, Route } from "react-router-dom"
import HomePage from "./pages/homepage"
import Login from "./pages/login/login"
import Register from "./pages/login/register"
import MainPage from "./pages/mainpage"
import Dashboard from "./pages/dashboard"
import ProfilePage from "./pages/profilepage"
import TimetablePage from "./pages/timetable"
import CoursesPage from "./pages/courses"
import CourseInfoPage from "./pages/courseinfo"
import DegreePlannerPage from "./pages/degreeplanner"
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
        <Route path="planner" element={<DegreePlannerPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="timetable" element={<TimetablePage />} />
      </Route>
    </Routes>
  )
}
