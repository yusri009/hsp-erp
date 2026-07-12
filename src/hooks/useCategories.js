import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useCategories() {
  const { tenantId } = useAuth()

  return useQuery({
    queryKey: ['categories', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!tenantId,
  })
}

export function useAddCategory() {
  const { tenantId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, description }) => {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          tenant_id: tenantId,
          name,
          description: description || null,
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
