
-- Remover tabela de logs de acesso
DROP TABLE access_logs;

-- Remover usuários de exemplo
DELETE FROM users WHERE matricula IN ('ADM001', 'USR001', 'USR002');
