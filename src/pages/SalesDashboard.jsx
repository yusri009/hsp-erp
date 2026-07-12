import { useState } from 'react'
import { Link } from 'react-router'
import {
  ShoppingCart,
  Plus,
  CheckCircle2,
  Clock,
  Loader2,
  PackageCheck,
  AlertCircle,
} from 'lucide-react'
import { useSalesOrders, useFulfillSalesOrder } from '../hooks/useSalesOrders'
import DataTable from '../components/DataTable'
import StatCard from '../components/StatCard'

const STATUS_TABS = [
  { key: '', label: 'All Orders' },
  { key: 'Pending', label: 'Pending' },
  { key: 'Delivered', label: 'Delivered' },
]

function SalesDashboard() {
  const [activeTab, setActiveTab] = useState('')
  const [fulfillingId, setFulfillingId] = useState(null)

  // Queries — fetch all to get counts, fetch filtered for the table
  const { data: allOrders, isLoading: allLoading } = useSalesOrders()
  const { data: filteredOrders, isLoading: filteredLoading } = useSalesOrders(activeTab || undefined)
  const fulfillOrder = useFulfillSalesOrder()

  const pendingCount = allOrders?.filter((o) => o.status === 'Pending').length || 0
  const deliveredCount = allOrders?.filter((o) => o.status === 'Delivered').length || 0
  const totalRevenue = allOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0

  const handleFulfill = async (orderId) => {
    setFulfillingId(orderId)
    try {
      await fulfillOrder.mutateAsync(orderId)
    } catch (err) {
      console.error('Failed to fulfill order:', err)
    } finally {
      setFulfillingId(null)
    }
  }

  const getTabCount = (key) => {
    if (key === '') return allOrders?.length || 0
    if (key === 'Pending') return pendingCount
    if (key === 'Delivered') return deliveredCount
    return 0
  }

  const columns = [
    {
      key: 'id',
      header: 'Order #',
      sortable: true,
      render: (val) => (
        <span className="font-mono text-xs font-semibold text-surface-300">
          #{String(val).padStart(4, '0')}
        </span>
      ),
    },
    {
      key: 'customer_name',
      header: 'Customer',
      sortable: true,
      render: (_, row) => (
        <span className="font-medium text-surface-100">
          {row.customers?.name || '—'}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (val) => {
        if (!val) return '—'
        const d = new Date(val)
        return (
          <span className="tabular-nums text-surface-300">
            {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        )
      },
    },
    {
      key: 'total_amount',
      header: 'Total Amount',
      sortable: true,
      render: (val) => (
        <span className="tabular-nums font-semibold text-surface-100">
          {val != null ? `Rs.${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (val) => {
        const isPending = val === 'Pending'
        return (
          <span
            className={`badge text-xs ${isPending
                ? 'bg-warning-500/15 text-warning-400'
                : 'bg-primary-500/15 text-primary-400'
              }`}
          >
            {isPending ? (
              <Clock className="w-3 h-3 mr-1" />
            ) : (
              <CheckCircle2 className="w-3 h-3 mr-1" />
            )}
            {val}
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (_, row) => {
        if (row.status !== 'Pending') return null
        const isLoading = fulfillingId === row.id
        return (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleFulfill(row.id)
            }}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
              rounded-lg transition-all duration-200 cursor-pointer
              bg-primary-500/10 text-primary-400 border border-primary-500/20
              hover:bg-primary-500/20 hover:border-primary-500/40
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <PackageCheck className="w-3.5 h-3.5" />
                Mark as Delivered
              </>
            )}
          </button>
        )
      },
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Sales</h1>
          <p className="text-sm text-surface-400 mt-0.5">
            Manage orders and track deliveries
          </p>
        </div>
        <Link to="/sales/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Sale
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Orders"
          value={allLoading ? '...' : (allOrders?.length || 0)}
          icon={ShoppingCart}
          accent="info"
        />
        <StatCard
          label="Pending Deliveries"
          value={allLoading ? '...' : pendingCount}
          icon={Clock}
          accent={pendingCount > 0 ? 'warning' : 'primary'}
        />
        <StatCard
          label="Total Revenue"
          value={allLoading ? '...' : `Rs.${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          icon={CheckCircle2}
          accent="primary"
        />
      </div>

      {/* Status Tabs */}
      <div className="glass-card p-1.5 inline-flex gap-1 animate-slide-up">
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.key
          const count = allLoading ? '…' : getTabCount(tab.key)
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                flex items-center gap-2
                ${isActive
                  ? 'bg-primary-500/15 text-primary-400 shadow-sm'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-700/50'
                }
              `}
            >
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full tabular-nums ${isActive ? 'bg-primary-500/20 text-primary-300' : 'bg-surface-700 text-surface-500'
                  }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Fulfill Error Toast */}
      {fulfillOrder.isError && (
        <div className="glass-card p-4 border-danger-500/30 flex items-center gap-3 animate-slide-up">
          <AlertCircle className="w-5 h-5 text-danger-400 flex-shrink-0" />
          <p className="text-sm text-danger-300">
            Failed to update order: {fulfillOrder.error?.message || 'Unknown error'}
          </p>
        </div>
      )}

      {/* Orders Table */}
      <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <DataTable
          columns={columns}
          data={filteredOrders}
          isLoading={filteredLoading}
          emptyMessage={
            activeTab
              ? `No ${activeTab.toLowerCase()} orders found`
              : 'No sales orders yet — create your first sale!'
          }
        />
      </div>
    </div>
  )
}

export default SalesDashboard
