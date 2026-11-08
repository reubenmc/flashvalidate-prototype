// Orchestrates the demo's stage transitions. Generation, validation and
// training-data creation use prepared assets and deterministic results.

import { useApp } from '../store'
import type { CapturedImage } from '../store'
import { OVERVIEW, CAM03, DAY_CLEAR } from '../data/scenarios'
import { SHOTS, shotById } from '../data/shots'
import { detectPhotos, labelsFor } from '../data/photos'
import { captureViews, setCaptureSize, waitForCaptureReady } from '../scene/Capture'
import { genAnim } from '../scene/SplatAssemble'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function tween(ms: number, fn: (t: number) => void) {
  return new Promise<void>((res) => {
    const t0 = performance.now()
    const tick = () => {
      const t = Math.min(1, (performance.now() - t0) / ms)
      fn(t)
      if (t < 1) requestAnimationFrame(tick)
      else res()
    }
    requestAnimationFrame(tick)
  })
}

/** Camera height after the orbit controls keep the camera at/above its target. */
function effectiveHeight(pose: { position: [number, number, number]; target: [number, number, number] }) {
  const [px, py, pz] = pose.position
  const [tx, ty, tz] = pose.target
  const dist = Math.hypot(px - tx, py - ty, pz - tz)
  return Math.round(Math.max(py, ty + dist * Math.sin(0.02)) * 10) / 10
}

export const DATASET_SHOTS = ['scenario-a', 'dataset-cam01', 'dataset-cam02', 'dataset-cam04']
export const TRAINING_SHOTS = SHOTS.filter((s) => s.group === 'training').map((s) => s.id)

/** Load photos (if provided) and render fallbacks for any that are missing. */
let booting = false
export async function boot() {
  if (booting) return
  booting = true
  const app = useApp.getState()
  const photos = await detectPhotos(SHOTS.map((s) => s.id))
  app.setPhotos(photos)
  const missing = DATASET_SHOTS.filter((id) => !photos[id])
  const thumbs: Record<string, string> = { ...photos }
  if (missing.length) {
    await waitForCaptureReady()
    await sleep(600)
    setCaptureSize(960, 640)
    const imgs = await captureViews(
      missing.map((id) => {
        const s = shotById(id)
        return { id, pose: s.pose, conditions: s.conditions, pattern: s.pattern, label: s.title }
      }),
    )
    for (const im of imgs) thumbs[im.id] = im.dataUrl
  }
  app.setThumbs(thumbs)
  app.setConditions(DAY_CLEAR, true)
  app.requestCamera(CAM03, 0)
  await sleep(150)
  app.setStage('project')
}

export async function generate() {
  const app = useApp.getState()
  app.requestCamera(CAM03, 0)
  app.setConditions(DAY_CLEAR, true)
  app.setOrbit(false)
  app.setGenPhase('depth')
  app.setStage('generating')
  await sleep(1800)
  // lift pixels into 3D Gaussians
  genAnim.progress = 0
  genAnim.fade = 1
  app.setMeshesVisible(false)
  app.setGenPhase('lift')
  const lift = tween(5200, (t) => (genAnim.progress = t))
  await sleep(1500)
  app.requestCamera(OVERVIEW, 5.6)
  await lift
  app.setMeshesVisible(true)
  app.setGenPhase('labels')
  await tween(1300, (t) => (genAnim.fade = 1 - t))
  genAnim.fade = 0
  await sleep(500)
  app.setGenPhase('done')
  useApp.setState({ view: 'overview' })
  app.setStage('explore')
  app.setOrbit(true)
}

export async function runValidation() {
  const app = useApp.getState()
  app.setStage('validating')
  app.setProgress(0)
  await tween(5600, (t) => app.setProgress(t))
  // Start the flight first so the previous scenario's results never flash
  app.goToView('B', 1.8)
  app.setStage('validated')
}

export async function generateTraining() {
  const app = useApp.getState()
  const prevView = app.view
  app.setStage('training')
  app.setProgress(0)
  const photos = app.photos
  const missing = TRAINING_SHOTS.filter((id) => !photos[id])
  const started = performance.now()
  let rendered: CapturedImage[] = []
  if (missing.length) {
    setCaptureSize(960, 640)
    rendered = await captureViews(
      missing.map((id) => {
        const s = shotById(id)
        return { id, pose: s.pose, conditions: s.conditions, pattern: s.pattern, label: s.title }
      }),
      (i) => app.setProgress((0.85 * i) / missing.length),
    )
  }
  const images: CapturedImage[] = TRAINING_SHOTS.map((id) => {
    const s = shotById(id)
    const r = rendered.find((x) => x.id === id)
    const boxes = labelsFor(id, !!photos[id])
    const base: CapturedImage = r ?? {
      id,
      dataUrl: photos[id],
      pngUrl: photos[id],
      width: 1536,
      height: 1024,
      boxes,
      camera: { position: s.pose.position, heightM: s.pose.position[1], pitchDeg: 0, yawDeg: 0, fov: s.pose.fov },
      conditions: s.conditions,
      pattern: s.pattern,
      label: s.title,
    }
    const h = r ? r.camera.heightM : effectiveHeight(s.pose)
    const [px, , pz] = base.camera.position
    return { ...base, boxes, camera: { ...base.camera, position: [px, h, pz] as [number, number, number], heightM: h } }
  })
  const remaining = Math.max(0, 5200 - (performance.now() - started))
  const p0 = useApp.getState().progress
  await tween(remaining, (t) => app.setProgress(p0 + (1 - p0) * t))
  app.setTrainingImages(images)
  app.setSelectedImage(images[0]?.id ?? null)
  // restore the scenario the user was looking at
  if (prevView !== 'free') app.goToView(prevView, 0)
  app.setStage('trained')
}
