import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useApp } from '../store'
import { env, mats } from './materials'
import { POLES } from './Yard'

const C = (h: string) => new THREE.Color(h)

const PAL = {
  dayTop: C('#5f97cf'),
  dayHorizon: C('#d9e6f1'),
  nightTop: C('#04070f'),
  nightHorizon: C('#1a2236'),
  snowTop: C('#b9c2cb'),
  snowHorizon: C('#dde2e7'),
  fogDay: C('#dfe7ee'),
  fogNight: C('#0e1422'),
  fogSnow: C('#d5dbe1'),
  gen: C('#0b1016'),
}

function SkyDome() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { top: { value: PAL.dayTop.clone() }, horizon: { value: PAL.dayHorizon.clone() } },
        vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 top; uniform vec3 horizon; varying vec3 vP; void main(){ float t = smoothstep(-0.05, 0.55, vP.y); gl_FragColor = vec4(mix(horizon, top, t), 1.0); }`,
      }),
    [],
  )
  useFrame(() => {
    const n = env.night
    const s = env.snow
    const top = PAL.dayTop.clone().lerp(PAL.snowTop, s).lerp(PAL.nightTop, n).lerp(PAL.gen, env.gen)
    const hor = PAL.dayHorizon.clone().lerp(PAL.snowHorizon, s).lerp(PAL.nightHorizon, n).lerp(PAL.gen, env.gen)
    mat.uniforms.top.value.copy(top)
    mat.uniforms.horizon.value.copy(hor)
  })
  return (
    <mesh material={mat} userData={{ noSample: true }} renderOrder={-1}>
      <sphereGeometry args={[400, 32, 16]} />
    </mesh>
  )
}

function Snowfall() {
  const count = 9000
  const ref = useRef<THREE.Points>(null)
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 140
      positions[i * 3 + 1] = Math.random() * 30
      positions[i * 3 + 2] = (Math.random() - 0.5) * 140 - 5
      speeds[i] = 1.2 + Math.random() * 1.6
    }
    return { positions, speeds }
  }, [])
  const mat = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 32
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 32, 32)
    return new THREE.PointsMaterial({ size: 0.28, map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, opacity: 0, color: '#ffffff' })
  }, [])
  useFrame((_, dt) => {
    mat.opacity = env.snow * 0.95
    const pts = ref.current
    if (!pts) return
    pts.visible = env.snow > 0.01
    if (!pts.visible) return
    const a = pts.geometry.attributes.position as THREE.BufferAttribute
    const arr = a.array as Float32Array
    const t = performance.now() * 0.001
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= speeds[i] * Math.min(dt, 0.05)
      arr[i * 3] += Math.sin(t + i) * 0.006
      if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = 30
    }
    a.needsUpdate = true
  })
  return (
    <points ref={ref} material={mat} userData={{ noSample: true }} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
    </points>
  )
}

function Floodlight({ p, dir }: { p: [number, number]; dir: [number, number] }) {
  const light = useRef<THREE.SpotLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  const len = Math.hypot(dir[0], dir[1])
  const tx = p[0] + (dir[0] / len) * 9
  const tz = p[1] + (dir[1] / len) * 9
  useEffect(() => {
    target.position.set(tx, 0, tz)
    target.updateMatrixWorld()
    if (light.current) light.current.target = target
  }, [target, tx, tz])
  useFrame(() => {
    if (light.current) light.current.intensity = env.night * 650
  })
  const ang = Math.atan2(dir[0], dir[1])
  const hx = p[0] + Math.sin(ang) * 2.1
  const hz = p[1] + Math.cos(ang) * 2.1
  return (
    <>
      <primitive object={target} />
      <spotLight ref={light} position={[hx, 11.4, hz]} angle={0.95} penumbra={0.7} distance={60} decay={1.6} color="#ffb767" intensity={0} />
    </>
  )
}

function Headlights() {
  // T-07 headlights shining toward the low camera in Scenario B
  const l1 = useRef<THREE.SpotLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  useEffect(() => {
    target.position.set(11, 0, -16)
    target.updateMatrixWorld()
    if (l1.current) l1.current.target = target
  }, [target])
  useFrame(() => {
    if (l1.current) l1.current.intensity = env.night * 260
  })
  return (
    <>
      <primitive object={target} />
      <spotLight ref={l1} position={[15.3, 1.5, 0.5]} angle={0.5} penumbra={0.6} distance={45} decay={1.4} color="#fff3d6" intensity={0} />
    </>
  )
}

export function Conditions() {
  const conditions = useApp((s) => s.conditions)
  const instant = useApp((s) => s.conditionsInstant)
  const scene = useThree((s) => s.scene)
  const sun = useRef<THREE.DirectionalLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const fog = useMemo(() => new THREE.Fog(PAL.fogDay.clone(), 60, 340), [])
  const target = useRef({ night: 0, snow: 0 })

  useEffect(() => {
    scene.fog = fog
    return () => {
      scene.fog = null
    }
  }, [scene, fog])

  useEffect(() => {
    target.current = { night: conditions.time === 'night' ? 1 : 0, snow: conditions.weather === 'snow' ? 1 : 0 }
    if (instant) {
      env.night = target.current.night
      env.snow = target.current.snow
    }
  }, [conditions, instant])

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 2.6)
    env.night += (target.current.night - env.night) * k
    env.snow += (target.current.snow - env.snow) * k
    const st = useApp.getState()
    const genT = st.stage === 'generating' && st.genPhase === 'lift' ? 1 : 0
    env.gen += (genT - env.gen) * (1 - Math.exp(-dt * 5))
    const n = env.night
    const s = env.snow
    const m = mats()

    fog.color.copy(PAL.fogDay).lerp(PAL.fogSnow, s).lerp(PAL.fogNight, n).lerp(PAL.gen, env.gen)
    fog.near = THREE.MathUtils.lerp(60, 8, s) * (1 - n * 0.4)
    fog.far = THREE.MathUtils.lerp(340, 120, s) * (1 - n * 0.55)

    if (sun.current) {
      sun.current.intensity = THREE.MathUtils.lerp(2.6, 0.55, s) * (1 - n) + n * 0.12
      sun.current.color.set(n > 0.5 ? '#8fa7d6' : '#fff6e8')
      sun.current.castShadow = n < 0.5
    }
    if (hemi.current) {
      hemi.current.intensity = THREE.MathUtils.lerp(1.0, 1.35, s) * (1 - n) + n * 0.07
    }
    m.snowCap.opacity = s * 0.8
    m.snowCap.visible = s > 0.01
    m.headlight.emissiveIntensity = 0.3 + n * 7
    m.taillight.emissiveIntensity = 0.1 + n * 3
    m.marker.emissiveIntensity = 0.1 + n * 3
    m.lamp.emissiveIntensity = n * 9
    m.window.emissiveIntensity = n * 1.6
  })

  return (
    <>
      <SkyDome />
      <hemisphereLight ref={hemi} args={['#dbe7f3', '#5d5a52', 1]} />
      <directionalLight
        ref={sun}
        position={[45, 70, 35]}
        intensity={2.6}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-camera-near={10}
        shadow-camera-far={200}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
      {POLES.filter((p) => p.lit).map((p, i) => (
        <Floodlight key={i} p={p.p} dir={p.dir} />
      ))}
      <Headlights />
      <Snowfall />
    </>
  )
}
