import { useState, useEffect } from 'react';
import { ProductivityReport } from '@/shared/types';

export function useProductivityReport() {
  const [report, setReport] = useState<ProductivityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔥 [FRONTEND] Buscando relatório de produtividade...');
      
      const response = await fetch('/api/reports/productivity');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔥 [FRONTEND] Relatório recebido:', data);
      console.log(`🔥 [FRONTEND] Total de usuários no relatório: ${data.userProductivity?.length || 0}`);
      
      setReport(data);
    } catch (err) {
      console.error('🔥 [FRONTEND] Error fetching productivity report:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return {
    report,
    loading,
    error,
    refetch: fetchReport,
  };
}
