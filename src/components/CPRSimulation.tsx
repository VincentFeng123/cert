import { useRef, useState, useEffect, useCallback, useMemo, type CSSProperties } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

interface CPRSimulationProps {
  onStepComplete: (step: number) => void
  currentStep: number
  sceneViewTime: number
  setSceneViewTime: (value: number | ((prev: number) => number)) => void
  handsPlaced: boolean
  setHandsPlaced: (value: boolean) => void
  compressionCount: number
  setCompressionCount: (value: number) => void
  compressionRate: number
  setCompressionRate: (value: number) => void
  compressionFailed: boolean
  setCompressionFailed: (value: boolean) => void
  compressionTimes: number[]
  setCompressionTimes: (value: number[]) => void
  onFeedback?: (message: string) => void
  isFullscreen?: boolean
}

// CPR simulation steps
export const CPR_SIMULATION_STEPS = [
  {
    id: 0,
    title: "Scene Safety",
    instruction: "Look around the scene to check for hazards. Use your mouse to pan 360 degrees and assess safety.",
    cameraPosition: [0, 5, 8],
    cameraTarget: [0, 0, 0],
    completionMethod: "Look around for 3 seconds, then click Continue"
  },
  {
    id: 1,
    title: "Hand Placement",
    instruction: "Click on the green target to place your hands on the center of the chest (lower sternum)",
    cameraPosition: [0, 2.5, 3],
    cameraTarget: [0, 1.2, 0],
    completionMethod: "Click the green target on the chest"
  },
  {
    id: 2,
    title: "Chest Compressions",
    instruction: "Compress 5-6cm deep at 100-120 compressions per minute",
    cameraPosition: [0, 2.5, 3],
    cameraTarget: [0, 1.2, 0],
    requiredCompressions: 30,
    minBPM: 100,
    maxBPM: 120,
    completionMethod: "Perform 30 compressions at 100-120 BPM by clicking the green target"
  }
]

const DUMMY_WORLD_POSITION = new THREE.Vector3(0, 6, 0)
const DUMMY_SCALE = 1
const DUMMY_ROTATION = new THREE.Euler(0, 0, 0)

function CPRDummy({ 
  currentStep, 
  onStepComplete, 
  setSceneViewTime, 
  setHandsPlaced,
  compressionCount,
  setCompressionCount,
  setCompressionRate,
  compressionFailed,
  setCompressionFailed,
  compressionTimes,
  setCompressionTimes,
  onFeedback
}: { 
  currentStep: number, 
  onStepComplete: (step: number) => void,
  setSceneViewTime: (value: number | ((prev: number) => number)) => void,
  setHandsPlaced: (value: boolean) => void,
  compressionCount: number,
  setCompressionCount: (value: number) => void,
  setCompressionRate: (value: number) => void,
  compressionFailed: boolean,
  setCompressionFailed: (value: boolean) => void,
  compressionTimes: number[],
  setCompressionTimes: (value: number[]) => void,
  onFeedback?: (message: string) => void
}) {
  const meshRef = useRef<THREE.Group>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const lastFeedbackTimeRef = useRef(0)
  const [chestPosition, setChestPosition] = useState(0)
  const currentBPMRef = useRef(0)
  const displayedBpmRef = useRef(0)
  const lastPublishedRateRef = useRef(0)
  const rateUpdateTimerRef = useRef(0)
  const compressionStepConfig = CPR_SIMULATION_STEPS[2]

  const computeBpmFromTimes = useCallback((times: number[], now: number) => {
    if (!times.length) return 0

    const lastTap = times[times.length - 1]
    const timeSinceLastTap = Math.max((now - lastTap) / 1000, 0.05)

    if (timeSinceLastTap > 6) {
      return 0
    }

    if (times.length === 1) {
      return 0
    }

    const startIndex = Math.max(0, times.length - 6)
    const intervals: number[] = []

    for (let i = startIndex + 1; i < times.length; i++) {
      intervals.push((times[i] - times[i - 1]) / 1000)
    }

    if (!intervals.length) {
      const bpm = 60 / timeSinceLastTap
      return Number.isFinite(bpm) ? Math.min(Math.max(bpm, 0), 200) : 0
    }

    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
    const effectiveInterval = Math.max(avgInterval, timeSinceLastTap)
    const bpm = 60 / effectiveInterval

    if (!Number.isFinite(bpm)) {
      return 0
    }

    return Math.min(Math.max(bpm, 0), 200)
  }, [])

  useEffect(() => {
    lastFeedbackTimeRef.current = 0
  }, [currentStep])
  
  // load the GLB model
  const { scene: modelScene } = useGLTF('/models/basic_human_mesh.glb', true) || { scene: null }

  const modelBaseOffset = useMemo(() => {
    if (!modelScene) return 0
    const clone = modelScene.clone()
    const box = new THREE.Box3().setFromObject(clone)
    const minY = box.min.y
    const height = box.max.y - box.min.y
    return minY + height * 0.5
  }, [modelScene])

  useFrame((state) => {
    if (meshRef.current) {
      const breathingOffset = currentStep !== 2 ? Math.sin(state.clock.elapsedTime * 0.5) * 0.02 : 0
      const baseY = DUMMY_WORLD_POSITION.y + chestPosition + breathingOffset
      meshRef.current.position.set(DUMMY_WORLD_POSITION.x, baseY, DUMMY_WORLD_POSITION.z)
      meshRef.current.rotation.set(DUMMY_ROTATION.x, DUMMY_ROTATION.y, DUMMY_ROTATION.z)
    }
  })

  // Reset compression data when moving to compression step
  useEffect(() => {
    if (currentStep === 2) {
      setCompressionTimes([])
      setCompressionRate(0)
      setCompressionFailed(false)
      currentBPMRef.current = 0
      displayedBpmRef.current = 0
      lastPublishedRateRef.current = 0
      rateUpdateTimerRef.current = 0
    }
  }, [currentStep, setCompressionRate, setCompressionFailed, setCompressionTimes])

  // BPM tracking
  useFrame((_, delta) => {
    if (currentStep === 0) {
      setSceneViewTime((prev) => {
        const next = prev + delta
        return next >= 3 ? 3 : next
      })
    }

    if (currentStep === 2) {
      const now = Date.now()
      const bpm = computeBpmFromTimes(compressionTimes, now)
      currentBPMRef.current = bpm

      rateUpdateTimerRef.current += delta
      const UPDATE_INTERVAL = 0.2
      const MAX_STEP = 8 // BPM change per update

      if (rateUpdateTimerRef.current >= UPDATE_INTERVAL) {
        rateUpdateTimerRef.current = 0

        const currentDisplay = displayedBpmRef.current
        const diff = bpm - currentDisplay
        const step = Math.abs(diff) > MAX_STEP ? Math.sign(diff) * MAX_STEP : diff
        const nextDisplay = currentDisplay + step
        displayedBpmRef.current = nextDisplay

        if (Math.abs(nextDisplay - lastPublishedRateRef.current) >= 0.5 || (nextDisplay === 0 && lastPublishedRateRef.current !== 0)) {
          lastPublishedRateRef.current = nextDisplay
          setCompressionRate(nextDisplay)
        }
      }

      if (onFeedback && bpm > 0) {
        if (now - lastFeedbackTimeRef.current > 1500) {
          if (bpm < 95) {
            onFeedback('Speed up a little—target 100-120 compressions per minute.')
            lastFeedbackTimeRef.current = now
          } else if (bpm > 125) {
            onFeedback('Slow down slightly to stay near 100-120 compressions per minute.')
            lastFeedbackTimeRef.current = now
          } else if (compressionCount >= 20 && bpm >= 100 && bpm <= 120) {
            onFeedback('Great cadence! Keep your shoulders stacked to maintain depth.')
            lastFeedbackTimeRef.current = now
          }
        }
      }
    } else if (lastPublishedRateRef.current !== 0) {
      displayedBpmRef.current = 0
      lastPublishedRateRef.current = 0
      currentBPMRef.current = 0
      rateUpdateTimerRef.current = 0
      setCompressionRate(0)
    }
  })

  useEffect(() => {
    if (currentStep !== 0) {
      setSceneViewTime(0)
    }
  }, [currentStep, setSceneViewTime])



  const handleChestClick = () => {
    // Hand placement step
    if (currentStep === 1) {
      setHandsPlaced(true)
      onStepComplete(currentStep)
      if (onFeedback) {
        onFeedback('Hand placement locked in—keep elbows straight and shoulders stacked over the chest.')
        lastFeedbackTimeRef.current = Date.now()
      }
      return
    }

    // Compression step
    if (currentStep === 2 && !isCompressing && !compressionFailed) {
      setIsCompressing(true)
      const now = Date.now()
      const updatedTimes = [...compressionTimes, now]
      setCompressionTimes(updatedTimes)
      const newCount = compressionCount + 1
      setCompressionCount(newCount)

      const instantBpm = computeBpmFromTimes(updatedTimes, now)
      currentBPMRef.current = instantBpm
      displayedBpmRef.current = instantBpm
      lastPublishedRateRef.current = instantBpm
      setCompressionRate(instantBpm)

      if (onFeedback && newCount % 10 === 0) {
        onFeedback(`Great work—${newCount} compressions recorded. Keep preparing for rescue breaths after 30.`)
        lastFeedbackTimeRef.current = now
      }

      // Animate chest compression
      setChestPosition(-0.06)
      setTimeout(() => {
        setChestPosition(0)
        setIsCompressing(false)
      }, 100)

      // Check completion after 30 compressions
      if (newCount >= 30) {
        const avgBpm = computeBpmFromTimes(updatedTimes, now)
        const minBpm = compressionStepConfig?.minBPM ?? 100
        const maxBpm = compressionStepConfig?.maxBPM ?? 120
        const inTargetRange = avgBpm >= minBpm && avgBpm <= maxBpm

        if (inTargetRange) {
          setTimeout(() => {
            onStepComplete(currentStep)
          }, 500)
        } else {
          setTimeout(() => {
            setCompressionFailed(true)
          }, 500)
        }
      }
    }
  }

  return (
    <group ref={meshRef}>
      {modelScene ? (
        <primitive
          object={modelScene.clone()}
          scale={[DUMMY_SCALE, DUMMY_SCALE, DUMMY_SCALE]}
          position={[0, modelBaseOffset, 0]}
          rotation={[DUMMY_ROTATION.x, DUMMY_ROTATION.y, DUMMY_ROTATION.z]}
        />
      ) : (
        <group position={[0, modelBaseOffset, 0]} scale={[DUMMY_SCALE, DUMMY_SCALE, DUMMY_SCALE]}>
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[0.8, 1.2, 0.4]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          <mesh position={[0, 2.2, 0]}>
            <sphereGeometry args={[0.25]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          <mesh position={[-0.6, 0.8, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 1]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          <mesh position={[0.6, 0.8, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 1]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          <mesh position={[-0.2, -0.5, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 1.2]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          <mesh position={[0.2, -0.5, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 1.2]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
        </group>
      )}

      {currentStep === 0 && (
        <>
          <mesh position={[3, 2, 2]}>
            <sphereGeometry args={[0.08]} />
            <meshStandardMaterial color="#00ff00" emissive="#004400" />
          </mesh>
          <mesh position={[-3, 2, 2]}>
            <sphereGeometry args={[0.08]} />
            <meshStandardMaterial color="#00ff00" emissive="#004400" />
          </mesh>
          <mesh position={[2, 2, -3]}>
            <sphereGeometry args={[0.08]} />
            <meshStandardMaterial color="#00ff00" emissive="#004400" />
          </mesh>
          <mesh position={[-2, 2, -3]}>
            <sphereGeometry args={[0.08]} />
            <meshStandardMaterial color="#00ff00" emissive="#004400" />
          </mesh>
        </>
      )}

      <mesh
        position={[0.27, -9.47, 2.0]}
        onClick={handleChestClick}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'default')}
      >
        <sphereGeometry args={[0.15]} />
        <meshBasicMaterial color="#ff0000" transparent={false} />
      </mesh>
    </group>
  )
}



function CameraController({ currentStep }: { currentStep: number }) {
  const { camera } = useThree()
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const previousStepRef = useRef(currentStep)

  // Smooth camera transition function
  const smoothTransition = useCallback((
    targetPosition: [number, number, number], 
    targetLookAt: [number, number, number], 
    duration: number = 1000
  ) => {
    
    const startPosition = camera.position.clone()
    const startTarget = controlsRef.current?.target.clone() || new THREE.Vector3(0, 0, 0)
    
    const endPosition = new THREE.Vector3(...targetPosition)
    const endTarget = new THREE.Vector3(...targetLookAt)
    
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease-in-out function for smooth animation
      const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      const easedProgress = easeInOut(progress)
      
      //camera position
      camera.position.lerpVectors(startPosition, endPosition, easedProgress)
      
      //target position
      if (controlsRef.current) {
        controlsRef.current.target.lerpVectors(startTarget, endTarget, easedProgress)
        controlsRef.current.update()
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // Enable controls
        if (controlsRef.current) {
          controlsRef.current.enabled = true
          controlsRef.current.enableRotate = true
          controlsRef.current.enablePan = false
          controlsRef.current.enableZoom = true
        }
      }
    }
    
    requestAnimationFrame(animate)
  }, [camera])

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    controls.enabled = true
    controls.enableRotate = true
    controls.enablePan = false
    controls.enableZoom = true

    const previousStep = previousStepRef.current
    if (currentStep >= 1 && previousStep === 0) {
      smoothTransition([0.41, -1.96, 8.94], [0.27, -3.47, 0.10], 1500)
    } else if (currentStep >= 1) {
      camera.position.set(0.41, -1.96, 8.94)
      controls.target.set(0.27, -3.47, 0.10)
      controls.update()
    }

    previousStepRef.current = currentStep
  }, [camera, currentStep, smoothTransition])

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={0.15}
      maxDistance={260}
      maxPolarAngle={Math.PI * 0.499}
      makeDefault
    />
  )
}


export default function CPRSimulation({
  onStepComplete,
  currentStep,
  setSceneViewTime,
  setHandsPlaced,
  compressionCount,
  setCompressionCount,
  setCompressionRate,
  compressionFailed,
  setCompressionFailed,
  compressionTimes,
  setCompressionTimes,
  onFeedback,
  isFullscreen = false
}: CPRSimulationProps) {
  const step = CPR_SIMULATION_STEPS[currentStep] || CPR_SIMULATION_STEPS[0]
  const containerClasses = isFullscreen
    ? 'w-full h-full min-h-[600px] relative rounded-3xl overflow-hidden'
    : 'w-full h-[480px] relative rounded-2xl overflow-hidden'
  const canvasStyle: CSSProperties = {
    position: 'relative',
    zIndex: 1,
    background: isFullscreen ? '#edf2ff' : '#f1f5f9'
  }

  return (
    <div className={containerClasses} style={{ zIndex: 1 }}>
      <Canvas
        camera={{ position: step.cameraPosition as [number, number, number], fov: 50 }}
        style={canvasStyle}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.3} />

        <CPRDummy 
          currentStep={currentStep} 
          onStepComplete={onStepComplete}
          setSceneViewTime={setSceneViewTime}
          setHandsPlaced={setHandsPlaced}
          compressionCount={compressionCount}
          setCompressionCount={setCompressionCount}
          setCompressionRate={setCompressionRate}
          compressionFailed={compressionFailed}
          setCompressionFailed={setCompressionFailed}
          compressionTimes={compressionTimes}
          setCompressionTimes={setCompressionTimes}
          onFeedback={onFeedback}
        />
        <CameraController currentStep={currentStep} />
      </Canvas>
    </div>
  )
}

// Preload the 3D model
useGLTF.preload('/models/basic_human_mesh.glb')
