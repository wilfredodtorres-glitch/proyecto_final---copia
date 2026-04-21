-- =============================================
-- SISTEMA DE MENSAJERÍA / COMUNICADOS
-- =============================================

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_group TEXT NOT NULL, -- 'students', 'staff', 'both'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Desactivar RLS por ahora (siguiendo el patrón del proyecto)
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
