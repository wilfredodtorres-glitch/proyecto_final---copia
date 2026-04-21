import { useState, useEffect } from 'react'
import { verifyStudent, registerMealById, getReport, getStudentTodayMeals, undoMealPickup, getStudentsList, toggleStudentActive, deleteStudent, updateStudentPlan, createMeal } from '../services/adminService'
import { createStaffAccount, getStaffList, updateStaffPermissions, toggleStaffActive, deleteStaff } from '../services/staffService'
import { sendMessage, getMessagesForStudents, getMessagesForStaff, deleteMultipleMessages, deleteAllMessages } from '../services/messageService'
import { Mail, Send, Trash2, CheckSquare, User, ClipboardList, BarChart3, UserPlus, Search, ArrowRight, ShieldCheck, Square, Coffee, Utensils, Moon, Globe, Calendar, QrCode as QrIcon } from 'lucide-react'
import MenuManager from '../components/admin/MenuManager'
import QRScanner from '../components/common/QRScanner'


export default function DashboardAdmin() {
  const [activeTab, setActiveTab] = useState('verificar')
  const [carnet, setCarnet] = useState('')
  const [studentInfo, setStudentInfo] = useState(null)
  const [studentMeals, setStudentMeals] = useState([])
  const [reportData, setReportData] = useState([])
  const [reportDate, setReportDate] = useState('')
  const [message, setMessage] = useState('')

  const [staffList, setStaffList] = useState([])
  const [newStaff, setNewStaff] = useState({ email: '', nombre: '', password: '' })
  const [studentsList, setStudentsList] = useState([])

  const [msgTitle, setMsgTitle] = useState('')
  const [msgContent, setMsgContent] = useState('')
  const [msgTarget, setMsgTarget] = useState('students')
  const [allMessages, setAllMessages] = useState([])
  const [selectedMsgs, setSelectedMsgs] = useState([])

  const [staffSearch, setStaffSearch] = useState('')
  const [studentsSearch, setStudentsSearch] = useState('')

  // Estadísticas globales del reporte
  const [stats, setStats] = useState({ total: 0, desayunos: 0, almuerzos: 0, cenas: 0 })
  const [showScanner, setShowScanner] = useState(false)

  useEffect(() => {
    setMessage('')
    if (activeTab === 'reporte') loadReport()
    if (activeTab === 'personal') loadStaff()
    if (activeTab === 'estudiantes') loadStudents()
    if (activeTab === 'mensajes') loadAllMessages()
  }, [activeTab, reportDate])

  const showStatus = (msg) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
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

  const loadStaff = async () => {
    const { data } = await getStaffList()
    if (data) setStaffList(data)
  }

  const loadStudents = async () => {
    const { data } = await getStudentsList()
    if (data) setStudentsList(data)
  }

  const loadAllMessages = async () => {
    const { data: stMsgs } = await getMessagesForStudents()
    const { data: sfMsgs } = await getMessagesForStaff()
    const combined = [...(stMsgs || []), ...(sfMsgs || [])]
    // Eliminar duplicados por ID
    const unique = Array.from(new Map(combined.map(m => [m.id, m])).values())
    setAllMessages(unique.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
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
      showStatus(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} registrado correctamente.`)
      handleVerify()
    }
  }

  const handleQuickRegister = async (tipo) => {
    const { error } = await createMeal(studentInfo.id, tipo, 'retirado')
    if (!error) {
      showStatus(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} registrado (vía plan).`)
      handleVerify()
    }
  }

  const handleUndoMeal = async (mealId, tipo) => {
    const { error } = await undoMealPickup(mealId)
    if (!error) {
      showStatus(`Retiro de ${tipo} cancelado.`)
      handleVerify()
    }
  }

  const handleCreateStaff = async () => {
    if (!newStaff.email || !newStaff.nombre || !newStaff.password) return
    const { error } = await createStaffAccount(newStaff)
    if (!error) {
      setNewStaff({ email: '', nombre: '', password: '' })
      loadStaff()
      showStatus('Personal añadido correctamente.')
    }
  }

  const handleSendMsg = async () => {
    if (!msgTitle.trim() || !msgContent.trim()) return
    const { error } = await sendMessage(msgTitle, msgContent, msgTarget)
    if (!error) {
      showStatus('Mensaje enviado exitosamente.')
      setMsgTitle(''); setMsgContent(''); loadAllMessages()
    }
  }

  const toggleMsgSelection = (id) => {
    setSelectedMsgs(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedMsgs.length === allMessages.length) {
      setSelectedMsgs([])
    } else {
      setSelectedMsgs(allMessages.map(m => m.id))
    }
  }

  const handleDeleteSelected = async () => {
    const { error } = await deleteMultipleMessages(selectedMsgs)
    if (!error) {
      setSelectedMsgs([])
      loadAllMessages()
      showStatus('Mensajes eliminados.')
    }
  }

  const getMealIcon = (tipo) => {
    if (tipo === 'desayuno') return <Coffee size={20} />
    if (tipo === 'almuerzo') return <Utensils size={20} />
    return <Moon size={20} />
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Comedor <span style={{ color: 'var(--synth-blue)' }}>COSEVA.</span></h1>
        <p style={{ color: 'var(--synth-muted)', fontSize: '1rem' }}>Sincronización inteligente de flujos alimenticios.</p>
      </header>

      <div className="tabs">
        <button className={activeTab === 'verificar' ? 'active' : ''} onClick={() => setActiveTab('verificar')}><ShieldCheck size={18} /> Verificar</button>
        <button className={activeTab === 'reporte' ? 'active' : ''} onClick={() => setActiveTab('reporte')}><BarChart3 size={18} /> Reporte</button>
        <button className={activeTab === 'personal' ? 'active' : ''} onClick={() => setActiveTab('personal')}><UserPlus size={18} /> Personal</button>
        <button className={activeTab === 'estudiantes' ? 'active' : ''} onClick={() => setActiveTab('estudiantes')}><User size={18} /> Estudiantes</button>
        <button className={activeTab === 'menus' ? 'active' : ''} onClick={() => setActiveTab('menus')}><Calendar size={18} /> Menús</button>
        <button className={activeTab === 'mensajes' ? 'active' : ''} onClick={() => setActiveTab('mensajes')}><Mail size={18} /> Mensajes</button>
      </div>

      <div className="tab-content">
        {message && <div className="status-alert">{message}</div>}

        {activeTab === 'menus' && <MenuManager showStatus={showStatus} />}

        {activeTab === 'verificar' && (
          <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>Control de Acceso</h2>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Número de carnet..." 
                value={carnet} 
                onChange={(e) => setCarnet(e.target.value)} 
                style={{ flex: '1 1 200px', height: '56px' }} 
              />
              <div style={{ display: 'flex', gap: '10px', flex: '0 0 auto' }}>
                <button className="btn-success" onClick={handleVerify} style={{ width: '60px', height: '56px', borderRadius: '16px' }}>
                  <Search size={24} />
                </button>
                <button 
                  className="btn-primary" 
                  onClick={() => setShowScanner(true)}
                  style={{ width: '60px', height: '56px', borderRadius: '16px', background: 'var(--synth-blue)', color: 'white' }}
                  title="Escanear QR"
                >
                  <QrIcon size={24} />
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
              <div style={{ background: '#f8fafc', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '2.5rem' }}>
                  <div className="profile-photo-container" style={{ width: '80px', height: '80px', margin: 0 }}>
                    {studentInfo.foto_url ? <img src={studentInfo.foto_url} className="profile-photo" /> : <div className="profile-photo-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#fff', color: '#cbd5e1' }}><User size={32} /></div>}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.4rem' }}>{studentInfo.nombre}</h3>
                    <p style={{ color: 'var(--synth-muted)' }}>ID: {studentInfo.carnet}</p>
                  </div>
                </div>

                {studentInfo.dieta_especial && (
                  <div style={{ padding: '12px 16px', background: '#fef3c7', borderRadius: '12px', border: '1px solid #f59e0b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '0.8rem', color: '#92400e', margin: 0 }}>DIETA ESPECIAL</p>
                      <p style={{ fontSize: '0.85rem', color: '#78350f', margin: 0 }}>{studentInfo.dieta_especial}</p>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['desayuno', 'almuerzo', 'cena'].map(tipo => {
                    const meal = studentMeals.find(m => m.tipo === tipo)
                    let tienePlan = false
                    if (tipo === 'desayuno') tienePlan = studentInfo.plan_desayuno && studentInfo.plan_desayuno !== 'ninguno'
                    if (tipo === 'almuerzo') tienePlan = !!studentInfo.plan_almuerzo
                    if (tipo === 'cena') tienePlan = !!studentInfo.plan_cena

                    return (
                      <div key={tipo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ color: 'var(--synth-blue)' }}>{getMealIcon(tipo)}</div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ textTransform: 'capitalize', fontWeight: '700', fontSize: '1rem' }}>{tipo}</span>
                            {tienePlan && <span style={{ fontSize: '0.65rem', color: 'var(--synth-blue)', fontWeight: '600' }}>{tipo === 'desayuno' ? `PLAN ${studentInfo.plan_desayuno.toUpperCase()}` : 'HABILITADO POR PLAN'}</span>}
                          </div>
                        </div>

                        {meal ? (
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span className={`status-badge ${meal.estado}`}>{meal.estado}</span>
                            {meal.estado === 'reservado' && <button className="btn-success" onClick={() => handleRegisterMeal(meal.id, tipo)} style={{ padding: '8px 16px' }}>Confirmar Retiro</button>}
                            {meal.estado === 'retirado' && <button className="btn-primary" onClick={() => handleUndoMeal(meal.id, tipo)} style={{ padding: '8px 16px', color: '#ef4444' }}><Trash2 size={18} /></button>}
                          </div>
                        ) : (
                          tienePlan ? (
                            <button className="btn-success" onClick={() => handleQuickRegister(tipo)} style={{ padding: '8px 20px', fontSize: '0.8rem' }}>Registrar Retiro</button>
                          ) : (
                            <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>No habilitado</span>
                          )
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reporte' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '15px' }}>
              <h2 style={{ margin: 0 }}>Reporte de Comedor</h2>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                title="Filtrar por fecha"
              />
            </div>
            <div className="stats-grid">
              <div className="stat-card"><h5>Total Retiros</h5><div className="value">{stats.total}</div></div>
              <div className="stat-card"><h5>Desayunos</h5><div className="value">{stats.desayunos}</div></div>
              <div className="stat-card"><h5>Almuerzos</h5><div className="value">{stats.almuerzos}</div></div>
              <div className="stat-card"><h5>Cenas</h5><div className="value">{stats.cenas}</div></div>
            </div>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Actividad Reciente</h2>
                <button className="btn-primary" onClick={loadReport}><Search size={18} /> Actualizar</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>

                {/* Columna Reservados */}
                <div>
                  <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px', color: 'var(--synth-muted)' }}>Reservados</h3>
                  <div className="activity-list">
                    {reportData.filter(m => m.estado === 'reservado' && !m.autorizado_a).map(m => (
                      <div key={m.id} className="activity-item" style={{ padding: '12px' }}>
                        <div className="activity-info">
                          <h4>{m.students?.nombre || 'Estudiante'}</h4>
                          <p>{m.tipo} | {new Date(m.created_at).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                    {reportData.filter(m => m.estado === 'reservado' && !m.autorizado_a).length === 0 && <p style={{ color: 'var(--synth-muted)', fontSize: '0.8rem' }}>No hay reservas.</p>}
                  </div>
                </div>

                {/* Columna Autorizados */}
                <div>
                  <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px', color: 'var(--synth-blue)' }}>Autorizados</h3>
                  <div className="activity-list">
                    {reportData.filter(m => !!m.autorizado_a).map(m => (
                      <div key={m.id} className="activity-item" style={{ padding: '12px' }}>
                        <div className="activity-info">
                          <h4>{m.students?.nombre || 'Estudiante'}</h4>
                          <p>{m.tipo}</p>
                          <p style={{ color: 'var(--synth-blue)', fontSize: '0.75rem', fontWeight: '600' }}>Autorizado: {m.autorizado_a}</p>
                        </div>
                        <span className={`status-badge ${m.estado}`} style={{ fontSize: '0.65rem' }}>{m.estado}</span>
                      </div>
                    ))}
                    {reportData.filter(m => !!m.autorizado_a).length === 0 && <p style={{ color: 'var(--synth-muted)', fontSize: '0.8rem' }}>No hay autorizaciones.</p>}
                  </div>
                </div>

                {/* Columna Retirados */}
                <div>
                  <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px', color: '#16a34a' }}>Retirados</h3>
                  <div className="activity-list">
                    {reportData.filter(m => m.estado === 'retirado' && !m.autorizado_a).map(m => (
                      <div key={m.id} className="activity-item" style={{ padding: '12px' }}>
                        <div className="activity-info">
                          <h4>{m.students?.nombre || 'Estudiante'}</h4>
                          <p>{m.tipo} | {new Date(m.created_at).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                    {reportData.filter(m => m.estado === 'retirado' && !m.autorizado_a).length === 0 && <p style={{ color: 'var(--synth-muted)', fontSize: '0.8rem' }}>No hay retiros.</p>}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {activeTab === 'personal' && (
          <div>
            <div className="card" style={{ marginBottom: '3rem', borderTop: '4px solid var(--synth-blue)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                <div style={{ background: 'var(--synth-blue)', color: 'white', padding: '10px', borderRadius: '12px' }}>
                  <UserPlus size={20} />
                </div>
                <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Gestión de Credenciales Staff</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--synth-muted)', marginLeft: '4px' }}>NOMBRE COMPLETO</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--synth-muted)' }} />
                    <input type="text" placeholder="Ej: Juan Pérez" value={newStaff.nombre} onChange={(e) => setNewStaff({ ...newStaff, nombre: e.target.value })} style={{ width: '100%', paddingLeft: '45px' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--synth-muted)', marginLeft: '4px' }}>CORREO ELECTRÓNICO</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--synth-muted)' }} />
                    <input type="email" placeholder="staff@coseva.com" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} style={{ width: '100%', paddingLeft: '45px' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--synth-muted)', marginLeft: '4px' }}>CONTRASEÑA TEMPORAL</label>
                  <div style={{ position: 'relative' }}>
                    <ShieldCheck size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--synth-muted)' }} />
                    <input type="password" placeholder="••••••••" value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} style={{ width: '100%', paddingLeft: '45px' }} />
                  </div>
                </div>

                <button className="btn-success" onClick={handleCreateStaff} style={{ height: '52px', padding: '0 30px', whiteSpace: 'nowrap' }}>
                  <UserPlus size={18} /> Registrar Staff
                </button>
              </div>
            </div>
            <div className="card" style={{ marginBottom: '1.5rem', padding: '8px 16px', maxWidth: '400px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Search size={18} color="var(--synth-muted)" />
                <input
                  type="text"
                  placeholder="Filtrar por nombre..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  style={{ flex: 1, border: 'none', background: 'transparent', padding: '6px 0', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div className="table-responsive">
              <table className="synth-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Estado</th>
                    <th title="Verificar Carnet">Verif.</th>
                    <th title="Registrar Retiro">Retiro</th>
                    <th title="Validar Autorizaciones">Autoriz.</th>
                    <th title="Ver Reportes">Reportes</th>
                    <th title="Ver Menús de la Semana">Menús</th>
                    <th title="Desactivar Estudiantes">Desact.</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.filter(s => s.nombre?.toLowerCase().startsWith(staffSearch.toLowerCase())).map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: '600', color: 'var(--synth-dark)' }}>{s.nombre}</td>
                      <td style={{ color: 'var(--synth-muted)', fontSize: '0.8rem' }}>{s.email}</td>
                      <td>
                        <div className={`synth-toggle ${s.activo ? '' : 'off'}`} style={{ transform: 'scale(0.7)' }} onClick={() => toggleStaffActive(s.id, !s.activo).then(loadStaff)}></div>
                      </td>
                      <td><input type="checkbox" checked={!!s.perm_verificar_carnet} onChange={(e) => updateStaffPermissions(s.id, { perm_verificar_carnet: e.target.checked }).then(loadStaff)} /></td>
                      <td><input type="checkbox" checked={!!s.perm_registrar_retiro} onChange={(e) => updateStaffPermissions(s.id, { perm_registrar_retiro: e.target.checked }).then(loadStaff)} /></td>
                      <td><input type="checkbox" checked={!!s.perm_validar_autorizaciones} onChange={(e) => updateStaffPermissions(s.id, { perm_validar_autorizaciones: e.target.checked }).then(loadStaff)} /></td>
                      <td><input type="checkbox" checked={!!s.perm_ver_reportes} onChange={(e) => updateStaffPermissions(s.id, { perm_ver_reportes: e.target.checked }).then(loadStaff)} /></td>
                      <td><input type="checkbox" checked={!!s.perm_ver_menus} onChange={(e) => updateStaffPermissions(s.id, { perm_ver_menus: e.target.checked }).then(loadStaff)} /></td>
                      <td><input type="checkbox" checked={!!s.perm_desactivar_estudiante} onChange={(e) => updateStaffPermissions(s.id, { perm_desactivar_estudiante: e.target.checked }).then(loadStaff)} /></td>
                      <td>
                        <button className="btn-primary" onClick={() => deleteStaff(s.id).then(loadStaff)} style={{ color: '#ef4444', padding: '6px 12px', fontSize: '0.7rem', border: 'none', background: '#fff1f2' }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'estudiantes' && (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem', padding: '8px 16px', maxWidth: '400px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Search size={18} color="var(--synth-muted)" />
                <input
                  type="text"
                  placeholder="Filtrar por nombre..."
                  value={studentsSearch}
                  onChange={(e) => setStudentsSearch(e.target.value)}
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
                    <th>Desayuno</th>
                    <th>Almuerzo</th>
                    <th>Cena</th>
                    <th>Dieta Especial</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsList.filter(s => s.nombre?.toLowerCase().startsWith(studentsSearch.toLowerCase())).map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: '600', color: 'var(--synth-dark)' }}>{s.nombre}</td>
                      <td style={{ color: 'var(--synth-muted)', fontSize: '0.85rem' }}>{s.carnet}</td>
                      <td>
                        <div className={`synth-toggle ${s.activo ? '' : 'off'}`} style={{ transform: 'scale(0.7)' }} onClick={() => toggleStudentActive(s.id, !s.activo).then(loadStudents)}></div>
                      </td>
                      <td>
                        <select
                          value={s.plan_desayuno || 'ninguno'}
                          onChange={(e) => updateStudentPlan(s.id, { plan_desayuno: e.target.value }).then(loadStudents)}
                          style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '8px' }}
                        >
                          <option value="ninguno">Ninguno</option>
                          <option value="basico">Básico</option>
                          <option value="completo">Completo</option>
                        </select>
                      </td>
                      <td>
                        <input type="checkbox" checked={!!s.plan_almuerzo} onChange={(e) => updateStudentPlan(s.id, { plan_almuerzo: e.target.checked }).then(loadStudents)} />
                      </td>
                      <td>
                        <input type="checkbox" checked={!!s.plan_cena} onChange={(e) => updateStudentPlan(s.id, { plan_cena: e.target.checked }).then(loadStudents)} />
                      </td>
                      <td>
                        <input
                          type="text"
                          defaultValue={s.dieta_especial || ''}
                          placeholder="Sin restricciones"
                          onBlur={(e) => { const val = e.target.value.trim() || null; if (val !== (s.dieta_especial || null)) updateStudentPlan(s.id, { dieta_especial: val }).then(loadStudents) }}
                          style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '150px' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'mensajes' && (
          <div>
            <div className="card" style={{ marginBottom: '3rem', borderLeft: '4px solid var(--synth-blue)', padding: '24px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                <div style={{ background: 'var(--synth-blue)', color: 'white', padding: '10px', borderRadius: '12px' }}>
                  <Send size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Centro de Comunicaciones</h2>
                  <p style={{ color: 'var(--synth-muted)', fontSize: '0.85rem' }}>Emisión de boletines y alertas institucionales.</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--synth-muted)' }} />
                    <input
                      type="text"
                      placeholder="Asunto del comunicado..."
                      value={msgTitle}
                      onChange={(e) => setMsgTitle(e.target.value)}
                      style={{ width: '100%', paddingLeft: '45px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '16px' }}>
                    <button
                      onClick={() => setMsgTarget('students')}
                      style={{ flex: 1, padding: '8px', fontSize: '0.8rem', background: msgTarget === 'students' ? 'white' : 'transparent', color: msgTarget === 'students' ? 'var(--synth-blue)' : 'var(--synth-muted)', boxShadow: msgTarget === 'students' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none' }}
                    >
                      <User size={16} /> Estudiantes
                    </button>
                    <button
                      onClick={() => setMsgTarget('staff')}
                      style={{ flex: 1, padding: '8px', fontSize: '0.8rem', background: msgTarget === 'staff' ? 'white' : 'transparent', color: msgTarget === 'staff' ? 'var(--synth-blue)' : 'var(--synth-muted)', boxShadow: msgTarget === 'staff' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none' }}
                    >
                      <UserPlus size={16} /> Staff
                    </button>
                    <button
                      onClick={() => setMsgTarget('both')}
                      style={{ flex: 1, padding: '8px', fontSize: '0.8rem', background: msgTarget === 'both' ? 'white' : 'transparent', color: msgTarget === 'both' ? 'var(--synth-blue)' : 'var(--synth-muted)', boxShadow: msgTarget === 'both' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none' }}
                    >
                      <Globe size={16} /> Global
                    </button>
                  </div>
                </div>

                <textarea
                  placeholder="Escribe el mensaje aquí..."
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  style={{ minHeight: '100px', resize: 'vertical' }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn-success" onClick={handleSendMsg} style={{ padding: '0 40px', height: '48px' }}>
                    <Send size={18} /> Enviar Comunicado
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div
                  onClick={handleSelectAll}
                  style={{ cursor: 'pointer', color: selectedMsgs.length === allMessages.length && allMessages.length > 0 ? 'var(--synth-blue)' : '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {selectedMsgs.length === allMessages.length && allMessages.length > 0 ? <CheckSquare size={22} /> : <Square size={22} />}
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--synth-dark)' }}>Seleccionar Todo</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Mensajes Enviados</h3>
              </div>
              {selectedMsgs.length > 0 && (
                <button className="btn-primary" onClick={handleDeleteSelected} style={{ color: '#ef4444', border: '1px solid #fee2e2' }}>
                  <Trash2 size={18} /> Eliminar ({selectedMsgs.length})
                </button>
              )}
            </div>

            <div className="inbox-container">
              {allMessages.map(msg => (
                <div key={msg.id} className="inbox-row" style={{ borderLeft: `4px solid ${msg.target_group === 'students' ? 'var(--synth-blue)' : '#10b981'}` }}>
                  <div onClick={() => toggleMsgSelection(msg.id)} style={{ cursor: 'pointer', color: selectedMsgs.includes(msg.id) ? 'var(--synth-blue)' : '#cbd5e1' }}>
                    {selectedMsgs.includes(msg.id) ? <CheckSquare size={22} /> : <Square size={22} />}
                  </div>
                  <div className="inbox-main">
                    <div className="inbox-header-row">
                      <span className="inbox-title">{msg.title}</span>
                      <span className="inbox-date">Para: {msg.target_group === 'students' ? 'Estudiantes' : 'Personal'} | {new Date(msg.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="inbox-preview">{msg.content}</p>
                  </div>
                </div>
              ))}
              {allMessages.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--synth-muted)' }}>
                  No se han enviado mensajes todavía.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
