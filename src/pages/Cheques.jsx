import { useState } from 'react'
import {
  Banknote,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Undo2,
  Clock,
  AlertCircle
} from 'lucide-react'
import { useCheques, useClearCheque, useClearVendorCheque, useClearExpenseCheque, useUndoClearCheque } from '../hooks/useCheques'
import { useBankAccounts } from '../hooks/useBankAccounts'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

function Cheques() {
  const { data: allCheques, isLoading } = useCheques()
  const { data: bankAccounts } = useBankAccounts()

  const [activeTab, setActiveTab] = useState('All') // 'All' | 'Cleared' | 'Uncleared'
  const [selectedCheque, setSelectedCheque] = useState(null)
  const [accountId, setAccountId] = useState('')
  const [error, setError] = useState('')

  const clearCustomerCheque = useClearCheque()
  const clearVendorCheque = useClearVendorCheque()
  const clearExpenseCheque = useClearExpenseCheque()
  const undoClear = useUndoClearCheque()
  const [undoingId, setUndoingId] = useState(null)

  const cheques = allCheques || []
  
  const filteredCheques = cheques.filter(cheque => {
    if (activeTab === 'Cleared') return cheque.status === 'Cleared'
    if (activeTab === 'Uncleared') return cheque.status === 'Pending'
    return true
  })

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (val) => new Date(val).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      }),
    },
    {
      key: 'cheque_number',
      header: 'Cheque No.',
    },
    {
      key: 'entity',
      header: 'Entity',
      render: (_, row) => row.customers?.name || row.vendors?.name || row.expenses?.category || 'Unknown',
    },
    {
      key: 'type',
      header: 'Type',
      render: (val) => (
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
          val === 'Money In' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
        }`}>
          {val}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (val) => <span className="font-mono">Rs.{Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (val) => (
        <span className={`flex items-center gap-1.5 ${
          val === 'Cleared' ? 'text-emerald-400' : 'text-amber-400'
        }`}>
          {val === 'Cleared' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Clock className="w-4 h-4" />
          )}
          {val}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => {
        if (row.status === 'Pending') {
          return (
            <button
              onClick={() => setSelectedCheque(row)}
              className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1"
            >
              Clear Cheque
              <ArrowRight className="w-4 h-4" />
            </button>
          )
        }
        
        if (row.status === 'Cleared') {
          return (
            <button
              onClick={() => handleUndo(row)}
              disabled={undoingId === row.id}
              className="text-warning-400 hover:text-warning-300 text-sm font-medium flex items-center gap-1 disabled:opacity-50"
              title="Reverse Cleared Cheque"
            >
              {undoingId === row.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Undo2 className="w-4 h-4" />
              )}
              Undo
            </button>
          )
        }

        return null
      },
    },
  ]

  const handleUndo = async (cheque) => {
    if (!window.confirm(`Are you sure you want to reverse this cleared cheque for Rs.${Number(cheque.amount).toLocaleString('en-IN')}? This will update the balances and mark the cheque as Pending again.`)) {
      return
    }

    setUndoingId(cheque.id)
    try {
      await undoClear.mutateAsync({ transactionId: cheque.id })
    } catch (err) {
      alert(err.message || 'Failed to undo cheque')
    } finally {
      setUndoingId(null)
    }
  }

  const handleClearCheque = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!accountId) {
      setError('Please select a bank account.')
      return
    }

    try {
      if (selectedCheque.type === 'Money In') {
        await clearCustomerCheque.mutateAsync({
          transactionId: selectedCheque.id,
          customerId: selectedCheque.customer_id,
          accountId,
        })
      } else {
        if (selectedCheque.expense_id) {
          await clearExpenseCheque.mutateAsync({
            transactionId: selectedCheque.id,
            expenseId: selectedCheque.expense_id,
            accountId,
          })
        } else {
          await clearVendorCheque.mutateAsync({
            transactionId: selectedCheque.id,
            vendorId: selectedCheque.vendor_id,
            accountId,
          })
        }
      }
      setSelectedCheque(null)
      setAccountId('')
    } catch (err) {
      setError(err.message || 'Failed to clear cheque')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2.5">
            <Banknote className="w-6 h-6 text-primary-400" />
            Cheques Management
          </h1>
          <p className="text-sm text-surface-400 mt-0.5">
            Track and clear inbound and outbound cheques.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-700/50 pb-px">
        {['All', 'Uncleared', 'Cleared'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-surface-400 hover:text-surface-200 hover:border-surface-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="glass-card">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={filteredCheques} 
            emptyMessage={`No ${activeTab.toLowerCase()} cheques found.`}
          />
        )}
      </div>

      {/* Clear Cheque Modal */}
      <Modal
        isOpen={!!selectedCheque}
        onClose={() => {
          setSelectedCheque(null)
          setAccountId('')
          setError('')
        }}
        title="Clear Cheque"
        icon={Banknote}
      >
        <form onSubmit={handleClearCheque} className="space-y-4">
          <div className="p-3 bg-surface-900/50 rounded-lg mb-4 space-y-1">
             <div className="flex justify-between items-center text-sm">
               <span className="text-surface-400">Entity:</span>
               <span className="font-medium text-surface-200">{selectedCheque?.customers?.name || selectedCheque?.vendors?.name}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
               <span className="text-surface-400">Amount:</span>
               <span className="font-semibold text-surface-50">Rs.{Number(selectedCheque?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
             </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-danger-500/10 border border-danger-500/30 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-danger-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger-300">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
              Target Bank Account
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="input-field"
              required
            >
              <option value="" disabled>Select account...</option>
              {bankAccounts?.map(a => (
                <option key={a.id} value={a.id}>{a.name} (Rs.{a.current_balance})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setSelectedCheque(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={clearCustomerCheque.isPending || clearVendorCheque.isPending}
              className="btn-primary"
            >
              {(clearCustomerCheque.isPending || clearVendorCheque.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Mark as Cleared'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Cheques
