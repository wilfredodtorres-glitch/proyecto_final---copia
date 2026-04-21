import { supabase } from '../lib/supabaseClient'

// ==============================
// COMEDOR (RESERVAS)
// ==============================

// Ver estado de comida de hoy (los 3 tiempos)
export const getTodayMealsStatus = async (studentId) => {
  try {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('student_id', studentId)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Reservar comida
export const reserveMeal = async (studentId, tipo, autorizado_a = null) => {
  try {
    const { data, error } = await supabase
      .from('meals')
      .insert([{ 
        student_id: studentId, 
        estado: 'reservado', 
        tipo,
        autorizado_a
      }])
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Autorizar a alguien
export const authorizePerson = async (mealId, nombre) => {
  try {
    const { data, error } = await supabase
      .from('meals')
      .update({ autorizado_a: nombre })
      .eq('id', mealId)
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// ==============================
// HISTORIAL
// ==============================

export const getMealHistory = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// ==============================
// PERFIL
// ==============================

export const getStudentProfile = async (email) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .single()
      
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const updateStudentProfile = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
// Cancelar una reserva completamente
export const cancelReservation = async (mealId) => {
  try {
    const { data, error } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId)
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Quitar la autorización sin borrar la reserva
export const removeAuthorization = async (mealId) => {
  try {
    const { data, error } = await supabase
      .from('meals')
      .update({ autorizado_a: null })
      .eq('id', mealId)
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Borrar el historial (todas las reservas de antes de hoy)
export const deleteMealHistory = async (studentId) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('meals')
      .delete()
      .eq('student_id', studentId)
      .lt('created_at', `${today}T00:00:00Z`) // menor a las 00:00 de hoy
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}