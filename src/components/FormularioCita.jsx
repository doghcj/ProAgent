import { useState } from 'react'
import { supabase } from '../lib/supaBaseClient'

const FormularioCita = () => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    servicio: 'Depilación de Cejas', // 1. Cambiado valor por defecto
    fecha: '',
    hora: '9:00', // 1. Cambiado valor por defecto
    estado: 'pendiente' // Aseguramos que nazca como pendiente
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('appointments')
        .insert([formData])

      if (error) throw error
      
      alert('¡Cita agendada con éxito!')
      
      // 3. Limpiar formulario con el servicio inicial
      setFormData({ 
        nombre: '', 
        telefono: '', 
        servicio: 'Depilación de Cejas', 
        fecha: '', 
        hora: '',
        estado: 'pendiente'
      })
      
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* NOMBRE */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
        <input 
          type="text" 
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          onChange={(e) => setFormData({...formData, nombre: e.target.value})}
          value={formData.nombre}
        />
      </div>

      {/* TELÉFONO */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Teléfono</label>
        <input 
          type="tel" 
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          onChange={(e) => setFormData({...formData, telefono: e.target.value})}
          value={formData.telefono}
        />
      </div>

      {/* 2. NUEVO COMBOBOX DE SERVICIOS */}
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

      {/* FECHA Y HORA */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha</label>
          <input 
            type="date" 
            required
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
    <option value="09:00">09:00 AM</option>
    <option value="09:30">09:30 AM</option>
    <option value="10:00">10:00 AM</option>
    <option value="10:30">10:30 AM</option>
    <option value="11:00">11:00 AM</option>
    <option value="11:30">11:30 AM</option>
    <option value="12:00">12:00 PM</option>
    <option value="12:30">12:30 PM</option>
    <option value="01:00">01:00 PM</option>
    <option value="01:30">01:30 PM</option>
    <option value="02:00">02:00 PM</option>
    <option value="02:30">02:30 PM</option>
    <option value="03:00">03:00 PM</option>
    <option value="03:30">03:30 PM</option>
    <option value="04:00">04:00 PM</option>
    <option value="04:30">04:30 PM</option>
    <option value="05:00">05:00 PM</option>
    <option value="05:30">05:30 PM</option>
    <option value="06:00">06:00 PM</option>
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