import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { User, LogOut, UserPlus, Users, Calendar } from 'lucide-react';

interface Profile {
  display_name: string;
  email: string;
  phone?: string;
  address?: string;
  instagram_url?: string;
  linkedin_url?: string;
  facebook_url?: string;
  twitter_url?: string;
}

interface UserRole {
  role: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    setLoading(true);

    // Cargar perfil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
    }

    // Cargar roles
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesData) {
      setRoles(rolesData.map((r: UserRole) => r.role));
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isSuperAdmin = roles.includes('superadmin');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-whiteSmoke mx-auto mb-4"></div>
          <p className="text-brand-whiteSmoke">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-black text-brand-whiteSmoke mb-2">
                Dashboard
              </h1>
              <p className="text-brand-whiteSmoke/70">
                Bienvenido, {profile?.display_name}
              </p>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="border-brand-ink/50 text-brand-whiteSmoke hover:bg-brand-graphite"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>

          {/* Perfil */}
          <Card className="bg-brand-graphite/95 border-brand-ink/30">
            <CardHeader>
              <CardTitle className="text-brand-whiteSmoke flex items-center gap-2">
                <User className="w-5 h-5" />
                Información del Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-brand-whiteSmoke/50 text-sm">Nombre</p>
                  <p className="text-brand-whiteSmoke font-medium">
                    {profile?.display_name}
                  </p>
                </div>
                <div>
                  <p className="text-brand-whiteSmoke/50 text-sm">Email</p>
                  <p className="text-brand-whiteSmoke font-medium">
                    {profile?.email}
                  </p>
                </div>
                {profile?.phone && (
                  <div>
                    <p className="text-brand-whiteSmoke/50 text-sm">Teléfono</p>
                    <p className="text-brand-whiteSmoke font-medium">
                      {profile.phone}
                    </p>
                  </div>
                )}
                {profile?.address && (
                  <div>
                    <p className="text-brand-whiteSmoke/50 text-sm">Dirección</p>
                    <p className="text-brand-whiteSmoke font-medium">
                      {profile.address}
                    </p>
                  </div>
                )}
              </div>

              {/* Redes Sociales */}
              {(profile?.instagram_url || profile?.linkedin_url || profile?.facebook_url || profile?.twitter_url) && (
                <div className="pt-4 border-t border-brand-ink/30">
                  <p className="text-brand-whiteSmoke/50 text-sm mb-3">
                    Redes Sociales
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {profile?.instagram_url && (
                      <a
                        href={profile.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-whiteSmoke hover:text-brand-whiteSmoke/80 transition-colors"
                      >
                        Instagram
                      </a>
                    )}
                    {profile?.linkedin_url && (
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-whiteSmoke hover:text-brand-whiteSmoke/80 transition-colors"
                      >
                        LinkedIn
                      </a>
                    )}
                    {profile?.facebook_url && (
                      <a
                        href={profile.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-whiteSmoke hover:text-brand-whiteSmoke/80 transition-colors"
                      >
                        Facebook
                      </a>
                    )}
                    {profile?.twitter_url && (
                      <a
                        href={profile.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-whiteSmoke hover:text-brand-whiteSmoke/80 transition-colors"
                      >
                        Twitter/X
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Roles */}
          <Card className="bg-brand-graphite/95 border-brand-ink/30">
            <CardHeader>
              <CardTitle className="text-brand-whiteSmoke">Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <span
                    key={role}
                    className="px-3 py-1 bg-brand-whiteSmoke/10 text-brand-whiteSmoke rounded-full text-sm"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mi Espacio */}
          <Card className="bg-brand-graphite/95 border-brand-ink/30">
            <CardHeader>
              <CardTitle className="text-brand-whiteSmoke">
                Mi Espacio
              </CardTitle>
              <CardDescription className="text-brand-whiteSmoke/70">
                Gestiona tu perfil y portfolio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={() => navigate('/my-space')}
                className="w-full bg-brand-whiteSmoke text-brand-black hover:bg-brand-whiteSmoke/90"
              >
                <User className="w-4 h-4 mr-2" />
                Mi Perfil y Portfolio
              </Button>
              <Button
                onClick={() => navigate('/artist/agenda')}
                variant="outline"
                className="w-full border-brand-ink/50 text-brand-whiteSmoke hover:bg-brand-graphite"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Mi Agenda
              </Button>
            </CardContent>
          </Card>

          {/* Acciones de SuperAdmin */}
          {isSuperAdmin && (
            <Card className="bg-brand-graphite/95 border-brand-ink/30">
              <CardHeader>
                <CardTitle className="text-brand-whiteSmoke">
                  Acciones de Superadministrador
                </CardTitle>
                <CardDescription className="text-brand-whiteSmoke/70">
                  Solo visible para superadministradores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    onClick={() => navigate('/admin/users')}
                    className="w-full bg-brand-whiteSmoke text-brand-black hover:bg-brand-whiteSmoke/90"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Gestión de Usuarios
                  </Button>
                  <Button
                    onClick={() => navigate('/admin/portfolio')}
                    className="w-full bg-brand-whiteSmoke text-brand-black hover:bg-brand-whiteSmoke/90"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Gestión de Portfolio
                  </Button>
                  <Button
                    onClick={() => navigate('/register')}
                    variant="outline"
                    className="w-full border-brand-ink/50 text-brand-whiteSmoke hover:bg-brand-graphite"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Registrar Nuevo Usuario (Legacy)
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botón de volver */}
          <div className="text-center pt-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-brand-whiteSmoke/70 hover:text-brand-whiteSmoke"
            >
              Volver al Inicio
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
