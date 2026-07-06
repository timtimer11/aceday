import { useDomains } from '../lib/useDomains'
import { weekdayName } from '../lib/day'
import Divider from './Divider'

type Task = { title: string; done: boolean; domain_id: number }

type Props = {
  date: string
  completed: number
  total: number
  tasks: Task[]
  onBack: () => void
  backLabel: string
}

export default function DayTasks({ date, completed, total, tasks, onBack, backLabel }: Props) {
  const { data: domains = [] } = useDomains()
  const name = (id: number) => domains.find((d) => d.id === id)?.name ?? '—'
  const skipped = total - completed

  return (
    <>
      <button onClick={onBack} className="self-start text-xs text-muted">
        ‹ {backLabel}
      </button>
      <header>
        <div className="text-xs tracking-[0.06em] text-muted">
          {weekdayName(date).toUpperCase()} · {date}
        </div>
        <div className="text-[18px] font-medium text-ink">
          {completed} done{skipped > 0 && ` and ${skipped} skipped`}
        </div>
      </header>
      <Divider />
      {tasks.length === 0 ? (
        <p className="text-sm text-muted">No tasks were set this day.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {tasks.map((t, i) => (
            <li
              key={i}
              className={`flex items-center gap-2.5 rounded-[8px] border-[0.5px] px-3 py-2.5 ${
                t.done ? 'border-win-border bg-win-bg' : 'border-line bg-surface'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${t.done ? 'bg-win' : 'bg-white/20'}`} />
              <span className={`flex-1 text-sm ${t.done ? 'font-medium text-win-strong' : 'text-ink'}`}>
                {t.title}
              </span>
              <span className="text-xs text-muted">{name(t.domain_id)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
