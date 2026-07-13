import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useCreatePurchaseOrder() {
  const { tenantId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ vendorId, totalCost, dueDate, lineItems }) => {
      // 1. Create the purchase order
      const { data: purchaseOrder, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          tenant_id: tenantId,
          vendor_id: vendorId,
          date: new Date().toISOString().split('T')[0],
          total_cost: totalCost,
          status: 'pending',
          due_date: dueDate,
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

      // 3. Update stock quantities for each line item
      for (const item of lineItems) {
        // Get current stock
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.productId)
          .single()

        if (fetchError) throw fetchError

        // Update stock
        const newQuantity = (product.stock_quantity || 0) + item.quantity
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock_quantity: newQuantity })
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
