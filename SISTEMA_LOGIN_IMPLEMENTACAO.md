# 🔐 Sistema de Login Duplo - Documentação Completa

## 📋 Visão Geral

Este documento detalha a implementação de um sistema de login duplo que combina:
- **Login Individual**: Por matrícula e senha (para usuários pré-cadastrados)
- **Login por Nível**: Por senha compartilhada (para acesso administrativo/usuário)

## 🏗️ Estrutura do Sistema

### 1. Tabelas do Banco de Dados Necessárias

```sql
-- Tabela para usuários individuais
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'user',
  matricula TEXT UNIQUE,
  password TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para logs de acesso
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
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Secrets/Variáveis de Ambiente Necessárias

```
SEAP_ACCESS_PASSWORD=senha_legacy
SEAP_ADMIN_PASSWORD=senha_admin
SEAP_USER_PASSWORD=senha_usuario
```

## 🎨 Frontend - Componente de Login

### Arquivo: `src/react-app/pages/Login.tsx`

**Características principais:**
- Interface com abas para alternar entre tipos de login
- Visual moderno com gradientes e glassmorphism
- Validação de entrada
- Tratamento de erros
- Instruções contextuais

**Estrutura do Estado:**
```typescript
const [matricula, setMatricula] = useState('');
const [password, setPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);
const [loginMode, setLoginMode] = useState<'matricula' | 'legacy'>('matricula');
```

**Funções de Login:**

1. **Login Individual (`handleLoginWithMatricula`):**
   - Valida matrícula e senha
   - Faz POST para `/api/auth/login`
   - Salva dados do usuário no localStorage
   - Redireciona para dashboard

2. **Login por Nível (`handleLoginLegacy`):**
   - Valida apenas senha
   - Faz POST para `/api/auth/login-legacy`
   - Salva tipo de usuário no localStorage
   - Redireciona para dashboard

**Armazenamento no localStorage:**
```typescript
// Para login individual
localStorage.setItem('seap_authenticated', 'true');
localStorage.setItem('seap_user_data', JSON.stringify(result.user));
localStorage.setItem('seap_login_time', new Date().toISOString());

// Para login por nível
localStorage.setItem('seap_authenticated', 'true');
localStorage.setItem('seap_user_type', result.userType || 'user');
localStorage.setItem('seap_login_time', new Date().toISOString());
```

## 🛡️ Sistema de Proteção de Rotas

### Arquivo: `src/react-app/components/ProtectedRoute.tsx`

**Funcionalidades:**
- Verifica autenticação baseada no localStorage
- Controla expiração de sessão (24 horas)
- Suporte para ambos os tipos de login
- Proteção por role (adminOnly)

**Lógica de Verificação:**
```typescript
const checkAuth = () => {
  const authStatus = localStorage.getItem('seap_authenticated');
  const loginTime = localStorage.getItem('seap_login_time');
  const userType = localStorage.getItem('seap_user_type');
  const userData = localStorage.getItem('seap_user_data');
  
  if (authStatus === 'true' && loginTime) {
    // Verificar expiração (24 horas)
    const loginDate = new Date(loginTime);
    const now = new Date();
    const diffHours = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      // Verificar tipo de login e permissões
      if (userData) {
        // Login individual
        const user = JSON.parse(userData);
        if (adminOnly && user.role !== 'admin') {
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } else if (userType) {
        // Login por nível
        if (adminOnly && userType !== 'admin' && userType !== 'legacy') {
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      }
    } else {
      // Sessão expirada
      clearAuthData();
    }
  }
};
```

## 🔧 Backend - Rotas de Autenticação

### 1. Login Individual - `/api/auth/login`

```typescript
app.post("/api/auth/login", zValidator("json", z.object({
  matricula: z.string(),
  password: z.string(),
})), async (c) => {
  const { matricula, password } = c.req.valid("json");
  
  // Buscar usuário na tabela users
  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE matricula = ? AND is_active = 1"
  ).bind(matricula).first();
  
  if (!user) {
    // Registrar tentativa falhada
    await logFailedAttempt(c, matricula);
    return c.json({ error: "Matrícula não cadastrada" }, 401);
  }
  
  if (user.password !== password) {
    await logFailedAttempt(c, matricula);
    return c.json({ error: "Senha incorreta" }, 401);
  }
  
  // Registrar login bem-sucedido
  await logSuccessfulLogin(c, user);
  
  return c.json({ 
    success: true, 
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      matricula: user.matricula
    }
  });
});
```

### 2. Login por Nível - `/api/auth/login-legacy`

```typescript
app.post("/api/auth/login-legacy", zValidator("json", z.object({
  password: z.string(),
})), async (c) => {
  const { password } = c.req.valid("json");
  
  // Verificar primeiro acesso
  const userCount = await c.env.DB.prepare("SELECT COUNT(*) as count FROM users").first();
  const isFirstAccess = userCount?.count === 0;
  
  if (isFirstAccess && password === "admin123") {
    return c.json({ success: true, userType: 'admin' });
  }
  
  // Verificar senhas configuradas
  if (password === c.env.SEAP_ADMIN_PASSWORD) {
    return c.json({ success: true, userType: 'admin' });
  }
  
  if (password === c.env.SEAP_USER_PASSWORD) {
    return c.json({ success: true, userType: 'user' });
  }
  
  return c.json({ error: "Senha incorreta" }, 401);
});
```

### 3. Sistema de Logout - `/api/auth/logout`

```typescript
app.post('/api/auth/logout', async (c) => {
  const { matricula } = c.req.valid("json");
  
  if (matricula) {
    await c.env.DB.prepare(`
      UPDATE access_logs 
      SET logout_time = CURRENT_TIMESTAMP, session_active = 0 
      WHERE matricula = ? AND session_active = 1
    `).bind(matricula).run();
  }
  
  return c.json({ success: true });
});
```

## 🖼️ Interface do Layout - Informações do Usuário

### Arquivo: `src/react-app/components/Layout.tsx`

**Detecção do Tipo de Login:**
```typescript
useEffect(() => {
  const userData = localStorage.getItem('seap_user_data');
  const userType = localStorage.getItem('seap_user_type');
  
  if (userData) {
    // Login individual
    const user = JSON.parse(userData);
    setUserName(user.name);
    setUserRole(user.role);
  } else if (userType) {
    // Login por nível
    setUserName(userType === 'admin' ? 'Administrador do Sistema' : 'Usuário da Equipe');
    setUserRole(userType === 'admin' ? 'admin' : 'user');
  }
}, []);
```

**Função de Logout:**
```typescript
const handleLogout = async () => {
  if (confirm('Tem certeza que deseja sair do sistema?')) {
    try {
      // Obter matrícula se for login individual
      const userData = localStorage.getItem('seap_user_data');
      let matricula = null;
      
      if (userData) {
        const user = JSON.parse(userData);
        matricula = user.matricula;
      }
      
      // Registrar logout no backend
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricula }),
      });
      
      // Limpar dados locais
      localStorage.removeItem('seap_authenticated');
      localStorage.removeItem('seap_login_time');
      localStorage.removeItem('seap_user_type');
      localStorage.removeItem('seap_user_data');
      
      navigate('/login');
    } catch (error) {
      // Fazer logout local mesmo com erro
      clearLocalStorage();
      navigate('/login');
    }
  }
};
```

## 📊 Sistema de Logs de Acesso

### Funções Auxiliares no Backend:

```typescript
async function logSuccessfulLogin(c: any, user: any) {
  const clientIP = c.req.header('CF-Connecting-IP') || 'unknown';
  const userAgent = c.req.header('User-Agent') || 'unknown';
  
  await c.env.DB.prepare(`
    INSERT INTO access_logs (user_id, matricula, ip_address, user_agent, login_success) 
    VALUES (?, ?, ?, ?, 1)
  `).bind(user.id, user.matricula, clientIP, userAgent).run();
}

async function logFailedAttempt(c: any, matricula: string) {
  const clientIP = c.req.header('CF-Connecting-IP') || 'unknown';
  const userAgent = c.req.header('User-Agent') || 'unknown';
  
  await c.env.DB.prepare(`
    INSERT INTO access_logs (user_id, matricula, ip_address, user_agent, login_success) 
    VALUES (NULL, ?, ?, ?, 0)
  `).bind(matricula, clientIP, userAgent).run();
}
```

## 🎯 Fluxo de Funcionamento

### 1. Primeiro Acesso ao Sistema
1. Usuario acessa `/login`
2. Sistema detecta que não há usuários cadastrados
3. Permite login com senha padrão "admin123"
4. Usuário pode cadastrar outros usuários

### 2. Login Individual (Usuário Cadastrado)
1. Usuario digita matrícula e senha
2. Sistema consulta tabela `users`
3. Valida credenciais
4. Registra log de acesso
5. Salva dados do usuário no localStorage
6. Redireciona para dashboard

### 3. Login por Nível (Senha Compartilhada)
1. Usuario digita apenas senha
2. Sistema compara com senhas configuradas
3. Define tipo de usuário baseado na senha
4. Salva tipo no localStorage
5. Redireciona para dashboard

### 4. Proteção de Rotas
1. Componente ProtectedRoute verifica localStorage
2. Valida expiração da sessão (24h)
3. Verifica permissões se necessário
4. Permite ou nega acesso

### 5. Logout
1. Usuario clica em "Sair"
2. Sistema atualiza log no banco (se login individual)
3. Limpa localStorage
4. Redireciona para login

## 🔑 Características Importantes

### Segurança
- Senhas não ficam expostas no frontend
- IPs e User-Agents são registrados
- Sessões têm expiração automática
- Logs de tentativas falhadas

### UX/UI
- Interface moderna e responsiva
- Abas para alternar tipos de login
- Instruções contextuais
- Feedback visual de loading/erro

### Flexibilidade
- Suporta dois sistemas de login simultaneamente
- Fácil migração do sistema legacy para individual
- Controle granular de permissões
- Logs detalhados para auditoria

## 🚀 Como Implementar em Outro Projeto

1. **Copie as tabelas do banco** (users, access_logs)
2. **Configure as variáveis de ambiente** (senhas)
3. **Implemente as rotas de backend** (login, logout)
4. **Crie o componente Login** com as duas abas
5. **Implemente ProtectedRoute** para proteção
6. **Adicione controle no Layout** (logout, info do usuário)
7. **Teste ambos os fluxos** de login

## 💡 Dicas Importantes

- **localStorage** é usado para persistir autenticação
- **24 horas** é o tempo limite da sessão
- **admin123** é a senha padrão do primeiro acesso
- **Logs** registram IP, User-Agent e sucesso/falha
- **Role-based** access control está implementado
- **Limpar localStorage** é crucial no logout

Este sistema permite transição suave entre autenticação legacy e moderna, mantendo compatibilidade e adicionando segurança granular.
