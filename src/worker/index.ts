import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import z from "zod";
import { User, ProductivityReport } from "@/shared/types";

interface Env {
  DB: any;
  SEAP_ACCESS_PASSWORD: string;
  SEAP_ADMIN_PASSWORD: string;
  SEAP_USER_PASSWORD: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use("*", cors());

// ROTAS DE AUTENTICAÇÃO

// Login com matrícula e senha - APENAS PARA USUÁRIOS PRÉ-CADASTRADOS
app.post("/api/auth/login", zValidator("json", z.object({
  matricula: z.string(),
  password: z.string(),
})), async (c) => {
  try {
    const { matricula, password } = c.req.valid("json");
    
    // Buscar usuário pela matrícula na tabela users (deve ser pré-cadastrado)
    const user = await c.env.DB.prepare(
      "SELECT * FROM users WHERE matricula = ? AND is_active = 1"
    ).bind(matricula).first();
    
    if (!user) {
      // Registrar tentativa de acesso de matrícula não cadastrada
      const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
      const userAgent = c.req.header('User-Agent') || 'unknown';
      
      await c.env.DB.prepare(`
        INSERT INTO access_logs (user_id, matricula, ip_address, user_agent, login_success) 
        VALUES (NULL, ?, ?, ?, 0)
      `).bind(matricula, clientIP, userAgent).run();
      
      return c.json({ 
        error: `❌ ACESSO NEGADO: A matrícula ${matricula} não está cadastrada no sistema. Apenas usuários pré-cadastrados pelos administradores podem fazer login. Contate o administrador para solicitar cadastro.` 
      }, 401);
    }
    
    // Verificar senha
    if (user.password !== password) {
      // Registrar tentativa de login com senha incorreta
      const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
      const userAgent = c.req.header('User-Agent') || 'unknown';
      
      await c.env.DB.prepare(`
        INSERT INTO access_logs (user_id, matricula, ip_address, user_agent, login_success) 
        VALUES (?, ?, ?, ?, 0)
      `).bind(user.id, matricula, clientIP, userAgent).run();
      
      return c.json({ 
        error: `❌ Senha incorreta para a matrícula ${matricula}. Use a senha fornecida pelo administrador.` 
      }, 401);
    }
    
    // LOGIN BEM-SUCEDIDO - Registrar acesso no log
    const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const userAgent = c.req.header('User-Agent') || 'unknown';
    
    await c.env.DB.prepare(`
      INSERT INTO access_logs (user_id, matricula, ip_address, user_agent, login_success) 
      VALUES (?, ?, ?, ?, 1)
    `).bind(user.id, matricula, clientIP, userAgent).run();
    
    return c.json({ 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        matricula: user.matricula
      },
      message: '✅ Login realizado com sucesso'
    }, 200);
    
  } catch (error) {
    return c.json({ error: "Erro interno do servidor" }, 500);
  }
});

// Login com senha legacy (compatibilidade)
app.post("/api/auth/login-legacy", zValidator("json", z.object({
  password: z.string(),
})), async (c) => {
  try {
    const { password } = c.req.valid("json");
    
    
    
    // Verificar senha de administrador (Guardiao)
    if (password === c.env.SEAP_ADMIN_PASSWORD || password === 'Guardiao') {
      return c.json({ 
        success: true, 
        userType: 'admin',
        message: 'Login como administrador realizado com sucesso'
      }, 200);
    }
    
    // Verificar senha de usuário normal (Usuario123)
    if (password === c.env.SEAP_USER_PASSWORD || password === 'Usuario123') {
      return c.json({ 
        success: true, 
        userType: 'user',
        message: 'Login como usuário realizado com sucesso'
      }, 200);
    }
    
    return c.json({ 
      error: "Senha incorreta. Use 'Guardiao' para acesso administrativo ou 'Usuario123' para acesso de usuário." 
    }, 401);
  } catch (error) {
    
    return c.json({ error: "Erro interno do servidor" }, 500);
  }
});

// Logout com registro
app.post('/api/auth/logout', zValidator("json", z.object({
  matricula: z.string().optional(),
})), async (c) => {
  try {
    const { matricula } = c.req.valid("json");
    
    if (matricula) {
      // Atualizar log de acesso com logout
      await c.env.DB.prepare(`
        UPDATE access_logs 
        SET logout_time = CURRENT_TIMESTAMP, session_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE matricula = ? AND session_active = 1
      `).bind(matricula).run();
    }
    
    return c.json({ success: true }, 200);
  } catch (error) {
    return c.json({ error: "Erro ao fazer logout" }, 500);
  }
});

// Função auxiliar para executar consultas SQL
async function executeQuery(env: Env, query: string, params: any[] = []): Promise<any> {
  const stmt = env.DB.prepare(query);
  if (params.length > 0) {
    return await stmt.bind(...params).all();
  }
  return await stmt.all();
}

// ROTAS DOS TIPOS DE DOCUMENTOS

// Listar todos os tipos de documentos
app.get("/api/document-types", async (c) => {
  try {
    const result = await executeQuery(c.env, "SELECT * FROM document_types ORDER BY name");
    const types = result.results;
    return c.json(types);
  } catch (error) {
    return c.json({ error: "Erro ao buscar tipos de documentos" }, 500);
  }
});

// Criar novo tipo de documento
app.post("/api/document-types", zValidator("json", z.object({
  name: z.string(),
  color: z.string().default('#3B82F6'),
})), async (c) => {
  try {
    const { name, color } = c.req.valid("json");
    
    const result = await c.env.DB.prepare(
      "INSERT INTO document_types (name, color) VALUES (?, ?) RETURNING *"
    ).bind(name, color).first();
    
    if (!result) {
      throw new Error("Falha ao criar tipo de documento");
    }
    
    return c.json(result);
  } catch (error) {
    return c.json({ error: "Erro ao criar tipo de documento" }, 500);
  }
});

// Atualizar tipo de documento
app.put("/api/document-types/:id", zValidator("json", z.object({
  name: z.string(),
  color: z.string(),
})), async (c) => {
  try {
    const id = c.req.param("id");
    const { name, color } = c.req.valid("json");
    
    const result = await c.env.DB.prepare(
      "UPDATE document_types SET name = ?, color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *"
    ).bind(name, color, id).first();
    
    if (!result) {
      return c.json({ error: "Tipo de documento não encontrado" }, 404);
    }
    
    return c.json(result);
  } catch (error) {
    return c.json({ error: "Erro ao atualizar tipo de documento" }, 500);
  }
});

// Alternar status do tipo de documento
app.patch("/api/document-types/:id/toggle-status", zValidator("json", z.object({
  is_active: z.boolean(),
})), async (c) => {
  try {
    const id = c.req.param("id");
    const { is_active } = c.req.valid("json");
    
    const result = await c.env.DB.prepare(
      "UPDATE document_types SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *"
    ).bind(is_active, id).first();
    
    if (!result) {
      return c.json({ error: "Tipo de documento não encontrado" }, 404);
    }
    
    return c.json(result);
  } catch (error) {
    return c.json({ error: "Erro ao atualizar status do tipo" }, 500);
  }
});

// Excluir tipo de documento
app.delete("/api/document-types/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    // Verificar se há documentos usando este tipo
    const documentsUsingType = await executeQuery(c.env, 
      "SELECT COUNT(*) as count FROM documents WHERE type = (SELECT name FROM document_types WHERE id = ?)", 
      [id]
    );
    
    if (documentsUsingType.results[0]?.count > 0) {
      return c.json({ error: "Não é possível excluir este tipo pois há documentos associados a ele" }, 400);
    }
    
    const result = await c.env.DB.prepare("DELETE FROM document_types WHERE id = ?").bind(id).run();
    
    if (!result.success) {
      return c.json({ error: "Tipo de documento não encontrado" }, 404);
    }
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Erro ao excluir tipo de documento" }, 500);
  }
});

// ROTAS DOS USUÁRIOS DE LOGIN

// Listar todos os usuários de login
app.get("/api/users", async (c) => {
  try {
    const result = await executeQuery(c.env, "SELECT * FROM users WHERE is_active = 1 ORDER BY name");
    const users = result.results as User[];
    return c.json(users);
  } catch (error) {
    return c.json({ error: "Erro ao buscar usuários" }, 500);
  }
});

// ROTAS DOS RESPONSÁVEIS POR DOCUMENTOS

// Listar todos os responsáveis por documentos
app.get("/api/document-assignees", async (c) => {
  try {
    const result = await executeQuery(c.env, "SELECT * FROM document_assignees WHERE is_active = 1 ORDER BY first_name, last_name");
    const assignees = result.results;
    return c.json(assignees);
  } catch (error) {
    return c.json({ error: "Erro ao buscar responsáveis por documentos" }, 500);
  }
});

// Criar novo responsável por documento
app.post("/api/document-assignees", zValidator("json", z.object({
  first_name: z.string(),
  last_name: z.string(),
  department: z.string().optional(),
  position: z.string().optional(),
})), async (c) => {
  try {
    const { first_name, last_name, department, position } = c.req.valid("json");
    
    const result = await c.env.DB.prepare(
      "INSERT INTO document_assignees (first_name, last_name, department, position) VALUES (?, ?, ?, ?) RETURNING *"
    ).bind(first_name, last_name, department || null, position || null).first();
    
    if (!result) {
      throw new Error("Falha ao criar responsável");
    }
    
    return c.json(result);
  } catch (error) {
    return c.json({ error: "Erro ao criar responsável" }, 500);
  }
});

// Atualizar responsável por documento
app.put("/api/document-assignees/:id", zValidator("json", z.object({
  first_name: z.string(),
  last_name: z.string(),
  department: z.string().optional(),
  position: z.string().optional(),
})), async (c) => {
  try {
    const id = c.req.param("id");
    const { first_name, last_name, department, position } = c.req.valid("json");
    
    const result = await c.env.DB.prepare(
      "UPDATE document_assignees SET first_name = ?, last_name = ?, department = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *"
    ).bind(first_name, last_name, department || null, position || null, id).first();
    
    if (!result) {
      return c.json({ error: "Responsável não encontrado" }, 404);
    }
    
    return c.json(result);
  } catch (error) {
    return c.json({ error: "Erro ao atualizar responsável" }, 500);
  }
});

// Alternar status do responsável
app.patch("/api/document-assignees/:id/toggle-status", zValidator("json", z.object({
  is_active: z.boolean(),
})), async (c) => {
  try {
    const id = c.req.param("id");
    const { is_active } = c.req.valid("json");
    
    const result = await c.env.DB.prepare(
      "UPDATE document_assignees SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *"
    ).bind(is_active, id).first();
    
    if (!result) {
      return c.json({ error: "Responsável não encontrado" }, 404);
    }
    
    return c.json(result);
  } catch (error) {
    return c.json({ error: "Erro ao atualizar status do responsável" }, 500);
  }
});

// Excluir responsável permanentemente
app.delete("/api/document-assignees/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    // Verificar se há documentos atribuídos ao responsável
    const documentsAssigned = await executeQuery(c.env, 
      "SELECT COUNT(*) as count FROM documents WHERE document_assignee_id = ? AND status != 'Arquivado'", 
      [id]
    );
    
    if (documentsAssigned.results[0]?.count > 0) {
      return c.json({ 
        error: `Não é possível excluir este responsável pois há ${documentsAssigned.results[0].count} documento(s) atribuído(s) a ele. Reatribua ou arquive os documentos primeiro.` 
      }, 400);
    }
    
    // Verificar se o responsável existe
    const assigneeToDelete = await c.env.DB.prepare("SELECT * FROM document_assignees WHERE id = ?").bind(id).first();
    if (!assigneeToDelete) {
      return c.json({ error: "Responsável não encontrado" }, 404);
    }
    
    // Excluir o responsável
    const result = await c.env.DB.prepare("DELETE FROM document_assignees WHERE id = ?").bind(id).run();
    
    if (!result.success) {
      throw new Error("Falha ao excluir responsável");
    }
    
    return c.json({ 
      success: true, 
      message: `Responsável ${assigneeToDelete.first_name} ${assigneeToDelete.last_name} foi excluído com sucesso.`
    });
    
  } catch (error) {
    return c.json({ error: "Erro ao excluir responsável" }, 500);
  }
});

// Limpar todos os responsáveis
app.delete("/api/admin/clear-document-assignees", async (c) => {
  try {
    const result = await c.env.DB.prepare("DELETE FROM document_assignees").run();
    return c.json({ 
      success: true, 
      message: `${result.changes} responsável(is) removido(s) com sucesso`
    });
  } catch (error) {
    return c.json({ error: "Erro ao limpar responsáveis" }, 500);
  }
});

// Criar novo usuário
app.post("/api/users", zValidator("json", z.object({
  name: z.string(),
  email: z.string().optional(),
  role: z.string().default('user'),
  matricula: z.string(),
  password: z.string(),
})), async (c) => {
  try {
    const { name, email, role, matricula, password } = c.req.valid("json");
    
    // Verificar se a matrícula já existe
    const existingUser = await c.env.DB.prepare(
      "SELECT id FROM users WHERE matricula = ?"
    ).bind(matricula).first();
    
    if (existingUser) {
      return c.json({ error: "Matrícula já cadastrada no sistema" }, 400);
    }
    
    const result = await c.env.DB.prepare(
      "INSERT INTO users (name, email, role, matricula, password) VALUES (?, ?, ?, ?, ?) RETURNING *"
    ).bind(name, email || null, role, matricula, password).first();
    
    if (!result) {
      throw new Error("Falha ao criar usuário");
    }
    
    return c.json(result);
  } catch (error) {
    return c.json({ error: "Erro ao criar usuário" }, 500);
  }
});

// Atualizar usuário
app.put("/api/users/:id", zValidator("json", z.object({
  name: z.string(),
  email: z.string().optional(),
  role: z.string(),
  matricula: z.string().optional(),
  password: z.string().optional(),
})), async (c) => {
  try {
    const id = c.req.param("id");
    const { name, email, role, matricula, password } = c.req.valid("json");
    
    // Se matrícula foi fornecida, verificar se já existe em outro usuário
    if (matricula) {
      const existingUser = await c.env.DB.prepare(
        "SELECT id FROM users WHERE matricula = ? AND id != ?"
      ).bind(matricula, id).first();
      
      if (existingUser) {
        return c.json({ error: "Matrícula já cadastrada para outro usuário" }, 400);
      }
    }
    
    // Construir query dinamicamente baseado nos campos fornecidos
    let updateFields = ["name = ?", "email = ?", "role = ?", "updated_at = CURRENT_TIMESTAMP"];
    let updateValues = [name, email || null, role];
    
    if (matricula !== undefined) {
      updateFields.splice(-1, 0, "matricula = ?");
      updateValues.splice(-1, 0, matricula || null);
    }
    
    if (password !== undefined && password.trim() !== '') {
      updateFields.splice(-1, 0, "password = ?");
      updateValues.splice(-1, 0, password);
    }
    
    updateValues.push(id);
    
    const result = await c.env.DB.prepare(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ? RETURNING *`
    ).bind(...updateValues).first();
    
    if (!result) {
      return c.json({ error: "Usuário não encontrado" }, 404);
    }
    
    return c.json(result);
  } catch (error) {
    return c.json({ error: "Erro ao atualizar usuário" }, 500);
  }
});

// Alternar status do usuário (ativo/inativo)
app.patch("/api/users/:id/toggle-status", zValidator("json", z.object({
  is_active: z.boolean(),
})), async (c) => {
  try {
    const id = c.req.param("id");
    const { is_active } = c.req.valid("json");
    
    const result = await c.env.DB.prepare(
      "UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *"
    ).bind(is_active, id).first();
    
    if (!result) {
      return c.json({ error: "Usuário não encontrado" }, 404);
    }
    
    return c.json(result);
  } catch (error) {
    return c.json({ error: "Erro ao atualizar status do usuário" }, 500);
  }
});

// Excluir usuário permanentemente
app.delete("/api/users/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    // Verificar se há documentos atribuídos ao usuário
    const documentsAssigned = await executeQuery(c.env, 
      "SELECT COUNT(*) as count FROM documents WHERE assigned_to = ? AND status != 'Arquivado'", 
      [id]
    );
    
    if (documentsAssigned.results[0]?.count > 0) {
      return c.json({ 
        error: `Não é possível excluir este usuário pois há ${documentsAssigned.results[0].count} documento(s) atribuído(s) a ele. Reatribua ou arquive os documentos primeiro.` 
      }, 400);
    }
    
    // Verificar se o usuário existe
    const userToDelete = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
    if (!userToDelete) {
      return c.json({ error: "Usuário não encontrado" }, 404);
    }
    
    // Excluir o usuário
    const result = await c.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
    
    if (!result.success) {
      throw new Error("Falha ao excluir usuário");
    }
    
    return c.json({ 
      success: true, 
      message: `Usuário ${userToDelete.name} foi excluído com sucesso.`
    });
    
  } catch (error) {
    return c.json({ error: "Erro ao excluir usuário" }, 500);
  }
});

// ROTAS DOS DOCUMENTOS

// Excluir documento individual
app.delete("/api/documents/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    // Verificar se o documento existe
    const documentToDelete = await c.env.DB.prepare("SELECT * FROM documents WHERE id = ?").bind(id).first();
    if (!documentToDelete) {
      return c.json({ error: "Documento não encontrado" }, 404);
    }
    
    // Excluir o documento
    const result = await c.env.DB.prepare("DELETE FROM documents WHERE id = ?").bind(id).run();
    
    if (!result.success) {
      throw new Error("Falha ao excluir documento");
    }
    
    return c.json({ 
      success: true, 
      message: `Documento "${documentToDelete.title}" foi excluído com sucesso.`
    });
    
  } catch (error) {
    return c.json({ error: "Erro ao excluir documento" }, 500);
  }
});

// Listar todos os documentos (incluindo arquivados)
app.get("/api/documents", async (c) => {
  try {
    const result = await executeQuery(c.env, `
      SELECT d.*, 
             u.name as assigned_user_name,
             da.first_name || ' ' || da.last_name as assigned_assignee_name,
             da.department,
             da.position
      FROM documents d 
      LEFT JOIN users u ON d.assigned_to = u.id 
      LEFT JOIN document_assignees da ON d.document_assignee_id = da.id
      ORDER BY d.created_at DESC
    `);
    const documents = result.results;
    return c.json(documents);
  } catch (error) {
    return c.json({ error: "Erro ao buscar documentos" }, 500);
  }
});

// Criar novo documento
app.post("/api/documents", zValidator("json", z.object({
  title: z.string(),
  type: z.string(), // Mudou de enum para string para permitir tipos dinâmicos
  assigned_to: z.number().optional(), // Usuário de login (antigo sistema)
  document_assignee_id: z.number().optional(), // Responsável por documento (novo sistema)
  deadline: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(['baixa', 'normal', 'alta']).default('normal'),
  process_number: z.string().optional(), // Número do processo judicial
  prisoner_name: z.string().optional(), // Nome do preso
})), async (c) => {
  try {
    const data = c.req.valid("json");
    
    const result = await c.env.DB.prepare(`
      INSERT INTO documents (title, type, assigned_to, document_assignee_id, deadline, description, priority, process_number, prisoner_name) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *
    `).bind(
      data.title, 
      data.type, 
      data.assigned_to || null,
      data.document_assignee_id || null, 
      data.deadline || null, 
      data.description || null, 
      data.priority,
      data.process_number || null,
      data.prisoner_name || null
    ).first();
    
    if (!result) {
      throw new Error("Falha ao criar documento");
    }
    
    return c.json(result);
  } catch (error) {
    return c.json({ error: "Erro ao criar documento" }, 500);
  }
});

// Atualizar documento completo
app.put("/api/documents/:id", zValidator("json", z.object({
  title: z.string(),
  type: z.string(),
  assigned_to: z.number().optional(),
  document_assignee_id: z.number().optional(),
  deadline: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(['baixa', 'normal', 'alta']).default('normal'),
  status: z.enum(['Em Andamento', 'Concluído', 'Arquivado']).optional(),
  process_number: z.string().optional(), // Número do processo judicial
  prisoner_name: z.string().optional(), // Nome do preso
})), async (c) => {
  try {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    
    // Se o status foi alterado para 'Concluído', definir completion_date
    const completion_date = data.status === 'Concluído' ? new Date().toISOString() : null;
    
    const result = await c.env.DB.prepare(`
      UPDATE documents 
      SET title = ?, type = ?, assigned_to = ?, document_assignee_id = ?, deadline = ?, 
          description = ?, priority = ?, status = COALESCE(?, status), completion_date = ?, 
          process_number = ?, prisoner_name = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? RETURNING *
    `).bind(
      data.title,
      data.type,
      data.assigned_to || null,
      data.document_assignee_id || null,
      data.deadline || null,
      data.description || null,
      data.priority,
      data.status || null,
      completion_date,
      data.process_number || null,
      data.prisoner_name || null,
      id
    ).first();
    
    if (!result) {
      return c.json({ error: "Documento não encontrado" }, 404);
    }
    
    return c.json(result);
  } catch (error) {
    return c.json({ error: "Erro ao atualizar documento" }, 500);
  }
});

// Atualizar status do documento
app.patch("/api/documents/:id/status", zValidator("json", z.object({
  status: z.enum(['Em Andamento', 'Concluído', 'Arquivado']),
})), async (c) => {
  try {
    const id = c.req.param("id");
    const { status } = c.req.valid("json");
    
    const completion_date = status === 'Concluído' ? new Date().toISOString() : null;
    
    const result = await c.env.DB.prepare(`
      UPDATE documents 
      SET status = ?, completion_date = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? RETURNING *
    `).bind(status, completion_date, id).first();
    
    if (!result) {
      return c.json({ error: "Documento não encontrado" }, 404);
    }
    
    return c.json(result);
  } catch (error) {
    return c.json({ error: "Erro ao atualizar documento" }, 500);
  }
});

// ROTAS ADMINISTRATIVAS DE LIMPEZA

// Limpar todos os documentos
app.delete("/api/admin/clear-documents", async (c) => {
  try {
    const result = await c.env.DB.prepare("DELETE FROM documents").run();
    return c.json({ 
      success: true, 
      message: `${result.changes} documento(s) removido(s) com sucesso`
    });
  } catch (error) {
    return c.json({ error: "Erro ao limpar documentos" }, 500);
  }
});

// Limpar todos os tipos de documentos
app.delete("/api/admin/clear-document-types", async (c) => {
  try {
    const result = await c.env.DB.prepare("DELETE FROM document_types").run();
    return c.json({ 
      success: true, 
      message: `${result.changes} tipo(s) de documento removido(s) com sucesso`
    });
  } catch (error) {
    return c.json({ error: "Erro ao limpar tipos de documentos" }, 500);
  }
});

// Limpar todos os usuários (exceto admin)
app.delete("/api/admin/clear-users", async (c) => {
  try {
    const result = await c.env.DB.prepare("DELETE FROM users WHERE role != 'admin'").run();
    return c.json({ 
      success: true, 
      message: `${result.changes} usuário(s) removido(s) com sucesso (administradores preservados)`
    });
  } catch (error) {
    return c.json({ error: "Erro ao limpar usuários" }, 500);
  }
});

// Limpar logs de acesso
app.delete("/api/admin/clear-access-logs", async (c) => {
  try {
    const result = await c.env.DB.prepare("DELETE FROM access_logs").run();
    return c.json({ 
      success: true, 
      message: `${result.changes} registro(s) de acesso removido(s) com sucesso`
    });
  } catch (error) {
    return c.json({ error: "Erro ao limpar logs de acesso" }, 500);
  }
});



// Reset completo do sistema
app.delete("/api/admin/reset-system", async (c) => {
  try {
    // Limpar todas as tabelas (inclusive document_assignees que estava faltando)
    await c.env.DB.prepare("DELETE FROM documents").run();
    await c.env.DB.prepare("DELETE FROM document_types").run();
    await c.env.DB.prepare("DELETE FROM document_assignees").run();
    await c.env.DB.prepare("DELETE FROM access_logs").run();
    await c.env.DB.prepare("DELETE FROM password_usage").run();
    await c.env.DB.prepare("DELETE FROM users").run(); // Removendo todos os usuários para reset completo
    
    return c.json({ 
      success: true, 
      message: "Banco de dados resetado com sucesso. Agora você pode reconfigurar tudo na versão publicada."
    });
  } catch (error) {
    return c.json({ error: "Erro ao resetar o sistema" }, 500);
  }
});

// Listar logs de acesso
app.get("/api/admin/access-logs", async (c) => {
  try {
    const result = await executeQuery(c.env, `
      SELECT al.*, u.name as user_name
      FROM access_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.login_time DESC
      LIMIT 100
    `);

    return c.json(result.results);
  } catch (error) {
    return c.json({ error: "Erro ao carregar logs de acesso" }, 500);
  }
});

// Exportar backup completo do sistema
app.get("/api/admin/export-backup", async (c) => {
  try {
    // Buscar todos os dados de todas as tabelas
    const [users, documentAssignees, documentTypes, documents, accessLogs, passwordUsage] = await Promise.all([
      executeQuery(c.env, "SELECT * FROM users"),
      executeQuery(c.env, "SELECT * FROM document_assignees"),
      executeQuery(c.env, "SELECT * FROM document_types"),
      executeQuery(c.env, "SELECT * FROM documents"),
      executeQuery(c.env, "SELECT * FROM access_logs"),
      executeQuery(c.env, "SELECT * FROM password_usage")
    ]);

    // Montar objeto de backup com metadados
    const backup = {
      metadata: {
        exportDate: new Date().toISOString(),
        systemName: "SEAP - Sistema de Gestão de Documentos Judiciais",
        version: "2.0",
        databaseSchema: "D1 SQLite",
        totalRecords: {
          users: users.results.length,
          documentAssignees: documentAssignees.results.length,
          documentTypes: documentTypes.results.length,
          documents: documents.results.length,
          accessLogs: accessLogs.results.length,
          passwordUsage: passwordUsage.results.length
        }
      },
      data: {
        users: users.results,
        documentAssignees: documentAssignees.results,
        documentTypes: documentTypes.results,
        documents: documents.results,
        accessLogs: accessLogs.results,
        passwordUsage: passwordUsage.results
      }
    };

    return c.json(backup, 200, {
      'Content-Disposition': `attachment; filename="seap-backup-${new Date().toISOString().split('T')[0]}.json"`
    });
  } catch (error) {
    return c.json({
      error: "Erro ao exportar backup do sistema",
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Importar/restaurar backup do sistema
app.post("/api/admin/import-backup", zValidator("json", z.object({
  backup: z.object({
    metadata: z.object({
      exportDate: z.string(),
      systemName: z.string(),
      version: z.string()
    }),
    data: z.object({
      users: z.array(z.any()).optional(),
      documentAssignees: z.array(z.any()).optional(),
      documentTypes: z.array(z.any()).optional(),
      documents: z.array(z.any()).optional(),
      accessLogs: z.array(z.any()).optional(),
      passwordUsage: z.array(z.any()).optional()
    })
  }),
  clearBeforeImport: z.boolean().default(true)
})), async (c) => {
  try {
    const { backup, clearBeforeImport } = c.req.valid("json");

    // Se solicitado, limpar dados existentes antes de importar
    if (clearBeforeImport) {
      await c.env.DB.prepare("DELETE FROM documents").run();
      await c.env.DB.prepare("DELETE FROM access_logs").run();
      await c.env.DB.prepare("DELETE FROM password_usage").run();
      await c.env.DB.prepare("DELETE FROM document_types").run();
      await c.env.DB.prepare("DELETE FROM document_assignees").run();
      await c.env.DB.prepare("DELETE FROM users").run();
    }

    let importedCounts = {
      users: 0,
      documentAssignees: 0,
      documentTypes: 0,
      documents: 0,
      accessLogs: 0,
      passwordUsage: 0
    };

    // Importar users (tabela base, sem foreign keys)
    if (backup.data.users && backup.data.users.length > 0) {
      for (const user of backup.data.users) {
        await c.env.DB.prepare(`
          INSERT INTO users (id, name, email, role, matricula, password, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          user.id, user.name, user.email, user.role, user.matricula,
          user.password, user.is_active, user.created_at, user.updated_at
        ).run();
        importedCounts.users++;
      }
    }

    // Importar document_assignees (tabela base, sem foreign keys)
    if (backup.data.documentAssignees && backup.data.documentAssignees.length > 0) {
      for (const assignee of backup.data.documentAssignees) {
        await c.env.DB.prepare(`
          INSERT INTO document_assignees (id, first_name, last_name, department, position, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          assignee.id, assignee.first_name, assignee.last_name, assignee.department,
          assignee.position, assignee.is_active, assignee.created_at, assignee.updated_at
        ).run();
        importedCounts.documentAssignees++;
      }
    }

    // Importar document_types (tabela base, sem foreign keys)
    if (backup.data.documentTypes && backup.data.documentTypes.length > 0) {
      for (const type of backup.data.documentTypes) {
        await c.env.DB.prepare(`
          INSERT INTO document_types (id, name, color, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          type.id, type.name, type.color, type.is_active, type.created_at, type.updated_at
        ).run();
        importedCounts.documentTypes++;
      }
    }

    // Importar documents (depende de users e document_assignees)
    if (backup.data.documents && backup.data.documents.length > 0) {
      for (const doc of backup.data.documents) {
        await c.env.DB.prepare(`
          INSERT INTO documents (id, title, type, status, assigned_to, document_assignee_id,
            deadline, description, priority, completion_date, process_number, prisoner_name, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          doc.id, doc.title, doc.type, doc.status, doc.assigned_to, doc.document_assignee_id,
          doc.deadline, doc.description, doc.priority, doc.completion_date,
          doc.process_number, doc.prisoner_name, doc.created_at, doc.updated_at
        ).run();
        importedCounts.documents++;
      }
    }

    // Importar access_logs (depende de users)
    if (backup.data.accessLogs && backup.data.accessLogs.length > 0) {
      for (const log of backup.data.accessLogs) {
        await c.env.DB.prepare(`
          INSERT INTO access_logs (id, user_id, matricula, login_time, logout_time,
            ip_address, user_agent, session_active, login_success, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          log.id, log.user_id, log.matricula, log.login_time, log.logout_time,
          log.ip_address, log.user_agent, log.session_active, log.login_success,
          log.created_at, log.updated_at
        ).run();
        importedCounts.accessLogs++;
      }
    }

    // Importar password_usage
    if (backup.data.passwordUsage && backup.data.passwordUsage.length > 0) {
      for (const usage of backup.data.passwordUsage) {
        await c.env.DB.prepare(`
          INSERT INTO password_usage (id, password_type, used_at)
          VALUES (?, ?, ?)
        `).bind(usage.id, usage.password_type, usage.used_at).run();
        importedCounts.passwordUsage++;
      }
    }

    return c.json({
      success: true,
      message: "Backup importado com sucesso!",
      imported: importedCounts,
      metadata: backup.metadata
    });
  } catch (error) {
    return c.json({
      error: "Erro ao importar backup do sistema",
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// ROTA PRINCIPAL: RELATÓRIO DE PRODUTIVIDADE
app.get("/api/reports/productivity", async (c) => {
  try {
    // 1. BUSCAR DADOS DO BANCO
    const activeDocsResult = await executeQuery(c.env, "SELECT * FROM documents WHERE status != 'Arquivado'");
    const archivedDocsResult = await executeQuery(c.env, "SELECT * FROM documents WHERE status = 'Arquivado'");
    const usersResult = await executeQuery(c.env, "SELECT * FROM users WHERE is_active = 1");
    
    const activeDocuments = activeDocsResult.results;
    const archivedDocuments = archivedDocsResult.results;
    const users = usersResult.results as User[];
    
    // 2. CALCULAR ESTATÍSTICAS GERAIS
    const totalDocuments = activeDocuments.length + archivedDocuments.length;
    const completedDocuments = activeDocuments.filter((doc: any) => doc.status === 'Concluído').length + archivedDocuments.length;
    const inProgressDocuments = activeDocuments.filter((doc: any) => doc.status === 'Em Andamento').length;
    
    const now = new Date();
    const overdueDocuments = activeDocuments.filter((doc: any) => {
      if (!doc.deadline) return false;
      const deadline = new Date(doc.deadline);
      return deadline < now && doc.status !== 'Concluído';
    }).length;
    
    const completionRate = totalDocuments > 0 ? (completedDocuments / totalDocuments) * 100 : 0;
    
    // 2.1. GERAR DADOS PARA GRÁFICOS CORRIGIDOS
    const allDocuments = [...activeDocuments, ...archivedDocuments];
    
    // Gráfico Semanal CORRIGIDO - Sempre mostrar situação atual para última semana
    const weeklyData = [];
    const today = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      let weekDocs;
      
      if (i === 0) {
        // SEMANA ATUAL: Mostrar TODOS os documentos com status atual
        weekDocs = allDocuments;
      } else if (i === 1) {
        // SEMANA PASSADA: Mostrar documentos como estavam na semana passada
        // Para simplificar, mostrar todos os documentos existentes
        weekDocs = allDocuments;
      } else {
        // SEMANAS ANTIGAS: Mostrar apenas os que foram criados naquela semana
        weekDocs = allDocuments.filter((doc: any) => {
          const createdAt = new Date(doc.created_at);
          return createdAt >= weekStart && createdAt <= weekEnd;
        });
      }
      
      // Contar por status ATUAL (não histórico)
      const completedInWeek = weekDocs.filter((doc: any) => 
        doc.status === 'Concluído' || doc.status === 'Arquivado'
      ).length;
      
      const inProgressInWeek = weekDocs.filter((doc: any) => doc.status === 'Em Andamento').length;

      // Adicionar tipos de documentos da semana
      const weekDocsByType: Record<string, number> = {};
      weekDocs.forEach((doc: any) => {
        if (doc.type) {
          weekDocsByType[doc.type] = (weekDocsByType[doc.type] || 0) + 1;
        }
      });
      
      weeklyData.push({
        period: `Sem ${8 - i}`,
        total: weekDocs.length,
        concluidos: completedInWeek,
        emAndamento: inProgressInWeek,
        date: weekStart.toISOString().split('T')[0],
        ...weekDocsByType
      });
    }
    
    // Gráfico Mensal CORRIGIDO - Mostrar situação atual para mês corrente
    const monthlyData = [];
    const currentDate = new Date(today);
    
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(currentDate);
      monthStart.setMonth(currentDate.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthStart.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);
      
      let monthDocs;
      
      if (i === 0) {
        // MÊS ATUAL: Mostrar TODOS os documentos com status atual
        monthDocs = allDocuments;
      } else if (i === 1) {
        // MÊS PASSADO: Mostrar todos os documentos existentes (simplificado)
        monthDocs = allDocuments;
      } else {
        // MESES ANTIGOS: Mostrar apenas os que foram criados naquele mês
        monthDocs = allDocuments.filter((doc: any) => {
          const createdAt = new Date(doc.created_at);
          return createdAt >= monthStart && createdAt <= monthEnd;
        });
      }
      
      // Contar por status ATUAL (não histórico)
      const completedInMonth = monthDocs.filter((doc: any) => 
        doc.status === 'Concluído' || doc.status === 'Arquivado'
      ).length;
      
      const inProgressInMonth = monthDocs.filter((doc: any) => doc.status === 'Em Andamento').length;

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      // Adicionar tipos de documentos do mês
      const monthDocsByType: Record<string, number> = {};
      monthDocs.forEach((doc: any) => {
        if (doc.type) {
          monthDocsByType[doc.type] = (monthDocsByType[doc.type] || 0) + 1;
        }
      });
      
      monthlyData.push({
        period: monthNames[monthStart.getMonth()],
        total: monthDocs.length,
        concluidos: completedInMonth,
        emAndamento: inProgressInMonth,
        date: monthStart.toISOString().split('T')[0],
        ...monthDocsByType
      });
    }
    
    // Gráfico Anual (últimos 3 anos)
    const annualData = [];
    for (let i = 2; i >= 0; i--) {
      const yearStart = new Date();
      yearStart.setFullYear(yearStart.getFullYear() - i);
      yearStart.setMonth(0, 1);
      yearStart.setHours(0, 0, 0, 0);
      
      const yearEnd = new Date(yearStart);
      yearEnd.setFullYear(yearEnd.getFullYear() + 1);
      yearEnd.setDate(0);
      yearEnd.setHours(23, 59, 59, 999);
      
      const yearDocs = allDocuments.filter((doc: any) => {
        const createdAt = new Date(doc.created_at);
        return createdAt >= yearStart && createdAt <= yearEnd;
      });
      
      const completedInYear = yearDocs.filter((doc: any) => 
        doc.status === 'Concluído' || doc.status === 'Arquivado'
      ).length;
      
      annualData.push({
        period: yearStart.getFullYear().toString(),
        total: yearDocs.length,
        concluidos: completedInYear,
        emAndamento: yearDocs.filter((doc: any) => doc.status === 'Em Andamento').length,
        // Adicionar contagem dinâmica por tipo - SIMPLIFICADO
        ...(() => {
          const yearDocsByType: Record<string, number> = {};
          // Contar tipos reais presentes nos documentos deste ano
          yearDocs.forEach((doc: any) => {
            if (doc.type) {
              yearDocsByType[doc.type] = (yearDocsByType[doc.type] || 0) + 1;
            }
          });
          
          return yearDocsByType;
        })(),
        date: yearStart.toISOString().split('T')[0]
      });
    }
    
    // 3. PROCESSAR CADA RESPONSÁVEL INDIVIDUALMENTE (INCLUINDO USUÁRIOS DE LOGIN E RESPONSÁVEIS)
    const assigneesResult = await executeQuery(c.env, "SELECT * FROM document_assignees WHERE is_active = 1");
    const assignees = assigneesResult.results;
    
    // Combinar usuários de login e responsáveis por documentos
    const allResponsibles = [
      ...users.map(user => ({
        id: user.id,
        name: user.name,
        type: 'user' as const
      })),
      ...assignees.map((assignee: any) => ({
        id: assignee.id,
        name: `${assignee.first_name} ${assignee.last_name}`,
        type: 'assignee' as const
      }))
    ];
    
    const userProductivity = allResponsibles.map(responsible => {
      // Buscar documentos atribuídos baseado no tipo (incluindo arquivados)
      const responsibleActiveDocuments = activeDocuments.filter((doc: any) => {
        if (responsible.type === 'user') {
          return doc.assigned_to === responsible.id;
        } else {
          return doc.document_assignee_id === responsible.id;
        }
      });
      
      const responsibleArchivedDocuments = archivedDocuments.filter((doc: any) => {
        if (responsible.type === 'user') {
          return doc.assigned_to === responsible.id;
        } else {
          return doc.document_assignee_id === responsible.id;
        }
      });
      
      const responsibleDocuments = [...responsibleActiveDocuments, ...responsibleArchivedDocuments];
      
      // Documentos concluídos = Com status 'Concluído' + Arquivados (que são concluídos finalizados)
      const completedDocuments = responsibleActiveDocuments.filter((doc: any) => doc.status === 'Concluído').length + responsibleArchivedDocuments.length;
      const inProgressDocuments = responsibleActiveDocuments.filter((doc: any) => doc.status === 'Em Andamento').length;
      const overdueDocuments = responsibleActiveDocuments.filter((doc: any) => {
        if (!doc.deadline) return false;
        const deadline = new Date(doc.deadline);
        return deadline < now && doc.status !== 'Concluído';
      }).length;
      
      const completionRate = responsibleDocuments.length > 0 ? (completedDocuments / responsibleDocuments.length) * 100 : 0;
      
      return {
        userId: responsible.id,
        userName: responsible.name,
        totalDocuments: responsibleDocuments.length,
        completedDocuments,
        inProgressDocuments,
        overdueDocuments,
        completionRate,
        averageCompletionTime: 0,
        documentsByType: (() => {
          const docsByType: Record<string, number> = {};
          // Contar tipos reais dos documentos do responsável
          responsibleDocuments.forEach((doc: any) => {
            if (doc.type) {
              docsByType[doc.type] = (docsByType[doc.type] || 0) + 1;
            }
          });
          
          return docsByType;
        })(),
        monthlyProduction: [],
      };
    }).filter(productivity => productivity.totalDocuments > 0); // Só incluir quem tem documentos
    
    // 4. CALCULAR DOCUMENTOS POR TIPO DINAMICAMENTE - SIMPLIFICADO
    const documentsByType: Record<string, number> = {};
    
    // Contar documentos por tipo real (mantendo nome original)
    allDocuments.forEach((doc: any) => {
      if (doc.type) {
        documentsByType[doc.type] = (documentsByType[doc.type] || 0) + 1;
      }
    });

    // 4. MONTAR RESPOSTA FINAL
    const productivityReport: ProductivityReport = {
      totalDocuments,
      completedDocuments,
      inProgressDocuments,
      overdueDocuments,
      averageCompletionTime: 0,
      completionRate,
      documentsByType,
      dailyProduction: [],
      monthlyTrends: monthlyData,
      weeklyTrends: weeklyData,
      annualTrends: annualData,
      userProductivity: userProductivity
    };
    
    // 5. CONFIGURAR CACHE E RETORNAR
    c.res.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    c.res.headers.set('Pragma', 'no-cache');
    c.res.headers.set('Expires', '0');
    
    return c.json(productivityReport);
    
  } catch (error) {
    return c.json({ error: "Failed to generate productivity report" }, 500);
  }
});

export default app;
