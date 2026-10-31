import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../utils/HttpError.js';

/** Resposta de erro padronizada: { error: { message, details? } } */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: { message: 'Dados inválidos', details: err.flatten().fieldErrors } });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { message: err.message, ...(err.details ? { details: err.details } : {}) } });
  }
  if ((err as any)?.type === 'entity.too.large') {
    return res.status(413).json({ error: { message: 'Arquivo ou conteúdo grande demais' } });
  }
  console.error(err);
  return res.status(500).json({ error: { message: 'Erro interno do servidor' } });
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: { message: 'Rota não encontrada' } });
}
