-- =============================================
-- SISTEMA DE AUTENTICACIÓN Y ROLES
-- Black Cat Tattoo Studio
-- =============================================

-- 1. CREAR ENUM DE ROLES
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'staff', 'user');

-- 2. TABLA DE PERFILES CON CAMPOS EXTENDIDOS
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  available_days TEXT[], -- Array de días: ['lunes', 'martes', etc]
  available_hours TEXT, -- Ej: "10:00-18:00"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. TABLA DE ROLES DE USUARIO
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. FUNCIÓN PARA VERIFICAR ROLES (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- 5. FUNCIÓN PARA ACTUALIZAR updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 6. TRIGGER PARA AUTO-CREAR PERFIL AL REGISTRARSE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Crear perfil con datos del metadata
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.email
  );
  
  -- Asignar rol de 'user' por defecto
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger en auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger para updated_at en profiles
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- POLÍTICAS RLS
-- =============================================

-- PROFILES: Todos los usuarios autenticados pueden ver perfiles
CREATE POLICY "Perfiles públicos para lectura"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- PROFILES: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Usuarios pueden actualizar su perfil"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- USER_ROLES: Los usuarios pueden ver sus propios roles
CREATE POLICY "Usuarios pueden ver sus roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- USER_ROLES: Solo superadmins pueden gestionar roles
CREATE POLICY "Solo superadmins pueden gestionar roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_profiles_display_name ON public.profiles(display_name);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- =============================================
-- NOTAS
-- =============================================

-- Después de la migración, asigna rol de superadmin manualmente desde SQL Editor:
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('tu-user-id-aqui', 'superadmin')
-- ON CONFLICT (user_id, role) DO NOTHING;