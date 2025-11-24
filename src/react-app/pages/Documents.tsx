import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, Calendar, User, AlertCircle, Settings, Trash2, Users, X, RotateCcw, Edit2 } from 'lucide-react';
import Layout from '@/react-app/components/Layout';
import { Document, DocumentType, DocumentAssignee } from '@/shared/types';
import DocumentTypesManager from '@/react-app/components/DocumentTypesManager';
import DocumentAssigneesManager from '@/react-app/components/DocumentAssigneesManager';

interface DocumentFormData {
  title: string;
  type: string;
  assigned_to?: number; // Usuário de login (legacy)
  document_assignee_id?: number; // Responsável por documento (novo)
  assignment_type: 'user' | 'assignee'; // Tipo de atribuição
  deadline?: string;
  description?: string;
  priority: 'baixa' | 'normal' | 'alta';
  process_number?: string; // Número do processo judicial
  prisoner_name?: string; // Nome do preso
}

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [documentAssignees, setDocumentAssignees] = useState<DocumentAssignee[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showTypesManager, setShowTypesManager] = useState(false);
  const [showAssigneesManager, setShowAssigneesManager] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [formData, setFormData] = useState<DocumentFormData>({
    title: '',
    type: '',
    assigned_to: undefined,
    document_assignee_id: undefined,
    assignment_type: 'assignee',
    deadline: '',
    description: '',
    priority: 'normal',
    process_number: '',
    prisoner_name: ''
  });

  useEffect(() => {
    fetchDocuments();
    fetchUsers();
    fetchDocumentAssignees();
    fetchDocumentTypes();
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

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) throw new Error('Erro ao carregar documentos');
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    }
  };

  const fetchDocumentAssignees = async () => {
    try {
      const response = await fetch('/api/document-assignees');
      if (response.ok) {
        const data = await response.json();
        setDocumentAssignees(data);
      }
    } catch (err) {
      console.error('Erro ao carregar responsáveis:', err);
    }
  };

  const fetchDocumentTypes = async () => {
    try {
      const response = await fetch('/api/document-types');
      if (response.ok) {
        const data = await response.json();
        const activeTypes = data.filter((type: DocumentType) => type.is_active);
        setDocumentTypes(activeTypes);
        
        // Set default type if none selected
        if (activeTypes.length > 0 && !formData.type) {
          setFormData(prev => ({ ...prev, type: activeTypes[0].name }));
        }
      }
    } catch (err) {
      console.error('Erro ao carregar tipos de documentos:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Preparar dados baseado no tipo de atribuição
      const submitData = {
        ...formData,
        assigned_to: formData.assignment_type === 'user' ? formData.assigned_to : undefined,
        document_assignee_id: formData.assignment_type === 'assignee' ? formData.document_assignee_id : undefined,
        // Incluir o status quando estamos editando
        ...(editingDocument && { status: editingDocument.status })
      };

      const url = editingDocument ? `/api/documents/${editingDocument.id}` : '/api/documents';
      const method = editingDocument ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) throw new Error(editingDocument ? 'Erro ao atualizar documento' : 'Erro ao criar documento');

      resetForm();
      fetchDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar documento');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: documentTypes.length > 0 ? documentTypes[0].name : '',
      assigned_to: undefined,
      document_assignee_id: undefined,
      assignment_type: 'assignee',
      deadline: '',
      description: '',
      priority: 'normal',
      process_number: '',
      prisoner_name: ''
    });
    setShowForm(false);
    setEditingDocument(null);
  };

  const startEdit = (doc: Document) => {
    // Determinar o tipo de atribuição baseado nos dados existentes
    const hasUserAssignment = !!(doc as any).assigned_to;
    const hasAssigneeAssignment = !!(doc as any).document_assignee_id;
    
    setEditingDocument(doc);
    setFormData({
      title: doc.title,
      type: doc.type,
      assigned_to: hasUserAssignment ? (doc as any).assigned_to : undefined,
      document_assignee_id: hasAssigneeAssignment ? (doc as any).document_assignee_id : undefined,
      assignment_type: hasUserAssignment ? 'user' : 'assignee',
      deadline: doc.deadline || '',
      description: doc.description || '',
      priority: doc.priority,
      process_number: (doc as any).process_number || '',
      prisoner_name: (doc as any).prisoner_name || ''
    });
    setShowForm(true);
  };

  const updateDocumentStatus = async (id: number, status: 'Em Andamento' | 'Concluído' | 'Arquivado') => {
    try {
      const response = await fetch(`/api/documents/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Erro ao atualizar status');
      fetchDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar documento');
    }
  };

  const deleteDocument = async (documentId: number, documentTitle: string) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja EXCLUIR o documento "${documentTitle}"?\n\n` +
      `⚠️ Esta ação NÃO pode ser desfeita!\n\n` +
      `Digite "CONFIRMAR" para prosseguir:`
    );

    if (!confirmed) return;

    const secondConfirmation = prompt(
      `Para confirmar a exclusão do documento "${documentTitle}", digite: CONFIRMAR`
    );

    if (secondConfirmation !== 'CONFIRMAR') {
      alert('Exclusão cancelada. Texto de confirmação incorreto.');
      return;
    }

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir documento');
      }

      alert(`✅ ${result.message}`);
      fetchDocuments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir documento';
      setError(errorMessage);
      alert(`❌ Erro: ${errorMessage}`);
    }
  };

  const clearAllDocuments = async () => {
    const confirmed = window.confirm(
      `⚠️ ATENÇÃO: AÇÃO IRREVERSÍVEL!\n\n` +
      `Você está prestes a EXCLUIR PERMANENTEMENTE todos os documentos do sistema.\n\n` +
      `• ${documents.length} documento(s) será(ão) removido(s)\n` +
      `• Todos os dados serão perdidos para sempre\n` +
      `• Esta ação NÃO pode ser desfeita\n\n` +
      `Digite "CONFIRMAR EXCLUSAO" para prosseguir:`
    );

    if (!confirmed) return;

    const secondConfirmation = prompt(
      `Para confirmar a exclusão permanente de TODOS OS DOCUMENTOS, digite: CONFIRMAR EXCLUSAO`
    );

    if (secondConfirmation !== 'CONFIRMAR EXCLUSAO') {
      alert('Operação cancelada. Texto de confirmação incorreto.');
      return;
    }

    try {
      const response = await fetch('/api/admin/clear-documents', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao limpar documentos');
      }

      alert(`✅ ${result.message}`);
      fetchDocuments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao limpar documentos';
      setError(errorMessage);
      alert(`❌ Erro: ${errorMessage}`);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc as any).process_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc as any).prisoner_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    const matchesType = filterType === 'all' || doc.type === filterType;
    
    // Filtro por aba: ativos (Em Andamento + Concluído) ou arquivados
    const matchesTab = activeTab === 'active' 
      ? doc.status !== 'Arquivado'
      : doc.status === 'Arquivado';
    
    return matchesSearch && matchesStatus && matchesType && matchesTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído': return 'bg-green-100 text-green-800';
      case 'Em Andamento': return 'bg-yellow-100 text-yellow-800';
      case 'Arquivado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'baixa': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const isOverdue = (deadline: string | undefined, status: string) => {
    if (!deadline || status === 'Concluído') return false;
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Documentos</h1>
            <p className="text-gray-300">Gestão de documentos do sistema</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAssigneesManager(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Responsáveis</span>
            </button>
            <button
              onClick={() => setShowTypesManager(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Gerenciar Tipos</span>
            </button>
            {isAdmin && (
              <button
                onClick={clearAllDocuments}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpar Todos</span>
              </button>
            )}
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Documento</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-800 underline mt-2"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1 mb-4">
          <button
            onClick={() => {
              setActiveTab('active');
              setFilterStatus('all'); // Reset filter when changing tabs
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'active'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Documentos Ativos</span>
            <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full text-xs">
              {documents.filter(doc => doc.status !== 'Arquivado').length}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab('archived');
              setFilterStatus('all'); // Reset filter when changing tabs
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'archived'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Documentos Arquivados</span>
            <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full text-xs">
              {documents.filter(doc => doc.status === 'Arquivado').length}
            </span>
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-4 mb-4">
            <h2 className="text-xl font-semibold text-white mb-4">
              {editingDocument ? 'Editar Documento' : 'Novo Documento'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Digite o título do documento"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tipo
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Selecionar tipo</option>
                    {documentTypes.map(type => (
                      <option key={type.id} value={type.name}>{type.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Número do Processo
                  </label>
                  <input
                    type="text"
                    value={formData.process_number || ''}
                    onChange={(e) => setFormData({ ...formData, process_number: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: 0001234-56.2023.4.03.6104"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome do Preso
                  </label>
                  <input
                    type="text"
                    value={formData.prisoner_name || ''}
                    onChange={(e) => setFormData({ ...formData, prisoner_name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Digite o nome completo do preso"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tipo de Atribuição
                  </label>
                  <select
                    value={formData.assignment_type}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      assignment_type: e.target.value as 'user' | 'assignee',
                      assigned_to: undefined,
                      document_assignee_id: undefined
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="assignee">Responsável por Documento</option>
                    <option value="user">Usuário de Login</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {formData.assignment_type === 'user' ? 'Usuário de Login' : 'Responsável pelo Documento'}
                  </label>
                  {formData.assignment_type === 'user' ? (
                    <select
                      value={formData.assigned_to || ''}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecionar usuário de login</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={formData.document_assignee_id || ''}
                      onChange={(e) => setFormData({ ...formData, document_assignee_id: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecionar responsável</option>
                      {documentAssignees.map(assignee => (
                        <option key={assignee.id} value={assignee.id}>
                          {assignee.first_name} {assignee.last_name}
                          {assignee.department && ` - ${assignee.department}`}
                        </option>
                      ))}
                    </select>
                  )}
                  {formData.assignment_type === 'assignee' && documentAssignees.length === 0 && (
                    <p className="text-yellow-400 text-sm mt-1">
                      Nenhum responsável cadastrado. 
                      <button 
                        type="button"
                        onClick={() => setShowAssigneesManager(true)}
                        className="text-blue-400 underline ml-1"
                      >
                        Clique aqui para cadastrar
                      </button>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Prazo
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Prioridade
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>

                {/* Status field - only show when editing */}
                {editingDocument && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={(editingDocument as any).status}
                      onChange={(e) => setEditingDocument({ 
                        ...editingDocument, 
                        status: e.target.value as 'Em Andamento' | 'Concluído' | 'Arquivado' 
                      })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Em Andamento">Em Andamento</option>
                      <option value="Concluído">Concluído</option>
                      <option value="Arquivado">Arquivado</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descrição do documento (opcional)"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingDocument ? 'Atualizar Documento' : 'Criar Documento'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos os Status</option>
                {activeTab === 'active' ? (
                  <>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Concluído">Concluído</option>
                  </>
                ) : (
                  <option value="Arquivado">Arquivado</option>
                )}
              </select>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos os Tipos</option>
                {documentTypes.map(type => (
                  <option key={type.id} value={type.name}>{type.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="space-y-4">
          {filteredDocuments.length === 0 ? (
            <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {activeTab === 'active' ? 'Nenhum documento ativo encontrado' : 'Nenhum documento arquivado encontrado'}
              </h3>
              <p className="text-gray-300">
                {searchTerm || filterStatus !== 'all' || filterType !== 'all' 
                  ? 'Tente ajustar os filtros de busca.'
                  : activeTab === 'active' 
                    ? 'Comece criando seu primeiro documento.'
                    : 'Não há documentos arquivados no momento.'
                }
              </p>
            </div>
          ) : (
            filteredDocuments.map((doc) => (
              <div key={doc.id} className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{doc.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(doc.priority)}`}>
                        {doc.priority}
                      </span>
                      {isOverdue(doc.deadline, doc.status) && (
                        <div className="flex items-center space-x-1 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">Atrasado</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-300 mb-3">
                      <span className="flex items-center space-x-1">
                        <FileText className="w-4 h-4" />
                        <span>{doc.type}</span>
                      </span>
                      {(doc as any).assigned_user_name && (
                        <span className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{(doc as any).assigned_user_name} (Login)</span>
                        </span>
                      )}
                      {(doc as any).assigned_assignee_name && (
                        <span className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{(doc as any).assigned_assignee_name}</span>
                          {(doc as any).department && (
                            <span className="text-gray-400">- {(doc as any).department}</span>
                          )}
                        </span>
                      )}
                      {doc.deadline && (
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(doc.deadline).toLocaleDateString('pt-BR')}</span>
                        </span>
                      )}
                    </div>
                    
                    {/* Informações do Processo e Preso */}
                    {((doc as any).process_number || (doc as any).prisoner_name) && (
                      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 mb-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {(doc as any).process_number && (
                            <div>
                              <span className="text-blue-300 font-medium">Processo:</span>
                              <span className="text-blue-100 ml-2">{(doc as any).process_number}</span>
                            </div>
                          )}
                          {(doc as any).prisoner_name && (
                            <div>
                              <span className="text-blue-300 font-medium">Preso:</span>
                              <span className="text-blue-100 ml-2">{(doc as any).prisoner_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {doc.description && (
                      <p className="text-gray-300 text-sm mb-3">{doc.description}</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    {/* Edit Button - Always available */}
                    <button
                      onClick={() => startEdit(doc)}
                      className="p-2 text-gray-300 hover:text-blue-400 hover:bg-blue-900 rounded-lg transition-colors"
                      title="Editar documento"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {doc.status === 'Em Andamento' && (
                      <button
                        onClick={() => updateDocumentStatus(doc.id, 'Concluído')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Marcar como Concluído
                      </button>
                    )}
                    
                    {doc.status === 'Concluído' && (
                      <button
                        onClick={() => updateDocumentStatus(doc.id, 'Arquivado')}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Arquivar
                      </button>
                    )}
                    
                    {doc.status === 'Arquivado' && (
                      <button
                        onClick={() => updateDocumentStatus(doc.id, 'Concluído')}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        title="Retornar documento para status Concluído"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Desarquivar</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteDocument(doc.id, doc.title)}
                      className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-900 rounded-lg transition-colors"
                      title="Excluir documento permanentemente"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Document Types Manager Modal */}
        <DocumentTypesManager
          isOpen={showTypesManager}
          onClose={() => setShowTypesManager(false)}
          onUpdate={() => {
            fetchDocumentTypes();
            fetchDocuments();
          }}
        />

        {/* Document Assignees Manager Modal */}
        <DocumentAssigneesManager
          isOpen={showAssigneesManager}
          onClose={() => setShowAssigneesManager(false)}
          onUpdate={() => {
            fetchDocumentAssignees();
            fetchDocuments();
          }}
        />
      </div>
    </Layout>
  );
}
