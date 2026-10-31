import type { Request, Response } from 'express';
import { ReportService } from '../services/ReportService.js';

export class ReportController {
  constructor(private readonly reports: ReportService) {}

  summary = (req: Request, res: Response) => {
    res.json(this.reports.summary(req.user!.orgId));
  };
}
