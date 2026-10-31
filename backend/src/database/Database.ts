import BetterSqlite3 from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Conexão única com o banco SQLite e execução das migrações.
 * Para trocar por PostgreSQL no futuro, basta reimplementar os repositórios.
 */
export class Database {
  private static instance: Database | null = null;
  readonly db: BetterSqlite3.Database;

  private constructor(file: string) {
    if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
    this.db = new BetterSqlite3(file);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  static open(file: string): Database {
    if (!Database.instance) Database.instance = new Database(file);
    return Database.instance;
  }

  static close(): void {
    Database.instance?.db.close();
    Database.instance = null;
  }

  /** Aplica, em ordem, os arquivos .sql ainda não executados. */
  migrate(): string[] {
    this.db.exec(`CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')))`);
    const dir = path.join(here, 'migrations');
    const done = new Set(this.db.prepare('SELECT name FROM _migrations').all().map((r: any) => r.name));
    const applied: string[] = [];
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
      if (done.has(file)) continue;
      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      this.db.transaction(() => {
        this.db.exec(sql);
        this.db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
      })();
      applied.push(file);
    }
    return applied;
  }
}
