import { useEffect, useState } from 'react'
import { supabase } from '../lib/supaBaseClient'

const AdminPanel = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [rango, setRango] = useState({ inicio: '08:00', fin: '18:00' })
  const [guardandoHorario, setGuardandoHorario] = useState(false)

  const [reporte, setReporte] = useState(null)
  const [mostrarReporte, setMostrarReporte] = useState(false)
  const [fechaReporte, setFechaReporte] = useState(new Date().toLocaleDateString('en-CA'))
  const [estaAbierto, setEstaAbierto] = useState(true);

  const formatear12h = (hora24) => {
    if (!hora24) return '';
    let [h, m] = hora24.split(':');
    let horas = parseInt(h);
    const ampm = horas >= 12 ? 'PM' : 'AM';
    horas = horas % 12 || 12;
    return `${horas}:${m} ${ampm}`;
  };

  const opcionesHorasAdmin = () => {
    const horas = [];
    for (let h = 8; h <= 23; h++) { 
      const horaPad = h.toString().padStart(2, '0');
      horas.push(`${horaPad}:00`);
    }
    return horas;
  };

  useEffect(() => {
    fetchAppointments()
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    const { data } = await supabase.from('horarios_config').select('*').eq('id', 1).single()
    if (data) {
      setRango({ inicio: data.hora_inicio, fin: data.hora_fin });
      setEstaAbierto(data.local_abierto);
    }
  }

  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });

    if (error) {
      console.error('Error:', error);
    } else {
      setAppointments(data);
    }
    setLoading(false);
  };

  const toggleCierreLocal = async () => {
    const nuevoEstado = !estaAbierto;
    const { error } = await supabase
      .from('horarios_config')
      .update({ local_abierto: nuevoEstado })
      .eq('id', 1);

    if (!error) {
      setEstaAbierto(nuevoEstado);
      alert(nuevoEstado ? "✅ Local Abierto: Los clientes pueden agendar." : "🔒 Local Cerrado: Citas bloqueadas.");
    }
  };

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

  // ... (Tus funciones de reporte, toggleEstado y eliminarCita se mantienen igual)
  const generarReporteDiario = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments_history')
        .select('servicio, precio')
        .eq('fecha', fechaReporte);
      if (error) throw error;
      const totalCitas = data.length;
      const ingresosTotal = data.reduce((sum, cita) => sum + (Number(cita.precio) || 0), 0);
      const serviciosCount = {};
      data.forEach(cita => {
        const listaServicios = cita.servicio.split(',').map(s => s.trim());
        listaServicios.forEach(nombreSrv => {
          if (nombreSrv) {
            serviciosCount[nombreSrv] = (serviciosCount[nombreSrv] || 0) + 1;
          }
        });
      });
      setReporte({ total: totalCitas, detalles: serviciosCount, ingresos: ingresosTotal, fecha: fechaReporte });
      setMostrarReporte(true);
    } catch (error) {
      alert("Error: " + error.message);
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
          nombre: cita.nombre, telefono: cita.telefono, servicio: cita.servicio,
          precio: cita.precio, fecha: cita.fecha, hora: cita.hora, estado: 'completado'
        }]);
      if (insertError) throw insertError;
      const { error: deleteError } = await supabase.from('appointments').delete().eq('id', cita.id);
      if (deleteError) throw deleteError;
      alert('✅ Cita completada.');
      fetchAppointments(); 
    } catch (error) {
      alert('Error: ' + error.message);
    } finally { setLoading(false); }
  };

  const eliminarCita = async (id) => {
    if(!window.confirm("¿Seguro?")) return;
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchAppointments();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 min-h-screen flex flex-col">
      <div className="flex-grow space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* CONFIGURACION DE JORNADA */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🕒 Configuración de Jornada</h3>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[120px]">
                <label className="text-xs font-semibold text-gray-500 uppercase">Apertura</label>
                <select value={rango.inicio} onChange={(e) => setRango({...rango, inicio: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white">
                  {opcionesHorasAdmin().map(hora => <option key={`ini-${hora}`} value={hora}>{formatear12h(hora)}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-xs font-semibold text-gray-500 uppercase">Cierre</label>
                <select value={rango.fin} onChange={(e) => setRango({...rango, fin: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white">
                  {opcionesHorasAdmin().map(hora => <option key={`fin-${hora}`} value={hora}>{formatear12h(hora)}</option>)}
                </select>
              </div>
              
              {/* BOTONES DE ACCIÓN */}
              <div className="flex gap-2 w-full sm:w-auto mt-2">
                <button 
                  onClick={actualizarHorario} 
                  className="flex-1 sm:flex-none bg-[#ff477e] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#e63e70] transition-colors"
                >
                  {guardandoHorario ? '...' : 'Guardar'}
                </button>
                
                <button 
                  onClick={toggleCierreLocal}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-black text-white transition-all shadow-sm ${
                    estaAbierto 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-red-600 animate-pulse'
                  }`}
                >
                  {estaAbierto ? '🔓 ABIERTO' : '🔒 CERRADO'}
                </button>
              </div>
            </div>
            {!estaAbierto && (
              <p className="mt-3 text-[10px] font-black text-red-500 uppercase">
                ⚠️ El local está cerrado. Nadie puede agendar citas.
              </p>
            )}
          </div>

          {/* REPORTE */}
          <div className="bg-gray-800 p-6 rounded-xl text-white">
            <h3 className="text-lg font-bold mb-4 text-blue-400">📊 Reporte Diario</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="date" value={fechaReporte} onChange={(e) => setFechaReporte(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg p-2 text-white outline-none" />
              <button onClick={generarReporteDiario} className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-lg font-bold transition-all shadow-md">Ver Reporte</button>
            </div>
          </div>
        </div>

        {/* MODAL REPORTE */}
        {mostrarReporte && reporte && (
          <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-xl relative animate-in fade-in">
            <button onClick={() => setMostrarReporte(false)} className="absolute top-4 right-4 text-blue-400 font-bold text-xl">✕</button>
            <h3 className="text-blue-800 font-bold text-xl mb-4 italic">📈 Resumen: {reporte.fecha}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-blue-100 text-center shadow-sm">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Citas del día</span>
                <p className="text-4xl font-black text-blue-600">{reporte.total}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center shadow-sm">
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Ingresos</span>
                <p className="text-4xl font-black text-green-600">${reporte.ingresos}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-100 overflow-y-auto max-h-40 shadow-sm">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Servicios Desglosados</span>
                <div className="mt-2 space-y-1">
                  {Object.entries(reporte.detalles).map(([nombre, cantidad]) => (
                    <div key={nombre} className="flex justify-between text-xs border-b border-gray-50 pb-1">
                      <span className="text-gray-600 truncate mr-2">{nombre}</span>
                      <span className="font-black text-blue-700">x{cantidad}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABLA CITAS */}
        <div className="overflow-x-auto border rounded-xl bg-white shadow-sm mt-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-3 text-left">Cliente</th>
                <th className="px-6 py-3 text-left">Servicios Elegidos</th>
                <th className="px-6 py-3 text-left">Horario</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-400 italic">No hay citas pendientes ✨</td>
                </tr>
              ) : (
                appointments.map((cita) => (
                  <tr key={cita.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{cita.nombre}</div>
                      <div className="text-[10px] text-gray-500">{cita.telefono}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 mb-1">
                        {cita.servicio.split(',').map((s, i) => (
                          <span key={i} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{s.trim()}</span>
                        ))}
                      </div>
                      <div className="text-sm font-black text-green-600">${cita.precio}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600">{cita.fecha}</div>
                      <div className="font-bold text-gray-900 text-sm">{formatear12h(cita.hora)}</div>
                    </td>
                    <td className="px-6 py-4 flex items-center justify-end gap-3">
                      <button 
                        onClick={() => {
                          const num = cita.telefono.replace(/\D/g,'');
                          const msg = `Hola ${cita.nombre}, te escribo de Nancy Cejas y Pestañas. Confirmamos tu cita para el ${cita.fecha} a las ${formatear12h(cita.hora)}. ¡Te esperamos!`;
                          window.open(`https://wa.me/1${num}?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="text-green-500 hover:text-green-600 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.41.001 12.045a11.871 11.871 0 001.592 5.953L0 24l6.149-1.613a11.833 11.833 0 005.9 1.554h.005c6.634 0 12.045-5.411 12.047-12.047a11.85 11.85 0 00-3.535-8.528"/>
                        </svg>
                      </button>
                      <button onClick={() => toggleEstado(cita)} className="bg-yellow-50 text-yellow-600 border border-yellow-200 px-3 py-1 rounded-full text-[10px] font-black hover:bg-yellow-100 transition-all shadow-sm">⌛ COMPLETAR</button>
                      <button onClick={() => eliminarCita(cita.id)} className="text-red-400 hover:text-red-600 font-bold text-[10px] uppercase">Borrar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FIRMA PROFESIONAL / COPYRIGHT */}
      <footer className="mt-12 py-8 border-t border-gray-100 text-center">
        <div className="flex flex-col items-center justify-center space-y-1">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} Nancy Cejas y Pestañas
          </p>
          <p className="text-xs text-gray-600 font-medium">
            Diseñado y Desarrollado por 
            <span className="text-[#ff477e] font-black italic"> Edwin Almonte</span>
          </p>
          <a 
            href="mailto:edwintatis6@gmail.com" 
            className="text-[10px] text-blue-400 hover:text-blue-600 transition-colors font-mono"
          >
            edwintatis6@gmail.com
          </a>
        </div>
      </footer>
    </div>
  )
}

export default AdminPanel