import { Routes, Route, Navigate } from 'react-router'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import InventoryDashboard from './pages/InventoryDashboard'
import ReceiveStock from './pages/ReceiveStock'
import SalesDashboard from './pages/SalesDashboard'
import NewSale from './pages/NewSale'
import Customers from './pages/Customers'
import Vendors from './pages/Vendors'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<InventoryDashboard />} />
        <Route path="/inventory/receive-stock" element={<ReceiveStock />} />
        <Route path="/sales" element={<SalesDashboard />} />
        <Route path="/sales/new" element={<NewSale />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/vendors" element={<Vendors />} />
      </Route>
    </Routes>
  )
}

export default App
