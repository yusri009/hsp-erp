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

      // 2. Update stock quantities for each line item
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

      return purchaseOrder
    },
    onSuccess: () => {
      // Invalidate product queries to refetch updated stock
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
