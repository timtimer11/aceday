import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'
import { localToday, weekDates, roundResult, MIN_TASKS, MIN_DOMAINS, WEEKDAY_LETTERS, formatKD } from './day'

export type WeekTask = { title: string; done: boolean; domain_id: number }
type WeekDayRow = { date: string; tasks: WeekTask[] }

export type CellState = 'win' | 'loss' | 'future'
export type Cell = {
  date: string
  letter: string
  state: CellState
  isToday: boolean
  played: boolean
  completed: number
  total: number
  tasks: WeekTask[]
}

function validWon(tasks: WeekTask[]) {
  const { total, completed } = roundResult(tasks)
  const domainCount = new Set(tasks.map((t) => t.domain_id)).size
  const valid = total >= MIN_TASKS && domainCount >= MIN_DOMAINS
  return { valid, won: valid && completed * 2 > total }
}

export function useWeek() {
  const today = localToday()
  const dates = weekDates(today)
  const start = dates[0]
  const end = dates[6]

  const query = useQuery({
    queryKey: ['week', start],
    queryFn: async (): Promise<WeekDayRow[]> => {
      const { data, error } = await supabase
        .from('days')
        .select('date, tasks(title, done, domain_id)')
        .gte('date', start)
        .lte('date', end)
      if (error) throw error
      return data as WeekDayRow[]
    },
  })

  const rows = query.data ?? []
  const byDate = new Map(rows.map((r) => [r.date, r.tasks]))

  // Day strip + series (past days only; "no neutral days" => unplayed past = loss).
  let wins = 0
  let losses = 0
  const cells: Cell[] = dates.map((date, i) => {
    const tasks = byDate.get(date) ?? []
    const { total, completed } = roundResult(tasks)
    const isToday = date === today
    let state: CellState
    if (date > today) {
      state = 'future'
    } else if (isToday) {
      state = tasks.length === 0 ? 'future' : validWon(tasks).won ? 'win' : 'loss'
    } else {
      const won = validWon(tasks).won
      if (won) wins++
      else losses++
      state = won ? 'win' : 'loss'
    }
    return {
      date,
      letter: WEEKDAY_LETTERS[i],
      state,
      isToday,
      played: tasks.length > 0,
      completed,
      total,
      tasks,
    }
  })

  // Aggregates (rating, K/D, MVP, liability) count only FINISHED days. Today is
  // still in progress and future days haven't started, so their undone tasks are
  // not "misses" yet — counting them would show fake losses like "0 ✓ / 6 ✕".
  const allTasks = rows.filter((r) => r.date < today).flatMap((r) => r.tasks)
  const totalAll = allTasks.length
  const completedAll = allTasks.filter((t) => t.done).length
  const deathsAll = totalAll - completedAll
  const rating = totalAll ? completedAll / totalAll : 0

  const perDomain = new Map<number, { completed: number; skipped: number }>()
  for (const t of allTasks) {
    const e = perDomain.get(t.domain_id) ?? { completed: 0, skipped: 0 }
    if (t.done) e.completed++
    else e.skipped++
    perDomain.set(t.domain_id, e)
  }
  let mvpDomainId: number | null = null
  let liabilityDomainId: number | null = null
  let mvpC = 0
  let liabS = 0
  for (const [id, e] of perDomain) {
    if (e.completed > mvpC) {
      mvpC = e.completed
      mvpDomainId = id
    }
    if (e.skipped > liabS) {
      liabS = e.skipped
      liabilityDomainId = id
    }
  }

  return {
    loading: query.isPending,
    error: query.error,
    cells,
    wins,
    losses,
    rating,
    kills: completedAll,
    deaths: deathsAll,
    kd: formatKD(completedAll, deathsAll),
    hasData: totalAll > 0,
    mvpDomainId,
    liabilityDomainId,
  }
}
