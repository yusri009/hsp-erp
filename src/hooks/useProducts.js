import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useProducts(filters = {}) {
  const { tenantId } = useAuth()
  const { categoryId, size, color } = filters

  return useQuery({
    queryKey: ['products', tenantId, { categoryId, size, color }],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, categories(name)')
        .eq('tenant_id', tenantId)
        .order('sku', { ascending: true })

      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }
      if (size) {
        query = query.eq('size', size)
      }
      if (color) {
        query = query.eq('color', color)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!tenantId,
  })
}

export function useLowStockProducts(threshold = 5) {
  const { tenantId } = useAuth()

  return useQuery({
    queryKey: ['products', tenantId, 'low-stock', threshold],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('tenant_id', tenantId)
        .lte('stock_quantity', threshold)
        .order('stock_quantity', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!tenantId,
  })
}

export function useProductSizes(categoryId) {
  const { tenantId } = useAuth()

  return useQuery({
    queryKey: ['products', tenantId, 'sizes', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('size')
        .eq('tenant_id', tenantId)

      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }

      const { data, error } = await query
      if (error) throw error

      const uniqueSizes = [...new Set(data.map((p) => p.size).filter(Boolean))]
      return uniqueSizes.sort()
    },
    enabled: !!tenantId,
  })
}

export function useProductColors(categoryId, size) {
  const { tenantId } = useAuth()

  return useQuery({
    queryKey: ['products', tenantId, 'colors', categoryId, size],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('color')
        .eq('tenant_id', tenantId)

      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }
      if (size) {
        query = query.eq('size', size)
      }

      const { data, error } = await query
      if (error) throw error

      const uniqueColors = [...new Set(data.map((p) => p.color).filter(Boolean))]
      return uniqueColors.sort()
    },
    enabled: !!tenantId,
  })
}

export function useAddProduct() {
  const { tenantId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ categoryId, sku, size, color, piecesPerPacket, avgCost, sellingPrice }) => {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          tenant_id: tenantId,
          category_id: categoryId,
          sku: sku || null,
          size: size || null,
          color: color || null,
          pieces_per_packet: piecesPerPacket ? Number(piecesPerPacket) : null,
          avg_cost: avgCost ? Number(avgCost) : 0,
          selling_price: sellingPrice ? Number(sellingPrice) : 0,
          stock_quantity: 0
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useUpdateProduct() {
  const { tenantId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, categoryId, sku, size, color, piecesPerPacket, avgCost, sellingPrice }) => {
      const { data, error } = await supabase
        .from('products')
        .update({
          category_id: categoryId,
          sku: sku || null,
          size: size || null,
          color: color || null,
          pieces_per_packet: piecesPerPacket ? Number(piecesPerPacket) : null,
          avg_cost: avgCost ? Number(avgCost) : 0,
          selling_price: sellingPrice ? Number(sellingPrice) : 0,
        })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useDeleteProduct() {
  const { tenantId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('tenant_id', tenantId)

      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
