function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-win" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12l5 5L20 7" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  )
}

type Props = {
  title: string
  done: boolean
  editable: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function TaskRow({ title, done, editable, onToggle, onEdit, onDelete }: Props) {
  return (
    <div
      onClick={onToggle}
      className={`flex cursor-pointer select-none items-center gap-2.5 rounded-[8px] border-[0.5px] px-3 py-2.5 transition-colors ${
        done ? 'border-win-border bg-win-bg' : 'border-line bg-surface'
      }`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${done ? 'bg-win' : 'bg-white/20'}`} />
      <span className={`flex-1 text-sm ${done ? 'font-medium text-win-strong' : 'text-ink'}`}>
        {title}
      </span>
      {done && <CheckIcon />}
      {editable && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          aria-label="Edit task"
          className="px-0.5 text-muted hover:text-accent"
        >
          <PencilIcon />
        </button>
      )}
      {editable && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          aria-label="Remove task"
          className="px-0.5 text-base leading-none text-muted hover:text-loss"
        >
          ×
        </button>
      )}
    </div>
  )
}
