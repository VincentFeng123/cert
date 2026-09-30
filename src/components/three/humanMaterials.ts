import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { Build, HairStyle } from './humanGeometry'
import { hairStrandBump } from './textures'

export type Appearance = {
  build?: Build
  skin: string
  hair: string
  hairStyle: HairStyle
  eyes?: string
  shirt: string
  pants: string
  shoes: string
  soles?: string
  sleeves?: 'short' | 'long'
}

export type HumanMaterials = ReturnType<typeof createHumanMaterials>

const mix = (a: string, b: string, amount: number) => new THREE.Color(a).lerp(new THREE.Color(b), amount)

// Figures share a handful of standard-material variants so each scene compiles
// only a few shader programs; software WebGL (CI, low-end devices) compiles them
// on the CPU.
export function fabric(color: string, roughness = 0.9) {
  return new THREE.MeshStandardMaterial({ color, roughness, side: THREE.DoubleSide })
}

export function skinMaterial(color: string) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55 })
}

export function createHumanMaterials(look: Appearance) {
  return {
    skin: skinMaterial(look.skin),
    lips: new THREE.MeshStandardMaterial({ color: mix(look.skin, '#9c4f4a', 0.38), roughness: 0.4 }),
    shirt: fabric(look.shirt),
    pants: fabric(look.pants, 0.85),
    shoes: new THREE.MeshStandardMaterial({ color: look.shoes, roughness: 0.4 }),
    soles: new THREE.MeshStandardMaterial({ color: look.soles ?? '#e8e4dc', roughness: 0.8 }),
    hair: new THREE.MeshStandardMaterial({ color: look.hair, roughness: 0.5, bumpMap: hairStrandBump(), bumpScale: 1.4 }),
    brows: new THREE.MeshStandardMaterial({ color: mix(look.hair, '#000000', 0.15), roughness: 0.8 }),
    sclera: new THREE.MeshStandardMaterial({ color: '#f1ece6', roughness: 0.15 }),
    iris: new THREE.MeshStandardMaterial({ color: look.eyes ?? '#5b4332', roughness: 0.15 }),
    pupil: new THREE.MeshStandardMaterial({ color: '#0d0b0a', roughness: 0.1 }),
  }
}

export function useHumanMaterials(look: Appearance) {
  const { skin, hair, hairStyle, eyes, shirt, pants, shoes, soles, build, sleeves } = look
  const materials = useMemo(
    () => createHumanMaterials({ skin, hair, hairStyle, eyes, shirt, pants, shoes, soles, build, sleeves }),
    [skin, hair, hairStyle, eyes, shirt, pants, shoes, soles, build, sleeves],
  )
  useEffect(() => () => Object.values(materials).forEach(material => material.dispose()), [materials])
  return materials
}
