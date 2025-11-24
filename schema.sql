-- =====================================================
-- SEAP - Sistema de Gestão de Documentos Judiciais
-- Schema do Banco de Dados D1 (SQLite)
-- =====================================================

-- Tabela de usuários de login (autenticação individual)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'user',
  matricula TEXT UNIQUE,
  password TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de responsáveis por documentos (não são usuários de login)
CREATE TABLE IF NOT EXISTS document_assignees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  department TEXT,
  position TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de tipos de documentos (customizável pelo admin)
CREATE TABLE IF NOT EXISTS document_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de documentos (principal)
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'Em Andamento',
  assigned_to INTEGER,
  document_assignee_id INTEGER,
  deadline DATETIME,
  description TEXT,
  priority TEXT DEFAULT 'normal',
  completion_date DATETIME,
  process_number TEXT,
  prisoner_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (document_assignee_id) REFERENCES document_assignees(id)
);

-- Tabela de logs de acesso (auditoria de login/logout)
CREATE TABLE IF NOT EXISTS access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  matricula TEXT,
  login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  logout_time DATETIME,
  ip_address TEXT,
  user_agent TEXT,
  session_active BOOLEAN DEFAULT 1,
  login_success BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de uso de senhas (rastreamento de senhas legacy)
CREATE TABLE IF NOT EXISTS password_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  password_type TEXT NOT NULL,
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Índices para melhor performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_matricula ON users(matricula);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_assigned_to ON documents(assigned_to);
CREATE INDEX IF NOT EXISTS idx_documents_assignee ON documents(document_assignee_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_matricula ON access_logs(matricula);
CREATE INDEX IF NOT EXISTS idx_access_logs_session ON access_logs(session_active);
