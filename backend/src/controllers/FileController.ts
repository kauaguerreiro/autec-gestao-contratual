import type { Request, Response } from 'express';
import { AuditService } from '../services/AuditService.js';
import { FileStorageService } from '../services/FileStorageService.js';

/** Upload e download do arquivo original de cada documento. */
export class FileController {
  constructor(private readonly storage: FileStorageService, private readonly audit: AuditService) {}

  upload = (req: Request, res: Response) => {
    const name = req.header('x-file-name') ? decodeURIComponent(req.header('x-file-name')!) : null;
    const meta = this.storage.save(req.user!.orgId, req.user!.id, req.params.id!, req.body as Buffer, req.header('content-type') || '', name);
    this.audit.record(req.user!.orgId, req.user!.id, 'file.upload', { documentId: meta.documentId, size: meta.size });
    res.status(201).json({ documentId: meta.documentId, size: meta.size, mime: meta.mime });
  };

  download = (req: Request, res: Response) => {
    const { meta, stream } = this.storage.read(req.user!.orgId, req.params.id!);
    res.setHeader('Content-Type', meta.mime);
    res.setHeader('Content-Length', String(meta.size));
    if (meta.originalName) res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(meta.originalName)}`);
    stream.pipe(res);
  };

  remove = (req: Request, res: Response) => {
    this.storage.remove(req.user!.orgId, req.params.id!);
    res.status(204).end();
  };
}
