import { useEffect, useRef, useState } from 'react'
import { Html, RoundedBox } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { PracticeSceneProps } from '../../lib/practice-types'

type Point = [number, number, number]
const stageIds = ['privacy', 'listen', 'validate', 'choice', 'resources', 'plan']
const palette = { wall: '#e7e6df', trim: '#f7f5ef', floor: '#cec6b8', wood: '#b49374', ink: '#31424a', sage: '#81938b', warm: '#c6b7a7', accent: '#719f99' }

function Box({ position, size, color, radius = 0.03, rotation }: { position: Point; size: Point; color: string; radius?: number; rotation?: Point }) {
  return <RoundedBox position={position} args={size} radius={radius} smoothness={3} rotation={rotation} castShadow receiveShadow>
    <meshStandardMaterial color={color} roughness={0.88} />
  </RoundedBox>
}

function Chair({ color }: { color: string }) {
  return <group>
    {[-0.27, 0.27].flatMap(x => [-0.25, 0.25].map(z => <Box key={`${x}-${z}`} position={[x, 0.27, z]} size={[0.055, 0.52, 0.055]} color={palette.wood} radius={0.01} />))}
    <Box position={[0, 0.57, 0]} size={[0.75, 0.15, 0.76]} color={color} radius={0.065} />
    <Box position={[0, 0.97, -0.32]} size={[0.75, 0.79, 0.13]} color={color} radius={0.055} />
    {[-1, 1].map(side => <group key={side}><Box position={[side * 0.36, 0.84, 0]} size={[0.095, 0.1, 0.66]} color={palette.wood} /><Box position={[side * 0.36, 0.68, 0.2]} size={[0.055, 0.32, 0.055]} color={palette.wood} radius={0.01} /></group>)}
  </group>
}

function Person({ role, stage, actionCount, completed, motionEnabled }: { role: 'alex' | 'jordan'; stage: number; actionCount: number; completed: boolean; motionEnabled: boolean }) {
  const root = useRef<THREE.Group>(null)
  const upperBody = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const rightArm = useRef<THREE.Group>(null)
  const leftArm = useRef<THREE.Group>(null)
  const elapsed = useRef(0)
  const invalidate = useThree(state => state.invalidate)
  const alex = role === 'alex'
  const skin = alex ? '#ba8a6c' : '#d2ab8c'
  const shirt = alex ? '#647e76' : '#586777'
  const hair = alex ? '#403833' : '#51433a'
  const responding = actionCount > 0 || completed
  const engaged = stage > 0 || responding
  const targetRotation = (alex ? 1 : -1) * (engaged ? 0.83 : 0.40)

  useEffect(() => { elapsed.current = 0; invalidate() }, [stage, actionCount, completed, motionEnabled, invalidate])

  useFrame((_, delta) => {
    if (!root.current || !head.current || !upperBody.current || !rightArm.current || !leftArm.current) return
    elapsed.current = motionEnabled ? Math.min(2.4, elapsed.current + Math.min(delta, 0.05)) : 2.4
    const t = elapsed.current
    const ease = motionEnabled ? Math.min(delta * 5, 1) : 1
    root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, targetRotation, ease)
    const nod = motionEnabled && responding && t < 1.9 ? Math.sin(t / 1.9 * Math.PI * 2) * Math.sin(t / 1.9 * Math.PI) : 0
    head.current.rotation.x = (alex ? 0.035 : 0.02) + nod * (alex ? 0.05 : 0.11)
    head.current.rotation.z = !alex && stage >= 1 ? -0.045 : 0
    upperBody.current.rotation.x = THREE.MathUtils.lerp(upperBody.current.rotation.x, engaged ? 0.055 : 0.01, ease)
    const gesture = motionEnabled && responding ? Math.sin(Math.min(t / 2.0, 1) * Math.PI) : 0
    const offering = !alex && stage >= 4 && (stage > 4 || responding)
    rightArm.current.rotation.x = THREE.MathUtils.lerp(rightArm.current.rotation.x, offering ? -0.88 : -0.2 - gesture * (alex ? 0.18 : 0.42), ease)
    leftArm.current.rotation.x = THREE.MathUtils.lerp(leftArm.current.rotation.x, !alex && stage === 3 && responding ? -0.58 : -0.16 - gesture * 0.12, ease)
    // A finite response animation keeps the parent demand-rendered canvas idle at rest.
    if (motionEnabled && t < 2.4) invalidate()
  })

  return <group ref={root} position={alex ? [-0.93, 0, -0.40] : [0.91, 0, -0.35]} rotation={[0, (alex ? 1 : -1) * 0.4, 0]}>
    <Chair color={alex ? '#b9c3b8' : '#c9c2b8'} />
    <mesh position={[0, 0.72, 0.03]} scale={[0.26, 0.13, 0.19]} castShadow><sphereGeometry args={[1, 18, 12]} /><meshStandardMaterial color="#3d4b50" roughness={1} /></mesh>
    {[-1, 1].map(side => <group key={side}>
      <mesh position={[side * 0.13, 0.68, 0.22]} rotation={[Math.PI / 2 + 0.10, 0, 0]} castShadow><capsuleGeometry args={[0.09, 0.31, 5, 12]} /><meshStandardMaterial color="#3d4b50" roughness={1} /></mesh>
      <mesh position={[side * 0.13, 0.34, 0.42]} castShadow><capsuleGeometry args={[0.077, 0.40, 5, 12]} /><meshStandardMaterial color="#3d4b50" roughness={1} /></mesh>
      <Box position={[side * 0.13, 0.08, 0.48]} size={[0.17, 0.12, 0.30]} color="#e6e1d8" radius={0.045} />
      <Box position={[side * 0.13, 0.025, 0.48]} size={[0.18, 0.025, 0.31]} color="#acb0ac" radius={0.009} />
    </group>)}
    <group ref={upperBody} position={[0, 0.82, 0.005]}>
      <mesh position={[0, 0.22, 0]} scale={[0.26, 0.34, 0.18]} castShadow><sphereGeometry args={[1, 22, 16]} /><meshStandardMaterial color={shirt} roughness={0.97} /></mesh>
      <mesh position={[0, 0.54, 0]} castShadow><cylinderGeometry args={[0.065, 0.075, 0.12, 14]} /><meshStandardMaterial color={skin} roughness={0.9} /></mesh>
      <group ref={head} position={[0, 0.73, 0.012]}>
        <mesh scale={[0.145, 0.18, 0.14]} castShadow><sphereGeometry args={[1, 22, 18]} /><meshStandardMaterial color={skin} roughness={0.9} /></mesh>
        <mesh position={[0, 0.065, -0.014]} castShadow><sphereGeometry args={[0.153, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.57]} /><meshStandardMaterial color={hair} roughness={1} /></mesh>
        {alex && <mesh position={[0, -0.01, -0.093]} scale={[0.15, 0.2, 0.075]} castShadow><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color={hair} roughness={1} /></mesh>}
        {[-1, 1].map(side => <group key={side}><mesh position={[side * 0.142, -0.014, 0]} scale={[0.027, 0.044, 0.025]}><sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color={skin} /></mesh><mesh position={[side * 0.047, 0.015, 0.133]}><sphereGeometry args={[0.01, 12, 8]} /><meshStandardMaterial color="#303333" /></mesh><mesh position={[side * 0.046, 0.042, 0.13]} rotation={[0, 0, side * 0.08]} scale={[0.026, 0.006, 0.006]}><sphereGeometry args={[1, 10, 6]} /><meshStandardMaterial color={hair} /></mesh></group>)}
        <mesh position={[0, -0.015, 0.145]} scale={[0.024, 0.032, 0.028]}><sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color={skin} /></mesh>
        <mesh position={[0, -0.077, 0.124]} scale={[0.029, 0.006, 0.006]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#8c6253" /></mesh>
      </group>
      {[-1, 1].map(side => <group key={side} ref={side === 1 ? rightArm : leftArm} position={[side * 0.245, 0.39, 0]} rotation={[-0.16, 0, side * 0.08]}>
        <mesh position={[0, -0.13, 0]} castShadow><capsuleGeometry args={[0.071, 0.19, 5, 12]} /><meshStandardMaterial color={shirt} roughness={1} /></mesh>
        <group position={[0, -0.29, 0]} rotation={[-0.65, 0, side * -0.16]}>
          <mesh position={[0, -0.1, 0]} castShadow><capsuleGeometry args={[0.051, 0.17, 5, 12]} /><meshStandardMaterial color={skin} roughness={0.9} /></mesh>
          <mesh position={[0, -0.245, 0.005]} scale={[0.058, 0.072, 0.034]} castShadow><sphereGeometry args={[1, 14, 10]} /><meshStandardMaterial color={skin} roughness={0.9} /></mesh>
        </group>
      </group>)}
    </group>
  </group>
}

function Plant({ position, scale = 1 }: { position: Point; scale?: number }) {
  return <group position={position} scale={scale}>
    <mesh position={[0, 0.20, 0]} castShadow><cylinderGeometry args={[0.18, 0.13, 0.37, 20]} /><meshStandardMaterial color="#a88b75" roughness={0.95} /></mesh>
    <mesh position={[0, 0.39, 0]}><cylinderGeometry args={[0.157, 0.157, 0.018, 20]} /><meshStandardMaterial color="#665950" /></mesh>
    {[[-0.1, 0.66, 0.04, -0.5], [0.1, 0.84, -0.01, 0.5], [0.02, 1.05, -0.03, 0.15], [-0.15, 0.96, 0.01, -0.6], [0.16, 0.61, 0.02, 0.8]].map(([x, y, z, angle], index) => <group key={index}><mesh position={[x * 0.4, (y + 0.4) / 2, z]} rotation={[0, 0, -angle / 3]}><cylinderGeometry args={[0.011, 0.016, y - 0.38, 8]} /><meshStandardMaterial color="#65775b" /></mesh><mesh position={[x, y, z]} rotation={[0.18, index, angle]} scale={[0.13, 0.25, 0.05]} castShadow><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color={index % 2 ? '#829379' : '#677f6a'} roughness={0.95} /></mesh></group>)}
  </group>
}

function Room() {
  return <group>
    <Box position={[0, -0.11, 0]} size={[5.6, 0.2, 4.6]} color={palette.floor} radius={0.10} />
    {Array.from({ length: 13 }, (_, i) => <mesh key={i} position={[-2.6 + i * 0.42, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.008, 4.35]} /><meshStandardMaterial color="#bfb6a6" roughness={1} /></mesh>)}
    <Box position={[-0.88, 1.22, -2.2]} size={[3.84, 2.46, 0.14]} color={palette.wall} />
    <Box position={[2.58, 1.22, -2.2]} size={[0.44, 2.46, 0.14]} color={palette.wall} />
    <Box position={[1.72, 2.26, -2.2]} size={[1.34, 0.36, 0.14]} color={palette.wall} />
    <Box position={[-2.75, 0.38, 0]} size={[0.14, 0.76, 4.45]} color={palette.wall} />
    <Box position={[-2.75, 1.35, -1.61]} size={[0.14, 1.96, 1.19]} color={palette.wall} />
    <Box position={[-0.88, 0.085, -2.1]} size={[3.8, 0.16, 0.06]} color={palette.trim} radius={0.01} />
    <Box position={[-2.64, 0.075, 0]} size={[0.07, 0.14, 4.25]} color={palette.trim} radius={0.01} />
    <Box position={[-1.28, 1.65, -2.10]} size={[1.50, 1.02, 0.09]} color={palette.trim} />
    <Box position={[-1.28, 1.65, -2.04]} size={[1.34, 0.85, 0.04]} color="#cfdfdf" radius={0.01} />
    <Box position={[-1.28, 1.65, -2.005]} size={[0.04, 0.88, 0.03]} color={palette.trim} radius={0.005} />
    <Box position={[-1.28, 1.64, -2.005]} size={[1.38, 0.04, 0.03]} color={palette.trim} radius={0.005} />
    <Box position={[-1.28, 1.15, -2.0]} size={[1.66, 0.075, 0.24]} color={palette.trim} />
    <Box position={[0.37, 1.69, -2.09]} size={[0.67, 0.86, 0.05]} color={palette.wood} radius={0.01} />
    <Box position={[0.37, 1.69, -2.052]} size={[0.56, 0.75, 0.015]} color="#f3f0e6" radius={0.005} />
    <mesh position={[0.37, 1.68, -2.04]} scale={[0.19, 0.26, 0.005]}><circleGeometry args={[1, 32]} /><meshStandardMaterial color="#8b9c94" /></mesh>
    <Box position={[0.37, 1.54, -2.025]} size={[0.37, 0.045, 0.008]} color="#d4c5b2" radius={0.004} />
    {[1.07, 2.37].map(x => <Box key={x} position={[x, 1.045, -2.14]} size={[0.075, 2.10, 0.16]} color={palette.wood} radius={0.015} />)}
    <Box position={[1.72, 2.085, -2.14]} size={[1.38, 0.075, 0.16]} color={palette.wood} radius={0.015} />
    <Box position={[1.72, 0.022, -2.05]} size={[1.3, 0.035, 0.45]} color="#aeb9b0" radius={0.01} />
    <Box position={[0, 0.018, 0.25]} size={[3.56, 0.032, 2.67]} color="#ebe8df" radius={0.13} />
    <Box position={[0, 0.039, 0.25]} size={[3.28, 0.008, 2.39]} color="#dfdfd4" radius={0.12} />
    <Plant position={[-2.18, 0, -1.32]} />
    <Plant position={[2.18, 0, 1.55]} scale={0.75} />
    <group position={[0, 0, 0.62]}>
      <mesh position={[0, 0.47, 0]} castShadow receiveShadow><cylinderGeometry args={[0.55, 0.55, 0.075, 48]} /><meshStandardMaterial color="#c1a686" roughness={0.85} /></mesh>
      {[-1, 1].map(side => <Box key={side} position={[side * 0.31, 0.245, 0]} size={[0.085, 0.47, 0.085]} color="#9d856d" rotation={[0, 0, side * -0.13]} radius={0.015} />)}
      <Box position={[0, 0.16, 0]} size={[0.67, 0.04, 0.055]} color="#9d856d" radius={0.01} />
    </group>
    <group position={[-2.03, 0, 0.42]}><Box position={[0, 0.60, 0]} size={[0.64, 0.07, 0.66]} color={palette.wood} /><Box position={[0, 0.29, 0]} size={[0.12, 0.58, 0.12]} color={palette.wood} /><Box position={[0, 0.05, 0]} size={[0.43, 0.08, 0.43]} color={palette.wood} />
      <mesh position={[0.10, 0.715, -0.10]} castShadow><cylinderGeometry args={[0.068, 0.057, 0.16, 20]} /><meshStandardMaterial color="#f1e9dc" /></mesh>
      <mesh position={[0.167, 0.73, -0.10]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.044, 0.012, 8, 18]} /><meshStandardMaterial color="#f1e9dc" /></mesh>
    </group>
    <group position={[2.23, 0, -0.4]}>
      <mesh position={[0, 0.045, 0]}><cylinderGeometry args={[0.25, 0.27, 0.06, 24]} /><meshStandardMaterial color="#8d8b80" metalness={0.25} roughness={0.65} /></mesh>
      <mesh position={[0, 0.91, 0]} castShadow><cylinderGeometry args={[0.021, 0.021, 1.75, 12]} /><meshStandardMaterial color="#8d8b80" metalness={0.25} /></mesh>
      <mesh position={[0, 1.89, 0]} castShadow><cylinderGeometry args={[0.19, 0.34, 0.43, 28, 1, true]} /><meshStandardMaterial color="#f0e7d7" side={THREE.DoubleSide} roughness={0.95} /></mesh>
      <mesh position={[0, 1.69, 0]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.31, 28]} /><meshStandardMaterial color="#f4e7c9" emissive="#e9d6ad" emissiveIntensity={0.15} /></mesh>
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

function Resources({ stage, responding, motionEnabled }: { stage: number; responding: boolean; motionEnabled: boolean }) {
  const phone = useRef<THREE.Group>(null)
  const plan = useRef<THREE.Group>(null)
  const options = useRef<THREE.Group>(null)
  const progress = useRef(0)
  const invalidate = useThree(state => state.invalidate)
  const offer = stage > 4 || (stage === 4 && responding)
  const showPlan = stage === 5 && responding

  useEffect(() => { progress.current = 0; invalidate() }, [stage, responding, motionEnabled, invalidate])
  useFrame((_, delta) => {
    progress.current = motionEnabled ? Math.min(progress.current + Math.min(delta, 0.05), 2.2) : 2.2
    const t = Math.min(progress.current / 1.6, 1)
    const eased = t * t * (3 - 2 * t)
    if (phone.current) {
      const targetX = offer ? -0.49 : 0.32
      const targetY = offer ? 0.91 : 0.535
      const targetZ = offer ? -0.07 : 0.63
      const blend = motionEnabled ? Math.min(delta * 4.5, 1) : 1
      phone.current.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), blend)
      phone.current.rotation.x = THREE.MathUtils.lerp(phone.current.rotation.x, offer ? -0.65 : -Math.PI / 2, blend)
      phone.current.rotation.z = THREE.MathUtils.lerp(phone.current.rotation.z, offer ? 0.35 : 0.1, blend)
    }
    if (plan.current) plan.current.scale.setScalar(showPlan ? 0.88 + eased * 0.12 : 0.88)
    if (options.current) options.current.scale.setScalar(showPlan ? 0.2 + eased * 0.8 : 0.001)
    if (motionEnabled && progress.current < 2.2) invalidate()
  })

  return <group>
    <group ref={phone} position={[0.32, 0.535, 0.63]} rotation={[-Math.PI / 2, 0, 0.1]}><Phone /></group>
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
  return <group>
    <Room />
    <Person role="alex" stage={stage} actionCount={actionCount} completed={completed} motionEnabled={motionEnabled} />
    <Person role="jordan" stage={stage} actionCount={actionCount} completed={completed} motionEnabled={motionEnabled} />
    <Resources stage={stage} responding={responding} motionEnabled={motionEnabled} />
    {activeTargetIds.filter(id => targets[id]).map(id => <Hotspot key={id} id={id} onTarget={onTarget} />)}
    <Html position={[-1.22, 0.11, 1.32]} center distanceFactor={9} zIndexRange={[2, 0]} style={{ pointerEvents: 'none' }}><div style={{ font: '600 9px/1.5 system-ui, sans-serif', letterSpacing: '0.13em', color: '#687c73', whiteSpace: 'nowrap', background: '#fafbf3dc', border: '1px solid #d5ded4', borderRadius: 5, padding: '5px 9px' }}>LISTEN · BELIEVE · SUPPORT</div></Html>
  </group>
}
