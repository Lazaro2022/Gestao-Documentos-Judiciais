import z from "zod";

// Schema para usuários de login
export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().optional(),
  role: z.string().default('user'),
  is_active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
});

// Schema para responsáveis por documentos
export const DocumentAssigneeSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  full_name: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
});

// Schema para tipos de documentos
export const DocumentTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string().default('#3B82F6'),
  is_active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
});

// Schema para documentos
export const DocumentSchema = z.object({
  id: z.number(),
  title: z.string(),
  type: z.string(), // Mudou de enum para string para permitir tipos dinâmicos
  status: z.enum(['Em Andamento', 'Concluído', 'Arquivado']),
  assigned_to: z.number().optional(), // Usuário de login (legacy)
  document_assignee_id: z.number().optional(), // Responsável por documento (novo)
  deadline: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(['baixa', 'normal', 'alta']).default('normal'),
  completion_date: z.string().optional(),
  process_number: z.string().optional(), // Número do processo judicial
  prisoner_name: z.string().optional(), // Nome do preso
  created_at: z.string(),
  updated_at: z.string(),
});

// Schema para dados de gráficos
export const ChartDataSchema = z.object({
  period: z.string(),
  total: z.number(),
  concluidos: z.number(),
  emAndamento: z.number(),
  date: z.string(),
}).catchall(z.union([z.number(), z.string()])); // Permite campos dinâmicos

// Schema para relatório de produtividade
export const ProductivityReportSchema = z.object({
  totalDocuments: z.number(),
  completedDocuments: z.number(),
  inProgressDocuments: z.number(),
  overdueDocuments: z.number(),
  averageCompletionTime: z.number(),
  completionRate: z.number(),
  documentsByType: z.record(z.string(), z.number()), // Mudou para suportar tipos dinâmicos
  userProductivity: z.array(z.object({
    userId: z.number(),
    userName: z.string(),
    totalDocuments: z.number(),
    completedDocuments: z.number(),
    inProgressDocuments: z.number(),
    overdueDocuments: z.number(),
    completionRate: z.number(),
    averageCompletionTime: z.number(),
    documentsByType: z.record(z.string(), z.number()), // Mudou para suportar tipos dinâmicos
    monthlyProduction: z.array(z.any()),
  })),
  dailyProduction: z.array(z.any()),
  monthlyTrends: z.array(ChartDataSchema),
  weeklyTrends: z.array(ChartDataSchema),
  annualTrends: z.array(ChartDataSchema),
});

// Tipos derivados dos schemas
export type User = z.infer<typeof UserSchema>;
export type DocumentAssignee = z.infer<typeof DocumentAssigneeSchema>;
export type DocumentType = z.infer<typeof DocumentTypeSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type ChartData = z.infer<typeof ChartDataSchema>;
export type ProductivityReport = z.infer<typeof ProductivityReportSchema>;
