import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import { useAuth, isSupabaseConfigured } from './store/useAppStore'
import Dashboard from './pages/Dashboard'
import Facturacion from './pages/Facturacion'
import Transacciones from './pages/Transacciones'
import Clientes from './pages/Clientes'
import Configuracion from './pages/Configuracion'

export default function App() {
  const { session, loading } = useAuth()

  // Si Supabase está configurado pero aún está verificando sesión
  if (isSupabaseConfigured() && loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Si está configurado y no hay sesión, mostrar Login
  if (isSupabaseConfigured() && !session) {
    return <Auth />
  }

  // Si hay sesión o Supabase no está configurado (modo local), mostrar la app
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/facturacion" element={<Facturacion />} />
        <Route path="/transacciones" element={<Transacciones />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/configuracion" element={<Configuracion />} />
      </Routes>
    </Layout>
  )
}
