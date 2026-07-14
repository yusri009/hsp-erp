import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useVendors() {
  const { tenantId } = useAuth()

  return useQuery({
    queryKey: ['vendors', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!tenantId,
  })
}

export function useAddVendor() {
  const { tenantId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, contactNumber }) => {
      const { data, error } = await supabase
        .from('vendors')
        .insert([{
          tenant_id: tenantId,
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

export function useUpdateVendor() {
  const { tenantId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, name, contactNumber }) => {
      const { data, error } = await supabase
        .from('vendors')
        .update({
          name,
          contact_number: contactNumber || null,
        })
        .eq('id', id)
        .eq('tenant_id', tenantId)
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

export function useDeleteVendor() {
  const { tenantId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId)

      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })
}



export function useRecordVendorPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ vendorId, amount, paymentMethod, chequeNumber, accountId }) => {
      const { data, error } = await supabase.rpc('record_vendor_payment', {
        p_vendor_id: vendorId,
        p_amount: amount,
        p_payment_method: paymentMethod,
        p_cheque_number: chequeNumber || null,
        p_account_id: accountId,
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

