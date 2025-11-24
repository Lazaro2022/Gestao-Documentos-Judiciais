# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SEAP - Sistema de Gestão de Documentos Judiciais** is a judicial document management system built with React + Vite frontend and Hono backend, deployed on Cloudflare Workers with D1 (SQLite) database and R2 storage.

This is a Mocha App (https://getmocha.com) project for managing judicial documents in a correctional facility, tracking document types, assignees, users, and productivity reports.

## Development Commands

### Core Commands
```bash
npm install                 # Install dependencies
npm run dev                 # Start development server (Vite)
npm run build               # Build production bundle (TypeScript + Vite)
npm run lint                # Run ESLint
npm run check               # Full check: TypeScript + build + dry-run deploy
npm run cf-typegen          # Generate Cloudflare Worker types from wrangler.json
```

### Cloudflare Deployment (via Wrangler)
```bash
wrangler deploy             # Deploy to Cloudflare Workers
wrangler deploy --dry-run   # Test deployment without publishing
wrangler d1 execute DB --local --file=schema.sql  # Run SQL migrations locally
wrangler d1 execute DB --remote --file=schema.sql # Run SQL migrations on production
```

## Architecture

### Tech Stack
- **Frontend**: React 19, React Router 7, TypeScript, Tailwind CSS, Recharts/Chart.js for data visualization
- **Backend**: Hono 4.7.7 (lightweight Express alternative), Zod for validation
- **Database**: Cloudflare D1 (SQLite-compatible)
- **Storage**: Cloudflare R2 (S3-compatible object storage)
- **Build**: Vite 7 with Cloudflare Workers plugin
- **Deployment**: Cloudflare Workers (edge computing)

### Project Structure
```
src/
├── react-app/              # Frontend React application
│   ├── components/         # Reusable UI components
│   │   ├── Layout.tsx                      # Main app layout with sidebar navigation
│   │   ├── ProtectedRoute.tsx              # Authentication guard component
│   │   ├── DocumentTypesManager.tsx        # Modal for managing document types
│   │   ├── DocumentAssigneesManager.tsx    # Modal for managing assignees
│   │   ├── ProductivityCharts.tsx          # Charts for reports
│   │   └── PDFReportGenerator.tsx          # PDF export functionality
│   ├── pages/              # Page components (routes)
│   │   ├── Login.tsx       # Dual login system (individual + legacy)
│   │   ├── Home.tsx        # Dashboard
│   │   ├── Documents.tsx   # Document CRUD management
│   │   ├── Users.tsx       # User management
│   │   ├── Reports.tsx     # Productivity reports
│   │   └── Settings.tsx    # System settings
│   ├── hooks/              # Custom React hooks
│   │   └── useProductivityReport.ts
│   └── main.tsx            # React app entry point
├── worker/                 # Backend Cloudflare Worker
│   └── index.ts            # Hono API routes (auth, documents, users, reports)
└── shared/                 # Shared code between frontend and backend
    └── types.ts            # Zod schemas and TypeScript types
```

### Database Schema

The system uses **5 core tables** in Cloudflare D1:

1. **`users`** - Login users (for individual authentication by matricula/password)
   - Used for role-based access control (admin/user)

2. **`document_assignees`** - Document responsibility assignees (NOT login users)
   - Separate from login users - represents people responsible for documents
   - Has first_name, last_name, department, position

3. **`document_types`** - Dynamic document types with colors
   - Admin can create/edit/deactivate custom types

4. **`documents`** - Core document records
   - Can be assigned to EITHER a login user (`assigned_to`) OR a document assignee (`document_assignee_id`)
   - Statuses: "Em Andamento", "Concluído", "Arquivado"
   - Includes judicial fields: `process_number`, `prisoner_name`

5. **`access_logs`** - Login/logout audit trail
   - Tracks IP addresses, user agents, session times, success/failure

**Important**: The system has TWO separate concepts:
- **Login Users** (`users` table) - People who can log into the system
- **Document Assignees** (`document_assignees` table) - People responsible for documents (may or may not have login access)

### Dual Authentication System

The system supports **two authentication modes** simultaneously:

1. **Individual Login** (Primary): Users log in with matricula + password
   - Route: `POST /api/auth/login`
   - Validates against `users` table
   - Stores user data in localStorage: `seap_user_data`

2. **Legacy Login** (Shared passwords): Admin/user roles via environment passwords
   - Route: `POST /api/auth/login-legacy`
   - Uses environment variables: `SEAP_ADMIN_PASSWORD`, `SEAP_USER_PASSWORD`
   - Stores user type in localStorage: `seap_user_type`

**Session Management**:
- Sessions expire after 24 hours
- `ProtectedRoute` component checks authentication and session validity
- Logout route: `POST /api/auth/logout` (updates access_logs)

See [SISTEMA_LOGIN_IMPLEMENTACAO.md](SISTEMA_LOGIN_IMPLEMENTACAO.md) for detailed authentication documentation.

## API Routes (src/worker/index.ts)

### Authentication
- `POST /api/auth/login` - Individual login (matricula + password)
- `POST /api/auth/login-legacy` - Legacy login (shared passwords)
- `POST /api/auth/logout` - Logout with session tracking

### Document Types
- `GET /api/document-types` - List all types
- `POST /api/document-types` - Create new type
- `PUT /api/document-types/:id` - Update type
- `PATCH /api/document-types/:id/toggle-status` - Activate/deactivate type
- `DELETE /api/document-types/:id` - Delete type (if no documents use it)

### Document Assignees (Responsáveis)
- `GET /api/document-assignees` - List all assignees
- `POST /api/document-assignees` - Create assignee
- `PUT /api/document-assignees/:id` - Update assignee
- `PATCH /api/document-assignees/:id/toggle-status` - Activate/deactivate
- `DELETE /api/document-assignees/:id` - Delete assignee (if no assigned documents)

### Users (Login Users)
- `GET /api/users` - List active users
- `POST /api/users` - Create user (requires unique matricula)
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/toggle-status` - Activate/deactivate user
- `DELETE /api/users/:id` - Delete user (if no assigned documents)

### Documents
- `GET /api/documents` - List all documents (with LEFT JOINs for assignees/users)
- `POST /api/documents` - Create document
- `PUT /api/documents/:id` - Update entire document
- `PATCH /api/documents/:id/status` - Update status only
- `DELETE /api/documents/:id` - Delete single document

### Reports
- `GET /api/reports/productivity` - Generate comprehensive productivity report
  - Returns statistics by user, by document type, by time period
  - Includes weekly/monthly/annual trends
  - **Important**: Uses complex logic to show current status for recent periods

### Admin Routes (Dangerous - require confirmation dialogs)
- `DELETE /api/admin/clear-documents` - Delete ALL documents
- `DELETE /api/admin/clear-document-types` - Delete ALL types
- `DELETE /api/admin/clear-document-assignees` - Delete ALL assignees
- `DELETE /api/admin/clear-users` - Delete all users (except admins)
- `DELETE /api/admin/clear-access-logs` - Clear access logs
- `DELETE /api/admin/reset-system` - Full system reset
- `GET /api/admin/access-logs` - View login/logout logs (last 100)

## Important Implementation Details

### Path Alias
The project uses `@` as an alias for `./src`:
```typescript
import Layout from '@/react-app/components/Layout';
import { User } from '@/shared/types';
```

### Document Assignment Logic
When creating/editing documents, the system allows choosing between:
- `assignment_type: 'user'` → Uses `assigned_to` field (login user ID)
- `assignment_type: 'assignee'` → Uses `document_assignee_id` field

The backend JOIN query shows both in the response:
- `assigned_user_name` (from users table)
- `assigned_assignee_name` (from document_assignees table)

### Productivity Report Calculation
The `/api/reports/productivity` endpoint has special logic:
- For **current week/month**: Shows ALL documents with their CURRENT status
- For **past periods**: Shows only documents created in that period
- This prevents empty recent data when documents were created months ago

### TypeScript Configuration
The project uses **3 separate tsconfig files**:
- `tsconfig.app.json` - Frontend React app
- `tsconfig.worker.json` - Backend Hono worker
- `tsconfig.node.json` - Build tools (Vite config)

Main `tsconfig.json` is a composite that references all three.

### Environment Variables (Cloudflare Secrets)
Required secrets for deployment:
```bash
SEAP_ADMIN_PASSWORD=<admin_shared_password>
SEAP_USER_PASSWORD=<user_shared_password>
```

Set via: `wrangler secret put SEAP_ADMIN_PASSWORD`

### Cloudflare Bindings
Defined in [wrangler.json](wrangler.json):
- `DB` - D1 database binding
  - Application Name: `gestao-documentos-judiciais`
  - Database Name: `gestao-documentos-judiciais`
  - Database ID: `9bb19773-880d-4eb7-88d3-2c21ac637bd4`
- `R2_BUCKET` - R2 storage binding (for future file uploads)
  - Bucket Name: `gestao-documentos-judiciais`

## Development Guidelines

### Working with Documents
- Always check if a document uses `assigned_to` OR `document_assignee_id` (not both)
- Status workflow: "Em Andamento" → "Concluído" → "Arquivado"
- When marking "Concluído", set `completion_date` to current timestamp
- Documents can be "desarquivado" (moved back to "Concluído" status)

### Validation
All API endpoints use Zod validators via `@hono/zod-validator`:
```typescript
app.post("/api/documents", zValidator("json", z.object({
  title: z.string(),
  type: z.string(),
  // ...
})), async (c) => { ... });
```

Type definitions in `src/shared/types.ts` are derived from Zod schemas using `z.infer<>`.

### Database Queries
Use parameterized queries to prevent SQL injection:
```typescript
await c.env.DB.prepare("SELECT * FROM users WHERE matricula = ?")
  .bind(matricula)
  .first();
```

For multiple results: `.all()` returns `{ results: [], success: boolean }`
For single result: `.first()` returns the object directly (or null)

### Adding New Features
1. Update types in `src/shared/types.ts` (Zod schema first)
2. Add backend route in `src/worker/index.ts`
3. Create/update React component in `src/react-app/`
4. Update database schema if needed (create migration SQL)

## Common Tasks

### Adding a New Document Type
1. Admin goes to Documents page → "Gerenciar Tipos" button
2. Opens DocumentTypesManager modal
3. Creates type with name + color
4. Type is immediately available in document creation form

### Creating a New User
1. Admin goes to Users page → "Novo Usuário" button
2. Fills: name, email (optional), role, matricula, password
3. Backend validates unique matricula
4. User can now log in with matricula + password

### Resetting the System
Use the Settings page → "Reset Completo do Sistema" button
- **WARNING**: Deletes ALL data (documents, types, assignees, users, logs)
- Requires typing "CONFIRMAR RESET" in confirmation dialog

### Debugging Authentication Issues
Check localStorage in browser DevTools:
- `seap_authenticated` - Should be "true"
- `seap_login_time` - ISO timestamp of login
- `seap_user_data` - JSON object with user info (individual login)
- `seap_user_type` - "admin" or "user" (legacy login)

Session expires after 24 hours - check `ProtectedRoute.tsx` logic.

## Testing Locally

```bash
npm run dev
# Vite dev server starts on http://localhost:5173
# Uses local Cloudflare Workers environment
# Database: Local D1 instance (SQLite file)
```

For database operations during local development, use:
```bash
wrangler d1 execute DB --local --command="SELECT * FROM users"
```

## Deployment

### Quick Deploy

```bash
npm run build           # Build frontend and worker
wrangler deploy         # Deploy to Cloudflare
```

The app is deployed as a single Cloudflare Worker with:
- Worker script handling API routes (Hono)
- Static assets served from `/assets` (Vite build output)
- SPA routing configured via `"not_found_handling": "single-page-application"`

### Cloning and Deploying a New Instance

For complete step-by-step instructions to clone and deploy this project to a new Cloudflare account, see:

📖 **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide

**Quick Summary**:

1. Clone repository
2. Install dependencies: `npm install --legacy-peer-deps`
3. Create Cloudflare API token with Workers + D1 permissions
4. Authenticate: `export CLOUDFLARE_API_TOKEN="your-token"`
5. Create D1 database: `wrangler d1 create gestao-documentos-judiciais`
6. Update `wrangler.json` with new `database_id`
7. Run migration: `wrangler d1 execute DB --remote --file=schema.sql`
8. Configure secrets:
   ```bash
   echo "Guardiao" | wrangler secret put SEAP_ADMIN_PASSWORD
   echo "Usuario123" | wrangler secret put SEAP_USER_PASSWORD
   ```
9. Build and deploy: `npm run build && wrangler deploy`

**Files to Reference**:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [schema.sql](./schema.sql) - Database schema
- [.env.example](./.env.example) - Environment variables template
- [README.md](./README.md) - Project overview
