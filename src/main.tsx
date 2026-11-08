import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// dev-only handle for debugging in the browser console
if (import.meta.env.DEV) {
  import('./store').then((m) => Object.assign(window, { __app: m.useApp, __live: m.useLive }))
}
