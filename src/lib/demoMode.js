/**
 * MODO DEMO
 * ----------
 * Cuando VITE_DEMO_MODE=true (por defecto), la app simula un negocio
 * completamente configurado y operando: emite facturas falsas con
 * confirmación "DGII", historial rico, métricas reales.
 *
 * Para desactivar: VITE_DEMO_MODE=false en .env.local
 */

export const DEMO_MODE = (import.meta.env.VITE_DEMO_MODE ?? 'true') !== 'false'

// ─── Datos del negocio demo ─────────────────────────────────────────────────
export const demoBusiness = {
  rncEmisor: '131-78945-2',
  razonSocial: 'Restaurante El Bohío SRL',
  direccion: 'Av. Tiradentes #45, Naco, Santo Domingo',
  telefono: '809-555-0142',
  email: 'admin@elbohio.do',
  tipoNegocio: 'restaurante'
}

export const demoNCF = {
  tipoECF: '31',
  prefijo: 'E31',
  rangoInicio: 1,
  rangoFin: 1000,
  actual: 348
}

export const demoCert = {
  uploaded: true,
  rncAsociado: '131-78945-2',
  vencimiento: '2027-08-15',
  uploadedAt: '2026-01-12T10:30:00.000Z'
}

// ─── Generador de facturas ricas ────────────────────────────────────────────
// Cliente corporativo: paga catering/almuerzos para grupos (ticket más alto)
// Cliente particular: paga reservas o eventos pequeños (ticket más bajo)
const clientesDemo = [
  { nombre: 'Banco Popular Dominicano',     rnc: '101-01058-3', servicio: 'Almuerzo ejecutivo',      tipo: 'corp', personas: [12, 25] },
  { nombre: 'Claro Dominicana',             rnc: '101-01092-5', servicio: 'Catering corporativo',    tipo: 'corp', personas: [15, 35] },
  { nombre: 'Hotel Catalonia',              rnc: '101-78421-9', servicio: 'Servicio de catering',    tipo: 'corp', personas: [10, 20] },
  { nombre: 'Constructora Arias',           rnc: '130-45821-1', servicio: 'Reunión de junta',        tipo: 'corp', personas: [6, 14] },
  { nombre: 'Seguros Universal',            rnc: '101-01234-7', servicio: 'Almuerzo ejecutivo',      tipo: 'corp', personas: [8, 18] },
  { nombre: 'Asociación Médica Dominicana', rnc: '430-15879-4', servicio: 'Evento networking',       tipo: 'corp', personas: [20, 40] },
  { nombre: 'Cervecería Nacional',          rnc: '101-00451-2', servicio: 'Almuerzo trimestral',     tipo: 'corp', personas: [15, 30] },
  { nombre: 'Banreservas',                  rnc: '401-50625-4', servicio: 'Catering directiva',      tipo: 'corp', personas: [8, 16] },
  { nombre: 'María Fernández',     rnc: '', servicio: 'Cumpleaños familiar',     tipo: 'part', personas: [1, 1] },
  { nombre: 'José Antonio Reyes',  rnc: '', servicio: 'Cena familiar',           tipo: 'part', personas: [1, 1] },
  { nombre: 'Patricia Henríquez',  rnc: '', servicio: 'Boda íntima',             tipo: 'part', personas: [1, 1] },
  { nombre: 'Luis Manuel Peña',    rnc: '', servicio: 'Reserva fin de semana',   tipo: 'part', personas: [1, 1] },
  { nombre: 'Carmen Rosa Mejía',   rnc: '', servicio: 'Aniversario',             tipo: 'part', personas: [1, 1] },
  { nombre: 'Roberto Sánchez',     rnc: '', servicio: 'Cena privada',            tipo: 'part', personas: [1, 1] },
  { nombre: 'Ana Lucía Polanco',   rnc: '', servicio: 'Almuerzo familiar',       tipo: 'part', personas: [1, 1] },
  { nombre: 'Pedro Martínez',      rnc: '', servicio: 'Reserva especial',        tipo: 'part', personas: [1, 1] },
]

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function pick(arr) { return arr[rand(0, arr.length - 1)] }

// Distribución de estados realista: 96% aprobadas, 3% pendientes, 1% rechazada
function pickEstado() {
  const r = Math.random()
  if (r < 0.96) return 'aprobada'
  if (r < 0.99) return 'pendiente'
  return 'rechazada'
}

// Distribución temporal: peso hacia días recientes (últimos 30 días = 60% del volumen)
function pickDaysAgo() {
  const r = Math.random()
  if (r < 0.10) return rand(0, 4)        // semana actual
  if (r < 0.35) return rand(5, 14)       // hace 2 semanas
  if (r < 0.65) return rand(15, 30)      // último mes
  if (r < 0.85) return rand(31, 60)      // hace 2 meses
  return rand(61, 95)                    // hace 3 meses
}

function generateFacturas() {
  const facturas = []
  const today = new Date('2026-05-04')

  for (let i = 0; i < 68; i++) {
    const cliente = pick(clientesDemo)
    let cantidad, precio
    if (cliente.tipo === 'corp') {
      cantidad = rand(cliente.personas[0], cliente.personas[1])
      precio = rand(750, 1400)              // RD$ por persona
    } else {
      cantidad = 1
      precio = rand(2800, 9500)             // reserva familiar/personal
    }

    const subtotal = cantidad * precio
    const itbis = +(subtotal * 0.18).toFixed(2)
    const total = +(subtotal + itbis).toFixed(2)

    const daysAgo = pickDaysAgo()
    const fecha = new Date(today)
    fecha.setDate(fecha.getDate() - daysAgo)

    const ncfNum = 348 - i
    const eNCF = 'E31' + String(ncfNum).padStart(10, '0')

    facturas.push({
      id: eNCF,
      cliente: cliente.nombre,
      rnc: cliente.rnc,
      servicio: cliente.servicio,
      cantidad,
      precio,
      itbis,
      total,
      fecha: fecha.toISOString().slice(0, 10),
      estado: pickEstado(),
      modo: 'ecf',
      trackId: 'TRK' + Math.random().toString(36).slice(2, 12).toUpperCase(),
      qrUrl: `https://ecf.dgii.gov.do/testecf/consultatimbre?ncf=${eNCF}`
    })
  }
  return facturas.sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
}

export const demoFacturas = generateFacturas()

// ─── Transacciones de gastos realistas ──────────────────────────────────────
function generateTransacciones() {
  const today = new Date('2026-05-05')
  const items = []
  let id = 1

  const gastosFijos = [
    { concepto: 'Alquiler local',                categoria: 'Alquiler',      monto: 45000, dia: 1 },
    { concepto: 'Salarios quincena',              categoria: 'Nómina',        monto: 38500, dia: 15 },
    { concepto: 'Salarios fin de mes',            categoria: 'Nómina',        monto: 38500, dia: 30 },
    { concepto: 'Pago electricidad EDESUR',       categoria: 'Servicios',     monto: 8200,  dia: 8 },
    { concepto: 'Internet y teléfono Altice',     categoria: 'Servicios',     monto: 3200,  dia: 5 },
    { concepto: 'Agua CAASD',                     categoria: 'Servicios',     monto: 1800,  dia: 7 },
  ]

  const gastosVariables = [
    { concepto: 'Compra de mariscos Mercado Modelo', categoria: 'Inventario', min: 4500, max: 9500 },
    { concepto: 'Compra de carnes Pricesmart',       categoria: 'Inventario', min: 6800, max: 14000 },
    { concepto: 'Compra de vegetales Bonao',         categoria: 'Inventario', min: 2400, max: 4800 },
    { concepto: 'Compra de licores',                 categoria: 'Inventario', min: 5500, max: 12000 },
    { concepto: 'Compra de bebidas',                 categoria: 'Inventario', min: 3200, max: 6500 },
    { concepto: 'Combustible delivery',              categoria: 'Transporte', min: 1500, max: 2800 },
    { concepto: 'Mantenimiento aire acondicionado',  categoria: 'Mantenimiento', min: 2500, max: 4500 },
    { concepto: 'Productos de limpieza',             categoria: 'Inventario', min: 1800, max: 3500 },
    { concepto: 'Publicidad redes sociales',         categoria: 'Marketing',  min: 2000, max: 5000 },
  ]

  // Genera gastos para los últimos 3 meses (Feb, Mar, Abr, May)
  for (let monthsAgo = 0; monthsAgo < 4; monthsAgo++) {
    const refDate = new Date(today)
    refDate.setMonth(refDate.getMonth() - monthsAgo)
    const year = refDate.getFullYear()
    const month = refDate.getMonth() + 1

    // Gastos fijos (solo si el día ya pasó en el mes actual)
    for (const g of gastosFijos) {
      if (monthsAgo === 0 && g.dia > today.getDate()) continue
      const fecha = `${year}-${String(month).padStart(2, '0')}-${String(g.dia).padStart(2, '0')}`
      items.push({ id: id++, fecha, tipo: 'gasto', concepto: g.concepto, categoria: g.categoria, monto: g.monto })
    }

    // Gastos variables: 8-12 por mes
    const numVar = monthsAgo === 0 ? rand(2, 5) : rand(8, 12)
    for (let j = 0; j < numVar; j++) {
      const g = pick(gastosVariables)
      const dia = monthsAgo === 0 ? rand(1, today.getDate()) : rand(1, 28)
      const fecha = `${year}-${String(month).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
      const monto = rand(g.min, g.max)
      items.push({ id: id++, fecha, tipo: 'gasto', concepto: g.concepto, categoria: g.categoria, monto })
    }
  }

  return items.sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
}

export const demoTransacciones = generateTransacciones()

// ─── Seed: inicializa localStorage si está vacío ────────────────────────────
export function seedDemoData() {
  if (!DEMO_MODE) return

  const seedKey = 'fincontrol_demo_seeded_v4'
  if (localStorage.getItem(seedKey)) return

  // Solo siembra si no hay configuración previa
  if (!localStorage.getItem('fincontrol_config')) {
    localStorage.setItem('fincontrol_config', JSON.stringify(demoBusiness))
  }
  if (!localStorage.getItem('fincontrol_ncf')) {
    localStorage.setItem('fincontrol_ncf', JSON.stringify(demoNCF))
  }
  if (!localStorage.getItem('fincontrol_cert')) {
    localStorage.setItem('fincontrol_cert', JSON.stringify(demoCert))
  }
  if (!localStorage.getItem('fincontrol_facturas')) {
    localStorage.setItem('fincontrol_facturas', JSON.stringify(demoFacturas))
  }
  if (!localStorage.getItem('fincontrol_transacciones')) {
    localStorage.setItem('fincontrol_transacciones', JSON.stringify(demoTransacciones))
  }

  localStorage.setItem(seedKey, '1')
}

// ─── Reset: vuelve a estado demo limpio ─────────────────────────────────────
export function resetDemoData() {
  ['fincontrol_config', 'fincontrol_ncf', 'fincontrol_cert',
   'fincontrol_facturas', 'fincontrol_transacciones',
   'fincontrol_demo_seeded_v2', 'fincontrol_demo_seeded_v3', 'fincontrol_demo_seeded_v4'].forEach((k) => {
    localStorage.removeItem(k)
  })
  seedDemoData()
  window.location.reload()
}

// ─── Simulador de envío a DGII ──────────────────────────────────────────────
export function simulateDgiiSend(payload) {
  return new Promise((resolve) => {
    const delay = 1200 + Math.random() * 1000
    setTimeout(() => {
      const trackId = 'TRK' + Math.random().toString(36).slice(2, 12).toUpperCase()
      const eNCF = payload?.ECF?.Encabezado?.IdDoc?.eNCF || 'E310000000001'
      resolve({
        ok: true,
        status: 200,
        data: {
          trackId,
          mensaje: 'Documento aceptado por la DGII',
          codigo: '0',
          eNCF,
          qrUrl: `https://ecf.dgii.gov.do/testecf/consultatimbre?ncf=${eNCF}`,
          fechaProceso: new Date().toISOString(),
          rnc: payload?.ECF?.Encabezado?.Emisor?.RNCEmisor || ''
        }
      })
    }, delay)
  })
}
