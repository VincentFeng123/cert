import { useEffect, useRef, type ReactNode } from 'react'
import { useThree } from '@react-three/fiber'
import type { Group, Material } from 'three'

type ProgramState = { currentProgram?: { isReady?: () => boolean } }

/**
 * Keeps scene contents hidden until their shaders are compiled, so the first
 * visible frame happens in a later task than the page commit. On GPUs with
 * KHR_parallel_shader_compile, compilation also runs off the main thread.
 */
export default function SceneReveal({ children }: { children: ReactNode }) {
  const { gl, scene, camera, invalidate } = useThree()
  const group = useRef<Group>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const started = performance.now()
    const reveal = () => {
      if (!group.current) return
      group.current.visible = true
      invalidate()
    }
    // Like WebGLRenderer.compileAsync, but tolerant of materials that are
    // disposed or swapped while compiling (e.g. React StrictMode remounts).
    const pending = new Set<Material>(gl.compile(scene, camera))
    const check = () => {
      for (const material of pending) {
        const program = (gl.properties.get(material) as ProgramState).currentProgram
        if (!program?.isReady || program.isReady()) pending.delete(material)
      }
      if (pending.size === 0 || performance.now() - started > 4000) reveal()
      else timer = setTimeout(check, 16)
    }
    timer = setTimeout(check, 0)
    return () => clearTimeout(timer)
  }, [gl, scene, camera, invalidate])

  return <group ref={group} visible={false}>{children}</group>
}
