import { useEffect, useState } from 'react'
import { supabase } from '../lib/supaBaseClient'

const AdminPanel = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  // 1. Función para ELIMINAR (la puse aquí arriba como pediste)
  const eliminarCita = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)

      if (error) {
        alert('Error al eliminar: ' + error.message)
      } else {
        fetchAppointments() // Recarga la lista automáticamente tras borrar
      }
    }
  }

  // 2. Función para traer las citas
  const fetchAppointments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error('Error:', error)
    else setAppointments(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Citas Recibidas</h2>
        <button 
          onClick={fetchAppointments}
          className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded shadow"
        >
          🔄 Actualizar
        </button>
      </div>

      {loading ? (
        <p>Cargando citas...</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map((cita) => (
                <tr key={cita.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{cita.nombre}</div>
                    <div className="text-sm text-gray-500">{cita.telefono}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                      {cita.servicio}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {cita.fecha} a las {cita.hora}
                  </td>
                  {/* AQUÍ ESTÁ LA CELDA DEL BOTÓN ELIMINAR */}
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => eliminarCita(cita.id)}
                      className="text-red-500 hover:text-red-700 font-bold p-2 hover:bg-red-50 rounded transition-all"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminPanel