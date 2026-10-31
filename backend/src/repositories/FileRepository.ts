import type BetterSqlite3 from 'better-sqlite3';
import type { StoredFile } from '../models/index.js';

const map = (r: any): StoredFile => ({
  orgId: r.org_id, documentId: r.document_id, mime: r.mime, size: r.size,
  originalName: r.original_name, storagePath: r.storage_path, uploadedAt: r.uploaded_at,
});

export class FileRepository {
  constructor(private readonly db: BetterSqlite3.Database) {}

  find(orgId: number, documentId: string): StoredFile | undefined {
    const r = this.db.prepare('SELECT * FROM files WHERE org_id = ? AND document_id = ?').get(orgId, documentId);
    return r ? map(r) : undefined;
  }

  upsert(f: Omit<StoredFile, 'uploadedAt'> & { uploadedBy: number }): void {
    this.db
      .prepare(
        `INSERT INTO files (org_id, document_id, mime, size, original_name, storage_path, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(org_id, document_id) DO UPDATE SET mime=excluded.mime, size=excluded.size,
           original_name=excluded.original_name, storage_path=excluded.storage_path,
           uploaded_by=excluded.uploaded_by, uploaded_at=datetime('now')`,
      )
      .run(f.orgId, f.documentId, f.mime, f.size, f.originalName, f.storagePath, f.uploadedBy);
  }

  delete(orgId: number, documentId: string): void {
    this.db.prepare('DELETE FROM files WHERE org_id = ? AND document_id = ?').run(orgId, documentId);
  }
}
