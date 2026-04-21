import { supabase } from '../lib/supabaseClient'

// SUBIR FOTO AL STORAGE
export const uploadPhoto = async (file) => {
  if (!file) return null
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    return data.publicUrl
  } catch (error) {
    console.error('Error uploading photo:', error)
    return null
  }
}

// REGISTRO EXTENDIDO
export const register = async ({ email, password, nombre, telefono, carnet, fotoFile }) => {
  try {
    // 1. Subir la foto si existe
    let fotoUrl = null
    if (fotoFile) {
      fotoUrl = await uploadPhoto(fotoFile)
    }

    // 2. Registrar en la autenticación de Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          telefono,
          carnet,
          foto_url: fotoUrl
        }
      }
    })

    if (authError) throw authError

    // 3. Insertar en la tabla 'students' para que el administrador pueda buscarlos
    // Solo si el usuario se creó correctamente
    if (authData?.user) {
      const { error: dbError } = await supabase
        .from('students')
        .insert([
          {
            id: authData.user.id, // Opcional si tu tabla usa UUID
            email: email,
            nombre: nombre,
            telefono: telefono,
            carnet: carnet,
            foto_url: fotoUrl,
            plan_desayuno: 'basico',
            plan_almuerzo: true
          }
        ])

      if (dbError) {
        console.error('Error guardando en la tabla students:', dbError)
        // Eliminamos al usuario de auth si falló la base de datos para no dejar registros huérfanos
        // Pero por ahora solo retornamos el error para que se vea en pantalla.
        throw new Error('Tu cuenta se creó, pero falló el guardado del perfil: ' + dbError.message)
      }
    }

    return { data: authData, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// LOGIN
export const login = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// LOGOUT
export const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}