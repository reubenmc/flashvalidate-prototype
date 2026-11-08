import { useEffect, useRef, useState } from 'react'
import { Loader2, MapPin, Play, Plus, Sparkles } from 'lucide-react'
import { useApp } from '../store'
import { BASE_PLAN, DEPLOYMENT_PROFILE, SOURCE_LABEL, SUGGESTIONS, interpretScenario, type PlanMethod, type PlanRow, type PlanSource } from '../data/plan'
import { runValidation } from '../lib/flow'
import { Button, Card, cx, SectionLabel } from './common'

const METHOD_TONE: Record<PlanMethod, string> = {
  Viewpoint: 'bg-teal-50 text-teal-700 ring-teal-200',
  Lighting: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  Weather: 'bg-sky-50 text-sky-700 ring-sky-200',
  'Scene object': 'bg-amber-50 text-amber-700 ring-amber-200',
  Sensor: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
}

const SOURCE_DOT: Record<PlanSource, string> = {
  profile: 'bg-sky-400',
  gap: 'bg-rose-400',
  logs: 'bg-violet-400',
  custom: 'bg-amber-400',
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cx('relative h-[18px] w-[30px] shrink-0 rounded-full transition-colors', on ? 'bg-teal-600' : 'bg-zinc-300')} aria-pressed={on}>
      <span className={cx('absolute top-[2px] size-[14px] rounded-full bg-white shadow transition-all', on ? 'left-[14px]' : 'left-[2px]')} />
    </button>
  )
}

function Row({ row, isNew }: { row: PlanRow; isNew: boolean }) {
  const disabled = useApp((s) => s.disabledRows.includes(row.id))
  const toggle = useApp((s) => s.toggleRow)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (isNew) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [isNew])
  return (
    <div ref={ref} className={cx('flex gap-3 px-3.5 py-2.5 transition-opacity', disabled && 'opacity-45', isNew && 'fade-up bg-amber-50/40')}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={cx('rounded px-1.5 py-[1px] text-[10px] font-semibold ring-1', METHOD_TONE[row.method])}>{row.method}</span>
          <span className="truncate text-[13px] font-medium text-zinc-900">{row.title}</span>
        </div>
        <div className="mt-0.5 truncate font-mono text-[11px] text-zinc-500">{row.detail}</div>
        <div className="mt-1 text-[11px] leading-snug text-zinc-500">
          <span className={cx('mr-1.5 inline-block size-1.5 rounded-full align-middle', SOURCE_DOT[row.source])} />
          <span className="font-medium text-zinc-600">{SOURCE_LABEL[row.source]}</span> · {row.reason}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-between">
        <Toggle on={!disabled} onClick={() => toggle(row.id)} />
        <span className="font-mono text-[11px] text-zinc-400">{row.views}</span>
      </div>
    </div>
  )
}

export function PlanPanel() {
  const custom = useApp((s) => s.customRows)
  const disabled = useApp((s) => s.disabledRows)
  const addCustomRow = useApp((s) => s.addCustomRow)
  const goToView = useApp((s) => s.goToView)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [lastAdded, setLastAdded] = useState<string | null>(null)

  const rows = [...BASE_PLAN, ...custom]
  const total = rows.filter((r) => !disabled.includes(r.id)).reduce((a, r) => a + r.views, 0)

  const add = async (value: string) => {
    const v = value.trim()
    if (!v || busy) return
    setBusy(true)
    await new Promise((r) => setTimeout(r, 750))
    const row = interpretScenario(v, custom.length + 1)
    addCustomRow(row)
    setLastAdded(row.id)
    setText('')
    setBusy(false)
    if (row.bird) goToView('D', 1.2)
  }

  return (
    <div className="flex flex-col gap-4 fade-up">
      <div>
        <SectionLabel>Validate</SectionLabel>
        <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-zinc-900">Scenario plan</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">What FlashValidate will test, and why it chose each condition.</p>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[12px]">
        <MapPin className="size-3.5 shrink-0 text-zinc-400" />
        <span className="text-zinc-500">Deployment</span>
        <span className="truncate font-medium text-zinc-800">{DEPLOYMENT_PROFILE}</span>
      </div>

      <Card className="overflow-hidden">
        <div className="divide-y divide-zinc-100">
          {rows.map((r) => (
            <Row key={r.id} row={r} isNew={r.id === lastAdded} />
          ))}
          {busy && (
            <div className="flex items-center gap-2 px-3.5 py-3 text-[12px] text-zinc-500">
              <Loader2 className="size-3.5 animate-spin text-teal-600" /> Interpreting scenario…
            </div>
          )}
        </div>
        <div className="border-t border-zinc-100 bg-zinc-50/60 p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              add(text)
            }}
            className="flex items-center gap-2"
          >
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 focus-within:border-zinc-400">
              <Sparkles className="size-3.5 shrink-0 text-teal-600" />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add a scenario, e.g. a seagull flies past"
                className="h-9 w-full bg-transparent text-[13px] outline-none placeholder:text-zinc-400"
              />
            </div>
            <button type="submit" disabled={!text.trim() || busy} className="grid size-9 place-items-center rounded-lg bg-zinc-900 text-white disabled:bg-zinc-300">
              <Plus className="size-4" />
            </button>
          </form>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.filter((sug) => !custom.some((c) => c.prompt === sug)).map((sug) => (
              <button key={sug} onClick={() => add(sug)} className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-600 hover:border-zinc-300 hover:text-zinc-900">
                {sug}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="-mt-1 flex items-center justify-between px-1 text-[12px] text-zinc-500">
        <span>Across 50 environments</span>
        <span className="font-mono text-zinc-800">{total.toLocaleString()} labeled views</span>
      </div>

      <Button onClick={runValidation} icon={<Play className="size-4" />}>
        Run Model Validation
      </Button>
    </div>
  )
}
