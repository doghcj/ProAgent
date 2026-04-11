import { useState, useEffect } from 'react'
import { supabase } from '../lib/supaBaseClient'

// Función auxiliar para generar las horas (fuera del componente)
const generarOpcionesDeHora = (inicio, fin) => {
  const opciones = [];
  // Convertimos "09:00" a número 9
  let hInicio = parseInt(inicio.split(':')[0]);
  let hFin = parseInt(fin.split(':')[0]);

  for (let h = hInicio; h <= hFin; h++) {
    const horaFormateada = h.toString().padStart(2, '0');
    opciones.push(`${horaFormateada}:00`);
    // No agregar el :30 si es la última hora de cierre
    if (h < hFin) {
      opciones.push(`${horaFormateada}:30`);
    }
  }
  return opciones;
};

const FormularioCita = () => {
  const [loading, setLoading] = useState(false)
  const [rangoTrabajo, setRangoTrabajo] = useState({ inicio: '09:00', fin: '18:00' })
  
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    servicio: 'Depilación de Cejas',
    fecha: '',
    hora: '09:00',
    estado: 'pendiente'
  })

  // Cargar la configuración de Nancy al abrir la página
  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase
        .from('horarios_config')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (data) {
        setRangoTrabajo({ inicio: data.hora_inicio, fin: data.hora_fin });
        // Ponemos la hora inicial del rango como seleccionada por defecto
        setFormData(prev => ({ ...prev, hora: data.hora_inicio }));
      }
    };
    fetchConfig();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Verificar si la hora ya está ocupada para ese día
      const { data: existente, error: errorCheck } = await supabase
        .from('appointments')
        .select('id')
        .eq('fecha', formData.fecha)
        .eq('hora', formData.hora)
        .maybeSingle();

      if (errorCheck) throw errorCheck;

      if (existente) {
        alert(`Lo sentimos, la hora ${formData.hora} ya está reservada para este día. Por favor, elige otra.`);
        setLoading(false);
        return;
      }

      // 2. Insertar la cita
      const { error } = await supabase.from('appointments').insert([formData]);
      if (error) throw error;

      alert('¡Cita agendada con éxito!');
      
      // Limpiar formulario manteniendo el rango de trabajo
      setFormData({ 
        nombre: '', 
        telefono: '', 
        servicio: 'Depilación de Cejas', 
        fecha: '', 
        hora: rangoTrabajo.inicio, 
        estado: 'pendiente' 
      });

    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* NOMBRE */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
        <input 
          type="text" required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          onChange={(e) => setFormData({...formData, nombre: e.target.value})}
          value={formData.nombre}
        />
      </div>

      {/* TELÉFONO */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Teléfono</label>
        <input 
          type="tel" required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          onChange={(e) => setFormData({...formData, telefono: e.target.value})}
          value={formData.telefono}
        />
      </div>

      {/* SERVICIO */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Servicio</label>
        <select 
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
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

      {/* FECHA Y HORA DINÁMICA */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha</label>
          <input 
            type="date" required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            onChange={(e) => setFormData({...formData, fecha: e.target.value})}
            value={formData.fecha}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Hora</label>
          <select 
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
            onChange={(e) => setFormData({...formData, hora: e.target.value})}
            value={formData.hora}
          >
            {/* Generamos las opciones basadas en el rango que configuró Nancy */}
            {generarOpcionesDeHora(rangoTrabajo.inicio, rangoTrabajo.fin).map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#ff477e] hover:opacity-90 disabled:bg-gray-400 transition-all"
      >
        {loading ? 'Enviando...' : 'Confirmar Cita'}
      </button>
    </form>
  )
}

export default FormularioCita