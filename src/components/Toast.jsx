import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message, type = 'success', opts = {}) => {
    const id = Date.now() + Math.random()
    const duration = opts.duration ?? 3500
    setToasts((prev) => [...prev, { id, message, type, ...opts }])
    if (duration > 0) setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.toast
}

const TYPES = {
  success: { Icon: CheckCircle2, accent: 'text-accent', border: 'border-accent/30', bg: 'bg-accent-soft' },
  error:   { Icon: XCircle, accent: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10' },
  warning: { Icon: AlertCircle, accent: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
  info:    { Icon: Info, accent: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10' }
}

function ToastItem({ toast: t, onDismiss }) {
  const cfg = TYPES[t.type] || TYPES.success
  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ type: 'spring', damping: 24, stiffness: 320 }}
      className={`pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-[400px] p-3.5 pr-9 rounded-xl backdrop-blur-md border shadow-lg relative ${cfg.bg} ${cfg.border}`}
    >
      <cfg.Icon className={`w-4 h-4 ${cfg.accent} shrink-0 mt-0.5`} />
      <div className="flex-1">
        {t.title && <div className={`text-[13px] font-bold ${cfg.accent} mb-0.5`}>{t.title}</div>}
        <div className="text-[12.5px] text-text-primary leading-snug">{t.message}</div>
      </div>
      <button onClick={onDismiss}
        className="absolute top-2.5 right-2.5 p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors">
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  )
}
