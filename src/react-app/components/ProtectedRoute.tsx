import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem('seap_authenticated');
      const loginTime = localStorage.getItem('seap_login_time');
      const userType = localStorage.getItem('seap_user_type');
      const userData = localStorage.getItem('seap_user_data');
      
      if (authStatus === 'true' && loginTime) {
        // Verificar se a sessão não expirou (24 horas)
        const loginDate = new Date(loginTime);
        const now = new Date();
        const diffHours = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);
        
        if (diffHours < 24) {
          // Verificar se é login individual ou legacy
          if (userData) {
            // Login individual - verificar role do usuário
            const user = JSON.parse(userData);
            if (adminOnly && user.role !== 'admin') {
              setIsAuthenticated(false);
            } else {
              setIsAuthenticated(true);
            }
          } else if (userType) {
            // Login legacy - verificar tipo de usuário
            if (adminOnly && userType !== 'admin' && userType !== 'legacy') {
              setIsAuthenticated(false);
            } else {
              setIsAuthenticated(true);
            }
          } else {
            setIsAuthenticated(false);
          }
        } else {
          // Sessão expirada, limpar
          localStorage.removeItem('seap_authenticated');
          localStorage.removeItem('seap_login_time');
          localStorage.removeItem('seap_user_type');
          localStorage.removeItem('seap_user_data');
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [adminOnly]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
