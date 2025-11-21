import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateUserRequest {
  userId: string;
  email?: string;
  displayName?: string;
  roles?: string[];
  isActive?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Verificar autenticación
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No autorizado');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('No autorizado');
    }

    // Verificar que el usuario es superadmin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'superadmin')
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error('Solo superadmin puede actualizar usuarios');
    }

    // Obtener datos del request
    const { userId, email, displayName, roles, isActive }: UpdateUserRequest = await req.json();

    if (!userId) {
      throw new Error('userId es obligatorio');
    }

    // Actualizar email en auth si cambió
    if (email) {
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email }
      );

      if (updateAuthError) {
        console.error('Error updating auth email:', updateAuthError);
        throw new Error(`Error al actualizar email: ${updateAuthError.message}`);
      }
    }

    // Actualizar perfil
    const profileUpdates: any = {};
    if (email) profileUpdates.email = email;
    if (displayName !== undefined) profileUpdates.display_name = displayName;
    if (isActive !== undefined) profileUpdates.is_active = isActive;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw new Error(`Error al actualizar perfil: ${profileError.message}`);
      }
    }

    // Actualizar roles si se proporcionaron
    if (roles && roles.length > 0) {
      // Eliminar roles existentes
      const { error: deleteError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting old roles:', deleteError);
        throw new Error(`Error al eliminar roles anteriores: ${deleteError.message}`);
      }

      // Insertar nuevos roles
      const roleInserts = roles.map(role => ({
        user_id: userId,
        role: role,
      }));

      const { error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .insert(roleInserts);

      if (rolesError) {
        console.error('Error inserting new roles:', rolesError);
        throw new Error(`Error al asignar nuevos roles: ${rolesError.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuario actualizado exitosamente',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
