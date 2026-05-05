import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Mail, Hash, Search, X, FileText, ArrowRight, Plus } from 'lucide-react'
import Badge from '../components/Badge'
import { useClientes, useFacturas } from '../store/useAppStore'
import { fmtRD, fmtDate } from '../lib/format'

export default function Clientes() {
  const { clientes: clientesGuardados, addCliente } = useClientes()
  const { facturas } = useFacturas()

  // Combinar clientes guardados con los extraídos de facturas
  const clientes = useMemo(() => {
    const map = new Map()

    // 1. Clientes desde facturas (datos básicos)
    facturas.forEach(f => {
      if (f.cliente && !map.has(f.cliente.toLowerCase())) {
        map.set(f.cliente.toLowerCase(), {
          id: `f-${f.id || Date.now()}`,
          nombre: f.cliente,
          rnc: f.rnc || '',
          telefono: '',
          email: '',
          tipo: (f.rnc && f.rnc.length === 9) ? 'corporativo' : 'particular'
        })
      }
    })

    // 2. Clientes guardados (sobrescriben los básicos porque tienen más detalles)
    clientesGuardados.forEach(c => {
      if (c.nombre) {
        map.set(c.nombre.toLowerCase(), c)
      }
    })

    return Array.from(map.values())
  }, [clientesGuardados, facturas])
  
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  
  const emptyForm = { nombre: '', rnc: '', telefono: '', email: '', tipo: 'corporativo' }
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.rnc && c.rnc.includes(q))
    )
  }, [clientes, query])

  const facturasCliente = useMemo(() => {
    if (!selected) return []
    return facturas.filter((f) => f.cliente === selected.nombre)
  }, [facturas, selected])

  const totalCliente = facturasCliente.reduce((s, f) => s + f.total, 0)

  const submit = (e) => {
    e.preventDefault()
    if (!form.nombre) return
    addCliente({ ...form })
    setForm(emptyForm)
    setShowForm(false)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-text-muted mb-1">Cartera de clientes</p>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Clientes</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[13px] text-text-secondary hidden sm:block">
            <span className="font-bold text-text-primary">{clientes.length}</span> clientes registrados
          </div>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-accent hover:bg-accent-hover text-bg text-[13.5px] font-bold transition-colors shadow-glow">
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Agregar cliente
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 h-10 px-3.5 rounded-lg bg-bg-card border border-border-subtle">
        <Search className="w-4 h-4 text-text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, RNC o email..."
          className="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-muted outline-none"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtrados.map((c, i) => (
          <motion.button
            key={c.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            onClick={() => setSelected(c)}
            className="text-left p-5 rounded-xl bg-bg-card border border-border-subtle hover:border-border hover:bg-bg-hover/30 transition-colors group flex flex-col"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[13px] shrink-0
                ${c.tipo === 'corporativo'
                  ? 'bg-sky-500/10 text-sky-400'
                  : 'bg-violet-500/10 text-violet-400'}`}>
                {c.nombre.split(' ').slice(0, 2).map((s) => s[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-text-primary leading-tight truncate">{c.nombre}</div>
                <div className="mt-1.5"><Badge value={c.tipo || 'particular'} /></div>
              </div>
            </div>

            <div className="space-y-1.5 text-[12.5px] text-text-secondary flex-1">
              {c.rnc && (
                <div className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-text-muted" />
                  <span className="font-mono">{c.rnc}</span>
                </div>
              )}
              {c.telefono && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-text-muted" />
                  <span>{c.telefono}</span>
                </div>
              )}
              {c.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-text-muted" />
                  <span className="truncate">{c.email}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between w-full">
              <span className="text-[12px] font-semibold text-accent">Ver facturas</span>
              <ArrowRight className="w-4 h-4 text-accent transition-transform group-hover:translate-x-0.5" />
            </div>
          </motion.button>
        ))}

        {filtrados.length === 0 && (
          <div className="col-span-full p-10 rounded-xl bg-bg-card border border-border-subtle text-center text-text-muted">
            No se encontraron clientes
          </div>
        )}
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-6"
            onClick={() => setShowForm(false)}>
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="w-full lg:max-w-md bg-bg-elevated border border-border rounded-t-2xl lg:rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}>

              <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-text-primary">Agregar cliente</h3>
                    <p className="text-[12px] text-text-muted">Registra un nuevo cliente</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowForm(false)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={submit} className="p-5 space-y-4">
                <label className="block">
                  <span className="block text-[13px] font-semibold text-text-primary mb-1.5">
                    Nombre o Razón Social <span className="text-accent">*</span>
                  </span>
                  <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Ej: Banco Popular Dominicano" className="w-full h-10 px-3.5 bg-bg-card border border-border-subtle rounded-xl text-[13.5px] text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all" required />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block text-[13px] font-semibold text-text-primary mb-1.5">
                      RNC / Cédula
                    </span>
                    <input value={form.rnc} onChange={(e) => setForm({ ...form, rnc: e.target.value })}
                      placeholder="000-00000-0" className="w-full h-10 px-3.5 bg-bg-card border border-border-subtle rounded-xl text-[13.5px] text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all" />
                  </label>
                  <label className="block">
                    <span className="block text-[13px] font-semibold text-text-primary mb-1.5">
                      Tipo de cliente
                    </span>
                    <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                      className="w-full h-10 px-3.5 bg-bg-card border border-border-subtle rounded-xl text-[13.5px] text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all appearance-none">
                      <option value="corporativo">Corporativo</option>
                      <option value="particular">Particular</option>
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block text-[13px] font-semibold text-text-primary mb-1.5">
                      Teléfono
                    </span>
                    <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                      placeholder="809-000-0000" className="w-full h-10 px-3.5 bg-bg-card border border-border-subtle rounded-xl text-[13.5px] text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all" />
                  </label>
                  <label className="block">
                    <span className="block text-[13px] font-semibold text-text-primary mb-1.5">
                      Email
                    </span>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="correo@ejemplo.com" className="w-full h-10 px-3.5 bg-bg-card border border-border-subtle rounded-xl text-[13.5px] text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all" />
                  </label>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 h-11 rounded-xl bg-bg-card border border-border-subtle text-[13px] font-semibold text-text-secondary hover:bg-bg-hover transition-colors">
                    Cancelar
                  </button>
                  <button type="submit"
                    className="flex-1 h-11 rounded-xl bg-accent hover:bg-accent-hover text-bg text-[13.5px] font-bold transition-colors shadow-glow">
                    Guardar cliente
                  </button>
                </div>
              </form>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              className="absolute right-0 top-0 h-full w-full max-w-md bg-bg-elevated border-l border-border overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-bg-elevated/95 backdrop-blur z-10 flex items-center justify-between px-5 py-4 border-b border-border-subtle">
                <h3 className="text-[14px] font-semibold text-text-primary">Detalle de cliente</h3>
                <button type="button"
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-card"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-[16px]
                    ${selected.tipo === 'corporativo'
                      ? 'bg-sky-500/10 text-sky-400'
                      : 'bg-violet-500/10 text-violet-400'}`}>
                    {selected.nombre.split(' ').slice(0, 2).map((s) => s[0] || '').join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[16px] font-bold text-text-primary leading-tight">{selected.nombre}</div>
                    <div className="mt-1.5"><Badge value={selected.tipo || 'particular'} /></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-6">
                  {selected.rnc && (
                    <InfoRow icon={Hash} label="RNC" value={selected.rnc} mono />
                  )}
                  {selected.telefono && (
                    <InfoRow icon={Phone} label="Teléfono" value={selected.telefono} />
                  )}
                  {selected.email && (
                    <InfoRow icon={Mail} label="Email" value={selected.email} />
                  )}
                </div>

                <div className="rounded-lg bg-bg-card border border-border-subtle p-4 mb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-text-secondary">Total facturado</span>
                    <span className="text-[16px] font-bold text-accent tabular-nums">{fmtRD(totalCliente)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[12px] font-medium text-text-secondary">Facturas emitidas</span>
                    <span className="text-[14px] font-semibold text-text-primary">{facturasCliente.length}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[12.5px] font-semibold text-text-secondary uppercase tracking-wider mb-3">
                    Historial de facturas
                  </h4>
                  {facturasCliente.length === 0 ? (
                    <div className="p-6 text-center text-[13px] text-text-muted bg-bg-card rounded-lg border border-border-subtle">
                      <FileText className="w-7 h-7 mx-auto mb-2 opacity-40" />
                      Sin facturas registradas
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {facturasCliente.map((f) => (
                        <li key={f.id} className="p-3.5 rounded-lg bg-bg-card border border-border-subtle">
                          <div className="flex items-start justify-between gap-3 mb-1.5">
                            <span className="font-mono text-[11.5px] text-text-muted">{f.id}</span>
                            <Badge value={f.estado} />
                          </div>
                          <div className="text-[13px] text-text-primary mb-2">{f.servicio}</div>
                          <div className="flex items-center justify-between text-[12px]">
                            <span className="text-text-muted">{fmtDate(f.fecha)}</span>
                            <span className="font-semibold text-text-primary tabular-nums">{fmtRD(f.total)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-card border border-border-subtle">
      <div className="w-8 h-8 rounded-md bg-bg-elevated flex items-center justify-center text-text-secondary shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider">{label}</div>
        <div className={`text-[13px] text-text-primary truncate ${mono ? 'font-mono' : ''}`}>{value}</div>
      </div>
    </div>
  )
}
