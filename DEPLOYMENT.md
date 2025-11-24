# 🚀 Guia de Deploy - SEAP Sistema de Gestão de Documentos Judiciais

Este documento fornece instruções completas para clonar e deployar uma nova instância deste projeto em qualquer conta do Cloudflare Workers.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Clonagem do Projeto](#clonagem-do-projeto)
3. [Configuração da Conta Cloudflare](#configuração-da-conta-cloudflare)
4. [Criação dos Recursos na Cloudflare](#criação-dos-recursos-na-cloudflare)
5. [Configuração Local do Projeto](#configuração-local-do-projeto)
6. [Migração do Banco de Dados](#migração-do-banco-de-dados)
7. [Configuração de Secrets](#configuração-de-secrets)
8. [Build e Deploy](#build-e-deploy)
9. [Primeiro Acesso](#primeiro-acesso)
10. [Troubleshooting](#troubleshooting)

---

## 1. Pré-requisitos

### Software Necessário

- **Node.js** >= 18.x (recomendado: versão LTS mais recente)
- **npm** >= 9.x
- **Git** (para clonar o repositório)
- **Wrangler CLI** >= 4.x (será instalado via npm)

### Conta Cloudflare

- Conta gratuita ou paga do Cloudflare
- Acesso ao dashboard: https://dash.cloudflare.com
- Email e senha da conta

### Verificar Instalações

```bash
# Verificar Node.js
node --version
# Deve retornar: v18.x.x ou superior

# Verificar npm
npm --version
# Deve retornar: 9.x.x ou superior

# Verificar Git
git --version
# Deve retornar: git version 2.x.x ou superior
```

---

## 2. Clonagem do Projeto

### Opção A: Clone via Git (Recomendado)

```bash
# Clonar o repositório
git clone [URL_DO_REPOSITORIO]

# Entrar na pasta do projeto
cd gestao-documentos-judiciais
```

### Opção B: Download ZIP

1. Baixe o projeto como ZIP
2. Extraia para uma pasta local
3. Abra o terminal na pasta extraída

### Estrutura Esperada

Após clonar, você deve ter esta estrutura:

```
gestao-documentos-judiciais/
├── src/
│   ├── react-app/        # Frontend React
│   ├── worker/           # Backend Hono (Cloudflare Worker)
│   └── shared/           # Tipos compartilhados
├── schema.sql            # Schema do banco de dados
├── wrangler.json         # Configuração do Cloudflare Workers
├── package.json          # Dependências do projeto
├── DEPLOYMENT.md         # Este arquivo
├── CLAUDE.md            # Documentação para Claude Code
└── README.md            # Documentação geral
```

---

## 3. Configuração da Conta Cloudflare

### 3.1. Login no Cloudflare Dashboard

1. Acesse: https://dash.cloudflare.com
2. Faça login com sua conta
3. Anote o **Account ID**:
   - Visível na URL: `https://dash.cloudflare.com/[ACCOUNT_ID]/...`
   - Ou em: Account Settings → Account ID

### 3.2. Criar API Token

**IMPORTANTE**: O token precisa ter permissões específicas.

1. Vá para: **My Profile** → **API Tokens**
2. Clique em **"Create Token"**
3. Use o template **"Edit Cloudflare Workers"** OU crie custom com:

**Permissões Necessárias**:
```
Account:
  - Workers Scripts: Edit
  - D1: Edit
  - Account Settings: Read
  - R2: Edit (opcional, só se for usar upload de arquivos)
```

4. **Account Resources**: Selecione a conta específica que você quer usar
5. **Client IP Address Filtering**: Deixe em branco (ou restrinja se preferir)
6. **TTL**: Defina validade do token (recomendado: 1 ano)
7. Clique em **"Continue to summary"** → **"Create Token"**
8. **COPIE O TOKEN** (ele só será mostrado uma vez!)

```
Exemplo de token:
K8_1Xzj0vZED89ej1AwQ4vH_yCCrUP6azpQxKd-C
```

⚠️ **GUARDE ESTE TOKEN EM LOCAL SEGURO!**

---

## 4. Criação dos Recursos na Cloudflare

### 4.1. Autenticar Wrangler com API Token

**Opção A: Variável de Ambiente (Recomendado)**

```bash
# Windows PowerShell
$env:CLOUDFLARE_API_TOKEN = "SEU_TOKEN_AQUI"

# Windows CMD
set CLOUDFLARE_API_TOKEN=SEU_TOKEN_AQUI

# Linux/macOS
export CLOUDFLARE_API_TOKEN="SEU_TOKEN_AQUI"
```

**Opção B: Login OAuth**

```bash
wrangler login
# Abrirá o navegador para autenticação
```

### 4.2. Verificar Conta Autenticada

```bash
wrangler whoami
```

Deve mostrar:
```
Account Name: Seu Email's Account
Account ID: [seu-account-id]
```

### 4.3. Criar Banco de Dados D1

```bash
# Criar o banco D1
wrangler d1 create gestao-documentos-judiciais

# O comando retornará informações como:
# ✅ Successfully created DB 'gestao-documentos-judiciais'
#
# [[d1_databases]]
# binding = "DB"
# database_name = "gestao-documentos-judiciais"
# database_id = "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
```

⚠️ **COPIE O `database_id` retornado!** Você precisará dele no próximo passo.

### 4.4. (Opcional) Criar Bucket R2 para Upload de Arquivos

```bash
# Criar bucket R2
wrangler r2 bucket create gestao-documentos-judiciais

# Retornará:
# ✅ Created bucket 'gestao-documentos-judiciais'
```

**Nota**: Se você não for usar upload de arquivos, pode pular este passo e remover a seção `r2_buckets` do `wrangler.json`.

---

## 5. Configuração Local do Projeto

### 5.1. Instalar Dependências

```bash
# Entrar na pasta do projeto (se ainda não estiver)
cd gestao-documentos-judiciais

# Instalar dependências
npm install --legacy-peer-deps
```

**Nota**: Usamos `--legacy-peer-deps` devido a incompatibilidades entre Vite 7 e alguns plugins.

### 5.2. Atualizar wrangler.json

Edite o arquivo `wrangler.json` e atualize com suas informações:

```json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "gestao-documentos-judiciais",  // ← Pode personalizar o nome
  "main": "./src/worker/index.ts",
  "compatibility_date": "2025-06-17",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "enabled": true
  },
  "upload_source_maps": true,
  "assets": {
    "not_found_handling": "single-page-application"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "gestao-documentos-judiciais",  // ← Nome do banco
      "database_id": "COLE_O_DATABASE_ID_AQUI"        // ← ID do passo 4.3
    }
  ]
  // Opcional: Adicione r2_buckets se criou o bucket R2
  // "r2_buckets": [
  //   {
  //     "binding": "R2_BUCKET",
  //     "bucket_name": "gestao-documentos-judiciais"
  //   }
  // ]
}
```

**Exemplo Completo**:

```json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "seap-minha-unidade",
  "main": "./src/worker/index.ts",
  "compatibility_date": "2025-06-17",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "enabled": true
  },
  "upload_source_maps": true,
  "assets": {
    "not_found_handling": "single-page-application"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "seap-minha-unidade",
      "database_id": "9bb19773-880d-4eb7-88d3-2c21ac637bd4"
    }
  ]
}
```

---

## 6. Migração do Banco de Dados

### 6.1. Executar Schema SQL no Banco D1

O arquivo `schema.sql` contém a estrutura completa do banco de dados.

```bash
# Executar migração no banco REMOTO (produção)
wrangler d1 execute DB --remote --file=schema.sql
```

**Saída esperada**:
```
🌀 Executing on remote database DB (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX):
🌀 Starting import...
🌀 Processed 14 queries.
🚣 Executed 14 queries in 0.00 seconds (23 rows read, 24 rows written)
✅ Success!
```

### 6.2. Verificar Tabelas Criadas

```bash
# Listar tabelas criadas
wrangler d1 execute DB --remote --command="SELECT name FROM sqlite_master WHERE type='table'"
```

**Tabelas esperadas**:
- `users` - Usuários de login
- `document_assignees` - Responsáveis por documentos
- `document_types` - Tipos de documentos customizáveis
- `documents` - Documentos principais
- `access_logs` - Logs de acesso/autenticação
- `password_usage` - Rastreamento de senhas legacy

---

## 7. Configuração de Secrets

Os secrets são variáveis de ambiente criptografadas usadas para senhas de acesso ao sistema.

### 7.1. SEAP_ADMIN_PASSWORD

Senha para acesso administrativo (login legacy):

```bash
# Criar secret para senha de admin
echo "SuaSenhaAdminAqui" | wrangler secret put SEAP_ADMIN_PASSWORD
```

**Exemplo**:
```bash
echo "Guardiao" | wrangler secret put SEAP_ADMIN_PASSWORD
```

**Saída esperada**:
```
✨ Success! Uploaded secret SEAP_ADMIN_PASSWORD
```

### 7.2. SEAP_USER_PASSWORD

Senha para acesso de usuário comum (login legacy):

```bash
# Criar secret para senha de usuário
echo "SuaSenhaUserAqui" | wrangler secret put SEAP_USER_PASSWORD
```

**Exemplo**:
```bash
echo "Usuario123" | wrangler secret put SEAP_USER_PASSWORD
```

**Saída esperada**:
```
✨ Success! Uploaded secret SEAP_USER_PASSWORD
```

### 7.3. Verificar Secrets Configurados

```bash
wrangler secret list
```

Deve mostrar:
```
SEAP_ADMIN_PASSWORD
SEAP_USER_PASSWORD
```

---

## 8. Build e Deploy

### 8.1. Build da Aplicação

```bash
npm run build
```

**Saída esperada**:
```
> mocha-app@0.0.0 build
> tsc -b && vite build

✓ 59 modules transformed.
✓ 2702 modules transformed.
✓ built in 7.08s
```

### 8.2. Deploy no Cloudflare Workers

```bash
wrangler deploy
```

**Saída esperada**:
```
✨ Success! Uploaded 5 files
Uploaded gestao-documentos-judiciais (7.23 sec)
Deployed gestao-documentos-judiciais triggers (1.88 sec)
  https://gestao-documentos-judiciais.sua-conta.workers.dev
```

⚠️ **COPIE A URL DA APLICAÇÃO!**

### 8.3. Verificar Deploy

Acesse a URL fornecida no navegador:
```
https://[nome-do-worker].[sua-conta].workers.dev
```

Você deve ver a tela de login do sistema.

---

## 9. Primeiro Acesso

### 9.1. Login Administrativo

Na tela de login, use o modo **"Login por Nível"**:

1. Clique na aba **"Login por Nível"**
2. Digite a senha: `Guardiao` (ou a senha que você configurou no passo 7.1)
3. Clique em **"Entrar"**

### 9.2. Configurações Iniciais

Após o primeiro login como administrador, recomendamos:

#### 1. Criar Usuários Individuais

1. Vá para: **Usuários** (menu lateral)
2. Clique em **"Novo Usuário"**
3. Preencha:
   - **Nome**: Nome completo do usuário
   - **Email**: Email do usuário (opcional)
   - **Role**: `admin` ou `user`
   - **Matrícula**: Número da matrícula (único)
   - **Senha**: Senha individual do usuário
4. Clique em **"Criar Usuário"**

#### 2. Configurar Tipos de Documentos

1. Vá para: **Documentos** (menu lateral)
2. Clique em **"Gerenciar Tipos"**
3. Adicione os tipos de documentos que sua unidade usa:
   - Exemplo: "Alvará de Soltura", "Mandado de Prisão", "Ofício", etc.
   - Escolha cores para cada tipo (ajuda na visualização)

#### 3. Cadastrar Responsáveis por Documentos

1. Vá para: **Documentos** (menu lateral)
2. Clique em **"Responsáveis"**
3. Adicione as pessoas que serão responsáveis por documentos:
   - **Nome**: Nome completo
   - **Sobrenome**: Sobrenome
   - **Departamento**: Setor/Departamento (opcional)
   - **Cargo**: Cargo da pessoa (opcional)

#### 4. Criar Primeiro Documento de Teste

1. Vá para: **Documentos** (menu lateral)
2. Clique em **"Novo Documento"**
3. Preencha os campos e teste o sistema

---

## 10. Troubleshooting

### Problema: "Authentication error [code: 10000]"

**Causa**: Token da API não tem permissões suficientes.

**Solução**:
1. Vá para: https://dash.cloudflare.com/profile/api-tokens
2. Edite o token criado
3. Verifique se tem permissões: `Workers Scripts Edit`, `D1 Edit`, `Account Settings Read`
4. Salve e tente novamente

### Problema: "R2 bucket not found"

**Causa**: Bucket R2 não foi criado ou está configurado no `wrangler.json`.

**Solução A** (Se não for usar R2):
1. Edite `wrangler.json`
2. Remova a seção `r2_buckets`
3. Execute `npm run build` novamente
4. Execute `wrangler deploy` novamente

**Solução B** (Se for usar R2):
```bash
wrangler r2 bucket create gestao-documentos-judiciais
```

### Problema: "npm install" falha com erro de dependências

**Solução**:
```bash
npm install --legacy-peer-deps
```

### Problema: Build falha com erro de TypeScript

**Causa**: Console.log no worker ou tipos incorretos.

**Solução**:
1. Certifique-se de que não há `console.log()` no arquivo `src/worker/index.ts`
2. Execute `npm run build` novamente

### Problema: "Database not found" ao executar migração

**Causa**: `database_id` incorreto no `wrangler.json`.

**Solução**:
1. Execute: `wrangler d1 list`
2. Copie o `database_id` correto
3. Atualize `wrangler.json` com o ID correto
4. Execute a migração novamente

### Problema: Não consigo fazer login

**Causa**: Secrets não configurados ou senha incorreta.

**Solução**:
```bash
# Verificar secrets
wrangler secret list

# Recriar secret de admin
echo "Guardiao" | wrangler secret put SEAP_ADMIN_PASSWORD

# Fazer novo deploy
wrangler deploy
```

### Problema: Erro "Cannot find module 'react-is'"

**Solução**:
```bash
npm install react-is --legacy-peer-deps
npm run build
```

---

## 📝 Checklist de Deploy Completo

Use este checklist para garantir que tudo foi configurado:

```
□ Node.js e npm instalados
□ Git instalado (se for clonar via Git)
□ Projeto clonado/baixado
□ Conta Cloudflare criada
□ API Token criado com permissões corretas
□ Wrangler autenticado (wrangler whoami funciona)
□ Banco D1 criado
□ database_id copiado e colado no wrangler.json
□ (Opcional) Bucket R2 criado
□ npm install executado com sucesso
□ wrangler.json configurado corretamente
□ schema.sql executado no banco D1 (14 queries)
□ SEAP_ADMIN_PASSWORD configurado
□ SEAP_USER_PASSWORD configurado
□ npm run build executado com sucesso
□ wrangler deploy executado com sucesso
□ URL da aplicação acessível no navegador
□ Login com senha de admin funcionando
□ Primeiro usuário individual criado
□ Tipos de documentos configurados
□ Responsáveis cadastrados
```

---

## 🎯 Resumo dos Comandos Principais

```bash
# 1. Clonar e preparar
git clone [URL_DO_REPO]
cd gestao-documentos-judiciais
npm install --legacy-peer-deps

# 2. Autenticar
export CLOUDFLARE_API_TOKEN="SEU_TOKEN_AQUI"
wrangler whoami

# 3. Criar recursos
wrangler d1 create gestao-documentos-judiciais
# (copiar database_id e colar no wrangler.json)

# 4. Migrar banco
wrangler d1 execute DB --remote --file=schema.sql

# 5. Configurar secrets
echo "Guardiao" | wrangler secret put SEAP_ADMIN_PASSWORD
echo "Usuario123" | wrangler secret put SEAP_USER_PASSWORD

# 6. Build e deploy
npm run build
wrangler deploy
```

---

## 📞 Suporte

Se encontrar problemas não cobertos neste guia:

1. Verifique a documentação do Cloudflare Workers: https://developers.cloudflare.com/workers
2. Consulte o arquivo [CLAUDE.md](./CLAUDE.md) para detalhes técnicos
3. Revise o arquivo [SISTEMA_LOGIN_IMPLEMENTACAO.md](./SISTEMA_LOGIN_IMPLEMENTACAO.md) para detalhes do sistema de autenticação

---

## 🔄 Atualizações Futuras

Para atualizar uma instância já deployada:

```bash
# 1. Atualizar código local
git pull origin main

# 2. Reinstalar dependências (se necessário)
npm install --legacy-peer-deps

# 3. Build e redeploy
npm run build
wrangler deploy
```

**Nota**: Migrações de banco de dados devem ser feitas separadamente se houver mudanças no schema.

---

## 📊 Informações da Instância Atual

**Para documentar sua instalação, preencha abaixo:**

```yaml
Instância: [Nome da Unidade/Organização]
URL: https://[seu-worker].[sua-conta].workers.dev
Account ID: [seu-account-id]
Database ID: [seu-database-id]
Data de Deploy: [data]
Versão: [version-id do deploy]
Administrador: [nome/email]
```

---

**Fim do Guia de Deploy** 🚀

Boa sorte com sua nova instância do SEAP!
