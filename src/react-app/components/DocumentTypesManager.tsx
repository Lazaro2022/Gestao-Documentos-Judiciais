import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, FileText, Palette } from 'lucide-react';

interface DocumentType {
  id: number;
  name: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DocumentTypesManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const colorOptions = [
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Amarelo', value: '#F59E0B' },
  { name: 'Vermelho', value: '#EF4444' },
  { name: 'Roxo', value: '#8B5CF6' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Ciano', value: '#06B6D4' },
  { name: 'Laranja', value: '#F97316' },
];

export default function DocumentTypesManager({ isOpen, onClose, onUpdate }: DocumentTypesManagerProps) {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<DocumentType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6'
  });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDocumentTypes();
      checkAdminStatus();
    }
  }, [isOpen]);

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

  const fetchDocumentTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/document-types');
      if (!response.ok) throw new Error('Erro ao carregar tipos de documentos');
      const data = await response.json();
      setDocumentTypes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingType ? `/api/document-types/${editingType.id}` : '/api/document-types';
      const method = editingType ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao salvar tipo de documento');

      setFormData({ name: '', color: '#3B82F6' });
      setShowForm(false);
      setEditingType(null);
      fetchDocumentTypes();
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar tipo');
    }
  };

  const startEdit = (type: DocumentType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      color: type.color
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingType(null);
    setFormData({ name: '', color: '#3B82F6' });
    setShowForm(false);
  };

  const toggleTypeStatus = async (typeId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/document-types/${typeId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) throw new Error('Erro ao atualizar status do tipo');
      fetchDocumentTypes();
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar tipo');
    }
  };

  const deleteType = async (typeId: number) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de documento? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch(`/api/document-types/${typeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao excluir tipo de documento');
      fetchDocumentTypes();
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir tipo');
    }
  };

  const clearAllDocumentTypes = async () => {
    const confirmed = window.confirm(
      `⚠️ ATENÇÃO: AÇÃO IRREVERSÍVEL!\n\n` +
      `Você está prestes a EXCLUIR PERMANENTEMENTE todos os tipos de documentos.\n\n` +
      `• ${documentTypes.length} tipo(s) será(ão) removido(s)\n` +
      `• Documentos existentes podem ficar inconsistentes\n` +
      `• Esta ação NÃO pode ser desfeita\n\n` +
      `Digite "CONFIRMAR EXCLUSAO" para prosseguir:`
    );

    if (!confirmed) return;

    const secondConfirmation = prompt(
      `Para confirmar a exclusão permanente dos TIPOS DE DOCUMENTOS, digite: CONFIRMAR EXCLUSAO`
    );

    if (secondConfirmation !== 'CONFIRMAR EXCLUSAO') {
      alert('Operação cancelada. Texto de confirmação incorreto.');
      return;
    }

    try {
      const response = await fetch('/api/admin/clear-document-types', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao limpar tipos de documentos');
      }

      alert(`✅ ${result.message}`);
      fetchDocumentTypes();
      onUpdate();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao limpar tipos de documentos';
      setError(errorMessage);
      alert(`❌ Erro: ${errorMessage}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Gerenciar Tipos de Documentos</h2>
              <p className="text-sm text-gray-300">Adicione, edite ou remova tipos de documentos</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isAdmin && (
              <button
                onClick={clearAllDocumentTypes}
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
              <span>Novo Tipo</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-6">
              <p className="text-red-200">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="text-red-300 underline mt-2 hover:text-red-100"
              >
                Fechar
              </button>
            </div>
          )}

          {/* Form */}
          {showForm && (
            <div className="bg-gray-700 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {editingType ? 'Editar Tipo' : 'Novo Tipo de Documento'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nome do Tipo
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: Alvará, Petição, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Cor
                    </label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-10 h-10 rounded-lg border-2 border-gray-500"
                        style={{ backgroundColor: formData.color }}
                      />
                      <select
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {colorOptions.map(color => (
                          <option key={color.value} value={color.value}>
                            {color.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingType ? 'Atualizar' : 'Criar'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-6 py-2 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Types List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {documentTypes.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Nenhum tipo encontrado</h3>
                  <p className="text-gray-300">Adicione o primeiro tipo de documento.</p>
                </div>
              ) : (
                documentTypes.map((type) => (
                  <div key={type.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-8 h-8 rounded-lg"
                        style={{ backgroundColor: type.color }}
                      />
                      <div>
                        <h4 className="font-medium text-white">{type.name}</h4>
                        <p className="text-sm text-gray-300">
                          ID: {type.id} • Criado: {new Date(type.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      {!type.is_active && (
                        <span className="px-2 py-1 bg-red-900 text-red-200 text-xs rounded-full">
                          Inativo
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEdit(type)}
                        className="p-2 text-gray-300 hover:text-blue-400 hover:bg-blue-900 rounded-lg transition-colors"
                        title="Editar tipo"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => toggleTypeStatus(type.id, type.is_active)}
                        className={`p-2 rounded-lg transition-colors ${
                          type.is_active 
                            ? 'text-gray-300 hover:text-red-400 hover:bg-red-900' 
                            : 'text-gray-300 hover:text-green-400 hover:bg-green-900'
                        }`}
                        title={type.is_active ? 'Desativar tipo' : 'Ativar tipo'}
                      >
                        <Palette className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => deleteType(type.id)}
                        className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-900 rounded-lg transition-colors"
                        title="Excluir tipo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
