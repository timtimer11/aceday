import { useState } from 'react'
import { useWeek, type Cell } from '../lib/useWeek'
import { useDomains } from '../lib/useDomains'
import Divider from './Divider'
import DayStrip from './DayStrip'
import DayTasks from './DayTasks'

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted">{label}</span>
      <span className={`text-sm font-medium ${tone}`}>{value}</span>
    </div>
  )
}

export default function WeeklyView({ onGoToday }: { onGoToday: () => void }) {
  const { loading, error, cells, wins, losses, rating, kills, deaths, kd, hasData, mvpDomainId, liabilityDomainId } =
    useWeek()
  const { data: domains = [] } = useDomains()
  const name = (id: number | null) => domains.find((d) => d.id === id)?.name ?? '—'
  const [selectedDay, setSelectedDay] = useState<Cell | null>(null)

  if (selectedDay) {
    return (
      <div className="min-h-full bg-bg px-4 pb-28 pt-16">
        <div className="mx-auto flex max-w-[420px] flex-col gap-3 rounded-[14px] bg-card p-5">
          <DayTasks
            date={selectedDay.date}
            completed={selectedDay.completed}
            total={selectedDay.total}
            tasks={selectedDay.tasks}
            onBack={() => setSelectedDay(null)}
            backLabel="This Week"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-bg px-4 pb-28 pt-16">
      <div className="mx-auto flex max-w-[420px] flex-col gap-4 rounded-[14px] bg-card p-5">
        <header className="flex items-end justify-between">
          <div>
            <div className="text-xs tracking-[0.06em] text-muted">THIS WEEK</div>
            <div className="mt-1 flex gap-4">
              <div>
                <div className="text-[28px] font-medium leading-none text-win">{wins}</div>
                <div className="mt-1 text-[10px] tracking-[0.08em] text-muted">WON</div>
              </div>
              <div>
                <div className="text-[28px] font-medium leading-none text-loss">{losses}</div>
                <div className="mt-1 text-[10px] tracking-[0.08em] text-muted">LOST</div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs tracking-[0.06em] text-muted">K / D</div>
            <div className="mt-1 text-[26px] font-semibold leading-none text-accent">{kd}</div>
            <div className="mt-1 text-[11px] text-muted">
              {kills} <span className="text-win">✓</span> / {deaths} <span className="text-loss">✕</span>
            </div>
          </div>
        </header>

        <Divider />

        {loading && <p className="text-sm text-muted">Loading…</p>}
        {error && <p className="text-sm text-loss-strong">Error: {error.message}</p>}

        <DayStrip cells={cells} onSelect={(c) => (c.isToday ? onGoToday() : setSelectedDay(c))} />

        {hasData ? (
          <>
            <Divider />
            <div className="flex flex-col gap-2.5">
              <Stat label="Rating" value={`${Math.round(rating * 100)}%`} tone="text-ink" />
              <Stat label="MVP" value={name(mvpDomainId)} tone="text-win" />
              <Stat label="Biggest liability" value={name(liabilityDomainId)} tone="text-loss" />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">No tasks logged this week yet.</p>
        )}
      </div>
    </div>
  )
}
