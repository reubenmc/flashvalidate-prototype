import { Bird, Moon, Snowflake, Sun, Upload } from 'lucide-react'
import { useApp, useLive, isPostGeneration, isValidated, hasBird } from '../store'
import { activeScenarios } from '../data/scenarios'
import { SCENARIO_STATUS } from '../data/results'
import { DATASET_SHOTS } from '../lib/flow'
import { labelsFor } from '../data/photos'
import { BoxOverlay } from './BoxOverlay'
import { cx } from './common'

function DatasetStrip() {
  const thumbs = useApp((s) => s.thumbs)
  const photos = useApp((s) => s.photos)
  const stage = useApp((s) => s.stage)
  return (
    <div className={cx('flex h-full items-stretch gap-2.5 transition-opacity', stage === 'generating' && 'opacity-50')}>
      <div className="flex w-[150px] shrink-0 flex-col justify-center rounded-lg border border-zinc-200 bg-white px-3">
        <div className="text-[12px] text-zinc-500">Labeled images</div>
        <div className="text-[22px] font-semibold tracking-tight text-zinc-900">50</div>
        <div className="text-[11px] text-zinc-400">4 cameras · 1,284 boxes</div>
      </div>
      {DATASET_SHOTS.map((id, i) => (
        <div key={id} className="relative aspect-[3/2] h-full shrink-0 overflow-hidden rounded-lg bg-zinc-200 ring-1 ring-black/5">
          {thumbs[id] ? <img src={thumbs[id]} alt="" className="absolute inset-0 size-full object-cover" /> : <div className="shimmer absolute inset-0" />}
          {thumbs[id] && <BoxOverlay boxes={labelsFor(id, !!photos[id]).map((b) => b)} mode="labels" compact />}
          <div className="absolute left-1 top-1 rounded bg-black/55 px-1 font-mono text-[9px] text-white">CAM-0{[3, 1, 2, 4][i]}</div>
        </div>
      ))}
      <div className="grid aspect-[3/2] h-full shrink-0 place-items-center rounded-lg border border-dashed border-zinc-300 text-[12px] text-zinc-500">
        <div className="text-center">
          <div className="font-medium text-zinc-700">+46</div>
          <button className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600">
            <Upload className="size-3" /> Add images
          </button>
        </div>
      </div>
    </div>
  )
}

function ScenarioBar() {
  const view = useApp((s) => s.view)
  const stage = useApp((s) => s.stage)
  const goToView = useApp((s) => s.goToView)
  const moving = useLive((s) => s.moving)
  const bird = useApp((s) => hasBird(s.customRows, s.disabledRows))
  const list = activeScenarios(bird)
  const validated = isValidated(stage)
  const disabled = stage === 'validating' || stage === 'training'
  return (
    <div className={cx('grid h-full gap-2.5', list.length === 4 ? 'grid-cols-4' : 'grid-cols-3')}>
      {list.map((s) => {
        const active = view === s.id
        const status = SCENARIO_STATUS[s.id]
        const Icon = s.id === 'D' ? Bird : s.conditions.time === 'night' ? Moon : s.conditions.weather === 'snow' ? Snowflake : Sun
        return (
          <button
            key={s.id}
            disabled={disabled}
            onClick={() => goToView(s.id)}
            className={cx(
              'relative flex flex-col justify-between rounded-lg border bg-white px-3 py-2.5 text-left transition-all',
              active ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200 hover:border-zinc-300',
              validated && status === 'fail' && !active && 'border-rose-200',
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <span className={cx('grid size-6 shrink-0 place-items-center rounded-md text-[12px] font-semibold', active ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700')}>{s.id}</span>
                <span className="truncate text-[13px] font-semibold text-zinc-900">{s.name}</span>
              </div>
              {validated ? (
                <span
                  className={cx(
                    'rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide fade-up',
                    status === 'pass' && 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
                    status === 'fail' && 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
                    status === 'tracked' && 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
                  )}
                >
                  {status === 'pass' ? 'PASS' : status === 'fail' ? 'FAIL' : 'TRACKED'}
                </span>
              ) : (
                <Icon className="size-4 text-zinc-400" />
              )}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-x-2 font-mono text-[11px] text-zinc-500">
              <div>
                <div className="text-[10px] font-sans text-zinc-400">Height</div>
                <div className="text-zinc-800">{s.meta.cameraHeight}</div>
              </div>
              <div>
                <div className="text-[10px] font-sans text-zinc-400">Lighting</div>
                <div className="truncate text-zinc-800">{s.meta.lighting.split(' · ')[0]}</div>
              </div>
              <div>
                <div className="text-[10px] font-sans text-zinc-400">Occlusion</div>
                <div className="truncate text-zinc-800">{s.meta.occlusion.split(' ')[0]}</div>
              </div>
            </div>
            {active && moving && <div className="absolute inset-x-3 bottom-0 h-0.5 overflow-hidden rounded-full bg-zinc-100"><div className="h-full w-1/3 animate-pulse bg-teal-500" /></div>}
          </button>
        )
      })}
    </div>
  )
}

export function BottomStrip() {
  const stage = useApp((s) => s.stage)
  return <div className="h-[108px] shrink-0">{isPostGeneration(stage) ? <ScenarioBar /> : <DatasetStrip />}</div>
}
