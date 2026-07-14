import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useCheques() {
  const { tenantId } = useAuth()

  return useQuery({
    queryKey: ['cheques', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, customers(name), vendors(name), expenses(category)')
        .eq('tenant_id', tenantId)
        .eq('payment_method', 'Cheque')
        .order('date', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!tenantId,
  })
}

export function useDueCheques() {
  const { tenantId } = useAuth()

  return useQuery({
    queryKey: ['due-cheques', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, customers(name), vendors(name), expenses(category)')
        .eq('tenant_id', tenantId)
        .eq('payment_method', 'Cheque')
        .eq('status', 'Pending')
        .not('cheque_date', 'is', null)
        .lte('cheque_date', new Date(Date.now() + 86400000).toISOString().split('T')[0]) // Tomorrow or earlier
        .order('cheque_date', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!tenantId,
    refetchInterval: 300000, // Refetch every 5 minutes just in case
  })
}

export function useClearCheque() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ transactionId, customerId, accountId }) => {
      const { data, error } = await supabase.rpc('clear_pending_cheque', {
        p_transaction_id: transactionId,
        p_customer_id: customerId,
        p_account_id: accountId,
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cheques'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
    },
  })
}

export function useClearVendorCheque() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ transactionId, vendorId, accountId }) => {
      const { data, error } = await supabase.rpc('clear_vendor_cheque', {
        p_transaction_id: transactionId,
        p_vendor_id: vendorId,
        p_account_id: accountId,
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cheques'] })
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
    },
  })
}

export function useClearExpenseCheque() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ transactionId, expenseId, accountId }) => {
      const { data, error } = await supabase.rpc('clear_expense_cheque', {
        p_transaction_id: transactionId,
        p_expense_id: expenseId,
        p_account_id: accountId,
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cheques'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
    },
  })
}

export function useUndoClearCheque() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ transactionId }) => {
      const { data, error } = await supabase.rpc('undo_clear_cheque', {
        p_transaction_id: transactionId,
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cheques'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
    },
  })
}
