import { useState } from 'react'
import { Plus, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react'
import DataTable from '../components/DataTable'
import FilterDropdown from '../components/FilterDropdown'
import Modal from '../components/Modal'
import {
  useProducts,
  useProductSizes,
  useProductColors,
  useAddProduct,
} from '../hooks/useProducts'
import { useCategories, useAddCategory } from '../hooks/useCategories'

function InventoryDashboard() {
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

  // Mutations
  const addCategory = useAddCategory()
  const addProduct = useAddProduct()

  // --- Add Category State ---
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatDesc, setNewCatDesc] = useState('')
  const [catSubmitStatus, setCatSubmitStatus] = useState(null)
  const [catError, setCatError] = useState('')

  // --- Add Product State ---
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [newProdCategory, setNewProdCategory] = useState('')
  const [newProdSku, setNewProdSku] = useState('')
  const [newProdSize, setNewProdSize] = useState('')
  const [newProdColor, setNewProdColor] = useState('')
  const [newProdPieces, setNewProdPieces] = useState('')
  const [newProdAvgCost, setNewProdAvgCost] = useState('')
  const [newProdSellingPrice, setNewProdSellingPrice] = useState('')
  const [prodSubmitStatus, setProdSubmitStatus] = useState(null)
  const [prodError, setProdError] = useState('')

  // -------------------------
  // Handlers
  // -------------------------

  const openCategoryModal = () => {
    setNewCatName('')
    setNewCatDesc('')
    setCatSubmitStatus(null)
    setCatError('')
    setIsCategoryModalOpen(true)
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
      await addCategory.mutateAsync({ name: newCatName, description: newCatDesc })
      setCatSubmitStatus('success')
      setTimeout(() => setIsCategoryModalOpen(false), 1000)
    } catch (err) {
      setCatError(err.message || 'Failed to add category')
      setCatSubmitStatus('error')
    }
  }

  const openProductModal = () => {
    setNewProdCategory('')
    setNewProdSku('')
    setNewProdSize('')
    setNewProdColor('')
    setNewProdPieces('')
    setNewProdAvgCost('')
    setNewProdSellingPrice('')
    setProdSubmitStatus(null)
    setProdError('')
    setIsProductModalOpen(true)
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
      await addProduct.mutateAsync({
        categoryId: newProdCategory,
        sku: newProdSku,
        size: newProdSize,
        color: newProdColor,
        piecesPerPacket: newProdPieces,
        avgCost: newProdAvgCost,
        sellingPrice: newProdSellingPrice,
      })
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
      key: 'pieces_per_packet',
      header: 'Pieces / Pkt',
      sortable: true,
      render: (val) => <span className="tabular-nums text-surface-300">{val || '—'}</span>,
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
      header: 'Stock (Packets)',
      sortable: true,
      render: (val) => {
        const isLow = val < 10
        return (
          <div className="flex items-center gap-2">
            <span
              className={`tabular-nums font-bold ${isLow ? 'text-danger-400' : 'text-primary-400'
                }`}
            >
              {val}
            </span>
            {isLow && (
              <span className="badge bg-danger-500/10 text-danger-400 border border-danger-500/20">
                Low
              </span>
            )}
          </div>
        )
      },
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
          <button onClick={openCategoryModal} className="btn-secondary whitespace-nowrap">
            <Plus className="w-4 h-4" />
            Add Category
          </button>
          <button onClick={openProductModal} className="btn-primary whitespace-nowrap">
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

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

      {/* --- ADD CATEGORY MODAL --- */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => catSubmitStatus !== 'loading' && setIsCategoryModalOpen(false)}
        title="Add New Category"
      >
        <form onSubmit={handleAddCategorySubmit} className="space-y-5">
          {catSubmitStatus === 'success' && (
            <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary-400 flex-shrink-0" />
              <p className="text-sm text-primary-300">Category added successfully!</p>
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

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="btn-secondary"
              disabled={catSubmitStatus === 'loading' || catSubmitStatus === 'success'}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary min-w-[120px]"
              disabled={catSubmitStatus === 'loading' || catSubmitStatus === 'success'}
            >
              {catSubmitStatus === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Category'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- ADD PRODUCT MODAL --- */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => prodSubmitStatus !== 'loading' && setIsProductModalOpen(false)}
        title="Add New Product"
      >
        <form onSubmit={handleAddProductSubmit} className="space-y-5">
          {prodSubmitStatus === 'success' && (
            <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary-400 flex-shrink-0" />
              <p className="text-sm text-primary-300">Product added successfully!</p>
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
                Pieces per Packet
              </label>
              <input
                type="number"
                value={newProdPieces}
                onChange={(e) => setNewProdPieces(e.target.value)}
                placeholder="e.g. 50"
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

          <div className="pt-2 flex justify-end gap-3 border-t border-surface-700/50 mt-2">
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
                'Save Product'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default InventoryDashboard
