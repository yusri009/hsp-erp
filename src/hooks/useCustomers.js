import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useCustomers() {
  const { tenantId } = useAuth()

  return useQuery({
    queryKey: ['customers', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!tenantId,
  })
}

export function useAddCustomer() {
  const { tenantId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, contactNumber, creditLimit }) => {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          tenant_id: tenantId,
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

export function useUpdateCustomer() {
  const { tenantId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, name, contactNumber, creditLimit }) => {
      const { data, error } = await supabase
        .from('customers')
        .update({
          name,
          contact_number: contactNumber || null,
          credit_limit: creditLimit ? Number(creditLimit) : null,
        })
        .eq('id', id)
        .eq('tenant_id', tenantId)
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

export function useDeleteCustomer() {
  const { tenantId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId)

      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}



export function useRecordPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ customerId, amount, paymentMethod, chequeNumber, accountId, chequeDate }) => {
      const { data, error } = await supabase.rpc('record_customer_payment', {
        p_customer_id: customerId,
        p_amount: amount,
        p_payment_method: paymentMethod,
        p_cheque_number: chequeNumber || null,
        p_account_id: accountId,
        p_cheque_date: chequeDate || null,
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

