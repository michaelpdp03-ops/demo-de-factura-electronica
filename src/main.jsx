import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { seedDemoData } from './lib/demoMode'
import { ToastProvider } from './components/Toast.jsx'

seedDemoData()

// Migración: convertir facturas pendientes a aprobadas
try {
  const stored = localStorage.getItem('fincontrol_facturas')
  if (stored) {
    const facturas = JSON.parse(stored)
    const migradas = facturas.map(f => f.estado === 'pendiente' ? { ...f, estado: 'aprobada' } : f)
    localStorage.setItem('fincontrol_facturas', JSON.stringify(migradas))
  }
} catch {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
)
