import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_metrics')

      if (error) throw error
      return data
    },
    // Refetch more frequently as this is the primary dashboard
    refetchInterval: 30000, 
  })
}
