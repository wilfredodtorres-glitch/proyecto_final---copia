-- =============================================
-- SISTEMA DE PERSONAL DEL COMEDOR - UNADECA
-- =============================================

-- 1. Crear tabla de personal del comedor
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    activo BOOLEAN DEFAULT true,
    perm_verificar_carnet BOOLEAN DEFAULT true,
    perm_registrar_retiro BOOLEAN DEFAULT true,
    perm_validar_autorizaciones BOOLEAN DEFAULT false,
    perm_ver_turno BOOLEAN DEFAULT false,
    perm_ver_reportes BOOLEAN DEFAULT false,
    perm_ver_menus BOOLEAN DEFAULT false,
    perm_desactivar_estudiante BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- (OPCIONAL) Si ya habías ejecutado el script, ejecuta estas líneas para añadir los nuevos permisos:
-- ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS perm_ver_menus BOOLEAN DEFAULT false;
-- ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS perm_desactivar_estudiante BOOLEAN DEFAULT false;

-- 2. Desactivar RLS para la tabla staff
ALTER TABLE public.staff DISABLE ROW LEVEL SECURITY;

-- 3. Agregar columna 'activo' a la tabla de estudiantes
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- 4. Agregar columna 'dieta_especial' para restricciones alimenticias
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS dieta_especial TEXT DEFAULT NULL;
