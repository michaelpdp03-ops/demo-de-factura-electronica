import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUpRight, ArrowDownRight, Download, Filter,
  Plus, X, Trash2, Receipt
} from 'lucide-react'
import Badge from '../components/Badge'
import { fmtRD, fmtDate, downloadCSV } from '../lib/format'
import {
  useTransacciones, useFacturas, CATEGORIAS_INGRESO, CATEGORIAS_GASTO
} from '../store/useAppStore'
import { useToast } from '../components/Toast'

const today = () => new Date().toISOString().slice(0, 10)
const empty = { tipo: 'gasto', concepto: '', categoria: '', monto: '', fecha: today() }

export default function Transacciones() {
  const { transacciones, addTransaccion, deleteTransaccion } = useTransacciones()
  const { facturas } = useFacturas()
  
  const [tipo, setTipo] = useState('todos')
  const [categoria, setCategoria] = useState('todas')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty)

  const todasLasTransacciones = useMemo(() => {
    const ingresosFacturas = facturas
      .filter((f) => f.estado === 'aprobada')
      .map((f) => ({
        id: `fac_${f.id}`,
        fecha: f.fecha,
        concepto: `Cobro Factura ${f.id} - ${f.cliente}`,
        tipo: 'ingreso',
        categoria: 'Facturación',
        monto: f.total,
        isAuto: true
      }))
    return [...ingresosFacturas, ...transacciones].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  }, [facturas, transacciones])

  const categorias = useMemo(
    () => ['todas', ...Array.from(new Set(todasLasTransacciones.map((t) => t.categoria)))],
    [todasLasTransacciones]
  )

  const filtradas = useMemo(() => {
    return todasLasTransacciones.filter((t) => {
      const okTipo = tipo === 'todos' || t.tipo === tipo
      const okCat = categoria === 'todas' || t.categoria === categoria
      return okTipo && okCat
    })
  }, [todasLasTransacciones, tipo, categoria])

  const totals = useMemo(() => {
    let ing = 0, gas = 0
    for (const t of filtradas) {
      if (t.tipo === 'ingreso') ing += t.monto
      else gas += t.monto
    }
    return { ing, gas, neto: ing - gas }
  }, [filtradas])

  const exportar = () => {
    const rows = filtradas.map((t) => ({
      Fecha: t.fecha,
      Concepto: t.concepto,
      Tipo: t.tipo,
      Categoria: t.categoria,
      Monto: t.monto.toFixed(2)
    }))
    const stamp = new Date().toISOString().slice(0, 10)
    downloadCSV(rows, `transacciones-${stamp}.csv`)
  }

  const submit = (e) => {
    e.preventDefault()
    if (!form.concepto || !form.monto || !form.categoria) return
    addTransaccion({
      tipo: form.tipo,
      concepto: form.concepto,
      categoria: form.categoria,
      monto: Number(form.monto),
      fecha: form.fecha || today()
    })
    setForm(empty)
    setShowForm(false)
  }

  const openForm = (preset) => {
    setForm({ ...empty, tipo: preset || 'gasto' })
    setShowForm(true)
  }

  const catsDisponibles = form.tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-text-muted mb-1">Movimientos del negocio</p>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Ingresos y gastos</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => openForm('ingreso')}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-accent-soft hover:bg-accent/20 text-accent text-[13px] font-bold transition-colors">
            <ArrowUpRight className="w-4 h-4" />
            Registrar ingreso
          </button>
          <button onClick={() => openForm('gasto')}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[13px] font-bold transition-colors">
            <ArrowDownRight className="w-4 h-4" />
            Registrar gasto
          </button>
          <button onClick={exportar}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-bg-card hover:bg-bg-hover border border-border-subtle text-[13px] font-semibold text-text-primary transition-colors">
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Summary tone="accent" label="Total ingresos" value={fmtRD(totals.ing)} icon={ArrowUpRight} />
        <Summary tone="danger" label="Total gastos" value={fmtRD(totals.gas)} icon={ArrowDownRight} />
        <Summary tone="neutral" label="Balance neto" value={fmtRD(totals.neto)} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 text-[12px] text-text-muted">
          <Filter className="w-3.5 h-3.5" />
          Filtros
        </div>

        <div className="inline-flex p-1 rounded-lg bg-bg-card border border-border-subtle">
          {['todos', 'ingreso', 'gasto'].map((t) => (
            <button key={t} onClick={() => setTipo(t)}
              className={`px-3 h-7 rounded-md text-[12px] font-semibold capitalize transition-colors
                ${tipo === t ? 'bg-bg-elevated text-text-primary' : 'text-text-muted hover:text-text-primary'}`}>
              {t === 'ingreso' ? 'Ingresos' : t === 'gasto' ? 'Gastos' : 'Todos'}
            </button>
          ))}
        </div>

        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}
          className="h-8 px-3 pr-8 rounded-lg bg-bg-card border border-border-subtle text-[12.5px] text-text-primary font-medium appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23a1a1aa%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-no-repeat bg-[position:right_10px_center]">
          {categorias.map((c) => (
            <option key={c} value={c} className="bg-bg-elevated">
              {c === 'todas' ? 'Todas las categorías' : c}
            </option>
          ))}
        </select>

        <span className="ml-auto text-[12px] text-text-muted">
          {filtradas.length} de {todasLasTransacciones.length} movimientos
        </span>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="rounded-xl bg-bg-card border border-border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11.5px] font-semibold text-text-muted uppercase tracking-wider">
                <th className="px-5 py-3.5 font-semibold">Fecha</th>
                <th className="px-5 py-3.5 font-semibold">Concepto</th>
                <th className="px-5 py-3.5 font-semibold">Tipo</th>
                <th className="px-5 py-3.5 font-semibold">Categoría</th>
                <th className="px-5 py-3.5 font-semibold text-right">Monto</th>
                <th className="px-5 py-3.5 font-semibold text-right w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filtradas.map((t) => (
                <tr key={t.id} className="hover:bg-bg-hover/40 transition-colors group">
                  <td className="px-5 py-3.5 text-text-secondary whitespace-nowrap">{fmtDate(t.fecha)}</td>
                  <td className="px-5 py-3.5 font-medium text-text-primary">{t.concepto}</td>
                  <td className="px-5 py-3.5"><Badge value={t.tipo} /></td>
                  <td className="px-5 py-3.5 text-text-secondary">{t.categoria}</td>
                  <td className={`px-5 py-3.5 text-right font-semibold tabular-nums
                    ${t.tipo === 'ingreso' ? 'text-accent' : 'text-rose-400'}`}>
                    {t.tipo === 'ingreso' ? '+' : '−'}{fmtRD(t.monto)}
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    {!t.isAuto && (
                      <button onClick={() => { if (confirm('¿Eliminar este movimiento?')) deleteTransaccion(t.id) }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-text-muted opacity-50" />
                    <div className="text-[13px] text-text-muted">No hay movimientos con esos filtros</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-6"
            onClick={() => setShowForm(false)}>
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full lg:max-w-md bg-bg-elevated border border-border rounded-t-2xl lg:rounded-2xl overflow-hidden">

              <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
                <div>
                  <h3 className="text-[15px] font-bold text-text-primary">
                    {form.tipo === 'ingreso' ? 'Registrar ingreso' : 'Registrar gasto'}
                  </h3>
                  <p className="text-[12px] text-text-muted">Movimiento contable interno</p>
                </div>
                <button onClick={() => setShowForm(false)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={submit} className="p-5 space-y-4">

                {/* Toggle ingreso/gasto */}
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-bg-card border border-border-subtle">
                  <button type="button" onClick={() => setForm({ ...form, tipo: 'ingreso', categoria: '' })}
                    className={`h-9 rounded-lg text-[12.5px] font-bold transition-colors flex items-center justify-center gap-1.5
                      ${form.tipo === 'ingreso' ? 'bg-accent-soft text-accent' : 'text-text-muted hover:text-text-primary'}`}>
                    <ArrowUpRight className="w-4 h-4" />
                    Ingreso
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, tipo: 'gasto', categoria: '' })}
                    className={`h-9 rounded-lg text-[12.5px] font-bold transition-colors flex items-center justify-center gap-1.5
                      ${form.tipo === 'gasto' ? 'bg-rose-500/10 text-rose-400' : 'text-text-muted hover:text-text-primary'}`}>
                    <ArrowDownRight className="w-4 h-4" />
                    Gasto
                  </button>
                </div>

                <TField label="Concepto" required>
                  <input value={form.concepto}
                    onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                    placeholder={form.tipo === 'ingreso' ? 'Ej: Venta de mercancía' : 'Ej: Pago electricidad EDESUR'}
                    className="tinp" required />
                </TField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TField label="Monto (RD$)" required>
                    <input type="number" min="0" step="0.01"
                      value={form.monto}
                      onChange={(e) => setForm({ ...form, monto: e.target.value })}
                      placeholder="0.00" className="tinp" required />
                  </TField>
                  <TField label="Fecha" required>
                    <input type="date" value={form.fecha}
                      onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                      className="tinp" required />
                  </TField>
                </div>

                <TField label="Categoría" required>
                  <select value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    className="tinp" required>
                    <option value="">Selecciona una categoría</option>
                    {catsDisponibles.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </TField>

                <div className="flex gap-2.5 pt-1">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 h-11 rounded-xl bg-bg-card border border-border-subtle text-[13px] font-semibold text-text-secondary hover:bg-bg-hover transition-colors">
                    Cancelar
                  </button>
                  <button type="submit"
                    className={`flex-1 h-11 rounded-xl text-bg text-[13.5px] font-bold transition-colors shadow-glow flex items-center justify-center gap-2
                      ${form.tipo === 'ingreso' ? 'bg-accent hover:bg-accent-hover' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}>
                    <Plus className="w-4 h-4" />
                    Registrar {form.tipo}
                  </button>
                </div>
              </form>

              <style>{`.tinp{width:100%;height:42px;padding:0 14px;background:#1a1d28;border:1px solid #2a2e3a;border-radius:10px;color:#f4f4f5;font-size:13.5px;font-family:inherit;transition:border-color .15s,box-shadow .15s}.tinp::placeholder{color:#71717a}.tinp:focus{border-color:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.12);outline:none}`}</style>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TField({ label, required, children }) {
  return (
    <label className="block">
      <span className="text-[13px] font-semibold text-text-primary block mb-1.5">
        {label}{required && <span className="text-accent ml-0.5">*</span>}
      </span>
      {children}
    </label>
  )
}

function Summary({ tone, label, value, icon: Icon }) {
  const toneClass = {
    accent: 'text-accent bg-accent-soft',
    danger: 'text-rose-400 bg-rose-500/10',
    neutral: 'text-text-secondary bg-bg-elevated'
  }[tone]
  return (
    <div className="p-5 rounded-xl bg-bg-card border border-border-subtle">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12.5px] font-medium text-text-secondary">{label}</span>
        {Icon && (
          <div className={`w-7 h-7 rounded-md flex items-center justify-center ${toneClass}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
      <div className="text-xl font-bold tracking-tight text-text-primary tabular-nums">{value}</div>
    </div>
  )
}
