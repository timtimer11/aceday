import { useState } from 'react'
import Board from './Board'
import WeeklyView from './WeeklyView'
import WeekHistory from './WeekHistory'
import Sidebar, { type View } from './Sidebar'

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export default function Shell({ userId, email }: { userId: string; email?: string }) {
  const [view, setView] = useState<View>('today')
  const [open, setOpen] = useState(true)

  return (
    <div className="min-h-full bg-bg">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open sidebar"
          className="fixed left-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-md text-ink hover:bg-white/5"
        >
          <MenuIcon />
        </button>
      )}

      <Sidebar
        open={open}
        onClose={() => setOpen(false)}
        view={view}
        setView={setView}
        email={email}
      />

      <div className={`transition-[margin] duration-200 ${open ? 'md:ml-64' : ''}`}>
        {view === 'today' ? (
          <Board userId={userId} />
        ) : view === 'week' ? (
          <WeeklyView onGoToday={() => setView('today')} />
        ) : (
          <WeekHistory />
        )}
      </div>
    </div>
  )
}
