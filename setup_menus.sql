-- 1. Crear tabla menus
CREATE TABLE IF NOT EXISTS public.menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('desayuno', 'almuerzo', 'cena')),
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- (OPCIONAL) Si ya habías ejecutado el script anterior, ejecuta solo esta línea para añadir la columna:
-- ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS titulo TEXT NOT NULL DEFAULT 'Menú del Día';

-- 2. Asegurarse que cualquier usuario pueda LEER los menús (para que los estudiantes lo vean en el futuro)
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura publica de menus" ON public.menus FOR SELECT USING (true);
CREATE POLICY "Permitir a staff editar menus" ON public.menus FOR ALL USING (true); -- Ajusta esta política según los roles reales de tu app si tienes RLS restrictivo.

-- 3. Índice para acelerar las búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_menus_fecha ON public.menus(fecha);
