import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { ProductivityReport } from '@/shared/types';
import { FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface PDFReportGeneratorProps {
  report: ProductivityReport;
}

export default function PDFReportGenerator({ report }: PDFReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    try {
      setIsGenerating(true);

      // Criar elemento temporário para renderizar o relatório
      const reportElement = document.createElement('div');
      reportElement.style.position = 'absolute';
      reportElement.style.left = '-10000px';
      reportElement.style.top = '-10000px';
      reportElement.style.width = '800px'; // Largura fixa em pixels para melhor controle
      reportElement.style.backgroundColor = '#ffffff';
      reportElement.style.fontFamily = 'Arial, sans-serif';
      reportElement.style.padding = '40px';
      reportElement.style.boxSizing = 'border-box';
      reportElement.style.overflow = 'visible';
      reportElement.style.wordWrap = 'break-word';
      reportElement.style.hyphens = 'auto';
      
      // HTML do relatório
      reportElement.innerHTML = await generateReportHTML();
      
      document.body.appendChild(reportElement);

      // Aguardar renderização completa
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Gerar canvas a partir do HTML com configurações otimizadas
      const canvas = await html2canvas(reportElement, {
        scale: 1.5, // Reduzir escala para evitar cortes
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: reportElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        
        logging: false,
        removeContainer: false
      });

      // Criar PDF com margens adequadas
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 180; // Largura com margem (210 - 30mm de margem)
      const pageHeight = 257; // Altura com margem (297 - 40mm de margem)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 20; // Margem superior

      // Adicionar primeira página com margem
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.95), 
        'JPEG', 
        15, // Margem esquerda
        position, 
        imgWidth, 
        imgHeight
      );
      heightLeft -= pageHeight;

      // Adicionar páginas extras se necessário
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 20;
        pdf.addPage();
        pdf.addImage(
          canvas.toDataURL('image/jpeg', 0.95), 
          'JPEG', 
          15, 
          position, 
          imgWidth, 
          imgHeight
        );
        heightLeft -= pageHeight;
      }

      // Gerar nome do arquivo com data
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `SEAP_Relatorio_Produtividade_${dateStr}_${timeStr}.pdf`;

      // Fazer download
      pdf.save(fileName);

      // Limpar elemento temporário
      document.body.removeChild(reportElement);

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar relatório PDF. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateReportHTML = async (): Promise<string> => {
    const currentDate = new Date().toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Calcular estatísticas adicionais
    const totalUsers = report.userProductivity.length;
    const activeUsers = report.userProductivity.filter(u => u.totalDocuments > 0).length;
    const topPerformer = report.userProductivity.length > 0
      ? report.userProductivity.reduce((top, user) => 
          user.completedDocuments > top.completedDocuments ? user : top
        )
      : null;
    
    const avgCompletionRate = totalUsers > 0 
      ? report.userProductivity.reduce((acc, user) => acc + user.completionRate, 0) / totalUsers 
      : 0;

    return `
      <div style="font-family: 'Arial', sans-serif; color: #1f2937; line-height: 1.5; word-wrap: break-word; overflow-wrap: break-word; hyphens: auto; max-width: 100%;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; page-break-inside: avoid;">
          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold; word-break: keep-all;">📊 SEAP</h1>
            <h2 style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9; word-break: keep-all;">Sistema de Gestão de Documentos Judiciais</h2>
          </div>
          <h3 style="margin: 0; font-size: 20px; color: #374151; word-break: keep-all;">Relatório de Produtividade</h3>
          <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 12px;">Gerado em ${currentDate}</p>
        </div>

        <!-- Resumo Executivo -->
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #3b82f6; page-break-inside: avoid;">
          <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; word-break: keep-all;">📈 Resumo Executivo</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: space-between;">
            <div style="text-align: center; background: white; padding: 12px; border-radius: 6px; min-width: 140px; flex: 1; box-sizing: border-box;">
              <div style="font-size: 20px; font-weight: bold; color: #3b82f6; margin-bottom: 5px;">${report.totalDocuments}</div>
              <div style="font-size: 11px; color: #6b7280; word-break: keep-all;">Total de Documentos</div>
            </div>
            <div style="text-align: center; background: white; padding: 12px; border-radius: 6px; min-width: 140px; flex: 1; box-sizing: border-box;">
              <div style="font-size: 20px; font-weight: bold; color: #10b981; margin-bottom: 5px;">${report.completedDocuments}</div>
              <div style="font-size: 11px; color: #6b7280; word-break: keep-all;">Concluídos</div>
            </div>
            <div style="text-align: center; background: white; padding: 12px; border-radius: 6px; min-width: 140px; flex: 1; box-sizing: border-box;">
              <div style="font-size: 20px; font-weight: bold; color: #f59e0b; margin-bottom: 5px;">${report.inProgressDocuments}</div>
              <div style="font-size: 11px; color: #6b7280; word-break: keep-all;">Em Andamento</div>
            </div>
            <div style="text-align: center; background: white; padding: 12px; border-radius: 6px; min-width: 140px; flex: 1; box-sizing: border-box;">
              <div style="font-size: 20px; font-weight: bold; color: ${report.overdueDocuments > 0 ? '#ef4444' : '#10b981'}; margin-bottom: 5px;">${report.overdueDocuments}</div>
              <div style="font-size: 11px; color: #6b7280; word-break: keep-all;">Atrasados</div>
            </div>
          </div>
        </div>

        <!-- Indicadores de Performance -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e5e7eb; page-break-inside: avoid;">
          <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; word-break: keep-all;">🎯 Indicadores de Performance</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: space-between;">
            <div style="text-align: center; padding: 15px; background: #f0f9ff; border-radius: 6px; border: 1px solid #0ea5e9; min-width: 200px; flex: 1; box-sizing: border-box;">
              <div style="font-size: 22px; font-weight: bold; color: #0ea5e9; margin-bottom: 5px;">${report.completionRate.toFixed(1)}%</div>
              <div style="font-size: 12px; color: #0369a1; font-weight: 500; word-break: keep-all;">Taxa de Conclusão Geral</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #f0fdf4; border-radius: 6px; border: 1px solid #22c55e; min-width: 200px; flex: 1; box-sizing: border-box;">
              <div style="font-size: 22px; font-weight: bold; color: #22c55e; margin-bottom: 5px;">${activeUsers}</div>
              <div style="font-size: 12px; color: #166534; font-weight: 500; word-break: keep-all;">Usuários Ativos</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #fefce8; border-radius: 6px; border: 1px solid #eab308; min-width: 200px; flex: 1; box-sizing: border-box;">
              <div style="font-size: 22px; font-weight: bold; color: #eab308; margin-bottom: 5px;">${avgCompletionRate.toFixed(1)}%</div>
              <div style="font-size: 12px; color: #a16207; font-weight: 500; word-break: keep-all;">Taxa Média Individual</div>
            </div>
          </div>
        </div>

        <!-- Documentos por Tipo -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e5e7eb; page-break-inside: avoid;">
          <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; word-break: keep-all;">📋 Distribuição por Tipo de Documento</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: flex-start;">
            ${Object.entries(report.documentsByType).map(([type, count], index) => {
              const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
              const color = colors[index % colors.length];
              const displayName = type.charAt(0).toUpperCase() + type.slice(1);
              const percentage = report.totalDocuments > 0 ? ((count / report.totalDocuments) * 100).toFixed(1) : 0;
              
              return `
                <div style="text-align: center; padding: 12px; background: #f9fafb; border-radius: 6px; border-left: 3px solid ${color}; min-width: 150px; flex: 1; box-sizing: border-box; max-width: 200px;">
                  <div style="font-size: 18px; font-weight: bold; color: ${color}; margin-bottom: 4px;">${count}</div>
                  <div style="font-size: 11px; color: #374151; font-weight: 500; margin-bottom: 2px; word-break: keep-all; line-height: 1.3;">${displayName}</div>
                  <div style="font-size: 10px; color: #6b7280;">${percentage}% do total</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Ranking de Produtividade -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e5e7eb; page-break-inside: avoid;">
          <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; word-break: keep-all;">🏆 Ranking de Produtividade dos Servidores</h3>
          ${report.userProductivity
            .sort((a, b) => b.completedDocuments - a.completedDocuments)
            .slice(0, 10)
            .map((user, index) => {
              const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#3b82f6', '#3b82f6'];
              const bgColors = ['#fffbeb', '#f8fafc', '#fef7ed', '#f0f9ff', '#f0f9ff'];
              const color = rankColors[Math.min(index, 4)];
              const bgColor = bgColors[Math.min(index, 4)];
              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`;
              
              return `
                <div style="display: flex; align-items: center; padding: 12px; margin-bottom: 8px; background: ${bgColor}; border-radius: 6px; border-left: 3px solid ${color}; page-break-inside: avoid;">
                  <div style="font-size: 16px; font-weight: bold; color: ${color}; margin-right: 12px; min-width: 35px; text-align: center;">${medal}</div>
                  <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: bold; color: #1f2937; margin-bottom: 2px; font-size: 13px; word-wrap: break-word; overflow-wrap: break-word;">${user.userName}</div>
                    <div style="font-size: 10px; color: #6b7280; line-height: 1.3;">
                      ${user.completedDocuments} concluídos • ${user.totalDocuments} total • ${user.completionRate.toFixed(1)}% taxa
                    </div>
                  </div>
                  <div style="text-align: right; margin-left: 10px;">
                    <div style="font-size: 14px; font-weight: bold; color: #10b981;">${user.completedDocuments}</div>
                    <div style="font-size: 9px; color: #6b7280; word-break: keep-all;">documentos</div>
                  </div>
                </div>
              `;
            }).join('')}
          ${report.userProductivity.length === 0 ? '<p style="text-align: center; color: #6b7280; font-style: italic; font-size: 12px;">Nenhum dado de produtividade disponível</p>' : ''}
        </div>

        <!-- Análise Detalhada -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e5e7eb; page-break-inside: avoid;">
          <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; word-break: keep-all;">📊 Análise Detalhada</h3>
          
          ${topPerformer ? `
            <div style="background: #ecfdf5; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-left: 3px solid #10b981; page-break-inside: avoid;">
              <h4 style="margin: 0 0 8px 0; color: #065f46; font-size: 14px; word-break: keep-all;">🌟 Maior Produtividade</h4>
              <p style="margin: 0; color: #047857; font-size: 11px; line-height: 1.4; word-wrap: break-word; overflow-wrap: break-word;">
                <strong>${topPerformer.userName}</strong> lidera com <strong>${topPerformer.completedDocuments} documentos concluídos</strong> 
                e taxa de conclusão de <strong>${topPerformer.completionRate.toFixed(1)}%</strong>.
              </p>
            </div>
          ` : ''}

          <div style="display: flex; flex-wrap: wrap; gap: 15px;">
            <div style="background: #f8fafc; padding: 15px; border-radius: 6px; flex: 1; min-width: 250px; box-sizing: border-box; page-break-inside: avoid;">
              <h4 style="margin: 0 0 12px 0; color: #1f2937; font-size: 14px; word-break: keep-all;">📈 Tendências Positivas</h4>
              <ul style="margin: 0; padding-left: 15px; color: #374151; font-size: 11px; line-height: 1.4;">
                <li style="margin-bottom: 6px; word-wrap: break-word;">Taxa de conclusão geral: ${report.completionRate.toFixed(1)}%</li>
                <li style="margin-bottom: 6px; word-wrap: break-word;">Usuários ativos no sistema: ${activeUsers}</li>
                <li style="margin-bottom: 6px; word-wrap: break-word;">Documentos processados: ${report.totalDocuments}</li>
                ${report.overdueDocuments === 0 ? '<li style="color: #10b981; font-weight: 500; word-wrap: break-word;">✅ Sem documentos atrasados!</li>' : ''}
              </ul>
            </div>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 6px; flex: 1; min-width: 250px; box-sizing: border-box; page-break-inside: avoid;">
              <h4 style="margin: 0 0 12px 0; color: #1f2937; font-size: 14px; word-break: keep-all;">⚠️ Pontos de Atenção</h4>
              <ul style="margin: 0; padding-left: 15px; color: #374151; font-size: 11px; line-height: 1.4;">
                ${report.overdueDocuments > 0 ? `<li style="margin-bottom: 6px; color: #ef4444; font-weight: 500; word-wrap: break-word;">${report.overdueDocuments} documento(s) atrasado(s)</li>` : ''}
                <li style="margin-bottom: 6px; word-wrap: break-word;">Documentos em andamento: ${report.inProgressDocuments}</li>
                <li style="margin-bottom: 6px; word-wrap: break-word;">Taxa média individual: ${avgCompletionRate.toFixed(1)}%</li>
                ${Object.keys(report.documentsByType).length === 0 ? '<li style="color: #f59e0b; word-wrap: break-word;">⚠️ Nenhum tipo de documento cadastrado</li>' : ''}
              </ul>
            </div>
          </div>
        </div>

        <!-- Tendências Temporais -->
        ${report.monthlyTrends && report.monthlyTrends.length > 0 ? `
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e5e7eb; page-break-inside: avoid;">
            <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; word-break: keep-all;">📅 Tendências dos Últimos Meses</h3>
            <div style="overflow: visible; width: 100%;">
              <table style="width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed;">
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600; width: 20%; word-break: keep-all;">Período</th>
                    <th style="padding: 8px; text-align: center; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600; width: 20%; word-break: keep-all;">Total</th>
                    <th style="padding: 8px; text-align: center; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600; width: 20%; word-break: keep-all;">Concluídos</th>
                    <th style="padding: 8px; text-align: center; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600; width: 20%; word-break: keep-all;">Em Andamento</th>
                    <th style="padding: 8px; text-align: center; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600; width: 20%; word-break: keep-all;">Taxa (%)</th>
                  </tr>
                </thead>
                <tbody>
                  ${report.monthlyTrends.slice(-6).map((month, index) => {
                    const rate = month.total > 0 ? ((month.concluidos / month.total) * 100).toFixed(1) : '0.0';
                    const isEven = index % 2 === 0;
                    return `
                      <tr style="background: ${isEven ? '#ffffff' : '#f9fafb'}; page-break-inside: avoid;">
                        <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-weight: 500; word-break: keep-all;">${month.period}</td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #f3f4f6; color: #3b82f6; font-weight: 600;">${month.total}</td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #f3f4f6; color: #10b981; font-weight: 600;">${month.concluidos}</td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #f3f4f6; color: #f59e0b; font-weight: 600;">${month.emAndamento}</td>
                        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: ${parseFloat(rate) >= 70 ? '#10b981' : parseFloat(rate) >= 50 ? '#f59e0b' : '#ef4444'};">${rate}%</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 10px; page-break-inside: avoid;">
          <p style="margin: 0 0 4px 0; word-break: keep-all;">SEAP - Sistema de Gestão de Documentos Judiciais</p>
          <p style="margin: 0; word-break: keep-all;">Relatório gerado automaticamente em ${currentDate}</p>
          <div style="margin-top: 8px; font-size: 9px; color: #9ca3af; line-height: 1.3; word-wrap: break-word;">
            Este relatório contém informações confidenciais do sistema SEAP
          </div>
        </div>
      </div>
    `;
  };

  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating}
      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Gerando PDF...</span>
        </>
      ) : (
        <>
          <FileDown className="w-5 h-5" />
          <span>Gerar Relatório PDF</span>
        </>
      )}
    </button>
  );
}
