import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export function useVendors() {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      return data
    },
  })
}

export function useAddVendor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, contactNumber }) => {
      const { data, error } = await supabase
        .from('vendors')
        .insert([{
          name,
          contact_number: contactNumber || null,
          total_balance_owed: 0
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })
}

export function usePendingVendorCheques() {
  return useQuery({
    queryKey: ['pending-vendor-cheques'],
    queryFn: async () => {
      // Assuming 'vendors' relationship exists on transactions for vendor_id
      const { data, error } = await supabase
        .from('transactions')
        .select('*, vendors(name)')
        .eq('type', 'Money Out')
        .eq('payment_method', 'Cheque')
        .eq('status', 'Pending')
        .order('date', { ascending: true })

      if (error) throw error
      return data
    },
  })
}

export function useRecordVendorPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ vendorId, amount, paymentMethod, chequeNumber }) => {
      const { data, error } = await supabase.rpc('record_vendor_payment', {
        p_vendor_id: vendorId,
        p_amount: amount,
        p_payment_method: paymentMethod,
        p_cheque_number: chequeNumber || null,
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      queryClient.invalidateQueries({ queryKey: ['pending-vendor-cheques'] })
    },
  })
}

export function useClearVendorCheque() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ transactionId, vendorId }) => {
      const { data, error } = await supabase.rpc('clear_vendor_cheque', {
        p_transaction_id: transactionId,
        p_vendor_id: vendorId,
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      queryClient.invalidateQueries({ queryKey: ['pending-vendor-cheques'] })
    },
  })
}

