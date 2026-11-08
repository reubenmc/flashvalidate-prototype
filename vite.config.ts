import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))

// Dev-only helper: lets the in-browser guide exporter (/?guides) write
// rendered reference images into ./image-briefs. Not part of the product.
function saveGuides(): Plugin {
  return {
    name: 'save-guides',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__save', (req, res) => {
        const url = new URL(req.url ?? '', 'http://x')
        const file = url.searchParams.get('file') ?? ''
        if (req.method !== 'POST' || !/^[a-z0-9._-]+$/i.test(file)) {
          res.statusCode = 400
          res.end('bad request')
          return
        }
        const chunks: Buffer[] = []
        req.on('data', (c: Buffer) => chunks.push(c))
        req.on('end', () => {
          const dir = path.resolve(root, 'image-briefs')
          fs.mkdirSync(dir, { recursive: true })
          fs.writeFileSync(path.join(dir, file), Buffer.concat(chunks))
          res.end('ok')
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), saveGuides()],
  server: { port: 5173, open: false },
})
