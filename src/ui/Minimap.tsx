import { useApp, useLive, isValidated, hasBird } from '../store'
import { activeScenarios } from '../data/scenarios'
import { SWEEP } from '../data/results'
import { LAYOUT } from '../scene/Yard'

// Top-down plan of the yard. Same coordinates as the 3D scene (x → right, z → down).
const VB = { x: -58, y: -70, w: 116, h: 120 }

function Rect({ cx, cz, w, l, rot = 0, fill, stroke, rx = 0.6 }: { cx: number; cz: number; w: number; l: number; rot?: number; fill: string; stroke?: string; rx?: number }) {
  return (
    <rect
      x={cx - w / 2}
      y={cz - l / 2}
      width={w}
      height={l}
      rx={rx}
      fill={fill}
      stroke={stroke}
      strokeWidth={stroke ? 0.6 : 0}
      transform={`rotate(${(-rot * 180) / Math.PI} ${cx} ${cz})`}
    />
  )
}

function recallColor(r: number) {
  if (r >= 85) return '#10b981'
  if (r >= 70) return '#f59e0b'
  return '#f43f5e'
}

export function Minimap() {
  const cam = useLive((s) => s.cam)
  const stage = useApp((s) => s.stage)
  const view = useApp((s) => s.view)
  const goToView = useApp((s) => s.goToView)
  const bird = useApp((s) => hasBird(s.customRows, s.disabledRows))
  const showSweep = stage === 'validating' || isValidated(stage)
  const t07 = LAYOUT.t07
  const rotDeg = (-cam.yaw * 180) / Math.PI
  const half = Math.min(42, cam.fov / 2)
  const len = 26
  const wedge = `M0,0 L${-Math.tan((half * Math.PI) / 180) * len},${len} L${Math.tan((half * Math.PI) / 180) * len},${len} Z`
  return (
    <div className="absolute right-3 bottom-3 w-[168px] rounded-lg bg-white/90 backdrop-blur ring-1 ring-black/10 shadow-lg overflow-hidden fade-up">
      <div className="flex items-center justify-between px-2.5 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        <span>Yard map</span>
        <span className="font-mono normal-case tracking-normal text-zinc-400">h {cam.height.toFixed(1)} m</span>
      </div>
      <svg viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} className="block w-full" style={{ aspectRatio: `${VB.w}/${VB.h}` }}>
        <rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill="#e7e5df" />
        <rect x={-50} y={-66} width={100} height={106} fill="#a1a1aa" />
        <rect x={-46} y={-34} width={92} height={13} fill="#c4c4c8" />
        {/* fence */}
        <path d="M12,40 L-50,40 L-50,-66 L50,-66 L50,40 L27,40" fill="none" stroke="#71717a" strokeWidth={0.6} strokeDasharray="1.5 1" />
        {/* warehouse + office */}
        <rect x={-46} y={-62} width={92} height={28} fill="#52525b" rx={0.8} />
        <rect x={46} y={-47} width={12} height={14} fill="#52525b" rx={0.6} />
        {/* containers */}
        <rect x={-46.1} y={28.8} width={12.2} height={8.4} fill="#0e7490" opacity={0.75} />
        {/* gatehouse */}
        <rect x={29} y={30.3} width={4} height={3.4} fill="#e4e4e7" stroke="#71717a" strokeWidth={0.4} />
        {/* lane */}
        <line x1={19.5} y1={40} x2={19.5} y2={-16} stroke="#facc15" strokeWidth={0.5} strokeDasharray="2 2" />
        {/* trailers & trucks */}
        {LAYOUT.docked.map((d) => (
          <Rect key={d.id} cx={d.x} cz={-25.7} w={2.6} l={16} fill="#f4f4f5" stroke="#71717a" />
        ))}
        <Rect cx={LAYOUT.y4.pos[0]} cz={LAYOUT.y4.pos[2]} w={2.6} l={16} fill="#f4f4f5" stroke="#71717a" />
        <Rect cx={LAYOUT.b12.pos[0]} cz={LAYOUT.b12.pos[2] + 0.6} w={2.5} l={8.6} fill="#1e3a8a" />
        <g transform={`translate(${t07.pos[0]} ${t07.pos[2]}) rotate(${(-t07.rot * 180) / Math.PI})`}>
          <Rect cx={0} cz={9.5} w={2.6} l={16} fill="#f4f4f5" stroke="#71717a" />
          <Rect cx={0} cz={0} w={2.5} l={6.4} fill="#b91c1c" />
        </g>

        {/* sweep dots */}
        {showSweep &&
          SWEEP.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.z}
              r={1.9}
              fill={recallColor(p.recall)}
              stroke="white"
              strokeWidth={0.5}
              className="dot-pop"
              style={{ animationDelay: stage === 'validating' ? `${i * 95}ms` : '0ms' }}
            />
          ))}

        {/* scenario pins */}
        {stage !== 'project' &&
          activeScenarios(bird).map((s) => (
            <g key={s.id} transform={`translate(${s.pose.position[0] + (s.id === 'D' ? -7 : 0)} ${s.pose.position[2]})`} className="cursor-pointer" onClick={() => goToView(s.id)}>
              <circle r={3.6} fill={view === s.id ? '#0f766e' : 'white'} stroke="#0f766e" strokeWidth={0.8} />
              <text y={1.35} textAnchor="middle" fontSize={4} fontWeight={700} fill={view === s.id ? 'white' : '#0f766e'} fontFamily="Inter Variable, sans-serif">
                {s.id}
              </text>
            </g>
          ))}

        {/* live camera */}
        <g transform={`translate(${cam.x} ${cam.z}) rotate(${rotDeg})`}>
          <path d={wedge} fill="rgba(13,148,136,0.22)" stroke="rgba(13,148,136,0.7)" strokeWidth={0.5} />
          <circle r={2.2} fill="#0d9488" stroke="white" strokeWidth={0.8} />
        </g>
      </svg>
    </div>
  )
}
