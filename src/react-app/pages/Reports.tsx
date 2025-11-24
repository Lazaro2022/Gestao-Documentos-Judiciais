import { BarChart3, Users, Loader2, RefreshCw, TrendingUp } from 'lucide-react';
import Layout from '@/react-app/components/Layout';
import StatCard from '@/react-app/components/StatCard';
import UserProductivityCard from '@/react-app/components/UserProductivityCard';
import PDFReportGenerator from '@/react-app/components/PDFReportGenerator';
import { 
  WeeklyChart, 
  MonthlyChart, 
  AnnualChart, 
  DocumentTypesChart, 
  ComparisonChart 
} from '@/react-app/components/ProductivityCharts';
import { useProductivityReport } from '@/react-app/hooks/useProductivityReport';
import { useEffect, useState } from 'react';

export default function Reports() {
  const { report, loading, error, refetch } = useProductivityReport();
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'users'>('overview');

  useEffect(() => {
    console.log('🔥 [REPORTS] Página de relatórios carregada');
    console.log('🔥 [REPORTS] Report atual:', report);
    if (report?.userProductivity) {
      console.log(`🔥 [REPORTS] ${report.userProductivity.length} usuários encontrados no relatório`);
      report.userProductivity.forEach(user => {
        console.log(`🔥 [REPORTS] Usuário: ${user.userName} - Documentos: ${user.totalDocuments} - Taxa: ${user.completionRate.toFixed(1)}%`);
      });
    }
  }, [report]);

  if (loading) {
    return (
      <Layout>
        <div className="px-4 py-2">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-slate-600">Carregando relatórios de produtividade...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-red-800 font-medium mb-2">Erro ao carregar relatórios</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button 
              onClick={refetch}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tentar Novamente</span>
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!report) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center text-slate-500 py-12">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <p>Nenhum dado de relatório disponível</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Relatórios de Produtividade</h1>
            <p className="text-gray-300">Análise detalhada da performance dos usuários</p>
          </div>
          <div className="flex items-center space-x-3">
            <PDFReportGenerator report={report} />
            <button
              onClick={refetch}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1 mb-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Visão Geral</span>
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'charts'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Gráficos</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Por Usuário</span>
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <>
            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Taxa de Conclusão Geral"
                value={`${report.completionRate.toFixed(1)}%`}
                icon={BarChart3}
                color="blue"
                change={{
                  value: `${report.completedDocuments}/${report.totalDocuments} concluídos`,
                  trend: report.completionRate >= 70 ? 'up' : 'down'
                }}
              />
              
              <StatCard
                title="Usuários Ativos"
                value={report.userProductivity.length}
                icon={Users}
                color="green"
                change={{
                  value: `${report.userProductivity.filter(u => u.totalDocuments > 0).length} com documentos`,
                  trend: 'neutral'
                }}
              />
              
              <StatCard
                title="Documentos em Atraso"
                value={report.overdueDocuments}
                icon={BarChart3}
                color="red"
                change={{
                  value: report.overdueDocuments === 0 ? 'Nenhum atraso!' : 'Atenção necessária',
                  trend: report.overdueDocuments === 0 ? 'up' : 'down'
                }}
              />
              
              <StatCard
                title="Total de Documentos"
                value={report.totalDocuments}
                icon={BarChart3}
                color="purple"
                change={{
                  value: `${report.inProgressDocuments} em andamento`,
                  trend: 'neutral'
                }}
              />
            </div>

            {/* Summary Section */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-4 border border-gray-600">
              <h2 className="text-xl font-semibold text-white mb-4">Resumo do Sistema</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                {Object.entries(report.documentsByType).map(([type, count], index) => {
                  const colors = ['text-blue-600', 'text-green-600', 'text-yellow-600', 'text-red-600', 'text-purple-600', 'text-pink-600'];
                  const colorClass = colors[index % colors.length];
                  // Capitalizar o nome do tipo
                  const displayName = type.charAt(0).toUpperCase() + type.slice(1);
                  
                  return (
                    <div key={type}>
                      <div className={`text-2xl font-bold ${colorClass}`}>{count}</div>
                      <div className="text-sm text-gray-300">{displayName}</div>
                    </div>
                  );
                })}
              </div>
              {Object.keys(report.documentsByType).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400">Nenhum tipo de documento encontrado</p>
                  <p className="text-gray-500 text-sm mt-1">Crie alguns documentos para ver as estatísticas</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'charts' && (
          <>
            {/* Comparison Chart */}
            {report.weeklyTrends && report.monthlyTrends && report.annualTrends && (
              <div className="mb-6">
                <ComparisonChart 
                  weeklyData={report.weeklyTrends}
                  monthlyData={report.monthlyTrends}
                  annualData={report.annualTrends}
                />
              </div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Weekly Chart */}
              {report.weeklyTrends && (
                <WeeklyChart 
                  data={report.weeklyTrends}
                  title="Progresso Semanal (Últimas 8 Semanas)"
                />
              )}

              {/* Document Types Chart */}
              {report.monthlyTrends && (
                <DocumentTypesChart 
                  data={report.monthlyTrends}
                  title="Distribuição por Tipo de Documento"
                />
              )}
            </div>

            {/* Monthly Chart */}
            {report.monthlyTrends && (
              <div className="mb-6">
                <MonthlyChart 
                  data={report.monthlyTrends}
                  title="Progresso Mensal (Últimos 12 Meses)"
                />
              </div>
            )}

            {/* Annual Chart */}
            {report.annualTrends && (
              <div className="mb-8">
                <AnnualChart 
                  data={report.annualTrends}
                  title="Progresso Anual (Últimos 3 Anos)"
                />
              </div>
            )}
          </>
        )}

        {activeTab === 'users' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">Produtividade por Usuário</h2>
              <div className="text-sm text-gray-400">
                {report.userProductivity.length} usuários encontrados
              </div>
            </div>

            {report.userProductivity.length === 0 ? (
              <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-6 text-center">
                <Users className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-yellow-200 font-medium mb-2">Nenhum usuário encontrado</h3>
                <p className="text-yellow-300 text-sm">
                  Não há dados de usuários disponíveis no sistema.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {report.userProductivity.map((user) => (
                  <UserProductivityCard key={user.userId} user={user} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
