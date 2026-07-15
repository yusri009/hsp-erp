import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  PackagePlus,
  Truck,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Package,
  Calendar,
  Receipt,
  Loader2,
} from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import { useVendors } from '../hooks/useVendors'
import { useCategories } from '../hooks/useCategories'
import { useCreatePurchaseOrder } from '../hooks/usePurchaseOrders'
import FilterDropdown from '../components/FilterDropdown'

function ReceiveStock() {
  const navigate = useNavigate()

  // Form state
  const [vendorId, setVendorId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceTotal, setInvoiceTotal] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [lineItems, setLineItems] = useState([{ categoryId: '', productId: '', quantity: '', unit_cost: '' }])
  const [submitStatus, setSubmitStatus] = useState(null) // null | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('')

  // Queries
  const { data: vendors, isLoading: vendorsLoading } = useVendors()
  const { data: products, isLoading: productsLoading } = useProducts()
  const { data: categories, isLoading: categoriesLoading } = useCategories()

  // Mutation
  const createPurchaseOrder = useCreatePurchaseOrder()

  // Build a lookup map for products by id
  const productMap = (products || []).reduce((acc, p) => {
    acc[p.id] = p
    return acc
  }, {})

  // Dropdown options
  const vendorOptions = (vendors || []).map((v) => ({
    value: v.id,
    label: `${v.name}${v.contact_number ? ` — ${v.contact_number}` : ''}`,
  }))

  const productOptions = (products || []).map((p) => ({
    value: p.id,
    label: `${p.sku} — ${p.size || ''} / ${p.color || ''}`.replace(/ — \/ $/, ''),
    categoryId: p.category_id,
  }))

  const categoryOptions = (categories || []).map((c) => ({
    value: c.id,
    label: c.name,
  }))

  // Line item handlers
  const addLineItem = () => {
    setLineItems((prev) => [...prev, { categoryId: '', productId: '', quantity: '', unit_cost: '' }])
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
        if (field === 'categoryId') {
          updated.productId = ''
        }
        return updated
      })
    )
  }

  // Summary calculations
  const totalPackets = lineItems.reduce(
    (sum, item) => sum + (parseInt(item.quantity, 10) || 0),
    0
  )

  const totalBundles = lineItems.reduce((sum, item) => {
    const qty = parseInt(item.quantity, 10) || 0
    const product = productMap[item.productId]
    const ppb = product?.packets_per_bundle || 1
    return sum + (qty / ppb)
  }, 0)

  const isFormValid =
    vendorId &&
    invoiceTotal &&
    dueDate &&
    lineItems.every((item) => item.productId && item.quantity && parseInt(item.quantity, 10) > 0 && item.unit_cost && parseFloat(item.unit_cost) >= 0)

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isFormValid) return

    setSubmitStatus(null)
    setErrorMessage('')

    try {
      await createPurchaseOrder.mutateAsync({
        vendorId,
        invoiceNumber,
        totalCost: parseFloat(invoiceTotal),
        dueDate,
        lineItems: lineItems.map((item) => ({
          productId: item.productId,
          quantity: parseInt(item.quantity, 10),
          unit_cost: parseFloat(item.unit_cost),
        })),
      })

      setSubmitStatus('success')

      // Reset form after a short delay
      setTimeout(() => {
        setVendorId('')
        setInvoiceNumber('')
        setInvoiceTotal('')
        setDueDate('')
        setLineItems([{ categoryId: '', productId: '', quantity: '', unit_cost: '' }])
        setSubmitStatus(null)
      }, 3000)
    } catch (err) {
      setSubmitStatus('error')
      setErrorMessage(err.message || 'Failed to record shipment')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/inventory')}
          className="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-700 transition-colors"
          aria-label="Back to Inventory"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-primary-400" />
            Receive Stock
          </h1>
          <p className="text-sm text-surface-400 mt-0.5">
            Record incoming factory shipments — quantities in <span className="font-semibold text-primary-400">Packets</span>
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {submitStatus === 'success' && (
        <div className="glass-card p-4 border-primary-500/30 flex items-center gap-3 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-primary-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-primary-300">Shipment recorded successfully!</p>
            <p className="text-xs text-surface-400 mt-0.5">Stock quantities have been updated.</p>
          </div>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="glass-card p-4 border-danger-500/30 flex items-center gap-3 animate-slide-up">
          <AlertCircle className="w-5 h-5 text-danger-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-danger-300">Failed to record shipment</p>
            <p className="text-xs text-surface-400 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vendor & Invoice Details */}
        <div className="glass-card p-5 sm:p-6 space-y-5 animate-slide-up">
          <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-4 h-4 text-surface-400" />
            Shipment Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Vendor Selection */}
            <FilterDropdown
              label="Vendor"
              value={vendorId}
              onChange={setVendorId}
              options={vendorOptions}
              placeholder="Select Vendor..."
              disabled={vendorsLoading}
            />

            {/* Invoice Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-2023-001"
                className="input-field"
              />
            </div>

            {/* Invoice Total */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
                Invoice Total
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-500 font-medium">Rs.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={invoiceTotal}
                  onChange={(e) => setInvoiceTotal(e.target.value)}
                  placeholder="0.00"
                  className="input-field pl-7"
                />
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div className="max-w-xs space-y-1.5">
            <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="glass-card p-5 sm:p-6 space-y-5 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-surface-400" />
              Products Received
            </h2>
            <button
              type="button"
              onClick={addLineItem}
              className="btn-secondary text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </button>
          </div>

          <div className="space-y-3">
            {lineItems.map((item, index) => {
              const filteredProducts = item.categoryId
                ? productOptions.filter(p => p.categoryId === item.categoryId)
                : productOptions

              return (
              <div
                key={index}
                className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-surface-900/50 border border-surface-700/50 animate-slide-up"
              >
                {/* Category Filter */}
                <div className="w-full sm:w-40 min-w-0">
                  <FilterDropdown
                    label={index === 0 ? 'Category' : undefined}
                    value={item.categoryId}
                    onChange={(val) => updateLineItem(index, 'categoryId', val)}
                    options={categoryOptions}
                    placeholder="Any Category"
                    disabled={categoriesLoading}
                  />
                </div>

                {/* Product Select */}
                <div className="flex-1 min-w-0">
                  <FilterDropdown
                    label={index === 0 ? 'Product' : undefined}
                    value={item.productId}
                    onChange={(val) => updateLineItem(index, 'productId', val)}
                    options={filteredProducts}
                    placeholder="Select product..."
                    disabled={productsLoading}
                  />
                </div>

                {/* Unit Cost */}
                <div className="w-full sm:w-32">
                  {index === 0 && (
                    <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider mb-1.5">
                      Unit Cost
                    </label>
                  )}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-500 font-medium">Rs.</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unit_cost}
                      onChange={(e) => updateLineItem(index, 'unit_cost', e.target.value)}
                      placeholder="0.00"
                      className="input-field pl-8"
                    />
                  </div>
                </div>

                {/* Quantity */}
                <div className="w-full sm:w-32">
                  {index === 0 && (
                    <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider mb-1.5">
                      Packets
                    </label>
                  )}
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                      placeholder="0"
                      className="input-field pr-12 tabular-nums"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded">
                      PKT
                    </span>
                  </div>
                  {item.quantity && item.productId && (
                    <p className="mt-1 text-[11px] text-surface-500 font-medium">
                      ≈ {(parseInt(item.quantity, 10) / (productMap[item.productId]?.packets_per_bundle || 1)).toFixed(1).replace(/\.0$/, '')} Bundles
                    </p>
                  )}
                </div>

                {/* Remove */}
                <div className={`flex items-end ${index === 0 ? 'sm:pb-0' : ''}`}>
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    disabled={lineItems.length <= 1}
                    className="btn-danger disabled:opacity-30 disabled:cursor-not-allowed h-[42px]"
                    aria-label="Remove line item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              )
            })}
          </div>
        </div>

        {/* Summary & Submit */}
        <div className="glass-card p-5 sm:p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-surface-500 uppercase tracking-wider">Total Packets</p>
                <p className="text-xl font-bold text-surface-50 tabular-nums">
                  {totalPackets} <span className="text-sm font-normal text-surface-400">pkt ({totalBundles.toFixed(1).replace(/\.0$/, '')} bdl)</span>
                </p>
              </div>
              <div className="w-px h-10 bg-surface-700" />
              <div>
                <p className="text-xs text-surface-500 uppercase tracking-wider">Invoice Total</p>
                <p className="text-xl font-bold text-surface-50 tabular-nums">
                  Rs.{invoiceTotal ? Number(invoiceTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isFormValid || createPurchaseOrder.isPending}
              className="btn-primary w-full sm:w-auto"
            >
              {createPurchaseOrder.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <PackagePlus className="w-4 h-4" />
                  Record Shipment
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ReceiveStock
