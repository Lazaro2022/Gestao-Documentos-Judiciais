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
      reportElement.style.width = '800px'; // Optimal width for A4
      reportElement.style.backgroundColor = '#ffffff';
      reportElement.style.fontFamily = 'Arial, sans-serif';
      reportElement.style.padding = '40px'; // Balanced padding
      reportElement.style.boxSizing = 'border-box';
      reportElement.style.overflow = 'visible';
      reportElement.style.overflowWrap = 'break-word'; // Modern property
      reportElement.style.hyphens = 'auto';
      
      // HTML do relatório
      reportElement.innerHTML = await generateReportHTML();
      
      document.body.appendChild(reportElement);

      // Aguardar renderização completa
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Gerar canvas a partir do HTML com configurações otimizadas
      const canvas = await html2canvas(reportElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: reportElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 800,
        windowHeight: reportElement.scrollHeight,
        logging: false,
        removeContainer: false,
        imageTimeout: 0
      });

      // Criar PDF com slicing do canvas para múltiplas páginas
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;
      const marginX = 10; // margem lateral
      const marginTop = 15; // margem superior maior
      const marginBottom = 20; // margem inferior maior (segurança)

      const usableWidth = pdfWidth - (marginX * 2); // 190mm
      const usableHeight = pdfHeight - marginTop - marginBottom; // 262mm (com margem de segurança)

      // Calcular proporções
      const ratio = canvas.width / usableWidth;
      const canvasPageHeight = usableHeight * ratio; // altura do canvas por página

      // Margem de segurança no canvas (evitar corte no limite)
      const safetyMargin = 20 * ratio; // 20mm de segurança convertido para pixels do canvas
      const effectiveCanvasPageHeight = canvasPageHeight - safetyMargin;

      const totalPages = Math.ceil(canvas.height / effectiveCanvasPageHeight);

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }

        // Criar canvas temporário para esta página
        const pageCanvas = document.createElement('canvas');
        const pageCtx = pageCanvas.getContext('2d');

        if (!pageCtx) continue;

        // Definir tamanho do canvas da página
        pageCanvas.width = canvas.width;
        const startY = page * effectiveCanvasPageHeight;
        const remainingHeight = canvas.height - startY;
        pageCanvas.height = Math.min(effectiveCanvasPageHeight, remainingHeight);

        // Preencher fundo branco
        pageCtx.fillStyle = '#ffffff';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        // Copiar a porção do canvas original
        pageCtx.drawImage(
          canvas,
          0, startY, canvas.width, pageCanvas.height,
          0, 0, canvas.width, pageCanvas.height
        );

        // Calcular altura proporcional para o PDF
        const pageImgHeight = (pageCanvas.height / canvas.width) * usableWidth;

        // Adicionar ao PDF
        pdf.addImage(
          pageCanvas.toDataURL('image/png', 1.0),
          'PNG',
          marginX,
          marginTop,
          usableWidth,
          pageImgHeight
        );
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
        <div style="text-align: center; margin-bottom: 25px; page-break-inside: avoid; page-break-after: avoid;">
          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 3px 6px rgba(59, 130, 246, 0.3);">
            <h1 style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 1px; word-break: keep-all;">📊 SEAP</h1>
            <h2 style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95; font-weight: 500; word-break: keep-all;">Sistema de Gestão de Documentos Judiciais</h2>
          </div>
          <h3 style="margin: 0; font-size: 22px; color: #1f2937; font-weight: bold; word-break: keep-all;">Relatório de Produtividade</h3>
          <p style="margin: 6px 0 0 0; color: #6b7280; font-size: 13px;">Gerado em ${currentDate}</p>
        </div>

        <!-- Resumo Executivo -->
        <div style="background: linear-gradient(to bottom, #f8fafc, #ffffff); padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #3b82f6; box-shadow: 0 2px 4px rgba(0,0,0,0.08); page-break-inside: avoid; page-break-after: avoid;">
          <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; font-weight: bold; word-break: keep-all;">📈 Resumo Executivo</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between;">
            <div style="text-align: center; background: white; padding: 14px; border-radius: 8px; min-width: 140px; flex: 1; box-sizing: border-box; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-top: 3px solid #3b82f6;">
              <div style="font-size: 28px; font-weight: bold; color: #3b82f6; margin-bottom: 6px;">${report.totalDocuments}</div>
              <div style="font-size: 12px; color: #6b7280; font-weight: 500; word-break: keep-all;">Total de Documentos</div>
            </div>
            <div style="text-align: center; background: white; padding: 14px; border-radius: 8px; min-width: 140px; flex: 1; box-sizing: border-box; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-top: 3px solid #10b981;">
              <div style="font-size: 28px; font-weight: bold; color: #10b981; margin-bottom: 6px;">${report.completedDocuments}</div>
              <div style="font-size: 12px; color: #6b7280; font-weight: 500; word-break: keep-all;">Concluídos</div>
            </div>
            <div style="text-align: center; background: white; padding: 14px; border-radius: 8px; min-width: 140px; flex: 1; box-sizing: border-box; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-top: 3px solid #f59e0b;">
              <div style="font-size: 28px; font-weight: bold; color: #f59e0b; margin-bottom: 6px;">${report.inProgressDocuments}</div>
              <div style="font-size: 12px; color: #6b7280; font-weight: 500; word-break: keep-all;">Em Andamento</div>
            </div>
            <div style="text-align: center; background: white; padding: 14px; border-radius: 8px; min-width: 140px; flex: 1; box-sizing: border-box; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-top: 3px solid ${report.overdueDocuments > 0 ? '#ef4444' : '#10b981'};">
              <div style="font-size: 28px; font-weight: bold; color: ${report.overdueDocuments > 0 ? '#ef4444' : '#10b981'}; margin-bottom: 6px;">${report.overdueDocuments}</div>
              <div style="font-size: 12px; color: #6b7280; font-weight: 500; word-break: keep-all;">Atrasados</div>
            </div>
          </div>
        </div>

        <!-- Indicadores de Performance -->
        <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); page-break-inside: avoid; page-break-before: avoid;">
          <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; font-weight: bold; word-break: keep-all;">🎯 Indicadores de Performance</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between;">
            <div style="text-align: center; padding: 16px; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-radius: 8px; border: 2px solid #0ea5e9; min-width: 200px; flex: 1; box-sizing: border-box; box-shadow: 0 2px 4px rgba(14, 165, 233, 0.2);">
              <div style="font-size: 30px; font-weight: bold; color: #0369a1; margin-bottom: 6px;">${report.completionRate.toFixed(1)}%</div>
              <div style="font-size: 12px; color: #0369a1; font-weight: 600; word-break: keep-all;">Taxa de Conclusão Geral</div>
            </div>
            <div style="text-align: center; padding: 16px; background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-radius: 8px; border: 2px solid #22c55e; min-width: 200px; flex: 1; box-sizing: border-box; box-shadow: 0 2px 4px rgba(34, 197, 94, 0.2);">
              <div style="font-size: 30px; font-weight: bold; color: #166534; margin-bottom: 6px;">${activeUsers}</div>
              <div style="font-size: 12px; color: #166534; font-weight: 600; word-break: keep-all;">Usuários Ativos</div>
            </div>
            <div style="text-align: center; padding: 16px; background: linear-gradient(135deg, #fefce8, #fef9c3); border-radius: 8px; border: 2px solid #eab308; min-width: 200px; flex: 1; box-sizing: border-box; box-shadow: 0 2px 4px rgba(234, 179, 8, 0.2);">
              <div style="font-size: 30px; font-weight: bold; color: #a16207; margin-bottom: 6px;">${avgCompletionRate.toFixed(1)}%</div>
              <div style="font-size: 12px; color: #a16207; font-weight: 600; word-break: keep-all;">Taxa Média Individual</div>
            </div>
          </div>
        </div>

        <!-- Documentos por Tipo -->
        <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); page-break-inside: avoid;">
          <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; font-weight: bold; word-break: keep-all;">📋 Distribuição por Tipo de Documento</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: flex-start;">
            ${Object.entries(report.documentsByType).map(([type, count], index) => {
              const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
              const bgColors = ['#eff6ff', '#f0fdf4', '#fffbeb', '#fef2f2', '#f5f3ff', '#fdf2f8', '#ecfeff', '#fff7ed'];
              const color = colors[index % colors.length];
              const bgColor = bgColors[index % bgColors.length];
              const displayName = type.charAt(0).toUpperCase() + type.slice(1);
              const percentage = report.totalDocuments > 0 ? ((count / report.totalDocuments) * 100).toFixed(1) : 0;

              return `
                <div style="text-align: center; padding: 12px; background: ${bgColor}; border-radius: 8px; border-left: 3px solid ${color}; min-width: 140px; flex: 1; box-sizing: border-box; max-width: 200px; box-shadow: 0 2px 4px rgba(0,0,0,0.08);">
                  <div style="font-size: 24px; font-weight: bold; color: ${color}; margin-bottom: 4px;">${count}</div>
                  <div style="font-size: 12px; color: #374151; font-weight: 600; margin-bottom: 3px; word-break: keep-all; line-height: 1.2;">${displayName}</div>
                  <div style="font-size: 10px; color: #6b7280; font-weight: 500;">${percentage}% do total</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Ranking de Produtividade -->
        <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); page-break-inside: avoid; page-break-before: auto;">
          <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; font-weight: bold; word-break: keep-all;">🏆 Ranking de Produtividade dos Servidores</h3>
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
                <div style="display: flex; align-items: center; padding: 12px; margin-bottom: 8px; background: ${bgColor}; border-radius: 8px; border-left: 3px solid ${color}; box-shadow: 0 2px 4px rgba(0,0,0,0.08); page-break-inside: avoid;">
                  <div style="font-size: 18px; font-weight: bold; color: ${color}; margin-right: 12px; min-width: 40px; text-align: center;">${medal}</div>
                  <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: bold; color: #1f2937; margin-bottom: 3px; font-size: 14px; word-wrap: break-word; overflow-wrap: break-word;">${user.userName}</div>
                    <div style="font-size: 11px; color: #6b7280; line-height: 1.3;">
                      <span style="font-weight: 600;">${user.completedDocuments}</span> concluídos • <span style="font-weight: 600;">${user.totalDocuments}</span> total • <span style="font-weight: 600;">${user.completionRate.toFixed(1)}%</span> taxa
                    </div>
                  </div>
                  <div style="text-align: right; margin-left: 10px;">
                    <div style="font-size: 18px; font-weight: bold; color: #10b981;">${user.completedDocuments}</div>
                    <div style="font-size: 9px; color: #6b7280; font-weight: 500; word-break: keep-all;">documentos</div>
                  </div>
                </div>
              `;
            }).join('')}
          ${report.userProductivity.length === 0 ? '<p style="text-align: center; color: #6b7280; font-style: italic; font-size: 13px; margin: 20px 0;">Nenhum dado de produtividade disponível</p>' : ''}
        </div>

        <!-- Análise Detalhada -->
        <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); page-break-inside: avoid; page-break-before: auto;">
          <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; font-weight: bold; word-break: keep-all;">📊 Análise Detalhada</h3>

          ${topPerformer ? `
            <div style="background: linear-gradient(135deg, #ecfdf5, #d1fae5); padding: 18px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #10b981; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2); page-break-inside: avoid;">
              <h4 style="margin: 0 0 10px 0; color: #065f46; font-size: 16px; font-weight: bold; word-break: keep-all;">🌟 Maior Produtividade</h4>
              <p style="margin: 0; color: #047857; font-size: 13px; line-height: 1.6; word-wrap: break-word; overflow-wrap: break-word;">
                <strong style="font-size: 14px;">${topPerformer.userName}</strong> lidera com <strong>${topPerformer.completedDocuments} documentos concluídos</strong>
                e taxa de conclusão de <strong>${topPerformer.completionRate.toFixed(1)}%</strong>.
              </p>
            </div>
          ` : ''}

          <div style="display: flex; flex-wrap: wrap; gap: 18px;">
            <div style="background: linear-gradient(to bottom, #f8fafc, #f1f5f9); padding: 18px; border-radius: 10px; flex: 1; min-width: 280px; box-sizing: border-box; border-top: 3px solid #10b981; box-shadow: 0 2px 4px rgba(0,0,0,0.08); page-break-inside: avoid;">
              <h4 style="margin: 0 0 14px 0; color: #065f46; font-size: 16px; font-weight: bold; word-break: keep-all;">📈 Tendências Positivas</h4>
              <ul style="margin: 0; padding-left: 18px; color: #374151; font-size: 13px; line-height: 1.6;">
                <li style="margin-bottom: 8px; word-wrap: break-word;">Taxa de conclusão geral: <strong>${report.completionRate.toFixed(1)}%</strong></li>
                <li style="margin-bottom: 8px; word-wrap: break-word;">Usuários ativos no sistema: <strong>${activeUsers}</strong></li>
                <li style="margin-bottom: 8px; word-wrap: break-word;">Documentos processados: <strong>${report.totalDocuments}</strong></li>
                ${report.overdueDocuments === 0 ? '<li style="color: #10b981; font-weight: 600; word-wrap: break-word;">✅ Sem documentos atrasados!</li>' : ''}
              </ul>
            </div>

            <div style="background: linear-gradient(to bottom, #f8fafc, #f1f5f9); padding: 18px; border-radius: 10px; flex: 1; min-width: 280px; box-sizing: border-box; border-top: 3px solid #f59e0b; box-shadow: 0 2px 4px rgba(0,0,0,0.08); page-break-inside: avoid;">
              <h4 style="margin: 0 0 14px 0; color: #92400e; font-size: 16px; font-weight: bold; word-break: keep-all;">⚠️ Pontos de Atenção</h4>
              <ul style="margin: 0; padding-left: 18px; color: #374151; font-size: 13px; line-height: 1.6;">
                ${report.overdueDocuments > 0 ? `<li style="margin-bottom: 8px; color: #ef4444; font-weight: 600; word-wrap: break-word;">${report.overdueDocuments} documento(s) atrasado(s)</li>` : ''}
                <li style="margin-bottom: 8px; word-wrap: break-word;">Documentos em andamento: <strong>${report.inProgressDocuments}</strong></li>
                <li style="margin-bottom: 8px; word-wrap: break-word;">Taxa média individual: <strong>${avgCompletionRate.toFixed(1)}%</strong></li>
                ${Object.keys(report.documentsByType).length === 0 ? '<li style="color: #f59e0b; font-weight: 600; word-wrap: break-word;">⚠️ Nenhum tipo de documento cadastrado</li>' : ''}
              </ul>
            </div>
          </div>
        </div>

        <!-- Tendências Temporais -->
        ${report.monthlyTrends && report.monthlyTrends.length > 0 ? `
          <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); page-break-inside: avoid; page-break-before: auto;">
            <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; font-weight: bold; word-break: keep-all;">📅 Tendências dos Últimos Meses</h3>
            <div style="overflow: visible; width: 100%;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed;">
                <thead>
                  <tr style="background: linear-gradient(to bottom, #f9fafb, #f3f4f6);">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #3b82f6; color: #1f2937; font-weight: 700; width: 20%; word-break: keep-all;">Período</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #3b82f6; color: #1f2937; font-weight: 700; width: 20%; word-break: keep-all;">Total</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #3b82f6; color: #1f2937; font-weight: 700; width: 20%; word-break: keep-all;">Concluídos</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #3b82f6; color: #1f2937; font-weight: 700; width: 20%; word-break: keep-all;">Em Andamento</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #3b82f6; color: #1f2937; font-weight: 700; width: 20%; word-break: keep-all;">Taxa (%)</th>
                  </tr>
                </thead>
                <tbody>
                  ${report.monthlyTrends.slice(-6).map((month, index) => {
                    const rate = month.total > 0 ? ((month.concluidos / month.total) * 100).toFixed(1) : '0.0';
                    const isEven = index % 2 === 0;
                    return `
                      <tr style="background: ${isEven ? '#ffffff' : '#f9fafb'}; page-break-inside: avoid;">
                        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #1f2937; word-break: keep-all;">${month.period}</td>
                        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; color: #3b82f6; font-weight: 700; font-size: 14px;">${month.total}</td>
                        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; color: #10b981; font-weight: 700; font-size: 14px;">${month.concluidos}</td>
                        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; color: #f59e0b; font-weight: 700; font-size: 14px;">${month.emAndamento}</td>
                        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; font-weight: 700; font-size: 14px; color: ${parseFloat(rate) >= 70 ? '#10b981' : parseFloat(rate) >= 50 ? '#f59e0b' : '#ef4444'};">${rate}%</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding: 15px; background: linear-gradient(to bottom, #f9fafb, #f3f4f6); border-radius: 8px; border-top: 3px solid #3b82f6; box-shadow: 0 2px 4px rgba(0,0,0,0.08); page-break-inside: avoid;">
          <p style="margin: 0 0 5px 0; font-weight: bold; color: #1f2937; font-size: 12px; word-break: keep-all;">SEAP - Sistema de Gestão de Documentos Judiciais</p>
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 11px; word-break: keep-all;">Relatório gerado automaticamente em ${currentDate}</p>
          <div style="margin-top: 8px; padding: 8px; background: white; border-radius: 6px; font-size: 10px; color: #6b7280; line-height: 1.4; word-wrap: break-word; border-left: 3px solid #f59e0b;">
            ⚠️ Este relatório contém informações confidenciais do sistema SEAP
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
