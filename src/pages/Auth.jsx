import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { Hexagon, Mail, Lock, Loader2, ArrowRight } from 'lucide-react'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Revisa tu correo para confirmar tu cuenta.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-5 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-bg-elevated/80 backdrop-blur-xl border border-border-subtle rounded-3xl p-8 shadow-2xl relative z-10">
          
          <div className="flex justify-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-emerald-600 flex items-center justify-center shadow-glow">
              <Hexagon className="w-7 h-7 text-bg" fill="currentColor" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              {isLogin ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
            </h1>
            <p className="text-sm text-text-muted mt-2">
              {isLogin 
                ? 'Ingresa tus credenciales para acceder a tu panel.' 
                : 'Comienza a gestionar tu facturación electrónica hoy mismo.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
              {error === 'Invalid login credentials' ? 'Credenciales incorrectas.' : error}
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 rounded-xl bg-accent/10 border border-accent/20 text-accent text-sm text-center">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-text-primary mb-1.5">Correo electrónico</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full h-12 bg-bg-card border border-border-subtle rounded-xl pl-11 pr-4 text-[14px] text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-text-primary mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full h-12 bg-bg-card border border-border-subtle rounded-xl pl-11 pr-4 text-[14px] text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent transition-all outline-none"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 bg-accent hover:bg-accent-hover text-bg font-bold rounded-xl text-[14px] transition-all shadow-glow flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }}
              className="text-[13px] text-text-muted hover:text-text-primary transition-colors"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
