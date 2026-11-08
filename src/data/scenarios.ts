// Camera presets and environmental conditions for the Outpost dockyard.
// World units are meters. Y is up; the warehouse sits to the north (-Z),
// the gate to the south-east (+X, +Z).

export type Vec3 = [number, number, number]

export type TimeOfDay = 'day' | 'night'
export type Weather = 'clear' | 'snow'

export interface Conditions {
  time: TimeOfDay
  weather: Weather
}

export interface CameraPose {
  position: Vec3
  target: Vec3
  fov: number
}

export type ScenarioId = 'A' | 'B' | 'C' | 'D'
export type ViewId = ScenarioId | 'overview'

export interface Scenario {
  id: ScenarioId
  name: string
  short: string
  pose: CameraPose
  conditions: Conditions
  meta: {
    cameraHeight: string
    pitch: string
    yaw: string
    lighting: string
    weather: string
    visibility: string
    occlusion: string
  }
}

export const CAM03: CameraPose = {
  position: [44, 10, -22],
  target: [0, 0.5, 15],
  fov: 40,
}

export const OVERVIEW: CameraPose = {
  position: [58, 40, 60],
  target: [-2, 0, -6],
  fov: 38,
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'A',
    name: 'Baseline',
    short: 'Daylight · yard camera',
    pose: CAM03,
    conditions: { time: 'day', weather: 'clear' },
    meta: {
      cameraHeight: '10.0 m',
      pitch: '−11°',
      yaw: '236°',
      lighting: 'Daylight · 32k lux',
      weather: 'Clear',
      visibility: '> 1 km',
      occlusion: 'None',
    },
  },
  {
    id: 'B',
    name: 'Night + Low Angle',
    short: 'Night · 2.3 m camera',
    pose: {
      position: [3, 0.9, -12],
      target: [15.5, 1.9, 7],
      fov: 52,
    },
    conditions: { time: 'night', weather: 'clear' },
    meta: {
      cameraHeight: '2.3 m',
      pitch: '−1°',
      yaw: '33°',
      lighting: 'Night · 6 lux (sodium)',
      weather: 'Clear',
      visibility: '120 m',
      occlusion: '30% (barrier)',
    },
  },
  {
    id: 'C',
    name: 'Snow + Occlusion',
    short: 'Snow · side camera',
    pose: {
      position: [-51, 3.4, 7],
      target: [-24, 2, 0],
      fov: 46,
    },
    conditions: { time: 'day', weather: 'snow' },
    meta: {
      cameraHeight: '3.4 m',
      pitch: '−3°',
      yaw: '104°',
      lighting: 'Overcast · 4k lux',
      weather: 'Heavy snow',
      visibility: '80 m',
      occlusion: '45% (box truck)',
    },
  },
  {
    id: 'D',
    name: 'Bird in Frame',
    short: 'Day · seagull crossing',
    pose: CAM03,
    conditions: { time: 'day', weather: 'clear' },
    meta: {
      cameraHeight: '10.0 m',
      pitch: '−11°',
      yaw: '236°',
      lighting: 'Daylight · 32k lux',
      weather: 'Clear',
      visibility: '> 1 km',
      occlusion: '20% (seagull)',
    },
  },
]

/** Scenarios shown in the UI: D only exists once the user adds the bird scenario. */
export const activeScenarios = (bird: boolean) => SCENARIOS.filter((s) => s.id !== 'D' || bird)

export const scenarioById = (id: ScenarioId) => SCENARIOS.find((s) => s.id === id)!

export const DAY_CLEAR: Conditions = { time: 'day', weather: 'clear' }
