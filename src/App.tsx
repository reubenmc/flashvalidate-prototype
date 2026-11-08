import { useEffect } from 'react'
import { useApp } from './store'
import { GuideExporter } from './dev/GuideExporter'
import { TopBar } from './ui/TopBar'
import { ViewportStage } from './ui/ViewportStage'
import { BottomStrip } from './ui/BottomStrip'
import { Panels } from './ui/Panels'
import { ApiDrawer } from './ui/ApiDrawer'
import { boot } from './lib/flow'

function Workspace() {
  const stage = useApp((s) => s.stage)
  useEffect(() => {
    if (stage === 'boot') boot()
  }, [stage])
  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <main className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_380px] gap-5 p-5">
        <section className="flex min-h-0 min-w-0 flex-col gap-3">
          <ViewportStage />
          <BottomStrip />
        </section>
        <aside className="min-h-0 overflow-y-auto pr-1">
          <Panels />
        </aside>
      </main>
      <ApiDrawer />
    </div>
  )
}

export default function App() {
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('guides')) return <GuideExporter />
  return <Workspace />
}
