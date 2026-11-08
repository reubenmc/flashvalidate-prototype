import { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, Noise, Vignette, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { useApp } from '../store'
import { Yard } from './Yard'
import { Conditions } from './Conditions'
import { CameraRig } from './CameraRig'
import { CaptureBridge } from './Capture'
import { SplatAssemble } from './SplatAssemble'
import { Bird } from './Bird'
import { CAM03 } from '../data/scenarios'

function Scene() {
  const root = useRef<THREE.Group>(null)
  const meshesVisible = useApp((s) => s.meshesVisible)
  const genPhase = useApp((s) => s.genPhase)
  const stage = useApp((s) => s.stage)
  const sampling = stage === 'generating' && genPhase !== 'depth'
  return (
    <>
      <Conditions />
      <group ref={root} visible={meshesVisible}>
        <Yard />
      </group>
      <Bird />
      <SplatAssemble root={root} active={sampling} />
      <CameraRig />
      <CaptureBridge />
    </>
  )
}

export function Viewport({ dpr = [1, 1.75] as number | [number, number] }: { dpr?: number | [number, number] }) {
  return (
    <Canvas
      shadows
      dpr={dpr}
      gl={{ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
      camera={{ position: CAM03.position, fov: CAM03.fov, near: 0.3, far: 900 }}
      onCreated={({ camera }) => camera.lookAt(...CAM03.target)}
    >
      <Suspense fallback={null}>
        <Scene />
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur luminanceThreshold={0.85} luminanceSmoothing={0.2} intensity={0.9} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette eskil={false} offset={0.25} darkness={0.55} />
          <Noise opacity={0.035} premultiply />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}
