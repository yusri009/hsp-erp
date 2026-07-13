import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useExpenses() {
  const { tenantId } = useAuth()

  return useQuery({
    queryKey: ['expenses', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('date', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!tenantId,
  })
}

export function useAddExpense() {
  const { tenantId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ date, category, amount, description }) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          tenant_id: tenantId,
          date,
          category,
          amount: Number(amount),
          description: description || null,
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-profit'] })
    },
  })
}

export function useDeleteExpense() {
  const { tenantId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId)

      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-profit'] })
    },
  })
}
