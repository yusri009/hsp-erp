import { useState } from 'react'
import {
  Users,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ArrowRight,
  Plus,
} from 'lucide-react'
import { useCustomers, usePendingCheques, useRecordPayment, useClearCheque, useAddCustomer } from '../hooks/useCustomers'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import FilterDropdown from '../components/FilterDropdown'

function Customers() {
  // Queries
  const { data: customers, isLoading: customersLoading } = useCustomers()
  const { data: pendingCheques, isLoading: chequesLoading } = usePendingCheques()
  
  // Mutations
  const recordPayment = useRecordPayment()
  const clearCheque = useClearCheque()
  const addCustomer = useAddCustomer()

  // State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  
  // Payment Form State
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [chequeNumber, setChequeNumber] = useState('')
  const [paymentSubmitStatus, setPaymentSubmitStatus] = useState(null)
  const [paymentErrorMessage, setPaymentErrorMessage] = useState('')

  // Add Customer Form State
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerContact, setNewCustomerContact] = useState('')
  const [newCustomerCreditLimit, setNewCustomerCreditLimit] = useState('')
  const [addSubmitStatus, setAddSubmitStatus] = useState(null)
  const [addErrorMessage, setAddErrorMessage] = useState('')
  
  // Pending Cheque State
  const [clearingId, setClearingId] = useState(null)

  // Handle Add Customer Click
  const handleAddCustomerClick = () => {
    setNewCustomerName('')
    setNewCustomerContact('')
    setNewCustomerCreditLimit('')
    setAddSubmitStatus(null)
    setAddErrorMessage('')
    setIsAddModalOpen(true)
  }

  // Handle Add Customer Submit
  const handleAddCustomerSubmit = async (e) => {
    e.preventDefault()

    if (!newCustomerName.trim()) {
      setAddErrorMessage('Customer name is required.')
      setAddSubmitStatus('error')
      return
    }

    setAddSubmitStatus(null)
    setAddErrorMessage('')

    try {
      await addCustomer.mutateAsync({
        name: newCustomerName,
        contactNumber: newCustomerContact,
        creditLimit: newCustomerCreditLimit,
      })

      setAddSubmitStatus('success')
      setTimeout(() => {
        setIsAddModalOpen(false)
      }, 1000)
    } catch (err) {
      setAddSubmitStatus('error')
      setAddErrorMessage(err.message || 'Failed to add customer')
    }
  }

  // Handle Receive Payment Click
  const handleReceivePayment = (customer) => {
    setSelectedCustomer(customer)
    setAmount('')
    setPaymentMethod('Cash')
    setChequeNumber('')
    setPaymentSubmitStatus(null)
    setPaymentErrorMessage('')
    setIsPaymentModalOpen(true)
  }

  // Handle Payment Modal Submit
  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    
    if (!amount || Number(amount) <= 0) {
      setPaymentErrorMessage('Please enter a valid amount.')
      setPaymentSubmitStatus('error')
      return
    }

    if (paymentMethod === 'Cheque' && !chequeNumber.trim()) {
      setPaymentErrorMessage('Please enter a cheque number.')
      setPaymentSubmitStatus('error')
      return
    }

    setPaymentSubmitStatus(null)
    setPaymentErrorMessage('')

    try {
      await recordPayment.mutateAsync({
        customerId: selectedCustomer.id,
        amount: Number(amount),
        paymentMethod,
        chequeNumber: paymentMethod === 'Cheque' ? chequeNumber : null,
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

  // Handle Clear Cheque
  const handleClearCheque = async (transaction) => {
    setClearingId(transaction.id)
    try {
      await clearCheque.mutateAsync({
        transactionId: transaction.id,
        customerId: transaction.customer_id,
      })
    } catch (err) {
      console.error('Failed to clear cheque:', err)
      // Could show a toast here
    } finally {
      setClearingId(null)
    }
  }

  // Customers Table Columns
  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (val) => <span className="font-medium text-surface-50">{val}</span>,
    },
    {
      key: 'contact_number',
      header: 'Contact',
      sortable: true,
      render: (val) => <span className="text-surface-300">{val || '—'}</span>,
    },
    {
      key: 'credit_limit',
      header: 'Credit Limit',
      sortable: true,
      render: (val) => (
        <span className="tabular-nums text-surface-300">
          {val != null ? `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
        </span>
      ),
    },
    {
      key: 'balance_due',
      header: 'Balance Due',
      sortable: true,
      render: (val, row) => {
        if (val == null) return '—'
        const isOverLimit = row.credit_limit != null && val > row.credit_limit
        return (
          <span className={`tabular-nums font-bold ${isOverLimit ? 'text-danger-400' : 'text-primary-400'}`}>
            ₹{Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (_, row) => (
        <button
          onClick={() => handleReceivePayment(row)}
          className="btn-secondary text-xs py-1.5 px-3"
        >
          <Banknote className="w-3.5 h-3.5" />
          Receive Payment
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Customers</h1>
          <p className="text-sm text-surface-400 mt-0.5">
            Manage customer accounts and receive payments
          </p>
        </div>
        <button onClick={handleAddCustomerClick} className="btn-primary">
          <Plus className="w-4 h-4" />
          New Customer
        </button>
      </div>

      {/* Pending Cheques Widget */}
      {!chequesLoading && pendingCheques?.length > 0 && (
        <div className="glass-card border-warning-500/20 overflow-hidden animate-slide-up">
          <div className="p-4 sm:p-5 border-b border-surface-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning-500/10">
                  <Clock className="w-5 h-5 text-warning-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-warning-300">
                    Pending Cheques ({pendingCheques.length})
                  </h2>
                  <p className="text-xs text-surface-400 mt-0.5">
                    Clear these cheques to update customer balances
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="divide-y divide-surface-700/30">
            {pendingCheques.map((cheque) => (
              <div
                key={cheque.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-5 py-3 hover:bg-surface-800/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-200">
                    {cheque.customers?.name} <span className="text-surface-500 font-normal ml-1">#{cheque.cheque_number}</span>
                  </p>
                  <p className="text-xs text-surface-500">
                    {new Date(cheque.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-warning-400 tabular-nums">
                    ₹{Number(cheque.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <button
                    onClick={() => handleClearCheque(cheque)}
                    disabled={clearingId === cheque.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {clearingId === cheque.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Clear Cheque
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customers Data Table */}
      <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <DataTable
          columns={columns}
          data={customers}
          isLoading={customersLoading}
          emptyMessage="No customers found."
        />
      </div>

      {/* Receive Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => !recordPayment.isPending && setIsPaymentModalOpen(false)}
        title={`Receive Payment: ${selectedCustomer?.name}`}
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
            {/* Amount */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-500 font-medium">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="input-field pl-7"
                  disabled={recordPayment.isPending || paymentSubmitStatus === 'success'}
                  autoFocus
                />
              </div>
            </div>

            {/* Payment Method */}
            <FilterDropdown
              label="Payment Method"
              value={paymentMethod}
              onChange={(val) => setPaymentMethod(val)}
              options={[
                { value: 'Cash', label: 'Cash' },
                { value: 'Cheque', label: 'Cheque' },
              ]}
              placeholder=""
              disabled={recordPayment.isPending || paymentSubmitStatus === 'success'}
            />

            {/* Cheque Number (Conditional) */}
            {paymentMethod === 'Cheque' && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Cheque Number
                </label>
                <input
                  type="text"
                  value={chequeNumber}
                  onChange={(e) => setChequeNumber(e.target.value)}
                  placeholder="Enter cheque number..."
                  className="input-field"
                  disabled={recordPayment.isPending || paymentSubmitStatus === 'success'}
                />
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="btn-secondary"
              disabled={recordPayment.isPending || paymentSubmitStatus === 'success'}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary min-w-[120px]"
              disabled={recordPayment.isPending || paymentSubmitStatus === 'success'}
            >
              {recordPayment.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Payment'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !addCustomer.isPending && setIsAddModalOpen(false)}
        title="Add New Customer"
      >
        <form onSubmit={handleAddCustomerSubmit} className="space-y-5">
          {/* Status Messages */}
          {addSubmitStatus === 'success' && (
            <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary-400 flex-shrink-0" />
              <p className="text-sm text-primary-300">Customer added successfully!</p>
            </div>
          )}
          {addSubmitStatus === 'error' && (
            <div className="p-3 rounded-lg bg-danger-500/10 border border-danger-500/20 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-danger-400 flex-shrink-0" />
              <p className="text-sm text-danger-300">{addErrorMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
                Name <span className="text-danger-400">*</span>
              </label>
              <input
                type="text"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Enter customer name..."
                className="input-field"
                disabled={addCustomer.isPending || addSubmitStatus === 'success'}
                autoFocus
              />
            </div>

            {/* Contact Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
                Contact Number
              </label>
              <input
                type="text"
                value={newCustomerContact}
                onChange={(e) => setNewCustomerContact(e.target.value)}
                placeholder="Enter contact number..."
                className="input-field"
                disabled={addCustomer.isPending || addSubmitStatus === 'success'}
              />
            </div>

            {/* Credit Limit */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
                Credit Limit
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-500 font-medium">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newCustomerCreditLimit}
                  onChange={(e) => setNewCustomerCreditLimit(e.target.value)}
                  placeholder="0.00"
                  className="input-field pl-7"
                  disabled={addCustomer.isPending || addSubmitStatus === 'success'}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="btn-secondary"
              disabled={addCustomer.isPending || addSubmitStatus === 'success'}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary min-w-[120px]"
              disabled={addCustomer.isPending || addSubmitStatus === 'success'}
            >
              {addCustomer.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Customer'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Customers

