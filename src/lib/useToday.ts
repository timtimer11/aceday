import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { localToday } from './day'

export type TodayTask = { id: string; title: string; done: boolean; domain_id: number }
export type TodayDay = { id: string; date: string; locked_at: string | null; tasks: TodayTask[] }

export function useToday(userId: string) {
  const qc = useQueryClient()
  const today = localToday()
  const key = ['today', today] as const

  // Freeze elapsed days once on open (client asserts its local "today").
  useEffect(() => {
    supabase.rpc('lock_elapsed_days', { p_today: today })
  }, [today])

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<TodayDay | null> => {
      const { data, error } = await supabase
        .from('days')
        .select('id, date, locked_at, tasks(id, title, done, domain_id)')
        .eq('date', today)
        .order('created_at', { referencedTable: 'tasks', ascending: true })
        .maybeSingle()
      if (error) throw error
      return data as TodayDay | null
    },
  })

  const addTask = useMutation({
    mutationFn: async ({ title, domainId }: { title: string; domainId: number }) => {
      const { data: existing } = await supabase
        .from('days')
        .select('id')
        .eq('date', today)
        .maybeSingle()
      let dayId = existing?.id
      if (!dayId) {
        const { data: created, error } = await supabase
          .from('days')
          .insert({ date: today, user_id: userId })
          .select('id')
          .single()
        if (error) throw error
        dayId = created.id
      }
      const { error: tErr } = await supabase
        .from('tasks')
        .insert({ day_id: dayId, title, domain_id: domainId })
      if (tErr) throw tErr
    },
    onMutate: async ({ title, domainId }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<TodayDay | null>(key)
      const temp: TodayTask = { id: `temp-${crypto.randomUUID()}`, title, done: false, domain_id: domainId }
      qc.setQueryData<TodayDay | null>(key, (old) =>
        old
          ? { ...old, tasks: [...old.tasks, temp] }
          : { id: 'temp-day', date: today, locked_at: null, tasks: [temp] },
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => ctx && qc.setQueryData(key, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const toggleTask = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase.from('tasks').update({ done }).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<TodayDay | null>(key)
      qc.setQueryData<TodayDay | null>(key, (old) =>
        old ? { ...old, tasks: old.tasks.map((t) => (t.id === id ? { ...t, done } : t)) } : old,
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => ctx && qc.setQueryData(key, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<TodayDay | null>(key)
      qc.setQueryData<TodayDay | null>(key, (old) =>
        old ? { ...old, tasks: old.tasks.filter((t) => t.id !== id) } : old,
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => ctx && qc.setQueryData(key, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const updateTask = useMutation({
    mutationFn: async ({ id, title, domainId }: { id: string; title: string; domainId: number }) => {
      const { error } = await supabase.from('tasks').update({ title, domain_id: domainId }).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, title, domainId }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<TodayDay | null>(key)
      qc.setQueryData<TodayDay | null>(key, (old) =>
        old
          ? { ...old, tasks: old.tasks.map((t) => (t.id === id ? { ...t, title, domain_id: domainId } : t)) }
          : old,
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => ctx && qc.setQueryData(key, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  return {
    today,
    day: query.data,
    isPending: query.isPending,
    error: query.error,
    addTask,
    toggleTask,
    deleteTask,
    updateTask,
  }
}
