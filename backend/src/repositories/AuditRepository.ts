import type BetterSqlite3 from 'better-sqlite3';

export class AuditRepository {
  constructor(private readonly db: BetterSqlite3.Database) {}

  log(orgId: number | null, userId: number | null, action: string, detail?: unknown): void {
    this.db
      .prepare('INSERT INTO audit_log (org_id, user_id, action, detail) VALUES (?, ?, ?, ?)')
      .run(orgId, userId, action, detail === undefined ? null : JSON.stringify(detail));
  }

  recent(orgId: number, limit = 100) {
    return this.db
      .prepare(
        `SELECT a.id, a.action, a.detail, a.at, u.name AS user
         FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
         WHERE a.org_id = ? ORDER BY a.id DESC LIMIT ?`,
      )
      .all(orgId, limit);
  }
}
