import { useState, useEffect } from 'react'
import { createMenu, getMenus, deleteMenu } from '../../services/adminService'
import { Calendar, Search, Trash2, Plus, Coffee, Utensils, Moon } from 'lucide-react'

export default function MenuManager({ showStatus }) {
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)

  // Formulario nuevo menú
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [nuevoTipo, setNuevoTipo] = useState('almuerzo')
  const [nuevoTitulo, setNuevoTitulo] = useState('')
  const [nuevaDescripcion, setNuevaDescripcion] = useState('')

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

  const handleCreateMenu = async () => {
    if (!nuevaFecha || !nuevoTitulo.trim() || !nuevaDescripcion.trim()) return
    const { error } = await createMenu(nuevaFecha, nuevoTipo, nuevoTitulo, nuevaDescripcion)
    if (!error) {
      setNuevaFecha('')
      setNuevoTitulo('')
      setNuevaDescripcion('')
      showStatus('Menú publicado exitosamente.')
      loadMenus()
    } else {
      showStatus('Error al publicar el menú.')
    }
  }

  const handleDelete = async (id) => {
    const { error } = await deleteMenu(id)
    if (!error) {
      showStatus('Menú eliminado.')
      loadMenus()
    }
  }

  const getMealIcon = (tipo) => {
    if (tipo === 'desayuno') return <Coffee size={18} />
    if (tipo === 'almuerzo') return <Utensils size={18} />
    return <Moon size={18} />
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: '3rem', borderTop: '4px solid var(--synth-blue)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <div style={{ background: 'var(--synth-blue)', color: 'white', padding: '10px', borderRadius: '12px' }}>
            <Calendar size={20} />
          </div>
          <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Planificación de Menús</h2>
        </div>

        <div className="responsive-grid" style={{ display: 'grid', gap: '20px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--synth-muted)' }}>FECHA</label>
            <input 
              type="date" 
              value={nuevaFecha} 
              onChange={(e) => setNuevaFecha(e.target.value)} 
              style={{ width: '100%', padding: '12px' }} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--synth-muted)' }}>TIPO DE COMIDA</label>
            <select 
              value={nuevoTipo} 
              onChange={(e) => setNuevoTipo(e.target.value)} 
              style={{ width: '100%', padding: '12px' }}
            >
              <option value="desayuno">Desayuno</option>
              <option value="almuerzo">Almuerzo</option>
              <option value="cena">Cena</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--synth-muted)' }}>TÍTULO DE LA COMIDA</label>
            <input 
              type="text" 
              placeholder="Ej: Casado con Pollo" 
              value={nuevoTitulo} 
              onChange={(e) => setNuevoTitulo(e.target.value)} 
              style={{ width: '100%', padding: '12px' }} 
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--synth-muted)' }}>DESCRIPCIÓN DEL MENÚ</label>
            <textarea 
              placeholder="Ej: Arroz, frijoles, plátano maduro, ensalada y fresco..." 
              value={nuevaDescripcion} 
              onChange={(e) => setNuevaDescripcion(e.target.value)} 
              style={{ width: '100%', padding: '12px', minHeight: '80px', resize: 'vertical' }} 
            />
          </div>

          <button className="btn-success" onClick={handleCreateMenu} style={{ gridColumn: '1 / -1', height: '48px' }}>
            <Plus size={18} /> Publicar Menú
          </button>
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
              <th style={{ width: '80px' }}>Acciones</th>
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
                  <td style={{ fontWeight: '600', color: 'var(--synth-dark)' }}>{menu.titulo}</td>
                  <td style={{ color: 'var(--synth-dark)', lineHeight: '1.5' }}>{menu.descripcion}</td>
                  <td>
                    <button className="btn-primary" onClick={() => handleDelete(menu.id)} style={{ color: '#ef4444', padding: '6px 12px', fontSize: '0.7rem', border: 'none', background: '#fff1f2' }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
