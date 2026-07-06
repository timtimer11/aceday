import { supabase } from '../lib/supabase'

export type View = 'today' | 'week' | 'history'

const ITEMS: { id: View; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'history', label: 'Week History' },
]

type Props = {
  open: boolean
  onClose: () => void
  view: View
  setView: (v: View) => void
  email?: string
}

export default function Sidebar({ open, onClose, view, setView, email }: Props) {
  return (
    <>
      {/* Backdrop only on small screens; on desktop the sidebar pushes content. */}
      {open && (
        <div onClick={onClose} className="fixed inset-0 z-40 bg-black/60 md:hidden" aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r-[0.5px] border-line bg-card p-3 transition-transform ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-1 py-2">
          <span className="flex items-center gap-2 px-1">
            <img src="/logo-aceday.png" alt="" className="h-7 w-7 object-contain" />
            <span className="text-sm font-semibold text-ink">AceDay</span>
          </span>
          <button
            onClick={onClose}
            aria-label="Hide sidebar"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-white/5"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        </div>

        <nav className="mt-2 flex flex-col gap-0.5">
          {ITEMS.map((it) => (
            <button
              key={it.id}
              onClick={() => {
                setView(it.id)
                if (window.matchMedia('(max-width: 767px)').matches) onClose()
              }}
              className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                view === it.id ? 'bg-accent text-black' : 'text-ink hover:bg-white/5'
              }`}
            >
              {it.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto">
          {email && <div className="px-3 pb-1 text-xs text-muted">{email}</div>}
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-muted hover:bg-white/5"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
