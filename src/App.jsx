import { useState, useEffect } from 'react'
import { supabase } from './lib/supaBaseClient'
import FormularioCita from './components/FormularioCita'
import AdminPanel from './components/AdminPanel'
import Login from './components/Login'

// Al principio de tu archivo App.jsx
import logo from './assets/favicon.svg' // Ajusta la ruta si es necesario
// ...otras importaciones como supabase
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
    <div className="min-h-screen bg-[#FFFFFF] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Cabecera con Logo y Título */}
<div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-[#ff477e] p-6 rounded-lg shadow-md gap-4">
  <div className="flex items-center gap-4">
    {/* Imagen del Logo */}
    <img 
      src={logo} 
      alt="Logo Nancy" 
      className="h-16 w-16 object-contain bg-white rounded-full p-1" 
    />
    <div>
      <h1 className="text-2xl font-bold text-white leading-tight">
        Nancy <span className="block text-lg font-normal">Cejas y Pestañas</span>
      </h1>
    </div>
  </div>

  <div className="flex gap-4">
    <button 
      onClick={() => setIsAdminMode(!isAdminMode)} 
      className="text-sm font-bold text-white bg-black/20 px-3 py-2 rounded-lg hover:bg-black/30 transition"
    >
      {isAdminMode ? "← Volver" : "Panel Admin 🔑"}
    </button>
    
    {session && isAdminMode && (
      <button 
        onClick={handleLogout}
        className="text-sm font-bold text-white bg-red-600 px-3 py-2 rounded-lg hover:bg-red-700 transition"
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