import { env } from './config/env.js';
import { Database } from './database/Database.js';
import { AuditRepository } from './repositories/AuditRepository.js';
import { FileRepository } from './repositories/FileRepository.js';
import { OrganizationRepository } from './repositories/OrganizationRepository.js';
import { UserRepository } from './repositories/UserRepository.js';
import { WorkspaceRepository } from './repositories/WorkspaceRepository.js';
import { AiService } from './services/AiService.js';
import { AuditService } from './services/AuditService.js';
import { AuthService } from './services/AuthService.js';
import { FileStorageService } from './services/FileStorageService.js';
import { ReportService } from './services/ReportService.js';
import { WorkspaceService } from './services/WorkspaceService.js';

/**
 * Monta as dependências da aplicação (injeção de dependência manual).
 * Cada camada recebe apenas o que precisa: repositórios → serviços → controladores.
 */
export function buildContainer(opts: { databaseFile?: string; storageDir?: string } = {}) {
  const database = Database.open(opts.databaseFile ?? env.databaseFile);
  database.migrate();
  const db = database.db;

  const repos = {
    orgs: new OrganizationRepository(db),
    users: new UserRepository(db),
    workspace: new WorkspaceRepository(db),
    files: new FileRepository(db),
    audit: new AuditRepository(db),
  };
  const audit = new AuditService(repos.audit);
  const files = new FileStorageService(repos.files, opts.storageDir ?? env.storageDir);
  const services = {
    audit,
    files,
    auth: new AuthService(repos.users, repos.orgs, audit),
    workspace: new WorkspaceService(repos.workspace, repos.orgs, files, audit),
    ai: new AiService(),
    reports: new ReportService(db),
  };
  return { database, repos, services };
}

export type Container = ReturnType<typeof buildContainer>;
