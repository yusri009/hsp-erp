import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      return data
    },
  })
}

export function useAddCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, contactNumber, creditLimit }) => {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name,
          contact_number: contactNumber || null,
          credit_limit: creditLimit ? Number(creditLimit) : null,
          balance_due: 0
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function usePendingCheques() {
  return useQuery({
    queryKey: ['pending-cheques'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, customers(name)')
        .eq('payment_method', 'Cheque')
        .eq('status', 'Pending')
        .order('date', { ascending: true })

      if (error) throw error
      return data
    },
  })
}

export function useRecordPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ customerId, amount, paymentMethod, chequeNumber }) => {
      const { data, error } = await supabase.rpc('record_customer_payment', {
        p_customer_id: customerId,
        p_amount: amount,
        p_payment_method: paymentMethod,
        p_cheque_number: chequeNumber || null,
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['pending-cheques'] })
    },
  })
}

export function useClearCheque() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ transactionId, customerId }) => {
      const { data, error } = await supabase.rpc('clear_pending_cheque', {
        p_transaction_id: transactionId,
        p_customer_id: customerId,
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['pending-cheques'] })
    },
  })
}
