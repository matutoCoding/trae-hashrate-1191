import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Yachts from '@/pages/Yachts'
import YachtDetail from '@/pages/YachtDetail'
import Bookings from '@/pages/Bookings'
import Rates from '@/pages/Rates'
import Bills from '@/pages/Bills'
import Approvals from '@/pages/Approvals'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/yachts" element={<Yachts />} />
          <Route path="/yachts/:yachtId" element={<YachtDetail />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/rates" element={<Rates />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/approvals" element={<Approvals />} />
        </Route>
      </Routes>
    </Router>
  )
}
