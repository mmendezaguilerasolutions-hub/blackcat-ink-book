import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';
import heroBg from '@/assets/hero-bg.jpg';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [facebook, setFacebook] = useState('');
  const [twitter, setTwitter] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    checkSuperAdminRole();
  }, [user]);

  const checkSuperAdminRole = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'superadmin')
      .maybeSingle();

    if (error || !data) {
      toast({
        title: 'Acceso denegado',
        description: 'Solo los superadministradores pueden registrar nuevos usuarios',
        variant: 'destructive',
      });
      navigate('/dashboard');
      return;
    }

    setIsSuperAdmin(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signUp(email, password, displayName);
      
      if (error) {
        toast({
          title: 'Error al registrar usuario',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Usuario registrado',
          description: 'Se ha enviado un correo de confirmación',
        });
        
        // Resetear formulario
        setEmail('');
        setPassword('');
        setDisplayName('');
        setPhone('');
        setAddress('');
        setInstagram('');
        setLinkedin('');
        setFacebook('');
        setTwitter('');
      }
    } catch (error) {
      toast({
        title: 'Error inesperado',
        description: 'Ocurrió un error al registrar el usuario',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-brand-black overflow-hidden py-12">
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
          mounted ? 'opacity-20' : 'opacity-0'
        }`}
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-black/90 via-brand-black/80 to-brand-black" />

      <div className="container relative z-10 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className={`bg-brand-graphite/95 backdrop-blur-sm border-brand-ink/30 shadow-2xl transition-all duration-700 ${
              mounted ? 'animate-scale-in opacity-100' : 'opacity-0 scale-95'
            }`}>
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center mb-4">
                <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />
              </div>
              <CardTitle className="text-3xl font-black text-brand-whiteSmoke">
                Registrar Nuevo Usuario
              </CardTitle>
              <CardDescription className="text-brand-whiteSmoke/70">
                Solo accesible para superadministradores
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-brand-whiteSmoke">
                      Nombre completo *
                    </Label>
                    <Input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-brand-black/50 border-brand-ink/50 text-brand-whiteSmoke"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-brand-whiteSmoke">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-brand-black/50 border-brand-ink/50 text-brand-whiteSmoke"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-brand-whiteSmoke">
                      Contraseña *
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={6}
                      className="bg-brand-black/50 border-brand-ink/50 text-brand-whiteSmoke"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-brand-whiteSmoke">
                      Teléfono
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                      className="bg-brand-black/50 border-brand-ink/50 text-brand-whiteSmoke"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address" className="text-brand-whiteSmoke">
                      Dirección
                    </Label>
                    <Input
                      id="address"
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={loading}
                      className="bg-brand-black/50 border-brand-ink/50 text-brand-whiteSmoke"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram" className="text-brand-whiteSmoke">
                      Instagram URL
                    </Label>
                    <Input
                      id="instagram"
                      type="url"
                      placeholder="https://instagram.com/usuario"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      disabled={loading}
                      className="bg-brand-black/50 border-brand-ink/50 text-brand-whiteSmoke"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="text-brand-whiteSmoke">
                      LinkedIn URL
                    </Label>
                    <Input
                      id="linkedin"
                      type="url"
                      placeholder="https://linkedin.com/in/usuario"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      disabled={loading}
                      className="bg-brand-black/50 border-brand-ink/50 text-brand-whiteSmoke"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facebook" className="text-brand-whiteSmoke">
                      Facebook URL
                    </Label>
                    <Input
                      id="facebook"
                      type="url"
                      placeholder="https://facebook.com/usuario"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      disabled={loading}
                      className="bg-brand-black/50 border-brand-ink/50 text-brand-whiteSmoke"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter" className="text-brand-whiteSmoke">
                      Twitter/X URL
                    </Label>
                    <Input
                      id="twitter"
                      type="url"
                      placeholder="https://twitter.com/usuario"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      disabled={loading}
                      className="bg-brand-black/50 border-brand-ink/50 text-brand-whiteSmoke"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-whiteSmoke text-brand-black hover:bg-brand-whiteSmoke/90 font-bold text-lg py-6"
                >
                  {loading ? 'Registrando...' : 'Registrar Usuario'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className="w-full text-brand-whiteSmoke/70 hover:text-brand-whiteSmoke"
                >
                  Volver al Dashboard
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;
