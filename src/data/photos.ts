import type { ScreenBox } from '../store'
import projected from './labels.json'

// Which labeled objects are actually visible (not hidden or lost in haze)
// in each shot. Boxes come from projecting the 3D labels into that camera.
const VISIBLE: Record<string, string[]> = {
  'scenario-a': ['t07-cab', 't07-trailer', 'y4'],
  'scenario-b': ['t07-cab', 't07-trailer'],
  'scenario-c': ['y4', 'b12', 'd2'],
  'scenario-d': ['t07-cab', 't07-trailer', 'y4', 'gull'],
  'dataset-cam01': ['t07-cab', 't07-trailer', 'd1', 'd2', 'd3', 'y4'],
  'dataset-cam02': ['t07-cab', 't07-trailer', 'y4', 'd3'],
  'dataset-cam04': ['y4', 'b12', 'd1', 'd2', 'd3'],
  'train-p1-1': ['t07-cab', 't07-trailer'],
  'train-p1-2': ['t07-cab', 't07-trailer'],
  'train-p1-3': ['t07-cab', 't07-trailer'],
  'train-p2-1': ['y4', 'b12'],
  'train-p2-2': ['y4', 'b12'],
  'train-p2-3': ['y4', 'b12'],
}

// Hand-fitted boxes for the photoreal images (normalized 0..1). When a photo
// exists and has an entry here, these override the projected boxes.
export const FITTED: Record<string, ScreenBox[]> = {
  'scenario-a': [
    { id: 't07-cab', x: 0.4134, y: 0.4443, w: 0.1283, h: 0.2080 },
    { id: 't07-trailer', x: 0.1367, y: 0.4473, w: 0.2962, h: 0.1465 },
    { id: 'y4', x: 0.7572, y: 0.3887, w: 0.2409, h: 0.1113 },
  ],
  'scenario-b': [
    { id: 't07-cab', x: 0.3047, y: 0.3789, w: 0.2422, h: 0.2734 },
    { id: 't07-trailer', x: 0.4896, y: 0.4102, w: 0.1797, h: 0.2207 },
  ],
  'scenario-c': [
    { id: 'y4', x: 0.2721, y: 0.4043, w: 0.4668, h: 0.1934 },
    { id: 'b12', x: 0.4642, y: 0.3633, w: 0.4948, h: 0.3672 },
    { id: 'd2', x: 0.0833, y: 0.4219, w: 0.1953, h: 0.1104 },
  ],
  // Scenario A's photo with the gull composited in, so vehicles use A's boxes exactly
  'scenario-d': [
    { id: 't07-cab', x: 0.4134, y: 0.4443, w: 0.1283, h: 0.2080 },
    { id: 't07-trailer', x: 0.1367, y: 0.4473, w: 0.2962, h: 0.1465 },
    { id: 'y4', x: 0.7572, y: 0.3887, w: 0.2409, h: 0.1113 },
    { id: 'gull', x: 0.3971, y: 0.4902, w: 0.2279, h: 0.1016 },
  ],
  'dataset-cam01': [
    { id: 't07-trailer', x: 0.1224, y: 0.4512, w: 0.4362, h: 0.4326 },
    { id: 't07-cab', x: 0.5521, y: 0.4443, w: 0.0469, h: 0.1562 },
    { id: 'y4', x: 0.0098, y: 0.3789, w: 0.2324, h: 0.1074 },
    { id: 'd1', x: 0.3073, y: 0.3662, w: 0.1387, h: 0.0713 },
    { id: 'd2', x: 0.4701, y: 0.3730, w: 0.1374, h: 0.0781 },
    { id: 'd3', x: 0.7116, y: 0.3828, w: 0.1224, h: 0.1182 },
  ],
  'dataset-cam02': [
    { id: 't07-trailer', x: 0.2897, y: 0.4150, w: 0.2129, h: 0.1074 },
    { id: 't07-cab', x: 0.4818, y: 0.4395, w: 0.1087, h: 0.1465 },
    { id: 'y4', x: 0.8802, y: 0.3955, w: 0.1198, h: 0.0977 },
    { id: 'd3', x: 0.8737, y: 0.5566, w: 0.1263, h: 0.2637 },
  ],
  'dataset-cam04': [
    { id: 'b12', x: 0.2057, y: 0.5059, w: 0.2161, h: 0.2754 },
    { id: 'y4', x: 0.3620, y: 0.4248, w: 0.2650, h: 0.2246 },
    { id: 'd1', x: 0.2031, y: 0.3857, w: 0.1217, h: 0.1025 },
    { id: 'd2', x: 0.4297, y: 0.3691, w: 0.1536, h: 0.0879 },
    { id: 'd3', x: 0.5905, y: 0.3594, w: 0.1341, h: 0.0625 },
    { id: 't07-cab', x: 0.9147, y: 0.3887, w: 0.0853, h: 0.1113 },
  ],
  'train-p1-1': [
    { id: 't07-cab', x: 0.3177, y: 0.3145, w: 0.2474, h: 0.3418 },
    { id: 't07-trailer', x: 0.5143, y: 0.3711, w: 0.1439, h: 0.2266 },
  ],
  'train-p1-2': [
    { id: 't07-cab', x: 0.3372, y: 0.2207, w: 0.4154, h: 0.4531 },
    { id: 't07-trailer', x: 0.0990, y: 0.2803, w: 0.3581, h: 0.3135 },
  ],
  'train-p1-3': [
    { id: 't07-cab', x: 0.2721, y: 0.3291, w: 0.2096, h: 0.2939 },
    { id: 't07-trailer', x: 0.4818, y: 0.3809, w: 0.4948, h: 0.2344 },
  ],
  'train-p2-1': [
    { id: 'y4', x: 0.2513, y: 0.4023, w: 0.4883, h: 0.1953 },
    { id: 'b12', x: 0.5990, y: 0.3369, w: 0.4010, h: 0.3740 },
  ],
  'train-p2-2': [
    { id: 'b12', x: 0.3451, y: 0.3906, w: 0.4362, h: 0.3857 },
    { id: 'y4', x: 0.3809, y: 0.4150, w: 0.4186, h: 0.2100 },
    { id: 'd1', x: 0.0684, y: 0.4180, w: 0.1973, h: 0.1191 },
    { id: 'd2', x: 0.3255, y: 0.4199, w: 0.0553, h: 0.0879 },
    { id: 't07-cab', x: 0.8581, y: 0.4346, w: 0.0664, h: 0.0781 },
    { id: 't07-trailer', x: 0.9245, y: 0.4219, w: 0.0755, h: 0.0908 },
  ],
  'train-p2-3': [
    { id: 'y4', x: 0.0977, y: 0.3711, w: 0.5371, h: 0.2539 },
    { id: 'b12', x: 0.6868, y: 0.3467, w: 0.3132, h: 0.3271 },
  ],
}

export function labelsFor(shotId: string, hasPhoto: boolean): ScreenBox[] {
  if (hasPhoto && FITTED[shotId]) return FITTED[shotId]
  const all = (projected as Record<string, ScreenBox[]>)[shotId] ?? []
  const vis = VISIBLE[shotId]
  return vis ? all.filter((b) => vis.includes(b.id)) : all
}

/** Detect which photoreal images exist in /public/photos. */
export async function detectPhotos(ids: string[]): Promise<Record<string, string>> {
  const found: Record<string, string> = {}
  await Promise.all(
    ids.map(async (id) => {
      for (const ext of ['jpg', 'png', 'jpeg', 'webp']) {
        const url = `/photos/${id}.${ext}`
        try {
          const r = await fetch(url, { method: 'HEAD' })
          if (r.ok && (r.headers.get('content-type') ?? '').startsWith('image/')) {
            found[id] = url
            return
          }
        } catch {
          /* ignore */
        }
      }
    }),
  )
  return found
}
