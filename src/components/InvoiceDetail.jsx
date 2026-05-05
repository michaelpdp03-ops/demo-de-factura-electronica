import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Printer, MessageCircle, Bell, Download, CheckCircle2,
  Clock, XCircle, Building2, FileText, Loader2
} from 'lucide-react'
import Badge from './Badge'
import { useBusinessConfig } from '../store/useAppStore'
import { fmtRD, fmtDate } from '../lib/format'
import html2canvas from 'html2canvas'

export default function InvoiceDetail({ factura, onClose }) {
  const [config] = useBusinessConfig()
  const [isGenerating, setIsGenerating] = useState(false)

  if (!factura) return null

  const subtotal = factura.cantidad * factura.precio
  const itbis = factura.itbis || subtotal * 0.18
  const qrSize = 130
  const qrUrl = factura.qrUrl ||
    `https://ecf.dgii.gov.do/testecf/consultatimbre?ncf=${factura.id}&rnc=${config.rncEmisor || ''}&monto=${factura.total}`
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrUrl)}&bgcolor=ffffff&color=0a0a0a&margin=0`

  const handlePrint = () => window.print()

  const sendWhatsAppImage = async (mode = 'normal') => {
    const element = document.querySelector('.invoice-print')
    if (!element) return

    setIsGenerating(true)
    
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      
      canvas.toBlob(async (blob) => {
        if (!blob) return setIsGenerating(false)

        const file = new File([blob], `Factura_${factura.id}.png`, { type: 'image/png' })
        const negocio = config.razonSocial || 'Mi Negocio'
        
        let msg = mode === 'cobro'
          ? `Hola ${factura.cliente}, le escribo de *${negocio}*.\n\nLe enviamos en la imagen adjunta el recordatorio de pago de su factura *${factura.id}* por *${fmtRD(factura.total)}*.\n\nQuedamos atentos. ¡Gracias!`
          : `Hola ${factura.cliente}, *${negocio}* le envía su factura *${factura.id}* adjunta en formato imagen.\n\n¡Gracias por su preferencia!`

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Factura ${factura.id}`,
              text: msg
            })
            setIsGenerating(false)
            return
          } catch (e) {
            console.log("Compartir cancelado o fallido:", e)
          }
        }
        
        try {
          const item = new ClipboardItem({ 'image/png': blob })
          await navigator.clipboard.write([item])
          alert('¡Imagen copiada al portapapeles!\n\n1. Aceptar para abrir WhatsApp.\n2. Presiona Ctrl+V (o Cmd+V) en el chat para PEGAR la factura como imagen y enviarla.')
          window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
        } catch (clipboardErr) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `Factura_${factura.id}.png`
          a.click()
          URL.revokeObjectURL(url)
          alert('Tu navegador no permite copiar imágenes automáticamente. La factura se ha DESCARGADO.\n\nPor favor adjúntala manualmente en WhatsApp.')
          window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
        }
        
        setIsGenerating(false)
      }, 'image/png')
    } catch (err) {
      console.error('Error generando imagen:', err)
      setIsGenerating(false)
      alert("Hubo un error al generar la imagen de la factura.")
    }
  }

  const estadoIcon = {
    aprobada: CheckCircle2,
    pendiente: Clock,
    rechazada: XCircle
  }[factura.estado] || FileText

  const EstadoIcon = estadoIcon

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 lg:p-6 print:bg-white print:p-0 print:relative print:z-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          className="invoice-modal w-full max-w-3xl max-h-[95vh] overflow-y-auto bg-bg-elevated border border-border rounded-2xl print:max-h-none print:overflow-visible print:bg-white print:border-0 print:rounded-none print:shadow-none print:max-w-full"
        >

          {/* Header con acciones (oculto al imprimir) */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle sticky top-0 bg-bg-elevated z-10 print:hidden">
            <h3 className="text-[14px] font-bold text-text-primary">Detalle de factura</h3>
            <div className="flex items-center gap-1.5">
              <button onClick={handlePrint}
                title="Imprimir / Guardar PDF"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-bg-card hover:bg-bg-hover border border-border-subtle text-[12px] font-semibold text-text-secondary transition-colors">
                <Printer className="w-3.5 h-3.5" /> Imprimir / PDF
              </button>
              <button onClick={() => sendWhatsAppImage('normal')} disabled={isGenerating}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-accent-soft hover:bg-accent/20 text-accent text-[12px] font-bold transition-colors disabled:opacity-50">
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />} 
                {isGenerating ? 'Generando...' : 'Enviar'}
              </button>
              {factura.estado === 'pendiente' && (
                <button onClick={() => sendWhatsAppImage('cobro')} disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[12px] font-bold transition-colors disabled:opacity-50">
                  {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />} 
                  {isGenerating ? 'Generando...' : 'Recordar cobro'}
                </button>
              )}
              <button onClick={onClose}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Hoja imprimible */}
          <div className="invoice-print bg-white text-zinc-900 p-8 lg:p-10">
            <style>{`
              @media print {
                @page { size: letter; margin: 14mm; }
                body { background: white !important; }
                .print\\:hidden { display: none !important; }
              }
            `}</style>

            {/* Encabezado del negocio */}
            <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-zinc-200">
              <div className="flex items-start gap-4">
                {config.logoDataUrl ? (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0">
                    <img src={config.logoDataUrl} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shrink-0">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold text-zinc-900 leading-tight">
                    {config.razonSocial || 'Mi Negocio'}
                  </h1>
                  <p className="text-[12px] text-zinc-600 mt-0.5">RNC {config.rncEmisor || '---'}</p>
                  {config.direccion && <p className="text-[12px] text-zinc-600 mt-0.5">{config.direccion}</p>}
                  <div className="flex gap-3 text-[12px] text-zinc-600 mt-0.5">
                    {config.telefono && <span>Tel: {config.telefono}</span>}
                    {config.email && <span>{config.email}</span>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10.5px] font-bold uppercase tracking-wider">
                  <EstadoIcon className="w-3.5 h-3.5" />
                  Factura electrónica
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 mt-3 font-mono">{factura.id}</h2>
                <p className="text-[12px] text-zinc-600 mt-0.5">Crédito Fiscal · TipoeCF 31</p>
                <p className="text-[12px] text-zinc-600 mt-0.5">Fecha: {fmtDate(factura.fecha)}</p>
              </div>
            </div>

            {/* Datos del cliente */}
            <div className="grid grid-cols-2 gap-6 mb-7">
              <div>
                <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Cliente</h3>
                <p className="text-[14px] font-bold text-zinc-900">{factura.cliente}</p>
                {factura.rnc && <p className="text-[12px] text-zinc-600 mt-0.5">RNC/Cédula: {factura.rnc}</p>}
              </div>
              <div>
                <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Detalles</h3>
                <p className="text-[12px] text-zinc-700">
                  Estado: <span className={`font-bold ${
                    factura.estado === 'aprobada' ? 'text-emerald-700'
                    : factura.estado === 'pendiente' ? 'text-amber-600'
                    : 'text-rose-600'
                  }`}>{factura.estado.charAt(0).toUpperCase() + factura.estado.slice(1)}</span>
                </p>
                {factura.trackId && (
                  <p className="text-[11px] text-zinc-600 mt-0.5 font-mono">DGII Track: {factura.trackId}</p>
                )}
              </div>
            </div>

            {/* Tabla de items */}
            <div className="mb-7">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b-2 border-zinc-300 text-left">
                    <th className="py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-600">Descripción</th>
                    <th className="py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-600 text-right w-20">Cant.</th>
                    <th className="py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-600 text-right w-32">Precio</th>
                    <th className="py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-600 text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-200">
                    <td className="py-3 text-zinc-900 font-medium">{factura.servicio}</td>
                    <td className="py-3 text-zinc-700 text-right tabular-nums">{factura.cantidad}</td>
                    <td className="py-3 text-zinc-700 text-right tabular-nums">{fmtRD(factura.precio)}</td>
                    <td className="py-3 text-zinc-900 font-semibold text-right tabular-nums">{fmtRD(subtotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totales + QR */}
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div className="flex flex-col items-start justify-end">
                <div className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Verifica esta factura en DGII
                </div>
                <div className="flex items-center gap-3">
                  <img src={qrSrc} alt="QR DGII" className="w-[110px] h-[110px] border border-zinc-200 rounded" />
                  <div className="text-[10.5px] text-zinc-500 max-w-[140px] leading-relaxed">
                    Escanea el código para validar la autenticidad del comprobante en el portal de la DGII.
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-[13px]">
                <Row label="Subtotal" value={fmtRD(subtotal)} />
                <Row label="ITBIS (18%)" value={fmtRD(itbis)} />
                <div className="h-px bg-zinc-300 my-2" />
                <Row label="Total a pagar" value={fmtRD(factura.total)} bold />
              </div>
            </div>

            {/* Footer */}
            <div className="pt-5 mt-5 border-t border-zinc-200 text-center">
              <p className="text-[10.5px] text-zinc-500">
                Comprobante Fiscal Electrónico (e-CF) emitido conforme a la Ley 32-23 de la República Dominicana.
              </p>
              <p className="text-[10.5px] text-zinc-400 mt-1">
                Generado por FinControl RD · {fmtDate(new Date().toISOString().slice(0, 10))}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? 'text-zinc-900 font-bold text-[15px]' : 'text-zinc-600'}>{label}</span>
      <span className={`tabular-nums ${bold ? 'text-emerald-700 font-bold text-[18px]' : 'text-zinc-900 font-medium'}`}>
        {value}
      </span>
    </div>
  )
}
