import { Request, Response, NextFunction } from 'express';
import { insuranceService } from './insurance.service';

export class InsuranceController {
  // Social Insurance
  async getSocialInsurance(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await insuranceService.findSocialInsurance(req.query);
      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      return next(err);
    }
  }

  async getInsuranceStats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await insuranceService.getInsuranceStats();
      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      return next(err);
    }
  }

  async importSocialInsurance(req: Request, res: Response, next: NextFunction) {
    try {
      const records = req.body.records || req.body;
      if (!Array.isArray(records)) {
        return res.status(400).json({
          success: false,
          message: 'Expected records array in request body',
        });
      }
      const result = await insuranceService.importSocialInsurance(records);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  // Missing Documents
  async getMissingDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await insuranceService.findMissingDocuments(req.query);
      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      return next(err);
    }
  }

  async toggleMissingDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { documentType, status } = req.body;
      if (!documentType) {
        return res.status(400).json({
          success: false,
          message: 'documentType is required (qualificationCert, birthCert, idCard, contract)',
        });
      }

      const data = await insuranceService.toggleMissingDocument(id, documentType, status);
      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Missing document record not found',
        });
      }

      return res.json({
        success: true,
        data,
        message: `Document ${documentType} updated successfully`,
      });
    } catch (err) {
      return next(err);
    }
  }

  async importMissingDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const records = req.body.records || req.body;
      if (!Array.isArray(records)) {
        return res.status(400).json({
          success: false,
          message: 'Expected records array in request body',
        });
      }
      const result = await insuranceService.importMissingDocuments(records);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async deleteSocial(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const success = await insuranceService.deleteSocial(id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Social insurance record not found' });
      }
      return res.json({ success: true, message: 'Social insurance record deleted' });
    } catch (err) {
      return next(err);
    }
  }

  async bulkDeleteSocial(req: Request, res: Response, next: NextFunction) {
    try {
      const ids = req.body.ids;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ success: false, message: 'Expected ids array in request body' });
      }
      const count = await insuranceService.bulkDeleteSocial(ids);
      return res.json({ success: true, message: `${count} social insurance records deleted`, count });
    } catch (err) {
      return next(err);
    }
  }

  async deleteAllSocial(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await insuranceService.deleteAllSocial();
      return res.json({ success: true, message: 'All social insurance records deleted', count });
    } catch (err) {
      return next(err);
    }
  }

  async deleteMissingDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const success = await insuranceService.deleteMissingDoc(id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Missing document record not found' });
      }
      return res.json({ success: true, message: 'Missing document record deleted' });
    } catch (err) {
      return next(err);
    }
  }

  async bulkDeleteMissingDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const ids = req.body.ids;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ success: false, message: 'Expected ids array in request body' });
      }
      const count = await insuranceService.bulkDeleteMissingDocs(ids);
      return res.json({ success: true, message: `${count} missing document records deleted`, count });
    } catch (err) {
      return next(err);
    }
  }

  async deleteAllMissingDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await insuranceService.deleteAllMissingDocs();
      return res.json({ success: true, message: 'All missing document records deleted', count });
    } catch (err) {
      return next(err);
    }
  }
}

export const insuranceController = new InsuranceController();
