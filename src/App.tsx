import { Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/login/login"
import Register from "./pages/login/register"

function Planner() {
  return <div className="text-white p-6">Planner Page</div>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/planner" element={<Planner />} />
    </Routes>
  )
}
