import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useBankAccounts() {
  const { tenantId } = useAuth()

  return useQuery({
    queryKey: ['bank-accounts', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!tenantId,
  })
}

export function useAddBankAccount() {
  const { tenantId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, accountNumber, initialBalance }) => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert([{
          tenant_id: tenantId,
          name,
          account_number: accountNumber || null,
          current_balance: initialBalance ? Number(initialBalance) : 0,
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] })
    },
  })
}

export function useUpdateBankAccount() {
  const { tenantId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, name, accountNumber }) => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .update({
          name,
          account_number: accountNumber || null,
        })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] })
    },
  })
}

export function useDeleteBankAccount() {
  const { tenantId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId)

      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] })
    },
  })
}

export function useTransferFunds() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ fromAccountId, toAccountId, amount }) => {
      const { data, error } = await supabase.rpc('transfer_funds', {
        p_from_account_id: fromAccountId,
        p_to_account_id: toAccountId,
        p_amount: amount
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] }) // Refresh metrics just in case
    },
  })
}

export function useAdjustBankAccountBalance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ accountId, newBalance, reason }) => {
      const { data, error } = await supabase.rpc('adjust_bank_balance', {
        p_account_id: accountId,
        p_new_balance: newBalance,
        p_reason: reason
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
    },
  })
}
