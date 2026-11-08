import { create } from 'zustand'
import type { CameraPose, Conditions, ViewId } from './data/scenarios'
import { CAM03, DAY_CLEAR, OVERVIEW, scenarioById } from './data/scenarios'
import type { PlanRow } from './data/plan'

export type Stage =
  | 'boot'
  | 'project'
  | 'generating'
  | 'explore'
  | 'plan'
  | 'validating'
  | 'validated'
  | 'training'
  | 'trained'
  | 'exported'

export type GenPhase = 'depth' | 'lift' | 'labels' | 'done'

export interface ScreenBox {
  id: string
  // normalized 0..1 screen coordinates
  x: number
  y: number
  w: number
  h: number
}

export interface CapturedImage {
  id: string
  dataUrl: string // display image
  pngUrl: string // export image
  width: number
  height: number
  boxes: ScreenBox[]
  camera: { position: [number, number, number]; heightM: number; pitchDeg: number; yawDeg: number; fov: number }
  conditions: Conditions
  pattern: 1 | 2 | null
  label: string
}

export interface CameraRequest {
  pose: CameraPose
  duration: number // seconds; 0 = instant
  nonce: number
}

interface AppState {
  stage: Stage
  view: ViewId | 'free'
  conditions: Conditions
  conditionsInstant: boolean
  camRequest: CameraRequest
  genPhase: GenPhase
  orbitEnabled: boolean
  meshesVisible: boolean
  photos: Record<string, string>
  thumbs: Record<string, string> // shot id → image url (photo or render)
  trainingImages: CapturedImage[]
  apiOpen: boolean
  selectedImage: string | null
  progress: number // 0..1 for long-running steps
  customRows: PlanRow[]
  disabledRows: string[]
  birdVisible: boolean

  setStage: (s: Stage) => void
  goToView: (v: ViewId, duration?: number) => void
  setConditions: (c: Conditions, instant?: boolean) => void
  requestCamera: (pose: CameraPose, duration: number) => void
  setGenPhase: (p: GenPhase) => void
  setOrbit: (b: boolean) => void
  setMeshesVisible: (b: boolean) => void
  setPhotos: (p: Record<string, string>) => void
  setThumbs: (t: Record<string, string>) => void
  setTrainingImages: (imgs: CapturedImage[]) => void
  setApiOpen: (b: boolean) => void
  setSelectedImage: (id: string | null) => void
  setProgress: (p: number) => void
  addCustomRow: (r: PlanRow) => void
  toggleRow: (id: string) => void
  setBirdVisible: (b: boolean) => void
  setFree: () => void
  reset: () => void
}

let nonce = 1

export const useApp = create<AppState>((set, get) => ({
  stage: 'boot',
  view: 'A',
  conditions: DAY_CLEAR,
  conditionsInstant: true,
  camRequest: { pose: CAM03, duration: 0, nonce: 0 },
  genPhase: 'depth',
  orbitEnabled: false,
  meshesVisible: true,
  photos: {},
  thumbs: {},
  trainingImages: [],
  apiOpen: false,
  selectedImage: null,
  progress: 0,
  customRows: [],
  disabledRows: [],
  birdVisible: false,

  setStage: (stage) => set({ stage }),
  goToView: (v, duration = 1.8) => {
    if (v === 'overview') {
      if (duration > 0) useLive.getState().setMoving(true)
      set({
        birdVisible: false,
        view: v,
        conditions: DAY_CLEAR,
        conditionsInstant: duration === 0,
        camRequest: { pose: OVERVIEW, duration, nonce: nonce++ },
      })
      return
    }
    const s = scenarioById(v)
    // Scenarios sharing a camera (A and D) switch in place: no flight, no 3D flash
    if (get().view !== 'free' && get().camRequest.pose === s.pose) duration = 0
    if (duration > 0) useLive.getState().setMoving(true) // no frame with the old photo and new boxes
    set({
      birdVisible: v === 'D',
      view: v,
      conditions: s.conditions,
      conditionsInstant: duration === 0,
      camRequest: { pose: s.pose, duration, nonce: nonce++ },
    })
  },
  setConditions: (c, instant = false) => set({ conditions: c, conditionsInstant: instant }),
  requestCamera: (pose, duration) => set({ camRequest: { pose, duration, nonce: nonce++ } }),
  setGenPhase: (genPhase) => set({ genPhase }),
  setOrbit: (orbitEnabled) => set({ orbitEnabled }),
  setMeshesVisible: (meshesVisible) => set({ meshesVisible }),
  setPhotos: (photos) => set({ photos }),
  setThumbs: (thumbs) => set({ thumbs }),
  setTrainingImages: (trainingImages) => set({ trainingImages }),
  setApiOpen: (apiOpen) => set({ apiOpen }),
  setSelectedImage: (selectedImage) => set({ selectedImage }),
  setProgress: (progress) => set({ progress }),
  addCustomRow: (r) => set((st) => ({ customRows: [...st.customRows.filter((x) => x.id !== r.id), r] })),
  toggleRow: (id) => set((st) => ({ disabledRows: st.disabledRows.includes(id) ? st.disabledRows.filter((x) => x !== id) : [...st.disabledRows, id] })),
  setBirdVisible: (birdVisible) => set({ birdVisible }),
  setFree: () => {
    if (get().view !== 'free') set({ view: 'free' })
  },
  reset: () => {
    set({
      stage: 'project',
      view: 'A',
      conditions: DAY_CLEAR,
      conditionsInstant: true,
      camRequest: { pose: CAM03, duration: 0, nonce: nonce++ },
      genPhase: 'depth',
      orbitEnabled: false,
      meshesVisible: true,
      trainingImages: [],
      apiOpen: false,
      selectedImage: null,
      progress: 0,
      customRows: [],
      disabledRows: [],
      birdVisible: false,
    })
  },
}))

// High-frequency state (projected boxes, camera, motion) lives in its own store
// so per-frame updates don't re-render the whole app.
interface LiveState {
  boxes: ScreenBox[]
  cam: { x: number; z: number; yaw: number; fov: number; height: number }
  moving: boolean
  setBoxes: (b: ScreenBox[]) => void
  setCam: (c: LiveState['cam']) => void
  setMoving: (m: boolean) => void
}

export const useLive = create<LiveState>((set, get) => ({
  boxes: [],
  cam: { x: 44, z: -22, yaw: 0, fov: 60, height: 10 },
  moving: false,
  setBoxes: (boxes) => set({ boxes }),
  setCam: (cam) => set({ cam }),
  setMoving: (moving) => {
    if (get().moving !== moving) set({ moving })
  },
}))

export const isPostGeneration = (s: Stage) => !['boot', 'project', 'generating'].includes(s)
export const isValidated = (s: Stage) => ['validated', 'training', 'trained', 'exported'].includes(s)
export const hasBird = (rows: PlanRow[], disabled: string[]) => rows.some((r) => r.bird && !disabled.includes(r.id))
export const isImprove = (s: Stage) => ['training', 'trained', 'exported'].includes(s)
