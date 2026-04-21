import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../services/authService'
import { supabase } from '../lib/supabaseClient'
import { getStaffProfile } from '../services/staffService'
import { getStudentProfile } from '../services/studentService'
import DashboardAdmin from './DashboardAdmin'
import DashboardStudent from './DashboardStudent'
import DashboardStaff from './DashboardStaff'
import { LogOut } from 'lucide-react'

function Dashboard() {
  const navigate = useNavigate()
  const [userEmail, setUserEmail] = useState(null)
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState(null) // 'admin', 'staff', 'student', 'disabled'

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/')
        return
      }

      const email = session.user.email
      const id = session.user.id
      setUserEmail(email)
      setUserId(id)

      const ADMIN_EMAILS = [
        'admin@unadeca.ac.cr',
        'admin@unadeca.net',
      ]

      if (ADMIN_EMAILS.includes(email)) {
        setRole('admin')
      } else {
        const { data: staffData } = await getStaffProfile(email)
        if (staffData) {
          setRole(staffData.activo ? 'staff' : 'disabled')
        } else {
          const { data: studentData } = await getStudentProfile(email)
          if (studentData && studentData.activo === false) {
            setRole('disabled')
          } else {
            setRole('student')
          }
        }
      }
      setLoading(false)
    }

    checkUser()
  }, [navigate])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      alert('Error al cerrar sesión: ' + error.message)
    }
  }

  if (loading) return <div className="loading">Cargando Engine...</div>

  return (
    <div className="dashboard-layout" style={{ minHeight: '100vh' }}>
      {/* Barra Superior Fija para evitar solapamientos */}
      <nav style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        height: '60px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-end', 
        padding: '0 20px', 
        zIndex: 1000,
        pointerEvents: 'none'
      }}>
        <button 
          onClick={handleLogout} 
          className="btn-primary" 
          style={{ 
            pointerEvents: 'auto',
            padding: '8px 16px', 
            fontSize: '0.75rem',
            borderRadius: '12px',
            background: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <LogOut size={14} /> <span className="hide-mobile">Cerrar Sesión</span><span className="show-mobile">Salir</span>
        </button>
      </nav>

      <main className="dashboard-main" style={{ paddingTop: '40px' }}>
        {role === 'disabled' && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <h2>Cuenta Desactivada</h2>
            <p style={{ marginTop: '1rem' }}>Tu cuenta ha sido desactivada. Contacta al administrador.</p>
          </div>
        )}
        {role === 'admin' && <DashboardAdmin />}
        {role === 'staff' && <DashboardStaff userEmail={userEmail} />}
        {role === 'student' && <DashboardStudent userEmail={userEmail} userId={userId} />}
      </main>
    </div>
  )
}

export default Dashboard