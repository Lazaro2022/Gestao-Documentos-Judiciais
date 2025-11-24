# 📦 Guia de Backup e Restauração - SEAP

## Visão Geral

O SEAP agora possui um sistema completo de **backup e restauração** de dados, permitindo:

✅ **Exportar** todos os dados do sistema em formato JSON
✅ **Baixar** o arquivo de backup para uso futuro
✅ **Importar** backup em outro sistema clone
✅ **Restaurar** dados após reset ou migração

---

## 🔹 Como Fazer Backup

### Passo 1: Acessar Configurações
1. Faça login como **Administrador**
2. Navegue até **Configurações** (menu lateral)
3. Clique na aba **"Banco de Dados"**

### Passo 2: Exportar Backup
1. Clique no botão **"Fazer Backup Agora"** (verde)
2. O sistema irá:
   - Buscar TODOS os dados do banco
   - Gerar arquivo JSON formatado
   - Baixar automaticamente: `seap-backup-YYYY-MM-DD.json`

### Estrutura do Arquivo de Backup

```json
{
  "metadata": {
    "exportDate": "2025-01-24T12:00:00.000Z",
    "systemName": "SEAP - Sistema de Gestão de Documentos Judiciais",
    "version": "2.0",
    "databaseSchema": "D1 SQLite",
    "totalRecords": {
      "users": 5,
      "documentAssignees": 10,
      "documentTypes": 8,
      "documents": 150,
      "accessLogs": 200,
      "passwordUsage": 50
    }
  },
  "data": {
    "users": [...],
    "documentAssignees": [...],
    "documentTypes": [...],
    "documents": [...],
    "accessLogs": [...],
    "passwordUsage": [...]
  }
}
```

---

## 🔹 Como Restaurar Backup

### ⚠️ ATENÇÃO: Restaurar backup é uma operação DESTRUTIVA!

A restauração irá:
- ❌ **EXCLUIR** todos os dados atuais do sistema
- ✅ **SUBSTITUIR** pelos dados do arquivo de backup
- ⚠️ Esta ação **NÃO pode ser desfeita**

### Passo 1: Preparar Arquivo
1. Tenha em mãos o arquivo `seap-backup-YYYY-MM-DD.json`
2. Verifique se o arquivo está íntegro (abra no editor de texto)

### Passo 2: Importar Backup
1. Acesse **Configurações** → **"Banco de Dados"**
2. Clique no botão **"Restaurar Backup"** (laranja)
3. Confirme a ação no diálogo de alerta
4. Selecione o arquivo `.json` de backup
5. Aguarde a importação (pode levar alguns segundos)
6. **Recarregue a página** para ver as alterações

### Resultado Esperado
```
✅ Backup restaurado com sucesso!
Importados: 150 documentos, 5 usuários, 8 tipos.
```

---

## 🔹 Usando Backup em Outro Sistema Clone

### Cenário: Migrar dados entre ambientes

**Exemplo**: Você tem dados no ambiente de desenvolvimento e quer copiar para produção.

#### Passo a Passo

1. **No ambiente ORIGEM** (ex: dev local):
   - Faça login como admin
   - Exporte o backup (Download do JSON)
   - Salve o arquivo: `seap-backup-2025-01-24.json`

2. **No ambiente DESTINO** (ex: produção Cloudflare):
   - Acesse o sistema clone
   - Faça login como admin
   - Vá em Configurações → Banco de Dados
   - Clique em "Restaurar Backup"
   - Selecione o arquivo exportado
   - Confirme a importação

3. **Resultado**:
   - ✅ Todos os documentos copiados
   - ✅ Todos os usuários copiados (incluindo senhas)
   - ✅ Todos os tipos de documentos copiados
   - ✅ Logs de acesso copiados

---

## 🔹 Casos de Uso Avançados

### Caso 1: Backup Periódico Manual
**Recomendação**: Fazer backup semanal/mensal

```
1. Segunda-feira: Exportar backup
2. Salvar em local seguro (Google Drive, Dropbox, etc)
3. Manter últimas 3 versões
```

### Caso 2: Migração de Sistema
**Cenário**: Mudar de banco D1 ou criar novo deploy

```
1. Exportar backup do sistema antigo
2. Criar novo deploy Cloudflare
3. Executar schema.sql no novo banco
4. Importar backup no novo sistema
5. Validar dados
```

### Caso 3: Reset com Backup de Segurança
**Cenário**: Testar reset mantendo segurança

```
1. Exportar backup antes do reset
2. Executar Reset Completo do Sistema
3. Se necessário, restaurar dados do backup
```

---

## 🔹 Endpoints da API

### Exportar Backup
```http
GET /api/admin/export-backup

Response: 200 OK
Content-Type: application/json
Content-Disposition: attachment; filename="seap-backup-2025-01-24.json"

{
  "metadata": { ... },
  "data": { ... }
}
```

### Importar Backup
```http
POST /api/admin/import-backup
Content-Type: application/json

Body:
{
  "backup": {
    "metadata": { ... },
    "data": { ... }
  },
  "clearBeforeImport": true
}

Response: 200 OK
{
  "success": true,
  "message": "Backup importado com sucesso!",
  "imported": {
    "users": 5,
    "documentAssignees": 10,
    "documentTypes": 8,
    "documents": 150,
    "accessLogs": 200,
    "passwordUsage": 50
  },
  "metadata": { ... }
}
```

---

## 🔹 Perguntas Frequentes

### ❓ O backup inclui senhas dos usuários?
✅ **Sim!** O backup inclui todos os dados da tabela `users`, incluindo senhas.

### ❓ Posso usar o backup em um sistema diferente?
✅ **Sim!** Desde que o sistema clone tenha a mesma estrutura de banco (mesmo `schema.sql`).

### ❓ O que acontece se o arquivo de backup estiver corrompido?
❌ O sistema irá exibir erro: `"Arquivo de backup inválido. Estrutura incorreta."`

### ❓ Posso importar sem limpar os dados existentes?
❌ **Não na interface.** Por padrão, `clearBeforeImport: true`.
   Para importação mesclada, use a API diretamente com `clearBeforeImport: false`.

### ❓ O backup funciona em localhost e produção?
✅ **Sim!** Funciona em ambos os ambientes (local dev e Cloudflare Workers).

---

## 🔹 Troubleshooting

### Erro: "Erro ao exportar backup"
**Causa**: Problema de conexão com banco D1
**Solução**: Verifique se o binding `DB` está configurado em `wrangler.json`

### Erro: "Erro ao importar backup"
**Causa**: Arquivo JSON mal formatado ou estrutura inválida
**Solução**:
1. Abra o arquivo no editor de texto
2. Valide a estrutura JSON (use jsonlint.com)
3. Certifique-se que tem `metadata` e `data`

### Erro: "Foreign key constraint failed"
**Causa**: Ordem de inserção incorreta (documentos antes de users)
**Solução**: O sistema já trata isso! Insere na ordem correta:
1. users
2. document_assignees
3. document_types
4. documents (depende de 1 e 2)
5. access_logs (depende de 1)
6. password_usage

---

## 🔹 Segurança

### ⚠️ IMPORTANTE

- 🔒 **Backups contêm dados sensíveis** (senhas, documentos judiciais)
- 🔒 **Armazene em local seguro** (criptografado, se possível)
- 🔒 **Não compartilhe** backups publicamente
- 🔒 **Apenas administradores** têm acesso aos endpoints

### Recomendações de Segurança

1. ✅ Criptografe arquivos de backup antes de enviar para cloud
2. ✅ Use senhas fortes para acesso ao sistema
3. ✅ Restrinja acesso físico aos arquivos de backup
4. ✅ Faça backup regular (semanal recomendado)
5. ✅ Teste restauração periodicamente

---

## 🔹 Logs e Auditoria

Todas as ações de backup/restauração podem ser monitoradas via:

- **Frontend**: Mensagens de sucesso/erro na tela
- **Backend**: Logs do Cloudflare Workers (`console.log`)
- **Browser DevTools**: Network tab para ver requisições

---

## 📞 Suporte

Para problemas ou dúvidas sobre backup/restauração:

1. Verifique este guia primeiro
2. Consulte os logs de erro no console do navegador
3. Verifique os logs do Cloudflare Workers dashboard
4. Entre em contato com o administrador do sistema

---

**Última atualização**: Janeiro 2025
**Versão do SEAP**: 2.0
**Autor**: Sistema SEAP
