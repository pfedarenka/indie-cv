import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/unifrakturmaguntia/400.css'
import '@fontsource/im-fell-english/400.css'
import './index.css'
import './themes/dungeon.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
