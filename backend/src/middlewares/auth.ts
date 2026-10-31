import type { NextFunction, Request, Response } from 'express';
import type { AuthUser, Role } from '../models/index.js';
import type { AuthService } from '../services/AuthService.js';
import { HttpError } from '../utils/HttpError.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { user?: AuthUser }
  }
}

/** Exige um token JWT válido no cabeçalho Authorization: Bearer <token>. */
export const authenticate = (auth: AuthService) => (req: Request, _res: Response, next: NextFunction) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) return next(HttpError.unauthorized());
  try {
    req.user = auth.verify(token);
    next();
  } catch (e) {
    next(e);
  }
};

/** Restringe a rota a determinados perfis. */
export const requireRole = (...roles: Role[]) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) return next(HttpError.forbidden());
  next();
};
