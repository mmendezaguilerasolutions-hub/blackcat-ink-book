import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { User, LogOut, UserPlus, Users, Calendar } from 'lucide-react';

interface Profile {
  display_name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-black mb-2">
                Dashboard
              </h1>
              <p className="text-muted-foreground">
                Bienvenido, {profile?.display_name}
              </p>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>

          {/* Perfil */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información del Perfil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between gap-6">
                {/* Información a la izquierda */}
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Nombre</p>
                    <p className="font-medium text-foreground">
                      {profile?.display_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Email</p>
                    <p className="font-medium text-foreground">
                      {profile?.email}
                    </p>
                  </div>
                  {profile?.phone && (
                    <div>
                      <p className="text-muted-foreground text-sm">Teléfono</p>
                      <p className="font-medium text-foreground">
                        {profile.phone}
                      </p>
                    </div>
                  )}
                  {profile?.address && (
                    <div>
                      <p className="text-muted-foreground text-sm">Dirección</p>
                      <p className="font-medium text-foreground">
                        {profile.address}
                      </p>
                    </div>
                  )}
                  
                  {/* Roles */}
                  <div className="pt-2">
                    <p className="text-muted-foreground text-sm mb-2">Roles</p>
                    <div className="flex flex-wrap gap-2">
                      {roles.map((role) => (
                        <span
                          key={role}
                          className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Redes Sociales */}
                  {(profile?.instagram_url || profile?.linkedin_url || profile?.facebook_url || profile?.twitter_url) && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-muted-foreground text-sm mb-3">
                        Redes Sociales
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {profile?.instagram_url && (
                          <a
                            href={profile.instagram_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground hover:text-muted-foreground transition-colors"
                          >
                            Instagram
                          </a>
                        )}
                        {profile?.linkedin_url && (
                          <a
                            href={profile.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground hover:text-muted-foreground transition-colors"
                          >
                            LinkedIn
                          </a>
                        )}
                        {profile?.facebook_url && (
                          <a
                            href={profile.facebook_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground hover:text-muted-foreground transition-colors"
                          >
                            Facebook
                          </a>
                        )}
                        {profile?.twitter_url && (
                          <a
                            href={profile.twitter_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground hover:text-muted-foreground transition-colors"
                          >
                            Twitter/X
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Avatar a la derecha */}
                <Avatar className="h-24 w-24 flex-shrink-0">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {profile?.display_name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </CardContent>
          </Card>

          {/* Mi Espacio */}
          <Card>
            <CardHeader>
              <CardTitle>
                Mi Espacio
              </CardTitle>
              <CardDescription>
                Gestiona tu perfil y portfolio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={() => navigate('/my-space')}
                className="w-full"
              >
                <User className="w-4 h-4 mr-2" />
                Mi Perfil y Portfolio
              </Button>
              <Button
                onClick={() => navigate('/artist/agenda')}
                variant="outline"
                className="w-full"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Mi Agenda
              </Button>
            </CardContent>
          </Card>

          {/* Acciones de SuperAdmin */}
          {isSuperAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Acciones de Superadministrador
                </CardTitle>
                <CardDescription>
                  Solo visible para superadministradores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    onClick={() => navigate('/admin/users')}
                    className="w-full"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Usuarios
                  </Button>
                  <Button
                    onClick={() => navigate('/admin/portfolio')}
                    className="w-full"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Portfolio
                  </Button>
                  <Button
                    onClick={() => navigate('/admin/artists')}
                    className="w-full"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Avatares
                  </Button>
                  <Button
                    onClick={() => navigate('/register')}
                    variant="outline"
                    className="w-full"
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
