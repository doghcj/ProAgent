import { useState, useEffect } from 'react'
import { supabase } from '../lib/supaBaseClient'

const FormularioCita = () => {
  const [loading, setLoading] = useState(false)
  const [rangoTrabajo, setRangoTrabajo] = useState({ inicio: '09:00', fin: '18:00' })
  const [horasOcupadas, setHorasOcupadas] = useState([])
  
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    servicio: 'Depilación de Cejas',
    fecha: '',
    hora: '',
    estado: 'pendiente'
  })

  // 1. Cargar configuración de jornada (Apertura y Cierre)
  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase
        .from('horarios_config')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (data) {
        setRangoTrabajo({ inicio: data.hora_inicio, fin: data.hora_fin });
      }
    };
    fetchConfig();
  }, []);

  // 2. Cada vez que cambie la fecha, buscamos qué horas ya están tomadas en Supabase
  useEffect(() => {
    if (!formData.fecha) return;

    const fetchOcupadas = async () => {
      const { data } = await supabase
        .from('appointments')
        .select('hora')
        .eq('fecha', formData.fecha);
      
      const ocupadas = data ? data.map(c => c.hora) : [];
      setHorasOcupadas(ocupadas);

      // Auto-seleccionar la primera hora disponible del nuevo día
      const disponibles = calcularDisponibles(ocupadas);
      if (disponibles.length > 0) {
        setFormData(prev => ({ ...prev, hora: disponibles[0] }));
      }
    };
    fetchOcupadas();
  }, [formData.fecha]);

  // 3. Lógica para filtrar horas (Pasadas + Ocupadas)
  const calcularDisponibles = (ocupadas) => {
    const opciones = [];
    let hInicio = parseInt(rangoTrabajo.inicio.split(':')[0]);
    let hFin = parseInt(rangoTrabajo.fin.split(':')[0]);

    const ahora = new Date();
    // Formato YYYY-MM-DD local
    const hoyFormateado = ahora.toLocaleDateString('en-CA');
    const esHoy = formData.fecha === hoyFormateado;
    const horaActual = ahora.getHours();
    const minutosActuales = ahora.getMinutes();

    for (let h = hInicio; h <= hFin; h++) {
      ["00", "30"].forEach(min => {
        // No permitir agendar en la última media hora si es la hora de cierre
        if (h === hFin && min === "30") return;

        const horaOpcion = `${h.toString().padStart(2, '0')}:${min}`;
        
        // Validar si la hora ya pasó (solo si la fecha es hoy)
        let yaPaso = false;
        if (esHoy) {
          if (h < horaActual) yaPaso = true;
          if (h === horaActual && parseInt(min) <= minutosActuales) yaPaso = true;
        }

        // Validar si está en la lista de ocupadas
        const estaOcupada = ocupadas.includes(horaOpcion);

        if (!yaPaso && !estaOcupada) {
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
      // Doble verificación: ¿Alguien tomó la hora mientras llenaba el form?
      const { data: choque } = await supabase
        .from('appointments')
        .select('id')
        .eq('fecha', formData.fecha)
        .eq('hora', formData.hora)
        .maybeSingle();

      if (choque) {
        alert("¡Lo sentimos! Esta hora acaba de ser reservada. Por favor selecciona otra.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('appointments').insert([formData]);
      if (error) throw error;

      alert('¡Cita agendada con éxito!');
      setFormData({ ...formData, nombre: '', telefono: '', fecha: '' });
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const horasDisponibles = calcularDisponibles(horasOcupadas);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
        <input 
          type="text" required placeholder="Ej. María García"
          className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#ff477e] outline-none"
          onChange={(e) => setFormData({...formData, nombre: e.target.value})}
          value={formData.nombre}
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono</label>
        <input 
          type="tel" required placeholder="809-000-0000"
          className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#ff477e] outline-none"
          onChange={(e) => setFormData({...formData, telefono: e.target.value})}
          value={formData.telefono}
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Servicio</label>
        <select 
          required
          className="w-full border border-gray-300 rounded-lg p-2.5 bg-white outline-none"
          onChange={(e) => setFormData({...formData, servicio: e.target.value})}
          value={formData.servicio}
        >
          <option value="Depilación de Cejas">Depilación de Cejas</option>
          <option value="Tintado de Cejas">Tintado de Cejas</option>
          <option value="Combo: Depilación + Tintado">Combo: Depilación + Tintado</option>
          <option value="Lifting de Pestañas">Lifting de Pestañas</option>
          <option value="Extensión de Pestañas">Extensión de Pestañas</option>
          <option value="Limpieza Facial">Limpieza Facial</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Fecha</label>
          <input 
            type="date" required
            min={new Date().toLocaleDateString('en-CA')}
            className="w-full border border-gray-300 rounded-lg p-2.5 outline-none"
            onChange={(e) => setFormData({...formData, fecha: e.target.value})}
            value={formData.fecha}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Hora</label>
          <select 
            required
            disabled={!formData.fecha}
            className="w-full border border-gray-300 rounded-lg p-2.5 bg-white disabled:bg-gray-50 outline-none"
            onChange={(e) => setFormData({...formData, hora: e.target.value})}
            value={formData.hora}
          >
            {!formData.fecha && <option>Elige día</option>}
            {horasDisponibles.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
            {formData.fecha && horasDisponibles.length === 0 && (
              <option disabled>No hay turnos hoy</option>
            )}
          </select>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading || (formData.fecha && horasDisponibles.length === 0)}
        className="w-full py-3 px-4 rounded-lg text-white bg-[#ff477e] font-black text-lg hover:bg-[#e63e70] disabled:bg-gray-300 transition-all shadow-md"
      >
        {loading ? 'Reservando...' : 'Confirmar Cita'}
      </button>
      
      {formData.fecha && horasDisponibles.length === 0 && (
        <p className="text-center text-red-500 text-xs font-bold">⚠️ Ya no quedan horarios disponibles para este día.</p>
      )}
    </form>
  )
}

export default FormularioCita