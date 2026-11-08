import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'

// Visualizes generation: points start on the original photo's image plane
// (so from the source camera they look like the photo), then lift to their
// true depth as 3D Gaussians while the camera pulls away.

const TOTAL = 170000

const avgCache = new WeakMap<THREE.Texture, THREE.Color>()
function avgColor(tex: THREE.Texture) {
  const hit = avgCache.get(tex)
  if (hit) return hit
  const out = new THREE.Color(0.8, 0.8, 0.8)
  const img = tex.image as CanvasImageSource | undefined
  if (img) {
    const c = document.createElement('canvas')
    c.width = c.height = 8
    const ctx = c.getContext('2d')!
    try {
      ctx.drawImage(img, 0, 0, 8, 8)
      const d = ctx.getImageData(0, 0, 8, 8).data
      let r = 0, g = 0, b = 0
      for (let i = 0; i < d.length; i += 4) {
        r += d[i]
        g += d[i + 1]
        b += d[i + 2]
      }
      const n = d.length / 4
      out.setRGB(r / n / 255, g / n / 255, b / n / 255, THREE.SRGBColorSpace)
    } catch {
      /* ignore */
    }
  }
  avgCache.set(tex, out)
  return out
}

/** Shared, mutable animation state driven by the generation flow. */
export const genAnim = { progress: 0, fade: 0 }

interface Props {
  root: React.RefObject<THREE.Group | null>
  active: boolean // sample the scene when this turns true
}

export function SplatAssemble({ root, active }: Props) {
  const camera = useThree((s) => s.camera)
  const geo = useMemo(() => new THREE.BufferGeometry(), [])
  const ready = useRef(false)
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uT: { value: 0 }, uFade: { value: 1 }, uScale: { value: 1 } },
        vertexShader: `
          attribute vec3 aStart; attribute vec3 aColor; attribute float aRand;
          uniform float uT; uniform float uScale;
          varying vec3 vColor; varying float vR;
          void main(){
            float d = clamp((uT - aRand*0.35) / 0.65, 0.0, 1.0);
            float e = d*d*(3.0-2.0*d);
            vec3 p = mix(aStart, position, e);
            vec4 mv = modelViewMatrix * vec4(p,1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = uScale * (0.26 + 0.16*aRand) * (300.0 / -mv.z);
            vColor = aColor; vR = aRand;
          }`,
        fragmentShader: `
          uniform float uFade; varying vec3 vColor; varying float vR;
          void main(){
            vec2 c = gl_PointCoord - 0.5; float r = dot(c,c);
            if (r > 0.25) discard;
            float a = exp(-r*6.0);
            gl_FragColor = vec4(vColor, a * uFade);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  )

  // Sample the scene once when activated, from the current (source) camera.
  useEffect(() => {
    if (!active || !root.current) return
    const group = root.current
    group.updateMatrixWorld(true)
    const meshes: { mesh: THREE.Mesh; area: number }[] = []
    group.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh || (m as unknown as THREE.InstancedMesh).isInstancedMesh) return
      let skip = false
      let p: THREE.Object3D | null = m
      while (p) {
        if (p.userData?.noSample) skip = true
        p = p.parent
      }
      if (skip) return
      const g = m.geometry
      if (!g.attributes.position) return
      // approximate world area from bounding box
      if (!g.boundingBox) g.computeBoundingBox()
      const s = new THREE.Vector3()
      g.boundingBox!.getSize(s)
      const scale = new THREE.Vector3()
      m.getWorldScale(scale)
      s.multiply(scale)
      const area = s.x * s.y + s.y * s.z + s.x * s.z
      meshes.push({ mesh: m, area: Math.sqrt(Math.max(area, 0.01)) })
    })
    const totalW = meshes.reduce((a, b) => a + b.area, 0)
    const pos: number[] = []
    const start: number[] = []
    const col: number[] = []
    const rnd: number[] = []
    const tmp = new THREE.Vector3()
    const n = new THREE.Vector3()
    const camPos = camera.position.clone()
    const color = new THREE.Color()
    for (const { mesh, area } of meshes) {
      const k = Math.max(4, Math.round((area / totalW) * TOTAL))
      let sampler: MeshSurfaceSampler
      try {
        sampler = new MeshSurfaceSampler(mesh).build()
      } catch {
        continue
      }
      const mat0 = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial
      const base = mat0?.color ? mat0.color.clone() : new THREE.Color('#999')
      if (mat0?.map) base.multiply(avgColor(mat0.map))
      for (let i = 0; i < k; i++) {
        sampler.sample(tmp, n)
        tmp.applyMatrix4(mesh.matrixWorld)
        pos.push(tmp.x, tmp.y, tmp.z)
        const dir = tmp.clone().sub(camPos)
        const dist = dir.length()
        dir.normalize()
        const d0 = Math.min(dist, 22)
        start.push(camPos.x + dir.x * d0, camPos.y + dir.y * d0, camPos.z + dir.z * d0)
        color.copy(base).multiplyScalar(0.8 + Math.random() * 0.35)
        col.push(color.r, color.g, color.b)
        rnd.push(Math.random())
      }
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    geo.setAttribute('aStart', new THREE.Float32BufferAttribute(start, 3))
    geo.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3))
    geo.setAttribute('aRand', new THREE.Float32BufferAttribute(rnd, 1))
    geo.computeBoundingSphere()
    ready.current = true
  }, [active, root, camera, geo])

  const pts = useRef<THREE.Points>(null)
  useFrame(({ size }) => {
    mat.uniforms.uT.value = genAnim.progress
    mat.uniforms.uFade.value = genAnim.fade
    mat.uniforms.uScale.value = size.height / 800
    if (pts.current) pts.current.visible = ready.current && genAnim.fade > 0.001
  })

  return <points ref={pts} geometry={geo} material={mat} frustumCulled={false} userData={{ noSample: true }} />
}
