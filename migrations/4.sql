
-- Adicionar campos para matrícula e senha na tabela users
ALTER TABLE users ADD COLUMN matricula TEXT;
ALTER TABLE users ADD COLUMN password TEXT;

-- Criar índice único para matrícula
CREATE UNIQUE INDEX idx_users_matricula ON users(matricula) WHERE matricula IS NOT NULL;
