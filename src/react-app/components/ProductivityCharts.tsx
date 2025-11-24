import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ChartData } from '@/shared/types';

interface ChartProps {
  data: ChartData[];
  title: string;
}

// Componente para gráfico semanal
export function WeeklyChart({ data, title }: ChartProps) {
  return (
    <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
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
          <Legend />
          <Area 
            type="monotone" 
            dataKey="concluidos" 
            stackId="1"
            stroke="#10B981" 
            fill="#10B981"
            name="Concluídos"
          />
          <Area 
            type="monotone" 
            dataKey="emAndamento" 
            stackId="1"
            stroke="#F59E0B" 
            fill="#F59E0B"
            name="Em Andamento"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Componente para gráfico mensal
export function MonthlyChart({ data, title }: ChartProps) {
  return (
    <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
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
          <Legend />
          <Bar dataKey="total" fill="#3B82F6" name="Total" />
          <Bar dataKey="concluidos" fill="#10B981" name="Concluídos" />
          <Bar dataKey="emAndamento" fill="#F59E0B" name="Em Andamento" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Componente para gráfico anual
export function AnnualChart({ data, title }: ChartProps) {
  return (
    <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
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
              opacity: '0.95 !important'
            }}
            labelStyle={{ color: '#FFFFFF !important', fontWeight: '600 !important' }}
            itemStyle={{ color: '#FFFFFF !important', fontWeight: '500 !important' }}
            wrapperStyle={{ backgroundColor: '#000000 !important', borderRadius: '8px !important' }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="total" 
            stroke="#3B82F6" 
            strokeWidth={3}
            name="Total"
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="concluidos" 
            stroke="#10B981" 
            strokeWidth={3}
            name="Concluídos"
            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="emAndamento" 
            stroke="#F59E0B" 
            strokeWidth={3}
            name="Em Andamento"
            dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Componente para gráfico de tipos de documentos
export function DocumentTypesChart({ data, title }: ChartProps & { data: ChartData[] }) {
  // Cores para os diferentes tipos de documentos
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'
  ];

  // Extrair dados dinâmicos dos tipos de documentos de TODOS os períodos
  const pieData: Array<{ name: string; value: number; color: string }> = [];
  let colorIndex = 0;
  
  // Consolidar dados de tipos de todos os períodos
  const consolidatedTypes: Record<string, number> = {};
  
  data.forEach(periodData => {
    Object.keys(periodData).forEach(key => {
      // Pular campos padrão do ChartData
      if (!['period', 'total', 'concluidos', 'emAndamento', 'date'].includes(key)) {
        const value = Number(periodData[key as keyof typeof periodData]) || 0;
        if (value > 0) {
          consolidatedTypes[key] = (consolidatedTypes[key] || 0) + value;
        }
      }
    });
  });

  // Criar dados para o gráfico usando os nomes originais dos tipos
  Object.entries(consolidatedTypes).forEach(([key, value]) => {
    if (value > 0) {
      pieData.push({
        name: key, // Usar o nome original do tipo sem modificações
        value: value,
        color: colors[colorIndex % colors.length]
      });
      colorIndex++;
    }
  });

  // Debug - log dos dados encontrados
  console.log('🔥 [DocumentTypesChart] Dados consolidados:', consolidatedTypes);
  console.log('🔥 [DocumentTypesChart] Dados para o gráfico:', pieData);
  console.log('🔥 [DocumentTypesChart] Dados recebidos:', data);

  // Se não há dados, mostrar mensagem
  if (pieData.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-400 mb-2">📊</div>
            <p className="text-gray-400 text-sm">Nenhum tipo de documento encontrado</p>
            <p className="text-gray-500 text-xs mt-1">Crie alguns documentos para ver a distribuição</p>
            <div className="mt-4 text-xs text-gray-600">
              <p>Debug: Dados recebidos: {data.length} períodos</p>
              <p>Campos encontrados: {data.length > 0 ? Object.keys(data[0]).join(', ') : 'nenhum'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Gráfico de Pizza */}
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(Number(percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#000000 !important',
                  border: '2px solid #374151 !important',
                  borderRadius: '8px !important',
                  color: '#FFFFFF !important',
                  fontSize: '14px !important',
                  fontWeight: '600 !important',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.95) !important',
                  opacity: '0.95 !important'
                }}
                labelStyle={{ color: '#FFFFFF !important', fontWeight: '600 !important' }}
                itemStyle={{ color: '#FFFFFF !important', fontWeight: '500 !important' }}
                wrapperStyle={{ backgroundColor: '#000000 !important', borderRadius: '8px !important' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legenda Lateral */}
        <div className="flex flex-col space-y-2 lg:w-48">
          {pieData.map((entry, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <div className="flex-1">
                <div className="text-white text-sm font-medium">{entry.name}</div>
                <div className="text-gray-400 text-xs">{entry.value} documentos</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Componente para comparação de períodos
export function ComparisonChart({ weeklyData, monthlyData, annualData }: {
  weeklyData: ChartData[];
  monthlyData: ChartData[];
  annualData: ChartData[];
}) {
  // Verificar se os dados existem e não estão vazios
  const hasWeeklyData = weeklyData && weeklyData.length > 0;
  const hasMonthlyData = monthlyData && monthlyData.length > 0;
  const hasAnnualData = annualData && annualData.length > 0;

  // Se não há dados suficientes, mostrar mensagem
  if (!hasWeeklyData && !hasMonthlyData && !hasAnnualData) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Comparação de Períodos</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-400 mb-2">📊</div>
            <p className="text-gray-400 text-sm">Nenhum dado disponível para comparação</p>
            <p className="text-gray-500 text-xs mt-1">Crie alguns documentos para ver as estatísticas</p>
          </div>
        </div>
      </div>
    );
  }

  // Calcular totais acumulados para análise (não usar dados específicos do último período)

  // Calcular totais acumulados para os períodos disponíveis
  const weekTotal = hasWeeklyData ? weeklyData.reduce((acc, week) => acc + (week.total || 0), 0) : 0;
  const monthTotal = hasMonthlyData ? monthlyData.reduce((acc, month) => acc + (month.total || 0), 0) : 0;
  const yearTotal = hasAnnualData ? annualData.reduce((acc, year) => acc + (year.total || 0), 0) : 0;

  const weekCompleted = hasWeeklyData ? weeklyData.reduce((acc, week) => acc + (week.concluidos || 0), 0) : 0;
  const monthCompleted = hasMonthlyData ? monthlyData.reduce((acc, month) => acc + (month.concluidos || 0), 0) : 0;
  const yearCompleted = hasAnnualData ? annualData.reduce((acc, year) => acc + (year.concluidos || 0), 0) : 0;

  const weekInProgress = hasWeeklyData ? weeklyData.reduce((acc, week) => acc + (week.emAndamento || 0), 0) : 0;
  const monthInProgress = hasMonthlyData ? monthlyData.reduce((acc, month) => acc + (month.emAndamento || 0), 0) : 0;
  const yearInProgress = hasAnnualData ? annualData.reduce((acc, year) => acc + (year.emAndamento || 0), 0) : 0;

  const comparisonData = [];

  // Adicionar dados de acordo com o que está disponível
  if (hasWeeklyData) {
    comparisonData.push({
      periodo: 'Últimas 8 Semanas',
      total: weekTotal,
      concluidos: weekCompleted,
      emAndamento: weekInProgress,
    });
  }

  if (hasMonthlyData) {
    comparisonData.push({
      periodo: 'Últimos 12 Meses',
      total: monthTotal,
      concluidos: monthCompleted,
      emAndamento: monthInProgress,
    });
  }

  if (hasAnnualData) {
    comparisonData.push({
      periodo: 'Últimos 3 Anos',
      total: yearTotal,
      concluidos: yearCompleted,
      emAndamento: yearInProgress,
    });
  }

  // Se não há dados para mostrar
  if (comparisonData.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Comparação de Períodos</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-400 mb-2">📊</div>
            <p className="text-gray-400 text-sm">Dados insuficientes para comparação</p>
            <p className="text-gray-500 text-xs mt-1">Aguardando dados dos períodos</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Comparação de Períodos</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={comparisonData} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
          <YAxis 
            type="category" 
            dataKey="periodo" 
            stroke="#9CA3AF" 
            fontSize={12}
            width={100}
          />
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
          <Legend />
          <Bar dataKey="total" fill="#3B82F6" name="Total" />
          <Bar dataKey="concluidos" fill="#10B981" name="Concluídos" />
          <Bar dataKey="emAndamento" fill="#F59E0B" name="Em Andamento" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
