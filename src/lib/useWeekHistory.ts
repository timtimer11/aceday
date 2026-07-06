import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'
import {
  localToday,
  weekDates,
  roundResult,
  MIN_TASKS,
  MIN_DOMAINS,
  isoWeek,
  WEEKDAY_LETTERS,
  formatKD,
} from './day'

export type HTask = { title: string; done: boolean; domain_id: number }
type HDay = { date: string; tasks: HTask[] }

export type DayCell = {
  date: string
  letter: string
  played: boolean
  total: number
  completed: number
  won: boolean
  tasks: HTask[]
}

export type Match = {
  key: string
  year: number
  week: number
  wins: number
  losses: number
  result: 'W' | 'L'
  kills: number
  deaths: number
  kd: string
  days: DayCell[]
}

function scoreOf(tasks: HTask[]) {
  const { total, completed } = roundResult(tasks)
  const domainCount = new Set(tasks.map((t) => t.domain_id)).size
  const valid = total >= MIN_TASKS && domainCount >= MIN_DOMAINS
  return { total, completed, won: valid && completed * 2 > total }
}

export function useWeekHistory() {
  const currentMonday = weekDates(localToday())[0]

  const query = useQuery({
    queryKey: ['history', currentMonday],
    queryFn: async (): Promise<HDay[]> => {
      const { data, error } = await supabase
        .from('days')
        .select('date, tasks(title, done, domain_id)')
        .lt('date', currentMonday) // completed weeks only
      if (error) throw error
      return data as HDay[]
    },
  })

  const groups = new Map<string, HDay[]>()
  for (const r of query.data ?? []) {
    const monday = weekDates(r.date)[0]
    const arr = groups.get(monday)
    if (arr) arr.push(r)
    else groups.set(monday, [r])
  }

  const matches: Match[] = [...groups.entries()]
    .map(([monday, logged]) => {
      const byDate = new Map(logged.map((d) => [d.date, d.tasks]))
      const days: DayCell[] = weekDates(monday).map((date, i) => {
        const tasks = byDate.get(date) ?? []
        const { total, completed, won } = scoreOf(tasks)
        return { date, letter: WEEKDAY_LETTERS[i], played: tasks.length > 0, total, completed, won, tasks }
      })
      const wins = days.filter((d) => d.won).length
      const losses = 7 - wins
      const kills = days.reduce((n, d) => n + d.completed, 0)
      const deaths = days.reduce((n, d) => n + (d.total - d.completed), 0)
      const { year, week } = isoWeek(monday)
      return {
        key: monday,
        year,
        week,
        wins,
        losses,
        result: (wins > losses ? 'W' : 'L') as 'W' | 'L',
        kills,
        deaths,
        kd: formatKD(kills, deaths),
        days,
      }
    })
    .sort((a, b) => (a.key < b.key ? 1 : -1))

  return { loading: query.isPending, error: query.error, matches }
}
