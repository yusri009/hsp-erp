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
