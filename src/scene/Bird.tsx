import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useApp } from '../store'
import { registerLabeled } from './registry'
import { CAM03 } from '../data/scenarios'

// A seagull inserted into the 3D scene for the "bird flies past the camera"
// scenario. Because it lives in 3D at a known depth, we know exactly how much
// of the truck it hides from any camera.

const CAB: [number, number, number] = [15.6, 2.4, 2.2]
const DIST = 6.2 // meters in front of CAM-03

function birdPose() {
  const cam = new THREE.Vector3(...CAM03.position)
  const dir = new THREE.Vector3(...CAB).sub(cam).normalize()
  const pos = cam.clone().addScaledVector(dir, DIST)
  // nudge so the bird covers the upper-front of the cab, not all of it
  const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize()
  pos.addScaledVector(right, 0.12).add(new THREE.Vector3(0, 0.02, 0))
  // fly roughly across the camera's view
  const yaw = Math.atan2(right.x, right.z)
  return { pos, yaw }
}

export const BIRD_POSE = birdPose()

export function Bird() {
  const visible = useApp((s) => s.birdVisible)
  const wingL = useRef<THREE.Group>(null)
  const wingR = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const mats = useMemo(
    () => ({
      white: new THREE.MeshStandardMaterial({ color: '#f4f5f6', roughness: 0.7 }),
      grey: new THREE.MeshStandardMaterial({ color: '#9aa3ad', roughness: 0.75 }),
      black: new THREE.MeshStandardMaterial({ color: '#1c1f24', roughness: 0.8 }),
      beak: new THREE.MeshStandardMaterial({ color: '#f2c230', roughness: 0.5 }),
    }),
    [],
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const flap = Math.sin(t * 9) * 0.55
    if (wingL.current) wingL.current.rotation.x = flap
    if (wingR.current) wingR.current.rotation.x = -flap
    if (body.current) body.current.position.y = Math.sin(t * 9 + 1) * 0.04
  })

  return (
    <group position={BIRD_POSE.pos} rotation={[0, BIRD_POSE.yaw, 0.12]} visible={visible} userData={{ noSample: true }}>
      <group ref={registerLabeled('gull')}>
        <group ref={body}>
          {/* body: forward is +x */}
          <mesh material={mats.white} scale={[0.32, 0.11, 0.11]} castShadow>
            <sphereGeometry args={[1, 20, 12]} />
          </mesh>
          <mesh material={mats.white} position={[0.3, 0.05, 0]} scale={0.075}>
            <sphereGeometry args={[1, 16, 10]} />
          </mesh>
          <mesh material={mats.beak} position={[0.41, 0.04, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.018, 0.08, 8]} />
          </mesh>
          <mesh material={mats.grey} position={[-0.34, 0.01, 0]} scale={[0.1, 0.02, 0.08]}>
            <boxGeometry args={[1, 1, 1]} />
          </mesh>
          {/* wings extend along ±z */}
          {[
            { ref: wingL, side: 1 },
            { ref: wingR, side: -1 },
          ].map(({ ref, side }) => (
            <group key={side} ref={ref} position={[0.02, 0.03, 0.05 * side]}>
              <mesh material={mats.grey} position={[0, 0, 0.2 * side]} scale={[0.17, 0.012, 0.38]}>
                <boxGeometry args={[1, 1, 1]} />
              </mesh>
              <mesh material={mats.grey} position={[-0.04, 0, 0.5 * side]} rotation={[0, 0.25 * side, 0]} scale={[0.12, 0.01, 0.26]}>
                <boxGeometry args={[1, 1, 1]} />
              </mesh>
              <mesh material={mats.black} position={[-0.08, 0, 0.66 * side]} rotation={[0, 0.35 * side, 0]} scale={[0.08, 0.01, 0.1]}>
                <boxGeometry args={[1, 1, 1]} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  )
}
