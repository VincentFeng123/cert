import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { Hand, Head } from '../three/Human'
import { useHumanMaterials } from '../three/humanMaterials'
import { orientHand } from '../three/humanGeometry'
import { pebbleBump, woodFloorTexture } from '../three/textures'

const SILICONE = '#d9b29b'
const GLOVE_SCALE = 2.55
const GLOVE_COLOR = '#5d9fd6'
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

// Rescuer's hands seen from their kneeling side (+x): heel of the lower hand on
// the sternum, fingers pointing across the chest, upper hand interlaced on top.
const FINGERS_ACROSS = new THREE.Vector3(-1, 0, 0.08)
const FINGERS_UPPER = new THREE.Vector3(-1, 0, -0.18)
const PALM_DOWN = new THREE.Vector3(0, -1, 0)
const LOWER_HAND = new THREE.Quaternion()
const UPPER_HAND = new THREE.Quaternion()
orientHand(LOWER_HAND, FINGERS_ACROSS, PALM_DOWN, 1)
orientHand(UPPER_HAND, FINGERS_UPPER, PALM_DOWN, -1)

function GlovedHands({ glove }: { glove: THREE.Material }) {
  return <group>
    <group position={[0.13, 0, 0]} quaternion={LOWER_HAND} scale={GLOVE_SCALE}><Hand side={1} pose="open" material={glove} /></group>
    <group position={[0.1, 0.064, 0.008]} quaternion={UPPER_HAND} scale={GLOVE_SCALE}><Hand side={-1} pose="cup" material={glove} /></group>
  </group>
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
  const materials = useHumanMaterials({ skin: SILICONE, hair: SILICONE, hairStyle: 'none', shirt: GLOVE_COLOR, pants: GLOVE_COLOR, shoes: GLOVE_COLOR })
  const glove = useMemo(() => new THREE.MeshStandardMaterial({ color: GLOVE_COLOR, roughness: 0.38 }), [])
  const matBump = useMemo(() => pebbleBump([4, 7]), [])
  const floor = useMemo(() => woodFloorTexture([12, 12], ['#d2b48f', '#c9a983', '#d9bd9a', '#c4a27c', '#cfb08b']), [])
  useEffect(() => () => glove.dispose(), [glove])
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
        <meshStandardMaterial color="#2f4550" roughness={0.9} bumpMap={matBump} bumpScale={0.8} />
      </RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.0245, -0.23]} receiveShadow>
        <planeGeometry args={[1.68, 2.76]} />
        <meshStandardMaterial color="#3b5a63" roughness={0.88} bumpMap={matBump} bumpScale={1.2} />
      </mesh>
      <mesh geometry={torso.geometry} material={materials.skin} castShadow receiveShadow />
      <mesh position={[0, 0.3, -0.63]} rotation={[Math.PI / 2, 0, 0]} material={materials.skin} castShadow>
        <capsuleGeometry args={[0.145, 0.16, 10, 24]} />
      </mesh>
      {/* Moulded manikin head resting face-up: head +z (face) → world +y, crown → world −z. */}
      <group position={[0, 0.268, -1.03]} rotation={[-Math.PI / 2 - 0.12, 0, 0]} scale={2.6}>
        <Head materials={materials} hairStyle="none" manikin />
      </group>
      <mesh position={[0, 0.3, -0.8]} scale={[0.17, 0.16, 0.17]} material={materials.skin} castShadow>
        <sphereGeometry args={[1, 32, 24]} />
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
        {handsPlaced && <group position={[0, 0.034, 0]}><GlovedHands glove={glove} /></group>}
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.126, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial map={floor} roughness={0.5} />
      </mesh>
    </group>
  )
}
