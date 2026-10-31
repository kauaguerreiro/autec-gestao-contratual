import type BetterSqlite3 from 'better-sqlite3';

export class OrganizationRepository {
  constructor(private readonly db: BetterSqlite3.Database) {}

  first(): { id: number; name: string } | undefined {
    return this.db.prepare('SELECT id, name FROM organizations ORDER BY id LIMIT 1').get() as any;
  }

  create(name: string): number {
    return Number(this.db.prepare('INSERT INTO organizations (name) VALUES (?)').run(name).lastInsertRowid);
  }

  getRev(orgId: number): number {
    const row = this.db.prepare('SELECT workspace_rev AS rev FROM organizations WHERE id = ?').get(orgId) as any;
    return row?.rev ?? 0;
  }

  bumpRev(orgId: number): number {
    this.db.prepare('UPDATE organizations SET workspace_rev = workspace_rev + 1 WHERE id = ?').run(orgId);
    return this.getRev(orgId);
  }
}
