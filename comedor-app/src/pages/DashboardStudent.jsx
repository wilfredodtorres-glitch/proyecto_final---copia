import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  getTodayMealsStatus,
  authorizePerson,
  reserveMeal,
  getMealHistory,
  getStudentProfile,
  updateStudentProfile,
  cancelReservation,
  removeAuthorization,
  deleteMealHistory
} from '../services/studentService'
import { getMessagesForStudents } from '../services/messageService'
import { uploadPhoto } from '../services/authService'
import { Menu, Coffee, History, User, Mail, Settings, LogOut, ChevronRight, CheckCircle2, XCircle, Utensils, Moon, QrCode as QrIcon } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'

export default function DashboardStudent({ userEmail, userId }) {
  const [activeTab, setActiveTab] = useState('comedor')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [profile, setProfile] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ nombre: '', telefono: '' })
  const [newPhotoFile, setNewPhotoFile] = useState(null)
  const [todayMeals, setTodayMeals] = useState([])
  const [authInputs, setAuthInputs] = useState({
    desayuno: { nombre: '', carnet: '' },
    almuerzo: { nombre: '', carnet: '' },
    cena: { nombre: '', carnet: '' }
  })
  const [showAuthForm, setShowAuthForm] = useState(null)
  const [history, setHistory] = useState([])
  const [inbox, setInbox] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Estadísticas del historial
  const [stats, setStats] = useState({ total: 0, desayunos: 0, almuerzos: 0, cenas: 0 })

  useEffect(() => {
    loadProfile()
    loadTodayMeals()
    checkNewMessages()

    const profileSubscription = supabase
      .channel(`profile_changes_${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'students', filter: `id=eq.${userId}` },
        (payload) => {
          setProfile(payload.new)
          setEditForm({ nombre: payload.new.nombre, telefono: payload.new.telefono || '' })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(profileSubscription)
    }
  }, [userId])

  useEffect(() => {
    setMessage('')
    if (activeTab === 'historial') loadHistory()
    if (activeTab === 'comedor') loadTodayMeals()
    if (activeTab === 'mensajes') {
      loadInbox()
      setUnreadCount(0)
    } else {
      checkNewMessages()
    }
  }, [activeTab, profile])

  const showStatus = (msg) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  const loadProfile = async () => {
    const { data } = await getStudentProfile(userEmail)
    if (data) {
      setProfile(data)
      setEditForm({ nombre: data.nombre, telefono: data.telefono || '' })
    }
  }

  const loadTodayMeals = async () => {
    const { data } = await getTodayMealsStatus(userId)
    if (data) setTodayMeals(data)
  }

  const loadHistory = async () => {
    const { data } = await getMealHistory(userId)
    if (data) {
      setHistory(data)
      // Calcular estadísticas
      const retirados = data.filter(h => h.estado === 'retirado')
      setStats({
        total: retirados.length,
        desayunos: retirados.filter(h => h.tipo === 'desayuno').length,
        almuerzos: retirados.filter(h => h.tipo === 'almuerzo').length,
        cenas: retirados.filter(h => h.tipo === 'cena').length
      })
    }
  }

  const loadInbox = async () => {
    if (!profile) return
    const { data } = await getMessagesForStudents(profile.created_at)
    if (data) {
      setInbox(data)
      if (data.length > 0) localStorage.setItem(`last_msg_${userId}`, data[0].id)
    }
  }

  const checkNewMessages = async () => {
    if (!profile) return
    const { data } = await getMessagesForStudents(profile.created_at)
    if (data && data.length > 0) {
      const lastSeenId = localStorage.getItem(`last_msg_${userId}`)
      let count = 0
      for (const msg of data) {
        if (msg.id === lastSeenId) break
        count++
      }
      setUnreadCount(count)
    }
  }

  const handleReserve = async (tipo, isAuth = false) => {
    setMessage('')
    let autorizado_a = null
    if (isAuth) {
      const inputs = authInputs[tipo]
      if (!inputs.nombre.trim() || !inputs.carnet.trim()) {
        showStatus('Ingresa nombre y carnet para autorizar.')
        return
      }
      autorizado_a = `${inputs.nombre} (Carnet: ${inputs.carnet})`
    }
    const { error } = await reserveMeal(userId, tipo, autorizado_a)
    if (!error) {
      showStatus(`${tipo} reservado exitosamente.`)
      setAuthInputs({ ...authInputs, [tipo]: { nombre: '', carnet: '' } }) // Limpiar datos
      setShowAuthForm(null)
      loadTodayMeals()
    }
  }

  const handleSaveProfile = async () => {
    setMessage('')
    let updates = { ...editForm }
    if (newPhotoFile) {
      const fotoUrl = await uploadPhoto(newPhotoFile)
      if (fotoUrl) updates.foto_url = fotoUrl
    }
    const { error } = await updateStudentProfile(profile.id, updates)
    if (!error) {
      showStatus('Perfil actualizado.')
      setEditMode(false)
      loadProfile()
    }
  }

  const renderMealCard = (tipo) => {
    const meal = todayMeals.find(m => m.tipo === tipo)
    let displayTitle = tipo.charAt(0).toUpperCase() + tipo.slice(1)

    // Verificar si el estudiante tiene este tipo de comida en su plan
    let tienePlan = false
    if (tipo === 'desayuno') tienePlan = profile?.plan_desayuno && profile.plan_desayuno !== 'ninguno'
    if (tipo === 'almuerzo') tienePlan = !!profile?.plan_almuerzo
    if (tipo === 'cena') tienePlan = !!profile?.plan_cena

    if (tipo === 'desayuno' && tienePlan) {
      displayTitle = `Desayuno ${profile.plan_desayuno.charAt(0).toUpperCase() + profile.plan_desayuno.slice(1)}`
    }

    return (
      <div className="card" key={tipo}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem' }}>{displayTitle}</h3>
          {meal && <span className={`status-badge ${meal.estado}`}>{meal.estado}</span>}
        </div>

        {!tienePlan && !meal ? (
          <div style={{ textAlign: 'center', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <p style={{ color: 'var(--synth-muted)', fontSize: '0.85rem', margin: 0 }}>No incluido en tu plan de comedor.</p>
          </div>
        ) : !meal ? (
          <div>
            {showAuthForm === tipo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <input type="text" placeholder="Nombre autorizado" value={authInputs[tipo].nombre} onChange={(e) => setAuthInputs({ ...authInputs, [tipo]: { ...authInputs[tipo], nombre: e.target.value } })} />
                <input type="text" placeholder="Carnet" value={authInputs[tipo].carnet} onChange={(e) => setAuthInputs({ ...authInputs, [tipo]: { ...authInputs[tipo], carnet: e.target.value } })} />
                <button className="btn-success" onClick={() => handleReserve(tipo, true)}>Confirmar</button>
                <button className="btn-primary" onClick={() => {
                  setAuthInputs({ ...authInputs, [tipo]: { nombre: '', carnet: '' } });
                  setShowAuthForm(null);
                }}>Cancelar</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <button className="btn-success" onClick={() => handleReserve(tipo, false)}>Reservar para mí</button>
                <button className="btn-primary" onClick={() => setShowAuthForm(tipo)}>Autorizar a otro</button>
              </div>
            )}
          </div>
        ) : (
          <div>
            {meal.estado === 'retirado' ? (
              <div style={{ textAlign: 'center', padding: '10px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <p style={{ color: '#166534', fontWeight: '600', fontSize: '0.9rem', margin: 0 }}>¡Buen provecho! Ya has retirado tu {tipo}.</p>
              </div>
            ) : (
              <>
                <p style={{ color: 'var(--synth-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {meal.autorizado_a ? `Retira: ${meal.autorizado_a}` : 'Retiras tú personalmente'}
                </p>
                <button className="btn-primary" onClick={() => cancelReservation(meal.id).then(loadTodayMeals)} style={{ width: '100%', color: '#ef4444' }}>Cancelar Reserva</button>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  const getMealIcon = (tipo) => {
    if (tipo === 'desayuno') return <Coffee size={20} />
    if (tipo === 'almuerzo') return <Utensils size={20} />
    return <Moon size={20} />
  }

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div style={{ marginTop: '-10px' }}>
          <h1 style={{ fontSize: '2.5rem' }}>Student <span style={{ color: 'var(--synth-blue)' }}>COSEVA.</span></h1>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--synth-dark)' }}>
            Hola, <span style={{ color: 'var(--synth-blue)' }}>{profile?.nombre?.split(' ')[0]}</span>
          </h2>
        </div>
        <div className="tabs-container" style={{ margin: 0 }}>
          <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Menu size={18} /> {isMenuOpen ? 'Cerrar Menú' : 'Menú Estudiantil'}
          </button>
          <div className={`tabs ${isMenuOpen ? 'open' : ''}`}>
            <button className={activeTab === 'comedor' ? 'active' : ''} onClick={() => { setActiveTab('comedor'); setIsMenuOpen(false); }}><Coffee size={18} /> Comedor</button>
            <button className={activeTab === 'historial' ? 'active' : ''} onClick={() => { setActiveTab('historial'); setIsMenuOpen(false); }}><History size={18} /> Historial</button>
            <button className={activeTab === 'mensajes' ? 'active' : ''} onClick={() => { setActiveTab('mensajes'); setIsMenuOpen(false); }} style={{ position: 'relative' }}>
              <Mail size={18} /> Mensajes
              {unreadCount > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '0.7rem',
                  padding: '2px 7px',
                  borderRadius: '50px',
                  marginLeft: '8px',
                  fontWeight: '800',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
            <button className={activeTab === 'perfil' ? 'active' : ''} onClick={() => { setActiveTab('perfil'); setIsMenuOpen(false); }}><User size={18} /> Perfil</button>
          </div>
        </div>
      </header>

      {message && <div className="status-alert">{message}</div>}

      <div className="tab-content">
        {activeTab === 'comedor' && (
          <div className="grid-fluid">
            {renderMealCard('desayuno')}
            {renderMealCard('almuerzo')}
            {renderMealCard('cena')}
          </div>
        )}

        {activeTab === 'historial' && (
          <div>
            {/* Stats Summary */}
            <div className="stats-grid">
              <div className="stat-card">
                <h5>Total Retirados</h5>
                <div className="value">{stats.total}</div>
              </div>
              <div className="stat-card">
                <h5>Desayunos</h5>
                <div className="value">{stats.desayunos}</div>
              </div>
              <div className="stat-card">
                <h5>Almuerzos</h5>
                <div className="value">{stats.almuerzos}</div>
              </div>
              <div className="stat-card">
                <h5>Cenas</h5>
                <div className="value">{stats.cenas}</div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Registro de Actividad</h3>
              <div className="activity-list">
                {history.map(h => (
                  <div key={h.id} className="activity-item">
                    <div className="activity-icon">
                      {getMealIcon(h.tipo)}
                    </div>
                    <div className="activity-info">
                      <h4>{h.tipo}</h4>
                      {h.autorizado_a && <p style={{ color: 'var(--synth-blue)', fontWeight: '600', fontSize: '0.75rem' }}>Retira: {h.autorizado_a}</p>}
                      <p>{new Date(h.created_at).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <span className={`status-badge ${h.estado}`}>{h.estado}</span>
                  </div>
                ))}
                {history.length === 0 && <p style={{ textAlign: 'center', color: 'var(--synth-muted)' }}>No hay registros disponibles todavía.</p>}
              </div>
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
                No tienes mensajes nuevos.
              </div>
            )}
          </div>
        )}

        {activeTab === 'perfil' && (
          <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="profile-photo-container">
              {profile?.foto_url ? <img src={profile.foto_url} className="profile-photo" alt="Perfil" /> : <div className="profile-photo-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f1f5f9', color: '#cbd5e1' }}><User size={48} /></div>}
            </div>
            <div style={{ textAlign: 'center' }}>
              {editMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <input type="text" value={editForm.nombre} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })} />
                  <input type="text" value={editForm.telefono} onChange={e => setEditForm({ ...editForm, telefono: e.target.value })} />
                  <input type="file" accept="image/*" onChange={e => setNewPhotoFile(e.target.files[0])} />
                  <button className="btn-success" onClick={handleSaveProfile}>Guardar Cambios</button>
                  <button className="btn-primary" onClick={() => setEditMode(false)}>Cancelar</button>
                </div>
              ) : (
                <>
                  <h2>{profile?.nombre}</h2>
                  <p style={{ color: 'var(--synth-muted)', marginBottom: '1.5rem' }}>{profile?.carnet} | {profile?.email}</p>

                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', textAlign: 'left', marginBottom: '2rem' }}>
                    <p style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--synth-dark)' }}>Tu Plan de Comedor:</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem' }}>
                        <span>Desayuno</span>
                        <span style={{ fontWeight: '700', color: profile?.plan_desayuno && profile?.plan_desayuno !== 'ninguno' ? 'var(--synth-blue)' : 'var(--synth-muted)' }}>
                          {profile?.plan_desayuno && profile?.plan_desayuno !== 'ninguno' ? profile.plan_desayuno.toUpperCase() : 'NINGUNO'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem' }}>
                        <span>Almuerzo</span>
                        {profile?.plan_almuerzo ? <CheckCircle2 size={20} color="#16a34a" /> : <XCircle size={20} color="#cbd5e1" />}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem' }}>
                        <span>Cena</span>
                        {profile?.plan_cena ? <CheckCircle2 size={20} color="#16a34a" /> : <XCircle size={20} color="#cbd5e1" />}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                    <p style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--synth-dark)', margin: 0 }}>Tu Código QR para el Comedor</p>
                    <div style={{ padding: '15px', background: 'white', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                      <QRCodeCanvas 
                        value={profile?.carnet || ''} 
                        size={180}
                        level={"H"}
                        includeMargin={true}
                      />
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--synth-muted)', textAlign: 'center' }}>Muestra este código en el mostrador para verificar tu carnet rápidamente.</p>
                  </div>

                  {profile?.dieta_especial && (
                    <div style={{ background: '#fef3c7', padding: '16px 20px', borderRadius: '16px', border: '1px solid #f59e0b', textAlign: 'left', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '1.3rem' }}>⚠️</span>
                      <div>
                        <p style={{ fontWeight: '700', fontSize: '0.85rem', color: '#92400e', margin: 0 }}>Dieta Especial Asignada</p>
                        <p style={{ fontSize: '0.9rem', color: '#78350f', margin: 0 }}>{profile.dieta_especial}</p>
                      </div>
                    </div>
                  )}

                  <button className="btn-primary" onClick={() => setEditMode(true)} style={{ marginInline: 'auto' }}>Editar Datos de Contacto</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
