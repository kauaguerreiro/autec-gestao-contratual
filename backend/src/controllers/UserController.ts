import type { Request, Response } from 'express';
import { UserRepository } from '../repositories/UserRepository.js';
import { AuditService } from '../services/AuditService.js';
import { AuthService } from '../services/AuthService.js';
import { HttpError } from '../utils/HttpError.js';
import { resetPasswordSchema, updateUserSchema } from './schemas.js';

/** Administração de usuários (somente perfil admin). */
export class UserController {
  constructor(private readonly users: UserRepository, private readonly auth: AuthService, private readonly audit: AuditService) {}

  list = (req: Request, res: Response) => {
    res.json({ users: this.users.listByOrg(req.user!.orgId) });
  };

  update = (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const target = this.users.findById(id);
    if (!target || target.orgId !== req.user!.orgId) throw HttpError.notFound('Usuário não encontrado');
    if (id === req.user!.id && req.body.role === 'user') throw HttpError.badRequest('Você não pode remover seu próprio perfil de administrador');
    this.users.update(id, updateUserSchema.parse(req.body));
    this.audit.record(req.user!.orgId, req.user!.id, 'user.update', { id, ...req.body });
    res.status(204).end();
  };

  resetPassword = async (req: Request, res: Response) => {
    const { password } = resetPasswordSchema.parse(req.body);
    await this.auth.resetPassword(req.user!, Number(req.params.id), password);
    res.status(204).end();
  };

  auditLog = (req: Request, res: Response) => {
    res.json({ entries: this.audit.recent(req.user!.orgId, Math.min(Number(req.query.limit) || 100, 500)) });
  };
}
