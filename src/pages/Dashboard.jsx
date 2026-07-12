import { Link } from 'react-router'
import {
  TrendingUp,
  CreditCard,
  ShoppingCart,
  AlertTriangle,
  PackagePlus,
  Plus,
  PackageX,
  IndianRupee,
  CheckCircle2,
} from 'lucide-react'
import StatCard from '../components/StatCard'
import { useDashboardMetrics } from '../hooks/useDashboard'
import { useLowStockProducts } from '../hooks/useProducts'

function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics()
  const { data: lowStockItems, isLoading: lowStockLoading } = useLowStockProducts(10)

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-50">Dashboard</h1>
        <p className="text-sm text-surface-400 mt-0.5">
          Here's what's happening with your wholesale operations today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Receivables"
          value={
            metricsLoading
              ? '...'
              : `Rs.${Number(metrics?.total_receivables || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
          }
          icon={IndianRupee}
          accent="primary"
        />
        <StatCard
          label="Total Payables"
          value={
            metricsLoading
              ? '...'
              : `Rs.${Number(metrics?.total_payables || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
          }
          icon={CreditCard}
          accent="danger"
        />
        <StatCard
          label="Today's Sales"
          value={
            metricsLoading
              ? '...'
              : `Rs.${Number(metrics?.today_sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
          }
          icon={TrendingUp}
          accent="emerald"
        />
        <StatCard
          label="Pending Orders"
          value={metricsLoading ? '...' : metrics?.pending_orders || 0}
          icon={ShoppingCart}
          accent={metrics?.pending_orders > 0 ? 'warning' : 'info'}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/sales/new"
            className="group glass-card p-6 flex flex-col items-center justify-center text-center hover:bg-surface-800/80 hover:border-primary-500/30 transition-all duration-300 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <Plus className="w-6 h-6 text-primary-400" />
            </div>
            <h3 className="text-base font-semibold text-surface-100 group-hover:text-primary-300 transition-colors">
              New Sale
            </h3>
            <p className="text-xs text-surface-400 mt-1 max-w-[200px]">
              Quick order entry for WhatsApp customers
            </p>
          </Link>

          <Link
            to="/inventory/receive-stock"
            className="group glass-card p-6 flex flex-col items-center justify-center text-center hover:bg-surface-800/80 hover:border-emerald-500/30 transition-all duration-300 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <PackagePlus className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-base font-semibold text-surface-100 group-hover:text-emerald-300 transition-colors">
              Receive Stock
            </h3>
            <p className="text-xs text-surface-400 mt-1 max-w-[200px]">
              Add new inventory packets from factory vendors
            </p>
          </Link>
        </div>
      </div>

      {/* Critical Alerts (Low Stock) */}
      <div>
        <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-warning-400" />
          Critical Alerts
        </h2>

        <div className="glass-card overflow-hidden">
          {lowStockLoading ? (
            <div className="p-8 text-center text-surface-400 text-sm">
              Checking stock levels...
            </div>
          ) : !lowStockItems || lowStockItems.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center text-center border-t border-surface-700/50">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm font-medium text-surface-300">All Stock Levels Healthy</p>
              <p className="text-xs text-surface-500 mt-1">No products are running critically low right now.</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-700/50">
              {lowStockItems.map((item) => (
                <div key={item.id} className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-surface-800/30 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-danger-500/10 flex items-center justify-center flex-shrink-0">
                      <PackageX className="w-5 h-5 text-danger-400" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium text-surface-100 truncate">
                        {item.categories?.name} — {item.size} {item.color}
                      </p>
                      <p className="text-xs font-mono text-surface-400 mt-0.5">
                        SKU: {item.sku}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-danger-400 tabular-nums">
                      {item.stock_quantity}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-surface-500">
                      Packets Left
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
