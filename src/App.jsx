import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import Auth from './components/Auth'
import RegistroForm from './components/RegistroForm'
import Dashboard from './components/Dashboard'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('registro') // 'registro' | 'dashboard'
  const [registros, setRegistros] = useState([])
  const [loadingRegistros, setLoadingRegistros] = useState(false)

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Cargar registros cuando hay sesión
  useEffect(() => {
    if (session) fetchRegistros()
  }, [session])

  const fetchRegistros = async () => {
    setLoadingRegistros(true)
    const { data, error } = await supabase
      .from('registros_emocionales')
      .select('*')
      .eq('user_id', session.user.id)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false })
    if (!error) setRegistros(data || [])
    setLoadingRegistros(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <video src="/Meditating Fox.webm" autoPlay loop muted playsInline className="w-16 h-16 rounded-full object-cover mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!session) return <Auth />

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      {/* Background decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/70 border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <video src="/Meditating Fox.webm" autoPlay loop muted playsInline className="w-8 h-8 rounded-full object-cover" />
            <div>
              <h1 className="text-lg font-extrabold text-white leading-none">
                Inside<span className="text-yellow-400">Out</span>
              </h1>
              <p className="text-xs text-slate-500 leading-none">
                {session.user.email?.split('@')[0]}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-lg mx-auto px-4 pb-28 pt-6">
        {activeTab === 'registro' ? (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-white">¿Cómo te sientes?</h2>
              <p className="text-slate-400 text-sm mt-1">Registra tu estado emocional ahora</p>
            </div>
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-5 shadow-2xl">
              <RegistroForm
                userId={session.user.id}
                onRegistroGuardado={fetchRegistros}
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-white">Tu análisis</h2>
                <p className="text-slate-400 text-sm mt-1">
                  {registros.length} registro{registros.length !== 1 ? 's' : ''} en total
                </p>
              </div>
              <button
                onClick={fetchRegistros}
                disabled={loadingRegistros}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                title="Actualizar"
              >
                <svg className={`w-4 h-4 ${loadingRegistros ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <Dashboard registros={registros} />
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-900/80 border-t border-white/10">
        <div className="max-w-lg mx-auto px-6 py-2 flex justify-around">
          <button
            onClick={() => setActiveTab('registro')}
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-all ${
              activeTab === 'registro'
                ? 'bg-yellow-400/20 text-yellow-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="text-2xl">{activeTab === 'registro' ? '✨' : '📝'}</span>
            <span className="text-xs font-medium">Registrar</span>
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-all ${
              activeTab === 'dashboard'
                ? 'bg-purple-400/20 text-purple-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="text-2xl">{activeTab === 'dashboard' ? '📊' : '📈'}</span>
            <span className="text-xs font-medium">Análisis</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
