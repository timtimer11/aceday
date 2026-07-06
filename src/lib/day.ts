/** Today's date as a plain local YYYY-MM-DD (the authoritative round key, no UTC). */
export function localToday(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Long weekday name for the header, e.g. "Wednesday". */
export function weekdayName(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long' })
}

/** Round verdict from a task list. Mirrors the day_scores SQL rule exactly. */
export function roundResult(tasks: { done: boolean }[]) {
  const total = tasks.length
  const completed = tasks.filter((t) => t.done).length
  const incomplete = total - completed
  const won = completed * 2 > total // "more than half"; ties and below lose
  return { total, completed, incomplete, won }
}

export const MIN_TASKS = 3
export const MIN_DOMAINS = 2

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function isoOf(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** The 7 local dates (Mon..Sun) of the week containing isoDate. */
export function weekDates(isoDate: string): string[] {
  const [y, m, d] = isoDate.split('-').map(Number)
  const base = new Date(y, m - 1, d)
  const mondayOffset = (base.getDay() + 6) % 7 // Mon=0 … Sun=6
  const monday = new Date(base)
  monday.setDate(base.getDate() - mondayOffset)
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday)
    x.setDate(monday.getDate() + i)
    return isoOf(x)
  })
}

/** Single-letter weekday labels for the strip, Mon..Sun. */
export const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/** CS2-style K/D: completed ("kills") over missed ("deaths"). Aggregate, like a match.
    Zero misses is a flawless (undefined/∞) ratio — strictly better than any finite K/D. */
export function formatKD(completed: number, missed: number): string {
  if (completed === 0 && missed === 0) return '—'
  if (missed === 0) return '∞'
  return (completed / missed).toFixed(2)
}

/** ISO-8601 week number + week-year for a local date (e.g. { year: 2026, week: 12 }). */
export function isoWeek(isoDate: string): { year: number; week: number } {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const dayNum = (date.getUTCDay() + 6) % 7 // Mon=0 … Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3) // Thursday of this week
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4))
  const ftDayNum = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - ftDayNum + 3)
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 86400000))
  return { year: date.getUTCFullYear(), week }
}
