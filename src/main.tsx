import { createRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start/client'
import { getRouter } from './router'
import './styles.css'

const router = getRouter()

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)
  root.render(<StartClient router={router} />)
}
