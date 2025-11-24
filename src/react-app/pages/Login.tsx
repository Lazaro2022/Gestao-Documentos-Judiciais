import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Lock, Shield, Eye, EyeOff, AlertCircle, Crown, Users, User } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [matricula, setMatricula] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<'matricula' | 'legacy'>('matricula');

  // Verificar se já está logado
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('seap_authenticated');
    if (isAuthenticated === 'true') {
      navigate('/');
    }
  }, [navigate]);

  const handleLoginWithMatricula = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!matricula.trim()) {
      setError('Por favor, digite a matrícula');
      return;
    }
    
    if (!password.trim()) {
      setError('Por favor, digite a senha');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matricula, password }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Salvar dados do usuário
        localStorage.setItem('seap_authenticated', 'true');
        localStorage.setItem('seap_user_data', JSON.stringify(result.user));
        localStorage.setItem('seap_login_time', new Date().toISOString());
        
        // Redirecionar para o dashboard
        navigate('/');
      } else {
        setError(result.error || 'Dados incorretos');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginLegacy = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Por favor, digite a senha');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login-legacy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Salvar estado de autenticação com tipo de usuário
        localStorage.setItem('seap_authenticated', 'true');
        localStorage.setItem('seap_user_type', result.userType || 'user');
        localStorage.setItem('seap_login_time', new Date().toISOString());
        
        // Redirecionar para o dashboard
        navigate('/');
      } else {
        setError(result.error || 'Senha incorreta');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent drop-shadow-lg">
              SEAP
            </h1>
          </div>
          
          <h2 className="text-2xl font-semibold text-white mb-3">
            Sistema de Gestão de Documentos Judiciais
          </h2>
          
          <p className="text-slate-300 text-lg leading-relaxed">
            Plataforma segura e moderna para gestão e análise
            <br />
            de dados penitenciários
          </p>
        </div>

        {/* Login Mode Toggle */}
        <div className="mb-6">
          <div className="flex bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
            <button
              onClick={() => setLoginMode('matricula')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                loginMode === 'matricula'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Login Individual</span>
            </button>
            <button
              onClick={() => setLoginMode('legacy')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                loginMode === 'legacy'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Login por Nível</span>
            </button>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700/50 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              {loginMode === 'matricula' ? <User className="w-8 h-8 text-white" /> : <Shield className="w-8 h-8 text-white" />}
            </div>
            
            <h3 className="text-2xl font-semibold text-white mb-2">
              {loginMode === 'matricula' ? 'Login Individual' : 'Login por Nível de Acesso'}
            </h3>
            
            <p className="text-slate-400">
              {loginMode === 'matricula' 
                ? 'Digite sua matrícula SEAP e a senha fornecida pelo administrador'
                : 'Digite a senha do seu nível de acesso'
              }
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-600/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Login Form - Individual */}
          {loginMode === 'matricula' && (
            <form onSubmit={handleLoginWithMatricula} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Matrícula SEAP
                </label>
                <input
                  type="text"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value.trim())}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Digite sua matrícula fornecida pela SEAP"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Digite a senha fornecida pelo administrador"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-blue-400 disabled:to-blue-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Verificando...</span>
                  </div>
                ) : (
                  'Entrar no Sistema'
                )}
              </button>
            </form>
          )}

          {/* Login Form - Legacy */}
          {loginMode === 'legacy' && (
            <form onSubmit={handleLoginLegacy} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Digite sua senha"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-blue-400 disabled:to-blue-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Verificando...</span>
                  </div>
                ) : (
                  'Entrar no Sistema'
                )}
              </button>
            </form>
          )}

          {/* Login Instructions for Individual Login */}
          {loginMode === 'matricula' && (
            <div className="mt-8 space-y-4">
              <div className="text-center mb-4">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Como Fazer Login</h4>
              </div>
              
              {/* Instructions */}
              <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-600/30">
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-300 mb-1">Matrícula SEAP</h4>
                    <p className="text-xs text-blue-200">
                      Digite sua matrícula oficial fornecida pela SEAP.<br/>
                      Cada servidor possui uma matrícula única para identificação.
                    </p>
                  </div>
                </div>
              </div>

              {/* Password Info */}
              <div className="p-4 bg-green-900/30 rounded-lg border border-green-600/30">
                <div className="flex items-start space-x-3">
                  <Lock className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-green-300 mb-1">Senha de Acesso</h4>
                    <p className="text-xs text-green-200">
                      Senha fornecida pelo administrador do sistema.<br/>
                      Entre em contato com a administração se não possui acesso.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Access Levels Info for Legacy Login */}
          {loginMode === 'legacy' && (
            <div className="mt-8 space-y-4">
              <div className="text-center mb-4">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Níveis de Acesso Disponíveis</h4>
              </div>
              
              {/* Admin Access */}
              <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-600/30">
                <div className="flex items-start space-x-3">
                  <Crown className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-purple-300 mb-1">Acesso Administrativo</h4>
                    <p className="text-xs text-purple-200 mt-1">
                      • Gerenciar usuários e tipos de documentos<br/>
                      • Acesso a todas as configurações<br/>
                      • Relatórios completos e limpeza de dados
                    </p>
                  </div>
                </div>
              </div>

              {/* User Access */}
              <div className="p-4 bg-green-900/30 rounded-lg border border-green-600/30">
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-green-300 mb-1">Acesso de Usuário</h4>
                    <p className="text-xs text-green-200 mt-1">
                      • Visualizar documentos e relatórios<br/>
                      • Atualizar status de documentos<br/>
                      • Funcionalidades essenciais
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex items-start space-x-3">
              <Lock className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-400 mb-1">Segurança e Rastreamento</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {loginMode === 'matricula' 
                    ? 'Todos os acessos são registrados com data, hora, IP e matrícula do servidor para auditoria completa.'
                    : 'Compartilhe as senhas apenas com pessoas autorizadas. Considere migrar para o login individual.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-500 text-sm">
            SEAP v2.1 • Sistema de Gestão de Documentos Judiciais
          </p>
        </div>
      </div>
    </div>
  );
}
