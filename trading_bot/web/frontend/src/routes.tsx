import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Backtest from './pages/Backtest'
import Strategies from './pages/Strategies'
import Settings from './pages/Settings'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/backtest" element={<Backtest />} />
      <Route path="/strategies" element={<Strategies />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  )
} 