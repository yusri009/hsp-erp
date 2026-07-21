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
  Trash2,
  RotateCcw,
  Eye,
} from 'lucide-react'
import { useSalesOrders, useFulfillSalesOrder, useDeleteSalesOrder, useUnfulfillSalesOrder } from '../hooks/useSalesOrders'
import DataTable from '../components/DataTable'
import StatCard from '../components/StatCard'
import Modal from '../components/Modal'

const STATUS_TABS = [
  { key: '', label: 'All Orders' },
  { key: 'Pending', label: 'Pending' },
  { key: 'Delivered', label: 'Delivered' },
]

function SalesDashboard() {
  const [activeTab, setActiveTab] = useState('')
  const [fulfillingId, setFulfillingId] = useState(null)
  
  // --- Sales Order Details State ---
  const [selectedSaleOrder, setSelectedSaleOrder] = useState(null)
  const [isSaleOrderModalOpen, setIsSaleOrderModalOpen] = useState(false)

  // Queries — fetch all to get counts, fetch filtered for the table
  const { data: allOrders, isLoading: allLoading } = useSalesOrders()
  const { data: filteredOrders, isLoading: filteredLoading } = useSalesOrders(activeTab || undefined)
  const fulfillOrder = useFulfillSalesOrder()
  const unfulfillOrder = useUnfulfillSalesOrder()
  const deleteOrder = useDeleteSalesOrder()

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

  const handleUnfulfill = async (orderId) => {
    setFulfillingId(orderId)
    try {
      await unfulfillOrder.mutateAsync(orderId)
    } catch (err) {
      console.error('Failed to unfulfill order:', err)
      alert('Failed to unfulfill order: ' + (err.message || 'Unknown error'))
    } finally {
      setFulfillingId(null)
    }
  }

  const handleDelete = async (orderId) => {
    if (!window.confirm('Are you sure you want to completely delete this pending sales order?')) return
    try {
      await deleteOrder.mutateAsync(orderId)
    } catch (err) {
      console.error('Failed to delete order:', err)
      alert('Failed to delete order: ' + (err.message || 'Unknown error'))
    }
  }

  const openSaleOrderDetails = (order) => {
    setSelectedSaleOrder(order)
    setIsSaleOrderModalOpen(true)
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
        if (row.status !== 'Pending' && row.status !== 'Delivered') return null
        
        const isPending = row.status === 'Pending'
        const isLoading = fulfillingId === row.id
        const isDeleting = deleteOrder.isPending
        
        return (
          <div className="flex items-center gap-2">
            {isPending ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleFulfill(row.id)
                }}
                disabled={isLoading || isDeleting}
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
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleUnfulfill(row.id)
                }}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                  rounded-lg transition-all duration-200 cursor-pointer
                  bg-warning-500/10 text-warning-400 border border-warning-500/20
                  hover:bg-warning-500/20 hover:border-warning-500/40
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    Mark as Undelivered
                  </>
                )}
              </button>
            )}

            {isPending && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(row.id)
                }}
                disabled={isLoading || isDeleting}
                className="p-1.5 text-surface-400 hover:text-danger-400 hover:bg-danger-500/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete Order"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation()
                openSaleOrderDetails(row)
              }}
              className="p-1.5 text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 rounded transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
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
          New Order
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
      
      {/* --- SALES ORDER DETAILS MODAL --- */}
      <Modal
        isOpen={isSaleOrderModalOpen}
        onClose={() => setIsSaleOrderModalOpen(false)}
        title="Sales Order Details"
      >
        {selectedSaleOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 bg-surface-900/50 p-4 rounded-xl border border-surface-700/50">
              <div>
                <p className="text-xs text-surface-400 mb-1">Order Number</p>
                <p className="font-semibold text-surface-100 font-mono">#{String(selectedSaleOrder.id).padStart(4, '0')}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400 mb-1">Customer</p>
                <p className="font-semibold text-surface-100">{selectedSaleOrder.customers?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400 mb-1">Date</p>
                <p className="font-semibold text-surface-100">{new Date(selectedSaleOrder.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400 mb-1">Total Amount</p>
                <p className="font-semibold text-surface-100 tabular-nums">
                  Rs.{Number(selectedSaleOrder.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-surface-200 uppercase tracking-wider">Goods Sold</h3>
              <div className="space-y-2">
                {selectedSaleOrder.sales_order_items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-surface-800/50 border border-surface-700/50">
                    <div>
                      <p className="text-sm font-medium text-surface-100">
                        {item.products?.sku || 'Unknown Product'}
                      </p>
                      <p className="text-xs text-surface-400">
                        {item.products?.categories?.name} {item.products?.size ? `· ${item.products.size}` : ''} {item.products?.color ? `· ${item.products.color}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-surface-50 tabular-nums">
                        {item.quantity} {item.unit || 'PKT'}
                      </p>
                      <p className="text-xs text-surface-400 tabular-nums">
                        @ Rs.{Number(item.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
                {(!selectedSaleOrder.sales_order_items || selectedSaleOrder.sales_order_items.length === 0) && (
                  <p className="text-sm text-surface-400 py-4 text-center border border-dashed border-surface-700/50 rounded-lg">
                    No items found for this order.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default SalesDashboard
