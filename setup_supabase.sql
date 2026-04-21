-- 1. Crear el bucket 'avatars' y hacerlo público
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permitir que cualquier persona pueda VER (descargar) las imágenes del bucket 'avatars'
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 3. Permitir que cualquier persona (o usuario registrado) pueda SUBIR (insertar) imágenes al bucket 'avatars'
CREATE POLICY "Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

-- --------------------------------------------------------
-- OPCIONAL: Si aún no tienes la tabla 'students', 
-- aquí tienes el código para crearla de una vez:
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY, -- Coincide con el ID de Supabase Auth
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    telefono TEXT,
    carnet TEXT UNIQUE NOT NULL,
    foto_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Si deseas permitir lectura a la tabla students:
-- CREATE POLICY "Permitir lectura publica a students" ON public.students FOR SELECT USING (true);
-- CREATE POLICY "Permitir insertar a students" ON public.students FOR INSERT WITH CHECK (true);
