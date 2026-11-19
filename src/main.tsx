import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { DataProvider } from './data/DataContext'
import './index.css'

// HashRouter gives every page a permanent URL (e.g. #/development/<id>) that
// works on GitHub Pages without server-side rewrites.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <DataProvider>
        <App />
      </DataProvider>
    </HashRouter>
  </StrictMode>,
)
