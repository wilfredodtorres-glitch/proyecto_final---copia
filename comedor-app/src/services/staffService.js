import { supabase } from '../lib/supabaseClient'

// ==============================
// GESTIÓN DE PERSONAL
// ==============================

// Crear cuenta de personal
export const createStaffAccount = async ({ email, password, nombre }) => {
  try {
    // 1. Registrar en Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, role: 'staff' }
      }
    })
    if (authError) throw authError

    // 2. Insertar en tabla staff
    if (authData?.user) {
      const { error: dbError } = await supabase
        .from('staff')
        .insert([{
          id: authData.user.id,
          email,
          nombre,
          activo: true,
          perm_verificar_carnet: true,
          perm_registrar_retiro: true,
          perm_validar_autorizaciones: false,
          perm_ver_turno: false,
          perm_ver_reportes: false
        }])
      if (dbError) throw dbError
    }

    return { data: authData, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Obtener lista de personal
export const getStaffList = async () => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Obtener perfil del personal logueado
export const getStaffProfile = async (email) => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('email', email)
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Actualizar permisos individuales
export const updateStaffPermissions = async (staffId, permissions) => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .update(permissions)
      .eq('id', staffId)
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Activar/desactivar cuenta de personal
export const toggleStaffActive = async (staffId, activo) => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .update({ activo })
      .eq('id', staffId)
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Eliminar cuenta de personal
export const deleteStaff = async (staffId) => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .delete()
      .eq('id', staffId)
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
