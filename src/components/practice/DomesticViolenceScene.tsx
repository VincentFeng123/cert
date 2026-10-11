import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Html, RoundedBox } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { PracticeSceneProps } from '../../lib/practice-types'
import { Humanoid, type Joints } from '../three/Human'
import type { Appearance } from '../three/humanMaterials'
import { aimPose } from '../three/humanGeometry'
import { plasterBump, rugTexture, woodFloorTexture } from '../three/textures'

type Point = [number, number, number]
const stageIds = ['privacy', 'listen', 'validate', 'choice', 'resources', 'plan']
const palette = { wall: '#e7e6df', trim: '#f7f5ef', floor: '#cec6b8', wood: '#b49374', ink: '#31424a', sage: '#81938b', warm: '#c6b7a7', accent: '#719f99' }

function Box({ position, size, color, radius = 0.03, rotation }: { position: Point; size: Point; color: string; radius?: number; rotation?: Point }) {
  return <RoundedBox position={position} args={size} radius={radius} smoothness={3} rotation={rotation} castShadow receiveShadow>
    <meshStandardMaterial color={color} roughness={0.88} />
  </RoundedBox>
}

function Armchair({ color }: { color: string }) {
  const fabric = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.92 }), [color])
  const piping = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.82), roughness: 0.95 }), [color])
  useEffect(() => () => { fabric.dispose(); piping.dispose() }, [fabric, piping])
  const cushion = (args: Point, position: Point, radius: number, rotation?: Point, material = fabric) => <RoundedBox args={args} radius={radius} smoothness={4} position={position} rotation={rotation} material={material} castShadow receiveShadow />
  return <group>
    {cushion([0.78, 0.13, 0.7], [0, 0.25, -0.02], 0.04, undefined, piping)}
    {cushion([0.6, 0.12, 0.6], [0, 0.375, 0.02], 0.055)}
    {cushion([0.78, 0.56, 0.16], [0, 0.6, -0.31], 0.06, [-0.1, 0, 0], piping)}
    {cushion([0.58, 0.44, 0.13], [0, 0.66, -0.22], 0.06, [-0.14, 0, 0])}
    {[-1, 1].map(side => <group key={side}>
      {cushion([0.11, 0.29, 0.68], [side * 0.345, 0.43, -0.01], 0.045, undefined, piping)}
      {cushion([0.13, 0.05, 0.66], [side * 0.345, 0.585, 0.0], 0.024)}
    </group>)}
    {[-0.32, 0.32].flatMap(x => [-0.29, 0.25].map(z => <mesh key={`${x}${z}`} position={[x, 0.09, z]} rotation={[z < 0 ? 0.12 : -0.08, 0, x < 0 ? -0.08 : 0.08]} castShadow>
      <cylinderGeometry args={[0.022, 0.014, 0.18, 12]} /><meshStandardMaterial color={palette.wood} roughness={0.45} />
    </mesh>))}
  </group>
}

const SEATED = { hipHeight: 0.5, scale: 1.1, hipZ: -0.065 }
const SIT_POSE = {
  lHip: [-1.48, 0.1, 0.05] as Point, rHip: [-1.48, -0.1, -0.05] as Point,
  lKnee: [1.46, 0, 0] as Point, rKnee: [1.46, 0, 0] as Point,
}
// Forearms rest on the thighs; the gesture poses lift one hand in front of the body.
const REST = { l: aimPose([0.16, -1, 0.28], [-0.22, -0.42, 1]), r: aimPose([-0.16, -1, 0.28], [0.22, -0.42, 1]) }
const OPEN_HAND = { l: aimPose([0.3, -0.8, 0.55], [-0.15, 0.25, 1]), r: aimPose([-0.3, -0.8, 0.55], [0.15, 0.25, 1]) }
const OFFER = aimPose([-0.25, -0.35, 1], [-0.1, 0.05, 1])
const quat = (pose: { joint: Point }) => new THREE.Quaternion().setFromEuler(new THREE.Euler(...pose.joint))
const ARM_Q = { restL: quat(REST.l), restR: quat(REST.r), openL: quat(OPEN_HAND.l), openR: quat(OPEN_HAND.r), offer: quat(OFFER) }

const LOOKS: Record<'alex' | 'jordan', Appearance> = {
  alex: { build: 'female', skin: '#b98567', hair: '#2f2622', hairStyle: 'long', eyes: '#3d2c22', shirt: '#6a857c', pants: '#34414a', shoes: '#5a4234', soles: '#2a221d' },
  jordan: { build: 'male', skin: '#e0b898', hair: '#5a4535', hairStyle: 'short', eyes: '#4a5a66', shirt: '#56687c', pants: '#7a7263', shoes: '#3a2e27', soles: '#211b17', sleeves: 'long' },
}

function Person({ role, stage, actionCount, completed, motionEnabled, wrist }: { role: 'alex' | 'jordan'; stage: number; actionCount: number; completed: boolean; motionEnabled: boolean; wrist: RefObject<THREE.Group | null> }) {
  const root = useRef<THREE.Group>(null)
  const joints: Joints = { spine: useRef<THREE.Group>(null), neck: useRef<THREE.Group>(null), lShoulder: useRef<THREE.Group>(null), rShoulder: useRef<THREE.Group>(null), lElbow: useRef<THREE.Group>(null), rElbow: useRef<THREE.Group>(null), lWrist: useRef<THREE.Group>(null), rWrist: wrist }
  // Animate only when the conversation changes, never on mount (also under
  // StrictMode's double effects): the first frame snaps to the resting pose.
  const stateKey = `${stage}:${actionCount}:${completed}:${motionEnabled}`
  const lastKey = useRef(stateKey)
  const elapsed = useRef(2.4)
  const firstFrame = useRef(true)
  const blendState = useRef({ l: 0, r: 0 })
  const invalidate = useThree(state => state.invalidate)
  const alex = role === 'alex'
  const responding = actionCount > 0 || completed
  const engaged = stage > 0 || responding
  const targetRotation = (alex ? 1 : -1) * (engaged ? 0.83 : 0.40)

  useEffect(() => {
    if (lastKey.current !== stateKey) { lastKey.current = stateKey; elapsed.current = 0 }
    invalidate()
  }, [stateKey, invalidate])

  useFrame((_, delta) => {
    const { spine, neck, lShoulder, rShoulder, lElbow, rElbow, lWrist, rWrist } = joints
    if (!root.current || !spine?.current || !neck?.current || !lShoulder?.current || !rShoulder?.current || !lElbow?.current || !rElbow?.current || !lWrist?.current || !rWrist?.current) return
    elapsed.current = motionEnabled ? Math.min(2.4, elapsed.current + Math.min(delta, 0.05)) : 2.4
    const t = elapsed.current
    const ease = motionEnabled && !firstFrame.current ? Math.min(delta * 5, 1) : 1
    firstFrame.current = false
    root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, targetRotation, ease)
    const nod = motionEnabled && responding && t < 1.9 ? Math.sin(t / 1.9 * Math.PI * 2) * Math.sin(t / 1.9 * Math.PI) : 0
    neck.current.rotation.x = (alex ? 0.1 : 0.04) + nod * (alex ? 0.06 : 0.12)
    neck.current.rotation.z = !alex && stage >= 1 ? -0.06 : alex ? 0.03 : 0
    spine.current.rotation.x = THREE.MathUtils.lerp(spine.current.rotation.x, engaged ? 0.1 : -0.06, ease)
    const gesture = motionEnabled && responding ? Math.sin(Math.min(t / 2.0, 1) * Math.PI) : 0
    const offering = !alex && stage >= 4 && (stage > 4 || responding)
    const openLeft = !alex && stage === 3 && responding
    const blend = blendState.current
    blend.r = THREE.MathUtils.lerp(blend.r, offering ? 1 : gesture * (alex ? 0.25 : 0.55), ease)
    blend.l = THREE.MathUtils.lerp(blend.l, openLeft ? 0.85 : gesture * 0.2, ease)
    rShoulder.current.quaternion.slerpQuaternions(ARM_Q.restR, offering ? ARM_Q.offer : ARM_Q.openR, blend.r)
    lShoulder.current.quaternion.slerpQuaternions(ARM_Q.restL, ARM_Q.openL, blend.l)
    rElbow.current.rotation.x = THREE.MathUtils.lerp(REST.r.bend[0], offering ? OFFER.bend[0] : OPEN_HAND.r.bend[0], blend.r)
    lElbow.current.rotation.x = THREE.MathUtils.lerp(REST.l.bend[0], OPEN_HAND.l.bend[0], blend.l)
    rWrist.current.rotation.set(0, -0.9 * blend.r, 0)
    lWrist.current.rotation.set(0, 0.9 * blend.l, 0)
    // A finite response animation keeps the parent demand-rendered canvas idle at rest.
    if (motionEnabled && t < 2.4) invalidate()
  })

  return <group ref={root} position={alex ? [-0.93, 0, -0.40] : [0.91, 0, -0.35]} rotation={[0, (alex ? 1 : -1) * 0.4, 0]}>
    <Armchair color={alex ? '#a9b5a6' : '#bfb3a3'} />
    <group scale={SEATED.scale} position={[0, 0, SEATED.hipZ]}>
      <Humanoid look={LOOKS[role]} joints={joints} hipHeight={SEATED.hipHeight} hands={{ l: 'relaxed', r: 'relaxed' }}
        pose={{ ...SIT_POSE, lShoulder: REST.l.joint, rShoulder: REST.r.joint, lElbow: REST.l.bend, rElbow: REST.r.bend }} />
    </group>
  </group>
}

function Plant({ position, scale = 1, seed = 1 }: { position: Point; scale?: number; seed?: number }) {
  const leaves = useMemo(() => {
    let state = seed * 7919 + 17
    const random = () => { state = (state * 16807) % 2147483647; return state / 2147483647 }
    return Array.from({ length: 14 }, (_, index) => {
      const angle = index * 2.4 + random() * 0.6
      const height = 0.55 + random() * 0.55
      const reach = 0.08 + random() * 0.14
      return { angle, height, reach, tilt: 0.5 + random() * 0.6, size: 0.8 + random() * 0.45, color: ['#4f6b45', '#5d7a4f', '#6a875a', '#46603d'][index % 4] }
    })
  }, [seed])
  return <group position={position} scale={scale}>
    <mesh position={[0, 0.19, 0]} castShadow receiveShadow><cylinderGeometry args={[0.17, 0.12, 0.36, 28]} /><meshStandardMaterial color="#c9b8a4" roughness={0.35} /></mesh>
    <mesh position={[0, 0.37, 0]}><torusGeometry args={[0.165, 0.014, 10, 28]} /><meshStandardMaterial color="#c9b8a4" roughness={0.35} /></mesh>
    <mesh position={[0, 0.36, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.155, 24]} /><meshStandardMaterial color="#4a3a2d" roughness={1} /></mesh>
    {leaves.map((leaf, index) => {
      const x = Math.cos(leaf.angle) * leaf.reach
      const z = Math.sin(leaf.angle) * leaf.reach
      return <group key={index}>
        <mesh position={[x / 2, (leaf.height + 0.36) / 2, z / 2]} rotation={[z * 1.4, 0, -x * 1.4]}><cylinderGeometry args={[0.006, 0.009, leaf.height - 0.34, 6]} /><meshStandardMaterial color="#5c6e45" /></mesh>
        <group position={[x, leaf.height, z]} rotation={[0, -leaf.angle, 0]}>
          <mesh rotation={[0, 0, -leaf.tilt]} position={[0.07 * leaf.size, 0, 0]} scale={[0.1 * leaf.size, 0.012, 0.055 * leaf.size]} castShadow>
            <sphereGeometry args={[1, 14, 8]} /><meshStandardMaterial color={leaf.color} roughness={0.55} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>
    })}
  </group>
}

function Curtain({ position, width = 0.34 }: { position: Point; width?: number }) {
  return <group position={position}>
    {Array.from({ length: 6 }, (_, index) => <mesh key={index} position={[(index / 5 - 0.5) * width, 0, (index % 2) * 0.018]} castShadow>
      <cylinderGeometry args={[0.032, 0.036, 1.3, 12]} /><meshStandardMaterial color="#e6dccb" roughness={0.95} />
    </mesh>)}
  </group>
}

function Room() {
  const surfaces = useMemo(() => ({ floor: woodFloorTexture([3.2, 4.2]), rug: rugTexture([1, 1]), plaster: plasterBump([8, 4]) }), [])
  const wall = (position: Point, size: Point) => <RoundedBox position={position} args={size} radius={0.03} smoothness={3} castShadow receiveShadow><meshStandardMaterial color={palette.wall} roughness={0.9} bumpMap={surfaces.plaster} bumpScale={0.5} /></RoundedBox>
  return <group>
    <Box position={[0, -0.11, 0]} size={[5.6, 0.2, 4.6]} color="#7d5f45" radius={0.10} />
    <mesh position={[0, -0.0095, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[5.4, 4.4]} /><meshStandardMaterial map={surfaces.floor} roughness={0.45} /></mesh>
    {wall([-0.88, 1.22, -2.2], [3.84, 2.46, 0.14])}
    {wall([2.58, 1.22, -2.2], [0.44, 2.46, 0.14])}
    {wall([1.72, 2.26, -2.2], [1.34, 0.36, 0.14])}
    {wall([-2.75, 0.38, 0], [0.14, 0.76, 4.45])}
    {wall([-2.75, 1.35, -1.61], [0.14, 1.96, 1.19])}
    <Box position={[-0.88, 0.085, -2.1]} size={[3.8, 0.16, 0.06]} color={palette.trim} radius={0.01} />
    <Box position={[-2.64, 0.075, 0]} size={[0.07, 0.14, 4.25]} color={palette.trim} radius={0.01} />
    {/* Window with daylight and curtains */}
    <Box position={[-1.28, 1.65, -2.10]} size={[1.50, 1.02, 0.09]} color={palette.trim} />
    <mesh position={[-1.28, 1.65, -2.05]}><planeGeometry args={[1.34, 0.85]} /><meshStandardMaterial color="#dcebf2" emissive="#cfe4ef" emissiveIntensity={0.55} roughness={0.1} /></mesh>
    <Box position={[-1.28, 1.65, -2.005]} size={[0.04, 0.88, 0.03]} color={palette.trim} radius={0.005} />
    <Box position={[-1.28, 1.64, -2.005]} size={[1.38, 0.04, 0.03]} color={palette.trim} radius={0.005} />
    <Box position={[-1.28, 1.15, -2.0]} size={[1.66, 0.075, 0.24]} color={palette.trim} />
    <mesh position={[-1.28, 2.3, -1.99]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.014, 0.014, 2.0, 10]} /><meshStandardMaterial color="#8a7a66" metalness={0.5} roughness={0.4} /></mesh>
    <Curtain position={[-2.1, 1.64, -1.98]} />
    <Curtain position={[-0.46, 1.64, -1.98]} />
    {/* Framed print */}
    <Box position={[0.37, 1.69, -2.09]} size={[0.67, 0.86, 0.05]} color={palette.wood} radius={0.01} />
    <Box position={[0.37, 1.69, -2.052]} size={[0.56, 0.75, 0.015]} color="#f3f0e6" radius={0.005} />
    <mesh position={[0.37, 1.72, -2.04]} scale={[0.19, 0.24, 0.005]}><circleGeometry args={[1, 32]} /><meshStandardMaterial color="#8b9c94" roughness={0.9} /></mesh>
    <mesh position={[0.3, 1.6, -2.039]} scale={[0.14, 0.1, 0.005]}><circleGeometry args={[1, 32]} /><meshStandardMaterial color="#c9a98a" roughness={0.9} /></mesh>
    {/* Open doorway */}
    {[1.07, 2.37].map(x => <Box key={x} position={[x, 1.045, -2.14]} size={[0.075, 2.10, 0.16]} color={palette.wood} radius={0.015} />)}
    <Box position={[1.72, 2.085, -2.14]} size={[1.38, 0.075, 0.16]} color={palette.wood} radius={0.015} />
    <Box position={[1.72, 0.022, -2.05]} size={[1.3, 0.035, 0.45]} color="#8f8a7c" radius={0.01} />
    {/* Rug */}
    <RoundedBox args={[3.4, 0.022, 2.5]} radius={0.01} smoothness={2} position={[0, 0.011, 0.25]} receiveShadow><meshStandardMaterial color="#cfc6b6" roughness={1} /></RoundedBox>
    <mesh position={[0, 0.0225, 0.25]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[3.36, 2.46]} /><meshStandardMaterial map={surfaces.rug} roughness={1} /></mesh>
    <Plant position={[-2.18, 0, -1.32]} seed={2} />
    <Plant position={[2.18, 0, 1.55]} scale={0.75} seed={5} />
    {/* Coffee table */}
    <group position={[0, 0, 0.62]}>
      <mesh position={[0, 0.47, 0]} castShadow receiveShadow><cylinderGeometry args={[0.55, 0.55, 0.075, 64]} /><meshStandardMaterial color="#a88462" roughness={0.35} /></mesh>
      <mesh position={[0, 0.422, 0]}><cylinderGeometry args={[0.53, 0.5, 0.025, 64]} /><meshStandardMaterial color="#7d5f45" roughness={0.6} /></mesh>
      {[0, 1, 2].map(index => { const angle = index * (Math.PI * 2 / 3) + 0.4; return <mesh key={index} position={[Math.cos(angle) * 0.3, 0.215, Math.sin(angle) * 0.3]} rotation={[Math.sin(angle) * 0.14, 0, -Math.cos(angle) * 0.14]} castShadow><cylinderGeometry args={[0.024, 0.016, 0.44, 12]} /><meshStandardMaterial color="#7d5f45" roughness={0.45} /></mesh> })}
    </group>
    {/* Side table with a mug */}
    <group position={[-2.03, 0, 0.42]}>
      <mesh position={[0, 0.615, 0]} castShadow receiveShadow><cylinderGeometry args={[0.3, 0.3, 0.04, 40]} /><meshStandardMaterial color={palette.wood} roughness={0.4} /></mesh>
      <mesh position={[0, 0.3, 0]} castShadow><cylinderGeometry args={[0.03, 0.04, 0.58, 14]} /><meshStandardMaterial color={palette.wood} roughness={0.45} /></mesh>
      <mesh position={[0, 0.02, 0]} castShadow><cylinderGeometry args={[0.18, 0.2, 0.03, 32]} /><meshStandardMaterial color={palette.wood} roughness={0.45} /></mesh>
      <mesh position={[0.10, 0.685, -0.10]} castShadow><cylinderGeometry args={[0.045, 0.04, 0.1, 24]} /><meshStandardMaterial color="#e9e2d6" roughness={0.2} /></mesh>
      <mesh position={[0.148, 0.69, -0.10]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.025, 0.007, 8, 18]} /><meshStandardMaterial color="#e9e2d6" roughness={0.2} /></mesh>
      <mesh position={[0.10, 0.73, -0.10]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.038, 20]} /><meshStandardMaterial color="#5a3b28" roughness={0.3} /></mesh>
    </group>
    {/* Floor lamp */}
    <group position={[2.23, 0, -0.4]}>
      <mesh position={[0, 0.02, 0]} castShadow><cylinderGeometry args={[0.2, 0.22, 0.03, 32]} /><meshStandardMaterial color="#3a3833" metalness={0.7} roughness={0.35} /></mesh>
      <mesh position={[0, 0.91, 0]} castShadow><cylinderGeometry args={[0.013, 0.013, 1.75, 12]} /><meshStandardMaterial color="#3a3833" metalness={0.7} roughness={0.35} /></mesh>
      <mesh position={[0, 1.89, 0]} castShadow><cylinderGeometry args={[0.19, 0.3, 0.38, 36, 1, true]} /><meshStandardMaterial color="#f0e7d7" side={THREE.DoubleSide} roughness={0.95} emissive="#f6e3bd" emissiveIntensity={0.25} /></mesh>
      <mesh position={[0, 1.72, 0]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.28, 28]} /><meshStandardMaterial color="#fff3d6" emissive="#ffe6b0" emissiveIntensity={0.8} /></mesh>
    </group>
  </group>
}

function Phone({ muted = false }: { muted?: boolean }) {
  return <group>
    <Box position={[0, 0, 0]} size={[0.22, 0.39, 0.035]} color={muted ? '#7b8081' : '#37474e'} radius={0.025} />
    <Box position={[0, -0.006, 0.021]} size={[0.188, 0.322, 0.009]} color={muted ? '#bfc5c3' : '#e0ede8'} radius={0.012} />
    <Box position={[0, 0.168, 0.021]} size={[0.052, 0.012, 0.008]} color="#26383f" radius={0.005} />
    <mesh position={[0, 0.052, 0.03]}><circleGeometry args={[0.045, 20]} /><meshStandardMaterial color={muted ? '#8d9997' : '#799f93'} /></mesh>
    {[-0.035, -0.075, -0.115].map((y, index) => <Box key={y} position={[index === 2 ? -0.022 : 0, y, 0.031]} size={[index === 2 ? 0.088 : 0.135, 0.011, 0.006]} color={muted ? '#9aa4a0' : '#a0b8af'} radius={0.004} />)}
  </group>
}

// Phone faces away from Jordan's palm, long edge along the fingers.
const HOLD = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0))
const ON_TABLE = { position: new THREE.Vector3(0.32, 0.521, 0.63), quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0.1)) }

function Resources({ stage, responding, motionEnabled, hand }: { stage: number; responding: boolean; motionEnabled: boolean; hand: RefObject<THREE.Group | null> }) {
  const phone = useRef<THREE.Group>(null)
  const plan = useRef<THREE.Group>(null)
  const options = useRef<THREE.Group>(null)
  const stateKey = `${stage}:${responding}:${motionEnabled}`
  const lastKey = useRef(stateKey)
  const progress = useRef(2.2)
  const invalidate = useThree(state => state.invalidate)
  const offer = stage > 4 || (stage === 4 && responding)
  const showPlan = stage === 5 && responding
  const scratch = useMemo(() => ({ position: new THREE.Vector3(), quaternion: new THREE.Quaternion() }), [])

  useEffect(() => {
    if (lastKey.current !== stateKey) { lastKey.current = stateKey; progress.current = 0 }
    invalidate()
  }, [stateKey, invalidate])
  useFrame((_, delta) => {
    progress.current = motionEnabled ? Math.min(progress.current + Math.min(delta, 0.05), 2.2) : 2.2
    const t = Math.min(progress.current / 1.6, 1)
    const eased = t * t * (3 - 2 * t)
    if (phone.current) {
      const blend = motionEnabled ? Math.min(delta * 4.5, 1) : 1
      if (offer && hand.current) {
        // Jordan picks the device up and holds it out in an open palm.
        hand.current.updateWorldMatrix(true, false)
        hand.current.localToWorld(scratch.position.set(0.03, -0.12, 0))
        hand.current.getWorldQuaternion(scratch.quaternion).multiply(HOLD)
      } else {
        scratch.position.copy(ON_TABLE.position)
        scratch.quaternion.copy(ON_TABLE.quaternion)
      }
      phone.current.position.lerp(scratch.position, blend)
      phone.current.quaternion.slerp(scratch.quaternion, blend)
    }
    if (plan.current) plan.current.scale.setScalar(showPlan ? 0.88 + eased * 0.12 : 0.88)
    if (options.current) options.current.scale.setScalar(showPlan ? 0.2 + eased * 0.8 : 0.001)
    if (motionEnabled && progress.current < 2.2) invalidate()
  })

  return <group>
    <group ref={phone} position={[0.32, 0.521, 0.63]} rotation={[-Math.PI / 2, 0, 0.1]} scale={0.72}><Phone /></group>
    <group position={[-2.18, 0.65, 0.49]} rotation={[-Math.PI / 2, 0, -0.25]} scale={0.85}><Phone muted /></group>
    <group ref={plan} position={[-0.15, 0.515, 0.62]} rotation={[0, 0.2, 0]}>
      <Box position={[0, 0, 0]} size={[0.47, 0.016, 0.38]} color="#667e76" radius={0.01} />
      <Box position={[-0.115, 0.012, 0]} size={[0.219, 0.011, 0.355]} color="#faf7ed" radius={0.005} />
      <Box position={[0.115, 0.012, 0]} size={[0.219, 0.011, 0.355]} color="#faf7ed" radius={0.005} />
      {[0.09, 0.03, -0.03, -0.09].map(z => <Box key={z} position={[-0.11, 0.02, z]} size={[0.14, 0.005, 0.009]} color="#c4ccc3" radius={0.002} />)}
      {[[-0.10, 0], [0.01, 0.03], [0.10, -0.03]].map(([z, x], index) => <mesh key={index} position={[0.10 + x, 0.025, z]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.022, 16]} /><meshStandardMaterial color={showPlan ? '#719f8d' : '#c2ccbf'} /></mesh>)}
    </group>
    <group ref={options} position={[0.0, 0.045, 0.6]}>
      {Array.from({ length: 9 }, (_, index) => { const t = index / 8; return <mesh key={index} position={[t * 1.72, 0, -t * 2.5]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.028, 12]} /><meshStandardMaterial color="#8aa297" transparent opacity={0.65} /></mesh> })}
      <mesh position={[1.72, 0, -2.5]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.11, 0.125, 24]} /><meshStandardMaterial color="#8aa297" transparent opacity={0.7} /></mesh>
    </group>
  </group>
}

const targets: Record<string, { position: Point; label: string }> = {
  'ask-private': { position: [-0.94, 2.03, -0.40], label: 'Check if it is safe to talk' },
  'start-public': { position: [1.72, 1.25, -1.95], label: 'Share with others' },
  listen: { position: [0.97, 2.04, -0.35], label: 'Listen to Alex' },
  interrupt: { position: [-1.03, 2.04, -0.40], label: 'Interrupt with a solution' },
  believe: { position: [-0.95, 2.03, -0.40], label: '“You do not deserve this.”' },
  blame: { position: [1.00, 2.03, -0.35], label: '“Why did you let it happen?”' },
  'ask-wishes': { position: [-0.95, 2.03, -0.40], label: 'Ask what would help' },
  'decide-for-them': { position: [1.00, 2.03, -0.35], label: 'Decide for Alex' },
  'safer-device': { position: [0.33, 1.08, 0.65], label: 'Offer a safer device' },
  'shared-phone': { position: [-2.1, 1.12, 0.5], label: 'Use the monitored phone' },
  'plan-together': { position: [-0.05, 1.05, 0.68], label: 'Plan together' },
  'force-leave': { position: [1.72, 1.3, -1.95], label: 'Tell Alex to leave now' },
}

function Hotspot({ id, onTarget }: { id: string; onTarget: PracticeSceneProps['onTarget'] }) {
  const [hovered, setHovered] = useState(false)
  const target = targets[id]
  if (!target) return null
  return <group position={target.position}>
    <mesh onClick={event => { event.stopPropagation(); onTarget(id) }} onPointerOver={event => { event.stopPropagation(); setHovered(true) }} onPointerOut={() => setHovered(false)}>
      <sphereGeometry args={[hovered ? 0.075 : 0.061, 20, 12]} /><meshStandardMaterial color={hovered ? '#526f6b' : '#719f99'} emissive="#719f99" emissiveIntensity={0.15} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.10, 0.009, 8, 24]} /><meshStandardMaterial color="#8dafa6" transparent opacity={0.7} /></mesh>
    <Html position={[0, 0.19, 0]} center distanceFactor={7} zIndexRange={[20, 10]}>
      <button type="button" onClick={event => { event.stopPropagation(); onTarget(id) }} style={{ width: 148, padding: '9px 11px', borderRadius: 10, border: '1px solid #ccd9d5', background: '#fffffff5', color: '#344b46', boxShadow: '0 3px 14px #253b2f10', font: '600 11px/1.5 system-ui, sans-serif', cursor: 'pointer', textAlign: 'center' }}>{target.label}</button>
    </Html>
  </group>
}

/** Scene contents only. The shared practice shell owns camera, lighting and Canvas lifecycle. */
export default function DomesticViolenceScene({ stepId, actionCount, completed, motionEnabled, activeTargetIds, onTarget }: PracticeSceneProps) {
  const stage = Math.max(stageIds.indexOf(stepId), 0)
  const responding = actionCount > 0 || completed
  const alexHand = useRef<THREE.Group>(null)
  const jordanHand = useRef<THREE.Group>(null)
  return <group>
    <Room />
    <Person role="alex" stage={stage} actionCount={actionCount} completed={completed} motionEnabled={motionEnabled} wrist={alexHand} />
    <Person role="jordan" stage={stage} actionCount={actionCount} completed={completed} motionEnabled={motionEnabled} wrist={jordanHand} />
    <Resources stage={stage} responding={responding} motionEnabled={motionEnabled} hand={jordanHand} />
    {activeTargetIds.filter(id => targets[id]).map(id => <Hotspot key={id} id={id} onTarget={onTarget} />)}
    <Html position={[-1.22, 0.11, 1.32]} center distanceFactor={9} zIndexRange={[2, 0]} style={{ pointerEvents: 'none' }}><div style={{ font: '600 9px/1.5 system-ui, sans-serif', letterSpacing: '0.13em', color: '#687c73', whiteSpace: 'nowrap', background: '#fafbf3dc', border: '1px solid #d5ded4', borderRadius: 5, padding: '5px 9px' }}>LISTEN · BELIEVE · SUPPORT</div></Html>
  </group>
}
