
CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Em Andamento',
  assigned_to INTEGER,
  deadline DATE,
  description TEXT,
  priority TEXT DEFAULT 'normal',
  completion_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO documents (title, type, status, assigned_to, deadline, description, priority) VALUES 
('Certidão de Nascimento - João Silva', 'Certidão', 'Concluído', 1, '2025-07-20', 'Certidão de nascimento para documentação', 'alta'),
('Relatório Mensal Departamento A', 'Relatório', 'Em Andamento', 2, '2025-07-25', 'Relatório mensal de atividades', 'alta'),
('Ofício Protocolo 2025-001', 'Ofício', 'Em Andamento', 1, '2025-07-30', 'Ofício para trâmite legal', 'normal'),
('Processo de Extinção ABC-123', 'Extinção', 'Concluído', 3, '2025-07-15', 'Finalização de processo', 'alta'),
('Certidão de Casamento - Maria João', 'Certidão', 'Em Andamento', 4, '2025-08-01', 'Documentação matrimonial', 'normal'),
('Relatório Semestral 2025', 'Relatório', 'Em Andamento', 2, '2025-08-15', 'Análise semestral completa', 'alta');
