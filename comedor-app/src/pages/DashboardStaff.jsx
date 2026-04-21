import { useState, useEffect } from 'react'
import { getStaffProfile } from '../services/staffService'
import { verifyStudent, registerMealById, getReport, getStudentTodayMeals, undoMealPickup, createMeal, getStudentsList, toggleStudentActive } from '../services/adminService'
import { getMessagesForStaff } from '../services/messageService'
import { Mail, ClipboardList, Search, Info, CheckCircle2, XCircle, RotateCcw, User, Coffee, Utensils, Moon, Calendar, UserX, QrCode as QrIcon } from 'lucide-react'
import MenuViewer from '../components/staff/MenuViewer'
import QRScanner from '../components/common/QRScanner'


export default function DashboardStaff({ userEmail }) {
  const [staffProfile, setStaffProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [carnet, setCarnet] = useState('')
  const [studentInfo, setStudentInfo] = useState(null)
  const [studentMeals, setStudentMeals] = useState([])
  const [message, setMessage] = useState('')
  const [inbox, setInbox] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeTab, setActiveTab] = useState('gestion')
  const [reportData, setReportData] = useState([])
  const [reportDate, setReportDate] = useState('')
  const [staffStudentsList, setStaffStudentsList] = useState([])
  const [staffStudentsSearch, setStaffStudentsSearch] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  
  // Estadísticas del turno
  const [stats, setStats] = useState({ total: 0, desayunos: 0, almuerzos: 0, cenas: 0 })

  useEffect(() => {
    const load = async () => {
      const { data } = await getStaffProfile(userEmail)
      if (data) setStaffProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    setMessage('')
    if (activeTab === 'mensajes') {
      loadInbox()
      setUnreadCount(0)
    } else {
      checkNewMessages()
    }
    if (activeTab === 'gestion' && staffProfile?.perm_ver_reportes) {
      loadReport()
    }
    if (activeTab === 'estudiantes') {
      loadStaffStudents()
    }
  }, [activeTab, staffProfile, reportDate])

  const showStatus = (msg) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  const loadInbox = async () => {
    if (!staffProfile) return
    const { data } = await getMessagesForStaff(staffProfile.created_at)
    if (data) {
      setInbox(data)
      if (data.length > 0) localStorage.setItem(`last_msg_staff_${staffProfile.id}`, data[0].id)
    }
  }

  const checkNewMessages = async () => {
    if (!staffProfile) return
    const { data } = await getMessagesForStaff(staffProfile.created_at)
    if (data && data.length > 0) {
      const lastSeenId = localStorage.getItem(`last_msg_staff_${staffProfile.id}`)
      let count = 0
      for (const msg of data) {
        if (msg.id === lastSeenId) break
        count++
      }
      setUnreadCount(count)
    }
  }

  const handleVerify = async () => {
    setMessage(''); setStudentInfo(null); setStudentMeals([])
    const { data } = await verifyStudent(carnet)
    if (data && data.length > 0) {
      setStudentInfo(data[0])
      const { data: meals } = await getStudentTodayMeals(data[0].id)
      if (meals) setStudentMeals(meals)
    } else {
      showStatus('Estudiante no encontrado.')
    }
  }

  const handleQRScan = async (decodedText) => {
    setShowScanner(false);
    setCarnet(decodedText);
    
    // Ejecutar verificación inmediata
    setMessage(''); setStudentInfo(null); setStudentMeals([])
    const { data } = await verifyStudent(decodedText)
    if (data && data.length > 0) {
      setStudentInfo(data[0])
      const { data: meals } = await getStudentTodayMeals(data[0].id)
      if (meals) setStudentMeals(meals)
      showStatus('Escaneo exitoso: ' + data[0].nombre)
    } else {
      showStatus('QR no reconocido o estudiante no encontrado.')
    }
  }

  const handleRegisterMeal = async (mealId, tipo) => {
    const { error } = await registerMealById(mealId)
    if (!error) {
      showStatus(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} retirado correctamente.`)
      if (studentInfo) {
        const { data: meals } = await getStudentTodayMeals(studentInfo.id)
        if (meals) setStudentMeals(meals)
      }
      loadReport()
    }
  }

  const handleQuickRegister = async (tipo) => {
    const { error } = await createMeal(studentInfo.id, tipo, 'retirado')
    if (!error) {
      showStatus(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} registrado (vía plan).`)
      if (studentInfo) {
        const { data: meals } = await getStudentTodayMeals(studentInfo.id)
        if (meals) setStudentMeals(meals)
      }
      loadReport()
    }
  }

  const handleUndoMeal = async (mealId, tipo) => {
    const { error } = await undoMealPickup(mealId)
    if (!error) {
      showStatus(`Retiro de ${tipo} cancelado.`)
      if (studentInfo) {
        const { data: meals } = await getStudentTodayMeals(studentInfo.id)
        if (meals) setStudentMeals(meals)
      }
      loadReport()
    }
  }

  const loadReport = async () => {
    const { data } = await getReport(reportDate)
    if (data) {
      setReportData(data)
      const retirados = data.filter(h => h.estado === 'retirado')
      setStats({
        total: retirados.length,
        desayunos: retirados.filter(h => h.tipo === 'desayuno').length,
        almuerzos: retirados.filter(h => h.tipo === 'almuerzo').length,
        cenas: retirados.filter(h => h.tipo === 'cena').length
      })
    }
  }

  const getMealIcon = (tipo) => {
    if (tipo === 'desayuno') return <Coffee size={20} />
    if (tipo === 'almuerzo') return <Utensils size={20} />
    return <Moon size={20} />
  }

  if (loading) return <div className="loading">Cargando Staff Engine...</div>

  const loadStaffStudents = async () => {
    const { data } = await getStudentsList()
    if (data) setStaffStudentsList(data)
  }

  const perms = staffProfile

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2rem' }}>Staff <span style={{ color: 'var(--synth-blue)' }}>COSEVA.</span></h1>
          <p style={{ color: 'var(--synth-muted)', fontSize: '0.9rem' }}>Panel de control operativo de turno.</p>
        </div>
        <div className="tabs">
          <button className={activeTab === 'gestion' ? 'active' : ''} onClick={() => setActiveTab('gestion')}><ClipboardList size={18} /> Gestión</button>
          {perms?.perm_desactivar_estudiante && (
            <button className={activeTab === 'estudiantes' ? 'active' : ''} onClick={() => setActiveTab('estudiantes')}><UserX size={18} /> Estudiantes</button>
          )}
          {perms?.perm_ver_menus && (
            <button className={activeTab === 'menus' ? 'active' : ''} onClick={() => setActiveTab('menus')}><Calendar size={18} /> Menús de la Semana</button>
          )}
          <button className={activeTab === 'mensajes' ? 'active' : ''} onClick={() => setActiveTab('mensajes')}><Mail size={18} /> Mensajes {unreadCount > 0 && `(${unreadCount})`}</button>
        </div>
      </header>

      {message && <div className="status-alert">{message}</div>}

      <div className="tab-content">
        {activeTab === 'menus' && <MenuViewer />}

        {activeTab === 'gestion' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Stats para el Staff (solo si tiene permiso de reporte) */}
            {perms.perm_ver_reportes && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '15px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Actividad del Turno</h3>
                  <input 
                    type="date" 
                    value={reportDate} 
                    onChange={(e) => setReportDate(e.target.value)} 
                    style={{ padding: '8px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    title="Filtrar por fecha"
                  />
                </div>
                <div className="stats-grid">
                  <div className="stat-card"><h5>Total Turno</h5><div className="value">{stats.total}</div></div>
                  <div className="stat-card"><h5>Desayunos</h5><div className="value">{stats.desayunos}</div></div>
                  <div className="stat-card"><h5>Almuerzos</h5><div className="value">{stats.almuerzos}</div></div>
                  <div className="stat-card"><h5>Cenas</h5><div className="value">{stats.cenas}</div></div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: perms.perm_ver_reportes ? '1fr 1.5fr' : '1fr', gap: '2rem' }}>
              {/* COLUMNA VERIFICACIÓN */}
              <div className="card">
                <h2 style={{ marginBottom: '1.5rem' }}>Verificar Estudiante</h2>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <input type="text" placeholder="Carnet..." value={carnet} onChange={(e) => setCarnet(e.target.value)} style={{ flex: '1 1 150px', height: '48px' }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-success" onClick={handleVerify} title="Buscar manual" style={{ width: '48px', height: '48px', padding: 0 }}><Search size={18} /></button>
                    <button 
                      className="btn-primary" 
                      onClick={() => setShowScanner(true)}
                      style={{ background: 'var(--synth-blue)', color: 'white', width: '48px', height: '48px', padding: 0 }}
                      title="Escanear QR"
                    >
                      <QrIcon size={18} />
                    </button>
                  </div>
                </div>

                {showScanner && (
                  <QRScanner 
                    onScanSuccess={handleQRScan}
                    onScanError={(err) => console.log(err)}
                    onClose={() => setShowScanner(false)}
                  />
                )}

                {studentInfo && (
                  <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <div className="profile-photo-container" style={{ width: '60px', height: '60px', margin: 0 }}>
                        {studentInfo.foto_url ? <img src={studentInfo.foto_url} className="profile-photo" /> : <div className="profile-photo-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f1f5f9', color: '#cbd5e1' }}><User size={24} /></div>}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.1rem' }}>{studentInfo.nombre}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--synth-muted)' }}>{studentInfo.carnet}</p>
                      </div>
                    </div>

                    {studentInfo.dieta_especial && (
                      <div style={{ padding: '10px 14px', background: '#fef3c7', borderRadius: '10px', border: '1px solid #f59e0b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1rem' }}>⚠️</span>
                        <div>
                          <p style={{ fontWeight: '700', fontSize: '0.7rem', color: '#92400e', margin: 0 }}>DIETA ESPECIAL</p>
                          <p style={{ fontSize: '0.75rem', color: '#78350f', margin: 0 }}>{studentInfo.dieta_especial}</p>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {['desayuno', 'almuerzo', 'cena'].map(tipo => {
                        const meal = studentMeals.find(m => m.tipo === tipo)
                        let tienePlan = false
                        if (tipo === 'desayuno') tienePlan = studentInfo.plan_desayuno && studentInfo.plan_desayuno !== 'ninguno'
                        if (tipo === 'almuerzo') tienePlan = !!studentInfo.plan_almuerzo
                        if (tipo === 'cena') tienePlan = !!studentInfo.plan_cena

                        return (
                          <div key={tipo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ color: 'var(--synth-blue)' }}>{getMealIcon(tipo)}</div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ textTransform: 'capitalize', fontWeight: '700', fontSize: '0.9rem' }}>{tipo}</span>
                                {tienePlan && <span style={{ fontSize: '0.6rem', color: 'var(--synth-blue)', fontWeight: '600' }}>{tipo === 'desayuno' ? `PLAN ${studentInfo.plan_desayuno.toUpperCase()}` : 'HABILITADO POR PLAN'}</span>}
                              </div>
                            </div>

                            {meal ? (
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <span className={`status-badge ${meal.estado}`} style={{ fontSize: '0.65rem' }}>{meal.estado}</span>
                                {meal.estado === 'reservado' && perms.perm_registrar_retiro && (
                                  <button className="btn-success" onClick={() => handleRegisterMeal(meal.id, tipo)} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Confirmar Retiro</button>
                                )}
                                {meal.estado === 'retirado' && perms.perm_registrar_retiro && (
                                  <button className="btn-primary" onClick={() => handleUndoMeal(meal.id, tipo)} style={{ padding: '6px 12px', color: '#ef4444' }}><RotateCcw size={16} /></button>
                                )}
                              </div>
                            ) : (
                              tienePlan ? (
                                perms.perm_registrar_retiro && <button className="btn-success" onClick={() => handleQuickRegister(tipo)} style={{ padding: '6px 15px', fontSize: '0.75rem' }}>Registrar Retiro</button>
                              ) : (
                                <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>No habilitado</span>
                              )
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* COLUMNA REPORTES (Actividad List Pro) */}
              {perms.perm_ver_reportes && (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2>Actividad del Turno</h2>
                    <button className="btn-primary" onClick={loadReport}><Search size={18} /> Actualizar</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }}>
                    
                    {/* Columna Reservados */}
                    <div>
                      <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px', fontSize: '1rem', color: 'var(--synth-muted)' }}>Reservados</h3>
                      <div className="activity-list">
                        {reportData.filter(m => m.estado === 'reservado' && !m.autorizado_a).map(m => (
                          <div key={m.id} className="activity-item" style={{ padding: '12px', gap: '10px' }}>
                            <div className="activity-info">
                              <h4 style={{ fontSize: '0.85rem' }}>{m.students?.nombre || 'S/N'}</h4>
                              <p style={{ fontSize: '0.75rem' }}>{m.tipo} | {new Date(m.created_at).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        ))}
                        {reportData.filter(m => m.estado === 'reservado' && !m.autorizado_a).length === 0 && <p style={{ color: 'var(--synth-muted)', fontSize: '0.75rem' }}>Vacío.</p>}
                      </div>
                    </div>

                    {/* Columna Autorizados */}
                    <div>
                      <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px', fontSize: '1rem', color: 'var(--synth-blue)' }}>Autorizados</h3>
                      <div className="activity-list">
                        {reportData.filter(m => !!m.autorizado_a).map(m => (
                          <div key={m.id} className="activity-item" style={{ padding: '12px', gap: '10px' }}>
                            <div className="activity-info">
                              <h4 style={{ fontSize: '0.85rem' }}>{m.students?.nombre || 'S/N'}</h4>
                              <p style={{ fontSize: '0.75rem' }}>{m.tipo}</p>
                              <p style={{ color: 'var(--synth-blue)', fontSize: '0.7rem', fontWeight: '600' }}>Retira: {m.autorizado_a}</p>
                            </div>
                            <span className={`status-badge ${m.estado}`} style={{fontSize: '0.6rem'}}>{m.estado}</span>
                          </div>
                        ))}
                        {reportData.filter(m => !!m.autorizado_a).length === 0 && <p style={{ color: 'var(--synth-muted)', fontSize: '0.75rem' }}>Vacío.</p>}
                      </div>
                    </div>

                    {/* Columna Retirados */}
                    <div>
                      <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px', fontSize: '1rem', color: '#16a34a' }}>Retirados</h3>
                      <div className="activity-list">
                        {reportData.filter(m => m.estado === 'retirado' && !m.autorizado_a).map(m => (
                          <div key={m.id} className="activity-item" style={{ padding: '12px', gap: '10px' }}>
                            <div className="activity-info">
                              <h4 style={{ fontSize: '0.85rem' }}>{m.students?.nombre || 'S/N'}</h4>
                              <p style={{ fontSize: '0.75rem' }}>{m.tipo} | {new Date(m.created_at).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        ))}
                        {reportData.filter(m => m.estado === 'retirado' && !m.autorizado_a).length === 0 && <p style={{ color: 'var(--synth-muted)', fontSize: '0.75rem' }}>Vacío.</p>}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'estudiantes' && perms?.perm_desactivar_estudiante && (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem', padding: '8px 16px', maxWidth: '400px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Search size={18} color="var(--synth-muted)" />
                <input
                  type="text"
                  placeholder="Buscar estudiante por nombre..."
                  value={staffStudentsSearch}
                  onChange={(e) => setStaffStudentsSearch(e.target.value)}
                  style={{ flex: 1, border: 'none', background: 'transparent', padding: '6px 0', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div className="table-responsive">
              <table className="synth-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Carnet</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {staffStudentsList.filter(s => s.nombre?.toLowerCase().startsWith(staffStudentsSearch.toLowerCase())).map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: '600', color: 'var(--synth-dark)' }}>{s.nombre}</td>
                      <td style={{ color: 'var(--synth-muted)', fontSize: '0.85rem' }}>{s.carnet}</td>
                      <td>
                        <div className={`synth-toggle ${s.activo ? '' : 'off'}`} style={{ transform: 'scale(0.7)' }} onClick={() => toggleStudentActive(s.id, !s.activo).then(loadStaffStudents)}></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'mensajes' && (
          <div className="inbox-container">
            {inbox.map(msg => (
              <div key={msg.id} className="inbox-row">
                <div className="inbox-icon"><Mail size={20} /></div>
                <div className="inbox-main">
                  <div className="inbox-header-row">
                    <span className="inbox-title">{msg.title}</span>
                    <span className="inbox-date">{new Date(msg.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="inbox-preview">{msg.content}</p>
                </div>
              </div>
            ))}
            {inbox.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--synth-muted)' }}>
                No hay mensajes operativos.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
