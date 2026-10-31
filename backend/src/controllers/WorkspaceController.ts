import type { Request, Response } from 'express';
import { WorkspaceService } from '../services/WorkspaceService.js';
import { workspaceSchema } from './schemas.js';

export class WorkspaceController {
  constructor(private readonly service: WorkspaceService) {}

  get = (req: Request, res: Response) => {
    res.json(this.service.get(req.user!.orgId));
  };

  save = (req: Request, res: Response) => {
    res.json(this.service.save(req.user!, workspaceSchema.parse(req.body) as any));
  };
}
