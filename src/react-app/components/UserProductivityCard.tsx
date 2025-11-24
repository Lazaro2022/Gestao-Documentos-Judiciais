import { User } from 'lucide-react';

interface UserProductivityData {
  userId: number;
  userName: string;
  totalDocuments: number;
  completedDocuments: number;
  inProgressDocuments: number;
  overdueDocuments: number;
  completionRate: number;
  documentsByType: Record<string, number>;
}

interface UserProductivityCardProps {
  user: UserProductivityData;
}

export default function UserProductivityCard({ user }: UserProductivityCardProps) {
  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-100';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressBarColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{user.userName}</h3>
            <p className="text-sm text-gray-400">ID: {user.userId}</p>
          </div>
        </div>
        <div className={`
          px-3 py-1 rounded-full text-sm font-medium
          ${getCompletionRateColor(user.completionRate)}
        `}>
          {user.completionRate.toFixed(1)}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-300 mb-2">
          <span>Taxa de Conclusão</span>
          <span>{user.completedDocuments}/{user.totalDocuments}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(user.completionRate)}`}
            style={{ width: `${user.completionRate}%` }}
          />
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{user.totalDocuments}</div>
          <div className="text-xs text-blue-800">Total</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{user.completedDocuments}</div>
          <div className="text-xs text-green-800">Concluídos + Arquivados</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{user.inProgressDocuments}</div>
          <div className="text-xs text-yellow-800">Em Andamento</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{user.overdueDocuments}</div>
          <div className="text-xs text-red-800">Atrasados</div>
        </div>
      </div>

      {/* Document Types */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">Documentos por Tipo</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(user.documentsByType).map(([type, count]) => (
            <div key={type} className="flex justify-between">
              <span className="text-gray-400 capitalize">{type}:</span>
              <span className="font-medium text-white">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
