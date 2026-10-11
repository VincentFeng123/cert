import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Billboard, Html, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { PracticeSceneProps } from '../../lib/practice-types'
import { Humanoid, IkArm, type IkArmHandle } from '../three/Human'
import type { Appearance } from '../three/humanMaterials'
import { BODY, shoulderX } from '../three/humanGeometry'
import { woodFloorTexture } from '../three/textures'

// Figures are built in meters; this diorama is modelled 1.15× larger.
const SCALE = 1.15
const PATIENT: Appearance = { build: 'male', skin: '#d6a585', hair: '#3a291f', hairStyle: 'short', eyes: '#4d3a2a', shirt: '#5d7fa8', pants: '#394960', shoes: '#26272b', soles: '#1c1c1e' }
const HELPER: Appearance = { build: 'female', skin: '#8c5a3c', hair: '#1d1714', hairStyle: 'bun', eyes: '#2e211a', shirt: '#6c998f', pants: '#2e3237', shoes: '#ecebe7', soles: '#d9d3c9' }
const SHOULDER_LOCAL = (build: 'male' | 'female', side: 1 | -1) => new THREE.Vector3(side * shoulderX(build), BODY.shoulderY - BODY.spineY, BODY.shoulderZ)

type ArmState = { wrist: THREE.Vector3; palm: THREE.Vector3; pole: THREE.Vector3; fingers: THREE.Vector3; ready: boolean }
const armState = (): ArmState => ({ wrist: new THREE.Vector3(), palm: new THREE.Vector3(), pole: new THREE.Vector3(), fingers: new THREE.Vector3(), ready: false })

// Patient lean and helper placement (world units) for each phase of the rescue.
function targetPose(backStage: boolean, thrustStage: boolean, airwayClear: boolean) {
  if (backStage) return { lean: 1.25, x: -0.44, z: 0.3, yaw: Math.PI / 2, helperLean: 0.36, stride: 0.1 }
  if (thrustStage) return { lean: 0.1, x: 0, z: -0.31, yaw: 0, helperLean: 0.16, stride: 0.22 }
  if (airwayClear) return { lean: 0.02, x: -0.62, z: 0.2, yaw: 1.05, helperLean: 0.04, stride: 0 }
  return { lean: 0.03, x: -0.78, z: 0.34, yaw: 1.0, helperLean: 0.03, stride: 0 }
}

function ActionTarget({ id, label, activeTargetIds, onTarget }: { id: string; label: string; activeTargetIds: string[]; onTarget: (id: string) => void }) {
  if (!activeTargetIds.includes(id)) return null
  return <group>
    <Billboard>
      <mesh onClick={event => { event.stopPropagation(); onTarget(id) }}>
        <circleGeometry args={[0.13, 32]} /><meshBasicMaterial color="#059669" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <mesh onClick={event => { event.stopPropagation(); onTarget(id) }}>
        <ringGeometry args={[0.117, 0.13, 32]} /><meshBasicMaterial color="#059669" depthWrite={false} />
      </mesh>
    </Billboard>
    <Html center position={[0, 0.23, 0]} zIndexRange={[15, 5]}>
      <button type="button" onClick={event => { event.stopPropagation(); onTarget(id) }} className="whitespace-nowrap rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-800 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">{label}</button>
    </Html>
  </group>
}

function CafeTable({ called }: { called: boolean }) {
  const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#eef6f8', roughness: 0.05, transparent: true, opacity: 0.3 }), [])
  useEffect(() => () => glass.dispose(), [glass])
  return <group>
    <mesh position={[0, 0.86, 0]} castShadow receiveShadow><cylinderGeometry args={[0.37, 0.37, 0.035, 48]} /><meshStandardMaterial color="#6b4a33" roughness={0.38} /></mesh>
    <mesh position={[0, 0.84, 0]}><cylinderGeometry args={[0.365, 0.35, 0.01, 48]} /><meshStandardMaterial color="#4c3423" roughness={0.6} /></mesh>
    <mesh position={[0, 0.44, 0]} castShadow><cylinderGeometry args={[0.028, 0.034, 0.8, 16]} /><meshStandardMaterial color="#2a2c2e" metalness={0.85} roughness={0.35} /></mesh>
    <mesh position={[0, 0.02, 0]} castShadow receiveShadow><cylinderGeometry args={[0.2, 0.23, 0.028, 40]} /><meshStandardMaterial color="#2a2c2e" metalness={0.85} roughness={0.35} /></mesh>
    {/* Half-finished meal: plate, bread, cutlery and a glass of water. */}
    <group position={[-0.1, 0.878, 0.08]}>
      <mesh receiveShadow castShadow><cylinderGeometry args={[0.125, 0.1, 0.012, 40]} /><meshStandardMaterial color="#f7f5f0" roughness={0.18} /></mesh>
      <mesh position={[0, 0.006, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.112, 0.006, 8, 48]} /><meshStandardMaterial color="#f7f5f0" roughness={0.18} /></mesh>
      <RoundedBox args={[0.1, 0.035, 0.07]} radius={0.015} smoothness={3} position={[0.01, 0.024, -0.01]} rotation={[0, 0.4, 0]} castShadow><meshStandardMaterial color="#c99a5b" roughness={0.85} /></RoundedBox>
      <RoundedBox args={[0.1, 0.012, 0.072]} radius={0.005} smoothness={2} position={[0.01, 0.047, -0.01]} rotation={[0, 0.4, 0]}><meshStandardMaterial color="#7fa05a" roughness={0.7} /></RoundedBox>
      <RoundedBox args={[0.1, 0.03, 0.07]} radius={0.014} smoothness={3} position={[0.01, 0.068, -0.01]} rotation={[0, 0.4, 0]} castShadow><meshStandardMaterial color="#d7ab6c" roughness={0.85} /></RoundedBox>
    </group>
    {[0.07, 0.1].map((x, index) => <RoundedBox key={x} args={[0.012, 0.004, 0.18]} radius={0.002} smoothness={2} position={[x, 0.88, 0.1]} rotation={[0, index * 0.05, 0]}><meshStandardMaterial color="#c9cdd1" metalness={0.95} roughness={0.2} /></RoundedBox>)}
    <group position={[0.14, 0.878, -0.12]}>
      <mesh material={glass} position={[0, 0.06, 0]} castShadow><cylinderGeometry args={[0.035, 0.03, 0.12, 28, 1, true]} /></mesh>
      <mesh position={[0, 0.045, 0]}><cylinderGeometry args={[0.032, 0.03, 0.085, 28]} /><meshStandardMaterial color="#dcebf2" roughness={0.05} transparent opacity={0.45} /></mesh>
      <mesh position={[0, 0.003, 0]}><cylinderGeometry args={[0.03, 0.03, 0.006, 28]} /><meshStandardMaterial color="#e8f1f4" transparent opacity={0.6} /></mesh>
    </group>
    <RoundedBox args={[0.14, 0.004, 0.14]} radius={0.002} smoothness={2} position={[0.05, 0.879, 0.2]} rotation={[0, 0.3, 0]}><meshStandardMaterial color="#e9e3d6" roughness={0.95} /></RoundedBox>
    {/* Phone: the screen lights once help has been called. */}
    <group position={[-0.02, 0.882, -0.18]} rotation={[0, -0.35, 0]}>
      <RoundedBox args={[0.08, 0.009, 0.16]} radius={0.004} smoothness={3} castShadow><meshStandardMaterial color="#1e2328" roughness={0.3} /></RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0048, 0]}><planeGeometry args={[0.07, 0.148]} /><meshStandardMaterial color={called ? '#8fd3b8' : '#1b2630'} emissive={called ? '#5fbf9a' : '#000000'} emissiveIntensity={called ? 0.6 : 0} roughness={0.15} /></mesh>
    </group>
  </group>
}

function BistroChair() {
  const frame = <meshStandardMaterial color="#26292c" metalness={0.8} roughness={0.35} />
  return <group>
    <mesh position={[0, 0.52, 0]} castShadow receiveShadow><cylinderGeometry args={[0.21, 0.2, 0.04, 36]} /><meshStandardMaterial color="#8a5a3a" roughness={0.45} /></mesh>
    {[[0.14, 0.14], [-0.14, 0.14], [0.14, -0.14], [-0.14, -0.14]].map(([x, z]) => <mesh key={`${x}${z}`} position={[x * 1.08, 0.25, z * 1.08]} rotation={[z * 0.35, 0, -x * 0.35]} castShadow><cylinderGeometry args={[0.012, 0.012, 0.52, 10]} />{frame}</mesh>)}
    <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.16, 0.008, 8, 32]} />{frame}</mesh>
    {[-0.12, 0.12].map(x => <mesh key={x} position={[x, 0.78, -0.18]} rotation={[-0.1, 0, 0]} castShadow><cylinderGeometry args={[0.011, 0.011, 0.5, 10]} />{frame}</mesh>)}
    <mesh position={[0, 0.98, -0.2]} rotation={[-0.1 + Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[0.13, 0.012, 8, 28, Math.PI]} />{frame}</mesh>
    <mesh position={[0, 0.84, -0.195]} rotation={[-0.1 + Math.PI / 2, 0, 0]}><torusGeometry args={[0.12, 0.008, 8, 28, Math.PI]} />{frame}</mesh>
  </group>
}

export default function HeimlichScene({ stepId, actionCount, completed, motionEnabled, activeTargetIds, onTarget }: PracticeSceneProps) {
  const invalidate = useThree(state => state.invalidate)
  const patientSpine = useRef<THREE.Group>(null)
  const patientNeck = useRef<THREE.Group>(null)
  const helperRoot = useRef<THREE.Group>(null)
  const helperSpine = useRef<THREE.Group>(null)
  const helperLeftHip = useRef<THREE.Group>(null)
  const helperLeftKnee = useRef<THREE.Group>(null)
  const patientArms = { l: useRef<IkArmHandle>(null), r: useRef<IkArmHandle>(null) }
  const helperArms = { l: useRef<IkArmHandle>(null), r: useRef<IkArmHandle>(null) }
  const backTargetRef = useRef<THREE.Group>(null)
  const abdomenTargetRef = useRef<THREE.Group>(null)
  const arrowRef = useRef<THREE.Group>(null)
  const backStage = stepId === 'back-blows' || (stepId === 'support-forward' && actionCount > 0)
  const thrustStage = stepId === 'fist-position' || stepId === 'abdominal-thrusts'
  const airwayClear = stepId === 'reassess' || (stepId === 'abdominal-thrusts' && completed)
  const handsAtThroat = !backStage && !airwayClear
  // Start exactly at the current stage's pose so nothing animates on mount.
  const poseRef = useRef({ ...targetPose(backStage, thrustStage, airwayClear) })
  const actionStartedRef = useRef(0)
  const lastActionRef = useRef(`${stepId}:${actionCount}`)
  const floor = useMemo(() => woodFloorTexture([3.4, 3]), [])
  const state = useMemo(() => ({
    patient: { l: armState(), r: armState() },
    helper: { l: armState(), r: armState() },
    v: new THREE.Vector3(), w: new THREE.Vector3(), q: new THREE.Quaternion(), qi: new THREE.Quaternion(),
    back: new THREE.Vector3(), chest: new THREE.Vector3(), abdomen: new THREE.Vector3(), front: new THREE.Vector3(), up: new THREE.Vector3(),
    wrist: new THREE.Vector3(), palm: new THREE.Vector3(), pole: new THREE.Vector3(), fingers: new THREE.Vector3(), shoulder: new THREE.Vector3(),
    helperLeft: new THREE.Vector3(), helperForward: new THREE.Vector3(),
  }), [])

  useEffect(() => {
    const action = `${stepId}:${actionCount}`
    if (action !== lastActionRef.current) {
      actionStartedRef.current = actionCount > 0 ? performance.now() : 0
      lastActionRef.current = action
    }
    invalidate()
  }, [stepId, actionCount, completed, motionEnabled, invalidate])

  useFrame((_, delta) => {
    const pose = poseRef.current
    const desired = targetPose(backStage, thrustStage, airwayClear)
    const blend = motionEnabled ? 1 - Math.exp(-Math.min(delta, 0.04) * 7) : 1
    pose.lean = THREE.MathUtils.lerp(pose.lean, desired.lean, blend)
    pose.x = THREE.MathUtils.lerp(pose.x, desired.x, blend)
    pose.z = THREE.MathUtils.lerp(pose.z, desired.z, blend)
    pose.yaw = THREE.MathUtils.lerp(pose.yaw, desired.yaw, blend)
    pose.helperLean = THREE.MathUtils.lerp(pose.helperLean, desired.helperLean, blend)
    pose.stride = THREE.MathUtils.lerp(pose.stride, desired.stride, blend)
    const elapsed = performance.now() - actionStartedRef.current
    const actionActive = motionEnabled && actionStartedRef.current > 0 && elapsed < 820 && (stepId === 'back-blows' || stepId === 'abdominal-thrusts')
    const pulse = actionActive ? Math.sin(Math.PI * Math.min(1, elapsed / 820)) ** 2 : 0

    const spine = patientSpine.current
    const hSpine = helperSpine.current
    const hRoot = helperRoot.current
    if (!spine || !hSpine || !hRoot) return
    spine.rotation.x = pose.lean + (stepId === 'abdominal-thrusts' ? pulse * 0.05 : 0)
    if (patientNeck.current) patientNeck.current.rotation.x = handsAtThroat ? 0.12 : pose.lean > 0.6 ? -0.35 : 0.05
    hRoot.position.set(pose.x, 0, pose.z)
    hRoot.rotation.y = pose.yaw
    hSpine.rotation.x = pose.helperLean
    if (helperLeftHip.current) helperLeftHip.current.rotation.x = -pose.stride
    if (helperLeftKnee.current) helperLeftKnee.current.rotation.x = pose.stride * 0.9
    spine.updateWorldMatrix(true, false)
    hSpine.updateWorldMatrix(true, false)

    // Landmarks on the patient in world space.
    const s = state
    spine.getWorldQuaternion(s.q)
    s.front.set(0, 0, 1).applyQuaternion(s.q)
    s.up.set(0, 1, 0).applyQuaternion(s.q)
    spine.localToWorld(s.back.set(0, 0.35, -0.118))
    spine.localToWorld(s.chest.set(0.015, 0.29, 0.13))
    spine.localToWorld(s.abdomen.set(0, 0.12, 0.112))
    backTargetRef.current?.position.copy(s.back).addScaledVector(s.front, -0.04)
    abdomenTargetRef.current?.position.copy(s.abdomen).addScaledVector(s.front, 0.12)

    // Patient arms, in the patient's spine space.
    for (const side of [1, -1] as const) {
      const key = side === 1 ? 'l' : 'r'
      const arm = s.patient[key]
      const shoulder = SHOULDER_LOCAL('male', side)
      if (handsAtThroat) {
        s.wrist.set(side * 0.058, 0.49, 0.118)
        s.fingers.set(-side * 0.35, 0.62, -0.55).normalize()
        s.palm.set(-side * 0.75, 0.05, -0.55).normalize()
        s.pole.copy(shoulder).add(s.v.set(side * 0.35, -0.4, 0.12))
      } else {
        // Hang with gravity whatever the lean.
        s.v.set(0, -Math.cos(spine.rotation.x), Math.sin(spine.rotation.x))
        s.wrist.copy(shoulder).addScaledVector(s.v, 0.5).add(s.w.set(side * 0.035, 0, 0.04))
        s.fingers.copy(s.v)
        s.palm.set(-side, 0, 0)
        s.pole.copy(shoulder).addScaledVector(s.v, 0.2).add(s.w.set(side * 0.05, 0, -0.3))
      }
      if (!arm.ready) { arm.wrist.copy(s.wrist); arm.palm.copy(s.palm); arm.pole.copy(s.pole); arm.fingers.copy(s.fingers); arm.ready = true }
      arm.wrist.lerp(s.wrist, blend); arm.palm.lerp(s.palm, blend).normalize(); arm.pole.lerp(s.pole, blend)
      patientArms[key].current?.reach(shoulder, arm.wrist, arm.pole, arm.palm)
    }

    // Helper arms: targets are chosen in world space, blended, then mapped into the helper's spine.
    hRoot.getWorldQuaternion(s.qi)
    s.helperLeft.set(1, 0, 0).applyQuaternion(s.qi)
    s.helperForward.set(0, 0, 1).applyQuaternion(s.qi)
    hSpine.getWorldQuaternion(s.qi).invert()
    for (const side of [1, -1] as const) {
      const key = side === 1 ? 'l' : 'r'
      const arm = s.helper[key]
      const shoulderLocal = SHOULDER_LOCAL('female', side)
      hSpine.localToWorld(s.shoulder.copy(shoulderLocal))
      if (backStage && side === 1) {
        // Heel of the hand travels to the upper back, then fully recoils.
        s.fingers.copy(s.up)
        s.palm.copy(s.front)
        s.wrist.copy(s.back).addScaledVector(s.up, -0.03).addScaledVector(s.front, -0.022)
        s.wrist.addScaledVector(s.front, -0.13 * (1 - pulse)).addScaledVector(s.w.set(0, 1, 0), 0.04 * (1 - pulse))
        s.pole.copy(s.shoulder).addScaledVector(s.helperLeft, 0.45).add(s.w.set(0, 0.25, 0))
      } else if (backStage) {
        // Supporting hand flat across the upper chest.
        s.fingers.set(1, 0, 0)
        s.palm.copy(s.front).negate()
        s.wrist.copy(s.chest).addScaledVector(s.front, 0.018).addScaledVector(s.fingers, -0.055)
        s.pole.copy(s.shoulder).addScaledVector(s.helperLeft, -0.3).add(s.w.set(0, -0.45, 0))
      } else if (thrustStage) {
        // Fist just above the navel, other hand wrapped over it; thrusts go in and up.
        s.v.copy(s.abdomen).addScaledVector(s.front, 0.03 - pulse * 0.055).add(s.w.set(0, pulse * 0.075, 0))
        if (side === 1) {
          s.fingers.set(-1, -0.1, 0.25).normalize()
          s.palm.set(0, -1, 0.15).normalize()
          s.wrist.copy(s.v).addScaledVector(s.fingers, -0.052).add(s.w.set(0.012, 0, 0))
        } else {
          s.fingers.set(1, 0.05, 0.45).normalize()
          s.palm.set(0.2, 0.15, 1).normalize()
          s.wrist.copy(s.v).add(s.w.set(-0.075, 0.005, -0.028))
        }
        s.pole.copy(s.shoulder).addScaledVector(s.helperLeft, side * 0.5).add(s.w.set(0, -0.6, 0)).addScaledVector(s.helperForward, -0.1)
      } else {
        // Relaxed at the sides, in the helper's own frame.
        hSpine.localToWorld(s.wrist.copy(shoulderLocal).add(s.v.set(side * 0.035, -0.52, 0.05)))
        hSpine.localToWorld(s.pole.copy(shoulderLocal).add(s.v.set(side * 0.08, -0.3, -0.4)))
        s.palm.copy(s.helperLeft).multiplyScalar(-side)
        s.fingers.set(0, -1, 0)
      }
      if (!arm.ready) { arm.wrist.copy(s.wrist); arm.palm.copy(s.palm); arm.pole.copy(s.pole); arm.ready = true }
      arm.wrist.lerp(s.wrist, blend); arm.palm.lerp(s.palm, blend).normalize(); arm.pole.lerp(s.pole, blend)
      // Pulse offsets must not lag behind the blend.
      if (actionActive) arm.wrist.copy(s.wrist)
      hSpine.worldToLocal(s.wrist.copy(arm.wrist))
      hSpine.worldToLocal(s.pole.copy(arm.pole))
      s.palm.copy(arm.palm).applyQuaternion(s.qi)
      helperArms[key].current?.reach(shoulderLocal, s.wrist, s.pole, s.palm)
    }
    if (arrowRef.current) arrowRef.current.position.set(0.5, 1.2 + pulse * 0.1, 0.42 - pulse * 0.07)

    const transitioning = Math.abs(pose.lean - desired.lean) > 0.001 || Math.abs(pose.x - desired.x) > 0.001 || Math.abs(pose.z - desired.z) > 0.001 || Math.abs(pose.yaw - desired.yaw) > 0.001
    if (motionEnabled && (transitioning || actionActive)) invalidate()
  })

  const target = (id: string, label: string) => <ActionTarget id={id} label={label} activeTargetIds={activeTargetIds} onTarget={onTarget} />
  const helperHands = backStage ? { l: 'open', r: 'open' } as const : thrustStage ? { l: 'fist', r: 'grip' } as const : { l: 'relaxed', r: 'relaxed' } as const

  return <group>
    {/* Café floor diorama */}
    <RoundedBox args={[4.2, 0.14, 3.75]} radius={0.05} smoothness={3} position={[0, -0.072, 0.25]} receiveShadow>
      <meshStandardMaterial color="#5e4634" roughness={0.8} />
    </RoundedBox>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 0.25]} receiveShadow>
      <planeGeometry args={[4.12, 3.67]} />
      <meshStandardMaterial map={floor} roughness={0.5} />
    </mesh>

    <Humanoid look={PATIENT} scale={SCALE} arms={false} joints={{ spine: patientSpine, neck: patientNeck }}
      attach={{ spine: <>
        <IkArm handle={patientArms.l} side={1} look={PATIENT} hand={handsAtThroat ? 'cup' : 'relaxed'} />
        <IkArm handle={patientArms.r} side={-1} look={PATIENT} hand={handsAtThroat ? 'cup' : 'relaxed'} />
      </> }} />
    <group ref={helperRoot} position={[-0.78, 0, 0.34]} rotation={[0, 1, 0]}>
      <Humanoid look={HELPER} scale={SCALE * 0.97} arms={false} joints={{ spine: helperSpine, lHip: helperLeftHip, lKnee: helperLeftKnee }}
        attach={{ spine: <>
          <IkArm handle={helperArms.l} side={1} look={HELPER} hand={helperHands.l} />
          <IkArm handle={helperArms.r} side={-1} look={HELPER} hand={helperHands.r} />
        </> }} />
    </group>

    <group position={[1.31, 0, -0.75]}>
      <CafeTable called={stepId !== 'recognize'} />
      <group position={[0, 1.08, 0]}>{target('call-help', 'Ask someone to call 911')}</group>
    </group>
    <group position={[0.72, 0, -0.1]} rotation={[0, -2.1, 0]}><BistroChair /></group>

    <group position={[0.38, 2.12, 0.23]}>{target('recognize-severe', 'Recognize severe choking')}</group>
    <group position={[-0.7, 2.0, 0.3]}>{target('support-forward', 'Support + lean forward')}</group>
    <group ref={backTargetRef}>{target('back-blow', 'One back blow')}</group>
    <group ref={abdomenTargetRef}>{target('fist-position', 'Just above the navel')}{target('abdominal-thrust', 'One inward + upward thrust')}</group>
    <group position={[0.18, 2.16, 0.27]}>{target('stop-monitor', 'Airway clear · Stop + observe')}</group>

    {stepId === 'abdominal-thrusts' && <group ref={arrowRef} position={[0.5, 1.2, 0.42]} rotation={[-0.55, 0, 0]}>
      <mesh position={[0, 0.13, 0]}><cylinderGeometry args={[0.015, 0.015, 0.22, 12]} /><meshBasicMaterial color="#059669" /></mesh>
      <mesh position={[0, 0.27, 0]}><coneGeometry args={[0.056, 0.11, 16]} /><meshBasicMaterial color="#059669" /></mesh>
    </group>}
    <Html center position={[-1.43, 0.075, 0.78]} zIndexRange={[3, 0]} style={{ pointerEvents: 'none' }}><span className="whitespace-nowrap rounded-md bg-white/90 px-2 py-1 text-[10px] font-medium text-slate-600">Helper</span></Html>
    <Html center position={[0.47, 0.075, 0.77]} zIndexRange={[3, 0]} style={{ pointerEvents: 'none' }}><span className="whitespace-nowrap rounded-md bg-white/90 px-2 py-1 text-[10px] font-medium text-slate-600">Responsive adult</span></Html>
    {airwayClear && <Html center position={[0, 2.53, 0]} zIndexRange={[4, 1]} style={{ pointerEvents: 'none' }}><span className="whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">Speaking and breathing</span></Html>}
  </group>
}
