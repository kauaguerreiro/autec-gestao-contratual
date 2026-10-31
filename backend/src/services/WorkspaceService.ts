import type { AuthUser, ContractDocument, Workspace } from '../models/index.js';
import { OrganizationRepository } from '../repositories/OrganizationRepository.js';
import { WorkspaceRepository, buildTree, flattenFolders } from '../repositories/WorkspaceRepository.js';
import { HttpError } from '../utils/HttpError.js';
import { AuditService } from './AuditService.js';
import { FileStorageService } from './FileStorageService.js';

/**
 * Espaço de trabalho da organização: árvore de pastas, documentos e alertas.
 * Usa controle de versão otimista ("rev") para evitar que uma pessoa
 * sobrescreva, sem saber, o que outra acabou de salvar.
 */
export class WorkspaceService {
  constructor(
    private readonly repo: WorkspaceRepository,
    private readonly orgs: OrganizationRepository,
    private readonly files: FileStorageService,
    private readonly audit: AuditService,
  ) {}

  get(orgId: number): Workspace {
    const files: Record<string, ContractDocument[]> = { root: [] };
    for (const d of this.repo.documents(orgId)) (files[d.folderId ?? 'root'] ??= []).push(d.data);
    return { rev: this.orgs.getRev(orgId), folders: buildTree(this.repo.folders(orgId)), files, alerts: this.repo.alerts(orgId) };
  }

  save(user: AuthUser, input: Workspace): { rev: number } {
    const current = this.orgs.getRev(user.orgId);
    if (input.rev !== current) {
      throw HttpError.conflict('O espaço de trabalho foi alterado por outra pessoa. Recarregue para ver a versão mais recente.', { rev: current });
    }

    const folderRows = flattenFolders(input.folders);
    const folderIds = new Set(folderRows.map((f) => f.id));
    const docs = Object.entries(input.files).flatMap(([folderId, list]) =>
      (list ?? []).map((d) => ({ id: String(d.id), folderId: folderId === 'root' || !folderIds.has(folderId) ? null : folderId, data: d })),
    );

    const before = this.repo.documentIds(user.orgId);
    const rev = this.repo.transaction(() => {
      this.repo.replaceAll(user.orgId, folderRows, docs, input.alerts ?? {});
      return this.orgs.bumpRev(user.orgId);
    });

    // remove do disco somente os arquivos de documentos que existiam e foram excluídos agora
    const after = new Set(docs.map((d) => d.id));
    const removed = [...before].filter((id) => !after.has(id));
    removed.forEach((id) => this.files.remove(user.orgId, id));

    this.audit.record(user.orgId, user.id, 'workspace.save', { rev, folders: folderRows.length, documents: docs.length, removed: removed.length });
    return { rev };
  }
}
