import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plug, CheckCircle2, XCircle, Loader2, ChevronDown, KeyRound, Send, Copy } from 'lucide-react'
import { authenticate, sendDocument, buildSampleEcf, msellerConfig } from '../lib/mseller'

const SAMPLE_DEFAULTS = {
  rncEmisor: '101000526',
  razonSocialEmisor: 'SYNELIS AI',
  direccionEmisor: 'DireccionEmisor1',
  rncComprador: '101023122',
  razonSocialComprador: 'Cliente Prueba SRL',
  eNCF: 'E310000347058',
  nombreItem: 'Producto 1',
  cantidad: 24,
  precioUnitario: 25,
  descuentoPct: 10
}

export default function MSellerPanel() {
  const [authStatus, setAuthStatus] = useState('idle')
  const [authError, setAuthError] = useState(null)
  const [token, setToken] = useState(null)

  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState('auth')

  const [sample, setSample] = useState(SAMPLE_DEFAULTS)
  const [sendStatus, setSendStatus] = useState('idle')
  const [sendResult, setSendResult] = useState(null)
  const [validateOnly, setValidateOnly] = useState(true)

  const handleAuth = async () => {
    setAuthStatus('loading')
    setAuthError(null)
    try {
      const sess = await authenticate()
      setToken(sess.idToken)
      setAuthStatus('ok')
    } catch (e) {
      setAuthError(e.message)
      setAuthStatus('error')
    }
  }

  const handleSend = async () => {
    setSendStatus('loading')
    setSendResult(null)
    try {
      const payload = buildSampleEcf({
        ...sample,
        cantidad: Number(sample.cantidad),
        precioUnitario: Number(sample.precioUnitario),
        descuentoPct: Number(sample.descuentoPct)
      })
      const result = await sendDocument(payload, { validateOnly })
      setSendResult({ ...result, payload })
      setSendStatus(result.ok ? 'ok' : 'error')
    } catch (e) {
      setSendResult({ ok: false, error: e.message })
      setSendStatus('error')
    }
  }

  const StatusIcon = { idle: Plug, loading: Loader2, ok: CheckCircle2, error: XCircle }[authStatus]
  const statusTone = {
    idle: 'text-text-secondary bg-bg-elevated',
    loading: 'text-sky-400 bg-sky-500/10',
    ok: 'text-accent bg-accent-soft',
    error: 'text-rose-400 bg-rose-500/10'
  }[authStatus]
  const statusLabel = { idle: 'Sin probar', loading: 'Autenticando...', ok: 'Conectado', error: 'Error' }[authStatus]

  const update = (k) => (e) => setSample({ ...sample, [k]: e.target.value })

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-bg-card border border-border-subtle overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-bg-hover/30 transition-colors"
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${statusTone}`}>
          <StatusIcon className={`w-[18px] h-[18px] ${authStatus === 'loading' ? 'animate-spin' : ''}`} strokeWidth={2} />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-semibold text-text-primary">Integración MSeller eCF</h3>
            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${statusTone}`}>{statusLabel}</span>
          </div>
          <p className="text-[12px] text-text-muted mt-0.5">
            Sandbox <span className="font-mono text-text-secondary">{msellerConfig.env}</span>
            {' · '}{msellerConfig.ready ? 'Credenciales cargadas' : 'Faltan variables en .env.local'}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border-subtle"
          >
            <div className="px-5 pt-4">
              <div className="inline-flex p-1 rounded-lg bg-bg-elevated border border-border-subtle">
                {[
                  { id: 'auth', label: '1. Autenticación' },
                  { id: 'send', label: '2. Enviar e-CF de prueba' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`px-3 h-7 rounded-md text-[12px] font-semibold transition-colors
                      ${tab === t.id ? 'bg-bg-card text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {tab === 'auth' && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[12px]">
                  <ConfigRow label="API Key" ok={msellerConfig.hasApiKey} />
                  <ConfigRow label="Email" ok={msellerConfig.hasEmail} />
                  <ConfigRow label="Password" ok={msellerConfig.hasPassword} />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleAuth}
                    disabled={!msellerConfig.ready || authStatus === 'loading'}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-accent hover:bg-accent-hover text-bg text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-glow"
                  >
                    {authStatus === 'loading'
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <KeyRound className="w-4 h-4" />}
                    Probar autenticación
                  </button>

                  {authStatus === 'ok' && (
                    <span className="text-[12.5px] text-accent font-medium">
                      ✓ idToken recibido — la integración funciona
                    </span>
                  )}
                  {authStatus === 'error' && (
                    <span className="text-[12.5px] text-rose-400 font-medium break-all">
                      {authError}
                    </span>
                  )}
                </div>

                {authStatus === 'ok' && token && (
                  <div className="rounded-lg bg-bg-elevated border border-border-subtle p-3">
                    <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">idToken (truncado)</div>
                    <code className="block text-[11px] text-accent font-mono break-all">
                      {token.slice(0, 60)}...{token.slice(-12)}
                    </code>
                  </div>
                )}

                <div className="text-[11.5px] text-text-muted leading-relaxed">
                  Endpoint: <code className="font-mono text-text-secondary">POST /{msellerConfig.env}/customer/authentication</code>
                  {' · '}
                  Las llamadas pasan por el proxy de Vite (<code className="font-mono">/mseller</code> → <code className="font-mono">ecf.api.mseller.app</code>) para evitar CORS.
                </div>
              </div>
            )}

            {tab === 'send' && (
              <div className="p-5 space-y-4">
                <div className="text-[12.5px] text-text-secondary leading-relaxed">
                  Construye y envía un comprobante <strong className="text-text-primary">TipoeCF 31</strong> (Factura de Crédito Fiscal) usando los valores del ejemplo del sandbox. Puedes editar cualquier campo antes de enviar.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input label="RNC Emisor" value={sample.rncEmisor} onChange={update('rncEmisor')} mono />
                  <Input label="Razón Social Emisor" value={sample.razonSocialEmisor} onChange={update('razonSocialEmisor')} />
                  <Input label="RNC Comprador" value={sample.rncComprador} onChange={update('rncComprador')} mono />
                  <Input label="Razón Social Comprador" value={sample.razonSocialComprador} onChange={update('razonSocialComprador')} />
                  <Input label="eNCF (secuencia)" value={sample.eNCF} onChange={update('eNCF')} mono hint="Único por cada envío exitoso" />
                  <Input label="Producto" value={sample.nombreItem} onChange={update('nombreItem')} />
                  <Input label="Cantidad" type="number" value={sample.cantidad} onChange={update('cantidad')} />
                  <Input label="Precio unitario (RD$)" type="number" value={sample.precioUnitario} onChange={update('precioUnitario')} />
                </div>

                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={validateOnly}
                    onChange={(e) => setValidateOnly(e.target.checked)}
                    className="w-4 h-4 accent-accent"
                  />
                  <span className="text-[12.5px] text-text-secondary">
                    Solo validar (<code className="font-mono text-text-muted">?validate=true</code>) — no consume secuencia
                  </span>
                </label>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={handleSend}
                    disabled={sendStatus === 'loading' || !msellerConfig.ready}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-accent hover:bg-accent-hover text-bg text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-glow"
                  >
                    {sendStatus === 'loading'
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Send className="w-4 h-4" />}
                    {validateOnly ? 'Validar contra sandbox' : 'Enviar e-CF al sandbox'}
                  </button>

                  {sendStatus === 'ok' && (
                    <span className="text-[12.5px] text-accent font-medium">
                      ✓ HTTP {sendResult?.status} — el sandbox respondió OK
                    </span>
                  )}
                  {sendStatus === 'error' && (
                    <span className="text-[12.5px] text-rose-400 font-medium break-all">
                      {sendResult?.error || `HTTP ${sendResult?.status} — revisa la respuesta abajo`}
                    </span>
                  )}
                </div>

                {sendResult?.data && (
                  <ResponseBlock title={`Respuesta del API (HTTP ${sendResult.status})`} value={sendResult.data} />
                )}
                {sendResult?.payload && sendStatus !== 'idle' && (
                  <ResponseBlock title="Payload enviado" value={sendResult.payload} dim />
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ConfigRow({ label, ok }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-md border ${ok ? 'bg-accent-soft border-accent/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
      {ok
        ? <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
        : <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
      <span className={`font-semibold ${ok ? 'text-accent' : 'text-rose-400'}`}>{label}</span>
      <span className="text-text-muted ml-auto">{ok ? 'OK' : 'Falta'}</span>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', mono = false, hint }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11.5px] font-semibold text-text-secondary">{label}</span>
        {hint && <span className="text-[10.5px] text-text-muted">{hint}</span>}
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={`w-full h-9 px-3 bg-bg-elevated border border-border-subtle rounded-lg text-[12.5px] text-text-primary
          focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors
          ${mono ? 'font-mono' : ''}`}
      />
    </label>
  )
}

function ResponseBlock({ title, value, dim = false }) {
  const json = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  const copy = () => navigator.clipboard?.writeText(json)
  return (
    <div className={`rounded-lg bg-bg-elevated border border-border-subtle overflow-hidden ${dim ? 'opacity-80' : ''}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle">
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">{title}</span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary"
        >
          <Copy className="w-3 h-3" /> copiar
        </button>
      </div>
      <pre className="p-3 text-[11px] text-text-secondary font-mono leading-relaxed overflow-x-auto max-h-72">
        {json}
      </pre>
    </div>
  )
}
