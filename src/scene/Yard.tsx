import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mats } from './materials'
import { chainLinkTexture, corrugatedTexture, decalTexture, rollupDoorTexture } from './textures'
import { BoxTruck, Car, Tractor, Trailer } from './Vehicles'
import { registerLabeled } from './registry'

type V3 = [number, number, number]

function Box({ size, position, material, rotation, cast = true, sample = true }: { size: V3; position: V3; material: THREE.Material | THREE.Material[]; rotation?: V3; cast?: boolean; sample?: boolean }) {
  return (
    <mesh position={position} rotation={rotation} material={material} castShadow={cast} receiveShadow userData={sample ? undefined : { noSample: true }}>
      <boxGeometry args={size} />
    </mesh>
  )
}

function Plane({ size, position, material, rotation = [-Math.PI / 2, 0, 0], sample = true }: { size: [number, number]; position: V3; material: THREE.Material; rotation?: V3; sample?: boolean }) {
  return (
    <mesh position={position} rotation={rotation} material={material} receiveShadow userData={sample ? undefined : { noSample: true }}>
      <planeGeometry args={size} />
    </mesh>
  )
}

export const DOOR_XS = [-35, -25, -15, -5, 5, 15, 25, 35]
const WALL_Z = -34

function Warehouse() {
  const m = mats()
  const wall = useMemo(() => new THREE.MeshStandardMaterial({ map: corrugatedTexture('#c7ccd1', 'wall', 96, 10), roughness: 0.7, metalness: 0.15 }), [])
  const wallSide = useMemo(() => new THREE.MeshStandardMaterial({ map: corrugatedTexture('#c7ccd1', 'wallside', 96, 3), roughness: 0.7, metalness: 0.15 }), [])
  const roof = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6b7178', roughness: 0.8 }), [])
  const band = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0f766e', roughness: 0.6 }), [])
  const door = useMemo(() => new THREE.MeshStandardMaterial({ map: rollupDoorTexture(), roughness: 0.6, metalness: 0.2 }), [])
  const sign = useMemo(() => decalTexture('OUTPOST  ·  DC-14  ·  RECEIVING', { fg: '#ffffff', w: 2048, h: 160, size: 96, weight: 700 }), [])
  // faces: +x, -x, +y, -y, +z (front), -z
  const shell = [wallSide, wallSide, roof, roof, wall, wall]
  return (
    <group>
      <mesh position={[0, 5.5, -48]} material={shell} castShadow receiveShadow>
        <boxGeometry args={[92, 11, 28]} />
      </mesh>
      {/* roof snow */}
      <mesh position={[0, 11.03, -48]} rotation={[-Math.PI / 2, 0, 0]} material={m.snowCap} userData={{ noSample: true }}>
        <planeGeometry args={[92, 28]} />
      </mesh>
      {/* parapet + brand band */}
      <Box size={[92.4, 0.8, 0.4]} position={[0, 10.8, WALL_Z + 0.1]} material={band} />
      <mesh position={[-20, 8.6, WALL_Z + 0.05]}>
        <planeGeometry args={[30, 2.3]} />
        <meshStandardMaterial map={sign} transparent roughness={0.6} />
      </mesh>
      {/* dock canopy */}
      <Box size={[92, 0.35, 2.2]} position={[0, 6.4, WALL_Z + 1.1]} material={m.darkSteel} />
      <mesh position={[0, 6.6, WALL_Z + 1.1]} rotation={[-Math.PI / 2, 0, 0]} material={m.snowCap} userData={{ noSample: true }}>
        <planeGeometry args={[92, 2.2]} />
      </mesh>
      {/* raised dock wall */}
      <Box size={[92, 1.3, 0.6]} position={[0, 0.65, WALL_Z + 0.3]} material={m.concrete} />
      {DOOR_XS.map((x, i) => (
        <group key={x} position={[x, 0, WALL_Z]}>
          <Box size={[3.6, 3.8, 0.35]} position={[0, 3.2, 0.2]} material={m.dockSeal} />
          <mesh position={[0, 2.95, 0.39]} material={door}>
            <planeGeometry args={[3, 3.2]} />
          </mesh>
          <Box size={[0.35, 0.45, 0.3]} position={[-1.1, 1.0, 0.75]} material={m.bumper} />
          <Box size={[0.35, 0.45, 0.3]} position={[1.1, 1.0, 0.75]} material={m.bumper} />
          {/* dock light */}
          <Box size={[0.4, 0.18, 0.3]} position={[2.2, 4.9, 0.6]} material={m.lamp} cast={false} />
          <mesh position={[0, 5.35, 0.4]}>
            <planeGeometry args={[1.1, 0.5]} />
            <meshStandardMaterial map={decalTexture(`D${i + 1}`, { bg: '#111827', fg: '#ffffff', w: 128, h: 64, size: 40 })} />
          </mesh>
        </group>
      ))}
      {/* office block with windows */}
      <group position={[52, 0, -40]}>
        <Box size={[12, 6.5, 14]} position={[0, 3.25, 0]} material={wallSide} />
        <Box size={[12.2, 0.4, 14.2]} position={[0, 6.7, 0]} material={band} />
        <mesh position={[0, 6.92, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.snowCap} userData={{ noSample: true }}>
          <planeGeometry args={[12, 14]} />
        </mesh>
        <Box size={[10, 1.4, 0.1]} position={[0, 4.3, 7.02]} material={m.window} cast={false} />
        <Box size={[10, 1.4, 0.1]} position={[0, 1.9, 7.02]} material={m.window} cast={false} />
        <Box size={[0.1, 1.4, 11]} position={[-6.02, 4.3, 0]} material={m.window} cast={false} />
      </group>
      {/* rooftop units */}
      {[-30, -8, 16, 34].map((x) => (
        <Box key={x} size={[3.5, 1.6, 2.6]} position={[x, 11.8, -52]} material={m.steelGrey} />
      ))}
    </group>
  )
}

function Fence() {
  const m = mats()
  const link = useMemo(() => {
    const t = chainLinkTexture().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.needsUpdate = true
    return t
  }, [])
  const segments = useMemo(() => {
    // [x1,z1,x2,z2]
    return [
      [-50, 40, 12, 40],
      [27, 40, 50, 40],
      [50, 40, 50, -66],
      [-50, 40, -50, -66],
      [-50, -66, 50, -66],
    ] as const
  }, [])
  return (
    <group>
      {segments.map(([x1, z1, x2, z2], i) => {
        const len = Math.hypot(x2 - x1, z2 - z1)
        const ang = Math.atan2(x2 - x1, z2 - z1)
        const mat = new THREE.MeshStandardMaterial({ map: link, alphaTest: 0.4, transparent: false, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.4 })
        mat.map = link.clone()
        mat.map.repeat.set(len / 2.4, 1)
        mat.map.needsUpdate = true
        const posts = Math.floor(len / 5)
        return (
          <group key={i} position={[(x1 + x2) / 2, 0, (z1 + z2) / 2]} rotation={[0, ang, 0]}>
            <mesh position={[0, 1.2, 0]} rotation={[0, Math.PI / 2, 0]} material={mat} userData={{ noSample: true }}>
              <planeGeometry args={[len, 2.4]} />
            </mesh>
            <Box size={[0.06, 0.06, len]} position={[0, 2.4, 0]} material={m.steelGrey} cast={false} />
            {Array.from({ length: posts + 1 }, (_, k) => (
              <Box key={k} size={[0.08, 2.5, 0.08]} position={[0, 1.25, -len / 2 + (k * len) / posts]} material={m.steelGrey} cast={false} sample={false} />
            ))}
          </group>
        )
      })}
    </group>
  )
}

export const POLES: { p: [number, number]; lit: boolean; dir: [number, number] }[] = [
  { p: [-30, -12], lit: false, dir: [0, 1] },
  { p: [2, -14], lit: true, dir: [0.4, 1] },
  { p: [6, 15], lit: true, dir: [1, -0.6] },
  { p: [-28, 20], lit: true, dir: [0.5, -1] },
  { p: [9, 22], lit: true, dir: [0.4, -1] },
  { p: [40, 14], lit: false, dir: [-1, 0] },
]

function LightPole({ p, dir }: { p: [number, number]; dir: [number, number] }) {
  const m = mats()
  const ang = Math.atan2(dir[0], dir[1])
  return (
    <group position={[p[0], 0, p[1]]} rotation={[0, ang, 0]}>
      <mesh position={[0, 6, 0]} material={m.steelGrey} castShadow>
        <cylinderGeometry args={[0.12, 0.2, 12, 12]} />
      </mesh>
      <Box size={[0.12, 0.12, 2.2]} position={[0, 11.8, 1.0]} material={m.steelGrey} />
      <Box size={[0.9, 0.25, 0.6]} position={[0, 11.7, 2.1]} material={m.darkSteel} />
      <Box size={[0.75, 0.05, 0.5]} position={[0, 11.56, 2.1]} material={m.lamp} cast={false} />
      <Box size={[0.6, 0.3, 0.6]} position={[0, 0.15, 0]} material={m.concrete} />
    </group>
  )
}

function Gatehouse() {
  const m = mats()
  const wall = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e5e7eb', roughness: 0.8 }), [])
  const stripe = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 16
    const ctx = c.getContext('2d')!
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#ffffff' : '#dc2626'
      ctx.fillRect(i * 32, 0, 32, 16)
    }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 })
  }, [])
  const gateSign = useMemo(() => decalTexture('GATE 2', { bg: '#0f766e', fg: '#ffffff', w: 256, h: 96, size: 52 }), [])
  return (
    <group>
      <group position={[31, 0, 32]}>
        <Box size={[4, 3, 3.4]} position={[0, 1.5, 0]} material={wall} />
        <Box size={[4.6, 0.3, 4]} position={[0, 3.15, 0]} material={m.darkSteel} />
        <mesh position={[0, 3.32, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.snowCap} userData={{ noSample: true }}>
          <planeGeometry args={[4.6, 4]} />
        </mesh>
        <Box size={[0.08, 1.2, 2.6]} position={[-2.02, 1.9, 0]} material={m.window} cast={false} />
        <Box size={[3.2, 1.2, 0.08]} position={[0, 1.9, 1.72]} material={m.window} cast={false} />
        <mesh position={[0, 3.7, 1.75]}>
          <planeGeometry args={[1.8, 0.66]} />
          <meshStandardMaterial map={gateSign} />
        </mesh>
      </group>
      {/* CAM-03 pole with camera housing */}
      <group position={[31, 0, 37]}>
        <mesh position={[0, 3.7, 0]} material={m.steelGrey} castShadow>
          <cylinderGeometry args={[0.09, 0.12, 7.4, 10]} />
        </mesh>
        <group position={[-0.25, 7.25, -0.3]} rotation={[0.18, Math.PI + 0.65, 0]}>
          <Box size={[0.32, 0.28, 0.7]} position={[0, 0, 0]} material={m.paintWhite} />
          <Box size={[0.36, 0.05, 0.85]} position={[0, 0.17, 0.05]} material={m.paintWhite} />
        </group>
      </group>
      {/* boom barrier (raised) */}
      <group position={[27.4, 0, 38.5]}>
        <Box size={[0.6, 1.1, 0.5]} position={[0, 0.55, 0]} material={m.paintYellow} />
        <mesh position={[-0.4, 4.4, 0]} rotation={[0, 0, 1.38]} material={stripe} castShadow>
          <boxGeometry args={[7, 0.12, 0.12]} />
        </mesh>
      </group>
    </group>
  )
}

function Ground() {
  const m = mats()
  const snowGround = m.snowCap
  return (
    <group>
      <Plane size={[320, 320]} position={[0, -0.02, 0]} material={m.gravel} />
      <Plane size={[100, 106]} position={[0, 0, -13]} material={m.asphalt} />
      <Plane size={[92, 13]} position={[0, 0.006, -27.5]} material={m.concrete} />
      {/* gate apron */}
      <Plane size={[15, 22]} position={[19.5, 0, 50]} material={m.asphalt} />
      {/* snow overlay */}
      <mesh position={[0, 0.03, -10]} rotation={[-Math.PI / 2, 0, 0]} material={snowGround} userData={{ noSample: true }} receiveShadow>
        <planeGeometry args={[200, 200]} />
      </mesh>
    </group>
  )
}

function Markings() {
  const m = mats()
  const dashes = []
  for (let z = 36; z > -16; z -= 4) dashes.push(z)
  return (
    <group position={[0, 0.012, 0]}>
      {/* entry lane center line */}
      {dashes.map((z) => (
        <Plane key={z} size={[0.18, 2]} position={[19.5, 0, z]} material={m.lineYellow} sample={false} />
      ))}
      {/* stop bar */}
      <Plane size={[7, 0.45]} position={[22, 0, 34]} material={m.lineWhite} sample={false} />
      {/* trailer parking stalls (west) */}
      {Array.from({ length: 7 }, (_, i) => -46 + i * 4.6).map((x) => (
        <Plane key={x} size={[0.15, 18]} position={[x, 0, 0]} material={m.lineWhite} sample={false} />
      ))}
      <Plane size={[27.6, 0.15]} position={[-32.2, 0, -9]} material={m.lineWhite} sample={false} />
      {/* dock approach stripes */}
      {DOOR_XS.map((x) => (
        <Plane key={x} size={[0.15, 12]} position={[x + 2.4, 0, -27]} material={m.lineYellow} sample={false} />
      ))}
      {/* pedestrian walkway */}
      {Array.from({ length: 8 }, (_, i) => 30 + i * 1.1).map((x) => (
        <Plane key={x} size={[0.55, 3.2]} position={[x - 18, 0, 28]} material={m.lineWhite} sample={false} />
      ))}
    </group>
  )
}

function JerseyBarrier({ position, rotation = 0 }: { position: V3; rotation?: number }) {
  const m = mats()
  const geo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.3, 0)
    s.lineTo(0.3, 0)
    s.lineTo(0.22, 0.25)
    s.lineTo(0.1, 0.81)
    s.lineTo(-0.1, 0.81)
    s.lineTo(-0.22, 0.25)
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth: 3, bevelEnabled: false })
    g.translate(0, 0, -1.5)
    return g
  }, [])
  return <mesh geometry={geo} material={m.jersey} position={position} rotation={[0, rotation, 0]} castShadow receiveShadow />
}

function Cone({ position }: { position: V3 }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.6 }), [])
  return (
    <group position={position}>
      <mesh material={mat} position={[0, 0.36, 0]} castShadow>
        <coneGeometry args={[0.18, 0.7, 16]} />
      </mesh>
      <mesh material={mat} position={[0, 0.02, 0]}>
        <boxGeometry args={[0.42, 0.04, 0.42]} />
      </mesh>
    </group>
  )
}

function Containers() {
  const colors = ['#0e7490', '#c2410c', '#1d4ed8', '#4d7c0f', '#9f1239']
  const ms = useMemo(() => colors.map((c, i) => new THREE.MeshStandardMaterial({ map: corrugatedTexture(c, `cont${i}`, 48, 4), roughness: 0.65, metalness: 0.2 })), [])
  const stack: [number, number, number, number][] = [
    [-40, 1.3, 30, 0],
    [-40, 3.9, 30, 1],
    [-40, 1.3, 33, 2],
    [-40, 1.3, 36, 3],
    [-40, 3.9, 36, 4],
  ]
  const m = mats()
  return (
    <group>
      {stack.map(([x, y, z, c], i) => (
        <group key={i}>
          <mesh position={[x, y, z]} material={ms[c]} castShadow receiveShadow>
            <boxGeometry args={[12.2, 2.6, 2.45]} />
          </mesh>
          <mesh position={[x, y + 1.33, z]} rotation={[-Math.PI / 2, 0, 0]} material={m.snowCap} userData={{ noSample: true }}>
            <planeGeometry args={[12.2, 2.45]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Pallets({ position }: { position: V3 }) {
  const m = mats()
  const wrap = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d6d3d1', roughness: 0.35, metalness: 0.05 }), [])
  return (
    <group position={position}>
      {[0, 1.3, 2.6].map((x) =>
        [0, 1.3].map((z) => (
          <group key={`${x}-${z}`} position={[x, 0, z]}>
            <Box size={[1.2, 0.15, 1.0]} position={[0, 0.08, 0]} material={m.wood} />
            <Box size={[1.1, 1.0, 0.95]} position={[0, 0.65, 0]} material={wrap} />
          </group>
        )),
      )}
    </group>
  )
}

function Trees() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const count = 140
  useLayoutEffect(() => {
    const d = new THREE.Object3D()
    let s = 3
    const r = () => {
      s = (s * 16807) % 2147483647
      return s / 2147483647
    }
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + r() * 0.05
      const rad = 92 + r() * 40
      const h = 9 + r() * 8
      d.position.set(Math.cos(a) * rad, h / 2 + 1.5, Math.sin(a) * rad - 10)
      d.scale.set(1 + r() * 0.5, h / 10, 1 + r() * 0.5)
      d.updateMatrix()
      ref.current!.setMatrixAt(i, d.matrix)
      d.position.y = 1
      d.scale.set(1, 1, 1)
      d.updateMatrix()
      trunkRef.current!.setMatrixAt(i, d.matrix)
    }
    ref.current!.instanceMatrix.needsUpdate = true
    trunkRef.current!.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <group>
      <instancedMesh ref={ref} args={[undefined, undefined, count]} userData={{ noSample: true }}>
        <coneGeometry args={[3.2, 10, 8]} />
        <meshStandardMaterial color="#3f4d3c" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, count]} userData={{ noSample: true }}>
        <cylinderGeometry args={[0.3, 0.4, 2, 6]} />
        <meshStandardMaterial color="#4a3b2c" roughness={1} />
      </instancedMesh>
    </group>
  )
}

function CameraMount({ position, target, height }: { position: V3; target: V3; height: number }) {
  const m = mats()
  const yaw = Math.atan2(target[0] - position[0], target[2] - position[2])
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} material={m.steelGrey} castShadow>
        <cylinderGeometry args={[0.09, 0.13, height, 10]} />
      </mesh>
      <group position={[0, height + 0.1, 0]} rotation={[0, yaw, 0]}>
        <group rotation={[0.2, 0, 0]}>
          <Box size={[0.3, 0.26, 0.7]} position={[0, 0, 0.3]} material={m.paintWhite} />
          <Box size={[0.36, 0.05, 0.85]} position={[0, 0.16, 0.32]} material={m.paintWhite} />
        </group>
      </group>
    </group>
  )
}

/** Positions of the labeled vehicles (also used by the minimap). */
export const LAYOUT = {
  t07: { pos: [16, 0, 4] as V3, rot: 0.22 },
  b12: { pos: [-35, 0, 6.4] as V3, rot: 0 },
  y4: { pos: [-24, 0, 0] as V3, rot: 0 },
  docked: [
    { id: 'd1', x: -25, brand: 'KESTREL', sub: 'LOGISTICS', accent: '#ea580c', unit: 'KL 2209' },
    { id: 'd2', x: -5, brand: 'CASCADE', sub: 'TRANSPORT CO.', accent: '#2563eb', unit: 'CT 8810' },
    { id: 'd3', x: 15, brand: 'NORTHLINE', sub: 'FREIGHT · REGIONAL', accent: '#0f766e', unit: 'NL 4402' },
  ],
}

export function Yard() {
  return (
    <group>
      <Ground />
      <Markings />
      <Warehouse />
      <Fence />
      <Gatehouse />
      <Containers />
      <Trees />
      {POLES.map((p, i) => (
        <LightPole key={i} p={p.p} dir={p.dir} />
      ))}
      <CameraMount position={[44.5, 0, -22.4]} target={[0, 0.5, 15]} height={10} />
      <Pallets position={[-44, 0, -31]} />
      <Pallets position={[39, 0, -31]} />

      {/* barriers along the inner lane (occlude the low camera in Scenario B) */}
      <JerseyBarrier position={[7, 0, -4]} rotation={Math.PI / 2} />
      <JerseyBarrier position={[10.1, 0, -4]} rotation={Math.PI / 2} />
      <JerseyBarrier position={[13.2, 0, -4]} rotation={Math.PI / 2} />
      <JerseyBarrier position={[24.5, 0, 30]} />
      <Cone position={[5, 0, -4.2]} />
      <Cone position={[15.3, 0, -4.2]} />
      <Cone position={[14, 0, 33]} />
      <Cone position={[25.5, 0, 34]} />

      {/* parked cars */}
      <Car position={[39, 0, 24]} rotation={[0, Math.PI / 2, 0]} color="#475569" />
      <Car position={[39, 0, 27]} rotation={[0, Math.PI / 2, 0]} color="#e2e8f0" />
      <Car position={[39, 0, 30]} rotation={[0, Math.PI / 2, 0]} color="#7f1d1d" />
      <Car position={[45, 0, 24]} rotation={[0, -Math.PI / 2, 0]} color="#1f2937" />

      {/* docked trailers (rear against the dock) */}
      {LAYOUT.docked.map((d) => (
        <group key={d.id} ref={registerLabeled(d.id)} position={[d.x, 0, -25.7]} rotation={[0, Math.PI, 0]}>
          <Trailer brand={d.brand} sub={d.sub} accent={d.accent} unit={d.unit} />
        </group>
      ))}

      {/* parked trailer Y-4 and the box truck that occludes it */}
      <group ref={registerLabeled('y4')} position={LAYOUT.y4.pos} rotation={[0, LAYOUT.y4.rot, 0]}>
        <Trailer brand="HARBORVIEW" sub="REFRIGERATED" accent="#dc2626" unit="HV 1187" />
      </group>
      <group ref={registerLabeled('b12')} position={LAYOUT.b12.pos} rotation={[0, LAYOUT.b12.rot, 0]}>
        <BoxTruck />
      </group>

      {/* hero rig T-07 entering the yard */}
      <group position={LAYOUT.t07.pos} rotation={[0, LAYOUT.t07.rot, 0]}>
        <group ref={registerLabeled('t07-cab')}>
          <Tractor />
        </group>
        <group ref={registerLabeled('t07-trailer')} position={[0, 0, 9.5]}>
          <Trailer />
        </group>
      </group>
    </group>
  )
}
