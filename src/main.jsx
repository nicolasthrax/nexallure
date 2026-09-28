import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import '@fontsource/cormorant-garamond/400'
import '@fontsource/cormorant-garamond/500'
import '@fontsource/cormorant-garamond/600'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'

import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: '#0F1B2D',
          color: '#F1ECE1',
          borderRadius: '1px',
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '14px',
        },
      }}
    />
  </React.StrictMode>,
)
