import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router'
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Trash2,
  Package,
  Users,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Receipt,
  RotateCcw,
} from 'lucide-react'

const DRAFT_KEY = 'draft_new_sale'
const EMPTY_LINE = { categoryId: '', productId: '', quantity: '', unit: 'PKT', unitPrice: 0 }

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
import { useProducts } from '../hooks/useProducts'
import { useCustomers } from '../hooks/useCustomers'
import { useCategories } from '../hooks/useCategories'
import { useCreateSalesOrder } from '../hooks/useSalesOrders'
import FilterDropdown from '../components/FilterDropdown'

function NewSale() {
  const navigate = useNavigate()

  // Form state — initialised from localStorage draft if one exists
  const [customerId, setCustomerId] = useState(() => loadDraft()?.customerId ?? '')
  const [lineItems, setLineItems] = useState(() => loadDraft()?.lineItems ?? [EMPTY_LINE])
  const [submitStatus, setSubmitStatus] = useState(null) // null | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('')
  const [hasDraft, setHasDraft] = useState(() => !!localStorage.getItem(DRAFT_KEY))

  // Queries
  const { data: customers, isLoading: customersLoading } = useCustomers()
  const { data: products, isLoading: productsLoading } = useProducts()
  const { data: categories, isLoading: categoriesLoading } = useCategories()
  const createSalesOrder = useCreateSalesOrder()

  // Build a lookup map for products by id
  const productMap = useMemo(() => {
    const map = {}
      ; (products || []).forEach((p) => { map[p.id] = p })
    return map
  }, [products])

  // Dropdown options
  const customerOptions = useMemo(
    () => (customers || []).map((c) => ({
      value: c.id,
      label: c.name,
    })),
    [customers]
  )

  const productOptions = useMemo(
    () => (products || []).map((p) => ({
      value: p.id,
      label: [p.sku, p.size, p.color].filter(Boolean).join(' — '),
      categoryId: p.category_id,
    })),
    [products]
  )

  const categoryOptions = useMemo(
    () => (categories || []).map((c) => ({
      value: c.id,
      label: c.name,
    })),
    [categories]
  )

  // Auto-save draft to localStorage whenever form state changes
  useEffect(() => {
    const draft = { customerId, lineItems }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    setHasDraft(true)
  }, [customerId, lineItems])

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setCustomerId('')
    setLineItems([EMPTY_LINE])
    setHasDraft(false)
  }

  // Line item handlers
  const addLineItem = () => {
    setLineItems((prev) => [...prev, { ...EMPTY_LINE }])
  }

  const removeLineItem = (index) => {
    if (lineItems.length <= 1) return
    setLineItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updateLineItem = (index, field, value) => {
    setLineItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        const updated = { ...item, [field]: value }
        
        // Clear product if category changes
        if (field === 'categoryId') {
          updated.productId = ''
          updated.unitPrice = 0
        }

        // Auto-fill unit price when product is selected
        if (field === 'productId' && value) {
          const product = productMap[value]
          if (product) {
            updated.unitPrice = product.selling_price || 0
          }
        }
        return updated
      })
    )
  }

  // Calculations
  const getLineTotal = (item) => {
    const qty = parseFloat(item.quantity) || 0
    return qty * (item.unitPrice || 0)
  }

  const grandTotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + getLineTotal(item), 0),
    [lineItems, productMap]
  )

  const totalPackets = lineItems.reduce(
    (sum, item) => sum + (parseFloat(item.quantity) || 0),
    0
  )

  const totalBundles = lineItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0
    const product = item.productId ? productMap[item.productId] : null
    const ppb = product?.packets_per_bundle || 1
    return sum + (qty / ppb)
  }, 0)

  // Validation
  const isFormValid =
    customerId &&
    lineItems.length > 0 &&
    lineItems.every(
      (item) => item.productId && item.quantity && parseFloat(item.quantity) > 0
    )

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isFormValid) return

    setSubmitStatus(null)
    setErrorMessage('')

    try {
      await createSalesOrder.mutateAsync({
        customerId,
        totalAmount: grandTotal,
        lineItems: lineItems.map((item) => ({
          productId: item.productId,
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          unitPrice: item.unitPrice,
        })),
      })

      // Clear draft on success
      localStorage.removeItem(DRAFT_KEY)
      setHasDraft(false)
      setSubmitStatus('success')
      setTimeout(() => navigate('/sales'), 1500)
    } catch (err) {
      setSubmitStatus('error')
      setErrorMessage(err.message || 'Failed to create sales order')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/sales')}
          className="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-700 transition-colors"
          aria-label="Back to Sales"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2.5">
              <ShoppingCart className="w-6 h-6 text-primary-400" />
              New Order
            </h1>
            {hasDraft && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Draft saved
              </span>
            )}
          </div>
          <p className="text-sm text-surface-400 mt-0.5">
            Quick order entry — quantities in <span className="font-semibold text-primary-400">Packets</span>
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {submitStatus === 'success' && (
        <div className="glass-card p-4 border-primary-500/30 flex items-center gap-3 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-primary-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-primary-300">Order created successfully!</p>
            <p className="text-xs text-surface-400 mt-0.5">Redirecting to sales dashboard...</p>
          </div>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="glass-card p-4 border-danger-500/30 flex items-center gap-3 animate-slide-up">
          <AlertCircle className="w-5 h-5 text-danger-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-danger-300">Failed to create order</p>
            <p className="text-xs text-surface-400 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div className="glass-card p-5 sm:p-6 space-y-5 animate-slide-up">
          <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-surface-400" />
            Customer
          </h2>

          <div className="max-w-md">
            <FilterDropdown
              label="Select Customer"
              value={customerId}
              onChange={setCustomerId}
              options={customerOptions}
              placeholder="Select customer..."
              disabled={customersLoading}
            />
            {customerId && customers && (
              <div className="mt-2 text-xs text-surface-500">
                {(() => {
                  const customer = customers.find((c) => c.id === customerId)
                  if (!customer) return null
                  return (
                    <span>
                      Balance Due:{' '}
                      <span className={`font-semibold ${customer.balance_due > 0 ? 'text-warning-400' : 'text-primary-400'}`}>
                        Rs.{Number(customer.balance_due || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </span>
                  )
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="glass-card p-5 sm:p-6 space-y-5 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-surface-400" />
              Order Items
            </h2>
          </div>

          {/* Column Headers (desktop) */}
          <div className="hidden sm:grid sm:grid-cols-[160px_1fr_120px_140px_40px] gap-3 px-4 text-xs font-medium text-surface-500 uppercase tracking-wider">
            <span>Category</span>
            <span>Product</span>
            <span>Packets</span>
            <span>Line Total</span>
            <span></span>
          </div>

          <div className="space-y-3">
            {lineItems.map((item, index) => {
              const lineTotal = getLineTotal(item)
              const selectedProduct = item.productId ? productMap[item.productId] : null
              const filteredProducts = item.categoryId 
                ? productOptions.filter(p => p.categoryId === item.categoryId)
                : productOptions

              return (
                <div
                  key={index}
                  className="flex flex-col sm:grid sm:grid-cols-[160px_1fr_120px_140px_40px] gap-3 p-4 rounded-xl bg-surface-900/50 border border-surface-700/50 animate-slide-up"
                >
                  {/* Category Select */}
                  <div className="min-w-0">
                    <label className="sm:hidden block text-xs font-medium text-surface-400 uppercase tracking-wider mb-1.5">
                      Category
                    </label>
                    <FilterDropdown
                      value={item.categoryId}
                      onChange={(val) => updateLineItem(index, 'categoryId', val)}
                      options={categoryOptions}
                      placeholder="Any Category"
                      disabled={categoriesLoading}
                    />
                  </div>
                  {/* Product Select */}
                  <div className="min-w-0">
                    <label className="sm:hidden block text-xs font-medium text-surface-400 uppercase tracking-wider mb-1.5">
                      Product
                    </label>
                    <FilterDropdown
                      value={item.productId}
                      onChange={(val) => updateLineItem(index, 'productId', val)}
                      options={filteredProducts}
                      placeholder="Select product..."
                      disabled={productsLoading}
                    />
                    {selectedProduct && (
                      <p className="mt-1 text-[11px] text-surface-500">
                        Rs.{Number(selectedProduct.selling_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}/pkt
                        {' · '}
                        {selectedProduct.stock_quantity ?? 0} Pkt ({((selectedProduct.stock_quantity || 0) / (selectedProduct.packets_per_bundle || 1)).toFixed(1).replace(/\.0$/, '')} Bdl) in stock
                      </p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="w-full sm:w-40 flex flex-col justify-end">
                    <label className="sm:hidden block text-xs font-medium text-surface-400 uppercase tracking-wider mb-1.5">
                      Quantity
                    </label>
                    <div className="flex bg-surface-900 border border-surface-700/50 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500/50 focus-within:border-primary-500 transition-all h-[42px]">
                      <input
                        type="number"
                        step="any"
                        min="0.001"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                        placeholder="0"
                        className="w-full bg-transparent text-surface-200 placeholder-surface-500 px-3 py-2 outline-none text-sm tabular-nums"
                      />
                      <select
                        value={item.unit}
                        onChange={(e) => updateLineItem(index, 'unit', e.target.value)}
                        className="bg-surface-800 text-surface-300 text-xs font-medium px-2 py-2 border-l border-surface-700/50 outline-none focus:ring-0 cursor-pointer hover:text-surface-100"
                      >
                        <option value="PKT">PKT</option>
                        <option value="KG">KG</option>
                      </select>
                    </div>
                    {item.quantity && selectedProduct && item.unit === 'PKT' && (
                      <p className="mt-1 text-[11px] text-surface-500 font-medium">
                        ≈ {(parseFloat(item.quantity) / (selectedProduct.packets_per_bundle || 1)).toFixed(1).replace(/\.0$/, '')} Bundles
                      </p>
                    )}
                  </div>

                  {/* Line Total (read-only) */}
                  <div>
                    <label className="sm:hidden block text-xs font-medium text-surface-400 uppercase tracking-wider mb-1.5">
                      Line Total
                    </label>
                    <div className="input-field bg-surface-800/50 flex items-center tabular-nums font-semibold text-surface-100 cursor-default">
                      Rs.{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Remove */}
                  <div className="flex items-start sm:items-center justify-end sm:justify-center">
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length <= 1}
                      className="btn-danger h-[42px] disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Remove line item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
            
            <button
              type="button"
              onClick={addLineItem}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-surface-700 text-surface-400 hover:text-primary-400 hover:border-primary-500/50 hover:bg-primary-500/5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Another Product</span>
            </button>
          </div>
        </div>

        {/* Grand Total & Submit */}
        <div className="glass-card p-5 sm:p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-surface-500 uppercase tracking-wider">Items</p>
                <p className="text-xl font-bold text-surface-50 tabular-nums">
                  {lineItems.filter((i) => i.productId).length}
                </p>
              </div>
              <div className="w-px h-10 bg-surface-700" />
              <div>
                <p className="text-xs text-surface-500 uppercase tracking-wider">Total Packets</p>
                <p className="text-xl font-bold text-surface-50 tabular-nums">
                  {totalPackets} <span className="text-sm font-normal text-surface-400">pkt ({totalBundles.toFixed(1).replace(/\.0$/, '')} bdl)</span>
                </p>
              </div>
              <div className="w-px h-10 bg-surface-700" />
              <div>
                <p className="text-xs text-surface-500 uppercase tracking-wider">Grand Total</p>
                <p className="text-2xl font-bold text-primary-400 tabular-nums">
                  Rs.{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {hasDraft && (
                <button
                  type="button"
                  onClick={clearDraft}
                  className="flex items-center gap-1.5 text-xs text-surface-500 hover:text-danger-400 transition-colors"
                  title="Clear draft and reset form"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear Draft
                </button>
              )}
              <button
                type="submit"
                disabled={!isFormValid || createSalesOrder.isPending}
                className="btn-primary flex-1 sm:flex-none text-base px-6 py-3"
              >
                {createSalesOrder.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4" />
                    Save Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default NewSale
