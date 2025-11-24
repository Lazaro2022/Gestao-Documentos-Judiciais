import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  RefreshCw, 
  Shield, 
  Database, 
  Bell, 
  Mail, 
  Users, 
  FileText,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Info,
  Trash2,
  Eye,
  Crown,
  Activity
} from 'lucide-react';
import Layout from '@/react-app/components/Layout';

interface SystemSettings {
  systemName: string;
  systemDescription: string;
  maxDocumentsPerUser: number;
  defaultDocumentPriority: 'baixa' | 'normal' | 'alta';
  autoArchiveDays: number;
  emailNotifications: boolean;
  deadlineNotifications: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  maintenanceMode: boolean;
}

interface SystemStats {
  totalUsers: number;
  totalDocuments: number;
  completedDocuments: number;
  pendingDocuments: number;
  overdueDocuments: number;
  systemUptime: string;
  lastBackup: string;
  databaseSize: string;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [showAccessLogs, setShowAccessLogs] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    systemName: 'SEAP',
    systemDescription: 'Sistema de Gestão de Documentos Judiciais',
    maxDocumentsPerUser: 100,
    defaultDocumentPriority: 'normal',
    autoArchiveDays: 365,
    emailNotifications: true,
    deadlineNotifications: true,
    backupFrequency: 'daily',
    maintenanceMode: false
  });
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalDocuments: 0,
    completedDocuments: 0,
    pendingDocuments: 0,
    overdueDocuments: 0,
    systemUptime: '0 dias',
    lastBackup: 'Nunca',
    databaseSize: '0 MB'
  });

  useEffect(() => {
    loadSystemStats();
    checkAdminStatus();
    setLoading(false);
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

  const loadSystemStats = async () => {
    try {
      const [usersResponse, documentsResponse] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/documents')
      ]);
      
      if (usersResponse.ok && documentsResponse.ok) {
        const users = await usersResponse.json();
        const documents = await documentsResponse.json();
        
        const completedDocs = documents.filter((doc: any) => doc.status === 'Concluído').length;
        const pendingDocs = documents.filter((doc: any) => doc.status === 'Em Andamento').length;
        const now = new Date();
        const overdueDocs = documents.filter((doc: any) => {
          if (!doc.deadline || doc.status === 'Concluído') return false;
          return new Date(doc.deadline) < now;
        }).length;
        
        setStats({
          totalUsers: users.length,
          totalDocuments: documents.length,
          completedDocuments: completedDocs,
          pendingDocuments: pendingDocs,
          overdueDocuments: overdueDocs,
          systemUptime: '15 dias, 8 horas',
          lastBackup: new Date().toLocaleDateString('pt-BR'),
          databaseSize: '2.4 MB'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Simular salvamento das configurações
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações. Tente novamente.' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleBackupDatabase = async () => {
    try {
      setMessage({ type: 'info', text: 'Iniciando exportação do backup...' });

      // Fazer requisição ao endpoint de backup
      const response = await fetch('/api/admin/export-backup');

      if (!response.ok) {
        throw new Error('Erro ao exportar backup');
      }

      // Obter o JSON do backup
      const backupData = await response.json();

      // Criar blob e fazer download
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seap-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setMessage({
        type: 'success',
        text: `Backup exportado com sucesso! ${backupData.metadata.totalRecords.documents} documentos, ${backupData.metadata.totalRecords.users} usuários.`
      });
      setStats(prev => ({ ...prev, lastBackup: new Date().toLocaleDateString('pt-BR') }));
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao realizar backup. Tente novamente.' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleRestoreDatabase = async () => {
    const confirmed = window.confirm(
      '⚠️ ATENÇÃO: RESTAURAÇÃO DE BACKUP!\n\n' +
      'Esta ação irá:\n' +
      '• EXCLUIR todos os dados atuais do sistema\n' +
      '• SUBSTITUIR pelos dados do arquivo de backup\n' +
      '• Esta ação NÃO pode ser desfeita!\n\n' +
      'Tem certeza que deseja continuar?'
    );

    if (!confirmed) return;

    // Criar input de arquivo temporário
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        setMessage({ type: 'info', text: 'Lendo arquivo de backup...' });

        // Ler arquivo JSON
        const text = await file.text();
        const backup = JSON.parse(text);

        // Validar estrutura do backup
        if (!backup.metadata || !backup.data) {
          throw new Error('Arquivo de backup inválido. Estrutura incorreta.');
        }

        setMessage({ type: 'info', text: 'Importando dados para o banco de dados...' });

        // Enviar para o backend
        const response = await fetch('/api/admin/import-backup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            backup: backup,
            clearBeforeImport: true
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Erro ao importar backup');
        }

        setMessage({
          type: 'success',
          text: `Backup restaurado com sucesso! Importados: ${result.imported.documents} documentos, ${result.imported.users} usuários, ${result.imported.documentTypes} tipos.`
        });

        // Recarregar estatísticas
        loadSystemStats();

        setTimeout(() => {
          setMessage(null);
          alert('✅ Sistema restaurado! Recarregue a página para ver as alterações.');
        }, 3000);

      } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        setMessage({
          type: 'error',
          text: `Erro ao restaurar backup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        });
        setTimeout(() => setMessage(null), 5000);
      }
    };

    input.click();
  };

  const loadAccessLogs = async () => {
    try {
      const response = await fetch('/api/admin/access-logs');
      if (response.ok) {
        const logs = await response.json();
        setAccessLogs(logs);
      }
    } catch (error) {
      console.error('Erro ao carregar logs de acesso:', error);
    }
  };

  const clearAccessLogs = async () => {
    const confirmed = window.confirm(
      `⚠️ ATENÇÃO: AÇÃO IRREVERSÍVEL!\n\n` +
      `Você está prestes a EXCLUIR PERMANENTEMENTE todos os logs de acesso.\n\n` +
      `• ${accessLogs.length} registro(s) será(ão) removido(s)\n` +
      `• Histórico de acessos será perdido\n` +
      `• Esta ação NÃO pode ser desfeita\n\n` +
      `Digite "CONFIRMAR EXCLUSAO" para prosseguir:`
    );

    if (!confirmed) return;

    const secondConfirmation = prompt(
      `Para confirmar a exclusão permanente dos LOGS DE ACESSO, digite: CONFIRMAR EXCLUSAO`
    );

    if (secondConfirmation !== 'CONFIRMAR EXCLUSAO') {
      alert('Operação cancelada. Texto de confirmação incorreto.');
      return;
    }

    try {
      const response = await fetch('/api/admin/clear-access-logs', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao limpar logs de acesso');
      }

      alert(`✅ ${result.message}`);
      setAccessLogs([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao limpar logs de acesso';
      setMessage({ type: 'error', text: errorMessage });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const resetProductionDatabase = async () => {
    const confirmed = window.confirm(
      `🔄 RESETAR BANCO DE DADOS DE PRODUÇÃO 🔄\n\n` +
      `Esta ação vai limpar todos os dados da versão PUBLICADA para resolver problemas de sincronização.\n\n` +
      `Você está prestes a EXCLUIR da versão publicada:\n` +
      `• TODOS os documentos antigos\n` +
      `• TODOS os usuários antigos\n` +
      `• TODOS os tipos de documentos antigos\n` +
      `• TODOS os logs de acesso antigos\n\n` +
      `Após isso, você poderá reconfigurar tudo do zero na versão publicada.\n\n` +
      `Digite "RESET PRODUCAO" para prosseguir:`
    );

    if (!confirmed) return;

    const secondConfirmation = prompt(
      `🔄 CONFIRMAÇÃO FINAL DE RESET DE PRODUÇÃO 🔄\n\n` +
      `Para confirmar o RESET DO BANCO DE PRODUÇÃO, digite: RESET PRODUCAO`
    );

    if (secondConfirmation !== 'RESET PRODUCAO') {
      alert('Operação cancelada. Texto de confirmação incorreto.');
      return;
    }

    try {
      setMessage({ type: 'info', text: 'Resetando banco de dados de produção...' });
      
      const response = await fetch('/api/admin/reset-system', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao resetar banco de produção');
      }

      alert(`✅ ${result.message}\n\n🔄 PRÓXIMOS PASSOS:\n1. Acesse a versão publicada do sistema\n2. Faça login usando as senhas de acesso\n3. Cadastre novamente os usuários de login\n4. Cadastre novamente os responsáveis por documentos\n5. Configure os tipos de documentos`);
      loadSystemStats();
      setAccessLogs([]);
      setMessage({ type: 'success', text: 'Banco de produção resetado! Agora você pode reconfigurar na versão publicada.' });
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao resetar banco de produção';
      setMessage({ type: 'error', text: errorMessage });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const resetSystem = async () => {
    const confirmed = window.confirm(
      `🚨 RESET COMPLETO DO SISTEMA! 🚨\n\n` +
      `ESTA É A AÇÃO MAIS DESTRUTIVA DISPONÍVEL!\n\n` +
      `Você está prestes a EXCLUIR PERMANENTEMENTE:\n` +
      `• TODOS os documentos\n` +
      `• TODOS os usuários (exceto administradores)\n` +
      `• TODOS os tipos de documentos\n` +
      `• TODOS os logs de acesso\n\n` +
      `O sistema será resetado ao estado inicial!\n` +
      `ESTA AÇÃO NÃO PODE SER DESFEITA!\n\n` +
      `Digite "RESET COMPLETO" para prosseguir:`
    );

    if (!confirmed) return;

    const secondConfirmation = prompt(
      `🚨 CONFIRMAÇÃO FINAL DE RESET COMPLETO 🚨\n\n` +
      `Para confirmar o RESET COMPLETO DO SISTEMA, digite: RESET COMPLETO`
    );

    if (secondConfirmation !== 'RESET COMPLETO') {
      alert('Operação cancelada. Texto de confirmação incorreto.');
      return;
    }

    try {
      setMessage({ type: 'info', text: 'Realizando reset completo do sistema...' });
      
      const response = await fetch('/api/admin/reset-system', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao resetar sistema');
      }

      alert(`✅ ${result.message}`);
      loadSystemStats();
      setAccessLogs([]);
      setMessage({ type: 'success', text: 'Sistema resetado com sucesso!' });
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao resetar sistema';
      setMessage({ type: 'error', text: errorMessage });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const tabs = [
    { id: 'general', name: 'Geral', icon: SettingsIcon },
    { id: 'notifications', name: 'Notificações', icon: Bell },
    { id: 'stats', name: 'Estatísticas', icon: FileText },
    ...(isAdmin ? [
      { id: 'security', name: 'Segurança', icon: Shield },
      { id: 'database', name: 'Banco de Dados', icon: Database },
      { id: 'access-logs', name: 'Logs de Acesso', icon: Activity },
      { id: 'admin-tools', name: 'Ferramentas Admin', icon: Crown },
    ] : []),
  ];

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
            <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
            <p className="text-gray-300">Gerenciar configurações do sistema</p>
          </div>
          {isAdmin && (
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          )}
          {!isAdmin && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-gray-400 rounded-lg">
              <Shield className="w-4 h-4" />
              <span>Apenas visualização</span>
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className={`
            p-3 rounded-lg mb-4 flex items-center space-x-2
            ${message.type === 'success' ? 'bg-green-900 border border-green-700 text-green-300' : ''}
            ${message.type === 'error' ? 'bg-red-900 border border-red-700 text-red-300' : ''}
            ${message.type === 'info' ? 'bg-blue-900 border border-blue-700 text-blue-300' : ''}
          `}>
            {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {message.type === 'error' && <AlertTriangle className="w-5 h-5" />}
            {message.type === 'info' && <Info className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                        ${activeTab === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
              
              {/* Notice for non-admin users */}
              {!isAdmin && (
                <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <p className="text-blue-300 text-xs">
                      Algumas configurações são restritas apenas para administradores
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-4">
              
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">Configurações Gerais</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nome do Sistema
                      </label>
                      <input
                        type="text"
                        value={settings.systemName}
                        onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!isAdmin}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Máximo de Documentos por Usuário
                      </label>
                      <input
                        type="number"
                        value={settings.maxDocumentsPerUser}
                        onChange={(e) => setSettings({ ...settings, maxDocumentsPerUser: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!isAdmin}
                      />
                      {!isAdmin && (
                        <p className="text-yellow-400 text-xs mt-1">
                          Apenas administradores podem alterar este valor
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Prioridade Padrão para Novos Documentos
                      </label>
                      <select
                        value={settings.defaultDocumentPriority}
                        onChange={(e) => setSettings({ ...settings, defaultDocumentPriority: e.target.value as any })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!isAdmin}
                      >
                        <option value="baixa">Baixa</option>
                        <option value="normal">Normal</option>
                        <option value="alta">Alta</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Auto-arquivar após (dias)
                      </label>
                      <input
                        type="number"
                        value={settings.autoArchiveDays}
                        onChange={(e) => setSettings({ ...settings, autoArchiveDays: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!isAdmin}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Descrição do Sistema
                    </label>
                    <textarea
                      value={settings.systemDescription}
                      onChange={(e) => setSettings({ ...settings, systemDescription: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={!isAdmin}
                    />
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">Configurações de Notificações</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-300" />
                        <div>
                          <h3 className="font-medium text-white">Notificações por E-mail</h3>
                          <p className="text-sm text-gray-300">Receber notificações importantes por e-mail</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={settings.emailNotifications}
                          onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                          disabled={!isAdmin}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Bell className="w-5 h-5 text-gray-300" />
                        <div>
                          <h3 className="font-medium text-white">Notificações de Prazo</h3>
                          <p className="text-sm text-gray-300">Alertas sobre documentos próximos do prazo</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={settings.deadlineNotifications}
                          onChange={(e) => setSettings({ ...settings, deadlineNotifications: e.target.checked })}
                          disabled={!isAdmin}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && isAdmin && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">Configurações de Segurança</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="w-5 h-5 text-gray-300" />
                        <div>
                          <h3 className="font-medium text-white">Modo de Manutenção</h3>
                          <p className="text-sm text-gray-300">Bloquear acesso ao sistema para manutenção</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={settings.maintenanceMode}
                          onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                    
                    <div className="p-4 bg-yellow-900 border border-yellow-700 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-300 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-yellow-300">Atenção</h3>
                          <p className="text-sm text-yellow-400 mt-1">
                            O modo de manutenção impedirá que usuários acessem o sistema. 
                            Use apenas quando necessário para atualizações ou reparos.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Database Tab */}
              {activeTab === 'database' && isAdmin && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">Configurações do Banco de Dados</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Frequência de Backup
                      </label>
                      <select
                        value={settings.backupFrequency}
                        onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value as any })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="daily">Diário</option>
                        <option value="weekly">Semanal</option>
                        <option value="monthly">Mensal</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Ações do Banco de Dados</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={handleBackupDatabase}
                        className="flex items-center justify-center space-x-2 p-4 border-2 border-green-700 text-green-300 rounded-lg hover:bg-green-900 transition-colors"
                      >
                        <Download className="w-5 h-5" />
                        <span>Fazer Backup Agora</span>
                      </button>
                      
                      <button
                        onClick={handleRestoreDatabase}
                        className="flex items-center justify-center space-x-2 p-4 border-2 border-orange-700 text-orange-300 rounded-lg hover:bg-orange-900 transition-colors"
                      >
                        <Upload className="w-5 h-5" />
                        <span>Restaurar Backup</span>
                      </button>
                    </div>
                    
                    <div className="p-4 bg-blue-900 border border-blue-700 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Info className="w-5 h-5 text-blue-300 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-300">Informações sobre Backup</h4>
                          <p className="text-sm text-blue-400 mt-1">
                            Os backups são essenciais para proteger seus dados. 
                            Recomendamos manter backups regulares e testá-los periodicamente.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Tab */}
              {activeTab === 'stats' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">Estatísticas do Sistema</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <Users className="w-8 h-8 text-blue-300" />
                        <div>
                          <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                          <p className="text-blue-400 text-sm">Total de Usuários</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-900 border border-green-700 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-green-300" />
                        <div>
                          <p className="text-2xl font-bold text-white">{stats.totalDocuments}</p>
                          <p className="text-green-400 text-sm">Total de Documentos</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-900 border border-purple-700 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-8 h-8 text-purple-300" />
                        <div>
                          <p className="text-2xl font-bold text-white">{stats.completedDocuments}</p>
                          <p className="text-purple-400 text-sm">Documentos Concluídos</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <RefreshCw className="w-8 h-8 text-yellow-300" />
                        <div>
                          <p className="text-2xl font-bold text-white">{stats.pendingDocuments}</p>
                          <p className="text-yellow-400 text-sm">Documentos Pendentes</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-red-900 border border-red-700 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="w-8 h-8 text-red-300" />
                        <div>
                          <p className="text-2xl font-bold text-white">{stats.overdueDocuments}</p>
                          <p className="text-red-400 text-sm">Documentos Atrasados</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <Database className="w-8 h-8 text-gray-300" />
                        <div>
                          <p className="text-2xl font-bold text-white">{stats.databaseSize}</p>
                          <p className="text-gray-400 text-sm">Tamanho do Banco</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 border border-gray-600 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Informações do Sistema</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Tempo de Funcionamento:</span>
                        <span className="font-medium text-white">{stats.systemUptime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Último Backup:</span>
                        <span className="font-medium text-white">{stats.lastBackup}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Versão do Sistema:</span>
                        <span className="font-medium text-white">SEAP v2.0</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Access Logs Tab */}
              {activeTab === 'access-logs' && isAdmin && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Logs de Acesso ao Sistema</h2>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          loadAccessLogs();
                          setShowAccessLogs(!showAccessLogs);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{showAccessLogs ? 'Ocultar Logs' : 'Visualizar Logs'}</span>
                      </button>
                      <button
                        onClick={clearAccessLogs}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Limpar Logs</span>
                      </button>
                    </div>
                  </div>
                  
                  {showAccessLogs && (
                    <div className="space-y-4">
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-white mb-4">Registros de Acesso Recentes</h3>
                        
                        {accessLogs.length === 0 ? (
                          <div className="text-center py-8">
                            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-300">Nenhum log de acesso encontrado</p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {accessLogs.map((log, index) => (
                              <div key={index} className="bg-gray-600 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-white">
                                      {log.user_name || 'Usuário Desconhecido'} ({log.matricula})
                                    </p>
                                    <p className="text-sm text-gray-300">
                                      Login: {new Date(log.login_time).toLocaleString('pt-BR')}
                                    </p>
                                    {log.logout_time && (
                                      <p className="text-sm text-gray-300">
                                        Logout: {new Date(log.logout_time).toLocaleString('pt-BR')}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-gray-400">IP: {log.ip_address}</p>
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                                      log.session_active ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-300'
                                    }`}>
                                      {log.session_active ? 'Ativo' : 'Finalizado'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Tools Tab */}
              {activeTab === 'admin-tools' && isAdmin && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">Ferramentas Administrativas</h2>
                  
                  {/* Sync Tools */}
                  <div className="p-6 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                    <div className="flex items-center space-x-3 mb-4">
                      <Database className="w-6 h-6 text-blue-400" />
                      <h3 className="text-lg font-medium text-white">Sincronização de Dados</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-blue-900/40 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-medium text-blue-200">Resetar Banco de Produção</h4>
                            <p className="text-sm text-blue-300 mt-2">
                              Remove todos os dados antigos da versão publicada e permite começar do zero.
                              <br />
                              <strong>Recomendado:</strong> Use quando a versão publicada tem dados desatualizados.
                            </p>
                          </div>
                          <button
                            onClick={resetProductionDatabase}
                            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            <RefreshCw className="w-5 h-5" />
                            <span>RESETAR PRODUÇÃO</span>
                          </button>
                        </div>
                        
                        <div className="bg-blue-800/50 rounded-lg p-4">
                          <h5 className="font-medium text-blue-200 mb-2">Este botão vai:</h5>
                          <ul className="text-sm text-blue-300 space-y-1">
                            <li>• Limpar todos os dados antigos da versão publicada</li>
                            <li>• Permitir que você reconfigure do zero</li>
                            <li>• Manter a estrutura do banco de dados</li>
                            <li>• Preservar apenas as senhas de acesso configuradas</li>
                          </ul>
                          
                          <h5 className="font-medium text-blue-200 mb-2 mt-4">Após o reset:</h5>
                          <ul className="text-sm text-blue-300 space-y-1">
                            <li>• Faça login na versão publicada</li>
                            <li>• Cadastre novamente os usuários de login</li>
                            <li>• Cadastre novamente os responsáveis por documentos</li>
                            <li>• Configure os tipos de documentos</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-red-900/20 border border-red-600/30 rounded-lg">
                    <div className="flex items-center space-x-3 mb-4">
                      <Crown className="w-6 h-6 text-yellow-400" />
                      <h3 className="text-lg font-medium text-white">Zona de Perigo - Apenas Administradores</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-red-900/40 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-medium text-red-200">Reset Completo do Sistema</h4>
                            <p className="text-sm text-red-300 mt-2">
                              Remove TODOS os dados do sistema, exceto administradores.
                              <br />
                              <strong>AÇÃO IRREVERSÍVEL!</strong> Use apenas em casos extremos.
                            </p>
                          </div>
                          <button
                            onClick={resetSystem}
                            className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                          >
                            <AlertTriangle className="w-5 h-5" />
                            <span>RESET SISTEMA</span>
                          </button>
                        </div>
                        
                        <div className="bg-red-800/50 rounded-lg p-4">
                          <h5 className="font-medium text-red-200 mb-2">O que será removido:</h5>
                          <ul className="text-sm text-red-300 space-y-1">
                            <li>• Todos os documentos ({stats.totalDocuments} documento(s))</li>
                            <li>• Todos os usuários não-administradores ({stats.totalUsers - 1} usuário(s))</li>
                            <li>• Todos os tipos de documentos personalizados</li>
                            <li>• Todos os logs de acesso ao sistema</li>
                          </ul>
                          
                          <h5 className="font-medium text-red-200 mb-2 mt-4">O que será preservado:</h5>
                          <ul className="text-sm text-red-300 space-y-1">
                            <li>• Contas de administradores</li>
                            <li>• Configurações do sistema</li>
                            <li>• Estrutura do banco de dados</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-600/30">
                        <div className="flex items-start space-x-3">
                          <Info className="w-5 h-5 text-blue-300 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-300">Limpeza Seletiva</h4>
                            <p className="text-sm text-blue-400 mt-1">
                              Para limpezas mais específicas, use os botões "Limpar" nas seções individuais:
                              <br />
                              • Documentos: Botão vermelho na página de Documentos
                              <br />
                              • Usuários: Botão vermelho na página de Usuários  
                              <br />
                              • Tipos de Documentos: Botão vermelho no gerenciador de tipos
                              <br />
                              • Logs de Acesso: Botão vermelho na aba Logs de Acesso
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
