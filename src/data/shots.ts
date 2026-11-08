// Every still image the product shows. Each one is a camera pose in the 3D
// yard; a photoreal version (generated from the render) lives in
// /public/photos/<id>.jpg and is fitted with the same labels.

import type { CameraPose, Conditions } from './scenarios'
import { scenarioById } from './scenarios'

export interface Shot {
  id: string
  group: 'scenario' | 'dataset' | 'training'
  title: string
  camera: string
  pose: CameraPose
  conditions: Conditions
  pattern: 1 | 2 | null
  /** What the photo must show (used in PROMPTS.md). */
  brief: string
}

const DAY = { time: 'day', weather: 'clear' } as const
const NIGHT = { time: 'night', weather: 'clear' } as const
const SNOW = { time: 'day', weather: 'snow' } as const

export const SHOTS: Shot[] = [
  {
    id: 'scenario-a',
    group: 'scenario',
    title: 'Scenario A — Baseline (also the project hero image)',
    camera: 'CAM-03 · Yard pole, 10 m',
    pose: scenarioById('A').pose,
    conditions: DAY,
    pattern: null,
    brief:
      'Clear daylight. Red semi truck "T-07" with a white NORTHLINE trailer on the left, white HARBORVIEW trailer parked on the right, shipping containers and chain-link fence in the background.',
  },
  {
    id: 'scenario-b',
    group: 'scenario',
    title: 'Scenario B — Night + Low Angle',
    camera: 'Low mount, 2.3 m',
    pose: scenarioById('B').pose,
    conditions: NIGHT,
    pattern: 1,
    brief:
      'Night. The same red truck T-07 with white NORTHLINE trailer, headlights on, lit by orange sodium floodlights. Camera is low, about head height; concrete jersey barriers in the foreground hide the lower part of the truck. The truck must stay clearly visible to a human.',
  },
  {
    id: 'scenario-c',
    group: 'scenario',
    title: 'Scenario C — Snow + Occlusion',
    camera: 'Side mount, 3.4 m',
    pose: scenarioById('C').pose,
    conditions: SNOW,
    pattern: 2,
    brief:
      'Heavy snowfall, overcast, snow on the ground. White HARBORVIEW refrigerated trailer partly hidden behind a navy-blue MERIDIAN box truck in the foreground. Warehouse faint in the haze on the left.',
  },
  {
    id: 'scenario-d',
    group: 'scenario',
    title: 'Scenario D — Bird in Frame',
    camera: 'CAM-03 · Yard pole, 10 m',
    pose: scenarioById('D').pose,
    conditions: DAY,
    pattern: null,
    brief:
      'Same daylight view as Scenario A, plus one herring gull flying across the foreground, about 8 m from the camera, wings spread, slight motion blur. The gull partly covers the front of the red truck T-07 cab (about 40% of the cab hidden). Everything else identical to scenario-a.',
  },
  {
    id: 'dataset-cam01',
    group: 'dataset',
    title: 'Dataset — CAM-01 Gate',
    camera: 'CAM-01 · Gatehouse, 7.4 m',
    pose: { position: [34, 7.4, 29], target: [6, 0.5, -6], fov: 46 },
    conditions: DAY,
    pattern: null,
    brief: 'Clear daylight, view from the gatehouse into the yard: the back of the white NORTHLINE trailer on the red truck, warehouse dock doors and docked trailers beyond.',
  },
  {
    id: 'dataset-cam02',
    group: 'dataset',
    title: 'Dataset — CAM-02 Office corner',
    camera: 'CAM-02 · Office corner, 9 m',
    pose: { position: [40, 9, -33], target: [12, 0.5, 12], fov: 44 },
    conditions: DAY,
    pattern: null,
    brief: 'Clear daylight, high view from the corner of the warehouse office: the red truck T-07 with its white NORTHLINE trailer crossing the yard, jersey barriers, gatehouse and parked cars toward the gate.',
  },
  {
    id: 'dataset-cam04',
    group: 'dataset',
    title: 'Dataset — CAM-04 West lot',
    camera: 'CAM-04 · West lot pole, 9 m',
    pose: { position: [-44, 9, 30], target: [-18, 0.5, -6], fov: 46 },
    conditions: DAY,
    pattern: null,
    brief: 'Clear daylight, view over the west trailer parking: the navy MERIDIAN box truck and HARBORVIEW trailer, warehouse with dock doors and docked trailers behind.',
  },
  {
    id: 'train-p1-1',
    group: 'training',
    title: 'Training — Night / low angle 1',
    camera: 'Synthetic camera, 1.0 m',
    pose: { position: [6, 1.0, -9], target: [16, 2, 6], fov: 50 },
    conditions: NIGHT,
    pattern: 1,
    brief: 'Night, orange sodium lighting, camera near the ground. Red truck T-07 front three-quarter view, headlights on, white trailer behind.',
  },
  {
    id: 'train-p1-2',
    group: 'training',
    title: 'Training — Night / low angle 2',
    camera: 'Synthetic camera, 1.2 m',
    pose: { position: [26, 1.2, -8], target: [16, 2, 5], fov: 50 },
    conditions: NIGHT,
    pattern: 1,
    brief: 'Night, camera near the ground to the right of the truck. Red truck T-07 front-right view with headlights on, white NORTHLINE trailer extending behind it.',
  },
  {
    id: 'train-p1-3',
    group: 'training',
    title: 'Training — Night / low angle 3',
    camera: 'Synthetic camera, 1.4 m',
    pose: { position: [0, 1.4, 6], target: [16, 2, 5], fov: 48 },
    conditions: NIGHT,
    pattern: 1,
    brief: 'Night, low side view: the full length of the red truck T-07 and white NORTHLINE trailer under orange floodlights.',
  },
  {
    id: 'train-p2-1',
    group: 'training',
    title: 'Training — Snow / occlusion 1',
    camera: 'Synthetic camera, 2.8 m',
    pose: { position: [-50, 2.8, 2], target: [-24, 2, 0], fov: 46 },
    conditions: SNOW,
    pattern: 2,
    brief: 'Heavy snow. Navy MERIDIAN box truck in front partly hiding the white HARBORVIEW trailer behind it.',
  },
  {
    id: 'train-p2-2',
    group: 'training',
    title: 'Training — Snow / occlusion 2',
    camera: 'Synthetic camera, 4.0 m',
    pose: { position: [-48, 4, 16], target: [-25, 2, -2], fov: 46 },
    conditions: SNOW,
    pattern: 2,
    brief: 'Heavy snow, view from the south-west: MERIDIAN box truck and HARBORVIEW trailer side by side, the trailer partly blocked.',
  },
  {
    id: 'train-p2-3',
    group: 'training',
    title: 'Training — Snow / occlusion 3',
    camera: 'Synthetic camera, 1.6 m',
    pose: { position: [-46, 1.6, -8], target: [-25, 2, 3], fov: 48 },
    conditions: SNOW,
    pattern: 2,
    brief: 'Heavy snow, low camera from the north-west: the HARBORVIEW trailer with the MERIDIAN box truck partly in front of it.',
  },
]

export const shotById = (id: string) => SHOTS.find((s) => s.id === id)!
