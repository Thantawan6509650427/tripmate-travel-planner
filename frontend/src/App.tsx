import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import TripDetail from './pages/TripDetail'
import TripSummary from './pages/TripSummary'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected */}
      <Route path="/" element={
        <ProtectedRoute><Home /></ProtectedRoute>
      } />
      <Route path="/trips/:tripId" element={
        <ProtectedRoute><TripDetail /></ProtectedRoute>
      } />
      <Route path="/trips/:tripId/summary" element={
        <ProtectedRoute><TripSummary /></ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="/404"  element={<NotFound />} />
      <Route path="*"     element={<Navigate to="/404" replace />} />
    </Routes>
  )
}