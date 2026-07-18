import { useState } from 'react'
import { Plus, CheckCircle2, AlertCircle, Loader2, Sparkles, Edit2, Trash2 } from 'lucide-react'
import DataTable from '../components/DataTable'
import FilterDropdown from '../components/FilterDropdown'
import Modal from '../components/Modal'
import {
  useProducts,
  useProductSizes,
  useProductColors,
  useAddProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '../hooks/useProducts'
import { useCategories, useAddCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories'
import { usePurchaseOrders, useUpdatePurchaseOrderStatus } from '../hooks/usePurchaseOrders'

function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState('products')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')

  // Queries
  const { data: categories, isLoading: categoriesLoading } = useCategories()
  const { data: sizes } = useProductSizes(selectedCategory)
  const { data: colors } = useProductColors(selectedCategory, selectedSize)

  const { data: products, isLoading: productsLoading } = useProducts({
    categoryId: selectedCategory,
    size: selectedSize,
    color: selectedColor,
  })
  
  const { data: purchaseOrders, isLoading: purchaseOrdersLoading } = usePurchaseOrders()

  // Mutations
  const addCategory = useAddCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()
  const addProduct = useAddProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()
  const updatePurchaseOrderStatus = useUpdatePurchaseOrderStatus()

  // --- Add Category State ---
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [newCatName, setNewCatName] = useState('')
  const [newCatDesc, setNewCatDesc] = useState('')
  const [catSubmitStatus, setCatSubmitStatus] = useState(null)
  const [catError, setCatError] = useState('')

  // --- Add Product State ---
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [newProdCategory, setNewProdCategory] = useState('')
  const [newProdSku, setNewProdSku] = useState('')
  const [newProdSize, setNewProdSize] = useState('')
  const [newProdColor, setNewProdColor] = useState('')
  const [newProdStock, setNewProdStock] = useState('')
  const [newProdPacketsPerBundle, setNewProdPacketsPerBundle] = useState('1')
  const [newProdAvgCost, setNewProdAvgCost] = useState('')
  const [newProdSellingPrice, setNewProdSellingPrice] = useState('')
  const [prodSubmitStatus, setProdSubmitStatus] = useState(null)
  const [prodError, setProdError] = useState('')

  // -------------------------
  // Handlers
  // -------------------------

  const openCategoryModal = (category = null) => {
    setEditingCategory(category)
    setNewCatName(category ? category.name : '')
    setNewCatDesc(category ? (category.description || '') : '')
    setCatSubmitStatus(null)
    setCatError('')
    setIsCategoryModalOpen(true)
  }

  const handleDeleteCategory = async () => {
    if (!editingCategory) return
    if (!window.confirm('Are you sure you want to completely delete this category? This might also affect related products.')) return
    
    try {
      setCatSubmitStatus('loading')
      await deleteCategory.mutateAsync(editingCategory.id)
      setCatSubmitStatus('success')
      setTimeout(() => setIsCategoryModalOpen(false), 1000)
    } catch (err) {
      setCatError(err.message || 'Failed to delete category')
      setCatSubmitStatus('error')
    }
  }

  const handleAddCategorySubmit = async (e) => {
    e.preventDefault()
    if (!newCatName.trim()) {
      setCatError('Category name is required')
      setCatSubmitStatus('error')
      return
    }

    try {
      setCatSubmitStatus('loading')
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, name: newCatName, description: newCatDesc })
      } else {
        await addCategory.mutateAsync({ name: newCatName, description: newCatDesc })
      }
      setCatSubmitStatus('success')
      setTimeout(() => setIsCategoryModalOpen(false), 1000)
    } catch (err) {
      setCatError(err.message || 'Failed to save category')
      setCatSubmitStatus('error')
    }
  }

  const openProductModal = (product = null) => {
    setEditingProduct(product)
    if (product) {
      setNewProdCategory(product.category_id || '')
      setNewProdSku(product.sku || '')
      setNewProdSize(product.size || '')
      setNewProdColor(product.color || '')
      setNewProdStock(product.stock_quantity !== null && product.stock_quantity !== undefined ? product.stock_quantity : '')
      setNewProdPacketsPerBundle(product.packets_per_bundle || '1')
      setNewProdAvgCost(product.avg_cost || '')
      setNewProdSellingPrice(product.selling_price || '')
    } else {
      setNewProdCategory('')
      setNewProdSku('')
      setNewProdSize('')
      setNewProdColor('')
      setNewProdStock('')
      setNewProdPacketsPerBundle('1')
      setNewProdAvgCost('')
      setNewProdSellingPrice('')
    }
    setProdSubmitStatus(null)
    setProdError('')
    setIsProductModalOpen(true)
  }

  const handleDeleteProduct = async () => {
    if (!editingProduct) return
    if (!window.confirm('Are you sure you want to completely delete this product?')) return
    
    try {
      setProdSubmitStatus('loading')
      await deleteProduct.mutateAsync(editingProduct.id)
      setProdSubmitStatus('success')
      setTimeout(() => setIsProductModalOpen(false), 1000)
    } catch (err) {
      setProdError(err.message || 'Failed to delete product')
      setProdSubmitStatus('error')
    }
  }

  const handleAutoGenerateSku = () => {
    if (!newProdCategory) {
      setProdError('Please select a category first to auto-generate SKU')
      setProdSubmitStatus('error')
      return
    }

    const catObj = categories?.find(c => c.id === newProdCategory)
    const catName = catObj?.name || ''

    const parts = [catName, newProdSize, newProdColor]
      .filter(Boolean)
      .map(part => part.trim().toUpperCase().replace(/\s+/g, '-'))

    setNewProdSku(parts.join('-'))
    setProdError('')
    setProdSubmitStatus(null)
  }

  const handleAddProductSubmit = async (e) => {
    e.preventDefault()
    if (!newProdCategory) {
      setProdError('Category is required')
      setProdSubmitStatus('error')
      return
    }

    try {
      setProdSubmitStatus('loading')
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          categoryId: newProdCategory,
          sku: newProdSku,
          size: newProdSize,
          color: newProdColor,
          stockQuantity: newProdStock,
          packetsPerBundle: newProdPacketsPerBundle,
          avgCost: newProdAvgCost,
          sellingPrice: newProdSellingPrice,
        })
      } else {
        await addProduct.mutateAsync({
          categoryId: newProdCategory,
          sku: newProdSku,
          size: newProdSize,
          color: newProdColor,
          stockQuantity: newProdStock,
          packetsPerBundle: newProdPacketsPerBundle,
          avgCost: newProdAvgCost,
          sellingPrice: newProdSellingPrice,
        })
      }
      setProdSubmitStatus('success')
      setTimeout(() => setIsProductModalOpen(false), 1000)
    } catch (err) {
      setProdError(err.message || 'Failed to add product')
      setProdSubmitStatus('error')
    }
  }

  // -------------------------
  // Helpers
  // -------------------------
  const categoryOptions = categories?.map((c) => ({
    value: c.id,
    label: c.name,
  })) || []

  const sizeOptions = sizes?.map((s) => ({ value: s, label: s })) || []
  const colorOptions = colors?.map((c) => ({ value: c, label: c })) || []

  const handleEditCategoryClick = (row) => {
    openCategoryModal(row)
  }

  const handleDeleteCategoryClick = async (row) => {
    if (!window.confirm('Are you sure you want to completely delete this category? This might also affect related products.')) return
    
    try {
      await deleteCategory.mutateAsync(row.id)
    } catch (err) {
      alert(err.message || 'Failed to delete category')
    }
  }

  const categoryColumns = [
    {
      key: 'name',
      header: 'Category Name',
      sortable: true,
      render: (val) => <span className="font-semibold text-surface-100">{val}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (val) => <span className="text-surface-300">{val || '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      render: (_, row) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleEditCategoryClick(row)}
            className="p-1.5 text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 rounded transition-colors"
            title="Edit Category"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteCategoryClick(row)}
            className="p-1.5 text-surface-400 hover:text-danger-400 hover:bg-danger-500/10 rounded transition-colors"
            title="Delete Category"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  // Columns for Receiving History
  const historyColumns = [
    {
      key: 'bill_date',
      header: 'Date',
      sortable: true,
      render: (val) => new Date(val).toLocaleDateString(),
    },
    {
      key: 'invoice_number',
      header: 'Invoice #',
      render: (val) => val || '—',
    },
    {
      key: 'vendor',
      header: 'Vendor',
      render: (_, row) => row.vendors?.name || '—',
    },
    {
      key: 'total_cost',
      header: 'Total Cost',
      sortable: true,
      render: (val) => (
        <span className="tabular-nums font-medium text-surface-200">
          Rs.{Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (val, row) => {
        const isPaid = val === 'paid'
        const isPendingToggle = updatePurchaseOrderStatus.isPending && updatePurchaseOrderStatus.variables?.orderId === row.id

        return (
          <button
            onClick={() => updatePurchaseOrderStatus.mutate({ 
              orderId: row.id, 
              status: isPaid ? 'pending' : 'paid' 
            })}
            disabled={isPendingToggle}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border transition-colors flex items-center justify-center min-w-[70px] ${
              isPaid
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
            } ${isPendingToggle ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={`Click to mark as ${isPaid ? 'pending' : 'paid'}`}
          >
            {isPendingToggle ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              val
            )}
          </button>
        )
      },
    },
  ]

  const columns = [
    {
      key: 'sku',
      header: 'SKU / Item',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-semibold text-surface-100">{val || 'No SKU'}</p>
          <p className="text-xs text-surface-400 mt-0.5">{row.categories?.name}</p>
        </div>
      ),
    },
    {
      key: 'size',
      header: 'Size & Color',
      render: (_, row) => (
        <div>
          <p className="text-sm text-surface-200">{row.size || '—'}</p>
          <p className="text-xs text-surface-400 mt-0.5">{row.color || '—'}</p>
        </div>
      ),
    },

    {
      key: 'avg_cost',
      header: 'Cost / Pkt',
      sortable: true,
      render: (val) => (
        <span className="tabular-nums text-surface-300">
          Rs.{Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'selling_price',
      header: 'Price / Pkt',
      sortable: true,
      render: (val) => (
        <span className="tabular-nums font-medium text-emerald-400">
          Rs.{Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'stock_quantity',
      header: 'Stock (Packets & Bundles)',
      sortable: true,
      render: (val, row) => {
        const isLow = val < 10
        const ppb = row.packets_per_bundle || 1
        const bundles = (val / ppb).toFixed(1).replace(/\.0$/, '')
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span
                className={`tabular-nums font-bold ${isLow ? 'text-danger-400' : 'text-primary-400'
                  }`}
              >
                {val} Pkt
              </span>
              {isLow && (
                <span className="badge bg-danger-500/10 text-danger-400 border border-danger-500/20">
                  Low
                </span>
              )}
            </div>
            <span className="text-xs text-surface-400 tabular-nums">
              ({bundles} Bdl)
            </span>
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation()
              openProductModal(row)
            }}
            className="p-1.5 text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 rounded transition-colors"
            title="Edit Product"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Inventory Master</h1>
          <p className="text-sm text-surface-400 mt-0.5">
            Manage your catalog and track packet stock levels
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {activeTab === 'categories' ? (
            <button onClick={() => openCategoryModal()} className="btn-primary whitespace-nowrap">
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          ) : (
            <button onClick={() => openProductModal()} className="btn-primary whitespace-nowrap">
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-700/50 mb-6">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'products' ? 'border-primary-500 text-primary-400' : 'border-transparent text-surface-400 hover:text-surface-200'
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'categories' ? 'border-primary-500 text-primary-400' : 'border-transparent text-surface-400 hover:text-surface-200'
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'history' ? 'border-primary-500 text-primary-400' : 'border-transparent text-surface-400 hover:text-surface-200'
          }`}
        >
          Bill History
        </button>
      </div>

      {activeTab === 'products' ? (
        <>
          {/* Filters */}
          <div className="glass-card p-4 flex flex-wrap gap-4 items-end animate-slide-up">
            <FilterDropdown
              label="Category"
              value={selectedCategory}
              onChange={(val) => {
                setSelectedCategory(val)
                setSelectedSize('')
                setSelectedColor('')
              }}
              options={categoryOptions}
              isLoading={categoriesLoading}
            />

            <FilterDropdown
              label="Size"
              value={selectedSize}
              onChange={(val) => {
                setSelectedSize(val)
                setSelectedColor('')
              }}
              options={sizeOptions}
              disabled={!selectedCategory || sizeOptions.length === 0}
            />

            <FilterDropdown
              label="Color"
              value={selectedColor}
              onChange={setSelectedColor}
              options={colorOptions}
              disabled={!selectedCategory || colorOptions.length === 0}
            />

            {(selectedCategory || selectedSize || selectedColor) && (
              <button
                onClick={() => {
                  setSelectedCategory('')
                  setSelectedSize('')
                  setSelectedColor('')
                }}
                className="text-xs text-surface-400 hover:text-surface-200 underline underline-offset-2 mb-2 ml-2 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Data Table */}
          <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <DataTable
              columns={columns}
              data={products}
              isLoading={productsLoading}
              emptyMessage={
                selectedCategory || selectedSize || selectedColor
                  ? 'No products found matching these filters.'
                  : 'No products in inventory.'
              }
            />
          </div>
        </>
      ) : activeTab === 'categories' ? (
        <div className="animate-slide-up">
          <DataTable
            columns={categoryColumns}
            data={categories}
            isLoading={categoriesLoading}
            emptyMessage="No categories found."
          />
        </div>
      ) : (
        <div className="animate-slide-up">
          <DataTable
            columns={historyColumns}
            data={purchaseOrders}
            isLoading={purchaseOrdersLoading}
            emptyMessage="No bill history found."
          />
        </div>
      )}

      {/* --- ADD/EDIT CATEGORY MODAL --- */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => catSubmitStatus !== 'loading' && setIsCategoryModalOpen(false)}
        title={editingCategory ? "Edit Category" : "Add New Category"}
      >
        <form onSubmit={handleAddCategorySubmit} className="space-y-5">
          {catSubmitStatus === 'success' && (
            <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary-400 flex-shrink-0" />
              <p className="text-sm text-primary-300">Category saved successfully!</p>
            </div>
          )}
          {catSubmitStatus === 'error' && (
            <div className="p-3 rounded-lg bg-danger-500/10 border border-danger-500/20 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-danger-400 flex-shrink-0" />
              <p className="text-sm text-danger-300">{catError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
                Name <span className="text-danger-400">*</span>
              </label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Kraft Notebooks"
                className="input-field"
                disabled={catSubmitStatus === 'loading' || catSubmitStatus === 'success'}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
                Description
              </label>
              <textarea
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Optional description..."
                className="input-field min-h-[80px] resize-y"
                disabled={catSubmitStatus === 'loading' || catSubmitStatus === 'success'}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-between gap-3 border-t border-surface-700/50 mt-2">
            <div>
              {editingCategory && (
                <button
                  type="button"
                  onClick={handleDeleteCategory}
                  className="btn-danger mt-4"
                  disabled={catSubmitStatus === 'loading' || catSubmitStatus === 'success'}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete Category
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="btn-secondary mt-4"
                disabled={catSubmitStatus === 'loading' || catSubmitStatus === 'success'}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary min-w-[120px] mt-4"
                disabled={catSubmitStatus === 'loading' || catSubmitStatus === 'success'}
              >
                {catSubmitStatus === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingCategory ? 'Update Category' : 'Save Category'
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* --- ADD/EDIT PRODUCT MODAL --- */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => prodSubmitStatus !== 'loading' && setIsProductModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Add New Product"}
      >
        <form onSubmit={handleAddProductSubmit} className="space-y-5">
          {prodSubmitStatus === 'success' && (
            <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary-400 flex-shrink-0" />
              <p className="text-sm text-primary-300">Product saved successfully!</p>
            </div>
          )}
          {prodSubmitStatus === 'error' && (
            <div className="p-3 rounded-lg bg-danger-500/10 border border-danger-500/20 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-danger-400 flex-shrink-0" />
              <p className="text-sm text-danger-300">{prodError}</p>
            </div>
          )}

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
                Category <span className="text-danger-400">*</span>
              </label>
              <select
                value={newProdCategory}
                onChange={(e) => setNewProdCategory(e.target.value)}
                className="input-field appearance-none bg-surface-900"
                disabled={prodSubmitStatus === 'loading' || prodSubmitStatus === 'success'}
              >
                <option value="">Select a category...</option>
                {categoryOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Size
                </label>
                <input
                  type="text"
                  value={newProdSize}
                  onChange={(e) => setNewProdSize(e.target.value)}
                  placeholder="e.g. LRG, A4"
                  className="input-field"
                  disabled={prodSubmitStatus === 'loading' || prodSubmitStatus === 'success'}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Color
                </label>
                <input
                  type="text"
                  value={newProdColor}
                  onChange={(e) => setNewProdColor(e.target.value)}
                  placeholder="e.g. BRN, RED"
                  className="input-field"
                  disabled={prodSubmitStatus === 'loading' || prodSubmitStatus === 'success'}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
                SKU
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProdSku}
                  onChange={(e) => setNewProdSku(e.target.value)}
                  placeholder="e.g. KRAFT-LRG-BRN"
                  className="input-field flex-1"
                  disabled={prodSubmitStatus === 'loading' || prodSubmitStatus === 'success'}
                />
                <button
                  type="button"
                  onClick={handleAutoGenerateSku}
                  disabled={prodSubmitStatus === 'loading' || prodSubmitStatus === 'success'}
                  className="btn-secondary flex-shrink-0 px-3 py-2 text-xs"
                  title="Auto-generate from Category, Size, and Color"
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Auto
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
                Currently Available Stock
              </label>
              <input
                type="number"
                value={newProdStock}
                onChange={(e) => setNewProdStock(e.target.value)}
                placeholder="e.g. 100"
                min="0"
                className="input-field"
                disabled={prodSubmitStatus === 'loading' || prodSubmitStatus === 'success'}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
                Packets per Bundle
              </label>
              <input
                type="number"
                value={newProdPacketsPerBundle}
                onChange={(e) => setNewProdPacketsPerBundle(e.target.value)}
                placeholder="e.g. 10"
                min="1"
                className="input-field"
                disabled={prodSubmitStatus === 'loading' || prodSubmitStatus === 'success'}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Avg Cost (Rs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newProdAvgCost}
                  onChange={(e) => setNewProdAvgCost(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  className="input-field"
                  disabled={prodSubmitStatus === 'loading' || prodSubmitStatus === 'success'}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Selling Price (Rs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newProdSellingPrice}
                  onChange={(e) => setNewProdSellingPrice(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  className="input-field"
                  disabled={prodSubmitStatus === 'loading' || prodSubmitStatus === 'success'}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-between gap-3 border-t border-surface-700/50 mt-2">
            <div>
              {editingProduct && (
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  className="btn-danger mt-4"
                  disabled={prodSubmitStatus === 'loading' || prodSubmitStatus === 'success'}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete Product
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="btn-secondary mt-4"
                disabled={prodSubmitStatus === 'loading' || prodSubmitStatus === 'success'}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary min-w-[120px] mt-4"
                disabled={prodSubmitStatus === 'loading' || prodSubmitStatus === 'success'}
              >
                {prodSubmitStatus === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingProduct ? 'Update Product' : 'Save Product'
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default InventoryDashboard
