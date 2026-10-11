import { useEffect, useRef } from 'react'
import { Html, RoundedBox } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, MathUtils } from 'three'
import type { RefObject } from 'react'
import type { PracticeSceneProps } from '../../lib/practice-types'
import { gunViolencePractice } from '../../data/practice/gun-violence'

type Point = [number, number, number]
type JointRefs = { leftArm?: RefObject<Group | null>; rightArm?: RefObject<Group | null>; leftLeg?: RefObject<Group | null>; rightLeg?: RefObject<Group | null> }
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

function Block({ position, size, color, radius = 0.035 }: { position: Point; size: Point; color: string; radius?: number }) {
  return <RoundedBox position={position} args={size} radius={radius} smoothness={2} castShadow receiveShadow><meshStandardMaterial color={color} roughness={0.83} /></RoundedBox>
}

function SceneLabel({ position, children, dark = false }: { position: Point; children: string; dark?: boolean }) {
  return <Html position={position} center distanceFactor={10} zIndexRange={[5, 0]} style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}><span style={{ display: 'block', borderRadius: 5, padding: '3px 6px', background: dark ? '#334155' : '#fffffff0', color: dark ? '#fff' : '#64748b', border: dark ? 'none' : '1px solid #e2e8f0', font: '600 8px system-ui', letterSpacing: '.07em', textTransform: 'uppercase' }}>{children}</span></Html>
}

function Hand() {
  return <group position={[0, -0.41, 0]}>
    <mesh castShadow><sphereGeometry args={[0.057, 12, 10]} /><meshStandardMaterial color="#c59b82" roughness={0.9} /></mesh>
    {[-0.034, -0.012, 0.012, 0.034].map((x, index) => <mesh key={x} position={[x, -0.065, 0.005]}><capsuleGeometry args={[0.012, index === 0 || index === 3 ? 0.055 : 0.07, 3, 6]} /><meshStandardMaterial color="#c59b82" roughness={0.9} /></mesh>)}
    <mesh position={[0.05, -0.017, 0.015]} rotation={[0, 0, -0.6]}><capsuleGeometry args={[0.016, 0.04, 3, 6]} /><meshStandardMaterial color="#c59b82" roughness={0.9} /></mesh>
  </group>
}

function Person({ shirt = '#64888e', joints = {}, responder = false }: { shirt?: string; joints?: JointRefs; responder?: boolean }) {
  return <group>
    {[-1, 1].map(side => <group key={side} ref={side < 0 ? joints.leftLeg : joints.rightLeg} position={[side * 0.105, 0.78, 0]}>
      <mesh position={[0, -0.31, 0]} castShadow><capsuleGeometry args={[0.087, 0.54, 6, 12]} /><meshStandardMaterial color="#384759" roughness={0.9} /></mesh>
      <Block position={[0, -0.73, 0.055]} size={[0.18, 0.105, 0.28]} color="#283542" />
    </group>)}
    <mesh position={[0, 1.07, 0]} scale={[1, 1, 0.62]} castShadow><capsuleGeometry args={[0.245, 0.22, 8, 18]} /><meshStandardMaterial color={shirt} roughness={0.85} /></mesh>
    <mesh position={[0, 1.39, 0]}><cylinderGeometry args={[0.075, 0.082, 0.11, 12]} /><meshStandardMaterial color="#c59b82" roughness={0.9} /></mesh>
    <mesh position={[0, 1.57, 0.018]} scale={[0.83, 1.07, 0.87]} castShadow><sphereGeometry args={[0.19, 20, 16]} /><meshStandardMaterial color="#c59b82" roughness={0.9} /></mesh>
    <mesh position={[0, 1.68, -0.015]} scale={[0.87, 0.5, 0.86]} castShadow><sphereGeometry args={[0.19, 16, 12]} /><meshStandardMaterial color={responder ? '#334155' : '#493b32'} roughness={1} /></mesh>
    {[-0.055, 0.055].map(x => <mesh key={x} position={[x, 1.585, 0.167]}><sphereGeometry args={[0.012, 8, 6]} /><meshStandardMaterial color="#3b302b" /></mesh>)}
    <mesh position={[0, 1.535, 0.176]} scale={[0.6, 1, 1]}><sphereGeometry args={[0.027, 8, 6]} /><meshStandardMaterial color="#c0987f" /></mesh>
    {[-1, 1].map(side => <group key={side} ref={side < 0 ? joints.leftArm : joints.rightArm} position={[side * 0.265, 1.25, 0]} rotation={[0, 0, side * 0.1]}>
      <mesh position={[0, -0.19, 0]} castShadow><capsuleGeometry args={[0.074, 0.27, 6, 12]} /><meshStandardMaterial color={shirt} roughness={0.85} /></mesh>
      <Hand />
    </group>)}
    {responder && <><Block position={[0, 0.98, 0.155]} size={[0.3, 0.045, 0.022]} color="#dce5e8" radius={0.006} /><mesh position={[-0.11, 1.17, 0.15]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.037, 0.027, 0.012, 5]} /><meshStandardMaterial color="#c9b484" metalness={0.25} roughness={0.55} /></mesh></>}
  </group>
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

export default function GunViolenceScene({ stepId, actionCount, completed, motionEnabled, activeTargetIds, onTarget }: PracticeSceneProps) {
  const actor = useRef<Group>(null)
  const leftArm = useRef<Group>(null)
  const rightArm = useRef<Group>(null)
  const leftLeg = useRef<Group>(null)
  const rightLeg = useRef<Group>(null)
  const phone = useRef<Group>(null)
  const companionArm = useRef<Group>(null)
  const elapsed = useRef(0)
  const invalidate = useThree(state => state.invalidate)
  const step = Math.max(0, STEP_IDS.indexOf(stepId))
  const activated = actionCount > 0 || completed
  const showResponder = step >= 4

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
    if (actor.current) {
      actor.current.position.set(MathUtils.lerp(start[0], end[0], t), 0.07 + (walking ? Math.abs(Math.sin(raw * Math.PI * 8)) * 0.025 : 0), MathUtils.lerp(start[2], end[2], t))
      actor.current.rotation.y = walking ? Math.PI / 2 : step < 3 ? Math.PI / 5 : 0
    }
    const stride = walking ? Math.sin(raw * Math.PI * 8) * 0.34 : 0
    if (leftLeg.current) leftLeg.current.rotation.x = stride
    if (rightLeg.current) rightLeg.current.rotation.x = -stride
    const hands = step === 4 ? t : 0
    if (leftArm.current) { leftArm.current.rotation.x = -stride; leftArm.current.rotation.z = -0.1 - hands * 2.05 }
    if (rightArm.current) { rightArm.current.rotation.x = stride - (step === 3 ? t * 2.6 : step === 4 ? (1 - t) * 2.6 : 0); rightArm.current.rotation.z = 0.1 + hands * 2.05 + (step === 5 ? t * 0.75 : 0) }
    if (phone.current) {
      const phoneLift = step === 4 ? 1 - t : t
      phone.current.visible = step === 3 || (step === 4 && t < 0.22)
      phone.current.position.set(0.31, MathUtils.lerp(0.85, 1.57, phoneLift), MathUtils.lerp(0.13, 0.18, phoneLift))
      phone.current.rotation.z = -phoneLift * 0.2
    }
    if (companionArm.current) companionArm.current.rotation.z = step === 5 ? -0.1 - t * 0.65 : -0.1
    if (activated && raw < 1 && motionEnabled) invalidate()
  })

  return <group>
    {/* Open-front architectural model: outside is the pale green strip on the right. */}
    <Block position={[0, -0.07, 0]} size={[5.9, 0.14, 5.25]} color="#e5eaee" radius={0.06} />
    <Block position={[-1.02, 0.025, 0]} size={[3.74, 0.07, 4.85]} color="#f0f1ec" />
    <Block position={[1.95, 0.03, 0]} size={[1.83, 0.08, 4.85]} color="#e0e9e1" />
    <Block position={[-2.83, 1.05, 0]} size={[0.1, 2.06, 4.85]} color="#d8dfe3" />
    <Block position={[-1.03, 1.05, -2.39]} size={[3.72, 2.06, 0.1]} color="#e2e7e9" />
    <Block position={[0.8, 0.58, -1.22]} size={[0.1, 1.08, 2.3]} color="#d8e0e3" />
    <Block position={[0.8, 0.58, 2.01]} size={[0.1, 1.08, 0.65]} color="#d8e0e3" />
    {/* The doorway remains open and visibly unobstructed. */}
    <Block position={[0.81, 1.02, 0.2]} size={[0.13, 1.98, 0.11]} color="#93a5aa" />
    <Block position={[0.81, 1.02, 1.63]} size={[0.13, 1.98, 0.11]} color="#93a5aa" />
    <Block position={[0.81, 1.99, 0.91]} size={[0.14, 0.11, 1.52]} color="#93a5aa" />
    <SceneLabel position={[0.8, 2.19, 0.94]} dark>Side exit</SceneLabel>
    {/* Shelter room, included as orientation context for an alternative situation. */}
    <Block position={[-1.78, 0.08, -1.43]} size={[1.88, 0.04, 1.72]} color="#e0e6e7" />
    <Block position={[-1.74, 0.74, -0.53]} size={[2.05, 1.38, 0.09]} color="#dde4e7" />
    <Block position={[-0.72, 0.74, -1.99]} size={[0.09, 1.38, 0.73]} color="#dde4e7" />
    <group position={[-0.71, 0.09, -1.6]} rotation={[0, -0.52, 0]}><Block position={[0, 0.64, 0.39]} size={[0.055, 1.28, 0.76]} color="#bbc9ce" /><mesh position={[0.045, 0.67, 0.68]}><sphereGeometry args={[0.04, 10, 8]} /><meshStandardMaterial color="#536672" metalness={0.45} roughness={0.3} /></mesh></group>
    <SceneLabel position={[-1.9, 1.8, -1.65]}>Shelter room</SceneLabel>
    <Block position={[-2.42, 0.44, -1.76]} size={[0.35, 0.72, 0.65]} color="#b8c6cb" />
    {/* A bench and left-behind bag ground the evacuation decision in the scene. */}
    <Block position={[-2.23, 0.42, 1.55]} size={[0.73, 0.11, 1.12]} color="#b8a791" />
    {[-0.34, 0.34].map(z => <Block key={z} position={[-2.23, 0.22, 1.55 + z]} size={[0.5, 0.36, 0.09]} color="#8d9aa2" />)}
    <Block position={[-2.23, 0.66, 1.51]} size={[0.41, 0.37, 0.32]} color="#768492" radius={0.055} />
    <mesh position={[-2.23, 0.88, 1.51]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.09, 0.015, 6, 14, Math.PI]} /><meshStandardMaterial color="#475569" /></mesh>
    {/* Route markers are spatial cues, not an assertion of real-world safety. */}
    {[-0.78, -0.3, 0.18, 1.25, 1.72].map(x => <mesh key={x} position={[x, 0.088, 0.96]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}><coneGeometry args={[0.085, 0.19, 3]} /><meshStandardMaterial color={step >= 1 ? '#87aaa3' : '#becdca'} roughness={0.9} /></mesh>)}
    <mesh position={[2.05, 0.079, 1.35]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.61, 0.64, 48]} /><meshStandardMaterial color="#8faa99" roughness={0.9} /></mesh>
    <SceneLabel position={[2.13, 0.14, -2.02]}>Outside · not to scale</SceneLabel>
    <mesh position={[-0.35, 0.07, -1.6]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.21, 0.23, 24]} /><meshStandardMaterial color="#b6a891" /></mesh>
    <group ref={actor} position={START} scale={0.86}>
      <Person joints={{ leftArm, rightArm, leftLeg, rightLeg }} />
      <group ref={phone} visible={step === 3} position={[0.31, 0.85, 0.13]}><Block position={[0, 0, 0]} size={[0.13, 0.24, 0.028]} color="#334155" radius={0.015} /><Block position={[0, 0.018, 0.018]} size={[0.098, 0.15, 0.009]} color="#c5dedb" radius={0.005} /></group>
    </group>
    {showResponder && <group position={[2.08, 0.07, -1.13]} scale={0.83}><Person shirt="#465f75" responder /></group>}
    {showResponder && <SceneLabel position={[2.05, 1.8, -1.2]} dark>Responder</SceneLabel>}
    {step >= 5 && <group position={[2.32, 0.07, 2.19]} rotation={[0, -0.65, 0]} scale={0.77}><Person shirt="#a9a08c" joints={{ leftArm: companionArm }} /></group>}
    {/* A planted edge makes outside legible without simulating danger or injuries. */}
    <Block position={[1.95, 0.22, -2.03]} size={[1.55, 0.28, 0.48]} color="#bfcbd0" />
    {[1.48, 1.92, 2.39].map(x => <mesh key={x} position={[x, 0.5, -2.04]} scale={[1, 0.7, 0.8]} castShadow><sphereGeometry args={[0.27, 12, 10]} /><meshStandardMaterial color="#8da290" roughness={1} /></mesh>)}
    {!completed && activeTargetIds.map(id => TARGETS[id] ? <Target key={id} id={id} {...TARGETS[id]} onTarget={onTarget} /> : null)}
  </group>
}
