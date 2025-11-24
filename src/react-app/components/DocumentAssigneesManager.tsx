import { useState, useEffect } from 'react';
import { Plus, Search, Edit, User, Building, Briefcase, UserCheck, UserX, Trash2, AlertTriangle } from 'lucide-react';
import { DocumentAssignee } from '@/shared/types';

interface DocumentAssigneeFormData {
  first_name: string;
  last_name: string;
  department: string;
  position: string;
}

interface DocumentAssigneesManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function DocumentAssigneesManager({ isOpen, onClose, onUpdate }: DocumentAssigneesManagerProps) {
  const [assignees, setAssignees] = useState<DocumentAssignee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignee, setEditingAssignee] = useState<DocumentAssignee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<DocumentAssigneeFormData>({
    first_name: '',
    last_name: '',
    department: '',
    position: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchAssignees();
    }
  }, [isOpen]);

  const fetchAssignees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/document-assignees');
      if (!response.ok) throw new Error('Erro ao carregar responsáveis');
      const data = await response.json();
      setAssignees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAssignee ? `/api/document-assignees/${editingAssignee.id}` : '/api/document-assignees';
      const method = editingAssignee ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao salvar responsável');

      setFormData({ first_name: '', last_name: '', department: '', position: '' });
      setShowForm(false);
      setEditingAssignee(null);
      fetchAssignees();
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar responsável');
    }
  };

  const startEdit = (assignee: DocumentAssignee) => {
    setEditingAssignee(assignee);
    setFormData({
      first_name: assignee.first_name,
      last_name: assignee.last_name,
      department: assignee.department || '',
      position: assignee.position || ''
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingAssignee(null);
    setFormData({ first_name: '', last_name: '', department: '', position: '' });
    setShowForm(false);
  };

  const toggleAssigneeStatus = async (assigneeId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/document-assignees/${assigneeId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) throw new Error('Erro ao atualizar status do responsável');
      fetchAssignees();
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar responsável');
    }
  };

  const deleteAssignee = async (assigneeId: number, assigneeName: string) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja EXCLUIR PERMANENTEMENTE o responsável "${assigneeName}"?\n\n` +
      `⚠️ ATENÇÃO: Esta ação NÃO pode ser desfeita!\n\n` +
      `Digite "CONFIRMAR" abaixo para prosseguir:`
    );

    if (!confirmed) return;

    const secondConfirmation = prompt(
      `Para confirmar a exclusão permanente do responsável "${assigneeName}", digite: CONFIRMAR`
    );

    if (secondConfirmation !== 'CONFIRMAR') {
      alert('Exclusão cancelada. Texto de confirmação incorreto.');
      return;
    }

    try {
      const response = await fetch(`/api/document-assignees/${assigneeId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir responsável');
      }

      alert(`✅ ${result.message}`);
      fetchAssignees();
      onUpdate();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir responsável';
      setError(errorMessage);
      alert(`❌ Erro: ${errorMessage}`);
    }
  };

  const filteredAssignees = assignees.filter(assignee => 
    `${assignee.first_name} ${assignee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignee.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignee.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-black opacity-75"></div>
        </div>

        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-gray-800 shadow-xl rounded-2xl border border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-white">Responsáveis por Documentos</h2>
              <p className="text-gray-300 mt-1">Pessoas que têm documentos atribuídos (não fazem login)</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{editingAssignee ? 'Cancelar Edição' : 'Novo Responsável'}</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-6">
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
          {showForm && (
            <div className="bg-gray-700 rounded-xl p-6 mb-6 border border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-4">
                {editingAssignee ? 'Editar Responsável' : 'Novo Responsável'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nome <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nome"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sobrenome <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Sobrenome"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Departamento
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Departamento/Setor"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Cargo/Função
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Cargo ou função"
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingAssignee ? 'Atualizar' : 'Criar'} Responsável
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

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nome, departamento ou cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Assignees List */}
          {!loading && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredAssignees.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Nenhum responsável encontrado</h3>
                  <p className="text-gray-300">
                    {searchTerm 
                      ? 'Tente ajustar o termo de busca.'
                      : 'Comece criando o primeiro responsável por documentos.'
                    }
                  </p>
                </div>
              ) : (
                filteredAssignees.map((assignee) => (
                  <div key={assignee.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {assignee.first_name.charAt(0)}{assignee.last_name.charAt(0)}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="text-lg font-semibold text-white">
                              {assignee.first_name} {assignee.last_name}
                            </h3>
                            {!assignee.is_active && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-900 text-red-200">
                                Inativo
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-300">
                            {assignee.department && (
                              <span className="flex items-center space-x-1">
                                <Building className="w-4 h-4" />
                                <span>{assignee.department}</span>
                              </span>
                            )}
                            {assignee.position && (
                              <span className="flex items-center space-x-1">
                                <Briefcase className="w-4 h-4" />
                                <span>{assignee.position}</span>
                              </span>
                            )}
                            <span>Criado: {new Date(assignee.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEdit(assignee)}
                          className="p-2 text-gray-300 hover:text-blue-400 hover:bg-blue-900 rounded-lg transition-colors"
                          title="Editar responsável"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => toggleAssigneeStatus(assignee.id, assignee.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            assignee.is_active 
                              ? 'text-gray-300 hover:text-orange-400 hover:bg-orange-900' 
                              : 'text-gray-300 hover:text-green-400 hover:bg-green-900'
                          }`}
                          title={assignee.is_active ? 'Desativar responsável' : 'Ativar responsável'}
                        >
                          {assignee.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => deleteAssignee(assignee.id, `${assignee.first_name} ${assignee.last_name}`)}
                          className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-900 rounded-lg transition-colors"
                          title="Excluir responsável permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
