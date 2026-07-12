import { Routes, Route, Navigate, Outlet } from 'react-router'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import InventoryDashboard from './pages/InventoryDashboard'
import ReceiveStock from './pages/ReceiveStock'
import SalesDashboard from './pages/SalesDashboard'
import NewSale from './pages/NewSale'
import Customers from './pages/Customers'
import Vendors from './pages/Vendors'
import Reports from './pages/Reports'
import Login from './pages/Login'
import Signup from './pages/Signup'

function ProtectedRoute() {
  const { session } = useAuth()

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      {/* <Route path="/signup" element={<Signup />} /> for future use */}

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<InventoryDashboard />} />
          <Route path="/inventory/receive-stock" element={<ReceiveStock />} />
          <Route path="/sales" element={<SalesDashboard />} />
          <Route path="/sales/new" element={<NewSale />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
