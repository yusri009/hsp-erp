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

export function useDashboardProfit() {
  return useQuery({
    queryKey: ['dashboard-profit'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_profit_summary')

      if (error) throw error
      // RPC returns a table (array of rows), take the first row
      return data?.[0] || { total_revenue: 0, total_cost: 0, gross_profit: 0, total_expenses: 0, net_profit: 0 }
    },
    refetchInterval: 30000,
  })
}
