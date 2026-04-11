import { useEffect, useState } from 'react'
import { supabase } from '../lib/supaBaseClient'

const AdminPanel = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [rango, setRango] = useState({ inicio: '09:00', fin: '18:00' })
  const [guardandoHorario, setGuardandoHorario] = useState(false)

  // ESTADOS PARA EL REPORTE
  const [reporte, setReporte] = useState(null)
  const [mostrarReporte, setMostrarReporte] = useState(false)

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

  // FUNCIÓN PARA GENERAR EL REPORTE DIARIO
  const generarReporteDiario = async () => {
    setLoading(true);
    const hoy = new Date().toLocaleDateString('en-CA'); // Obtiene YYYY-MM-DD local

    try {
      const { data, error } = await supabase
        .from('appointments_history')
        .select('*')
        .eq('fecha', hoy);

      if (error) throw error;

      const totalCitas = data.length;
      const serviciosCount = data.reduce((acc, cita) => {
        acc[cita.servicio] = (acc[cita.servicio] || 0) + 1;
        return acc;
      }, {});

      setReporte({ total: totalCitas, detalles: serviciosCount, fecha: hoy });
      setMostrarReporte(true);
    } catch (error) {
      alert("Error al generar reporte: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarCita = async (id) => {
    if (window.confirm('¿Eliminar esta cita?')) {
      const { error } = await supabase.from('appointments').delete().eq('id', id)
      if (error) alert('Error: ' + error.message)
      else fetchAppointments()
    }
  }

  const toggleEstado = async (cita) => {
    if (cita.estado === 'completado') return;

    const confirmacion = window.confirm(`¿Completar y archivar cita de ${cita.nombre}?`);
    if (!confirmacion) return;

    setLoading(true);
    try {
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
      {/* SECCIÓN SUPERIOR: HORARIO Y REPORTE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CONFIGURACIÓN HORARIO */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">🕒 Configuración</h3>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[100px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase">Apertura</label>
              <select 
                value={rango.inicio}
                onChange={(e) => setRango({...rango, inicio: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
              >
                {opcionesHorasAdmin().map(hora => <option key={`ini-${hora}`} value={hora}>{hora}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[100px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase">Cierre</label>
              <select 
                value={rango.fin}
                onChange={(e) => setRango({...rango, fin: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
              >
                {opcionesHorasAdmin().map(hora => <option key={`fin-${hora}`} value={hora}>{hora}</option>)}
              </select>
            </div>
            <button onClick={actualizarHorario} className="bg-[#ff477e] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#e63e70] transition-all">
              {guardandoHorario ? '...' : 'Guardar'}
            </button>
          </div>
        </div>

        {/* BOTÓN GENERAR REPORTE */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-sm flex flex-col justify-center items-center text-white">
          <p className="text-sm opacity-80 mb-2">¿Quieres ver cómo va el día?</p>
          <button 
            onClick={generarReporteDiario}
            className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg"
          >
            📊 Generar Reporte Diario
          </button>
        </div>
      </div>

      {/* MODAL / SECCIÓN DE REPORTE */}
      {mostrarReporte && reporte && (
        <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-xl relative animate-in fade-in duration-300">
          <button 
            onClick={() => setMostrarReporte(false)}
            className="absolute top-4 right-4 text-blue-400 hover:text-blue-600 font-bold"
          >
            ✕
          </button>
          <h3 className="text-blue-800 font-bold text-xl mb-4 flex items-center gap-2">
            📈 Resumen del Día ({reporte.fecha})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <span className="text-xs font-bold text-blue-400 uppercase">Clientas Atendidas</span>
              <p className="text-4xl font-black text-blue-600">{reporte.total}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <span className="text-xs font-bold text-blue-400 uppercase">Desglose de Servicios</span>
              <div className="mt-2 space-y-1">
                {Object.entries(reporte.detalles).length > 0 ? (
                  Object.entries(reporte.detalles).map(([nombre, cantidad]) => (
                    <div key={nombre} className="flex justify-between text-sm">
                      <span className="text-gray-600">{nombre}</span>
                      <span className="font-bold text-gray-800">x{cantidad}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs italic text-gray-400">No hay servicios completados hoy.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <hr className="border-gray-100" />

      {/* TABLA DE CITAS PENDIENTES */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Próximas Citas</h2>
        <button onClick={fetchAppointments} className="text-sm bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition-colors">
          🔄 Refrescar Lista
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 opacity-50">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
           <p>Cargando datos...</p>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-xl bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Servicio</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Fecha/Hora</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.length > 0 ? (
                appointments.map((cita) => (
                  <tr key={cita.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{cita.nombre}</div>
                      <div className="text-xs text-gray-500">{cita.telefono}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                        {cita.servicio}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {cita.fecha} <br />
                      <span className="text-gray-900 font-bold">{cita.hora}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleEstado(cita)}
                        className={`px-4 py-1.5 rounded-full text-xs font-black transition-all border-2 ${
                          cita.estado === 'completado' 
                            ? "bg-green-100 text-green-700 border-green-200 cursor-default" 
                            : "bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100"
                        }`}
                      >
                        {cita.estado === 'completado' ? '✓ LOGRADO' : '⌛ PENDIENTE'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => eliminarCita(cita.id)} 
                        className="text-red-400 hover:text-red-600 text-xs font-bold uppercase tracking-tighter p-2"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-400 italic">
                    No hay citas pendientes para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminPanel