import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useApp, useLive } from '../store'
import { projectAll } from './registry'

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export const controlsRef: { current: OrbitControlsImpl | null } = { current: null }

/** Smoothly flies the camera between poses, and hands control to OrbitControls in between. */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const req = useApp((s) => s.camRequest)
  const orbit = useApp((s) => s.orbitEnabled)
  const setFree = useApp((s) => s.setFree)
  const anim = useRef<{
    fromPos: THREE.Vector3
    toPos: THREE.Vector3
    fromTarget: THREE.Vector3
    toTarget: THREE.Vector3
    fromFov: number
    toFov: number
    t: number
    dur: number
  } | null>(null)
  const ctl = useRef<OrbitControlsImpl>(null)

  useEffect(() => {
    controlsRef.current = ctl.current
  })

  useEffect(() => {
    const c = ctl.current
    const curTarget = c ? c.target.clone() : new THREE.Vector3()
    const toPos = new THREE.Vector3(...req.pose.position)
    const toTarget = new THREE.Vector3(...req.pose.target)
    if (req.duration <= 0) {
      camera.position.copy(toPos)
      camera.fov = req.pose.fov
      camera.updateProjectionMatrix()
      if (c) {
        c.target.copy(toTarget)
        c.update()
      } else camera.lookAt(toTarget)
      anim.current = null
      return
    }
    anim.current = {
      fromPos: camera.position.clone(),
      toPos,
      fromTarget: curTarget,
      toTarget,
      fromFov: camera.fov,
      toFov: req.pose.fov,
      t: 0,
      dur: req.duration,
    }
  }, [req, camera])

  useFrame((_, dt) => {
    const a = anim.current
    const c = ctl.current
    if (a) {
      a.t = Math.min(1, a.t + dt / a.dur)
      const e = ease(a.t)
      // arc upward mid-flight so moves read as moving through one space
      const lift = Math.sin(Math.PI * e) * Math.min(10, a.fromPos.distanceTo(a.toPos) * 0.12)
      camera.position.lerpVectors(a.fromPos, a.toPos, e)
      camera.position.y += lift
      camera.fov = THREE.MathUtils.lerp(a.fromFov, a.toFov, e)
      camera.updateProjectionMatrix()
      const tgt = new THREE.Vector3().lerpVectors(a.fromTarget, a.toTarget, e)
      if (c) {
        c.target.copy(tgt)
        c.update()
      } else camera.lookAt(tgt)
      if (a.t >= 1) anim.current = null
    }
    useLive.getState().setMoving(!!anim.current)
    // publish camera for the minimap
    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    useLive.getState().setCam({
      x: camera.position.x,
      z: camera.position.z,
      yaw: Math.atan2(dir.x, dir.z),
      fov: camera.fov * camera.aspect,
      height: camera.position.y,
    })
    useLive.getState().setBoxes(projectAll(camera))
  })

  return (
    <OrbitControls
      ref={ctl}
      enabled={orbit}
      enableDamping
      dampingFactor={0.08}
      maxPolarAngle={Math.PI / 2 - 0.02}
      minDistance={6}
      maxDistance={140}
      rotateSpeed={0.35}
      onStart={() => {
        anim.current = null
        setFree()
      }}
    />
  )
}
