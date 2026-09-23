import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

const SILICONE = '#d9b29b'
const GLOVE = '#8bbacd'
const TARGET_HEIGHT = 0.637

function createTorso() {
  // Cross-sections describe a purpose-built training torso resting flat on its back.
  const profile = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.02, 0.03, -0.62),
    new THREE.Vector3(0.18, 0.14, -0.54),
    new THREE.Vector3(0.43, 0.24, -0.39),
    new THREE.Vector3(0.52, 0.29, -0.22),
    new THREE.Vector3(0.49, 0.29, 0.04),
    new THREE.Vector3(0.43, 0.25, 0.32),
    new THREE.Vector3(0.35, 0.22, 0.6),
    new THREE.Vector3(0.33, 0.2, 0.74),
    new THREE.Vector3(0.29, 0.12, 0.8),
    new THREE.Vector3(0.01, 0.015, 0.82),
  ])
  const rings = 80
  const segments = 64
  const positions: number[] = []
  const weights: number[] = []
  const indices: number[] = []

  for (let ring = 0; ring <= rings; ring++) {
    const section = profile.getPoint(ring / rings)
    for (let segment = 0; segment <= segments; segment++) {
      const angle = (segment / segments) * Math.PI * 2
      const x = Math.sin(angle) * section.x
      const top = Math.max(0, Math.cos(angle))
      const z = section.z
      const pectoral = 0.026 * Math.exp(-(((Math.abs(x) - 0.21) / 0.18) ** 2 + ((z + 0.1) / 0.26) ** 2)) * top
      const y = 0.31 + Math.cos(angle) * section.y + pectoral
      positions.push(x, y, z)
      weights.push(top ** 3 * Math.exp(-((x / 0.26) ** 2 + ((z - 0.06) / 0.31) ** 2)))
      if (ring < rings && segment < segments) {
        const a = ring * (segments + 1) + segment
        const b = a + segments + 1
        indices.push(a, b, a + 1, b, b + 1, a + 1)
      }
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return { geometry, restPositions: new Float32Array(positions), weights }
}

function Hand({ upper = false }: { upper?: boolean }) {
  return (
    <group position={[0, upper ? 0.057 : 0, 0]} rotation={[0, upper ? Math.PI / 2 : 0, 0]}>
      <RoundedBox args={[0.18, 0.054, 0.2]} radius={0.025} smoothness={3} castShadow>
        <meshStandardMaterial color={GLOVE} roughness={0.8} />
      </RoundedBox>
      {[-0.063, -0.021, 0.021, 0.063].map((x, index) => (
        <mesh key={x} position={[x, 0.012, -0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.019, index === 0 || index === 3 ? 0.07 : 0.1, 6, 10]} />
          <meshStandardMaterial color={GLOVE} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0.09, 0.009, 0.025]} rotation={[Math.PI / 2, 0.3, -0.5]} castShadow>
        <capsuleGeometry args={[0.022, 0.065, 6, 10]} />
        <meshStandardMaterial color={GLOVE} roughness={0.8} />
      </mesh>
      <RoundedBox args={[0.13, 0.055, 0.12]} position={[0, 0.006, 0.13]} radius={0.018} smoothness={3} castShadow>
        <meshStandardMaterial color="#77a7bd" roughness={0.85} />
      </RoundedBox>
    </group>
  )
}

export default function TrainingMannequin({
  currentStep,
  handsPlaced,
  lastTap,
  onActivate,
  disabled,
}: {
  currentStep: number
  handsPlaced: boolean
  lastTap: number | null
  onActivate: () => void
  disabled: boolean
}) {
  const torso = useMemo(createTorso, [])
  const invalidate = useThree(state => state.invalidate)
  const contactRef = useRef<THREE.Group>(null)
  const lastDepthRef = useRef(-1)

  useEffect(() => () => torso.geometry.dispose(), [torso])
  useEffect(() => { invalidate() }, [lastTap, invalidate])

  useFrame(() => {
    const elapsed = lastTap === null ? 1 : (performance.now() - lastTap) / 1000
    const depth = elapsed >= 0 && elapsed < 0.32 ? Math.sin((elapsed / 0.32) * Math.PI) * 0.048 : 0
    if (elapsed >= 0 && elapsed < 0.32) invalidate()
    if (Math.abs(lastDepthRef.current - depth) < 0.0001) return
    lastDepthRef.current = depth
    const positions = torso.geometry.attributes.position as THREE.BufferAttribute
    for (let index = 0; index < positions.count; index++) {
      positions.setY(index, torso.restPositions[index * 3 + 1] - depth * torso.weights[index])
    }
    positions.needsUpdate = true
    torso.geometry.computeVertexNormals()
    if (contactRef.current) contactRef.current.position.y = TARGET_HEIGHT - depth
  })

  return (
    <group>
      <RoundedBox args={[1.8, 0.2, 2.9]} scale={[1, 0.5, 1]} radius={0.08} smoothness={4} position={[0, -0.075, -0.23]} receiveShadow castShadow>
        <meshStandardMaterial color="#344954" roughness={0.95} />
      </RoundedBox>
      <RoundedBox args={[1.68, 0.14, 2.76]} scale={[1, 0.1, 1]} radius={0.06} smoothness={4} position={[0, -0.015, -0.23]} receiveShadow>
        <meshStandardMaterial color="#415e65" roughness={1} />
      </RoundedBox>
      <mesh geometry={torso.geometry} castShadow receiveShadow>
        <meshStandardMaterial color={SILICONE} roughness={0.62} metalness={0.015} />
      </mesh>
      <mesh position={[0, 0.3, -0.63]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.145, 0.16, 10, 24]} />
        <meshStandardMaterial color={SILICONE} roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.3, -1.01]} scale={[0.245, 0.235, 0.33]} castShadow receiveShadow>
        <sphereGeometry args={[1, 48, 32]} />
        <meshStandardMaterial color={SILICONE} roughness={0.62} />
      </mesh>
      <mesh position={[0, 0.325, -0.81]} scale={[0.18, 0.18, 0.18]} castShadow>
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial color={SILICONE} roughness={0.62} />
      </mesh>
      <mesh position={[0, 0.533, -0.99]} scale={[0.04, 0.064, 0.07]} castShadow>
        <sphereGeometry args={[1, 24, 18]} />
        <meshStandardMaterial color={SILICONE} roughness={0.65} />
      </mesh>
      {[-1, 1].map(side => (
        <group key={side}>
          <mesh position={[side * 0.241, 0.31, -1.005]} scale={[0.043, 0.058, 0.083]} castShadow>
            <sphereGeometry args={[1, 24, 18]} />
            <meshStandardMaterial color={SILICONE} roughness={0.7} />
          </mesh>
          <mesh position={[side * 0.088, 0.515, -1.095]} rotation={[-0.23, 0, side * 0.03]} scale={[0.057, 0.007, 0.012]}>
            <sphereGeometry args={[1, 20, 12]} />
            <meshStandardMaterial color="#997663" roughness={0.9} />
          </mesh>
          <mesh position={[side * 0.037, 0.503, -0.937]} scale={[0.012, 0.003, 0.01]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color="#a17c65" roughness={1} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.496, -0.866]} rotation={[0.28, 0, 0]} scale={[0.063, 0.006, 0.014]}>
        <sphereGeometry args={[1, 24, 14]} />
        <meshStandardMaterial color="#a17c65" roughness={1} />
      </mesh>
      <group ref={contactRef} position={[0, TARGET_HEIGHT, 0.08]}>
        {currentStep >= 1 && (
          <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.155, 0.171, 64]} />
              <meshBasicMaterial color={disabled ? '#719081' : '#059669'} side={THREE.DoubleSide} transparent opacity={0.9} depthWrite={false} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
              <circleGeometry args={[0.151, 48]} />
              <meshBasicMaterial color="#10b981" transparent opacity={0.18} depthWrite={false} />
            </mesh>
            {!handsPlaced && (
              <group position={[0, 0.005, 0]}>
                <mesh><boxGeometry args={[0.062, 0.006, 0.012]} /><meshBasicMaterial color="#047857" /></mesh>
                <mesh><boxGeometry args={[0.012, 0.006, 0.062]} /><meshBasicMaterial color="#047857" /></mesh>
              </group>
            )}
          </group>
        )}
        {handsPlaced && <group position={[0, 0.037, 0]}><Hand /><Hand upper /></group>}
        {currentStep >= 1 && !disabled && (
          <mesh
            position={[0, handsPlaced ? 0.09 : 0.025, 0]}
            onClick={event => { event.stopPropagation(); onActivate() }}
          >
            <sphereGeometry args={[0.25, 16, 12]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        )}
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.136, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#e9eeeb" roughness={1} />
      </mesh>
    </group>
  )
}
