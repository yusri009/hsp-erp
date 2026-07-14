import { useState } from 'react'
import {
  Wallet,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Loader2,
  IndianRupee,
  ReceiptText,
  Banknote,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { useExpenses, useAddExpense, useDeleteExpense, usePayExpense } from '../hooks/useExpenses'
import { useBankAccounts } from '../hooks/useBankAccounts'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

const EXPENSE_CATEGORIES = [
  'Transport',
  'Maintenance',
  'Office',
  'Utilities',
  'Other',
]

function Expenses() {
  // Form state
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [submitError, setSubmitError] = useState('')

  // Queries & Mutations
  const { data: expenses, isLoading: expensesLoading } = useExpenses()
  const { data: bankAccounts } = useBankAccounts()
  const addExpense = useAddExpense()
  const deleteExpense = useDeleteExpense()
  const payExpense = usePayExpense()

  // Payment Form State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [chequeNumber, setChequeNumber] = useState('')
  const [chequeDate, setChequeDate] = useState('')
  const [accountId, setAccountId] = useState('')
  const [paymentSubmitStatus, setPaymentSubmitStatus] = useState(null)
  const [paymentErrorMessage, setPaymentErrorMessage] = useState('')

  const isFormValid = date && category && amount && Number(amount) > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isFormValid) return
    setSubmitError('')

    try {
      await addExpense.mutateAsync({ date, category, amount, description })
      // Reset form (keep date)
      setCategory('')
      setAmount('')
      setDescription('')
    } catch (err) {
      setSubmitError(err.message || 'Failed to add expense')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return
    try {
      await deleteExpense.mutateAsync(id)
    } catch (err) {
      alert('Failed to delete expense: ' + (err.message || 'Unknown error'))
    }
  }

  const handleIssuePayment = (expense) => {
    setSelectedExpense(expense)
    setPaymentMethod('Cash')
    setChequeNumber('')
    setChequeDate('')
    setAccountId('')
    setPaymentSubmitStatus(null)
    setPaymentErrorMessage('')
    setIsPaymentModalOpen(true)
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()

    if (paymentMethod === 'Cheque') {
      if (!chequeNumber.trim()) {
        setPaymentErrorMessage('Please enter a cheque number.')
        setPaymentSubmitStatus('error')
        return
      }
      if (!chequeDate) {
        setPaymentErrorMessage('Please select a cheque due date.')
        setPaymentSubmitStatus('error')
        return
      }
    }

    if (!accountId) {
      setPaymentErrorMessage('Please select a bank account to pay from.')
      setPaymentSubmitStatus('error')
      return
    }

    setPaymentSubmitStatus(null)
    setPaymentErrorMessage('')

    try {
      await payExpense.mutateAsync({
        expenseId: selectedExpense.id,
        paymentMethod,
        chequeNumber: paymentMethod === 'Cheque' ? chequeNumber : null,
        chequeDate: paymentMethod === 'Cheque' ? chequeDate : null,
        accountId: accountId,
      })

      setPaymentSubmitStatus('success')
      setTimeout(() => {
        setIsPaymentModalOpen(false)
      }, 1000)
    } catch (err) {
      setPaymentSubmitStatus('error')
      setPaymentErrorMessage(err.message || 'Failed to record payment')
    }
  }

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
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (val) => {
        const colors = {
          Transport: 'bg-blue-500/15 text-blue-400',
          Maintenance: 'bg-orange-500/15 text-orange-400',
          Office: 'bg-purple-500/15 text-purple-400',
          Utilities: 'bg-cyan-500/15 text-cyan-400',
          Other: 'bg-surface-500/15 text-surface-300',
        }
        return (
          <span className={`badge text-xs ${colors[val] || colors.Other}`}>
            {val || '—'}
          </span>
        )
      },
    },
    {
      key: 'description',
      header: 'Description',
      sortable: false,
      render: (val) => (
        <span className="text-surface-300 text-sm">{val || '—'}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (val) => (
        <span className="tabular-nums font-semibold text-danger-400">
          {val != null ? `Rs.${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (val) => (
        <span className={`flex items-center gap-1.5 ${
          val === 'Paid' ? 'text-emerald-400' : 'text-amber-400'
        }`}>
          {val === 'Paid' ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <Clock className="w-3.5 h-3.5" />
          )}
          {val || 'Pending'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2 justify-end">
          {(!row.status || row.status === 'Pending') && (
            <button
              onClick={() => handleIssuePayment(row)}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              <Banknote className="w-3.5 h-3.5" />
              Pay
            </button>
          )}
          <button
            onClick={() => handleDelete(row.id)}
            disabled={deleteExpense.isPending}
            className="p-1.5 text-surface-400 hover:text-danger-400 hover:bg-danger-500/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete Expense"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2.5">
          <Wallet className="w-6 h-6 text-primary-400" />
          Expenses
        </h1>
        <p className="text-sm text-surface-400 mt-0.5">
          Track operational expenditures — transport, maintenance, utilities, and more
        </p>
      </div>

      {/* Add Expense Form */}
      <div className="glass-card p-5 sm:p-6 animate-slide-up">
        <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider flex items-center gap-2 mb-5">
          <ReceiptText className="w-4 h-4 text-surface-400" />
          Record Expense
        </h2>

        {submitError && (
          <div className="mb-4 p-3 rounded-lg bg-danger-500/10 border border-danger-500/30 flex items-center gap-3 animate-slide-up">
            <AlertCircle className="w-4 h-4 text-danger-400 flex-shrink-0" />
            <p className="text-sm text-danger-300">{submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
                required
              >
                <option value="" disabled>Select category...</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5" />
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-500 font-medium">Rs.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="input-field pl-8"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
                className="input-field"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!isFormValid || addExpense.isPending}
            className="btn-primary"
          >
            {addExpense.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Expense
              </>
            )}
          </button>
        </form>
      </div>

      {/* Expenses Table */}
      <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <DataTable
          columns={columns}
          data={expenses}
          isLoading={expensesLoading}
          emptyMessage="No expenses recorded yet — add your first one above!"
        />
      </div>

      {/* Issue Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => !payExpense.isPending && setIsPaymentModalOpen(false)}
        title={`Pay Expense: ${selectedExpense?.category}`}
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-5">
          {/* Status Messages */}
          {paymentSubmitStatus === 'success' && (
            <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary-400 flex-shrink-0" />
              <p className="text-sm text-primary-300">Payment recorded successfully!</p>
            </div>
          )}
          {paymentSubmitStatus === 'error' && (
            <div className="p-3 rounded-lg bg-danger-500/10 border border-danger-500/20 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-danger-400 flex-shrink-0" />
              <p className="text-sm text-danger-300">{paymentErrorMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-300">Amount</label>
              <div className="text-xl font-semibold text-surface-50">
                Rs.{Number(selectedExpense?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-300">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="input-field w-full"
                required
              >
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Online">Online Transfer</option>
              </select>
            </div>

            {paymentMethod === 'Cheque' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-surface-300">Cheque Number</label>
                  <input
                    type="text"
                    value={chequeNumber}
                    onChange={(e) => setChequeNumber(e.target.value)}
                    placeholder="Enter cheque number"
                    className="input-field w-full"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-surface-300">Cheque Date</label>
                  <input
                    type="date"
                    value={chequeDate}
                    onChange={(e) => setChequeDate(e.target.value)}
                    className="input-field w-full"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-300">Bank Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="input-field w-full"
                required
              >
                <option value="" disabled>Select account to pay from...</option>
                {bankAccounts?.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (Balance: Rs.{Number(acc.current_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="btn-secondary"
              disabled={payExpense.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={payExpense.isPending || paymentSubmitStatus === 'success'}
              className="btn-primary"
            >
              {payExpense.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording...
                </>
              ) : (
                'Record Payment'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Expenses
