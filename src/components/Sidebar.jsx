import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, ArrowLeftRight, Users, Sparkles, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { useBusinessConfig, useNCFSequence, isConfigured } from '../store/useAppStore'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/facturacion', label: 'Facturación', icon: FileText },
  { to: '/transacciones', label: 'Ingresos y Gastos', icon: ArrowLeftRight },
  { to: '/clientes', label: 'Clientes', icon: Users }
]

export default function Sidebar({ open, onClose }) {
  const [config] = useBusinessConfig()
  const { isSeqConfigured } = useNCFSequence()

  const businessName = config.razonSocial || 'Mi Negocio'
  const businessInitials = businessName.split(' ').slice(0, 2).map((s) => s[0]).join('').toUpperCase()
  const rncDisplay = config.rncEmisor || '---'

  const pendingCount = [!isConfigured(config), !isSeqConfigured].filter(Boolean).length
  const pendingSetup = pendingCount > 0

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-bg-elevated border-r border-border-subtle z-40 flex flex-col
          transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-7">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-glow">
              <Sparkles className="w-4 h-4 text-bg" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[15px] font-bold tracking-tight text-text-primary">FinControl</span>
              <span className="text-[10px] font-semibold tracking-widest text-accent uppercase">RD</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors
                ${isActive
                  ? 'text-text-primary bg-bg-card'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-card/50'}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] bg-accent rounded-r-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-accent' : ''}`} strokeWidth={2} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Separator */}
          <div className="my-2 h-px bg-border-subtle mx-2" />

          {/* Configuración */}
          <NavLink
            to="/configuracion"
            onClick={onClose}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors
              ${isActive
                ? 'text-text-primary bg-bg-card'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-card/50'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] bg-accent rounded-r-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Settings className={`w-[18px] h-[18px] ${isActive ? 'text-accent' : ''}`} strokeWidth={2} />
                <span className="flex-1">Configuración</span>
                {pendingSetup && (
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-bg text-[10px] font-bold flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        </nav>

        {/* Business card */}
        <div className="m-3 p-3 rounded-xl bg-bg-card border border-border-subtle">
          <div className="flex items-center gap-2.5">
            {config.logoDataUrl ? (
              <div className="w-9 h-9 rounded-lg bg-bg-elevated overflow-hidden shrink-0 flex items-center justify-center">
                <img src={config.logoDataUrl} alt="" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-emerald-700 flex items-center justify-center text-bg font-bold text-sm shrink-0">
                {businessInitials || 'MN'}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold text-text-primary truncate">{businessName}</div>
              <div className="text-[11px] text-text-muted truncate">
                {config.rncEmisor ? `RNC ${rncDisplay}` : 'Sin configurar'}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
