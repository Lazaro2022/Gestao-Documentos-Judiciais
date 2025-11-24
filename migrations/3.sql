
CREATE TABLE document_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO document_types (name, color) VALUES 
('Certidão', '#3B82F6'),
('Relatório', '#10B981'),
('Ofício', '#F59E0B'),
('Extinção', '#EF4444');
