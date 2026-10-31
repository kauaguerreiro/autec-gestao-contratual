import fs from 'node:fs';
import path from 'node:path';
import type { StoredFile } from '../models/index.js';
import { FileRepository } from '../repositories/FileRepository.js';
import { HttpError } from '../utils/HttpError.js';

const ALLOWED = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream',
]);

/** Guarda os arquivos originais dos contratos em disco (pasta STORAGE_DIR). */
export class FileStorageService {
  constructor(private readonly repo: FileRepository, private readonly baseDir: string) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  save(orgId: number, userId: number, documentId: string, body: Buffer, mime: string, originalName: string | null): StoredFile {
    if (!body?.length) throw HttpError.badRequest('Arquivo vazio');
    const type = (mime || 'application/octet-stream').split(';')[0]!.trim();
    if (!ALLOWED.has(type)) throw HttpError.badRequest('Formato não suportado. Envie PDF, DOC ou DOCX.');
    const safeId = documentId.replace(/[^\w.-]/g, '_');
    const dir = path.join(this.baseDir, String(orgId));
    fs.mkdirSync(dir, { recursive: true });
    const storagePath = path.join(dir, safeId);
    fs.writeFileSync(storagePath, body);
    this.repo.upsert({ orgId, documentId, mime: type, size: body.length, originalName, storagePath, uploadedBy: userId });
    return this.repo.find(orgId, documentId)!;
  }

  read(orgId: number, documentId: string): { meta: StoredFile; stream: fs.ReadStream } {
    const meta = this.repo.find(orgId, documentId);
    if (!meta || !fs.existsSync(meta.storagePath)) throw HttpError.notFound('Arquivo não encontrado');
    return { meta, stream: fs.createReadStream(meta.storagePath) };
  }

  remove(orgId: number, documentId: string): void {
    const meta = this.repo.find(orgId, documentId);
    if (meta) fs.rmSync(meta.storagePath, { force: true });
    this.repo.delete(orgId, documentId);
  }
}
