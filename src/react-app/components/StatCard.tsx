import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  color = 'blue' 
}: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
  };

  const changeColorClasses = {
    up: 'text-green-400 bg-green-900/30 border border-green-700/50',
    down: 'text-red-400 bg-red-900/30 border border-red-700/50',
    neutral: 'text-gray-400 bg-gray-800/50 border border-gray-700/50',
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-300 text-sm font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-white mb-2">{value}</p>
          {change && (
            <div className={`
              inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium
              ${changeColorClasses[change.trend]}
            `}>
              {change.value}
            </div>
          )}
        </div>
        <div className={`
          w-12 h-12 rounded-lg bg-gradient-to-r ${colorClasses[color]} 
          flex items-center justify-center shadow-lg
        `}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
