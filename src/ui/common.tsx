import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  icon,
  disabled,
  loading,
  className,
  size = 'lg',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  icon?: ReactNode
  disabled?: boolean
  loading?: boolean
  className?: string
  size?: 'sm' | 'lg'
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all select-none',
        size === 'lg' ? 'h-11 px-4 text-[14px]' : 'h-8 px-3 text-[13px]',
        variant === 'primary' && 'bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.99] shadow-sm disabled:bg-zinc-300',
        variant === 'secondary' && 'bg-white text-zinc-800 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300',
        variant === 'ghost' && 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100',
        className,
      )}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  )
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-xl border border-zinc-200 bg-white', className)}>{children}</div>
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400', className)}>{children}</div>
}

export function Pill({ children, tone = 'zinc', className }: { children: ReactNode; tone?: 'zinc' | 'green' | 'rose' | 'amber' | 'teal'; className?: string }) {
  const tones = {
    zinc: 'bg-zinc-100 text-zinc-600',
    green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    rose: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    teal: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  }
  return <span className={cx('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold', tones[tone], className)}>{children}</span>
}

export function useCountUp(target: number, run: boolean, ms = 1100, from = 0) {
  const [v, setV] = useState(run ? from : target)
  const raf = useRef(0)
  useEffect(() => {
    if (!run) {
      setV(target)
      return
    }
    const t0 = performance.now()
    const tick = () => {
      const t = Math.min(1, (performance.now() - t0) / ms)
      const e = 1 - Math.pow(1 - t, 3)
      setV(from + (target - from) * e)
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, run, ms, from])
  return v
}

export function KV({ k, v, mono = true }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-[13px]">
      <span className="text-zinc-500">{k}</span>
      <span className={cx('text-zinc-900', mono && 'font-mono text-[12px]')}>{v}</span>
    </div>
  )
}
