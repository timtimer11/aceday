function TrophyIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
    </svg>
  )
}

function SkullIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <path d="M12 3a8 8 0 0 0-5 14v3h10v-3a8 8 0 0 0-5-14zM10 20v-2M14 20v-2" />
    </svg>
  )
}

function ClockIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

/** Hours remaining until local midnight. */
function hoursLeftToday(): number {
  const now = new Date()
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
  return (midnight.getTime() - now.getTime()) / 3_600_000
}

type Props = {
  ready: boolean
  hint: string
  completed: number
  total: number
}

export default function VerdictBar({ ready, hint, completed, total }: Props) {
  if (!ready) {
    return (
      <div className="rounded-[8px] bg-surface px-4 py-3 text-center text-sm text-muted">
        {hint}
      </div>
    )
  }

  const incomplete = total - completed
  const won = completed * 2 > total
  // The day isn't decided until it's over — only warn "losing" in the final stretch.
  const finalStretch = hoursLeftToday() <= 2

  const status = won ? 'winning' : finalStretch ? 'losing' : 'inprogress'
  const cfg = {
    winning: { bg: 'bg-win-bg', tone: 'text-win-strong', label: "You're winning this round" },
    losing: { bg: 'bg-loss-bg', tone: 'text-loss-strong', label: "You're losing this round" },
    inprogress: { bg: 'bg-surface', tone: 'text-ink', label: 'Round in progress' },
  }[status]

  return (
    <div className={`flex items-center justify-between rounded-[8px] px-3.5 py-3 ${cfg.bg}`}>
      <div className="flex items-center gap-2.5">
        {status === 'winning' ? (
          <TrophyIcon className={`h-5 w-5 ${cfg.tone}`} />
        ) : status === 'losing' ? (
          <SkullIcon className={`h-5 w-5 ${cfg.tone}`} />
        ) : (
          <ClockIcon className={`h-5 w-5 text-muted`} />
        )}
        <div>
          <div className={`text-[15px] font-medium ${cfg.tone}`}>{cfg.label}</div>
          <div className={`text-xs ${cfg.tone} opacity-80`}>
            {completed} of {total} done
          </div>
        </div>
      </div>
      <div className={`text-[22px] font-medium ${cfg.tone}`}>
        {completed}
        <span className="font-normal opacity-50">·</span>
        {incomplete}
      </div>
    </div>
  )
}
