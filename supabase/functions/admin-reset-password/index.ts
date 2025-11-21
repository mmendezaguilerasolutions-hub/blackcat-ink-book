import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResetPasswordRequest {
  userId: string;
  newPassword?: string;
  sendResetLink?: boolean;
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
      throw new Error('Solo superadmin puede resetear contraseñas');
    }

    // Obtener datos del request
    const { userId, newPassword, sendResetLink = false }: ResetPasswordRequest = await req.json();

    if (!userId) {
      throw new Error('userId es obligatorio');
    }

    let message = '';

    if (sendResetLink) {
      // Obtener el email del usuario
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (userError || !userData.user) {
        throw new Error('No se pudo obtener el usuario');
      }

      // Generar link de recuperación
      const { data, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: userData.user.email!,
      });

      if (resetError) {
        throw new Error(`Error al generar link de recuperación: ${resetError.message}`);
      }

      message = 'Se ha generado un link de recuperación. Se enviará por email al usuario.';
      console.log('Recovery link:', data);
    } else if (newPassword) {
      // Establecer nueva contraseña directamente
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (updateError) {
        throw new Error(`Error al actualizar contraseña: ${updateError.message}`);
      }

      message = 'Contraseña actualizada exitosamente';
    } else {
      throw new Error('Debe proporcionar newPassword o sendResetLink');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message,
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
