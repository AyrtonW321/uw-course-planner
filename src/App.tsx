import { Routes, Route } from "react-router-dom"
import HomePage from "./pages/homepage"
import Login from "./pages/login/login"
import Register from "./pages/login/register"
import MainPage from "./pages/mainpage"
import Dashboard from "./pages/dashboard"
import ProfilePage from "./pages/profilepage"
import TimetablePage from "./pages/timetable"


export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected app area (NavBar shows here) */}
      <Route path="/app" element={<MainPage />}>
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="timetable" element={<TimetablePage />} />
      </Route>
    </Routes>
  )
}
