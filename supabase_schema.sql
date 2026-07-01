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
