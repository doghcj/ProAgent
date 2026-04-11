import { useEffect, useState } from 'react'
import { supabase } from '../lib/supaBaseClient'

const AdminPanel = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [rango, setRango] = useState({ inicio: '09:00', fin: '18:00' })
  const [guardandoHorario, setGuardandoHorario] = useState(false)

  const opcionesHorasAdmin = () => {
    const horas = [];
    for (let h = 0; h < 24; h++) {
      const horaPad = h.toString().padStart(2, '0');
      horas.push(`${horaPad}:00`);
      horas.push(`${horaPad}:30`);
    }
    return horas;
  };

  useEffect(() => {
    fetchAppointments()
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    const { data } = await supabase.from('horarios_config').select('*').eq('id', 1).single()
    if (data) setRango({ inicio: data.hora_inicio, fin: data.hora_fin })
  }

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

  const actualizarHorario = async () => {
    setGuardandoHorario(true)
    const { error } = await supabase
      .from('horarios_config')
      .update({ hora_inicio: rango.inicio, hora_fin: rango.fin })
      .eq('id', 1)

    if (error) alert("Error: " + error.message)
    else alert("✅ Horario actualizado")
    setGuardandoHorario(false)
  }

  const eliminarCita = async (id) => {
    if (window.confirm('¿Eliminar esta cita?')) {
      const { error } = await supabase.from('appointments').delete().eq('id', id)
      if (error) alert('Error: ' + error.message)
      else fetchAppointments()
    }
  }

  // --- FUNCIÓN CORREGIDA ---
  const toggleEstado = async (cita) => {
    // Si ya está completado no hacemos nada para evitar duplicados en el historial
    if (cita.estado === 'completado') return;

    const confirmacion = window.confirm(`¿Completar y archivar cita de ${cita.nombre}?`);
    if (!confirmacion) return;

    setLoading(true);
    try {
      // 1. Enviamos al historial
      const { error: insertError } = await supabase
        .from('appointments_history')
        .insert([{
          nombre: cita.nombre,
          telefono: cita.telefono,
          servicio: cita.servicio,
          fecha: cita.fecha,
          hora: cita.hora,
          estado: 'completado'
        }]);

      if (insertError) throw insertError;

      // 2. Borramos de la lista actual
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', cita.id);

      if (deleteError) throw deleteError;

      alert('✅ Cita completada y guardada en el historial.');
      fetchAppointments(); 

    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* CONFIGURACIÓN HORARIO */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">🕒 Configuración de Jornada</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase">Apertura</label>
            <select 
              value={rango.inicio}
              onChange={(e) => setRango({...rango, inicio: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
            >
              {opcionesHorasAdmin().map(hora => <option key={hora} value={hora}>{hora}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase">Cierre</label>
            <select 
              value={rango.fin}
              onChange={(e) => setRango({...rango, fin: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
            >
              {opcionesHorasAdmin().map(hora => <option key={hora} value={hora}>{hora}</option>)}
            </select>
          </div>
          <button onClick={actualizarHorario} className="bg-[#ff477e] text-white px-6 py-2 rounded-lg font-bold">
            {guardandoHorario ? '...' : 'Establecer Horario'}
          </button>
        </div>
      </div>

      {/* TABLA DE CITAS */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Citas Recibidas</h2>
        <button onClick={fetchAppointments} className="text-sm bg-gray-200 px-3 py-1 rounded">🔄 Refrescar</button>
      </div>

      {loading ? (
        <p className="text-center py-10">Cargando...</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Servicio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Fecha/Hora</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {appointments.map((cita) => (
                <tr key={cita.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{cita.nombre}</div>
                    <div className="text-sm text-gray-500">{cita.telefono}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold">{cita.servicio}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {cita.fecha} <b>| {cita.hora}</b>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleEstado(cita)} // <-- AQUÍ SE PASA EL OBJETO COMPLETO
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        cita.estado === 'completado' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {cita.estado === 'completado' ? '✓ Completado' : '⌛ Pendiente'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => eliminarCita(cita.id)} className="text-red-500 font-bold hover:bg-red-50 p-2 rounded">Eliminar</button>
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