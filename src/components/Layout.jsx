import { useState } from 'react'
import Sidebar from './Sidebar'
import { Menu, Search, Bell, Sparkles, RefreshCw } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { DEMO_MODE, resetDemoData } from '../lib/demoMode'

const titleMap = {
  '/': 'Dashboard',
  '/facturacion': 'Facturación',
  '/transacciones': 'Ingresos y Gastos',
  '/clientes': 'Clientes',
  '/configuracion': 'Configuración'
}

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const title = titleMap[pathname] || 'FinControl RD'

  return (
    <div className="min-h-screen flex">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 backdrop-blur-md bg-bg/80 border-b border-border-subtle">
          <div className="flex items-center gap-3 px-4 lg:px-8 h-14">
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-text-secondary hover:bg-bg-card"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h1 className="text-[15px] font-semibold text-text-primary">{title}</h1>

            {DEMO_MODE && (
              <div className="hidden sm:flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10.5px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" strokeWidth={2.5} />
                Modo Demo
              </div>
            )}

            <div className="ml-auto flex items-center gap-2">
              {DEMO_MODE && (
                <button
                  onClick={() => { if (confirm('¿Reiniciar la demo con datos limpios?')) resetDemoData() }}
                  title="Reiniciar demo"
                  className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card text-[12px] font-medium transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reiniciar
                </button>
              )}
              <div className="hidden md:flex items-center gap-2 h-9 px-3 rounded-lg bg-bg-card border border-border-subtle text-[13px] text-text-muted w-72">
                <Search className="w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted"
                />
                <kbd className="hidden lg:inline-flex h-5 px-1.5 items-center text-[10px] font-medium rounded bg-bg-elevated border border-border-subtle text-text-muted">⌘K</kbd>
              </div>

              <button className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors">
                <Bell className="w-[18px] h-[18px]" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" />
              </button>

              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-emerald-700 flex items-center justify-center text-bg font-bold text-[12px]">
                CM
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
