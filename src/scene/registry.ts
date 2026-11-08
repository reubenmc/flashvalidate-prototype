import * as THREE from 'three'
import type { ScreenBox } from '../store'

// Labeled objects register here so their 3D bounds can be projected into
// any camera. This is the "label transfer" step: one set of 3D labels yields
// correct 2D boxes from every viewpoint.

export const registry = new Map<string, THREE.Object3D>()

export function registerLabeled(id: string) {
  return (obj: THREE.Object3D | null) => {
    if (obj) registry.set(id, obj)
    else registry.delete(id)
  }
}

const box = new THREE.Box3()
const v = new THREE.Vector3()
const corners = Array.from({ length: 8 }, () => new THREE.Vector3())

// Oriented bounds: computed once in the object's local frame so boxes stay
// tight for vehicles parked at an angle.
const localBoxes = new WeakMap<THREE.Object3D, THREE.Box3>()
const inv = new THREE.Matrix4()
const rel = new THREE.Matrix4()
const tmp = new THREE.Box3()

function localBox(obj: THREE.Object3D) {
  const hit = localBoxes.get(obj)
  if (hit) return hit
  obj.updateWorldMatrix(true, true)
  inv.copy(obj.matrixWorld).invert()
  const b = new THREE.Box3()
  obj.traverse((m) => {
    const mesh = m as THREE.Mesh
    if (!mesh.isMesh || mesh.userData.noBounds) return
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
    rel.multiplyMatrices(inv, mesh.matrixWorld)
    tmp.copy(mesh.geometry.boundingBox!).applyMatrix4(rel)
    b.union(tmp)
  })
  localBoxes.set(obj, b)
  return b
}

export function projectObject(obj: THREE.Object3D, camera: THREE.Camera): Omit<ScreenBox, 'id'> | null {
  box.copy(localBox(obj))
  if (box.isEmpty()) return null
  const { min, max } = box
  let i = 0
  for (const x of [min.x, max.x])
    for (const y of [min.y, max.y])
      for (const z of [min.z, max.z]) corners[i++].set(x, y, z).applyMatrix4(obj.matrixWorld)

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  let behind = 0
  for (const c of corners) {
    v.copy(c).applyMatrix4(camera.matrixWorldInverse)
    if (v.z > -0.1) {
      behind++
      continue
    }
    v.copy(c).project(camera)
    minX = Math.min(minX, v.x)
    maxX = Math.max(maxX, v.x)
    minY = Math.min(minY, v.y)
    maxY = Math.max(maxY, v.y)
  }
  if (behind > 4 || !isFinite(minX)) return null
  // NDC → normalized screen (0..1, y down), clipped
  const x0 = Math.max(0, (minX + 1) / 2)
  const x1 = Math.min(1, (maxX + 1) / 2)
  const y0 = Math.max(0, (1 - maxY) / 2)
  const y1 = Math.min(1, (1 - minY) / 2)
  const w = x1 - x0
  const h = y1 - y0
  if (w <= 0.012 || h <= 0.012) return null
  return { x: x0, y: y0, w, h }
}

export function projectAll(camera: THREE.Camera): ScreenBox[] {
  camera.updateMatrixWorld()
  const out: ScreenBox[] = []
  for (const [id, obj] of registry) {
    let shown = true
    obj.traverseAncestors((a) => {
      if (!a.visible) shown = false
    })
    if (!obj.visible || !shown) continue
    const b = projectObject(obj, camera)
    if (b) out.push({ id, ...b })
  }
  return out
}
