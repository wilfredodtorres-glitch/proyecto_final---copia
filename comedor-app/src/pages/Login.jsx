import { useState } from 'react'
import { login, register } from '../services/authService'
import { useNavigate } from 'react-router-dom'
import { UtensilsCrossed, ShieldCheck } from 'lucide-react'

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false)
  
  // Estados para Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // Estados adicionales para Registro
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [carnet, setCarnet] = useState('')
  const [fotoFile, setFotoFile] = useState(null)

  const [message, setMessage] = useState(null)
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)
    try {
      const { data, error } = await login(email, password)
      if (error) {
        setIsError(true)
        setMessage('Error al iniciar sesión: ' + error.message)
      } else {
        setIsError(false)
        setMessage('Acceso concedido. Sincronizando...')
        setTimeout(() => navigate('/dashboard'), 1000)
      }
    } catch (err) {
      setIsError(true)
      setMessage('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!nombre || !carnet || !email || !password) {
      setIsError(true)
      setMessage('Por favor, completa los campos obligatorios.')
      return
    }

    setMessage(null)
    setLoading(true)
    try {
      const { data, error } = await register({
        email,
        password,
        nombre,
        telefono,
        carnet,
        fotoFile
      })
      if (error) {
        setIsError(true)
        setMessage('Error al registrarse: ' + error.message)
      } else {
        setIsError(false)
        setMessage('Registro exitoso. Ya puedes iniciar sesión.')
        setNombre(''); setTelefono(''); setCarnet(''); setFotoFile(null); setPassword('')
        setIsRegistering(false)
      }
    } catch (err) {
      setIsError(true)
      setMessage('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="card login-card" style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            background: 'var(--synth-blue)', 
            padding: '20px', 
            borderRadius: '24px', 
            boxShadow: '0 10px 30px rgba(0, 102, 255, 0.2)',
            color: 'white'
          }}>
            <UtensilsCrossed size={48} />
          </div>
        </div>

        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          Comedor <span style={{ color: 'var(--synth-blue)' }}>COSEVA.</span>
        </h1>
        <p style={{ color: 'var(--synth-muted)', marginBottom: '2.5rem' }}>
          {isRegistering ? 'Crea tu perfil de estudiante' : 'Bienvenido al ecosistema UNADECA'}
        </p>

        {message && (
          <div className={isError ? 'alert-message' : 'success-message'} style={{ marginBottom: '2rem' }}>
            {message}
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isRegistering && (
            <>
              <input type="text" placeholder="Nombre completo *" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
              <input type="text" placeholder="Número de carnet *" value={carnet} onChange={(e) => setCarnet(e.target.value)} required />
              <input type="tel" placeholder="Teléfono (opcional)" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </>
          )}
          
          <input type="email" placeholder="Correo institucional" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" autoComplete={isRegistering ? "new-password" : "current-password"} />

          {isRegistering && (
            <div style={{ textAlign: 'left', marginTop: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--synth-muted)', marginLeft: '10px' }}>Foto de perfil (opcional)</label>
              <input type="file" accept="image/*" onChange={(e) => setFotoFile(e.target.files[0])} style={{ marginTop: '5px' }} />
            </div>
          )}

          <button type="submit" className="btn-success" disabled={loading} style={{ width: '100%', marginTop: '1rem', height: '56px', fontSize: '1.1rem' }}>
            {loading ? 'Procesando...' : (isRegistering ? 'Confirmar Registro' : 'Iniciar Sesión')}
          </button>
          
          <button type="button" className="btn-primary" onClick={() => { setIsRegistering(!isRegistering); setMessage(null); }} style={{ width: '100%', background: 'transparent', color: 'var(--synth-muted)', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : 'Registrarme como estudiante'}
          </button>
        </form>

        <div style={{ marginTop: '3rem', fontSize: '0.8rem', color: 'var(--synth-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <ShieldCheck size={14} /> Acceso Seguro UNADECA
        </div>
      </div>
    </div>
  )
}