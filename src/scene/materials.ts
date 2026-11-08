import * as THREE from 'three'
import { asphaltTexture, concreteTexture, gravelTexture } from './textures'

// Shared materials whose look changes with conditions (night / snow).
// Conditions.tsx animates these every frame.

export const env = { night: 0, snow: 0, gen: 0 }

let _mats: ReturnType<typeof build> | null = null

function build() {
  return {
    asphalt: new THREE.MeshStandardMaterial({ map: asphaltTexture(), roughness: 0.93, metalness: 0 }),
    concrete: new THREE.MeshStandardMaterial({ map: concreteTexture(), roughness: 0.9 }),
    gravel: new THREE.MeshStandardMaterial({ map: gravelTexture(), roughness: 1 }),
    snowCap: new THREE.MeshStandardMaterial({ color: '#f4f7fa', roughness: 0.85, transparent: true, opacity: 0, depthWrite: false }),
    headlight: new THREE.MeshStandardMaterial({ color: '#fffbe8', emissive: '#fff4d6', emissiveIntensity: 0.4, roughness: 0.2 }),
    taillight: new THREE.MeshStandardMaterial({ color: '#7f1d1d', emissive: '#ff2a2a', emissiveIntensity: 0.1 }),
    marker: new THREE.MeshStandardMaterial({ color: '#b45309', emissive: '#ffa53a', emissiveIntensity: 0.1 }),
    lamp: new THREE.MeshStandardMaterial({ color: '#d6d3d1', emissive: '#ffb35c', emissiveIntensity: 0 }),
    window: new THREE.MeshStandardMaterial({ color: '#2a3340', emissive: '#ffcf8a', emissiveIntensity: 0, roughness: 0.2, metalness: 0.4 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#1d2733', roughness: 0.08, metalness: 0.6, clearcoat: 1 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#c9ced4', roughness: 0.35, metalness: 0.9 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#17181b', roughness: 0.92 }),
    hub: new THREE.MeshStandardMaterial({ color: '#9aa0a6', roughness: 0.4, metalness: 0.8 }),
    frame: new THREE.MeshStandardMaterial({ color: '#23262b', roughness: 0.7, metalness: 0.3 }),
    paintWhite: new THREE.MeshStandardMaterial({ color: '#f1f2f3', roughness: 0.5 }),
    paintYellow: new THREE.MeshStandardMaterial({ color: '#f5c518', roughness: 0.6 }),
    lineWhite: new THREE.MeshStandardMaterial({ color: '#e9ebee', roughness: 0.8 }),
    lineYellow: new THREE.MeshStandardMaterial({ color: '#e9b80f', roughness: 0.8 }),
    jersey: new THREE.MeshStandardMaterial({ color: '#b7b9bb', roughness: 0.95 }),
    steelGrey: new THREE.MeshStandardMaterial({ color: '#7b8189', roughness: 0.5, metalness: 0.6 }),
    darkSteel: new THREE.MeshStandardMaterial({ color: '#3c4148', roughness: 0.6, metalness: 0.5 }),
    dockSeal: new THREE.MeshStandardMaterial({ color: '#1d1f22', roughness: 0.95 }),
    bumper: new THREE.MeshStandardMaterial({ color: '#111214', roughness: 0.9 }),
    wood: new THREE.MeshStandardMaterial({ color: '#a47a4f', roughness: 0.95 }),
  }
}

export function mats() {
  if (!_mats) _mats = build()
  return _mats
}

export const BASE_COLORS = {
  asphalt: new THREE.Color('#ffffff'),
  concrete: new THREE.Color('#ffffff'),
  gravel: new THREE.Color('#ffffff'),
}
