import { useState } from 'react'
import { useWeekHistory, type Match, type DayCell } from '../lib/useWeekHistory'
import { weekdayName } from '../lib/day'
import Divider from './Divider'
import DayTasks from './DayTasks'

function Page({ children }: { children: React.ReactNode }) {
  return <div className="min-h-full bg-bg px-4 pb-28 pt-16">{children}</div>
}
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[420px] flex-col gap-3 rounded-[14px] bg-card p-5">
      {children}
    </div>
  )
}
function ResultPill({ r }: { r: 'W' | 'L' }) {
  return (
    <span
      className={`w-6 rounded px-1.5 py-0.5 text-center text-xs font-bold ${
        r === 'W' ? 'bg-win text-black' : 'bg-loss text-white'
      }`}
    >
      {r}
    </span>
  )
}

export default function WeekHistory() {
  const { loading, error, matches } = useWeekHistory()
  const [week, setWeek] = useState<Match | null>(null)
  const [day, setDay] = useState<DayCell | null>(null)

  // Level 3 — a single day's tasks
  if (week && day) {
    return (
      <Page>
        <Card>
          <DayTasks
            date={day.date}
            completed={day.completed}
            total={day.total}
            tasks={day.tasks}
            onBack={() => setDay(null)}
            backLabel={`W${week.week} ${week.year}`}
          />
        </Card>
      </Page>
    )
  }

  // Level 2 — the 7-day split of a week
  if (week) {
    return (
      <Page>
        <Card>
          <button onClick={() => setWeek(null)} className="self-start text-xs text-muted">
            ‹ Week History
          </button>
          <header className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs tracking-[0.06em] text-muted">
                W{week.week} {week.year}
                <ResultPill r={week.result} />
              </div>
              <div className="mt-1 flex gap-4">
                <div>
                  <div className="text-[28px] font-medium leading-none text-win">{week.wins}</div>
                  <div className="mt-1 text-[10px] tracking-[0.08em] text-muted">WON</div>
                </div>
                <div>
                  <div className="text-[28px] font-medium leading-none text-loss">{week.losses}</div>
                  <div className="mt-1 text-[10px] tracking-[0.08em] text-muted">LOST</div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs tracking-[0.06em] text-muted">K / D</div>
              <div className="mt-1 text-[26px] font-semibold leading-none text-accent">{week.kd}</div>
              <div className="mt-1 text-[11px] text-muted">
                {week.kills} <span className="text-win">✓</span> / {week.deaths}{' '}
                <span className="text-loss">✕</span>
              </div>
            </div>
          </header>
          <Divider />
          <ul className="flex flex-col gap-1.5">
            {week.days.map((d) => (
              <li key={d.date}>
                <button
                  disabled={!d.played}
                  onClick={() => setDay(d)}
                  className={`flex w-full items-center justify-between rounded-[8px] border-[0.5px] border-line bg-surface px-3 py-2.5 text-left ${
                    d.played ? '' : 'opacity-50'
                  }`}
                >
                  <span className="text-sm text-ink">{weekdayName(d.date)}</span>
                  <div className="flex items-center gap-3">
                    {d.played ? (
                      <>
                        <span className="text-sm tabular-nums text-ink">
                          {d.completed}
                          <span className="text-muted">-</span>
                          {d.total - d.completed}
                        </span>
                        <ResultPill r={d.won ? 'W' : 'L'} />
                      </>
                    ) : (
                      <span className="text-xs text-muted">no tasks</span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </Page>
    )
  }

  // Level 1 — the match list
  return (
    <Page>
      <Card>
        <header>
          <div className="text-xs tracking-[0.06em] text-muted">WEEK HISTORY</div>
        </header>
        <Divider />
        {loading && <p className="text-sm text-muted">Loading…</p>}
        {error && <p className="text-sm text-loss-strong">Error: {error.message}</p>}
        {!loading && matches.length === 0 && (
          <p className="text-sm text-muted">No completed weeks yet — check back after Sunday.</p>
        )}
        <ul className="flex flex-col gap-1.5">
          {matches.map((m) => (
            <li key={m.key}>
              <button
                onClick={() => setWeek(m)}
                className="flex w-full items-center justify-between rounded-[8px] border-[0.5px] border-line bg-surface px-3 py-2.5 text-left"
              >
                <span className="text-sm text-ink">
                  W{m.week} <span className="text-muted">{m.year}</span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm tabular-nums">
                    <span className="text-win">{m.wins}</span>
                    <span className="text-muted">–</span>
                    <span className="text-loss">{m.losses}</span>
                  </span>
                  <ResultPill r={m.result} />
                  <span className="text-muted">›</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </Page>
  )
}
