import { useMemo } from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { mats } from './materials'
import { corrugatedTexture, decalTexture, grilleTexture, trailerRearTexture, trailerSideTexture } from './textures'

// Vehicle local frame: front faces -Z, ground at y = 0, centered on X.

type GroupProps = ThreeElements['group']

const wheelGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.32, 28)
wheelGeo.rotateZ(Math.PI / 2)
const hubGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.34, 16)
hubGeo.rotateZ(Math.PI / 2)

function Wheel({ position, dual = false }: { position: [number, number, number]; dual?: boolean }) {
  const m = mats()
  const side = Math.sign(position[0])
  return (
    <group position={position}>
      <mesh geometry={wheelGeo} material={m.rubber} castShadow />
      <mesh geometry={hubGeo} material={m.hub} position={[side * 0.01, 0, 0]} />
      {dual && <mesh geometry={wheelGeo} material={m.rubber} position={[-side * 0.34, 0, 0]} castShadow />}
    </group>
  )
}

function Box({
  size,
  position,
  material,
  rotation,
  cast = true,
}: {
  size: [number, number, number]
  position: [number, number, number]
  material: THREE.Material | THREE.Material[]
  rotation?: [number, number, number]
  cast?: boolean
}) {
  return (
    <mesh position={position} rotation={rotation} material={material} castShadow={cast} receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  )
}

function Decal({ map, size, position, rotation }: { map: THREE.Texture; size: [number, number]; position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <mesh position={position} rotation={rotation} userData={{ noBounds: true }}>
      <planeGeometry args={size} />
      <meshStandardMaterial map={map} transparent roughness={0.6} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  )
}

export function Tractor({ color = '#b91c1c', unit = 'T-07', ...props }: GroupProps & { color?: string; unit?: string }) {
  const m = mats()
  const paint = useMemo(() => new THREE.MeshPhysicalMaterial({ color, roughness: 0.32, metalness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2 }), [color])
  const unitTex = useMemo(() => decalTexture(unit, { fg: '#ffffff', size: 84 }), [unit])
  const grille = grilleTexture()
  return (
    <group {...props}>
      {/* chassis */}
      <Box size={[1.1, 0.35, 6.4]} position={[0, 0.85, 0.2]} material={m.frame} />
      {/* hood */}
      <Box size={[2.3, 1.15, 1.9]} position={[0, 1.65, -2.15]} material={paint} />
      <Box size={[2.4, 0.25, 0.35]} position={[0, 0.85, -3.2]} material={m.chrome} />
      {/* grille */}
      <mesh position={[0, 1.6, -3.11]}>
        <planeGeometry args={[1.3, 0.95]} />
        <meshStandardMaterial map={grille} roughness={0.4} metalness={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* headlights */}
      <Box size={[0.45, 0.22, 0.08]} position={[-0.9, 1.45, -3.12]} material={m.headlight} cast={false} />
      <Box size={[0.45, 0.22, 0.08]} position={[0.9, 1.45, -3.12]} material={m.headlight} cast={false} />
      {/* cab */}
      <Box size={[2.5, 2.1, 2.2]} position={[0, 2.75, -0.15]} material={paint} />
      {/* windshield */}
      <mesh position={[0, 3.15, -1.27]} rotation={[-0.12, 0, 0]} material={m.glass}>
        <boxGeometry args={[2.3, 0.95, 0.06]} />
      </mesh>
      {/* side windows */}
      <Box size={[2.52, 0.7, 0.9]} position={[0, 3.2, -0.55]} material={m.glass} cast={false} />
      {/* sleeper + roof fairing */}
      <Box size={[2.5, 2.5, 1.3]} position={[0, 2.95, 1.6]} material={paint} />
      <Box size={[2.4, 0.7, 2.6]} position={[0, 4.1, 0.8]} material={paint} />
      {/* door decals */}
      <Decal map={unitTex} size={[0.9, 0.45]} position={[1.26, 2.35, -0.2]} rotation={[0, Math.PI / 2, 0]} />
      <Decal map={unitTex} size={[0.9, 0.45]} position={[-1.26, 2.35, -0.2]} rotation={[0, -Math.PI / 2, 0]} />
      {/* fuel tanks */}
      <mesh position={[1.05, 1.0, 0.6]} rotation={[Math.PI / 2, 0, 0]} material={m.chrome} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 1.4, 20]} />
      </mesh>
      <mesh position={[-1.05, 1.0, 0.6]} rotation={[Math.PI / 2, 0, 0]} material={m.chrome} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 1.4, 20]} />
      </mesh>
      {/* exhaust stacks */}
      <mesh position={[1.3, 3.4, 1.0]} material={m.chrome} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 3.0, 12]} />
      </mesh>
      <mesh position={[-1.3, 3.4, 1.0]} material={m.chrome} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 3.0, 12]} />
      </mesh>
      {/* mirrors */}
      <Box size={[0.08, 0.5, 0.2]} position={[1.55, 3.0, -1.1]} material={m.frame} />
      <Box size={[0.08, 0.5, 0.2]} position={[-1.55, 3.0, -1.1]} material={m.frame} />
      {/* fifth wheel */}
      <Box size={[1.4, 0.18, 1.2]} position={[0, 1.12, 2.5]} material={m.darkSteel} />
      {/* wheels */}
      <Wheel position={[1.05, 0.52, -2.3]} />
      <Wheel position={[-1.05, 0.52, -2.3]} />
      <Wheel position={[1.0, 0.52, 1.9]} dual />
      <Wheel position={[-1.0, 0.52, 1.9]} dual />
      <Wheel position={[1.0, 0.52, 3.2]} dual />
      <Wheel position={[-1.0, 0.52, 3.2]} dual />
      {/* fenders */}
      <Box size={[2.5, 0.12, 2.6]} position={[0, 1.18, 2.55]} material={m.frame} />
    </group>
  )
}

export function Trailer({
  brand = 'NORTHLINE',
  sub = 'FREIGHT · REGIONAL',
  accent = '#0f766e',
  unit = 'NL 4471',
  snowCap = true,
  ...props
}: GroupProps & { brand?: string; sub?: string; accent?: string; unit?: string; snowCap?: boolean }) {
  const m = mats()
  const L = 16
  const side = useMemo(() => trailerSideTexture(brand, sub, accent), [brand, sub, accent])
  const rear = useMemo(() => trailerRearTexture(unit), [unit])
  const roof = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d9dcdf', roughness: 0.6 }), [])
  const sideMat = useMemo(() => new THREE.MeshStandardMaterial({ map: side, roughness: 0.55 }), [side])
  const rearMat = useMemo(() => new THREE.MeshStandardMaterial({ map: rear, roughness: 0.5 }), [rear])
  const front = useMemo(() => new THREE.MeshStandardMaterial({ map: corrugatedTexture('#e7e9eb', 'trailerfront', 24), roughness: 0.6 }), [])
  // box faces: +x, -x, +y, -y, +z (rear), -z (front)
  const faceMats = [sideMat, sideMat, roof, m.frame, rearMat, front]
  return (
    <group {...props}>
      <mesh position={[0, 2.65, 0]} material={faceMats} castShadow receiveShadow>
        <boxGeometry args={[2.6, 2.9, L]} />
      </mesh>
      {snowCap && (
        <mesh position={[0, 4.13, 0]} material={m.snowCap} userData={{ noBounds: true }}>
          <boxGeometry args={[2.62, 0.08, L + 0.02]} />
        </mesh>
      )}
      {/* underframe rails */}
      <Box size={[0.25, 0.3, L - 0.4]} position={[0.75, 1.05, 0]} material={m.frame} />
      <Box size={[0.25, 0.3, L - 0.4]} position={[-0.75, 1.05, 0]} material={m.frame} />
      {/* side skirts */}
      <Box size={[0.04, 0.55, 7]} position={[1.25, 0.95, -1.2]} material={m.darkSteel} />
      <Box size={[0.04, 0.55, 7]} position={[-1.25, 0.95, -1.2]} material={m.darkSteel} />
      {/* landing gear */}
      <Box size={[0.14, 1.0, 0.14]} position={[0.9, 0.6, -L / 2 + 3]} material={m.steelGrey} />
      <Box size={[0.14, 1.0, 0.14]} position={[-0.9, 0.6, -L / 2 + 3]} material={m.steelGrey} />
      <Box size={[0.4, 0.06, 0.4]} position={[0.9, 0.08, -L / 2 + 3]} material={m.steelGrey} />
      <Box size={[0.4, 0.06, 0.4]} position={[-0.9, 0.08, -L / 2 + 3]} material={m.steelGrey} />
      {/* rear bumper (ICC bar) */}
      <Box size={[2.4, 0.15, 0.15]} position={[0, 0.65, L / 2 - 0.2]} material={m.frame} />
      {/* tail + marker lights */}
      <Box size={[0.3, 0.14, 0.05]} position={[-1.05, 1.35, L / 2 + 0.02]} material={m.taillight} cast={false} />
      <Box size={[0.3, 0.14, 0.05]} position={[1.05, 1.35, L / 2 + 0.02]} material={m.taillight} cast={false} />
      {[-6, -2, 2, 6].map((z) => (
        <Box key={`ml${z}`} size={[0.03, 0.08, 0.16]} position={[1.31, 1.35, z]} material={m.marker} cast={false} />
      ))}
      {[-6, -2, 2, 6].map((z) => (
        <Box key={`mr${z}`} size={[0.03, 0.08, 0.16]} position={[-1.31, 1.35, z]} material={m.marker} cast={false} />
      ))}
      {/* tandem axles */}
      <Wheel position={[1.0, 0.52, L / 2 - 2.6]} dual />
      <Wheel position={[-1.0, 0.52, L / 2 - 2.6]} dual />
      <Wheel position={[1.0, 0.52, L / 2 - 1.4]} dual />
      <Wheel position={[-1.0, 0.52, L / 2 - 1.4]} dual />
    </group>
  )
}

export function BoxTruck({ unit = 'B-12', ...props }: GroupProps & { unit?: string }) {
  const m = mats()
  const paint = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#1e3a8a', roughness: 0.35, metalness: 0.3, clearcoat: 0.6 }), [])
  const box = useMemo(() => new THREE.MeshStandardMaterial({ map: corrugatedTexture('#f5f5f4', 'boxtruck', 40, 3), roughness: 0.55 }), [])
  const logo = useMemo(() => decalTexture('MERIDIAN', { fg: '#1e3a8a', w: 1024, h: 160, size: 120 }), [])
  const unitTex = useMemo(() => decalTexture(unit, { fg: '#ffffff', size: 84 }), [unit])
  return (
    <group {...props}>
      <Box size={[1.0, 0.3, 7.6]} position={[0, 0.75, 0.6]} material={m.frame} />
      {/* cab */}
      <Box size={[2.3, 1.0, 1.2]} position={[0, 1.35, -2.75]} material={paint} />
      <Box size={[2.35, 1.6, 1.7]} position={[0, 2.3, -1.6]} material={paint} />
      <mesh position={[0, 2.6, -2.47]} rotation={[-0.15, 0, 0]} material={m.glass}>
        <boxGeometry args={[2.1, 0.8, 0.05]} />
      </mesh>
      <Box size={[2.37, 0.6, 0.9]} position={[0, 2.6, -1.8]} material={m.glass} cast={false} />
      <Box size={[0.4, 0.2, 0.06]} position={[-0.8, 1.3, -3.36]} material={m.headlight} cast={false} />
      <Box size={[0.4, 0.2, 0.06]} position={[0.8, 1.3, -3.36]} material={m.headlight} cast={false} />
      <Box size={[2.3, 0.2, 0.25]} position={[0, 0.75, -3.35]} material={m.chrome} />
      <Decal map={unitTex} size={[0.7, 0.35]} position={[1.18, 1.9, -1.6]} rotation={[0, Math.PI / 2, 0]} />
      <Decal map={unitTex} size={[0.7, 0.35]} position={[-1.18, 1.9, -1.6]} rotation={[0, -Math.PI / 2, 0]} />
      {/* box body */}
      <mesh position={[0, 2.55, 2.0]} material={box} castShadow receiveShadow>
        <boxGeometry args={[2.5, 3.2, 5.6]} />
      </mesh>
      <mesh position={[0, 4.18, 2.0]} material={m.snowCap} userData={{ noBounds: true }}>
        <boxGeometry args={[2.52, 0.08, 5.62]} />
      </mesh>
      <Decal map={logo} size={[4.6, 0.72]} position={[1.26, 2.8, 2.0]} rotation={[0, Math.PI / 2, 0]} />
      <Decal map={logo} size={[4.6, 0.72]} position={[-1.26, 2.8, 2.0]} rotation={[0, -Math.PI / 2, 0]} />
      <Wheel position={[1.0, 0.5, -2.3]} />
      <Wheel position={[-1.0, 0.5, -2.3]} />
      <Wheel position={[0.95, 0.5, 3.2]} dual />
      <Wheel position={[-0.95, 0.5, 3.2]} dual />
    </group>
  )
}

export function Car({ color = '#64748b', ...props }: GroupProps & { color?: string }) {
  const m = mats()
  const paint = useMemo(() => new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, metalness: 0.5, clearcoat: 1 }), [color])
  const small = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 20)
    g.rotateZ(Math.PI / 2)
    return g
  }, [])
  return (
    <group {...props}>
      <Box size={[1.85, 0.7, 4.5]} position={[0, 0.65, 0]} material={paint} />
      <Box size={[1.6, 0.6, 2.3]} position={[0, 1.25, 0.25]} material={paint} />
      <Box size={[1.62, 0.45, 2.1]} position={[0, 1.28, 0.25]} material={m.glass} cast={false} />
      <Box size={[0.35, 0.12, 0.05]} position={[-0.6, 0.78, -2.26]} material={m.headlight} cast={false} />
      <Box size={[0.35, 0.12, 0.05]} position={[0.6, 0.78, -2.26]} material={m.headlight} cast={false} />
      <mesh position={[0, 1.57, 0.25]} material={m.snowCap} userData={{ noBounds: true }}>
        <boxGeometry args={[1.6, 0.05, 2.3]} />
      </mesh>
      {[
        [0.85, 0.34, -1.4],
        [-0.85, 0.34, -1.4],
        [0.85, 0.34, 1.4],
        [-0.85, 0.34, 1.4],
      ].map((p, i) => (
        <mesh key={i} geometry={small} material={m.rubber} position={p as [number, number, number]} castShadow />
      ))}
    </group>
  )
}
