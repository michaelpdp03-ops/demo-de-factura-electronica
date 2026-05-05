import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, MessageCircle, FileText, X, Receipt,
  Send, Loader2, CheckCircle2, XCircle, ChevronDown,
  Eye, Bell
} from 'lucide-react'
import Badge from '../components/Badge'
import MSellerPanel from '../components/MSellerPanel'
import InvoiceDetail from '../components/InvoiceDetail'
import { useToast } from '../components/Toast'
import {
  useFacturas, useBusinessConfig, useNCFSequence, useCertStatus, isConfigured, useClientes
} from '../store/useAppStore'
import { sendDocument, buildEcf31 } from '../lib/mseller'
import { fmtRD, fmtDate } from '../lib/format'

const ITBIS = 0.18
const empty = { cliente: '', rnc: '', servicio: '', cantidad: 1, precio: '' }

export default function Facturacion() {
  const { facturas, addFactura } = useFacturas()
  const { clientes, addCliente } = useClientes()
  const [config] = useBusinessConfig()
  const [certStatus] = useCertStatus()
  const { isSeqConfigured, nextENCF, remaining } = useNCFSequence()

  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState(empty)
  const [query, setQuery]             = useState('')
  const [filter, setFilter]           = useState('todas')
  const [emitting, setEmitting]       = useState(false)
  const [emitResult, setEmitResult]   = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedFactura, setSelectedFactura] = useState(null)
  const toast = useToast()

  const subtotal = (Number(form.cantidad) || 0) * (Number(form.precio) || 0)
  const itbis    = subtotal * ITBIS
  const total    = subtotal + itbis

  const ready = isConfigured(config) && certStatus.uploaded && isSeqConfigured

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return facturas.filter((f) => {
      const okQ = !q || f.cliente.toLowerCase().includes(q) || f.id.toLowerCase().includes(q)
      const okF = filter === 'todas' || f.estado === filter
      return okQ && okF
    })
  }, [facturas, query, filter])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.cliente || !form.servicio || !form.precio) return

    // Auto-agregar cliente si no existe
    const clienteExiste = clientes.some(c => 
      c.nombre.toLowerCase() === form.cliente.toLowerCase() || 
      (c.rnc && form.rnc && c.rnc === form.rnc)
    )
    
    if (!clienteExiste) {
      addCliente({
        nombre: form.cliente,
        rnc: form.rnc || '',
        telefono: '',
        email: '',
        tipo: (form.rnc && form.rnc.length === 9) ? 'corporativo' : 'particular'
      })
    }

    if (!ready) {
      // Guardar borrador local
      const id = 'B' + String(Date.now()).slice(-10)
      addFactura({
        id, cliente: form.cliente, rnc: form.rnc,
        servicio: form.servicio, cantidad: Number(form.cantidad),
        precio: Number(form.precio),
        itbis: +itbis.toFixed(2), total: +total.toFixed(2),
        fecha: new Date().toISOString().slice(0, 10),
        estado: 'pendiente', modo: 'local'
      })
      setForm(empty)
      setShowForm(false)
      return
    }

    setEmitting(true)
    setEmitResult(null)
    const eNCF = nextENCF()

    try {
      const payload = buildEcf31({
        emisor: { rncEmisor: config.rncEmisor, razonSocial: config.razonSocial, direccion: config.direccion },
        comprador: { rncComprador: form.rnc || '000000000', razonSocialComprador: form.cliente },
        item: { nombreItem: form.servicio, cantidad: Number(form.cantidad), precioUnitario: Number(form.precio) },
        eNCF
      })

      const res = await sendDocument(payload)
      addFactura({
        id: eNCF, cliente: form.cliente, rnc: form.rnc,
        servicio: form.servicio, cantidad: Number(form.cantidad),
        precio: Number(form.precio),
        itbis: +itbis.toFixed(2), total: +total.toFixed(2),
        fecha: new Date().toISOString().slice(0, 10),
        estado: res.ok ? 'aprobada' : 'rechazada',
        trackId: res.data?.trackId || null,
        qrUrl: res.data?.qrUrl || null,
        dgiiResponse: res.data,
        modo: 'ecf'
      })
      setEmitResult({ ok: res.ok, eNCF, data: res.data })
      if (res.ok) {
        toast(`Factura ${eNCF} enviada a DGII`, 'success', { title: '¡Factura aprobada!' })
        setTimeout(() => { setEmitResult(null); setForm(empty); setShowForm(false) }, 3000)
      } else {
        toast(res.data?.message || 'No se pudo enviar la factura', 'error')
      }
    } catch (err) {
      setEmitResult({ ok: false, error: err.message })
      toast(err.message, 'error')
    } finally {
      setEmitting(false)
    }
  }

  // El envío por WhatsApp ahora se maneja desde el modal (InvoiceDetail) para enviar la imagen.
  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-text-muted mb-1">Gestión de facturas</p>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Mis facturas</h2>
        </div>
        <button onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-accent hover:bg-accent-hover text-bg text-[13.5px] font-bold transition-colors shadow-glow">
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Crear nueva factura
        </button>
      </div>


      {ready && remaining <= 50 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/8 border border-amber-500/20 text-[12.5px] text-amber-400">
          ⚠️ <span>Solo te quedan <strong>{remaining} facturas disponibles</strong> — solicita más números a DGII pronto</span>
        </div>
      )}

      {ready && remaining > 50 && (
        <div className="flex items-center gap-2 text-[12.5px] text-accent">
          <CheckCircle2 className="w-4 h-4" />
          Sistema activo — tus facturas se envían a DGII automáticamente
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[220px] flex items-center gap-2 h-10 px-3.5 rounded-xl bg-bg-card border border-border-subtle">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar factura o cliente..."
            className="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-muted" />
        </div>
        <div className="inline-flex p-1 rounded-xl bg-bg-card border border-border-subtle">
          {['todas', 'aprobada', 'pendiente', 'rechazada'].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 h-8 rounded-lg text-[12px] font-semibold capitalize transition-colors
                ${filter === s ? 'bg-bg-elevated text-text-primary' : 'text-text-muted hover:text-text-primary'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-bg-card border border-border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11.5px] font-semibold text-text-muted uppercase tracking-wider border-b border-border-subtle">
                <th className="px-5 py-3.5">Número</th>
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">Descripción</th>
                <th className="px-5 py-3.5 text-right">Total</th>
                <th className="px-5 py-3.5">Fecha</th>
                <th className="px-5 py-3.5">Estado</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-text-muted opacity-40" />
                    <div className="text-[13.5px] font-semibold text-text-secondary">No hay facturas aquí</div>
                    <div className="text-[12.5px] text-text-muted mt-1">
                      Crea tu primera factura con el botón de arriba
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((f) => (
                <tr key={f.id} onClick={() => setSelectedFactura(f)}
                  className="hover:bg-bg-hover/40 transition-colors group cursor-pointer">
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-[12px] text-text-secondary">{f.id}</span>
                    {f.modo === 'local' && (
                      <div className="text-[10.5px] text-amber-400 mt-0.5">Borrador local</div>
                    )}
                    {f.trackId && (
                      <div className="text-[10.5px] text-text-muted font-mono mt-0.5">
                        DGII: {f.trackId.slice(0, 10)}...
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-text-primary">{f.cliente}</div>
                    {f.rnc && <div className="text-[11.5px] text-text-muted">RNC {f.rnc}</div>}
                  </td>
                  <td className="px-5 py-3.5 text-text-secondary max-w-[180px] truncate">{f.servicio}</td>
                  <td className="px-5 py-3.5 text-right font-bold tabular-nums text-text-primary">{fmtRD(f.total)}</td>
                  <td className="px-5 py-3.5 text-text-secondary whitespace-nowrap">{fmtDate(f.fecha)}</td>
                  <td className="px-5 py-3.5"><Badge value={f.estado} /></td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {f.estado === 'pendiente' && (
                        <button onClick={() => setSelectedFactura(f)}
                          title="Recordar cobro"
                          className="inline-flex items-center gap-1 h-7 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11.5px] font-semibold transition-colors">
                          <Bell className="w-3.5 h-3.5" />
                          Cobrar
                        </button>
                      )}
                      <button onClick={() => setSelectedFactura(f)}
                        title="Enviar por WhatsApp"
                        className="inline-flex items-center gap-1 h-7 px-2 rounded-lg bg-accent-soft hover:bg-accent/20 text-accent text-[11.5px] font-semibold transition-colors">
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setSelectedFactura(f)}
                        title="Ver detalle"
                        className="inline-flex items-center gap-1 h-7 px-2 rounded-lg bg-bg-elevated hover:bg-bg-hover text-text-secondary text-[11.5px] font-semibold transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Advanced section */}
      <div className="rounded-xl bg-bg-card border border-border-subtle overflow-hidden">
        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-bg-hover/30 transition-colors">
          <span className="text-[13px] font-semibold text-text-secondary">Opciones técnicas (MSeller / DGII)</span>
          <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>
        {showAdvanced && (
          <div className="border-t border-border-subtle p-4">
            <MSellerPanel />
          </div>
        )}
      </div>

      {/* New invoice modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-6"
            onClick={() => { if (!emitting) setShowForm(false) }}>
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="w-full lg:max-w-lg bg-bg-elevated border border-border rounded-t-2xl lg:rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}>

              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🧾</span>
                  <div>
                    <h3 className="text-[15px] font-bold text-text-primary">Nueva factura</h3>
                    <p className="text-[12px] text-text-muted">
                      {ready ? 'Se enviará a DGII automáticamente' : 'Se guardará como borrador'}
                    </p>
                  </div>
                </div>
                {!emitting && (
                  <button onClick={() => setShowForm(false)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <form onSubmit={submit} className="p-5 space-y-4">
                <MField label="Nombre del cliente" required>
                  <input value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })}
                    placeholder="Ej: Banco Popular Dominicano" className="minput" required />
                </MField>

                <MField label="RNC o Cédula del cliente" hint="Opcional">
                  <input value={form.rnc} onChange={(e) => setForm({ ...form, rnc: e.target.value })}
                    placeholder="000-00000-0" className="minput" />
                </MField>

                <MField label="¿Qué le vendiste?" required>
                  <input value={form.servicio} onChange={(e) => setForm({ ...form, servicio: e.target.value })}
                    placeholder="Ej: Catering ejecutivo, Almuerzo corporativo..." className="minput" required />
                </MField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <MField label="Cantidad" required>
                    <input type="number" min="1" value={form.cantidad}
                      onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                      className="minput" required />
                  </MField>
                  <MField label="Precio (RD$)" required>
                    <input type="number" min="0" step="0.01" value={form.precio}
                      onChange={(e) => setForm({ ...form, precio: e.target.value })}
                      placeholder="0.00" className="minput" required />
                  </MField>
                </div>

                {/* Totals */}
                <div className="rounded-xl bg-bg-card border border-border-subtle p-4 space-y-2">
                  <TRow label="Subtotal" value={fmtRD(subtotal)} />
                  <TRow label="ITBIS (18%)" value={fmtRD(itbis)} />
                  <div className="h-px bg-border-subtle" />
                  <TRow label="Total a cobrar" value={fmtRD(total)} bold />
                </div>

                {/* Result */}
                <AnimatePresence>
                  {emitResult && (
                    emitResult.ok ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center text-center p-5 rounded-xl bg-accent-soft border border-accent/30 overflow-hidden relative"
                      >
                        {/* Pulsing ring animation */}
                        <motion.div
                          initial={{ scale: 0 }} animate={{ scale: [0, 1.5, 1] }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mb-2 relative"
                        >
                          <motion.div
                            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                            transition={{ duration: 1.6, repeat: Infinity }}
                            className="absolute inset-0 rounded-full bg-accent/30"
                          />
                          <motion.div
                            initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 280 }}
                          >
                            <CheckCircle2 className="w-8 h-8 text-accent" strokeWidth={2.5} />
                          </motion.div>
                        </motion.div>

                        <div className="text-[15px] font-bold text-accent">¡Factura aprobada por DGII!</div>
                        <div className="text-[12.5px] text-text-secondary mt-1 font-mono">{emitResult.eNCF}</div>
                        {emitResult.data?.trackId && (
                          <div className="text-[11px] text-text-muted mt-0.5 font-mono">
                            Track DGII: {emitResult.data.trackId}
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-start gap-3 p-3.5 rounded-xl border bg-rose-500/10 border-rose-500/20">
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[13.5px] font-bold text-rose-400">No se pudo enviar la factura</div>
                          <div className="text-[12px] text-rose-300 mt-0.5 break-all">
                            {emitResult.error || emitResult.data?.message}
                          </div>
                        </div>
                      </motion.div>
                    )
                  )}
                </AnimatePresence>

                <div className="flex gap-2.5 pt-1">
                  <button type="button" onClick={() => setShowForm(false)} disabled={emitting}
                    className="flex-1 h-11 rounded-xl bg-bg-card border border-border-subtle text-[13px] font-semibold text-text-secondary hover:bg-bg-hover transition-colors disabled:opacity-50">
                    Cancelar
                  </button>
                  <button type="submit" disabled={emitting}
                    className="flex-1 h-11 rounded-xl bg-accent hover:bg-accent-hover text-bg text-[13.5px] font-bold transition-colors shadow-glow disabled:opacity-60 flex items-center justify-center gap-2">
                    {emitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando a DGII...</>
                      : ready
                        ? <><Send className="w-4 h-4" /> Emitir factura</>
                        : 'Guardar borrador'}
                  </button>
                </div>
              </form>

              <style>{`.minput{width:100%;height:42px;padding:0 14px;background:#1a1d28;border:1px solid #2a2e3a;border-radius:10px;color:#f4f4f5;font-size:13.5px;font-family:inherit;transition:border-color .15s,box-shadow .15s}.minput::placeholder{color:#71717a}.minput:focus{border-color:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.12);outline:none}`}</style>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detalle de factura */}
      {selectedFactura && (
        <InvoiceDetail factura={selectedFactura} onClose={() => setSelectedFactura(null)} />
      )}
    </div>
  )
}

function MField({ label, hint, required, children }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] font-semibold text-text-primary">
          {label} {required && <span className="text-accent">*</span>}
        </span>
        {hint && <span className="text-[11.5px] text-text-muted">{hint}</span>}
      </div>
      {children}
    </label>
  )
}

function TRow({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className={bold ? 'font-semibold text-text-primary' : 'text-text-secondary'}>{label}</span>
      <span className={`tabular-nums ${bold ? 'text-accent text-[15px] font-bold' : 'text-text-primary font-medium'}`}>
        {value}
      </span>
    </div>
  )
}
