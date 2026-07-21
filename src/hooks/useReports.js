import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useSalesReport({ startDate, endDate, customerId, enabled }) {
  const { tenantId } = useAuth()

  return useQuery({
    queryKey: ['reports', 'sales', tenantId, startDate, endDate, customerId],
    queryFn: async () => {
      let query = supabase
        .from('sales_orders')
        .select('id, date, total_amount, status, customers(name)')
        .eq('tenant_id', tenantId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (customerId) {
        query = query.eq('customer_id', customerId)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!tenantId && !!startDate && !!endDate && enabled,
  })
}

export function usePurchaseReport({ startDate, endDate, vendorId, enabled }) {
  const { tenantId } = useAuth()

  return useQuery({
    queryKey: ['reports', 'purchases', tenantId, startDate, endDate, vendorId],
    queryFn: async () => {
      let query = supabase
        .from('purchase_orders')
        .select('id, bill_date, total_cost, status, vendors(name)')
        .eq('tenant_id', tenantId)
        .gte('bill_date', startDate)
        .lte('bill_date', endDate)
        .order('bill_date', { ascending: false })

      if (vendorId) {
        query = query.eq('vendor_id', vendorId)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!tenantId && !!startDate && !!endDate && enabled,
  })
}

export function useCashFlowReport({ startDate, endDate, enabled }) {
  const { tenantId } = useAuth()

  return useQuery({
    queryKey: ['reports', 'cashflow', tenantId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, date, type, amount, payment_method, status')
        .eq('tenant_id', tenantId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!tenantId && !!startDate && !!endDate && enabled,
  })
}

export function useProductLedgerReport({ startDate, endDate, productId, enabled }) {
  const { tenantId } = useAuth()

  return useQuery({
    queryKey: ['reports', 'product_ledger', tenantId, startDate, endDate, productId],
    queryFn: async () => {
      let purchasesQuery = supabase
        .from('purchase_order_items')
        .select(`
          id, quantity, unit, unit_cost, purchase_orders!inner(bill_date, vendors(name))
        `)
        .gte('purchase_orders.bill_date', startDate)
        .lte('purchase_orders.bill_date', endDate)

      if (productId) {
        purchasesQuery = purchasesQuery.eq('product_id', productId)
      }

      let salesQuery = supabase
        .from('sales_order_items')
        .select(`
          id, quantity, unit, unit_price, sales_orders!inner(date, customers(name))
        `)
        .gte('sales_orders.date', startDate)
        .lte('sales_orders.date', endDate)

      if (productId) {
        salesQuery = salesQuery.eq('product_id', productId)
      }

      const [purchasesRes, salesRes] = await Promise.all([purchasesQuery, salesQuery])

      if (purchasesRes.error) throw purchasesRes.error
      if (salesRes.error) throw salesRes.error

      const incoming = purchasesRes.data.map(item => ({
        id: `p-${item.id}`,
        date: item.purchase_orders.bill_date,
        type: 'Incoming',
        entityName: item.purchase_orders.vendors?.name || '—',
        quantity: item.quantity,
        unit: item.unit,
        price: item.unit_cost,
      }))

      const outgoing = salesRes.data.map(item => ({
        id: `s-${item.id}`,
        date: item.sales_orders.date,
        type: 'Outgoing',
        entityName: item.sales_orders.customers?.name || '—',
        quantity: item.quantity,
        unit: item.unit,
        price: item.unit_price,
      }))

      return [...incoming, ...outgoing].sort((a, b) => new Date(b.date) - new Date(a.date))
    },
    enabled: !!tenantId && !!startDate && !!endDate && enabled,
  })
}
