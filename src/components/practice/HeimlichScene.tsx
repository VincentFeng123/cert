import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Billboard, Html, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { PracticeSceneProps } from '../../lib/practice-types'

type Point = [number, number, number]
const SKIN = '#d5ae94'
const HELPER_SKIN = '#ad8166'
const UP = new THREE.Vector3(0, 1, 0)

function Segment({ start, end, radius = 0.067, color }: { start: Point; end: Point; radius?: number; color: string }) {
  const { middle, orientation, length } = useMemo(() => {
    const a = new THREE.Vector3(...start)
    const b = new THREE.Vector3(...end)
    const direction = b.clone().sub(a)
    return { middle: a.add(b).multiplyScalar(0.5), orientation: new THREE.Quaternion().setFromUnitVectors(UP, direction.clone().normalize()), length: direction.length() }
  }, [start, end])
  return <mesh position={middle} quaternion={orientation} castShadow>
    <capsuleGeometry args={[radius, Math.max(0.005, length - radius * 2), 5, 12]} />
    <meshStandardMaterial color={color} roughness={0.8} />
  </mesh>
}

function Head({ skin }: { skin: string }) {
  return <group position={[0, 1.09, 0]}>
    <mesh position={[0, -0.2, 0]} castShadow><capsuleGeometry args={[0.088, 0.07, 6, 14]} /><meshStandardMaterial color={skin} roughness={0.72} /></mesh>
    <mesh scale={[0.19, 0.245, 0.195]} castShadow><sphereGeometry args={[1, 28, 20]} /><meshStandardMaterial color={skin} roughness={0.72} /></mesh>
    <mesh position={[0, -0.015, 0.194]} scale={[0.035, 0.049, 0.032]} castShadow><sphereGeometry args={[1, 16, 10]} /><meshStandardMaterial color={skin} roughness={0.72} /></mesh>
    {[-1, 1].map(side => <group key={side}>
      <mesh position={[side * 0.072, 0.042, 0.18]} scale={[0.025, 0.008, 0.008]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#61534a" /></mesh>
      <mesh position={[side * 0.188, 0, 0]} scale={[0.03, 0.065, 0.04]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color={skin} roughness={0.8} /></mesh>
    </group>)}
    <mesh position={[0, -0.085, 0.183]} scale={[0.043, 0.007, 0.007]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#97715c" /></mesh>
  </group>
}

function LowerBody({ helper = false }: { helper?: boolean }) {
  return <group>
    <mesh position={[0, 0.94, 0]} scale={[0.29, 0.18, 0.18]} castShadow><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color={helper ? '#456b6b' : '#45566e'} roughness={0.9} /></mesh>
    {[-1, 1].map(side => <group key={side}>
      <Segment start={[side * 0.145, 0.95, 0]} end={[side * 0.16, 0.16, side * 0.045]} radius={0.105} color={helper ? '#456b6b' : '#45566e'} />
      <RoundedBox args={[0.225, 0.115, 0.34]} radius={0.048} smoothness={3} position={[side * 0.16, 0.085, 0.055 + side * 0.045]} castShadow>
        <meshStandardMaterial color="#293b49" roughness={0.9} />
      </RoundedBox>
    </group>)}
  </group>
}

function Torso({ helper = false, handsAtThroat = false }: { helper?: boolean; handsAtThroat?: boolean }) {
  const shirt = helper ? '#8cb7b1' : '#7c98b6'
  return <group>
    <mesh position={[0, 0.4, 0]} scale={[1.14, 1, 0.68]} castShadow>
      <capsuleGeometry args={[0.245, 0.34, 10, 24]} /><meshStandardMaterial color={shirt} roughness={0.88} />
    </mesh>
    <mesh position={[0, 0.03, 0]} scale={[0.28, 0.1, 0.17]} castShadow><sphereGeometry args={[1, 24, 14]} /><meshStandardMaterial color={shirt} roughness={0.88} /></mesh>
    <Head skin={helper ? HELPER_SKIN : SKIN} />
    {!helper && [-1, 1].map(side => {
      const shoulder: Point = [side * 0.27, 0.65, 0]
      const elbow: Point = handsAtThroat ? [side * 0.36, 0.32, 0.18] : [side * 0.34, 0.3, 0.02]
      const hand: Point = handsAtThroat ? [side * 0.085, 0.83, 0.17] : [side * 0.35, -0.035, 0.1]
      return <group key={side}>
        <Segment start={shoulder} end={elbow} radius={0.084} color={shirt} />
        <Segment start={elbow} end={hand} radius={0.062} color={SKIN} />
        <mesh position={hand} scale={[0.065, 0.093, 0.043]} castShadow><sphereGeometry args={[1, 18, 12]} /><meshStandardMaterial color={SKIN} roughness={0.76} /></mesh>
      </group>
    })}
  </group>
}

function setBone(mesh: THREE.Mesh | null, start: THREE.Vector3, end: THREE.Vector3) {
  if (!mesh) return
  mesh.position.copy(start).add(end).multiplyScalar(0.5)
  const direction = end.clone().sub(start)
  mesh.scale.y = direction.length()
  mesh.quaternion.setFromUnitVectors(UP, direction.normalize())
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

export default function HeimlichScene({ stepId, actionCount, completed, motionEnabled, activeTargetIds, onTarget }: PracticeSceneProps) {
  const invalidate = useThree(state => state.invalidate)
  const patientUpperRef = useRef<THREE.Group>(null)
  const helperRef = useRef<THREE.Group>(null)
  const backTargetRef = useRef<THREE.Group>(null)
  const abdomenTargetRef = useRef<THREE.Group>(null)
  const nearUpperRef = useRef<THREE.Mesh>(null)
  const nearLowerRef = useRef<THREE.Mesh>(null)
  const farUpperRef = useRef<THREE.Mesh>(null)
  const farLowerRef = useRef<THREE.Mesh>(null)
  const nearHandRef = useRef<THREE.Mesh>(null)
  const farHandRef = useRef<THREE.Mesh>(null)
  const arrowRef = useRef<THREE.Group>(null)
  const poseRef = useRef({ lean: 0.05, helperX: -0.77, helperZ: -0.3 })
  const actionStartedRef = useRef(0)
  const lastActionRef = useRef(`${stepId}:${actionCount}`)
  const backStage = stepId === 'back-blows' || (stepId === 'support-forward' && actionCount > 0)
  const thrustStage = stepId === 'fist-position' || stepId === 'abdominal-thrusts'
  const airwayClear = stepId === 'reassess' || (stepId === 'abdominal-thrusts' && completed)
  const handsAtThroat = stepId === 'recognize' || stepId === 'get-help' || (stepId === 'support-forward' && actionCount === 0)
  const point = useMemo(() => new THREE.Vector3(), [])
  const backPoint = useMemo(() => new THREE.Vector3(), [])
  const chestPoint = useMemo(() => new THREE.Vector3(), [])
  const abdomenPoint = useMemo(() => new THREE.Vector3(), [])
  const shoulderA = useMemo(() => new THREE.Vector3(), [])
  const shoulderB = useMemo(() => new THREE.Vector3(), [])
  const elbowA = useMemo(() => new THREE.Vector3(), [])
  const elbowB = useMemo(() => new THREE.Vector3(), [])
  const handA = useMemo(() => new THREE.Vector3(), [])
  const handB = useMemo(() => new THREE.Vector3(), [])
  const torsoRotation = useMemo(() => new THREE.Euler(), [])

  useEffect(() => {
    const action = `${stepId}:${actionCount}`
    if (action !== lastActionRef.current) {
      actionStartedRef.current = actionCount > 0 ? performance.now() : 0
      lastActionRef.current = action
    }
    invalidate()
  }, [stepId, actionCount, completed, motionEnabled, invalidate])

  useFrame((_, delta) => {
    const desiredLean = backStage ? 1.32 : 0.03
    const desiredHelperX = thrustStage ? 0 : airwayClear ? -0.72 : -0.62
    const desiredHelperZ = thrustStage ? -0.51 : -0.02
    const pose = poseRef.current
    const blend = motionEnabled ? 1 - Math.exp(-Math.min(delta, 0.04) * 8) : 1
    pose.lean = THREE.MathUtils.lerp(pose.lean, desiredLean, blend)
    pose.helperX = THREE.MathUtils.lerp(pose.helperX, desiredHelperX, blend)
    pose.helperZ = THREE.MathUtils.lerp(pose.helperZ, desiredHelperZ, blend)
    const elapsed = performance.now() - actionStartedRef.current
    const actionActive = motionEnabled && actionStartedRef.current > 0 && elapsed < 820 && (stepId === 'back-blows' || stepId === 'abdominal-thrusts')
    const pulse = actionActive ? Math.sin(Math.PI * Math.min(1, elapsed / 820)) ** 2 : 0
    if (patientUpperRef.current) patientUpperRef.current.rotation.x = pose.lean + (stepId === 'abdominal-thrusts' ? pulse * 0.035 : 0)
    if (helperRef.current) helperRef.current.position.set(pose.helperX, 0, pose.helperZ)

    torsoRotation.set(pose.lean, 0, 0)
    backPoint.set(0, 0.62, -0.185).applyEuler(torsoRotation).add(point.set(0, 1, 0))
    chestPoint.set(-0.08, 0.46, 0.2).applyEuler(torsoRotation).add(point.set(0, 1, 0))
    abdomenPoint.set(0, 0.245, 0.2).applyEuler(torsoRotation).add(point.set(0, 1, 0))
    backTargetRef.current?.position.copy(backPoint)
    abdomenTargetRef.current?.position.copy(abdomenPoint).add(point.set(0, 0, 0.095))
    shoulderA.set(pose.helperX + 0.27, 1.65, pose.helperZ)
    shoulderB.set(pose.helperX - 0.27, 1.65, pose.helperZ)

    if (backStage) {
      // One arm supports the front of the chest; the other hand travels toward
      // the upper-back landmark and returns fully before another animation.
      handA.copy(backPoint).add(point.set(-0.025, 0.32 * (1 - pulse), -0.07 * (1 - pulse)))
      handB.copy(chestPoint)
      elbowA.set(pose.helperX + 0.12, 1.68, 0.27)
      elbowB.set(pose.helperX - 0.13, 1.12, 0.21)
    } else if (thrustStage) {
      handA.copy(abdomenPoint).add(point.set(0.015, pulse * 0.12, 0.042 - pulse * 0.075))
      handB.copy(handA).add(point.set(-0.035, 0.025, 0.02))
      elbowA.set(0.44, 1.24 + pulse * 0.06, -0.035)
      elbowB.set(-0.44, 1.24 + pulse * 0.06, -0.035)
    } else {
      handA.set(pose.helperX + 0.34, 0.98, pose.helperZ + 0.05)
      handB.set(pose.helperX - 0.34, 0.98, pose.helperZ + 0.05)
      elbowA.set(pose.helperX + 0.33, 1.31, pose.helperZ)
      elbowB.set(pose.helperX - 0.33, 1.31, pose.helperZ)
    }
    setBone(nearUpperRef.current, shoulderA, elbowA)
    setBone(nearLowerRef.current, elbowA, handA)
    setBone(farUpperRef.current, shoulderB, elbowB)
    setBone(farLowerRef.current, elbowB, handB)
    nearHandRef.current?.position.copy(handA)
    farHandRef.current?.position.copy(handB)
    if (arrowRef.current) arrowRef.current.position.set(0.59, 1.22 + pulse * 0.12, 0.42 - pulse * 0.075)

    const transitioning = Math.abs(pose.lean - desiredLean) > 0.001 || Math.abs(pose.helperX - desiredHelperX) > 0.001 || Math.abs(pose.helperZ - desiredHelperZ) > 0.001
    if (motionEnabled && (transitioning || actionActive)) invalidate()
  })

  const target = (id: string, label: string) => <ActionTarget id={id} label={label} activeTargetIds={activeTargetIds} onTarget={onTarget} />

  return <group>
    <RoundedBox args={[4.2, 0.14, 3.75]} radius={0.06} smoothness={3} position={[0, -0.065, 0.25]} receiveShadow>
      <meshStandardMaterial color="#e3e9e7" roughness={0.95} />
    </RoundedBox>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.28, 0.012, 0.18]}><ringGeometry args={[1.44, 1.455, 80]} /><meshStandardMaterial color="#bacac5" roughness={1} /></mesh>
    <LowerBody />
    <group ref={patientUpperRef} position={[0, 1, 0]}><Torso handsAtThroat={handsAtThroat} /></group>
    <group ref={helperRef} position={[-0.77, 0, -0.3]}>
      <LowerBody helper />
      <group position={[0, 1, 0]}><Torso helper /></group>
    </group>
    {[nearUpperRef, farUpperRef].map((ref, index) => <mesh key={`upper-${index}`} ref={ref} castShadow><cylinderGeometry args={[0.078, 0.073, 1, 14]} /><meshStandardMaterial color="#8cb7b1" roughness={0.85} /></mesh>)}
    {[nearLowerRef, farLowerRef].map((ref, index) => <mesh key={`lower-${index}`} ref={ref} castShadow><cylinderGeometry args={[0.06, 0.049, 1, 14]} /><meshStandardMaterial color={HELPER_SKIN} roughness={0.8} /></mesh>)}
    {[nearHandRef, farHandRef].map((ref, index) => <mesh key={`hand-${index}`} ref={ref} scale={thrustStage ? [0.073, 0.066, 0.065] : [0.065, 0.035, 0.095]} castShadow><sphereGeometry args={[1, 20, 14]} /><meshStandardMaterial color={HELPER_SKIN} roughness={0.76} /></mesh>)}

    <group position={[1.31, 0, -0.75]}>
      <RoundedBox args={[0.75, 0.095, 0.55]} radius={0.04} smoothness={3} position={[0, 0.92, 0]} castShadow><meshStandardMaterial color="#b9c9c7" roughness={0.9} /></RoundedBox>
      <mesh position={[0, 0.46, 0]} castShadow><cylinderGeometry args={[0.045, 0.055, 0.89, 16]} /><meshStandardMaterial color="#7b8d92" roughness={0.8} /></mesh>
      <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.26, 0.28, 0.06, 32]} /><meshStandardMaterial color="#7b8d92" roughness={0.8} /></mesh>
      <RoundedBox args={[0.18, 0.028, 0.3]} radius={0.012} smoothness={3} position={[0, 0.982, 0]} castShadow><meshStandardMaterial color="#334155" roughness={0.5} /></RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.998, -0.005]}><planeGeometry args={[0.146, 0.234]} /><meshBasicMaterial color={stepId !== 'recognize' ? '#8bbfaf' : '#a4b8c3'} /></mesh>
      <group position={[0, 1.08, 0]}>{target('call-help', 'Ask someone to call 911')}</group>
    </group>

    <group position={[0.38, 2.08, 0.23]}>{target('recognize-severe', 'Recognize severe choking')}</group>
    <group position={[-0.7, 1.9, 0.25]}>{target('support-forward', 'Support + lean forward')}</group>
    <group ref={backTargetRef}>{target('back-blow', 'One back blow')}</group>
    <group ref={abdomenTargetRef}>{target('fist-position', 'Just above the navel')}{target('abdominal-thrust', 'One inward + upward thrust')}</group>
    <group position={[0.18, 2.12, 0.27]}>{target('stop-monitor', 'Airway clear · Stop + observe')}</group>

    {stepId === 'abdominal-thrusts' && <group ref={arrowRef} position={[0.59, 1.22, 0.42]} rotation={[-0.55, 0, 0]}>
      <mesh position={[0, 0.13, 0]}><cylinderGeometry args={[0.015, 0.015, 0.22, 12]} /><meshBasicMaterial color="#059669" /></mesh>
      <mesh position={[0, 0.27, 0]}><coneGeometry args={[0.056, 0.11, 16]} /><meshBasicMaterial color="#059669" /></mesh>
    </group>}
    <Html center position={[-1.43, 0.075, 0.78]} zIndexRange={[3, 0]} style={{ pointerEvents: 'none' }}><span className="whitespace-nowrap rounded-md bg-white/90 px-2 py-1 text-[10px] font-medium text-slate-600">Helper</span></Html>
    <Html center position={[0.47, 0.075, 0.77]} zIndexRange={[3, 0]} style={{ pointerEvents: 'none' }}><span className="whitespace-nowrap rounded-md bg-white/90 px-2 py-1 text-[10px] font-medium text-slate-600">Responsive adult</span></Html>
    {airwayClear && <Html center position={[0, 2.53, 0]} zIndexRange={[4, 1]} style={{ pointerEvents: 'none' }}><span className="whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">Speaking and breathing</span></Html>}
  </group>
}
