import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password: string;
  displayName?: string;
  roles?: string[];
  sendInvitation?: boolean;
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
      throw new Error('Solo superadmin puede crear usuarios');
    }

    // Obtener datos del request
    const { email, password, displayName, roles = ['user'], sendInvitation = true }: CreateUserRequest = await req.json();

    if (!email || !password) {
      throw new Error('Email y contraseña son obligatorios');
    }

    // Crear usuario usando Admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: !sendInvitation, // Si no se envía invitación, auto-confirmar
      user_metadata: {
        display_name: displayName || email,
      },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      throw new Error(`Error al crear usuario: ${createError.message}`);
    }

    if (!newUser.user) {
      throw new Error('No se pudo crear el usuario');
    }

    console.log('Usuario creado:', newUser.user.id);

    // Crear perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email: email,
        display_name: displayName || email,
        is_active: true,
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Intentar eliminar el usuario si falla la creación del perfil
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error(`Error al crear perfil: ${profileError.message}`);
    }

    console.log('Perfil creado para usuario:', newUser.user.id);

    // Asignar roles
    const roleInserts = roles.map(role => ({
      user_id: newUser.user.id,
      role: role,
    }));

    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .insert(roleInserts);

    if (rolesError) {
      console.error('Error assigning roles:', rolesError);
      throw new Error(`Error al asignar roles: ${rolesError.message}`);
    }

    console.log('Roles asignados:', roles);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          display_name: displayName || email,
          roles,
        },
        message: sendInvitation 
          ? 'Usuario creado. Se ha enviado un email de invitación.' 
          : 'Usuario creado exitosamente.',
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
