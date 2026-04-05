-- ============================================================
-- InsideOut — Registro Emocional
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. Crear tabla principal
CREATE TABLE IF NOT EXISTS registros_emocionales (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  fecha       date NOT NULL,
  hora        time NOT NULL,
  emocion     text NOT NULL CHECK (
                emocion IN ('Alegría','Tristeza','Furia','Temor',
                            'Desagrado','Ansiedad','Envidia','Ennui','Vergüenza')
              ),
  nivel       int NOT NULL CHECK (nivel BETWEEN 1 AND 5),
  descripcion text,
  pensamiento_automatico text,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Índices útiles
CREATE INDEX IF NOT EXISTS idx_registros_user_fecha
  ON registros_emocionales (user_id, fecha DESC);

-- 3. Activar Row Level Security
ALTER TABLE registros_emocionales ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
CREATE POLICY "Usuarios ven sus propios registros"
  ON registros_emocionales FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios insertan sus propios registros"
  ON registros_emocionales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios actualizan sus propios registros"
  ON registros_emocionales FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios eliminan sus propios registros"
  ON registros_emocionales FOR DELETE
  USING (auth.uid() = user_id);
