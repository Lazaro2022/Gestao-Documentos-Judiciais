
-- Remover índice
DROP INDEX IF EXISTS idx_users_matricula;

-- Remover colunas adicionadas
ALTER TABLE users DROP COLUMN matricula;
ALTER TABLE users DROP COLUMN password;
