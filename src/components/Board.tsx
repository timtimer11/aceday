import { useState } from 'react'
import { useToday, type TodayTask } from '../lib/useToday'
import { useDomains } from '../lib/useDomains'
import { useWeek } from '../lib/useWeek'
import { MIN_DOMAINS, MIN_TASKS, roundResult, weekdayName } from '../lib/day'
import Divider from './Divider'
import QuickAdd from './QuickAdd'
import TaskRow from './TaskRow'
import VerdictBar from './VerdictBar'

function dayOfWeek(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number)
  return ((new Date(y, m - 1, d).getDay() + 6) % 7) + 1 // Mon=1 … Sun=7
}

export default function Board({ userId }: { userId: string }) {
  const { today, day, isPending, error, addTask, toggleTask, deleteTask, updateTask } =
    useToday(userId)
  const { data: domains = [] } = useDomains()
  const { wins, losses } = useWeek()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<TodayTask | null>(null)
  const closeSheet = () => {
    setAdding(false)
    setEditing(null)
  }

  const tasks = day?.tasks ?? []
  const editable = !day?.locked_at

  const { total, completed } = roundResult(tasks)
  const domainCount = new Set(tasks.map((t) => t.domain_id)).size
  const ready = total >= MIN_TASKS && domainCount >= MIN_DOMAINS

  let hint = ''
  if (total < MIN_TASKS) {
    const need = MIN_TASKS - total
    hint = `Add ${need} more task${need > 1 ? 's' : ''} to start the round`
  } else if (domainCount < MIN_DOMAINS) {
    hint = `Cover at least ${MIN_DOMAINS} domains to start the round`
  }

  return (
    <div className="min-h-full bg-bg px-4 pb-28 pt-16">
      <div className="mx-auto flex max-w-[420px] flex-col gap-3.5 rounded-[14px] bg-card p-5">
        <header className="flex items-start justify-between">
          <div>
            <div className="text-xs tracking-[0.06em] text-muted">DAY {dayOfWeek(today)} OF 7</div>
            <div className="text-[18px] font-medium text-ink">{weekdayName(today)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs tracking-[0.06em] text-muted">SERIES</div>
            <div className="text-[18px] font-medium">
              <span className="text-win">{wins}</span>
              <span className="font-normal text-muted"> – </span>
              <span className="text-loss">{losses}</span>
            </div>
          </div>
        </header>

        <Divider />

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium tracking-[0.06em] text-muted">TASKS</span>
          {tasks.length > 0 && (
            <span className="ml-auto text-xs text-muted">tap the ones you did</span>
          )}
        </div>

        <section className="flex flex-col gap-1.5">
          {isPending && <p className="text-sm text-muted">Loading…</p>}
          {error && <p className="text-sm text-loss-strong">Error: {error.message}</p>}
          {!isPending && tasks.length === 0 && (
            <p className="text-sm text-muted">No tasks yet — add at least {MIN_TASKS} to start.</p>
          )}
          {tasks.map((t) => (
            <TaskRow
              key={t.id}
              title={t.title}
              done={t.done}
              editable={editable}
              onToggle={() => toggleTask.mutate({ id: t.id, done: !t.done })}
              onEdit={() => setEditing(t)}
              onDelete={() => deleteTask.mutate(t.id)}
            />
          ))}
        </section>

        {tasks.length > 0 && (
          <>
            <Divider />
            <VerdictBar ready={ready} hint={hint} completed={completed} total={total} />
          </>
        )}
      </div>

      {editable && !adding && !editing && (
        <button
          onClick={() => setAdding(true)}
          aria-label="Add task"
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-black shadow-lg"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}

      {editable && (adding || editing) && (
        <div onClick={closeSheet} className="fixed inset-0 z-40 bg-black/50" aria-hidden="true" />
      )}

      {editable && (adding || editing) && (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-[420px] rounded-[14px] border-[0.5px] border-line bg-surface p-4 shadow-[0_6px_30px_rgba(0,0,0,0.12)]">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-medium tracking-[0.06em] text-muted">
              {editing ? 'EDIT TASK' : 'ADD TASK'}
            </span>
            <button onClick={closeSheet} aria-label="Close" className="text-lg leading-none text-muted">
              ×
            </button>
          </div>
          <QuickAdd
            key={editing ? editing.id : 'add'}
            domains={domains}
            autoFocus
            initialTitle={editing?.title}
            initialDomainId={editing?.domain_id}
            submitLabel={editing ? 'Save' : 'Add'}
            onSubmit={(t, d) => {
              if (editing) {
                updateTask.mutate({ id: editing.id, title: t, domainId: d })
                setEditing(null)
              } else {
                addTask.mutate({ title: t, domainId: d })
              }
            }}
          />
        </div>
      )}
    </div>
  )
}
