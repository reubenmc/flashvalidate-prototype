import JSZip from 'jszip'
import type { CapturedImage } from '../store'
import { objectById } from '../data/results'
import { PATTERNS, TRAINING_BREAKDOWN, TRAINING_TOTAL } from '../data/results'

const CATEGORIES = [
  { id: 1, name: 'truck', supercategory: 'vehicle' },
  { id: 2, name: 'trailer', supercategory: 'vehicle' },
]

async function toBlob(url: string) {
  return (await fetch(url)).blob()
}

function lightingLabel(img: CapturedImage) {
  return img.conditions.time === 'night' ? 'night' : img.conditions.weather === 'snow' ? 'overcast' : 'daylight'
}

/** Builds a COCO-style sample of the targeted training set and downloads it. */
export async function exportDataset(images: CapturedImage[]) {
  const zip = new JSZip()
  const imgDir = zip.folder('images')!
  const cocoImages: unknown[] = []
  const annotations: unknown[] = []
  const csv: string[] = [
    'file_name,width,height,object_id,class,bbox_x,bbox_y,bbox_w,bbox_h,camera_x,camera_y,camera_z,camera_height_m,camera_fov_deg,lighting,weather,targets_pattern',
  ]
  let annId = 1
  for (let i = 0; i < images.length; i++) {
    const img = images[i]
    const blob = await toBlob(img.pngUrl)
    const ext = blob.type.includes('png') ? 'png' : 'jpg'
    const file = `fv_${String(i + 1).padStart(6, '0')}.${ext}`
    imgDir.file(file, blob)
    const pattern = PATTERNS.find((p) => p.id === img.pattern)
    cocoImages.push({
      id: i + 1,
      file_name: `images/${file}`,
      width: img.width,
      height: img.height,
      flashvalidate: {
        environment: 'outpost-dockyard/cam-03',
        camera: { position_m: img.camera.position, height_m: img.camera.heightM, fov_deg: img.camera.fov },
        conditions: { lighting: lightingLabel(img), weather: img.conditions.weather },
        targets_failure_pattern: pattern ? pattern.title : null,
      },
    })
    for (const b of img.boxes) {
      const obj = objectById(b.id)
      const cat = obj.cls === 'truck' ? 1 : 2
      const bbox = [b.x * img.width, b.y * img.height, b.w * img.width, b.h * img.height].map((v) => Math.round(v * 10) / 10)
      annotations.push({
        id: annId++,
        image_id: i + 1,
        category_id: cat,
        bbox,
        area: Math.round(bbox[2] * bbox[3]),
        iscrowd: 0,
        attributes: { object_id: b.id, source: 'flashvalidate-3d-label-transfer' },
      })
      csv.push(
        [
          `images/${file}`,
          img.width,
          img.height,
          b.id,
          obj.cls,
          ...bbox,
          ...img.camera.position,
          img.camera.heightM,
          img.camera.fov,
          lightingLabel(img),
          img.conditions.weather,
          pattern ? `"${pattern.title}"` : '',
        ].join(','),
      )
    }
  }
  const coco = {
    info: {
      description: 'FlashValidate targeted training set — Outpost Dockyard Vehicle Detection (sample)',
      version: '1.0',
      model: 'yard-detector-v2.3',
      date_created: new Date().toISOString(),
      full_set_size: TRAINING_TOTAL,
      sample_size: images.length,
      breakdown: TRAINING_BREAKDOWN.map((b) => ({ label: b.label, count: b.count })),
    },
    categories: CATEGORIES,
    images: cocoImages,
    annotations,
  }
  zip.file('annotations.json', JSON.stringify(coco, null, 2))
  zip.file('manifest.csv', csv.join('\n'))
  zip.file(
    'README.md',
    `# FlashValidate targeted training set (sample)

Project: Outpost — Dockyard Vehicle Detection
Model: Yard Detector v2.3
Full set: ${TRAINING_TOTAL.toLocaleString()} labeled images — this archive contains a ${images.length}-image sample.

- \`images/\` — generated views of the CAM-03 environment
- \`annotations.json\` — COCO format (categories: truck, trailer) with camera + condition metadata
- \`manifest.csv\` — one row per bounding box

Targets: ${PATTERNS.map((p) => `${p.title} (${p.condition})`).join('; ')}.
`,
  )
  const out = await zip.generateAsync({ type: 'blob' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(out)
  a.download = 'flashvalidate_outpost_targeted_sample.zip'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}
