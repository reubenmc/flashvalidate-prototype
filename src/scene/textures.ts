import * as THREE from 'three'

// All textures are generated procedurally so the app runs fully offline.

const cache = new Map<string, THREE.Texture>()

function make(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const hit = cache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  draw(ctx)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repeat[0], repeat[1])
  }
  cache.set(key, t)
  return t
}

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

export function asphaltTexture() {
  return make(
    'asphalt',
    1024,
    1024,
    (ctx) => {
      ctx.fillStyle = '#5b5f65'
      ctx.fillRect(0, 0, 1024, 1024)
      const r = rng(11)
      for (let i = 0; i < 90000; i++) {
        const v = 70 + r() * 60
        ctx.fillStyle = `rgba(${v},${v + 2},${v + 6},${0.25 + r() * 0.3})`
        ctx.fillRect(r() * 1024, r() * 1024, 1.5, 1.5)
      }
      // tar seams / cracks
      ctx.strokeStyle = 'rgba(30,32,36,0.45)'
      ctx.lineWidth = 1.4
      for (let i = 0; i < 14; i++) {
        ctx.beginPath()
        let x = r() * 1024
        let y = r() * 1024
        ctx.moveTo(x, y)
        for (let k = 0; k < 8; k++) {
          x += (r() - 0.5) * 70
          y += (r() - 0.5) * 70
          ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      // oil stains
      for (let i = 0; i < 10; i++) {
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 40)
        g.addColorStop(0, 'rgba(25,25,28,0.28)')
        g.addColorStop(1, 'rgba(25,25,28,0)')
        ctx.save()
        ctx.translate(r() * 1024, r() * 1024)
        ctx.scale(1, 0.6)
        ctx.fillStyle = g
        ctx.fillRect(-40, -40, 80, 80)
        ctx.restore()
      }
    },
    [10, 10],
  )
}

export function concreteTexture() {
  return make(
    'concrete',
    512,
    512,
    (ctx) => {
      ctx.fillStyle = '#a9acaf'
      ctx.fillRect(0, 0, 512, 512)
      const r = rng(5)
      for (let i = 0; i < 30000; i++) {
        const v = 150 + r() * 50
        ctx.fillStyle = `rgba(${v},${v},${v + 3},0.25)`
        ctx.fillRect(r() * 512, r() * 512, 1.5, 1.5)
      }
      ctx.strokeStyle = 'rgba(70,72,76,0.6)'
      ctx.lineWidth = 2
      ctx.strokeRect(1, 1, 510, 510)
    },
    [16, 3],
  )
}

export function gravelTexture() {
  return make(
    'gravel',
    512,
    512,
    (ctx) => {
      ctx.fillStyle = '#7d7a70'
      ctx.fillRect(0, 0, 512, 512)
      const r = rng(23)
      for (let i = 0; i < 40000; i++) {
        const v = 90 + r() * 80
        ctx.fillStyle = `rgba(${v},${v - 4},${v - 12},0.5)`
        ctx.fillRect(r() * 512, r() * 512, 2, 2)
      }
    },
    [20, 20],
  )
}

/** Vertical corrugation, used for walls, trailers and containers. */
export function corrugatedTexture(base: string, key: string, ribs = 64, repeatX = 1) {
  return make(
    `corr-${key}`,
    512,
    256,
    (ctx) => {
      ctx.fillStyle = base
      ctx.fillRect(0, 0, 512, 256)
      const w = 512 / ribs
      for (let i = 0; i < ribs; i++) {
        const g = ctx.createLinearGradient(i * w, 0, (i + 1) * w, 0)
        g.addColorStop(0, 'rgba(255,255,255,0.10)')
        g.addColorStop(0.5, 'rgba(0,0,0,0.10)')
        g.addColorStop(1, 'rgba(255,255,255,0.06)')
        ctx.fillStyle = g
        ctx.fillRect(i * w, 0, w, 256)
      }
      // grime toward the bottom
      const gr = ctx.createLinearGradient(0, 160, 0, 256)
      gr.addColorStop(0, 'rgba(60,50,40,0)')
      gr.addColorStop(1, 'rgba(60,50,40,0.22)')
      ctx.fillStyle = gr
      ctx.fillRect(0, 0, 512, 256)
    },
    [repeatX, 1],
  )
}

export function rollupDoorTexture() {
  return make('rollup', 256, 256, (ctx) => {
    ctx.fillStyle = '#c9ccd0'
    ctx.fillRect(0, 0, 256, 256)
    for (let y = 0; y < 256; y += 12) {
      ctx.fillStyle = 'rgba(0,0,0,0.16)'
      ctx.fillRect(0, y, 256, 2)
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.fillRect(0, y + 2, 256, 1)
    }
    ctx.fillStyle = '#e8b400'
    ctx.fillRect(0, 238, 256, 18)
    ctx.fillStyle = '#222'
    for (let x = 0; x < 256; x += 32) {
      ctx.beginPath()
      ctx.moveTo(x, 256)
      ctx.lineTo(x + 16, 238)
      ctx.lineTo(x + 32, 238)
      ctx.lineTo(x + 16, 256)
      ctx.fill()
    }
  })
}

export function trailerSideTexture(brand: string, sub: string, accent: string) {
  return make(`trailer-${brand}`, 2048, 384, (ctx) => {
    ctx.fillStyle = '#f2f3f4'
    ctx.fillRect(0, 0, 2048, 384)
    // panel seams + rivet posts
    for (let x = 0; x < 2048; x += 64) {
      ctx.fillStyle = 'rgba(0,0,0,0.07)'
      ctx.fillRect(x, 0, 3, 384)
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      for (let y = 8; y < 384; y += 22) ctx.fillRect(x + 1, y, 2, 2)
    }
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.fillRect(0, 0, 2048, 10)
    ctx.fillRect(0, 370, 2048, 14)
    // grime
    const gr = ctx.createLinearGradient(0, 260, 0, 384)
    gr.addColorStop(0, 'rgba(80,70,60,0)')
    gr.addColorStop(1, 'rgba(80,70,60,0.28)')
    ctx.fillStyle = gr
    ctx.fillRect(0, 0, 2048, 384)
    // brand
    ctx.fillStyle = accent
    ctx.fillRect(140, 128, 70, 120)
    ctx.fillStyle = '#1f2937'
    ctx.font = '800 120px Inter Variable, Helvetica, Arial, sans-serif'
    ctx.textBaseline = 'middle'
    ctx.fillText(brand, 240, 180)
    ctx.font = '600 44px Inter Variable, Helvetica, Arial, sans-serif'
    ctx.fillStyle = '#4b5563'
    ctx.fillText(sub, 246, 276)
  })
}

export function trailerRearTexture(id: string) {
  return make(`rear-${id}`, 256, 320, (ctx) => {
    ctx.fillStyle = '#e5e7ea'
    ctx.fillRect(0, 0, 256, 320)
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.fillRect(126, 0, 4, 320)
    ctx.fillRect(0, 0, 256, 8)
    ctx.fillRect(0, 0, 8, 320)
    ctx.fillRect(248, 0, 8, 320)
    // lock bars
    ctx.fillStyle = '#9ca3af'
    for (const x of [40, 90, 166, 216]) ctx.fillRect(x, 10, 6, 300)
    ctx.fillStyle = '#dc2626'
    ctx.fillRect(0, 300, 256, 10)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(10, 300, 40, 10)
    ctx.fillRect(120, 300, 40, 10)
    ctx.fillRect(206, 300, 40, 10)
    ctx.fillStyle = '#111827'
    ctx.font = '700 34px Inter Variable, Helvetica, Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(id, 128, 60)
  })
}

export function decalTexture(text: string, opts: { bg?: string; fg?: string; w?: number; h?: number; size?: number; weight?: number } = {}) {
  const { bg = 'transparent', fg = '#111', w = 256, h = 128, size = 72, weight = 800 } = opts
  return make(`decal-${text}-${bg}-${fg}-${w}x${h}`, w, h, (ctx) => {
    if (bg !== 'transparent') {
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)
    }
    ctx.fillStyle = fg
    ctx.font = `${weight} ${size}px Inter Variable, Helvetica, Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, w / 2, h / 2 + 2)
  })
}

export function chainLinkTexture() {
  return make(
    'chainlink',
    128,
    128,
    (ctx) => {
      ctx.clearRect(0, 0, 128, 128)
      ctx.strokeStyle = 'rgba(180,186,192,0.9)'
      ctx.lineWidth = 2
      for (let i = -128; i < 256; i += 16) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i + 128, 128)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(i + 128, 0)
        ctx.lineTo(i, 128)
        ctx.stroke()
      }
    },
    [1, 1],
  )
}

export function grilleTexture() {
  return make('grille', 128, 128, (ctx) => {
    ctx.fillStyle = '#1b1d21'
    ctx.fillRect(0, 0, 128, 128)
    ctx.fillStyle = '#9aa1a9'
    for (let y = 6; y < 128; y += 12) ctx.fillRect(6, y, 116, 4)
    ctx.strokeStyle = '#c8cdd2'
    ctx.lineWidth = 6
    ctx.strokeRect(3, 3, 122, 122)
  })
}
