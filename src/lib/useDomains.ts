import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

export type Domain = { id: number; name: string }

export function useDomains() {
  return useQuery({
    queryKey: ['domains'],
    queryFn: async (): Promise<Domain[]> => {
      const { data, error } = await supabase.from('domains').select('id, name').order('id')
      if (error) throw error
      return data
    },
    staleTime: Infinity, // domains rarely change
  })
}
