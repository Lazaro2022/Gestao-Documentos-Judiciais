import { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Search, Edit, Mail, Shield, UserCheck, UserX, BarChart3, Trash2, AlertTriangle } from 'lucide-react';
import Layout from '@/react-app/components/Layout';
import { User } from '@/shared/types';


interface UserFormData {
  name: string;
  email: string;
  role: string;
  matricula: string;
  password: string;
}

interface UserWithStats extends User {
  documentsCount: number;
  completedDocuments: number;
  completionRate: number;
}

export default function Users() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'user',
    matricula: '',
    password: ''
  });

  useEffect(() => {
    fetchUsers();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = () => {
    const userData = localStorage.getItem('seap_user_data');
    const userType = localStorage.getItem('seap_user_type');
    
    if (userData) {
      const user = JSON.parse(userData);
      setIsAdmin(user.role === 'admin');
    } else if (userType) {
      setIsAdmin(userType === 'admin' || userType === 'legacy');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [usersResponse, documentsResponse] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/documents')
      ]);
      
      if (!usersResponse.ok) throw new Error('Erro ao carregar usuários');
      
      const usersData = await usersResponse.json();
      const documentsData = documentsResponse.ok ? await documentsResponse.json() : [];
      
      // Calcular estatísticas para cada usuário
      const usersWithStats = usersData.map((user: User) => {
        const userDocuments = documentsData.filter((doc: any) => doc.assigned_to === user.id);
        const completedDocuments = userDocuments.filter((doc: any) => doc.status === 'Concluído').length;
        const completionRate = userDocuments.length > 0 ? (completedDocuments / userDocuments.length) * 100 : 0;
        
        return {
          ...user,
          documentsCount: userDocuments.length,
          completedDocuments,
          completionRate
        };
      });
      
      setUsers(usersWithStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao salvar usuário');

      setFormData({ name: '', email: '', role: 'user', matricula: '', password: '' });
      setShowForm(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar usuário');
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email || '',
      role: user.role,
      matricula: (user as any).matricula || '',
      password: (user as any).password || ''
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'user', matricula: '', password: '' });
    setShowForm(false);
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) throw new Error('Erro ao atualizar status do usuário');
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar usuário');
    }
  };

  const deleteUser = async (userId: number, userName: string) => {

    const confirmed = window.confirm(
      `Tem certeza que deseja EXCLUIR PERMANENTEMENTE o usuário "${userName}"?\n\n` +
      `⚠️ ATENÇÃO: Esta ação NÃO pode ser desfeita!\n\n` +
      `• O usuário será removido completamente do sistema\n` +
      `• Todos os dados associados serão perdidos\n` +
      `• Documentos atribuídos a este usuário devem ser reatribuídos primeiro\n\n` +
      `Digite "CONFIRMAR" abaixo para prosseguir:`
    );

    if (!confirmed) return;

    const secondConfirmation = prompt(
      `Para confirmar a exclusão permanente do usuário "${userName}", digite: CONFIRMAR`
    );

    if (secondConfirmation !== 'CONFIRMAR') {
      alert('Exclusão cancelada. Texto de confirmação incorreto.');
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir usuário');
      }

      alert(`✅ ${result.message}`);
      fetchUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir usuário';
      setError(errorMessage);
      alert(`❌ Erro: ${errorMessage}`);
    }
  };

  const clearAllUsers = async () => {
    const confirmed = window.confirm(
      `⚠️ ATENÇÃO: AÇÃO IRREVERSÍVEL!\n\n` +
      `Você está prestes a EXCLUIR PERMANENTEMENTE todos os usuários (exceto administradores).\n\n` +
      `• ${users.filter(u => u.role !== 'admin').length} usuário(s) será(ão) removido(s)\n` +
      `• Administradores serão preservados\n` +
      `• Documentos atribuídos ficarão sem responsável\n` +
      `• Esta ação NÃO pode ser desfeita\n\n` +
      `Digite "CONFIRMAR EXCLUSAO" para prosseguir:`
    );

    if (!confirmed) return;

    const secondConfirmation = prompt(
      `Para confirmar a exclusão permanente dos USUÁRIOS, digite: CONFIRMAR EXCLUSAO`
    );

    if (secondConfirmation !== 'CONFIRMAR EXCLUSAO') {
      alert('Operação cancelada. Texto de confirmação incorreto.');
      return;
    }

    try {
      const response = await fetch('/api/admin/clear-users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao limpar usuários');
      }

      alert(`✅ ${result.message}`);
      fetchUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao limpar usuários';
      setError(errorMessage);
      alert(`❌ Erro: ${errorMessage}`);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user as any).matricula?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-900 text-purple-200';
      case 'manager': return 'bg-blue-900 text-blue-200';
      case 'user': return 'bg-green-900 text-green-200';
      default: return 'bg-gray-700 text-gray-200';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      case 'user': return 'Usuário';
      default: return role;
    }
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Layout>
        <div className="px-4 py-2">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Usuários</h1>
            <p className="text-gray-300">Gestão de usuários do sistema</p>
          </div>
          <div className="flex items-center space-x-3">
            {isAdmin && (
              <>
                <button
                  onClick={clearAllUsers}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Limpar Usuários</span>
                </button>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingUser ? 'Cancelar Edição' : 'Novo Usuário'}</span>
                </button>
              </>
            )}
            {!isAdmin && (
              <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-yellow-400" />
                  <p className="text-yellow-200 text-sm">
                    <strong>Acesso Restrito:</strong> Apenas administradores podem gerenciar usuários do sistema.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{users.length}</p>
                <p className="text-sm text-gray-300">Total de Usuários</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{users.filter(u => u.is_active).length}</p>
                <p className="text-sm text-gray-300">Usuários Ativos</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{users.filter(u => u.role === 'admin').length}</p>
                <p className="text-sm text-gray-300">Administradores</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{users.reduce((acc, u) => acc + u.documentsCount, 0)}</p>
                <p className="text-sm text-gray-300">Documentos Atribuídos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Access Info */}
        <div className="bg-blue-900 border border-blue-600 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-blue-300" />
            <div>
              <h3 className="text-blue-200 font-medium">Usuários de Login do Sistema</h3>
              <p className="text-blue-300 text-sm">
                Estes são os usuários que fazem login e controlam o sistema. Para pessoas que apenas têm documentos atribuídos, use "Responsáveis" na tela de Documentos.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900 border border-red-600 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-300" />
              <div>
                <p className="text-red-200">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="text-red-300 underline mt-2 hover:text-red-100"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && isAdmin && (
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-4 mb-4">
            <h2 className="text-xl font-semibold text-white mb-4">
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nome completo do servidor"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    E-mail Institucional
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="servidor@seap.gov.br"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Matrícula SEAP <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.matricula}
                    onChange={(e) => setFormData({ ...formData, matricula: e.target.value.trim() })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Matrícula oficial do servidor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Senha de Acesso <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Senha para acesso ao sistema"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Função no Sistema
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="user">Usuário</option>
                    <option value="manager">Gerente</option>
                    {isAdmin && <option value="admin">Administrador</option>}
                  </select>
                  {!isAdmin && (
                    <p className="text-yellow-400 text-xs mt-1">
                      Apenas administradores podem criar outros administradores
                    </p>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingUser ? 'Atualizar Usuário' : 'Criar Usuário'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-8 text-center">
              <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Nenhum usuário encontrado</h3>
              <p className="text-gray-300">
                {searchTerm 
                  ? 'Tente ajustar o termo de busca.'
                  : 'Comece criando o primeiro usuário do sistema.'
                }
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleName(user.role)}
                        </span>
                        {!user.is_active && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-900 text-red-200">
                            Inativo
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-300">
                        {(user as any).matricula && (
                          <span className="font-medium text-blue-300">
                            Matrícula: {(user as any).matricula}
                          </span>
                        )}
                        {user.email && (
                          <span className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                          </span>
                        )}
                        <span>Criado: {new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Stats */}
                    <div className="text-right">
                      <div className="text-sm text-gray-300">Documentos</div>
                      <div className="font-semibold text-white">
                        {user.completedDocuments}/{user.documentsCount}
                      </div>
                      {user.documentsCount > 0 && (
                        <div className={`text-sm font-medium ${getCompletionRateColor(user.completionRate)}`}>
                          {user.completionRate.toFixed(1)}%
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEdit(user)}
                        className="p-2 text-gray-300 hover:text-blue-400 hover:bg-blue-900 rounded-lg transition-colors"
                        title="Editar usuário"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.is_active 
                            ? 'text-gray-300 hover:text-orange-400 hover:bg-orange-900' 
                            : 'text-gray-300 hover:text-green-400 hover:bg-green-900'
                        }`}
                        title={user.is_active ? 'Desativar usuário' : 'Ativar usuário'}
                      >
                        {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => deleteUser(user.id, user.name)}
                        className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-900 rounded-lg transition-colors"
                        title="Excluir usuário permanentemente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
