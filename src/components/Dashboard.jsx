import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import { EMOCIONES, getEmocion } from '../lib/emociones'

// Tooltip personalizado para los gráficos
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="backdrop-blur-md bg-slate-900/90 border border-white/20 rounded-xl p-3 shadow-xl text-sm">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard({ registros }) {
  // --- Cálculos ---
  const stats = useMemo(() => {
    if (!registros?.length) return null

    // Promedio de intensidad global
    const promedioGlobal = registros.reduce((s, r) => s + r.nivel, 0) / registros.length

    // Emoción más frecuente
    const conteo = {}
    registros.forEach(r => { conteo[r.emocion] = (conteo[r.emocion] || 0) + 1 })
    const emocionTop = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]

    // Distribución para pie chart
    const distribucion = EMOCIONES.map(em => ({
      name: em.nombre,
      value: conteo[em.nombre] || 0,
      color: em.colorHex,
      emoji: em.emoji,
    })).filter(d => d.value > 0)

    // Evolución semanal (últimos 7 días)
    const hoy = new Date()
    const diasSemana = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(hoy)
      d.setDate(hoy.getDate() - (6 - i))
      return d.toISOString().split('T')[0]
    })

    const porDia = diasSemana.map(fecha => {
      const del_dia = registros.filter(r => r.fecha === fecha)
      const promedio = del_dia.length
        ? del_dia.reduce((s, r) => s + r.nivel, 0) / del_dia.length
        : null
      const etiqueta = new Date(fecha + 'T12:00:00').toLocaleDateString('es', { weekday: 'short', day: 'numeric' })
      return {
        fecha: etiqueta,
        promedio,
        total: del_dia.length,
      }
    })

    // Promedio por emoción
    const promedioEmocion = EMOCIONES.map(em => {
      const registrosEm = registros.filter(r => r.emocion === em.nombre)
      return {
        name: `${em.emoji} ${em.nombre}`,
        promedio: registrosEm.length
          ? registrosEm.reduce((s, r) => s + r.nivel, 0) / registrosEm.length
          : 0,
        total: registrosEm.length,
        color: em.colorHex,
      }
    }).filter(d => d.total > 0).sort((a, b) => b.promedio - a.promedio)

    // Últimos 5 registros
    const ultimos = [...registros]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)

    return { promedioGlobal, emocionTop, distribucion, porDia, promedioEmocion, ultimos, total: registros.length }
  }, [registros])

  if (!registros?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-white mb-2">Sin datos todavía</h3>
        <p className="text-slate-400 text-sm max-w-xs">
          Empieza registrando tus emociones para ver tu análisis aquí.
        </p>
      </div>
    )
  }

  const intensidadColor = (v) => {
    if (v <= 2) return '#4ade80'
    if (v <= 3) return '#facc15'
    if (v <= 4) return '#fb923c'
    return '#ef4444'
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Registros totales</p>
          <p className="text-3xl font-extrabold text-white">{stats.total}</p>
        </div>
        <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Intensidad promedio</p>
          <p className="text-3xl font-extrabold" style={{ color: intensidadColor(stats.promedioGlobal) }}>
            {stats.promedioGlobal.toFixed(1)}<span className="text-lg text-slate-500">/5</span>
          </p>
        </div>
        {stats.emocionTop && (
          <div className="col-span-2 backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <div className="text-4xl">{getEmocion(stats.emocionTop[0])?.emoji}</div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Emoción dominante</p>
              <p className="text-xl font-bold text-white">{stats.emocionTop[0]}</p>
              <p className="text-sm text-slate-400">{stats.emocionTop[1]} registro{stats.emocionTop[1] !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}
      </div>

      {/* Evolución semanal */}
      <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Evolución semanal — Intensidad promedio
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={stats.porDia} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="fecha" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="promedio"
              name="Intensidad"
              stroke="#facc15"
              strokeWidth={2.5}
              dot={{ fill: '#facc15', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, stroke: '#facc15', strokeWidth: 2, fill: '#0f172a' }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Distribución + Barras lado a lado en móvil vertical */}
      <div className="grid grid-cols-1 gap-4">
        {/* Pie chart */}
        <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Distribución emocional
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={stats.distribucion}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {stats.distribucion.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    const d = payload[0].payload
                    const pct = ((d.value / stats.total) * 100).toFixed(0)
                    return (
                      <div className="backdrop-blur-md bg-slate-900/90 border border-white/20 rounded-xl p-3 text-sm">
                        <p className="text-white font-bold">{d.emoji} {d.name}</p>
                        <p className="text-slate-400">{d.value} registro{d.value !== 1 ? 's' : ''} ({pct}%)</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend
                formatter={(value) => <span className="text-xs text-slate-400">{value}</span>}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart por emoción */}
        <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Intensidad promedio por emoción
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={stats.promedioEmocion}
              layout="vertical"
              margin={{ top: 0, right: 10, bottom: 0, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="promedio" name="Promedio" radius={[0, 6, 6, 0]}>
                {stats.promedioEmocion.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Últimos registros */}
      <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Últimos registros
        </h3>
        <div className="space-y-3">
          {stats.ultimos.map(r => {
            const em = getEmocion(r.emocion)
            return (
              <div key={r.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                <div className={`w-10 h-10 rounded-xl ${em?.color || 'bg-slate-600'} flex items-center justify-center text-lg flex-shrink-0`}>
                  {em?.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white">{r.emocion}</span>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(n => (
                        <div
                          key={n}
                          className={`w-2 h-2 rounded-full ${n <= r.nivel ? (em?.color || 'bg-yellow-400') : 'bg-white/10'}`}
                        />
                      ))}
                    </div>
                  </div>
                  {r.descripcion && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{r.descripcion}</p>
                  )}
                  <p className="text-xs text-slate-600 mt-0.5">
                    {r.fecha} · {r.hora?.slice(0, 5)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Insight psicológico */}
      <div className="backdrop-blur-sm bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🧠</span>
          <div>
            <h3 className="text-sm font-semibold text-purple-300 mb-1">Insight de la semana</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {stats.promedioGlobal >= 4
                ? `Tu intensidad emocional promedio es alta (${stats.promedioGlobal.toFixed(1)}/5). Considera practicar técnicas de regulación emocional como la respiración diafragmática o el mindfulness.`
                : stats.promedioGlobal >= 3
                ? `Tu estado emocional es moderado (${stats.promedioGlobal.toFixed(1)}/5). Buen momento para explorar qué factores desencadenan ${stats.emocionTop?.[0] || 'tus emociones'} con más frecuencia.`
                : `Tu intensidad emocional es baja (${stats.promedioGlobal.toFixed(1)}/5). Parece que estás gestionando bien tus emociones. Sigue registrando para identificar patrones.`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
