import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: 'Error al iniciar sesión',
          description: error.message || 'Credenciales incorrectas',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '¡Bienvenido!',
          description: 'Has iniciado sesión correctamente',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: 'Error inesperado',
        description: 'Ocurrió un error al intentar iniciar sesión',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
      {/* Content */}
      <div className="container relative z-10 py-12 px-4">
        <div className="max-w-md mx-auto">
          <Card
            className={`shadow-2xl transition-all duration-700 ${
              mounted
                ? 'animate-scale-in opacity-100'
                : 'opacity-0 scale-95'
            }`}
          >
            <CardHeader className="text-center space-y-4">
              {/* Logo */}
              <div
                className={`flex justify-center mb-4 transition-all duration-700 delay-200 ${
                  mounted ? 'opacity-100' : 'opacity-0 translate-y-4'
                }`}
              >
                <div className="relative">
                  <img
                    src={logo}
                    alt="Black Cat Logo"
                    className="w-20 h-20 object-contain drop-shadow-lg transition-transform duration-300 hover:scale-110"
                  />
                </div>
              </div>
              
              <CardTitle
                className={`text-3xl font-black transition-all duration-700 delay-300 ${
                  mounted ? 'animate-slide-in-up opacity-100' : 'opacity-0 translate-y-4'
                }`}
              >
                Iniciar Sesión
              </CardTitle>
              <CardDescription
                className={`transition-all duration-700 delay-400 ${
                  mounted ? 'animate-slide-in-up opacity-100' : 'opacity-0 translate-y-4'
                }`}
              >
                Accede a tu cuenta de Black Cat Studio
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div
                  className={`space-y-2 transition-all duration-700 delay-500 ${
                    mounted ? 'animate-slide-in-up opacity-100' : 'opacity-0 translate-y-4'
                  }`}
                >
                  <Label htmlFor="email">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div
                  className={`space-y-2 transition-all duration-700 delay-600 ${
                    mounted ? 'animate-slide-in-up opacity-100' : 'opacity-0 translate-y-4'
                  }`}
                >
                  <Label htmlFor="password">
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div
                  className={`transition-all duration-700 delay-700 ${
                    mounted ? 'animate-slide-in-up opacity-100' : 'opacity-0 translate-y-4'
                  }`}
                >
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full font-bold text-lg py-6 h-auto"
                  >
                    {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                </div>
              </form>

              <div
                className={`mt-6 text-center space-y-2 transition-all duration-700 delay-800 ${
                  mounted ? 'animate-slide-in-up opacity-100' : 'opacity-0 translate-y-4'
                }`}
              >
                <Button
                  variant="ghost"
                  onClick={() => navigate('/')}
                >
                  Volver al inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
