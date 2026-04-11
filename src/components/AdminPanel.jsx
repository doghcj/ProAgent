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
  const [fechaReporte, setFechaReporte] = useState(new Date().toLocaleDateString('en-CA'))

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
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true })

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

  const generarReporteDiario = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments_history')
        .select('*')
        .eq('fecha', fechaReporte);

      if (error) throw error;

      const totalCitas = data.length;
      const serviciosCount = data.reduce((acc, cita) => {
        acc[cita.servicio] = (acc[cita.servicio] || 0) + 1;
        return acc;
      }, {});

      setReporte({ total: totalCitas, detalles: serviciosCount, fecha: fechaReporte });
      setMostrarReporte(true);
    } catch (error) {
      alert("Error al obtener el reporte: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleEstado = async (cita) => {
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

  const eliminarCita = async (id) => {
    if(!window.confirm("¿Seguro que quieres eliminar esta cita? No se guardará en el historial.")) return;
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchAppointments();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* SECCIÓN SUPERIOR: HORARIO Y REPORTE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CONFIGURACIÓN HORARIO */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">🕒 Configuración de Jornada</h3>
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

        {/* BUSCADOR DE REPORTES */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-sm text-white flex flex-col justify-center">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">📊 Historial de Ventas</h3>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <input 
              type="date" 
              value={fechaReporte}
              onChange={(e) => setFechaReporte(e.target.value)}
              className="w-full sm:w-auto bg-gray-700 border border-gray-600 rounded-lg p-2 text-white outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button 
              onClick={generarReporteDiario}
              className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-lg font-bold transition-all shadow-lg"
            >
              Ver Reporte
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE REPORTE */}
      {mostrarReporte && reporte && (
        <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-xl relative animate-in fade-in duration-300">
          <button onClick={() => setMostrarReporte(false)} className="absolute top-4 right-4 text-blue-400 hover:text-blue-600 font-bold text-xl">✕</button>
          <h3 className="text-blue-800 font-bold text-xl mb-4 italic">📈 Resumen: {reporte.fecha}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm text-center">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Atendidas</span>
              <p className="text-4xl font-black text-blue-600">{reporte.total}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Servicios</span>
              <div className="mt-2 space-y-1">
                {Object.entries(reporte.detalles).map(([nombre, cantidad]) => (
                  <div key={nombre} className="flex justify-between text-sm border-b border-gray-50">
                    <span className="text-gray-600">{nombre}</span>
                    <span className="font-bold">x{cantidad}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <hr className="border-gray-100" />

      {/* TABLA DE CITAS */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Próximas Citas</h2>
        <button onClick={fetchAppointments} className="text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg border">🔄 Refrescar</button>
      </div>

      <div className="overflow-x-auto border rounded-xl bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-3 text-left">Cliente</th>
              <th className="px-6 py-3 text-left">Servicio</th>
              <th className="px-6 py-3 text-left">Fecha/Hora</th>
              <th className="px-6 py-3 text-center">Estado</th>
              <th className="px-6 py-3 text-right">Acciones</th>
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
                    <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">{cita.servicio}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {cita.fecha} <br /> <span className="font-bold text-gray-900">{cita.hora}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => toggleEstado(cita)} className="bg-yellow-50 text-yellow-600 border border-yellow-200 px-3 py-1 rounded-full text-[10px] font-black hover:bg-yellow-100">⌛ PENDIENTE</button>
                  </td>
                  <td className="px-6 py-4 text-right text-red-400 hover:text-red-600 font-bold cursor-pointer text-xs uppercase" onClick={() => eliminarCita(cita.id)}>Eliminar</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">No hay citas pendientes.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminPanel