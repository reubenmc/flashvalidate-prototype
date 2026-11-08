import { useEffect, useState } from 'react'
import { Viewport } from '../scene/Viewport'
import { captureViews, setCaptureSize } from '../scene/Capture'
import { SHOTS } from '../data/shots'
import { useApp } from '../store'

// Dev-only: open http://localhost:5173/?guides to render every shot at
// 1536×1024 and save it (plus its projected 3D labels) into ./image-briefs.

async function save(file: string, body: Blob | string) {
  await fetch(`/__save?file=${encodeURIComponent(file)}`, { method: 'POST', body })
}

export function GuideExporter() {
  const [log, setLog] = useState<string[]>([])
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await new Promise((r) => setTimeout(r, 1500))
      setCaptureSize(1536, 1024)
      const labels: Record<string, unknown> = {}
      const only = new URLSearchParams(location.search).get('guides')
      const list = only ? SHOTS.filter((s) => s.id === only) : SHOTS
      for (const shot of list) {
        if (cancelled) return
        useApp.getState().setBirdVisible(shot.id === 'scenario-d')
        const [img] = await captureViews([{ id: shot.id, pose: shot.pose, conditions: shot.conditions, pattern: shot.pattern, label: shot.title }])
        // allow snow/lighting fades to settle, then capture again
        await new Promise((r) => setTimeout(r, 400))
        const [img2] = await captureViews([{ id: shot.id, pose: shot.pose, conditions: shot.conditions, pattern: shot.pattern, label: shot.title }])
        const final = img2 ?? img
        const blob = await (await fetch(final.pngUrl)).blob()
        await save(`${shot.id}.png`, blob)
        labels[shot.id] = final.boxes
        setLog((l) => [...l, `saved ${shot.id}.png (${final.boxes.length} labels)`])
      }
      await save(only ? `render-labels-${only}.json` : 'render-labels.json', JSON.stringify(labels, null, 2))
      setLog((l) => [...l, 'DONE'])
    })()
    return () => {
      cancelled = true
    }
  }, [])
  return (
    <div className="p-6 font-mono text-xs">
      <div style={{ width: 960, height: 640 }} className="border">
        <Viewport dpr={1.6} />
      </div>
      <pre id="guide-log" className="mt-3">{log.join('\n')}</pre>
    </div>
  )
}
