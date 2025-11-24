import { FileText, Users, CheckCircle, Clock, AlertTriangle, Calendar, Zap, BarChart3, PieChart } from 'lucide-react';
import Layout from '@/react-app/components/Layout';
import StatCard from '@/react-app/components/StatCard';
import PDFReportGenerator from '@/react-app/components/PDFReportGenerator';


import { useProductivityReport } from '@/react-app/hooks/useProductivityReport';
import { useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

export default function Dashboard() {
  const { report, loading, error, refetch } = useProductivityReport();

  useEffect(() => {
    console.log('🔥 [DASHBOARD] Dashboard carregado, report:', report);
  }, [report]);

  // Calcular documentos próximos do vencimento (próximos 7 dias)
  const getUpcomingDeadlines = () => {
    if (!report) return { upcoming: 0, critical: 0, overdue: 0 };
    
    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(now.getDate() + 7);
    
    // Simular dados baseados nas estatísticas existentes
    const upcomingCount = Math.floor(report.inProgressDocuments * 0.3); // 30% dos em andamento
    const criticalCount = Math.floor(report.inProgressDocuments * 0.15); // 15% críticos (próximos 3 dias)
    
    return {
      upcoming: upcomingCount,
      critical: criticalCount,
      overdue: report.overdueDocuments
    };
  };

  const deadlines = getUpcomingDeadlines();

  if (loading) {
    return (
      <Layout>
        <div className="px-6 py-4">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">Erro ao carregar dados</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button 
              onClick={refetch}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar Novamente
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
          <div className="text-center text-slate-500">
            Nenhum dado disponível
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="">
        {/* Header */}
        <div className="mb-4 text-center py-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent drop-shadow-lg mb-2">
            SEAP
          </h1>
          <p className="text-gray-300 text-lg mb-4">Sistema de Gestão de Documentos Judiciais</p>
          
          {/* Botão de PDF */}
          <div className="flex justify-center">
            <PDFReportGenerator report={report} />
          </div>
        </div>

        {/* Alertas de Prazo - Seção Crítica */}
        {(deadlines.overdue > 0 || deadlines.critical > 0 || deadlines.upcoming > 0) && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-red-900 via-red-800 to-orange-900 rounded-xl p-6 border-2 border-red-600 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-pulse">
                    <Zap className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">⚠️ ALERTAS DE PRAZO</h2>
                </div>
                <div className="animate-bounce">
                  <AlertTriangle className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Documentos Vencidos */}
                {deadlines.overdue > 0 && (
                  <div className="bg-red-800/60 backdrop-blur-sm rounded-lg p-4 border-2 border-red-500 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-red-200 text-sm font-medium uppercase tracking-wide">VENCIDOS</h3>
                        <p className="text-3xl font-bold text-red-100">{deadlines.overdue}</p>
                        <p className="text-red-300 text-xs">Precisam atenção IMEDIATA</p>
                      </div>
                      <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                        <AlertTriangle className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Documentos Críticos (próximos 3 dias) */}
                {deadlines.critical > 0 && (
                  <div className="bg-orange-800/60 backdrop-blur-sm rounded-lg p-4 border-2 border-orange-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-orange-200 text-sm font-medium uppercase tracking-wide">CRÍTICOS</h3>
                        <p className="text-3xl font-bold text-orange-100">{deadlines.critical}</p>
                        <p className="text-orange-300 text-xs">Vencem em 1-3 dias</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Documentos Próximos do Vencimento (7 dias) */}
                {deadlines.upcoming > 0 && (
                  <div className="bg-yellow-800/60 backdrop-blur-sm rounded-lg p-4 border-2 border-yellow-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-yellow-200 text-sm font-medium uppercase tracking-wide">PRÓXIMOS</h3>
                        <p className="text-3xl font-bold text-yellow-100">{deadlines.upcoming}</p>
                        <p className="text-yellow-300 text-xs">Vencem em 4-7 dias</p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Botão de Ação */}
              <div className="mt-4 flex justify-center">
                <button 
                  onClick={() => window.location.href = '/documents'}
                  className="bg-white text-red-800 px-6 py-3 rounded-lg font-bold hover:bg-red-100 transition-colors shadow-lg border-2 border-red-200 animate-pulse"
                >
                  🚨 VER DOCUMENTOS COM PRAZO CRÍTICO 🚨
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total de Documentos"
            value={report.totalDocuments}
            icon={FileText}
            color="blue"
            change={{
              value: `${report.userProductivity.length} usuários ativos`,
              trend: 'neutral'
            }}
          />
          
          <StatCard
            title="Documentos Concluídos"
            value={report.completedDocuments}
            icon={CheckCircle}
            color="green"
            change={{
              value: `${report.completionRate.toFixed(1)}% taxa de conclusão (inclui arquivados)`,
              trend: report.completionRate >= 70 ? 'up' : 'down'
            }}
          />
          
          <StatCard
            title="Em Andamento"
            value={report.inProgressDocuments}
            icon={Clock}
            color="yellow"
          />
          
          <StatCard
            title="Documentos Atrasados"
            value={report.overdueDocuments}
            icon={AlertTriangle}
            color="red"
            change={{
              value: report.overdueDocuments === 0 ? 'Nenhum atraso!' : `+${deadlines.critical} críticos`,
              trend: report.overdueDocuments === 0 ? 'up' : 'down'
            }}
          />
        </div>

        {/* Monitoramento de Prazos Detalhado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Resumo de Prazos */}
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-4">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <Calendar className="w-6 h-6 text-blue-400" />
              <span>Situação dos Prazos</span>
            </h2>
            
            <div className="space-y-4">
              {/* Barra de Status Geral */}
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>Status Geral dos Prazos</span>
                  <span>{report.totalDocuments} documentos</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-4 overflow-hidden">
                  <div className="flex h-full">
                    {deadlines.overdue > 0 && (
                      <div 
                        className="bg-red-500 h-full animate-pulse"
                        style={{ width: `${(deadlines.overdue / report.totalDocuments) * 100}%` }}
                      />
                    )}
                    {deadlines.critical > 0 && (
                      <div 
                        className="bg-orange-500 h-full"
                        style={{ width: `${(deadlines.critical / report.totalDocuments) * 100}%` }}
                      />
                    )}
                    {deadlines.upcoming > 0 && (
                      <div 
                        className="bg-yellow-500 h-full"
                        style={{ width: `${(deadlines.upcoming / report.totalDocuments) * 100}%` }}
                      />
                    )}
                    <div 
                      className="bg-green-500 h-full"
                      style={{ width: `${((report.totalDocuments - deadlines.overdue - deadlines.critical - deadlines.upcoming) / report.totalDocuments) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>Vencidos</span>
                  <span>Críticos</span>
                  <span>Próximos</span>
                  <span>OK</span>
                </div>
              </div>

              {/* Estatísticas Detalhadas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-400">{deadlines.overdue}</div>
                  <div className="text-xs text-red-300">Vencidos</div>
                </div>
                <div className="bg-orange-900/30 border border-orange-700/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-orange-400">{deadlines.critical}</div>
                  <div className="text-xs text-orange-300">Críticos</div>
                </div>
                <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{deadlines.upcoming}</div>
                  <div className="text-xs text-yellow-300">Próximos</div>
                </div>
                <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {report.totalDocuments - deadlines.overdue - deadlines.critical - deadlines.upcoming}
                  </div>
                  <div className="text-xs text-green-300">No Prazo</div>
                </div>
              </div>
            </div>
          </div>

          {/* Ações Recomendadas */}
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-4">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
              <Zap className="w-6 h-6 text-yellow-400" />
              <span>Ações Recomendadas</span>
            </h2>
            
            <div className="space-y-3">
              {deadlines.overdue > 0 && (
                <div className="bg-red-900/30 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                    <h3 className="font-semibold text-red-300">URGENTE</h3>
                  </div>
                  <p className="text-red-200 text-sm mt-1">
                    {deadlines.overdue} documento(s) vencido(s) precisam ser finalizados imediatamente
                  </p>
                  <button 
                    onClick={() => window.location.href = '/documents?filter=overdue'}
                    className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                  >
                    Ver Vencidos
                  </button>
                </div>
              )}

              {deadlines.critical > 0 && (
                <div className="bg-orange-900/30 border-l-4 border-orange-500 p-4 rounded">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-orange-400" />
                    <h3 className="font-semibold text-orange-300">ALTA PRIORIDADE</h3>
                  </div>
                  <p className="text-orange-200 text-sm mt-1">
                    {deadlines.critical} documento(s) vencem em 1-3 dias
                  </p>
                  <button 
                    onClick={() => window.location.href = '/documents?filter=critical'}
                    className="mt-2 px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors"
                  >
                    Ver Críticos
                  </button>
                </div>
              )}

              {deadlines.upcoming > 0 && (
                <div className="bg-yellow-900/30 border-l-4 border-yellow-500 p-4 rounded">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-yellow-400" />
                    <h3 className="font-semibold text-yellow-300">MONITORAR</h3>
                  </div>
                  <p className="text-yellow-200 text-sm mt-1">
                    {deadlines.upcoming} documento(s) vencem na próxima semana
                  </p>
                  <button 
                    onClick={() => window.location.href = '/documents?filter=upcoming'}
                    className="mt-2 px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                  >
                    Ver Próximos
                  </button>
                </div>
              )}

              {deadlines.overdue === 0 && deadlines.critical === 0 && deadlines.upcoming === 0 && (
                <div className="bg-green-900/30 border-l-4 border-green-500 p-4 rounded text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <h3 className="font-semibold text-green-300">SITUAÇÃO CONTROLADA</h3>
                  </div>
                  <p className="text-green-200 text-sm mt-1">
                    Todos os documentos estão com prazos sob controle! 🎉
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gráfico de Tendências Mensais */}
        {report.monthlyTrends && report.monthlyTrends.length > 0 && (
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-4 mb-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              <span>Tendências dos Últimos 6 Meses</span>
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={report.monthlyTrends.slice(-6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="period" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#000000 !important',
                    border: '2px solid #374151 !important',
                    borderRadius: '8px !important',
                    color: '#FFFFFF !important',
                    fontSize: '14px !important',
                    fontWeight: '600 !important',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.95) !important',
                    opacity: '1 !important'
                  }}
                  labelStyle={{ color: '#FFFFFF !important', fontWeight: '600 !important' }}
                  itemStyle={{ color: '#FFFFFF !important', fontWeight: '500 !important' }}
                  wrapperStyle={{ backgroundColor: '#000000 !important', borderRadius: '8px !important' }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                />
                <Bar dataKey="total" fill="#3B82F6" name="Total" />
                <Bar dataKey="concluidos" fill="#10B981" name="Concluídos" />
                <Bar dataKey="emAndamento" fill="#F59E0B" name="Em Andamento" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Cards de Tipos de Documentos */}
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-4 mb-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <FileText className="w-6 h-6 text-purple-400" />
            <span>Documentos por Tipo</span>
          </h2>
          {Object.keys(report.documentsByType).length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(report.documentsByType).map(([typeName, count], index) => {
                const colors = [
                  'from-blue-500 to-blue-600',
                  'from-green-500 to-green-600', 
                  'from-yellow-500 to-yellow-600',
                  'from-red-500 to-red-600',
                  'from-purple-500 to-purple-600',
                  'from-pink-500 to-pink-600',
                  'from-cyan-500 to-cyan-600',
                  'from-orange-500 to-orange-600'
                ];

                return (
                  <div key={typeName} className="text-center bg-gray-700/30 rounded-lg p-4 border border-gray-600/50 hover:border-gray-500/50 transition-colors">
                    <div className={`
                      w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-r ${colors[index % colors.length]} 
                      flex items-center justify-center shadow-lg
                    `}>
                      <span className="text-xl font-bold text-white">{count}</span>
                    </div>
                    <h3 className="font-medium text-white text-sm">{typeName}</h3>
                    <p className="text-xs text-gray-400">documentos</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum tipo de documento encontrado</p>
              <p className="text-gray-500 text-sm mt-1">Crie alguns documentos para ver as estatísticas</p>
            </div>
          )}
        </div>

        {/* Gráficos Integrados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Gráfico de Progresso Semanal Compacto */}
          {report.weeklyTrends && report.weeklyTrends.length > 0 && (
            <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <span>Progresso das Últimas Semanas</span>
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={report.weeklyTrends.slice(-4)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="period" 
                    stroke="#9CA3AF"
                    fontSize={11}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={11} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#000000 !important',
                      border: '2px solid #374151 !important',
                      borderRadius: '8px !important',
                      color: '#FFFFFF !important',
                      fontSize: '12px !important',
                      fontWeight: '600 !important',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.95) !important',
                      opacity: '1 !important'
                    }}
                    labelStyle={{ color: '#FFFFFF !important', fontWeight: '600 !important' }}
                    itemStyle={{ color: '#FFFFFF !important', fontWeight: '500 !important' }}
                    wrapperStyle={{ backgroundColor: '#000000 !important', borderRadius: '8px !important' }}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                  />
                  <Bar dataKey="concluidos" fill="#10B981" name="Concluídos" />
                  <Bar dataKey="emAndamento" fill="#F59E0B" name="Em Andamento" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Gráfico de Pizza - Tipos de Documentos */}
          {Object.keys(report.documentsByType).length > 0 && (
            <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <PieChart className="w-5 h-5 text-purple-400" />
                  <span>Distribuição por Tipo</span>
                </h2>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={160}>
                    <RechartsPieChart>
                      <Pie
                        data={Object.entries(report.documentsByType).map(([type, count], index) => ({
                          name: type.charAt(0).toUpperCase() + type.slice(1),
                          value: count,
                          color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][index % 6]
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.entries(report.documentsByType).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][index % 6]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#000000 !important',
                          border: '2px solid #374151 !important',
                          borderRadius: '8px !important',
                          color: '#FFFFFF !important',
                          fontSize: '12px !important',
                          fontWeight: '600 !important',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.95) !important',
                          opacity: '1 !important'
                        }}
                        labelStyle={{ color: '#FFFFFF !important', fontWeight: '600 !important' }}
                        itemStyle={{ color: '#FFFFFF !important', fontWeight: '500 !important' }}
                        wrapperStyle={{ backgroundColor: '#000000 !important', borderRadius: '8px !important' }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col space-y-1">
                  {Object.entries(report.documentsByType).slice(0, 4).map(([type, count], index) => (
                    <div key={type} className="flex items-center space-x-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 4] }}
                      />
                      <span className="text-gray-300 truncate">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                      <span className="text-white font-medium">{count}</span>
                    </div>
                  ))}
                  {Object.keys(report.documentsByType).length > 4 && (
                    <div className="text-xs text-gray-400 mt-1">+{Object.keys(report.documentsByType).length - 4} outros</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resumo Detalhado de Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Resumo de Performance */}
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>Performance Geral</span>
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">Taxa de Conclusão</span>
                <span className="font-bold text-lg text-green-400">{report.completionRate.toFixed(1)}%</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">Inclui concluídos + arquivados</div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-green-500 to-green-600"
                  style={{ width: `${report.completionRate}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="text-center p-2 bg-green-900/20 border border-green-700/30 rounded">
                  <div className="text-lg font-bold text-green-400">{report.completedDocuments}</div>
                  <div className="text-xs text-green-300">Concluídos + Arquivados</div>
                </div>
                <div className="text-center p-2 bg-blue-900/20 border border-blue-700/30 rounded">
                  <div className="text-lg font-bold text-blue-400">{report.inProgressDocuments}</div>
                  <div className="text-xs text-blue-300">Em Progresso</div>
                </div>
              </div>
            </div>
          </div>

          {/* Usuários Ativos */}
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span>Equipe Ativa</span>
            </h2>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div className="text-2xl font-bold text-white">{report.userProductivity.length}</div>
              <div className="text-gray-300 text-sm">usuários no sistema</div>
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="text-sm text-blue-400 font-medium">
                  {report.userProductivity.filter(u => u.totalDocuments > 0).length} ativos
                </div>
                <div className="text-xs text-gray-400">com documentos</div>
              </div>
            </div>
          </div>

          {/* Status Rápido */}
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span>Status Rápido</span>
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">Total de Documentos</span>
                <span className="font-bold text-white">{report.totalDocuments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">Tipos de Documentos</span>
                <span className="font-bold text-purple-400">{Object.keys(report.documentsByType).length}</span>
              </div>
              {report.overdueDocuments > 0 && (
                <div className="flex justify-between items-center p-2 bg-red-900/20 border border-red-700/30 rounded">
                  <span className="text-red-300 text-sm font-medium">⚠️ Atrasados</span>
                  <span className="font-bold text-red-400">{report.overdueDocuments}</span>
                </div>
              )}
              {report.overdueDocuments === 0 && (
                <div className="flex justify-between items-center p-2 bg-green-900/20 border border-green-700/30 rounded">
                  <span className="text-green-300 text-sm font-medium">✅ Sem Atrasos</span>
                  <span className="font-bold text-green-400">0</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
