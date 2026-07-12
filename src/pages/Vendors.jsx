import { useState } from 'react'
import {
  Factory,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react'
import {
  useVendors,
  usePendingVendorCheques,
  useRecordVendorPayment,
  useClearVendorCheque,
  useAddVendor,
  useUpdateVendor,
  useDeleteVendor,
} from '../hooks/useVendors'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import FilterDropdown from '../components/FilterDropdown'

function Vendors() {
  // Queries
  const { data: vendors, isLoading: vendorsLoading } = useVendors()
  const { data: pendingCheques, isLoading: chequesLoading } = usePendingVendorCheques()

  // Mutations
  const recordPayment = useRecordVendorPayment()
  const clearCheque = useClearVendorCheque()
  const addVendor = useAddVendor()
  const updateVendor = useUpdateVendor()
  const deleteVendor = useDeleteVendor()

  // State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [editingVendor, setEditingVendor] = useState(null)

  // Payment Form State
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [chequeNumber, setChequeNumber] = useState('')
  const [paymentSubmitStatus, setPaymentSubmitStatus] = useState(null)
  const [paymentErrorMessage, setPaymentErrorMessage] = useState('')

  // Add Vendor Form State
  const [newVendorName, setNewVendorName] = useState('')
  const [newVendorContact, setNewVendorContact] = useState('')
  const [addSubmitStatus, setAddSubmitStatus] = useState(null)
  const [addErrorMessage, setAddErrorMessage] = useState('')

  // Pending Cheque State
  const [clearingId, setClearingId] = useState(null)

  // Handle Add/Edit Vendor Click
  const handleAddVendorClick = (vendor = null) => {
    setEditingVendor(vendor)
    setNewVendorName(vendor ? vendor.name : '')
    setNewVendorContact(vendor ? (vendor.contact_number || '') : '')
    setAddSubmitStatus(null)
    setAddErrorMessage('')
    setIsAddModalOpen(true)
  }

  // Handle Delete Vendor
  const handleDeleteVendor = async () => {
    if (!editingVendor) return
    if (!window.confirm('Are you sure you want to completely delete this vendor? This might affect their past transactions and purchases.')) return
    
    try {
      setAddSubmitStatus('loading')
      await deleteVendor.mutateAsync(editingVendor.id)
      setAddSubmitStatus('success')
      setTimeout(() => setIsAddModalOpen(false), 1000)
    } catch (err) {
      setAddErrorMessage(err.message || 'Failed to delete vendor')
      setAddSubmitStatus('error')
    }
  }

  // Handle Add Vendor Submit
  const handleAddVendorSubmit = async (e) => {
    e.preventDefault()

    if (!newVendorName.trim()) {
      setAddErrorMessage('Factory/Vendor name is required.')
      setAddSubmitStatus('error')
      return
    }

    setAddSubmitStatus('loading')
    setAddErrorMessage('')

    try {
      if (editingVendor) {
        await updateVendor.mutateAsync({
          id: editingVendor.id,
          name: newVendorName,
          contactNumber: newVendorContact,
        })
      } else {
        await addVendor.mutateAsync({
          name: newVendorName,
          contactNumber: newVendorContact,
        })
      }

      setAddSubmitStatus('success')
      setTimeout(() => {
        setIsAddModalOpen(false)
      }, 1000)
    } catch (err) {
      setAddSubmitStatus('error')
      setAddErrorMessage(err.message || 'Failed to save vendor')
    }
  }

  // Handle Issue Payment Click
  const handleIssuePayment = (vendor) => {
    setSelectedVendor(vendor)
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
        vendorId: selectedVendor.id,
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
        vendorId: transaction.vendor_id,
      })
    } catch (err) {
      console.error('Failed to clear cheque:', err)
    } finally {
      setClearingId(null)
    }
  }

  // Vendors Table Columns
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
      key: 'total_balance_owed',
      header: 'Balance Owed',
      sortable: true,
      render: (val) => (
        <span className="tabular-nums font-bold text-primary-400">
          Rs.{Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleIssuePayment(row)}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            <Banknote className="w-3.5 h-3.5" />
            Issue Payment
          </button>
          <button
            onClick={() => handleAddVendorClick(row)}
            className="p-1.5 text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 rounded transition-colors"
            title="Edit Vendor"
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
          <h1 className="text-2xl font-bold text-surface-50">Vendors</h1>
          <p className="text-sm text-surface-400 mt-0.5">
            Manage factories, accounts payable, and outgoing payments
          </p>
        </div>
        <button onClick={() => handleAddVendorClick()} className="btn-primary">
          <Plus className="w-4 h-4" />
          New Vendor
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
                    Uncleared Cheques ({pendingCheques.length})
                  </h2>
                  <p className="text-xs text-surface-400 mt-0.5">
                    Clear these cheques to reduce balances owed
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
                    {cheque.vendors?.name} <span className="text-surface-500 font-normal ml-1">#{cheque.cheque_number}</span>
                  </p>
                  <p className="text-xs text-surface-500">
                    {new Date(cheque.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-warning-400 tabular-nums">
                    Rs.{Number(cheque.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                        Mark Cleared
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vendors Data Table */}
      <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <DataTable
          columns={columns}
          data={vendors}
          isLoading={vendorsLoading}
          emptyMessage="No vendors found."
        />
      </div>

      {/* Issue Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => !recordPayment.isPending && setIsPaymentModalOpen(false)}
        title={`Issue Payment to: ${selectedVendor?.name}`}
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
                'Issue Payment'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Vendor Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => addSubmitStatus !== 'loading' && setIsAddModalOpen(false)}
        title={editingVendor ? "Edit Vendor" : "Add New Vendor"}
      >
        <form onSubmit={handleAddVendorSubmit} className="space-y-5">
          {/* Status Messages */}
          {addSubmitStatus === 'success' && (
            <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary-400 flex-shrink-0" />
              <p className="text-sm text-primary-300">Vendor saved successfully!</p>
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
                Factory / Vendor Name <span className="text-danger-400">*</span>
              </label>
              <input
                type="text"
                value={newVendorName}
                onChange={(e) => setNewVendorName(e.target.value)}
                placeholder="Enter vendor name..."
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
                value={newVendorContact}
                onChange={(e) => setNewVendorContact(e.target.value)}
                placeholder="Enter contact number..."
                className="input-field"
                disabled={addSubmitStatus === 'loading' || addSubmitStatus === 'success'}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-between gap-3 border-t border-surface-700/50 mt-2">
            <div>
              {editingVendor && (
                <button
                  type="button"
                  onClick={handleDeleteVendor}
                  className="btn-danger mt-4"
                  disabled={addSubmitStatus === 'loading' || addSubmitStatus === 'success'}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete Vendor
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
                  editingVendor ? 'Update Vendor' : 'Save Vendor'
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Vendors
