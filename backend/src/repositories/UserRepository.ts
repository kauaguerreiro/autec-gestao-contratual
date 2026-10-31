import type BetterSqlite3 from 'better-sqlite3';
import type { Role, User, UserWithHash } from '../models/index.js';

const map = (r: any): UserWithHash => ({
  id: r.id,
  orgId: r.org_id,
  name: r.name,
  email: r.email,
  role: r.role,
  initials: r.initials,
  active: !!r.active,
  createdAt: r.created_at,
  lastLoginAt: r.last_login_at,
  passwordHash: r.password_hash,
});

export class UserRepository {
  constructor(private readonly db: BetterSqlite3.Database) {}

  count(): number {
    return (this.db.prepare('SELECT COUNT(*) AS n FROM users').get() as any).n;
  }

  findByEmail(email: string): UserWithHash | undefined {
    const r = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    return r ? map(r) : undefined;
  }

  findById(id: number): UserWithHash | undefined {
    const r = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return r ? map(r) : undefined;
  }

  listByOrg(orgId: number): User[] {
    return this.db.prepare('SELECT * FROM users WHERE org_id = ? ORDER BY name').all(orgId).map((r) => strip(map(r)));
  }

  create(data: { orgId: number; name: string; email: string; passwordHash: string; role: Role; initials: string }): UserWithHash {
    const id = this.db
      .prepare('INSERT INTO users (org_id, name, email, password_hash, role, initials) VALUES (?, ?, ?, ?, ?, ?)')
      .run(data.orgId, data.name, data.email.toLowerCase(), data.passwordHash, data.role, data.initials).lastInsertRowid;
    return this.findById(Number(id))!;
  }

  updatePassword(id: number, passwordHash: string): void {
    this.db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, id);
  }

  update(id: number, data: Partial<{ role: Role; active: boolean; name: string }>): void {
    if (data.role) this.db.prepare('UPDATE users SET role = ? WHERE id = ?').run(data.role, id);
    if (data.active !== undefined) this.db.prepare('UPDATE users SET active = ? WHERE id = ?').run(data.active ? 1 : 0, id);
    if (data.name) this.db.prepare('UPDATE users SET name = ? WHERE id = ?').run(data.name, id);
  }

  touchLogin(id: number): void {
    this.db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(id);
  }
}

/** Remove o hash da senha antes de devolver o usuário. */
export function strip(u: UserWithHash): User {
  const { passwordHash: _ignored, ...rest } = u;
  return rest;
}
