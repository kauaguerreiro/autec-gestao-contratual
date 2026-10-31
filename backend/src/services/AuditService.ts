import { AuditRepository } from '../repositories/AuditRepository.js';

/** Registra ações relevantes (login, salvamento, upload, uso da IA) para auditoria. */
export class AuditService {
  constructor(private readonly repo: AuditRepository) {}

  record(orgId: number | null, userId: number | null, action: string, detail?: unknown): void {
    try {
      this.repo.log(orgId, userId, action, detail);
    } catch {
      /* auditoria nunca deve derrubar a requisição */
    }
  }

  recent(orgId: number, limit?: number) {
    return this.repo.recent(orgId, limit);
  }
}
