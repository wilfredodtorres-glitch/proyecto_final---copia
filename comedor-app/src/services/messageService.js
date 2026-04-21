import { supabase } from '../lib/supabaseClient'

/**
 * Envía un nuevo comunicado a Supabase
 */
export const sendMessage = async (title, content, targetGroup) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ title, content, target_group: targetGroup }])
  return { data, error }
}

/**
 * Obtiene los mensajes para estudiantes
 */
export const getMessagesForStudents = async (createdAt = null) => {
  let query = supabase
    .from('messages')
    .select('*')
    .in('target_group', ['students', 'both'])
  
  if (createdAt) {
    query = query.gte('created_at', createdAt)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  return { data, error }
}

/**
 * Obtiene los mensajes para el personal
 */
export const getMessagesForStaff = async (createdAt = null) => {
  let query = supabase
    .from('messages')
    .select('*')
    .in('target_group', ['staff', 'both'])
    
  if (createdAt) {
    query = query.gte('created_at', createdAt)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  return { data, error }
}

/**
 * Elimina múltiples mensajes por sus IDs
 */
export const deleteMultipleMessages = async (ids) => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .in('id', ids)
  return { error }
}

/**
 * Elimina TODOS los mensajes (vaciar historial)
 */
export const deleteAllMessages = async () => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .neq('id', 0) // Borra todo lo que tenga un ID (truco para borrar todo)
  return { error }
}

/**
 * Eliminar un mensaje individual
 */
export const deleteMessage = async (id) => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', id)
  return { error }
}
