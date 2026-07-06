import type { Cell } from '../lib/useWeek'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function DayStrip({
  cells,
  onSelect,
}: {
  cells: Cell[]
  onSelect?: (c: Cell) => void
}) {
  return (
    <div className="flex justify-between gap-1.5">
      {cells.map((c) => {
        const tone = c.state === 'win' ? 'win' : c.state === 'loss' ? 'loss' : 'none'

        // Finished days are filled (green won / red lost). Today is outlined and
        // "live" — border + pulsing dot show current standing (green ahead, red behind).
        const cellClass = c.isToday
          ? tone === 'win'
            ? 'border-2 border-win'
            : tone === 'loss'
              ? 'border-2 border-loss'
              : 'border-2 border-line'
          : tone === 'win'
            ? 'bg-win'
            : tone === 'loss'
              ? 'bg-loss'
              : 'bg-line'
        const dotClass = tone === 'win' ? 'bg-win' : tone === 'loss' ? 'bg-loss' : 'bg-muted'
        const toneText = tone === 'win' ? 'text-win' : tone === 'loss' ? 'text-loss' : 'text-muted'

        const [, m, d] = c.date.split('-').map(Number)

        return (
          <button
            key={c.date}
            type="button"
            disabled={!onSelect || !c.played}
            onClick={() => onSelect?.(c)}
            className="flex flex-1 flex-col items-center gap-1.5 disabled:cursor-default"
          >
            <span
              className={`text-[11px] leading-none ${
                c.isToday ? `font-semibold ${toneText}` : 'text-muted'
              }`}
            >
              {c.letter}
            </span>

            <div
              className={`flex aspect-square w-full items-center justify-center rounded-[6px] ${cellClass}`}
            >
              {c.isToday && <span className={`h-1.5 w-1.5 rounded-full ${dotClass} animate-pulse`} />}
            </div>

            {c.isToday ? (
              <span className={`text-[9px] font-bold leading-none tracking-wide ${toneText}`}>
                LIVE
              </span>
            ) : (
              <span className="text-[9px] leading-none text-muted">
                {MONTHS[m - 1]} {d}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
