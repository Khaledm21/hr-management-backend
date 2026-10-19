import { Request, Response, NextFunction } from 'express';
import { driverPayoutsService } from './driver-payouts.service';

export class DriverPayoutsController {
  // --- SUMMARIES ---

  async getSummaries(req: Request, res: Response, next: NextFunction) {
    try {
      const summaries = await driverPayoutsService.getSummaries();
      return res.json({
        success: true,
        data: summaries,
        total: summaries.length,
      });
    } catch (err) {
      return next(err);
    }
  }

  async getSummaryByPeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const weekPeriod = req.params.weekPeriod as string;
      const summary = await driverPayoutsService.getSummary(weekPeriod);
      return res.json({
        success: true,
        data: summary,
      });
    } catch (err) {
      return next(err);
    }
  }

  async createSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await driverPayoutsService.createSummary(req.body);
      return res.status(201).json({
        success: true,
        data: summary,
        message: 'تم إنشاء دورة الأسبوع بنجاح',
      });
    } catch (err) {
      return next(err);
    }
  }

  async updateSummaryStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const weekPeriod = req.params.weekPeriod as string;
      const summary = await driverPayoutsService.updateSummaryStatus(weekPeriod, req.body);
      return res.json({
        success: true,
        data: summary,
        message: `تم ${summary.status === 'locked' ? 'إغلاق وقفل' : 'فتح'} الأسبوع بنجاح`,
      });
    } catch (err) {
      return next(err);
    }
  }

  // --- TRANSACTIONS ---

  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const transactions = await driverPayoutsService.getTransactions(req.query);
      return res.json({
        success: true,
        data: transactions,
        total: transactions.length,
      });
    } catch (err) {
      return next(err);
    }
  }

  async createTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const transaction = await driverPayoutsService.createTransaction(req.body);
      return res.status(201).json({
        success: true,
        data: transaction,
        message: 'تم إضافة حركة القبض وتحديث إجماليات الأسبوع بنجاح',
      });
    } catch (err) {
      return next(err);
    }
  }

  async updateTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const transaction = await driverPayoutsService.updateTransaction(id, req.body);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'الحركة غير موجودة (Transaction not found)',
        });
      }
      return res.json({
        success: true,
        data: transaction,
        message: 'تم تعديل حركة القبض وتحديث إجماليات الأسبوع بنجاح',
      });
    } catch (err) {
      return next(err);
    }
  }

  async deleteTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const id = (req.params.id as string)?.trim();
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'معرف دفعة القبض مطلوب (Transaction ID is required)',
        });
      }

      const result = await driverPayoutsService.deleteTransaction(id);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'المعاملة غير موجودة',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'تم حذف دفعة القبض بنجاح',
        data: {
          id: result.id,
          weekPeriod: result.weekPeriod,
        },
      });
    } catch (error: any) {
      console.error('Error deleting driver payout transaction:', error);
      return res.status(500).json({
        success: false,
        message: 'فشل حذف دفعة القبض',
        error: error.message,
      });
    }
  }

  // --- MATRIX VIEW ---

  async getWeeklyMatrix(req: Request, res: Response, next: NextFunction) {
    try {
      const weekPeriod = req.params.weekPeriod as string;
      const matrix = await driverPayoutsService.getWeeklyMatrix(weekPeriod);
      return res.json({
        success: true,
        data: matrix,
        ...matrix,
      });
    } catch (err) {
      return next(err);
    }
  }

  // --- BATCH IMPORT ---

  async batchImport(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await driverPayoutsService.batchImport(req.body);
      return res.status(201).json({
        success: true,
        data: result,
        importedDriversCount: result.importedDriversCount,
        importedTransactionsCount: result.importedTransactionsCount,
        message: 'تم استيراد بيانات السائقين والعمليات بنجاح',
      });
    } catch (err) {
      return next(err);
    }
  }
}

export const driverPayoutsController = new DriverPayoutsController();
