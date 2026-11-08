// Prepared validation results, sweep data and training-set plan.
// Detection outcomes are deterministic so the demo is repeatable.

import type { ScenarioId } from './scenarios'

export type LabelClass = 'truck' | 'trailer' | 'occluder'

export interface LabeledObject {
  id: string
  cls: LabelClass
  name: string
}

export const LABELED_OBJECTS: LabeledObject[] = [
  { id: 't07-cab', cls: 'truck', name: 'Truck T-07' },
  { id: 't07-trailer', cls: 'trailer', name: 'Trailer T-07' },
  { id: 'd1', cls: 'trailer', name: 'Trailer D-1' },
  { id: 'd2', cls: 'trailer', name: 'Trailer D-2' },
  { id: 'd3', cls: 'trailer', name: 'Trailer D-3' },
  { id: 'y4', cls: 'trailer', name: 'Trailer Y-4' },
  { id: 'b12', cls: 'truck', name: 'Box truck B-12' },
  // Inserted scene object (not a detection class): tracked so we know what it hides
  { id: 'gull', cls: 'occluder', name: 'Seagull' },
]

export const objectById = (id: string) => LABELED_OBJECTS.find((o) => o.id === id)!

export type DetectionOutcome = { kind: 'hit'; conf: number } | { kind: 'miss' }

// Outcome per object per view. Objects not listed (or out of frame) aren't drawn.
export const BASELINE_DETECTIONS: Record<string, DetectionOutcome> = {
  't07-cab': { kind: 'hit', conf: 0.98 },
  't07-trailer': { kind: 'hit', conf: 0.97 },
  d1: { kind: 'hit', conf: 0.94 },
  d2: { kind: 'hit', conf: 0.96 },
  d3: { kind: 'hit', conf: 0.93 },
  y4: { kind: 'hit', conf: 0.9 },
  b12: { kind: 'hit', conf: 0.95 },
}

export const SCENARIO_DETECTIONS: Record<ScenarioId, Record<string, DetectionOutcome>> = {
  A: BASELINE_DETECTIONS,
  B: {
    't07-cab': { kind: 'miss' },
    't07-trailer': { kind: 'hit', conf: 0.71 },
    d1: { kind: 'hit', conf: 0.88 },
    d2: { kind: 'hit', conf: 0.86 },
    d3: { kind: 'hit', conf: 0.9 },
    b12: { kind: 'hit', conf: 0.82 },
  },
  C: {
    y4: { kind: 'miss' },
    b12: { kind: 'hit', conf: 0.9 },
    d1: { kind: 'hit', conf: 0.84 },
    d2: { kind: 'hit', conf: 0.79 },
    't07-cab': { kind: 'hit', conf: 0.87 },
    't07-trailer': { kind: 'hit', conf: 0.85 },
  },
  D: {
    't07-cab': { kind: 'miss' },
    't07-trailer': { kind: 'hit', conf: 0.93 },
    y4: { kind: 'hit', conf: 0.9 },
  },
}

export const SCENARIO_STATUS: Record<ScenarioId, 'pass' | 'fail' | 'tracked'> = {
  A: 'pass',
  B: 'fail',
  C: 'fail',
  D: 'tracked',
}

export const MISS_CAPTION: Record<ScenarioId, string | null> = {
  A: null,
  B: 'Missed truck — false negative',
  C: 'Missed trailer — false negative',
  D: 'Missed this frame — re-acquired 0.4 s later',
}

/** Misses that tracking recovers are warnings, not failures. */
export const MISS_TONE: Record<ScenarioId, 'rose' | 'amber'> = { A: 'rose', B: 'rose', C: 'rose', D: 'amber' }

/** Event-level result for the bird scenario (frame vs. event scoring). */
export const BIRD_RESULT = {
  frameRecall: 81,
  eventRecall: 100,
  framesMissed: 2,
  framesTotal: 14,
  views: 240,
}

// Headline metrics
export const METRICS = {
  existingRecall: 96,
  scenarioRecall: 74,
  patterns: 2,
  viewsTested: 2400,
  cameraPositions: 48,
  conditions: 5,
}

// Recall heatmap: camera height (rows) × condition (cols). Mean ≈ 74%.
export const HEAT_ROWS = ['10 m', '6 m', '2.5 m', '1 m']
export const HEAT_COLS = ['Day', 'Dusk', 'Night', 'Rain', 'Snow']
export const HEATMAP: number[][] = [
  [95, 92, 77, 84, 72],
  [93, 88, 66, 80, 64],
  [87, 80, 58, 70, 60],
  [83, 72, 47, 62, 52],
]

export interface FailurePattern {
  id: 1 | 2
  title: string
  condition: string
  recall: number
  failures: number
  scenario: ScenarioId
}

export const PATTERNS: FailurePattern[] = [
  {
    id: 1,
    title: 'Low camera at night',
    condition: 'Camera ≤ 2.5 m · illumination < 10 lux',
    recall: 53,
    failures: 412,
    scenario: 'B',
  },
  {
    id: 2,
    title: 'Occluded in snow',
    condition: 'Occlusion > 40% · snowfall',
    recall: 58,
    failures: 287,
    scenario: 'C',
  },
]

// 48 sweep positions on an 8 × 6 grid inside the fence, with recall per position.
export interface SweepPoint {
  x: number
  z: number
  recall: number
}

export const SWEEP: SweepPoint[] = (() => {
  const pts: SweepPoint[] = []
  const xs = [-42, -30, -18, -6, 6, 18, 30, 42]
  const zs = [-26, -13, 0, 13, 26, 37]
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  for (const z of zs) {
    for (const x of xs) {
      let r = 88 + rand() * 8
      // West side: box truck occludes the parked trailer
      if (x <= -30 && z >= -13 && z <= 26) r -= 26 + rand() * 8
      // Low positions near the barriers, facing the approaching truck
      if (x >= -6 && x <= 18 && z <= -13) r -= 30 + rand() * 8
      if (x >= -6 && x <= 6 && z === 0) r -= 12
      if (z === 37 && x >= 18) r -= 4
      pts.push({ x, z, recall: Math.round(Math.max(38, Math.min(98, r))) })
    }
  }
  return pts
})()

// Training-set plan targeted at the discovered patterns.
export const TRAINING_BREAKDOWN = [
  { key: 'p1', label: 'Night / low-angle views', count: 400, pattern: 1 as const },
  { key: 'p2', label: 'Snow / occlusion views', count: 400, pattern: 2 as const },
  { key: 'var', label: 'Additional camera variations', count: 200, pattern: null },
]

export const TRAINING_TOTAL = 1000
