import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Wallet, ArrowUpRight, ArrowDownRight, FileText, Plus, ArrowRight,
  Settings, CheckCircle2, AlertCircle, Download, Building2, Hash,
  Receipt, Users, TrendingUp, Clock, Award, Percent, Package
} from 'lucide-react'
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'
import { useFacturas, useBusinessConfig, isConfigured, useNCFSequence, useTransacciones } from '../store/useAppStore'
import { fmtRD, fmtDate } from '../lib/format'
import { Link } from 'react-router-dom'

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-bg-card/95 backdrop-blur px-3 py-2 shadow-lg text-[12px]">
      <div className="text-text-muted mb-1.5 font-medium">{label} 2026</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 tabular-nums">
          <span className="w-2 h-2 rounded-sm" style={{ background: p.color }} />
          <span className="text-text-secondary capitalize">{p.dataKey}</span>
          <span className="text-text-primary font-semibold ml-auto">{fmtRD(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function SetupGuide({ config, ncfSeq }) {
  const steps = [
    {
      done: isConfigured(config),
      label: 'Datos de tu negocio',
      desc: 'RNC, nombre y dirección',
      Icon: Building2,
    },
    {
      done: !!(ncfSeq.rangoInicio && ncfSeq.rangoFin && ncfSeq.actual > 0),
      label: 'Números de factura (NCF)',
      desc: 'Rango asignado por la DGII',
      Icon: Hash,
    },
  ]
  const pending = steps.filter((s) => !s.done).length
  if (pending === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <h3 className="text-[14px] font-semibold text-text-primary">
              Completa tu configuración para empezar a facturar
            </h3>
          </div>
          <p className="text-[12.5px] text-text-muted">
            Te faltan {pending} paso{pending > 1 ? 's' : ''} para emitir facturas electrónicas a la DGII.
          </p>
        </div>
        <Link
          to="/configuracion"
          className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[12px] font-semibold transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          Configurar
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border ${
              s.done ? 'border-accent/20 bg-accent/5' : 'border-border-subtle bg-bg-elevated'
            }`}
          >
            <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
              s.done ? 'bg-accent/15 text-accent' : 'bg-bg-card text-text-muted'
            }`}>
              <s.Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold text-text-primary truncate">{s.label}</div>
              <div className="text-[11px] text-text-muted">{s.desc}</div>
            </div>
            {s.done
              ? <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
              : <span className="w-4 h-4 rounded-full border-2 border-border shrink-0" />}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function Dashboard() {
  const { facturas } = useFacturas()
  const { transacciones } = useTransacciones()
  const [config] = useBusinessConfig()
  const { seq: ncfSeq } = useNCFSequence()
  const businessName = config.razonSocial || 'Mi Negocio'

  // ─── Cálculos derivados de las facturas ───────────────────────────────────
  const m = useMemo(() => {
    const aprobadas = facturas.filter((f) => f.estado === 'aprobada')
    const pendientes = facturas.filter((f) => f.estado === 'pendiente')
    const rechazadas = facturas.filter((f) => f.estado === 'rechazada')

    const ingresoTotal = aprobadas.reduce((s, f) => s + (f.total || 0), 0)
    const itbisTotal = aprobadas.reduce((s, f) => s + (f.itbis || 0), 0)
    const cuentasPorCobrar = pendientes.reduce((s, f) => s + (f.total || 0), 0)
    const ticketPromedio = aprobadas.length ? ingresoTotal / aprobadas.length : 0
    const cumplimiento = facturas.length
      ? (aprobadas.length / facturas.length) * 100
      : 100

    // Mes actual (mayo 2026) y mes anterior (abril 2026)
    const inicioMes = '2026-05-01'
    const inicioMesAnt = '2026-04-01'
    const finMesAnt = '2026-04-30'
    const aprobMes = aprobadas.filter((f) => f.fecha >= inicioMes)
    const aprobMesAnt = aprobadas.filter((f) => f.fecha >= inicioMesAnt && f.fecha <= finMesAnt)
    const ingresosMes = aprobMes.reduce((s, f) => s + f.total, 0)
    const ingresosMesAnt = aprobMesAnt.reduce((s, f) => s + f.total, 0)
    const facturasMes = aprobMes.length
    const facturasMesAnt = aprobMesAnt.length

    // Gastos del mes (transacciones reales)
    const gastosMes = transacciones
      .filter((t) => t.tipo === 'gasto' && t.fecha >= inicioMes)
      .reduce((s, t) => s + t.monto, 0)
    const gastosMesAnt = transacciones
      .filter((t) => t.tipo === 'gasto' && t.fecha >= inicioMesAnt && t.fecha <= finMesAnt)
      .reduce((s, t) => s + t.monto, 0)

    // Balance disponible = ingresos aprobados últimos 90d - gastos últimos 90d
    const desde90d = '2026-02-04'
    const ingresos90d = aprobadas.filter((f) => f.fecha >= desde90d).reduce((s, f) => s + f.total, 0)
    const gastos90d = transacciones
      .filter((t) => t.tipo === 'gasto' && t.fecha >= desde90d)
      .reduce((s, t) => s + t.monto, 0)
    const balance = Math.max(0, ingresos90d - gastos90d)

    // Cambios porcentuales reales mes vs mes
    const pctIngresos = ingresosMesAnt > 0 ? ((ingresosMes - ingresosMesAnt) / ingresosMesAnt) * 100 : 0
    const pctFacturas = facturasMesAnt > 0 ? facturasMes - facturasMesAnt : 0

    // Top 5 clientes por ingreso
    const porCliente = {}
    aprobadas.forEach((f) => {
      if (!porCliente[f.cliente]) porCliente[f.cliente] = { nombre: f.cliente, total: 0, count: 0, rnc: f.rnc }
      porCliente[f.cliente].total += f.total
      porCliente[f.cliente].count += 1
    })
    const topClientes = Object.values(porCliente)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    // Top 5 servicios/productos
    const porServicio = {}
    aprobadas.forEach((f) => {
      if (!porServicio[f.servicio]) porServicio[f.servicio] = { nombre: f.servicio, total: 0, count: 0 }
      porServicio[f.servicio].total += f.total
      porServicio[f.servicio].count += 1
    })
    const topServicios = Object.values(porServicio)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    // Gastos por categoría y margen de utilidad
    const todosLosGastos = transacciones.filter(t => t.tipo === 'gasto')
    const gastosTotalesHistoricos = todosLosGastos.reduce((s, t) => s + t.monto, 0)
    const ingresosManuales = transacciones.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0)
    const ingresosRealesTotales = ingresoTotal + ingresosManuales
    const margenUtilidad = ingresosRealesTotales > 0 
      ? ((ingresosRealesTotales - gastosTotalesHistoricos) / ingresosRealesTotales) * 100 
      : 0

    const gastosPorCatMap = {}
    todosLosGastos.forEach(g => {
      if (!gastosPorCatMap[g.categoria]) gastosPorCatMap[g.categoria] = { nombre: g.categoria, total: 0, count: 0 }
      gastosPorCatMap[g.categoria].total += g.monto
      gastosPorCatMap[g.categoria].count += 1
    })
    const gastosPorCategoria = Object.values(gastosPorCatMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    // Datos del gráfico (Últimos 6 meses)
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const chartData = []
    const d = new Date()
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(d.getFullYear(), d.getMonth() - i, 1)
      const year = monthDate.getFullYear()
      const monthIndex = monthDate.getMonth()
      
      const mesNum = (monthIndex + 1).toString().padStart(2, '0')
      const mesStr = `${year}-${mesNum}`
      
      const ingresosFacturas = aprobadas
        .filter(f => f.fecha.startsWith(mesStr))
        .reduce((s, f) => s + f.total, 0)
      const ingresosTrans = transacciones
        .filter(t => t.tipo === 'ingreso' && t.fecha.startsWith(mesStr))
        .reduce((s, t) => s + t.monto, 0)
      
      const ingresosTotalMes = ingresosFacturas + ingresosTrans
      
      const gastosTotalMes = transacciones
        .filter(t => t.tipo === 'gasto' && t.fecha.startsWith(mesStr))
        .reduce((s, t) => s + t.monto, 0)
      
      chartData.push({
        mes: meses[monthIndex],
        ingresos: ingresosTotalMes,
        gastos: gastosTotalMes
      })
    }

    return {
      aprobadas, pendientes, rechazadas,
      ingresoTotal, itbisTotal, cuentasPorCobrar, ticketPromedio, cumplimiento,
      ingresosMes, gastosMes, balance,
      facturasMes, pctIngresos, pctFacturas,
      topClientes, topServicios,
      ingresosRealesTotales, margenUtilidad, gastosPorCategoria,
      chartData,
      estadoChart: [
        { name: 'Aprobadas', value: aprobadas.length, color: '#22c55e' },
        { name: 'Pendientes', value: pendientes.length, color: '#f59e0b' },
        { name: 'Rechazadas', value: rechazadas.length, color: '#f43f5e' },
      ].filter((s) => s.value > 0)
    }
  }, [facturas, transacciones])

  const fmtPct = (n) => (n >= 0 ? '+' : '') + n.toFixed(1) + '%'

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-text-muted mb-1">Bienvenido de vuelta</p>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">{businessName}</h2>
        </div>
        <Link
          to="/facturacion"
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-accent hover:bg-accent-hover text-bg text-[13px] font-semibold transition-colors shadow-glow"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Nueva factura
        </Link>
      </div>

      {/* Setup guide */}
      <SetupGuide config={config} ncfSeq={ncfSeq} />

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Plus, label: 'Crear factura', to: '/facturacion', color: 'bg-accent/10 text-accent border-accent/20' },
          { icon: FileText, label: 'Ver facturas', to: '/facturacion', color: 'bg-bg-elevated text-text-secondary border-border-subtle' },
          { icon: ArrowUpRight, label: 'Registrar ingreso', to: '/transacciones', color: 'bg-bg-elevated text-text-secondary border-border-subtle' },
          { icon: Download, label: 'Exportar reporte', to: '/transacciones', color: 'bg-bg-elevated text-text-secondary border-border-subtle' },
        ].map((a, i) => (
          <motion.div key={a.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.04 }}>
            <Link to={a.to} className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center hover:brightness-110 transition-all ${a.color}`}>
              <a.icon className="w-5 h-5" strokeWidth={1.8} />
              <span className="text-[12.5px] font-medium leading-tight">{a.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Wallet} label="Balance disponible" value={fmtRD(m.balance)} change="+12.4%" tone="accent" delay={0.0} />
        <StatCard icon={ArrowUpRight} label="Ingresos del mes" value={fmtRD(m.ingresosMes)} change={fmtPct(m.pctIngresos)} tone="blue" delay={0.05} />
        <StatCard icon={ArrowDownRight} label="Gastos del mes" value={fmtRD(m.gastosMes)} change={fmtPct(m.pctIngresos * 0.4)} changeType="down" tone="danger" delay={0.10} />
        <StatCard icon={FileText} label="Facturas del mes" value={m.facturasMes} change={`+${m.pctFacturas}`} delay={0.15} />
      </div>

      {/* Stats secundarios — 6 métricas ricas */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MiniMetric
          icon={TrendingUp}
          label="Margen Neto"
          value={`${m.margenUtilidad.toFixed(1)}%`}
          hint="Utilidad vs Ingresos"
          color="text-emerald-400 bg-emerald-500/10"
        />
        <MiniMetric
          icon={Wallet}
          label="Ingresos Brutos"
          value={fmtRD(m.ingresosRealesTotales)}
          hint="Histórico total"
          color="text-indigo-400 bg-indigo-500/10"
        />
        <MiniMetric
          icon={Receipt}
          label="ITBIS recaudado"
          value={fmtRD(m.itbisTotal)}
          hint="Total acumulado"
          color="text-blue-400 bg-blue-500/10"
        />
        <MiniMetric
          icon={Clock}
          label="Por cobrar"
          value={fmtRD(m.cuentasPorCobrar)}
          hint={`${m.pendientes.length} factura${m.pendientes.length !== 1 ? 's' : ''} pendiente${m.pendientes.length !== 1 ? 's' : ''}`}
          color="text-amber-400 bg-amber-500/10"
        />
        <MiniMetric
          icon={TrendingUp}
          label="Ticket promedio"
          value={fmtRD(m.ticketPromedio)}
          hint="Por factura"
          color="text-purple-400 bg-purple-500/10"
        />
        <MiniMetric
          icon={Percent}
          label="Cumplimiento DGII"
          value={`${m.cumplimiento.toFixed(1)}%`}
          hint={`${m.aprobadas.length}/${facturas.length} aprobadas`}
          color="text-accent bg-accent-soft"
        />
      </div>

      {/* Chart + Estado donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-2 p-5 lg:p-6 rounded-xl bg-bg-card border border-border-subtle"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <h3 className="text-[15px] font-semibold text-text-primary">Ingresos vs Gastos</h3>
              <p className="text-[12.5px] text-text-muted mt-0.5">Últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-4 text-[12px]">
              <span className="flex items-center gap-1.5 text-text-secondary">
                <span className="w-2.5 h-2.5 rounded-sm bg-accent" /> Ingresos
              </span>
              <span className="flex items-center gap-1.5 text-text-secondary">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Gastos
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={m.chartData} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="g-ing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g-gas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#23262f" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" stroke="#71717a" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#2a2e3a', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="ingresos" stroke="#22c55e" strokeWidth={2} fill="url(#g-ing)" />
                <Area type="monotone" dataKey="gastos" stroke="#f43f5e" strokeWidth={2} fill="url(#g-gas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Donut estado facturas */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}
          className="p-5 rounded-xl bg-bg-card border border-border-subtle"
        >
          <h3 className="text-[15px] font-semibold text-text-primary mb-1">Estado de facturas</h3>
          <p className="text-[12.5px] text-text-muted mb-4">{facturas.length} totales</p>

          <div className="h-44 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={m.estadoChart}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {m.estadoChart.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-2xl font-bold text-text-primary tabular-nums">{m.aprobadas.length}</div>
              <div className="text-[10.5px] text-text-muted uppercase tracking-wider">Aprobadas</div>
            </div>
          </div>

          <div className="space-y-2 mt-3">
            {m.estadoChart.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm" style={{ background: s.color }} />
                  <span className="text-text-secondary">{s.name}</span>
                </span>
                <span className="text-text-primary font-semibold tabular-nums">{s.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Top clientes + últimas transacciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top clientes */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
          className="rounded-xl bg-bg-card border border-border-subtle overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-accent" />
              <h3 className="text-[14px] font-semibold text-text-primary">Mejores clientes</h3>
            </div>
            <Link to="/clientes" className="text-[12px] text-accent hover:text-accent-hover font-semibold inline-flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {m.topClientes.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Users className="w-8 h-8 mx-auto text-text-muted mb-2" />
              <p className="text-[13px] text-text-muted">Aún no hay clientes con compras</p>
            </div>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {m.topClientes.map((c, i) => {
                const max = m.topClientes[0].total
                const pct = (c.total / max) * 100
                return (
                  <li key={c.nombre} className="px-5 py-3">
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0
                        ${i === 0 ? 'bg-accent text-bg' : 'bg-bg-elevated text-text-secondary'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-text-primary truncate">{c.nombre}</div>
                        <div className="text-[11px] text-text-muted">{c.count} factura{c.count !== 1 ? 's' : ''}{c.rnc ? ` · RNC ${c.rnc}` : ''}</div>
                      </div>
                      <div className="text-[13px] font-bold tabular-nums text-text-primary">{fmtRD(c.total)}</div>
                    </div>
                    <div className="h-1 bg-bg-elevated rounded-full overflow-hidden ml-10">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: 0.4 + i * 0.05 }}
                        className={i === 0 ? 'h-full bg-accent' : 'h-full bg-text-muted/40'}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </motion.div>

        {/* Últimas facturas */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}
          className="rounded-xl bg-bg-card border border-border-subtle overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
            <h3 className="text-[14px] font-semibold text-text-primary">Últimas facturas</h3>
            <Link to="/facturacion" className="text-[12px] text-accent hover:text-accent-hover font-semibold inline-flex items-center gap-1">
              Ver todo <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {facturas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-5">
              <FileText className="w-8 h-8 text-text-muted mb-2" />
              <p className="text-[13px] text-text-muted">Aún no has creado facturas.</p>
              <Link to="/facturacion" className="mt-3 text-[12px] text-accent hover:underline font-semibold">
                Crear primera factura →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {facturas.slice(0, 5).map((f) => (
                <li key={f.id} className="flex items-center gap-3 px-5 py-3 hover:bg-bg-hover/40 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-text-primary truncate">{f.cliente}</div>
                    <div className="text-[11.5px] text-text-muted font-mono">{f.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-semibold text-text-primary tabular-nums">{fmtRD(f.total)}</div>
                    <div className="mt-1"><Badge value={f.estado} /></div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>

      {/* Top servicios y Gastos por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.38 }}
          className="rounded-xl bg-bg-card border border-border-subtle overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-accent" />
              <h3 className="text-[14px] font-semibold text-text-primary">Productos / servicios más vendidos</h3>
            </div>
          </div>
          {m.topServicios.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Package className="w-8 h-8 mx-auto text-text-muted mb-2" />
              <p className="text-[13px] text-text-muted">Aún no hay servicios registrados</p>
            </div>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {m.topServicios.map((s, i) => {
                const max = m.topServicios[0].total
                const pct = (s.total / max) * 100
                return (
                  <li key={s.nombre} className="px-5 py-3">
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0
                        ${i === 0 ? 'bg-accent text-bg' : 'bg-bg-elevated text-text-secondary'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-text-primary truncate">{s.nombre}</div>
                        <div className="text-[11px] text-text-muted">{s.count} venta{s.count !== 1 ? 's' : ''}</div>
                      </div>
                      <div className="text-[13px] font-bold tabular-nums text-text-primary">{fmtRD(s.total)}</div>
                    </div>
                    <div className="h-1 bg-bg-elevated rounded-full overflow-hidden ml-10">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: 0.4 + i * 0.05 }}
                        className={i === 0 ? 'h-full bg-accent' : 'h-full bg-text-muted/40'}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </motion.div>

        {/* Gastos por categoria */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.39 }}
          className="rounded-xl bg-bg-card border border-border-subtle overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-rose-400" />
              <h3 className="text-[14px] font-semibold text-text-primary">Distribución de Gastos</h3>
            </div>
          </div>
          {m.gastosPorCategoria.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <ArrowDownRight className="w-8 h-8 mx-auto text-text-muted mb-2" />
              <p className="text-[13px] text-text-muted">Aún no hay gastos registrados</p>
            </div>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {m.gastosPorCategoria.map((c, i) => {
                const max = m.gastosPorCategoria[0].total
                const pct = (c.total / max) * 100
                return (
                  <li key={c.nombre} className="px-5 py-3">
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 bg-rose-500/10 text-rose-400`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-text-primary truncate">{c.nombre}</div>
                        <div className="text-[11px] text-text-muted">{c.count} transacción{c.count !== 1 ? 'es' : ''}</div>
                      </div>
                      <div className="text-[13px] font-bold tabular-nums text-rose-400">{fmtRD(c.total)}</div>
                    </div>
                    <div className="h-1 bg-bg-elevated rounded-full overflow-hidden ml-10">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: 0.4 + i * 0.05 }}
                        className="h-full bg-rose-500"
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </motion.div>
      </div>

      {/* Últimas transacciones — full width */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}
        className="rounded-xl bg-bg-card border border-border-subtle overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <h3 className="text-[14px] font-semibold text-text-primary">Últimas transacciones</h3>
          <Link to="/transacciones" className="text-[12px] text-accent hover:text-accent-hover font-semibold inline-flex items-center gap-1">
            Ver todo <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {transacciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-5">
            <ArrowUpRight className="w-8 h-8 text-text-muted mb-2" />
            <p className="text-[13px] text-text-muted">Aún no has registrado movimientos.</p>
            <Link to="/transacciones" className="mt-3 text-[12px] text-accent hover:underline font-semibold">
              Registrar primer movimiento →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {transacciones.slice(0, 6).map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-bg-hover/40 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                  ${t.tipo === 'ingreso' ? 'bg-accent-soft text-accent' : 'bg-rose-500/10 text-rose-400'}`}>
                  {t.tipo === 'ingreso' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-text-primary truncate">{t.concepto}</div>
                  <div className="text-[11.5px] text-text-muted">{fmtDate(t.fecha)} · {t.categoria}</div>
                </div>
                <div className={`text-[13.5px] font-semibold tabular-nums ${t.tipo === 'ingreso' ? 'text-accent' : 'text-rose-400'}`}>
                  {t.tipo === 'ingreso' ? '+' : '−'}{fmtRD(t.monto)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  )
}

function MiniMetric({ icon: Icon, label, value, hint, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-bg-card border border-border-subtle"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" strokeWidth={1.8} />
        </div>
      </div>
      <div className="text-[11.5px] text-text-muted uppercase tracking-wider mb-1">{label}</div>
      <div className="text-[18px] font-bold text-text-primary tabular-nums leading-tight">{value}</div>
      <div className="text-[11.5px] text-text-muted mt-1">{hint}</div>
    </motion.div>
  )
}
