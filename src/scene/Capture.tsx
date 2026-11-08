import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { CameraPose, Conditions } from '../data/scenarios'
import type { CapturedImage, ScreenBox } from '../store'
import { useApp } from '../store'
import { projectAll } from './registry'

// Renders stills of the persistent scene from arbitrary cameras/conditions.
// Used for the dataset thumbnails and the generated training set, so every
// exported image and box comes from the same 3D environment.

type Ctx = { gl: THREE.WebGLRenderer; camera: THREE.PerspectiveCamera }
let ctx: Ctx | null = null

export function CaptureBridge() {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  useEffect(() => {
    ctx = { gl, camera }
    return () => {
      ctx = null
    }
  }, [gl, camera])
  return null
}

const frames = (n: number) =>
  new Promise<void>((res) => {
    let k = 0
    const tick = () => (++k >= n ? res() : requestAnimationFrame(tick))
    requestAnimationFrame(tick)
  })

export interface CaptureSpec {
  id: string
  pose: CameraPose
  conditions: Conditions
  pattern: 1 | 2 | null
  label: string
  labelIds?: string[] // restrict boxes to these objects
}

let OUT_W = 640
let OUT_H = 360
export function setCaptureSize(w: number, h: number) {
  OUT_W = w
  OUT_H = h
}

export async function waitForCaptureReady() {
  while (!ctx) await frames(1)
}

export async function captureViews(specs: CaptureSpec[], onProgress?: (i: number) => void): Promise<CapturedImage[]> {
  await waitForCaptureReady()
  const { gl, camera } = ctx!
  const app = useApp.getState()
  const out: CapturedImage[] = []
  for (let i = 0; i < specs.length; i++) {
    const s = specs[i]
    app.setConditions(s.conditions, true)
    app.requestCamera(s.pose, 0)
    await frames(3)
    camera.updateMatrixWorld()
    const boxes = projectAll(camera).filter((b) => !s.labelIds || s.labelIds.includes(b.id))
    const src = gl.domElement
    // center-crop to 16:9
    const srcAR = src.width / src.height
    const dstAR = OUT_W / OUT_H
    let sx = 0,
      sy = 0,
      sw = src.width,
      sh = src.height
    if (srcAR > dstAR) {
      sw = src.height * dstAR
      sx = (src.width - sw) / 2
    } else {
      sh = src.width / dstAR
      sy = (src.height - sh) / 2
    }
    const c = document.createElement('canvas')
    c.width = OUT_W
    c.height = OUT_H
    c.getContext('2d')!.drawImage(src, sx, sy, sw, sh, 0, 0, OUT_W, OUT_H)
    const fx = sx / src.width,
      fy = sy / src.height,
      fw = sw / src.width,
      fh = sh / src.height
    const cropped: ScreenBox[] = boxes
      .map((b) => {
        const x0 = Math.max(0, (b.x - fx) / fw)
        const y0 = Math.max(0, (b.y - fy) / fh)
        const x1 = Math.min(1, (b.x + b.w - fx) / fw)
        const y1 = Math.min(1, (b.y + b.h - fy) / fh)
        return { id: b.id, x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
      })
      .filter((b) => b.w > 0.015 && b.h > 0.015)
    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    out.push({
      id: s.id,
      dataUrl: c.toDataURL('image/jpeg', 0.86),
      pngUrl: c.toDataURL('image/png'),
      width: OUT_W,
      height: OUT_H,
      boxes: cropped,
      camera: {
        position: [round(camera.position.x), round(camera.position.y), round(camera.position.z)],
        heightM: round(camera.position.y),
        pitchDeg: round(THREE.MathUtils.radToDeg(Math.asin(dir.y))),
        yawDeg: round((THREE.MathUtils.radToDeg(Math.atan2(dir.x, -dir.z)) + 360) % 360),
        fov: round(camera.fov),
      },
      conditions: s.conditions,
      pattern: s.pattern,
      label: s.label,
    })
    onProgress?.(i + 1)
  }
  return out
}

const round = (n: number) => Math.round(n * 10) / 10
