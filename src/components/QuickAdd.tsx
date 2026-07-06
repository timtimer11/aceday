import { useEffect, useState } from 'react'
import type { Domain } from '../lib/useDomains'

type Props = {
  domains: Domain[]
  onSubmit: (title: string, domainId: number) => void
  autoFocus?: boolean
  initialTitle?: string
  initialDomainId?: number
  submitLabel?: string
}

export default function QuickAdd({
  domains,
  onSubmit,
  autoFocus,
  initialTitle = '',
  initialDomainId,
  submitLabel = 'Add',
}: Props) {
  const [title, setTitle] = useState(initialTitle)
  const [domainId, setDomainId] = useState<number | undefined>(initialDomainId)

  useEffect(() => {
    if (domainId === undefined && domains.length) setDomainId(domains[0].id)
  }, [domains, domainId])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const t = title.trim()
    if (!t || domainId === undefined) return
    onSubmit(t, domainId)
    setTitle('')
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          autoFocus={autoFocus}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="add a task…"
          className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="rounded-md bg-accent px-4 text-sm font-medium text-black disabled:opacity-40"
        >
          {submitLabel}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {domains.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setDomainId(d.id)}
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
              domainId === d.id ? 'border-accent bg-accent text-black' : 'border-line text-muted'
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>
    </form>
  )
}
