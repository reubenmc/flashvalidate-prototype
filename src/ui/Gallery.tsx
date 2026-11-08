import { Loader2, Wand2 } from 'lucide-react'
import { useApp } from '../store'
import type { CapturedImage } from '../store'
import { BoxOverlay } from './BoxOverlay'
import { cx, Pill } from './common'
import { PATTERNS, TRAINING_TOTAL } from '../data/results'

function Thumb({ img, selected, onClick, delay }: { img: CapturedImage; selected: boolean; onClick: () => void; delay: number }) {
  const pattern = PATTERNS.find((p) => p.id === img.pattern)
  return (
    <button
      onClick={onClick}
      className={cx(
        'group relative overflow-hidden rounded-lg bg-zinc-800 text-left ring-2 transition-all fade-up',
        selected ? 'ring-teal-400' : 'ring-transparent hover:ring-white/40',
      )}
      style={{ aspectRatio: '3/2', animationDelay: `${delay}ms` }}
    >
      <img src={img.dataUrl} alt="" className="absolute inset-0 size-full object-cover" />
      <BoxOverlay boxes={img.boxes} mode="labels" minTagWidth={0.12} />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-5">
        <span className="font-mono text-[10px] text-white/90">
          h {img.camera.heightM.toFixed(1)} m · {img.conditions.time === 'night' ? 'night' : img.conditions.weather === 'snow' ? 'snow' : 'day'}
        </span>
        {pattern && (
          <span className={cx('rounded px-1.5 py-[1px] text-[10px] font-semibold', pattern.id === 1 ? 'bg-indigo-400 text-indigo-950' : 'bg-sky-300 text-sky-950')}>
            Pattern {pattern.id}
          </span>
        )}
      </div>
    </button>
  )
}

export function Gallery() {
  const stage = useApp((s) => s.stage)
  const images = useApp((s) => s.trainingImages)
  const selected = useApp((s) => s.selectedImage)
  const setSelected = useApp((s) => s.setSelectedImage)
  const progress = useApp((s) => s.progress)

  if (stage === 'training') {
    return (
      <div className="absolute inset-0 grid place-items-center bg-zinc-950/85 backdrop-blur-sm">
        <div className="w-[400px] rounded-xl bg-white p-4 shadow-2xl fade-up">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-zinc-900">
            <Wand2 className="size-4 text-teal-600" /> Generating targeted training data
          </div>
          <div className="mt-1 text-[12px] text-zinc-500">Sampling new viewpoints and conditions around the two failure patterns</div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full rounded-full bg-teal-500 transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-[12px] text-zinc-500 tabular">
            <span className="flex items-center gap-1.5">
              <Loader2 className="size-3 animate-spin" /> rendering + auto-labeling
            </span>
            <span>
              {Math.round(progress * TRAINING_TOTAL).toLocaleString()} / {TRAINING_TOTAL.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-950 p-3">
      <div className="mb-2.5 flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-[13px] font-medium text-white">
          Targeted training set
          <Pill tone="teal">{TRAINING_TOTAL.toLocaleString()} labeled images</Pill>
        </div>
        <div className="text-[12px] text-zinc-400">Showing 6 of {TRAINING_TOTAL.toLocaleString()} · boxes auto-generated from 3D labels</div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-3 content-center gap-2.5">
        {images.map((img, i) => (
          <Thumb key={img.id} img={img} selected={selected === img.id} onClick={() => setSelected(img.id)} delay={i * 70} />
        ))}
      </div>
    </div>
  )
}
