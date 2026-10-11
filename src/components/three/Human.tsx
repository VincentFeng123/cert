import { useImperativeHandle, useMemo, useRef, type ReactNode, type Ref, type RefObject } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import {
  BODY, ball, cap, capsule, facePoint, hairGeometry, headGeometry, headSurface, limbGeometry, orientHand,
  shoulderX, sleeveGeometry, solveTwoBone, spanSegment, torsoGeometry, type Build, type HairStyle, type HandPose,
} from './humanGeometry'
import { useHumanMaterials, type Appearance, type HumanMaterials } from './humanMaterials'

type Vec3 = [number, number, number]
const UP = new THREE.Vector3(0, 1, 0)
const toVec = (vector: THREE.Vector3): Vec3 => [vector.x, vector.y, vector.z]

function between(from: THREE.Vector3, to: THREE.Vector3) {
  const direction = to.clone().sub(from)
  return {
    position: toVec(from.clone().add(to).multiplyScalar(0.5)),
    quaternion: new THREE.Quaternion().setFromUnitVectors(UP, direction.clone().normalize()),
    length: direction.length(),
  }
}

// Facial landmarks are derived from the sculpted head so features sit on its surface.
const EYE_R = 0.0118
const eyeCenter = (side: number): Vec3 => {
  const point = facePoint(side * 0.41, 0)
  return [point.x, point.y, point.z - 0.0048]
}
const browAt = (side: number): Vec3 => {
  const point = facePoint(side * 0.42, 0.17)
  return [point.x, point.y + 0.001, point.z + 0.0012]
}
const NOSE_TIP = (() => { const p = facePoint(0, -0.33); return new THREE.Vector3(0, p.y - 0.001, p.z + 0.0105) })()
const NOSE_BRIDGE = between((() => { const p = facePoint(0, -0.04); return new THREE.Vector3(0, p.y, p.z - 0.0005) })(), NOSE_TIP)
const alaAt = (side: number): Vec3 => { const p = facePoint(side * 0.15, -0.38); return [side * 0.0112, p.y - 0.001, p.z + 0.003] }
const UPPER_LIP = (() => { const p = facePoint(0, -0.575); return [0, p.y, p.z + 0.0012] as Vec3 })()
const LOWER_LIP = (() => { const p = facePoint(0, -0.655); return [0, p.y, p.z + 0.0004] as Vec3 })()
const earAt = (side: number): Vec3 => {
  const direction = new THREE.Vector3(side, -0.1, -0.1).normalize()
  const point = headSurface(direction.x, direction.y, direction.z)
  return [point.x + side * 0.004, point.y - 0.004, point.z]
}

function Eye({ side, materials, closed = false }: { side: number; materials: HumanMaterials; closed?: boolean }) {
  if (closed) return <group position={eyeCenter(side)}>
    {/* Moulded closed lid: a shallow mound with a lash crease. */}
    <mesh geometry={ball(1, 20, 12)} material={materials.skin} position={[0, 0, EYE_R * 0.35]} scale={[EYE_R * 1.3, EYE_R * 0.85, EYE_R * 0.7]} />
    <mesh geometry={capsule(0.0012, 0.02)} material={materials.brows} position={[0, -EYE_R * 0.12, EYE_R * 0.98]} rotation={[0, 0, Math.PI / 2 + side * 0.08]} />
  </group>
  return <group position={eyeCenter(side)}>
    <mesh geometry={ball(EYE_R, 20, 14)} material={materials.sclera} />
    <mesh geometry={cap(EYE_R * 1.004, 0.44)} material={materials.iris} rotation={[Math.PI / 2, 0, 0]} />
    <mesh geometry={cap(EYE_R * 1.009, 0.18)} material={materials.pupil} rotation={[Math.PI / 2, 0, 0]} />
    <mesh geometry={cap(EYE_R * 1.1, 1.05)} material={materials.skin} rotation={[0.2, 0, 0]} />
    <mesh geometry={cap(EYE_R * 1.08, 1.0)} material={materials.skin} rotation={[Math.PI - 0.15, 0, 0]} />
  </group>
}

function HairExtras({ style, material }: { style: HairStyle; material: THREE.Material }) {
  if (style === 'bun') return <mesh geometry={ball(0.034, 20, 14)} material={material} position={[0, 0.07, -0.088]} scale={[1, 0.92, 0.9]} castShadow />
  if (style === 'ponytail') return <group position={[0, 0.03, -0.1]} rotation={[0.42, 0, 0]}>
    <mesh geometry={capsule(0.021, 0.12)} material={material} position={[0, -0.075, 0]} castShadow />
  </group>
  if (style === 'long') return <mesh geometry={capsule(0.066, 0.12)} material={material} position={[0, -0.1, -0.052]} rotation={[0.16, 0, 0]} scale={[1.12, 1, 0.52]} castShadow />
  return null
}

/** Sculpted head with eyes, brows, nose, lips, ears and hair. */
export function Head({ materials, hairStyle, manikin = false }: { materials: HumanMaterials; hairStyle: HairStyle; manikin?: boolean }) {
  const hair = hairGeometry(hairStyle)
  const showEars = hairStyle !== 'medium' && hairStyle !== 'long'
  return <group>
    <mesh geometry={headGeometry()} material={materials.skin} castShadow receiveShadow />
    {hair && <mesh geometry={hair} material={materials.hair} castShadow />}
    <HairExtras style={hairStyle} material={materials.hair} />
    {[-1, 1].map(side => <group key={side}>
      <Eye side={side} materials={materials} closed={manikin} />
      {!manikin && <mesh geometry={capsule(0.0026, 0.019)} material={materials.brows} position={browAt(side)} rotation={[0, side * 0.35, Math.PI / 2 - side * 0.08]} scale={[1, 1, 0.55]} />}
      <mesh geometry={ball(0.0072, 14, 10)} material={materials.skin} position={alaAt(side)} />
      {showEars && <group position={earAt(side)} rotation={[0, -side * 0.38, -side * 0.06]}>
        <mesh geometry={ball(1, 16, 12)} material={materials.skin} scale={[0.0072, 0.029, 0.017]} castShadow />
        <mesh geometry={ball(1, 12, 10)} material={materials.skin} position={[0, -0.02, 0.002]} scale={[0.0065, 0.009, 0.008]} />
      </group>}
    </group>)}
    <mesh geometry={capsule(0.0062, Math.max(0.001, NOSE_BRIDGE.length - 0.006))} material={materials.skin} position={NOSE_BRIDGE.position} quaternion={NOSE_BRIDGE.quaternion} scale={[0.78, 1, 1]} />
    <mesh geometry={ball(0.0102, 16, 12)} material={materials.skin} position={toVec(NOSE_TIP)} />
    <mesh geometry={capsule(0.0041, 0.022)} material={manikin ? materials.skin : materials.lips} position={UPPER_LIP} rotation={[0.25, 0, Math.PI / 2]} scale={[1, 1, 0.72]} />
    <mesh geometry={capsule(0.0047, 0.017)} material={manikin ? materials.skin : materials.lips} position={LOWER_LIP} rotation={[-0.2, 0, Math.PI / 2]} scale={[1, 1, 0.75]} />
  </group>
}

// Finger chains: base offset across the palm (z), phalanx lengths, radius, spread.
const FINGERS: { z: number; y: number; lengths: Vec3; radius: number; spread: number }[] = [
  { z: 0.027, y: -0.089, lengths: [0.04, 0.023, 0.019], radius: 0.0091, spread: -0.1 },
  { z: 0.009, y: -0.093, lengths: [0.044, 0.026, 0.02], radius: 0.0095, spread: -0.02 },
  { z: -0.009, y: -0.09, lengths: [0.041, 0.025, 0.019], radius: 0.009, spread: 0.05 },
  { z: -0.026, y: -0.083, lengths: [0.032, 0.019, 0.017], radius: 0.0079, spread: 0.12 },
]
const CURL: Record<HandPose, Vec3> = {
  relaxed: [0.32, 0.5, 0.32],
  open: [0.05, 0.06, 0.03],
  cup: [0.55, 0.62, 0.4],
  grip: [0.95, 1.0, 0.6],
  fist: [1.55, 1.75, 1.05],
}
const THUMB_CURL: Record<HandPose, Vec3> = {
  relaxed: [0.1, 0.25, 0.2],
  open: [-0.45, 0.05, 0.05],
  cup: [0.3, 0.35, 0.3],
  grip: [0.55, 0.5, 0.4],
  fist: [0.9, 0.7, 0.6],
}

function Digit({ lengths, radius, curl, side, material }: { lengths: Vec3; radius: number; curl: Vec3; side: number; material: THREE.Material }) {
  const [first, second, third] = lengths
  return <>
    <mesh geometry={capsule(radius, first)} material={material} position={[0, -first / 2, 0]} castShadow />
    <group position={[0, -first, 0]} rotation={[0, 0, -side * curl[1]]}>
      <mesh geometry={capsule(radius * 0.93, second)} material={material} position={[0, -second / 2, 0]} castShadow />
      <group position={[0, -second, 0]} rotation={[0, 0, -side * curl[2]]}>
        <mesh geometry={capsule(radius * 0.86, third * 0.8)} material={material} position={[0, -third * 0.45, 0]} castShadow />
      </group>
    </group>
  </>
}

/** Hand hanging from the wrist along −y, palm facing −side·x, thumb toward +z. */
export function Hand({ side, pose = 'relaxed', material }: { side: 1 | -1; pose?: HandPose; material: THREE.Material }) {
  const curl = CURL[pose]
  const thumb = THUMB_CURL[pose]
  const spread = pose === 'relaxed' ? 1 : pose === 'open' ? 0.35 : 0
  return <group>
    <mesh geometry={ball(1, 14, 10)} material={material} position={[0, -0.004, 0]} scale={[0.02, 0.022, 0.03]} />
    <RoundedBox args={[0.027, 0.09, 0.076]} radius={0.0125} smoothness={4} position={[side * 0.001, -0.048, 0]} material={material} castShadow />
    <mesh geometry={ball(1, 14, 10)} material={material} position={[-side * 0.007, -0.034, 0.022]} scale={[0.012, 0.032, 0.017]} />
    {FINGERS.map(finger => <group key={finger.z} position={[-side * 0.002, finger.y, finger.z]} rotation={[finger.spread * spread, 0, -side * curl[0]]}>
      <Digit lengths={finger.lengths} radius={finger.radius} curl={curl} side={side} material={material} />
    </group>)}
    <group position={[-side * 0.007, -0.024, 0.031]} rotation={[-0.72, side * 0.25, -side * (0.4 + thumb[0])]}>
      <Digit lengths={[0.036, 0.03, 0.026]} radius={0.0104} curl={thumb} side={side} material={material} />
    </group>
  </group>
}

/** Sneaker whose ankle sits at the origin; the sole meets y = −0.08. */
export function Shoe({ materials }: { materials: HumanMaterials }) {
  return <group>
    <RoundedBox args={[0.094, 0.024, 0.262]} radius={0.01} smoothness={3} position={[0, -0.068, 0.045]} material={materials.soles} castShadow receiveShadow />
    <mesh geometry={ball(1, 20, 14)} material={materials.shoes} position={[0, -0.052, 0.098]} scale={[0.046, 0.033, 0.078]} castShadow />
    <mesh geometry={ball(1, 20, 14)} material={materials.shoes} position={[0, -0.036, 0.01]} scale={[0.045, 0.05, 0.1]} castShadow />
    <mesh geometry={ball(1, 16, 10)} material={materials.shoes} position={[0, -0.01, -0.012]} scale={[0.041, 0.035, 0.05]} castShadow />
  </group>
}

export type JointName = 'hips' | 'spine' | 'neck' | 'lShoulder' | 'lElbow' | 'lWrist' | 'rShoulder' | 'rElbow' | 'rWrist' | 'lHip' | 'lKnee' | 'rHip' | 'rKnee'
export type Joints = Partial<Record<JointName, RefObject<THREE.Group | null>>>
export type Pose = Partial<Record<JointName, Vec3>>

type ArmSpec = { upper: THREE.BufferGeometry; fore: THREE.BufferGeometry; sleeve: THREE.BufferGeometry | null; cuff: THREE.BufferGeometry | null }

function armSpec(build: Build, sleeves: 'short' | 'long'): ArmSpec {
  const k = build === 'female' ? 0.9 : 1
  if (sleeves === 'long') return {
    upper: limbGeometry(0.052 * k, 0.043 * k, 0.005 * k, 0.4, BODY.upperArm),
    fore: limbGeometry(0.043 * k, 0.033 * k, 0.004 * k, 0.3, BODY.forearm),
    sleeve: null,
    cuff: sleeveGeometry(0.036 * k, 0.035 * k, 0.1),
  }
  return {
    upper: limbGeometry(0.045 * k, 0.036 * k, 0.007 * k, 0.4, BODY.upperArm),
    fore: limbGeometry(0.036 * k, 0.026 * k, 0.007 * k, 0.25, BODY.forearm),
    sleeve: sleeveGeometry(0.054 * k, 0.054 * k, 0.42, BODY.upperArm),
    cuff: null,
  }
}

function FkArm({ side, build, sleeves, materials, joints, pose, hand, children }: {
  side: 1 | -1; build: Build; sleeves: 'short' | 'long'; materials: HumanMaterials; joints?: Joints; pose?: Pose; hand: HandPose; children?: ReactNode
}) {
  const spec = armSpec(build, sleeves)
  const key = side === 1 ? 'l' : 'r'
  const limb = sleeves === 'long' ? materials.shirt : materials.skin
  return <group ref={joints?.[`${key}Shoulder`]} position={[side * shoulderX(build), BODY.shoulderY - BODY.spineY, BODY.shoulderZ]} rotation={pose?.[`${key}Shoulder`] ?? [0.02, 0, side * 0.07]}>
    <mesh geometry={spec.upper} material={limb} position={[0, -BODY.upperArm / 2, 0]} rotation={[Math.PI, 0, 0]} scale={[1, BODY.upperArm, 1]} castShadow>
      {spec.sleeve && <mesh geometry={spec.sleeve} material={materials.shirt} castShadow />}
    </mesh>
    <group ref={joints?.[`${key}Elbow`]} position={[0, -BODY.upperArm, 0]} rotation={pose?.[`${key}Elbow`] ?? [-0.16, 0, 0]}>
      <mesh geometry={spec.fore} material={limb} position={[0, -BODY.forearm / 2, 0]} rotation={[Math.PI, 0, 0]} scale={[1, BODY.forearm, 1]} castShadow>
        {spec.cuff && <mesh geometry={spec.cuff} material={materials.shirt} position={[0, 0.9, 0]} />}
      </mesh>
      <group ref={joints?.[`${key}Wrist`]} position={[0, -BODY.forearm, 0]} rotation={pose?.[`${key}Wrist`] ?? [0, 0, 0]}>
        <Hand side={side} pose={hand} material={materials.skin} />
        {children}
      </group>
    </group>
  </group>
}

const THIGH = limbGeometry(0.086, 0.056, 0.006, 0.28, BODY.thigh)
const SHIN = limbGeometry(0.055, 0.046, 0.005, 0.3, BODY.shin)
const THIGH_F = limbGeometry(0.088, 0.052, 0.005, 0.28, BODY.thigh)
const SHIN_F = limbGeometry(0.051, 0.043, 0.005, 0.3, BODY.shin)

function Leg({ side, build, materials, joints, pose }: { side: 1 | -1; build: Build; materials: HumanMaterials; joints?: Joints; pose?: Pose }) {
  const key = side === 1 ? 'l' : 'r'
  const female = build === 'female'
  return <group ref={joints?.[`${key}Hip`]} position={[side * (female ? 0.084 : BODY.hipX), 0, 0]} rotation={pose?.[`${key}Hip`] ?? [0, 0, side * 0.012]}>
    <mesh geometry={female ? THIGH_F : THIGH} material={materials.pants} position={[0, -BODY.thigh / 2, 0]} rotation={[Math.PI, 0, 0]} scale={[1, BODY.thigh, 1]} castShadow receiveShadow />
    <group ref={joints?.[`${key}Knee`]} position={[0, -BODY.thigh, 0]} rotation={pose?.[`${key}Knee`] ?? [0.02, 0, 0]}>
      <mesh geometry={female ? SHIN_F : SHIN} material={materials.pants} position={[0, -BODY.shin / 2, 0]} rotation={[Math.PI, 0, 0]} scale={[1, BODY.shin, 1]} castShadow receiveShadow />
      <group position={[0, -BODY.shin, 0]} rotation={[0, side * 0.1, 0]}><Shoe materials={materials} /></group>
    </group>
  </group>
}

export type HumanoidProps = {
  look: Appearance
  joints?: Joints
  pose?: Pose
  hands?: { l?: HandPose; r?: HandPose }
  /** Omit arms when a scene drives them with <IkArm>. */
  arms?: boolean
  /** Hip joint height; lower it for seated poses. */
  hipHeight?: number
  attach?: { lHand?: ReactNode; rHand?: ReactNode; spine?: ReactNode; head?: ReactNode }
  position?: Vec3
  rotation?: Vec3
  scale?: number
}

/** Articulated, clothed adult figure. Joint groups rotate like a forward-kinematics rig. */
export function Humanoid({ look, joints, pose, hands, arms = true, hipHeight = BODY.hipY, attach, position, rotation, scale }: HumanoidProps) {
  const materials = useHumanMaterials(look)
  const build = look.build ?? 'male'
  const sleeves = look.sleeves ?? 'short'
  const pelvis = torsoGeometry(build, 0.755, 1.0, 1.012)
  const shirt = torsoGeometry(build, 0.93, 1.478, 1.028, false, true)
  const sx = shoulderX(build)
  const deltoid = build === 'female' ? 0.047 : 0.052
  return <group position={position} rotation={rotation} scale={scale}>
    <group ref={joints?.hips} position={[0, hipHeight, 0]} rotation={pose?.hips}>
      <mesh geometry={pelvis} material={materials.pants} position={[0, -BODY.hipY, 0]} castShadow receiveShadow />
      <Leg side={1} build={build} materials={materials} joints={joints} pose={pose} />
      <Leg side={-1} build={build} materials={materials} joints={joints} pose={pose} />
      <group ref={joints?.spine} position={[0, BODY.spineY - BODY.hipY, 0]} rotation={pose?.spine}>
        <mesh geometry={shirt} material={materials.shirt} position={[0, -BODY.spineY, 0]} castShadow receiveShadow />
        {[-1, 1].map(side => <mesh key={side} geometry={ball(deltoid, 20, 14)} material={materials.shirt} position={[side * (sx - 0.014), BODY.shoulderY - BODY.spineY + 0.004, BODY.shoulderZ]} scale={[1, 0.86, 1.05]} castShadow />)}
        <mesh position={[0, BODY.neckY - BODY.spineY - 0.004, -0.008]} rotation={[Math.PI / 2 - 0.12, 0, 0]} material={materials.shirt} castShadow>
          <torusGeometry args={[build === 'female' ? 0.054 : 0.06, 0.009, 8, 28]} />
        </mesh>
        <group ref={joints?.neck} position={[0, BODY.neckY - BODY.spineY, -0.008]} rotation={pose?.neck}>
          <mesh geometry={limbGeometry(0.054, 0.047, 0, 0.5, 0.13)} material={materials.skin} position={[0, 0.035, 0]} scale={[1, 0.13, 1]} rotation={[0.08, 0, 0]} castShadow />
          <group position={[0, BODY.headY - BODY.neckY, BODY.headZ + 0.008]} scale={build === 'female' ? 0.96 : 1}>
            <Head materials={materials} hairStyle={look.hairStyle} />
            {attach?.head}
          </group>
        </group>
        {arms && <>
          <FkArm side={1} build={build} sleeves={sleeves} materials={materials} joints={joints} pose={pose} hand={hands?.l ?? 'relaxed'}>{attach?.lHand}</FkArm>
          <FkArm side={-1} build={build} sleeves={sleeves} materials={materials} joints={joints} pose={pose} hand={hands?.r ?? 'relaxed'}>{attach?.rHand}</FkArm>
        </>}
        {attach?.spine}
      </group>
    </group>
  </group>
}

export type IkArmHandle = {
  /** Reach from `shoulder` toward `wrist`, bending the elbow toward `pole`, palm facing `palm`. */
  reach: (shoulder: THREE.Vector3, wrist: THREE.Vector3, pole: THREE.Vector3, palm: THREE.Vector3) => void
}

/** Arm driven by two-bone IK; coordinates are in the parent's space. */
export function IkArm({ handle, side, look, hand = 'relaxed' }: { handle: Ref<IkArmHandle>; side: 1 | -1; look: Appearance; hand?: HandPose }) {
  const materials = useHumanMaterials(look)
  const spec = armSpec(look.build ?? 'male', look.sleeves ?? 'short')
  const limb = (look.sleeves ?? 'short') === 'long' ? materials.shirt : materials.skin
  const upper = useRef<THREE.Mesh>(null)
  const fore = useRef<THREE.Mesh>(null)
  const wristGroup = useRef<THREE.Group>(null)
  const scratch = useMemo(() => ({ elbow: new THREE.Vector3(), wrist: new THREE.Vector3(), direction: new THREE.Vector3() }), [])
  useImperativeHandle(handle, () => ({
    reach(shoulder, wrist, pole, palm) {
      if (!upper.current || !fore.current || !wristGroup.current) return
      solveTwoBone(shoulder, wrist, BODY.upperArm, BODY.forearm, pole, scratch.elbow, scratch.wrist)
      spanSegment(upper.current, shoulder, scratch.elbow)
      spanSegment(fore.current, scratch.elbow, scratch.wrist)
      wristGroup.current.position.copy(scratch.wrist)
      scratch.direction.subVectors(scratch.wrist, scratch.elbow)
      orientHand(wristGroup.current.quaternion, scratch.direction, palm, side)
    },
  }), [scratch, side])
  return <group>
    <mesh ref={upper} geometry={spec.upper} material={limb} castShadow>
      {spec.sleeve && <mesh geometry={spec.sleeve} material={materials.shirt} castShadow />}
    </mesh>
    <mesh ref={fore} geometry={spec.fore} material={limb} castShadow>
      {spec.cuff && <mesh geometry={spec.cuff} material={materials.shirt} position={[0, 0.9, 0]} />}
    </mesh>
    <group ref={wristGroup}><Hand side={side} pose={hand} material={materials.skin} /></group>
  </group>
}

