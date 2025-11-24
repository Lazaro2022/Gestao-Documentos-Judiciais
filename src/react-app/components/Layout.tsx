import { ReactNode, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { 
  BarChart3, 
  FileText, 
  Users, 
  Home, 
  Settings,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Crown,
  Shield
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('Usuário da Equipe');
  const [userRole, setUserRole] = useState('user');

  useEffect(() => {
    // Verificar se é login individual ou legacy
    const userData = localStorage.getItem('seap_user_data');
    const userType = localStorage.getItem('seap_user_type');
    
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.name);
      setUserRole(user.role);
    } else if (userType) {
      setUserName(userType === 'admin' ? 'Administrador do Sistema' : 'Usuário da Equipe');
      setUserRole(userType === 'admin' ? 'admin' : 'user');
    }
  }, []);

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
      try {
        // Obter matrícula se for login individual
        const userData = localStorage.getItem('seap_user_data');
        let matricula = null;
        
        if (userData) {
          const user = JSON.parse(userData);
          matricula = user.matricula;
        }
        
        // Registrar logout no backend
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ matricula }),
        });
        
        // Limpar dados locais
        localStorage.removeItem('seap_authenticated');
        localStorage.removeItem('seap_login_time');
        localStorage.removeItem('seap_user_type');
        localStorage.removeItem('seap_user_data');
        
        // Redirecionar para login
        navigate('/login');
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
        // Mesmo com erro, fazer logout local
        localStorage.removeItem('seap_authenticated');
        localStorage.removeItem('seap_login_time');
        localStorage.removeItem('seap_user_type');
        localStorage.removeItem('seap_user_data');
        navigate('/login');
      }
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Documentos', href: '/documents', icon: FileText },
    { name: 'Usuários', href: '/users', icon: Users },
    { name: 'Relatórios', href: '/reports', icon: BarChart3 },
    { name: 'Configurações', href: '/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 border-r border-gray-700 shadow-xl transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SE</span>
              </div>
              <h1 className="text-xl font-bold text-blue-400">
                SEAP
              </h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-gray-700 text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                    ${isActive(item.href)
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {userName}
                </p>
                <div className="flex items-center space-x-2">
                  {userRole === 'admin' && <Crown className="w-3 h-3 text-yellow-400" />}
                  {userRole !== 'admin' && <Shield className="w-3 h-3 text-blue-400" />}
                  <p className="text-xs text-gray-400 truncate">
                    {userRole === 'admin' ? 'Administrador' : 'Membro da Equipe'}
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-red-600/20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair do Sistema</span>
            </button>
            
            <div className="text-xs text-gray-400 text-center mt-3">
              SEAP v2.0
              <br />
              Sistema de Gestão de Documentos Judiciais
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-gray-800 border-b border-gray-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-gray-700 text-gray-300"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-blue-400">SEAP</h1>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* Page content */}
        <main className="bg-gray-900 text-white min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
