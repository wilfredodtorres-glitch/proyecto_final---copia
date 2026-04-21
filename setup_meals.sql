-- 1. Agregar la columna 'tipo' a la tabla 'meals'
ALTER TABLE public.meals
ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'general';

-- 2. (Opcional) Si quieres limpiar los datos viejos para empezar de cero,
-- puedes descomentar la siguiente linea:
-- TRUNCATE TABLE public.meals;
