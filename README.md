# 📄 SEAP - Sistema de Gestão de Documentos Judiciais

> Sistema completo de gestão de documentos judiciais para unidades prisionais e órgãos judiciários, com controle de prazos, responsáveis, tipos de documentos e relatórios de produtividade.

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?logo=cloudflare)](https://workers.cloudflare.com/)
[![React](https://img.shields.io/badge/React-19.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Hono](https://img.shields.io/badge/Hono-4.7-orange)](https://hono.dev/)

---

## 🌟 Visão Geral

O **SEAP** é um sistema web moderno para gerenciamento de documentos judiciais, desenvolvido especificamente para unidades prisionais e órgãos da justiça. Permite controle completo de documentos, prazos, responsáveis e geração de relatórios de produtividade.

### Características Principais

✅ **Gestão de Documentos**: Criação, edição, arquivamento e acompanhamento de documentos judiciais
✅ **Controle de Prazos**: Alertas visuais para documentos com prazos vencidos
✅ **Tipos Customizáveis**: Crie tipos de documentos personalizados com cores próprias
✅ **Duplo Sistema de Autenticação**: Login individual (matrícula/senha) + Login compartilhado (legacy)
✅ **Responsáveis por Documentos**: Separação entre usuários de login e responsáveis por documentos
✅ **Relatórios Detalhados**: Gráficos e estatísticas de produtividade (semanal, mensal, anual)
✅ **Logs de Acesso**: Auditoria completa de logins e acessos ao sistema
✅ **Backup/Restauração**: Sistema completo de exportação e importação de dados em JSON
✅ **Interface Moderna**: Design responsivo e intuitivo com Tailwind CSS
✅ **Edge Computing**: Deploy global com Cloudflare Workers (baixa latência)

---

## 🎥 Screenshots

### Tela de Login
![Login](docs/screenshots/login.png)

### Dashboard Principal
![Dashboard](docs/screenshots/dashboard.png)

### Gestão de Documentos
![Documentos](docs/screenshots/documents.png)

### Relatórios de Produtividade
![Relatórios](docs/screenshots/reports.png)

---

## 🚀 Deploy Rápido

### Pré-requisitos

- Node.js >= 18.x
- Conta no Cloudflare (gratuita)
- 10 minutos do seu tempo ⏱️

### Passos Rápidos

```bash
# 1. Clonar o repositório
git clone https://github.com/seu-usuario/gestao-documentos-judiciais.git
cd gestao-documentos-judiciais

# 2. Instalar dependências
npm install --legacy-peer-deps

# 3. Autenticar no Cloudflare
export CLOUDFLARE_API_TOKEN="seu-token-aqui"

# 4. Criar banco de dados
wrangler d1 create gestao-documentos-judiciais
# Copiar o database_id retornado e colar no wrangler.json

# 5. Migrar banco de dados
wrangler d1 execute DB --remote --file=schema.sql

# 6. Configurar senhas
echo "Guardiao" | wrangler secret put SEAP_ADMIN_PASSWORD
echo "Usuario123" | wrangler secret put SEAP_USER_PASSWORD

# 7. Build e deploy
npm run build
wrangler deploy
```

✅ **Pronto!** Sua aplicação estará no ar em: `https://[nome-do-worker].[sua-conta].workers.dev`

📖 **Guia Completo**: Veja [DEPLOYMENT.md](./DEPLOYMENT.md) para instruções detalhadas.

---

## 🛠️ Stack Tecnológica

### Frontend
- **React 19** - Biblioteca UI moderna
- **React Router 7** - Roteamento SPA
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **Recharts / Chart.js** - Gráficos e visualizações
- **Vite 7** - Build tool ultra-rápido
- **Lucide React** - Ícones modernos

### Backend
- **Hono 4.7** - Web framework minimalista (alternativa ao Express)
- **Cloudflare Workers** - Serverless edge computing
- **Cloudflare D1** - Banco de dados SQLite distribuído
- **Zod** - Validação de schemas e tipos
- **TypeScript** - Type safety end-to-end

### Infraestrutura
- **Cloudflare Workers** - Deploy global em 300+ cidades
- **Cloudflare D1** - Database SQL na edge
- **Cloudflare R2** - Object storage (opcional, para uploads)

---

## 📂 Estrutura do Projeto

```
gestao-documentos-judiciais/
├── src/
│   ├── react-app/              # Frontend React
│   │   ├── components/         # Componentes reutilizáveis
│   │   │   ├── Layout.tsx                      # Layout principal com sidebar
│   │   │   ├── ProtectedRoute.tsx              # Guarda de autenticação
│   │   │   ├── DocumentTypesManager.tsx        # Gerenciador de tipos
│   │   │   ├── DocumentAssigneesManager.tsx    # Gerenciador de responsáveis
│   │   │   └── ProductivityCharts.tsx          # Gráficos de produtividade
│   │   ├── pages/              # Páginas do sistema
│   │   │   ├── Login.tsx       # Tela de login (dual mode)
│   │   │   ├── Home.tsx        # Dashboard principal
│   │   │   ├── Documents.tsx   # Gestão de documentos
│   │   │   ├── Users.tsx       # Gestão de usuários
│   │   │   ├── Reports.tsx     # Relatórios de produtividade
│   │   │   └── Settings.tsx    # Configurações do sistema
│   │   └── hooks/              # React hooks customizados
│   ├── worker/                 # Backend Cloudflare Worker
│   │   └── index.ts            # API Hono (rotas REST)
│   └── shared/                 # Código compartilhado
│       └── types.ts            # Schemas Zod + tipos TypeScript
├── schema.sql                  # Schema do banco de dados D1
├── wrangler.json              # Configuração Cloudflare Workers
├── package.json               # Dependências npm
├── tsconfig.json              # Configuração TypeScript
├── tailwind.config.js         # Configuração Tailwind CSS
├── vite.config.ts             # Configuração Vite
├── DEPLOYMENT.md              # 📖 Guia completo de deploy
├── CLAUDE.md                  # Documentação para Claude Code
├── SISTEMA_LOGIN_IMPLEMENTACAO.md  # Documentação do sistema de login
└── README.md                  # Este arquivo
```

---

## 📚 Documentação

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guia completo passo a passo para clonar e deployar o projeto
- **[BACKUP_GUIDE.md](./BACKUP_GUIDE.md)** - Guia completo de backup e restauração de dados
- **[CLAUDE.md](./CLAUDE.md)** - Documentação técnica para desenvolvimento com Claude Code
- **[SISTEMA_LOGIN_IMPLEMENTACAO.md](./SISTEMA_LOGIN_IMPLEMENTACAO.md)** - Detalhes do sistema de autenticação dual
- **[APRESENTACAO_SISTEMA_SEAP.md](./APRESENTACAO_SISTEMA_SEAP.md)** - Apresentação executiva do sistema

---

## 🔐 Sistema de Autenticação

O SEAP possui um **sistema dual de autenticação**:

### 1. Login Individual (Recomendado)
- Cada usuário tem **matrícula** e **senha** próprios
- Controle granular de permissões (admin/user)
- Logs individualizados de acesso
- Ideal para rastreabilidade

### 2. Login Legacy (Compartilhado)
- Senhas compartilhadas por nível de acesso
- **Admin**: `Guardiao` (configurável)
- **User**: `Usuario123` (configurável)
- Útil para transição de sistemas antigos

📖 Veja mais em: [SISTEMA_LOGIN_IMPLEMENTACAO.md](./SISTEMA_LOGIN_IMPLEMENTACAO.md)

---

## 🗄️ Banco de Dados

### Tabelas Principais

1. **`users`** - Usuários de login (autenticação individual)
2. **`document_assignees`** - Responsáveis por documentos (não são usuários)
3. **`document_types`** - Tipos de documentos customizáveis
4. **`documents`** - Documentos do sistema
5. **`access_logs`** - Logs de acesso e auditoria
6. **`password_usage`** - Rastreamento de senhas legacy

### Diferença Importante

⚠️ **Usuários de Login** ≠ **Responsáveis por Documentos**

- **Usuários** (`users`): Pessoas que fazem **login no sistema**
- **Responsáveis** (`document_assignees`): Pessoas **responsáveis por documentos** (podem ou não ter login)

Um documento pode ser atribuído a:
- Um **usuário de login** (`assigned_to`) OU
- Um **responsável** (`document_assignee_id`)

---

## 🌐 API Endpoints

### Autenticação
```
POST /api/auth/login          # Login individual (matrícula + senha)
POST /api/auth/login-legacy   # Login compartilhado (senha única)
POST /api/auth/logout         # Logout com registro
```

### Documentos
```
GET    /api/documents         # Listar todos
POST   /api/documents         # Criar novo
PUT    /api/documents/:id     # Atualizar
PATCH  /api/documents/:id/status  # Atualizar status
DELETE /api/documents/:id     # Excluir
```

### Tipos de Documentos
```
GET    /api/document-types    # Listar tipos
POST   /api/document-types    # Criar tipo
PUT    /api/document-types/:id    # Atualizar tipo
DELETE /api/document-types/:id    # Excluir tipo
```

### Usuários
```
GET    /api/users             # Listar usuários
POST   /api/users             # Criar usuário
PUT    /api/users/:id         # Atualizar usuário
DELETE /api/users/:id         # Excluir usuário
```

### Relatórios
```
GET    /api/reports/productivity  # Relatório completo de produtividade
```

### Backup e Restauração (Admin)
```
GET    /api/admin/export-backup   # Exportar todos os dados em JSON
POST   /api/admin/import-backup   # Importar/restaurar dados de backup
GET    /api/admin/access-logs     # Visualizar logs de acesso
DELETE /api/admin/clear-*          # Limpeza de dados (perigoso)
DELETE /api/admin/reset-system     # Reset completo do sistema
```

📖 Documentação completa da API: [CLAUDE.md](./CLAUDE.md#api-routes)
📖 Guia de Backup: [BACKUP_GUIDE.md](./BACKUP_GUIDE.md)

---

## 💻 Desenvolvimento Local

### Executar em Modo Dev

```bash
# Instalar dependências
npm install --legacy-peer-deps

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:5173

### Banco de Dados Local

```bash
# Executar migrações localmente
wrangler d1 execute DB --local --file=schema.sql

# Executar query no banco local
wrangler d1 execute DB --local --command="SELECT * FROM users"
```

### Lint e Type Check

```bash
# Executar ESLint
npm run lint

# Type check TypeScript
npm run check
```

---

## 🔧 Configuração

### Variáveis de Ambiente (Secrets)

As seguintes variáveis devem ser configuradas como **Cloudflare Secrets**:

```bash
# Senha de administrador (login legacy)
wrangler secret put SEAP_ADMIN_PASSWORD

# Senha de usuário (login legacy)
wrangler secret put SEAP_USER_PASSWORD
```

### Personalização

#### Alterar Nome do Worker
Edite `wrangler.json`:
```json
{
  "name": "seap-sua-unidade"
}
```

#### Adicionar Campos Customizados
Edite `src/shared/types.ts` para adicionar novos campos aos schemas Zod.

---

## 📊 Funcionalidades Detalhadas

### Gestão de Documentos

- ✅ Criar documentos com título, tipo, responsável, prazo, descrição
- ✅ Campos específicos: Número do Processo, Nome do Preso
- ✅ Prioridades: Baixa, Normal, Alta
- ✅ Status: Em Andamento → Concluído → Arquivado
- ✅ Alertas visuais para documentos atrasados
- ✅ Busca por título, descrição, processo, nome do preso
- ✅ Filtros por status e tipo

### Relatórios de Produtividade

- 📊 Estatísticas gerais: Total, concluídos, em andamento, atrasados
- 📊 Taxa de conclusão percentual
- 📊 Gráficos semanais (últimas 8 semanas)
- 📊 Gráficos mensais (últimos 12 meses)
- 📊 Gráficos anuais (últimos 3 anos)
- 📊 Produtividade por usuário/responsável
- 📊 Distribuição por tipo de documento
- 📊 Exportação para PDF

### Gestão de Usuários

- 👤 Criar usuários com matrícula única
- 👤 Definir roles: Admin ou User
- 👤 Ativar/desativar usuários
- 👤 Editar informações
- 👤 Excluir (com validação de documentos atribuídos)

### Logs de Acesso

- 📝 Registro de todos os logins (sucesso e falha)
- 📝 IP e User-Agent capturados
- 📝 Tempo de login e logout
- 📝 Sessões ativas/inativas
- 📝 Auditoria completa

### Backup e Restauração

- 💾 Exportação completa de dados em JSON
- 💾 Download automático de arquivo de backup
- 💾 Importação/restauração de backup
- 💾 6 tabelas exportadas: users, documents, document_types, document_assignees, access_logs, password_usage
- 💾 Validação de estrutura de backup
- 💾 Metadados incluem: data, versão, contadores
- 💾 Portabilidade: use em sistemas clone
- 💾 Interface simples em Configurações → Banco de Dados

📖 **Guia Completo**: [BACKUP_GUIDE.md](./BACKUP_GUIDE.md)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto foi criado usando [Mocha](https://getmocha.com).

Para dúvidas ou suporte, junte-se à comunidade: [Discord](https://discord.gg/shDEGBSe2d)

---

## 🙏 Agradecimentos

- **Mocha.com** - Plataforma de criação de apps
- **Cloudflare** - Infraestrutura edge computing
- **Hono** - Framework web minimalista
- **React Team** - Biblioteca UI incrível

---

## 📞 Suporte

- 📖 Documentação: [DEPLOYMENT.md](./DEPLOYMENT.md)
- 💬 Discord Mocha: https://discord.gg/shDEGBSe2d
- 🐛 Issues: [GitHub Issues](../../issues)
- 📧 Email: [seu-email@exemplo.com]

---

**Desenvolvido com ❤️ para a justiça brasileira**
