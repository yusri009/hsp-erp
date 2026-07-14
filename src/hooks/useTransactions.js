import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useTransactions() {
  const { tenantId } = useAuth()

  return useQuery({
    queryKey: ['transactions', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          bank_accounts(name),
          customers(name),
          vendors(name),
          expenses(category)
        `)
        .eq('tenant_id', tenantId)
        .order('date', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!tenantId,
  })
}
