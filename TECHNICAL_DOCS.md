# 📘 Documentação Técnica - SEAP

## Índice

1. [Arquitetura do Sistema](#arquitetura-do-sistema)
2. [Backend - Cloudflare Worker](#backend-cloudflare-worker)
3. [Frontend - React Application](#frontend-react-application)
4. [Banco de Dados - D1 SQLite](#banco-de-dados-d1-sqlite)
5. [Sistema de Autenticação](#sistema-de-autenticação)
6. [Sistema de Backup/Restauração](#sistema-de-backuprestauração)
7. [Fluxos de Dados](#fluxos-de-dados)
8. [Segurança](#segurança)
9. [Performance e Otimizações](#performance-e-otimizações)
10. [Troubleshooting](#troubleshooting)

---

## Arquitetura do Sistema

### Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   React    │  │   Router   │  │  Tailwind  │            │
│  │  App SPA   │  │    v7      │  │    CSS     │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│           CLOUDFLARE WORKERS (Edge Computing)                │
│  ┌────────────────────────────────────────────────┐         │
│  │              HONO WEB FRAMEWORK                 │         │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐    │         │
│  │  │   Auth   │  │  Routes  │  │   Zod    │    │         │
│  │  │  Layer   │  │   REST   │  │ Validator│    │         │
│  │  └──────────┘  └──────────┘  └──────────┘    │         │
│  └────────────────────────────────────────────────┘         │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────┐         │
│  │          CLOUDFLARE D1 (SQLite)                │         │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐    │         │
│  │  │  Users   │  │Documents │  │  Types   │    │         │
│  │  └──────────┘  └──────────┘  └──────────┘    │         │
│  └────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Stack Completa

| Camada | Tecnologia | Versão | Função |
|--------|-----------|--------|--------|
| **Frontend** | React | 19.0 | UI Library |
| **Routing** | React Router | 7.0 | SPA Navigation |
| **Styling** | Tailwind CSS | 3.4 | Utility-first CSS |
| **Build Tool** | Vite | 7.1 | Fast bundler |
| **Backend** | Hono | 4.7.7 | Web framework |
| **Runtime** | Cloudflare Workers | - | Edge computing |
| **Database** | Cloudflare D1 | - | SQLite distributed |
| **Validation** | Zod | 3.x | Schema validation |
| **Language** | TypeScript | 5.8 | Type safety |
| **Storage** | Cloudflare R2 | - | Object storage (futuro) |

---

## Backend - Cloudflare Worker

### Estrutura do Worker

**Arquivo principal**: `src/worker/index.ts`

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";

interface Env {
  DB: D1Database;           // Cloudflare D1 binding
  SEAP_ADMIN_PASSWORD: string;
  SEAP_USER_PASSWORD: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware global
app.use("*", cors());

// Rotas...
export default app;
```

### Endpoints Disponíveis

#### Autenticação

```typescript
POST /api/auth/login
Body: { matricula: string, password: string }
Response: { success: true, user: User, message: string }

POST /api/auth/login-legacy
Body: { password: string }
Response: { success: true, userType: "admin" | "user" }

POST /api/auth/logout
Body: { matricula: string, userId: number }
Response: { success: true, message: string }
```

#### Documentos

```typescript
GET /api/documents
Response: Document[]

POST /api/documents
Body: CreateDocumentSchema
Response: { success: true, document: Document }

PUT /api/documents/:id
Body: UpdateDocumentSchema
Response: { success: true }

PATCH /api/documents/:id/status
Body: { status: "Em Andamento" | "Concluído" | "Arquivado" }
Response: { success: true }

DELETE /api/documents/:id
Response: { success: true }
```

#### Tipos de Documentos

```typescript
GET /api/document-types
Response: DocumentType[]

POST /api/document-types
Body: { name: string, color: string }
Response: { success: true, type: DocumentType }

PUT /api/document-types/:id
Body: { name: string, color: string, is_active: boolean }
Response: { success: true }

DELETE /api/document-types/:id
Response: { success: true }
```

#### Backup e Restauração

```typescript
GET /api/admin/export-backup
Response: {
  metadata: {
    exportDate: string;
    systemName: string;
    version: string;
    totalRecords: { users: number; documents: number; ... };
  };
  data: {
    users: User[];
    documents: Document[];
    documentTypes: DocumentType[];
    documentAssignees: DocumentAssignee[];
    accessLogs: AccessLog[];
    passwordUsage: PasswordUsage[];
  };
}

POST /api/admin/import-backup
Body: {
  backup: BackupStructure;
  clearBeforeImport: boolean;
}
Response: {
  success: true;
  message: string;
  imported: { users: number; documents: number; ... };
}
```

### Validação com Zod

Todos os endpoints usam Zod para validação:

```typescript
app.post("/api/documents",
  zValidator("json", z.object({
    title: z.string(),
    type: z.string(),
    status: z.enum(["Em Andamento", "Concluído", "Arquivado"]),
    // ...
  })),
  async (c) => {
    const data = c.req.valid("json"); // Dados já validados
    // ...
  }
);
```

### Queries no D1

```typescript
// Query simples
const user = await c.env.DB
  .prepare("SELECT * FROM users WHERE id = ?")
  .bind(userId)
  .first();

// Query com múltiplos resultados
const result = await c.env.DB
  .prepare("SELECT * FROM documents")
  .all();
const documents = result.results;

// Query com JOIN
const docs = await c.env.DB
  .prepare(`
    SELECT d.*, u.name as assigned_user_name
    FROM documents d
    LEFT JOIN users u ON d.assigned_to = u.id
  `)
  .all();
```

---

## Frontend - React Application

### Estrutura de Componentes

```
src/react-app/
├── components/
│   ├── Layout.tsx                  # Layout principal com sidebar
│   ├── ProtectedRoute.tsx          # HOC para rotas protegidas
│   ├── DocumentTypesManager.tsx    # Modal de gerenciamento de tipos
│   ├── DocumentAssigneesManager.tsx # Modal de gerenciamento de responsáveis
│   ├── ProductivityCharts.tsx      # Componente de gráficos
│   └── PDFReportGenerator.tsx      # Gerador de PDF
├── pages/
│   ├── Login.tsx                   # Tela de login dual
│   ├── Home.tsx                    # Dashboard
│   ├── Documents.tsx               # CRUD de documentos
│   ├── Users.tsx                   # CRUD de usuários
│   ├── Reports.tsx                 # Relatórios de produtividade
│   └── Settings.tsx                # Configurações e backup
├── hooks/
│   └── useProductivityReport.ts    # Hook customizado
└── main.tsx                        # Entry point
```

### Roteamento com React Router 7

```typescript
// src/react-app/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/documents" element={
          <ProtectedRoute>
            <Documents />
          </ProtectedRoute>
        } />
        {/* ... outras rotas */}
      </Routes>
    </BrowserRouter>
  );
}
```

### Sistema de Autenticação no Frontend

#### ProtectedRoute Component

```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem('seap_authenticated') === 'true';
  const loginTime = localStorage.getItem('seap_login_time');

  // Verificar expiração de sessão (24 horas)
  if (isAuthenticated && loginTime) {
    const loginDate = new Date(loginTime);
    const now = new Date();
    const hoursSinceLogin = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLogin > 24) {
      // Sessão expirada
      localStorage.removeItem('seap_authenticated');
      return <Navigate to="/" />;
    }
  }

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}
```

#### Storage de Dados do Usuário

```typescript
// Após login bem-sucedido
localStorage.setItem('seap_authenticated', 'true');
localStorage.setItem('seap_login_time', new Date().toISOString());

// Login individual
localStorage.setItem('seap_user_data', JSON.stringify({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  matricula: user.matricula
}));

// Login legacy
localStorage.setItem('seap_user_type', 'admin'); // ou 'user'
```

### Gerenciamento de Estado

O sistema usa **React State Hooks** para gerenciamento local:

```typescript
function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    const response = await fetch('/api/documents');
    const data = await response.json();
    setDocuments(data);
    setLoading(false);
  };

  // ...
}
```

### Comunicação com API

```typescript
// GET Request
const response = await fetch('/api/documents');
const documents = await response.json();

// POST Request
const response = await fetch('/api/documents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(documentData)
});

// PUT Request
const response = await fetch(`/api/documents/${id}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updatedData)
});

// DELETE Request
await fetch(`/api/documents/${id}`, {
  method: 'DELETE'
});
```

---

## Banco de Dados - D1 SQLite

### Schema Completo

#### Tabela: users

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'user',          -- 'admin' ou 'user'
  matricula TEXT UNIQUE,             -- Identificador único
  password TEXT,                     -- Senha (texto plano por enquanto)
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_matricula ON users(matricula);
CREATE INDEX idx_users_active ON users(is_active);
```

#### Tabela: document_assignees

```sql
CREATE TABLE document_assignees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  department TEXT,                   -- Departamento
  position TEXT,                     -- Cargo
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabela: document_types

```sql
CREATE TABLE document_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',     -- Cor hexadecimal
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabela: documents

```sql
CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'Em Andamento',  -- 'Em Andamento', 'Concluído', 'Arquivado'
  assigned_to INTEGER,                  -- FK para users (opcional)
  document_assignee_id INTEGER,         -- FK para document_assignees (opcional)
  deadline DATETIME,
  description TEXT,
  priority TEXT DEFAULT 'normal',       -- 'baixa', 'normal', 'alta'
  completion_date DATETIME,
  process_number TEXT,                  -- Número do processo judicial
  prisoner_name TEXT,                   -- Nome do preso
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (document_assignee_id) REFERENCES document_assignees(id)
);

CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_assigned_to ON documents(assigned_to);
CREATE INDEX idx_documents_assignee ON documents(document_assignee_id);
```

#### Tabela: access_logs

```sql
CREATE TABLE access_logs (
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

CREATE INDEX idx_access_logs_matricula ON access_logs(matricula);
CREATE INDEX idx_access_logs_session ON access_logs(session_active);
```

#### Tabela: password_usage

```sql
CREATE TABLE password_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  password_type TEXT NOT NULL,      -- 'admin' ou 'user'
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Relacionamentos

```
users (1) ──────< (N) documents [assigned_to]
document_assignees (1) ──────< (N) documents [document_assignee_id]
users (1) ──────< (N) access_logs [user_id]
```

**Importante**: Um documento pode ter **OU** `assigned_to` **OU** `document_assignee_id`, mas não ambos.

---

## Sistema de Autenticação

### Fluxo de Login Individual

```
1. Usuário insere matrícula + senha
2. POST /api/auth/login
3. Backend valida:
   - Usuário existe na tabela users?
   - Senha correta?
   - Usuário está ativo?
4. Se válido:
   - Registra access_log
   - Retorna dados do usuário
5. Frontend armazena:
   - seap_authenticated = true
   - seap_login_time = timestamp
   - seap_user_data = JSON do usuário
6. Redireciona para /home
```

### Fluxo de Login Legacy

```
1. Usuário insere senha compartilhada
2. POST /api/auth/login-legacy
3. Backend compara com variáveis de ambiente:
   - SEAP_ADMIN_PASSWORD
   - SEAP_USER_PASSWORD
4. Se válido:
   - Registra password_usage
   - Retorna userType
5. Frontend armazena:
   - seap_authenticated = true
   - seap_user_type = "admin" ou "user"
6. Redireciona para /home
```

### Fluxo de Logout

```
1. Usuário clica em "Sair"
2. POST /api/auth/logout
3. Backend atualiza access_logs:
   - logout_time = agora
   - session_active = false
4. Frontend limpa localStorage:
   - Remove seap_authenticated
   - Remove seap_user_data
   - Remove seap_user_type
5. Redireciona para /
```

---

## Sistema de Backup/Restauração

### Arquitetura do Sistema de Backup

```
┌────────────────────────────────────────────────┐
│              FRONTEND                          │
│  ┌──────────────────────────────────────┐     │
│  │  Settings.tsx                        │     │
│  │  ┌────────────┐  ┌────────────┐     │     │
│  │  │  Backup    │  │  Restore   │     │     │
│  │  │  Button    │  │  Button    │     │     │
│  │  └────────────┘  └────────────┘     │     │
│  └──────────────────────────────────────┘     │
└────────────────────────────────────────────────┘
           ↓                    ↑
    GET /export          POST /import
           ↓                    ↑
┌────────────────────────────────────────────────┐
│              BACKEND                           │
│  ┌──────────────────────────────────────┐     │
│  │  Worker (src/worker/index.ts)        │     │
│  │  ┌────────────┐  ┌────────────┐     │     │
│  │  │  Export    │  │  Import    │     │     │
│  │  │  Handler   │  │  Handler   │     │     │
│  │  └────────────┘  └────────────┘     │     │
│  └──────────────────────────────────────┘     │
└────────────────────────────────────────────────┘
           ↓                    ↑
      Read all             Write all
           ↓                    ↑
┌────────────────────────────────────────────────┐
│          CLOUDFLARE D1 DATABASE                │
│  ┌────────┬────────┬────────┬────────┐        │
│  │ users  │  docs  │ types  │  logs  │        │
│  └────────┴────────┴────────┴────────┘        │
└────────────────────────────────────────────────┘
```

### Estrutura do Backup JSON

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
    "users": [
      {
        "id": 1,
        "name": "Admin",
        "email": "admin@example.com",
        "role": "admin",
        "matricula": "123456",
        "password": "senha123",
        "is_active": 1,
        "created_at": "2025-01-01T00:00:00.000Z",
        "updated_at": "2025-01-01T00:00:00.000Z"
      }
    ],
    "documentAssignees": [...],
    "documentTypes": [...],
    "documents": [...],
    "accessLogs": [...],
    "passwordUsage": [...]
  }
}
```

### Fluxo de Exportação

```typescript
// 1. Frontend chama endpoint
const response = await fetch('/api/admin/export-backup');
const backupData = await response.json();

// 2. Backend executa queries
const [users, documents, types, ...] = await Promise.all([
  c.env.DB.prepare("SELECT * FROM users").all(),
  c.env.DB.prepare("SELECT * FROM documents").all(),
  c.env.DB.prepare("SELECT * FROM document_types").all(),
  // ...
]);

// 3. Monta objeto de backup
const backup = {
  metadata: { exportDate, systemName, version, totalRecords },
  data: { users, documents, documentTypes, ... }
};

// 4. Frontend cria Blob e faz download
const blob = new Blob([JSON.stringify(backupData, null, 2)],
  { type: 'application/json' });
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `seap-backup-${date}.json`;
a.click();
```

### Fluxo de Importação

```typescript
// 1. Frontend lê arquivo
const text = await file.text();
const backup = JSON.parse(text);

// 2. Valida estrutura
if (!backup.metadata || !backup.data) {
  throw new Error('Estrutura inválida');
}

// 3. Envia para backend
await fetch('/api/admin/import-backup', {
  method: 'POST',
  body: JSON.stringify({ backup, clearBeforeImport: true })
});

// 4. Backend limpa dados existentes
await c.env.DB.prepare("DELETE FROM documents").run();
await c.env.DB.prepare("DELETE FROM users").run();
// ...

// 5. Backend insere dados na ordem correta
// Ordem importa por causa de foreign keys:
// 1. users, document_assignees, document_types (tabelas base)
// 2. documents (depende de users e document_assignees)
// 3. access_logs (depende de users)
// 4. password_usage

for (const user of backup.data.users) {
  await c.env.DB.prepare(`
    INSERT INTO users (id, name, email, ...)
    VALUES (?, ?, ?, ...)
  `).bind(...).run();
}
```

---

## Fluxos de Dados

### Criar Documento

```
┌─────────┐   POST /api/documents    ┌─────────┐
│Frontend │ ────────────────────────> │ Backend │
│         │   { title, type, ... }   │         │
└─────────┘                           └─────────┘
                                           │
                                           │ Valida com Zod
                                           │
                                           ↓
                                      ┌─────────┐
                                      │   D1    │
                                      │Database │
                                      └─────────┘
                                           │
                                           │ INSERT INTO documents
                                           │
┌─────────┐   { success, document }  ┌─────────┐
│Frontend │ <──────────────────────── │ Backend │
│         │                           │         │
└─────────┘                           └─────────┘
     │
     │ Atualiza lista local
     ↓
┌─────────┐
│  State  │
│ Update  │
└─────────┘
```

### Gerar Relatório de Produtividade

```
┌─────────┐   GET /api/reports/productivity   ┌─────────┐
│Frontend │ ─────────────────────────────────> │ Backend │
└─────────┘                                    └─────────┘
                                                     │
                                                     │ Query complexa
                                                     ↓
                                               ┌─────────┐
                                               │   D1    │
                                               │  (5+ queries) │
                                               └─────────┘
                                                     │
                                                     │ Processa dados
                                                     │ Calcula estatísticas
                                                     │ Agrupa por período
                                                     ↓
┌─────────┐   { stats, byUser, byType, ... }  ┌─────────┐
│Frontend │ <───────────────────────────────── │ Backend │
│         │                                    │         │
└─────────┘                                    └─────────┘
     │
     │ Renderiza gráficos
     ↓
┌──────────┐
│ Recharts │
│  Charts  │
└──────────┘
```

---

## Segurança

### Vulnerabilidades Mitigadas

#### 1. SQL Injection ✅

**Problema**: Usuário pode injetar SQL malicioso

**Solução**: Usar prepared statements com bind

```typescript
// ❌ VULNERÁVEL
await c.env.DB.prepare(`SELECT * FROM users WHERE id = ${userId}`).all();

// ✅ SEGURO
await c.env.DB.prepare("SELECT * FROM users WHERE id = ?")
  .bind(userId)
  .all();
```

#### 2. XSS (Cross-Site Scripting) ✅

**Problema**: Código JavaScript malicioso no input

**Solução**: React escapa automaticamente strings no JSX

```typescript
// ✅ SEGURO - React escapa automaticamente
<div>{userInput}</div>

// ❌ PERIGOSO - Desabilita escape
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

#### 3. CORS (Cross-Origin Resource Sharing) ✅

**Solução**: Configurado no backend

```typescript
import { cors } from "hono/cors";
app.use("*", cors());
```

#### 4. Senhas em Texto Plano ⚠️

**Status**: **A IMPLEMENTAR**

**Problema**: Senhas armazenadas sem hash

**Solução Futura**: Usar bcrypt ou argon2

```typescript
// A IMPLEMENTAR
import bcrypt from 'bcryptjs';

// Ao criar usuário
const hashedPassword = await bcrypt.hash(password, 10);

// Ao validar
const isValid = await bcrypt.compare(password, user.password);
```

### Controle de Acesso

#### Rotas Protegidas

```typescript
// Frontend: ProtectedRoute
<Route path="/settings" element={
  <ProtectedRoute requireAdmin={true}>
    <Settings />
  </ProtectedRoute>
} />

// Backend: Middleware (A IMPLEMENTAR)
app.use('/api/admin/*', async (c, next) => {
  // Verificar token/sessão
  // Verificar role = 'admin'
  await next();
});
```

### Auditoria

Todas as ações sensíveis são registradas:

- ✅ Logins (sucesso e falha)
- ✅ Logouts
- ✅ IP e User-Agent
- ✅ Uso de senhas legacy
- ⚠️ CRUD de documentos (A IMPLEMENTAR)
- ⚠️ CRUD de usuários (A IMPLEMENTAR)

---

## Performance e Otimizações

### Backend

#### 1. Queries Otimizadas

```typescript
// Evitar N+1 queries - usar JOIN
const docs = await c.env.DB.prepare(`
  SELECT
    d.*,
    u.name as assigned_user_name,
    a.first_name || ' ' || a.last_name as assigned_assignee_name
  FROM documents d
  LEFT JOIN users u ON d.assigned_to = u.id
  LEFT JOIN document_assignees a ON d.document_assignee_id = a.id
`).all();
```

#### 2. Índices no Banco

```sql
-- Índices para queries frequentes
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_users_matricula ON users(matricula);
```

#### 3. Parallel Queries

```typescript
// Executar queries em paralelo
const [users, documents, types] = await Promise.all([
  c.env.DB.prepare("SELECT * FROM users").all(),
  c.env.DB.prepare("SELECT * FROM documents").all(),
  c.env.DB.prepare("SELECT * FROM document_types").all()
]);
```

### Frontend

#### 1. Code Splitting (Vite)

Vite automaticamente faz code splitting por rota.

#### 2. Lazy Loading de Componentes

```typescript
import { lazy, Suspense } from 'react';

const Reports = lazy(() => import('./pages/Reports'));

<Suspense fallback={<Loading />}>
  <Reports />
</Suspense>
```

#### 3. Memoização

```typescript
import { useMemo } from 'react';

const filteredDocuments = useMemo(() => {
  return documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [documents, searchTerm]);
```

### Cloudflare Edge

- ✅ **Global Distribution**: Worker deployado em 300+ cidades
- ✅ **Low Latency**: < 50ms para maioria dos requests
- ✅ **Auto-scaling**: Escala automaticamente com demanda
- ✅ **DDoS Protection**: Proteção integrada

---

## Troubleshooting

### Problema: Worker não responde

**Sintomas**: Timeout ou 500 error

**Soluções**:
1. Verificar logs no Cloudflare Dashboard
2. Checar se binding D1 está configurado
3. Verificar se variáveis de ambiente existem

```bash
# Verificar bindings
wrangler d1 info DB

# Ver logs em tempo real
wrangler tail
```

### Problema: Banco de dados vazio após deploy

**Causa**: Migrations não executadas

**Solução**:
```bash
# Executar schema
wrangler d1 execute DB --remote --file=schema.sql
```

### Problema: Erro de CORS

**Sintomas**: Blocked by CORS policy

**Solução**: Verificar middleware CORS no backend

```typescript
import { cors } from "hono/cors";
app.use("*", cors());
```

### Problema: Build falha

**Sintomas**: TypeScript errors

**Soluções**:
1. Limpar node_modules e reinstalar
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

2. Verificar tsconfig.json
3. Executar type check isolado
```bash
npx tsc --noEmit
```

### Problema: Session expirou mas usuário ainda logado

**Causa**: localStorage não limpo

**Solução**: Limpar localStorage manualmente
```javascript
localStorage.clear();
```

---

## Melhores Práticas

### Backend

✅ **Sempre use prepared statements**
✅ **Valide todos os inputs com Zod**
✅ **Registre ações sensíveis em logs**
✅ **Use transações para operações múltiplas**
✅ **Trate erros com try/catch**

### Frontend

✅ **Use TypeScript para type safety**
✅ **Valide dados antes de enviar para API**
✅ **Mostre loading states**
✅ **Mostre mensagens de erro amigáveis**
✅ **Limpe formulários após submit**

### Deployment

✅ **Teste em local antes de deploy**
✅ **Use dry-run para validar**
✅ **Faça backup antes de mudanças grandes**
✅ **Monitore logs após deploy**
✅ **Use versionamento semântico**

---

**Última atualização**: Janeiro 2025
**Versão**: 2.0
**Autor**: Sistema SEAP
