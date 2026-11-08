import { Check, Code2, RotateCcw, User } from 'lucide-react'
import { useApp, type Stage } from '../store'
import { cx } from './common'

const STEPS = ['Input', 'Generate', 'Validate', 'Improve'] as const

function stepIndex(s: Stage) {
  if (s === 'boot' || s === 'project') return 0
  if (s === 'generating' || s === 'explore') return 1
  if (s === 'plan' || s === 'validating' || s === 'validated') return 2
  return 3
}

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 32 32" className="size-7">
        <rect width="32" height="32" rx="8" fill="#0f766e" />
        <path d="M9 22 16 8l7 14H9z" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
        <circle cx="16" cy="18" r="2.2" fill="#5eead4" />
      </svg>
      <span className="text-[15px] font-semibold tracking-tight text-zinc-900">FlashValidate</span>
    </div>
  )
}

export function TopBar() {
  const stage = useApp((s) => s.stage)
  const reset = useApp((s) => s.reset)
  const setApiOpen = useApp((s) => s.setApiOpen)
  const idx = stepIndex(stage)
  const complete = stage === 'exported'
  return (
    <header className="h-14 shrink-0 border-b border-zinc-200 bg-white/80 backdrop-blur flex items-center px-5 gap-6">
      <Logo />
      <div className="h-5 w-px bg-zinc-200" />
      <div className="flex items-center gap-1.5 text-[13px] min-w-0">
        <span className="text-zinc-500">Outpost</span>
        <span className="text-zinc-300">/</span>
        <span className="font-medium text-zinc-900 truncate">Dockyard Vehicle Detection</span>
      </div>

      <nav className="mx-auto flex items-center gap-1">
        {STEPS.map((s, i) => {
          const done = i < idx || complete
          const active = i === idx && !complete
          return (
            <div key={s} className="flex items-center gap-1">
              <div
                className={cx(
                  'flex items-center gap-2 rounded-full pl-1 pr-3 h-7 text-[13px] transition-colors',
                  active && 'bg-zinc-900 text-white',
                  done && 'text-zinc-700',
                  !active && !done && 'text-zinc-400',
                )}
              >
                <span
                  className={cx(
                    'grid place-items-center size-5 rounded-full text-[11px] font-semibold',
                    active && 'bg-white/15',
                    done && 'bg-teal-600 text-white',
                    !active && !done && 'bg-zinc-100',
                  )}
                >
                  {done ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                </span>
                {s}
              </div>
              {i < STEPS.length - 1 && <div className={cx('w-6 h-px', i < idx ? 'bg-teal-600' : 'bg-zinc-200')} />}
            </div>
          )
        })}
      </nav>

      <div className="flex items-center gap-1">
        <button onClick={() => setApiOpen(true)} className="h-8 px-3 rounded-lg text-[13px] text-zinc-600 hover:bg-zinc-100 flex items-center gap-1.5">
          <Code2 className="size-4" /> API
        </button>
        <button onClick={reset} disabled={stage === 'boot'} className="h-8 px-3 rounded-lg text-[13px] text-zinc-600 hover:bg-zinc-100 flex items-center gap-1.5">
          <RotateCcw className="size-4" /> Reset
        </button>
        <div className="ml-2 size-7 rounded-full bg-gradient-to-br from-teal-500 to-sky-600 text-white grid place-items-center">
          <User className="size-4" />
        </div>
      </div>
    </header>
  )
}
