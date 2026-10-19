import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';

export class DashboardController {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getStats();
      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      return next(err);
    }
  }
}

export const dashboardController = new DashboardController();
