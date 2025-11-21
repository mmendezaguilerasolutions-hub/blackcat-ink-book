import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
  requireRole?: 'superadmin' | 'admin' | 'staff' | 'user';
}

const ProtectedRoute = ({ children, requireRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [hasRole, setHasRole] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (!user || !requireRole) {
        setChecking(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', requireRole)
        .maybeSingle();

      if (error) {
        console.error('Error checking role:', error);
        setHasRole(false);
      } else {
        setHasRole(!!data);
      }
      setChecking(false);
    };

    checkRole();
  }, [user, requireRole]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-whiteSmoke mx-auto mb-4"></div>
          <p className="text-brand-whiteSmoke">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && hasRole === false) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
