import { Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/login/login"
function Planner() {
  return <div className="text-white p-6">Planner page (placeholder)</div>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/planner" element={<Planner />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
