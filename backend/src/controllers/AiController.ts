import type { Request, Response } from 'express';
import { AiService } from '../services/AiService.js';
import { AuditService } from '../services/AuditService.js';
import { aiSchema } from './schemas.js';

export class AiController {
  constructor(private readonly ai: AiService, private readonly audit: AuditService) {}

  message = async (req: Request, res: Response) => {
    const body = aiSchema.parse(req.body);
    const data: any = await this.ai.message(body as any);
    this.audit.record(req.user!.orgId, req.user!.id, 'ai.message', { usage: data?.usage });
    res.json(data);
  };
}
