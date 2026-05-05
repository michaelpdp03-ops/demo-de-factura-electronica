/**
 * Cliente para la API de MSeller eCF.
 * Usa el proxy de Vite (/mseller -> https://ecf.api.mseller.app) para esquivar CORS en dev.
 */

import { DEMO_MODE, simulateDgiiSend } from './demoMode'

const ENV = import.meta.env.VITE_MSELLER_ENV || 'TesteCF'
const API_KEY = import.meta.env.VITE_MSELLER_API_KEY
const EMAIL = import.meta.env.VITE_MSELLER_EMAIL
const PASSWORD = import.meta.env.VITE_MSELLER_PASSWORD

const base = `/mseller/${ENV}`

let session = null

export const msellerConfig = {
  env: ENV,
  hasApiKey: !!API_KEY,
  hasEmail: !!EMAIL,
  hasPassword: !!PASSWORD,
  ready: !!(API_KEY && EMAIL && PASSWORD)
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export async function authenticate() {
  if (!msellerConfig.ready) throw new Error('Faltan variables de entorno: revisa .env.local')

  const res = await fetch(`${base}/customer/authentication`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  })

  const data = await parseJSON(res)
  if (!res.ok) throw new Error(data?.message || `Auth falló: HTTP ${res.status}`)
  if (!data.idToken) throw new Error('Respuesta sin idToken')

  session = {
    idToken: data.idToken,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    obtainedAt: Date.now()
  }
  return session
}

export function getSession() { return session }
export function clearSession() { session = null }

async function authedFetch(path, options = {}) {
  if (!session) await authenticate()
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.idToken}`,
      'x-api-key': API_KEY,
      ...(options.headers || {})
    }
  })
  return res
}

async function parseJSON(res) {
  const text = await res.text()
  try { return text ? JSON.parse(text) : {} } catch { return { raw: text } }
}

// ─── Certificate upload ────────────────────────────────────────────────────

export async function uploadCertificate(p12File, password) {
  if (!session) await authenticate()

  const formData = new FormData()
  formData.append('certificate', p12File)
  formData.append('password', password)

  const res = await fetch(`${base}/customer/certificate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.idToken}`,
      'x-api-key': API_KEY
      // No ponemos Content-Type — el navegador lo pone automático con el boundary correcto
    },
    body: formData
  })

  const data = await parseJSON(res)
  return { ok: res.ok, status: res.status, data }
}

// ─── Send document ─────────────────────────────────────────────────────────

export async function sendDocument(ecfPayload, { validateOnly = false } = {}) {
  // En modo demo, simula respuesta exitosa de DGII sin tocar la red
  if (DEMO_MODE) {
    return simulateDgiiSend(ecfPayload)
  }

  const qs = validateOnly ? '?validate=true' : ''
  const res = await authedFetch(`/documentos-ecf${qs}`, {
    method: 'POST',
    body: JSON.stringify(ecfPayload)
  })
  const data = await parseJSON(res)
  return { ok: res.ok, status: res.status, data }
}

// ─── Query document ────────────────────────────────────────────────────────

export async function queryDocument(eNCF) {
  const res = await authedFetch(`/documentos-ecf?ecf=${encodeURIComponent(eNCF)}`)
  const data = await parseJSON(res)
  return { ok: res.ok, status: res.status, data }
}

// ─── e-CF builders ─────────────────────────────────────────────────────────

const fmtDate = (d = new Date()) => {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}-${mm}-${d.getFullYear()}`
}

/**
 * Construye un e-CF E31 (Factura de Crédito Fiscal) a partir de los datos
 * del negocio emisor y los ítems de la factura.
 *
 * @param {object} emisor  { rncEmisor, razonSocial, direccion }
 * @param {object} comprador { rncComprador, razonSocialComprador }
 * @param {object} item  { nombreItem, cantidad, precioUnitario }
 * @param {string} eNCF  Secuencia asignada, ej: "E310000000001"
 */
export function buildEcf31({ emisor, comprador, item, eNCF }) {
  const subtotal = item.cantidad * item.precioUnitario
  const totalITBIS = +(subtotal * 0.18).toFixed(2)
  const montoTotal = +(subtotal + totalITBIS).toFixed(2)

  return {
    ECF: {
      Encabezado: {
        Version: '1.0',
        IdDoc: {
          TipoeCF: '31',
          eNCF,
          FechaVencimientoSecuencia: '31-12-2028',
          IndicadorEnvioDiferido: '1',
          IndicadorMontoGravado: '0',
          TipoIngresos: '05',
          TipoPago: '2',
          FechaLimitePago: fmtDate(new Date(Date.now() + 30 * 86400000)),
          TotalPaginas: 1
        },
        Emisor: {
          RNCEmisor: emisor.rncEmisor,
          RazonSocialEmisor: emisor.razonSocial,
          DireccionEmisor: emisor.direccion,
          FechaEmision: fmtDate()
        },
        Comprador: {
          RNCComprador: comprador.rncComprador || '000000000',
          RazonSocialComprador: comprador.razonSocialComprador
        },
        Totales: {
          MontoGravadoTotal: subtotal,
          MontoGravadoI1: subtotal,
          MontoExento: 0,
          ITBIS1: 18,
          TotalITBIS: totalITBIS,
          TotalITBIS1: totalITBIS,
          MontoTotal: montoTotal,
          MontoNoFacturable: 0
        }
      },
      DetallesItems: {
        Item: [{
          NumeroLinea: '1',
          IndicadorFacturacion: '1',
          NombreItem: item.nombreItem,
          IndicadorBienoServicio: '2',
          CantidadItem: item.cantidad,
          UnidadMedida: '43',
          PrecioUnitarioItem: item.precioUnitario,
          MontoItem: subtotal
        }]
      },
      Paginacion: {
        Pagina: [{
          PaginaNo: 1,
          NoLineaDesde: 1,
          NoLineaHasta: 1,
          SubtotalMontoGravadoPagina: subtotal,
          SubtotalMontoGravado1Pagina: subtotal,
          SubtotalExentoPagina: 0,
          SubtotalItbisPagina: totalITBIS,
          SubtotalItbis1Pagina: totalITBIS,
          MontoSubtotalPagina: montoTotal,
          SubtotalMontoNoFacturablePagina: 0
        }]
      },
      FechaHoraFirma: ''
    }
  }
}

// Construcción de muestra pa' el panel de prueba (mantiene compatibilidad)
export function buildSampleEcf({
  rncEmisor = '101000526',
  razonSocialEmisor = 'SYNELIS AI',
  direccionEmisor = 'DireccionEmisor1',
  rncComprador = '101023122',
  razonSocialComprador = 'Cliente Prueba SRL',
  eNCF = 'E310000347058',
  nombreItem = 'Producto 1',
  cantidad = 24,
  precioUnitario = 25.0,
  descuentoPct = 10.0
} = {}) {
  const subtotalSinDesc = cantidad * precioUnitario
  const descuentoMonto = +(subtotalSinDesc * (descuentoPct / 100)).toFixed(2)
  const montoItem = +(subtotalSinDesc - descuentoMonto).toFixed(2)
  const totalITBIS = +(montoItem * 0.18).toFixed(2)
  const montoTotal = +(montoItem + totalITBIS).toFixed(2)

  return {
    ECF: {
      Encabezado: {
        Version: '1.0',
        IdDoc: {
          TipoeCF: '31',
          eNCF,
          FechaVencimientoSecuencia: '31-12-2028',
          IndicadorEnvioDiferido: '1',
          IndicadorMontoGravado: '0',
          TipoIngresos: '05',
          TipoPago: '2',
          FechaLimitePago: '07-08-2028',
          TotalPaginas: 1
        },
        Emisor: {
          RNCEmisor: rncEmisor,
          RazonSocialEmisor: razonSocialEmisor,
          DireccionEmisor: direccionEmisor,
          FechaEmision: fmtDate()
        },
        Comprador: {
          RNCComprador: rncComprador,
          RazonSocialComprador: razonSocialComprador
        },
        Totales: {
          MontoGravadoTotal: montoItem,
          MontoGravadoI1: montoItem,
          MontoExento: 0,
          ITBIS1: 18,
          TotalITBIS: totalITBIS,
          TotalITBIS1: totalITBIS,
          MontoTotal: montoTotal,
          MontoNoFacturable: 0
        }
      },
      DetallesItems: {
        Item: [{
          NumeroLinea: '1',
          IndicadorFacturacion: '1',
          NombreItem: nombreItem,
          IndicadorBienoServicio: '1',
          CantidadItem: cantidad,
          UnidadMedida: '43',
          PrecioUnitarioItem: precioUnitario,
          DescuentoMonto: descuentoMonto,
          TablaSubDescuento: {
            SubDescuento: [{
              TipoSubDescuento: '%',
              SubDescuentoPorcentaje: descuentoPct,
              MontoSubDescuento: descuentoMonto
            }]
          },
          MontoItem: montoItem
        }]
      },
      Paginacion: {
        Pagina: [{
          PaginaNo: 1,
          NoLineaDesde: 1,
          NoLineaHasta: 1,
          SubtotalMontoGravadoPagina: montoItem,
          SubtotalMontoGravado1Pagina: montoItem,
          SubtotalExentoPagina: 0,
          SubtotalItbisPagina: totalITBIS,
          SubtotalItbis1Pagina: totalITBIS,
          MontoSubtotalPagina: montoTotal,
          SubtotalMontoNoFacturablePagina: 0
        }]
      },
      FechaHoraFirma: ''
    }
  }
}
