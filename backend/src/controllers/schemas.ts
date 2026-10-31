import { z } from 'zod';

/** Validação das entradas da API (mensagens em português). */
export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome completo'),
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo de 8 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  password: z.string().min(1, 'Informe sua senha'),
});

export const oauthSchema = z.object({
  provider: z.enum(['google', 'microsoft']),
  idToken: z.string().min(20).max(8000),
});

export const changePasswordSchema = z.object({
  current: z.string().min(1),
  next: z.string().min(8, 'Mínimo de 8 caracteres'),
});

export const resetPasswordSchema = z.object({ password: z.string().min(8, 'Mínimo de 8 caracteres') });

export const updateUserSchema = z.object({
  role: z.enum(['admin', 'user']).optional(),
  active: z.boolean().optional(),
  name: z.string().trim().min(2).optional(),
});

const folderNode: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().min(1).max(120),
    name: z.string().min(1).max(200),
    icon: z.string().max(40).optional(),
    createdAt: z.string().optional(),
    children: z.array(folderNode).default([]),
  }).passthrough(),
);

export const workspaceSchema = z.object({
  rev: z.number().int().nonnegative(),
  folders: z.array(folderNode),
  files: z.record(z.array(z.object({ id: z.string().min(1).max(120), name: z.string() }).passthrough())),
  alerts: z.record(z.number()).default({}),
});

export const aiSchema = z.object({
  system: z.string().max(20000).optional(),
  max_tokens: z.number().int().positive().max(4000).optional(),
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.any() })).min(1),
});
