import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { Html, RoundedBox } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { MathUtils, type Group } from 'three'
import type { PracticeSceneProps } from '../../lib/practice-types'
import { gunViolencePractice } from '../../data/practice/gun-violence'
import { Humanoid, type Joints } from '../three/Human'
import type { Appearance } from '../three/humanMaterials'
import { aimLimb, aimPose, torsoGeometry } from '../three/humanGeometry'
import { concreteTexture, exitSignTexture, grassTexture, plasterBump, tileTexture } from '../three/textures'

type Point = [number, number, number]
const START: Point = [-1.15, 0.07, 0.95]
const DOOR: Point = [1.02, 0.07, 0.95]
const SAFE: Point = [2.05, 0.07, 1.05]
const STEP_IDS = gunViolencePractice.steps.map(step => step.id)
const TARGETS: Record<string, { position: Point; label: string }> = {
  'safe-exit': { position: [0.65, 1.75, 0.95], label: 'Clear side exit' },
  'unsafe-corridor': { position: [-0.18, 1.1, -1.5], label: 'Investigate corridor' },
  'leave-now': { position: [0.75, 1.7, 0.95], label: 'Leave now' },
  'collect-bag': { position: [-2.2, 1.2, 1.6], label: 'Collect bag' },
  'safe-point': { position: [2.05, 0.3, 1.85], label: 'Move to safety' },
  'wait-at-door': { position: [0.75, 1.7, 0.95], label: 'Wait at doorway' },
  'call-emergency': { position: [2.05, 2.05, 1.05], label: 'Call from safety' },
  'return-to-call': { position: [0.4, 1.6, 0.95], label: 'Return for details' },
  'visible-hands': { position: [2.05, 2.05, 1.05], label: 'Empty, visible hands' },
  'approach-officers': { position: [2.15, 1.95, -1.25], label: 'Rush to responder' },
  'stay-and-support': { position: [2.2, 1.85, 2.15], label: 'Support from safety' },
  'reenter-building': { position: [0.4, 1.6, 0.95], label: 'Re-enter building' },
}
// The companion waits with hands loosely clasped, then lifts one hand toward the learner.
const CLASP = { l: aimPose([0.22, -1, 0.3], [-0.6, 0.15, 0.8]), r: aimPose([-0.22, -1, 0.3], [0.6, 0.12, 0.8]) }
const COMPANION_HANDS = {
  r: new THREE.Quaternion().setFromEuler(new THREE.Euler(...CLASP.r.joint)),
  rWave: new THREE.Quaternion().setFromEuler(new THREE.Euler(...aimPose([-0.35, -0.8, 0.6], [-0.1, 0.6, 1]).joint)),
}
const LEARNER: Appearance = { build: 'male', skin: '#b27b58', hair: '#2a201a', hairStyle: 'short', eyes: '#3b2a1e', shirt: '#5b7f86', pants: '#3e4d64', shoes: '#f0efec', soles: '#d6d1c8', sleeves: 'long' }
const RESPONDER: Appearance = { build: 'male', skin: '#e0b494', hair: '#4a3a2c', hairStyle: 'crop', eyes: '#4f6272', shirt: '#26344a', pants: '#1f2836', shoes: '#141518', soles: '#141518', sleeves: 'long' }
const COMPANION: Appearance = { build: 'female', skin: '#e6c0a2', hair: '#6b4a2f', hairStyle: 'ponytail', eyes: '#4e5b3c', shirt: '#b5a88e', pants: '#4c5566', shoes: '#8a5d45', soles: '#2c2521' }

function Block({ position, size, color, radius = 0.035, roughness = 0.83, bump, children }: { position: Point; size: Point; color: string; radius?: number; roughness?: number; bump?: THREE.Texture; children?: ReactNode }) {
  return <RoundedBox position={position} args={size} radius={radius} smoothness={2} castShadow receiveShadow>
    <meshStandardMaterial color={color} roughness={roughness} bumpMap={bump} bumpScale={bump ? 0.6 : 0} />
    {children}
  </RoundedBox>
}

function SceneLabel({ position, children, dark = false }: { position: Point; children: string; dark?: boolean }) {
  return <Html position={position} center distanceFactor={10} zIndexRange={[5, 0]} style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}><span style={{ display: 'block', borderRadius: 5, padding: '3px 6px', background: dark ? '#334155' : '#fffffff0', color: dark ? '#fff' : '#64748b', border: dark ? 'none' : '1px solid #e2e8f0', font: '600 8px system-ui', letterSpacing: '.07em', textTransform: 'uppercase' }}>{children}</span></Html>
}

function Target({ id, position, label, onTarget }: { id: string; position: Point; label: string; onTarget: (id: string) => void }) {
  return <group position={position}>
    <mesh onClick={event => { event.stopPropagation(); onTarget(id) }}>
      <sphereGeometry args={[0.105, 14, 12]} /><meshStandardMaterial color="#79a7a6" emissive="#396665" emissiveIntensity={0.18} roughness={0.5} />
    </mesh>
    <Html position={[0, 0.18, 0]} center distanceFactor={9} zIndexRange={[25, 10]}>
      <button type="button" onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); onTarget(id) }} style={{ display: 'block', cursor: 'pointer', whiteSpace: 'nowrap', border: '1px solid #64748b', borderRadius: 8, padding: '7px 10px', color: '#334155', background: '#fffffffa', boxShadow: '0 2px 8px #0f172a0d', font: '600 10px system-ui' }}>{label}</button>
    </Html>
  </group>
}

/** Commercial glass door leaf with an aluminium frame and push bar; hinge at the origin. */
function GlassDoor({ width = 0.68 }: { width?: number }) {
  const metal = <meshStandardMaterial color="#9aa4ab" metalness={0.8} roughness={0.32} />
  return <group>
    {[0.03, width - 0.03].map(z => <mesh key={z} position={[0, 0.96, z]} castShadow><boxGeometry args={[0.05, 1.92, 0.06]} />{metal}</mesh>)}
    {[0.05, 1.3, 1.9].map(y => <mesh key={y} position={[0, y, width / 2]} castShadow><boxGeometry args={[0.05, y === 0.05 ? 0.1 : 0.06, width]} />{metal}</mesh>)}
    <mesh position={[0, 0.96, width / 2]}><boxGeometry args={[0.012, 1.8, width - 0.06]} /><meshStandardMaterial color="#dcebf0" roughness={0.03} transparent opacity={0.35} /></mesh>
    <mesh position={[0.06, 1.02, width / 2]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.018, 0.018, width - 0.16, 12]} />{metal}</mesh>
  </group>
}

function Backpack() {
  const fabric = <meshStandardMaterial color="#4a5a6e" roughness={0.85} />
  return <group>
    <RoundedBox args={[0.34, 0.42, 0.2]} radius={0.08} smoothness={4} position={[0, 0.21, 0]} castShadow>{fabric}</RoundedBox>
    <RoundedBox args={[0.26, 0.2, 0.08]} radius={0.04} smoothness={3} position={[0, 0.14, 0.11]} castShadow><meshStandardMaterial color="#3d4b5c" roughness={0.85} /></RoundedBox>
    <mesh position={[0, 0.2, 0.152]}><boxGeometry args={[0.2, 0.008, 0.004]} /><meshStandardMaterial color="#1d232b" metalness={0.6} roughness={0.4} /></mesh>
    <mesh position={[0, 0.43, -0.01]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.045, 0.01, 8, 16, Math.PI]} /><meshStandardMaterial color="#2c3642" roughness={0.8} /></mesh>
    {[-0.08, 0.08].map(x => <mesh key={x} position={[x, 0.22, -0.11]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.35]}><torusGeometry args={[0.16, 0.018, 8, 20, Math.PI]} /><meshStandardMaterial color="#2c3642" roughness={0.8} /></mesh>)}
  </group>
}

function Shrub({ position, scale = 1, seed = 1 }: { position: Point; scale?: number; seed?: number }) {
  const clumps = useMemo(() => {
    let state = seed * 9301 + 49297
    const random = () => { state = (state * 9301 + 49297) % 233280; return state / 233280 }
    return Array.from({ length: 9 }, () => ({
      position: [(random() - 0.5) * 0.42, 0.14 + random() * 0.22, (random() - 0.5) * 0.3] as Point,
      radius: 0.11 + random() * 0.08,
      color: ['#56753f', '#65864a', '#4a6636', '#72924f'][Math.floor(random() * 4)],
    }))
  }, [seed])
  return <group position={position} scale={scale}>
    {clumps.map((clump, index) => <mesh key={index} position={clump.position} castShadow receiveShadow>
      <icosahedronGeometry args={[clump.radius, 1]} /><meshStandardMaterial color={clump.color} roughness={0.95} flatShading />
    </mesh>)}
  </group>
}

function FloorArrow({ position, active }: { position: Point; active: boolean }) {
  const shape = useMemo(() => {
    const arrow = new THREE.Shape()
    arrow.moveTo(-0.09, -0.07); arrow.lineTo(0.02, -0.07); arrow.lineTo(0.02, -0.12); arrow.lineTo(0.12, 0); arrow.lineTo(0.02, 0.12); arrow.lineTo(0.02, 0.07); arrow.lineTo(-0.09, 0.07)
    arrow.closePath()
    return arrow
  }, [])
  return <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <shapeGeometry args={[shape]} /><meshStandardMaterial color={active ? '#3f9a74' : '#9fb8ae'} roughness={0.6} />
  </mesh>
}

function Phone() {
  return <group position={[0.018, -0.085, 0.004]} rotation={[0, 0, 0]}>
    <RoundedBox args={[0.012, 0.15, 0.072]} radius={0.004} smoothness={2} castShadow><meshStandardMaterial color="#20252b" roughness={0.3} /></RoundedBox>
  </group>
}

export default function GunViolenceScene({ stepId, actionCount, completed, motionEnabled, activeTargetIds, onTarget }: PracticeSceneProps) {
  const actor = useRef<Group>(null)
  const joints: Joints = { spine: useRef<Group>(null), lShoulder: useRef<Group>(null), rShoulder: useRef<Group>(null), lElbow: useRef<Group>(null), rElbow: useRef<Group>(null), lWrist: useRef<Group>(null), rWrist: useRef<Group>(null), lHip: useRef<Group>(null), rHip: useRef<Group>(null), lKnee: useRef<Group>(null), rKnee: useRef<Group>(null) }
  const phone = useRef<Group>(null)
  const companionArm = useRef<Group>(null)
  const elapsed = useRef(0)
  const invalidate = useThree(state => state.invalidate)
  const step = Math.max(0, STEP_IDS.indexOf(stepId))
  const activated = actionCount > 0 || completed
  const showResponder = step >= 4
  const aim = useMemo(() => ({ rest: new THREE.Quaternion(), pose: new THREE.Quaternion(), euler: new THREE.Euler(), upper: new THREE.Vector3(), fore: new THREE.Vector3() }), [])
  const surfaces = useMemo(() => ({ tile: tileTexture([4, 5]), grass: grassTexture([3, 7]), path: concreteTexture([2, 1]), plaster: plasterBump([6, 3]), exit: exitSignTexture() }), [])

  useEffect(() => {
    elapsed.current = 0
    invalidate()
  }, [stepId, actionCount, completed, motionEnabled, invalidate])

  useFrame((_state, delta) => {
    const duration = step === 1 ? 1.2 : step === 2 ? 1 : 0.75
    if (motionEnabled) elapsed.current = Math.min(duration, elapsed.current + Math.min(delta, 0.05))
    const raw = activated ? motionEnabled ? Math.min(elapsed.current / duration, 1) : 1 : 0
    const t = raw * raw * (3 - 2 * raw)
    const walking = activated && (step === 1 || step === 2) && raw < 1 && motionEnabled
    const start = step < 2 ? START : step === 2 ? DOOR : SAFE
    const end = step === 1 ? DOOR : step >= 2 ? SAFE : START
    const phase = raw * Math.PI * 8
    if (actor.current) {
      actor.current.position.set(MathUtils.lerp(start[0], end[0], t), 0.07 + (walking ? Math.abs(Math.sin(phase)) * 0.018 : 0), MathUtils.lerp(start[2], end[2], t))
      actor.current.rotation.y = walking ? Math.PI / 2 : step < 3 ? Math.PI / 5 : step === 4 ? 2.3 * t : step > 4 ? 2.3 - 2.1 * t : 0
    }
    const stride = walking ? Math.sin(phase) * 0.36 : 0
    const set = (name: keyof Joints, x: number, y = 0, z = 0) => joints[name]?.current?.rotation.set(x, y, z)
    set('lHip', -stride, 0, 0.012)
    set('rHip', stride, 0, -0.012)
    set('lKnee', walking ? 0.08 + 0.65 * Math.max(0, Math.cos(phase)) : 0.02)
    set('rKnee', walking ? 0.08 + 0.65 * Math.max(0, -Math.cos(phase)) : 0.02)
    set('spine', walking ? 0.06 : 0.01)

    // Arms: walking swing, phone call (right hand to ear), then empty hands raised.
    const swing = walking ? Math.sin(phase) * 0.32 : 0
    const call = step === 3 ? t : step === 4 ? 1 - t : 0
    const raise = step === 4 ? t : 0
    const reach = step === 5 ? t : 0
    const a = aim
    for (const side of [1, -1] as const) {
      const shoulder = joints[side === 1 ? 'lShoulder' : 'rShoulder']?.current
      const elbow = joints[side === 1 ? 'lElbow' : 'rElbow']?.current
      const wrist = joints[side === 1 ? 'lWrist' : 'rWrist']?.current
      if (!shoulder || !elbow || !wrist) continue
      a.euler.set(side * swing, 0, side * 0.07)
      a.rest.setFromEuler(a.euler)
      let bend = walking ? -0.35 : -0.16
      let twist = 0
      a.pose.copy(a.rest)
      let weight = 0
      if (raise > 0) {
        // Upper arms out, forearms vertical, palms forward: clearly empty hands.
        const flex = aimLimb(a.pose, a.upper.set(side, 0.12, 0.1), a.fore.set(side * 0.1, 1, 0.14))
        weight = raise
        bend = THREE.MathUtils.lerp(bend, flex, raise)
      }
      if (side === -1 && call > 0) {
        const flex = aimLimb(a.pose, a.upper.set(-0.35, -0.55, 0.62), a.fore.set(0.28, 1, -0.3))
        weight = call
        bend = THREE.MathUtils.lerp(bend, flex, call)
        twist = -0.9 * call
      }
      if (side === 1 && reach > 0) {
        const flex = aimLimb(a.pose, a.upper.set(0.3, -1, 0.35), a.fore.set(0.05, -0.1, 1))
        weight = reach
        bend = THREE.MathUtils.lerp(bend, flex, reach)
        twist = 1.1 * reach
      }
      shoulder.quaternion.slerpQuaternions(a.rest, a.pose, weight)
      elbow.rotation.set(bend, 0, 0)
      wrist.rotation.set(0, twist, 0)
    }
    if (phone.current) phone.current.visible = step === 3 || (step === 4 && t < 0.3)
    if (companionArm.current) companionArm.current.quaternion.slerpQuaternions(COMPANION_HANDS.r, COMPANION_HANDS.rWave, reach)
    if (activated && raw < 1 && motionEnabled) invalidate()
  })

  return <group>
    {/* Open-front architectural model: outside is the planted strip on the right. */}
    <Block position={[0, -0.07, 0]} size={[5.9, 0.14, 5.25]} color="#b9bdbd" radius={0.06} />
    <Block position={[-1.02, 0.025, 0]} size={[3.74, 0.07, 4.85]} color="#d9d7d0" />
    <mesh position={[-1.02, 0.0605, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[3.7, 4.8]} /><meshStandardMaterial map={surfaces.tile} roughness={0.42} /></mesh>
    <Block position={[1.95, 0.03, 0]} size={[1.83, 0.08, 4.85]} color="#6f8d55" />
    <mesh position={[1.95, 0.0705, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[1.8, 4.8]} /><meshStandardMaterial map={surfaces.grass} roughness={1} /></mesh>
    <mesh position={[1.72, 0.072, 1.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[1.8, 0.95]} /><meshStandardMaterial map={surfaces.path} roughness={0.9} /></mesh>
    <mesh position={[2.05, 0.073, -0.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[0.8, 2.0]} /><meshStandardMaterial map={surfaces.path} roughness={0.9} /></mesh>
    <Block position={[-2.83, 1.05, 0]} size={[0.1, 2.06, 4.85]} color="#e6e4de" bump={surfaces.plaster} />
    <Block position={[-1.03, 1.05, -2.39]} size={[3.72, 2.06, 0.1]} color="#ebe8e1" bump={surfaces.plaster} />
    <Block position={[0.8, 0.58, -1.22]} size={[0.1, 1.08, 2.3]} color="#dcd9d2" bump={surfaces.plaster} />
    <Block position={[0.8, 0.58, 2.01]} size={[0.1, 1.08, 0.65]} color="#dcd9d2" bump={surfaces.plaster} />
    {/* Baseboards */}
    <Block position={[-2.77, 0.1, 0]} size={[0.02, 0.08, 4.8]} color="#5e6468" radius={0.005} />
    <Block position={[-1.03, 0.1, -2.33]} size={[3.66, 0.08, 0.02]} color="#5e6468" radius={0.005} />
    {/* A bulletin board and clock keep the space legible as a school or office. */}
    <Block position={[-1.6, 1.3, -2.33]} size={[1.0, 0.6, 0.03]} color="#b58e62" radius={0.01}>
    </Block>
    {[[-1.85, 1.38, '#f3efe4'], [-1.6, 1.22, '#dce8e4'], [-1.36, 1.4, '#f1e3cf']].map(([x, y, color]) => <mesh key={String(x)} position={[x as number, y as number, -2.312]}><planeGeometry args={[0.2, 0.26]} /><meshStandardMaterial color={color as string} roughness={0.9} /></mesh>)}
    <group position={[-0.35, 1.65, -2.33]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.13, 0.13, 0.03, 32]} /><meshStandardMaterial color="#f5f4f0" roughness={0.6} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.001]}><torusGeometry args={[0.13, 0.012, 8, 32]} /><meshStandardMaterial color="#2c3136" /></mesh>
      <mesh position={[0.02, 0.04, 0.02]} rotation={[0, 0, -0.5]}><boxGeometry args={[0.008, 0.1, 0.004]} /><meshStandardMaterial color="#1e2226" /></mesh>
      <mesh position={[0.03, -0.015, 0.02]} rotation={[0, 0, 1.2]}><boxGeometry args={[0.008, 0.07, 0.004]} /><meshStandardMaterial color="#1e2226" /></mesh>
    </group>

    {/* The doorway: open glass doors swung outward, a lit exit sign above. */}
    <Block position={[0.81, 1.02, 0.2]} size={[0.13, 1.98, 0.11]} color="#8e979c" roughness={0.45} />
    <Block position={[0.81, 1.02, 1.63]} size={[0.13, 1.98, 0.11]} color="#8e979c" roughness={0.45} />
    <Block position={[0.81, 1.99, 0.91]} size={[0.14, 0.11, 1.52]} color="#8e979c" roughness={0.45} />
    <group position={[0.87, 0.07, 0.25]} rotation={[0, Math.PI - 0.12, 0]}><GlassDoor /></group>
    <group position={[0.87, 0.07, 1.58]} rotation={[0, 0.12, 0]}><GlassDoor /></group>
    <group position={[0.81, 2.14, 0.91]}>
      <RoundedBox args={[0.05, 0.15, 0.32]} radius={0.01} smoothness={2} castShadow><meshStandardMaterial color="#e9ece8" roughness={0.5} /></RoundedBox>
      {[-1, 1].map(side => <mesh key={side} position={[side * 0.026, 0, 0]} rotation={[0, side * Math.PI / 2, 0]}><planeGeometry args={[0.28, 0.13]} /><meshStandardMaterial map={surfaces.exit} emissive="#ffffff" emissiveMap={surfaces.exit} emissiveIntensity={0.55} toneMapped={false} /></mesh>)}
    </group>
    <SceneLabel position={[0.8, 2.42, 0.94]} dark>Side exit</SceneLabel>

    {/* Shelter room, included as orientation context for an alternative situation. */}
    <Block position={[-1.78, 0.08, -1.43]} size={[1.88, 0.04, 1.72]} color="#d4d8d6" />
    <Block position={[-1.74, 0.74, -0.53]} size={[2.05, 1.38, 0.09]} color="#e3e1db" bump={surfaces.plaster} />
    <Block position={[-0.72, 0.74, -1.99]} size={[0.09, 1.38, 0.73]} color="#e3e1db" bump={surfaces.plaster} />
    <group position={[-0.71, 0.09, -1.6]} rotation={[0, -0.52, 0]}>
      <Block position={[0, 0.64, 0.39]} size={[0.05, 1.28, 0.76]} color="#9b7d5e" roughness={0.6} />
      <mesh position={[0.045, 0.67, 0.68]}><sphereGeometry args={[0.035, 12, 10]} /><meshStandardMaterial color="#b9bec2" metalness={0.85} roughness={0.25} /></mesh>
    </group>
    <SceneLabel position={[-1.9, 1.8, -1.65]}>Shelter room</SceneLabel>
    <Block position={[-2.42, 0.44, -1.76]} size={[0.35, 0.72, 0.65]} color="#8f989c" roughness={0.5} />
    {[0.25, 0.47, 0.69].map(y => <mesh key={y} position={[-2.235, y, -1.76]}><boxGeometry args={[0.012, 0.012, 0.16]} /><meshStandardMaterial color="#d8dcdf" metalness={0.8} roughness={0.3} /></mesh>)}
    <group position={[-1.6, 0.1, -1.55]}>
      <Block position={[0, 0.7, 0]} size={[0.9, 0.04, 0.5]} color="#c8b18f" radius={0.01} roughness={0.55} />
      {[[-0.41, -0.21], [0.41, -0.21], [-0.41, 0.21], [0.41, 0.21]].map(([x, z]) => <mesh key={`${x}${z}`} position={[x, 0.34, z]} castShadow><boxGeometry args={[0.035, 0.68, 0.035]} /><meshStandardMaterial color="#6d7478" metalness={0.6} roughness={0.4} /></mesh>)}
    </group>

    {/* A bench and left-behind backpack ground the evacuation decision in the scene. */}
    <group position={[-2.23, 0.06, 1.55]}>
      {[-0.13, 0, 0.13].map(x => <RoundedBox key={x} args={[0.12, 0.035, 1.12]} radius={0.012} smoothness={2} position={[x, 0.39, 0]} castShadow receiveShadow><meshStandardMaterial color="#b08a5f" roughness={0.6} /></RoundedBox>)}
      {[-0.42, 0.42].map(z => <group key={z} position={[0, 0, z]}>
        {[-0.17, 0.17].map(x => <mesh key={x} position={[x, 0.19, 0]} castShadow><boxGeometry args={[0.03, 0.38, 0.03]} /><meshStandardMaterial color="#3b4045" metalness={0.7} roughness={0.35} /></mesh>)}
        <mesh position={[0, 0.36, 0]}><boxGeometry args={[0.38, 0.03, 0.03]} /><meshStandardMaterial color="#3b4045" metalness={0.7} roughness={0.35} /></mesh>
      </group>)}
      <group position={[0, 0.41, -0.04]} rotation={[0, 0.3, 0]}><Backpack /></group>
    </group>

    {/* Floor wayfinding decals are cues, not an assertion of real-world safety. */}
    {[-0.78, -0.3, 0.18, 1.25, 1.72].map(x => <FloorArrow key={x} position={[x, x > 0.8 ? 0.075 : 0.063, 0.96]} active={step >= 1} />)}
    <mesh position={[2.05, 0.076, 1.35]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.6, 0.64, 48]} /><meshStandardMaterial color="#e9f0e6" roughness={0.9} /></mesh>
    <SceneLabel position={[2.13, 0.14, -2.02]}>Outside · not to scale</SceneLabel>
    <mesh position={[-0.35, 0.064, -1.6]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.21, 0.23, 24]} /><meshStandardMaterial color="#b6a891" /></mesh>

    <group ref={actor} position={START} scale={0.86}>
      <Humanoid look={LEARNER} joints={joints} attach={{ rHand: <group ref={phone} visible={step === 3}><Phone /></group> }} />
    </group>
    {showResponder && <group position={[2.08, 0.07, -1.13]} rotation={[0, 0.25, 0]} scale={0.86}>
      <Humanoid look={RESPONDER} pose={{ lShoulder: [-0.1, 0, 0.12], rShoulder: [-0.1, 0, -0.12], lElbow: [-0.5, 0, 0], rElbow: [-0.5, 0, 0] }} attach={{
        spine: <>
          <mesh geometry={torsoGeometry('male', 0.975, 1.04, 1.07, false, false)} position={[0, -0.95, 0]} castShadow><meshStandardMaterial color="#15181c" roughness={0.55} side={THREE.DoubleSide} /></mesh>
          <mesh position={[0.085, 0.36, 0.128]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.024, 0.02, 0.006, 6]} /><meshStandardMaterial color="#cdb36f" metalness={0.8} roughness={0.3} /></mesh>
          <mesh position={[-0.085, 0.35, 0.126]}><boxGeometry args={[0.07, 0.016, 0.004]} /><meshStandardMaterial color="#e2e6ea" /></mesh>
          <RoundedBox args={[0.05, 0.1, 0.035]} radius={0.01} smoothness={2} position={[0.165, 0.05, 0.02]}><meshStandardMaterial color="#111316" roughness={0.5} /></RoundedBox>
        </>,
        head: <group position={[0, 0.082, 0.004]}>
          <mesh castShadow><cylinderGeometry args={[0.092, 0.084, 0.06, 28]} /><meshStandardMaterial color="#1c2638" roughness={0.7} /></mesh>
          <mesh position={[0, -0.024, 0.07]} rotation={[0.25, 0, 0]} scale={[1, 0.18, 0.75]}><sphereGeometry args={[0.085, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#0d0f12" roughness={0.3} /></mesh>
          <mesh position={[0, 0.005, 0.09]}><cylinderGeometry args={[0.012, 0.012, 0.004, 6]} /><meshStandardMaterial color="#cdb36f" metalness={0.8} roughness={0.3} /></mesh>
        </group>,
      }} />
    </group>}
    {showResponder && <SceneLabel position={[2.05, 1.8, -1.2]} dark>Responder</SceneLabel>}
    {step >= 5 && <group position={[2.32, 0.07, 2.19]} rotation={[0, -0.65, 0]} scale={0.82}><Humanoid look={COMPANION} joints={{ rShoulder: companionArm }} pose={{ lShoulder: CLASP.l.joint, lElbow: CLASP.l.bend, rElbow: CLASP.r.bend }} /></group>}
    {/* A planted edge makes outside legible without simulating danger or injuries. */}
    <Block position={[1.95, 0.22, -2.03]} size={[1.55, 0.28, 0.48]} color="#a8a49c" roughness={0.9} />
    <mesh position={[1.95, 0.365, -2.03]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.45, 0.38]} /><meshStandardMaterial color="#4a3b2c" roughness={1} /></mesh>
    {[1.42, 1.9, 2.42].map((x, index) => <Shrub key={x} position={[x, 0.33, -2.04]} seed={index + 3} scale={0.95} />)}
    {!completed && activeTargetIds.map(id => TARGETS[id] ? <Target key={id} id={id} {...TARGETS[id]} onTarget={onTarget} /> : null)}
  </group>
}
