import { useState, useEffect } from 'react'
import { supabase } from '../lib/supaBaseClient'

const PRECIOS_SERVICIOS = {
  "Depilación de Bozo": 200, "Depilación de Barbilla": 200, "Depilación de Cejas": 250,
  "Depilación de Axila": 450, "Depilación Bikini": 400, "Depilación Íntima": 950,
  "Depilación Entre Pierna": 300, "Depilación Media Pierna": 700, "Depilación Pierna Completa": 1400,
  "Depilación de Medio Brazo": 500, "Depilación Brazo Completo": 1000, "Tintado": 350,
  "Pestañas de Grupito": 600, "Pestañas Negritas Abiertas": 700, "Pestañas Doble": 1200,
  "Combo: Depilación + Tintado": 500, "Combo: Tintado + Pestañas": 800
};

const FormularioCita = () => {
  const [loading, setLoading] = useState(false)
  const [rangoTrabajo, setRangoTrabajo] = useState({ inicio: '09:00', fin: '18:00' })
  const [horasOcupadas, setHorasOcupadas] = useState([])
  
  const [formData, setFormData] = useState({
    nombre: '', telefono: '', servicio: 'Depilación de Cejas',
    precio: PRECIOS_SERVICIOS["Depilación de Cejas"], fecha: '', hora: '', estado: 'pendiente'
  })

  const formatear12h = (hora24) => {
    if (!hora24) return '';
    let [h, m] = hora24.split(':');
    let horas = parseInt(h);
    const ampm = horas >= 12 ? 'PM' : 'AM';
    horas = horas % 12 || 12;
    return `${horas}:${m} ${ampm}`;
  };

  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase.from('horarios_config').select('*').eq('id', 1).single();
      if (data) setRangoTrabajo({ inicio: data.hora_inicio, fin: data.hora_fin });
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (!formData.fecha) return;
    const fetchOcupadas = async () => {
      setHorasOcupadas([]);
      const { data } = await supabase.from('appointments').select('hora').eq('fecha', formData.fecha);
      if (data) {
        const ocupadas = data.map(c => {
          const [h, m] = c.hora.split(':');
          return `${h.padStart(2, '0')}:${m}`;
        });
        setHorasOcupadas(ocupadas);
      }
    };
    fetchOcupadas();
  }, [formData.fecha]);

  const calcularDisponibles = () => {
    const opciones = [];
    let hInicio = parseInt(rangoTrabajo.inicio.split(':')[0]);
    let hFin = parseInt(rangoTrabajo.fin.split(':')[0]);
    const ahora = new Date();
    const hoyFormateado = ahora.toLocaleDateString('en-CA');
    
    for (let h = hInicio; h <= hFin; h++) {
      ["00", "30"].forEach(min => {
        if (h === hFin && min === "30") return;
        const horaOpcion = `${h.toString().padStart(2, '0')}:${min}`;
        
        if (formData.fecha === hoyFormateado) {
          const [hActual, mActual] = [ahora.getHours(), ahora.getMinutes()];
          if (h < hActual || (h === hActual && parseInt(min) <= mActual)) return;
        }

        if (!horasOcupadas.includes(horaOpcion)) {
          opciones.push(horaOpcion);
        }
      });
    }
    return opciones;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: existe } = await supabase.from('appointments')
        .select('id').eq('fecha', formData.fecha).eq('hora', formData.hora).maybeSingle();

      if (existe) {
        alert("Esa hora se ocupó hace un momento. Elige otra.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('appointments').insert([formData]);
      if (error) throw error;
      
      alert('¡Cita agendada!');
      setFormData({ ...formData, nombre: '', telefono: '', fecha: '', hora: '' });
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const disponibles = calcularDisponibles();

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto">
      
      {/* NOMBRE CON PLACEHOLDER */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
        <input 
          type="text" required placeholder="María García"
          className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-[#ff477e] focus:ring-1 focus:ring-[#ff477e] transition-all"
          onChange={(e) => setFormData({...formData, nombre: e.target.value})}
          value={formData.nombre}
        />
      </div>

      {/* TELÉFONO CON PLACEHOLDER */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono</label>
        <input 
          type="tel" required placeholder="809-000-0000"
          className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-[#ff477e] focus:ring-1 focus:ring-[#ff477e] transition-all"
          onChange={(e) => setFormData({...formData, telefono: e.target.value})}
          value={formData.telefono}
        />
      </div>

      {/* SERVICIO CON PRECIO DINÁMICO */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Servicio</label>
        <div className="relative">
          <select 
            required
            className="w-full border border-gray-200 rounded-xl p-3 bg-white outline-none appearance-none focus:border-[#ff477e] focus:ring-1 focus:ring-[#ff477e] pr-28 transition-all"
            onChange={(e) => setFormData({ ...formData, servicio: e.target.value, precio: PRECIOS_SERVICIOS[e.target.value] })}
            value={formData.servicio}
          >
            {Object.keys(PRECIOS_SERVICIOS).map(srv => (
              <option key={srv} value={srv}>{srv}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
            <span className="text-[#ff477e] font-bold text-sm">${formData.precio}</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Fecha</label>
          <input 
            type="date" required
            min={new Date().toLocaleDateString('en-CA')}
            className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-[#ff477e]"
            onChange={(e) => setFormData({...formData, fecha: e.target.value})}
            value={formData.fecha}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Hora</label>
          <select 
            required disabled={!formData.fecha}
            className="w-full border border-gray-200 rounded-xl p-3 bg-white disabled:bg-gray-50 outline-none"
            onChange={(e) => setFormData({...formData, hora: e.target.value})}
            value={formData.hora}
          >
            <option value="">{formData.fecha ? 'Selecciona' : 'Elige día'}</option>
            {disponibles.map((h) => (
              <option key={h} value={h}>{formatear12h(h)}</option>
            ))}
          </select>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading || (formData.fecha && disponibles.length === 0)}
        className="w-full py-4 rounded-xl text-white bg-[#ff477e] font-black text-lg hover:bg-[#e63e70] disabled:bg-gray-300 transition-all shadow-md active:scale-95"
      >
        {loading ? 'Procesando...' : `Confirmar Cita - $${formData.precio}`}
      </button>
    </form>
  )
}

export default FormularioCita