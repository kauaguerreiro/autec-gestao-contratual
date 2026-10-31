import 'dotenv/config';
import path from 'node:path';

/** Lê variáveis de ambiente com valores padrão seguros para desenvolvimento. */
function str(name: string, fallback = ''): string {
  return (process.env[name] ?? fallback).trim();
}

export const env = {
  port: Number(str('PORT', '3000')),
  nodeEnv: str('NODE_ENV', 'development'),
  isProd: str('NODE_ENV') === 'production',
  corsOrigins: str('CORS_ORIGINS').split(',').map((s) => s.trim()).filter(Boolean),

  jwtSecret: str('JWT_SECRET', 'dev-secret-troque-em-producao'),
  jwtExpiresIn: str('JWT_EXPIRES_IN', '12h'),
  allowSignup: str('ALLOW_SIGNUP', 'true') !== 'false',
  orgName: str('ORG_NAME', 'Autec'),

  databaseFile: path.resolve(str('DATABASE_FILE', './data/autec.db')),
  storageDir: path.resolve(str('STORAGE_DIR', './data/files')),
  maxUploadMb: Number(str('MAX_UPLOAD_MB', '25')),

  anthropicApiKey: str('ANTHROPIC_API_KEY'),
  anthropicModel: str('ANTHROPIC_MODEL', 'claude-sonnet-4-6'),

  /** Pasta do front-end servida pelo próprio back-end. */
  frontendDir: path.resolve(str('FRONTEND_DIR', '../frontend')),
};

if (env.isProd && env.jwtSecret === 'dev-secret-troque-em-producao') {
  throw new Error('Defina JWT_SECRET no ambiente de produção.');
}
