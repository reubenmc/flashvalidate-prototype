import { useState } from 'react'
import { AlertTriangle, ArrowRight, Bird as BirdIcon, Check, CheckCircle2, Copy, Cpu, Download, Layers, ListChecks, Sparkles, Wand2 } from 'lucide-react'
import { PlanPanel } from './PlanPanel'
import { useApp, useLive, hasBird } from '../store'
import { Button, Card, cx, KV, Pill, SectionLabel, useCountUp } from './common'
import { generate, generateTraining } from '../lib/flow'
import { exportDataset } from '../lib/exportDataset'
import { BIRD_RESULT, HEATMAP, HEAT_COLS, HEAT_ROWS, METRICS, PATTERNS, TRAINING_BREAKDOWN, TRAINING_TOTAL, objectById } from '../data/results'
import { scenarioById } from '../data/scenarios'

function ModelCard() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-lg bg-zinc-900 text-white">
          <Cpu className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-zinc-900">Yard Detector v2.3</div>
          <div className="text-[12px] text-zinc-500">YOLO-based · trucks, trailers · deployed 12 sites</div>
        </div>
        <Pill tone="green" className="ml-auto">
          Production
        </Pill>
      </div>
    </Card>
  )
}

function ProjectPanel() {
  const stage = useApp((s) => s.stage)
  return (
    <div className="flex flex-col gap-4 fade-up">
      <div>
        <SectionLabel>Project</SectionLabel>
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-zinc-900">Dockyard Vehicle Detection</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">Detects trucks and trailers arriving at Outpost yards from fixed cameras.</p>
      </div>
      <ModelCard />
      <Card className="p-4">
        <SectionLabel>Existing validation set</SectionLabel>
        <div className="mt-2 flex items-end gap-2">
          <div className="text-[44px] font-semibold leading-none tracking-tight text-zinc-900 tabular">96%</div>
          <div className="mb-1 text-[13px] text-zinc-500">recall</div>
          <Pill tone="green" className="mb-1.5 ml-auto">
            <Check className="size-3" strokeWidth={3} /> Passing
          </Pill>
        </div>
        <div className="mt-3 border-t border-zinc-100 pt-2">
          <KV k="Precision" v="94.1%" />
          <KV k="mAP@0.5" v="0.91" />
          <KV k="Test images" v="50 · 1,284 boxes" />
          <KV k="Last validated" v="3 days ago" mono={false} />
        </div>
      </Card>
      <Button onClick={generate} loading={stage === 'generating'} icon={<Sparkles className="size-4" />}>
        Generate Test Environments
      </Button>
      <p className="-mt-2 text-center text-[12px] text-zinc-400">Builds an explorable 3D world from each labeled image</p>
    </div>
  )
}

function GeneratingPanel() {
  return (
    <div className="flex flex-col gap-4 fade-up">
      <div>
        <SectionLabel>Generate</SectionLabel>
        <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-zinc-900">Building environment 1 of 50</h2>
        <p className="mt-1 text-[13px] text-zinc-500">CAM-03 · Yard pole → explorable 3D Gaussian scene</p>
      </div>
      <Card className="p-4">
        <KV k="Input" v="1 image · 7 labels" />
        <KV k="Model" v="FlashWorld" />
        <KV k="Views synthesized" v="24 · 480p" />
        <KV k="Denoising steps" v="4" />
      </Card>
      <Button loading>Generating…</Button>
    </div>
  )
}

function ExplorePanel() {
  const view = useApp((s) => s.view)
  const cam = useLive((s) => s.cam)
  const scen = view === 'A' || view === 'B' || view === 'C' ? scenarioById(view) : null
  return (
    <div className="flex flex-col gap-4 fade-up">
      <div>
        <SectionLabel>Generate</SectionLabel>
        <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-zinc-900">Explore the environment</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">One persistent 3D yard. Move the camera anywhere; every view stays labeled.</p>
      </div>
      <Card className="p-4">
        <div className="mb-1 flex items-center gap-2 text-[13px] font-semibold text-zinc-900">
          <CheckCircle2 className="size-4 text-teal-600" /> Generated in <span className="font-mono">8.2 s</span>
        </div>
        <KV k="Gaussians" v="1.9M" />
        <KV k="Labeled objects" v="7 (2 trucks, 5 trailers)" />
        <KV k="Environments ready" v="50 / 50" />
      </Card>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <SectionLabel>Camera</SectionLabel>
          <span className="text-[12px] font-medium text-zinc-700">{scen ? `Scenario ${scen.id}` : view === 'overview' ? 'Overview' : 'Free camera'}</span>
        </div>
        <div className="mt-1">
          <KV k="Height" v={scen ? scen.meta.cameraHeight : `${cam.height.toFixed(1)} m`} />
          <KV k="Pitch / yaw" v={scen ? `${scen.meta.pitch} / ${scen.meta.yaw}` : '—'} />
          <KV k="Lighting" v={scen ? scen.meta.lighting : 'Daylight · 32k lux'} />
          <KV k="Weather" v={scen ? scen.meta.weather : 'Clear'} />
          <KV k="Visibility" v={scen ? scen.meta.visibility : '> 1 km'} />
          <KV k="Occlusion" v={scen ? scen.meta.occlusion : '—'} />
        </div>
      </Card>
      <Button onClick={() => useApp.getState().setStage('plan')} icon={<ListChecks className="size-4" />}>
        Plan Validation
      </Button>
      <p className="-mt-2 text-center text-[12px] text-zinc-400">FlashValidate proposes what to test, and why</p>
    </div>
  )
}

function ValidatingPanel() {
  const progress = useApp((s) => s.progress)
  const total = useApp((s) => 2400 + (hasBird(s.customRows, s.disabledRows) ? BIRD_RESULT.views : 0))
  return (
    <div className="flex flex-col gap-4 fade-up">
      <div>
        <SectionLabel>Validate</SectionLabel>
        <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-zinc-900">Running validation sweep</h2>
      </div>
      <Card className="p-4">
        <KV k="Views evaluated" v={`${Math.round(progress * total).toLocaleString()} / ${total.toLocaleString()}`} />
        <KV k="Camera positions" v="48" />
        <KV k="Conditions" v="day · dusk · night · rain · snow" />
        <KV k="Model" v="yard-detector-v2.3" />
      </Card>
      <Button loading>Validating…</Button>
    </div>
  )
}

function Heatmap() {
  const color = (v: number) => (v >= 85 ? 'bg-emerald-500/85 text-white' : v >= 75 ? 'bg-emerald-300/80 text-emerald-950' : v >= 65 ? 'bg-amber-300 text-amber-950' : v >= 55 ? 'bg-rose-300 text-rose-950' : 'bg-rose-500 text-white')
  return (
    <div>
      <div className="grid grid-cols-[44px_repeat(5,1fr)] gap-1 text-[10px]">
        <div />
        {HEAT_COLS.map((c) => (
          <div key={c} className="text-center text-zinc-400">
            {c}
          </div>
        ))}
        {HEATMAP.map((row, r) => (
          <div key={r} className="contents">
            <div className="flex items-center font-mono text-zinc-400">{HEAT_ROWS[r]}</div>
            {row.map((v, c) => (
              <div key={c} className={cx('grid h-6 place-items-center rounded font-mono text-[10px] font-semibold', color(v))}>
                {v}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-1.5 text-[11px] text-zinc-400">Recall % by camera height × condition</div>
    </div>
  )
}

function ValidatedPanel() {
  const stage = useApp((s) => s.stage)
  const bird = useApp((s) => hasBird(s.customRows, s.disabledRows))
  const goToView = useApp((s) => s.goToView)
  const view = useApp((s) => s.view)
  const recall = useCountUp(METRICS.scenarioRecall, stage === 'validated', 1300, 96)
  return (
    <div className="flex flex-col gap-4 fade-up">
      <div>
        <SectionLabel>Validate</SectionLabel>
        <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-zinc-900">Validation results</h2>
      </div>
      <div className="grid grid-cols-[1fr_1fr_0.8fr] gap-2">
        <Card className="p-3">
          <div className="text-[11px] leading-tight text-zinc-500">Existing validation recall</div>
          <div className="mt-1.5 text-[26px] font-semibold leading-none tracking-tight text-zinc-400 tabular">96%</div>
        </Card>
        <Card className="border-rose-200 bg-rose-50/60 p-3">
          <div className="text-[11px] leading-tight text-rose-700">FlashValidate scenario recall</div>
          <div className="mt-1.5 text-[26px] font-semibold leading-none tracking-tight text-rose-600 tabular">{Math.round(recall)}%</div>
        </Card>
        <Card className="p-3">
          <div className="text-[11px] leading-tight text-zinc-500">Critical patterns</div>
          <div className="mt-1.5 text-[26px] font-semibold leading-none tracking-tight text-zinc-900">2</div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-start gap-2.5 border-b border-rose-100 bg-rose-50/70 p-3.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-600" />
          <div>
            <div className="text-[13px] font-semibold text-rose-900">Critical weakness discovered</div>
            <div className="mt-0.5 text-[12.5px] leading-relaxed text-rose-900/80">Yard Detector v2.3 frequently misses vehicles under low-angle, low-visibility, and partially occluded conditions.</div>
          </div>
        </div>
        <div className="divide-y divide-zinc-100">
          {PATTERNS.map((p) => (
            <button key={p.id} onClick={() => goToView(p.scenario)} className={cx('flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-zinc-50', view === p.scenario && 'bg-zinc-50')}>
              <span className={cx('grid size-6 shrink-0 place-items-center rounded-md text-[11px] font-bold', p.id === 1 ? 'bg-indigo-100 text-indigo-700' : 'bg-sky-100 text-sky-700')}>{p.id}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-zinc-900">{p.title}</div>
                <div className="truncate font-mono text-[11px] text-zinc-500">{p.condition}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[13px] font-semibold text-rose-600">{p.recall}%</div>
                <div className="text-[10px] text-zinc-400">{p.failures} misses</div>
              </div>
              <ArrowRight className="size-3.5 text-zinc-300" />
            </button>
          ))}
          {bird && (
            <button onClick={() => goToView('D')} className={cx('flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-zinc-50', view === 'D' && 'bg-zinc-50')}>
              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-amber-100 text-amber-700">
                <BirdIcon className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-zinc-900">Seagull crossing camera</div>
                <div className="truncate font-mono text-[11px] text-zinc-500">
                  frame {BIRD_RESULT.frameRecall}% · event {BIRD_RESULT.eventRecall}% · no action needed
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[13px] font-semibold text-amber-600">{BIRD_RESULT.eventRecall}%</div>
                <div className="text-[10px] text-zinc-400">tracked</div>
              </div>
              <ArrowRight className="size-3.5 text-zinc-300" />
            </button>
          )}
        </div>
      </Card>

      <Card className="p-3.5">
        <Heatmap />
      </Card>

      <Button onClick={generateTraining} icon={<Wand2 className="size-4" />}>
        Generate Targeted Training Data
      </Button>
    </div>
  )
}

function ImprovePanel() {
  const stage = useApp((s) => s.stage)
  const images = useApp((s) => s.trainingImages)
  const selectedId = useApp((s) => s.selectedImage)
  const setApiOpen = useApp((s) => s.setApiOpen)
  const [busy, setBusy] = useState(false)
  const sel = images.find((i) => i.id === selectedId)
  const training = stage === 'training'
  const exported = stage === 'exported'
  const doExport = async () => {
    setBusy(true)
    try {
      await exportDataset(images)
      useApp.getState().setStage('exported')
    } finally {
      setBusy(false)
    }
  }
  const total = useCountUp(TRAINING_TOTAL, stage === 'trained', 900)
  return (
    <div className="flex flex-col gap-4 fade-up">
      <div>
        <SectionLabel>Improve</SectionLabel>
        <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-zinc-900">Targeted training data</h2>
      </div>
      <Card className="p-4">
        <div className="flex items-end gap-2">
          <div className="text-[34px] font-semibold leading-none tracking-tight text-zinc-900 tabular">{training ? '—' : Math.round(total).toLocaleString()}</div>
          <div className="mb-0.5 text-[13px] text-zinc-500">new labeled images</div>
        </div>
        <div className="mt-3 space-y-2">
          {TRAINING_BREAKDOWN.map((b) => (
            <div key={b.key}>
              <div className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-1.5 text-zinc-700">
                  {b.pattern && <span className={cx('grid size-4 place-items-center rounded text-[9px] font-bold', b.pattern === 1 ? 'bg-indigo-100 text-indigo-700' : 'bg-sky-100 text-sky-700')}>{b.pattern}</span>}
                  {b.label}
                </span>
                <span className="font-mono text-zinc-900">{b.count}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div className={cx('h-full rounded-full transition-[width] duration-700', b.pattern === 1 ? 'bg-indigo-400' : b.pattern === 2 ? 'bg-sky-400' : 'bg-zinc-400')} style={{ width: training ? '0%' : `${(b.count / 400) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {sel && !training && (
        <Card className="p-4 fade-up">
          <div className="flex items-center justify-between">
            <SectionLabel>Selected image</SectionLabel>
            <span className="font-mono text-[11px] text-zinc-500">{sel.id}</span>
          </div>
          <div className="mt-1">
            <KV k="Objects" v={sel.boxes.map((b) => objectById(b.id).cls).join(', ') || '—'} />
            <KV
              k="Bounding boxes"
              v={sel.boxes.length ? `${sel.boxes.length} · [${Math.round(sel.boxes[0].x * sel.width)}, ${Math.round(sel.boxes[0].y * sel.height)}, ${Math.round(sel.boxes[0].w * sel.width)}, ${Math.round(sel.boxes[0].h * sel.height)}]` : '—'}
            />
            <KV k="Camera" v={`(${sel.camera.position.map((n) => n.toFixed(0)).join(', ')}) · h ${sel.camera.heightM.toFixed(1)} m`} />
            <KV k="Lighting" v={sel.conditions.time === 'night' ? 'Night · sodium' : sel.conditions.weather === 'snow' ? 'Overcast' : 'Daylight'} />
            <KV k="Weather" v={sel.conditions.weather === 'snow' ? 'Heavy snow' : 'Clear'} />
          </div>
        </Card>
      )}

      {!exported ? (
        <Button onClick={doExport} loading={busy || training} disabled={training} icon={<Download className="size-4" />}>
          Export Training Dataset
        </Button>
      ) : (
        <Card className="border-teal-200 bg-teal-50/60 p-4 fade-up">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-teal-600" />
            <div>
              <div className="text-[14px] font-semibold text-teal-950">Targeted training dataset ready for model refinement.</div>
              <div className="mt-1 text-[12px] text-teal-900/70">flashvalidate_outpost_targeted_sample.zip · COCO + CSV</div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="secondary" onClick={doExport} icon={<Download className="size-3.5" />}>
              Download again
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setApiOpen(true)} icon={<Layers className="size-3.5" />}>
              Automate this run
            </Button>
          </div>
        </Card>
      )}
      {exported && <ApiSnippet compact />}
    </div>
  )
}

export const API_SNIPPET = `import flashvalidate

run = flashvalidate.validate(
    model="yard-detector-v2.3",
    environment="outpost-dockyard",
    scenarios=["low_angle", "night", "snow", "occlusion"],
    generate_training_data=True,
)

print(run.recall)            # 0.74
run.training_set.export("coco", "s3://outpost-ml/fv/")`

export function ApiSnippet({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="overflow-hidden rounded-xl bg-zinc-950 ring-1 ring-black/10 fade-up">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="text-[11px] font-medium text-zinc-400">{compact ? 'Automate with API / MCP' : 'Python SDK'}</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(API_SNIPPET).catch(() => {})
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[11.5px] leading-[1.6] text-zinc-200">
        {API_SNIPPET.split('\n')
          .slice(0, compact ? 8 : undefined)
          .join('\n')}
      </pre>
    </div>
  )
}

export function Panels() {
  const stage = useApp((s) => s.stage)
  if (stage === 'boot')
    return (
      <div className="flex flex-col gap-3">
        <div className="shimmer h-6 w-40 rounded" />
        <div className="shimmer h-20 rounded-xl" />
        <div className="shimmer h-40 rounded-xl" />
      </div>
    )
  if (stage === 'project') return <ProjectPanel />
  if (stage === 'generating') return <GeneratingPanel />
  if (stage === 'explore') return <ExplorePanel />
  if (stage === 'plan') return <PlanPanel />
  if (stage === 'validating') return <ValidatingPanel />
  if (stage === 'validated') return <ValidatedPanel />
  return <ImprovePanel />
}
