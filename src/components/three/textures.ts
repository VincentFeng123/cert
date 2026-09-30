import * as THREE from 'three'

// Procedural surface textures painted once onto canvases. Seeded randomness keeps
// every visit identical, and nothing is fetched over the network.

type Draw = (ctx: CanvasRenderingContext2D, size: number, random: () => number) => void

const sources = new Map<string, THREE.Texture>()
const variants = new Map<string, THREE.Texture>()

function seeded(seed: number) {
  let state = seed | 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash(text: string) {
  let value = 2166136261
  for (let index = 0; index < text.length; index++) value = Math.imul(value ^ text.charCodeAt(index), 16777619)
  return value
}

function painted(key: string, size: number, draw: Draw, color: boolean, repeat: [number, number]) {
  const variantKey = `${key}:${repeat.join('x')}`
  const cached = variants.get(variantKey)
  if (cached) return cached
  let source = sources.get(key)
  if (!source) {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')
    if (ctx) draw(ctx, size, seeded(hash(key)))
    source = new THREE.CanvasTexture(canvas)
    source.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace
    source.anisotropy = 4
    sources.set(key, source)
  }
  // Clones share the uploaded image; only the tiling differs.
  const texture = source.clone()
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(...repeat)
  texture.needsUpdate = true
  variants.set(variantKey, texture)
  return texture
}

const shade = (hex: string, amount: number) => `#${new THREE.Color(hex).offsetHSL(0, 0, amount).getHexString()}`

function speckle(ctx: CanvasRenderingContext2D, size: number, random: () => number, count: number, colors: string[], alpha: number, radius = 1.2) {
  for (let index = 0; index < count; index++) {
    ctx.globalAlpha = alpha * (0.4 + random() * 0.6)
    ctx.fillStyle = colors[Math.floor(random() * colors.length)]
    ctx.beginPath()
    ctx.arc(random() * size, random() * size, radius * (0.4 + random()), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

/** Oak plank flooring; planks run along the texture's x axis. */
export function woodFloorTexture(repeat: [number, number] = [1, 1], tones = ['#b98f66', '#a97e57', '#c29a70', '#b08560', '#9d744f']) {
  return painted(`wood:${tones.join()}`, 512, (ctx, size, random) => {
    const rows = 8
    const rowHeight = size / rows
    for (let row = 0; row < rows; row++) {
      const top = row * rowHeight
      let x = -random() * size * 0.6
      while (x < size) {
        const length = size * (0.45 + random() * 0.45)
        const tone = tones[Math.floor(random() * tones.length)]
        ctx.fillStyle = tone
        ctx.fillRect(x, top, length, rowHeight)
        // Long, slightly wavy grain lines with occasional darker figure.
        for (let line = 0; line < 26; line++) {
          const y = top + random() * rowHeight
          const wave = 1 + random() * 2.5
          const phase = random() * Math.PI * 2
          ctx.strokeStyle = random() > 0.8 ? shade(tone, -0.12) : shade(tone, random() > 0.5 ? -0.05 : 0.04)
          ctx.globalAlpha = 0.18 + random() * 0.3
          ctx.lineWidth = 0.6 + random() * 1.6
          ctx.beginPath()
          for (let step = 0; step <= 40; step++) {
            const px = x + (length * step) / 40
            const py = y + Math.sin(step * 0.35 + phase) * wave
            if (step === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          }
          ctx.stroke()
        }
        if (random() > 0.7) {
          const kx = x + length * (0.2 + random() * 0.6)
          const ky = top + rowHeight * (0.3 + random() * 0.4)
          ctx.globalAlpha = 0.35
          ctx.fillStyle = shade(tone, -0.18)
          ctx.beginPath()
          ctx.ellipse(kx, ky, 5 + random() * 6, 2.5 + random() * 2, 0, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 0.55
        ctx.fillStyle = '#4a3526'
        ctx.fillRect(x, top, 2, rowHeight)
        ctx.globalAlpha = 1
        x += length
      }
      ctx.fillStyle = '#3f2e22'
      ctx.globalAlpha = 0.6
      ctx.fillRect(0, top, size, 2.5)
      ctx.globalAlpha = 1
    }
  }, true, repeat)
}

/** Low-pile area rug with a border band. */
export function rugTexture(repeat: [number, number] = [1, 1], base = '#d9d2c4', border = '#8a9a8f', accent = '#b9a58c') {
  return painted(`rug:${base}${border}${accent}`, 512, (ctx, size, random) => {
    ctx.fillStyle = base
    ctx.fillRect(0, 0, size, size)
    const band = size * 0.07
    ctx.strokeStyle = border
    ctx.lineWidth = band * 0.55
    ctx.strokeRect(band, band, size - band * 2, size - band * 2)
    ctx.strokeStyle = accent
    ctx.lineWidth = band * 0.14
    ctx.strokeRect(band * 1.75, band * 1.75, size - band * 3.5, size - band * 3.5)
    ctx.globalAlpha = 0.28
    ctx.strokeStyle = accent
    ctx.lineWidth = 3
    const cell = size / 9
    for (let row = 2; row < 8; row++) {
      for (let column = 2; column < 8; column++) {
        const cx = column * cell
        const cy = row * cell
        ctx.beginPath()
        ctx.moveTo(cx, cy - cell * 0.3)
        ctx.lineTo(cx + cell * 0.3, cy)
        ctx.lineTo(cx, cy + cell * 0.3)
        ctx.lineTo(cx - cell * 0.3, cy)
        ctx.closePath()
        ctx.stroke()
      }
    }
    ctx.globalAlpha = 1
    speckle(ctx, size, random, 6500, [shade(base, -0.08), shade(base, 0.05), shade(border, 0.05)], 0.22, 0.6)
  }, true, repeat)
}

/** Commercial vinyl floor tiles with fine speckle and grout. */
export function tileTexture(repeat: [number, number] = [1, 1], base = '#e3e1da') {
  return painted(`tile:${base}`, 512, (ctx, size, random) => {
    const tiles = 4
    const cell = size / tiles
    for (let row = 0; row < tiles; row++) {
      for (let column = 0; column < tiles; column++) {
        ctx.fillStyle = shade(base, (random() - 0.5) * 0.035)
        ctx.fillRect(column * cell, row * cell, cell, cell)
      }
    }
    speckle(ctx, size, random, 3500, [shade(base, -0.22), shade(base, -0.12), '#9aa3a6', '#b7a58e'], 0.35, 0.7)
    ctx.fillStyle = shade(base, -0.2)
    for (let index = 0; index <= tiles; index++) {
      ctx.fillRect(index * cell - 1.5, 0, 3, size)
      ctx.fillRect(0, index * cell - 1.5, size, 3)
    }
  }, true, repeat)
}

/** Short lawn grass seen from above. */
export function grassTexture(repeat: [number, number] = [1, 1]) {
  return painted('grass', 256, (ctx, size, random) => {
    ctx.fillStyle = '#6f8d55'
    ctx.fillRect(0, 0, size, size)
    const greens = ['#5c7a45', '#7f9c5f', '#6a8a4d', '#8aa866', '#56703f', '#94ad6f']
    for (let index = 0; index < 4000; index++) {
      const x = random() * size
      const y = random() * size
      const angle = -Math.PI / 2 + (random() - 0.5) * 1.2
      const length = 1.5 + random() * 3
      ctx.strokeStyle = greens[Math.floor(random() * greens.length)]
      ctx.globalAlpha = 0.5 + random() * 0.5
      ctx.lineWidth = 0.5 + random() * 0.5
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }, true, repeat)
}

/** Brushed concrete paving. */
export function concreteTexture(repeat: [number, number] = [1, 1], base = '#c9c7c1') {
  return painted(`concrete:${base}`, 256, (ctx, size, random) => {
    ctx.fillStyle = base
    ctx.fillRect(0, 0, size, size)
    for (let index = 0; index < 24; index++) {
      const gradient = ctx.createRadialGradient(random() * size, random() * size, 0, random() * size, random() * size, 20 + random() * 45)
      gradient.addColorStop(0, `${shade(base, random() > 0.5 ? 0.03 : -0.04)}66`)
      gradient.addColorStop(1, `${base}00`)
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
    }
    speckle(ctx, size, random, 2400, [shade(base, -0.18), shade(base, 0.08), '#8f8a80'], 0.3, 0.6)
    ctx.fillStyle = shade(base, -0.2)
    ctx.fillRect(0, size / 2 - 1, size, 2)
    ctx.fillRect(0, 0, size, 2)
  }, true, repeat)
}

/** Grayscale plaster noise for walls (use as a bump map). */
export function plasterBump(repeat: [number, number] = [1, 1]) {
  return painted('plaster', 256, (ctx, size, random) => {
    ctx.fillStyle = '#808080'
    ctx.fillRect(0, 0, size, size)
    speckle(ctx, size, random, 9000, ['#6a6a6a', '#959595', '#7a7a7a', '#8c8c8c'], 0.5, 1.4)
  }, false, repeat)
}

/** Grayscale strand streaks for hair; runs along the sphere's meridians. */
export function hairStrandBump() {
  return painted('hair', 256, (ctx, size, random) => {
    ctx.fillStyle = '#808080'
    ctx.fillRect(0, 0, size, size)
    for (let index = 0; index < 900; index++) {
      const x = random() * size
      ctx.strokeStyle = random() > 0.5 ? '#b0b0b0' : '#4c4c4c'
      ctx.globalAlpha = 0.25 + random() * 0.45
      ctx.lineWidth = 0.6 + random() * 1.4
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.bezierCurveTo(x + (random() - 0.5) * 6, size * 0.33, x + (random() - 0.5) * 6, size * 0.66, x + (random() - 0.5) * 4, size)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }, false, [10, 1])
}

/** Woven upholstery / clothing weave (grayscale bump). */
export function weaveBump(repeat: [number, number] = [1, 1]) {
  return painted('weave', 128, (ctx, size, random) => {
    ctx.fillStyle = '#808080'
    ctx.fillRect(0, 0, size, size)
    const step = 4
    for (let y = 0; y < size; y += step) {
      for (let x = 0; x < size; x += step) {
        const over = ((x + y) / step) % 2 === 0
        ctx.fillStyle = over ? '#a2a2a2' : '#5e5e5e'
        ctx.globalAlpha = 0.6 + random() * 0.4
        ctx.fillRect(x, y, step - 0.6, step - 0.6)
      }
    }
    ctx.globalAlpha = 1
  }, false, repeat)
}

/** Closed-cell foam training mat: fine pebbled grain (grayscale bump). */
export function pebbleBump(repeat: [number, number] = [1, 1]) {
  return painted('pebble', 256, (ctx, size, random) => {
    ctx.fillStyle = '#808080'
    ctx.fillRect(0, 0, size, size)
    speckle(ctx, size, random, 5200, ['#a8a8a8', '#5a5a5a'], 0.55, 2.1)
  }, false, repeat)
}

/** Illuminated green exit sign face, drawn for a 2:1 panel. */
export function exitSignTexture() {
  return painted('exit-sign', 256, ctx => {
    ctx.fillStyle = '#f3f7f2'
    ctx.fillRect(0, 0, 256, 256)
    ctx.strokeStyle = '#0f7a43'
    ctx.lineWidth = 14
    ctx.strokeRect(10, 14, 236, 228)
    // The canvas is square but maps onto a 2:1 sign, so draw text half-width.
    ctx.save()
    ctx.scale(0.5, 1)
    ctx.fillStyle = '#128a4c'
    ctx.font = 'bold 170px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('EXIT', 256, 136)
    ctx.restore()
  }, true, [1, 1])
}
