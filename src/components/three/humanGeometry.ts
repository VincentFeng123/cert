import * as THREE from 'three'

// Anthropometric figure in meters: standing height ≈ 1.74, origin between the
// feet, facing +z. "l" is the figure's own left, which sits on +x.

export type Build = 'male' | 'female'
export type HairStyle = 'crop' | 'short' | 'medium' | 'long' | 'bun' | 'ponytail' | 'none'
export type HandPose = 'relaxed' | 'open' | 'fist' | 'cup' | 'grip'

export const BODY = {
  hipY: 0.87,
  hipX: 0.088,
  thigh: 0.39,
  shin: 0.4,
  spineY: 0.95,
  shoulderY: 1.39,
  shoulderZ: -0.012,
  neckY: 1.47,
  headY: 1.612,
  headZ: 0.012,
  upperArm: 0.295,
  forearm: 0.25,
} as const

export const shoulderX = (build: Build) => (build === 'female' ? 0.166 : 0.18)
export const HEAD = { w: 0.075, h: 0.112, d: 0.097 } as const

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
const bump = (dx: number, dy: number) => Math.exp(-(dx * dx + dy * dy))

/** Sculpted head surface for a unit direction (x right, y up, z = face). */
export function headSurface(ux: number, uy: number, uz: number, out = new THREE.Vector3()) {
  const ax = Math.abs(ux)
  const lower = smoothstep(-0.12, -1, uy)
  const back = smoothstep(0.05, -0.9, uz)
  const front = smoothstep(0.35, 0.95, uz)
  let x = ux * HEAD.w * (1 - 0.26 * lower * lower - 0.04 * lower)
  let y = uy * HEAD.h
  let z = uz * HEAD.d
  if (uy < 0) {
    // The skull base tucks toward the neck while the jaw stays forward.
    const under = smoothstep(0, -1, uy)
    y *= 1 - 0.3 * back * under
    z *= 1 - 0.3 * back * smoothstep(0.1, -1, uy)
  }
  z += 0.012 * lower * smoothstep(-0.3, 0.6, uz)
  z -= 0.006 * back * bump(ux / 0.55, (uy - 0.12) / 0.45)
  z -= 0.006 * front * smoothstep(0.3, 1, uy)
  z += 0.004 * front * bump((ax - 0.36) / 0.3, (uy - 0.17) / 0.08)
  z -= 0.0065 * front * bump((ax - 0.38) / 0.17, (uy - 0.01) / 0.12)
  const cheek = 0.0045 * bump((ax - 0.62) / 0.2, (uy + 0.16) / 0.14) * smoothstep(0.2, 0.7, uz)
  x += Math.sign(ux) * cheek
  z += cheek * 0.6
  z += 0.009 * front * bump(ux / 0.09, (uy + 0.12) / 0.2)
  z += 0.006 * bump(ux / 0.3, (uy + 0.86) / 0.12) * smoothstep(0.1, 0.5, uz)
  return out.set(x, y, z)
}

/** Point on the face for a direction given by its x/y components (z solved). */
export function facePoint(ux: number, uy: number) {
  const uz = Math.sqrt(Math.max(0, 1 - ux * ux - uy * uy))
  return headSurface(ux, uy, uz)
}

/** Average normals of coincident vertices so UV seams and poles shade smoothly. */
function weldNormals(geometry: THREE.BufferGeometry) {
  geometry.computeVertexNormals()
  const position = geometry.attributes.position
  const normal = geometry.attributes.normal
  const groups = new Map<string, number[]>()
  for (let index = 0; index < position.count; index++) {
    const key = `${position.getX(index).toFixed(5)},${position.getY(index).toFixed(5)},${position.getZ(index).toFixed(5)}`
    const list = groups.get(key)
    if (list) list.push(index)
    else groups.set(key, [index])
  }
  const sum = new THREE.Vector3()
  for (const list of groups.values()) {
    if (list.length < 2) continue
    sum.set(0, 0, 0)
    for (const index of list) sum.add(new THREE.Vector3().fromBufferAttribute(normal, index))
    sum.normalize()
    for (const index of list) normal.setXYZ(index, sum.x, sum.y, sum.z)
  }
  normal.needsUpdate = true
}

const cache = new Map<string, THREE.BufferGeometry>()
function cached(key: string, build: () => THREE.BufferGeometry) {
  let geometry = cache.get(key)
  if (!geometry) {
    geometry = build()
    cache.set(key, geometry)
  }
  return geometry
}

// Seam at the back of the head (phiStart −π/2) where hair covers it.
const sphere = (w: number, h: number) => new THREE.SphereGeometry(1, w, h, -Math.PI / 2)

export function headGeometry() {
  return cached('head', () => {
    const geometry = sphere(72, 54)
    const position = geometry.attributes.position
    const point = new THREE.Vector3()
    for (let index = 0; index < position.count; index++) {
      point.fromBufferAttribute(position, index)
      headSurface(point.x, point.y, point.z, point)
      position.setXYZ(index, point.x, point.y, point.z)
    }
    weldNormals(geometry)
    return geometry
  })
}

// Hairline height (unit head y) sampled at azimuths [front, temple, above ear, behind ear, nape].
const AZIMUTHS = [0, 0.7, 1.45, 2.0, Math.PI]
const HAIRLINES: Record<Exclude<HairStyle, 'none'>, number[]> = {
  crop: [0.62, 0.5, 0.22, -0.18, -0.48],
  short: [0.56, 0.44, 0.16, -0.26, -0.56],
  medium: [0.5, 0.3, -0.25, -0.5, -0.72],
  long: [0.52, 0.28, -0.4, -0.62, -0.9],
  bun: [0.6, 0.44, 0.12, -0.28, -0.56],
  ponytail: [0.6, 0.44, 0.12, -0.28, -0.56],
}
const VOLUME: Record<Exclude<HairStyle, 'none'>, [number, number]> = {
  crop: [0.0022, 0.0018],
  short: [0.0055, 0.011],
  medium: [0.009, 0.014],
  long: [0.009, 0.013],
  bun: [0.004, 0.004],
  ponytail: [0.004, 0.004],
}

function hairlineAt(style: Exclude<HairStyle, 'none'>, azimuth: number) {
  const heights = HAIRLINES[style]
  for (let index = 1; index < AZIMUTHS.length; index++) {
    if (azimuth <= AZIMUTHS[index]) {
      const t = (azimuth - AZIMUTHS[index - 1]) / (AZIMUTHS[index] - AZIMUTHS[index - 1])
      return heights[index - 1] + (heights[index] - heights[index - 1]) * t
    }
  }
  return heights[heights.length - 1]
}

/**
 * Hair shell grown from the head surface. Outside the hairline the shell sinks
 * just beneath the skin, so the hairline reads as a soft edge.
 */
export function hairGeometry(style: HairStyle) {
  if (style === 'none') return null
  return cached(`hair:${style}`, () => {
    const geometry = sphere(64, 48)
    const position = geometry.attributes.position
    const point = new THREE.Vector3()
    const normal = new THREE.Vector3()
    const [base, top] = VOLUME[style]
    for (let index = 0; index < position.count; index++) {
      const ux = position.getX(index)
      const uy = position.getY(index)
      const uz = position.getZ(index)
      const azimuth = Math.atan2(Math.abs(ux), uz)
      const line = hairlineAt(style, azimuth)
      const mask = smoothstep(line - 0.07, line + 0.09, uy)
      const clumps = 1 + 0.12 * Math.sin(azimuth * 17 + uy * 5) * Math.sin(uy * 11 + azimuth * 3)
      const thickness = (base + top * Math.max(0, uy)) * clumps + 0.0012 * ux
      headSurface(ux, uy, uz, point)
      normal.set(ux / HEAD.w, uy / HEAD.h, uz / HEAD.d).normalize()
      point.addScaledVector(normal, thickness * mask - 0.004 * (1 - mask))
      position.setXYZ(index, point.x, point.y, point.z)
    }
    weldNormals(geometry)
    return geometry
  })
}

type Section = [y: number, halfWidth: number, halfDepth: number, zCenter: number]
const TORSO: Record<Build, Section[]> = {
  male: [
    [0.755, 0.05, 0.05, 0], [0.78, 0.125, 0.09, -0.005], [0.82, 0.162, 0.108, -0.01], [0.87, 0.172, 0.112, -0.012],
    [0.93, 0.166, 0.108, -0.008], [1.0, 0.152, 0.1, -0.002], [1.06, 0.147, 0.098, 0.002], [1.13, 0.153, 0.103, 0.004],
    [1.21, 0.163, 0.111, 0.008], [1.29, 0.17, 0.114, 0.01], [1.35, 0.174, 0.108, 0.006], [1.395, 0.168, 0.096, 0],
    [1.43, 0.14, 0.08, -0.008], [1.455, 0.09, 0.064, -0.012], [1.475, 0.055, 0.05, -0.012],
  ],
  female: [
    [0.755, 0.05, 0.05, 0], [0.78, 0.13, 0.09, -0.008], [0.82, 0.17, 0.11, -0.014], [0.87, 0.178, 0.114, -0.016],
    [0.93, 0.165, 0.106, -0.01], [1.0, 0.142, 0.094, -0.002], [1.06, 0.132, 0.09, 0.002], [1.13, 0.138, 0.094, 0.004],
    [1.21, 0.148, 0.1, 0.006], [1.29, 0.155, 0.1, 0.006], [1.35, 0.158, 0.096, 0.004], [1.395, 0.152, 0.088, 0],
    [1.43, 0.126, 0.074, -0.006], [1.455, 0.08, 0.058, -0.01], [1.475, 0.05, 0.046, -0.01],
  ],
}

function sectionAt(sections: Section[], y: number): Section {
  if (y <= sections[0][0]) return sections[0]
  for (let index = 1; index < sections.length; index++) {
    const current = sections[index]
    if (y <= current[0]) {
      // Cubic Hermite with Catmull-Rom tangents for smooth, curvy contours.
      const previous = sections[index - 1]
      const before = sections[Math.max(0, index - 2)]
      const after = sections[Math.min(sections.length - 1, index + 1)]
      const span = current[0] - previous[0]
      const t = (y - previous[0]) / span
      const h00 = 2 * t ** 3 - 3 * t ** 2 + 1
      const h10 = t ** 3 - 2 * t ** 2 + t
      const h01 = -2 * t ** 3 + 3 * t ** 2
      const h11 = t ** 3 - t ** 2
      const value = (channel: 1 | 2 | 3) => {
        const m0 = ((current[channel] - before[channel]) / Math.max(1e-6, current[0] - before[0])) * span
        const m1 = ((after[channel] - previous[channel]) / Math.max(1e-6, after[0] - previous[0])) * span
        return h00 * previous[channel] + h10 * m0 + h01 * current[channel] + h11 * m1
      }
      return [y, value(1), value(2), value(3)]
    }
  }
  return sections[sections.length - 1]
}

/**
 * Torso shell between two heights, built from superellipse cross-sections.
 * `inflate` loosens the fit for clothing layered over another part.
 */
export function torsoGeometry(build: Build, fromY: number, toY: number, inflate = 1, capBottom = true, capTop = true) {
  return cached(`torso:${build}:${fromY}:${toY}:${inflate}:${capBottom}:${capTop}`, () => {
    const rings = Math.max(8, Math.round((toY - fromY) * 110))
    const segments = 48
    const exponent = 2 / 2.5
    const positions: number[] = []
    const indices: number[] = []
    for (let ring = 0; ring <= rings; ring++) {
      const y = fromY + ((toY - fromY) * ring) / rings
      const [, width, depth, center] = sectionAt(TORSO[build], y)
      // Shirts flare a touch at the hem.
      const hem = inflate > 1 ? 1 + (inflate - 1) * 1.6 * smoothstep(fromY + 0.05, fromY, y) : 1
      for (let segment = 0; segment < segments; segment++) {
        const angle = (segment / segments) * Math.PI * 2
        const c = Math.cos(angle)
        const s = Math.sin(angle)
        let x = width * inflate * hem * Math.sign(c) * Math.abs(c) ** exponent
        let z = depth * inflate * hem * Math.sign(s) * Math.abs(s) ** exponent
        const ax = Math.abs(x)
        if (s > 0) {
          z += build === 'female'
            ? 0.034 * bump((ax - 0.078) / 0.052, (y - 1.255) / 0.052) * s
            : 0.011 * bump((ax - 0.072) / 0.06, (y - 1.3) / 0.05) * s
        } else {
          z -= 0.008 * bump((ax - 0.08) / 0.06, (y - 1.3) / 0.08) * -s
          z -= (build === 'female' ? 0.018 : 0.014) * bump((ax - 0.072) / 0.07, (y - 0.84) / 0.06) * -s
        }
        x *= 1 + 0.02 * bump(0, (y - 1.35) / 0.05)
        positions.push(x, y, z + center)
      }
    }
    for (let ring = 0; ring < rings; ring++) {
      for (let segment = 0; segment < segments; segment++) {
        const a = ring * segments + segment
        const b = ring * segments + ((segment + 1) % segments)
        const c = a + segments
        const d = b + segments
        indices.push(a, c, b, b, c, d)
      }
    }
    const cap = (ring: number, flip: boolean) => {
      let cx = 0, cy = 0, cz = 0
      for (let segment = 0; segment < segments; segment++) {
        const offset = (ring * segments + segment) * 3
        cx += positions[offset]; cy += positions[offset + 1]; cz += positions[offset + 2]
      }
      const centerIndex = positions.length / 3
      positions.push(cx / segments, cy / segments + (flip ? -0.004 : 0.004), cz / segments)
      for (let segment = 0; segment < segments; segment++) {
        const a = ring * segments + segment
        const b = ring * segments + ((segment + 1) % segments)
        if (flip) indices.push(centerIndex, a, b)
        else indices.push(centerIndex, b, a)
      }
    }
    if (capBottom) cap(0, true)
    if (capTop) cap(rings, false)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    return geometry
  })
}

/**
 * Unit-length tapered limb along +y from −0.5 (r0) to +0.5 (r1) with a muscle
 * bulge and rounded ends. Scale y by `length`; radii and end caps stay true, so
 * neighbouring segments blend at the joint like a real elbow or knee.
 */
export function limbGeometry(r0: number, r1: number, bulge: number, bulgeAt: number, length: number) {
  return cached(`limb:${r0}:${r1}:${bulge}:${bulgeAt}:${length}`, () => {
    const points: THREE.Vector2[] = []
    const capSteps = 6
    for (let step = 0; step < capSteps; step++) {
      const angle = (step / capSteps) * (Math.PI / 2)
      points.push(new THREE.Vector2(Math.max(1e-4, r0 * Math.sin(angle)), -0.5 - (r0 * Math.cos(angle)) / length))
    }
    const steps = 18
    for (let step = 0; step <= steps; step++) {
      const t = step / steps
      const radius = r0 + (r1 - r0) * t + bulge * Math.exp(-(((t - bulgeAt) / 0.3) ** 2)) * Math.sin(Math.PI * t) ** 0.5
      points.push(new THREE.Vector2(radius, -0.5 + t))
    }
    for (let step = 1; step <= capSteps; step++) {
      const angle = (step / capSteps) * (Math.PI / 2)
      points.push(new THREE.Vector2(Math.max(1e-4, r1 * Math.cos(angle)), 0.5 + (r1 * Math.sin(angle)) / length))
    }
    return new THREE.LatheGeometry(points, 20)
  })
}

/**
 * Sleeve or cuff over the start of a unit limb. With `length` it gets a rounded
 * top that covers the limb's end cap (a shoulder); without, it is an open tube.
 */
export function sleeveGeometry(r0: number, r1: number, coverage: number, length?: number) {
  return cached(`sleeve:${r0}:${r1}:${coverage}:${length}`, () => {
    const points: THREE.Vector2[] = []
    if (length) {
      for (let step = 0; step < 6; step++) {
        const angle = (step / 6) * (Math.PI / 2)
        points.push(new THREE.Vector2(Math.max(1e-4, r0 * Math.sin(angle)), -0.5 - (r0 * Math.cos(angle)) / length))
      }
    }
    for (let step = 0; step <= 10; step++) {
      const t = step / 10
      points.push(new THREE.Vector2(r0 + (r1 - r0) * t, -0.5 + coverage * t))
    }
    return new THREE.LatheGeometry(points, 20)
  })
}

export function capsule(radius: number, length: number) {
  return cached(`capsule:${radius}:${length}`, () => new THREE.CapsuleGeometry(radius, length, 5, 10))
}

export function ball(radius = 1, width = 20, height = 14) {
  return cached(`ball:${radius}:${width}:${height}`, () => new THREE.SphereGeometry(radius, width, height))
}

export function cap(radius: number, theta: number) {
  return cached(`cap:${radius}:${theta}`, () => new THREE.SphereGeometry(radius, 20, 10, 0, Math.PI * 2, 0, theta))
}

const UP = new THREE.Vector3(0, 1, 0)
const scratch = new THREE.Vector3()
const bend = new THREE.Vector3()

/** Place a unit limb mesh so it spans `from` → `to`. */
export function spanSegment(object: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3) {
  scratch.subVectors(to, from)
  const length = scratch.length()
  object.position.addVectors(from, to).multiplyScalar(0.5)
  object.quaternion.setFromUnitVectors(UP, scratch.divideScalar(Math.max(length, 1e-6)))
  object.scale.set(1, Math.max(length, 1e-4), 1)
}

/**
 * Two-bone IK: writes the elbow (or knee) into `elbow` and the reachable wrist
 * into `wrist`, bending toward `pole`.
 */
export function solveTwoBone(root: THREE.Vector3, target: THREE.Vector3, upper: number, lower: number, pole: THREE.Vector3, elbow: THREE.Vector3, wrist: THREE.Vector3) {
  scratch.subVectors(target, root)
  const distance = clamp(scratch.length(), Math.abs(upper - lower) + 1e-3, (upper + lower) * 0.999)
  scratch.normalize()
  const along = (upper * upper - lower * lower + distance * distance) / (2 * distance)
  const height = Math.sqrt(Math.max(0, upper * upper - along * along))
  bend.subVectors(pole, root)
  bend.addScaledVector(scratch, -bend.dot(scratch))
  if (bend.lengthSq() < 1e-8) bend.set(0, -1, 0)
  bend.normalize()
  elbow.copy(root).addScaledVector(scratch, along).addScaledVector(bend, height)
  wrist.copy(root).addScaledVector(scratch, distance)
}

const axisX = new THREE.Vector3()
const axisY = new THREE.Vector3()
const axisZ = new THREE.Vector3()
const basis = new THREE.Matrix4()

/**
 * Orient a hand (fingers along local −y, palm facing −side·x) so its fingers
 * point along `fingers` and its palm faces `palm`.
 */
export function orientHand(quaternion: THREE.Quaternion, fingers: THREE.Vector3, palm: THREE.Vector3, side: 1 | -1) {
  axisY.copy(fingers).normalize().negate()
  axisX.copy(palm).multiplyScalar(-side)
  axisX.addScaledVector(axisY, -axisX.dot(axisY))
  if (axisX.lengthSq() < 1e-8) axisX.set(1, 0, 0)
  axisX.normalize()
  axisZ.crossVectors(axisX, axisY)
  basis.makeBasis(axisX, axisY, axisZ)
  quaternion.setFromRotationMatrix(basis)
}

const aimY = new THREE.Vector3()
const aimZ = new THREE.Vector3()
const aimX = new THREE.Vector3()
const aimUpper = new THREE.Vector3()
const aimMatrix = new THREE.Matrix4()

/**
 * Rotation for an FK shoulder (or hip) so the upper segment points along
 * `upper` and the joint below can bend toward `fore`. Returns the elbow
 * flexion angle to apply on the child joint's x axis. Directions are in the
 * parent's space.
 */
export function aimLimb(out: THREE.Quaternion, upper: THREE.Vector3, fore: THREE.Vector3) {
  aimUpper.copy(upper).normalize()
  aimY.copy(aimUpper).negate()
  aimZ.copy(fore).addScaledVector(aimUpper, -fore.dot(aimUpper))
  if (aimZ.lengthSq() < 1e-6) aimZ.set(0, 0, 1).addScaledVector(aimUpper, -aimUpper.z)
  aimZ.normalize()
  aimX.crossVectors(aimY, aimZ)
  aimMatrix.makeBasis(aimX, aimY, aimZ)
  out.setFromRotationMatrix(aimMatrix)
  return -aimUpper.angleTo(fore)
}

/** Static version of aimLimb returning Euler angles for a pose prop. */
export function aimPose(upper: [number, number, number], fore: [number, number, number]) {
  const quaternion = new THREE.Quaternion()
  const elbow = aimLimb(quaternion, new THREE.Vector3(...upper), new THREE.Vector3(...fore))
  const euler = new THREE.Euler().setFromQuaternion(quaternion)
  return { joint: [euler.x, euler.y, euler.z] as [number, number, number], bend: [elbow, 0, 0] as [number, number, number] }
}
