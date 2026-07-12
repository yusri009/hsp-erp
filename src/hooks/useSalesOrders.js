import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useSalesOrders(status) {
  const { tenantId } = useAuth()

  return useQuery({
    queryKey: ['sales-orders', tenantId, status],
    queryFn: async () => {
      let query = supabase
        .from('sales_orders')
        .select('*, customers(name)')
        .eq('tenant_id', tenantId)
        .order('date', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!tenantId,
  })
}

export function useCreateSalesOrder() {
  const { tenantId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ customerId, lineItems, totalAmount }) => {
      // 1. Insert the parent sales order
      const { data: salesOrder, error: soError } = await supabase
        .from('sales_orders')
        .insert({
          tenant_id: tenantId,
          customer_id: customerId,
          date: new Date().toISOString().split('T')[0],
          total_amount: totalAmount,
          status: 'Pending',
        })
        .select()
        .single()

      if (soError) throw soError

      // 2. Insert all child line items
      const items = lineItems.map((item) => ({
        order_id: salesOrder.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      }))

      const { error: itemsError } = await supabase
        .from('sales_order_items')
        .insert(items)

      if (itemsError) throw itemsError

      return salesOrder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useFulfillSalesOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderId) => {
      const { data, error } = await supabase.rpc('fulfill_sales_order', {
        order_id: orderId,
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
