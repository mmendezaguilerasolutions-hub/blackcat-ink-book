-- Añadir campo is_active a profiles si no existe
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Crear función para obtener usuarios completos con sus roles
CREATE OR REPLACE FUNCTION get_users_with_roles()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  is_active BOOLEAN,
  email_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  roles TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el usuario actual es superadmin
  IF NOT has_role(auth.uid(), 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Solo superadmin puede ver todos los usuarios';
  END IF;

  RETURN QUERY
  SELECT 
    p.id AS user_id,
    p.email,
    p.display_name,
    p.is_active,
    au.email_confirmed_at,
    p.created_at,
    ARRAY_AGG(ur.role::TEXT) FILTER (WHERE ur.role IS NOT NULL) AS roles
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  LEFT JOIN user_roles ur ON ur.user_id = p.id
  GROUP BY p.id, p.email, p.display_name, p.is_active, au.email_confirmed_at, p.created_at
  ORDER BY p.created_at DESC;
END;
$$;

-- Política RLS para que superadmin pueda actualizar perfiles
CREATE POLICY "Superadmin puede actualizar perfiles"
ON profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Política RLS para que superadmin pueda insertar perfiles
CREATE POLICY "Superadmin puede crear perfiles"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Política RLS para que superadmin pueda eliminar perfiles
CREATE POLICY "Superadmin puede eliminar perfiles"
ON profiles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));