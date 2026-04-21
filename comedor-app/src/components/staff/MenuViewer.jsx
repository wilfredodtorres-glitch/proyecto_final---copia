import { useState, useEffect } from 'react'
import { getMenus } from '../../services/adminService'
import { Calendar, Search, Coffee, Utensils, Moon } from 'lucide-react'

export default function MenuViewer() {
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [filtroFecha, setFiltroFecha] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    loadMenus()
  }, [filtroFecha, filtroTipo, busqueda])

  const loadMenus = async () => {
    setLoading(true)
    const { data } = await getMenus(filtroFecha, filtroTipo, busqueda)
    if (data) setMenus(data)
    setLoading(false)
  }

  const getMealIcon = (tipo) => {
    if (tipo === 'desayuno') return <Coffee size={18} />
    if (tipo === 'almuerzo') return <Utensils size={18} />
    return <Moon size={18} />
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--synth-blue)', padding: '24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--synth-blue)', color: 'white', padding: '10px', borderRadius: '12px' }}>
            <Calendar size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Menús de la Semana</h2>
            <p style={{ color: 'var(--synth-muted)', fontSize: '0.85rem' }}>Visualiza la planificación de comidas de la institución.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '15px' }}>
        <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Menús Programados</h3>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input 
            type="date" 
            value={filtroFecha} 
            onChange={(e) => setFiltroFecha(e.target.value)} 
            style={{ padding: '8px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
            title="Filtrar por fecha"
          />
          <select 
            value={filtroTipo} 
            onChange={(e) => setFiltroTipo(e.target.value)} 
            style={{ padding: '8px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
          >
            <option value="todos">Todos los tipos</option>
            <option value="desayuno">Desayunos</option>
            <option value="almuerzo">Almuerzos</option>
            <option value="cena">Cenas</option>
          </select>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--synth-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar menú..." 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
              style={{ padding: '8px 12px 8px 35px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '200px' }}
            />
          </div>
          {(filtroFecha || filtroTipo !== 'todos' || busqueda) && (
            <button 
              className="btn-primary" 
              onClick={() => { setFiltroFecha(''); setFiltroTipo('todos'); setBusqueda(''); }}
              style={{ background: '#f1f5f9', color: 'var(--synth-dark)', border: 'none' }}
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="table-responsive">
        <table className="synth-table">
          <thead>
            <tr>
              <th style={{ width: '120px' }}>Fecha</th>
              <th style={{ width: '130px' }}>Tipo</th>
              <th style={{ width: '200px' }}>Título</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--synth-muted)' }}>Cargando menús...</td></tr>
            ) : menus.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--synth-muted)' }}>No se encontraron menús programados.</td></tr>
            ) : (
              menus.map(menu => (
                <tr key={menu.id}>
                  <td style={{ fontWeight: '600' }}>{menu.fecha.split('-').reverse().join('/')}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--synth-blue)', textTransform: 'capitalize', fontWeight: '600' }}>
                      {getMealIcon(menu.tipo)} {menu.tipo}
                    </div>
                  </td>
                  <td style={{ fontWeight: '600', color: 'var(--synth-dark)' }}>{menu.titulo || 'Menú Especial'}</td>
                  <td style={{ color: 'var(--synth-dark)', lineHeight: '1.5' }}>{menu.descripcion}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
