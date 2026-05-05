import { useState, useEffect, useCallback } from 'react'
import { facturas as mockFacturas, transacciones as mockTransacciones, clientes as mockClientes } from '../data/mockData'
import { supabase } from '../lib/supabase'

// Verifica si el usuario ya configuró sus variables de entorno
export const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  return url && url.startsWith('https://') && url !== 'https://tu-proyecto.supabase.co' && key && key !== 'tu-anon-key-aqui'
}

export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { session, loading }
}

function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const set = useCallback((next) => {
    setValue((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next
      try { localStorage.setItem(key, JSON.stringify(resolved)) } catch {}
      return resolved
    })
  }, [key])

  return [value, set]
}

// ─── Business config ───────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  rncEmisor: '',
  razonSocial: '',
  direccion: '',
  telefono: '',
  email: '',
  tipoNegocio: 'restaurante',
  logoDataUrl: ''
}

export function useBusinessConfig() {
  const [config, setConfig] = useLocalStorage('fincontrol_config', DEFAULT_CONFIG)

  // Fetch initial config from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured()) return
    supabase.from('configuracion_negocio').select('*').eq('id', 1).single().then(({ data, error }) => {
      if (data && !error) {
        setConfig({
          rncEmisor: data.rnc_emisor || '',
          razonSocial: data.razon_social || '',
          direccion: data.direccion || '',
          telefono: data.telefono || '',
          email: data.email || '',
          tipoNegocio: data.tipo_negocio || 'restaurante',
          logoDataUrl: data.logo_url || ''
        })
      }
    })
  }, [setConfig])

  const saveConfig = useCallback(async (newConfig) => {
    setConfig(newConfig)
    if (isSupabaseConfigured()) {
      await supabase.from('configuracion_negocio').upsert({
        id: 1,
        rnc_emisor: newConfig.rncEmisor,
        razon_social: newConfig.razonSocial,
        direccion: newConfig.direccion,
        telefono: newConfig.telefono,
        email: newConfig.email,
        tipo_negocio: newConfig.tipoNegocio,
        logo_url: newConfig.logoDataUrl
      })
    }
  }, [setConfig])

  return [config, saveConfig]
}

export function isConfigured(config) {
  return !!(config.rncEmisor && config.razonSocial && config.direccion)
}

// ─── NCF sequences (local cache for now) ───────────────────────────────────
const DEFAULT_SEQ = {
  tipoECF: '31',
  prefijo: 'E31',
  rangoInicio: '',
  rangoFin: '',
  actual: 0
}

export function useNCFSequence() {
  const [seq, setSeq] = useLocalStorage('fincontrol_ncf', DEFAULT_SEQ)

  const isSeqConfigured = !!(seq.rangoInicio && seq.rangoFin && seq.actual > 0)

  const remaining = isSeqConfigured
    ? parseInt(seq.rangoFin) - seq.actual + 1
    : 0

  const currentENCF = () =>
    seq.prefijo + String(seq.actual).padStart(10, '0')

  const nextENCF = () => {
    const ecf = currentENCF()
    setSeq((prev) => ({ ...prev, actual: prev.actual + 1 }))
    return ecf
  }

  const initSequence = ({ tipoECF, rangoInicio, rangoFin }) => {
    const prefijo = 'E' + tipoECF
    setSeq({
      tipoECF,
      prefijo,
      rangoInicio: parseInt(rangoInicio),
      rangoFin: parseInt(rangoFin),
      actual: parseInt(rangoInicio)
    })
  }

  return { seq, setSeq, isSeqConfigured, remaining, currentENCF, nextENCF, initSequence }
}

// ─── Certificate status (local cache) ──────────────────────────────────────
export function useCertStatus() {
  return useLocalStorage('fincontrol_cert', {
    uploaded: false,
    rncAsociado: '',
    vencimiento: '',
    uploadedAt: null
  })
}

// ─── Transacciones (Supabase + Local) ──────────────────────────────────────
export const CATEGORIAS_INGRESO = ['Ventas', 'Servicios', 'Otros ingresos']
export const CATEGORIAS_GASTO = [
  'Inventario', 'Nómina', 'Servicios', 'Transporte',
  'Mantenimiento', 'Alquiler', 'Marketing', 'Impuestos', 'Otros'
]

export function useTransacciones() {
  const initialTransacciones = isSupabaseConfigured() ? [] : mockTransacciones
  const [transacciones, setTransacciones] = useLocalStorage('fincontrol_transacciones', initialTransacciones)

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    supabase.from('transacciones').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (data && !error) {
        setTransacciones(prev => {
          const dataIds = new Set(data.map(d => d.id))
          const localOnly = prev.filter(p => !dataIds.has(p.id))
          return [...localOnly, ...data]
        })
      }
    })
  }, [setTransacciones])

  const addTransaccion = useCallback(async (t) => {
    const id = t.id || crypto.randomUUID()
    const newT = { ...t, id }
    // Optimistic update
    setTransacciones((prev) => [newT, ...prev])
    
    if (isSupabaseConfigured()) {
      await supabase.from('transacciones').insert([newT])
    }
  }, [setTransacciones])

  const deleteTransaccion = useCallback(async (id) => {
    setTransacciones((prev) => prev.filter((t) => t.id !== id))
    
    if (isSupabaseConfigured()) {
      await supabase.from('transacciones').delete().eq('id', id)
    }
  }, [setTransacciones])

  return { transacciones, setTransacciones, addTransaccion, deleteTransaccion }
}

// ─── Facturas (Supabase + Local) ───────────────────────────────────────────
export function useFacturas() {
  const initialFacturas = isSupabaseConfigured() ? [] : mockFacturas
  const [facturas, setFacturas] = useLocalStorage('fincontrol_facturas', initialFacturas)

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    supabase.from('facturas').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (data && !error) {
        setFacturas(prev => {
          const dataIds = new Set(data.map(d => d.id))
          const localOnly = prev.filter(p => !dataIds.has(p.id))
          return [...localOnly, ...data]
        })
      }
    })
  }, [setFacturas])

  const addFactura = useCallback(async (f) => {
    setFacturas((prev) => [f, ...prev])
    
    if (isSupabaseConfigured()) {
      await supabase.from('facturas').insert([f])
    }
  }, [setFacturas])

  const updateFactura = useCallback(async (id, changes) => {
    setFacturas((prev) =>
      prev.map((f) => f.id === id ? { ...f, ...changes } : f)
    )
    
    if (isSupabaseConfigured()) {
      await supabase.from('facturas').update(changes).eq('id', id)
    }
  }, [setFacturas])

  return { facturas, setFacturas, addFactura, updateFactura }
}

// ─── Clientes (Supabase + Local) ───────────────────────────────────────────
export function useClientes() {
  const initialClientes = isSupabaseConfigured() ? [] : mockClientes
  const [clientes, setClientes] = useLocalStorage('fincontrol_clientes', initialClientes)

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    supabase.from('clientes').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (data && !error) {
        setClientes(prev => {
          const dataIds = new Set(data.map(d => d.id))
          const localOnly = prev.filter(p => !dataIds.has(p.id))
          return [...localOnly, ...data]
        })
      }
    })
  }, [setClientes])

  const addCliente = useCallback(async (c) => {
    const id = c.id || crypto.randomUUID()
    const newC = { ...c, id }
    setClientes((prev) => [newC, ...prev])
    
    if (isSupabaseConfigured()) {
      await supabase.from('clientes').insert([newC])
    }
  }, [setClientes])

  return { clientes, setClientes, addCliente }
}

