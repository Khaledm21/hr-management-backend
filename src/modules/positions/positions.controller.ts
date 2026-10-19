import { Request, Response, NextFunction } from 'express';
import { positionsService } from './positions.service';

export class PositionsController {
  async getPositions(req: Request, res: Response, next: NextFunction) {
    try {
      const { departmentId } = req.query;
      const data = await positionsService.findAll(departmentId as string);
      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      return next(err);
    }
  }

  async getPositionById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await positionsService.findById(id);
      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Position not found',
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

  async createPosition(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await positionsService.create(req.body);
      return res.status(201).json({
        success: true,
        data,
        message: 'Position created successfully',
      });
    } catch (err) {
      return next(err);
    }
  }

  async updatePosition(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await positionsService.update(id, req.body);
      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Position not found',
        });
      }
      return res.json({
        success: true,
        data,
        message: 'Position updated successfully',
      });
    } catch (err) {
      return next(err);
    }
  }

  async deletePosition(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const success = await positionsService.delete(id);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Position not found',
        });
      }
      return res.json({
        success: true,
        message: 'Position deleted successfully',
      });
    } catch (err) {
      return next(err);
    }
  }
}

export const positionsController = new PositionsController();
