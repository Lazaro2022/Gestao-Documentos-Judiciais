# 🔌 API Documentation - SEAP

Documentação completa de todos os endpoints da API REST do sistema SEAP.

**Base URL**: `https://[your-worker].workers.dev`

**Content-Type**: `application/json`

---

## 📑 Índice

1. [Autenticação](#autenticação)
2. [Documentos](#documentos)
3. [Tipos de Documentos](#tipos-de-documentos)
4. [Responsáveis por Documentos](#responsáveis-por-documentos)
5. [Usuários](#usuários)
6. [Relatórios](#relatórios)
7. [Admin / Backup](#admin--backup)
8. [Códigos de Status](#códigos-de-status)
9. [Exemplos de Uso](#exemplos-de-uso)

---

## Autenticação

### Login Individual

Autenticação com matrícula e senha (usuários pré-cadastrados).

```http
POST /api/auth/login
```

**Request Body**:
```json
{
  "matricula": "123456",
  "password": "senha123"
}
```

**Response Success** (200):
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@example.com",
    "role": "admin",
    "matricula": "123456"
  },
  "message": "✅ Login realizado com sucesso"
}
```

**Response Error** (401):
```json
{
  "error": "❌ ACESSO NEGADO: A matrícula 123456 não está cadastrada no sistema."
}
```

---

### Login Legacy (Compartilhado)

Autenticação com senha compartilhada por nível de acesso.

```http
POST /api/auth/login-legacy
```

**Request Body**:
```json
{
  "password": "Guardiao"
}
```

**Response Success** (200):
```json
{
  "success": true,
  "userType": "admin",
  "message": "✅ Login realizado com sucesso"
}
```

**Response Error** (401):
```json
{
  "error": "Senha incorreta"
}
```

---

### Logout

Registra logout e atualiza logs de acesso.

```http
POST /api/auth/logout
```

**Request Body**:
```json
{
  "matricula": "123456",
  "userId": 1
}
```

**Response Success** (200):
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

---

## Documentos

### Listar Todos os Documentos

```http
GET /api/documents
```

**Response** (200):
```json
[
  {
    "id": 1,
    "title": "Alvará de Soltura",
    "type": "Alvará",
    "status": "Em Andamento",
    "assigned_to": 1,
    "document_assignee_id": null,
    "deadline": "2025-02-15T00:00:00.000Z",
    "description": "Processo urgente",
    "priority": "alta",
    "completion_date": null,
    "process_number": "0001234-56.2025.8.01.0001",
    "prisoner_name": "José Santos",
    "created_at": "2025-01-20T10:00:00.000Z",
    "updated_at": "2025-01-20T10:00:00.000Z",
    "assigned_user_name": "João Silva",
    "assigned_assignee_name": null
  }
]
```

---

### Criar Documento

```http
POST /api/documents
```

**Request Body**:
```json
{
  "title": "Alvará de Soltura",
  "type": "Alvará",
  "status": "Em Andamento",
  "assignment_type": "user",
  "assigned_to": 1,
  "document_assignee_id": null,
  "deadline": "2025-02-15",
  "description": "Processo urgente",
  "priority": "alta",
  "process_number": "0001234-56.2025.8.01.0001",
  "prisoner_name": "José Santos"
}
```

**Response** (201):
```json
{
  "success": true,
  "document": {
    "id": 1,
    "title": "Alvará de Soltura",
    ...
  }
}
```

**Validation Errors** (400):
```json
{
  "error": "Invalid request",
  "details": [
    {
      "path": ["title"],
      "message": "Required"
    }
  ]
}
```

---

### Atualizar Documento

```http
PUT /api/documents/:id
```

**Request Body** (todos os campos opcionais):
```json
{
  "title": "Alvará de Soltura - Atualizado",
  "status": "Concluído",
  "completion_date": "2025-01-24T12:00:00.000Z"
}
```

**Response** (200):
```json
{
  "success": true
}
```

---

### Atualizar Status do Documento

Endpoint específico para atualizar apenas o status.

```http
PATCH /api/documents/:id/status
```

**Request Body**:
```json
{
  "status": "Concluído"
}
```

Se status for "Concluído", o campo `completion_date` é automaticamente preenchido.

**Response** (200):
```json
{
  "success": true
}
```

---

### Excluir Documento

```http
DELETE /api/documents/:id
```

**Response** (200):
```json
{
  "success": true
}
```

**Response Error** (404):
```json
{
  "error": "Documento não encontrado"
}
```

---

## Tipos de Documentos

### Listar Tipos

```http
GET /api/document-types
```

**Response** (200):
```json
[
  {
    "id": 1,
    "name": "Alvará",
    "color": "#3B82F6",
    "is_active": 1,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
]
```

---

### Criar Tipo

```http
POST /api/document-types
```

**Request Body**:
```json
{
  "name": "Ofício",
  "color": "#10B981"
}
```

**Response** (201):
```json
{
  "success": true,
  "type": {
    "id": 2,
    "name": "Ofício",
    "color": "#10B981",
    "is_active": 1
  }
}
```

**Response Error** (409):
```json
{
  "error": "Tipo de documento já existe"
}
```

---

### Atualizar Tipo

```http
PUT /api/document-types/:id
```

**Request Body**:
```json
{
  "name": "Ofício Atualizado",
  "color": "#EF4444",
  "is_active": 1
}
```

**Response** (200):
```json
{
  "success": true
}
```

---

### Ativar/Desativar Tipo

```http
PATCH /api/document-types/:id/toggle-status
```

Alterna entre `is_active = 1` e `is_active = 0`.

**Response** (200):
```json
{
  "success": true
}
```

---

### Excluir Tipo

```http
DELETE /api/document-types/:id
```

**Response** (200):
```json
{
  "success": true
}
```

**Response Error** (400):
```json
{
  "error": "Não é possível excluir este tipo pois existem 5 documento(s) associado(s) a ele"
}
```

---

## Responsáveis por Documentos

### Listar Responsáveis

```http
GET /api/document-assignees
```

**Response** (200):
```json
[
  {
    "id": 1,
    "first_name": "Maria",
    "last_name": "Oliveira",
    "department": "Jurídico",
    "position": "Advogada",
    "is_active": 1,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
]
```

---

### Criar Responsável

```http
POST /api/document-assignees
```

**Request Body**:
```json
{
  "first_name": "Maria",
  "last_name": "Oliveira",
  "department": "Jurídico",
  "position": "Advogada"
}
```

**Response** (201):
```json
{
  "success": true,
  "assignee": {
    "id": 1,
    "first_name": "Maria",
    "last_name": "Oliveira",
    ...
  }
}
```

---

### Atualizar Responsável

```http
PUT /api/document-assignees/:id
```

**Request Body**:
```json
{
  "first_name": "Maria",
  "last_name": "Oliveira Santos",
  "department": "Jurídico",
  "position": "Advogada Sênior",
  "is_active": 1
}
```

**Response** (200):
```json
{
  "success": true
}
```

---

### Ativar/Desativar Responsável

```http
PATCH /api/document-assignees/:id/toggle-status
```

**Response** (200):
```json
{
  "success": true
}
```

---

### Excluir Responsável

```http
DELETE /api/document-assignees/:id
```

**Response** (200):
```json
{
  "success": true
}
```

**Response Error** (400):
```json
{
  "error": "Não é possível excluir este responsável pois existem 3 documento(s) atribuído(s) a ele"
}
```

---

## Usuários

### Listar Usuários Ativos

```http
GET /api/users
```

**Response** (200):
```json
[
  {
    "id": 1,
    "name": "João Silva",
    "email": "joao@example.com",
    "role": "admin",
    "matricula": "123456",
    "password": "senha123",
    "is_active": 1,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
]
```

---

### Criar Usuário

```http
POST /api/users
```

**Request Body**:
```json
{
  "name": "Pedro Costa",
  "email": "pedro@example.com",
  "role": "user",
  "matricula": "654321",
  "password": "senha456"
}
```

**Response** (201):
```json
{
  "success": true,
  "user": {
    "id": 2,
    "name": "Pedro Costa",
    ...
  }
}
```

**Response Error** (409):
```json
{
  "error": "Já existe um usuário com esta matrícula"
}
```

---

### Atualizar Usuário

```http
PUT /api/users/:id
```

**Request Body**:
```json
{
  "name": "Pedro Costa Silva",
  "email": "pedro.silva@example.com",
  "role": "admin",
  "matricula": "654321",
  "password": "novaSenha789",
  "is_active": 1
}
```

**Response** (200):
```json
{
  "success": true
}
```

---

### Ativar/Desativar Usuário

```http
PATCH /api/users/:id/toggle-status
```

**Response** (200):
```json
{
  "success": true
}
```

---

### Excluir Usuário

```http
DELETE /api/users/:id
```

**Response** (200):
```json
{
  "success": true
}
```

**Response Error** (400):
```json
{
  "error": "Não é possível excluir este usuário pois existem 7 documento(s) atribuído(s) a ele"
}
```

---

## Relatórios

### Relatório de Produtividade

Gera relatório completo com estatísticas, gráficos e produtividade por usuário.

```http
GET /api/reports/productivity
```

**Response** (200):
```json
{
  "generalStats": {
    "totalDocuments": 150,
    "completedDocuments": 120,
    "inProgressDocuments": 25,
    "archivedDocuments": 5,
    "overdueDocuments": 10,
    "completionRate": 80.0
  },
  "weeklyData": [
    {
      "week": "Semana 1",
      "startDate": "2025-01-01",
      "endDate": "2025-01-07",
      "completed": 15,
      "inProgress": 5,
      "overdue": 2
    }
  ],
  "monthlyData": [
    {
      "month": "Jan 2025",
      "completed": 60,
      "inProgress": 20,
      "overdue": 5
    }
  ],
  "yearlyData": [
    {
      "year": "2025",
      "completed": 120,
      "inProgress": 25,
      "overdue": 10
    }
  ],
  "byUser": [
    {
      "name": "João Silva",
      "completed": 50,
      "inProgress": 10,
      "overdue": 2,
      "total": 62
    }
  ],
  "byDocumentType": [
    {
      "type": "Alvará",
      "count": 45,
      "percentage": 30.0
    }
  ]
}
```

---

## Admin / Backup

### Exportar Backup

Exporta todos os dados do sistema em formato JSON.

```http
GET /api/admin/export-backup
```

**Response** (200):
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

**Headers**:
```
Content-Disposition: attachment; filename="seap-backup-2025-01-24.json"
```

---

### Importar Backup

Restaura dados de um arquivo de backup JSON.

```http
POST /api/admin/import-backup
```

**Request Body**:
```json
{
  "backup": {
    "metadata": { ... },
    "data": { ... }
  },
  "clearBeforeImport": true
}
```

**Response** (200):
```json
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
  "metadata": {
    "exportDate": "2025-01-24T12:00:00.000Z",
    "systemName": "SEAP",
    "version": "2.0"
  }
}
```

**Response Error** (400):
```json
{
  "error": "Erro ao importar backup do sistema",
  "details": "Invalid backup structure"
}
```

---

### Visualizar Logs de Acesso

```http
GET /api/admin/access-logs
```

**Response** (200):
```json
[
  {
    "id": 1,
    "user_id": 1,
    "matricula": "123456",
    "login_time": "2025-01-24T10:00:00.000Z",
    "logout_time": "2025-01-24T18:00:00.000Z",
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "session_active": 0,
    "login_success": 1,
    "user_name": "João Silva"
  }
]
```

Retorna os últimos 100 registros.

---

### Limpar Documentos (Admin)

⚠️ **AÇÃO PERIGOSA**: Exclui todos os documentos.

```http
DELETE /api/admin/clear-documents
```

**Response** (200):
```json
{
  "success": true,
  "message": "Todos os documentos foram excluídos"
}
```

---

### Limpar Tipos de Documentos (Admin)

⚠️ **AÇÃO PERIGOSA**: Exclui todos os tipos de documentos.

```http
DELETE /api/admin/clear-document-types
```

**Response** (200):
```json
{
  "success": true,
  "message": "Todos os tipos de documentos foram excluídos"
}
```

---

### Limpar Responsáveis (Admin)

⚠️ **AÇÃO PERIGOSA**: Exclui todos os responsáveis.

```http
DELETE /api/admin/clear-document-assignees
```

**Response** (200):
```json
{
  "success": true,
  "message": "Todos os responsáveis foram excluídos"
}
```

---

### Limpar Usuários (Admin)

⚠️ **AÇÃO PERIGOSA**: Exclui todos os usuários.

```http
DELETE /api/admin/clear-users
```

**Response** (200):
```json
{
  "success": true,
  "message": "Todos os usuários foram excluídos"
}
```

---

### Limpar Logs de Acesso (Admin)

⚠️ **AÇÃO PERIGOSA**: Exclui todos os logs de acesso.

```http
DELETE /api/admin/clear-access-logs
```

**Response** (200):
```json
{
  "success": true,
  "message": "Logs de acesso limpos com sucesso"
}
```

---

### Reset Completo do Sistema (Admin)

⚠️ **AÇÃO EXTREMAMENTE PERIGOSA**: Exclui TODOS os dados do sistema.

```http
DELETE /api/admin/reset-system
```

**Response** (200):
```json
{
  "success": true,
  "message": "Banco de dados resetado com sucesso"
}
```

---

## Códigos de Status

| Código | Significado | Descrição |
|--------|-------------|-----------|
| **200** | OK | Requisição bem-sucedida |
| **201** | Created | Recurso criado com sucesso |
| **400** | Bad Request | Dados inválidos ou faltando campos obrigatórios |
| **401** | Unauthorized | Autenticação falhou |
| **404** | Not Found | Recurso não encontrado |
| **409** | Conflict | Conflito (ex: matrícula duplicada) |
| **500** | Internal Server Error | Erro interno do servidor |

---

## Exemplos de Uso

### JavaScript/Fetch

```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    matricula: '123456',
    password: 'senha123'
  })
});
const data = await response.json();

// Criar Documento
const response = await fetch('/api/documents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Alvará de Soltura',
    type: 'Alvará',
    status: 'Em Andamento',
    assignment_type: 'user',
    assigned_to: 1
  })
});

// Exportar Backup
const response = await fetch('/api/admin/export-backup');
const backup = await response.json();
const blob = new Blob([JSON.stringify(backup, null, 2)],
  { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'backup.json';
a.click();
```

### cURL

```bash
# Login
curl -X POST https://your-worker.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"matricula":"123456","password":"senha123"}'

# Listar Documentos
curl https://your-worker.workers.dev/api/documents

# Criar Documento
curl -X POST https://your-worker.workers.dev/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Alvará de Soltura",
    "type": "Alvará",
    "status": "Em Andamento",
    "assignment_type": "user",
    "assigned_to": 1
  }'

# Exportar Backup
curl https://your-worker.workers.dev/api/admin/export-backup \
  -o backup.json
```

---

## Rate Limiting

⚠️ **Atualmente não implementado**

Em versões futuras, haverá rate limiting para prevenir abuso:
- 100 requests/minuto por IP
- 1000 requests/hora por IP
- Backup/Restore: 10 requests/hora

---

## Versionamento da API

**Versão Atual**: 2.0

A API segue versionamento semântico. Mudanças breaking serão comunicadas com antecedência.

---

## Suporte

- 📖 Documentação: [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md)
- 📖 Guia de Backup: [BACKUP_GUIDE.md](./BACKUP_GUIDE.md)
- 🐛 Issues: [GitHub Issues](https://github.com/Lazaro2022/Gestao-Documentos-Judiciais/issues)
- 💬 Discord: https://discord.gg/shDEGBSe2d

---

**Última atualização**: Janeiro 2025
**Versão da API**: 2.0
