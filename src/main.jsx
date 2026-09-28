import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import '@fontsource-variable/anybody/wdth.css'
import '@fontsource-variable/atkinson-hyperlegible-next'
import '@fontsource-variable/atkinson-hyperlegible-mono'
import '@fontsource/cormorant-garamond/500'

import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: '#0E1116',
          color: '#F4F5F7',
          borderRadius: '0',
          fontFamily: "'Atkinson Hyperlegible Next Variable', sans-serif",
          fontSize: '16px',
        },
      }}
    />
  </React.StrictMode>,
)
