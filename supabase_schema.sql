-- =====================================================================
-- ESQUEMA DE BASE DE DATOS PARA WODWISE / MODO ATLETA (FASE 2)
-- Instrucciones: Ejecuta este script en el SQL Editor de tu proyecto Supabase.
-- =====================================================================

-- 1. TABLA DE PERFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  training_level TEXT NOT NULL,
  main_goal TEXT NOT NULL,
  training_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS en public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Crear política RLS para profiles
CREATE POLICY "Users can manage their own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Función y trigger para auto-crear perfil en el registro (signUp)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, training_level, main_goal, training_type)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Atleta'),
    'beginner',
    'maintenance',
    'functional'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger disparador
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. TABLA DE SESIONES DE ENTRENAMIENTO (training_sessions)
CREATE TABLE IF NOT EXISTS public.training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT null,
  date DATE NOT null,
  type TEXT NOT null,
  name TEXT NOT null,
  duration_minutes INTEGER,
  perceived_difficulty INTEGER NOT null,
  perceived_intensity INTEGER NOT null,
  energy_before INTEGER NOT null,
  energy_after INTEGER NOT null,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own training sessions"
  ON public.training_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 3. TABLA DE SECCIONES DE ENTRENAMIENTO (training_sections)
CREATE TABLE IF NOT EXISTS public.training_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.training_sessions ON DELETE CASCADE NOT null,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT null,
  type TEXT NOT null,
  name TEXT,
  sort_order INTEGER NOT null,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT null
);

ALTER TABLE public.training_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sections"
  ON public.training_sections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 4. TABLA DE EJERCICIOS POR SECCIÓN (section_exercises)
CREATE TABLE IF NOT EXISTS public.section_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES public.training_sections ON DELETE CASCADE NOT null,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT null,
  name TEXT NOT null,
  sort_order INTEGER NOT null,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT null
);

ALTER TABLE public.section_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own exercises"
  ON public.section_exercises FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 5. TABLA DE SERIES POR EJERCICIO (exercise_sets)
CREATE TABLE IF NOT EXISTS public.exercise_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES public.section_exercises ON DELETE CASCADE NOT null,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT null,
  set_number INTEGER NOT null,
  weight_kg NUMERIC,
  reps INTEGER,
  completed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT null
);

ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sets"
  ON public.exercise_sets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 6. TABLA DE SCORES / MARCAS POR SECCIÓN (section_scores)
CREATE TABLE IF NOT EXISTS public.section_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES public.training_sections ON DELETE CASCADE UNIQUE NOT null,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT null,
  sets INTEGER,
  weight_kg NUMERIC,
  reps INTEGER,
  final_time TEXT,
  distance_meters NUMERIC,
  calories NUMERIC,
  rounds INTEGER,
  reps_completed INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.section_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own scores"
  ON public.section_scores FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 7. TABLA DE COMIDAS (meal_logs)
CREATE TABLE IF NOT EXISTS public.meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT null,
  date DATE NOT null,
  meal_type TEXT NOT null,
  description TEXT NOT null,
  calories INTEGER,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT null
);

ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own meals"
  ON public.meal_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 8. TABLA DE PROGRESO CORPORAL (body_progress)
CREATE TABLE IF NOT EXISTS public.body_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT null,
  date DATE NOT null,
  weight_kg NUMERIC NOT null,
  body_fat_percentage NUMERIC,
  muscle_mass_kg NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT null
);

ALTER TABLE public.body_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own body progress"
  ON public.body_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 9. TABLA DE OBJETIVOS (user_goals)
CREATE TABLE IF NOT EXISTS public.user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT null,
  goal_type TEXT NOT null,
  target_value TEXT NOT null,
  current_value TEXT,
  deadline DATE,
  status TEXT DEFAULT 'active'::text NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT null
);

ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own goals"
  ON public.user_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- =====================================================================
-- 10. GUARDADO ATÓMICO DE ENTRENAMIENTOS (FASE 3 - corrección de bugs)
-- Los niveles de energía son opcionales en la app; se relaja el NOT NULL.
-- =====================================================================
ALTER TABLE public.training_sessions ALTER COLUMN energy_before DROP NOT NULL;
ALTER TABLE public.training_sessions ALTER COLUMN energy_after DROP NOT NULL;

-- Reemplaza el patrón delete + inserts múltiples del cliente por una única
-- función transaccional: si cualquier insert falla, se revierte todo y el
-- workout original no se pierde. SECURITY INVOKER: las políticas RLS aplican.
CREATE OR REPLACE FUNCTION public.save_workout(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_session_id uuid := (payload->>'id')::uuid;
  sec jsonb;
  v_section_id uuid;
  v_exercise_id uuid;
  v_exercise_name text;
  v_score jsonb;
  v_sets integer;
  sec_idx integer := 0;
  ex_idx integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'save_workout: no authenticated user';
  END IF;

  -- Estrategia de reemplazo: el borrado cascada elimina secciones,
  -- ejercicios, sets y scores de la versión anterior.
  DELETE FROM public.training_sessions
  WHERE id = v_session_id AND user_id = v_user_id;

  INSERT INTO public.training_sessions (
    id, user_id, date, type, name, duration_minutes,
    perceived_difficulty, perceived_intensity,
    energy_before, energy_after, notes, created_at
  )
  VALUES (
    v_session_id,
    v_user_id,
    (payload->>'date')::date,
    payload->>'type',
    payload->>'name',
    (payload->>'durationMinutes')::integer,
    (payload->>'perceivedDifficulty')::integer,
    COALESCE((payload->>'perceivedIntensity')::integer, (payload->>'perceivedDifficulty')::integer),
    (payload->>'energyBefore')::integer,
    (payload->>'energyAfter')::integer,
    NULLIF(payload->>'notes', ''),
    COALESCE((payload->>'createdAt')::timestamptz, now())
  );

  FOR sec IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'sections', '[]'::jsonb))
  LOOP
    INSERT INTO public.training_sections (session_id, user_id, type, name, sort_order)
    VALUES (v_session_id, v_user_id, sec->>'type', NULLIF(sec->>'name', ''), sec_idx)
    RETURNING id INTO v_section_id;

    v_score := sec->'score';
    IF v_score IS NOT NULL AND jsonb_typeof(v_score) = 'object' THEN
      INSERT INTO public.section_scores (
        section_id, user_id, sets, weight_kg, reps, final_time,
        distance_meters, calories, rounds, reps_completed, notes
      )
      VALUES (
        v_section_id,
        v_user_id,
        (v_score->>'sets')::integer,
        (v_score->>'weightKg')::numeric,
        (v_score->>'reps')::integer,
        v_score->>'finalTime',
        (v_score->>'distanceMeters')::numeric,
        (v_score->>'calories')::numeric,
        (v_score->>'rounds')::integer,
        (v_score->>'repsCompleted')::integer,
        NULLIF(v_score->>'notes', '')
      );
    END IF;

    ex_idx := 0;
    FOR v_exercise_name IN SELECT * FROM jsonb_array_elements_text(COALESCE(sec->'exercises', '[]'::jsonb))
    LOOP
      INSERT INTO public.section_exercises (section_id, user_id, name, sort_order)
      VALUES (v_section_id, v_user_id, v_exercise_name, ex_idx)
      RETURNING id INTO v_exercise_id;

      v_sets := (v_score->>'sets')::integer;
      IF v_sets IS NOT NULL AND v_sets > 0 THEN
        INSERT INTO public.exercise_sets (exercise_id, user_id, set_number, weight_kg, reps)
        SELECT
          v_exercise_id,
          v_user_id,
          s,
          (v_score->>'weightKg')::numeric,
          (v_score->>'reps')::integer
        FROM generate_series(1, v_sets) AS s;
      END IF;

      ex_idx := ex_idx + 1;
    END LOOP;

    sec_idx := sec_idx + 1;
  END LOOP;
END;
$$;
