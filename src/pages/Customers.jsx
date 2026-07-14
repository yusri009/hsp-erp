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
  Edit2,
  Trash2,
} from 'lucide-react'
import { useCustomers, useRecordPayment, useAddCustomer, useUpdateCustomer, useDeleteCustomer } from '../hooks/useCustomers'
import { useBankAccounts } from '../hooks/useBankAccounts'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import FilterDropdown from '../components/FilterDropdown'

function Customers() {
  // Queries
  const { data: customers, isLoading: customersLoading } = useCustomers()
  const { data: bankAccounts } = useBankAccounts()

  // Mutations
  const recordPayment = useRecordPayment()
  const addCustomer = useAddCustomer()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()

  // State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [editingCustomer, setEditingCustomer] = useState(null)

  // Payment Form State
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [chequeNumber, setChequeNumber] = useState('')
  const [chequeDate, setChequeDate] = useState('')
  const [accountId, setAccountId] = useState('')
  const [paymentSubmitStatus, setPaymentSubmitStatus] = useState(null)
  const [paymentErrorMessage, setPaymentErrorMessage] = useState('')

  // Add Customer Form State
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerContact, setNewCustomerContact] = useState('')
  const [newCustomerCreditLimit, setNewCustomerCreditLimit] = useState('')
  const [addSubmitStatus, setAddSubmitStatus] = useState(null)
  const [addErrorMessage, setAddErrorMessage] = useState('')

  // Handle Add/Edit Customer Click
  const handleAddCustomerClick = (customer = null) => {
    setEditingCustomer(customer)
    setNewCustomerName(customer ? customer.name : '')
    setNewCustomerContact(customer ? (customer.contact_number || '') : '')
    setNewCustomerCreditLimit(customer ? (customer.credit_limit || '') : '')
    setAddSubmitStatus(null)
    setAddErrorMessage('')
    setIsAddModalOpen(true)
  }

  // Handle Delete Customer
  const handleDeleteCustomer = async () => {
    if (!editingCustomer) return
    if (!window.confirm('Are you sure you want to completely delete this customer? This might affect their past transactions and sales.')) return
    
    try {
      setAddSubmitStatus('loading')
      await deleteCustomer.mutateAsync(editingCustomer.id)
      setAddSubmitStatus('success')
      setTimeout(() => setIsAddModalOpen(false), 1000)
    } catch (err) {
      setAddErrorMessage(err.message || 'Failed to delete customer')
      setAddSubmitStatus('error')
    }
  }

  // Handle Add Customer Submit
  const handleAddCustomerSubmit = async (e) => {
    e.preventDefault()

    if (!newCustomerName.trim()) {
      setAddErrorMessage('Customer name is required.')
      setAddSubmitStatus('error')
      return
    }

    setAddSubmitStatus('loading')
    setAddErrorMessage('')

    try {
      if (editingCustomer) {
        await updateCustomer.mutateAsync({
          id: editingCustomer.id,
          name: newCustomerName,
          contactNumber: newCustomerContact,
          creditLimit: newCustomerCreditLimit,
        })
      } else {
        await addCustomer.mutateAsync({
          name: newCustomerName,
          contactNumber: newCustomerContact,
          creditLimit: newCustomerCreditLimit,
        })
      }

      setAddSubmitStatus('success')
      setTimeout(() => {
        setIsAddModalOpen(false)
      }, 1000)
    } catch (err) {
      setAddSubmitStatus('error')
      setAddErrorMessage(err.message || 'Failed to save customer')
    }
  }

  // Handle Receive Payment Click
  const handleReceivePayment = (customer) => {
    setSelectedCustomer(customer)
    setAmount(customer.balance_due) // Default to full amount
    setPaymentMethod('Cash')
    setChequeNumber('')
    setChequeDate('')
    setAccountId('')
    setPaymentSubmitStatus(null)
    setPaymentErrorMessage('')
    setIsPaymentModalOpen(true)
  }

  // Handle Payment Modal Submit
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

    if (!amount || Number(amount) <= 0) {
      setPaymentErrorMessage('Please enter a valid amount.')
      setPaymentSubmitStatus('error')
      return
    }

    if (!accountId) {
      setPaymentErrorMessage('Please select a bank account to receive into.')
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
          {val != null ? `Rs.${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
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
            Rs.{Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleReceivePayment(row)}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            <Banknote className="w-3.5 h-3.5" />
            Receive Payment
          </button>
          <button
            onClick={() => handleAddCustomerClick(row)}
            className="p-1.5 text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 rounded transition-colors"
            title="Edit Customer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
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
        <button onClick={() => handleAddCustomerClick()} className="btn-primary">
          <Plus className="w-4 h-4" />
          New Customer
        </button>
      </div>

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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-500 font-medium">Rs.</span>
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

            {/* Deposit To Account */}
            <div className="space-y-1.5 animate-fade-in">
              <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
                Deposit To <span className="text-danger-400">*</span>
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="input-field"
                disabled={recordPayment.isPending || paymentSubmitStatus === 'success'}
                required
              >
                <option value="" disabled>Select Bank Account</option>
                {bankAccounts?.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
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

      {/* Add/Edit Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => addSubmitStatus !== 'loading' && setIsAddModalOpen(false)}
        title={editingCustomer ? "Edit Customer" : "Add New Customer"}
      >
        <form onSubmit={handleAddCustomerSubmit} className="space-y-5">
          {/* Status Messages */}
          {addSubmitStatus === 'success' && (
            <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary-400 flex-shrink-0" />
              <p className="text-sm text-primary-300">Customer saved successfully!</p>
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
                disabled={addSubmitStatus === 'loading' || addSubmitStatus === 'success'}
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
                disabled={addSubmitStatus === 'loading' || addSubmitStatus === 'success'}
              />
            </div>

            {/* Credit Limit */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
                Credit Limit
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-500 font-medium">Rs.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newCustomerCreditLimit}
                  onChange={(e) => setNewCustomerCreditLimit(e.target.value)}
                  placeholder="0.00"
                  className="input-field pl-7"
                  disabled={addSubmitStatus === 'loading' || addSubmitStatus === 'success'}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-between gap-3 border-t border-surface-700/50 mt-2">
            <div>
              {editingCustomer && (
                <button
                  type="button"
                  onClick={handleDeleteCustomer}
                  className="btn-danger mt-4"
                  disabled={addSubmitStatus === 'loading' || addSubmitStatus === 'success'}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete Customer
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="btn-secondary mt-4"
                disabled={addSubmitStatus === 'loading' || addSubmitStatus === 'success'}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary min-w-[120px] mt-4"
                disabled={addSubmitStatus === 'loading' || addSubmitStatus === 'success'}
              >
                {addSubmitStatus === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingCustomer ? 'Update Customer' : 'Save Customer'
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Customers

