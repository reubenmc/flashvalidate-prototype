import { X, Terminal, Bot } from 'lucide-react'
import { useApp } from '../store'
import { ApiSnippet } from './Panels'

const REST = `curl https://api.flashvalidate.ai/v1/validations \\
  -H "Authorization: Bearer $FV_API_KEY" \\
  -d '{
    "model": "yard-detector-v2.3",
    "environment": "outpost-dockyard",
    "scenarios": ["low_angle", "night", "snow", "occlusion"],
    "generate_training_data": true
  }'`

export function ApiDrawer() {
  const open = useApp((s) => s.apiOpen)
  const setOpen = useApp((s) => s.setApiOpen)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-zinc-950/30 backdrop-blur-[2px] fade-up" onClick={() => setOpen(false)} />
      <aside className="relative h-full w-[520px] overflow-y-auto border-l border-zinc-200 bg-white p-6 shadow-2xl fade-up">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Developers</div>
            <h2 className="mt-1 text-[20px] font-semibold tracking-tight">Automate with API / MCP</h2>
          </div>
          <button onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-lg hover:bg-zinc-100">
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
          Everything in this workspace is available programmatically: run validation in CI on every model release, or let a coding agent investigate failures and generate data.
        </p>
        <div className="mt-5">
          <ApiSnippet />
        </div>
        <div className="mt-4 overflow-hidden rounded-xl bg-zinc-950 ring-1 ring-black/10">
          <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2 text-[11px] font-medium text-zinc-400">
            <Terminal className="size-3" /> REST
          </div>
          <pre className="overflow-x-auto p-3 font-mono text-[11.5px] leading-[1.6] text-zinc-200">{REST}</pre>
        </div>
        <div className="mt-4 rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-2 text-[13px] font-semibold">
            <Bot className="size-4 text-teal-600" /> MCP server
          </div>
          <div className="mt-2 font-mono text-[11.5px] text-zinc-600">
            tools: validate_model · list_failure_patterns · generate_training_set · export_dataset
          </div>
          <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-[12.5px] text-zinc-700">
            <span className="font-medium text-zinc-900">You:</span> Why is the yard detector missing trucks at Gate 2 at night? Generate data to fix it.
          </div>
        </div>
      </aside>
    </div>
  )
}
