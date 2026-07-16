import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function usePurchaseOrders() {
  const { tenantId } = useAuth()

  return useQuery({
    queryKey: ['purchase_orders', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          vendors (
            name
          )
        `)
        .eq('tenant_id', tenantId)
        .order('bill_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!tenantId,
  })
}

export function useCreatePurchaseOrder() {
  const { tenantId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ vendorId, invoiceNumber, totalCost, billDate, lineItems }) => {
      // 1. Create the purchase order
      const { data: purchaseOrder, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          tenant_id: tenantId,
          vendor_id: vendorId,
          invoice_number: invoiceNumber || null,
          bill_date: billDate,
          total_cost: totalCost,
          status: 'pending',
        })
        .select()
        .single()

      if (poError) throw poError

      // 2. Insert line items
      const poItems = lineItems.map((item) => ({
        purchase_order_id: purchaseOrder.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_cost: item.unit_cost
      }))

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(poItems)

      if (itemsError) throw itemsError

      // 3. Update stock quantities and recalculate weighted average cost for each line item
      for (const item of lineItems) {
        // Get current stock and avg_cost
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('stock_quantity, avg_cost')
          .eq('id', item.productId)
          .single()

        if (fetchError) throw fetchError

        const currentQty = product.stock_quantity || 0
        const currentAvgCost = product.avg_cost || 0
        const newQuantity = currentQty + item.quantity

        // Weighted average: (existing_value + new_value) / total_qty
        const newAvgCost = newQuantity > 0
          ? ((currentQty * currentAvgCost) + (item.quantity * item.unit_cost)) / newQuantity
          : item.unit_cost

        const { error: updateError } = await supabase
          .from('products')
          .update({
            stock_quantity: newQuantity,
            avg_cost: Math.round(newAvgCost * 100) / 100, // round to 2 decimals
          })
          .eq('id', item.productId)

        if (updateError) throw updateError
      }

      // 4. Update vendor balance
      const { data: vendor, error: vendorFetchError } = await supabase
        .from('vendors')
        .select('total_balance_owed')
        .eq('id', vendorId)
        .single()

      if (vendorFetchError) throw vendorFetchError

      const newBalance = (vendor.total_balance_owed || 0) + totalCost
      const { error: vendorUpdateError } = await supabase
        .from('vendors')
        .update({ total_balance_owed: newBalance })
        .eq('id', vendorId)

      if (vendorUpdateError) throw vendorUpdateError

      return purchaseOrder
    },
    onSuccess: () => {
      // Invalidate product and vendor queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })
}

export function useUpdatePurchaseOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderId, status }) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] })
    },
  })
}
