// The scenario plan FlashValidate proposes before a validation sweep.
// Each row says what will be varied, how it's generated, and why it's in the plan.

export type PlanSource = 'profile' | 'gap' | 'logs' | 'custom'
export type PlanMethod = 'Viewpoint' | 'Lighting' | 'Weather' | 'Scene object' | 'Sensor'

export interface PlanRow {
  id: string
  method: PlanMethod
  title: string
  detail: string
  source: PlanSource
  reason: string
  views: number
  /** The bird row unlocks Scenario D */
  bird?: boolean
  /** The text the user typed */
  prompt?: string
}

export const DEPLOYMENT_PROFILE = '12 Midwest yards · 24/7 · cams 3–10 m'

export const BASE_PLAN: PlanRow[] = [
  {
    id: 'viewpoint',
    method: 'Viewpoint',
    title: 'Camera height & angle',
    detail: '1–10 m · ±60° yaw · 10–60 m range',
    source: 'gap',
    reason: 'All 50 images come from 4 fixed cameras at 7–10 m',
    views: 720,
  },
  {
    id: 'night',
    method: 'Lighting',
    title: 'Night & dusk',
    detail: 'Sodium floodlights · 2–40 lux',
    source: 'gap',
    reason: '~50% of operating hours · 0 of 50 images at night',
    views: 480,
  },
  {
    id: 'snow',
    method: 'Weather',
    title: 'Snow',
    detail: 'Light to heavy snowfall · snow cover',
    source: 'profile',
    reason: '~40 snow days/yr at 5 of 12 sites · no snow in your data',
    views: 360,
  },
  {
    id: 'rain',
    method: 'Weather',
    title: 'Rain & fog',
    detail: 'Wet asphalt · 80–400 m visibility',
    source: 'profile',
    reason: '~70 wet days/yr across your sites',
    views: 240,
  },
  {
    id: 'occlusion',
    method: 'Scene object',
    title: 'Vehicles blocking the view',
    detail: '20–60% occlusion by parked trucks',
    source: 'logs',
    reason: 'Low-confidence detections at peak hours (prod. logs)',
    views: 360,
  },
  {
    id: 'sensor',
    method: 'Sensor',
    title: 'Low sun glare & compression',
    detail: 'Sun < 10° · 1–4 Mbps streams',
    source: 'logs',
    reason: 'Confidence dips at Gate 2 around dusk (prod. logs)',
    views: 240,
  },
]

export const SOURCE_LABEL: Record<PlanSource, string> = {
  profile: 'Deployment profile',
  gap: 'Gap in your data',
  logs: 'Production logs',
  custom: 'Added by you',
}

export const SUGGESTIONS = ['A seagull flies in front of the camera', 'A forklift parks in front of the dock doors', 'Raindrops on the camera lens']

/** Turn a free-text scenario into a plan row. */
export function interpretScenario(text: string, n: number): PlanRow {
  return { ...interpret(text, n), prompt: text.trim() }
}

function interpret(text: string, n: number): PlanRow {
  const t = text.toLowerCase()
  const id = `custom-${n}`
  if (/(gull|seagull|bird|pigeon|crow|flock)/.test(t)) {
    return {
      id: 'bird',
      method: 'Scene object',
      title: 'Seagull flies past the camera',
      detail: '3D seagull inserted 3–12 m from lens · motion blur · 0.5 s crossings',
      source: 'custom',
      reason: 'Occlusion tracked per pixel, so truck labels stay exact',
      views: 240,
      bird: true,
    }
  }
  if (/(forklift|person|people|pedestrian|worker|car|van)/.test(t)) {
    const what = t.match(/forklift|person|people|pedestrian|worker|car|van/)![0]
    return {
      id,
      method: 'Scene object',
      title: text.trim().replace(/^\w/, (c) => c.toUpperCase()),
      detail: `3D ${what} inserted at plausible positions · depth-correct occlusion`,
      source: 'custom',
      reason: 'Inserted into the 3D scene, so existing labels stay exact',
      views: 240,
    }
  }
  if (/(lens|rain ?drop|dirt|smudge|blur|glare|ice|frost|compression|pixel)/.test(t)) {
    return {
      id,
      method: 'Sensor',
      title: text.trim().replace(/^\w/, (c) => c.toUpperCase()),
      detail: 'Applied as an image-level camera effect after rendering',
      source: 'custom',
      reason: 'Geometry unchanged, so labels carry over directly',
      views: 120,
    }
  }
  if (/(fog|mist|haze|storm|hail|sleet|wind|dust)/.test(t)) {
    return {
      id,
      method: 'Weather',
      title: text.trim().replace(/^\w/, (c) => c.toUpperCase()),
      detail: 'Weather re-applied to every generated view',
      source: 'custom',
      reason: 'Objects don’t move, so boxes are unchanged',
      views: 240,
    }
  }
  return {
    id,
    method: 'Scene object',
    title: text.trim().replace(/^\w/, (c) => c.toUpperCase()),
    detail: 'Generated into the scene · occlusion tracked per pixel',
    source: 'custom',
    reason: 'Added to the sweep as a custom scenario',
    views: 120,
  }
}
