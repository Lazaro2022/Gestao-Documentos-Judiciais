
-- Criar tabela de logs de acesso
CREATE TABLE access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  matricula TEXT,
  login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  logout_time DATETIME,
  ip_address TEXT,
  user_agent TEXT,
  session_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inserir usuário administrador padrão
INSERT INTO users (name, email, role, matricula, password, is_active) 
VALUES ('Administrador do Sistema', 'admin@seap.gov.br', 'admin', 'ADM001', 'admin123', 1);

-- Inserir alguns usuários de exemplo
INSERT INTO users (name, email, role, matricula, password, is_active) 
VALUES ('João Silva', 'joao.silva@seap.gov.br', 'user', 'USR001', 'usuario123', 1);

INSERT INTO users (name, email, role, matricula, password, is_active) 
VALUES ('Maria Santos', 'maria.santos@seap.gov.br', 'user', 'USR002', 'usuario123', 1);
