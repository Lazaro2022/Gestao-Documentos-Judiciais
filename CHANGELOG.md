# Changelog

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [2.0.0] - 2025-01-24

### 🎉 Adicionado

#### Sistema de Backup e Restauração
- **Exportação de Backup**: Endpoint `GET /api/admin/export-backup` para exportar todos os dados do sistema em JSON
- **Importação de Backup**: Endpoint `POST /api/admin/import-backup` para restaurar dados de arquivo JSON
- **Interface de Backup**: Botões "Fazer Backup Agora" e "Restaurar Backup" em Configurações → Banco de Dados
- **Download Automático**: Arquivo JSON baixado automaticamente com nome `seap-backup-YYYY-MM-DD.json`
- **Validação de Estrutura**: Validação completa da estrutura do backup antes de importar
- **Metadados**: Backup inclui metadata (data, versão, contadores de registros)
- **6 Tabelas Exportadas**:
  - users (usuários de login)
  - document_assignees (responsáveis por documentos)
  - document_types (tipos de documentos)
  - documents (documentos)
  - access_logs (logs de acesso)
  - password_usage (uso de senhas legacy)

#### Documentação
- **BACKUP_GUIDE.md**: Guia completo de uso do sistema de backup/restauração
- **TECHNICAL_DOCS.md**: Documentação técnica completa do sistema
- **CHANGELOG.md**: Este arquivo de histórico de alterações

#### Configuração
- **account_id**: Adicionado `account_id` no `wrangler.json` para especificar conta Cloudflare
- **Repositório Git**: Primeiro commit e push para GitHub

### 🔧 Modificado

- **README.md**: Atualizado com informações sobre backup/restauração
- **Settings.tsx**: Implementação real de backup (anteriormente era simulação)
- **worker/index.ts**: Removido `console.error` para compatibilidade com TypeScript

### 🐛 Corrigido

- **TypeScript Errors**: Corrigido erro de compilação com `console` no worker
- **Build Process**: Build agora passa sem erros (200+ linhas de código adicionadas)

### 📋 Melhorias

- **Portabilidade**: Backups podem ser usados em sistemas clone
- **Segurança**: Backups incluem senhas (armazenar em local seguro)
- **Auditoria**: Metadados incluem informações sobre origem do backup
- **Ordem de Importação**: Importação respeita foreign keys (ordem correta)

---

## [1.0.0] - 2025-10-31

### 🎉 Release Inicial

#### Core Features
- **Sistema de Gestão de Documentos**: CRUD completo de documentos judiciais
- **Tipos Customizáveis**: Criação e gerenciamento de tipos de documentos com cores
- **Duplo Sistema de Autenticação**:
  - Login individual (matrícula + senha)
  - Login legacy (senhas compartilhadas)
- **Gestão de Usuários**: CRUD de usuários com roles (admin/user)
- **Responsáveis por Documentos**: Separação entre usuários de login e responsáveis
- **Controle de Prazos**: Alertas para documentos com deadline vencido
- **Status Workflow**: Em Andamento → Concluído → Arquivado

#### Relatórios e Análises
- **Dashboard**: Visão geral com estatísticas principais
- **Relatórios de Produtividade**:
  - Gráficos semanais (últimas 8 semanas)
  - Gráficos mensais (últimos 12 meses)
  - Gráficos anuais (últimos 3 anos)
  - Produtividade por usuário/responsável
  - Distribuição por tipo de documento
- **Exportação PDF**: Geração de relatórios em PDF

#### Segurança e Auditoria
- **Logs de Acesso**: Registro completo de logins/logouts
- **Rastreamento de IP**: Captura de IP e User-Agent
- **Sessões**: Controle de sessões ativas/inativas
- **Tentativas de Login**: Registro de sucessos e falhas

#### Infraestrutura
- **Frontend**: React 19 + Vite 7 + Tailwind CSS
- **Backend**: Hono 4.7 + Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Cloudflare Workers (edge computing)
- **Build Tool**: Vite com hot module replacement

#### Documentação
- **README.md**: Documentação principal do projeto
- **DEPLOYMENT.md**: Guia completo de deployment
- **CLAUDE.md**: Documentação para desenvolvimento com Claude Code
- **SISTEMA_LOGIN_IMPLEMENTACAO.md**: Detalhes do sistema de autenticação
- **APRESENTACAO_SISTEMA_SEAP.md**: Apresentação executiva

---

## Tipos de Mudanças

- **Adicionado** (`Added`) - para novas funcionalidades
- **Modificado** (`Changed`) - para mudanças em funcionalidades existentes
- **Descontinuado** (`Deprecated`) - para funcionalidades que serão removidas
- **Removido** (`Removed`) - para funcionalidades removidas
- **Corrigido** (`Fixed`) - para correções de bugs
- **Segurança** (`Security`) - para vulnerabilidades corrigidas

---

## Roadmap - Próximas Versões

### [2.1.0] - Planejado

#### Segurança
- [ ] Hash de senhas com bcrypt/argon2
- [ ] Tokens JWT para autenticação
- [ ] Rate limiting para APIs
- [ ] 2FA (Two-Factor Authentication)

#### Features
- [ ] Upload de arquivos (Cloudflare R2)
- [ ] Assinatura digital de documentos
- [ ] Notificações por email
- [ ] Integração com calendário
- [ ] Busca avançada com filtros complexos

#### Melhorias
- [ ] Dark mode
- [ ] PWA (Progressive Web App)
- [ ] Notificações push
- [ ] Exportação Excel
- [ ] Temas customizáveis

#### Performance
- [ ] Cache de queries frequentes
- [ ] Lazy loading de imagens
- [ ] Optimistic UI updates
- [ ] Service Worker para offline

---

## Links Úteis

- **Repositório**: https://github.com/Lazaro2022/Gestao-Documentos-Judiciais
- **Deploy**: https://gestao-documentos-judiciais.jl-lazaroc.workers.dev
- **Issues**: https://github.com/Lazaro2022/Gestao-Documentos-Judiciais/issues
- **Discord Mocha**: https://discord.gg/shDEGBSe2d

---

**Mantido por**: Equipe SEAP
**Licença**: Mocha Platform
