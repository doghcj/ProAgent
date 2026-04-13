import { useEffect, useState } from 'react'
import { supabase } from '../lib/supaBaseClient'

const SERVICIOS_LISTA = [
  { nombre: "Depilación de Bozo", precio: 200 },
  { nombre: "Depilación de Barbilla", precio: 200 },
  { nombre: "Depilación de Cejas", precio: 250 },
  { nombre: "Depilación de Axila", precio: 450 },
  { nombre: "Depilación Bikini", precio: 400 },
  { nombre: "Depilación Íntima", precio: 950 },
  { nombre: "Depilación Entre Pierna", precio: 300 },
  { nombre: "Depilación Media Pierna", precio: 700 },
  { nombre: "Depilación Pierna Completa", precio: 1400 },
  { nombre: "Depilación de Medio Brazo", precio: 500 },
  { nombre: "Depilación Brazo Completo", precio: 1000 },
  { nombre: "Tintado", precio: 350 },
  { nombre: "Pestañas de Grupito", precio: 600 },
  { nombre: "Pestañas Negritas Abiertas", precio: 700 },
  { nombre: "Pestañas Doble", precio: 1200 },
  { nombre: "Combo: Depilación + Tintado", precio: 500 },
  { nombre: "Combo: Tintado + Pestañas", precio: 800 }
];

const FormularioCita = () => {
  const [loading, setLoading] = useState(false)
  const [estaAbierto, setEstaAbierto] = useState(true) // Nuevo estado
  const [rangoTrabajo, setRangoTrabajo] = useState({ inicio: '09:00', fin: '19:00' })
  const [horasOcupadas, setHorasOcupadas] = useState([])
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([])
  
  const [formData, setFormData] = useState({
    nombre: '', telefono: '', fecha: '', hora: '', estado: 'pendiente'
  })

  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase.from('horarios_config').select('*').eq('id', 1).single();
      if (data) {
        setRangoTrabajo({ inicio: data.hora_inicio, fin: data.hora_fin });
        setEstaAbierto(data.local_abierto); // Sincroniza con el Admin Panel
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (!formData.fecha) return;
    const fetchOcupadas = async () => {
      const { data } = await supabase.from('appointments').select('hora').eq('fecha', formData.fecha);
      if (data) setHorasOcupadas(data.map(c => c.hora.split(':')[0] + ":00")); 
    };
    fetchOcupadas();
  }, [formData.fecha]);

  const toggleServicio = (servicio) => {
    if (serviciosSeleccionados.find(s => s.nombre === servicio.nombre)) {
      setServiciosSeleccionados(serviciosSeleccionados.filter(s => s.nombre !== servicio.nombre));
    } else {
      setServiciosSeleccionados([...serviciosSeleccionados, servicio]);
    }
  };

  const totalPrecio = serviciosSeleccionados.reduce((acc, s) => acc + s.precio, 0);

  const calcularHorasCerradas = () => {
    const opciones = [];
    let hInicio = parseInt(rangoTrabajo.inicio.split(':')[0]);
    let hFin = parseInt(rangoTrabajo.fin.split(':')[0]);
    const ahora = new Date();
    const hoy = ahora.toLocaleDateString('en-CA');

    for (let h = hInicio; h <= hFin; h++) {
      const horaOpcion = `${h.toString().padStart(2, '0')}:00`;
      if (formData.fecha === hoy) {
        if (h <= ahora.getHours()) continue;
      }
      if (!horasOcupadas.includes(horaOpcion)) {
        opciones.push(horaOpcion);
      }
    }
    return opciones;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!estaAbierto) return alert("Lo sentimos, el local está cerrado temporalmente.");
    if (serviciosSeleccionados.length === 0) return alert("Elige al menos un servicio");
    
    setLoading(true);
    const payload = {
      ...formData,
      servicio: serviciosSeleccionados.map(s => s.nombre).join(', '),
      precio: totalPrecio
    };

    try {
      const { error } = await supabase.from('appointments').insert([payload]);
      if (error) throw error;
      alert('✨ ¡Cita agendada con éxito!');
      setFormData({ nombre: '', telefono: '', fecha: '', hora: '', estado: 'pendiente' });
      setServiciosSeleccionados([]);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Si el local está cerrado, mostramos un mensaje amigable en lugar del formulario
  if (!estaAbierto) {
    return (
      <div className="max-w-lg mx-auto p-10 bg-white rounded-3xl shadow-xl text-center border-2 border-red-50 mt-10">
        <div className="text-6xl mb-4">🏠</div>
        <h2 className="text-2xl font-black text-gray-800 italic">Local Cerrado</h2>
        <p className="text-gray-500 mt-2 font-medium">
          Nancy no está recibiendo citas en este momento.
        </p>
        <div className="mt-6 p-4 bg-red-50 rounded-2xl text-red-600 text-sm font-bold">
          Por favor, intenta más tarde o contáctanos por WhatsApp.
        </div>
        <footer className="mt-10 pt-6 border-t border-gray-100">
           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} Nancy Cejas y Pestañas
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 flex flex-col min-h-[90vh]">
      <div className="flex-grow">
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input 
              type="text" required placeholder="Nombre"
              className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-[#ff477e]"
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              value={formData.nombre}
            />
            <input 
              type="tel" required placeholder="Teléfono"
              className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-[#ff477e]"
              onChange={(e) => setFormData({...formData, telefono: e.target.value})}
              value={formData.telefono}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Servicios deseados:</label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 border rounded-xl bg-gray-50">
              {SERVICIOS_LISTA.map((srv) => (
                <div 
                  key={srv.nombre}
                  onClick={() => toggleServicio(srv)}
                  className={`p-2 px-4 rounded-lg border cursor-pointer transition-all flex justify-between items-center text-sm ${
                    serviciosSeleccionados.find(s => s.nombre === srv.nombre) 
                    ? 'bg-[#ff477e] text-white border-[#ff477e]' 
                    : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  <span>{srv.nombre}</span>
                  <span className="font-bold">${srv.precio}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input 
              type="date" required
              min={new Date().toLocaleDateString('en-CA')}
              className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-[#ff477e]"
              onChange={(e) => setFormData({...formData, fecha: e.target.value})}
              value={formData.fecha}
            />
            <select 
              required disabled={!formData.fecha}
              className="w-full border border-gray-200 rounded-xl p-3 bg-white outline-none focus:border-[#ff477e]"
              onChange={(e) => setFormData({...formData, hora: e.target.value})}
              value={formData.hora}
            >
              <option value="">Hora</option>
              {calcularHorasCerradas().map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 rounded-xl text-white bg-[#ff477e] font-black text-xl hover:bg-[#e63e70] transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Agendando...' : `Confirmar - $${totalPrecio}`}
          </button>
        </form>
      </div>

      {/* FOOTER DE COPYRIGHT */}
      <footer className="mt-8 py-6 text-center">
        <div className="flex flex-col items-center justify-center space-y-1">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} Nancy Cejas y Pestañas
          </p>
          <p className="text-xs text-gray-500 font-medium">
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

export default FormularioCita