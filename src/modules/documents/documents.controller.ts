import { Request, Response, NextFunction } from 'express';
import { documentsService } from './documents.service';

export class DocumentsController {
  async getDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await documentsService.findAll(req.query);
      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      return next(err);
    }
  }

  async getDocumentById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await documentsService.findById(id);
      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Document not found',
        });
      }
      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      return next(err);
    }
  }

  async createDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await documentsService.create(req.body, req.file);
      return res.status(201).json({
        success: true,
        data,
        message: 'Document record created successfully',
      });
    } catch (err) {
      return next(err);
    }
  }

  async verifyDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { notes, verifiedBy } = req.body;
      const data = await documentsService.verify(id, notes, verifiedBy);
      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Document not found',
        });
      }
      return res.json({
        success: true,
        data,
        message: 'Document verified successfully',
      });
    } catch (err) {
      return next(err);
    }
  }

  async rejectDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { rejectionReason } = req.body;
      if (!rejectionReason) {
        return res.status(400).json({
          success: false,
          message: 'rejectionReason is required to reject a document',
        });
      }
      const data = await documentsService.reject(id, rejectionReason);
      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Document not found',
        });
      }
      return res.json({
        success: true,
        data,
        message: 'Document marked as rejected',
      });
    } catch (err) {
      return next(err);
    }
  }

  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const success = await documentsService.delete(id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }
      return res.json({ success: true, message: 'Document deleted successfully' });
    } catch (err) {
      return next(err);
    }
  }

  async bulkDeleteDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const ids = req.body.ids;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ success: false, message: 'Expected ids array in request body' });
      }
      const count = await documentsService.bulkDelete(ids);
      return res.json({ success: true, message: `${count} documents deleted successfully`, count });
    } catch (err) {
      return next(err);
    }
  }

  async deleteAllDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await documentsService.deleteAll();
      return res.json({ success: true, message: 'All documents deleted successfully', count });
    } catch (err) {
      return next(err);
    }
  }
}

export const documentsController = new DocumentsController();
