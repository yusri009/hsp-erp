import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import {
  FileBarChart2,
  Download,
  RefreshCw,
  TrendingUp,
  ShoppingCart,
  ArrowLeftRight,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import DataTable from '../components/DataTable'
import SearchableSelect from '../components/SearchableSelect'
import { useSalesReport, usePurchaseReport, useCashFlowReport } from '../hooks/useReports'
import { useCustomers } from '../hooks/useCustomers'
import { useVendors } from '../hooks/useVendors'

// ─── Constants ────────────────────────────────────────────
const REPORT_TYPES = [
  { value: 'sales', label: 'Sales Report', icon: TrendingUp },
  { value: 'purchases', label: 'Purchase Report', icon: ShoppingCart },
  { value: 'cashflow', label: 'Cash Flow (Transactions)', icon: ArrowLeftRight },
]

const today = format(new Date(), 'yyyy-MM-dd')
const firstOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')

// ─── Column Definitions ───────────────────────────────────
function formatCurrency(val) {
  return val != null ? `LKR ${Number(val).toLocaleString('en-LK', { minimumFractionDigits: 2 })}` : '—'
}

function StatusBadge({ status }) {
  const map = {
    Fulfilled: 'bg-primary-500/15 text-primary-600',
    Pending:   'bg-warning-500/15 text-warning-600',
    Cleared:   'bg-primary-500/15 text-primary-600',
    pending:   'bg-warning-500/15 text-warning-600',
    'Money In': 'bg-primary-500/15 text-primary-600',
    'Money Out': 'bg-danger-500/15 text-danger-500',
  }
  const cls = map[status] ?? 'bg-surface-700 text-surface-300'
  return <span className={`badge ${cls}`}>{status}</span>
}

const SALES_COLUMNS = [
  { key: 'date', header: 'Date', sortable: true },
  { key: 'customer', header: 'Customer', sortable: true, render: (_, row) => row.customers?.name ?? '—' },
  { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v} /> },
  { key: 'total_amount', header: 'Total Amount', sortable: true, render: (v) => formatCurrency(v) },
]

const PURCHASE_COLUMNS = [
  { key: 'date', header: 'Date', sortable: true },
  { key: 'vendor', header: 'Vendor', sortable: true, render: (_, row) => row.vendors?.name ?? '—' },
  { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v} /> },
  { key: 'total_cost', header: 'Total Cost', sortable: true, render: (v) => formatCurrency(v) },
]

const CASHFLOW_COLUMNS = [
  { key: 'date', header: 'Date', sortable: true },
  { key: 'type', header: 'Type', render: (v) => <StatusBadge status={v} /> },
  { key: 'payment_method', header: 'Method', sortable: true },
  { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v} /> },
  { key: 'amount', header: 'Amount', sortable: true, render: (v) => formatCurrency(v) },
]

// ─── PDF Generation ───────────────────────────────────────
function generatePDF({ reportType, startDate, endDate, data, entityName }) {
  const typeLabel = REPORT_TYPES.find(r => r.value === reportType)?.label ?? reportType
  const doc = new jsPDF({ orientation: 'landscape' })

  // Header bar
  doc.setFillColor(16, 185, 129) // primary-500 emerald
  doc.rect(0, 0, doc.internal.pageSize.width, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('HSP Wholesale', 14, 8)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`— ${typeLabel}`, 14, 15)

  // Sub-header info
  doc.setTextColor(50, 50, 50)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  let y = 28
  doc.text(`Date Range: ${startDate}  →  ${endDate}`, 14, y)
  if (entityName) {
    y += 6
    const entityLabel = reportType === 'sales' ? 'Customer' : 'Vendor'
    doc.text(`${entityLabel}: ${entityName}`, 14, y)
  }
  y += 6
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, 14, y)

  // Table
  let head, body
  if (reportType === 'sales') {
    head = [['Date', 'Customer', 'Status', 'Total Amount']]
    body = data.map(r => [
      r.date,
      r.customers?.name ?? '—',
      r.status,
      formatCurrency(r.total_amount),
    ])
  } else if (reportType === 'purchases') {
    head = [['Date', 'Vendor', 'Status', 'Total Cost']]
    body = data.map(r => [
      r.date,
      r.vendors?.name ?? '—',
      r.status,
      formatCurrency(r.total_cost),
    ])
  } else {
    head = [['Date', 'Type', 'Method', 'Status', 'Amount']]
    body = data.map(r => [
      r.date,
      r.type,
      r.payment_method,
      r.status,
      formatCurrency(r.amount),
    ])
  }

  autoTable(doc, {
    startY: y + 6,
    head,
    body,
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 8.5, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [245, 250, 248] },
    styles: { cellPadding: 3 },
    margin: { left: 14, right: 14 },
  })

  const fileName = `HSP_Report_${typeLabel.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`
  doc.save(fileName)
}

// ─── Main Component ───────────────────────────────────────
function Reports() {
  // Form state
  const [reportType, setReportType] = useState('sales')
  const [startDate, setStartDate] = useState(firstOfMonth)
  const [endDate, setEndDate] = useState(today)
  const [customerId, setCustomerId] = useState('')
  const [vendorId, setVendorId] = useState('')

  // "Generate" is triggered explicitly; tracks the last submitted params
  const [params, setParams] = useState(null)

  // Entity lists for dropdowns
  const { data: customers = [] } = useCustomers()
  const { data: vendors = [] } = useVendors()

  const customerOptions = useMemo(
    () => customers.map(c => ({ value: c.id, label: c.name })),
    [customers]
  )
  const vendorOptions = useMemo(
    () => vendors.map(v => ({ value: v.id, label: v.name })),
    [vendors]
  )

  // Data hooks — only active once user clicks Generate
  const salesQuery = useSalesReport({
    startDate: params?.startDate,
    endDate: params?.endDate,
    customerId: params?.customerId,
    enabled: params?.reportType === 'sales',
  })
  const purchaseQuery = usePurchaseReport({
    startDate: params?.startDate,
    endDate: params?.endDate,
    vendorId: params?.vendorId,
    enabled: params?.reportType === 'purchases',
  })
  const cashFlowQuery = useCashFlowReport({
    startDate: params?.startDate,
    endDate: params?.endDate,
    enabled: params?.reportType === 'cashflow',
  })

  // Resolve active query for the current report type
  const activeQuery = {
    sales: salesQuery,
    purchases: purchaseQuery,
    cashflow: cashFlowQuery,
  }[params?.reportType] ?? { data: null, isFetching: false, isError: false }

  const reportData = activeQuery.data ?? []

  // Column set for the active report type
  const columns = {
    sales: SALES_COLUMNS,
    purchases: PURCHASE_COLUMNS,
    cashflow: CASHFLOW_COLUMNS,
  }[params?.reportType] ?? SALES_COLUMNS

  // Entity name for PDF sub-header
  const entityName = useMemo(() => {
    if (params?.reportType === 'sales' && params?.customerId) {
      return customers.find(c => c.id === params.customerId)?.name ?? null
    }
    if (params?.reportType === 'purchases' && params?.vendorId) {
      return vendors.find(v => v.id === params.vendorId)?.name ?? null
    }
    return null
  }, [params, customers, vendors])

  function handleGenerate() {
    setParams({
      reportType,
      startDate,
      endDate,
      customerId: reportType === 'sales' ? customerId : '',
      vendorId: reportType === 'purchases' ? vendorId : '',
    })
  }

  function handleDownloadPDF() {
    if (!reportData.length) return
    generatePDF({
      reportType: params.reportType,
      startDate: params.startDate,
      endDate: params.endDate,
      data: reportData,
      entityName,
    })
  }

  const hasResults = params !== null
  const isLoading = activeQuery.isFetching
  const typeLabel = REPORT_TYPES.find(r => r.value === reportType)?.label

  // Summary totals
  const totalSales = useMemo(() =>
    reportType === 'sales' ? reportData.reduce((s, r) => s + (r.total_amount ?? 0), 0) : 0,
    [reportData, reportType]
  )
  const totalPurchases = useMemo(() =>
    reportType === 'purchases' ? reportData.reduce((s, r) => s + (r.total_cost ?? 0), 0) : 0,
    [reportData, reportType]
  )
  const totalCashIn = useMemo(() =>
    reportType === 'cashflow' ? reportData.filter(r => r.type === 'Money In').reduce((s, r) => s + (r.amount ?? 0), 0) : 0,
    [reportData, reportType]
  )
  const totalCashOut = useMemo(() =>
    reportType === 'cashflow' ? reportData.filter(r => r.type === 'Money Out').reduce((s, r) => s + (r.amount ?? 0), 0) : 0,
    [reportData, reportType]
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary-500/10">
          <FileBarChart2 className="w-5 h-5 text-primary-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-surface-50">Reports</h2>
          <p className="text-sm text-surface-400">Generate filtered reports and export as PDF</p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="glass-card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Report Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
              Report Type
            </label>
            <div className="relative">
              <select
                id="report-type-select"
                value={reportType}
                onChange={e => {
                  setReportType(e.target.value)
                  setCustomerId('')
                  setVendorId('')
                }}
                className="input-field appearance-none pr-8 cursor-pointer"
              >
                {REPORT_TYPES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <label htmlFor="report-start-date" className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
              Start Date
            </label>
            <input
              id="report-start-date"
              type="date"
              value={startDate}
              max={endDate}
              onChange={e => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label htmlFor="report-end-date" className="block text-xs font-medium text-surface-400 uppercase tracking-wider">
              End Date
            </label>
            <input
              id="report-end-date"
              type="date"
              value={endDate}
              min={startDate}
              onChange={e => setEndDate(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Customer / Vendor Filter */}
          {reportType === 'sales' && (
            <SearchableSelect
              label="Customer (optional)"
              value={customerId}
              onChange={setCustomerId}
              options={customerOptions}
              placeholder="All Customers"
            />
          )}
          {reportType === 'purchases' && (
            <SearchableSelect
              label="Vendor (optional)"
              value={vendorId}
              onChange={setVendorId}
              options={vendorOptions}
              placeholder="All Vendors"
            />
          )}
          {reportType === 'cashflow' && (
            <div /> /* spacer to keep grid alignment */
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-surface-700/50">
          <button
            id="generate-report-btn"
            onClick={handleGenerate}
            disabled={!startDate || !endDate}
            className="btn-primary"
          >
            <RefreshCw className="w-4 h-4" />
            Generate Report
          </button>

          <button
            id="download-pdf-btn"
            onClick={handleDownloadPDF}
            disabled={!hasResults || !reportData.length || isLoading}
            className="btn-secondary"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>

          {hasResults && reportData.length > 0 && (
            <span className="text-sm text-surface-400 ml-auto">
              {reportData.length} {reportData.length === 1 ? 'record' : 'records'} found
            </span>
          )}
        </div>
      </div>

      {/* Summary Cards — shown after generating */}
      {hasResults && !isLoading && reportData.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
          {params.reportType === 'sales' && (
            <>
              <div className="glass-card p-4">
                <p className="text-xs text-surface-400 uppercase tracking-wider mb-1">Orders</p>
                <p className="text-2xl font-bold text-surface-50">{reportData.length}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-surface-400 uppercase tracking-wider mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-primary-400">{formatCurrency(totalSales)}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-surface-400 uppercase tracking-wider mb-1">Fulfilled</p>
                <p className="text-2xl font-bold text-surface-50">{reportData.filter(r => r.status === 'Fulfilled').length}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-surface-400 uppercase tracking-wider mb-1">Pending</p>
                <p className="text-2xl font-bold text-warning-400">{reportData.filter(r => r.status === 'Pending').length}</p>
              </div>
            </>
          )}
          {params.reportType === 'purchases' && (
            <>
              <div className="glass-card p-4">
                <p className="text-xs text-surface-400 uppercase tracking-wider mb-1">Orders</p>
                <p className="text-2xl font-bold text-surface-50">{reportData.length}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-surface-400 uppercase tracking-wider mb-1">Total Cost</p>
                <p className="text-2xl font-bold text-danger-400">{formatCurrency(totalPurchases)}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-surface-400 uppercase tracking-wider mb-1">Pending</p>
                <p className="text-2xl font-bold text-warning-400">{reportData.filter(r => r.status === 'pending').length}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-surface-400 uppercase tracking-wider mb-1">Date Range</p>
                <p className="text-sm font-semibold text-surface-200">{params.startDate} → {params.endDate}</p>
              </div>
            </>
          )}
          {params.reportType === 'cashflow' && (
            <>
              <div className="glass-card p-4">
                <p className="text-xs text-surface-400 uppercase tracking-wider mb-1">Transactions</p>
                <p className="text-2xl font-bold text-surface-50">{reportData.length}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-surface-400 uppercase tracking-wider mb-1">Money In</p>
                <p className="text-2xl font-bold text-primary-400">{formatCurrency(totalCashIn)}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-surface-400 uppercase tracking-wider mb-1">Money Out</p>
                <p className="text-2xl font-bold text-danger-400">{formatCurrency(totalCashOut)}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-surface-400 uppercase tracking-wider mb-1">Net</p>
                <p className={`text-2xl font-bold ${totalCashIn - totalCashOut >= 0 ? 'text-primary-400' : 'text-danger-400'}`}>
                  {formatCurrency(totalCashIn - totalCashOut)}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Results Table */}
      {hasResults && (
        <div className="animate-slide-up">
          {activeQuery.isError ? (
            <div className="glass-card p-8 text-center">
              <p className="text-sm text-danger-400 font-medium">Failed to load report. Please try again.</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={reportData}
              isLoading={isLoading}
              emptyMessage={`No ${typeLabel} data found for the selected period.`}
            />
          )}
        </div>
      )}

      {/* Initial prompt state */}
      {!hasResults && (
        <div className="glass-card p-14 flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-2xl bg-surface-700/40 mb-4">
            <FileBarChart2 className="w-8 h-8 text-surface-500" />
          </div>
          <p className="text-sm font-medium text-surface-400">Configure your filters above and click <span className="text-surface-200">Generate Report</span></p>
          <p className="text-xs text-surface-500 mt-1">Results will appear here and can be exported as PDF</p>
        </div>
      )}
    </div>
  )
}

export default Reports
