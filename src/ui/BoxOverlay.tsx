import type { ScreenBox } from '../store'
import { objectById, type DetectionOutcome } from '../data/results'
import { cx } from './common'

export type BoxMode = 'labels' | 'model' | 'results' | 'hidden'

export function BoxOverlay({
  boxes,
  mode,
  outcomes,
  missCaption,
  compact = false,
  minTagWidth = 0,
  missTone = 'rose',
}: {
  boxes: ScreenBox[]
  mode: BoxMode
  outcomes?: Record<string, DetectionOutcome>
  missCaption?: string | null
  compact?: boolean
  minTagWidth?: number
  missTone?: 'rose' | 'amber'
}) {
  if (mode === 'hidden') return null
  return (
    <div className="pointer-events-none absolute inset-0">
      {boxes.map((b) => {
        const obj = objectById(b.id)
        const outcome = outcomes?.[b.id]
        const style = { left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` }
        if (obj.cls === 'occluder') {
          if (mode === 'model') return null
          return (
            <div key={b.id} className="absolute" style={style}>
              <div className="absolute inset-0 rounded-[3px] border-[1.5px] border-dashed border-white/80 bg-white/5" style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.25)' }} />
              {!compact && (
                <div className="absolute -top-[19px] left-0 whitespace-nowrap rounded-[3px] bg-white/90 px-1.5 py-[1px] font-mono text-[11px] font-semibold leading-[16px] text-zinc-800">
                  seagull · inserted
                </div>
              )}
            </div>
          )
        }
        if ((mode === 'model' || mode === 'results') && !outcome) return null
        const miss = mode === 'results' && outcome?.kind === 'miss'
        const conf = outcome?.kind === 'hit' ? outcome.conf : null
        const low = conf !== null && conf < 0.75
        const color = mode === 'labels' ? 'teal' : miss ? missTone : low ? 'amber' : 'green'
        const tagAbove = b.y > 0.06
        return (
          <div key={b.id} className="absolute transition-[left,top,width,height] duration-75" style={style}>
            {miss ? (
              <svg className="absolute inset-0 size-full overflow-visible">
                <rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  fill={missTone === 'amber' ? 'rgba(245,158,11,0.10)' : 'rgba(244,63,94,0.10)'}
                  stroke={missTone === 'amber' ? '#f59e0b' : '#f43f5e'}
                  strokeWidth="2.5"
                  strokeDasharray="9 6"
                  className="dash-march"
                />
              </svg>
            ) : (
              <div
                className={cx(
                  'absolute inset-0 rounded-[2px]',
                  color === 'teal' && 'border-[1.5px] border-teal-300/90 bg-teal-300/5',
                  color === 'green' && 'border-2 border-emerald-400 bg-emerald-400/5',
                  color === 'amber' && 'border-2 border-amber-400 bg-amber-400/5',
                )}
                style={{ boxShadow: color === 'teal' ? '0 0 0 1px rgba(0,0,0,0.25)' : '0 0 0 1px rgba(0,0,0,0.35)' }}
              />
            )}
            {!compact && b.w >= minTagWidth && <div
              className={cx(
                'absolute left-0 whitespace-nowrap px-1.5 py-[1px] text-[11px] font-semibold leading-[16px] rounded-[3px] font-mono',
                tagAbove ? '-top-[19px]' : 'top-0.5 left-0.5',
                color === 'teal' && 'bg-teal-300 text-teal-950',
                color === 'green' && 'bg-emerald-400 text-emerald-950',
                color === 'amber' && 'bg-amber-400 text-amber-950',
                color === 'rose' && 'bg-rose-500 text-white pulse-ring',
                miss && color === 'amber' && 'bg-amber-400 text-amber-950',
              )}
            >
              {mode === 'labels' && <>{obj.cls}</>}
              {(mode === 'model' || mode === 'results') && !miss && (
                <>
                  {obj.cls} {conf?.toFixed(2)}
                </>
              )}
              {miss && <>{missCaption ?? `Missed ${obj.cls} — false negative`}</>}
            </div>}
          </div>
        )
      })}
    </div>
  )
}
