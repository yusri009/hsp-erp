import { useState } from 'react'
import {
  Building2,
  Plus,
  ArrowLeftRight,
  Wallet,
  Loader2,
  AlertCircle,
  IndianRupee,
  Hash,
  Scale
} from 'lucide-react'
import {
  useBankAccounts,
  useAddBankAccount,
  useUpdateBankAccount,
  useDeleteBankAccount,
  useTransferFunds,
  useAdjustBankAccountBalance
} from '../hooks/useBankAccounts'
import { Edit2, Trash2, Calculator } from 'lucide-react'

function BankAccounts() {
  const { data: accounts, isLoading } = useBankAccounts()
  
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustingAccount, setAdjustingAccount] = useState(null)

  const handleEdit = (account) => {
    setEditingAccount(account)
    setShowAccountModal(true)
  }

  const handleAdjust = (account) => {
    setAdjustingAccount(account)
    setShowAdjustModal(true)
  }

  const handleAdd = () => {
    setEditingAccount(null)
    setShowAccountModal(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-primary-400" />
            Banking & Capital
          </h1>
          <p className="text-sm text-surface-400 mt-0.5">
            Manage bank accounts, capital, and inter-account transfers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTransferModal(true)}
            disabled={!accounts || accounts.length < 2}
            className="btn-secondary"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Transfer Funds
          </button>
          <button
            onClick={handleAdd}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        </div>
      </div>

      {/* Account Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : accounts?.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-surface-100 mb-2">No Bank Accounts Found</h2>
          <p className="text-surface-400 mb-6 max-w-md text-sm">
            You haven't set up any bank accounts yet. Add your first account to start tracking capital and payments.
          </p>
          <button onClick={handleAdd} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc, index) => (
            <div
              key={acc.id}
              className="glass-card p-6 animate-slide-up hover:border-primary-500/30 transition-colors"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary-400" />
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleAdjust(acc)}
                    className="p-2 text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                    title="Adjust Balance"
                  >
                    <Scale className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleEdit(acc)}
                    className="p-2 text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                    title="Edit Account"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-surface-100">{acc.name}</h3>
              <p className="text-xs font-mono text-surface-400 mt-1 mb-4 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                {acc.account_number || 'No Account Number'}
              </p>
              <div className="pt-4 border-t border-surface-700/50">
                <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider mb-1">
                  Current Balance
                </p>
                <p className={`text-2xl font-bold tabular-nums ${acc.current_balance < 0 ? 'text-danger-400' : 'text-emerald-400'}`}>
                  Rs.{Number(acc.current_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showAccountModal && (
        <AccountModal 
          account={editingAccount} 
          onClose={() => setShowAccountModal(false)} 
        />
      )}
      {showTransferModal && (
        <TransferModal accounts={accounts} onClose={() => setShowTransferModal(false)} />
      )}
      {showAdjustModal && (
        <AdjustBalanceModal account={adjustingAccount} onClose={() => setShowAdjustModal(false)} />
      )}
    </div>
  )
}

function AccountModal({ account, onClose }) {
  const [name, setName] = useState(account?.name || '')
  const [accountNumber, setAccountNumber] = useState(account?.account_number || '')
  const [initialBalance, setInitialBalance] = useState('')
  const [error, setError] = useState('')

  const addAccount = useAddBankAccount()
  const updateAccount = useUpdateBankAccount()
  const deleteAccount = useDeleteBankAccount()

  const isEditing = !!account

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (isEditing) {
        await updateAccount.mutateAsync({ id: account.id, name, accountNumber })
      } else {
        await addAccount.mutateAsync({ name, accountNumber, initialBalance })
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save account')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this account? If this account has associated transactions, the deletion will fail.")) return
    
    setError('')
    try {
      await deleteAccount.mutateAsync(account.id)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to delete account (likely due to existing transactions).')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card p-6 sm:p-8 animate-modal-enter">
        <h2 className="text-xl font-bold text-surface-50 mb-6 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary-400" />
          {isEditing ? 'Edit Bank Account' : 'Add Bank Account'}
        </h2>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-danger-500/10 border border-danger-500/30 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-danger-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-danger-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
              Account Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. HDFC Current Account"
              className="input-field"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
              Account Number (Optional)
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="e.g. 502000XXXXXXX"
              className="input-field"
            />
          </div>

          {!isEditing && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5" />
                Initial Balance
              </label>
              <input
                type="number"
                step="0.01"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0.00"
                className="input-field"
                required
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-4 border-t border-surface-700/50 mt-6">
            <div>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteAccount.isPending}
                  className="btn-danger"
                >
                  {deleteAccount.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      Delete
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addAccount.isPending || updateAccount.isPending}
                className="btn-primary"
              >
                {addAccount.isPending || updateAccount.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  isEditing ? 'Save Changes' : 'Add Account'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function TransferModal({ accounts, onClose }) {
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const transfer = useTransferFunds()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (fromAccountId === toAccountId) {
      setError('Cannot transfer to the same account.')
      return
    }
    setError('')
    try {
      await transfer.mutateAsync({ fromAccountId, toAccountId, amount })
      onClose()
    } catch (err) {
      setError(err.message || 'Transfer failed')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card p-6 sm:p-8 animate-modal-enter">
        <h2 className="text-xl font-bold text-surface-50 mb-6 flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-primary-400" />
          Transfer Funds
        </h2>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-danger-500/10 border border-danger-500/30 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-danger-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-danger-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
              From Account
            </label>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="input-field"
              required
            >
              <option value="" disabled>Select source account...</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} (Rs.{a.current_balance})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
              To Account
            </label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="input-field"
              required
            >
              <option value="" disabled>Select destination account...</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} (Rs.{a.current_balance})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5" />
              Transfer Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="input-field"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-700/50 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={transfer.isPending || fromAccountId === toAccountId}
              className="btn-primary"
            >
              {transfer.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Confirm Transfer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AdjustBalanceModal({ account, onClose }) {
  const [newBalance, setNewBalance] = useState(account?.current_balance || '')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const adjustBalance = useAdjustBankAccountBalance()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (Number(newBalance) === Number(account.current_balance)) {
      onClose()
      return
    }
    try {
      await adjustBalance.mutateAsync({ 
        accountId: account.id, 
        newBalance: Number(newBalance), 
        reason 
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to adjust balance')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card p-6 sm:p-8 animate-modal-enter">
        <h2 className="text-xl font-bold text-surface-50 mb-6 flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary-400" />
          Adjust Balance: {account?.name}
        </h2>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-danger-500/10 border border-danger-500/30 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-danger-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-danger-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-surface-900/50 rounded-lg mb-4 flex justify-between items-center">
             <span className="text-xs text-surface-400 uppercase">Current Balance</span>
             <span className="text-sm font-semibold text-surface-200">Rs.{Number(account?.current_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5" />
              New Balance
            </label>
            <input
              type="number"
              step="0.01"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              placeholder="0.00"
              className="input-field"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
              Reason for Adjustment
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Bank charge correction"
              className="input-field"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-700/50 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adjustBalance.isPending}
              className="btn-primary"
            >
              {adjustBalance.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Save Adjustment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BankAccounts
