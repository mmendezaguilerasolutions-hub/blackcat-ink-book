import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';
import heroBg from '@/assets/hero-bg.jpg';

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
    <div className="relative min-h-screen flex items-center justify-center bg-brand-black overflow-hidden">
      {/* Animated Background Image */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
          mounted ? 'opacity-20' : 'opacity-0'
        }`}
        style={{ backgroundImage: `url(${heroBg})` }}
      />

      {/* Animated Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-black/90 via-brand-black/80 to-brand-black" />

      {/* Animated Particles Background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-brand-whiteSmoke/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="container relative z-10 py-12 px-4">
        <div className="max-w-md mx-auto">
          <Card
            className={`bg-brand-graphite/95 backdrop-blur-sm border-brand-ink/30 shadow-2xl transition-all duration-700 ${
              mounted
                ? 'animate-scale-in opacity-100'
                : 'opacity-0 scale-95'
            }`}
          >
            <CardHeader className="text-center space-y-4">
              {/* Animated Logo */}
              <div
                className={`flex justify-center mb-4 transition-all duration-700 delay-200 ${
                  mounted ? 'animate-float opacity-100' : 'opacity-0 translate-y-4'
                }`}
              >
                <div className="relative">
                  <img
                    src={logo}
                    alt="Black Cat Logo"
                    className="w-20 h-20 object-contain drop-shadow-lg transition-transform duration-300 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-brand-whiteSmoke/20 rounded-full blur-xl animate-pulse-glow -z-10" />
                </div>
              </div>
              
              <CardTitle
                className={`text-3xl font-black text-brand-whiteSmoke transition-all duration-700 delay-300 ${
                  mounted ? 'animate-slide-in-up opacity-100' : 'opacity-0 translate-y-4'
                }`}
              >
                Iniciar Sesión
              </CardTitle>
              <CardDescription
                className={`text-brand-whiteSmoke/70 transition-all duration-700 delay-400 ${
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
                  <Label htmlFor="email" className="text-brand-whiteSmoke">
                    Email
                  </Label>
                  <div className="relative group">
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-brand-black/50 border-brand-ink/50 text-brand-whiteSmoke placeholder:text-brand-whiteSmoke/50 focus-visible:ring-brand-whiteSmoke focus-visible:ring-2 focus-visible:border-brand-whiteSmoke/50 transition-all duration-300 group-hover:border-brand-whiteSmoke/30"
                    />
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-transparent via-brand-whiteSmoke/0 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer pointer-events-none" 
                      style={{
                        backgroundSize: '200% 100%',
                      }}
                    />
                  </div>
                </div>

                <div
                  className={`space-y-2 transition-all duration-700 delay-600 ${
                    mounted ? 'animate-slide-in-up opacity-100' : 'opacity-0 translate-y-4'
                  }`}
                >
                  <Label htmlFor="password" className="text-brand-whiteSmoke">
                    Contraseña
                  </Label>
                  <div className="relative group">
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-brand-black/50 border-brand-ink/50 text-brand-whiteSmoke placeholder:text-brand-whiteSmoke/50 focus-visible:ring-brand-whiteSmoke focus-visible:ring-2 focus-visible:border-brand-whiteSmoke/50 transition-all duration-300 group-hover:border-brand-whiteSmoke/30"
                    />
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-transparent via-brand-whiteSmoke/0 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer pointer-events-none"
                      style={{
                        backgroundSize: '200% 100%',
                      }}
                    />
                  </div>
                </div>

                <div
                  className={`transition-all duration-700 delay-700 ${
                    mounted ? 'animate-slide-in-up opacity-100' : 'opacity-0 translate-y-4'
                  }`}
                >
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-whiteSmoke text-brand-black hover:bg-brand-whiteSmoke/90 font-bold text-lg py-6 h-auto relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10">
                      {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </span>
                    {!loading && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    )}
                    {loading && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" 
                        style={{
                          backgroundSize: '200% 100%',
                        }}
                      />
                    )}
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
                  className="text-brand-whiteSmoke/70 hover:text-brand-whiteSmoke hover:bg-brand-black/50 transition-all duration-300"
                >
                  Volver al inicio
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Animated Decorative Elements */}
          <div
            className={`absolute top-20 left-10 w-72 h-72 bg-brand-whiteSmoke/5 rounded-full blur-3xl -z-10 transition-all duration-1000 delay-300 ${
              mounted ? 'animate-pulse-glow opacity-100' : 'opacity-0'
            }`}
          />
          <div
            className={`absolute bottom-20 right-10 w-96 h-96 bg-brand-whiteSmoke/5 rounded-full blur-3xl -z-10 transition-all duration-1000 delay-500 ${
              mounted ? 'animate-pulse-glow opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
