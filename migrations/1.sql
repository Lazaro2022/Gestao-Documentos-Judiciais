
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, email, role) VALUES 
('João Silva', 'joao@lazaroseg.com', 'user'),
('Maria Santos', 'maria@lazaroseg.com', 'user'),
('Pedro Oliveira', 'pedro@lazaroseg.com', 'supervisor'),
('Ana Costa', 'ana@lazaroseg.com', 'user');
