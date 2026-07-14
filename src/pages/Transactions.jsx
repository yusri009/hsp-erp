import { useState, useMemo } from 'react'
import {
  ListOrdered,
  ArrowRightLeft,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Filter
} from 'lucide-react'
import { useTransactions } from '../hooks/useTransactions'
import DataTable from '../components/DataTable'

function Transactions() {
  const { data: transactions, isLoading } = useTransactions()

  // Filters
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const filteredTransactions = useMemo(() => {
    if (!transactions) return []
    return transactions.filter(tx => {
      if (typeFilter !== 'All' && tx.type !== typeFilter) return false
      if (statusFilter !== 'All' && tx.status !== statusFilter) return false
      return true
    })
  }, [transactions, typeFilter, statusFilter])

  const columns = [
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
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (val) => {
        if (val === 'Money In') {
          return (
            <span className="badge bg-emerald-500/15 text-emerald-400">
              <ArrowDownRight className="w-3 h-3 mr-1" />
              In
            </span>
          )
        }
        if (val === 'Money Out') {
          return (
            <span className="badge bg-danger-500/15 text-danger-400">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              Out
            </span>
          )
        }
        return (
          <span className="badge bg-blue-500/15 text-blue-400">
            <ArrowRightLeft className="w-3 h-3 mr-1" />
            Transfer
          </span>
        )
      },
    },
    {
      key: 'entity',
      header: 'Entity',
      render: (_, row) => {
        if (row.type === 'Transfer') return 'Internal Transfer'
        return row.customers?.name || row.vendors?.name || row.expenses?.category || '—'
      },
    },
    {
      key: 'account',
      header: 'Account',
      render: (_, row) => row.bank_accounts?.name || '—',
    },
    {
      key: 'payment_method',
      header: 'Payment Info',
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="text-surface-200">{val || '—'}</span>
          {row.cheque_number && (
            <span className="text-xs text-surface-400">Chq: {row.cheque_number}</span>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (val, row) => {
        const isPositive = row.type === 'Money In'
        const isTransfer = row.type === 'Transfer'
        const color = isTransfer ? 'text-blue-400' : (isPositive ? 'text-emerald-400' : 'text-danger-400')
        const prefix = isTransfer ? '' : (isPositive ? '+' : '-')
        
        return (
          <span className={`tabular-nums font-semibold ${color}`}>
            {prefix}Rs.{Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (val) => (
        <span className={`flex items-center gap-1.5 ${
          val === 'Cleared' ? 'text-emerald-400' : 'text-amber-400'
        }`}>
          {val === 'Cleared' ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <Clock className="w-3.5 h-3.5" />
          )}
          {val || 'Pending'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2.5">
          <ListOrdered className="w-6 h-6 text-primary-400" />
          Transactions
        </h1>
        <p className="text-sm text-surface-400 mt-0.5">
          View and filter all financial transactions across your accounts
        </p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-4 animate-slide-up">
        <div className="flex items-center gap-2 text-surface-300">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field py-1.5 text-sm min-w-[140px]"
          >
            <option value="All">All Types</option>
            <option value="Money In">Money In</option>
            <option value="Money Out">Money Out</option>
            <option value="Transfer">Transfer</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field py-1.5 text-sm min-w-[140px]"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Cleared">Cleared</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <DataTable
          columns={columns}
          data={filteredTransactions}
          isLoading={isLoading}
          emptyMessage="No transactions match your filters."
        />
      </div>
    </div>
  )
}

export default Transactions
