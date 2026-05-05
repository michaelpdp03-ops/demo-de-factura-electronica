import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Building2, Hash, CheckCircle2, Save, ShieldCheck,
  AlertTriangle, Info, Upload, X, Image as ImageIcon
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useBusinessConfig, useNCFSequence, isConfigured } from '../store/useAppStore'

export default function Configuracion() {
  const [config, setConfig] = useBusinessConfig()
  const { seq, isSeqConfigured, remaining, currentENCF, initSequence } = useNCFSequence()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    razonSocial: config.razonSocial || '',
    rncEmisor: config.rncEmisor || '',
    direccion: config.direccion || '',
    telefono: config.telefono || '',
    email: config.email || '',
    logoDataUrl: config.logoDataUrl || '',
  })

  const logoInputRef = useRef()

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500_000) {
      alert('La imagen es muy grande. Usa una de menos de 500 KB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setForm((p) => ({ ...p, logoDataUrl: reader.result }))
    reader.readAsDataURL(file)
  }

  const removeLogo = () => setForm((p) => ({ ...p, logoDataUrl: '' }))

  const [ncf, setNcf] = useState({
    tipoECF: seq.tipoECF || '31',
    rangoInicio: seq.rangoInicio || '',
    rangoFin: seq.rangoFin || '',
  })

  const [saved, setSaved] = useState(false)

  const upd = (setter) => (k) => (e) => setter((prev) => ({ ...prev, [k]: e.target.value }))
  const updForm = upd(setForm)
  const updNcf = upd(setNcf)

  const canSave = form.razonSocial && form.rncEmisor && form.direccion

  const handleSave = (e) => {
    e.preventDefault()
    setConfig({ ...config, ...form })
    if (ncf.rangoInicio && ncf.rangoFin) initSequence(ncf)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      navigate('/facturacion')
    }, 1000)
  }

  const ncfTotal = ncf.rangoInicio && ncf.rangoFin
    ? parseInt(ncf.rangoFin) - parseInt(ncf.rangoInicio) + 1
    : 0

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Configuración</h2>
        <p className="text-[13.5px] text-text-secondary mt-1">
          Información de tu negocio para las facturas electrónicas
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* Sección 1: Datos del negocio */}
        <Section icon={Building2} title="Tu negocio">
          <div className="space-y-4">

            {/* Logo del negocio */}
            <Field label="Logo del negocio" hint="Aparece en el sidebar y en las facturas">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border-subtle bg-bg-elevated flex items-center justify-center overflow-hidden shrink-0">
                  {form.logoDataUrl ? (
                    <img src={form.logoDataUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-text-muted" />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button type="button" onClick={() => logoInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-bg-elevated hover:bg-bg-hover border border-border-subtle text-[12px] font-semibold text-text-secondary transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    {form.logoDataUrl ? 'Cambiar logo' : 'Subir logo'}
                  </button>
                  {form.logoDataUrl && (
                    <button type="button" onClick={removeLogo}
                      className="inline-flex items-center gap-1.5 h-7 px-2 rounded-lg text-[11.5px] text-text-muted hover:text-rose-400 transition-colors">
                      <X className="w-3 h-3" />
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            </Field>

            <Field label="Nombre del negocio" required hint="Exactamente como aparece en DGII">
              <input
                value={form.razonSocial}
                onChange={updForm('razonSocial')}
                placeholder="Ej: Restaurante El Bohío SRL"
                className="inp" required
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="RNC" required hint="Número en DGII">
                <input
                  value={form.rncEmisor}
                  onChange={updForm('rncEmisor')}
                  placeholder="131-00000-0"
                  className="inp font-mono" required
                />
              </Field>
              <Field label="Teléfono" hint="Opcional">
                <input
                  value={form.telefono}
                  onChange={updForm('telefono')}
                  placeholder="809-000-0000"
                  className="inp"
                />
              </Field>
            </div>

            <Field label="Dirección" required>
              <input
                value={form.direccion}
                onChange={updForm('direccion')}
                placeholder="Av. Principal #123, Santo Domingo"
                className="inp" required
              />
            </Field>

            <Field label="Correo electrónico" hint="Opcional">
              <input
                type="email"
                value={form.email}
                onChange={updForm('email')}
                placeholder="contacto@minegocio.com"
                className="inp"
              />
            </Field>
          </div>
        </Section>

        {/* Sección 2: NCF */}
        <Section icon={Hash} title="Números de factura (NCF)">
          <div className="space-y-4">
            {isSeqConfigured && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/8 border border-accent/20 text-[12.5px]">
                <span className="text-text-secondary">Próxima factura:</span>
                <span className="font-mono font-bold text-accent">{currentENCF()}</span>
                <span className={`font-semibold ${remaining > 100 ? 'text-accent' : remaining > 20 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {remaining.toLocaleString()} disponibles
                </span>
              </div>
            )}

            <Field label="Tipo de comprobante">
              <select value={ncf.tipoECF} onChange={updNcf('tipoECF')} className="inp">
                <option value="31">E31 — Crédito Fiscal (clientes con RNC)</option>
                <option value="32">E32 — Consumo (público en general)</option>
                <option value="41">E41 — Registro de compras</option>
                <option value="43">E43 — Gastos menores</option>
              </select>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Primer número" hint="Lo indica DGII">
                <input
                  type="number"
                  value={ncf.rangoInicio}
                  onChange={updNcf('rangoInicio')}
                  placeholder="1"
                  className="inp"
                />
              </Field>
              <Field label="Último número" hint="Lo indica DGII">
                <input
                  type="number"
                  value={ncf.rangoFin}
                  onChange={updNcf('rangoFin')}
                  placeholder="1000"
                  className="inp"
                />
              </Field>
            </div>

            {ncfTotal > 0 && (
              <p className="text-[12px] text-text-muted px-1">
                Este rango te da <strong className="text-text-primary">{ncfTotal.toLocaleString()} facturas</strong> electrónicas.
              </p>
            )}

            <div className="flex items-start gap-2 p-3 rounded-lg bg-bg-elevated border border-border-subtle">
              <Info className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
              <p className="text-[12px] text-text-muted leading-relaxed">
                Los números los solicitas en <strong className="text-text-secondary">DGII.gov.do</strong> al
                completar tu certificación. Para probar puedes usar <strong>1</strong> y <strong>1000</strong>.
              </p>
            </div>
          </div>
        </Section>

        {/* Sección 3: Certificado (informativa) */}
        <Section icon={ShieldCheck} title="Firma digital (certificado .p12)">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-bg-elevated border border-border-subtle">
            <Info className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
            <p className="text-[12.5px] text-text-secondary leading-relaxed">
              El certificado .p12 se configura por separado en el sistema de facturación electrónica.
              Una vez subido, todas tus facturas se firman automáticamente.
            </p>
          </div>
        </Section>

        {/* Guardar */}
        <motion.button
          type="submit"
          disabled={!canSave}
          whileTap={{ scale: 0.98 }}
          className="w-full h-12 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 text-bg font-bold text-[15px] transition-colors shadow-glow flex items-center justify-center gap-2"
        >
          {saved
            ? <><CheckCircle2 className="w-5 h-5" /> Guardado — yendo a facturar...</>
            : <><Save className="w-5 h-5" /> Guardar configuración</>}
        </motion.button>
      </form>

      <Styles />
    </div>
  )
}

function Section({ icon: Icon, title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-bg-card border border-border-subtle overflow-hidden"
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border-subtle">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-accent" strokeWidth={1.8} />
        </div>
        <h3 className="text-[14px] font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  )
}

function Field({ label, hint, required, children }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] font-semibold text-text-primary">
          {label}{required && <span className="text-accent ml-0.5">*</span>}
        </span>
        {hint && <span className="text-[11.5px] text-text-muted">{hint}</span>}
      </div>
      {children}
    </label>
  )
}

function Styles() {
  return (
    <style>{`.inp{width:100%;height:40px;padding:0 12px;background:#1a1d28;border:1px solid #2a2e3a;border-radius:10px;color:#f4f4f5;font-size:13.5px;font-family:inherit;transition:border-color .15s,box-shadow .15s}.inp::placeholder{color:#71717a}.inp:focus{border-color:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.12);outline:none}`}</style>
  )
}
