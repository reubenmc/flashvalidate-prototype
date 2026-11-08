import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Box, Cpu, Hand, Sparkles } from 'lucide-react'
import { Viewport } from '../scene/Viewport'
import { useApp, useLive, isPostGeneration, isValidated, hasBird, type ScreenBox } from '../store'
import { BoxOverlay, type BoxMode } from './BoxOverlay'
import { Minimap } from './Minimap'
import { labelsFor } from '../data/photos'
import { BASELINE_DETECTIONS, BIRD_RESULT, MISS_CAPTION, MISS_TONE, SCENARIO_DETECTIONS } from '../data/results'
import { scenarioById, type ScenarioId } from '../data/scenarios'
import { cx } from './common'
import { Gallery } from './Gallery'

/** Fit a 3:2 box inside the available space. */
function useFit(aspect = 1.5) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const W = el.clientWidth
      const H = el.clientHeight
      const w = Math.min(W, H * aspect)
      setSize((s) => (Math.floor(w) === s.w ? s : { w: Math.floor(w), h: Math.floor(w / aspect) }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    const t = setInterval(measure, 500)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
      clearInterval(t)
    }
  }, [aspect])
  return { ref, size }
}

function Clock() {
  const [t, setT] = useState(() => new Date())
  useEffect(() => {
    const i = setInterval(() => setT(new Date()), 1000)
    return () => clearInterval(i)
  }, [])
  return <>{t.toLocaleTimeString('en-US', { hour12: false })}</>
}

const GEN_STEPS = [
  { key: 'depth', label: 'Estimating depth from CAM-03' },
  { key: 'lift', label: 'Generating 3D Gaussians · 4 denoising steps' },
  { key: 'labels', label: 'Transferring 7 object labels into 3D' },
] as const

export function ViewportStage() {
  const { ref, size } = useFit(1.5)
  const stage = useApp((s) => s.stage)
  const view = useApp((s) => s.view)
  const photos = useApp((s) => s.photos)
  const genPhase = useApp((s) => s.genPhase)
  const progress = useApp((s) => s.progress)
  const moving = useLive((s) => s.moving)
  const bird = useApp((s) => hasBird(s.customRows, s.disabledRows))
  const totalViews = 2400 + (bird ? BIRD_RESULT.views : 0)
  const liveBoxes = useLive((s) => s.boxes)
  const [toast, setToast] = useState(false)

  useEffect(() => {
    if (stage === 'explore') {
      setToast(true)
      const t = setTimeout(() => setToast(false), 4200)
      return () => clearTimeout(t)
    }
    setToast(false)
  }, [stage])

  const scen: ScenarioId | null = view === 'A' || view === 'B' || view === 'C' || view === 'D' ? view : null
  const post = isPostGeneration(stage)

  // Which still (if any) is on screen
  let shot: string | null = null
  if (stage === 'project' || (stage === 'generating' && genPhase === 'depth')) shot = 'scenario-a'
  else if (post && scen && !moving) shot = `scenario-${scen.toLowerCase()}`
  const photoUrl = shot ? photos[shot] : undefined
  const [lastSrc, setLastSrc] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (photoUrl) setLastSrc(photoUrl)
  }, [photoUrl])

  // Boxes
  let boxes: ScreenBox[] = []
  const staticBoxes = shot ? labelsFor(shot, !!photoUrl) : []
  if (shot && staticBoxes.length) boxes = staticBoxes
  else if (post) boxes = liveBoxes.filter((b) => b.w * b.h > 0.002)

  let mode: BoxMode = 'hidden'
  if (stage === 'project') mode = 'model'
  else if (stage === 'generating') mode = genPhase === 'labels' || genPhase === 'done' ? 'labels' : 'hidden'
  else if (stage === 'validating') mode = 'labels'
  else if (isValidated(stage) && scen && !moving) mode = 'results'
  else if (post) mode = 'labels'

  const outcomes = mode === 'model' ? BASELINE_DETECTIONS : scen ? SCENARIO_DETECTIONS[scen] : undefined
  const camLabel =
    stage === 'project' || stage === 'boot' || stage === 'generating'
      ? 'CAM-03 · Yard pole'
      : scen
        ? `Scenario ${scen} · ${scenarioById(scen).name}`
        : view === 'overview'
          ? 'Environment overview'
          : 'Free camera'

  return (
    <div ref={ref} className="relative min-h-0 flex-1 flex items-start justify-center">
      <div
        className="relative select-none overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-black/10 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_12px_32px_-12px_rgba(0,0,0,0.25)]"
        style={{ width: size.w, height: size.h }}
      >
        {size.w > 0 && <Viewport />}

        {/* Photoreal still for the current camera stop */}
        {lastSrc && (
          <img
            src={lastSrc}
            alt=""
            className={cx('pointer-events-none absolute inset-0 size-full object-cover transition-opacity duration-500', photoUrl ? 'opacity-100' : 'opacity-0')}
          />
        )}

        <BoxOverlay boxes={boxes} mode={mode} outcomes={outcomes} missCaption={scen ? MISS_CAPTION[scen] : null} missTone={scen ? MISS_TONE[scen] : 'rose'} />

        {/* Bird scenario: frame-level vs event-level scoring */}
        {mode === 'results' && scen === 'D' && (
          <div className="pointer-events-none absolute bottom-3 left-3 w-[300px] rounded-lg bg-black/65 p-2.5 text-white backdrop-blur fade-up">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium">Truck T-07 · 14 frames as the gull crosses</span>
              <span className="font-mono text-amber-300">{BIRD_RESULT.framesMissed} missed</span>
            </div>
            <div className="mt-1.5 flex gap-[3px]">
              {Array.from({ length: BIRD_RESULT.framesTotal }, (_, i) => (
                <div key={i} className={cx('h-3 flex-1 rounded-[2px]', i === 5 || i === 6 ? 'bg-amber-400' : 'bg-emerald-400')} />
              ))}
            </div>
            <div className="mt-1.5 text-[11px] text-white/75">Re-acquired by tracking within 0.4 s · event detected ✓</div>
          </div>
        )}

        {/* HUD */}
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
            {stage === 'project' ? (
              <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
            ) : (
              <Box className="size-3 text-teal-300" />
            )}
            {camLabel}
          </div>
          {post && mode === 'labels' && (
            <div className="rounded-md bg-teal-500/85 px-2 py-1 text-[11px] font-medium text-teal-950 backdrop-blur fade-up">Labels transferred</div>
          )}
          {mode === 'results' && (
            <div className="flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur fade-up">
              <Cpu className="size-3" /> Yard Detector v2.3
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute right-3 top-3 rounded-md bg-black/55 px-2 py-1 font-mono text-[11px] text-white/90 backdrop-blur">
          {stage === 'project' ? (
            <>
              2026-11-04 <Clock />
            </>
          ) : scen ? (
            <>
              h {scenarioById(scen).meta.cameraHeight} · {scenarioById(scen).conditions.time === 'night' ? 'night' : scenarioById(scen).conditions.weather === 'snow' ? 'snow' : 'day'}
            </>
          ) : (
            <>3DGS · 1.9M Gaussians</>
          )}
        </div>

        {post && <Minimap />}

        {(stage === 'explore' || stage === 'plan') && (
          <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 text-[11px] text-white backdrop-blur fade-up">
            <Hand className="size-3" /> Drag to orbit · scroll to zoom
          </div>
        )}

        {/* Generation overlay */}
        {stage === 'generating' && (
          <>
            {genPhase === 'depth' && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="scanline absolute inset-x-0 top-0 h-[12%] bg-gradient-to-b from-transparent via-teal-300/35 to-transparent" />
                <div className="absolute inset-0 bg-teal-950/10" />
              </div>
            )}
            <div className="pointer-events-none absolute left-1/2 bottom-5 -translate-x-1/2 w-[340px] rounded-xl bg-white/95 p-3.5 shadow-xl ring-1 ring-black/5 backdrop-blur fade-up">
              <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-zinc-900">
                <Sparkles className="size-4 text-teal-600" /> Generating 3D environment
              </div>
              {GEN_STEPS.map((s, i) => {
                const order = ['depth', 'lift', 'labels', 'done']
                const cur = order.indexOf(genPhase)
                const done = i < cur
                const active = i === cur
                return (
                  <div key={s.key} className={cx('flex items-center gap-2 py-0.5 text-[12px]', done ? 'text-zinc-500' : active ? 'text-zinc-900' : 'text-zinc-300')}>
                    <span className={cx('size-1.5 rounded-full', done ? 'bg-teal-500' : active ? 'bg-teal-500 animate-pulse' : 'bg-zinc-200')} />
                    {s.label}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {toast && (
          <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 flex items-center gap-2 rounded-full bg-zinc-900/90 py-1.5 pl-2 pr-3.5 text-[13px] text-white shadow-lg fade-up">
            <span className="grid size-5 place-items-center rounded-full bg-teal-500 text-[10px]">✓</span>
            3D environment generated in <span className="font-mono font-semibold text-teal-300">8.2 s</span>
          </div>
        )}

        {/* Validation run overlay */}
        {stage === 'validating' && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-zinc-950/35 backdrop-blur-[1px]">
            <div className="w-[380px] rounded-xl bg-white/95 p-4 shadow-xl ring-1 ring-black/5 fade-up">
              <div className="flex items-center justify-between text-[13px] font-semibold text-zinc-900">
                <span>Running Yard Detector v2.3</span>
                <span className="font-mono text-zinc-500 tabular">
                  {Math.round(progress * totalViews).toLocaleString()} / {totalViews.toLocaleString()}
                </span>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-teal-500" style={{ width: `${progress * 100}%` }} />
              </div>
              <div className="mt-2 text-[12px] text-zinc-500">48 camera positions × 5 conditions × 10 variations{bird ? ' + 240 seagull crossings' : ''}</div>
            </div>
          </div>
        )}

        {/* Improve: gallery takes over the stage */}
        {(stage === 'training' || stage === 'trained' || stage === 'exported') && <Gallery />}
      </div>
    </div>
  )
}
