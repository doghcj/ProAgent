import { useState, useEffect } from 'react'
import { supabase } from './lib/supaBaseClient'
import FormularioCita from './components/FormularioCita'
import AdminPanel from './components/AdminPanel'
import Login from './components/Login'

function App() {
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [session, setSession] = useState(null)

  // 1. Escuchar el estado de la sesión (si hay alguien logueado)
  useEffect(() => {
    // Revisar sesión actual al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Escuchar cambios (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 2. Función para cerrar sesión de verdad
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setIsAdminMode(false) // Te manda de vuelta al formulario
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabecera con botones de navegación */}
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
          <h1 className="text-xl font-bold text-gray-800">AgendaPro</h1>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsAdminMode(!isAdminMode)} 
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              {isAdminMode ? "← Volver al Formulario" : "Panel Admin 🔑"}
            </button>
            
            {session && isAdminMode && (
              <button 
                onClick={handleLogout}
                className="text-sm font-medium text-red-500 border border-red-200 px-2 py-1 rounded hover:bg-red-50"
              >
                Cerrar Sesión
              </button>
            )}
          </div>
        </div>

        {/* Lógica de vistas */}
        <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
          {isAdminMode ? (
            !session ? (
              <Login onLogin={(user) => setSession(user)} />
            ) : (
              <AdminPanel />
            )
          ) : (
            <FormularioCita />
          )}
        </div>
        
      </div>
    </div>
  )
}

export default App