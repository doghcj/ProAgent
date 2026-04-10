import { useState } from 'react'
import { supabase } from '../lib/supaBaseClient'

const FormularioCita = () => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    servicio: 'Consultoría', // Valor por defecto
    fecha: '',
    hora: ''
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
      // Limpiar formulario
      setFormData({ nombre: '', telefono: '', servicio: 'Consultoría', fecha: '', hora: '' })
      
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          <input 
            type="time" 
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            onChange={(e) => setFormData({...formData, hora: e.target.value})}
            value={formData.hora}
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
      >
        {loading ? 'Enviando...' : 'Confirmar Cita'}
      </button>
    </form>
  )
}

export default FormularioCita