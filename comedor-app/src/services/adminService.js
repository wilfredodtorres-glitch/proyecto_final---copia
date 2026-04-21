import { supabase } from '../lib/supabaseClient'

// Verificar carnet
export const verifyStudent = async (carnet) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('carnet', carnet)
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Obtener las reservas de hoy de un estudiante
export const getStudentTodayMeals = async (studentId) => {
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

// Registrar retiro de una comida específica por su ID
export const registerMealById = async (mealId) => {
  try {
    const { data, error } = await supabase
      .from('meals')
      .update({ estado: 'retirado' })
      .eq('id', mealId)
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Registrar retiro genérico (mantener compatibilidad)
export const registerMeal = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('meals')
      .update({ estado: 'retirado' })
      .eq('student_id', studentId)
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Crear una nueva comida/retiro directamente
export const createMeal = async (studentId, tipo, estado = 'retirado') => {
  try {
    const { data, error } = await supabase
      .from('meals')
      .insert([{ student_id: studentId, tipo, estado }])
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Reporte
export const getReport = async (dateFilter = null) => {
  try {
    let startOfDay, endOfDay;
    if (dateFilter) {
      const [year, month, day] = dateFilter.split('-');
      startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
    } else {
      startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)
    }

    const { data, error } = await supabase
      .from('meals')
      .select('*, students(nombre, carnet)')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: false })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Deshacer retiro (volver a reservado)
export const undoMealPickup = async (mealId) => {
  try {
    const { data, error } = await supabase
      .from('meals')
      .update({ estado: 'reservado' })
      .eq('id', mealId)
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// ==============================
// GESTIÓN DE ESTUDIANTES
// ==============================

// Obtener lista de todos los estudiantes
export const getStudentsList = async () => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Activar/desactivar cuenta de estudiante
export const toggleStudentActive = async (studentId, activo) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .update({ activo })
      .eq('id', studentId)
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Eliminar cuenta de estudiante
export const deleteStudent = async (studentId) => {
  try {
    await supabase.from('meals').delete().eq('student_id', studentId)
    const { data, error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId)
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Actualizar plan de comida del estudiante
export const updateStudentPlan = async (studentId, planUpdates) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .update(planUpdates)
      .eq('id', studentId)
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// ==============================
// GESTIÓN DE MENÚS
// ==============================

export const createMenu = async (fecha, tipo, titulo, descripcion) => {
  try {
    const { data, error } = await supabase
      .from('menus')
      .insert([{ fecha, tipo, titulo, descripcion }])
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const getMenus = async (filtroFecha, filtroTipo, busqueda) => {
  try {
    let query = supabase.from('menus').select('*')
    
    if (filtroFecha) {
      query = query.eq('fecha', filtroFecha)
    }
    if (filtroTipo && filtroTipo !== 'todos') {
      query = query.eq('tipo', filtroTipo)
    }
    if (busqueda) {
      query = query.ilike('descripcion', `%${busqueda}%`)
    }
    
    // Ordenar cronológicamente por fecha descendente
    query = query.order('fecha', { ascending: false }).order('tipo', { ascending: true })

    const { data, error } = await query
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const deleteMenu = async (menuId) => {
  try {
    const { data, error } = await supabase
      .from('menus')
      .delete()
      .eq('id', menuId)
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}