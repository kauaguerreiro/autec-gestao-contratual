import type BetterSqlite3 from 'better-sqlite3';
import type { ContractDocument, FolderNode } from '../models/index.js';

export interface FolderRow { id: string; parentId: string | null; name: string; icon: string | null; position: number; createdAt: string | null }
export interface DocumentRow { id: string; folderId: string | null; data: ContractDocument }

/** Acesso às tabelas de pastas, documentos e alertas. */
export class WorkspaceRepository {
  constructor(private readonly db: BetterSqlite3.Database) {}

  folders(orgId: number): FolderRow[] {
    return this.db
      .prepare('SELECT id, parent_id AS parentId, name, icon, position, created_at AS createdAt FROM folders WHERE org_id = ? ORDER BY position')
      .all(orgId) as FolderRow[];
  }

  documents(orgId: number): DocumentRow[] {
    return (this.db.prepare('SELECT id, folder_id AS folderId, data FROM documents WHERE org_id = ?').all(orgId) as any[]).map((r) => ({
      id: r.id,
      folderId: r.folderId,
      data: JSON.parse(r.data),
    }));
  }

  documentIds(orgId: number): Set<string> {
    return new Set((this.db.prepare('SELECT id FROM documents WHERE org_id = ?').all(orgId) as any[]).map((r) => r.id));
  }

  alerts(orgId: number): Record<string, number> {
    const out: Record<string, number> = {};
    for (const r of this.db.prepare('SELECT folder_id, days FROM alerts WHERE org_id = ?').all(orgId) as any[]) out[r.folder_id] = r.days;
    return out;
  }

  /** Substitui todo o conteúdo do espaço de trabalho (deve rodar dentro de uma transação). */
  replaceAll(orgId: number, folders: FolderRow[], docs: DocumentRow[], alerts: Record<string, number>): void {
    this.db.prepare('DELETE FROM folders WHERE org_id = ?').run(orgId);
    this.db.prepare('DELETE FROM documents WHERE org_id = ?').run(orgId);
    this.db.prepare('DELETE FROM alerts WHERE org_id = ?').run(orgId);

    const insF = this.db.prepare('INSERT INTO folders (org_id, id, parent_id, name, icon, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const f of folders) insF.run(orgId, f.id, f.parentId, f.name, f.icon, f.position, f.createdAt);

    const insD = this.db.prepare(
      `INSERT INTO documents (org_id, id, folder_id, name, contract_type, start_date, end_date, value_cents, parent_id, processing, updated_at, data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const d of docs) {
      const x = d.data;
      insD.run(
        orgId, d.id, d.folderId, String(x.name ?? ''), x.contractType ?? null, isoOrNull(x.startDate), isoOrNull(x.endDate),
        moneyToCents(x.value), x.parentId ?? null, x.processing ?? null, x.updatedAt ?? null, JSON.stringify(x),
      );
    }

    const insA = this.db.prepare('INSERT INTO alerts (org_id, folder_id, days) VALUES (?, ?, ?)');
    for (const [k, v] of Object.entries(alerts)) if (Number.isFinite(v)) insA.run(orgId, k, Math.round(v));
  }

  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }
}

function isoOrNull(v: unknown): string | null {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

/** "R$ 13.006,28" → 1300628 */
export function moneyToCents(v: unknown): number | null {
  if (typeof v !== 'string') return null;
  const n = Number(v.replace(/[^\d,]/g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
}

/** Converte a árvore aninhada do front-end em linhas planas. */
export function flattenFolders(nodes: FolderNode[], parentId: string | null = null, out: FolderRow[] = []): FolderRow[] {
  nodes.forEach((n, i) => {
    out.push({ id: n.id, parentId, name: n.name, icon: n.icon ?? null, position: i, createdAt: n.createdAt ?? null });
    flattenFolders(n.children ?? [], n.id, out);
  });
  return out;
}

/** Reconstrói a árvore a partir das linhas planas. */
export function buildTree(rows: FolderRow[]): FolderNode[] {
  const byId = new Map<string, FolderNode>();
  rows.forEach((r) => byId.set(r.id, { id: r.id, name: r.name, ...(r.icon ? { icon: r.icon } : {}), ...(r.createdAt ? { createdAt: r.createdAt } : {}), children: [] }));
  const roots: FolderNode[] = [];
  rows.forEach((r) => {
    const node = byId.get(r.id)!;
    const parent = r.parentId ? byId.get(r.parentId) : undefined;
    (parent ? parent.children : roots).push(node);
  });
  return roots;
}
