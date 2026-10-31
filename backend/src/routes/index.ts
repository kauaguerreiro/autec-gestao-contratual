import express, { Router } from 'express';
import { env } from '../config/env.js';
import type { Container } from '../container.js';
import { AiController } from '../controllers/AiController.js';
import { AuthController } from '../controllers/AuthController.js';
import { FileController } from '../controllers/FileController.js';
import { ReportController } from '../controllers/ReportController.js';
import { UserController } from '../controllers/UserController.js';
import { WorkspaceController } from '../controllers/WorkspaceController.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';

/** Todas as rotas da API, sob o prefixo /api. Veja docs/API.md. */
export function buildRoutes({ services, repos }: Container): Router {
  const r = Router();
  const auth = authenticate(services.auth);

  const authCtl = new AuthController(services.auth);
  const userCtl = new UserController(repos.users, services.auth, services.audit);
  const wsCtl = new WorkspaceController(services.workspace);
  const fileCtl = new FileController(services.files, services.audit);
  const aiCtl = new AiController(services.ai, services.audit);
  const repCtl = new ReportController(services.reports);

  r.get('/health', (_req, res) => res.json({ ok: true, ai: services.ai.configured, signup: env.allowSignup, version: '1.0.0' }));

  // autenticação
  r.post('/auth/register', express.json(), h(authCtl.register));
  r.post('/auth/login', express.json(), h(authCtl.login));
  r.get('/auth/me', auth, h(authCtl.me));
  r.post('/auth/password', auth, express.json(), h(authCtl.changePassword));

  // usuários (admin)
  r.get('/users', auth, requireRole('admin'), h(userCtl.list));
  r.patch('/users/:id', auth, requireRole('admin'), express.json(), h(userCtl.update));
  r.post('/users/:id/reset-password', auth, requireRole('admin'), express.json(), h(userCtl.resetPassword));
  r.get('/audit', auth, requireRole('admin'), h(userCtl.auditLog));

  // espaço de trabalho (pastas, documentos, alertas)
  r.get('/workspace', auth, h(wsCtl.get));
  r.put('/workspace', auth, express.json({ limit: '20mb' }), h(wsCtl.save));

  // arquivos originais
  const raw = express.raw({ type: () => true, limit: `${env.maxUploadMb}mb` });
  r.put('/documents/:id/file', auth, raw, h(fileCtl.upload));
  r.get('/documents/:id/file', auth, h(fileCtl.download));
  r.delete('/documents/:id/file', auth, h(fileCtl.remove));

  // inteligência artificial (proxy seguro)
  r.post('/ai/messages', auth, express.json({ limit: '45mb' }), h(aiCtl.message));

  // relatórios
  r.get('/reports/summary', auth, h(repCtl.summary));

  return r;
}
