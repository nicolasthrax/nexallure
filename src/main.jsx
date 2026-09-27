import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import '@fontsource/big-shoulders-display/700'
import '@fontsource/big-shoulders-display/800'
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
          background: '#15171C',
          color: '#EEE9DD',
          borderRadius: '4px',
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '14px',
        },
      }}
    />
  </React.StrictMode>,
)
