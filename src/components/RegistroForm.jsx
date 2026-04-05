import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { EMOCIONES } from '../lib/emociones'

const hoy = () => new Date().toISOString().split('T')[0]
const ahora = () => new Date().toTimeString().slice(0, 5)

export default function RegistroForm({ userId, onRegistroGuardado }) {
  const [emocion, setEmocion] = useState(null)
  const [nivel, setNivel] = useState(3)
  const [fecha, setFecha] = useState(hoy())
  const [hora, setHora] = useState(ahora())
  const [descripcion, setDescripcion] = useState('')
  const [pensamiento, setPensamiento] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const emocionObj = EMOCIONES.find(e => e.nombre === emocion)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!emocion) { setError('Selecciona una emoción'); return }
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('registros_emocionales').insert({
      fecha,
      hora,
      emocion,
      nivel,
      descripcion,
      pensamiento_automatico: pensamiento,
      user_id: userId,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setEmocion(null)
        setNivel(3)
        setFecha(hoy())
        setHora(ahora())
        setDescripcion('')
        setPensamiento('')
        onRegistroGuardado?.()
      }, 1500)
    }
  }

  const nivelLabels = ['', 'Muy leve', 'Leve', 'Moderado', 'Intenso', 'Muy intenso']
  const nivelColors = ['', 'bg-green-400', 'bg-lime-400', 'bg-yellow-400', 'bg-orange-400', 'bg-red-500']

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Selector de emoción */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          ¿Cómo te sientes?
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {EMOCIONES.map(em => (
            <button
              key={em.nombre}
              type="button"
              onClick={() => setEmocion(em.nombre)}
              className={`
                relative flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all duration-200
                ${emocion === em.nombre
                  ? `${em.borderColor} ${em.color} bg-opacity-20 scale-105 shadow-lg`
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
                }
              `}
            >
              <span className="text-2xl">{em.emoji}</span>
              <span className="text-xs font-medium text-white leading-tight text-center">{em.nombre}</span>
              {emocion === em.nombre && (
                <div className={`absolute -top-1 -right-1 w-4 h-4 ${em.color} rounded-full border-2 border-slate-900 flex items-center justify-center`}>
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Slider de intensidad */}
      {emocion && (
        <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Intensidad</h3>
            <span className={`text-xs font-bold px-3 py-1 rounded-full text-white ${nivelColors[nivel]}`}>
              {nivel}/5 — {nivelLabels[nivel]}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg">😌</span>
            <input
              type="range"
              min={1}
              max={5}
              value={nivel}
              onChange={e => setNivel(Number(e.target.value))}
              className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-yellow-400"
              style={{
                background: `linear-gradient(to right, ${emocionObj?.colorHex || '#facc15'} 0%, ${emocionObj?.colorHex || '#facc15'} ${(nivel - 1) * 25}%, rgba(255,255,255,0.1) ${(nivel - 1) * 25}%, rgba(255,255,255,0.1) 100%)`
              }}
            />
            <span className="text-lg">🔥</span>
          </div>
          {/* Puntos visuales */}
          <div className="flex justify-between mt-2 px-6">
            {[1,2,3,4,5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setNivel(n)}
                className={`w-6 h-6 rounded-full text-xs font-bold transition-all ${
                  n <= nivel ? `${emocionObj?.color || 'bg-yellow-400'} text-white scale-110` : 'bg-white/10 text-slate-500'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fecha y hora */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            required
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/60 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Hora</label>
          <input
            type="time"
            value={hora}
            onChange={e => setHora(e.target.value)}
            required
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/60 transition"
          />
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">
          ¿Qué pasó? <span className="text-slate-600 font-normal">(opcional)</span>
        </label>
        <textarea
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          rows={3}
          placeholder="Describe brevemente la situación..."
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/60 transition resize-none"
        />
      </div>

      {/* Pensamiento automático */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">
          Pensamiento automático
          <span className="ml-2 text-xs text-slate-600 font-normal">¿Qué pensaste en ese momento?</span>
        </label>
        <textarea
          value={pensamiento}
          onChange={e => setPensamiento(e.target.value)}
          rows={2}
          placeholder="Ej: 'No soy suficientemente bueno/a', 'Siempre me pasa lo mismo'..."
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/60 transition resize-none"
        />
        <p className="text-xs text-slate-600 mt-1">
          En psicología cognitiva, los pensamientos automáticos revelan patrones emocionales profundos.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !emocion}
        className={`
          w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 shadow-lg
          ${emocionObj
            ? `bg-gradient-to-r ${emocionObj.gradientFrom} ${emocionObj.gradientTo} text-white hover:opacity-90 shadow-lg`
            : 'bg-white/10 text-slate-500 cursor-not-allowed'
          }
          disabled:opacity-50
        `}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Guardando...
          </span>
        ) : success ? (
          <span className="flex items-center justify-center gap-2">
            ✅ ¡Registro guardado!
          </span>
        ) : (
          <span>
            {emocion ? `Registrar ${emocionObj?.emoji} ${emocion}` : 'Selecciona una emoción'}
          </span>
        )}
      </button>
    </form>
  )
}
